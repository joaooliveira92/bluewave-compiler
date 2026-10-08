# INC-2: Aircraft State Model

**Frontier: no** (blocked by: INC-1)

## Deliverable

`AircraftNationState` interface, inventory system (flat count per model+condition, 9 states), all sub-types with `*_v1` contracts + validation guards.

## Files

- `packages/combat/src/aircraft/state.ts` — `AircraftNationState`, `AircraftDevelopmentProject`, `AircraftProposal`, `SquadronState`, `BasingSlot`
- `packages/combat/src/aircraft/inventory.ts` — inventory count logic, 9-state enum, transfer predicates
- `packages/combat/src/aircraft/contracts.ts` (extend) — `AircraftDevelopmentProject_v1`, `AircraftProposal_v1`, `SquadronState_v1`, `AircraftInventoryRecord_v1`, `BasingSlot_v1`
- `packages/combat/src/aircraft/index.ts` — module barrel

## Tests

- `aircraft/state.test.ts` — state invariant, contract validation
- `aircraft/inventory.test.ts` — count invariants, state exclusivity, transfer validation

## Acceptance criteria

AC-3 (§3), AC-4 (§3, §13), AC-26 (contracts seed)

## Dependencies

INC-1 (model types)