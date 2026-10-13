# ADR-0019 (B-2): Authoritative Contact Shape — TacticalContact Unification

## Status

Accepted

## Context

B-1's `TacticalBattleState.contacts` carried a minimal `BattleContact` projection
(`contactId`, `targetId`, `confidenceBp`). B-2 (DESIGN-38 movement/spotting/contact
subset) introduces a contact **lifecycle** (create/update/age/merge over minutes),
**spotting resolution** (step 8 emits contact **tracks** for detected true assets),
and **contact-constrained targeting** (§19 requires estimated identity, position,
course, speed, confidence, observation time, source, and uncertainty). A B-1
four-field projection cannot represent a DESIGN-38 `ContactTrack`. The B-2 spec
INC-3 requires resolving this seam: *extend `BattleContact` to match `ContactTrack`
or unify — recorded in an ADR*.

## Decision

Unify the authoritative tactical contact on a single rich `TacticalContact` that
**extends** the existing `ContactTrack`:

- `TacticalContact extends ContactTrack` carries the DESIGN-38 §19 surface:
  `contactId`, `estimatedIdentity`, `position`, `course`, `speed`, `confidence`,
  `observationTime`, `source`, `uncertainty` — plus B-2 lifecycle/spotting fields:
  `assetId`, `sideId`, `battleId`, `lastUpdateMinute`, `stale`, `sources`.
- `TacticalBattleState.contacts` becomes `TacticalContact[]`.
- The B-1 `BattleContact` interface is **kept as a deprecated minimal projection**
  for source compatibility; it is not used by B-2 authority and will be dropped at
  the B-6 integration boundary.
- `resolveLegalTarget` reuses the existing `validateTargetOrder` guard so a target
  order referencing a hidden true asset fails with `TACTICAL_FOG_OF_WAR_VIOLATION`
  (no new reason code — ADR-0018 subset).

This avoids a parallel `ContactTrack`-vs-`BattleContact` dual type and keeps
spotting output (`SpottingContact`) in the same shape family as the lifecycle state.

## Consequences

- The combat public type surface changes `contacts` from `BattleContact[]` to
  `TacticalContact[]`; no external package constructs `TacticalBattleState`, so
  B-1 consumers (phase-engine via `BattleResolver`/`generateBattles`) are unaffected.
- No snapshot schema, phase, or serialization change; goldens remain 9/9 (AC-15).
- `BattleContact` is deprecated and removed at B-6.

## Related requirements

- DESIGN-38 §8, §19, §20 (subset); ADR-0018 (B-2 scope/integration boundary).

## Related ADRs

- ADR-0018 (B-2 scope), ADR-0017 (auto-resolution scope).