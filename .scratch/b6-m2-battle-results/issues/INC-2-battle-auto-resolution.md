- **Type:** task
- **Status:** resolved
- **Blocked by:** INC-1

# INC-2: `resolveBattleAuto` orchestrator in `@bluewave/combat`

## Acceptance criteria (spec AC-3..AC-7, AC-10, AC-13 part)

- Project battle manifest + committed ships (B-1 promotions/divisions) into a
  deterministic `TacticalBattleState`; realism-independent stats; seeded RNG
  derived from manifest `battleSeed` (stream family `battle/battle_id/root`);
  battle weather initialized from the area's committed `StrategicWeatherState`
  (missing → `INVALID_BATTLE_WEATHER_INITIALIZATION`).
- Run `advanceMinutes` (B-2..B-5 stages all wired) minute-by-minute; after each
  fully-resolved minute call `evaluateBattleEnd` (§32 precedence,
  `DEFAULT_MAX_BATTLE_MINUTES` 360, terminating-minute effects included).
- Emit `BattleResolutionResult`: battleEndReason, elapsedMinutes, winnerId,
  loserId, survivors/sunk per side, `damageReport` (per-ship accumulated
  structure+flotation loss), eventLedgerHash, resultHash.
- Fail-closed: missing manifest → `AUTO_RESOLUTION_UNAVAILABLE`; unknown inputs
  produce stable diagnostics. Two-process determinism ×2 (separate child runs).
- Ships `battle_auto_resolution_v1` contract + validate guard; in-slice reason
  codes appended to catalog with a set-equality guard test.

## Tests

`combat/test/battle-resolution/{project,init-weather,auto-resolve,battle-end,
outcome,determinism,contracts}.test.ts`; `combat/test/reason-codes-battle-resolution.test.ts`.

## Blocking notes

Depends on the B-2..B-5 engine stages already shipped by INC-1 (weather wiring)
so the area's committed weather exists. Ship combatants come from the campaign
snapshot via `NationState.fleets[].ships` and `divisions`.