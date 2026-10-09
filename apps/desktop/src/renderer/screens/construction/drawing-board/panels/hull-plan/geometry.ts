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
  readonly bow?: BowStyle;
}

/** Bow character, a drawing choice per hull form (not simulation data): ram beak, spoon bow or blunt plumb bow. */
export type BowStyle = "ram" | "spoon" | "plumb";

/** Drawn bow for a hull form id; unrecognised forms get the 1880s default, a ram. */
export function bowStyleFor(hullFormId: string): BowStyle {
  if (hullFormId === "torpedo_boat_form") return "spoon";
  if (hullFormId === "coast_defence_form") return "plumb";
  return "ram";
}

/** Half-width of the stem as a fraction of the beam: how blunt the very tip of the bow is. */
const BOW_TIP: Record<BowStyle, number> = { ram: 0, spoon: 0.1, plumb: 0.2 };

export interface PlanFrame {
  readonly lengthM: number;
  readonly beamM: number;
  /** Half the drawn beam, px. */
  readonly maxHalf: number;
  readonly x: (permille: number) => number;
  /** Half-beam (px) at a station fraction 0..1 (0 = bow). */
  readonly half: (t: number) => number;
  readonly lcbPermille: number;
  readonly bow: BowStyle;
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
    bow: lines?.bow ?? "ram",
  };
}

const clampPermille = (p: number) => Math.min(1000, Math.max(0, p));

const TRANSOM_HALF = 0.3;
/** Fore/aft curve exponents: > 1 so each curve meets the parallel body tangentially (no visible corner). */
const BOW_EXP = 1.6;
const STERN_EXP = 2;

/** Waterplane area fraction (area / (L x B)) for entrance and run lengths as fractions of the waterline. */
function areaFraction(entrance: number, run: number, tip: number): number {
  const fore = entrance * (tip + ((1 - tip) * BOW_EXP) / (BOW_EXP + 1));
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
  const tip = BOW_TIP[lines?.bow ?? "ram"];
  const e0 = Math.min(1.2, Math.max(0.7, 1 + lcbShift * 2));
  const r0 = Math.min(1.2, Math.max(0.7, 1 - lcbShift * 2));
  // Larger k = longer ends = smaller area. Bounded so the ends never overlap.
  let lo = 0.1;
  let hi = 1 / (e0 + r0);
  for (let i = 0; i < 40; i++) {
    const k = (lo + hi) / 2;
    if (areaFraction(k * e0, k * r0, tip) > cw) lo = k;
    else hi = k;
  }
  const k = (lo + hi) / 2;
  const entrance = k * e0;
  const run = k * r0;
  return (t) => {
    const f = Math.min(1, Math.max(0, t));
    if (f < entrance) return tip + (1 - tip) * (1 - ((entrance - f) / entrance) ** BOW_EXP);
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

export const PROFILE_W = PLAN_W;
/** Funnel and superstructure heights above the deck, as fractions of the hull depth (schematic). */
export const FUNNEL_RISE = 0.7;
export const SUPERSTRUCTURE_RISE = 0.35;
export const PROFILE_H = 120;

export interface ProfileFrame {
  readonly x: (permille: number) => number;
  /** Waterline y, px. */
  readonly waterlineY: number;
  /** px per metre, vertical. */
  readonly vScale: number;
  readonly depthM: number;
  readonly draughtM: number;
  /** Deck-edge y at a station fraction 0..1 (0 = bow): rises toward the ends by the form's sheer. */
  readonly deckY: (t: number) => number;
  /** Keel y at a station fraction: cut up toward the stem and the stern. */
  readonly keelY: (t: number) => number;
  readonly bow: BowStyle;
}

/**
 * Side-profile geometry (bow left). SCHEMATIC: deck sheer rises toward the ends by (sheerBp - 100%) of the depth,
 * more forward than aft, and the keel is cut up to the waterline at the stem. Same horizontal scale as the plan;
 * the vertical scale is reduced if the hull would not fit the drawing.
 */
export function profileFrame(
  hull: DesignDraft["hull"],
  sheerBp: number,
  bow: BowStyle = "ram",
): ProfileFrame {
  const lengthM = Number(hull.lengthWl) / 1000;
  const depthM = Math.max(0, Number(hull.depthToMainDeck) / 1000);
  const draughtM = Math.max(0, Math.min(depthM, Number(hull.draught) / 1000));
  const hScale = lengthM > 0 ? (PLAN_W - 2 * PLAN_PAD) / lengthM : 1;
  const sheerM = Math.max(0, (sheerBp - 10000) / 10000) * depthM;
  const avail = PROFILE_H - 44;
  // Headroom above the deck line for the funnels (0.7 of the depth), or the sheer if that is higher.
  const headM = Math.max(sheerM, depthM * FUNNEL_RISE);
  const vScale = depthM + headM > 0 ? Math.min(hScale, avail / (depthM + headM)) : hScale;
  const freeboardM = depthM - draughtM;
  const waterlineY = 26 + (freeboardM + headM) * vScale;
  const sheerAt = (t: number) => {
    const u = Math.abs(2 * Math.min(1, Math.max(0, t)) - 1);
    return sheerM * u * u * (t < 0.5 ? 1 : 0.6);
  };
  return {
    x: (p) => PLAN_PAD + ((PLAN_W - 2 * PLAN_PAD) * clampPermille(p)) / 1000,
    waterlineY,
    vScale,
    depthM,
    draughtM,
    bow,
    deckY: (t) => waterlineY - (freeboardM + sheerAt(t)) * vScale,
    keelY: (t) => {
      const f = Math.min(1, Math.max(0, t));
      const fwd = f < 0.2 ? (f / 0.2) ** 0.7 : 1;
      const aft = f > 0.9 ? 1 - 0.3 * ((f - 0.9) / 0.1) ** 2 : 1;
      return waterlineY + draughtM * vScale * fwd * aft;
    },
  };
}
