import { describe, it, expect } from "vite-plus/test";
import {
  compileDesign,
  computeCost,
  planConstruction,
  simulateConstruction,
  checkPlan,
  ConstructionPlanError,
  LINE_IDS,
  type LineId,
  type ConstructionPlan,
} from "../src/index.js";
import { ctx, draft, costBalance, constructionBalance } from "./fixtures/gunboat.js";

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
