import type {
  ComponentCategory,
  DesignDraft,
  MountSide,
  WorkshopView,
  ZoneId,
} from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { PLAN_W, stationX } from "./geometry.js";

/** The eight longitudinal sections under the plan, bow to stern (the MISSION overlay zone has no strip). */
export const SECTION_IDS = [
  "forecastle",
  "forward-magazine",
  "forward-service",
  "central-machinery",
  "superstructure",
  "aft-service",
  "aft-magazine",
  "quarterdeck",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface SectionMeta {
  /** The hull-form zone this section draws. */
  readonly zoneId: Exclude<ZoneId, "MISSION">;
  /** Full readable name: the trigger's accessible name and the card heading. */
  readonly name: string;
  /** Visible label when the strip is narrow. */
  readonly shortLabel: string;
  /** One line on what the section is for. General naval usage, not design data. */
  readonly purpose: string;
}

/** Single source of every section's names and copy; exhaustive over `SectionId`. */
export const SECTIONS: { readonly [K in SectionId]: SectionMeta } = {
  forecastle: {
    zoneId: "FORECASTLE",
    name: "Forecastle",
    shortLabel: "Forecastle",
    purpose: "The bow and forward deck: the stem, ground tackle and the foremost gun positions.",
  },
  "forward-magazine": {
    zoneId: "FWD_MAGAZINE",
    name: "Forward magazine",
    shortLabel: "Fwd magazine",
    purpose: "Ammunition stowage for the forward guns, low in the hull and below the waterline.",
  },
  "forward-service": {
    zoneId: "FWD_SERVICE",
    name: "Forward service",
    shortLabel: "Fwd service",
    purpose:
      "Service spaces between the forward magazine and the machinery: stores, crew and auxiliaries.",
  },
  "central-machinery": {
    zoneId: "CENTRAL_MACHINERY",
    name: "Central machinery",
    shortLabel: "Machinery",
    purpose: "Boiler and engine rooms amidships, with their bunkers, uptakes and funnels.",
  },
  superstructure: {
    zoneId: "SUPERSTRUCTURE",
    name: "Superstructure",
    shortLabel: "Superstructure",
    purpose: "The deck houses above the main deck: bridge, conning position and boats.",
  },
  "aft-service": {
    zoneId: "AFT_SERVICE",
    name: "Aft service",
    shortLabel: "Aft service",
    purpose: "Service spaces abaft the machinery: stores, accommodation and auxiliaries.",
  },
  "aft-magazine": {
    zoneId: "AFT_MAGAZINE",
    name: "Aft magazine",
    shortLabel: "Aft magazine",
    purpose: "Ammunition stowage for the after guns, low in the hull and below the waterline.",
  },
  quarterdeck: {
    zoneId: "QUARTERDECK",
    name: "Quarterdeck",
    shortLabel: "Quarterdeck",
    purpose: "The stern and after deck: steering gear and the aftermost gun positions.",
  },
};

export interface ZoneRange {
  readonly id: string;
  readonly startPermille: number;
  readonly endPermille: number;
  readonly volumeBp?: number;
  readonly deckAreaBp?: number;
}

/** Horizontal placement of a section in the plan, as percentages of the drawing width (so it scales with it). */
export function sectionSpan(zone: ZoneRange): { leftPct: number; widthPct: number } {
  const left = stationX(zone.startPermille);
  return {
    leftPct: (left / PLAN_W) * 100,
    widthPct: ((stationX(zone.endPermille) - left) / PLAN_W) * 100,
  };
}

/** Coarse drawing symbol for a fitting; the card's list names the actual component. */
export type FittingKind = "gun" | "torpedo" | "magazine" | "machinery" | "funnel" | "other";

const GUN: readonly ComponentCategory[] = [
  "MAIN_GUN",
  "SECONDARY_GUN",
  "DUAL_PURPOSE_GUN",
  "AA_WEAPON",
];
const MACHINERY: readonly ComponentCategory[] = [
  "BOILER",
  "ENGINE",
  "SHAFT_PROPELLER",
  "GENERATOR",
  "FUEL_BUNKER",
];

export function fittingKind(category: ComponentCategory, tags: readonly string[]): FittingKind {
  if (tags.includes("funnel")) return "funnel";
  if (GUN.includes(category)) return "gun";
  if (category === "TORPEDO_TUBE") return "torpedo";
  if (category === "MAGAZINE" || category === "AMMUNITION") return "magazine";
  if (MACHINERY.includes(category)) return "machinery";
  return "other";
}

export interface SectionFitting {
  /** 1-based callout number shared by the drawing and the list. */
  readonly n: number;
  readonly instanceId: string;
  readonly name: string;
  readonly kind: FittingKind;
  readonly stationPermille: number;
  readonly side: MountSide;
  /** Index in `draft.placements`, so the drawing places it exactly where the main plan does. */
  readonly placementIndex: number;
  readonly weightKg: number | undefined;
  /** Effective beam arc for gun mounts, degrees. */
  readonly arcDeg: number | undefined;
  /** Magazine protection against the design threat, bp, for magazines. */
  readonly protectionBp: number | undefined;
}

export interface SectionFacts {
  readonly id: SectionId;
  readonly meta: SectionMeta;
  /** The hull form's zone, or undefined when the hull form defines no such section. */
  readonly zone: ZoneRange | undefined;
  readonly lengthM: number;
  readonly fromBowM: number;
  readonly fittings: readonly SectionFitting[];
  /** Machinery rooms in this section and their share of the plant, bp. */
  readonly machineryRooms: readonly { stationPermille: number; shareBp: number }[];
  /** Station of the fuel stowage, when the bunkers are in this section. */
  readonly fuelStationPermille: number | undefined;
  /** Compiled arrangement for the zone, or undefined when the compiler produced none. */
  readonly load:
    | {
        readonly weightKg: number;
        readonly volumeUsedLitre: number;
        readonly volumeCapacityLitre: number;
        readonly deckUsedMm2: number;
        readonly deckCapacityMm2: number;
      }
    | undefined;
}

/** Everything the card shows for one section, read from the draft, its compile and the catalogue. No invented data. */
export function sectionFacts(
  id: SectionId,
  {
    draft,
    view,
    content,
    zones,
  }: {
    readonly draft: DesignDraft;
    readonly view: WorkshopView;
    readonly content: DrawingBoardContent;
    readonly zones: readonly ZoneRange[];
  },
): SectionFacts {
  const meta = SECTIONS[id];
  const zone = zones.find((z) => z.id === meta.zoneId);
  const lengthWlM = Number(draft.hull.lengthWl) / 1000;
  const defs = new Map(content.components.map((c) => [c.id, c]));
  const weights = new Map(view.compiled.components.map((c) => [c.instanceId, c.weightKg]));
  const arcs = new Map(
    (view.compiled.weapons?.mounts ?? []).map((m) => [m.instanceId, m.effectiveBeamArcDeg]),
  );
  const protection = view.compiled.armour?.magazineProtectionBp ?? {};
  const fittings: SectionFitting[] = [];
  draft.placements.forEach((p, placementIndex) => {
    if (p.zoneId !== meta.zoneId) return;
    const def = defs.get(p.componentId);
    const kind = def ? fittingKind(def.category, def.tags) : "other";
    fittings.push({
      n: fittings.length + 1,
      instanceId: p.instanceId,
      name: def?.displayName ?? p.componentId,
      kind,
      stationPermille: p.stationPermille,
      side: p.side ?? "CENTRE",
      placementIndex,
      weightKg: weights.get(p.instanceId),
      arcDeg: arcs.get(p.instanceId),
      protectionBp: kind === "magazine" ? protection[p.instanceId] : undefined,
    });
  });
  const m = draft.machinery;
  const rooms = m.rooms ?? [
    { zoneId: m.zoneId, stationPermille: m.stationPermille, shareBp: 10_000 },
  ];
  const summary = view.compiled.arrangement?.zones.find((z) => z.zoneId === meta.zoneId);
  const span = zone ? zone.endPermille - zone.startPermille : 0;
  return {
    id,
    meta,
    zone,
    lengthM: (span / 1000) * lengthWlM,
    fromBowM: ((zone?.startPermille ?? 0) / 1000) * lengthWlM,
    fittings,
    machineryRooms: rooms
      .filter((r) => r.zoneId === meta.zoneId)
      .map((r) => ({ stationPermille: r.stationPermille, shareBp: r.shareBp })),
    fuelStationPermille: m.fuelZoneId === meta.zoneId ? m.fuelStationPermille : undefined,
    load: summary && {
      weightKg: summary.weightKg,
      volumeUsedLitre: summary.volumeUsedLitre,
      volumeCapacityLitre: summary.volumeCapacityLitre,
      deckUsedMm2: summary.deckUsedMm2,
      deckCapacityMm2: summary.deckCapacityMm2,
    },
  };
}
