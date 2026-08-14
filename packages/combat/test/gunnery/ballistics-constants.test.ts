import { describe, it, expect } from "vite-plus/test";
import { BluewaveError } from "@bluewave/contracts";
import {
  GUNNERY_BASE_RELOAD_BY_CALIBER_MM,
  GUNNERY_SCEN1880_RML_HEAVY_BASE_RELOAD_MIN_MS,
  gunneryBallisticsPolicyId,
  SHIPPED_GUNNERY_BALLISTICS_CONTRACT,
  validateGunneryBallisticsContract,
} from "../../src/gunnery/index.js";

// Research table (docs/research/b3-m2-gunnery.md §1): broad caliber mm ->
// chosen baseReloadMilliseconds. Locked so a drift in either the research note or
// the shipped constant forces review.
const RESEARCHED_BASE_RELOAD_BY_CALIBER_MM = {
  152: 7_000,
  203: 18_000,
  305: 25_000,
  356: 36_000,
  381: 35_000,
  406: 40_000,
} as const;

describe("AC-5 grounding: research-grounded base-reload-by-caliber constants", () => {
  it("ships the *_v1 policy id and SHIPPED_GUNNERY_BALLISTICS_CONTRACT", () => {
    expect(gunneryBallisticsPolicyId).toBe("gunnery_ballistics_v1");
    expect(SHIPPED_GUNNERY_BALLISTICS_CONTRACT.policyId).toBe("gunnery_ballistics_v1");
  });

  it("the shipped per-caliber values equal the researched table exactly", () => {
    expect({ ...GUNNERY_BASE_RELOAD_BY_CALIBER_MM }).toEqual(RESEARCHED_BASE_RELOAD_BY_CALIBER_MM);
    expect(SHIPPED_GUNNERY_BALLISTICS_CONTRACT.baseReloadByCaliberMm).toEqual(
      RESEARCHED_BASE_RELOAD_BY_CALIBER_MM,
    );
  });

  it("every per-caliber value is a positive integer (tactical ms)", () => {
    const entries = Object.entries(GUNNERY_BASE_RELOAD_BY_CALIBER_MM);
    expect(entries.length).toBeGreaterThan(0);
    for (const [mm, ms] of entries) {
      expect(Number(mm)).toBeGreaterThan(0);
      expect(ms).toBeGreaterThan(0);
      expect(Number.isInteger(ms)).toBe(true);
    }
  });

  it("the 1880s RML heavy-gun balance-target flag equals the documented lower bound", () => {
    // docs/research/b3-m2-gunnery.md §1: 1880s RML heavy guns are 1-5 min/round
    // (120 000-300 000 ms), NOT fully grounded -> recorded as a BALANCE TARGET
    // lower bound, never silently pinned as a primary fact (open content-owner
    // decision).
    expect(GUNNERY_SCEN1880_RML_HEAVY_BASE_RELOAD_MIN_MS).toBe(120_000);
    expect(Number.isInteger(GUNNERY_SCEN1880_RML_HEAVY_BASE_RELOAD_MIN_MS)).toBe(true);
    expect(SHIPPED_GUNNERY_BALLISTICS_CONTRACT.scen1880RmlHeavyBaseReloadMinMs).toBe(120_000);
  });

  it("validates the shipped contract without throwing", () => {
    expect(() =>
      validateGunneryBallisticsContract(SHIPPED_GUNNERY_BALLISTICS_CONTRACT),
    ).not.toThrow();
  });

  it("fails closed on a tampered per-caliber value", () => {
    expect(() =>
      validateGunneryBallisticsContract({
        ...SHIPPED_GUNNERY_BALLISTICS_CONTRACT,
        baseReloadByCaliberMm: { ...GUNNERY_BASE_RELOAD_BY_CALIBER_MM, 152: 6_000 },
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered caliber key set", () => {
    expect(() =>
      validateGunneryBallisticsContract({
        ...SHIPPED_GUNNERY_BALLISTICS_CONTRACT,
        baseReloadByCaliberMm: { ...GUNNERY_BASE_RELOAD_BY_CALIBER_MM, 450: 120_000 },
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a tampered 1880 RML balance-target flag", () => {
    expect(() =>
      validateGunneryBallisticsContract({
        ...SHIPPED_GUNNERY_BALLISTICS_CONTRACT,
        scen1880RmlHeavyBaseReloadMinMs: 60_000,
      }),
    ).toThrow(BluewaveError);
  });

  it("fails closed on a missing contract and drifted versions", () => {
    expect(() => validateGunneryBallisticsContract(null)).toThrow(BluewaveError);
    expect(() => validateGunneryBallisticsContract(undefined)).toThrow(BluewaveError);
    expect(() =>
      validateGunneryBallisticsContract({
        ...SHIPPED_GUNNERY_BALLISTICS_CONTRACT,
        formulaVersion: "next",
      }),
    ).toThrow(BluewaveError);
  });
});
