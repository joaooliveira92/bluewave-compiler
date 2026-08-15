//packages/combat/src/damage/reasonCodes.ts
// DESIGN-41 §47 subset relevant to the damage module, kept separate from the top-level
// combat catalog (src/reasonCodes.ts) so INC-6's set-equality guard is not grown without
// review. Per spec §1.4 these are the in-slice damage codes; deferred §47 codes
// (flooding/fire resolution, terminal, survivor, etc.) are recorded in the spec and
// owned by later slices (M3/C-5), never shipped here.

// ---- In-slice codes (INC-1) ----
export const INVALID_SHIP_DAMAGE_STATE = "INVALID_SHIP_DAMAGE_STATE" as const;
export const DAMAGE_RESOLUTION_FAILED = "DAMAGE_RESOLUTION_FAILED" as const;
export const DAMAGE_STATE_INVARIANT_FAILED = "DAMAGE_STATE_INVARIANT_FAILED" as const;

// ---- In-slice codes (INC-2 onward, declared here for type stability, set-equality in INC-6) ----
export const DAMAGE_HIT_LOCATION_INVALID = "DAMAGE_HIT_LOCATION_INVALID" as const;
export const DAMAGE_PROTECTION_INTERACTION_INVALID = "DAMAGE_PROTECTION_INTERACTION_INVALID" as const;
export const DAMAGE_COMPONENT_OUT_OF_SCOPE = "DAMAGE_COMPONENT_OUT_OF_SCOPE" as const;
export const DAMAGE_SECONDARY_HAZARD_CREATED = "DAMAGE_SECONDARY_HAZARD_CREATED" as const;
export const FIRE_SOURCE_CREATED = "FIRE_SOURCE_CREATED" as const;
export const FLOODING_SOURCE_CREATED = "FLOODING_SOURCE_CREATED" as const;
export const SHIP_SINKING = "SHIP_SINKING" as const;
export const SHIP_FOUNDERED = "SHIP_FOUNDERED" as const;
export const ARMOR_ZONE_MAXIMUM_MISSING = "ARMOR_ZONE_MAXIMUM_MISSING" as const;
export const ARMOR_THICKNESS_LIMIT_EXCEEDED = "ARMOR_THICKNESS_LIMIT_EXCEEDED" as const;
export const SPLINTER_PROTECTION_NOT_QUALIFIED = "SPLINTER_PROTECTION_NOT_QUALIFIED" as const;
export const ARMOR_QUALITY_MULTIPLIER_MISSING = "ARMOR_QUALITY_MULTIPLIER_MISSING" as const;

// ---- Collected catalog (set-equality checked in INC-6) ----
export const DAMAGE_REASON_CODES = {
  INVALID_SHIP_DAMAGE_STATE,
  DAMAGE_RESOLUTION_FAILED,
  DAMAGE_STATE_INVARIANT_FAILED,
  DAMAGE_HIT_LOCATION_INVALID,
  DAMAGE_PROTECTION_INTERACTION_INVALID,
  DAMAGE_COMPONENT_OUT_OF_SCOPE,
  DAMAGE_SECONDARY_HAZARD_CREATED,
  FIRE_SOURCE_CREATED,
  FLOODING_SOURCE_CREATED,
  SHIP_SINKING,
  SHIP_FOUNDERED,
  ARMOR_ZONE_MAXIMUM_MISSING,
  ARMOR_THICKNESS_LIMIT_EXCEEDED,
  SPLINTER_PROTECTION_NOT_QUALIFIED,
  ARMOR_QUALITY_MULTIPLIER_MISSING,
} as const;

// ---- Deferred §47 codes (recorded, not shipped — owned by M3/C-5) ----
// FLOODING_HIGH_SPEED_LOSS_CHECK
// CARRIER_OPERATIONS_OBSTRUCTED_BY_FIRE
// ALUMINUM_SUPERSTRUCTURE_FIRE_VULNERABILITY
// SHIP_MISSION_KILLED
// SHIP_STABILIZED
// SHIP_ABANDONED
// SHIP_SCUTTLED
// SHIP_CAPTURED
// SHIP_RECOVERED
// SURVIVOR_RESCUE_INELIGIBLE
// SURVIVOR_RESCUE_COMPLETED
// SINKING_CREDIT_NOT_YET_CONFIRMED