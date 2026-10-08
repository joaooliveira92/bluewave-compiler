# INC-6: Basing Model + Damaged Disposition

**Frontier: no** (blocked by: INC-2)

## Deliverable

6 basing classes, per-slot capacity tracking, 7 damaged dispositions, cannibalization logic, capacity invariant enforcement.

## Files

- `packages/combat/src/aircraft/basing.ts` — `aircraft_basing_capacities_v1`, capacity check, slot allocation/deallocation
- `packages/combat/src/aircraft/damaged-disposition.ts` — disposition enum, repair/transfer/write-off/cannibalize/capture/loss

## Tests

- `aircraft/basing.test.ts` — class enum, capacity invariant, squadron cap enforcement
- `aircraft/basing-classes.test.ts` — host class support, capacity check
- `aircraft/damaged-disposition.test.ts` — 7 dispositions, cannibalization removes + creates spares, no auto-clear

## Acceptance criteria

AC-19 (§20), AC-20 (§21), AC-21 (§32)

## Dependencies

INC-2 (state types, BasingSlot contract)