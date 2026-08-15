# ADR-0024: Save Integrity Blind Spot in `canonicalSerialize` (Maps Collapse to `{}`) — recorded + deferred

## Status

Accepted 2026-08-15 (records + defers; decision belongs to the persistence
track, see ticket in `.scratch/desktop-mvp/issues/17-*`)

## Context

The desktop-mvp continuity ticket (`.scratch/desktop-mvp/issues/16-save-load-continuity.md`)
proved save/load, verify, replay, and recover against real
`content/production/1880` saves. During review, an integrity blind spot was
found and empirically reproduced in `packages/deterministic` +
`packages/persistence`:

- `canonicalSerialize` (`packages/deterministic/src/index.ts:11-38`),
  which computes the snapshot's `rawHash` and the envelope's `bodyHash`,
  collapses runtime `Map`s to `{}` (via `stableKeySort` → `Object.keys(map)`
  = `[]`). The majority of authoritative state is Map-backed
  (`nations`, `designs`, `designFamilies`, `research.activeCandidates`),
  so the load/verify hash covers only the Record-form remainder
  (`campaignId`, `turnNumber`, `world`, `wars`, …).
- Empirically: a treasury flip inside `campaign.json`'s `nations` Map loads
  clean — "Save data hash mismatch" never fires; tampering a hash-covered
  top-level field does fail.
- Consequences: `verifyCampaign` can report `valid:true` on a tampered
  treasury; `recoverCampaign` won't trigger recovery for the most likely
  corruption targets. `replayCampaign` does NOT inherit the blind spot — it
  hashes the storable (Record-form) snapshot subset, so it catches Map
  tampering load/verify cannot. Replay is therefore currently the strongest
  integrity check.

Also recorded (F7, low): the `session.json` sidecar
(`apps/desktop/src/main/campaignSessionMetadata.ts`) carries
`campaignSeed` — the deterministic root of every future month's RNG — outside
the integrity envelope, unauthenticated. A tampered seed is accepted silently.

## Decision

1. **Defer the serializer-hash fix to the persistence track, never silently
   drop it.** Fixing means hashing over the storable (Record-form) snapshot
   (`toStorableSnapshot`) or serializing Maps canonically (sorted entries).
   Both change every persisted hash and require a versioned serializer bump
   + explicit migration/refusal per the ENGINEERING-CONTRACT persistence
   rule. That is a canonical, migration-affected change belonging in its own
   persistence sprint with acceptance evidence, not bolted onto the
   desktop-mvp effort. Tracked as a deferred ticket (see Related tickets).
2. **Replay remains the strong integrity check for this MVP.** The desktop
   MVP ships verify/recover as implemented (they inherit the SaveStore
   detector), with replay as the authoritative cross-check, and the
   limitation documented in the Campaign File UI's verify/recover copy and
   in the continuity tests' fixture doc comment.
3. **Session-seed provenance is a follow-up hardening, not a blocker.** While
   the seeded RNG root is plaintext-tamperable, there is no attacker model
   in this internal playtest slice and replay mismatch on a wrong seed is
   observable. Folding `session.json` into the package hash (which the D1
   fix would enable) is the eventual resolution; seed-provenance assert
   during replay is a stopgap recorded for the same follow-up.

## Consequences

- Desktop MVP continuity claims are scoped honestly: load/verify/recover
  are real but hash the Record remainder; replay is the strong detector.
- No hashes, goldens, or serializer behavior change now.
- The persistence effort gets a precisely-scoped, test-backed ticket rather
  than an undocumented gap.

## Related requirements

- ENGINEERING-CONTRACT: "Persistence and compatibility" (migration-or-refusal,
  versioned serializer), "Security" (saves as trust class), "Hashing"
  (SHA-256 domain-separated envelopes).

## Related tickets

- `.scratch/desktop-mvp/issues/17-serializer-hash-integrity.md` (deferred
  follow-up).

## Related ADRs

- ADR-0007 (cross-process determinism), ADR-0023 (construction lifecycle +
  projected-cost formula), ADR-0021 (desktop-mvp bridge boundary).