// packages/combat/src/air-defense/contracts.ts
// D-4 M4 Aviation: Air Defense — AC-17 versioned contracts (fail-closed Zod literals).
// Parallel to air-combat/contracts.ts pattern.
//
// Four shipped contracts (registry order in contractRollup.js):
//   air_defense_v1           — the full ruleset manifest (layers, formula, tables, disruption,
//                               §29.8 guaranteed light-AA disruption policy, §7/§8/§21 anchors,
//                               §3 system-definition schema keys, §28 reason-code catalog);
//   aa_director_scaling_v1   — §12 director scaling table + shipped normal-scaling cap;
//   radar_saturation_v1      — §14 radar-directed medium-AA marginal saturation table;
//   ciws_redundancy_v1       — §16 CIWS marginal redundancy table.
//
// Every schema is a strict Zod object whose values are LITERALS pinned to the shipped
// constants; the shipped value factories build the exact same values FROM those constants,
// so the acceptance gate (validateAllAirDefenseContracts + the pinned golden hash) proves
// the schema and the shipped content can never silently drift apart.

import { z } from "zod";
import { BluewaveError } from "@bluewave/contracts";
import {
  AIR_DEFENSE_BASIS_POINTS,
  AIR_DEFENSE_FORMULA_VERSION,
  AIR_DEFENSE_MODEL_VERSION,
  CIWS_REDUNDANCY_TABLE,
  DIRECTOR_SCALING_TABLE,
  DISRUPTION_MULTIPLIERS,
  FORMULA_DENOMINATOR,
  FORMULA_EXPONENT,
  FULL_DEFENSE_LAYER_ORDER,
  HEAVY_AA_PROTECTED_RADIUS_M,
  HEAVY_AA_PROTECTED_RADIUS_NM,
  LOCAL_CONTROL_MULTIPLIER_BP,
  MEDIUM_AA_FIRE_CONTROL_MINIMUM_BP,
  RADAR_SATURATION_TABLE,
} from "./constants.js";
import { DIRECTOR_NORMAL_SCALING_CAP } from "./director-scaling.js";
import { ENGAGEMENT_FACTOR_SLOT_NAMES } from "./engagement.js";
import { DEFENSE_LAYER_ORDER } from "./layer-resolution.js";
import {
  AIR_DEFENSE_RULESET_VERSION,
  AIR_DEFENSE_SYSTEM_DEFINITION_FIELD_KEYS,
} from "./air-defense-system-definition.js";
import {
  AIR_DEFENSE_INVARIANT_FAILED,
  AIR_DEFENSE_REASON_CODES_VERSION,
  AIR_DEFENSE_SHIPPED_REASON_CODE_LIST,
} from "./reasonCodes.js";

// ---- Policy ids ----

export const AIR_DEFENSE_CONTRACT_POLICY_ID = "air_defense_v1" as const;
export const AIR_DEFENSE_DIRECTOR_SCALING_POLICY_ID = "aa_director_scaling_v1" as const;
export const AIR_DEFENSE_RADAR_SATURATION_POLICY_ID = "radar_saturation_v1" as const;
export const AIR_DEFENSE_CIWS_REDUNDANCY_POLICY_ID = "ciws_redundancy_v1" as const;

// ---- Tuple-of-literals schema builders ----
// Build strict literal tuples straight from the `as const` shipped constants, so the schema
// can never name a value the shipped sources do not contain (and vice versa).

type LiteralStringTupleSchema<T extends readonly string[]> = {
  [K in keyof T]: z.ZodLiteral<T[K]>;
};

type MutablePairOf<P extends readonly [number, number]> = { -readonly [K in keyof P]: P[K] };

type LiteralPairTupleSchema<T extends readonly (readonly [number, number])[]> = {
  [K in keyof T]: z.ZodType<MutablePairOf<T[K]>>;
};

function literalStringTuple<T extends readonly string[]>(values: T) {
  return z.tuple(
    values.map((v) => z.literal(v)) as unknown as LiteralStringTupleSchema<T> &
      [z.ZodTypeAny, ...z.ZodTypeAny[]],
  );
}

function literalPairTuple<T extends readonly (readonly [number, number])[]>(rows: T) {
  return z.tuple(
    rows.map(([a, b]) =>
      z.tuple([z.literal(a), z.literal(b)]),
    ) as unknown as LiteralPairTupleSchema<T> & [z.ZodTypeAny, ...z.ZodTypeAny[]],
  );
}

// ---- Mutable copy builders for the SHIPPED values (same shape as the tuple schemas) ----
// The contract values are plain mutable tuples/pairs whose literals come from the constants.

