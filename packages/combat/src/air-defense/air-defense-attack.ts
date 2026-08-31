// packages/combat/src/air-defense/air-defense-attack.ts
// D-4 M4 Aviation: Air Defense — AirDefenseAttack descriptor per DESIGN-45 §4.
// Immutable attack descriptor with strict Zod validation at construction boundaries.
// Speed unit: knots (canonical for §9 light-AA window calculation).

import { z } from "zod";
import { BluewaveError, SafeInt } from "@bluewave/contracts";
import { INVALID_AIR_DEFENSE_SYSTEM_DEFINITION } from "./constants.js";

// ---- §4 Attack types (lines 68-84) ----

export const AttackType = {
  AIRCRAFT_LEVEL_BOMBING: "AIRCRAFT_LEVEL_BOMBING" as const,
  AIRCRAFT_DIVE_BOMBING: "AIRCRAFT_DIVE_BOMBING" as const,
  AIRCRAFT_SKIP_BOMBING: "AIRCRAFT_SKIP_BOMBING" as const,
  AIRCRAFT_TORPEDO_ATTACK: "AIRCRAFT_TORPEDO_ATTACK" as const,
  AIRCRAFT_ROCKET_ATTACK: "AIRCRAFT_ROCKET_ATTACK" as const,
  AIRCRAFT_GUIDED_WEAPON_ATTACK: "AIRCRAFT_GUIDED_WEAPON_ATTACK" as const,
  HEAVY_ASM: "HEAVY_ASM" as const,
  MEDIUM_ASM: "MEDIUM_ASM" as const,
  LIGHT_ASM: "LIGHT_ASM" as const,
  ANTI_RADIATION_WEAPON: "ANTI_RADIATION_WEAPON" as const,
  SPECIAL_EXPLICIT_ATTACK: "SPECIAL_EXPLICIT_ATTACK" as const,
} as const;

export type AttackTypeId = (typeof AttackType)[keyof typeof AttackType];

const AttackTypeLiteral = z.enum([
  "AIRCRAFT_LEVEL_BOMBING",
  "AIRCRAFT_DIVE_BOMBING",
  "AIRCRAFT_SKIP_BOMBING",
  "AIRCRAFT_TORPEDO_ATTACK",
  "AIRCRAFT_ROCKET_ATTACK",
  "AIRCRAFT_GUIDED_WEAPON_ATTACK",
  "HEAVY_ASM",
  "MEDIUM_ASM",
  "LIGHT_ASM",
  "ANTI_RADIATION_WEAPON",
  "SPECIAL_EXPLICIT_ATTACK",
] as const);

// ---- §4 Terminal profiles ----
// Terminal flight profile of the attack at engagement time (line 84 requires
// every attack to declare a terminal profile). Deterministic string literals.

export const TerminalProfile = {
  IMPACTING: "IMPACTING" as const,
  LEVEL: "LEVEL" as const,
  DIVE: "DIVE" as const,
  SKIP: "SKIP" as const,
  GUIDED: "GUIDED" as const,
  TORPEDO: "TORPEDO" as const,
  CRUISE: "CRUISE" as const,
} as const;

export type TerminalProfileId = (typeof TerminalProfile)[keyof typeof TerminalProfile];

const TerminalProfileLiteral = z.enum([
  "IMPACTING",
  "LEVEL",
  "DIVE",
  "SKIP",
  "GUIDED",
  "TORPEDO",
  "CRUISE",
] as const);

export function isValidTerminalProfile(profile: string): profile is TerminalProfileId {
  return (
    profile === "IMPACTING" ||
    profile === "LEVEL" ||
    profile === "DIVE" ||
    profile === "SKIP" ||
    profile === "GUIDED" ||
    profile === "TORPEDO" ||
    profile === "CRUISE"
  );
}

// ---- §8 medium-AaEligible profiles (lines 140-155, §18 lines 307-318) ----
// Aircraft delivery profiles are medium-AA-eligible before weapon release.
// ASMs, anti-radiation, and special explicit attacks are NOT medium-AA-eligible.

