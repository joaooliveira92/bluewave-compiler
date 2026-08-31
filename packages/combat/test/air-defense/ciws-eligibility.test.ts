// packages/combat/test/air-defense/ciws-eligibility.test.ts
// CIWS terminal defense layer eligibility tests per DESIGN-45 §16, §18.

import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import { resolveLayerEligibility, AttackType } from "../../src/air-defense/index.js";
import { makeCIWSSystem, makeAttack, makeState, makeContext } from "./test-helpers.js";

describe("CIWS terminal defense eligibility (§16, §18)", () => {
  describe("all §18-eligible aircraft delivery types accepted", () => {
    it("should accept all aircraft delivery types at CIWS layer", () => {
      const aircraftTypes = [
        AttackType.AIRCRAFT_LEVEL_BOMBING,
        AttackType.AIRCRAFT_DIVE_BOMBING,
        AttackType.AIRCRAFT_SKIP_BOMBING,
        AttackType.AIRCRAFT_TORPEDO_ATTACK,
        AttackType.AIRCRAFT_ROCKET_ATTACK,
        AttackType.AIRCRAFT_GUIDED_WEAPON_ATTACK,
      ];

      for (const attackType of aircraftTypes) {
        const systems = [makeCIWSSystem()];
        const state = makeState(systems);
        const attack = makeAttack({ attackType });
        const context = makeContext({ attackerRangeM: SafeInt(1_000) }); // within CIWS range

        const result = resolveLayerEligibility(state, attack, context);
        const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
        expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(true);
      }
    });
  });

  describe("heavy ASM at CIWS layer (explicit capability required, §18)", () => {
    it("should reject heavy ASM when CIWS profileEligibility does NOT include HEAVY_ASM", () => {
      const systems = [makeCIWSSystem({ profileEligibility: new Set(["CA", "CV", "DD"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.HEAVY_ASM });
      const context = makeContext({ attackerRangeM: SafeInt(1_000) });

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should accept heavy ASM when CIWS profileEligibility includes HEAVY_ASM", () => {
      const systems = [makeCIWSSystem({ profileEligibility: new Set(["CA", "HEAVY_ASM"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.HEAVY_ASM });
      const context = makeContext({ attackerRangeM: SafeInt(1_000) });

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });

  describe("medium ASM at CIWS layer (compatible terminal defense, §18)", () => {
    it("should reject medium ASM when CIWS profileEligibility does NOT include MEDIUM_ASM", () => {
      const systems = [makeCIWSSystem({ profileEligibility: new Set(["CA", "CV", "DD"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.MEDIUM_ASM });
      const context = makeContext({ attackerRangeM: SafeInt(1_000) });

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should accept medium ASM when CIWS profileEligibility includes MEDIUM_ASM", () => {
      const systems = [makeCIWSSystem({ profileEligibility: new Set(["CA", "MEDIUM_ASM"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.MEDIUM_ASM });
      const context = makeContext({ attackerRangeM: SafeInt(1_000) });

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });

  describe("light ASM at CIWS layer (§18)", () => {
    it("should accept light ASM at CIWS layer", () => {
      const systems = [makeCIWSSystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext({ attackerRangeM: SafeInt(1_000) }); // within CIWS range

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });

  describe("attack types NOT in CIWS eligible set", () => {
    it("should reject anti-radiation weapon at CIWS layer", () => {
      const systems = [makeCIWSSystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.ANTI_RADIATION_WEAPON });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject special explicit attack at CIWS layer", () => {
      const systems = [makeCIWSSystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.SPECIAL_EXPLICIT_ATTACK });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });
  });

  describe("target type filtering", () => {
    it("should reject when target type not in CIWS system profileEligibility (light ASM, no explicit-capability requirement)", () => {
      const systems = [makeCIWSSystem({ profileEligibility: new Set(["CV"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext({ targetType: "CA", attackerRangeM: SafeInt(1_000) }); // CA not in ["CV"]

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should accept when target type matches CIWS system profileEligibility (light ASM, no explicit-capability requirement)", () => {
      const systems = [makeCIWSSystem({ profileEligibility: new Set(["CA", "CV"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext({ targetType: "CV", attackerRangeM: SafeInt(1_000) });

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });

  describe("capability checks", () => {
    it("should reject when attacker is beyond CIWS system range (light ASM, no explicit-capability requirement)", () => {
      const systems = [makeCIWSSystem({ rangeMaxM: SafeInt(1_500) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext({ attackerRangeM: SafeInt(2_000) }); // beyond 1_500m

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should accept when attacker is within CIWS system range (light ASM, no explicit-capability requirement)", () => {
      const systems = [makeCIWSSystem({ rangeMaxM: SafeInt(1_500) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext({ attackerRangeM: SafeInt(1_000) }); // within 1_500m

      const result = resolveLayerEligibility(state, attack, context);

      const ciwsOutcome = result.find((r) => r.layer === "CIWS_TERMINAL_DEFENSE")!;
      expect(ciwsOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });
});
