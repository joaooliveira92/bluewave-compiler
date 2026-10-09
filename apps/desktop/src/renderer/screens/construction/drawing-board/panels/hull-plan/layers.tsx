import type { DesignDraft, ZoneId } from "@bluewave/ship-design";
import { ZONE_IDS } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { arcSectors, sectorPath } from "./arcs.js";
import {
  DASH,
  LABEL_FONT,
  NON_SCALING,
  OPACITY,
  STATION_STEP_PERMILLE,
  STROKE,
} from "./drafting.js";
import { fittingPoint, PLAN_MID, PLAN_PAD, PLAN_W, type PlanFrame } from "./geometry.js";
import type { FunnelInput } from "./profile-geometry.js";

const PLAN_FONT = LABEL_FONT;

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

/** Hull waterline, ram and deck edge: the hull's shape alone, also drawn magnified in the section cards. */
export function HullShapeLayer({ frame }: { readonly frame: PlanFrame }) {
  return (
    <>
      <polygon
        points={outlinePoints(frame, 1)}
        className="fill-background stroke-foreground"
        strokeWidth={STROKE.hull}
        strokeLinejoin="round"
        {...NON_SCALING}
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
        strokeWidth={STROKE.guide}
        strokeOpacity={OPACITY.deckEdge}
        {...NON_SCALING}
        data-testid="hull-deck-edge"
      />
    </>
  );
}

export function HullOutlineLayer({ frame }: { readonly frame: PlanFrame }) {
  const lcbX = frame.x(frame.lcbPermille);
  return (
    <>
      <HullShapeLayer frame={frame} />
      <line
        x1={frame.x(0)}
        x2={frame.x(1000)}
        y1={PLAN_MID}
        y2={PLAN_MID}
        className="stroke-muted-foreground"
        strokeWidth={STROKE.guide}
        strokeOpacity={OPACITY.guide}
        strokeDasharray={DASH.centreline}
        {...NON_SCALING}
      />
      {Array.from(
        { length: 1000 / STATION_STEP_PERMILLE - 1 },
        (_, i) => (i + 1) * STATION_STEP_PERMILLE,
      ).map((p) => (
        <line
          key={p}
          x1={frame.x(p)}
          x2={frame.x(p)}
          y1={PLAN_MID - 3}
          y2={PLAN_MID + 3}
          className="stroke-muted-foreground"
          strokeWidth={STROKE.guide}
          strokeOpacity={OPACITY.guide}
          {...NON_SCALING}
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

/** Section boundaries. The section names are the interactive strip under the drawing (`SectionLabels`). */
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
              strokeDasharray={DASH.zoneGuide}
              strokeWidth={STROKE.guide}
              {...NON_SCALING}
            />
          </g>
        ))}
    </>
  );
}

/**
 * How a section is lit, weakest first. Each differs in line pattern as well as fill, so the states read without
 * colour: preview (hover card open) dashed; linked from a form, dotted with no fill; selected, solid and filled.
 */
export type SectionHighlight = "preview" | "linked" | "selected";

const HIGHLIGHT: Record<
  SectionHighlight,
  { fill: number; width: number; dash: string | undefined; testId: string }
> = {
  preview: {
    fill: 0.1,
    width: STROKE.structure,
    dash: DASH.zoneGuide,
    testId: "section-highlight",
  },
  linked: { fill: 0, width: STROKE.structure, dash: "1 3", testId: "section-linked" },
  selected: { fill: 0.16, width: 2.2, dash: undefined, testId: "section-selected" },
};

/**
 * Marks a section. Drawn above the hull fill and under everything else, so fittings, arcs, boundaries and the
 * superstructure stay visible through it.
 */
export function SectionHighlightLayer({
  frame,
  zone,
  variant = "preview",
}: {
  readonly frame: PlanFrame;
  readonly zone:
    | { readonly id: string; readonly startPermille: number; readonly endPermille: number }
    | undefined;
  readonly variant?: SectionHighlight;
}) {
  if (!zone) return null;
  const style = HIGHLIGHT[variant];
  return (
    <rect
      x={frame.x(zone.startPermille)}
      width={frame.x(zone.endPermille) - frame.x(zone.startPermille)}
      y={PLAN_MID - frame.maxHalf - 4}
      height={frame.maxHalf * 2 + 8}
      className="pointer-events-none fill-primary stroke-primary"
      fillOpacity={style.fill}
      strokeOpacity={0.75}
      strokeWidth={style.width}
      strokeDasharray={style.dash}
      {...NON_SCALING}
      data-testid={style.testId}
      data-zone={zone.id}
      aria-hidden="true"
    />
  );
}

/** A machinery room's station (rooms have no drawn extent in the model): a bar across the hull marked "M". */
export function MachineryRoomMarker({
  frame,
  stationPermille,
  variant,
}: {
  readonly frame: PlanFrame;
  readonly stationPermille: number;
  readonly variant: "linked" | "selected";
}) {
  const x = frame.x(stationPermille);
  const top = PLAN_MID - frame.maxHalf - 2;
  return (
    <g
      className="pointer-events-none"
      aria-hidden="true"
      data-testid={`room-${variant}`}
      data-station={stationPermille}
    >
      <line
        x1={x}
        x2={x}
        y1={top}
        y2={PLAN_MID + frame.maxHalf + 2}
        className="stroke-primary"
        strokeWidth={variant === "selected" ? 2.2 : STROKE.structure}
        strokeDasharray={variant === "linked" ? "1 3" : undefined}
        {...NON_SCALING}
      />
      <text x={x + 3} y={top + 2} className="fill-primary font-medium" fontSize={LABEL_FONT}>
        M
      </text>
    </g>
  );
}

/** The fittings' markers. Names, hover and selection are on the `FittingTargets` overlay above the drawing. */
export function HullFittingLayer({
  frame,
  draft,
  selectedId,
}: {
  readonly frame: PlanFrame;
  readonly draft: DesignDraft;
  /** Fitting to ring (the one being moved from the plan tools). */
  readonly selectedId?: string;
}) {
  return (
    <>
      {draft.placements.map((p, i) => {
        const { x, y } = fittingPoint(frame, p.stationPermille, p.side, i);
        return (
          <g key={p.instanceId}>
            {p.instanceId === selectedId && (
              <circle
                cx={x}
                cy={y}
                r={8}
                className="fill-none stroke-primary"
                strokeWidth={STROKE.structure}
                {...NON_SCALING}
                data-testid="plan-selected-ring"
              />
            )}
            <circle cx={x} cy={y} r={4} className="fill-primary" data-fitting={p.instanceId} />
          </g>
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

/** The placed funnels (components tagged "funnel"), keyed by instance id so both views show the same ones. */
export function funnelPlacements(draft: DesignDraft, content: DrawingBoardContent): FunnelInput[] {
  const funnelIds = new Set(
    content.components.filter((c) => c.tags.includes("funnel")).map((c) => c.id),
  );
  return draft.placements
    .filter((p) => funnelIds.has(p.componentId))
    .map((p) => ({ instanceId: p.instanceId, stationPermille: p.stationPermille }));
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
  const funnels = funnelPlacements(draft, content);
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
      {funnels.map((f) => (
        <ellipse
          key={f.instanceId}
          cx={frame.x(f.stationPermille)}
          cy={PLAN_MID}
          rx={Math.max(3, ry * 0.7)}
          ry={ry}
          className="fill-background stroke-foreground"
          data-testid="hull-funnel"
        >
          <title>{`Funnel @ ${f.stationPermille}‰ (schematic footprint)`}</title>
        </ellipse>
      ))}
    </g>
  );
}
