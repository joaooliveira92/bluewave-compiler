import { describe, it, expect } from "vite-plus/test";
import {
  evaluateRefit,
  compileDesign,
  checkFindingShape,
  type ComponentDef,
  type RefitPlan,
  type ShipContext,
  type ShipState,
} from "../src/index.js";
import { ctx as baseCtx, draft, costBalance, refitBalance } from "./fixtures/gunboat.js";

const director: ComponentDef = {
  id: "director_mk1",
  displayName: "Director Mk I",
  category: "DIRECTOR",
  introduction: { fromMonth: "1890-01", obsoleteMonth: null },
  requires: [],
  parameters: {},
  constants: {},
  weightKg: "1200",
  volumeLitre: "800",
  costMicro: "400000000",
  crew: "3",
  powerKw: "6",
  upgradePath: [],
  tags: [],
  deckFootprintMm2: "900000",
  heightMm: "1800",
  zCgMm: "7500",
  fcClasses: ["light"],
  attributes: { accuracyBonusBp: "2500", capacity: "6" },
};
const huge: ComponentDef = {
  ...director,
  id: "director_huge",
  weightKg: "80000",
  volumeLitre: "800",
};
const hungry: ComponentDef = { ...director, id: "director_hungry", powerKw: "900" };
const costly: ComponentDef = { ...director, id: "director_gold", costMicro: "600000000000" };
const ctx: ShipContext = {
  ...baseCtx,
  catalogue: [...baseCtx.catalogue, director, huge, hungry, costly],
};

const ship: ShipState = {
  design: draft,
  growthBudgetKg: 6_000,
  hullFatigueBp: 1_000,
  remainingServiceMonths: 180,
  refitCount: 0,
};
const upgrade = (componentId = "director_mk1", over: Partial<RefitPlan> = {}): RefitPlan => ({
  kind: "SENSOR_FC_UPDATE",
  removeInstanceIds: ["rf"],
  add: [{ instanceId: "dir", componentId, zoneId: "SUPERSTRUCTURE", stationPermille: 520 }],
  ...over,
});
const run = (plan: RefitPlan, s: ShipState = ship, c: ShipContext = ctx) =>
  evaluateRefit(
    s,
    plan,
    c,
    refitBalance,
    costBalance,
    { maturityBpByTech: {}, firstOfClass: false },
    2_000_000,
  );

describe("SENSOR_FC_UPDATE", () => {
  const r = run(upgrade());
  it("is legal, accounts for added mass and improves fire control", () => {
    expect(r.legal).toBe(true);
    expect(r.projectType).toBe("EQUIPMENT_INSTALLATION");
    expect(r.netAddedKg).toBeGreaterThan(0);
    expect(r.netAddedKg).toBeLessThan(ship.growthBudgetKg);
    const acc = (c: typeof r.after) => c.systems!.gunControl.reduce((a, g) => a + g.accuracyBp, 0);
    expect(acc(r.after)).toBeGreaterThan(acc(r.before));
  });
  it("spends the finite budgets: growth, fatigue, refit count; extends life", () => {
    expect(r.nextState.growthBudgetKg).toBeLessThan(ship.growthBudgetKg);
    expect(r.nextState.hullFatigueBp).toBe(ship.hullFatigueBp + 300);
    expect(r.nextState.refitCount).toBe(1);
    expect(r.nextState.remainingServiceMonths).toBe(192);
    expect(r.nextState.design.placements.some((p) => p.instanceId === "dir")).toBe(true);
    expect(r.nextState.design.placements.some((p) => p.instanceId === "rf")).toBe(false);
  });
  it("has positive cost, a dock time, and a sane share of replacement", () => {
    expect(r.costMicro).toBeGreaterThan(0);
    expect(r.monthsOutOfService).toBeGreaterThanOrEqual(2);
    expect(r.costRatioBp).toBeLessThan(refitBalance.uneconomicalBp);
  });
  it("the resulting design compiles and keeps the as-built hull (no silent re-normalisation)", () => {
    expect(compileDesign(r.newDesign, ctx).valid).toBe(true);
    expect(r.newDesign.hull.lengthWl).toBe(draft.hull.lengthWl);
    expect(r.newDesign.hull.targetDisplacementKg).toBe(draft.hull.targetDisplacementKg);
  });
});

