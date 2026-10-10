import type { DesignDraft } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { plural } from "../../plural.js";
import { funnelPlacements } from "./funnelPlacements.js";
import { PLAN_MID, PLAN_PAD, PLAN_W, type PlanFrame } from "./geometry.js";
import {
  type FunnelShape,
  type HouseMasses,
  type ProfileFrame,
  funnelShapes,
  houseMasses,
} from "./profile-geometry.js";
import type { SectionFacts, ZoneRange } from "./sections.js";

/** Card drawing size (SVG user units, drawn about 1:1 in the card). */
export const SECTION_W = 400;
export const PAD_X = 14;
export const PLAN_TOP = 6;
export const PLAN_BAND = 112;
export const PROFILE_TOP = PLAN_TOP + PLAN_BAND + 10;
export const PROFILE_BAND = 92;
export const SCALE_Y = PROFILE_TOP + PROFILE_BAND + 16;
export const SECTION_H = SCALE_Y + 6;

/** Card label size, SVG user units, shared by the band captions, callouts and scale. */
export const CARD_FONT = 12;

/** Station window: the section plus some of its neighbours for context (dimmed). */
function windowFor(zone: ZoneRange): { s: number; e: number } {
  const span = zone.endPermille - zone.startPermille;
  const margin = Math.max(20, span * 0.3);
  return {
    s: Math.max(-25, zone.startPermille - margin),
    e: Math.min(1025, zone.endPermille + margin),
  };
}

/** The plan/profile transforms and derived values the magnified section card renders. */
export interface SectionLayout {
  readonly zone: ZoneRange;
  readonly s: number;
  readonly e: number;
  /** Horizontal scale (card px per plan unit), combined with `X` for the plan band. */
  readonly a: number;
  readonly X: (permille: number) => number;
  readonly b: number;
  readonly ky: number;
  readonly planCy: number;
  readonly planTy: number;
  readonly houses: HouseMasses | undefined;
  readonly funnels: readonly FunnelShape[];
  readonly kp: number;
  readonly profileTy: number;
  readonly pY: (y: number) => number;
  readonly x0: number;
  readonly x1: number;
  readonly step: number;
  readonly ticks: readonly number[];
  /** Accessible name of the drawing. */
  readonly label: string;
}

/**
 * Geometry for the magnified section: a plan band and a profile band on one horizontal scale, cropped to the
 * section with its neighbours dimmed. Pure: the card component only renders these values. Vertical scale may be
 * compressed to fit the card (never exaggerated). Null when the section has no drawing zone.
 */
export function sectionLayout(
  facts: SectionFacts,
  frame: PlanFrame,
  profile: ProfileFrame,
  draft: DesignDraft,
  content: DrawingBoardContent,
  zones: readonly ZoneRange[],
): SectionLayout | null {
  const zone = facts.zone;
  if (!zone) return null;
  const { s, e } = windowFor(zone);
  const unit = (PLAN_W - 2 * PLAN_PAD) / 1000;
  const a = (SECTION_W - 2 * PAD_X) / ((e - s) * unit);
  const X = (permille: number) => PAD_X + ((permille - s) / (e - s)) * (SECTION_W - 2 * PAD_X);
  const b = X(0) - a * PLAN_PAD;
  // Plan band: true proportions unless the beam would overflow the band.
  const ky = Math.min(a, (PLAN_BAND / 2 - 6) / frame.maxHalf);
  const planCy = PLAN_TOP + PLAN_BAND / 2;
  const planTy = planCy - ky * PLAN_MID;
  // Profile band: from the highest structure in the window down to the keel.
  const superstructure = zones.find((z) => z.id === "SUPERSTRUCTURE");
  const houses = houseMasses(profile, superstructure);
  const funnels = funnelShapes(profile, funnelPlacements(draft, content), houses);
  const tops = [
    ...Array.from({ length: 21 }, (_, i) => profile.deckY((s + ((e - s) * i) / 20) / 1000)),
    ...(houses ? [...houses.lower, ...houses.upper].map((p) => p.y) : []),
    ...funnels.flatMap((f) => f.polygon.map((p) => p.y)),
  ].filter(Number.isFinite);
  const yTop = Math.min(...tops) - 4;
  const yBot = profile.keelBaseY + 3;
  const kp = Math.min(a, PROFILE_BAND / (yBot - yTop));
  const profileTy = PROFILE_TOP + PROFILE_BAND - kp * yBot;
  const pY = (y: number) => kp * y + profileTy;
  const x0 = X(zone.startPermille);
  const x1 = X(zone.endPermille);
  const step = e - s <= 200 ? 10 : e - s <= 450 ? 25 : 50;
  const ticks: number[] = [];
  for (let p = Math.ceil(s / step) * step; p <= e; p += step)
    if (p >= 0 && p <= 1000) ticks.push(p);
  const label = `Detailed drawing of the ${facts.meta.name.toLowerCase()}, stations ${zone.startPermille} to ${zone.endPermille} permille: plan above, profile below, ${plural(facts.fittings.length, "fitting")} numbered${facts.machineryRooms.length ? `, ${plural(facts.machineryRooms.length, "machinery room")}` : ""}${facts.fuelStationPermille !== undefined ? ", fuel stowage" : ""}.`;
  return {
    zone,
    s,
    e,
    a,
    X,
    b,
    ky,
    planCy,
    planTy,
    houses,
    funnels,
    kp,
    profileTy,
    pY,
    x0,
    x1,
    step,
    ticks,
    label,
  };
}
