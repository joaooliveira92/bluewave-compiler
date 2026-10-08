**Type:** task
**Status:** resolved

Scope boundary resolved:

- **DESIGN-44 sections IN**: All §§1-31. D-2 covers the full DESIGN-44 carrier operations engine (state, capacity, spot, jet, deck, strikes, maneuver, wind, hazards, night, weather, ordnance, damage, records, ordering, reason codes).
- **DEFERRED to D-3**: CAP/strike MISSION EXECUTION in tactical combat (using D-1 squadrons aboard D-2 carriers). The tactical min-by-min loop integration of carrier aircraft.
- **DEFERRED to D-4**: Anti-air defense.
- **D-1 seam**: D-2 references D-1 aircraft model definitions by `modelId` (for capacity compatibility), basing classes by `className` (for carrier basing eligibility), and squadrons by `squadronId` (for air-group assignment). D-2 does NOT import D-1's state model — it only references model/squadron IDs.
- **Phase stage order**: `resolve_carrier_operations` at order **7.3** (after `resolve_aircraft_development` 7.2, before `battle_generation` 7.5). `rngAllowed: true`. Carrier ops advancement per nation happens at the strategic level (monthly).
- **State location**: New `NationState.carrierOperations` field — `Record<ShipId, CarrierOperationsState>`. Follows `NationState.submarine` pattern.
- **Goldens that regenerate**: The `closingSnapshot` and any golden that captures the snapshot after `resolve_carrier_operations` runs. This will be `campaign-snapshot-v1` golden(s). All B-2/B-3/B-4/B-5/B-6 goldens stay unchanged (no-op when no carrier).