import type { DesignDraft, MountSide } from "@bluewave/ship-design";

/**
 * Plan-view geometry for the hull plan. SCHEMATIC: see HullPlanPanel. Bow is on the left, so starboard is
 * the upper side of the drawing and port the lower (looking forward from the stern, starboard is on the right).
 */
export const PLAN_W = 640;
export const PLAN_H = 170;
export const PLAN_PAD = 20;
export const PLAN_MID = PLAN_H / 2;

/** The hull-form coefficients that shape the outline. Both come from the hull form record. */
export interface HullLines {
  readonly waterplaneCoeffBp: number;
  readonly lcbPermille: number;
}

export interface PlanFrame {
  readonly lengthM: number;
  readonly beamM: number;
  /** Half the drawn beam, px. */
  readonly maxHalf: number;
  readonly x: (permille: number) => number;
  /** Half-beam (px) at a station fraction 0..1 (0 = bow). */
  readonly half: (t: number) => number;
  readonly lcbPermille: number;
}

export function planFrame(hull: DesignDraft["hull"], lines?: HullLines): PlanFrame {
  const lengthM = Number(hull.lengthWl) / 1000;
  const beamM = Number(hull.beam) / 1000;
  const span = PLAN_W - 2 * PLAN_PAD;
  const ratio = lengthM > 0 ? beamM / lengthM : 0;
  const maxHalf = Math.max(2, Math.min(PLAN_MID - 14, (span * ratio) / 2));
  const shape = waterplaneShape(lines);
  return {
    lengthM,
    beamM,
    maxHalf,
    x: (p) => PLAN_PAD + (span * clampPermille(p)) / 1000,
    half: (t) => maxHalf * shape(t),
    lcbPermille: lines?.lcbPermille ?? 500,
  };
}

const clampPermille = (p: number) => Math.min(1000, Math.max(0, p));

const TRANSOM_HALF = 0.3;
/** Fore/aft curve exponents: > 1 so each curve meets the parallel body tangentially (no visible corner). */
const BOW_EXP = 1.6;
const STERN_EXP = 2;

/** Waterplane area fraction (area / (L x B)) for entrance and run lengths as fractions of the waterline. */
function areaFraction(entrance: number, run: number): number {
  const fore = (entrance * BOW_EXP) / (BOW_EXP + 1);
  const aft = run * (TRANSOM_HALF + ((1 - TRANSOM_HALF) * STERN_EXP) / (STERN_EXP + 1));
  return fore + aft + (1 - entrance - run);
}

/**
 * Normalised half-breadth (0..1) along the waterline, 0 = bow. A pointed, curved entrance blending into a
 * parallel middle body, then a curved run to a narrow transom. The entrance/run proportions follow the centre
 * of buoyancy (a forward LCB gives a shorter, fuller bow) and their overall length is solved so the drawn
 * area equals the waterplane coefficient (a finer coefficient gives longer, slimmer ends). Pure and
 * deterministic. Without `lines` it falls back to a typical form (Cw 0.72, LCB midships).
 */
export function waterplaneShape(lines?: HullLines): (t: number) => number {
  const cw = Math.min(0.95, Math.max(0.5, (lines?.waterplaneCoeffBp ?? 7200) / 10000));
  const lcbShift = ((lines?.lcbPermille ?? 500) - 500) / 1000;
  const e0 = Math.min(1.2, Math.max(0.7, 1 + lcbShift * 2));
  const r0 = Math.min(1.2, Math.max(0.7, 1 - lcbShift * 2));
  // Larger k = longer ends = smaller area. Bounded so the ends never overlap.
  let lo = 0.1;
  let hi = 1 / (e0 + r0);
  for (let i = 0; i < 40; i++) {
    const k = (lo + hi) / 2;
    if (areaFraction(k * e0, k * r0) > cw) lo = k;
    else hi = k;
  }
  const k = (lo + hi) / 2;
  const entrance = k * e0;
  const run = k * r0;
  return (t) => {
    const f = Math.min(1, Math.max(0, t));
    if (f < entrance) return 1 - ((entrance - f) / entrance) ** BOW_EXP;
    if (f > 1 - run) {
      const u = (f - (1 - run)) / run;
      return TRANSOM_HALF + (1 - TRANSOM_HALF) * (1 - u ** STERN_EXP);
    }
    return 1;
  };
}

export interface PlanPoint {
  readonly x: number;
  readonly y: number;
}

/** Position of a fitting. Centreline fittings get a cosmetic vertical nudge (by `index`) so overlaps stay visible. */
export function fittingPoint(
  frame: PlanFrame,
  stationPermille: number,
  side: MountSide | undefined,
  index: number,
): PlanPoint {
  const sign = side === "STBD" ? -1 : side === "PORT" ? 1 : 0;
  return {
    x: frame.x(stationPermille),
    y: PLAN_MID + sign * frame.maxHalf * 0.5 + (sign === 0 ? ((index % 3) - 1) * 6 : 0),
  };
}
