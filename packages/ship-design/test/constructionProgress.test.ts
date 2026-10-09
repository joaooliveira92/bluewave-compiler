import { describe, expect, it } from "vite-plus/test";
import {
  advanceConstructionMonth,
  buildProgressOf,
  emptyProgress,
  isConstructionComplete,
  LINE_IDS,
  progressFromSingleFigure,
  simulateConstruction,
  totalDone,
  type ConstructionPlan,
  type LineId,
  type PackageProgress,
  type WorkPackage,
} from "../src/index.js";

const pk = (
  id: string,
  kind: WorkPackage["kind"],
  line: LineId,
  totalWork: number,
  dependsOn: string[] = [],
): WorkPackage => ({ id, kind, line, totalWork, dependsOn });
/** A small plan with the real package shape and dependencies. */
const plan: ConstructionPlan = (() => {
  const packages = [
    pk("hull", "HULL", "slipway", 100),
    pk("machinery", "MACHINERY", "machinery", 40),
    pk("armour", "ARMOUR", "armour_plate", 60),
    pk("ordnance", "ORDNANCE", "heavy_gun", 30),
    pk("launch", "LAUNCH", "slipway", 20, ["hull"]),
    pk("fit_out", "FIT_OUT", "quay", 50, ["launch", "machinery", "armour", "ordnance"]),
    pk("trials", "TRIALS", "trials", 10, ["fit_out"]),
    pk("acceptance", "ACCEPTANCE", "trials", 5, ["trials"]),
  ];
  return { packages, totalWork: packages.reduce((a, p) => a + p.totalWork, 0) };
})();
const capacity = (n: number): Record<LineId, number> =>
  Object.fromEntries(LINE_IDS.map((l) => [l, n])) as Record<LineId, number>;

const runSteps = (cap: Record<LineId, number>, funds: number | null, max = 200) => {
  let progress = emptyProgress(plan);
  const months: Record<string, number>[] = [];
  for (let m = 0; m < max && !isConstructionComplete(plan, progress); m++) {
    const step = advanceConstructionMonth(plan, progress, cap, funds);
    months.push({ ...step.applied });
    progress = step.progress;
  }
  return { progress, months };
};

describe("advanceConstructionMonth", () => {
  it("applies work only to packages whose dependencies are complete", () => {
    const m1 = advanceConstructionMonth(plan, emptyProgress(plan), capacity(1_000), null);
    expect(m1.applied).toEqual({ hull: 100, machinery: 40, armour: 60, ordnance: 30 });
    expect([...m1.completed].sort()).toEqual(["armour", "hull", "machinery", "ordnance"]);
    // Launch could not start in the same month hull finished: dependencies are read at the month's start.
    expect(m1.progress["launch"]).toBe(0);
  });

  it("is limited by line capacity and by funds, never exceeding remaining work", () => {
    const capped = advanceConstructionMonth(plan, emptyProgress(plan), capacity(25), null);
    expect(capped.applied).toEqual({ hull: 25, machinery: 25, armour: 25, ordnance: 25 });
    expect([...capped.limitedLines].sort()).toEqual([
      "armour_plate",
      "heavy_gun",
      "machinery",
      "slipway",
    ]);
    const poor = advanceConstructionMonth(plan, emptyProgress(plan), capacity(1_000), 50);
    expect(Object.values(poor.applied).reduce((a, b) => a + b, 0)).toBe(50);
    expect(poor.applied["hull"]).toBe(50); // contended funds go to packages in canonical order
    for (const p of plan.packages) expect(poor.progress[p.id]!).toBeLessThanOrEqual(p.totalWork);
  });

  it("does not mutate its input, and zero funds changes nothing", () => {
    const start = emptyProgress(plan);
    const snap = JSON.stringify(start);
    const idle = advanceConstructionMonth(plan, start, capacity(1_000), 0);
    expect(JSON.stringify(start)).toBe(snap);
    expect(idle.applied).toEqual({ hull: 0, machinery: 0, armour: 0, ordnance: 0 });
    expect(idle.completed).toEqual([]);
  });

  it("is deterministic", () => {
    const a = advanceConstructionMonth(plan, emptyProgress(plan), capacity(30), 80);
    const b = advanceConstructionMonth(plan, emptyProgress(plan), capacity(30), 80);
    expect(a).toEqual(b);
  });
});

