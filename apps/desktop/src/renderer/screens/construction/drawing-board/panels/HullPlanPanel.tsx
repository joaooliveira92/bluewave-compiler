import { ZONE_IDS, type DesignDraft } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../content.js";
import { Panel } from "./Panel.js";

const W = 640;
const H = 170;
const PAD = 20;
const MID = H / 2;

/** Half-beam (px) at a station fraction 0..1 (0 = bow): pointed bow, full midbody, blunt stern. */
function halfBeam(t: number, maxHalf: number): number {
  if (t < 0.25) return maxHalf * Math.sin((t / 0.25) * (Math.PI / 2)) ** 0.8;
  if (t > 0.85) return maxHalf * (0.6 + 0.4 * Math.cos(((t - 0.85) / 0.15) * (Math.PI / 2)));
  return maxHalf;
}

/** Top-down plan of the hull: outline from length/beam, zone dividers, and every placed fitting. */
export function HullPlanPanel({
  draft,
  content,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
}) {
  const hull = draft.hull;
  const length = Number(hull.lengthWl) / 1000;
  const beam = Number(hull.beam) / 1000;
  const span = W - 2 * PAD;
  const maxHalf = Math.min(MID - 14, (span * (beam / length)) / 2);
  const x = (permille: number) => PAD + (span * permille) / 1000;
  const points: string[] = [];
  for (let i = 0; i <= 40; i++) points.push(`${x(i * 25)},${MID - halfBeam(i / 40, maxHalf)}`);
  for (let i = 40; i >= 0; i--) points.push(`${x(i * 25)},${MID + halfBeam(i / 40, maxHalf)}`);
  const zones = content.hullForms.find((f) => f.id === hull.hullFormId)?.zones ?? [];
  const defs = new Map(content.components.map((c) => [c.id, c]));
  return (
    <Panel title="Hull plan">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded bg-muted/40"
        role="img"
        aria-label={`Top-down plan, ${length.toFixed(0)} m by ${beam.toFixed(1)} m, ${draft.placements.length} fittings placed`}
      >
        <polygon points={points.join(" ")} className="fill-background stroke-foreground" />
        {zones
          .filter((z) => (ZONE_IDS as readonly string[]).includes(z.id) && z.id !== "MISSION")
          .map((z) => (
            <g key={z.id}>
              <line
                x1={x(z.startPermille)}
                x2={x(z.startPermille)}
                y1={MID - maxHalf}
                y2={MID + maxHalf}
                className="stroke-muted-foreground"
                strokeDasharray="3 3"
              />
              <text
                x={(x(z.startPermille) + x(z.endPermille)) / 2}
                y={H - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px]"
              >
                {z.id.replaceAll("_", " ").toLowerCase()}
              </text>
            </g>
          ))}
        {draft.placements.map((p, i) => {
          const side = p.side === "PORT" ? -1 : p.side === "STBD" ? 1 : 0;
          const cx = x(p.stationPermille);
          const cy = MID + side * maxHalf * 0.5 + (side === 0 ? ((i % 3) - 1) * 6 : 0);
          return (
            <circle key={p.instanceId} cx={cx} cy={cy} r={4} className="fill-primary">
              <title>{`${defs.get(p.componentId)?.displayName ?? p.componentId} (${p.instanceId}) @ ${p.stationPermille}‰`}</title>
            </circle>
          );
        })}
        <text x={PAD} y={12} className="fill-muted-foreground text-[8px]">
          bow
        </text>
        <text x={W - PAD} y={12} textAnchor="end" className="fill-muted-foreground text-[8px]">
          stern
        </text>
      </svg>
      <p className="text-xs text-muted-foreground">
        {length.toFixed(0)} m × {beam.toFixed(1)} m · {draft.placements.length} fitting(s). Arc
        overlays and topside load follow.
      </p>
    </Panel>
  );
}
