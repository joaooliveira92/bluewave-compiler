**Type:** implementation
**Status:** open
**Blocked by:** INC-1, INC-2, INC-3, INC-4, INC-5, INC-6, INC-7
**Frontier:** yes

# INC-8: Records + ordering + reason codes (§§29-31)

## Deliverable

- `CarrierOperationRecord` — immutable record per §29: battle minute/substep, carrier/squadron/aircraft ids, capacity units, spot inputs/result, jet predicates, deck state+contention, timing/rate, weather/wind, hazard, inventory, formula/content/ruleset/RNG versions, record hash
- Canonical ordering per §30: carriers by id, emergency first, class priority (§12), strikes by launch time+strike id, squadrons by id, aircraft by model+aircraft id, catapults/lifts by equipment id, hazard checks by causal event+aircraft id, inventory by item+transaction id
- All 21 §31 reason codes shipped, set-equality guard
- `NO_DEFERRED_REASON_CODES` marker (all codes reachable within D-2 scope — no deferred markers needed)
- Test: reason-code set-equality (all 21 §31 codes present, no extras, disjoint from other modules)
- `ShipId` → `CarrierOperationRecord[]` per-minute records

## Acceptance criteria

AC-31 (records), AC-32 (ordering), AC-33 (reason codes).