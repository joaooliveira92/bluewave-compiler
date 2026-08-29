## Question

What `*_v1` contracts does D-1 need?

DESIGN-43 defines several explicit data structures that need Zod `*_v1` contracts with fail-closed validation guards:
- `AircraftModelDefinition_v1` (§2 — 20+ fields)
- `AircraftDevelopmentProject_v1` (§6 — ~15 fields)
- `AircraftProposal_v1` (§10 — ~12 fields)
- `SquadronState_v1` (§14 — ~17 fields)
- `AircraftInventoryRecord_v1` (§13 — inventory counts per state)
- `BasingSlot_v1` (implicit from §20/§32)
- Development policy constants (`aircraft_development_duration_v1`, §7)
- Auto-equip selection order (implicit ordering from §16)

Decision: exact contract list, field content, validation rules, and any cross-contract references (e.g., `SquadronState.modelId` references `AircraftModelDefinition.modelId`).

## Type

task