describe("refit legality (I5)", () => {
  it("kind mismatch: adding a gun in a sensor refit is blocked", () => {
    const r = run({
      kind: "SENSOR_FC_UPDATE",
      removeInstanceIds: [],
      add: [
        {
          instanceId: "g",
          componentId: "qf_47in",
          zoneId: "FORECASTLE",
          stationPermille: 30,
          params: { barrels: 1, rounds: 50 },
        },
      ],
    });
    expect(r.legal).toBe(false);
    expect(r.findings.map((f) => f.id)).toContain("REFIT_KIND_MISMATCH");
    expect(r.nextState).toBe(ship);
  });
  it("mass: exceeding the growth budget is blocked with remedies", () => {
    const r = run(upgrade("director_huge"));
    const f = r.findings.find((x) => x.id === "REFIT_GROWTH_EXCEEDED")!;
    expect(r.legal).toBe(false);
    expect(f.severity).toBe("BLOCKING");
    expect(checkFindingShape(f)).toEqual([]);
  });
  it("power: a consumer the plant cannot supply introduces a shortfall", () => {
    const r = run(upgrade("director_hungry"));
    expect(r.legal).toBe(false);
    expect(r.findings.map((f) => f.id)).toContain("REFIT_POWER_SHORTFALL");
  });
  it("space: filling a zone is blocked", () => {
    const r = run({
      kind: "SENSOR_FC_UPDATE",
      removeInstanceIds: [],
      add: Array.from({ length: 4 }, (_, i) => ({
        instanceId: `fill${i}`,
        componentId: "ventilation",
        zoneId: "FORECASTLE" as const,
        stationPermille: 30,
      })),
    });
    expect(r.legal).toBe(false);
  });
  it("unknown target and duplicate ids are blocked", () => {
    expect(
      run(upgrade("director_mk1", { removeInstanceIds: ["ghost"] })).findings.map((f) => f.id),
    ).toContain("REFIT_UNKNOWN_TARGET");
    expect(
      run(
        upgrade("director_mk1", {
          removeInstanceIds: [],
          add: [
            {
              instanceId: "rf",
              componentId: "director_mk1",
              zoneId: "SUPERSTRUCTURE",
              stationPermille: 520,
            },
          ],
        }),
      ).findings.map((f) => f.id),
    ).toContain("REFIT_DUPLICATE_INSTANCE");
  });
  it("a pre-existing warning does not block the refit", () => {
    const before = compileDesign(draft, ctx);
    expect(before.findings.some((f) => f.severity === "WARNING")).toBe(true);
    expect(run(upgrade()).legal).toBe(true);
  });
  it("old hulls end: worn hulls and short remaining life are blocked", () => {
    expect(run(upgrade(), { ...ship, hullFatigueBp: 9_000 }).findings.map((f) => f.id)).toContain(
      "HULL_WORN_OUT",
    );
    expect(
      run(upgrade(), { ...ship, remainingServiceMonths: 6 }).findings.map((f) => f.id),
    ).toContain("REFIT_SERVICE_LIFE_TOO_SHORT");
  });
  it("economics: an absurdly expensive refit is uneconomical against replacement", () => {
    const r = run(upgrade("director_gold"));
    expect(r.costRatioBp).toBeGreaterThanOrEqual(refitBalance.uneconomicalBp);
    expect(
      r.findings.some((f) => f.id === "REFIT_UNECONOMICAL" || f.id === "REFIT_UNECONOMICAL_HARD"),
    ).toBe(true);
  });
  it("upgrades cannot go on forever: repeated refits eventually hit a physical or economic limit", () => {
    let s = ship;
    let applied = 0;
    for (let i = 0; i < 40; i++) {
      const plan: RefitPlan = {
        kind: "SENSOR_FC_UPDATE",
        removeInstanceIds: [],
        add: [
          {
            instanceId: `extra${i}`,
            componentId: "director_mk1",
            zoneId: "SUPERSTRUCTURE",
            stationPermille: 520 + (i % 100),
          },
        ],
      };
      const e = run(plan, s);
      if (!e.legal) break;
      s = e.nextState;
      applied++;
    }
    expect(applied).toBeGreaterThan(0);
    expect(applied).toBeLessThan(40);
    expect(s.growthBudgetKg).toBeLessThan(ship.growthBudgetKg);
  });
  it("is deterministic and does not mutate the input ship", () => {
    const snap = JSON.stringify(ship);
    expect(JSON.stringify(run(upgrade()))).toBe(JSON.stringify(run(upgrade())));
    expect(JSON.stringify(ship)).toBe(snap);
  });
});
