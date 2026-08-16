# Ticket 02 — Integration Boundary

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary

## Question

How does the torpedo subsystem integrate with the existing `@bluewave/combat`
minute-advance engine without disturbing B-2…B-6 golden hashes or the
`BattleResolver`/`StrengthCalculator` boundary?

## Decision

Torpedoes run as a pure **engine stage** (`resolveTorpedoes`) inside the
minute-advance simulation (`simulation/engine.ts`), after the damage stage
(step 9–10), at a new torpedo substep/priority ladder slot. Mirror the B-3/B-5
pattern exactly:

- Add an optional `torpedo?: TorpedoContext` field to `AdvanceMinuteInput` and a
  matching `torpedoStates`/`torpedoTracks` surface to `MinuteResult`, each with the
  same "**absent → strict no-op**" doc-comment (zero events, byte-identical
  minute hash when the context is not supplied).
- Guard the stage with `if (input.torpedo)`, emit torpedo events via the existing
  `BattleLedger` + `canonicalEventOrder`, and thread `torpedoTracks`/`torpedoStates`
  across minutes exactly like `gunneryStates`/`damageStates` are threaded.
- No phase-engine change; no campaign snapshot schema change; golden hashes
  unchanged (no ADR-0007 regeneration). `resolveBattleAuto` torpedo wiring is
  deferred (same deferral as B-3 gunnery's phase wiring → B-6). `BattleResolver`/
  `StrengthCalculator` unmodified (verified by diff).

## Deferred (recorded)

- `resolveBattleAuto`/phase-pipeline torpedo wiring + campaign persistence (§26) —
  later battle-results slice.
- Flooding per-minute resolution seam (reserved Stage 7) — C-5.

## Rationale / authority

Precedent: B-3 gunnery and B-5 weather are engine stages with strict no-op
contracts that preserved B-2 hashes; B-6 wired phase integration only at the
battle-results boundary. Seam map verified in `packages/combat/src/simulation/engine.ts`
(stage blocks at `engine.ts:205-315`, snapshot/hash at `317-346`, threading at
`416-433`).