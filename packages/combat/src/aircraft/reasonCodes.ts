//packages/combat/src/aircraft/reasonCodes.ts
// DESIGN-43 §40 subset relevant to INC-1: only INVALID_AIRCRAFT_MODEL_DEFINITION
// ships this increment (the §2 model-definition boundary it exercises). Remaining
// codes ship in INC-8 (reason codes rollup + set-equality guard).
// INC-1 ships INVALID_AIRCRAFT_MODEL_DEFINITION + the AIRCRAFT_MISSION_ROLE_DEFERRED
// marker (per spec §1.4).

export const INVALID_AIRCRAFT_MODEL_DEFINITION = "INVALID_AIRCRAFT_MODEL_DEFINITION" as const;

export const AIRCRAFT_MISSION_ROLE_DEFERRED = "AIRCRAFT_MISSION_ROLE_DEFERRED" as const;

export const AIRCRAFT_REASON_CODES = {
  INVALID_AIRCRAFT_MODEL_DEFINITION,
  AIRCRAFT_MISSION_ROLE_DEFERRED,
} as const;

export type AircraftReasonCode = (typeof AIRCRAFT_REASON_CODES)[keyof typeof AIRCRAFT_REASON_CODES];