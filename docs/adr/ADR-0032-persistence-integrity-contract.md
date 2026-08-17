# ADR-0032: Persistence Save-Integrity, Hash Contract, and Atomicity

## Status

Accepted 2026-08-16

## Context

The `@bluewave/persistence` package had a solid save/load foundation but shipped
several correctness, integrity, and security defects recorded in
`packages/persistence/TODO.md` (a code-review diagnosis):

- The signature file (`campaign.sig.json`) was written but **never read or
  validated** during load, so it could be modified without affecting validation.
- `metadata.snapshotHash` actually contained the campaign id.
- `loadById()` used the caller-supplied save id directly in a filesystem path,
  allowing directory traversal.
- Saves were published by moving three files individually, so a crash between
  the moves left a partial save directory.
- Cancellation rollback could walk the pointer back more than one save.
- Compatibility was checked only after fully materializing the save.
- Parsed save data was trusted through TS casts with no runtime validation.
- The pointer + recovery dropped/derived predecessor chain information
  inconsistently.

## Decision

### 1. Hash and signature contract (`campaign.sig.json`)

`SigFile` carries two hashes with distinct, documented meanings:

- `serializedHash`: `sha256` of the exact on-disk `campaign.json` bytes.
- `stateHash`: the *semantic* hash of the reconstituted in-memory state —
  identical to the campaign compiler's `rawHash`.

`metadata.contentArtifactHash` is `serializedHash` (the hash of the serialized
artifact, matching its name). `metadata.snapshotHash` is a genuine
`sha256(canonicalSerialize(storableSnapshot))`, not the campaign id.

Load validates, in order: JSON parse → minimal header schema → compatibility
version → full structural schema → reconstituted semantic `rawHash` → signature
file (`serializedHash` vs on-disk bytes, `stateHash` vs `rawHash`, and the
signature compatibility version vs the snapshot's).

A save whose `campaign.sig.json` is **absent** is treated as a legacy save (one
written before the signature existed, or a turn-zero campaign): it still loads,
but emits a `PERSISTENCE_UNSIGNED_SAVE` *warning* rather than being accepted
silently, because the independently-written tamper artifact is missing. A
signature file that is *present but invalid* (unparseable, or mismatching any of
the three checks) is still a hard corruption error. New saves always write a
signature, so this carve-out only grandfathers pre-existing data.

Note on scope: because signature *deletion* is indistinguishable from a true
legacy save, the independent-tamper guarantee (catching a modified body whose
in-file hashes were recomputed) holds only for a save that still **carries** a
signature. A save whose signature was deleted degrades to the legacy path
(loaded with a warning, integrity enforced only by the in-file `rawHash` +
envelope). This is the deliberate price of not breaking pre-existing saves, and
is accepted for the same reason legacy saves are accepted.

### 2. Save-id validation + path containment

The save id is an opaque `<epochMs>-<uuid>`. `loadById` validates it against a
fixed pattern and re-confirms the resolved path stays within `saveDir` before
any filesystem access. This is defense-in-depth: Zod at the IPC boundary is
recommended, and the persistence layer re-checks internally.

### 3. Whole-directory atomic publication

A save is fully written inside a sibling `.<saveId>` staging directory, then
published with a single `renameSync(stagingDir, saveDir/activeSaveId)`. The
staging and final directories share `saveDir` as parent, so the rename stays on
one filesystem. The pointer is updated last. No save directory can exist without
a complete, valid `campaign.json`, `campaign.sig.json`, and `metadata.json`.

### 4. Cancellation semantics

- A save aborted after staging but before publication deletes the staging dir.
- A save aborted after publication but before the pointer update deletes the
  (not-yet-active) save directory and leaves the pointer untouched.
- The pointer is never rolled back by cancellation, because it is only advanced
  after the save is fully committed.
- Cancellation surfaces a real `AbortError` (`error.name === "AbortError"`), not
  `new Error("AbortError")`. `save()` throws; `load()` adds a diagnostic and
  returns `null` (deliberate asymmetry, covered by tests).

### 5. Two-stage load / runtime schema validation

Load first validates a minimal header (`snapshot.compatibilityVersion`) and
runs the compatibility check **before** materializing the version-specific
schema. Structurally-obsolete saves therefore yield the stable
`PERSISTENCE_COMPATIBILITY_MISMATCH` diagnostic rather than being mislabeled as
corruption. The accepted version's body is then validated against a Zod
`StorableCampaignStateSchema` that enforces shape (containers are JSON records,
types of top-level/container fields). Deep value-fidelity is enforced by the
`rawHash` + envelope verification, which a shape-valid but semantically-changed
body cannot pass.

### 6. Predecessor preservation

Each save's `metadata.previousSaveId` records the save id that was active when
the save was created (read once at the start of `save()`), so the pointer and the
save agree on the chain. `RecoveryManager.revert` reconstructs the restored
pointer's predecessor from the recovered save's metadata rather than dropping
it. The pointer schema is shared and Zod-validated in one place
(`src/schemas.ts`), and recovery stores `recoveredAt` on the central schema.

### 7. Concurrency policy

The persistence primitives are synchronous and designed for a single-owner
process (the Electron main thread's single command/IPC queue). Because a
synchronous `save()` cannot interleave with another synchronous `save()` in one
thread, the per-directory `readPointer → write → rename → updatePointer`
sequence does not race within a process. Cross-process writers are out of
contract: any multi-process owner must serialize saves behind a single queue or
filesystem lock. This is documented rather than silently supported.

## Consequences

- Signature tampering, serialized-content tampering, save-id traversal, and
  partially-published saves are all rejected on load.
- Legacy saves lacking a signature load with a validation warning; anything that
  *has* a signature must satisfy every signature check or it is rejected.
- Metadata hashes now mean what their names say; the semantic/serialized hash
  distinction is explicit and tested.
- Compatibility mismatches are diagnosed stably regardless of schema evolution.
- Doing nothing is closed: a new `src/schemas.ts` file is the single authority
  for pointer/metadata/sig/header validation, so schema changes are localized.
- Future deep schema work can deepen `StorableCampaignStateSchema` without
  changing load's control flow.