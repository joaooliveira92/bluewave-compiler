import type { DesignDraft } from "@bluewave/ship-design";
import { type BowStyle, PLAN_PAD, PLAN_W, type SternStyle, stationX } from "./geometry.js";

/**
 * Side-profile geometry. SCHEMATIC: a coherent preliminary silhouette, not a lines plan.
 *
 * Coordinates: SVG user units, origin top-left, x to the right (BOW AT THE LEFT, as in the plan), y DOWN.
 * Horizontal positions use `stationX` (permille of waterline length), the same scale and origin as the plan.
 * Vertical positions use one px-per-metre scale (`vScale`) so depth, draught and sheer are consistent.
 *
 * Each value is one of: PHYSICAL (from the hull record, metres), DISPLAY (a documented visual clamp or
 * amplification, never shown as data) or CONVENTION (a fixed drawing proportion per bow/stern style).
 * Raw hull values stay available on the frame (`raw`) for labels and descriptions.
 */
export const PROFILE_W = PLAN_W;
export const PROFILE_H = 132;
const TOP_PAD = 14;
const BOTTOM_PAD = 20;

/** DISPLAY clamp: drawn depth as a fraction of waterline length, so no hull is unreadably thin or tall. */
const DEPTH_OF_LENGTH = { min: 0.04, max: 0.2 } as const;
/** DISPLAY clamp: drawn draught as a fraction of drawn depth, so there is always some freeboard and some draught. */
const DRAUGHT_OF_DEPTH = { min: 0.15, max: 0.9 } as const;
/** DISPLAY: the amplified sheer rise never exceeds this fraction of the depth. */
const SHEER_CAP_OF_DEPTH = 0.4;
/** DISPLAY: gain and knee of the sheer amplification (see `displaySheerRise`). */
const SHEER_GAIN = 1.5;
const SHEER_KNEE = 0.1;
/** CONVENTION: the stern's sheer rise relative to the bow's. */
const STERN_SHEER_RATIO = 0.6;

/** CONVENTION: heights above the deck as fractions of the drawn depth. */
export const FUNNEL_RISE = 0.75;
const MIN_FUNNEL_RISE = 0.25;
const LOWER_HOUSE_RISE = 0.22;
const UPPER_HOUSE_RISE = 0.14;
/** CONVENTION: funnel width at the base as a fraction of drawn depth px; the top is narrower and raked aft. */
const FUNNEL_WIDTH_OF_DEPTH = 0.3;
const FUNNEL_TOP_TAPER = 0.82;
const FUNNEL_RAKE_OF_WIDTH = 0.15;
const FUNNEL_MIN_WIDTH_PX = 3;
const FUNNEL_GAP_PX = 3;
/** CONVENTION: superstructure is kept off the stem and stern (permille of waterline length). */
const HOUSE_LIMITS = { min: 50, max: 950 } as const;
const HOUSE_SAMPLES = 8;

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** A closed-path building block; serialised by `serializePath`. */
export type PathSegment =
  | { readonly kind: "M" | "L"; readonly to: Point }
  | { readonly kind: "Q"; readonly control: Point; readonly to: Point }
  | { readonly kind: "C"; readonly c1: Point; readonly c2: Point; readonly to: Point }
  | { readonly kind: "Z" };

const fmt = (n: number) => n.toFixed(2);
const pt = (p: Point) => `${fmt(p.x)} ${fmt(p.y)}`;

export function serializePath(segments: readonly PathSegment[]): string {
  return segments
    .map((s) => {
      switch (s.kind) {
        case "M":
        case "L":
          return `${s.kind} ${pt(s.to)}`;
        case "Q":
          return `Q ${pt(s.control)} ${pt(s.to)}`;
        case "C":
          return `C ${pt(s.c1)} ${pt(s.c2)} ${pt(s.to)}`;
        case "Z":
          return "Z";
      }
    })
    .join(" ");
}

/** Every vertex and control point of a path (for bounds and finiteness checks). */
export function pathPoints(segments: readonly PathSegment[]): Point[] {
  return segments.flatMap((s): Point[] => {
    switch (s.kind) {
      case "M":
      case "L":
        return [s.to];
      case "Q":
        return [s.control, s.to];
      case "C":
        return [s.c1, s.c2, s.to];
      case "Z":
        return [];
    }
  });
}

