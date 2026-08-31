// packages/combat/test/air-defense/damage-power.test.ts
// AC-14: Simplified damage/power state + local control multiplier.
// Tests component status channels, local control fallback, damage multiplier,
// and wiring into the engagement formula.

import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  computeDirectorMultiplierBp,
  computeDamageMultiplierBp,
  computeDamageAwareMultipliers,
  ALL_CHANNELS_OPERATIONAL,
  createAirDefenseSystemDefinition,
  computeEffectiveDefenseBp,
  LOCAL_CONTROL_MULTIPLIER_BP,
  Layer,
  Category,
} from "../../src/air-defense/index.js";
import type {
  AirDamageComponentStatus,
  AirDefenseSystemDefinition,
} from "../../src/air-defense/index.js";

// ---- Helper: create a system with optional localControlMultiplierBp ----
function makeSystem(overrides?: {
  localControlMultiplierBp?: SafeInt;
}): AirDefenseSystemDefinition {
  return createAirDefenseSystemDefinition({
    systemId: "sys_001",
    layer: Layer.HEAVY_AA,
    category: Category.HEAVY_AA,
    mountCount: SafeInt(4),
    barrels: SafeInt(1),
    rangeMinM: SafeInt(1_000),
    rangeMaxM: SafeInt(20_000),
    altitudeMinM: SafeInt(0),
    altitudeMaxM: SafeInt(15_000),
    targetSpeedLimitMps: SafeInt(800),
    profileEligibility: new Set(["CA"]),
    engagementChannels: new Set(["ch001"]),
    ...overrides,
  });
}

// ---- Helper: component status with selective destruction ----
function withDestroyed(
  base: AirDamageComponentStatus,
  channels: Partial<Record<keyof AirDamageComponentStatus, boolean>>,
): AirDamageComponentStatus {
  return { ...base, ...channels };
}

