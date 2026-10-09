import { describe, expect, it } from "vite-plus/test";
import { arcSectors, bearingVector, normaliseDeg, sectorPath } from "./arcs.js";
import {
  bowStyleFor,
  fittingPoint,
  PLAN_MID,
  planFrame,
  profileFrame,
  waterplaneShape,
} from "./geometry.js";

const hull = (lengthM: number, beamM: number) =>
  ({ lengthWl: lengthM * 1000, beam: beamM * 1000 }) as never;

describe("arcSectors", () => {
  it("centre mount covers both beams, each centred abeam", () => {
    const s = arcSectors("g", "CENTRE", 120);
    expect(s.map((x) => [x.beam, x.startDeg, x.widthDeg])).toEqual([
      ["STBD", 30, 120],
      ["PORT", 210, 120],
    ]);
  });
  it("port-only and starboard-only wing mounts cover only their own beam", () => {
    expect(arcSectors("g", "PORT", 100).map((x) => x.beam)).toEqual(["PORT"]);
    expect(arcSectors("g", "STBD", 100).map((x) => x.beam)).toEqual(["STBD"]);
  });
  it("normalises an arc that crosses the bow (0 degrees)", () => {
    const [s] = arcSectors("g", "STBD", 240);
    expect(s!.startDeg).toBe(330);
    expect(s!.widthDeg).toBe(240);
  });
  it("full circle is capped at 360", () => {
    expect(arcSectors("g", "STBD", 500)[0]!.widthDeg).toBe(360);
    expect(sectorPath(10, 10, 5, arcSectors("g", "STBD", 360)[0]!)).toMatch(/A 5 5 0 1 1/);
  });
  it("yields nothing for missing, zero, negative or malformed arcs", () => {
    for (const v of [undefined, 0, -10, Number.NaN, Number.POSITIVE_INFINITY])
      expect(arcSectors("g", "CENTRE", v)).toEqual([]);
  });
  it("normaliseDeg maps into [0, 360)", () => {
    expect([normaliseDeg(-30), normaliseDeg(360), normaliseDeg(725)]).toEqual([330, 0, 5]);
  });
  it("forward/aft/beam bearings point bow-left, stern-right, starboard-up", () => {
    const v = (d: number) => {
      const r = bearingVector(d);
      return [Math.round(r.dx) + 0, Math.round(r.dy) + 0].map((n) => (n === 0 ? 0 : n));
    };
    expect([v(0), v(180), v(90), v(270)]).toEqual([
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  });
  it("a forward 120 degree sector opens toward the bow", () => {
    const d = sectorPath(100, 50, 30, {
      instanceId: "g",
      beam: "STBD",
      startDeg: 300,
      widthDeg: 120,
    });
    expect(d.startsWith("M 100.00 50.00 L ")).toBe(true);
  });
});

describe("plan geometry", () => {
  it("starboard fittings sit above the centreline, port below, and station maps to x", () => {
    const f = planFrame(hull(100, 12));
    expect(fittingPoint(f, 500, "STBD", 0).y).toBeLessThan(PLAN_MID);
    expect(fittingPoint(f, 500, "PORT", 0).y).toBeGreaterThan(PLAN_MID);
    expect(fittingPoint(f, 0, "CENTRE", 1).x).toBeLessThan(fittingPoint(f, 1000, "CENTRE", 1).x);
  });
  it("arc origin equals the fitting dot and follows hull resizing", () => {
    const narrow = fittingPoint(planFrame(hull(100, 6)), 400, "PORT", 0);
    const wide = fittingPoint(planFrame(hull(100, 14)), 400, "PORT", 0);
    expect(wide.x).toBe(narrow.x);
    expect(wide.y).toBeGreaterThan(narrow.y);
  });
  it("tolerates extreme and degenerate hulls and out-of-range stations", () => {
    for (const [l, b] of [
      [1, 100],
      [500, 1],
      [0, 0],
    ]) {
      const f = planFrame(hull(l!, b!));
      expect(Number.isFinite(f.maxHalf)).toBe(true);
      expect(f.x(-50)).toBe(f.x(0));
      expect(f.x(2000)).toBe(f.x(1000));
    }
  });
});

describe("waterplaneShape", () => {
  const area = (cw: number, lcb = 500) => {
    const s = waterplaneShape({ waterplaneCoeffBp: cw, lcbPermille: lcb });
    let a = 0;
    for (let i = 0; i < 2000; i++) a += s((i + 0.5) / 2000) / 2000;
    return a;
  };
  it("integrates to the waterplane coefficient", () => {
    for (const cw of [7000, 7200, 8200]) expect(area(cw)).toBeCloseTo(cw / 10000, 2);
  });
  it("is pointed at the bow, full amidships and narrower at the transom", () => {
    const s = waterplaneShape({ waterplaneCoeffBp: 7400, lcbPermille: 500 });
    expect(s(0)).toBe(0);
    expect(s(0.5)).toBe(1);
    expect(s(1)).toBeGreaterThan(0);
    expect(s(1)).toBeLessThan(1);
  });
  it("a finer waterplane is narrower forward than a fuller one", () => {
    const fine = waterplaneShape({ waterplaneCoeffBp: 7000, lcbPermille: 500 });
    const full = waterplaneShape({ waterplaneCoeffBp: 8200, lcbPermille: 500 });
    expect(fine(0.1)).toBeLessThan(full(0.1));
  });
  it("falls back to a typical form and stays within 0..1", () => {
    const s = waterplaneShape();
    for (let i = 0; i <= 100; i++) expect(s(i / 100)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...Array.from({ length: 101 }, (_, i) => s(i / 100)))).toBe(1);
  });
});

describe("bow character and profile", () => {
  it("picks a bow per hull form", () => {
    expect([
      bowStyleFor("torpedo_boat_form"),
      bowStyleFor("coast_defence_form"),
      bowStyleFor("protected_cruiser_form"),
      bowStyleFor("pre_dreadnought_form"),
    ]).toEqual(["spoon", "plumb", "ram", "ram"]);
  });
  it("blunt bows have a non-zero stem width and still match the coefficient", () => {
    for (const bow of ["spoon", "plumb"] as const) {
      const s = waterplaneShape({ waterplaneCoeffBp: 7400, lcbPermille: 500, bow });
      expect(s(0)).toBeGreaterThan(0);
      let a = 0;
      for (let i = 0; i < 2000; i++) a += s((i + 0.5) / 2000) / 2000;
      expect(a).toBeCloseTo(0.74, 2);
    }
    expect(waterplaneShape({ waterplaneCoeffBp: 7400, lcbPermille: 500, bow: "ram" })(0)).toBe(0);
  });
  it("sheer lifts the deck toward the bow more than the stern; no sheer is flat", () => {
    const h = { lengthWl: 85000, beam: 12000, draught: 4200, depthToMainDeck: 7000 } as never;
    const p = profileFrame(h, 11000);
    expect(p.deckY(0)).toBeLessThan(p.deckY(0.5));
    expect(p.deckY(0)).toBeLessThan(p.deckY(1));
    expect(p.deckY(1)).toBeLessThan(p.deckY(0.5));
    const flat = profileFrame(h, 10000);
    expect(flat.deckY(0)).toBe(flat.deckY(0.5));
  });
  it("keel sits below the waterline by the draught and is cut up at the stem", () => {
    const h = { lengthWl: 85000, beam: 12000, draught: 4200, depthToMainDeck: 7000 } as never;
    const p = profileFrame(h, 11000);
    expect(p.keelY(0.5)).toBeCloseTo(p.waterlineY + 4.2 * p.vScale, 5);
    expect(p.keelY(0)).toBeCloseTo(p.waterlineY, 5);
  });
  it("tolerates degenerate hulls", () => {
    const p = profileFrame({ lengthWl: 0, beam: 0, draught: 0, depthToMainDeck: 0 } as never, 0);
    expect(Number.isFinite(p.deckY(0.3))).toBe(true);
    expect(Number.isFinite(p.keelY(0.3))).toBe(true);
  });
});
