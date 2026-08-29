**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes

# INC-1: Carrier state model + classification + capacity (§§1-5)

## Deliverable

Implement the carrier operations state model in `@bluewave/combat/src/carrier-operations/`:

- `CarrierOperationsState` model (§1) — all 30 §1 fields as branded integer quantities
- `carrierClassification_v1` — CVL 4-34, CV 35+, below 4 = no carrier class (§2)
- `capacityUnits_v1` — scale: 2 per ordinary slot, piston=2, light jet=3, heavy jet=3, helo=2 (§3)
- `physicalCarrierCapacityUnits = compiledAircraftCapacity * 2` (§3)
- Integer capacity check: `occupied + assigned <= physicalCapacity` (§3-4)
- `deterministicAssignmentOrder_v1` — 8-step priority: CAP → permanent → returning → strike → search → replacement → ferry → ascending ids (§4)
- `CARRIER_CAPACITY_EXCEEDED` when capacity exceeded, no partial assignment (§4)
- `OversizedCarrierPolicy_v1` (§5) — threshold=100, efficiency 9000bp, maintenance 12500bp, coordination 9500bp, hazard 11000bp. Exactly 100 = no penalty
- `*_v1` contracts for state, assignment, oversized policy
- State invariant: `AIRCRAFT_STATE_INVARIANT_FAILED` → `CARRIER_OPERATIONS_INVARIANT_FAILED`
- Module scaffold: `packages/combat/src/carrier-operations/model.ts`, `constants.ts`, `contracts.ts`

## Acceptance criteria

AC-1 (complete carrier state), AC-2 (classification bounds), AC-3 (capacity units), AC-4 (integer check), AC-5 (deterministic assignment), AC-6 (oversized policy).