const MEDIUM_AA_ELIGIBLE_TYPES: ReadonlySet<AttackTypeId> = new Set([
  AttackType.AIRCRAFT_LEVEL_BOMBING,
  AttackType.AIRCRAFT_DIVE_BOMBING,
  AttackType.AIRCRAFT_SKIP_BOMBING,
  AttackType.AIRCRAFT_TORPEDO_ATTACK,
  AttackType.AIRCRAFT_ROCKET_ATTACK,
  AttackType.AIRCRAFT_GUIDED_WEAPON_ATTACK,
]);

/**
 * Returns true if the given attack type is medium-AA-eligible per §8/§18.
 * This is a deterministic pure function derived from the attack type alone.
 */
export function isMediumAaEligible(type: AttackTypeId): boolean {
  return MEDIUM_AA_ELIGIBLE_TYPES.has(type);
}

// ---- SafeInt Zod schema (local, avoids circular deps with system-definition.ts) ----

function safeIntSchema(
  message: string,
  opts?: { min?: number; max?: number; nonNegative?: boolean; positive?: boolean },
): z.ZodType<SafeInt> {
  if (opts?.positive) {
    return z.custom<SafeInt>(
      (val) => typeof val === "number" && SafeInt.isSafeInt(val) && val > 0,
      { message },
    );
  }
  if (opts?.nonNegative) {
    return z.custom<SafeInt>(
      (val) => typeof val === "number" && SafeInt.isSafeInt(val) && val >= 0,
      { message },
    );
  }
  if (opts?.min !== undefined || opts?.max !== undefined) {
    return z.custom<SafeInt>(
      (val) => {
        if (typeof val !== "number" || !SafeInt.isSafeInt(val)) return false;
        return val >= (opts?.min ?? -Infinity) && val <= (opts?.max ?? Infinity);
      },
      { message },
    );
  }
  return z.custom<SafeInt>((val) => typeof val === "number" && SafeInt.isSafeInt(val), { message });
}

// ---- AirDefenseAttack interface ----

/**
 * Immutable attack descriptor per DESIGN-45 §4.
 * Every attack MUST declare: release range, release altitude, speed profile,
 * terminal profile, formation size, cohesion, defensive susceptibility,
 * target identifier, and medium-AaEligible flag.
 *
 * Speed unit: **knots** (nautical miles per hour). This is the canonical unit
 * for the §9 light-AA window speed-band calculation. Conversion to m/s for
 * range/altitude checks: floor(speedKnots × 1852 / 3600).
 */
export interface AirDefenseAttack {
  readonly attackId: string;
  readonly attackType: AttackTypeId;
  readonly releaseRangeM: SafeInt; // meters from target to weapon release point
  readonly releaseAltitudeM: SafeInt; // meters altitude at weapon release
  readonly terminalProfile: TerminalProfileId; // terminal flight profile per §4
  readonly speedKnots: SafeInt; // speed in knots (canonical unit)
  readonly formationSize: SafeInt; // number of attacking units (>= 1)
  readonly cohesionBp: SafeInt; // formation cohesion in basis points (0-10_000)
  readonly defensiveSusceptibilityBp: SafeInt; // target susceptibility in bp (0-10_000)
  readonly targetId: string; // identifier of the target being attacked
  readonly mediumAaEligible: boolean; // pre-computed from attack type per §8
}

// ---- Zod schema ----