const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** The path flattened to a polyline (`steps` points per curved segment), in order. */
export function samplePath(segments: readonly PathSegment[], steps = 24): Point[] {
  const out: Point[] = [];
  let cursor: Point | undefined;
  for (const s of segments) {
    if (s.kind === "M" || s.kind === "L") {
      out.push(s.to);
      cursor = s.to;
    } else if (s.kind === "Q" && cursor) {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        out.push(lerp(lerp(cursor, s.control, t), lerp(s.control, s.to, t), t));
      }
      cursor = s.to;
    } else if (s.kind === "C" && cursor) {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const ab = lerp(cursor, s.c1, t);
        const bc = lerp(s.c1, s.c2, t);
        const cd = lerp(s.c2, s.to, t);
        out.push(lerp(lerp(ab, bc, t), lerp(bc, cd, t), t));
      }
      cursor = s.to;
    }
  }
  return out;
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));
const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

/**
 * DISPLAY treatment of sheer: the rise as a fraction of depth (`(sheerBp - 100%)`) is amplified so a modest
 * real sheer stays visible, then capped. Zero stays zero, the map is monotonic non-decreasing, and it is never
 * reported as data. `r + gain * r * knee / (knee + r)` has a strictly positive derivative before the cap.
 */
export function displaySheerRise(sheerBp: number): number {
  const rise = Math.max(0, finiteOr((sheerBp - 10000) / 10000, 0));
  const amplified = rise + (SHEER_GAIN * rise * SHEER_KNEE) / (SHEER_KNEE + rise);
  return Math.min(SHEER_CAP_OF_DEPTH, amplified);
}

/** Named anchor points of the silhouette (for tests, labels and fitted structures). */
export interface ProfileAnchors {
  /** Top of the stem at the deck. */
  readonly head: Point;
  /** Foremost point of a ram bow; absent for other bows. */
  readonly ramTip?: Point;
  /** Where the stem meets the forefoot (lowest point of the stem curve). */
  readonly stemFoot: Point;
  /** Where the flat keel begins to curve up toward the stem. */
  readonly keelFore: Point;
  /** Where the flat keel begins to curve up toward the stern. */
  readonly keelAft: Point;
  /** Heel of the sternpost / bottom of the stern cut-up. */
  readonly sternPost: Point;
  /** Aftmost top corner of the deck. */
  readonly deckStern: Point;
}

export interface ProfileFrame {
  /** Raw hull values (metres) for labels and descriptions; the drawing may use clamped display values. */
  readonly raw: { readonly lengthM: number; readonly depthM: number; readonly draughtM: number };
  /** DISPLAY depth and draught (metres) after the visual clamps. */
  readonly depthM: number;
  readonly draughtM: number;
  /** px per metre, vertical. */
  readonly vScale: number;
  readonly waterlineY: number;
  /** Keel (baseline) y at midships. */
  readonly keelBaseY: number;
  /** Deck-edge y at midships, the origin of the sheer. */
  readonly deckMidY: number;
  readonly x: (permille: number) => number;
  /** Deck-edge y at a station fraction 0..1 (0 = bow). Single source for everything mounted on the deck. */
  readonly deckY: (t: number) => number;
  readonly bow: BowStyle;
  readonly stern: SternStyle;
  readonly anchors: ProfileAnchors;
  /** The closed silhouette. */
  readonly outline: readonly PathSegment[];
}

interface HullMetrics {
  readonly rawLengthM: number;
  readonly rawDepthM: number;
  readonly rawDraughtM: number;
  readonly lengthM: number;
  readonly depthM: number;
  readonly draughtM: number;
}

function hullMetrics(hull: DesignDraft["hull"]): HullMetrics {
  const rawLengthM = Number(hull.lengthWl) / 1000;
  const rawDepthM = Number(hull.depthToMainDeck) / 1000;
  const rawDraughtM = Number(hull.draught) / 1000;
  const lengthM = rawLengthM > 0 && Number.isFinite(rawLengthM) ? rawLengthM : 1;
  const depthM = clamp(
    finiteOr(rawDepthM, lengthM * 0.1),
    lengthM * DEPTH_OF_LENGTH.min,
    lengthM * DEPTH_OF_LENGTH.max,
  );
  const draughtM = clamp(
    finiteOr(rawDraughtM, depthM * 0.5),
    depthM * DRAUGHT_OF_DEPTH.min,
    depthM * DRAUGHT_OF_DEPTH.max,
  );
  return { rawLengthM, rawDepthM, rawDraughtM, lengthM, depthM, draughtM };
}