type MutableStringTuple<T extends readonly string[]> = { -readonly [K in keyof T]: T[K] };

type MutablePairTuple<T extends readonly (readonly [number, number])[]> = {
  -readonly [K in keyof T]: T[K] extends readonly [infer A, infer B] ? [A, B] : never;
};

function copyStrings<T extends readonly string[]>(values: T): MutableStringTuple<T> {
  return [...values] as MutableStringTuple<T>;
}

function copyPairs<T extends readonly (readonly [number, number])[]>(rows: T): MutablePairTuple<T> {
  return rows.map((row) => [row[0], row[1]] as MutablePairTuple<T>[number]) as MutablePairTuple<T>;
}

// ---- Disruption multiplier pairs (§6) ----

/** Exact §6 severity multiplier pairs (accuracy, cohesion) in basis points. */
export const DisruptionMultipliers_v1 = z
  .object({
    LIGHT: z.object({ accuracyBp: z.literal(9_000), cohesionBp: z.literal(9_500) }).strict(),
    MODERATE: z.object({ accuracyBp: z.literal(7_500), cohesionBp: z.literal(8_500) }).strict(),
    SEVERE: z.object({ accuracyBp: z.literal(5_000), cohesionBp: z.literal(6_500) }).strict(),
    MISSION_ABORT: z.object({ accuracyBp: z.literal(0), cohesionBp: z.literal(0) }).strict(),
  })
  .strict();

// ---- air_defense_v1 ----

export const AirDefensePolicy_v1 = z
  .object({
    policyId: z.literal(AIR_DEFENSE_CONTRACT_POLICY_ID),
    rulesetVersion: z.literal(AIR_DEFENSE_RULESET_VERSION),
    formulaVersion: z.literal(AIR_DEFENSE_FORMULA_VERSION),
    reasonCodesVersion: z.literal(AIR_DEFENSE_REASON_CODES_VERSION),
    basisPoints: z.literal(AIR_DEFENSE_BASIS_POINTS),
    /** §1 full 8-layer order (CAP … CIWS_TERMINAL_DEFENSE) — also the §27.2 ordering key. */
    layerOrder: literalStringTuple(FULL_DEFENSE_LAYER_ORDER),
    /** The shipped 4-layer AA resolution subset (layer-resolution.js). */
    aaLayerOrder: literalStringTuple(DEFENSE_LAYER_ORDER),
    /** §19 nine-factor product order (engagement.js ENGAGEMENT_FACTOR_SLOT_NAMES). */
    factorKeys: literalStringTuple(ENGAGEMENT_FACTOR_SLOT_NAMES),
    formulaDenominator: z.literal(FORMULA_DENOMINATOR),
    formulaExponent: z.literal(FORMULA_EXPONENT),
    /** §19 line 326: the exact rational product MUST be rounded once with FLOOR. */
    floorOnce: z.literal(true),
    directorScalingTable: literalPairTuple(DIRECTOR_SCALING_TABLE),
    radarSaturationTable: literalPairTuple(RADAR_SATURATION_TABLE),
    ciwsRedundancyTable: literalPairTuple(CIWS_REDUNDANCY_TABLE),
    disruptionMultipliers: DisruptionMultipliers_v1,
    /** §29.8: every eligible light-AA system receives at least one disruption check of one
     *  authoritative substep — the shipped policy grants exactly one substep. */
    guaranteedLightAaDisruption: z
      .object({ exactlyOneAuthoritativeSubstep: z.literal(1) })
      .strict(),
    /** §7: heavy AA protects its own ship and nearby ships only within exactly five nm. */
    protectedRadiusNm: z.literal(HEAVY_AA_PROTECTED_RADIUS_NM),
    protectedRadiusM: z.literal(HEAVY_AA_PROTECTED_RADIUS_M),
    /** §8: medium AA may engage only when the fire-control solution is at least 4_000 bp. */
    mediumAaFireControlMinimumBp: z.literal(MEDIUM_AA_FIRE_CONTROL_MINIMUM_BP),
    /** §21: intact gun + destroyed director → local control at exactly 5_000 bp when supported. */
    localControlMultiplierBp: z.literal(LOCAL_CONTROL_MULTIPLIER_BP),
    /** §3: the exact system-definition schema key surface (ADR-0042 decision 12). */
    systemDefinitionFieldKeys: literalStringTuple(AIR_DEFENSE_SYSTEM_DEFINITION_FIELD_KEYS),
    /** §28: the exact 20-code reason catalog in §28 document order. */
    reasonCodes: literalStringTuple(AIR_DEFENSE_SHIPPED_REASON_CODE_LIST),
  })
  .strict();

