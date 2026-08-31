// packages/combat/test/air-defense/medium-aa-timing.test.ts
// AC-5: Medium AA pre-release window with 4_000bp FC solution (DESIGN-45 §8).

import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  resolveLayerEligibility,
  MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED,
  AttackType,
} from "../../src/air-defense/index.js";
import {
  makeMediumAASystem,
  makeAttack,
  makeState,
  makeContext,
  withReservations,
} from "./test-helpers.js";

describe("AC-5: Medium AA eligibility (§8)", () => {
  describe("pre-release window + FC solution accepted", () => {
    it("should accept mediumAaEligible profile with pre-release + FC >= 4_000bp", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
        mediumAaEligible: true,
      });
      const context = makeContext({
        isPreRelease: true,
        fireControlSolutionBp: SafeInt(4_000), // exactly 4_000bp
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(true);
      expect(mediumOutcome.eligibleSystems[0]!.reason).toBe("");
    });

    it("should accept with high FC solution (10_000bp)", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_DIVE_BOMBING,
        mediumAaEligible: true,
      });
      const context = makeContext({
        isPreRelease: true,
        fireControlSolutionBp: SafeInt(10_000),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });

  describe("FC solution < 4_000bp rejected", () => {
    it("should reject when FC solution is below 4_000bp", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
        mediumAaEligible: true,
      });
      const context = makeContext({
        isPreRelease: true,
        fireControlSolutionBp: SafeInt(3_999),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject when FC solution is zero", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
        mediumAaEligible: true,
      });
      const context = makeContext({
        isPreRelease: true,
        fireControlSolutionBp: SafeInt(0),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });
  });

  describe("post-release with no support rejected", () => {
    it("should reject when attacker has released weapons (isPreRelease = false)", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
        mediumAaEligible: true,
      });
      const context = makeContext({
        isPreRelease: false,
        fireControlSolutionBp: SafeInt(8_000),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
      expect(mediumOutcome.eligibleSystems[0]!.reason).toBe(MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED);
    });

    it("should reject post-release even with high FC solution", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_SKIP_BOMBING,
        mediumAaEligible: true,
      });
      const context = makeContext({
        isPreRelease: false,
        fireControlSolutionBp: SafeInt(10_000),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
      expect(mediumOutcome.eligibleSystems[0]!.reason).toBe(MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED);
    });
  });

  describe("non-mediumAaEligible profile rejected", () => {
    it("should reject heavy ASM (not mediumAaEligible)", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.HEAVY_ASM,
        mediumAaEligible: false,
      });
      const context = makeContext({
        isPreRelease: true,
        fireControlSolutionBp: SafeInt(8_000),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject medium ASM (not mediumAaEligible)", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.MEDIUM_ASM,
        mediumAaEligible: false,
      });
      const context = makeContext({
        isPreRelease: true,
        fireControlSolutionBp: SafeInt(8_000),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject anti-radiation weapon (not mediumAaEligible)", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.ANTI_RADIATION_WEAPON,
        mediumAaEligible: false,
      });
      const context = makeContext({
        isPreRelease: true,
        fireControlSolutionBp: SafeInt(8_000),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("mediumAaEligible flag on the attack descriptor is computed from attackType, not caller-provided", () => {
      // Even if caller passes mediumAaEligible: true for HEAVY_ASM,
      // the constructor computes it from the attack type
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({
        attackType: AttackType.HEAVY_ASM,
        // Note: createAirDefenseAttack ignores this and computes from attackType
      });
      const context = makeContext({
        isPreRelease: true,
        fireControlSolutionBp: SafeInt(8_000),
      });

      // The attack's mediumAaEligible is computed from attackType
      expect(attack.mediumAaEligible).toBe(false);

      const result = resolveLayerEligibility(state, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });
  });

  describe("medium AA attack type eligibility (§18)", () => {
    it("should accept all aircraft delivery types", () => {
      const aircraftTypes = [
        AttackType.AIRCRAFT_LEVEL_BOMBING,
        AttackType.AIRCRAFT_DIVE_BOMBING,
        AttackType.AIRCRAFT_SKIP_BOMBING,
        AttackType.AIRCRAFT_TORPEDO_ATTACK,
        AttackType.AIRCRAFT_ROCKET_ATTACK,
        AttackType.AIRCRAFT_GUIDED_WEAPON_ATTACK,
      ];

      for (const attackType of aircraftTypes) {
        const systems = [makeMediumAASystem()];
        const state = makeState(systems);
        const attack = makeAttack({ attackType, mediumAaEligible: true });
        const context = makeContext({ isPreRelease: true, fireControlSolutionBp: SafeInt(8_000) });

        const result = resolveLayerEligibility(state, attack, context);
        const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
        expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(true);
      }
    });

    it("should reject non-aircraft types not in MEDIUM_AA eligible set", () => {
      const nonAircraftTypes = [
        AttackType.HEAVY_ASM,
        AttackType.MEDIUM_ASM,
        AttackType.LIGHT_ASM,
        AttackType.ANTI_RADIATION_WEAPON,
        AttackType.SPECIAL_EXPLICIT_ATTACK,
      ];

      for (const attackType of nonAircraftTypes) {
        const systems = [makeMediumAASystem()];
        const state = makeState(systems);
        const attack = makeAttack({ attackType });
        const context = makeContext({ isPreRelease: true, fireControlSolutionBp: SafeInt(8_000) });

        const result = resolveLayerEligibility(state, attack, context);
        const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
        expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
      }
    });
  });

  describe("channel availability", () => {
    it("should reject when all channels are reserved by other systems", () => {
      const systems = [makeMediumAASystem()];
      const state = makeState(systems);
      const reservedState = withReservations(state, new Map([["ch_medium_01", "other_system"]]));
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
        mediumAaEligible: true,
      });
      const context = makeContext({ isPreRelease: true, fireControlSolutionBp: SafeInt(8_000) });

      const result = resolveLayerEligibility(reservedState, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should accept when channel is reserved for the same system", () => {
      const systems = [makeMediumAASystem({ systemId: "medium_001" })];
      const state = makeState(systems);
      const reservedState = withReservations(state, new Map([["ch_medium_01", "medium_001"]]));
      const attack = makeAttack({
        attackType: AttackType.AIRCRAFT_LEVEL_BOMBING,
        mediumAaEligible: true,
      });
      const context = makeContext({ isPreRelease: true, fireControlSolutionBp: SafeInt(8_000) });

      const result = resolveLayerEligibility(reservedState, attack, context);

      const mediumOutcome = result.find((r) => r.layer === "MEDIUM_AA")!;
      expect(mediumOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });
});