describe("Damage/power state (§21, AC-14)", () => {
  describe("AirDamageComponentStatus", () => {
    it("should have ALL_CHANNELS_OPERATIONAL with all 8 channels true", () => {
      const s = ALL_CHANNELS_OPERATIONAL;
      expect(s.weaponMount).toBe(true);
      expect(s.director).toBe(true);
      expect(s.radar).toBe(true);
      expect(s.electricalPower).toBe(true);
      expect(s.dataCommPath).toBe(true);
      expect(s.ammunitionFeed).toBe(true);
      expect(s.stabilization).toBe(true);
      expect(s.engagementChannels).toBe(true);
    });
  });

  describe("computeDirectorMultiplierBp — local control fallback (§21 lines 361-363)", () => {
    it("should use normal director multiplier when director is operational", () => {
      const system = makeSystem({ localControlMultiplierBp: SafeInt(5_000) });
      const result = computeDirectorMultiplierBp(ALL_CHANNELS_OPERATIONAL, system, SafeInt(18_000));
      expect(result).toBe(18_000);
    });

    it("§21: 'An intact gun with a destroyed director may use local control only when its definition provides an exact local-control multiplier.'", () => {
      // Director destroyed, system HAS localControlMultiplierBp → local control applies
      const system = makeSystem({ localControlMultiplierBp: SafeInt(5_000) });
      const destroyed = withDestroyed(ALL_CHANNELS_OPERATIONAL, { director: false });
      const result = computeDirectorMultiplierBp(destroyed, system, SafeInt(18_000));
      expect(result).toBe(LOCAL_CONTROL_MULTIPLIER_BP);
      expect(result).toBe(5_000);
    });

    it("should return 0 when director is destroyed and no localControlMultiplierBp", () => {
      // Director destroyed, system has NO localControlMultiplierBp → blocked
      const system = makeSystem(); // no localControlMultiplierBp
      const destroyed = withDestroyed(ALL_CHANNELS_OPERATIONAL, { director: false });
      const result = computeDirectorMultiplierBp(destroyed, system, SafeInt(18_000));
      expect(result).toBe(0);
    });

    it("should not apply local control when director is operational", () => {
      const system = makeSystem({ localControlMultiplierBp: SafeInt(5_000) });
      const result = computeDirectorMultiplierBp(ALL_CHANNELS_OPERATIONAL, system, SafeInt(18_000));
      // Should use normal 18_000, NOT local control 5_000
      expect(result).toBe(18_000);
    });

    it("should handle localControlMultiplierBp = 0 (explicit zero local control)", () => {
      const system = makeSystem({ localControlMultiplierBp: SafeInt(0) });
      const destroyed = withDestroyed(ALL_CHANNELS_OPERATIONAL, { director: false });
      const result = computeDirectorMultiplierBp(destroyed, system, SafeInt(18_000));
      expect(result).toBe(0);
    });
  });

  describe("computeDamageMultiplierBp — simplified damage channels (§21)", () => {
    it("should return 10_000 when all 8 channels are operational", () => {
      const result = computeDamageMultiplierBp(ALL_CHANNELS_OPERATIONAL);
      expect(result).toBe(10_000);
    });

    it("should reduce proportionally for each destroyed channel", () => {
      // 1 destroyed channel: floor(7 × 10_000 / 8) = floor(8_750) = 8_750
      const one = withDestroyed(ALL_CHANNELS_OPERATIONAL, { weaponMount: false });
      expect(computeDamageMultiplierBp(one)).toBe(8_750);

      // 4 destroyed channels: floor(4 × 10_000 / 8) = 5_000
      const four = withDestroyed(ALL_CHANNELS_OPERATIONAL, {
        weaponMount: false,
        director: false,
        radar: false,
        electricalPower: false,
      });
      expect(computeDamageMultiplierBp(four)).toBe(5_000);

      // All 8 destroyed: floor(0 × 10_000 / 8) = 0
      const allDestroyed: AirDamageComponentStatus = {
        weaponMount: false,
        director: false,
        radar: false,
        electricalPower: false,
        dataCommPath: false,
        ammunitionFeed: false,
        stabilization: false,
        engagementChannels: false,
      };
      expect(computeDamageMultiplierBp(allDestroyed)).toBe(0);
    });

    it("should handle edge case: 7 channels destroyed", () => {
      const almost: AirDamageComponentStatus = {
        weaponMount: false,
        director: false,
        radar: false,
        electricalPower: false,
        dataCommPath: false,
        ammunitionFeed: false,
        stabilization: false,
        engagementChannels: true,
      };
      // floor(1 × 10_000 / 8) = floor(1_250) = 1_250
      expect(computeDamageMultiplierBp(almost)).toBe(1_250);
    });
  });

  describe("computeDamageAwareMultipliers — combined wiring", () => {
    it("should return neutral multipliers when all operational", () => {
      const system = makeSystem();
      const result = computeDamageAwareMultipliers(
        ALL_CHANNELS_OPERATIONAL,
        system,
        SafeInt(18_000),
      );
      expect(result.directorMultiplierBp).toBe(18_000);
      expect(result.damageMultiplierBp).toBe(10_000);
    });

    it("should return local control director + reduced damage when director destroyed", () => {
      const system = makeSystem({ localControlMultiplierBp: SafeInt(5_000) });
      const destroyed = withDestroyed(ALL_CHANNELS_OPERATIONAL, { director: false });
      const result = computeDamageAwareMultipliers(destroyed, system, SafeInt(18_000));
      expect(result.directorMultiplierBp).toBe(5_000);
      // 1 of 8 channels destroyed: floor(7 × 10_000 / 8) = 8_750
      expect(result.damageMultiplierBp).toBe(8_750);
    });

    it("should return zero director when destroyed without local control", () => {
      const system = makeSystem(); // no localControlMultiplierBp
      const destroyed = withDestroyed(ALL_CHANNELS_OPERATIONAL, { director: false });
      const result = computeDamageAwareMultipliers(destroyed, system, SafeInt(18_000));
      expect(result.directorMultiplierBp).toBe(0);
      expect(result.damageMultiplierBp).toBe(8_750);
    });
  });

  describe("wiring into engagement formula (AC-11 + AC-14)", () => {
    it("should reduce effectiveDefenseBp when director is destroyed (local control)", () => {
      const system = makeSystem({ localControlMultiplierBp: SafeInt(5_000) });
      const destroyed = withDestroyed(ALL_CHANNELS_OPERATIONAL, { director: false });
      const mults = computeDamageAwareMultipliers(destroyed, system, SafeInt(18_000));

      const result = computeEffectiveDefenseBp({
        baseDefenseBp: SafeInt(100),
        directorMultiplierBp: mults.directorMultiplierBp,
        radarMultiplierBp: SafeInt(10_000),
        crewMultiplierBp: SafeInt(10_000),
        damageMultiplierBp: mults.damageMultiplierBp,
        ammunitionMultiplierBp: SafeInt(10_000),
        targetProfileMultiplierBp: SafeInt(10_000),
        weatherMultiplierBp: SafeInt(10_000),
        saturationMultiplierBp: SafeInt(10_000),
      });

      // base=100, director=5_000, damage=8_750, others=10_000
      // = floor(100 × 5_000 × 8_750 / 10_000^2) (with other factors as 1)
      // = floor(100 × 5_000 × 8_750 × 10_000^5 / 10_000^8)
      // = floor(100 × 0.5 × 0.875)
      // = floor(43.75) = 43
      expect(result.effectiveDefenseBp).toBe(43);
    });

    it("should zero effectiveDefenseBp when director destroyed without local control", () => {
      const system = makeSystem(); // no localControlMultiplierBp
      const destroyed = withDestroyed(ALL_CHANNELS_OPERATIONAL, { director: false });
      const mults = computeDamageAwareMultipliers(destroyed, system, SafeInt(18_000));

      const result = computeEffectiveDefenseBp({
        baseDefenseBp: SafeInt(100),
        directorMultiplierBp: mults.directorMultiplierBp,
        radarMultiplierBp: SafeInt(10_000),
        crewMultiplierBp: SafeInt(10_000),
        damageMultiplierBp: mults.damageMultiplierBp,
        ammunitionMultiplierBp: SafeInt(10_000),
        targetProfileMultiplierBp: SafeInt(10_000),
        weatherMultiplierBp: SafeInt(10_000),
        saturationMultiplierBp: SafeInt(10_000),
      });

      // directorMultiplierBp = 0 → entire product is 0
      expect(result.effectiveDefenseBp).toBe(0);
    });

    it("should reduce effectiveDefenseBp with multiple damaged channels", () => {
      const system = makeSystem({ localControlMultiplierBp: SafeInt(5_000) });
      const damaged = withDestroyed(ALL_CHANNELS_OPERATIONAL, {
        weaponMount: false,
        radar: false,
        electricalPower: false,
      });
      const mults = computeDamageAwareMultipliers(damaged, system, SafeInt(18_000));

      // 3 of 8 destroyed: damageMultiplierBp = floor(5 × 10_000 / 8) = 6_250
      expect(mults.damageMultiplierBp).toBe(6_250);
      expect(mults.directorMultiplierBp).toBe(18_000);

      const result = computeEffectiveDefenseBp({
        baseDefenseBp: SafeInt(100),
        directorMultiplierBp: mults.directorMultiplierBp,
        radarMultiplierBp: SafeInt(10_000),
        crewMultiplierBp: SafeInt(10_000),
        damageMultiplierBp: mults.damageMultiplierBp,
        ammunitionMultiplierBp: SafeInt(10_000),
        targetProfileMultiplierBp: SafeInt(10_000),
        weatherMultiplierBp: SafeInt(10_000),
        saturationMultiplierBp: SafeInt(10_000),
      });

      // = floor(100 × 1.8 × 0.625)
      // = floor(112.5) = 112
      expect(result.effectiveDefenseBp).toBe(112);
    });
  });

  describe("§21 independent damage channels", () => {
    it("should treat each channel independently (destroying radar does not affect director)", () => {
      const system = makeSystem({ localControlMultiplierBp: SafeInt(5_000) });
      const radarDestroyed = withDestroyed(ALL_CHANNELS_OPERATIONAL, { radar: false });

      const mults = computeDamageAwareMultipliers(radarDestroyed, system, SafeInt(18_000));
      // Director is still operational → use normal scaling
      expect(mults.directorMultiplierBp).toBe(18_000);
      // 1 of 8 destroyed: damage = floor(7 × 10_000 / 8) = 8_750
      expect(mults.damageMultiplierBp).toBe(8_750);
    });

    it("should handle simultaneous director + other channel destruction", () => {
      const system = makeSystem({ localControlMultiplierBp: SafeInt(5_000) });
      const multi = withDestroyed(ALL_CHANNELS_OPERATIONAL, {
        director: false,
        electricalPower: false,
      });

      const mults = computeDamageAwareMultipliers(multi, system, SafeInt(18_000));
      // Director destroyed + local control → 5_000
      expect(mults.directorMultiplierBp).toBe(5_000);
      // 2 of 8 destroyed: damage = floor(6 × 10_000 / 8) = 7_500
      expect(mults.damageMultiplierBp).toBe(7_500);
    });
  });

  describe("LOCAL_CONTROL_MULTIPLIER_BP constant", () => {
    it("should be 5_000 as shipped in §21 line 363", () => {
      expect(LOCAL_CONTROL_MULTIPLIER_BP).toBe(5_000);
    });
  });
});