const AirDefenseAttackSchema = z
  .object({
    attackId: z.string().min(1, "attackId must be a non-empty string"),
    attackType: AttackTypeLiteral,
    releaseRangeM: safeIntSchema("releaseRangeM must be a non-negative integer", {
      nonNegative: true,
    }),
    releaseAltitudeM: safeIntSchema("releaseAltitudeM must be a non-negative integer", {
      nonNegative: true,
    }),
    terminalProfile: TerminalProfileLiteral,
    speedKnots: safeIntSchema("speedKnots must be a positive integer", { positive: true }),
    formationSize: safeIntSchema("formationSize must be a positive integer", { positive: true }),
    cohesionBp: safeIntSchema("cohesionBp must be in range 0..10_000", {
      min: 0,
      max: 10_000,
    }),
    defensiveSusceptibilityBp: safeIntSchema(
      "defensiveSusceptibilityBp must be in range 0..10_000",
      { min: 0, max: 10_000 },
    ),
    targetId: z.string().min(1, "targetId must be a non-empty string"),
    mediumAaEligible: z.boolean(),
  })
  .strict();

// ---- fail-closed validator ----

export function validateAirDefenseAttack(value: unknown): AirDefenseAttack {
  const result = AirDefenseAttackSchema.safeParse(value);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    throw new BluewaveError(
      `AirDefenseAttack validation failed: ${JSON.stringify(errors, null, 2)}`,
      { code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION, errors },
    );
  }
  return result.data as AirDefenseAttack;
}

// ---- createAirDefenseAttack ----

/**
 * Creates an immutable AirDefenseAttack with strict Zod validation.
 * The `mediumAaEligible` flag is always computed from the attack type —
 * callers may pass it for convenience but it will be overridden.
 *
 * Fail-closed: rejects unknown fields, rejects invalid values.
 */
export function createAirDefenseAttack(params: {
  attackId: string;
  attackType: AttackTypeId;
  releaseRangeM: SafeInt;
  releaseAltitudeM: SafeInt;
  terminalProfile: TerminalProfileId;
  speedKnots: SafeInt;
  formationSize: SafeInt;
  cohesionBp: SafeInt;
  defensiveSusceptibilityBp: SafeInt;
  targetId: string;
  mediumAaEligible?: boolean; // computed from attackType, ignored if provided
}): AirDefenseAttack {
  const mediumAaEligible = isMediumAaEligible(params.attackType);

  // Validate unknown fields via strict parse
  const inputCheck = AirDefenseAttackSchema.safeParse({
    ...params,
    mediumAaEligible,
  });
  if (!inputCheck.success) {
    const errors = inputCheck.error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    throw new BluewaveError(
      `AirDefenseAttack validation failed: ${JSON.stringify(errors, null, 2)}`,
      { code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION, errors },
    );
  }

  // Detect unknown fields
  const knownKeys = new Set(Object.keys(AirDefenseAttackSchema.shape));
  for (const key of Object.keys(params)) {
    if (!knownKeys.has(key)) {
      throw new BluewaveError(`AirDefenseAttack validation failed: unknown field "${key}"`, {
        code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
        field: key,
      });
    }
  }

  return {
    attackId: params.attackId,
    attackType: params.attackType,
    releaseRangeM: params.releaseRangeM,
    releaseAltitudeM: params.releaseAltitudeM,
    terminalProfile: params.terminalProfile,
    speedKnots: params.speedKnots,
    formationSize: params.formationSize,
    cohesionBp: params.cohesionBp,
    defensiveSusceptibilityBp: params.defensiveSusceptibilityBp,
    targetId: params.targetId,
    mediumAaEligible,
  } as AirDefenseAttack;
}

// ---- isValidAttackType ----

export function isValidAttackType(type: string): type is AttackTypeId {
  return (
    type === "AIRCRAFT_LEVEL_BOMBING" ||
    type === "AIRCRAFT_DIVE_BOMBING" ||
    type === "AIRCRAFT_SKIP_BOMBING" ||
    type === "AIRCRAFT_TORPEDO_ATTACK" ||
    type === "AIRCRAFT_ROCKET_ATTACK" ||
    type === "AIRCRAFT_GUIDED_WEAPON_ATTACK" ||
    type === "HEAVY_ASM" ||
    type === "MEDIUM_ASM" ||
    type === "LIGHT_ASM" ||
    type === "ANTI_RADIATION_WEAPON" ||
    type === "SPECIAL_EXPLICIT_ATTACK"
  );
}
