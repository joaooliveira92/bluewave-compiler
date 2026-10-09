import type { DesignDraft, ZoneId } from "@bluewave/ship-design";
import { ZONE_IDS } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { arcSectors, sectorPath } from "./arcs.js";
import { fittingPoint, PLAN_H, PLAN_MID, PLAN_PAD, PLAN_W, type PlanFrame } from "./geometry.js";

/** Label size in SVG user units (not CSS px): the 640-unit plan is scaled up to the panel width, so this renders at 12 px or more. */
const PLAN_FONT = 8;

/** Length of the drawn ram beak, px (into the left padding). */
const RAM_LEN = 10;

/** Closed outline polygon points for the hull scaled by `scale` about the centreline. */
function outlinePoints(frame: PlanFrame, scale: number): string {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++)
    pts.push(`${frame.x(i * 25).toFixed(2)},${(PLAN_MID - frame.half(i / 40) * scale).toFixed(2)}`);
  for (let i = 40; i >= 0; i--)
    pts.push(`${frame.x(i * 25).toFixed(2)},${(PLAN_MID + frame.half(i / 40) * scale).toFixed(2)}`);
  return pts.join(" ");
}

export function HullOutlineLayer({ frame }: { readonly frame: PlanFrame }) {
  const lcbX = frame.x(frame.lcbPermille);
  return (
    <>
      <polygon
        points={outlinePoints(frame, 1)}
        className="fill-background stroke-foreground"
        strokeWidth={1.4}
        strokeLinejoin="round"
        data-testid="hull-outline"
      />
      {frame.bow === "ram" && (
        <polygon
          points={`${frame.x(0)},${PLAN_MID - 1.5} ${frame.x(0) - RAM_LEN},${PLAN_MID} ${frame.x(0)},${PLAN_MID + 1.5}`}
          className="fill-foreground stroke-foreground"
          data-testid="hull-ram"
        />
      )}
      <polygon
        points={outlinePoints(frame, 0.9)}
        className="fill-none stroke-muted-foreground"
        strokeOpacity={0.5}
        data-testid="hull-deck-edge"
      />
      <line
        x1={frame.x(0)}
        x2={frame.x(1000)}
        y1={PLAN_MID}
        y2={PLAN_MID}
        className="stroke-muted-foreground"
        strokeOpacity={0.5}
        strokeDasharray="8 2 1 2"
      />
      {Array.from({ length: 9 }, (_, i) => (i + 1) * 100).map((p) => (
        <line
          key={p}
          x1={frame.x(p)}
          x2={frame.x(p)}
          y1={PLAN_MID - 3}
          y2={PLAN_MID + 3}
          className="stroke-muted-foreground"
          strokeOpacity={0.6}
        />
      ))}
      <g data-testid="hull-lcb">
        <circle cx={lcbX} cy={PLAN_MID} r={3.5} className="fill-none stroke-foreground" />
        <line
          x1={lcbX - 3.5}
          x2={lcbX + 3.5}
          y1={PLAN_MID}
          y2={PLAN_MID}
          className="stroke-foreground"
        />
        <line
          x1={lcbX}
          x2={lcbX}
          y1={PLAN_MID - 3.5}
          y2={PLAN_MID + 3.5}
          className="stroke-foreground"
        />
        <title>{`Centre of buoyancy, ${frame.lcbPermille}‰ from the bow`}</title>
      </g>
      <text x={PLAN_PAD} y={12} className="fill-muted-foreground" fontSize={PLAN_FONT}>
        bow
      </text>
      <text
        x={PLAN_W - PLAN_PAD}
        y={12}
        textAnchor="end"
        className="fill-muted-foreground"
        fontSize={PLAN_FONT}
      >
        stern
      </text>
      <text
        x={PLAN_W / 2}
        y={12}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={PLAN_FONT}
      >
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
              className="fill-muted-foreground"
              fontSize={PLAN_FONT}
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

/** Stations (permille) of the placed funnels, by the component\'s "funnel" tag. */
export function funnelStations(draft: DesignDraft, content: DrawingBoardContent): number[] {
  const funnelIds = new Set(
    content.components.filter((c) => c.tags.includes("funnel")).map((c) => c.id),
  );
  return draft.placements.filter((p) => funnelIds.has(p.componentId)).map((p) => p.stationPermille);
}

/** Superstructure block (over its zone) and funnel ovals, in plan. Footprints are schematic: no data gives their width. */
export function HullTopsideLayer({
  frame,
  draft,
  content,
  zones,
}: {
  readonly frame: PlanFrame;
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly zones: readonly { id: string; startPermille: number; endPermille: number }[];
}) {
  const sup = zones.find((z) => z.id === "SUPERSTRUCTURE");
  const funnels = funnelStations(draft, content);
  const ry = Math.max(2, Math.min(frame.maxHalf * 0.4, 10));
  return (
    <g data-testid="hull-topside">
      {sup && (
        <rect
          x={frame.x(sup.startPermille)}
          width={frame.x(sup.endPermille) - frame.x(sup.startPermille)}
          y={
            PLAN_MID -
            Math.min(frame.half(sup.startPermille / 1000), frame.half(sup.endPermille / 1000)) *
              0.55
          }
          height={
            Math.min(frame.half(sup.startPermille / 1000), frame.half(sup.endPermille / 1000)) * 1.1
          }
          rx={3}
          className="fill-muted stroke-muted-foreground"
          data-testid="hull-superstructure"
        >
          <title>Superstructure (schematic footprint)</title>
        </rect>
      )}
      {funnels.map((s, i) => (
        <ellipse
          key={`${s}-${i}`}
          cx={frame.x(s)}
          cy={PLAN_MID}
          rx={Math.max(3, ry * 0.7)}
          ry={ry}
          className="fill-background stroke-foreground"
          data-testid="hull-funnel"
        >
          <title>{`Funnel @ ${s}‰ (schematic footprint)`}</title>
        </ellipse>
      ))}
    </g>
  );
}
