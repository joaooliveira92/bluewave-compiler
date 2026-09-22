// packages/combat/src/air-defense/attack.ts
// D-4 M4 Aviation: Air Defense — AirDefenseAttack incoming attack model per DESIGN-45 §4.
// Every attack declares release range, release altitude, speed profile, terminal profile,
// formation size, cohesion, defensive susceptibility, and target identifier (§4 line 84).
// Strict Zod validation at construction boundaries, fail-closed guards.

import { z } from "zod";
import { BluewaveError, SafeInt } from "@bluewave/contracts";
import { AIR_DEFENSE_MODEL_VERSION } from "./constants.js";
import { INVALID_AIR_DEFENSE_ATTACK } from "./reasonCodes.js";

// ---- Canonical attack types (§4) ----

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

/** All 11 canonical attack types, in §4 canonical order. */
export const ATTACK_TYPES: readonly AttackTypeId[] = [
  AttackType.AIRCRAFT_LEVEL_BOMBING,
  AttackType.AIRCRAFT_DIVE_BOMBING,
  AttackType.AIRCRAFT_SKIP_BOMBING,
  AttackType.AIRCRAFT_TORPEDO_ATTACK,
  AttackType.AIRCRAFT_ROCKET_ATTACK,
  AttackType.AIRCRAFT_GUIDED_WEAPON_ATTACK,
  AttackType.HEAVY_ASM,
  AttackType.MEDIUM_ASM,
  AttackType.LIGHT_ASM,
  AttackType.ANTI_RADIATION_WEAPON,
  AttackType.SPECIAL_EXPLICIT_ATTACK,
];

// ---- Zod literal for attack types ----

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

// Standard SafeInt schema: accept a number (or SafeInt), validate integer + safe range.
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

// ---- AirDefenseAttack interface (§4) ----

export interface AirDefenseAttack {
  attackId: string;
  formationId: string; // attacking formation identifier (must be provided)
  targetId: string; // defended ship identifier under attack
  attackType: AttackTypeId;
  speedKnots: SafeInt;
  speedMps: SafeInt;
  currentRangeM: SafeInt; // range to the defended ship / closest approach
  currentAltitudeM: SafeInt;
  bearingDegrees: SafeInt; // 0..360 angular offset from the defender-facing line (arc predicate)
  releaseRangeM: SafeInt;
  releaseAltitudeM: SafeInt;
  isReleased: boolean; // weapons released from the aircraft? (§8 pre-release vs post-release)
  fireControlSolutionBp: SafeInt; // current fire-control solution in basis points (§8 gate)
  timeToImpactMs: SafeInt; // time to impact / closest approach (light-AA window §9)
  formationSize: SafeInt; // positive
  cohesionBp: SafeInt;
  defensiveSusceptibilityBp: SafeInt;
  contentVersion: string;
  contentHash: string;
}

// ---- Zod schema for AirDefenseAttack ----

const AirDefenseAttackSchema = z
  .object({
    attackId: z.string().min(1, "attackId must be a non-empty string"),

    formationId: z.string().min(1, "formationId must be a non-empty string"),

    targetId: z.string().min(1, "targetId must be a non-empty string"),

    attackType: AttackTypeLiteral,

    speedKnots: safeIntSchema("speedKnots must be a non-negative integer", {
      nonNegative: true,
    }),

    speedMps: safeIntSchema("speedMps must be a non-negative integer", { nonNegative: true }),

    currentRangeM: safeIntSchema("currentRangeM must be a non-negative integer", {
      nonNegative: true,
    }),

    currentAltitudeM: safeIntSchema("currentAltitudeM must be a non-negative integer", {
      nonNegative: true,
    }),

    bearingDegrees: safeIntSchema("bearingDegrees must be 0-360", { min: 0, max: 360 }),

    releaseRangeM: safeIntSchema("releaseRangeM must be a non-negative integer", {
      nonNegative: true,
    }),

    releaseAltitudeM: safeIntSchema("releaseAltitudeM must be a non-negative integer", {
      nonNegative: true,
    }),

    isReleased: z.boolean(),

    fireControlSolutionBp: safeIntSchema("fireControlSolutionBp must be a non-negative integer", {
      nonNegative: true,
    }),

    timeToImpactMs: safeIntSchema("timeToImpactMs must be a non-negative integer", {
      nonNegative: true,
    }),

    formationSize: safeIntSchema("formationSize must be a positive integer", { positive: true }),

    cohesionBp: safeIntSchema("cohesionBp must be a non-negative integer", {
      nonNegative: true,
    }),

    defensiveSusceptibilityBp: safeIntSchema(
      "defensiveSusceptibilityBp must be a non-negative integer",
      { nonNegative: true },
    ),

    contentVersion: z.string().min(1, "contentVersion must be a non-empty string"),

    contentHash: z.string().length(64, "contentHash must be a 64-character SHA-256 hex string"),
  })
  .strict();

