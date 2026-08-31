// packages/combat/test/air-defense/radar-saturation.test.ts
// AC-9: Radar-directed medium-AA saturation diminishing returns (§14).
// Verifies the marginal multiplier schedule and the §14 effective group count.

import { describe, it, expect } from "vite-plus/test";
import { RADAR_SATURATION_TABLE, evaluateRadarSaturation } from "../../src/air-defense/index.js";

describe("Radar-directed medium-AA saturation (DESIGN-45 §14)", () => {
  it("exposes the exact shipped marginal schedule", () => {
    expect(RADAR_SATURATION_TABLE).toEqual([
      [1, 10_000],
      [2, 10_000],
      [3, 10_000],
      [4, 10_000],
      [5, 5_000],
      [6, 5_000],
      [7, 2_500],
      [8, 2_500],
      [9, 500],
    ]);
  });

  it("reports the marginal multiplier of the last group", () => {
    expect(evaluateRadarSaturation(1).marginalLastBp).toBe(10_000);
    expect(evaluateRadarSaturation(4).marginalLastBp).toBe(10_000);
    expect(evaluateRadarSaturation(5).marginalLastBp).toBe(5_000);
    expect(evaluateRadarSaturation(6).marginalLastBp).toBe(5_000);
    expect(evaluateRadarSaturation(7).marginalLastBp).toBe(2_500);
    expect(evaluateRadarSaturation(8).marginalLastBp).toBe(2_500);
    expect(evaluateRadarSaturation(9).marginalLastBp).toBe(500);
    expect(evaluateRadarSaturation(12).marginalLastBp).toBe(500);
  });

  it("flags the first diminishing step at groups 5-6", () => {
    expect(evaluateRadarSaturation(4).diminishingStepActive).toBe(false);
    expect(evaluateRadarSaturation(5).diminishingStepActive).toBe(true);
    expect(evaluateRadarSaturation(6).diminishingStepActive).toBe(true);
    expect(evaluateRadarSaturation(7).diminishingStepActive).toBe(false);
  });

  it("flags the heavy diminishing step at groups 7-8", () => {
    expect(evaluateRadarSaturation(6).heavyDiminishingStepActive).toBe(false);
    expect(evaluateRadarSaturation(7).heavyDiminishingStepActive).toBe(true);
    expect(evaluateRadarSaturation(8).heavyDiminishingStepActive).toBe(true);
    expect(evaluateRadarSaturation(9).heavyDiminishingStepActive).toBe(false);
  });

  it("flags the strong redundancy residual at groups 9+", () => {
    expect(evaluateRadarSaturation(8).redundantGroupActive).toBe(false);
    expect(evaluateRadarSaturation(9).redundantGroupActive).toBe(true);
    expect(evaluateRadarSaturation(20).redundantGroupActive).toBe(true);
  });

  it("computes the §14 effective group count via the marginal sum", () => {
    // groups 1..4 → 4×10_000 = 40_000
    expect(evaluateRadarSaturation(4).effectiveGroupCountRational).toBe(4);
    // 40_000 + 2×5_000 = 50_000 → 5.0
    expect(evaluateRadarSaturation(6).effectiveGroupCountRational).toBe(5);
    // 50_000 + 2×2_500 = 55_000 → 5.5
    expect(evaluateRadarSaturation(8).effectiveGroupCountRational).toBe(5.5);
    // 55_000 + 500 = 55_500 → 5.55
    expect(evaluateRadarSaturation(9).effectiveGroupCountRational).toBe(5.55);
  });

  it("treats a zero group count as an empty schedule", () => {
    const r = evaluateRadarSaturation(0);
    expect(r.groupCount).toBe(0);
    expect(r.marginalLastBp).toBe(0);
    expect(r.effectiveGroupCountRational).toBe(0);
    expect(r.sumMarginalBp).toBe(0);
  });

  it("rejects negative group counts", () => {
    expect(() => evaluateRadarSaturation(-1)).toThrow();
  });
});
