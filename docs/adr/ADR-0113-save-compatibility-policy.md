# ADR-0113: First-release save-compatibility policy — reject on mismatch

## Status

Accepted (2026-10-11).

## Context

There is no released save format yet, but the persistence contract has already
built the machinery that the first public release will depend on:

- `@bluewave/persistence` `CompatibilityChecker.check(saveVersion, diagnostics)`
  rejects a save whose `snapshot.compatibilityVersion` is not the current
  engine version, emitting the stable `PERSISTENCE_COMPATIBILITY_MISMATCH`
  diagnostic (severity `error`, stage `persistence.load`).
- `SaveStore.loadById` runs that check in **stage 1** of a two-stage load,
  right after decoding only the minimal header (`snapshot.compatibilityVersion`)
  and **before** materializing the version-specific schema. A structurally
  obsolete save therefore gets the stable compatibility diagnostic, not a
  generic corruption error.
- The current constant is `CURRENT_COMPATIBILITY_VERSION = "1.1.0"`; the
  1.0.0 → 1.1.0 bump was the B-6 strategic-weather snapshot change
  (ADR-0025) and the save-integrity/two-stage-load contract is ADR-0032.
- `shipBuildingContentHash` is a separate content identity recorded in the
  committed `month-input.json`, not in the compatibility version.

The release-readiness ticket requires one explicit decision: when a save's
version does not match, reject with a clear, user-facing message, or migrate.

## Decision

### 1. Reject-on-mismatch, on strict version equality

For the first release, compatibility is **strict string equality** against
`CURRENT_COMPATIBILITY_VERSION`. A save whose version differs is **not loaded**.
`CompatibilityChecker.check` returns `false`, `loadById` returns `null`, and the
collector carries exactly one stable diagnostic:

```
code:      PERSISTENCE_COMPATIBILITY_MISMATCH
severity:  error
stage:     persistence.load
message:   Save compatibility version "<save>" does not match current engine version "<current>"
remediation: Use a compatible save file or migrate the save data.
```

No silent continuation with a mismatched shape, and no silent fallback to a
"best effort" parse. Migration remains a **product promise**: the message
advises migrating, but no migration engine ships in the first release.

### 2. The diagnostic is already user-facing

The rejection reaches the player as readable text, without any new UI code:

- `loadCampaign` (`apps/desktop/src/main/commands/continuityCommands.ts`)
  maps `collector.all.map((d) => d.message)` onto the bridge result's
  `diagnostics` when the load fails.
- `useCampaignFiles.openCampaign` (`apps/desktop/src/renderer/screens/campaign-file/hooks/useCampaignFiles.ts`)
  renders `Load failed: <reason> — <diagnostics joined by "; ">`.

So a stale save produces `Load failed: LOAD_FAILED — Save compatibility version
"1.0.0" does not match current engine version "1.1.0"`. This ADR records that
path as the contract and it is guarded by a test in
`apps/desktop/src/main/commands/continuityCommands.test.ts` (a tampered version
must surface the human-readable message through the bridge). No renderer or
bridge change is required.

### 3. `shipBuildingContentHash` — what it identifies and when it fires

`shipBuildingContentHash` (`apps/desktop/src/main/shipBuildingContent.ts`) is
the identity of the **committed ship-building content bytes** the engine was
given, so a replay can tell "the content changed since" from a real divergence.
It is `sha256` over `canonicalSerialize` of an object keyed by relative path,
whose values are the raw UTF-8 bytes of:

- the fixed files: `ship-building/components.yaml`, `ship-building/plants.yaml`,
  `ship-building/hull-forms.yaml`, `ship-building/balance.yaml`,
  `technologies.yaml`;
- **every** `.yaml` under `ship-building/naval-profiles/` (one file per nation);
- `ship-building/reference-designs/<nation>/starters.yaml` and
  `historical.yaml` (one directory per nation, only when the file exists).

The first-class armament files are hashed **separately** (`armamentContentHash`,
ADR-0093 Step 3) and are not part of this hash.

Sensitivity: the hash is order-insensitive across files (the canonical
serializer sorts the path keys), but it is **byte-exact** per file — any change
to a contributing file's bytes (a value, a comment, whitespace/indentation, or
adding/removing a file) changes the hash. A zero-tolerance stance is intended:
the hash answers "is this the same content?", not "is this semantically
equivalent?".

