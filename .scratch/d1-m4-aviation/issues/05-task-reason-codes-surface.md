## Question

Which DESIGN-43 §40 reason codes ship in D-1 vs deferred?

§40 lists 21 required reason codes. Need to decide:
- Which reason codes are active in D-1 (projected: INVALID_AIRCRAFT_MODEL_DEFINITION, INVALID_AIRCRAFT_STATE, AIRCRAFT_DEVELOPMENT_ROLE_INVALID, AIRCRAFT_DEVELOPMENT_TRAITS_NOT_DISTINCT, AIRCRAFT_PROPOSAL_ALREADY_ACTIVE, AIRCRAFT_DEVELOPMENT_PAYMENT_INSUFFICIENT, AIRCRAFT_PRIVATE_VENTURE_INELIGIBLE, AIRCRAFT_PRIVATE_PROPOSAL_EXPIRED, AIRCRAFT_INVENTORY_INSUFFICIENT, SQUADRON_AUTO_EQUIP_UNAVAILABLE, SQUADRON_REEQUIPMENT_INELIGIBLE, SQUADRON_EXPANSION_INELIGIBLE, AIRCRAFT_BASING_CAPACITY_INSUFFICIENT, DAMAGED_AIRCRAFT_DISPOSITION_REQUIRED, AIRCRAFT_STATE_INVARIANT_FAILED — ~15 of 21).
- Which are deferred (mission-role/tactical codes: AIRCRAFT_MISSION_ROLE_INELIGIBLE, AIRCRAFT_MISSION_TECHNOLOGY_UNAVAILABLE, FLOATPLANE_LAUNCH_REQUIRES_STOPPED_SHIP, AIRSHIP_WEATHER_PROHIBITS_OPERATION, JET_CARRIER_INCOMPATIBLE, HELICOPTER_BASING_INCOMPATIBLE — ~6 of 21).
- How deferred codes are represented (marker constant? excluded from set-equality guard?).
- What additional D-1-specific reason codes are needed beyond §40's list?
- Set-equality test pattern (mirror C-sprint approach: one test per code shipped, one marker per deferred, disjointness proof).

Produce a decision: exact code list, marker strategy, and set-equality test plan.

## Type

task