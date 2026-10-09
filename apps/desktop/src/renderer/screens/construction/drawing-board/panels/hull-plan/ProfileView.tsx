import type { DesignDraft } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import {
  FUNNEL_RISE,
  PLAN_PAD,
  PROFILE_H,
  PROFILE_W,
  profileFrame,
  SUPERSTRUCTURE_RISE,
} from "./geometry.js";
import { funnelStations } from "./layers.js";

const FONT = 8;

/** Side profile (bow left) under the plan. SCHEMATIC: see `profileFrame`; masts, guns and armour are not drawn. */
export function ProfileView({
  draft,
  content,
  sheerBp,
  bow,
  superstructure,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly sheerBp: number;
  readonly bow: "ram" | "spoon" | "plumb";
  readonly superstructure?: { startPermille: number; endPermille: number };
}) {
  const f = profileFrame(draft.hull, sheerBp, bow);
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= 40; i++) {
    top.push(`${f.x(i * 25).toFixed(2)},${f.deckY(i / 40).toFixed(2)}`);
    bottom.push(`${f.x(i * 25).toFixed(2)},${f.keelY(i / 40).toFixed(2)}`);
  }
  const poly = [...top, ...bottom.reverse()].join(" ");
  const bowX = f.x(0);
  const deckBow = f.deckY(0);
  const hullTop = f.deckY(0.5);
  const bump = f.depthM * f.vScale * SUPERSTRUCTURE_RISE;
  const funnelH = f.depthM * f.vScale * FUNNEL_RISE;
  const funnels = funnelStations(draft, content);
  return (
    <svg
      viewBox={`0 0 ${PROFILE_W} ${PROFILE_H}`}
      className="w-full rounded bg-muted/40"
      role="img"
      aria-label={`Side profile, depth ${f.depthM.toFixed(1)} m, draught ${f.draughtM.toFixed(1)} m`}
      data-testid="hull-profile"
    >
      {f.bow === "ram" && (
        <polygon
          points={`${bowX},${f.waterlineY - 1.5} ${bowX - 10},${f.waterlineY + 1} ${bowX},${f.waterlineY + 3}`}
          className="fill-foreground stroke-foreground"
        />
      )}
      <polygon
        points={`${poly} ${f.bow === "spoon" ? `${bowX - 5},${deckBow}` : ""}`}
        className="fill-background stroke-foreground"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {superstructure && (
        <rect
          x={f.x(superstructure.startPermille)}
          width={f.x(superstructure.endPermille) - f.x(superstructure.startPermille)}
          y={hullTop - bump}
          height={bump}
          className="fill-muted stroke-muted-foreground"
          data-testid="profile-superstructure"
        />
      )}
      {funnels.map((s, i) => (
        <rect
          key={`${s}-${i}`}
          x={f.x(s) - 4}
          width={8}
          y={hullTop - funnelH}
          height={funnelH}
          className="fill-background stroke-foreground"
          data-testid="profile-funnel"
        />
      ))}
      <line
        x1={PLAN_PAD - 8}
        x2={PROFILE_W - PLAN_PAD + 8}
        y1={f.waterlineY}
        y2={f.waterlineY}
        className="stroke-primary"
        strokeDasharray="6 3"
        data-testid="profile-waterline"
      />
      <text x={PLAN_PAD} y={12} className="fill-muted-foreground" fontSize={FONT}>
        side profile · depth {f.depthM.toFixed(1)} m · draught {f.draughtM.toFixed(1)} m
      </text>
    </svg>
  );
}
