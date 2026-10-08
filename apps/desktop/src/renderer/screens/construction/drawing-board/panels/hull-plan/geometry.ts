import type { DesignDraft, MountSide } from "@bluewave/ship-design";

/**
 * Plan-view geometry for the hull plan. SCHEMATIC: see HullPlanPanel. Bow is on the left, so starboard is
 * the upper side of the drawing and port the lower (looking forward from the stern, starboard is on the right).
 */
export const PLAN_W = 640;
export const PLAN_H = 170;
export const PLAN_PAD = 20;
export const PLAN_MID = PLAN_H / 2;

export interface PlanFrame {
  readonly lengthM: number;
  readonly beamM: number;
  /** Half the drawn beam, px. */
  readonly maxHalf: number;
  readonly x: (permille: number) => number;
}

export function planFrame(hull: DesignDraft["hull"]): PlanFrame {
  const lengthM = Number(hull.lengthWl) / 1000;
  const beamM = Number(hull.beam) / 1000;
  const span = PLAN_W - 2 * PLAN_PAD;
  const ratio = lengthM > 0 ? beamM / lengthM : 0;
  const maxHalf = Math.max(2, Math.min(PLAN_MID - 14, (span * ratio) / 2));
  return { lengthM, beamM, maxHalf, x: (p) => PLAN_PAD + (span * clampPermille(p)) / 1000 };
}

const clampPermille = (p: number) => Math.min(1000, Math.max(0, p));

/** Half-beam (px) at a station fraction 0..1 (0 = bow): pointed bow, full midbody, blunt stern. */
export function halfBeam(t: number, maxHalf: number): number {
  if (t < 0.25) return maxHalf * Math.sin((t / 0.25) * (Math.PI / 2)) ** 0.8;
  if (t > 0.85) return maxHalf * (0.6 + 0.4 * Math.cos(((t - 0.85) / 0.15) * (Math.PI / 2)));
  return maxHalf;
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
