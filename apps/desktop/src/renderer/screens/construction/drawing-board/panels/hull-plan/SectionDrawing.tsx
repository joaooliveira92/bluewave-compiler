import { useId } from "react";
import type { DesignDraft } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { arcSectors, sectorPath } from "./arcs.js";
import { DASH, NON_SCALING, OPACITY, STROKE } from "./drafting.js";
import { FittingSymbol } from "./FittingSymbol.js";
import { fittingPoint, type PlanFrame } from "./geometry.js";
import { HullShapeLayer, HullTopsideLayer } from "./plan-layers.js";
import type { ProfileFrame } from "./profile-geometry.js";
import { ProfileFittingsLayer, ProfileHullLayer } from "./profile-layers.js";
import {
  PAD_X,
  PLAN_BAND,
  PLAN_TOP,
  PROFILE_BAND,
  PROFILE_TOP,
  SCALE_Y,
  SECTION_H,
  SECTION_W,
  sectionLayout,
} from "./section-drawing.js";
import type { SectionFacts, ZoneRange } from "./sections.js";

export { SECTION_H, SECTION_W };

/** Card label size, SVG user units. */
const FONT = 12;
/** Drawn radius of a gun's arc wedge, px: schematic, range is not data. */
const ARC_R = 26;

/**
 * The magnified section: a plan band and a profile band on one horizontal scale, cropped to the section with
 * its neighbours dimmed. The hull, deck houses and funnels are the main drawing's own layers under a transform,
 * so the card can never disagree with the plan; fittings, arcs, machinery rooms and bunkers are drawn over them
 * from the section's facts. Vertical scale may be compressed to fit the card (never exaggerated).
 */
