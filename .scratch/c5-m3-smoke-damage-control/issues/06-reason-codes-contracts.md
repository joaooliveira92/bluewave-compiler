# Decision 06: Reason codes and contracts

## Question

What reason codes and contracts should C-5 ship?

## Options

**A. Full set.** Ship all reason codes from DESIGN-42 §30 (smoke subset: `INVALID_SMOKE_CLOUD`, `SMOKE_LINE_INTERSECTION_FAILED`, `SMOKESCREEN_SHIP_INELIGIBLE`, `SMOKESCREEN_EQUIPMENT_UNAVAILABLE`, `SMOKESCREEN_CONSUMABLE_UNAVAILABLE`, `SMOKESCREEN_COOLDOWN_ACTIVE`, `SMOKESCREEN_GENERATION_INTERRUPTED`, `SMOKE_FLOAT_TECHNOLOGY_UNAVAILABLE`, `SMOKE_FLOAT_CAPACITY_MISSING`, `SMOKE_FLOAT_INVENTORY_EMPTY`, `SMOKE_FLOAT_DEPLOYMENT_SPEED_EXCEEDED`, `SMOKE_GENERATOR_TECHNOLOGY_UNAVAILABLE`, `SMOKE_GENERATOR_CHARGES_EMPTY`, `SMOKE_EQUIPMENT_MODE_CONFLICT`, `WEATHER_SMOKE_STATE_INVARIANT_FAILED`) + DESIGN-41 §47 remainder (`FLOODING_HIGH_SPEED_LOSS_CHECK`, `FIRE_SOURCE_CREATED` [already shipped in B-4 — extended], `FLOODING_SOURCE_CREATED` [extended], `SHIP_MISSION_KILLED`, `SHIP_SINKING` [extended], `SHIP_STABILIZED`, `CARRIER_OPERATIONS_OBSTRUCTED_BY_FIRE`, `ALUMINUM_SUPERSTRUCTURE_FIRE_VULNERABILITY`). Plus versioned `*_v1` contracts with fail-closed `validate*Contract` guards.

**B. Minimal.** Ship only the smoke reason codes and defer all DESIGN-41 remainder codes.

## Decision

**Option A.** Follow the C-1/C-2/C-3/C-4 precedent: every module ships its own `reasonCodes.ts` (in-slice codes + `SMOKE_RESOLUTION_DEFERRED` marker) and versioned `*_v1` contracts with fail-closed `validate*Contract` guards. The damage-control extension reason codes are a natural extension of B-4's catalog. Set-equality test verifies no silent addition. Reason-code catalog records every decision and deferred code.