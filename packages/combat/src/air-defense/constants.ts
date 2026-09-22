// packages/combat/src/air-defense/constants.ts
// D-4 M4 Aviation: Air Defense — constants per DESIGN-45 §2-3.
// Parallel to air-combat/constants.ts pattern.

import { BluewaveError, SafeInt } from "@bluewave/contracts";

// ---- §7 Heavy AA protected radius ----
// DESIGN-45 §7: the permitted protected radius is 3..8 nautical miles; the shipped value is
// exactly 5. RESOLUTION (INC-2): the INC-1 PROTECTED_RADIUS constant deferred the unit
// decision (m vs nm); §7 states the radius in nautical miles, so the authoritative shipped
// value is exactly 5 nm = 5 × 1_852 m = 9_260 m (exact product, kept as a literal).
export const NAUTICAL_MILE_M = 1_852 as const;
export const HEAVY_AA_PROTECTED_RADIUS_NM = 5 as const;
export const HEAVY_AA_PROTECTED_RADIUS_M = 9_260 as const;

// ---- §8 Medium AA fire-control requirement ----
// Medium AA may engage only when the fire-control solution is at least 4_000 basis points.
export const MEDIUM_AA_FIRE_CONTROL_MINIMUM_BP = 4_000 as const;

// ---- §12 Director scaling table ----
// Director strength index → scaling value (basis points)
// 0 → 5_000, 1 → 10_000, 2 → 18_000, 3 → 25_000, 4 → 31_000
export const DIRECTOR_SCALING_TABLE = [
  [0, 5_000],
  [1, 10_000],
  [2, 18_000],
  [3, 25_000],
  [4, 31_000],
] as const;

// ---- §14 Radar saturation table ----
// Radar-directed medium-AA groups → marginal effectiveness multiplier (basis points).
// Canonical marginal schedule (§14 lines 239-244, §29.13-14):
//   groups 1-4 → 10_000 each; groups 5-6 → 5_000 each; groups 7-8 → 2_500 each; groups 9+ → 500 each.
// Each entry is [1-based group count, marginal multiplier bp for that count].
export const RADAR_SATURATION_TABLE = [
  [1, 10_000],
  [2, 10_000],
  [3, 10_000],
  [4, 10_000],
  [5, 5_000],
  [6, 5_000],
  [7, 2_500],
  [8, 2_500],
  [9, 500],
] as const;

/**
 * Marginal effectiveness multiplier (basis points) contributed by the n-th
 * radar-directed medium-AA group. Groups 9 and above all contribute 500.
 * The effective group count per §14 is:
 *   effectiveRadarMediumAaGroups = sum(marginalGroupMultiplierBp(n) for n=1..count) / 10_000
 * The division is retained as an exact rational value until the owning formula rounds.
 * @param groupCount - 1-based radar-directed medium-AA group count (>= 0).
 */
export function radarMediumAaMarginalMultiplierBp(groupCount: number): number {
  if (groupCount < 1) return 0;
  const last = RADAR_SATURATION_TABLE[RADAR_SATURATION_TABLE.length - 1];
  if (last === undefined) return 0;
  return groupCount <= last[0] ? (RADAR_SATURATION_TABLE[groupCount - 1]?.[1] ?? 0) : last[1];
}

// ---- §16 CIWS redundancy table ----
// Number of CIWS systems → redundancy value (basis points).
// Canonical marginal schedule (§16 lines 272-275, §29.15-16):
//   systems 1-4 → 10_000 each; systems 5-6 → 5_000 each; systems 7-8 → 1_500 each; systems 9+ → 500 each.
// Each entry is [1-based system count, marginal multiplier bp for that count].
export const CIWS_REDUNDANCY_TABLE = [
  [1, 10_000],
  [2, 10_000],
  [3, 10_000],
  [4, 10_000],
  [5, 5_000],
  [6, 5_000],
  [7, 1_500],
  [8, 1_500],
  [9, 500],
] as const;

/**
 * Marginal effectiveness multiplier (basis points) contributed by the n-th CIWS
 * system on a defended ship. Systems 9 and above all contribute 500.
 * @param systemCount - 1-based CIWS system count (>= 0).
 */
export function ciwsMarginalMultiplierBp(systemCount: number): number {
  if (systemCount < 1) return 0;
  const last = CIWS_REDUNDANCY_TABLE[CIWS_REDUNDANCY_TABLE.length - 1];
  if (last === undefined) return 0;
  return systemCount <= last[0] ? (CIWS_REDUNDANCY_TABLE[systemCount - 1]?.[1] ?? 0) : last[1];
}

// ---- §9 Light AA window durations ----
// Attack profile → window duration (seconds).
// Canonical base windows before impact/closest approach (§9 lines 162-169):
//   level 2min, dive 1min, skip 1min, torpedo 2min, rocket 1min.
export const LIGHT_AA_WINDOW_DURATIONS = {
  LEVEL: 120, // 2-minute window = 120 seconds
  DIVE: 60, // 1-minute window = 60 seconds
  TORPEDO: 120, // 2-minute window = 120 seconds
  SKIP: 60, // 1-minute window = 60 seconds
  ROCKET: 60, // 1-minute window = 60 seconds
} as const;