// ---- fail-closed guard: rejects unknown fields ----

export function validateAirDefenseAttack(value: unknown): AirDefenseAttack {
  const result = AirDefenseAttackSchema.safeParse(value);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    throw new BluewaveError(
      `AirDefenseAttack validation failed: ${JSON.stringify(errors, null, 2)}`,
      {
        code: INVALID_AIR_DEFENSE_ATTACK,
        errors,
      },
    );
  }
  return result.data as AirDefenseAttack;
}

// ---- createAirDefenseAttack ----

export function createAirDefenseAttack(params: Partial<AirDefenseAttack>): AirDefenseAttack {
  // First, validate that the input does not contain invalid values or unknown fields.
  // The partial schema permits missing fields, so any failure here is from invalid values.
  const inputCheck = AirDefenseAttackSchema.partial().safeParse(params);
  if (!inputCheck.success) {
    const errors = inputCheck.error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    throw new BluewaveError(
      `AirDefenseAttack validation failed: ${JSON.stringify(errors, null, 2)}`,
      {
        code: INVALID_AIR_DEFENSE_ATTACK,
        errors,
      },
    );
  }

  // Detect unknown fields by re-parsing the original key set against the strict schema shape.
  const knownKeys = new Set(Object.keys(AirDefenseAttackSchema.shape));
  for (const key of Object.keys(params)) {
    if (!knownKeys.has(key)) {
      throw new BluewaveError(`AirDefenseAttack validation failed: unknown field "${key}"`, {
        code: INVALID_AIR_DEFENSE_ATTACK,
        field: key,
      });
    }
  }

  const merged = {
    attackId: params.attackId ?? "",
    formationId: params.formationId ?? "",
    targetId: params.targetId ?? "",
    attackType: params.attackType ?? AttackType.AIRCRAFT_LEVEL_BOMBING,
    speedKnots: params.speedKnots ?? SafeInt.ZERO,
    speedMps: params.speedMps ?? SafeInt.ZERO,
    currentRangeM: params.currentRangeM ?? SafeInt.ZERO,
    currentAltitudeM: params.currentAltitudeM ?? SafeInt.ZERO,
    bearingDegrees: params.bearingDegrees ?? SafeInt.ZERO,
    releaseRangeM: params.releaseRangeM ?? SafeInt.ZERO,
    releaseAltitudeM: params.releaseAltitudeM ?? SafeInt.ZERO,
    isReleased: params.isReleased ?? false,
    fireControlSolutionBp: params.fireControlSolutionBp ?? SafeInt(10_000),
    timeToImpactMs: params.timeToImpactMs ?? SafeInt(120_000),
    formationSize: params.formationSize ?? SafeInt(1),
    cohesionBp: params.cohesionBp ?? SafeInt(10_000),
    defensiveSusceptibilityBp: params.defensiveSusceptibilityBp ?? SafeInt(10_000),
    contentVersion: params.contentVersion ?? AIR_DEFENSE_MODEL_VERSION,
    contentHash:
      params.contentHash ?? "0000000000000000000000000000000000000000000000000000000000000000",
  };

  // Validate the merged result with the strict schema.
  return validateAirDefenseAttack(merged as unknown as AirDefenseAttack);
}

// ---- isValidAttackType ----

export function isValidAttackType(attackType: string): attackType is AttackTypeId {
  return ATTACK_TYPES.includes(attackType as AttackTypeId);
}