/** Quadratic sheer parabola, flat at midships (zero slope, so no flat-to-curve kink); exactly representable as two Béziers. */
function sheerDeckY(deckMidY: number, bowRisePx: number, t: number): number {
  const clamped = clamp(t, 0, 1);
  const u = Math.abs(2 * clamped - 1);
  const rise = clamped < 0.5 ? bowRisePx : bowRisePx * STERN_SHEER_RATIO;
  return deckMidY - rise * u * u;
}

export function profileFrame(
  hull: DesignDraft["hull"],
  sheerBp: number,
  bow: BowStyle = "ram",
  stern: SternStyle = "counter",
): ProfileFrame {
  const m = hullMetrics(hull);
  const hScale = (PLAN_W - 2 * PLAN_PAD) / m.lengthM;
  const sheerM = displaySheerRise(sheerBp) * m.depthM;
  const headroomM = Math.max(sheerM + MIN_FUNNEL_RISE * m.depthM, FUNNEL_RISE * m.depthM);
  const available = PROFILE_H - TOP_PAD - BOTTOM_PAD;
  const vScale = Math.min(hScale, available / (m.depthM + headroomM));
  const deckMidY = TOP_PAD + headroomM * vScale;
  const waterlineY = deckMidY + (m.depthM - m.draughtM) * vScale;
  const keelBaseY = waterlineY + m.draughtM * vScale;
  const bowRisePx = sheerM * vScale;
  const deckY = (t: number) => sheerDeckY(deckMidY, bowRisePx, t);
  const { outline, anchors } = buildOutline({
    bow,
    stern,
    deckY,
    waterlineY,
    keelBaseY,
  });
  return {
    raw: { lengthM: m.rawLengthM, depthM: m.rawDepthM, draughtM: m.rawDraughtM },
    depthM: m.depthM,
    draughtM: m.draughtM,
    vScale,
    waterlineY,
    keelBaseY,
    deckMidY,
    x: stationX,
    deckY,
    bow,
    stern,
    anchors,
    outline,
  };
}

interface OutlineInput {
  readonly bow: BowStyle;
  readonly stern: SternStyle;
  readonly deckY: (t: number) => number;
  readonly waterlineY: number;
  readonly keelBaseY: number;
}

/** Waterline length in px, and the bow/stern x positions. */
const X_BOW = stationX(0);
const X_STERN = stationX(1000);
const LENGTH_PX = X_STERN - X_BOW;
const along = (fraction: number) => LENGTH_PX * fraction;

interface BowResult {
  /** Segments from the start of the forefoot (the fore end of the flat keel) up to the stem head. */
  readonly segments: PathSegment[];
  readonly head: Point;
  readonly ramTip?: Point;
  readonly stemFoot: Point;
  readonly keelFore: Point;
}

/** CONVENTION: forefoot length (how far aft the keel starts curving up), as a fraction of waterline length. */
const FOREFOOT_LENGTH: Record<BowStyle, number> = { ram: 0.17, spoon: 0.2, plumb: 0.12 };