// ---- §9 Light AA speed bands (knots) ----
// Speed (knots) modifies the light-AA window with the canonical schedule (§9 lines 171-176):
//   below 200 knots → 10_000 bp; 200..<350 → 7_500; 350..<500 → 5_000; 500+ → 2_500.
// Each entry is [lower bound (knots, inclusive), speedWindowMultiplierBp].
// Bands are matched from highest lower-bound with the multiplier applying to a speed >= lower bound.
export const LIGHT_AA_SPEED_BANDS = [
  [0, 10_000], // speed < 200 knots → 10_000
  [200, 7_500], // 200 .. < 350 knots → 7_500
  [350, 5_000], // 350 .. < 500 knots → 5_000
  [500, 2_500], // 500+ knots → 2_500
] as const;

/** Basis-point multiplier applied to the light-AA window for a given speed in knots. */
export function lightAASpeedMultiplierBp(speedKnots: number): number {
  let bp: number = LIGHT_AA_SPEED_BANDS[0]?.[1] ?? 10_000;
  for (const [lowerKnots, multiplierBp] of LIGHT_AA_SPEED_BANDS) {
    if (speedKnots >= lowerKnots) bp = multiplierBp;
  }
  return bp;
}

// ---- §9 Effective light-AA window formula ----
// effectiveWindowMilliseconds = max(1_000, floor(baseWindowMilliseconds * speedWindowMultiplierBp / 10_000))
// Deterministic integer implementation using masked safe-integer arithmetic with explicit FLOOR.

/**
 * Computes the effective light-AA engagement window, per §9 line 178.
 * @param baseWindowMilliseconds - Authoritative base window for the attack profile (ms).
 * @param speedWindowMultiplierBp - Basis-point multiplier from the knot speed band.
 * @returns max(1_000, floor(baseWindowMilliseconds * speedWindowMultiplierBp / 10_000)).
 */
export function effectiveLightAAWindowMilliseconds(
  baseWindowMilliseconds: number,
  speedWindowMultiplierBp: number,
): number {
  if (!SafeInt.isSafeInt(baseWindowMilliseconds)) {
    throw new BluewaveError(
      "effectiveLightAAWindowMilliseconds: baseWindowMilliseconds must be a safe integer",
      {
        code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
        baseWindowMilliseconds,
      },
    );
  }
  if (!SafeInt.isSafeInt(speedWindowMultiplierBp)) {
    throw new BluewaveError(
      "effectiveLightAAWindowMilliseconds: speedWindowMultiplierBp must be a safe integer",
      {
        code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
        speedWindowMultiplierBp,
      },
    );
  }
  const product = SafeInt.mul(SafeInt(baseWindowMilliseconds), SafeInt(speedWindowMultiplierBp));
  // baseWindowMilliseconds >= 0 and multiplier >= 0, so floor == trunc.
  const scaled = SafeInt.div(product, SafeInt(10_000), "floor");
  const minMs = SafeInt(1_000);
  return Math.max(Number(minMs), Number(scaled));
}

// ---- Base defense values (§3) ----
// Base kill/damage/abort/disruption values per layer
// Used as authoritative base-point values in engagement formula
export const BASE_DEFENSE_VALUES = {
  HEAVY_AA: {
    kill: 100,
    damage: 50,
    abort: 30,
    disruption: 15,
  },
  MEDIUM_AA: {
    kill: 50,
    damage: 25,
    abort: 15,
    disruption: 8,
  },
  LIGHT_AA: {
    kill: 20,
    damage: 10,
    abort: 5,
    disruption: 3,
  },
  CIWS_TERMINAL_DEFENSE: {
    kill: 80,
    damage: 40,
    abort: 20,
    disruption: 25,
  },
} as const;

// ---- Layer definitions ----
// Valid defense layer identifiers per DESIGN-45
export const LAYER_IDS = ["HEAVY_AA", "MEDIUM_AA", "LIGHT_AA", "CIWS_TERMINAL_DEFENSE"] as const;

// Category identifiers
export const CATEGORY_IDS = [...LAYER_IDS] as const;

// ---- Model versioning ----
// Content version / hash for air-defense definitions
export const AIR_DEFENSE_MODEL_VERSION = "air_defense_v1" as const;

// ---- Engagement resolution formula constants ----
// effectiveDefenseBp = floor(baseDefenseBp * director * radar * crew * damage * ammunition * targetProfile * weather * saturation / 10_000^8)
// 10_000^8 = 10^32
export const FORMULA_DENOMINATOR = 10_000 as const;
export const FORMULA_EXPONENT = 8 as const;

// ---- Crew quality constants ----
export const CREW_QUALITY_MIN = 0 as const;
export const CREW_QUALITY_MAX = 10_000 as const;

// ---- State hash ----
// SHA-256 hex output length
export const STATE_HASH_LENGTH = 64 as const;

// ---- Required reason codes (DESIGN-45 §28) ----
// Missing or inconsistent air-defense state MUST fail with INVALID_AIR_DEFENSE_STATE.
export const INVALID_AIR_DEFENSE_STATE = "INVALID_AIR_DEFENSE_STATE" as const;
// Missing air-defense system metadata MUST fail with INVALID_AIR_DEFENSE_SYSTEM_DEFINITION.
export const INVALID_AIR_DEFENSE_SYSTEM_DEFINITION =
  "INVALID_AIR_DEFENSE_SYSTEM_DEFINITION" as const;
