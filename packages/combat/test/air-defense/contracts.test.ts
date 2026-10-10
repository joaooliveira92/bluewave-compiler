// packages/combat/test/air-defense/contracts.test.ts
// AC-17 (INC-5): air_defense_v1 + aa_director_scaling_v1 + radar_saturation_v1 +
// ciws_redundancy_v1 — strict Zod literal schemas, fail-closed validate*Contract guards,
// the 4-entry registry in canonical order, and a pinned golden hash of the shipped values.
import { describe, expect, it } from "vite-plus/test";
import { BluewaveError } from "@bluewave/contracts";
import { createEnvelope } from "@bluewave/deterministic";
import {
  AirDefensePolicy_v1,
  AaDirectorScalingPolicy_v1,
  RadarSaturationPolicy_v1,
  CiwsRedundancyPolicy_v1,
  validateAirDefenseContract,
  validateAaDirectorScalingContract,
  validateRadarSaturationContract,
  validateCiwsRedundancyContract,
  makeValidAirDefensePolicy_v1,
  makeValidAaDirectorScalingPolicy_v1,
  makeValidRadarSaturationPolicy_v1,
  makeValidCiwsRedundancyPolicy_v1,
  validateAllAirDefenseContracts,
  SHIPPED_AIR_DEFENSE_CONTRACTS,
  AIR_DEFENSE_CONTRACT_POLICY_ID,
  AIR_DEFENSE_DIRECTOR_SCALING_POLICY_ID,
  AIR_DEFENSE_RADAR_SATURATION_POLICY_ID,
  AIR_DEFENSE_CIWS_REDUNDANCY_POLICY_ID,
  AIR_DEFENSE_INVARIANT_FAILED,
  AIR_DEFENSE_SHIPPED_REASON_CODE_LIST,
  AIR_DEFENSE_SYSTEM_DEFINITION_FIELD_KEYS,
  ENGAGEMENT_FACTOR_SLOT_NAMES,
  DISRUPTION_MULTIPLIERS,
} from "../../src/air-defense/index.js";

/** Pinned golden hash of the canonical serialization of the 4 shipped contract values.
 *  Regenerate ONLY as a deliberate versioned release change (artifact: module golden, new in
 *  INC-5) — the engine goldens in golden/hashes.json are untouched by this contract. */
const AIR_DEFENSE_CONTRACTS_GOLDEN_HASH =
  "92d3008abba718f0198180411ebd410b2beebbf25209426bf0ad1396622679e9";