function buildBow(input: OutlineInput): BowResult {
  const { bow, waterlineY, keelBaseY } = input;
  const deckBowY = input.deckY(0);
  const draughtPx = keelBaseY - waterlineY;
  const keelFore: Point = { x: X_BOW + along(FOREFOOT_LENGTH[bow]), y: keelBaseY };
  const foreSweep = (fraction: number): Point => ({
    x: keelFore.x - along(fraction),
    y: keelBaseY,
  });

  if (bow === "ram") {
    // The ram: a restrained beak just below the waterline; the upper stem returns aft toward the forecastle.
    const ramTip: Point = { x: X_BOW - along(0.018), y: waterlineY + 0.1 * draughtPx };
    const head: Point = { x: X_BOW + along(0.012), y: deckBowY };
    return {
      segments: [
        {
          kind: "C",
          c1: foreSweep(0.08),
          c2: { x: ramTip.x + along(0.04), y: ramTip.y + 0.6 * (keelBaseY - ramTip.y) },
          to: ramTip,
        },
        {
          kind: "C",
          c1: lerp(ramTip, head, 0.33),
          c2: lerp(ramTip, head, 0.7),
          to: head,
        },
      ],
      head,
      ramTip,
      stemFoot: ramTip,
      keelFore,
    };
  }

  if (bow === "spoon") {
    // Fine entry: a stem that curves up and forward, leaving the forefoot with no corner.
    const stemFoot: Point = { x: X_BOW + along(0.006), y: waterlineY + 0.2 * draughtPx };
    const head: Point = { x: X_BOW - along(0.025), y: deckBowY };
    const forefootC2: Point = {
      x: stemFoot.x + along(0.025),
      y: stemFoot.y + 0.55 * (keelBaseY - stemFoot.y),
    };
    const tangent = { x: stemFoot.x - forefootC2.x, y: stemFoot.y - forefootC2.y };
    const tangentLength = Math.hypot(tangent.x, tangent.y);
    const stemHeight = stemFoot.y - head.y;
    const handle = 0.35 * stemHeight;
    return {
      segments: [
        { kind: "C", c1: foreSweep(0.09), c2: forefootC2, to: stemFoot },
        {
          kind: "C",
          c1: {
            x: stemFoot.x + (tangent.x / tangentLength) * handle,
            y: stemFoot.y + (tangent.y / tangentLength) * handle,
          },
          c2: { x: head.x + along(0.012), y: head.y + 0.4 * stemHeight },
          to: head,
        },
      ],
      head,
      stemFoot,
      keelFore,
    };
  }

  // Plumb: an upright stem down to a rounded forefoot.
  const head: Point = { x: X_BOW, y: deckBowY };
  const stemFoot: Point = { x: X_BOW, y: keelBaseY - 0.45 * draughtPx };
  return {
    segments: [
      {
        kind: "C",
        c1: foreSweep(0.05),
        c2: { x: stemFoot.x, y: stemFoot.y + 0.5 * (keelBaseY - stemFoot.y) },
        to: stemFoot,
      },
      { kind: "L", to: head },
    ],
    head,
    stemFoot,
    keelFore,
  };
}

interface SternResult {
  /** Segments from the aft end of the deck down to the sternpost heel. */
  readonly segments: PathSegment[];
  readonly deckStern: Point;
  readonly sternPost: Point;
  /** The last control point before the heel, so the rising keel can leave it with a matching tangent. */
  readonly exitControl: Point;
}

/**
 * A control point continuing the direction `from -> joint` past `joint` by up to `length` px, shortened so it
 * never goes below `floorY` (so a curve leaving a sternpost cannot dip under the keel line).
 */
function continueTangent(from: Point, joint: Point, length: number, floorY: number): Point {
  const dx = joint.x - from.x;
  const dy = joint.y - from.y;
  const size = Math.hypot(dx, dy) || 1;
  const uy = dy / size;
  const reach = uy > 0 ? Math.min(length, Math.max(0, floorY - joint.y) / uy) : length;
  return { x: joint.x + (dx / size) * reach, y: joint.y + (dy / size) * reach };
}

function buildStern(input: OutlineInput): SternResult {
  const { stern, waterlineY, keelBaseY } = input;
  const draughtPx = keelBaseY - waterlineY;
  const deckStern: Point = { x: X_STERN, y: input.deckY(1) };

  if (stern === "transom") {
    // A flat transom down to a rounded heel.
    const transomFoot: Point = { x: X_STERN, y: waterlineY + 0.45 * draughtPx };
    const sternPost: Point = { x: X_STERN - along(0.035), y: waterlineY + 0.85 * draughtPx };
    return {
      segments: [
        { kind: "L", to: transomFoot },
        {
          kind: "C",
          c1: { x: X_STERN, y: transomFoot.y + 0.25 * draughtPx },
          c2: { x: sternPost.x + along(0.015), y: sternPost.y },
          to: sternPost,
        },
      ],
      deckStern,
      sternPost,
      exitControl: { x: sternPost.x + along(0.015), y: sternPost.y },
    };
  }

  if (stern === "round") {
    // A rounded fantail curving under in one sweep.
    const sternPost: Point = { x: X_STERN - along(0.05), y: waterlineY + 0.55 * draughtPx };
    return {
      segments: [
        {
          kind: "C",
          c1: { x: deckStern.x, y: deckStern.y + 0.55 * (sternPost.y - deckStern.y) },
          c2: {
            x: sternPost.x + along(0.025),
            y: sternPost.y - 0.35 * (sternPost.y - deckStern.y),
          },
          to: sternPost,
        },
      ],
      deckStern,
      sternPost,
      exitControl: {
        x: sternPost.x + along(0.025),
        y: sternPost.y - 0.35 * (sternPost.y - deckStern.y),
      },
    };
  }

  // Counter: the deck overhangs; the counter curves under to the waterline, then a raked sternpost.
  const counterFoot: Point = { x: X_STERN - along(0.03), y: waterlineY };
  const sternPost: Point = { x: X_STERN - along(0.055), y: waterlineY + 0.45 * draughtPx };
  const counterC2: Point = {
    x: counterFoot.x + along(0.01),
    y: counterFoot.y - 0.3 * (counterFoot.y - deckStern.y),
  };
  const heading = { x: counterFoot.x - counterC2.x, y: counterFoot.y - counterC2.y };
  const headingLength = Math.hypot(heading.x, heading.y);
  const handle = 0.3 * (sternPost.y - counterFoot.y);
  return {
    segments: [
      {
        kind: "C",
        c1: { x: deckStern.x, y: deckStern.y + 0.5 * (counterFoot.y - deckStern.y) },
        c2: counterC2,
        to: counterFoot,
      },
      {
        kind: "C",
        c1: {
          x: counterFoot.x + (heading.x / headingLength) * handle,
          y: counterFoot.y + (heading.y / headingLength) * handle,
        },
        c2: { x: sternPost.x + along(0.004), y: sternPost.y - 0.3 * (sternPost.y - counterFoot.y) },
        to: sternPost,
      },
    ],
    deckStern,
    sternPost,
    exitControl: {
      x: sternPost.x + along(0.004),
      y: sternPost.y - 0.3 * (sternPost.y - counterFoot.y),
    },
  };
}