### 4. Content-hash difference vs version mismatch

| Signal | Where checked | Outcome |
| --- | --- | --- |
| `compatibilityVersion` != `CURRENT_COMPATIBILITY_VERSION` | `SaveStore.loadById` stage 1 | **Fatal load rejection** — `null` + `PERSISTENCE_COMPATIBILITY_MISMATCH` |
| committed `shipBuildingContentHash` != current hash | `replayCampaign` | **Non-fatal warning** — `REPLAY_CONTENT_CHANGED`; the revision is reported not reproducible, the save still loads |

The two are deliberately different: content evolving between releases is
expected and must not make a save unloadable; the snapshot *shape* is
authoritative and a mismatch means the engine cannot honestly interpret it.

### 5. Policy after the first public release

The first public release **pins the v1 format**. `CURRENT_COMPATIBILITY_VERSION`
is then a locked release constant, and a future bump is not a silent edit:

1. Every released compatibility version contributes a saved fixture to a
   **per-version fixture corpus** (`packages/persistence/test/`, seeded by
   `save-compatibility-policy.test.ts`); CI loads each fixture on every bump, so
   a change that strands a released save fails loudly.
2. A bump must come with either:
   - a **registered migration** that upgrades the old shape to the new one (with
     a golden round-trip), or
   - a **documented, deliberate rejection** in a new ADR (which released
     versions are no longer supported and why).
3. The locked constant is asserted by a test, so an accidental bump is caught
   before it ships.

### 6. Where future migrations will be registered (seam only; not built)

The seam is the two-stage load already in `packages/persistence/src/store.ts`
(`loadById`) and `packages/persistence/src/compatibility.ts`:

- stage 1 decodes the minimal header (`snapshot.compatibilityVersion`) and runs
  the compatibility check;
- stage 2 validates the accepted version's full schema.

A future migration is a **pure, version-keyed transform applied between stage 1
and stage 2**: a registry in `compatibility.ts` mapping a source
`compatibilityVersion` to a `(raw: unknown) => Result<unknown, MigrationError>`
that returns the *current-version* raw value, after which stage 2 runs
unchanged. The registry stays empty for the first release; this ADR fixes its
location and contract only. No migration engine is built now.

### 7. Tests that prevent accidental hash instability

- `apps/desktop/src/main/shipBuildingContent.test.ts` asserts both content
  hashes are 64-hex and stable across repeated calls, and that the legacy and
  armament hashes differ (shape + stability; a literal hash is never pinned,
  because that would be brittle).
- `packages/persistence/test/save-compatibility-policy.test.ts` (new): a
  round-trip at `CURRENT_COMPATIBILITY_VERSION` (the seed of the per-version
  corpus), rejection of a tampered older version with the stable
  `PERSISTENCE_COMPATIBILITY_MISMATCH` code **and no generic corruption code**,
  and the locked release constant.
- `apps/desktop/src/main/commands/continuityCommands.test.ts` (new case): the
  mismatch message reaches the bridge result readably.

Any future change to the contributing file set or their byte handling must be
paired with the stability guard above; the hash is a persisted content identity
and silently changing it would invalidate every recorded `month-input.json`.

## Alternatives considered

- **Migrate 1.0.0 saves.** Rejected for the first release: no released save
  exists, a 1.0.0 snapshot lacks the start fields and weather collection so its
  shape cannot be reconstructed, and shipping a migration engine before there is
  a format to migrate from is speculative.
- **Load with the mismatch reported as a non-fatal warning.** Rejected: the
  engine cannot interpret a shape it does not know; best-effort parsing risks
  silently corrupting a campaign.
- **Keep it implicit.** Rejected: the ticket requires an explicit decision, and
  the first format bump is exactly when an undocumented reject would strand
  saves.

## Consequences

- A save from a different compatibility version is refused with one stable,
  human-readable diagnostic; the player sees it without new UI work.
- Content changes do not strand saves; they are reported as replay divergence.
- The first release locks `1.1.0`; future bumps require a per-version fixture,
  a registered migration or a documented rejection, and a passing constant
  guard.
- The migration seam is named and fixed, so building it later is additive
  (fill the registry) rather than a redesign of load.
