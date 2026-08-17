# ADR-0034: Engine-State Hardening — Snapshot Hash-Chain and Tactical Checkpoint Decisions

## Status

Accepted 2026-08-16

## Context

The `engine-state-hardening` effort (tickets 01–06) hardens the month pipeline,
persistence integrity, and replay. Ticket 04 is a **decision** ticket raising two
related state-architecture questions with no code landing until both are decided
and recorded:

1. **State hash chain.** Should `CampaignSnapshot` carry its own
   `stateHash`/`previousStateHash` threaded through the month pipeline,
   persistence serialization, and replay verification — turning the snapshot
   into an explicit hash chain rather than relying on per-save wrapping
   (envelope + raw hash) plus external replay to establish integrity?
2. **Tactical checkpoint persistence.** The campaign snapshot stores only a
   battle's manifest and final result; the minute-by-minute tactical state is
   transient and re-derivable from manifest + seed. REL-1 §22 requires "replay
   at strategic + tactical checkpoints". Should mid-battle tactical state get a
   persistence path, or is replaying from a campaign save alone acceptable?

The decision is grounded in the current seams and the normative design docs
(DESIGN-52 save/load/replay/persistence, ADR-0003 serializer/hash, ADR-0006
campaign architecture, ADR-0007 determinism/goldens, ADR-0016 manifest seed,
ADR-0025/0026/0027 weather + battle auto-resolution wiring, ADR-0032
persistence-integrity contract).

### Current integrity story (the baseline both questions are asked against)

`CampaignState = { snapshot, envelope, rawHash }` where:

- `envelope` is a `CanonicalEnvelope` whose `bodyHash` is a domain-separated
  SHA-256 over the canonical snapshot; `verifyEnvelope` recomputes it on load
  (ADR-0003). Every snapshot is thereby **independently authenticated**.
- `rawHash` is `sha256(canonicalSerialize({ snapshot, envelope }))` with
  `rawHash` itself excluded from its input.
- Persistence additionally writes a signature file (`campaign.sig.json`) with
  `serializedHash` (the on-disk bytes) and `stateHash` (== `rawHash`), and
  `metadata.previousSaveId` records the save that was active when this save was
  written — the **save-level predecessor chain** (ADR-0032).
- `ReplayVerifier` (phase-engine) re-executes `MonthExecutor` over a predecessor
  save's snapshot + the recorded command ledger and compares snapshot/ledger
  hashes (strategic replay, DESIGN-52 §29–30).

So chain linkage already exists at two levels: snapshot-content authenticity
(via `envelope` + `rawHash` + signature) and save linkage (via `previousSaveId`).
The question is whether a third, snapshot-internal, cryptographic chain is worth
adding.

## Decision

### 1. Do NOT add a snapshot-internal hash chain (`stateHash`/`previousStateHash` on `CampaignSnapshot`)

`CampaignSnapshot` does **not** gain `stateHash`/`previousStateHash` fields. The
integrity mechanism stays the current per-save wrapping (envelope + rawHash +
signature) plus the existing save-level predecessor chain (`previousSaveId`) and
external replay verification. Rationale:

- **The integrity requirement is already met.** Each save's content is
  independently authenticated by the envelope `bodyHash` + `rawHash` and, on
  disk, by the signature file (`serializedHash` over the exact bytes, `stateHash`
  over the reconstituted state — ADR-0032). DESIGN-52 §22's "snapshot and
  aggregate hash consistency" load invariant is satisfied by recomputing the
  envelope/rawHash on load.
- **A snapshot-internal chain adds no security for the threat model that
  matters.** An attacker able to rewrite `campaign.json` is also able to rewrite
  its in-file `stateHash`/`previousStateHash` (they are fields of the same
  serialized body); the same holds for the envelope and rawHash, which is why the
  independent on-disk signature file exists (ADR-0032). A full-file attacker can
  recompute every in-file field, so an embedded chain does not close the
  tamper gap the signature file already addresses. Its only distinct value —
  detecting accidental save reordering/missing-linkage — is already covered by
  the `previousSaveId` save chain and by replay's first-divergence stop
  (DESIGN-52 §28/§30/§31).
- **Replay-checkpoint chains are not snapshot chains.** DESIGN-52 §31 allows
  *optional* replay checkpoints whose "preceding replay-chain hash" is verified
  by chaining from the replay initial state or a prior trusted checkpoint. That
  is an acceleration cache built during a replay run; it is derived, not an
  authoritative field on the persisted campaign snapshot, and it does not
  require the snapshot to carry the chain.
