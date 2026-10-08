import { useState } from "react";
import type { DesignDraft, WorkshopView } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { Panel } from "../Panel.js";
import { planFrame, PLAN_H, PLAN_W } from "./geometry.js";
import { GunArcLayer, HullFittingLayer, HullOutlineLayer, HullZoneLayer } from "./layers.js";

/**
 * Top-down plan of the hull, composed of layers: outline, zones, gun arcs, fittings.
 *
 * SCHEMATIC GEOMETRY: the outline is a generic pointed-bow shape scaled to length and beam, not the
 * hull form's real lines, and centreline fittings are nudged apart vertically so overlapping dots stay
 * visible (the nudge carries no meaning). Arc wedges have a fixed drawn radius (range is not shown). Only
 * the station (x), the port/starboard side and the arc width are data. Do not treat this as an
 * authoritative hull-form visualisation.
 */
export function HullPlanPanel({
  draft,
  content,
  view,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly view: WorkshopView;
}) {
  const [showArcs, setShowArcs] = useState(true);
  const frame = planFrame(draft.hull);
  const zones = content.hullForms.find((f) => f.id === draft.hull.hullFormId)?.zones ?? [];
  const mounts = view.compiled.weapons?.mounts ?? [];
  return (
    <Panel title="Hull plan">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={showArcs} onChange={(e) => setShowArcs(e.target.checked)} />
        Show gun arcs
      </label>
      <svg
        viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
        className="w-full rounded bg-muted/40"
        role="img"
        aria-label={`Top-down plan, ${frame.lengthM.toFixed(0)} m by ${frame.beamM.toFixed(1)} m, ${draft.placements.length} fittings placed`}
      >
        <HullOutlineLayer frame={frame} />
        <HullZoneLayer frame={frame} zones={zones} />
        {showArcs && <GunArcLayer frame={frame} draft={draft} mounts={mounts} />}
        <HullFittingLayer frame={frame} draft={draft} content={content} />
      </svg>
      <p className="text-xs text-muted-foreground">
        {frame.lengthM.toFixed(0)} m × {frame.beamM.toFixed(1)} m · {draft.placements.length}{" "}
        fitting(s). Schematic outline; only station, side and arc width are data. Arcs show the
        effective beam arc after obstruction.
      </p>
    </Panel>
  );
}
