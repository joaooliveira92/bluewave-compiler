// packages/combat/test/air-defense/light-aa-windows.test.ts
// AC-6: Light AA windows per attack profile + §9 speed bands.

import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  resolveLayerEligibility,
  effectiveLightAAWindowMilliseconds,
  lightAASpeedMultiplierBp,
  AttackType,
} from "../../src/air-defense/index.js";
import { makeLightAASystem, makeAttack, makeState, makeContext } from "./test-helpers.js";

describe("AC-6: Light AA eligibility (§9)", () => {
  describe("window computation per §9 formula for each profile", () => {
    it("should compute level bombing window = 120s at full speed band (10_000bp)", () => {
      // Base: 120s = 120_000ms, multiplier: 10_000bp → effective: 120_000ms
      expect(effectiveLightAAWindowMilliseconds(120_000, 10_000)).toBe(120_000);
    });

    it("should compute dive bombing window = 60s at full speed band", () => {
      expect(effectiveLightAAWindowMilliseconds(60_000, 10_000)).toBe(60_000);
    });

    it("should compute skip bombing window = 60s at full speed band", () => {
      expect(effectiveLightAAWindowMilliseconds(60_000, 10_000)).toBe(60_000);
    });

    it("should compute torpedo attack window = 120s at full speed band", () => {
      expect(effectiveLightAAWindowMilliseconds(120_000, 10_000)).toBe(120_000);
    });

    it("should compute rocket attack window = 60s at full speed band", () => {
      expect(effectiveLightAAWindowMilliseconds(60_000, 10_000)).toBe(60_000);
    });

    it("should compute guided weapon window = 60s at full speed band", () => {
      expect(effectiveLightAAWindowMilliseconds(60_000, 10_000)).toBe(60_000);
    });
  });

  describe("speed-band multiplier applied (knots)", () => {
    it("should apply 10_000bp for speed < 200 knots", () => {
      expect(lightAASpeedMultiplierBp(0)).toBe(10_000);
      expect(lightAASpeedMultiplierBp(100)).toBe(10_000);
      expect(lightAASpeedMultiplierBp(199)).toBe(10_000);
    });

    it("should apply 7_500bp for speed 200..<350 knots", () => {
      expect(lightAASpeedMultiplierBp(200)).toBe(7_500);
      expect(lightAASpeedMultiplierBp(275)).toBe(7_500);
      expect(lightAASpeedMultiplierBp(349)).toBe(7_500);
    });

    it("should apply 5_000bp for speed 350..<500 knots", () => {
      expect(lightAASpeedMultiplierBp(350)).toBe(5_000);
      expect(lightAASpeedMultiplierBp(425)).toBe(5_000);
      expect(lightAASpeedMultiplierBp(499)).toBe(5_000);
    });

    it("should apply 2_500bp for speed >= 500 knots", () => {
      expect(lightAASpeedMultiplierBp(500)).toBe(2_500);
      expect(lightAASpeedMultiplierBp(600)).toBe(2_500);
      expect(lightAASpeedMultiplierBp(1000)).toBe(2_500);
    });
  });

  describe("floor + max(1_000) behavior", () => {
    it("should floor the result of base × bp / 10_000", () => {
      // 60_000 * 7_500 / 10_000 = 45_000 (exact)
      expect(effectiveLightAAWindowMilliseconds(60_000, 7_500)).toBe(45_000);
      // 120_000 * 5_000 / 10_000 = 60_000 (exact)
      expect(effectiveLightAAWindowMilliseconds(120_000, 5_000)).toBe(60_000);
    });

    it("should clamp to max(1_000) minimum", () => {
      // Very small base * small multiplier should be clamped to 1_000
      expect(effectiveLightAAWindowMilliseconds(100, 10_000)).toBe(1_000);
      expect(effectiveLightAAWindowMilliseconds(200, 5_000)).toBe(1_000); // 200*5000/10000 = 100 < 1000
    });

    it("should not clamp when result is above 1_000", () => {
      expect(effectiveLightAAWindowMilliseconds(60_000, 2_500)).toBe(15_000);
    });
  });

  describe("profile not in eligibility matrix rejected", () => {
    it("should reject heavy ASM at light AA layer", () => {
      const systems = [makeLightAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.HEAVY_ASM });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      expect(lightOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject medium ASM at light AA layer", () => {
      const systems = [makeLightAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.MEDIUM_ASM });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      expect(lightOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject anti-radiation weapon at light AA layer", () => {
      const systems = [makeLightAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.ANTI_RADIATION_WEAPON });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      expect(lightOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });
  });

  describe("resolution integration with window output", () => {
    it("should report effectiveWindowMs for LIGHT_AA layer with level bombing at 150 knots", () => {
      const systems = [makeLightAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
        speedKnots: SafeInt(150), // < 200 knots → 10_000bp multiplier
      });
      const context = makeContext({ attackerRangeM: SafeInt(2_000) }); // within light AA range

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      // 120_000ms * 10_000 / 10_000 = 120_000ms
      expect(lightOutcome.effectiveWindowMs).toBe(120_000);
      expect(lightOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });

    it("should report effectiveWindowMs for dive bombing at 400 knots", () => {
      const systems = [makeLightAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_DIVE_BOMBING,
        speedKnots: SafeInt(400), // 350..<500 → 5_000bp multiplier
      });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      // 60_000ms * 5_000 / 10_000 = 30_000ms
      expect(lightOutcome.effectiveWindowMs).toBe(30_000);
    });

    it("should report effectiveWindowMs = 0 for ineligible attack types", () => {
      const systems = [makeLightAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.HEAVY_ASM });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      expect(lightOutcome.effectiveWindowMs).toBe(0);
    });
  });

  describe("all aircraft delivery types accepted at light AA", () => {
    it("should accept level bombing, dive, skip, torpedo, rocket, guided weapon", () => {
      const aircraftTypes = [
        AttackType.AIRCRAFT_LEVEL_BOMBING,
        AttackType.AIRCRAFT_DIVE_BOMBING,
        AttackType.AIRCRAFT_SKIP_BOMBING,
        AttackType.AIRCRAFT_TORPEDO_ATTACK,
        AttackType.AIRCRAFT_ROCKET_ATTACK,
        AttackType.AIRCRAFT_GUIDED_WEAPON_ATTACK,
      ];

      for (const attackType of aircraftTypes) {
        const systems = [makeLightAASystem()];
        const state = makeState(systems);
        const attack = makeAttack({ attackType });
        const context = makeContext({ attackerRangeM: SafeInt(2_000) }); // within light AA range

        const result = resolveLayerEligibility(state, attack, context);
        const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
        expect(lightOutcome.eligibleSystems[0]!.eligible).toBe(true);
      }
    });
  });

  describe("LIGHT_ASM explicit capability at light AA", () => {
    it("should reject LIGHT_ASM when system does not list it in profileEligibility", () => {
      const systems = [makeLightAASystem({ profileEligibility: new Set(["CA"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      expect(lightOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should accept LIGHT_ASM when system explicitly lists it", () => {
      const systems = [makeLightAASystem({ profileEligibility: new Set(["CA", "LIGHT_ASM"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext({ attackerRangeM: SafeInt(2_000) });

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      expect(lightOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });

  describe("target type filtering", () => {
    it("should reject when target type not in system profileEligibility", () => {
      const systems = [makeLightAASystem({ profileEligibility: new Set(["CV"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.AIRCRAFT_LEVEL_BOMBING });
      const context = makeContext({ targetType: "CA" }); // CA not in ["CV"]

      const result = resolveLayerEligibility(state, attack, context);

      const lightOutcome = result.find((r) => r.layer === "LIGHT_AA")!;
      expect(lightOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });
  });
});
