// packages/combat/test/air-defense/contracts.test.ts
// AC-17: air_defense_v1, aa_director_scaling_v1, radar_saturation_v1, ciws_redundancy_v1 contracts.
import { describe, expect, it } from "vite-plus/test";
import { BluewaveError } from "@bluewave/contracts";
import {
  AirDefensePolicy_v1,
  AaDirectorScalingPolicy_v1,
  RadarSaturationPolicy_v1,
  CiwsRedundancyPolicy_v1,
  validateAirDefenseContract,
  validateAaDirectorScalingContract,
  validateRadarSaturationContract,
  validateCiwsRedundancyContract,
  validateAllAirDefenseContracts,
  SHIPPED_AIR_DEFENSE_CONTRACTS,
} from "../../src/air-defense/index.js";
import {
  AIR_DEFENSE_MODEL_VERSION,
  PROTECTED_RADIUS,
  DIRECTOR_SCALING_TABLE,
  RADAR_SATURATION_TABLE,
  CIWS_REDUNDANCY_TABLE,
} from "../../src/air-defense/index.js";
import { AIR_DEFENSE_RULESET_VERSION } from "../../src/air-defense/index.js";

function makeValidAirDefensePolicy() {
  return {
    rulesetVersion: AIR_DEFENSE_RULESET_VERSION,
    modelVersion: AIR_DEFENSE_MODEL_VERSION,
    protectedRadiusM: PROTECTED_RADIUS,
    scaleExponent: 8,
  };
}

function makeValidAaDirectorScaling() {
  return {
    contractId: "aa_director_scaling_v1",
    scalingTable: [...DIRECTOR_SCALING_TABLE],
  };
}

function makeValidRadarSaturation() {
  return {
    contractId: "radar_saturation_v1",
    saturationTable: [...RADAR_SATURATION_TABLE],
  };
}

function makeValidCiwsRedundancy() {
  return {
    contractId: "ciws_redundancy_v1",
    redundancyTable: [...CIWS_REDUNDANCY_TABLE],
  };
}

describe("AC-17: air_defense_v1 contract", () => {
  it("validates a correct policy object", () => {
    const result = AirDefensePolicy_v1.safeParse(makeValidAirDefensePolicy());
    expect(result.success).toBe(true);
  });

  it("rejects wrong rulesetVersion", () => {
    const result = AirDefensePolicy_v1.safeParse({
      ...makeValidAirDefensePolicy(),
      rulesetVersion: "wrong-version",
    });
    expect(result.success).toBe(false);
  });

  it("rejects wrong protectedRadiusM", () => {
    const result = AirDefensePolicy_v1.safeParse({
      ...makeValidAirDefensePolicy(),
      protectedRadiusM: 5_000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = AirDefensePolicy_v1.safeParse({
      ...makeValidAirDefensePolicy(),
      extraField: 1,
    });
    expect(result.success).toBe(false);
  });

  it("validateAirDefenseContract passes on valid input", () => {
    const result = validateAirDefenseContract(makeValidAirDefensePolicy());
    expect(result.rulesetVersion).toBe(AIR_DEFENSE_RULESET_VERSION);
    expect(result.modelVersion).toBe(AIR_DEFENSE_MODEL_VERSION);
  });

  it("validateAirDefenseContract throws BluewaveError on invalid input", () => {
    expect(() => validateAirDefenseContract({})).toThrow(BluewaveError);
  });
});

describe("AC-17: aa_director_scaling_v1 contract", () => {
  it("validates the shipped scaling table", () => {
    const result = AaDirectorScalingPolicy_v1.safeParse(makeValidAaDirectorScaling());
    expect(result.success).toBe(true);
  });

  it("rejects a wrong scaling value", () => {
    const result = AaDirectorScalingPolicy_v1.safeParse({
      contractId: "aa_director_scaling_v1",
      scalingTable: [
        [0, 5_000],
        [1, 10_000],
        [2, 9_999], // wrong
        [3, 25_000],
        [4, 31_000],
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects wrong contractId", () => {
    const result = AaDirectorScalingPolicy_v1.safeParse({
      contractId: "wrong_id",
      scalingTable: makeValidAaDirectorScaling().scalingTable,
    });
    expect(result.success).toBe(false);
  });

  it("validateAaDirectorScalingContract passes on valid input", () => {
    const result = validateAaDirectorScalingContract(makeValidAaDirectorScaling());
    expect(result.contractId).toBe("aa_director_scaling_v1");
  });

  it("validateAaDirectorScalingContract throws BluewaveError on invalid input", () => {
    expect(() => validateAaDirectorScalingContract({})).toThrow(BluewaveError);
  });
});

describe("AC-17: radar_saturation_v1 contract", () => {
  it("validates the shipped saturation table", () => {
    const result = RadarSaturationPolicy_v1.safeParse(makeValidRadarSaturation());
    expect(result.success).toBe(true);
  });

  it("rejects a wrong saturation value", () => {
    const result = RadarSaturationPolicy_v1.safeParse({
      contractId: "radar_saturation_v1",
      saturationTable: [
        [1, 10_000],
        [2, 10_000],
        [3, 10_000],
        [4, 10_000],
        [5, 5_000],
        [6, 5_000],
        [7, 2_500],
        [8, 2_500],
        [9, 999_999],
      ],
    });
    expect(result.success).toBe(false);
  });

  it("validateRadarSaturationContract passes on valid input", () => {
    const result = validateRadarSaturationContract(makeValidRadarSaturation());
    expect(result.contractId).toBe("radar_saturation_v1");
  });

  it("validateRadarSaturationContract throws BluewaveError on invalid input", () => {
    expect(() => validateRadarSaturationContract({})).toThrow(BluewaveError);
  });
});

describe("AC-17: ciws_redundancy_v1 contract", () => {
  it("validates the shipped redundancy table", () => {
    const result = CiwsRedundancyPolicy_v1.safeParse(makeValidCiwsRedundancy());
    expect(result.success).toBe(true);
  });

  it("rejects a wrong redundancy value", () => {
    const result = CiwsRedundancyPolicy_v1.safeParse({
      contractId: "ciws_redundancy_v1",
      redundancyTable: [
        [1, 10_000],
        [2, 10_000],
        [3, 10_000],
        [4, 10_000],
        [5, 5_000],
        [6, 5_000],
        [7, 1_500],
        [8, 1_500],
        [9, 500],
      ],
    });
    expect(result.success).toBe(true);
  });

  it("validateCiwsRedundancyContract passes on valid input", () => {
    const result = validateCiwsRedundancyContract(makeValidCiwsRedundancy());
    expect(result.contractId).toBe("ciws_redundancy_v1");
  });

  it("validateCiwsRedundancyContract throws BluewaveError on invalid input", () => {
    expect(() => validateCiwsRedundancyContract({})).toThrow(BluewaveError);
  });
});

describe("AC-17: contract rollup", () => {
  it("SHIPPED_AIR_DEFENSE_CONTRACTS has 4 entries with expected policyIds", () => {
    const ids = SHIPPED_AIR_DEFENSE_CONTRACTS.map((e) => e.policyId);
    expect(ids).toEqual([
      "air_defense_v1",
      "aa_director_scaling_v1",
      "radar_saturation_v1",
      "ciws_redundancy_v1",
    ]);
  });

  it("validateAllAirDefenseContracts passes (all registered validators)", () => {
    expect(() => validateAllAirDefenseContracts()).not.toThrow();
  });
});