export type AirDefensePolicyContract = z.infer<typeof AirDefensePolicy_v1>;

// ---- aa_director_scaling_v1 ----

export const AaDirectorScalingPolicy_v1 = z
  .object({
    policyId: z.literal(AIR_DEFENSE_DIRECTOR_SCALING_POLICY_ID),
    rulesetVersion: z.literal(AIR_DEFENSE_RULESET_VERSION),
    /** §12 shipped normal-scaling cap — exactly 4 (the last scaling-table row). */
    normalScalingCap: z.literal(DIRECTOR_NORMAL_SCALING_CAP),
    scalingTable: literalPairTuple(DIRECTOR_SCALING_TABLE),
  })
  .strict();

export type AaDirectorScalingPolicyContract = z.infer<typeof AaDirectorScalingPolicy_v1>;

// ---- radar_saturation_v1 ----

export const RadarSaturationPolicy_v1 = z
  .object({
    policyId: z.literal(AIR_DEFENSE_RADAR_SATURATION_POLICY_ID),
    rulesetVersion: z.literal(AIR_DEFENSE_RULESET_VERSION),
    /** §14 marginal schedule: 1-4 → 10_000, 5-6 → 5_000, 7-8 → 2_500, 9+ → 500. */
    saturationTable: literalPairTuple(RADAR_SATURATION_TABLE),
  })
  .strict();

export type RadarSaturationPolicyContract = z.infer<typeof RadarSaturationPolicy_v1>;

// ---- ciws_redundancy_v1 ----

export const CiwsRedundancyPolicy_v1 = z
  .object({
    policyId: z.literal(AIR_DEFENSE_CIWS_REDUNDANCY_POLICY_ID),
    rulesetVersion: z.literal(AIR_DEFENSE_RULESET_VERSION),
    /** §16 marginal schedule: 1-4 → 10_000, 5-6 → 5_000, 7-8 → 1_500, 9+ → 500. */
    redundancyTable: literalPairTuple(CIWS_REDUNDANCY_TABLE),
  })
  .strict();

export type CiwsRedundancyPolicyContract = z.infer<typeof CiwsRedundancyPolicy_v1>;

// ---- Shipped value factories (built FROM the constants) ----

export function makeValidAirDefensePolicy_v1(): AirDefensePolicyContract {
  return {
    policyId: AIR_DEFENSE_CONTRACT_POLICY_ID,
    rulesetVersion: AIR_DEFENSE_RULESET_VERSION,
    formulaVersion: AIR_DEFENSE_FORMULA_VERSION,
    reasonCodesVersion: AIR_DEFENSE_REASON_CODES_VERSION,
    basisPoints: AIR_DEFENSE_BASIS_POINTS,
    layerOrder: copyStrings(FULL_DEFENSE_LAYER_ORDER),
    aaLayerOrder: copyStrings(DEFENSE_LAYER_ORDER),
    factorKeys: copyStrings(ENGAGEMENT_FACTOR_SLOT_NAMES),
    formulaDenominator: FORMULA_DENOMINATOR,
    formulaExponent: FORMULA_EXPONENT,
    floorOnce: true,
    directorScalingTable: copyPairs(DIRECTOR_SCALING_TABLE),
    radarSaturationTable: copyPairs(RADAR_SATURATION_TABLE),
    ciwsRedundancyTable: copyPairs(CIWS_REDUNDANCY_TABLE),
    disruptionMultipliers: {
      LIGHT: {
        accuracyBp: DISRUPTION_MULTIPLIERS.LIGHT.accuracyBp,
        cohesionBp: DISRUPTION_MULTIPLIERS.LIGHT.cohesionBp,
      },
      MODERATE: {
        accuracyBp: DISRUPTION_MULTIPLIERS.MODERATE.accuracyBp,
        cohesionBp: DISRUPTION_MULTIPLIERS.MODERATE.cohesionBp,
      },
      SEVERE: {
        accuracyBp: DISRUPTION_MULTIPLIERS.SEVERE.accuracyBp,
        cohesionBp: DISRUPTION_MULTIPLIERS.SEVERE.cohesionBp,
      },
      MISSION_ABORT: {
        accuracyBp: DISRUPTION_MULTIPLIERS.MISSION_ABORT.accuracyBp,
        cohesionBp: DISRUPTION_MULTIPLIERS.MISSION_ABORT.cohesionBp,
      },
    },
    guaranteedLightAaDisruption: { exactlyOneAuthoritativeSubstep: 1 },
    protectedRadiusNm: HEAVY_AA_PROTECTED_RADIUS_NM,
    protectedRadiusM: HEAVY_AA_PROTECTED_RADIUS_M,
    mediumAaFireControlMinimumBp: MEDIUM_AA_FIRE_CONTROL_MINIMUM_BP,
    localControlMultiplierBp: LOCAL_CONTROL_MULTIPLIER_BP,
    systemDefinitionFieldKeys: copyStrings(AIR_DEFENSE_SYSTEM_DEFINITION_FIELD_KEYS),
    reasonCodes: copyStrings(AIR_DEFENSE_SHIPPED_REASON_CODE_LIST),
  };
}

