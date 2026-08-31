// packages/combat/src/air-defense/contracts.ts
// D-4 M4 Aviation: Air Defense — AC-17 four contracts with fail-closed validate guards.
// Parallel to air-combat/contracts.ts pattern.
import { z } from "zod";
import { BluewaveError } from "@bluewave/contracts";
import {
  AIR_DEFENSE_MODEL_VERSION,
  DIRECTOR_SCALING_TABLE,
  RADAR_SATURATION_TABLE,
  CIWS_REDUNDANCY_TABLE,
  PROTECTED_RADIUS,
  ENGAGEMENT_FORMULA_SCALE_EXPONENT,
} from "./constants.js";
import { AIR_DEFENSE_INVARIANT_FAILED } from "./reason-codes.js";
import { AIR_DEFENSE_RULESET_VERSION } from "./air-defense-system-definition.js";

// ---- air_defense_v1: model/version policy contract ----

export const AirDefensePolicy_v1 = z
  .object({
    rulesetVersion: z.literal(AIR_DEFENSE_RULESET_VERSION),
    modelVersion: z.literal(AIR_DEFENSE_MODEL_VERSION),
    protectedRadiusM: z.literal(PROTECTED_RADIUS),
    scaleExponent: z.literal(ENGAGEMENT_FORMULA_SCALE_EXPONENT),
  })
  .strict();

export type AirDefensePolicyContract = z.infer<typeof AirDefensePolicy_v1>;

export function validateAirDefenseContract(value: unknown): AirDefensePolicyContract {
  const result = AirDefensePolicy_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(AIR_DEFENSE_INVARIANT_FAILED, {
      code: AIR_DEFENSE_INVARIANT_FAILED,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "contract validation failed",
      value,
    });
  }
  return result.data;
}

// ---- aa_director_scaling_v1: director scaling table contract ----

const directorScalingTupleLiterals = DIRECTOR_SCALING_TABLE.map(([idx, val]) =>
  z.tuple([z.literal(idx), z.literal(val)]),
);

export const AaDirectorScalingPolicy_v1 = z
  .object({
    contractId: z.literal("aa_director_scaling_v1"),
    scalingTable: z.tuple(
      directorScalingTupleLiterals as unknown as [
        z.ZodTuple<[z.ZodLiteral<0>, z.ZodLiteral<5_000>]>,
        z.ZodTuple<[z.ZodLiteral<1>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<2>, z.ZodLiteral<18_000>]>,
        z.ZodTuple<[z.ZodLiteral<3>, z.ZodLiteral<25_000>]>,
        z.ZodTuple<[z.ZodLiteral<4>, z.ZodLiteral<31_000>]>,
      ],
    ),
  })
  .strict();

export type AaDirectorScalingContract = z.infer<typeof AaDirectorScalingPolicy_v1>;

export function validateAaDirectorScalingContract(value: unknown): AaDirectorScalingContract {
  const result = AaDirectorScalingPolicy_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(AIR_DEFENSE_INVARIANT_FAILED, {
      code: AIR_DEFENSE_INVARIANT_FAILED,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "aa_director_scaling contract validation failed",
      value,
    });
  }
  return result.data;
}

// ---- radar_saturation_v1: radar saturation table contract ----

const radarSaturationTupleLiterals = RADAR_SATURATION_TABLE.map(([idx, val]) =>
  z.tuple([z.literal(idx), z.literal(val)]),
);

export const RadarSaturationPolicy_v1 = z
  .object({
    contractId: z.literal("radar_saturation_v1"),
    saturationTable: z.tuple(
      radarSaturationTupleLiterals as unknown as [
        z.ZodTuple<[z.ZodLiteral<1>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<2>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<3>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<4>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<5>, z.ZodLiteral<5_000>]>,
        z.ZodTuple<[z.ZodLiteral<6>, z.ZodLiteral<5_000>]>,
        z.ZodTuple<[z.ZodLiteral<7>, z.ZodLiteral<2_500>]>,
        z.ZodTuple<[z.ZodLiteral<8>, z.ZodLiteral<2_500>]>,
        z.ZodTuple<[z.ZodLiteral<9>, z.ZodLiteral<500>]>,
      ],
    ),
  })
  .strict();

export type RadarSaturationContract = z.infer<typeof RadarSaturationPolicy_v1>;

export function validateRadarSaturationContract(value: unknown): RadarSaturationContract {
  const result = RadarSaturationPolicy_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(AIR_DEFENSE_INVARIANT_FAILED, {
      code: AIR_DEFENSE_INVARIANT_FAILED,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "radar_saturation contract validation failed",
      value,
    });
  }
  return result.data;
}

// ---- ciws_redundancy_v1: CIWS redundancy table contract ----

const ciwsRedundancyTupleLiterals = CIWS_REDUNDANCY_TABLE.map(([idx, val]) =>
  z.tuple([z.literal(idx), z.literal(val)]),
);

export const CiwsRedundancyPolicy_v1 = z
  .object({
    contractId: z.literal("ciws_redundancy_v1"),
    redundancyTable: z.tuple(
      ciwsRedundancyTupleLiterals as unknown as [
        z.ZodTuple<[z.ZodLiteral<1>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<2>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<3>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<4>, z.ZodLiteral<10_000>]>,
        z.ZodTuple<[z.ZodLiteral<5>, z.ZodLiteral<5_000>]>,
        z.ZodTuple<[z.ZodLiteral<6>, z.ZodLiteral<5_000>]>,
        z.ZodTuple<[z.ZodLiteral<7>, z.ZodLiteral<1_500>]>,
        z.ZodTuple<[z.ZodLiteral<8>, z.ZodLiteral<1_500>]>,
        z.ZodTuple<[z.ZodLiteral<9>, z.ZodLiteral<500>]>,
      ],
    ),
  })
  .strict();

export type CiwsRedundancyContract = z.infer<typeof CiwsRedundancyPolicy_v1>;

export function validateCiwsRedundancyContract(value: unknown): CiwsRedundancyContract {
  const result = CiwsRedundancyPolicy_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(AIR_DEFENSE_INVARIANT_FAILED, {
      code: AIR_DEFENSE_INVARIANT_FAILED,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "ciws_redundancy contract validation failed",
      value,
    });
  }
  return result.data;
}