- **The surface cost is real and unearned.** Adding the field would change the
  snapshot shape (triggering golden regeneration under ADR-0007), require a
  self-referential hash (`stateHash` excluded from its own hash input, the
  ADR-0016 pre-seed-manifest pattern) threaded through compile → every month
  phase → `to/fromStorableSnapshot` → replay, and force a compatibility
  re-assessment (ENGINEERING-CONTRACT "canonical artifact changes require old and
  new hashes, authoritative cause, version impact, and migration assessment") —
  for a property already provided by the envelope/rawHash/signature + save chain
  + replay.
- **Precedent in-repo.** Per-aggregate hashes exist where they carry cross-domain
  meaning (`CampaignWeatherState.stateHash`, `ShipDamageState.stateHash`,
  `BattleManifest.sourceStateHashes`), but the top-level `CampaignSnapshot` is
  deliberately the whole-turn container wrapped by the `CampaignState` envelope —
  the envelope is the snapshot's authenticator, not an in-body field.

### 2. Tactical replay is re-derivation from manifest + seed; mid-battle tactical state needs NO persistence path for replay correctness

Replaying a battle is **deterministic re-resolution** from the persisted manifest
+ battle seed; the minute-by-minute tactical state is not an authoritative
persisted aggregate and needs no save path. Rationale:

- **The battle is fully determined by the manifest + seed.** `resolveBattleAuto`
  (ADR-0026) is a pure function of the manifest, the committed strategic weather,
  the campaign seed, and the ruleset/formula/rng version pins — every gunnery
  hit, damage impact, weather progression, and end-condition draw is keyed off
  the battle seed (ADR-0016, ADR-0026 §3/§6). Identical inputs ⇒ identical
  `BattleResolutionResult` and `resultHash` across processes (ADR-0026 §8, proven
  by two-child byte-compare). The stored `BattleInstance.result` +
  `damageReport` is the authoritative outcome committed to the campaign
  (ADR-0027).
- **The transient tactical state is `DERIVED_REBUILDABLE` under DESIGN-52 §5.**
  It has a deterministic rebuild contract (`resolveBattleAuto`), authoritative
  inputs (manifest + seed + committed weather), canonical ordering, and
  reconstruction tests in `@bluewave/combat`. DESIGN-52 §5: "A derived value
  without a deterministic rebuild contract MUST be reclassified as authoritative
  and persisted" — the converse holds: because a rebuild contract exists, it need
  not be persisted.
- **Re-derivation is the DESIGN-52-conformant tactical replay.** DESIGN-52 §27
  `TacticalReplayManifest` is defined as the immutable *initial* battle snapshot +
  manifest + seed + command/event ledger; §28 replays by loading that initial
  state, restoring RNG, resolving minutes, and comparing hashes. Periodic minute
  checkpoints are **optional** acceleration (§27 "optional periodic minute
  checkpoints and hashes"), and §31 trusts a checkpoint only after verifying its
  chain from the replay initial state. There is no requirement to persist the
  mid-battle minute state as the replay source. The §27 MUST (every battle has a
  `TacticalReplayManifest`) is satisfied at re-derivation time: the "immutable
  initial battle snapshot" the replay reconstructs is fully determined by the
  persisted manifest + seed + committed strategic weather, so the §28 replay
  procedure (load initial, restore RNG, resolve, compare) runs from the campaign
  save; only the *materialized* manifest object is deferred with the full
  save-package model (below).
- **Campaign-save-alone replay is acceptable and authoritative.** The final
  `BattleInstance.result` on the campaign snapshot is re-verified by re-running
  `resolveBattleAuto` from the manifest + seed and comparing the recomputed
  outcome against the recorded `BattleInstance.result` — its persisted surface
  `winnerId`/`loserId`, per-side losses, and `damageReport` (ADR-0027). `resultHash`
  is a field of the transient `BattleResolutionResult` (ADR-0026 §8), not a
  persisted field on the snapshot's `BattleInstance`, so the comparison is at the
  semantic outcome level; a hash-level check would require persisting the battle's
  result hash (a follow-on option in ticket 07). This closes REL-1 §22 "replay at
  strategic + tactical checkpoints" at the re-derivation level.

## Consequences

- **No snapshot shape change from either decision** → `golden/hashes.json` is
  **unchanged** (no regeneration under ADR-0007). The golden-impact note for the
  snapshot shape is: *no shape change, goldens byte-identical*.
- Integrity continues to rest on envelope + rawHash + signature (content
  authenticity) and `previousSaveId` + replay (chain linkage and re-derivation).
- Mid-battle tactical state remains transient; the campaign snapshot continues to
  store only a battle's manifest and final result.
- **Deferred (recorded, not dropped):** DESIGN-52's full save-package model —
  battle autosaves at committed tactical-minute boundaries (shipped interval 5,
  §15/§18), RNG manifests (§8/§9), a materialized `TacticalReplayManifest`
  object (§27), and an active-battle snapshot in the save package (§2) — is a
  REL-1 persistence-model concern for crash recovery and package portability,
  not a replay-*correctness* requirement, and is out of scope here.
- **Code follow-on (this decision's actionable output):** a tactical replay
  verification that re-resolves each resolved battle from its manifest + seed
  (via `resolveBattleAuto`) and compares the recomputed outcome against the
  recorded `BattleInstance.result`, closing REL-1 §22's tactical-checkpoint
  replay. Tracked as ticket
  `.scratch/engine-state-hardening/issues/07-tactical-replay-verification.md`.

## Related requirements

DESIGN-52 §§2/5/15/18/22/27–31; DESIGN-38 §32–33; REL-1 §22 (replay at strategic
+ tactical checkpoints); ENGINEERING-CONTRACT (determinism, serialization,
hashing, persistence, canonical-change assessment).

## Related ADRs

ADR-0003 (serializer/hash), ADR-0006 (campaign architecture), ADR-0007
(determinism/goldens), ADR-0016 (manifest seed), ADR-0025 (strategic weather
snapshot), ADR-0026 (battle auto-resolution), ADR-0027 (battle-resolution phase
wiring), ADR-0032 (persistence-integrity contract).
