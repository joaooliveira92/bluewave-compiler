export const CARRIER_OPERATIONS_RULESET_VERSION = "carrier_operations_ruleset_v1" as const;
export const CARRIER_OPERATIONS_FORMULA_VERSION = "carrier_operations_formula_v1" as const;
export const CARRIER_OPERATIONS_BASIS_POINTS_PER_UNIT = 10_000 as const;

export const CARRIER_CLASSIFICATIONS = ["CVL", "CV"] as const;
export type CarrierClassification = (typeof CARRIER_CLASSIFICATIONS)[number];

export const CVL_MIN_CAPACITY = 4 as const;
export const CVL_MAX_CAPACITY = 34 as const;
export const CV_MIN_CAPACITY = 35 as const;

export const ORDINARY_SLOT_CAPACITY_UNITS = 2 as const;
export const PISTON_CAPACITY_UNITS = 2 as const;
export const LIGHT_JET_CAPACITY_UNITS = 3 as const;
export const HEAVY_JET_CAPACITY_UNITS = 3 as const;
export const HELICOPTER_CAPACITY_UNITS = 2 as const;

export const OVERSIZED_CARRIER_THRESHOLD = 100 as const;
export const OVERSIZED_DECK_CYCLE_EFFICIENCY_BP = 9_000 as const;
export const OVERSIZED_SORTIE_GENERATION_BP = 9_000 as const;
export const OVERSIZED_MAINTENANCE_COST_BP = 12_500 as const;
export const OVERSIZED_COORDINATION_BP = 9_500 as const;
export const OVERSIZED_HAZARD_BP = 11_000 as const;

export const DECK_CYCLE_STATES = [
  "IDLE",
  "LAUNCHING",
  "RECOVERING",
  "SPOTTING",
  "REFUELING",
  "REARMING",
  "MAINTENANCE",
  "LAUNCHING_RECOVERING",
  "EMERGENCY_RECOVERY",
  "DAMAGE_CONTROL",
  "DECK_PARK",
  "TRANSFERRING",
  "SUSPENDED",
] as const;
export type DeckCycleState = (typeof DECK_CYCLE_STATES)[number];

export const CARRIER_OPERATIONS_PHASE_ORDER = 7.3 as const;
export const CARRIER_OPERATIONS_PHASE_ID = "resolve_carrier_operations" as const;

export const carrierOperationsPolicyId = "carrier_operations_v1" as const;