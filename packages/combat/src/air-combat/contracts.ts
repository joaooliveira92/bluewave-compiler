//packages/combat/src/air-combat/contracts.ts
// D-3 M4 Aviation: CAP & Strikes — AC-20 air_combat_v1 contract with 6-factor manifest.
// Parallel to aircraft/contracts.ts pattern.
import { z } from "zod";
import { BluewaveError } from "@bluewave/contracts";
import {
  AIR_COMBAT_BASIS_POINTS,
  AIR_COMBAT_EXCHANGE_FACTOR_KEYS,
  AIR_COMBAT_RULESET_VERSION,
  AIR_COMBAT_FORMULA_VERSION,
  AIR_COMBAT_DISRUPTION_MIN_BP,
  AIR_COMBAT_ALTITUDE_NEUTRAL_BP,
  AIR_COMBAT_ALTITUDE_ADVANTAGE_BP,
  AIR_COMBAT_ALTITUDE_DISADVANTAGE_BP,
  AIR_COMBAT_SURPRISE_FIRST_PASS_BP,
  AIR_COMBAT_SURPRISE_SUBSEQUENT_BP,
  AIR_COMBAT_NUMERICAL_MIN_BP,
  AIR_COMBAT_DESTROYED_DAMAGE_RATIO_BP,
} from "./constants.js";
import { AIR_COMBAT_INVARIANT_FAILED } from "./reasonCodes.js";

const factorKeyLiterals = AIR_COMBAT_EXCHANGE_FACTOR_KEYS.map((k) => z.literal(k));

export const AirCombatPolicy_v1 = z.object({
  rulesetVersion: z.literal(AIR_COMBAT_RULESET_VERSION),
  formulaVersion: z.literal(AIR_COMBAT_FORMULA_VERSION),
  basisPoints: z.literal(AIR_COMBAT_BASIS_POINTS),
  factorKeys: z.tuple(
    factorKeyLiterals as unknown as [
      z.ZodLiteral<(typeof AIR_COMBAT_EXCHANGE_FACTOR_KEYS)[0]>,
      z.ZodLiteral<(typeof AIR_COMBAT_EXCHANGE_FACTOR_KEYS)[1]>,
      z.ZodLiteral<(typeof AIR_COMBAT_EXCHANGE_FACTOR_KEYS)[2]>,
      z.ZodLiteral<(typeof AIR_COMBAT_EXCHANGE_FACTOR_KEYS)[3]>,
      z.ZodLiteral<(typeof AIR_COMBAT_EXCHANGE_FACTOR_KEYS)[4]>,
      z.ZodLiteral<(typeof AIR_COMBAT_EXCHANGE_FACTOR_KEYS)[5]>,
    ],
  ),
  disruptionMinBp: z.literal(AIR_COMBAT_DISRUPTION_MIN_BP),
  altitudeNeutralBp: z.literal(AIR_COMBAT_ALTITUDE_NEUTRAL_BP),
  altitudeAdvantageBp: z.literal(AIR_COMBAT_ALTITUDE_ADVANTAGE_BP),
  altitudeDisadvantageBp: z.literal(AIR_COMBAT_ALTITUDE_DISADVANTAGE_BP),
  surpriseFirstPassBp: z.literal(AIR_COMBAT_SURPRISE_FIRST_PASS_BP),
  surpriseSubsequentBp: z.literal(AIR_COMBAT_SURPRISE_SUBSEQUENT_BP),
  numericalMinBp: z.literal(AIR_COMBAT_NUMERICAL_MIN_BP),
  destroyedDamageRatioBp: z.literal(AIR_COMBAT_DESTROYED_DAMAGE_RATIO_BP),
});

export type AirCombatPolicyContract = z.infer<typeof AirCombatPolicy_v1>;

export function validateAirCombatContract(value: unknown): AirCombatPolicyContract {
  const result = AirCombatPolicy_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(AIR_COMBAT_INVARIANT_FAILED, {
      code: AIR_COMBAT_INVARIANT_FAILED,
      field: result.error.issues[0]?.path.join(".") ?? "unknown",
      reason: result.error.issues[0]?.message ?? "contract validation failed",
      value,
    });
  }
  return result.data;
}

export const SHIPPED_AIR_COMBAT_CONTRACT = {
  policy: AirCombatPolicy_v1,
} as const;
