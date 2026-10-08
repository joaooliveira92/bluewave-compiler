import { describe, it, expect } from "vite-plus/test";
import {
  compileDesign,
  computeCost,
  planConstruction,
  simulateConstruction,
  historicalBuildMonths,
  buildTimeIsProvisional,
  checkPlan,
  ConstructionPlanError,
  LINE_IDS,
  type LineId,
  type ConstructionPlan,
} from "../src/index.js";
import { ctx, draft, costBalance, constructionBalance } from "./fixtures/gunboat.js";
import { constructionBalance as earlyConstruction } from "./helpers/earlyContext.js";

const compiled = compileDesign(draft, ctx);
const mature = { maturityBpByTech: {}, firstOfClass: false };
const cost = computeCost(compiled, draft, costBalance, mature);
const plan = planConstruction(compiled, draft, cost, constructionBalance, false);
const cap = (n: number): Record<LineId, number> =>
  Object.fromEntries(LINE_IDS.map((l) => [l, n])) as Record<LineId, number>;
const big = (p: ConstructionPlan) => Math.max(...p.packages.map((x) => x.totalWork));

describe("cost", () => {
  it("breakdown sums exactly and every part is non-negative", () => {
    expect(cost.subtotal).toBe(cost.hull + cost.armour + cost.machinery + cost.components);
    expect(cost.total).toBe(cost.subtotal + cost.overheads + cost.firstOfClassPremium);
    for (const v of Object.values(cost)) expect(v).toBeGreaterThanOrEqual(0);
    expect(cost.hull).toBeGreaterThan(0);
    expect(cost.monthlyMaintenance).toBeGreaterThan(0);
  });
  it("immature technology costs more and first-of-class adds a premium", () => {
    const green = computeCost(compiled, draft, costBalance, {
      maturityBpByTech: { tech_qf_guns: 0, tech_whitehead: 0 },
      firstOfClass: false,
    });
    expect(green.components).toBeGreaterThan(cost.components);
    const first = computeCost(compiled, draft, costBalance, { ...mature, firstOfClass: true });
    expect(first.firstOfClassPremium).toBeGreaterThan(0);
    expect(first.total).toBeGreaterThan(cost.total);
  });
  it("faster, heavier-armoured and more subdivided designs cost more", () => {
    const fast = compileDesign(
      { ...draft, machinery: { ...draft.machinery, installedKw: 5_500 } },
      ctx,
    );
    expect(
      computeCost(
        fast,
        { ...draft, machinery: { ...draft.machinery, installedKw: 5_500 } },
        costBalance,
        mature,
      ).total,
    ).toBeGreaterThan(cost.total);
    const sub = { ...draft, hull: { ...draft.hull, subdivisionGrade: 4 as const } };
    expect(computeCost(compileDesign(sub, ctx), sub, costBalance, mature).hull).toBeGreaterThan(
      cost.hull,
    );
  });
  it("fails loudly on unknown cost data", () => {
    expect(() =>
      computeCost(compiled, draft, { ...costBalance, hullCostPerTonneMicro: {} }, mature),
    ).toThrow();
  });
});

