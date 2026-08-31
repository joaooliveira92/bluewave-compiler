// packages/combat/test/air-defense/engagement-formula.test.ts
// AC-11: Engagement formula effectiveDefenseBp = 9-factor product, floor-once.
// Tests the bigint floor-once computation, neutral factor behavior, golden
// numeric case, and integer-overflow-safe exactness.

import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  computeEffectiveDefenseBp,
  neutralEngagementFactors,
  ENGAGEMENT_FORMULA_DENOMINATOR,
  ENGAGEMENT_FORMULA_SCALE_EXPONENT,
  FORMULA_DENOMINATOR,
} from "../../src/air-defense/index.js";

// ---- Helper: all-10_000 neutral factors ----
function neutralInputs(baseBp: number) {
  return neutralEngagementFactors(SafeInt(baseBp));
}

describe("Engagement formula (§19, AC-11)", () => {
  describe("identity (all neutral factors)", () => {
    it("should return baseDefenseBp when all 8 multipliers are 10_000", () => {
      const result = computeEffectiveDefenseBp(neutralInputs(100));
      expect(result.effectiveDefenseBp).toBe(100);
    });

    it("should return baseDefenseBp for various base values", () => {
      for (const base of [0, 1, 50, 9_999, 10_000]) {
        const result = computeEffectiveDefenseBp(neutralInputs(base));
        expect(result.effectiveDefenseBp).toBe(base);
      }
    });
  });

  describe("golden numeric test (§19 floor-once)", () => {
    it("should compute exact golden value: base=100, director=18_000, crew=8_500, damage=7_500, weather=8_000", () => {
      // Numerator = 100 × 18_000 × 10_000 × 8_500 × 7_500 × 10_000 × 10_000 × 8_000 × 10_000
      //           = 918 × 10^31
      // Denominator = 10^32
      // Result = floor(918 / 10) = floor(91.8) = 91
      const result = computeEffectiveDefenseBp({
        baseDefenseBp: SafeInt(100),
        directorMultiplierBp: SafeInt(18_000), // 2 directors (§12)
        radarMultiplierBp: SafeInt(10_000), // neutral
        crewMultiplierBp: SafeInt(8_500), // some crew quality
        damageMultiplierBp: SafeInt(7_500), // some damage
        ammunitionMultiplierBp: SafeInt(10_000), // full ammo
        targetProfileMultiplierBp: SafeInt(10_000), // neutral
        weatherMultiplierBp: SafeInt(8_000), // weather degradation
        saturationMultiplierBp: SafeInt(10_000), // neutral
      });
      expect(result.effectiveDefenseBp).toBe(91);
    });

    it("should verify golden via bigint numerator string", () => {
      const result = computeEffectiveDefenseBp({
        baseDefenseBp: SafeInt(100),
        directorMultiplierBp: SafeInt(18_000),
        radarMultiplierBp: SafeInt(10_000),
        crewMultiplierBp: SafeInt(8_500),
        damageMultiplierBp: SafeInt(7_500),
        ammunitionMultiplierBp: SafeInt(10_000),
        targetProfileMultiplierBp: SafeInt(10_000),
        weatherMultiplierBp: SafeInt(8_000),
        saturationMultiplierBp: SafeInt(10_000),
      });
      // Verify the numerator is exactly 918 × 10^31
      const expectedNumerator = 918n * 10n ** 31n;
      expect(BigInt(result.rounding.numerator)).toBe(expectedNumerator);
      expect(result.rounding.rawFlooredBp).toBe(91);
      expect(result.rounding.mode).toBe("floor");
      expect(result.rounding.scaleExponent).toBe(8);
    });
  });

  describe("single-factor reduction", () => {
    it("should halve base when director = 5_000 (0 directors)", () => {
      const result = computeEffectiveDefenseBp({
        ...neutralInputs(100),
        directorMultiplierBp: SafeInt(5_000),
      });
      expect(result.effectiveDefenseBp).toBe(50);
    });

    it("should reduce base proportionally for weather=8_000", () => {
      const result = computeEffectiveDefenseBp({
        ...neutralInputs(100),
        weatherMultiplierBp: SafeInt(8_000),
      });
      expect(result.effectiveDefenseBp).toBe(80);
    });
  });

  describe("floor-once (not per-factor rounding)", () => {
    it("should floor the final result, not intermediate products", () => {
      // base=3, director=5_000, all others=10_000
      // numerator = 3 × 5_000 × 10_000^7 = 3 × 5_000 × 10^28 = 1.5 × 10^32
      // denominator = 10_000^8 = 10^32
      // result = floor(1.5 × 10^32 / 10^32) = floor(1.5) = 1
      const result = computeEffectiveDefenseBp({
        ...neutralInputs(3),
        directorMultiplierBp: SafeInt(5_000),
      });
      expect(result.effectiveDefenseBp).toBe(1);
    });

    it("should floor the final product, not each factor individually", () => {
      // base=7, two factors at 5_000 each, rest neutral
      // numerator = 7 × 5_000 × 5_000 × 10_000^6
      //           = 7 × 25_000_000 × 10^24 = 175_000_000 × 10^24 = 1.75 × 10^32
      // denominator = 10_000^8 = 10^32
      // result = floor(1.75 × 10^32 / 10^32) = floor(1.75) = 1
      const result = computeEffectiveDefenseBp({
        ...neutralInputs(7),
        directorMultiplierBp: SafeInt(5_000),
        radarMultiplierBp: SafeInt(5_000),
      });
      expect(result.effectiveDefenseBp).toBe(1);
    });

    it("should produce non-zero when the rational result is ≥ 1", () => {
      // base=1, all factors=10_000 except director=5_000
      // numerator = 1 × 5_000 × 10_000^7
      // denominator = 10_000^8
      // result = floor(5_000 / 10_000) = floor(0.5) = 0
      const r1 = computeEffectiveDefenseBp({
        ...neutralInputs(1),
        directorMultiplierBp: SafeInt(5_000),
      });
      expect(r1.effectiveDefenseBp).toBe(0);

      // base=2, same → floor(2 × 5_000 / 10_000) = floor(1) = 1
      const r2 = computeEffectiveDefenseBp({
        ...neutralInputs(2),
        directorMultiplierBp: SafeInt(5_000),
      });
      expect(r2.effectiveDefenseBp).toBe(1);
    });
  });

  describe("integer-overflow safety", () => {
    it("should handle max single-factor (10_000) correctly", () => {
      const result = computeEffectiveDefenseBp(neutralInputs(10_000));
      expect(result.effectiveDefenseBp).toBe(10_000);
    });

    it("should handle large base with all neutral", () => {
      const result = computeEffectiveDefenseBp(neutralInputs(9_999));
      expect(result.effectiveDefenseBp).toBe(9_999);
    });

    it("should handle maximum director scaling (31_000) with base 100", () => {
      // 100 × 31_000 / 10_000 = 310
      const result = computeEffectiveDefenseBp({
        ...neutralInputs(100),
        directorMultiplierBp: SafeInt(31_000),
      });
      expect(result.effectiveDefenseBp).toBe(310);
    });

    it("should produce valid bigint numerator that matches computed product", () => {
      const inputs = {
        baseDefenseBp: SafeInt(100),
        directorMultiplierBp: SafeInt(18_000),
        radarMultiplierBp: SafeInt(10_000),
        crewMultiplierBp: SafeInt(8_500),
        damageMultiplierBp: SafeInt(7_500),
        ammunitionMultiplierBp: SafeInt(10_000),
        targetProfileMultiplierBp: SafeInt(10_000),
        weatherMultiplierBp: SafeInt(8_000),
        saturationMultiplierBp: SafeInt(10_000),
      };
      const result = computeEffectiveDefenseBp(inputs);

      // Verify numerator equals product of all factors
      let expectedProduct = 100n;
      for (const key of [
        "directorMultiplierBp",
        "radarMultiplierBp",
        "crewMultiplierBp",
        "damageMultiplierBp",
        "ammunitionMultiplierBp",
        "targetProfileMultiplierBp",
        "weatherMultiplierBp",
        "saturationMultiplierBp",
      ] as const) {
        expectedProduct *= BigInt(inputs[key]);
      }
      expect(BigInt(result.rounding.numerator)).toBe(expectedProduct);
    });
  });

  describe("empty system (ammunitionMultiplierBp = 0)", () => {
    it("should return 0 when ammunition is depleted", () => {
      const result = computeEffectiveDefenseBp({
        ...neutralInputs(100),
        ammunitionMultiplierBp: SafeInt(0),
      });
      expect(result.effectiveDefenseBp).toBe(0);
    });

    it("should return 0 regardless of other factor values", () => {
      const result = computeEffectiveDefenseBp({
        baseDefenseBp: SafeInt(100),
        directorMultiplierBp: SafeInt(31_000),
        radarMultiplierBp: SafeInt(10_000),
        crewMultiplierBp: SafeInt(10_000),
        damageMultiplierBp: SafeInt(10_000),
        ammunitionMultiplierBp: SafeInt(0),
        targetProfileMultiplierBp: SafeInt(10_000),
        weatherMultiplierBp: SafeInt(10_000),
        saturationMultiplierBp: SafeInt(10_000),
      });
      expect(result.effectiveDefenseBp).toBe(0);
    });
  });

  describe("formula constants", () => {
    it("ENGAGEMENT_FORMULA_DENOMINATOR = 10_000^8 = 10^32", () => {
      expect(ENGAGEMENT_FORMULA_DENOMINATOR).toBe(10_000n ** 8n);
      expect(ENGAGEMENT_FORMULA_DENOMINATOR.toString()).toBe("100000000000000000000000000000000");
    });

    it("ENGAGEMENT_FORMULA_SCALE_EXPONENT = 8", () => {
      expect(ENGAGEMENT_FORMULA_SCALE_EXPONENT).toBe(8);
    });

    it("FORMULA_DENOMINATOR = 10_000 (for threshold comparison)", () => {
      expect(FORMULA_DENOMINATOR).toBe(10_000);
    });
  });

  describe("rounding detail traceability", () => {
    it("should include numerator and denominator as strings", () => {
      const result = computeEffectiveDefenseBp(neutralInputs(100));
      expect(typeof result.rounding.numerator).toBe("string");
      expect(typeof result.rounding.denominator).toBe("string");
      expect(result.rounding.mode).toBe("floor");
    });

    it("should have factor contributions matching inputs", () => {
      const inputs = neutralInputs(100);
      const result = computeEffectiveDefenseBp(inputs);
      expect(result.factorContributions.baseDefenseBp).toBe(100);
      expect(result.factorContributions.directorMultiplierBp).toBe(10_000);
    });
  });

  describe("boundary cases", () => {
    it("should return 0 for baseDefenseBp=0", () => {
      const result = computeEffectiveDefenseBp(neutralInputs(0));
      expect(result.effectiveDefenseBp).toBe(0);
    });

    it("should handle all factors at minimum non-zero (1)", () => {
      // numerator = 1^9 = 1, denominator = 10^32 → floor = 0
      const result = computeEffectiveDefenseBp({
        baseDefenseBp: SafeInt(1),
        directorMultiplierBp: SafeInt(1),
        radarMultiplierBp: SafeInt(1),
        crewMultiplierBp: SafeInt(1),
        damageMultiplierBp: SafeInt(1),
        ammunitionMultiplierBp: SafeInt(1),
        targetProfileMultiplierBp: SafeInt(1),
        weatherMultiplierBp: SafeInt(1),
        saturationMultiplierBp: SafeInt(1),
      });
      expect(result.effectiveDefenseBp).toBe(0);
    });
  });
});
