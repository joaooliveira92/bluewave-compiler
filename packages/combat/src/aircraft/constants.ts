//packages/combat/src/aircraft/constants.ts
// DESIGN-43 versioned authoritative constant surface for D-1.
// Mirrors packages/combat/src/submarines/constants.ts (ADR-0033 precedent).

export const AIRCRAFT_RULESET_VERSION = "aircraft_ruleset_v1" as const;
export const AIRCRAFT_FORMULA_VERSION = "aircraft_formula_v1" as const;

export const AIRCRAFT_BASIS_POINTS_PER_UNIT = 10_000 as const;

// DESIGN-43 §1 canonical aircraft type enum — exactly these 12 values.
export const AIRCRAFT_TYPES = [
  "FIGHTER",
  "TORPEDO_BOMBER",
  "DIVE_BOMBER",
  "MEDIUM_BOMBER",
  "PATROL_AIRCRAFT",
  "FLOATPLANE_SCOUT",
  "AIRSHIP",
  "LIGHT_JET_FIGHTER",
  "HEAVY_JET_FIGHTER",
  "JET_ATTACK_AIRCRAFT",
  "HELICOPTER",
  "SPECIAL_SQUADRON",
] as const;
export type AircraftType = (typeof AIRCRAFT_TYPES)[number];

// DESIGN-43 §9 canonical emphasised traits — exactly these 9 values.
export const AIRCRAFT_TRAITS = [
  "SPEED",
  "FIREPOWER",
  "MANEUVERABILITY",
  "TOUGHNESS",
  "PAYLOAD",
  "RANGE",
  "RELIABILITY",
  "CARRIER_SUITABILITY",
  "EASE_OF_PRODUCTION",
] as const;
export type AircraftTrait = (typeof AIRCRAFT_TRAITS)[number];

// DESIGN-43 §13 canonical inventory states — exactly these 9 values.
export const AIRCRAFT_INVENTORY_STATES = [
  "UNASSIGNED_OPERATIONAL",
  "ASSIGNED_OPERATIONAL",
  "DAMAGED_REPAIRABLE",
  "DAMAGED_AWAITING_CAPACITY",
  "UNDER_REPAIR",
  "RESERVED_FOR_REEQUIPMENT",
  "WRITTEN_OFF",
  "CAPTURED",
  "LOST",
] as const;
export type AircraftInventoryState = (typeof AIRCRAFT_INVENTORY_STATES)[number];

// DESIGN-43 §32 canonical basing classes — exactly these 6 values.
export const AIRCRAFT_BASING_CLASSES = [
  "LAND_BASED",
  "CARRIER_BASED",
  "SEAPLANE_SUPPORTED",
  "AIRSHIP_BASED",
  "HELICOPTER_DECK_BASED",
  "SPECIAL_EXPLICIT",
] as const;
export type AircraftBasingClass = (typeof AIRCRAFT_BASING_CLASSES)[number];

// DESIGN-43 §21 canonical damaged dispositions — exactly these 7 values.
export const AIRCRAFT_DAMAGED_DISPOSITIONS = [
  "REPAIR_LOCALLY",
  "AWAIT_REPAIR_CAPACITY",
  "TRANSFER_FOR_REPAIR",
  "WRITE_OFF",
  "CANNIBALIZE",
  "CAPTURED",
  "LOST",
] as const;
export type AircraftDamagedDisposition = (typeof AIRCRAFT_DAMAGED_DISPOSITIONS)[number];

// DESIGN-43 §14 squadron re-equipment states.
export const SQUADRON_REEQUIPMENT_STATES = ["NONE", "IN_PROGRESS", "COMPLETED"] as const;
export type SquadronReequipmentState = (typeof SQUADRON_REEQUIPMENT_STATES)[number];

// DESIGN-43 §6 development project statuses.
export const AIRCRAFT_PROJECT_STATUSES = [
  "REQUESTED",
  "DEVELOPING",
  "DELAYED",
  "READY_FOR_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
] as const;
export type AircraftProjectStatus = (typeof AIRCRAFT_PROJECT_STATUSES)[number];

// Score range bounds.
export const AIRCRAFT_SCORE_MIN = 0 as const;
export const AIRCRAFT_SCORE_MAX = 100 as const;