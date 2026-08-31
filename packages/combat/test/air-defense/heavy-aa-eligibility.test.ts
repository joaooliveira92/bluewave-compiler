// packages/combat/test/air-defense/heavy-aa-eligibility.test.ts
// AC-4: Heavy AA protects own ship + 5nm protected radius (DESIGN-45 §7).

import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  resolveLayerEligibility,
  HEAVY_AA_PROTECTED_RADIUS_EXCEEDED,
  PROTECTED_RADIUS,
  AttackType,
} from "../../src/air-defense/index.js";
import {
  makeHeavyAASystem,
  makeAttack,
  makeState,
  makeContext,
  withDamage,
} from "./test-helpers.js";

describe("AC-4: Heavy AA eligibility (§7)", () => {
  it("PROTECTED_RADIUS should be 9260m (5 nautical miles)", () => {
    // 5 nm × 1852 m/nm = 9260 m
    expect(PROTECTED_RADIUS).toBe(9_260);
  });

  describe("own-ship engagement", () => {
    it("should be eligible when attacking the defended ship itself", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ targetId: "ship_001" });
      const context = makeContext({ defendingShipId: "ship_001", targetShipId: "ship_001" });

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(true);
      expect(heavyOutcome.eligibleSystems[0]!.reason).toBe("");
    });
  });

  describe("nearby protected ship within 5nm", () => {
    it("should be eligible when target is a nearby ship within PROTECTED_RADIUS", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ targetId: "ship_002" });
      const context = makeContext({
        defendingShipId: "ship_001",
        targetShipId: "ship_002",
        nearbyShips: new Map([
          ["ship_002", SafeInt(4_000)], // 4000m < 9260m → within radius
        ]),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });

    it("should be eligible at exactly PROTECTED_RADIUS boundary (9260m)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ targetId: "ship_002" });
      const context = makeContext({
        defendingShipId: "ship_001",
        targetShipId: "ship_002",
        nearbyShips: new Map([
          ["ship_002", SafeInt(9_260)], // exactly at boundary
        ]),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      // 9260 <= 9260 → within radius
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });

  describe("ship beyond 5nm rejected", () => {
    it("should reject target beyond PROTECTED_RADIUS with HEAVY_AA_PROTECTED_RADIUS_EXCEEDED", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ targetId: "ship_003" });
      const context = makeContext({
        defendingShipId: "ship_001",
        targetShipId: "ship_003",
        nearbyShips: new Map([
          ["ship_003", SafeInt(10_000)], // 10000m > 9260m → beyond radius
        ]),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
      expect(heavyOutcome.eligibleSystems[0]!.reason).toBe(HEAVY_AA_PROTECTED_RADIUS_EXCEEDED);
    });

    it("should reject target with unknown ship ID (not in nearbyShips map)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ targetId: "unknown_ship" });
      const context = makeContext({
        defendingShipId: "ship_001",
        targetShipId: "unknown_ship",
        nearbyShips: new Map(),
      });

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
      expect(heavyOutcome.eligibleSystems[0]!.reason).toBe(HEAVY_AA_PROTECTED_RADIUS_EXCEEDED);
    });
  });

  describe("out-of-range/altitude/speed rejected", () => {
    it("should reject when attacker is beyond system range", () => {
      const systems = [makeHeavyAASystem({ rangeMaxM: SafeInt(15_000) })];
      const state = makeState(systems);
      const attack = makeAttack();
      const context = makeContext({
        attackerRangeM: SafeInt(20_000), // beyond 15_000m range
      });

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject when attacker is below system minimum range", () => {
      const systems = [makeHeavyAASystem({ rangeMinM: SafeInt(2_000) })];
      const state = makeState(systems);
      const attack = makeAttack();
      const context = makeContext({
        attackerRangeM: SafeInt(1_000), // below 2_000m min range
      });

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject when attacker altitude exceeds system max altitude", () => {
      const systems = [makeHeavyAASystem({ altitudeMaxM: SafeInt(10_000) })];
      const state = makeState(systems);
      const attack = makeAttack();
      const context = makeContext({
        attackerAltitudeM: SafeInt(12_000), // above 10_000m max
      });

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject when attacker speed exceeds system speed limit", () => {
      // System limit: 400 m/s. Attacker: 900 knots ≈ 462 m/s > 400
      const systems = [makeHeavyAASystem({ targetSpeedLimitMps: SafeInt(400) })];
      const state = makeState(systems);
      const attack = makeAttack({ speedKnots: SafeInt(900) });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });
  });

  describe("sunk/disabled ship rejected", () => {
    it("should reject when defender ship is sunk (damageBp >= 10_000)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const sunkState = withDamage(state, SafeInt(10_000));
      const attack = makeAttack();
      const context = makeContext();

      const result = resolveLayerEligibility(sunkState, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should accept when defender ship has damage but not sunk", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const damagedState = withDamage(state, SafeInt(5_000));
      const attack = makeAttack();
      const context = makeContext();

      const result = resolveLayerEligibility(damagedState, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });

  describe("attack type eligibility", () => {
    it("should accept level bombing (in HEAVY_AA eligible set)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.AIRCRAFT_LEVEL_BOMBING });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });

    it("should accept rocket attack (in HEAVY_AA eligible set)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.AIRCRAFT_ROCKET_ATTACK });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });

    it("should accept guided weapon attack (in HEAVY_AA eligible set)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.AIRCRAFT_GUIDED_WEAPON_ATTACK });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });

    it("should reject dive bombing (NOT in HEAVY_AA eligible set per §18)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.AIRCRAFT_DIVE_BOMBING });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject heavy ASM (NOT in HEAVY_AA eligible set per §18)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.HEAVY_ASM });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should reject anti-radiation weapon (NOT in HEAVY_AA eligible set)", () => {
      const systems = [makeHeavyAASystem()];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.ANTI_RADIATION_WEAPON });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });
  });

  describe("explicit capability for LIGHT_ASM", () => {
    it("should reject LIGHT_ASM when system does not list it in profileEligibility", () => {
      const systems = [makeHeavyAASystem({ profileEligibility: new Set(["CA"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(false);
    });

    it("should accept LIGHT_ASM when system explicitly lists it in profileEligibility", () => {
      const systems = [makeHeavyAASystem({ profileEligibility: new Set(["CA", "LIGHT_ASM"]) })];
      const state = makeState(systems);
      const attack = makeAttack({ attackType: AttackType.LIGHT_ASM });
      const context = makeContext();

      const result = resolveLayerEligibility(state, attack, context);

      const heavyOutcome = result.find((r) => r.layer === "HEAVY_AA")!;
      expect(heavyOutcome.eligibleSystems[0]!.eligible).toBe(true);
    });
  });
});