describe("stepping equals simulating", () => {
  it("repeated steps reproduce simulateConstruction month for month, for several capacities and funding", () => {
    for (const cap of [15, 40, 1_000]) {
      for (const monthlyFundingMicro of [null, 60]) {
        const sim = simulateConstruction(
          plan,
          { capacity: capacity(cap), monthlyFundingMicro, costPerWorkMicro: 1 },
          500,
        );
        const stepped = runSteps(capacity(cap), monthlyFundingMicro);
        expect(stepped.months.length).toBe(sim.durationMonths);
        expect(stepped.months).toEqual(sim.months.map((m) => ({ ...m.applied })));
        expect(stepped.progress).toEqual(sim.finalWork);
      }
    }
  });

  it("is resumable: stopping mid-way and continuing gives the same end state", () => {
    const first = advanceConstructionMonth(plan, emptyProgress(plan), capacity(20), null);
    const second = advanceConstructionMonth(plan, first.progress, capacity(20), null);
    const direct = runSteps(capacity(20), null);
    let progress: PackageProgress = second.progress;
    while (!isConstructionComplete(plan, progress))
      progress = advanceConstructionMonth(plan, progress, capacity(20), null).progress;
    expect(progress).toEqual(direct.progress);
  });
});

describe("buildProgressOf", () => {
  it("reads hull progress, started packages and launch from real state", () => {
    const empty = buildProgressOf(plan, emptyProgress(plan));
    expect(empty).toEqual({
      hullDoneWork: 0,
      hullTotalWork: 100,
      armourStarted: false,
      machineryStarted: false,
      launched: false,
      affectedDoneWork: 0,
    });
    const mid = buildProgressOf(plan, { ...emptyProgress(plan), hull: 100, launch: 5, armour: 1 });
    expect(mid).toMatchObject({
      hullDoneWork: 100,
      armourStarted: true,
      machineryStarted: false,
      launched: false,
    });
    expect(mid.affectedDoneWork).toBe(106);
    expect(buildProgressOf(plan, { ...emptyProgress(plan), hull: 100, launch: 20 }).launched).toBe(
      true,
    );
  });
});

describe("progressFromSingleFigure (saves made before per-package progress)", () => {
  it("is empty at zero and complete at the total", () => {
    expect(totalDone(plan, progressFromSingleFigure(plan, 0, 1_000))).toBe(0);
    const full = progressFromSingleFigure(plan, 1_000, 1_000);
    expect(isConstructionComplete(plan, full)).toBe(true);
    expect(totalDone(plan, full)).toBe(plan.totalWork);
  });
  it("pours work into the hull first, so a partly built ship reads as hull work only", () => {
    const part = progressFromSingleFigure(plan, 250, 1_000); // 25% of 315 = 78
    expect(part["hull"]).toBe(78);
    expect(part["machinery"]).toBe(0);
    const bp = buildProgressOf(plan, part);
    expect(bp).toMatchObject({ armourStarted: false, machineryStarted: false, launched: false });
  });
  it("conserves the scaled total, never exceeds a package, and ignores nonsense", () => {
    const p = progressFromSingleFigure(plan, 600, 1_000);
    for (const pkg of plan.packages) expect(p[pkg.id]!).toBeLessThanOrEqual(pkg.totalWork);
    expect(totalDone(plan, p)).toBe(Math.floor((plan.totalWork * 600) / 1_000));
    expect(totalDone(plan, progressFromSingleFigure(plan, -5, 1_000))).toBe(0);
    expect(totalDone(plan, progressFromSingleFigure(plan, 5, 0))).toBe(0);
    expect(isConstructionComplete(plan, progressFromSingleFigure(plan, 5_000, 1_000))).toBe(true);
  });
});
