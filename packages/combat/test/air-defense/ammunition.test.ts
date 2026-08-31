// packages/combat/test/air-defense/ammunition.test.ts
// AC-13: Ammunition consumption + empty system contributes zero.
// Tests reserve+consume exact, rounds-per-engagement decrement, magazine
// depletion → empty system → effectiveDefenseBp 0, no-ammunition-created invariant.

import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  computeAmmunitionMultiplierBp,
  consumeAmmunition,
  computeEffectiveDefenseBp,
  neutralEngagementFactors,
} from "../../src/air-defense/index.js";

describe("Ammunition consumption (§20, AC-13)", () => {
  describe("computeAmmunitionMultiplierBp", () => {
    it("should return 10_000 (neutral) when rounds > 0", () => {
      expect(computeAmmunitionMultiplierBp(1)).toBe(10_000);
      expect(computeAmmunitionMultiplierBp(100)).toBe(10_000);
      expect(computeAmmunitionMultiplierBp(9_999)).toBe(10_000);
    });

    it("should return 0 when rounds = 0 (empty system)", () => {
      expect(computeAmmunitionMultiplierBp(0)).toBe(0);
    });

    it("should throw for negative rounds", () => {
      expect(() => computeAmmunitionMultiplierBp(-1)).toThrow(
        "roundsRemaining must be a non-negative integer",
      );
    });

    it("should throw for non-integer rounds", () => {
      expect(() => computeAmmunitionMultiplierBp(1.5)).toThrow(
        "roundsRemaining must be a non-negative integer",
      );
    });
  });

  describe("empty system → effectiveDefenseBp = 0 (§20 line 346)", () => {
    it("should produce effectiveDefenseBp = 0 when ammunitionMultiplierBp = 0", () => {
      const result = computeEffectiveDefenseBp({
        ...neutralEngagementFactors(SafeInt(100)),
        ammunitionMultiplierBp: SafeInt(0),
      });
      expect(result.effectiveDefenseBp).toBe(0);
    });

    it("should produce effectiveDefenseBp = 0 regardless of other high factors", () => {
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

    it("§20: 'An empty system contributes zero. A defensive opportunity does not create ammunition.'", () => {
      // Verify: even with a defensive opportunity (all other factors maximal),
      // zero ammunition means zero effective defense.
      const result = computeEffectiveDefenseBp({
        baseDefenseBp: SafeInt(10_000),
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

  describe("consumeAmmunition — exact reserve + consume (§20 lines 332-346)", () => {
    it("should consume exact rounds per engagement", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(100)]]);
      const result = consumeAmmunition(ammo, "sys_001", SafeInt(10));

      expect(result.sufficient).toBe(true);
      expect(Number(result.roundsConsumed)).toBe(10);
      expect(Number(result.newAmmunitionByType.get("sys_001"))).toBe(90);
    });

    it("should not mutate the original ammunition map", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(100)]]);
      consumeAmmunition(ammo, "sys_001", SafeInt(10));
      expect(Number(ammo.get("sys_001"))).toBe(100);
    });

    it("should return the original map when ammunition is insufficient", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(5)]]);
      const result = consumeAmmunition(ammo, "sys_001", SafeInt(10));

      expect(result.sufficient).toBe(false);
      expect(Number(result.roundsConsumed)).toBe(0);
      expect(result.newAmmunitionByType).toBe(ammo); // same reference
    });

    it("should handle consuming all rounds (deplete to 0)", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(10)]]);
      const result = consumeAmmunition(ammo, "sys_001", SafeInt(10));

      expect(result.sufficient).toBe(true);
      expect(Number(result.newAmmunitionByType.get("sys_001"))).toBe(0);
    });

    it("should handle zero rounds per engagement (no-op consume)", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(100)]]);
      const result = consumeAmmunition(ammo, "sys_001", SafeInt(0));

      expect(result.sufficient).toBe(true);
      expect(Number(result.roundsConsumed)).toBe(0);
      expect(Number(result.newAmmunitionByType.get("sys_001"))).toBe(100);
    });

    it("should handle system not in ammunition map (defaults to 0 available)", () => {
      const ammo = new Map<string, SafeInt>();
      const result = consumeAmmunition(ammo, "sys_unknown", SafeInt(10));

      expect(result.sufficient).toBe(false);
      expect(Number(result.roundsConsumed)).toBe(0);
    });

    it("should handle multiple systems independently", () => {
      const ammo = new Map<string, SafeInt>([
        ["sys_001", SafeInt(100)],
        ["sys_002", SafeInt(50)],
      ]);
      const result = consumeAmmunition(ammo, "sys_001", SafeInt(20));

      expect(Number(result.newAmmunitionByType.get("sys_001"))).toBe(80);
      expect(Number(result.newAmmunitionByType.get("sys_002"))).toBe(50);
    });

    it("should reject negative rounds per engagement", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(100)]]);
      expect(() => consumeAmmunition(ammo, "sys_001", SafeInt(-1))).toThrow(
        "roundsPerEngagement must be a non-negative safe integer",
      );
    });
  });

  describe("no-ammunition-created invariant (§20 line 346)", () => {
    it("should never increase ammunition through engagement", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(50)]]);
      const result = consumeAmmunition(ammo, "sys_001", SafeInt(10));
      expect(Number(result.newAmmunitionByType.get("sys_001"))).toBeLessThanOrEqual(50);
    });

    it("should preserve ammunition for other systems", () => {
      const ammo = new Map<string, SafeInt>([
        ["sys_001", SafeInt(50)],
        ["sys_002", SafeInt(30)],
        ["sys_003", SafeInt(20)],
      ]);
      const result = consumeAmmunition(ammo, "sys_002", SafeInt(5));

      expect(Number(result.newAmmunitionByType.get("sys_001"))).toBe(50);
      expect(Number(result.newAmmunitionByType.get("sys_002"))).toBe(25);
      expect(Number(result.newAmmunitionByType.get("sys_003"))).toBe(20);
    });

    it("should return new map (immutability guarantee)", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(50)]]);
      const result = consumeAmmunition(ammo, "sys_001", SafeInt(10));
      // New map should be a different object
      expect(result.newAmmunitionByType).not.toBe(ammo);
    });
  });

  describe("ammunition depletion → zero effective defense", () => {
    it("should chain: deplete ammo → computeMultiplierBp → computeEffectiveDefenseBp = 0", () => {
      // Step 1: consume all rounds
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(10)]]);
      const consumed = consumeAmmunition(ammo, "sys_001", SafeInt(10));
      expect(consumed.sufficient).toBe(true);

      // Step 2: compute multiplier from remaining rounds
      const remaining = Number(consumed.newAmmunitionByType.get("sys_001") ?? SafeInt(0));
      const multiplier = computeAmmunitionMultiplierBp(remaining);
      expect(multiplier).toBe(0);

      // Step 3: compute effective defense
      const defense = computeEffectiveDefenseBp({
        ...neutralEngagementFactors(SafeInt(100)),
        ammunitionMultiplierBp: multiplier,
      });
      expect(defense.effectiveDefenseBp).toBe(0);
    });

    it("should continue engagement after partial depletion", () => {
      const ammo = new Map<string, SafeInt>([["sys_001", SafeInt(100)]]);
      const consumed = consumeAmmunition(ammo, "sys_001", SafeInt(30));
      expect(consumed.sufficient).toBe(true);

      const remaining = Number(consumed.newAmmunitionByType.get("sys_001") ?? SafeInt(0));
      const multiplier = computeAmmunitionMultiplierBp(remaining);
      expect(multiplier).toBe(10_000);

      const defense = computeEffectiveDefenseBp({
        ...neutralEngagementFactors(SafeInt(50)),
        ammunitionMultiplierBp: multiplier,
      });
      expect(defense.effectiveDefenseBp).toBe(50);
    });
  });
});
