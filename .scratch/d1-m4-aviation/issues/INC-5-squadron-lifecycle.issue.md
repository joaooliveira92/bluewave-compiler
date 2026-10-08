# INC-5: Squadron Lifecycle + Auto-Equip + Re-Equipment + Expansion + Inventory Allocation

**Frontier: no** (blocked by: INC-3)

## Deliverable

Full squadron lifecycle: `SquadronState`, auto-equip eligibility + deterministic selection, re-equipment (2-month duration + experience penalty), expansion (ratio bands + penalties), inventory allocation per DESIGN-43 §35 priority.

## Files

- `packages/combat/src/aircraft/squadron.ts` — squadron state creation, validation
- `packages/combat/src/aircraft/auto-equip.ts` — eligibility predicates (§15), deterministic selection (§16)
- `packages/combat/src/aircraft/reequipment.ts` — command, duration, unavailability, penalty (§17-18)
- `packages/combat/src/aircraft/expansion.ts` — ratio formula, penalty bands (§19)
- `packages/combat/src/aircraft/inventory-allocation.ts` — §35 priority allocation

## Tests

- `aircraft/squadron.test.ts` — state creation, experience 0-100, hash
- `aircraft/auto-equip.test.ts` — eligibility predicates, no creation, no damaged
- `aircraft/auto-equip-selection.test.ts` — ordering, 7500bp threshold, no randomness
- `aircraft/reequipment.test.ts` — duration, unavailability
- `aircraft/reequipment-penalty.test.ts` — -10 base, -5 family, 8000bp × 3mo, clamp
- `aircraft/expansion.test.ts` — ratio formula, bands, same-month aggregation
- `aircraft/inventory-allocation.test.ts` — priority order, no double-allocation

## Acceptance criteria

AC-13 (§14), AC-14 (§15), AC-15 (§16), AC-16 (§17), AC-17 (§18), AC-18 (§19), AC-22 (§35)

## Dependencies

INC-3 (proposal acceptance creates models used by auto-equip)