export function makeValidAaDirectorScalingPolicy_v1(): AaDirectorScalingPolicyContract {
  return {
    policyId: AIR_DEFENSE_DIRECTOR_SCALING_POLICY_ID,
    rulesetVersion: AIR_DEFENSE_RULESET_VERSION,
    normalScalingCap: DIRECTOR_NORMAL_SCALING_CAP,
    scalingTable: copyPairs(DIRECTOR_SCALING_TABLE),
  };
}

export function makeValidRadarSaturationPolicy_v1(): RadarSaturationPolicyContract {
  return {
    policyId: AIR_DEFENSE_RADAR_SATURATION_POLICY_ID,
    rulesetVersion: AIR_DEFENSE_RULESET_VERSION,
    saturationTable: copyPairs(RADAR_SATURATION_TABLE),
  };
}

export function makeValidCiwsRedundancyPolicy_v1(): CiwsRedundancyPolicyContract {
  return {
    policyId: AIR_DEFENSE_CIWS_REDUNDANCY_POLICY_ID,
    rulesetVersion: AIR_DEFENSE_RULESET_VERSION,
    redundancyTable: copyPairs(CIWS_REDUNDANCY_TABLE),
  };
}

// ---- Fail-closed validate*Contract guards ----
// Every validator throws a BluewaveError tagged with the canonical §28 invariant code when
// the value deviates from the pinned literals — never clamps, never silently accepts.

function contractFailure(policyId: string, result: z.ZodSafeParseError<unknown>): BluewaveError {
  return new BluewaveError(`${policyId} contract validation failed`, {
    code: AIR_DEFENSE_INVARIANT_FAILED,
    policyId,
    field: result.error.issues[0]?.path.join(".") ?? "unknown",
    reason: result.error.issues[0]?.message ?? "contract validation failed",
  });
}

export function validateAirDefenseContract(value: unknown): AirDefensePolicyContract {
  const result = AirDefensePolicy_v1.safeParse(value);
  if (!result.success) throw contractFailure(AIR_DEFENSE_CONTRACT_POLICY_ID, result);
  return result.data;
}

export function validateAaDirectorScalingContract(value: unknown): AaDirectorScalingPolicyContract {
  const result = AaDirectorScalingPolicy_v1.safeParse(value);
  if (!result.success) throw contractFailure(AIR_DEFENSE_DIRECTOR_SCALING_POLICY_ID, result);
  return result.data;
}

export function validateRadarSaturationContract(value: unknown): RadarSaturationPolicyContract {
  const result = RadarSaturationPolicy_v1.safeParse(value);
  if (!result.success) throw contractFailure(AIR_DEFENSE_RADAR_SATURATION_POLICY_ID, result);
  return result.data;
}

export function validateCiwsRedundancyContract(value: unknown): CiwsRedundancyPolicyContract {
  const result = CiwsRedundancyPolicy_v1.safeParse(value);
  if (!result.success) throw contractFailure(AIR_DEFENSE_CIWS_REDUNDANCY_POLICY_ID, result);
  return result.data;
}

// ---- Shipped contract schemas (mirrors air-combat SHIPPED_AIR_COMBAT_CONTRACT) ----
// MODEL_VERSION ties the manifest to the shipped content version; the four policy ids are
// the registry keys used by the contract rollup.
export const SHIPPED_AIR_DEFENSE_CONTRACT = {
  modelVersion: AIR_DEFENSE_MODEL_VERSION,
  policyIds: [
    AIR_DEFENSE_CONTRACT_POLICY_ID,
    AIR_DEFENSE_DIRECTOR_SCALING_POLICY_ID,
    AIR_DEFENSE_RADAR_SATURATION_POLICY_ID,
    AIR_DEFENSE_CIWS_REDUNDANCY_POLICY_ID,
  ] as const,
} as const;