describe("AC-17: versioned air-defense contracts", () => {
  describe("air_defense_v1", () => {
    it("validates the shipped manifest", () => {
      const result = AirDefensePolicy_v1.safeParse(makeValidAirDefensePolicy_v1());
      expect(result.success).toBe(true);
    });

    it("rejects a wrong rulesetVersion", () => {
      const result = AirDefensePolicy_v1.safeParse({
        ...makeValidAirDefensePolicy_v1(),
        rulesetVersion: "air_defense_v2",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a wrong basisPoints value", () => {
      const result = AirDefensePolicy_v1.safeParse({
        ...makeValidAirDefensePolicy_v1(),
        basisPoints: 100,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a truncated layer order", () => {
      const valid = makeValidAirDefensePolicy_v1();
      const result = AirDefensePolicy_v1.safeParse({
        ...valid,
        layerOrder: valid.layerOrder.slice(0, 4),
      });
      expect(result.success).toBe(false);
    });

    it("rejects a mismatched reason-code catalog (one code swapped)", () => {
      const valid = makeValidAirDefensePolicy_v1();
      const tampered: string[] = [...valid.reasonCodes];
      tampered[19] = "NOT_A_SHIPPED_CODE";
      const result = AirDefensePolicy_v1.safeParse({ ...valid, reasonCodes: tampered });
      expect(result.success).toBe(false);
    });

    it("rejects an extra system-definition field key", () => {
      const valid = makeValidAirDefensePolicy_v1();
      const result = AirDefensePolicy_v1.safeParse({
        ...valid,
        systemDefinitionFieldKeys: [...valid.systemDefinitionFieldKeys, "extraField"],
      });
      expect(result.success).toBe(false);
    });

    it("validateAirDefenseContract passes the shipped manifest", () => {
      expect(validateAirDefenseContract(makeValidAirDefensePolicy_v1()).policyId).toBe(
        AIR_DEFENSE_CONTRACT_POLICY_ID,
      );
    });

    it("validateAirDefenseContract throws BluewaveError tagged AIR_DEFENSE_INVARIANT_FAILED", () => {
      let caught: BluewaveError | null = null;
      try {
        validateAirDefenseContract({});
      } catch (error) {
        caught = error as BluewaveError;
      }
      expect(caught).toBeInstanceOf(BluewaveError);
      expect(caught?.context.code).toBe(AIR_DEFENSE_INVARIANT_FAILED);
    });
  });

  describe("aa_director_scaling_v1", () => {
    it("validates the shipped scaling table and cap", () => {
      const result = AaDirectorScalingPolicy_v1.safeParse(makeValidAaDirectorScalingPolicy_v1());
      expect(result.success).toBe(true);
    });

    it("rejects a wrong normalScalingCap literal", () => {
      const result = AaDirectorScalingPolicy_v1.safeParse({
        ...makeValidAaDirectorScalingPolicy_v1(),
        normalScalingCap: 3,
      });
      expect(result.success).toBe(false);
    });

    it("rejects a tampered table row value", () => {
      const valid = makeValidAaDirectorScalingPolicy_v1();
      const rows = valid.scalingTable.map((row: readonly [number, number]) => [...row]);
      rows[0] = [0, 9_999];
      const result = AaDirectorScalingPolicy_v1.safeParse({ ...valid, scalingTable: rows });
      expect(result.success).toBe(false);
    });

    it("validateAaDirectorScalingContract fail-closed", () => {
      expect(() =>
        validateAaDirectorScalingContract(makeValidAaDirectorScalingPolicy_v1()),
      ).not.toThrow();
      expect(() => validateAaDirectorScalingContract({ normalScalingCap: 7 })).toThrow(
        BluewaveError,
      );
    });
  });

  describe("radar_saturation_v1", () => {
    it("validates the shipped §14 marginal schedule", () => {
      const result = RadarSaturationPolicy_v1.safeParse(makeValidRadarSaturationPolicy_v1());
      expect(result.success).toBe(true);
    });

    it("rejects a wrong §14 marginal value", () => {
      const valid = makeValidRadarSaturationPolicy_v1();
      const rows = valid.saturationTable.map((row: readonly [number, number]) => [...row]);
      rows[0] = [1, 9_000];
      const result = RadarSaturationPolicy_v1.safeParse({ ...valid, saturationTable: rows });
      expect(result.success).toBe(false);
    });

    it("validateRadarSaturationContract fail-closed", () => {
      expect(() =>
        validateRadarSaturationContract(makeValidRadarSaturationPolicy_v1()),
      ).not.toThrow();
      expect(() => validateRadarSaturationContract({ saturationTable: [] })).toThrow(BluewaveError);
    });
  });

  describe("ciws_redundancy_v1", () => {
    it("validates the shipped §16 marginal schedule", () => {
      const result = CiwsRedundancyPolicy_v1.safeParse(makeValidCiwsRedundancyPolicy_v1());
      expect(result.success).toBe(true);
    });

    it("rejects a wrong §16 marginal value", () => {
      const valid = makeValidCiwsRedundancyPolicy_v1();
      const rows = valid.redundancyTable.map((row: readonly [number, number]) => [...row]);
      rows[1] = [2, 9_000];
      const result = CiwsRedundancyPolicy_v1.safeParse({ ...valid, redundancyTable: rows });
      expect(result.success).toBe(false);
    });

    it("validateCiwsRedundancyContract fail-closed", () => {
      expect(() =>
        validateCiwsRedundancyContract(makeValidCiwsRedundancyPolicy_v1()),
      ).not.toThrow();
      expect(() => validateCiwsRedundancyContract({ redundancyTable: [[1, 10_000]] })).toThrow(
        BluewaveError,
      );
    });
  });

  describe("registry (contractRollup)", () => {
    it("ships exactly 4 contracts in canonical order", () => {
      expect(SHIPPED_AIR_DEFENSE_CONTRACTS.map((e) => e.policyId)).toEqual([
        AIR_DEFENSE_CONTRACT_POLICY_ID,
        AIR_DEFENSE_DIRECTOR_SCALING_POLICY_ID,
        AIR_DEFENSE_RADAR_SATURATION_POLICY_ID,
        AIR_DEFENSE_CIWS_REDUNDANCY_POLICY_ID,
      ]);
    });

    it("validateAllAirDefenseContracts passes every shipped contract through its own validator", () => {
      expect(() => validateAllAirDefenseContracts()).not.toThrow();
    });
  });

  describe("shipped manifest content (pinned literals)", () => {
    const valid = makeValidAirDefensePolicy_v1();

    it("pins the 8-layer §1 order and the 4-layer AA subset", () => {
      expect(valid.layerOrder).toEqual([
        "CAP",
        "HEAVY_SAM",
        "MEDIUM_SAM",
        "LIGHT_SAM",
        "HEAVY_AA",
        "MEDIUM_AA",
        "LIGHT_AA",
        "CIWS_TERMINAL_DEFENSE",
      ]);
      expect(valid.aaLayerOrder).toEqual([
        "HEAVY_AA",
        "MEDIUM_AA",
        "LIGHT_AA",
        "CIWS_TERMINAL_DEFENSE",
      ]);
    });

    it("pins the §19 nine-factor order", () => {
      expect(valid.factorKeys).toEqual([...ENGAGEMENT_FACTOR_SLOT_NAMES]);
    });

    it("pins the §28 reason-code catalog to the exact 20 shipped codes", () => {
      expect(valid.reasonCodes).toEqual([...AIR_DEFENSE_SHIPPED_REASON_CODE_LIST]);
    });

    it("pins the §3 system-definition schema key surface", () => {
      expect(valid.systemDefinitionFieldKeys).toEqual([
        ...AIR_DEFENSE_SYSTEM_DEFINITION_FIELD_KEYS,
      ]);
    });

    it("pins the §6 disruption multipliers to the shipped constant pairs", () => {
      const expected = Object.fromEntries(
        Object.entries(DISRUPTION_MULTIPLIERS).map(([severity, pair]) => [severity, pair]),
      );
      expect(valid.disruptionMultipliers).toEqual(expected);
    });

    it("pins the §29.8 guaranteed light-AA policy to exactly one authoritative substep", () => {
      expect(valid.guaranteedLightAaDisruption).toEqual({ exactlyOneAuthoritativeSubstep: 1 });
    });

    it("pins the §7 protected radius, §8 fire-control minimum, and §21 local-control multiplier", () => {
      expect(valid.protectedRadiusNm).toBe(5);
      expect(valid.protectedRadiusM).toBe(9_260);
      expect(valid.mediumAaFireControlMinimumBp).toBe(4_000);
      expect(valid.localControlMultiplierBp).toBe(5_000);
    });

    it("pins the §19 formula constants (10_000^8, floor once)", () => {
      expect(valid.formulaDenominator).toBe(10_000);
      expect(valid.formulaExponent).toBe(8);
      expect(valid.floorOnce).toBe(true);
    });
  });

  describe("pinned contract golden hash (module golden, INC-5)", () => {
    it("the canonical serialization of the 4 shipped contracts matches the pinned hash", () => {
      const body = SHIPPED_AIR_DEFENSE_CONTRACTS.map((entry) => ({
        policyId: entry.policyId,
        shippedContract: entry.shippedContract,
      }));
      const envelope = createEnvelope("air-defense-contracts", "inc5", body);
      expect(envelope.bodyHash).toBe(AIR_DEFENSE_CONTRACTS_GOLDEN_HASH);
    });
  });
});
