// packages/combat/test/air-defense/director-scaling.test.ts
// AC-8: Director assignment order (§11) + scaling table values (§12).
// Verifies the canonical shipped director scaling schedule and the §11
// deterministic assignment ordering comparator.

import { describe, it, expect } from "vite-plus/test";
import {
  DIRECTOR_SCALING_TABLE,
  directorScalingBp,
  orderDirectorAssignments,
} from "../../src/air-defense/index.js";
import type { DirectorAssignmentCandidate } from "../../src/air-defense/index.js";

const cand = (over: Partial<DirectorAssignmentCandidate>): DirectorAssignmentCandidate => ({
  layer: "MEDIUM_AA",
  threatScoreBp: 5_000,
  timeToImpactMs: 10_000,
  targetId: "T-1",
  directorId: "D-1",
  ...over,
});

describe("Director scaling (DESIGN-45 §12)", () => {
  it("exposes the exact shipped schedule", () => {
    expect(DIRECTOR_SCALING_TABLE).toEqual([
      [0, 5_000],
      [1, 10_000],
      [2, 18_000],
      [3, 25_000],
      [4, 31_000],
    ]);
  });

  it("maps each director count to its shipped scaling value", () => {
    expect(Number(directorScalingBp(0))).toBe(5_000);
    expect(Number(directorScalingBp(1))).toBe(10_000);
    expect(Number(directorScalingBp(2))).toBe(18_000);
    expect(Number(directorScalingBp(3))).toBe(25_000);
    expect(Number(directorScalingBp(4))).toBe(31_000);
  });

  it("clamps director counts above the shipped cap (4) to the cap value", () => {
    expect(Number(directorScalingBp(5))).toBe(31_000);
    expect(Number(directorScalingBp(8))).toBe(31_000);
  });

  it("rejects negative director counts", () => {
    expect(() => directorScalingBp(-1)).toThrow();
  });
});

describe("Director assignment order (DESIGN-45 §11)", () => {
  it("assigns by layer priority first (HEAVY_AA before CIWS)", () => {
    const order = orderDirectorAssignments([
      cand({ layer: "CIWS_TERMINAL_DEFENSE", directorId: "D-ciws" }),
      cand({ layer: "HEAVY_AA", directorId: "D-heavy" }),
    ]);
    expect(order[0].directorId).toBe("D-heavy");
    expect(order[1].directorId).toBe("D-ciws");
  });

  it("orders by threat score descending within a layer", () => {
    const order = orderDirectorAssignments([
      cand({ threatScoreBp: 3_000, directorId: "D-low" }),
      cand({ threatScoreBp: 9_000, directorId: "D-high" }),
      cand({ threatScoreBp: 6_000, directorId: "D-mid" }),
    ]);
    expect(order.map((c) => c.directorId)).toEqual(["D-high", "D-mid", "D-low"]);
  });

  it("orders by time-to-impact ascending when threat is equal", () => {
    const order = orderDirectorAssignments([
      cand({ timeToImpactMs: 40_000, directorId: "D-late" }),
      cand({ timeToImpactMs: 10_000, directorId: "D-soon" }),
    ]);
    expect(order.map((c) => c.directorId)).toEqual(["D-soon", "D-late"]);
  });

  it("breaks fully-bound ties by target id then director id (ascending, codepoint)", () => {
    const order = orderDirectorAssignments([
      cand({ targetId: "T-2", directorId: "D-2" }),
      cand({ targetId: "T-1", directorId: "D-9" }),
      cand({ targetId: "T-1", directorId: "D-1" }),
    ]);
    expect(order[0]).toMatchObject({ targetId: "T-1", directorId: "D-1" });
    expect(order[1]).toMatchObject({ targetId: "T-1", directorId: "D-9" });
    expect(order[2]).toMatchObject({ targetId: "T-2" });
  });

  it("is deterministic and does not mutate the input array", () => {
    const input = [
      cand({ directorId: "D-3" }),
      cand({ directorId: "D-1" }),
      cand({ directorId: "D-2" }),
    ];
    const snapshot = [...input];
    const first = orderDirectorAssignments(input);
    const second = orderDirectorAssignments(input);
    expect(first.map((c) => c.directorId)).toEqual(second.map((c) => c.directorId));
    // Input unchanged (immutability)
    expect(input).toEqual(snapshot);
    // Two identical-tier candidates keep a stable relative order (no ties at layer/threat/time)
    expect(new Set(first.map((c) => c.directorId)).size).toBe(3);
  });
});
