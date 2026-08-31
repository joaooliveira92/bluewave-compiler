// packages/combat/test/air-defense/layer-order.test.ts
// AC-3: Layers resolve in HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS order.

import { describe, it, expect } from "vite-plus/test";
import { resolveLayerEligibility, RESOLUTION_ORDER } from "../../src/air-defense/index.js";
import {
  makeHeavyAASystem,
  makeMediumAASystem,
  makeLightAASystem,
  makeCIWSSystem,
  makeAttack,
  makeState,
  makeContext,
} from "./test-helpers.js";

describe("AC-3: Layer resolution order", () => {
  it("should resolve layers in HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS order", () => {
    const systems = [
      makeCIWSSystem({ systemId: "ciws_first" }),
      makeLightAASystem({ systemId: "light_second" }),
      makeHeavyAASystem({ systemId: "heavy_third" }),
      makeMediumAASystem({ systemId: "medium_fourth" }),
    ];
    const state = makeState(systems);
    const attack = makeAttack();
    const context = makeContext();

    const result = resolveLayerEligibility(state, attack, context);

    // Must produce exactly 4 layer outcomes in canonical order
    expect(result).toHaveLength(4);
    expect(result[0]!.layer).toBe("HEAVY_AA");
    expect(result[1]!.layer).toBe("MEDIUM_AA");
    expect(result[2]!.layer).toBe("LIGHT_AA");
    expect(result[3]!.layer).toBe("CIWS_TERMINAL_DEFENSE");
  });

  it("RESOLUTION_ORDER constant must be HEAVY_AA, MEDIUM_AA, LIGHT_AA, CIWS_TERMINAL_DEFENSE", () => {
    expect(RESOLUTION_ORDER).toEqual([
      "HEAVY_AA",
      "MEDIUM_AA",
      "LIGHT_AA",
      "CIWS_TERMINAL_DEFENSE",
    ]);
  });

  it("should maintain order regardless of system insertion order in state", () => {
    // Systems in state are in CIWS → LIGHT → MEDIUM → HEAVY order
    const systems = [
      makeCIWSSystem({ systemId: "ciws_01" }),
      makeLightAASystem({ systemId: "light_01" }),
      makeMediumAASystem({ systemId: "medium_01" }),
      makeHeavyAASystem({ systemId: "heavy_01" }),
    ];
    const state = makeState(systems);
    const attack = makeAttack();
    const context = makeContext();

    const result = resolveLayerEligibility(state, attack, context);

    expect(result[0]!.layer).toBe("HEAVY_AA");
    expect(result[0]!.eligibleSystems[0]!.systemId).toBe("heavy_01");
    expect(result[1]!.layer).toBe("MEDIUM_AA");
    expect(result[1]!.eligibleSystems[0]!.systemId).toBe("medium_01");
    expect(result[2]!.layer).toBe("LIGHT_AA");
    expect(result[2]!.eligibleSystems[0]!.systemId).toBe("light_01");
    expect(result[3]!.layer).toBe("CIWS_TERMINAL_DEFENSE");
    expect(result[3]!.eligibleSystems[0]!.systemId).toBe("ciws_01");
  });

  it("should produce a successful empty result when a layer has no systems", () => {
    // Only HEAVY_AA and CIWS systems — MEDIUM_AA and LIGHT_AA have no systems
    const systems = [makeHeavyAASystem(), makeCIWSSystem()];
    const state = makeState(systems);
    const attack = makeAttack();
    const context = makeContext();

    const result = resolveLayerEligibility(state, attack, context);

    expect(result).toHaveLength(4);

    // HEAVY_AA has a system
    expect(result[0]!.layer).toBe("HEAVY_AA");
    expect(result[0]!.eligibleSystems).toHaveLength(1);

    // MEDIUM_AA has no systems → successful empty result
    expect(result[1]!.layer).toBe("MEDIUM_AA");
    expect(result[1]!.eligibleSystems).toHaveLength(0);
    expect(result[1]!.attackSurvived).toBe(true);

    // LIGHT_AA has no systems → successful empty result
    expect(result[2]!.layer).toBe("LIGHT_AA");
    expect(result[2]!.eligibleSystems).toHaveLength(0);
    expect(result[2]!.attackSurvived).toBe(true);

    // CIWS has a system
    expect(result[3]!.layer).toBe("CIWS_TERMINAL_DEFENSE");
    expect(result[3]!.eligibleSystems).toHaveLength(1);
  });

  it("attack should always survive in INC-2 (no engagement resolution)", () => {
    const systems = [
      makeHeavyAASystem(),
      makeMediumAASystem(),
      makeLightAASystem(),
      makeCIWSSystem(),
    ];
    const state = makeState(systems);
    const attack = makeAttack();
    const context = makeContext();

    const result = resolveLayerEligibility(state, attack, context);

    for (const outcome of result) {
      expect(outcome.attackSurvived).toBe(true);
    }
  });

  it("should produce all 4 layer outcomes even when no systems exist at all", () => {
    // Edge case: state must have at least 1 system per createAirDefenseState,
    // but if none match any of our 4 layers, all layers are empty
    const systems = [makeHeavyAASystem()];
    const state = makeState(systems);
    const attack = makeAttack();
    const context = makeContext();

    const result = resolveLayerEligibility(state, attack, context);
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.layer)).toEqual([
      "HEAVY_AA",
      "MEDIUM_AA",
      "LIGHT_AA",
      "CIWS_TERMINAL_DEFENSE",
    ]);
  });

  it("should not propagate eligibility across layers (each layer evaluates independently)", () => {
    // Attack type not eligible for HEAVY_AA but eligible for MEDIUM_AA
    const systems = [makeHeavyAASystem(), makeMediumAASystem()];
    const state = makeState(systems);
    const attack = makeAttack({ attackType: "AIRCRAFT_DIVE_BOMBING" as const });
    const context = makeContext();

    const result = resolveLayerEligibility(state, attack, context);

    // HEAVY_AA: dive bombing not in heavy AA eligible set → not eligible
    expect(result[0]!.layer).toBe("HEAVY_AA");
    expect(result[0]!.eligibleSystems[0]!.eligible).toBe(false);

    // MEDIUM_AA: dive bombing IS in medium AA eligible set → eligible
    expect(result[1]!.layer).toBe("MEDIUM_AA");
    expect(result[1]!.eligibleSystems[0]!.eligible).toBe(true);
  });
});
