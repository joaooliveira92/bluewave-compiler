import {
  SEVERITY_ORDER,
  type DesignDraft,
  type Finding,
  type MountSide,
  type WorkshopView,
} from "@bluewave/ship-design";
import type { BatteryCard } from "../batteryView.js";
import type { DrawingBoardContent } from "../content.js";
import {
  fittingKind,
  SECTION_IDS,
  SECTIONS,
  type FittingKind,
  type SectionId,
  type ZoneRange,
} from "../panels/hull-plan/sections.js";
import type { ShipEntity } from "./store.js";

/** What the selection facts read: the live design, its compile, the catalogue and the hull form's zones. */
export interface EntityContext {
  readonly draft: DesignDraft;
  readonly view: WorkshopView;
  readonly content: DrawingBoardContent;
  readonly zones: readonly ZoneRange[];
  readonly batteries: readonly BatteryCard[];
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Findings whose text names `token` as a whole word (an instance id or a zone id), most severe first. Findings
 * carry no structured subject, so this is a text match: callers present it as "findings that name this".
 */
export function findingsNaming(view: WorkshopView, token: string): Finding[] {
  const word = new RegExp(`(^|[^A-Za-z0-9_])${escape(token)}([^A-Za-z0-9_]|$)`);
  return SEVERITY_ORDER.flatMap((s) =>
    view.findingsBySeverity[s].filter((f) => word.test(f.what) || word.test(f.why)),
  );
}

/** Whether a finding should mark the selection as "with warning" (anything above an advisory). */
export const isWarning = (f: Finding) => f.severity !== "ADVISORY";

export function sectionOfZone(zoneId: string): SectionId | undefined {
  return SECTION_IDS.find((id) => SECTIONS[id].zoneId === zoneId);
}

export interface FittingFacts {
  readonly instanceId: string;
  readonly name: string;
  /** Catalogue category in words, e.g. "main gun". */
  readonly category: string;
  readonly kind: FittingKind;
  readonly section: SectionId | undefined;
  readonly stationPermille: number;
  readonly side: MountSide;
  /** Battery heading and conventional mount name (A, B, X...), for guns and tubes. */
  readonly battery:
    | { readonly title: string; readonly key: string; readonly mount: string }
    | undefined;
  readonly weightKg: number | undefined;
  /** The magazine this mount draws from, when the design names one. */
  readonly magazine: { readonly instanceId: string; readonly name: string } | undefined;
  readonly arcDeg: number | undefined;
  /** Protection margin against the design threat, bp; magazines only. */
  readonly protectionBp: number | undefined;
  readonly findings: readonly Finding[];
}

const words = (s: string) => s.replaceAll("_", " ").toLowerCase();

/** Everything the inspector shows for one placed fitting, or null if the design no longer has it. */
export function fittingFacts(instanceId: string, ctx: EntityContext): FittingFacts | null {
  const p = ctx.draft.placements.find((x) => x.instanceId === instanceId);
  if (!p) return null;
  const defs = new Map(ctx.content.components.map((c) => [c.id, c]));
  const def = defs.get(p.componentId);
  const card = ctx.batteries.find((b) => b.mounts.some((m) => m.instanceId === instanceId));
  const mag =
    p.magazineRef === undefined
      ? undefined
      : ctx.draft.placements.find((x) => x.instanceId === p.magazineRef);
  const kind = def ? fittingKind(def.category, def.tags) : "other";
  return {
    instanceId,
    name: def?.displayName ?? p.componentId,
    category: def ? words(def.category) : "unknown component",
    kind,
    section: sectionOfZone(p.zoneId),
    stationPermille: p.stationPermille,
    side: p.side ?? "CENTRE",
    battery: card && {
      title: card.title,
      key: card.row.key,
      mount: card.mounts.find((m) => m.instanceId === instanceId)?.name ?? instanceId,
    },
    weightKg: ctx.view.compiled.components.find((c) => c.instanceId === instanceId)?.weightKg,
    magazine: mag && {
      instanceId: mag.instanceId,
      name: defs.get(mag.componentId)?.displayName ?? mag.componentId,
    },
    arcDeg: ctx.view.compiled.weapons?.mounts.find((m) => m.instanceId === instanceId)
      ?.effectiveBeamArcDeg,
    protectionBp:
      kind === "magazine" ? ctx.view.compiled.armour?.magazineProtectionBp[instanceId] : undefined,
    findings: findingsNaming(ctx.view, instanceId),
  };
}

/** The machinery rooms as the design states them; one implicit room when it lists none. */
export function machineryRooms(
  draft: DesignDraft,
): readonly { zoneId: string; stationPermille: number; shareBp: number }[] {
  const m = draft.machinery;
  return m.rooms ?? [{ zoneId: m.zoneId, stationPermille: m.stationPermille, shareBp: 10_000 }];
}

/** Whether the current design still contains the entity (selections of removed things are dropped). */
export function entityExists(
  entity: ShipEntity,
  draft: DesignDraft,
  zones: readonly ZoneRange[],
): boolean {
  switch (entity.kind) {
    case "section":
      return zones.some((z) => z.id === SECTIONS[entity.id].zoneId);
    case "fitting":
      return draft.placements.some((p) => p.instanceId === entity.instanceId);
    case "machinery-room":
      return entity.index < machineryRooms(draft).length;
  }
}

/** Findings for an entity, for the "selected with warning" state and the inspector. */
export function entityFindings(entity: ShipEntity, ctx: EntityContext): readonly Finding[] {
  switch (entity.kind) {
    case "section":
      return findingsNaming(ctx.view, SECTIONS[entity.id].zoneId);
    case "fitting":
      return findingsNaming(ctx.view, entity.instanceId);
    case "machinery-room":
      return [];
  }
}

/** Whether an entity has findings above advisory: the "selected with warning" state. */
export function entityWarns(entity: ShipEntity, view: WorkshopView): boolean {
  switch (entity.kind) {
    case "section":
      return findingsNaming(view, SECTIONS[entity.id].zoneId).some(isWarning);
    case "fitting":
      return findingsNaming(view, entity.instanceId).some(isWarning);
    case "machinery-room":
      return false;
  }
}
