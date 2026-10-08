**Type:** task
**Status:** resolved

State model design resolved:

- **Location**: `NationState.carrierOperations` as `Record<ShipId, CarrierOperationsState>` — new field following `NationState.submarine` pattern.
- **CarrierOperationsState**: per §1. Indexed by `shipId` (stable string id). Flat record, not a Map (serialization determinism).
- **D-1 references**: `CarrierOperationsState.assignedAirGroup` contains `squadronId[]` (refs D-1 squadrons). Aircraft model compatibility referenced by `modelId`. Carrier basing class uses D-1's `CARRIER_BASED` basing class. D-2 imports model types, not D-1 state.
- **15 contracts**: per spec §1.7. All `*_v1` named, fail-closed validate guards.
- **Invariants**:
  - occupiedCapacity + assignedCapacity ≤ physicalCapacity (§3)
  - aircraft count per state sum = total assigned aircraft (§1)
  - deck-cycle state transitions valid per §11 state machine
  - no duplicate shipId in carrierOperations record
  - jet capability consistent with displacement/catapult/tech predicates (§8-10)
  - spot value ≥ 0 and ≤ compiledAircraftCapacity (§6-7)