/**
 * The closed silhouette, clockwise on screen: stem head, sheer line (two parabolic Béziers meeting at midships
 * with a horizontal tangent), stern, sternpost heel, rising keel, flat keel, forefoot, stem, close.
 */
function buildOutline(input: OutlineInput): {
  outline: PathSegment[];
  anchors: ProfileAnchors;
} {
  const bow = buildBow(input);
  const stern = buildStern(input);
  const deckMid: Point = { x: stationX(500), y: input.deckY(0.5) };
  const keelAft: Point = { x: stationX(840), y: input.keelBaseY };
  const outline: PathSegment[] = [
    { kind: "M", to: bow.head },
    { kind: "Q", control: { x: stationX(250), y: deckMid.y }, to: deckMid },
    { kind: "Q", control: { x: stationX(750), y: deckMid.y }, to: stern.deckStern },
    ...stern.segments,
    {
      kind: "C",
      c1: continueTangent(stern.exitControl, stern.sternPost, along(0.05), input.keelBaseY),
      c2: { x: keelAft.x + along(0.07), y: input.keelBaseY },
      to: keelAft,
    },
    { kind: "L", to: bow.keelFore },
    ...bow.segments,
    { kind: "Z" },
  ];
  return {
    outline,
    anchors: {
      head: bow.head,
      ...(bow.ramTip ? { ramTip: bow.ramTip } : {}),
      stemFoot: bow.stemFoot,
      keelFore: bow.keelFore,
      keelAft,
      sternPost: stern.sternPost,
      deckStern: stern.deckStern,
    },
  };
}

/** Deck-mounted structures. */
export interface HouseMasses {
  /** Polygons, bottom edge exactly on the sampled deck (lower) or on the lower mass top (upper). */
  readonly lower: readonly Point[];
  readonly upper: readonly Point[];
  readonly startPermille: number;
  readonly endPermille: number;
  /** y of the structure's top at a station fraction, inside the lower mass; used to seat funnels. */
  readonly lowerTopY: (t: number) => number;
}

/**
 * The stepped superstructure over a zone. The zone is the longitudinal authority; it is kept inside
 * `HOUSE_LIMITS` so it never reaches the stem or stern. The lower mass follows the sheer; a shorter upper
 * mass (bridge) sits on it. Both are deterministic drawing conventions, not component data.
 */