describe("plan and schedule", () => {
  it("plan has eight acyclic packages with positive work that sum to the total", () => {
    expect(plan.packages).toHaveLength(8);
    expect(() => checkPlan(plan)).not.toThrow();
    for (const p of plan.packages) expect(p.totalWork).toBeGreaterThan(0);
    expect(plan.totalWork).toBe(plan.packages.reduce((a, p) => a + p.totalWork, 0));
  });
  it("first-of-class inflates work", () => {
    expect(
      planConstruction(compiled, draft, cost, constructionBalance, true).totalWork,
    ).toBeGreaterThan(plan.totalWork);
  });
  it("cycles and dangling dependencies are rejected", () => {
    const cyc: ConstructionPlan = {
      totalWork: 2,
      packages: [
        { id: "a", kind: "HULL", line: "slipway", totalWork: 1, dependsOn: ["b"] },
        { id: "b", kind: "LAUNCH", line: "slipway", totalWork: 1, dependsOn: ["a"] },
      ],
    };
    expect(() => checkPlan(cyc)).toThrowError(ConstructionPlanError);
    try {
      checkPlan(cyc);
    } catch (e) {
      expect((e as ConstructionPlanError).code).toBe("DOCKYARD_WORK_PACKAGE_CYCLE");
    }
    expect(() =>
      checkPlan({ totalWork: 1, packages: [{ ...cyc.packages[0]!, dependsOn: ["zzz"] }] }),
    ).toThrow();
  });
  it("respects dependencies: nothing fits out before launch and the other works are done", () => {
    const s = simulateConstruction(
      plan,
      { capacity: cap(big(plan)), monthlyFundingMicro: null, costPerWorkMicro: 1 },
      120,
    );
    const doneAt = (id: string) => s.months.find((m) => m.completed.includes(id))!.month;
    expect(doneAt("hull")).toBeLessThan(doneAt("launch") + 1);
    expect(doneAt("fit_out")).toBeGreaterThan(
      Math.max(doneAt("launch"), doneAt("machinery"), doneAt("armour"), doneAt("ordnance")) - 1,
    );
    expect(doneAt("trials")).toBeGreaterThan(doneAt("fit_out") - 1);
    expect(s.durationMonths).toBe(doneAt("acceptance"));
    expect(
      s.months.find((m) => m.applied.fit_out !== undefined && m.month <= doneAt("launch")),
    ).toBeUndefined();
  });
  it("progress is never negative, never exceeds the package, and completes exactly", () => {
    const s = simulateConstruction(
      plan,
      { capacity: cap(Math.ceil(big(plan) / 7)), monthlyFundingMicro: null, costPerWorkMicro: 1 },
      120,
    );
    for (const m of s.months)
      for (const v of Object.values(m.applied)) expect(v).toBeGreaterThanOrEqual(0);
    for (const p of plan.packages) expect(s.finalWork[p.id]).toBe(p.totalWork);
  });
  it("less capacity or funding means a longer build, and the bottleneck is the throttled line", () => {
    const fast = simulateConstruction(
      plan,
      { capacity: cap(big(plan) / 2), monthlyFundingMicro: null, costPerWorkMicro: 1 },
      600,
    );
    const slow = simulateConstruction(
      plan,
      {
        capacity: {
          ...cap(big(plan) / 2),
          heavy_gun: Math.ceil(plan.packages.find((p) => p.id === "ordnance")!.totalWork / 20),
        },
        monthlyFundingMicro: null,
        costPerWorkMicro: 1,
      },
      600,
    );
    expect(slow.durationMonths).toBeGreaterThan(fast.durationMonths);
    expect(slow.bottleneck).toBe("heavy_gun");
    const poor = simulateConstruction(
      plan,
      {
        capacity: cap(big(plan)),
        monthlyFundingMicro: Math.ceil(plan.totalWork / 10),
        costPerWorkMicro: 1,
      },
      600,
    );
    expect(poor.durationMonths).toBeGreaterThanOrEqual(10);
    expect(poor.durationMonths).toBeGreaterThan(fast.durationMonths);
  });
  it("a line with no capacity or funding stalls with a typed error", () => {
    expect(() =>
      simulateConstruction(
        plan,
        {
          capacity: { ...cap(1_000_000_000), slipway: 0 },
          monthlyFundingMicro: null,
          costPerWorkMicro: 1,
        },
        24,
      ),
    ).toThrowError(ConstructionPlanError);
    expect(() =>
      simulateConstruction(
        plan,
        { capacity: cap(1_000_000_000), monthlyFundingMicro: 0, costPerWorkMicro: 1 },
        24,
      ),
    ).toThrowError(ConstructionPlanError);
  });
  it("is deterministic", () => {
    const a = JSON.stringify(
      simulateConstruction(
        plan,
        { capacity: cap(big(plan) / 3), monthlyFundingMicro: null, costPerWorkMicro: 1 },
        600,
      ),
    );
    expect(
      JSON.stringify(
        simulateConstruction(
          plan,
          { capacity: cap(big(plan) / 3), monthlyFundingMicro: null, costPerWorkMicro: 1 },
          600,
        ),
      ),
    ).toBe(a);
  });
});