export function SectionDrawing({
  facts,
  frame,
  profile,
  draft,
  content,
  zones,
}: {
  readonly facts: SectionFacts;
  readonly frame: PlanFrame;
  readonly profile: ProfileFrame;
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly zones: readonly ZoneRange[];
}) {
  const clip = `section-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const layout = sectionLayout(facts, frame, profile, draft, content, zones);
  if (!layout) return null;
  const {
    zone,
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
  } = layout;
  return (
    <svg
      viewBox={`0 0 ${SECTION_W} ${SECTION_H}`}
      className="w-full rounded bg-muted/40"
      role="img"
      aria-label={label}
      data-testid="section-drawing"
      data-section={facts.id}
    >
      <defs>
        <clipPath id={`${clip}-plan`}>
          <rect x={PAD_X} y={PLAN_TOP} width={SECTION_W - 2 * PAD_X} height={PLAN_BAND} />
        </clipPath>
        <clipPath id={`${clip}-profile`}>
          <rect x={PAD_X} y={PROFILE_TOP} width={SECTION_W - 2 * PAD_X} height={PROFILE_BAND} />
        </clipPath>
        <pattern
          id={`${clip}-hatch`}
          width={4}
          height={4}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={4} className="stroke-foreground" strokeWidth={1} />
        </pattern>
      </defs>

      <g clipPath={`url(#${clip}-plan)`}>
        <g transform={`matrix(${a} 0 0 ${ky} ${b} ${planTy})`}>
          <HullShapeLayer frame={frame} />
          <HullTopsideLayer frame={frame} draft={draft} content={content} zones={zones} />
        </g>
        <line
          x1={PAD_X}
          x2={SECTION_W - PAD_X}
          y1={planCy}
          y2={planCy}
          className="stroke-muted-foreground"
          strokeWidth={STROKE.guide}
          strokeOpacity={OPACITY.guide}
          strokeDasharray={DASH.centreline}
          {...NON_SCALING}
        />
      </g>

      <g clipPath={`url(#${clip}-profile)`}>
        <g transform={`matrix(${a} 0 0 ${kp} ${b} ${profileTy})`}>
          <ProfileHullLayer frame={profile} />
          <ProfileFittingsLayer houses={houses} funnels={funnels} />
        </g>
        <line
          x1={PAD_X}
          x2={SECTION_W - PAD_X}
          y1={pY(profile.waterlineY)}
          y2={pY(profile.waterlineY)}
          className="stroke-primary"
          strokeWidth={STROKE.datum}
          strokeOpacity={OPACITY.datum}
          strokeDasharray={DASH.waterline}
          {...NON_SCALING}
          data-testid="section-waterline"
        />
        {facts.machineryRooms.map((r) => (
          <g key={`room-${r.stationPermille}`} data-testid="section-machinery-room">
            <rect
              x={X(r.stationPermille) - 11}
              y={pY(profile.waterlineY) + 2}
              width={22}
              height={Math.max(8, pY(profile.keelBaseY) - pY(profile.waterlineY) - 5)}
              className="fill-muted stroke-foreground"
              strokeWidth={STROKE.structure}
              strokeDasharray="2 2"
              {...NON_SCALING}
            />
            <text
              x={X(r.stationPermille)}
              y={pY(profile.waterlineY) + 14}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={FONT - 2}
            >
              M
            </text>
          </g>
        ))}
        {facts.fuelStationPermille !== undefined && (
          <g data-testid="section-fuel">
            <circle
              cx={X(facts.fuelStationPermille)}
              cy={pY(profile.keelBaseY) - 9}
              r={6}
              className="fill-background stroke-foreground"
              strokeWidth={STROKE.structure}
              {...NON_SCALING}
            />
            <text
              x={X(facts.fuelStationPermille)}
              y={pY(profile.keelBaseY) - 5.5}
              textAnchor="middle"
              className="fill-foreground"
              fontSize={FONT - 3}
            >
              F
            </text>
          </g>
        )}
        {facts.fittings.map((f) => {
          const x = X(f.stationPermille);
          const deck = pY(profile.deckY(f.stationPermille / 1000));
          return (
            <line
              key={f.instanceId}
              x1={x}
              x2={x}
              y1={deck}
              y2={deck - 7}
              className="stroke-primary"
              strokeWidth={2}
              {...NON_SCALING}
            />
          );
        })}
      </g>

      {/* Neighbouring sections, dimmed: context, not part of this section. */}
      <rect
        x={PAD_X}
        y={PLAN_TOP}
        width={Math.max(0, x0 - PAD_X)}
        height={PROFILE_TOP + PROFILE_BAND - PLAN_TOP}
        className="fill-background"
        fillOpacity={0.6}
      />
      <rect
        x={x1}
        y={PLAN_TOP}
        width={Math.max(0, SECTION_W - PAD_X - x1)}
        height={PROFILE_TOP + PROFILE_BAND - PLAN_TOP}
        className="fill-background"
        fillOpacity={0.6}
      />
      {[x0, x1].map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={PLAN_TOP}
          y2={PROFILE_TOP + PROFILE_BAND}
          className="stroke-foreground"
          strokeWidth={STROKE.structure}
          {...NON_SCALING}
          data-testid="section-bulkhead"
        />
      ))}

      <g clipPath={`url(#${clip}-plan)`}>
        {facts.fittings.map((f) => {
          const pt = fittingPoint(frame, f.stationPermille, f.side, f.placementIndex);
          const x = a * pt.x + b;
          const y = ky * pt.y + planTy;
          return (
            <g key={f.instanceId} data-fitting={f.instanceId} data-kind={f.kind}>
              {f.kind === "gun" &&
                arcSectors(f.instanceId, f.side, f.arcDeg).map((sec) => (
                  <path
                    key={sec.beam}
                    d={sectorPath(x, y, ARC_R, sec)}
                    className="fill-primary stroke-primary"
                    fillOpacity={0.12}
                    strokeOpacity={0.4}
                  />
                ))}
              <FittingSymbol kind={f.kind} x={x} y={y} hatch={`url(#${clip}-hatch)`} />
              <text x={x + 9} y={y - 7} className="fill-foreground font-medium" fontSize={FONT - 1}>
                {f.n}
              </text>
            </g>
          );
        })}
      </g>

      {(
        [
          ["Plan", PLAN_TOP],
          ["Profile", PROFILE_TOP],
        ] as const
      ).map(([caption, y]) => (
        <text
          key={caption}
          x={PAD_X + 3}
          y={y + FONT}
          className="fill-muted-foreground"
          fontSize={FONT - 1}
        >
          {caption}
        </text>
      ))}

      {ticks.map((p) => (
        <line
          key={p}
          x1={X(p)}
          x2={X(p)}
          y1={SCALE_Y - 12}
          y2={SCALE_Y - (p % (step * 2) === 0 ? 6 : 9)}
          className="stroke-muted-foreground"
          strokeWidth={STROKE.guide}
          {...NON_SCALING}
        />
      ))}
      <line
        x1={PAD_X}
        x2={SECTION_W - PAD_X}
        y1={SCALE_Y - 12}
        y2={SCALE_Y - 12}
        className="stroke-muted-foreground"
        strokeWidth={STROKE.guide}
        {...NON_SCALING}
      />
      <text
        x={x0}
        y={SCALE_Y + 4}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={FONT}
      >
        {`${zone.startPermille}‰`}
      </text>
      <text
        x={x1}
        y={SCALE_Y + 4}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={FONT}
      >
        {`${zone.endPermille}‰`}
      </text>
    </svg>
  );
}
