import { describe, it, expect } from "vite-plus/test";
import {
  compileDesign,
  computeCost,
  computeCve,
  planConstruction,
  simulateConstruction,
  toEngineDesign,
  LINE_IDS,
  type LineId,
} from "../src/index.js";
import {
  constructionBalance,
  cveBalance,
  costBalance,
  earlyContext,
  plants,
} from "./helpers/earlyContext.js";
import { havock, majestic } from "./helpers/references.js";

const mature = { maturityBpByTech: {}, firstOfClass: false };

describe("Havock-like destroyer on the real EARLY-band content", () => {
  const ctx = earlyContext("1895-06");
  const r = compileDesign(havock, ctx);
  it("is valid and naturally a DD", () => {
    expect(
      r.findings.filter((f) => f.severity === "BLOCKING" || f.severity === "CRITICAL"),
    ).toEqual([]);
    expect(r.valid).toBe(true);
    expect(r.naturalClass).toBe("DD");
  });
  it("matches the sourced ship: ~26.8 kn on ~3,500 ihp, machinery heavier than hull, hull about a third of displacement", () => {
    expect(r.machinery!.maxSpeedMilliKnots).toBeGreaterThan(25_500);
    expect(r.machinery!.maxSpeedMilliKnots).toBeLessThan(28_000);
    expect(r.ledger.machinery).toBeGreaterThan(r.ledger.hull);
    expect(r.ledger.hull / r.totalKg).toBeGreaterThan(0.24);
    expect(r.ledger.hull / r.totalKg).toBeLessThan(0.36);
    expect(r.systems!.crewRequired).toBeGreaterThanOrEqual(20);
    expect(r.systems!.crewRequired).toBeLessThanOrEqual(46); // Havock: 43-46
  });
  it("is unavailable before its technology exists", () => {
    const early = compileDesign(havock, earlyContext("1885-06"));
    expect(early.valid).toBe(false);
    expect(early.findings.map((f) => f.id)).toContain("TECH_UNAVAILABLE");
  });
  it("prices, schedules and projects onto the engine contract", () => {
    const cost = computeCost(r, havock, costBalance, mature);
    expect(cost.total).toBeGreaterThan(0);
    const plan = planConstruction(r, havock, cost, constructionBalance, true);
    const cap = Object.fromEntries(
      LINE_IDS.map((l) => [l, Math.ceil(plan.totalWork / 6)]),
    ) as Record<LineId, number>;
    const sched = simulateConstruction(
      plan,
      { capacity: cap, monthlyFundingMicro: null, costPerWorkMicro: 1 },
      120,
    );
    expect(sched.durationMonths).toBeGreaterThan(0);
    const e = toEngineDesign(r, havock, {
      designVersionId: "des_x",
      designFamilyId: "fam_x",
      className: "Havock",
      hullType: "destroyer",
      machineryType: "locomotive_boiler",
      contentVersion: "1",
      kgPerHitPoint: 4_000,
    });
    expect(e.normalizedDisplacementKg).toBe(r.totalKg);
    expect(e.torpedoArmament).toEqual([
      { mountType: "ABOVE_WATER_TRAINABLE", tubeCount: 2, torpedoModelId: "whitehead_14in_1886" },
    ]);
    expect(
      computeCve(
        r,
        havock,
        plants.find((p) => p.id === "locomotive_boiler_tb")!.reliabilityBp,
        cveBalance,
      ).cveBp,
    ).toBeGreaterThan(0);
  });
});

describe("Majestic-like battleship on the real EARLY-band content", () => {
  const r = compileDesign(majestic, earlyContext("1896-01"));
  it("is valid and, with two twin turrets, naturally class B under DESIGN-22", () => {
    expect(
      r.findings.filter((f) => f.severity === "BLOCKING" || f.severity === "CRITICAL"),
    ).toEqual([]);
    expect(r.valid).toBe(true);
    expect(r.naturalClass).toBe("B");
  });
  it("hull is 38 % of displacement (White 1894) and speed is ~17 kn on ~12,000 ihp-equivalent power", () => {
    expect(r.ledger.hull / 15_139_000).toBeGreaterThan(0.37);
    expect(r.ledger.hull / 15_139_000).toBeLessThan(0.39);
    expect(r.machinery!.maxSpeedMilliKnots).toBeGreaterThan(16_500);
    expect(r.machinery!.maxSpeedMilliKnots).toBeLessThan(18_500);
  });
  it("has the compromises the brief implies: short of its 4,500 nm range and a thin growth reserve, both reported", () => {
    const ids = r.findings.map((f) => f.id);
    expect(ids).toContain("RANGE_BELOW_REQUIREMENT");
    expect(ids).toContain("MODERNIZATION_MARGIN_LOW");
  });
  it("is stable and structurally comfortable", () => {
    expect(r.stability!.gmMm).toBeGreaterThan(800);
    expect(r.stability!.gmMm).toBeLessThan(3_000);
    expect(r.stability!.stressBp).toBeLessThan(10_000);
  });
  it("cannot be built before the 12-inch Mk VIII exists", () => {
    const early = compileDesign(majestic, earlyContext("1890-01"));
    expect(early.valid).toBe(false);
    expect(early.findings.filter((f) => f.id === "TECH_UNAVAILABLE").length).toBeGreaterThan(0);
  });
});
