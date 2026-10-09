import { useState } from "react";
import type { DesignDraft, WorkshopView } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { TooltipProvider } from "../../../../../components/ui/tooltip.js";
import { Checkbox } from "../../../../../components/ui/checkbox.js";
import { Panel } from "../Panel.js";
import { bowStyleFor, planFrame, PLAN_H, PLAN_W, sternStyleFor } from "./geometry.js";
import { type DrawingFacts, planLabel } from "./describe.js";
import { HullPlanLegend } from "./HullPlanLegend.js";
import { legendEntries } from "./legend.js";
import { ProfileView } from "./ProfileView.js";
import {
  funnelPlacements,
  GunArcLayer,
  HullFittingLayer,
  HullOutlineLayer,
  HullTopsideLayer,
  HullZoneLayer,
} from "./layers.js";

/**
 * Top-down plan of the hull, composed of layers: outline, zones, topside, gun arcs, fittings; plus a side profile.
 *
 * SCHEMATIC GEOMETRY: the outline is a parametric waterline scaled to length and beam. Its area follows the
 * hull form's waterplane coefficient and its bow/stern fullness follows the form's LCB, but it is not the
 * form's real lines, and centreline fittings are nudged apart vertically so overlapping dots stay
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
  const form = content.hullForms.find((f) => f.id === draft.hull.hullFormId);
  const frame = planFrame(
    draft.hull,
    form && {
      waterplaneCoeffBp: form.waterplaneCoeffBp,
      lcbPermille: form.lcbPermille,
      bow: bowStyleFor(form.id),
      stern: sternStyleFor(form.id),
    },
  );
  const zones = form?.zones ?? [];
  const mounts = view.compiled.weapons?.mounts ?? [];
  const superstructure = zones.find((z) => z.id === "SUPERSTRUCTURE");
  const placedFunnels = funnelPlacements(draft, content);
  const facts: DrawingFacts = {
    hullFormId: form?.id,
    lengthM: frame.lengthM,
    beamM: frame.beamM,
    depthM: Number(draft.hull.depthToMainDeck) / 1000,
    draughtM: Number(draft.hull.draught) / 1000,
    bow: frame.bow,
    stern: frame.stern,
    fittings: draft.placements.length,
    funnels: placedFunnels.length,
    superstructure,
  };
  return (
    <Panel title="Hull plan">
      <TooltipProvider>
        <div className="flex items-center gap-2 text-sm">
          <Checkbox
            id="show-gun-arcs"
            aria-label="Show gun arcs"
            checked={showArcs}
            onCheckedChange={(v) => setShowArcs(v === true)}
          />
          <span aria-hidden="true">Show gun arcs</span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Waterline plan</p>
          <svg
            viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
            className="w-full rounded bg-muted/40"
            role="img"
            aria-label={planLabel(facts)}
          >
            <HullOutlineLayer frame={frame} />
            <HullZoneLayer frame={frame} zones={zones} />
            <HullTopsideLayer frame={frame} draft={draft} content={content} zones={zones} />
            {showArcs && <GunArcLayer frame={frame} draft={draft} mounts={mounts} />}
            <HullFittingLayer frame={frame} draft={draft} content={content} />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Profile · depth {facts.depthM.toFixed(1)} m · draught {facts.draughtM.toFixed(1)} m
          </p>
          <ProfileView
            draft={draft}
            content={content}
            sheerBp={form?.sheerBp ?? 10000}
            bow={frame.bow}
            stern={frame.stern}
            lcbPermille={frame.lcbPermille}
            superstructure={superstructure}
            facts={facts}
          />
        </div>
        <HullPlanLegend
          entries={legendEntries({
            facts,
            waterplaneCoeffBp: form?.waterplaneCoeffBp,
            lcbPermille: form?.lcbPermille,
            sheerBp: form?.sheerBp,
            funnels: placedFunnels,
          })}
        />
        <p className="text-xs text-muted-foreground">
          {frame.lengthM.toFixed(0)} m × {frame.beamM.toFixed(1)} m · {draft.placements.length}{" "}
          fitting(s). Schematic design views, not construction drawings or a true lines plan. The
          hull form's waterplane coefficient, LCB, sheer and the placed fittings drive the drawing;
          bow and stern character, sheer emphasis, deck-house steps and funnel shape are visual
          conventions. Only station, side and arc width of fittings are data. Arcs show the
          effective beam arc after obstruction.
        </p>
      </TooltipProvider>
    </Panel>
  );
}
