// packages/combat/src/air-defense/reasonCodes.ts
// D-4 M4 Aviation: Air Defense — INC-2 eligibility reason-code seed.
// DESIGN-45 §28 requires 20 shipped codes; the full rollup lands in INC-5.
// This seed covers only the codes needed by the INC-2 eligibility predicates.
//
// INVALID_AIR_DEFENSE_STATE and INVALID_AIR_DEFENSE_SYSTEM_DEFINITION are defined in
// ./constants.js (INC-1) and are intentionally NOT re-exported here to avoid
// duplicate-export conflicts through the barrel index.

// ---- INC-2 eligibility reason codes (DESIGN-45 §28) ----

export const AIR_DEFENSE_TARGET_INELIGIBLE = "AIR_DEFENSE_TARGET_INELIGIBLE" as const;
export const AIR_DEFENSE_CHANNEL_UNAVAILABLE = "AIR_DEFENSE_CHANNEL_UNAVAILABLE" as const;
export const AIR_DEFENSE_DIRECTOR_UNAVAILABLE = "AIR_DEFENSE_DIRECTOR_UNAVAILABLE" as const;
export const AIR_DEFENSE_RADAR_UNAVAILABLE = "AIR_DEFENSE_RADAR_UNAVAILABLE" as const;
export const AIR_DEFENSE_AMMUNITION_UNAVAILABLE = "AIR_DEFENSE_AMMUNITION_UNAVAILABLE" as const;
export const HEAVY_AA_PROTECTED_RADIUS_EXCEEDED = "HEAVY_AA_PROTECTED_RADIUS_EXCEEDED" as const;
export const MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED = "MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED" as const;

// ---- INC-2 attack boundary code ----
// Strict AirDefenseAttack validation failures use this code (DESIGN-45 §4).
export const INVALID_AIR_DEFENSE_ATTACK = "INVALID_AIR_DEFENSE_ATTACK" as const;
