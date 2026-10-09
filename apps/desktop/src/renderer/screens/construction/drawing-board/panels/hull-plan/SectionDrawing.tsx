import { useId } from "react";
import { arcSectors, sectorPath } from "./arcs.js";
import { DASH, NON_SCALING, OPACITY, STROKE } from "./drafting.js";
import { fittingPoint, PLAN_MID, PLAN_PAD, PLAN_W, type PlanFrame } from "./geometry.js";
import { funnelPlacements, HullShapeLayer, HullTopsideLayer } from "./layers.js";
import type { DrawingBoardContent } from "../../content.js";
import type { DesignDraft } from "@bluewave/ship-design";
import { funnelShapes, houseMasses, type ProfileFrame } from "./profile-geometry.js";
import { ProfileFittingsLayer, ProfileHullLayer } from "./profile-layers.js";
import type { FittingKind, SectionFacts, ZoneRange } from "./sections.js";

/** Card drawing size (SVG user units, drawn about 1:1 in the card). */
export const SECTION_W = 400;
const PAD_X = 14;
const PLAN_TOP = 6;
const PLAN_BAND = 112;
const PROFILE_TOP = PLAN_TOP + PLAN_BAND + 10;
const PROFILE_BAND = 92;
const SCALE_Y = PROFILE_TOP + PROFILE_BAND + 16;
export const SECTION_H = SCALE_Y + 6;
const FONT = 12;
/** Drawn radius of a gun's arc wedge, px: schematic, range is not data. */
const ARC_R = 26;

/** Station window: the section plus some of its neighbours for context (dimmed). */
function windowFor(zone: ZoneRange): { s: number; e: number } {
  const span = zone.endPermille - zone.startPermille;
  const margin = Math.max(20, span * 0.3);
  return {
    s: Math.max(-25, zone.startPermille - margin),
    e: Math.min(1025, zone.endPermille + margin),
  };
}

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
  const label = `Detailed drawing of the ${facts.meta.name.toLowerCase()}, stations ${zone.startPermille} to ${zone.endPermille} permille: plan above, profile below, ${facts.fittings.length} fitting(s) numbered${facts.machineryRooms.length ? `, ${facts.machineryRooms.length} machinery room(s)` : ""}${facts.fuelStationPermille !== undefined ? ", fuel stowage" : ""}.`;
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

/** Coarse symbol per fitting kind, in card units (not scaled with the hull). */
function FittingSymbol({
  kind,
  x,
  y,
  hatch,
}: {
  readonly kind: FittingKind;
  readonly x: number;
  readonly y: number;
  readonly hatch: string;
}) {
  const stroke = { strokeWidth: STROKE.structure, ...NON_SCALING };
  switch (kind) {
    case "gun":
      return (
        <>
          <circle cx={x} cy={y} r={6.5} className="fill-background stroke-foreground" {...stroke} />
          <circle cx={x} cy={y} r={2} className="fill-primary" />
        </>
      );
    case "torpedo":
      return (
        <rect
          x={x - 8}
          y={y - 2.5}
          width={16}
          height={5}
          rx={2.5}
          className="fill-background stroke-foreground"
          {...stroke}
        />
      );
    case "magazine":
      return (
        <rect
          x={x - 7}
          y={y - 5}
          width={14}
          height={10}
          fill={hatch}
          className="stroke-foreground"
          {...stroke}
        />
      );
    case "machinery":
      return (
        <rect
          x={x - 8}
          y={y - 5}
          width={16}
          height={10}
          className="fill-muted stroke-foreground"
          {...stroke}
        />
      );
    case "funnel":
      return <circle cx={x} cy={y} r={2.5} className="fill-foreground" />;
    case "other":
      return (
        <polygon
          points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`}
          className="fill-primary stroke-primary"
          strokeWidth={STROKE.structure}
          {...NON_SCALING}
        />
      );
  }
}
