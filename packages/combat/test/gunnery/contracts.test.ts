import { BluewaveError } from "@bluewave/contracts";
import { describe, expect, it } from "vite-plus/test";
import {
  AMMUNITION_TYPES,
  FIRE_MODES,
  GUNNERY_STATE_INVARIANT_FAILED,
  gunneryPolicyId,
  SHIPPED_GUNNERY_CONTRACT,
  type AmmunitionType,
  validateGunneryContract,
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
