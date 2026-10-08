import { describe, it, expect } from "vite-plus/test";
import { buildYards, yardCapacityFor, yardFits, LINE_IDS, type Facility } from "../src/index.js";
import { shipBuildingContent } from "./helpers/earlyContext.js";

const fac = (id: string, tonnes: number): Facility => ({
  id,
  maxLengthMm: 100_000,
  maxBeamMm: 20_000,
  maxDisplacementKg: tonnes * 1000,
  craneLiftKg: 100_000,
});

describe("yard capacity (ADR-0067 section 6)", () => {
  it("scales every line with maxDisplacement, in integers", () => {
    const c = yardCapacityFor(fac("a", 3_000), 700);
    for (const l of LINE_IDS) expect(c[l]).toBe(2_100_000);
    expect(yardCapacityFor(fac("b", 9_000), 700).slipway).toBe(6_300_000);
    // Floors a fractional result (1,500 kg x 1 / 1000 = 1.5).
    expect(yardCapacityFor({ ...fac("c", 1), maxDisplacementKg: 1_500 }, 1).slipway).toBe(1);
  });
  it("rejects a non-positive or non-integer rate", () => {
    expect(() => yardCapacityFor(fac("a", 1), 0)).toThrow(RangeError);
    expect(() => yardCapacityFor(fac("a", 1), 1.5)).toThrow(RangeError);
  });
  it("orders yards by capacity then id, whatever the input order", () => {
    const fs = [fac("z", 9_000), fac("b", 3_000), fac("a", 3_000)];
    const ids = (x: Facility[]) => buildYards(x, 700).map((y) => y.facility.id);
    expect(ids(fs)).toEqual(["a", "b", "z"]);
    expect(ids([...fs].reverse())).toEqual(["a", "b", "z"]);
  });
  it("fit limits are inclusive at each boundary", () => {
    const f = fac("a", 3_000);
    const ok = {
      lengthMm: 100_000,
      beamMm: 20_000,
      displacementKg: 3_000_000,
      heaviestKg: 100_000,
    };
    expect(yardFits(f, ok)).toBe(true);
    expect(yardFits(f, { ...ok, lengthMm: 100_001 })).toBe(false);
    expect(yardFits(f, { ...ok, beamMm: 20_001 })).toBe(false);
    expect(yardFits(f, { ...ok, displacementKg: 3_000_001 })).toBe(false);
    expect(yardFits(f, { ...ok, heaviestKg: 100_001 })).toBe(false);
  });
  it("the shipped content has capacities increasing with maxDisplacement", () => {
    const ys = shipBuildingContent.environmentFor("1896-01").yards;
    expect(ys.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]!.facility.maxDisplacementKg).toBeGreaterThan(
        ys[i - 1]!.facility.maxDisplacementKg,
      );
      expect(ys[i]!.capacity.slipway).toBeGreaterThan(ys[i - 1]!.capacity.slipway);
    }
    expect(JSON.stringify(shipBuildingContent.environmentFor("1896-01").yards)).toBe(
      JSON.stringify(ys),
    );
  });
});