describe("historical build time by displacement (ADR-0067 section 5)", () => {
  const kg = (t: number) => t * 1000;
  it("hits the table points exactly and clamps outside the table", () => {
    const months = (t: number) => historicalBuildMonths(kg(t), earlyConstruction);
    expect(months(390)).toBe(18); // Brassey 1901 p. 264 standard (Bat 16 / Whiting 14 are records)
    expect(months(11_000)).toBe(30); // Diadem, Brassey 1901 p. 262
    expect(months(12_950)).toBe(35); // Canopus, Brassey 1901
    expect(months(12_000)).toBe(31); // Cressy, laid Oct 1898, commissioned May 1901
    expect(months(14_900)).toBe(36);
    expect(months(16_500)).toBe(34); // Lord Nelson, Brassey 1908 p. 27
    expect(months(18_600)).toBe(28); // Bellerophon, Brassey 1910 p. 1
    expect(months(1)).toBe(18);
    expect(months(100_000)).toBe(28);
  });
  it("interpolates monotonically through the 1890s range (boundary: just either side of a point)", () => {
    // Above 14,900 t the sourced Dreadnought-era points fall (British yards were faster by 1906-10); see balance.yaml.
    let prev = 0;
    for (let t = 300; t <= 14_900; t += 250) {
      const m = historicalBuildMonths(kg(t), earlyConstruction);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
    expect(historicalBuildMonths(kg(12_949), earlyConstruction)).toBe(34);
    expect(historicalBuildMonths(kg(12_951), earlyConstruction)).toBe(35);
  });
  it("applies the industry modifier and acceleration with explicit rounding", () => {
    const eff = earlyConstruction.efficientIndustryBp;
    // Efficient yard reproduces the Brassey records: Magnificent 24, Majestic 22 (to within a month).
    expect(historicalBuildMonths(kg(14_900), earlyConstruction, { industryBp: eff })).toBe(24);
    expect(historicalBuildMonths(kg(14_900), earlyConstruction, { industryBp: 13_000 })).toBe(47);
    expect(historicalBuildMonths(kg(14_900), earlyConstruction, { accelerated: true })).toBe(32);
    expect(historicalBuildMonths(kg(300), constructionBalance, { industryBp: 1 })).toBe(1);
  });
  it("every table point carries a source and none is an unsourced ESTIMATE (ticket 22)", () => {
    expect(earlyConstruction.buildMonthsProvenance).toHaveLength(
      earlyConstruction.buildMonthsByDisplacementT.points.length,
    );
    for (const p of earlyConstruction.buildMonthsProvenance) {
      expect(["VERIFIED", "SECONDARY"]).toContain(p.status);
      expect(p.source.length).toBeGreaterThan(20);
    }
    const cressy = earlyConstruction.buildMonthsByDisplacementT.points.findIndex(
      ([t]) => t === 12_000,
    );
    expect(earlyConstruction.buildMonthsProvenance[cressy]!.status).toBe("VERIFIED");
    expect(earlyConstruction.buildMonthsProvenance[cressy]!.source).toContain("May 1901");
  });
  it("is provisional while a bracketing point is not VERIFIED (exact hit, between, clamped)", () => {
    const pts = earlyConstruction.buildMonthsByDisplacementT.points;
    const sec = earlyConstruction.buildMonthsProvenance.findIndex((p) => p.status !== "VERIFIED");
    expect(sec).toBeGreaterThanOrEqual(0);
    const t = (i: number) => pts[i]![0] * 1000;
    expect(buildTimeIsProvisional(t(sec), earlyConstruction)).toBe(true); // exact hit
    expect(buildTimeIsProvisional(t(sec) - 1000, earlyConstruction)).toBe(true); // just below, bracket includes it
    expect(buildTimeIsProvisional(t(sec) + 1000, earlyConstruction)).toBe(true); // just above
    expect(buildTimeIsProvisional(12_500_000, earlyConstruction)).toBe(false); // Cressy..Canopus, both VERIFIED
    expect(buildTimeIsProvisional(1_000, earlyConstruction)).toBe(true); // clamped onto the SECONDARY 390 t end
    expect(buildTimeIsProvisional(90_000_000, earlyConstruction)).toBe(false); // clamped on a VERIFIED end
  });
  it("rejects provenance that does not match the table", () => {
    expect(() =>
      buildTimeIsProvisional(12_000_000, { ...earlyConstruction, buildMonthsProvenance: [] }),
    ).toThrow(/Provenance/);
    const bad = earlyConstruction.buildMonthsProvenance.map((p) => ({ ...p, source: " " }));
    expect(() =>
      buildTimeIsProvisional(12_000_000, { ...earlyConstruction, buildMonthsProvenance: bad }),
    ).toThrow(/source/);
  });
  it("is deterministic across calls", () => {
    const a = historicalBuildMonths(kg(13_333), earlyConstruction, { accelerated: true });
    expect(historicalBuildMonths(kg(13_333), earlyConstruction, { accelerated: true })).toBe(a);
  });
  it("accelerated construction costs 5 % more on subtotal plus overheads", () => {
    const base = computeCost(compiled, draft, costBalance, mature);
    const fast = computeCost(compiled, draft, costBalance, { ...mature, accelerated: true });
    expect(fast.accelerationPremium).toBe(
      Math.round((base.subtotal + base.overheads) * 0.05) as typeof fast.accelerationPremium,
    );
    expect(fast.total).toBe(base.total + fast.accelerationPremium);
    expect(base.accelerationPremium).toBe(0);
  });
});
