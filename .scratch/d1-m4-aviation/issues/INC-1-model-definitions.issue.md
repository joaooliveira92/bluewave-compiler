# INC-1: Aircraft Model + Type Definitions

**Frontier: yes** (blocked by: none)

## Deliverable

Aircraft type enum (12 types), `AircraftModelDefinition` with all DESIGN-43 §2 fields, `*_v1` contract, basic model validation.

## Files

- `packages/combat/src/aircraft/model.ts` — types enum, `AircraftModelDefinition` interface
- `packages/combat/src/aircraft/contracts.ts` — `AircraftModelDefinition_v1` Zod contract
- `packages/combat/src/aircraft/reasonCodes.ts` (seed) — `INVALID_AIRCRAFT_MODEL_DEFINITION`

## Tests

- `aircraft/model.test.ts` — valid definition, missing field → INVALID_AIRCRAFT_MODEL_DEFINITION, score bounds 0-100, invalid type rejected

## Acceptance criteria

AC-1 (§1), AC-2 (§2)

## Dependencies

None (base types, no phase wiring)