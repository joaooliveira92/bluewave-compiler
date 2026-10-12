// SB-3/INC-5 (DESIGN-16 section 4): the national dock's mass ceilings and dimension predicate, and the
// new-construction eligibility they govern. Pure; composes with the per-yard fit.
import { describe, expect, it } from "vite-plus/test";
import {
  DOCK_LIMIT_MISSING,
  SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT,
  dockDimensionMisfits,
  dockRecordFromCeiling,
  missingDockLimits,
  newConstructionDockEligibility,
  type YardDemand,
} from "../src/index.js";

const demand = (o: Partial<YardDemand> = {}): YardDemand => ({
  lengthMm: 80_000,
  beamMm: 15_000,
  displacementKg: 8_000_000,
  heaviestKg: 300_000,
  ...o,
});

describe("national dock record (DESIGN-16 section 4.1)", () => {
  it("projects a ceiling onto all four declared mass limits", () => {
    const dock = dockRecordFromCeiling(10_000_000);
    expect(dock.maximumNewConstructionMassKg).toBe(10_000_000);
    expect(dock.maximumMajorRepairMassKg).toBe(10_000_000);
    expect(dock.maximumRebuildMassKg).toBe(10_000_000);
    expect(dock.maximumConversionMassKg).toBe(10_000_000);
    expect(dock.dimensions).toBeNull();
  });

  it("flags missing limits rather than copying them", () => {
    expect(missingDockLimits(dockRecordFromCeiling(1_000_000))).toEqual([]);
    expect(missingDockLimits({ maximumNewConstructionMassKg: 5_000_000 })).toEqual([
      "maximumMajorRepairMassKg",
      "maximumRebuildMassKg",
      "maximumConversionMassKg",
    ]);
    expect(
      missingDockLimits({ ...dockRecordFromCeiling(1), maximumNewConstructionMassKg: 0 }),
    ).toContain("maximumNewConstructionMassKg");
  });
});

describe("domestic new-construction eligibility (DESIGN-16 section 4.2)", () => {
  it("accepts a hull exactly at the ceiling (inclusive)", () => {
    const dock = dockRecordFromCeiling(8_000_000);
    expect(newConstructionDockEligibility(dock, demand()).eligible).toBe(true);
  });

  it("rejects a hull above the ceiling with SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT", () => {
    const dock = dockRecordFromCeiling(8_000_000);
    const r = newConstructionDockEligibility(dock, demand({ displacementKg: 8_000_001 }));
    expect(r.eligible).toBe(false);
    expect(r.rejections.map((x) => x.code)).toEqual([SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT]);
  });

  it("fails a partial dock with DOCK_LIMIT_MISSING before any mass check", () => {
    const r = newConstructionDockEligibility({ maximumNewConstructionMassKg: 1_000_000 }, demand());
    expect(r.rejections.map((x) => x.code)).toEqual([DOCK_LIMIT_MISSING]);
  });

  it("enforces a declared dimension predicate on top of the mass ceiling", () => {
    const dock = dockRecordFromCeiling(20_000_000, {
      dimensions: { maxLengthMm: 100_000, maxBeamMm: 20_000, maxHeaviestComponentKg: 500_000 },
    });
    expect(newConstructionDockEligibility(dock, demand()).eligible).toBe(true);
    expect(
      newConstructionDockEligibility(dock, demand({ beamMm: 20_001 })).rejections.map(
        (x) => x.code,
      ),
    ).toEqual([SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT]);
    expect(dockDimensionMisfits(dock.dimensions!, demand({ lengthMm: 200_000 }))).toEqual([
      "LENGTH",
    ]);
  });
});
