import { describe, it, expect } from "vite-plus/test";
import {
  buildWorkshopView,
  applyEdit,
  LEDGER_CATEGORIES,
  CVE_LABEL,
  LINE_IDS,
  type LineId,
  type WorkshopEnvironment,
} from "../src/index.js";
import {
  constructionBalance,
  costBalance,
  cveBalance,
  earlyContext,
} from "./helpers/earlyContext.js";
import { havock, majestic } from "./helpers/references.js";

const cap = (n: number) =>
  Object.fromEntries(LINE_IDS.map((l) => [l, n])) as Record<LineId, number>;
const env = (month: string): WorkshopEnvironment => ({
  ctx: earlyContext(month),
  costBalance,
  costCtx: { maturityBpByTech: {}, firstOfClass: true },
  constructionBalance,
  cveBalance,
  yardCapacity: cap(20_000_000),
});

describe("buildWorkshopView", () => {
  const v = buildWorkshopView(havock, env("1895-06"));
  it("exposes every ledger line, with shares that add up to the displacement", () => {
    expect(v.ledger.map((r) => r.category)).toEqual([...LEDGER_CATEGORIES]);
    expect(v.ledger.reduce((a, r) => a + r.kg, 0)).toBe(v.totalKg);
    expect(v.ledger.reduce((a, r) => a + r.shareBp, 0)).toBeLessThanOrEqual(10_000);
    expect(v.ledger.reduce((a, r) => a + r.shareBp, 0)).toBeGreaterThan(9_990);
  });
  it("reports headline metrics with tones and the brief's targets", () => {
    const by = Object.fromEntries(v.metrics.map((m) => [m.id, m]));
    expect(by.speed!.value).toMatch(/kn \(need 25\.5\)/);
    expect(by.speed!.tone).toBe("ok");
    expect(by.range!.value).toContain("need 1,200");
    expect(by.crew!.value).toMatch(/^\d+ \/ \d+$/);
    expect(v.valid).toBe(true);
    expect(v.naturalClass).toBe("DD");
  });
  it("forecasts cost and build time for a valid design, and labels the dev metric", () => {
    expect(v.forecast.costMicro).toBeGreaterThan(0);
    expect(v.forecast.months).toBeGreaterThan(0);
    expect(v.forecast.note).toBeNull();
    expect(v.cve.label).toBe(CVE_LABEL);
  });
  it("groups findings by severity and counts them", () => {
    const total = Object.values(v.counts).reduce((a, n) => a + n, 0);
    expect(total).toBe(v.compiled.findings.length);
    for (const [sev, list] of Object.entries(v.findingsBySeverity))
      expect(list.every((f) => f.severity === sev)).toBe(true);
  });
  it("an invalid design explains why there is no schedule, and turns the displacement metric red", () => {
    const bad = buildWorkshopView(
      applyEdit(havock, { kind: "set_machinery", patch: { fuelCapacityKg: 400_000 } }),
      env("1895-06"),
    );
    expect(bad.valid).toBe(false);
    expect(bad.forecast.months).toBeNull();
    expect(bad.forecast.note).toContain("blocking");
    expect(bad.counts.BLOCKING).toBeGreaterThan(0);
    expect(bad.metrics.find((m) => m.id === "displacement")!.tone).toBe("bad");
  });
  it("is deterministic and works for the battleship", () => {
    const a = buildWorkshopView(majestic, env("1896-01"));
    expect(JSON.stringify(a)).toBe(JSON.stringify(buildWorkshopView(majestic, env("1896-01"))));
    expect(a.valid).toBe(true);
    expect(a.naturalClass).toBe("B");
  });
  it("forecast build time follows displacement, industry and acceleration (ticket 20)", () => {
    const small = buildWorkshopView(havock, env("1895-06"));
    const big = buildWorkshopView(majestic, env("1896-01"));
    expect(big.forecast.note).toBeNull();
    expect(small.forecast.historicalMonths).toBeGreaterThan(0);
    expect(big.forecast.historicalMonths!).toBeGreaterThan(small.forecast.historicalMonths!);
    expect(big.forecast.months!).toBeGreaterThanOrEqual(big.forecast.historicalMonths!);
    const fast = buildWorkshopView(majestic, {
      ...env("1896-01"),
      industryBp: constructionBalance.efficientIndustryBp,
    });
    expect(fast.forecast.historicalMonths!).toBeLessThan(big.forecast.historicalMonths!);
    const rushed = buildWorkshopView(majestic, {
      ...env("1896-01"),
      costCtx: { maturityBpByTech: {}, firstOfClass: true, accelerated: true },
    });
    expect(rushed.forecast.historicalMonths!).toBeLessThan(big.forecast.historicalMonths!);
    expect(rushed.forecast.costMicro).toBeGreaterThan(big.forecast.costMicro);
    expect(buildWorkshopView(majestic, { ...env("1896-01"), industryBp: 10_000 }).forecast).toEqual(
      big.forecast,
    );
  });
});
