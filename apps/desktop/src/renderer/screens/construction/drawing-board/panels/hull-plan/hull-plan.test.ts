import { describe, expect, it } from "vite-plus/test";
import { arcSectors, bearingVector, normaliseDeg, sectorPath } from "./arcs.js";
import { fittingPoint, PLAN_MID, planFrame } from "./geometry.js";

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
