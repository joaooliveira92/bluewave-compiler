import type { DesignDraft, ZoneId } from "@bluewave/ship-design";
import { ZONE_IDS } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { arcSectors, sectorPath } from "./arcs.js";
import {
  fittingPoint,
  halfBeam,
  PLAN_H,
  PLAN_MID,
  PLAN_PAD,
  PLAN_W,
  type PlanFrame,
} from "./geometry.js";

export function HullOutlineLayer({ frame }: { readonly frame: PlanFrame }) {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++)
    pts.push(`${frame.x(i * 25)},${PLAN_MID - halfBeam(i / 40, frame.maxHalf)}`);
  for (let i = 40; i >= 0; i--)
    pts.push(`${frame.x(i * 25)},${PLAN_MID + halfBeam(i / 40, frame.maxHalf)}`);
  return (
    <>
      <polygon points={pts.join(" ")} className="fill-background stroke-foreground" />
      <text x={PLAN_PAD} y={12} className="fill-muted-foreground text-[8px]">
        bow
      </text>
      <text
        x={PLAN_W - PLAN_PAD}
        y={12}
        textAnchor="end"
        className="fill-muted-foreground text-[8px]"
      >
        stern
      </text>
      <text x={PLAN_W / 2} y={12} textAnchor="middle" className="fill-muted-foreground text-[8px]">
        starboard ↑ · port ↓
      </text>
    </>
  );
}

export function HullZoneLayer({
  frame,
  zones,
}: {
  readonly frame: PlanFrame;
  readonly zones: readonly { id: string; startPermille: number; endPermille: number }[];
}) {
  return (
    <>
      {zones
        .filter(
          (z) => (ZONE_IDS as readonly string[]).includes(z.id) && (z.id as ZoneId) !== "MISSION",
        )
        .map((z) => (
          <g key={z.id}>
            <line
              x1={frame.x(z.startPermille)}
              x2={frame.x(z.startPermille)}
              y1={PLAN_MID - frame.maxHalf}
              y2={PLAN_MID + frame.maxHalf}
              className="stroke-muted-foreground"
              strokeDasharray="3 3"
            />
            <text
              x={(frame.x(z.startPermille) + frame.x(z.endPermille)) / 2}
              y={PLAN_H - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px]"
            >
              {z.id.replaceAll("_", " ").toLowerCase()}
            </text>
          </g>
        ))}
    </>
  );
}

export function HullFittingLayer({
  frame,
  draft,
  content,
}: {
  readonly frame: PlanFrame;
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
}) {
  const defs = new Map(content.components.map((c) => [c.id, c]));
  return (
    <>
      {draft.placements.map((p, i) => {
        const { x, y } = fittingPoint(frame, p.stationPermille, p.side, i);
        return (
          <circle key={p.instanceId} cx={x} cy={y} r={4} className="fill-primary">
            <title>{`${defs.get(p.componentId)?.displayName ?? p.componentId} (${p.instanceId}) @ ${p.stationPermille}‰`}</title>
          </circle>
        );
      })}
    </>
  );
}

/** Schematic radius of an arc wedge, px. Range is not data. */
const ARC_R = 30;

export function GunArcLayer({
  frame,
  draft,
  mounts,
}: {
  readonly frame: PlanFrame;
  readonly draft: DesignDraft;
  readonly mounts: readonly { instanceId: string; effectiveBeamArcDeg: number }[];
}) {
  const arcByInstance = new Map(mounts.map((m) => [m.instanceId, m.effectiveBeamArcDeg]));
  return (
    <g data-testid="gun-arcs">
      {draft.placements.flatMap((p, i) => {
        const { x, y } = fittingPoint(frame, p.stationPermille, p.side, i);
        return arcSectors(p.instanceId, p.side, arcByInstance.get(p.instanceId)).map((s) => (
          <path
            key={`${p.instanceId}-${s.beam}`}
            d={sectorPath(x, y, ARC_R, s)}
            className="fill-primary stroke-primary"
            fillOpacity={0.12}
            strokeOpacity={0.4}
            data-arc={`${p.instanceId}:${s.beam}`}
          >
            <title>{`${p.instanceId}: ${Math.round(s.widthDeg)}° ${s.beam === "STBD" ? "starboard" : "port"} beam arc`}</title>
          </path>
        ));
      })}
    </g>
  );
}
