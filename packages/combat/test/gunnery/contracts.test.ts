import { BluewaveError } from "@bluewave/contracts";
import { describe, expect, it } from "vite-plus/test";
import {
  AMMUNITION_TYPES,
  FIRE_MODES,
  GUN_QUALITY_MAX,
  GUN_QUALITY_TABLE,
  GUNNERY_FORMULA_VERSION,
  GUNNERY_RULESET_VERSION,
  GUNNERY_STATE_INVARIANT_FAILED,
  gunneryAccuracyPolicyId,
  gunneryGunQualityPolicyId,
  gunneryPolicyId,
  gunneryRatePolicyId,
  SHIPPED_GUNNERY_ACCURACY_CONTRACT,
  SHIPPED_GUNNERY_CONTRACT,
  SHIPPED_GUNNERY_RATE_CONTRACT,
  SHIPPED_GUN_QUALITY_CONTRACT,
  type AmmunitionType,
  validateGunneryAccuracyContract,
  validateGunneryContract,
  validateGunneryRateContract,
  validateGunQualityContract,
} from "../../src/gunnery/index.js";

describe("AC-14 seed: gunnery_v1 base contract + validate guard (fail closed)", () => {
  it("ships the *_v1 policy id and SHIPPED_GUNNERY_CONTRACT", () => {
    expect(gunneryPolicyId).toBe("gunnery_v1");
    expect(SHIPPED_GUNNERY_CONTRACT.policyId).toBe("gunnery_v1");
  });

  it("validates the shipped contract without throwing", () => {
    expect(() => validateGunneryContract(SHIPPED_GUNNERY_CONTRACT)).not.toThrow();
  });

  it("fails closed on a mismatched policy id", () => {
    let err: BluewaveError | undefined;
    try {
      validateGunneryContract({ ...SHIPPED_GUNNERY_CONTRACT, policyId: "x" });
    } catch (e) {
      err = e as BluewaveError;
    }
    expect(err).toBeDefined();
    expect(err!.context.code).toBe(GUNNERY_STATE_INVARIANT_FAILED);
  });

  it("fails closed on a tampered scale constant", () => {
    expect(() =>
      validateGunneryContract({ ...SHIPPED_GUNNERY_CONTRACT, basisPointsPerUnit: 999 }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered surface fire-control minimum", () => {
    expect(() =>
      validateGunneryContract({ ...SHIPPED_GUNNERY_CONTRACT, surfaceFireControlMinimumBp: 0 }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered ammunition-type set", () => {
    expect(() =>
      validateGunneryContract({
        ...SHIPPED_GUNNERY_CONTRACT,
        ammunitionTypes: ["HE" as AmmunitionType],
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a null/missing contract", () => {
    expect(() => validateGunneryContract(null)).toThrow(BluewaveError);
    expect(() => validateGunneryContract(undefined)).toThrow(BluewaveError);
  });

  it("fails closed when ruleset/formula versions are drifted", () => {
    expect(() =>
      validateGunneryContract({ ...SHIPPED_GUNNERY_CONTRACT, formulaVersion: "next" }),
    ).toThrow(BluewaveError);
  });

  it("seeds the canonical ammunition types and seven fire modes in the base contract", () => {
    expect([...SHIPPED_GUNNERY_CONTRACT.ammunitionTypes]).toEqual([...AMMUNITION_TYPES]);
    expect([...SHIPPED_GUNNERY_CONTRACT.fireModes]).toEqual([...FIRE_MODES]);
  });
});

describe("AC-14: gunnery_accuracy_v1 subset contract + validate guard (fail closed)", () => {
  it("ships the *_v1 policy id and pins ruleset/formula versions", () => {
    expect(gunneryAccuracyPolicyId).toBe("gunnery_accuracy_v1");
    expect(SHIPPED_GUNNERY_ACCURACY_CONTRACT.policyId).toBe("gunnery_accuracy_v1");
    expect(SHIPPED_GUNNERY_ACCURACY_CONTRACT.rulesetVersion).toBe(GUNNERY_RULESET_VERSION);
    expect(SHIPPED_GUNNERY_ACCURACY_CONTRACT.formulaVersion).toBe(GUNNERY_FORMULA_VERSION);
  });

  it("validates the shipped contract without throwing", () => {
    expect(() => validateGunneryAccuracyContract(SHIPPED_GUNNERY_ACCURACY_CONTRACT)).not.toThrow();
  });

  it("fails closed on a tampered scaleExponent", () => {
    let err: BluewaveError | undefined;
    try {
      validateGunneryAccuracyContract({
        ...SHIPPED_GUNNERY_ACCURACY_CONTRACT,
        scaleExponent: 15,
      });
    } catch (e) {
      err = e as BluewaveError;
    }
    expect(err).toBeDefined();
    expect(err!.context.code).toBe(GUNNERY_STATE_INVARIANT_FAILED);
  });

  it("fails closed on a tampered neutralMultiplierBp", () => {
    expect(() =>
      validateGunneryAccuracyContract({
        ...SHIPPED_GUNNERY_ACCURACY_CONTRACT,
        neutralMultiplierBp: 9_500,
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered basis-point scale", () => {
    expect(() =>
      validateGunneryAccuracyContract({
        ...SHIPPED_GUNNERY_ACCURACY_CONTRACT,
        basisPointsPerUnit: 999,
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered factor manifest", () => {
    expect(() =>
      validateGunneryAccuracyContract({
        ...SHIPPED_GUNNERY_ACCURACY_CONTRACT,
        factorKeys: ["fireControl"],
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered final bound", () => {
    expect(() =>
      validateGunneryAccuracyContract({
        ...SHIPPED_GUNNERY_ACCURACY_CONTRACT,
        finalMaxBp: 9_999,
      }),
    ).toThrow(BluewaveError);
  });
});

describe("AC-14: gunnery_rate_v1 subset contract + validate guard (fail closed)", () => {
  it("ships the *_v1 policy id and pins ruleset/formula versions", () => {
    expect(gunneryRatePolicyId).toBe("gunnery_rate_v1");
    expect(SHIPPED_GUNNERY_RATE_CONTRACT.policyId).toBe("gunnery_rate_v1");
    expect(SHIPPED_GUNNERY_RATE_CONTRACT.rulesetVersion).toBe(GUNNERY_RULESET_VERSION);
    expect(SHIPPED_GUNNERY_RATE_CONTRACT.formulaVersion).toBe(GUNNERY_FORMULA_VERSION);
  });

  it("validates the shipped contract without throwing", () => {
    expect(() => validateGunneryRateContract(SHIPPED_GUNNERY_RATE_CONTRACT)).not.toThrow();
  });

  it("fails closed on a tampered rounding mode", () => {
    expect(() =>
      validateGunneryRateContract({ ...SHIPPED_GUNNERY_RATE_CONTRACT, rounding: "floor" }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered factor manifest", () => {
    expect(() =>
      validateGunneryRateContract({
        ...SHIPPED_GUNNERY_RATE_CONTRACT,
        factorKeys: ["gunQuality"],
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered basis-point scale", () => {
    expect(() =>
      validateGunneryRateContract({
        ...SHIPPED_GUNNERY_RATE_CONTRACT,
        basisPointsPerUnit: 999,
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered neutralMultiplierBp", () => {
    expect(() =>
      validateGunneryRateContract({
        ...SHIPPED_GUNNERY_RATE_CONTRACT,
        neutralMultiplierBp: 9_500,
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered scaleExponent", () => {
    expect(() =>
      validateGunneryRateContract({
        ...SHIPPED_GUNNERY_RATE_CONTRACT,
        scaleExponent: 10,
      }),
    ).toThrow(BluewaveError);
  });
});

describe("AC-14: gun_quality_v1 subset contract + validate guard (fail closed)", () => {
  it("ships the *_v1 policy id and pins ruleset/formula versions", () => {
    expect(gunneryGunQualityPolicyId).toBe("gun_quality_v1");
    expect(SHIPPED_GUN_QUALITY_CONTRACT.policyId).toBe("gun_quality_v1");
    expect(SHIPPED_GUN_QUALITY_CONTRACT.rulesetVersion).toBe(GUNNERY_RULESET_VERSION);
    expect(SHIPPED_GUN_QUALITY_CONTRACT.formulaVersion).toBe(GUNNERY_FORMULA_VERSION);
  });

  it("validates the shipped contract without throwing", () => {
    expect(() => validateGunQualityContract(SHIPPED_GUN_QUALITY_CONTRACT)).not.toThrow();
  });

  it("fails closed on tampered min/max quality bounds", () => {
    expect(() =>
      validateGunQualityContract({
        ...SHIPPED_GUN_QUALITY_CONTRACT,
        minQuality: GUN_QUALITY_MAX + 1,
      }),
    ).toThrow(BluewaveError);
    expect(() =>
      validateGunQualityContract({
        ...SHIPPED_GUN_QUALITY_CONTRACT,
        maxQuality: GUN_QUALITY_MAX + 1,
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered quality table entry", () => {
    const tampered = {
      ...SHIPPED_GUN_QUALITY_CONTRACT,
      table: { ...GUN_QUALITY_TABLE, "-3": { ...GUN_QUALITY_TABLE["-3"], rangeBp: 8_800 } },
    };
    expect(() => validateGunQualityContract(tampered)).toThrow(BluewaveError);
  });
});
