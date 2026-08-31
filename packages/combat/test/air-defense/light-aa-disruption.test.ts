// packages/combat/test/air-defense/light-aa-disruption.test.ts
// AC-7: Guaranteed disruption opportunity for light AA per DESIGN-45 §10.
// Ensures every eligible light-AA system receives at least one disruption check.
// The guaranteed opportunity does NOT guarantee ammunition, hit, damage, or abort.

import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import {
  evaluateLightAADisruptionOpportunity,
  LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED,
} from "../../src/air-defense/index.js";
import { makeLightAASystem, makeAttack, makeState, makeContext } from "./test-helpers.js";

// Default makeContext uses attackerRangeM = 8_000 which exceeds the light-AA
// rangeMaxM = 3_000. Every eligible test needs attackerRange within system range.
function inRangeContext(overrides?: Parameters<typeof makeContext>[0]) {
  return makeContext({ attackerRangeM: SafeInt(1_000), ...overrides });
}

describe("AC-7: guaranteed light-AA disruption opportunity (§10)", () => {
  it("grants every eligible light-AA system a disruption opportunity", () => {
    const system = makeLightAASystem();
    const state = makeState([system], { powerBp: SafeInt(10_000) });
    const attack = makeAttack();
    const context = inRangeContext();

    const result = evaluateLightAADisruptionOpportunity(system, state, attack, context, 0);
    expect(result.eligible).toBe(true);
    expect(result.reasonCode).toBe(LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED);
  });

  it("runs the disruption check against each eligible light-AA system independently", () => {
    const system1 = makeLightAASystem({ systemId: "light_001" });
    const system2 = makeLightAASystem({ systemId: "light_002" });
    const state = makeState([system1, system2], { powerBp: SafeInt(10_000) });
    const attack = makeAttack();
    const context = inRangeContext();

    const r1 = evaluateLightAADisruptionOpportunity(system1, state, attack, context, 100);
    const r2 = evaluateLightAADisruptionOpportunity(system2, state, attack, context, 100);
    expect(r1.reasonCode).toBe(LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED);
    expect(r2.reasonCode).toBe(LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED);
  });

  it("does NOT guarantee damage/abort: a result with NO_EFFECT is valid for an eligible system", () => {
    const system = makeLightAASystem();
    const state = makeState([system], { powerBp: SafeInt(10_000) });
    const attack = makeAttack();
    const context = inRangeContext();

    // Light AA base disruption = 15bp (createAirDefenseSystemDefinition default).
    // Draw (100) >= 15 → NO_EFFECT.
    const result = evaluateLightAADisruptionOpportunity(system, state, attack, context, 100);
    expect(result.eligible).toBe(true);
    expect(result.reasonCode).toBe(LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED);
    expect(result.outcome).toBe("NO_EFFECT");
    expect(result.severity).toBeNull();
  });

  it("can produce a DISRUPTION outcome for an eligible system with a favorable draw", () => {
    // Use a high base disruption value to reliably force a DISRUPTION outcome.
    const system = makeLightAASystem({
      baseDisruptionBp: SafeInt(9_000),
    });
    const state = makeState([system], { powerBp: SafeInt(10_000) });
    const attack = makeAttack();
    const context = inRangeContext();

    // Draw < 9_000 bp → DISRUPTION.
    const result = evaluateLightAADisruptionOpportunity(system, state, attack, context, 5_000);
    expect(result.eligible).toBe(true);
    expect(result.reasonCode).toBe(LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED);
    expect(result.outcome).toBe("DISRUPTION");
    expect(result.severity).toBe("SEVERE"); // disruptionBp >= 8_000 → SEVERE
  });

  it("is prohibited when the system is destroyed (zero mounts)", () => {
    const system = makeLightAASystem({ mountCount: SafeInt(0) });
    const state = makeState([system], { powerBp: SafeInt(10_000) });
    const attack = makeAttack();
    const context = inRangeContext();

    const result = evaluateLightAADisruptionOpportunity(system, state, attack, context, 100);
    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe("");
  });

  it("is prohibited when the system is out of ammunition", () => {
    const system = makeLightAASystem();
    const state = makeState([system], {
      ammunitionByType: new Map<string, SafeInt>([["light_001", SafeInt(0)]]),
      powerBp: SafeInt(10_000),
    });
    const attack = makeAttack();
    const context = inRangeContext();

    const result = evaluateLightAADisruptionOpportunity(system, state, attack, context, 100);
    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe("");
  });

  it("is prohibited when the system is unpowered", () => {
    const system = makeLightAASystem();
    const state = makeState([system]); // powerBp = 0 by default
    const attack = makeAttack();
    const context = inRangeContext();

    const result = evaluateLightAADisruptionOpportunity(system, state, attack, context, 100);
    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe("");
  });

  it("is prohibited when the attacker is out of arc (out of range)", () => {
    const system = makeLightAASystem();
    const state = makeState([system], { powerBp: SafeInt(10_000) });
    const attack = makeAttack();
    const context = makeContext({ attackerRangeM: SafeInt(5_000) }); // > rangeMaxM 3_000

    const result = evaluateLightAADisruptionOpportunity(system, state, attack, context, 100);
    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe("");
  });

  it("is prohibited when the target is ineligible", () => {
    const system = makeLightAASystem();
    const state = makeState([system], { powerBp: SafeInt(10_000) });
    const attack = makeAttack();
    const contextBB = inRangeContext({ targetType: "BB" });

    const result = evaluateLightAADisruptionOpportunity(system, state, attack, contextBB, 100);
    expect(result.eligible).toBe(false);
    expect(result.reasonCode).toBe("");
  });

  it("rejects invalid randomBp draws as no-effect (fail-safe)", () => {
    const system = makeLightAASystem();
    const state = makeState([system], { powerBp: SafeInt(10_000) });
    const attack = makeAttack();
    const context = inRangeContext();

    const result = evaluateLightAADisruptionOpportunity(system, state, attack, context, 10_000);
    expect(result.eligible).toBe(false);
    expect(result.outcome).toBe("NO_EFFECT");
  });
});
