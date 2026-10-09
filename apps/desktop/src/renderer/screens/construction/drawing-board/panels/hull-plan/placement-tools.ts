import type {
  ComponentDef,
  DesignDraft,
  DraftEdit,
  MountSide,
  PlacementSpec,
  ZoneId,
} from "@bluewave/ship-design";
import { PLAN_H, PLAN_MID, PLAN_PAD, PLAN_W, type PlanFrame } from "./geometry.js";

/**
 * Pure logic behind placing, moving and nudging fittings from the hull plan. Pointer clicks and the keyboard-reachable
 * toolbar both produce the same `DraftEdit`s as the Arrangement panel, through these functions. Coordinates are plan SVG
 * user units (see `geometry.ts`): bow at the left, starboard above the centreline.
 */

/** Stations snap to this grid (permille of waterline length) so clicks land on tidy values. */
export const STATION_SNAP_PERMILLE = 10;
/** A click within this fraction of the half-beam of the centreline places a centreline mount. */
export const CENTRE_BAND = 0.25;
/** Keyboard nudge, permille: a step and a larger step. */
export const NUDGE_PERMILLE = { step: 10, large: 50 } as const;

export interface ZoneSpan {
  readonly id: string;
  readonly startPermille: number;
  readonly endPermille: number;
}

/** Categories whose mounts have a side (they fire to a beam). */
const SIDED_CATEGORIES: readonly string[] = [
  "MAIN_GUN",
  "SECONDARY_GUN",
  "DUAL_PURPOSE_GUN",
  "TORPEDO_TUBE",
];
export const hasSide = (def: ComponentDef | undefined): boolean =>
  def !== undefined && SIDED_CATEGORIES.includes(def.category);

/** Inverse of `stationX`: the station (permille, snapped, 0..1000) under a plan x coordinate. */
export function stationAtX(svgX: number): number {
  const span = PLAN_W - 2 * PLAN_PAD;
  const raw = ((svgX - PLAN_PAD) / span) * 1000;
  const snapped = Math.round(raw / STATION_SNAP_PERMILLE) * STATION_SNAP_PERMILLE;
  return Math.min(1000, Math.max(0, snapped));
}

/** The zone a station lies in; the overlapping MISSION zone is never a placement target. Null if none. */
export function zoneAtStation(zones: readonly ZoneSpan[], station: number): ZoneId | null {
  const hit = zones.find(
    (z) =>
      z.id !== "MISSION" &&
      station >= z.startPermille &&
      (station < z.endPermille || (station === 1000 && z.endPermille === 1000)),
  );
  return hit ? (hit.id as ZoneId) : null;
}

/** Side of a click: near the centreline is CENTRE, above it starboard, below it port. */
export function sideAtY(frame: Pick<PlanFrame, "maxHalf">, svgY: number): MountSide {
  const offset = svgY - PLAN_MID;
  if (Math.abs(offset) <= frame.maxHalf * CENTRE_BAND) return "CENTRE";
  return offset < 0 ? "STBD" : "PORT";
}

export interface PlanTarget {
  readonly stationPermille: number;
  readonly zoneId: ZoneId | null;
  readonly side: MountSide;
}

export function planTarget(
  frame: Pick<PlanFrame, "maxHalf">,
  zones: readonly ZoneSpan[],
  svgX: number,
  svgY: number,
): PlanTarget {
  const stationPermille = stationAtX(svgX);
  return {
    stationPermille,
    zoneId: zoneAtStation(zones, stationPermille),
    side: sideAtY(frame, svgY),
  };
}

export type PlanEdit =
  | { readonly ok: true; readonly edit: DraftEdit }
  | { readonly ok: false; readonly reason: string };

const words = (s: string) => s.replaceAll("_", " ").toLowerCase();
const refuse = (reason: string): PlanEdit => ({ ok: false, reason });

function zoneProblem(def: ComponentDef | undefined, zoneId: ZoneId | null): string | null {
  if (zoneId === null) return "There is no zone at that point.";
  const allowed = def?.allowedZones;
  if (allowed !== undefined && !allowed.includes(zoneId))
    return `${def?.displayName ?? "That fitting"} cannot go in the ${words(zoneId)} zone.`;
  return null;
}

/** An unused instance id for a component: `<componentId>_<n>`, the same scheme as the Arrangement panel. */
export function nextInstanceId(
  draft: Pick<DesignDraft, "placements">,
  componentId: string,
): string {
  let n = 1;
  while (draft.placements.some((p) => p.instanceId === `${componentId}_${n}`)) n++;
  return `${componentId}_${n}`;
}

/** Place a new fitting at a plan target: refused when no zone is there or the zone is not allowed for the component. */
export function placeEdit(
  def: ComponentDef,
  target: PlanTarget,
  draft: Pick<DesignDraft, "placements">,
): PlanEdit {
  const problem = zoneProblem(def, target.zoneId);
  if (problem !== null || target.zoneId === null)
    return refuse(problem ?? "There is no zone at that point.");
  return {
    ok: true,
    edit: {
      kind: "add_placement",
      placement: {
        instanceId: nextInstanceId(draft, def.id),
        componentId: def.id,
        zoneId: target.zoneId,
        stationPermille: target.stationPermille,
        ...(hasSide(def) ? { side: target.side } : {}),
      },
    },
  };
}

/** Move a fitting to a plan target, also setting its side when it has one, as one undoable edit. */
export function moveEdit(
  placement: PlacementSpec,
  def: ComponentDef | undefined,
  target: PlanTarget,
): PlanEdit {
  const problem = zoneProblem(def, target.zoneId);
  if (problem !== null || target.zoneId === null)
    return refuse(problem ?? "There is no zone at that point.");
  const move: DraftEdit = {
    kind: "move_placement",
    instanceId: placement.instanceId,
    zoneId: target.zoneId,
    stationPermille: target.stationPermille,
  };
  const sideChanged = hasSide(def) && (placement.side ?? "CENTRE") !== target.side;
  return {
    ok: true,
    edit: sideChanged
      ? {
          kind: "batch",
          edits: [move, { kind: "set_side", instanceId: placement.instanceId, side: target.side }],
        }
      : move,
  };
}

/** Nudge a fitting along the hull by `deltaPermille` (clamped to the hull), following the zone it moves into. */
export function nudgeEdit(
  placement: PlacementSpec,
  def: ComponentDef | undefined,
  zones: readonly ZoneSpan[],
  deltaPermille: number,
): PlanEdit {
  const station = Math.min(1000, Math.max(0, placement.stationPermille + deltaPermille));
  if (station === placement.stationPermille)
    return refuse("The fitting is already at the end of the hull.");
  const zoneId = zoneAtStation(zones, station);
  const problem = zoneProblem(def, zoneId);
  if (problem !== null || zoneId === null)
    return refuse(problem ?? "There is no zone at that point.");
  return {
    ok: true,
    edit: {
      kind: "move_placement",
      instanceId: placement.instanceId,
      zoneId,
      stationPermille: station,
    },
  };
}

/** A pointer position in plan SVG units from the drawing's on-screen rectangle; null when the rectangle has no size. */
export function clientToPlan(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  if (!(rect.width > 0) || !(rect.height > 0)) return null;
  return {
    x: ((clientX - rect.left) * PLAN_W) / rect.width,
    y: ((clientY - rect.top) * PLAN_H) / rect.height,
  };
}
