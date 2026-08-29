# INC-3: Strike disruption + strike mission state machine

**ACs:** AC-7, AC-8
**Blocked by:** INC-2
**Frontier:** no

## Deliverable

Strike disruption formula and strike tactical state machine with valid transitions. New file: `packages/combat/src/air-combat/strike-state.ts`.

## Acceptance criteria

- AC-7: disruption multiplier `disruptionBp = max(5_000, 10_000 - floor(capEngaging * 1_000 / max(1, strikeAircraft)))`
- AC-8: valid state transitions EN_ROUTE↔ON_TARGET↔ATTACKING↔EGRESSING↔RETURNING. Invalid → `AIR_COMBAT_INVALID_STRIKE_TRANSITION`

## Reason codes

- `AIR_COMBAT_INVALID_STRIKE_TRANSITION`

## Test files

- `packages/combat/test/air-combat/disruption.test.ts`
- `packages/combat/test/air-combat/strike-state-machine.test.ts`