export function houseMasses(
  frame: ProfileFrame,
  zone: { readonly startPermille: number; readonly endPermille: number } | undefined,
): HouseMasses | undefined {
  if (!zone) return undefined;
  const start = clamp(
    Math.min(zone.startPermille, zone.endPermille),
    HOUSE_LIMITS.min,
    HOUSE_LIMITS.max,
  );
  const end = clamp(
    Math.max(zone.startPermille, zone.endPermille),
    HOUSE_LIMITS.min,
    HOUSE_LIMITS.max,
  );
  if (end - start < 10) return undefined;
  const lowerRisePx = LOWER_HOUSE_RISE * frame.depthM * frame.vScale;
  const upperRisePx = UPPER_HOUSE_RISE * frame.depthM * frame.vScale;
  const lowerTopY = (t: number) => frame.deckY(t) - lowerRisePx;
  const chamfer = along(0.012);
  const run = (from: number, to: number, baseOf: (t: number) => number): Point[] =>
    Array.from({ length: HOUSE_SAMPLES + 1 }, (_, i) => {
      const permille = from + ((to - from) * i) / HOUSE_SAMPLES;
      return { x: frame.x(permille), y: baseOf(permille / 1000) };
    });
  const bottom = run(start, end, (t) => frame.deckY(t));
  const top = run(start, end, lowerTopY).reverse();
  const first = bottom[0]!;
  const lower = [
    ...bottom,
    ...top.slice(0, -1),
    // Forward end is chamfered: the top starts a little aft of the bottom.
    { x: first.x + chamfer, y: lowerTopY(start / 1000) },
  ];
  const upperStart = start + (end - start) * 0.2;
  const upperEnd = start + (end - start) * 0.65;
  const upperBottom = run(upperStart, upperEnd, lowerTopY);
  const upperTop = run(upperStart, upperEnd, (t) => lowerTopY(t) - upperRisePx).reverse();
  return {
    lower,
    upper: [...upperBottom, ...upperTop],
    startPermille: start,
    endPermille: end,
    lowerTopY,
  };
}

/** A placed funnel as the drawing sees it. */
export interface FunnelInput {
  readonly instanceId: string;
  readonly stationPermille: number;
}

export interface FunnelShape {
  readonly instanceId: string;
  readonly stationPermille: number;
  /** x of the funnel centre at its base. */
  readonly centreX: number;
  /** Seat: the lower house top inside the superstructure, otherwise the deck. */
  readonly baseY: number;
  readonly topY: number;
  readonly widthPx: number;
  /** Tapered, aft-raked trapezoid: base-left, base-right, top-right, top-left. */
  readonly polygon: readonly Point[];
}

/** Funnels in stable order (station, then id), each seated on the local house top or deck. */
export function funnelShapes(
  frame: ProfileFrame,
  funnels: readonly FunnelInput[],
  houses: HouseMasses | undefined,
): FunnelShape[] {
  const ordered = [...funnels].sort(
    (a, b) => a.stationPermille - b.stationPermille || a.instanceId.localeCompare(b.instanceId),
  );
  const depthPx = frame.depthM * frame.vScale;
  const xs = ordered.map((f) => frame.x(f.stationPermille));
  const spacing = xs.slice(1).map((x, i) => x - xs[i]!);
  const tightest = spacing.length > 0 ? Math.min(...spacing) : Number.POSITIVE_INFINITY;
  const widthPx = Math.max(
    FUNNEL_MIN_WIDTH_PX,
    Math.min(FUNNEL_WIDTH_OF_DEPTH * depthPx, tightest - FUNNEL_GAP_PX),
  );
  return ordered.map((f) => {
    const t = clamp(f.stationPermille, 0, 1000) / 1000;
    const inHouse =
      houses &&
      f.stationPermille >= houses.startPermille &&
      f.stationPermille <= houses.endPermille;
    const baseY = inHouse ? houses.lowerTopY(t) : frame.deckY(t);
    const minHeight = MIN_FUNNEL_RISE * depthPx;
    const topY = Math.max(
      TOP_PAD,
      Math.min(frame.deckMidY - FUNNEL_RISE * depthPx, baseY - minHeight),
    );
    const centreX = frame.x(f.stationPermille);
    const topWidth = widthPx * FUNNEL_TOP_TAPER;
    const rake = widthPx * FUNNEL_RAKE_OF_WIDTH;
    return {
      instanceId: f.instanceId,
      stationPermille: f.stationPermille,
      centreX,
      baseY,
      topY,
      widthPx,
      polygon: [
        { x: centreX - widthPx / 2, y: baseY },
        { x: centreX + widthPx / 2, y: baseY },
        { x: centreX + rake + topWidth / 2, y: topY },
        { x: centreX + rake - topWidth / 2, y: topY },
      ],
    };
  });
}

export const polygonPoints = (points: readonly Point[]): string =>
  points.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(" ");
