// packages/combat/test/air-defense/ciws-redundancy.test.ts
// AC-10: CIWS redundancy schedule (§16).
// Verifies the marginal multiplier schedule, the effective system count, and that
// the schedule is an additive-value schedule (NOT a construction cap).

import { describe, it, expect } from "vite-plus/test";
import { CIWS_REDUNDANCY_TABLE, evaluateCiwsRedundancy } from "../../src/air-defense/index.js";

describe("CIWS redundancy (DESIGN-45 §16)", () => {
  it("exposes the exact shipped marginal schedule", () => {
    expect(CIWS_REDUNDANCY_TABLE).toEqual([
      [1, 10_000],
      [2, 10_000],
      [3, 10_000],
      [4, 10_000],
      [5, 5_000],
      [6, 5_000],
      [7, 1_500],
      [8, 1_500],
      [9, 500],
    ]);
  });

  it("reports the marginal multiplier of the last system", () => {
    expect(evaluateCiwsRedundancy(1).marginalLastBp).toBe(10_000);
    expect(evaluateCiwsRedundancy(4).marginalLastBp).toBe(10_000);
    expect(evaluateCiwsRedundancy(5).marginalLastBp).toBe(5_000);
    expect(evaluateCiwsRedundancy(6).marginalLastBp).toBe(5_000);
    expect(evaluateCiwsRedundancy(7).marginalLastBp).toBe(1_500);
    expect(evaluateCiwsRedundancy(8).marginalLastBp).toBe(1_500);
    expect(evaluateCiwsRedundancy(9).marginalLastBp).toBe(500);
    expect(evaluateCiwsRedundancy(12).marginalLastBp).toBe(500);
  });

  it("flags the reduced-value step at systems 5-6", () => {
    expect(evaluateCiwsRedundancy(4).diminishingStepActive).toBe(false);
    expect(evaluateCiwsRedundancy(5).diminishingStepActive).toBe(true);
    expect(evaluateCiwsRedundancy(6).diminishingStepActive).toBe(true);
    expect(evaluateCiwsRedundancy(7).diminishingStepActive).toBe(false);
  });

  it("flags the heavy reduction step at systems 7-8", () => {
    expect(evaluateCiwsRedundancy(6).heavyReductionStepActive).toBe(false);
    expect(evaluateCiwsRedundancy(7).heavyReductionStepActive).toBe(true);
    expect(evaluateCiwsRedundancy(8).heavyReductionStepActive).toBe(true);
    expect(evaluateCiwsRedundancy(9).heavyReductionStepActive).toBe(false);
  });

  it("flags strong redundancy at systems 9+", () => {
    expect(evaluateCiwsRedundancy(8).strongRedundancyActive).toBe(false);
    expect(evaluateCiwsRedundancy(9).strongRedundancyActive).toBe(true);
    expect(evaluateCiwsRedundancy(20).strongRedundancyActive).toBe(true);
  });

  it("computes the effective system count via the marginal sum", () => {
    // 1..4 → 4×10_000 = 40_000 → 4.0
    expect(evaluateCiwsRedundancy(4).effectiveSystemCountRational).toBe(4);
    // 40_000 + 2×5_000 = 50_000 → 5.0
    expect(evaluateCiwsRedundancy(6).effectiveSystemCountRational).toBe(5);
    // 50_000 + 2×1_500 = 53_000 → 5.3
    expect(evaluateCiwsRedundancy(8).effectiveSystemCountRational).toBe(5.3);
    // 53_000 + 500 = 53_500 → 5.35
    expect(evaluateCiwsRedundancy(9).effectiveSystemCountRational).toBe(5.35);
  });

  it("never drives effective value to zero (additive schedule, not a construction cap)", () => {
    // A very large CIWS stack still retains positive cumulative value.
    const r = evaluateCiwsRedundancy(40);
    expect(r.sumMarginalBp).toBeGreaterThan(0);
    expect(r.effectiveSystemCountRational).toBeGreaterThan(0);
  });

  it("treats a zero system count as an empty schedule", () => {
    const r = evaluateCiwsRedundancy(0);
    expect(r.systemCount).toBe(0);
    expect(r.marginalLastBp).toBe(0);
    expect(r.effectiveSystemCountRational).toBe(0);
    expect(r.sumMarginalBp).toBe(0);
  });

  it("rejects negative system counts", () => {
    expect(() => evaluateCiwsRedundancy(-1)).toThrow();
  });
});
