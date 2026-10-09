import { useRef, useState } from "react";
import type { DesignDraft, WorkshopView } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { TooltipProvider } from "../../../../../components/ui/tooltip.js";
import { Checkbox } from "../../../../../components/ui/checkbox.js";
import { Panel } from "../Panel.js";
import { bowStyleFor, planFrame, PLAN_H, PLAN_W, sternStyleFor } from "./geometry.js";
import { type DrawingFacts, planLabel } from "./describe.js";
import { HullPlanLegend } from "./HullPlanLegend.js";
import { legendEntries } from "./legend.js";
import { IDLE_TOOL, PlanToolbar, type PlanTool } from "./PlanToolbar.js";
import {
  clientToPlan,
  moveEdit,
  nudgeEdit,
  placeEdit,
  planTarget,
  type PlanEdit,
} from "./placement-tools.js";
import { ProfileView } from "./ProfileView.js";
import { SectionCard } from "./SectionCard.js";
import { SectionLabels } from "./SectionLabels.js";
import { batteryCards, mountNameMap } from "../../batteryView.js";
import { entityWarns } from "../../selection/facts.js";
import type { ShipEntity } from "../../selection/store.js";
import { FittingTargets } from "./FittingTargets.js";
import { SelectionLayer } from "./SelectionLayer.js";
import type { Edit } from "../types.js";
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
  month,
  edit,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly view: WorkshopView;
  readonly month: string;
  readonly edit: Edit;
}) {
  const [showArcs, setShowArcs] = useState(true);
  const [tool, setTool] = useState<PlanTool>(IDLE_TOOL);
  const [notice, setNotice] = useState<string | null>(null);
  const planRef = useRef<HTMLDivElement>(null);
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
  const defOf = (id: string) => content.components.find((c) => c.id === id);
  const available = content.components.filter((c) => c.introduction.fromMonth <= month);
  const selected = draft.placements.find((x) => x.instanceId === tool.instanceId);
  const run = (r: PlanEdit, done: string) => {
    if (r.ok) {
      edit(r.edit);
      setNotice(done);
    } else setNotice(r.reason);
  };
  const onPlanClick = (svgX: number, svgY: number) => {
    const target = planTarget(frame, zones, svgX, svgY);
    const where = `${target.stationPermille}‰${target.side === "CENTRE" ? "" : target.side === "PORT" ? ", port" : ", starboard"}`;
    if (tool.mode === "place") {
      const def = defOf(tool.componentId);
      if (!def) setNotice("Choose a component to place first.");
      else run(placeEdit(def, target, draft), `Placed ${def.displayName} at ${where}.`);
    } else if (tool.mode === "move") {
      if (!selected) setNotice("Choose a fitting to move first.");
      else
        run(
          moveEdit(selected, defOf(selected.componentId), target),
          `Moved ${selected.instanceId} to ${where}.`,
        );
    }
  };
  const mounts = view.compiled.weapons?.mounts ?? [];
  const mountNames = mountNameMap(batteryCards(view, draft));
  const targets = new Map(
    draft.placements.map((p) => [
      p.instanceId,
      {
        instanceId: p.instanceId,
        name: defOf(p.componentId)?.displayName ?? p.componentId,
        mount: mountNames.get(p.instanceId),
      },
    ]),
  );
  const warns = (entity: ShipEntity) => entityWarns(entity, view);
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
        <PlanToolbar
          tool={tool}
          onTool={(next) => {
            setTool(next);
            setNotice(null);
          }}
          draft={draft}
          available={available}
          defOf={defOf}
          notice={notice}
          onNudge={(delta) => {
            if (selected)
              run(
                nudgeEdit(selected, defOf(selected.componentId), zones, delta),
                `Moved ${selected.instanceId} ${Math.abs(delta)}‰ ${delta < 0 ? "toward the bow" : "toward the stern"}.`,
              );
          }}
          onSide={(side) => {
            if (selected) {
              edit({ kind: "set_side", instanceId: selected.instanceId, side });
              setNotice(
                `Set ${selected.instanceId} to ${side === "CENTRE" ? "the centreline" : side === "PORT" ? "port" : "starboard"}.`,
              );
            }
          }}
        />
        <div className="flex items-center gap-2 text-sm">
          <Checkbox
            id="show-gun-arcs"
            aria-label="Show gun arcs"
            checked={showArcs}
            onCheckedChange={(v) => setShowArcs(v === true)}
          />
          <span aria-hidden="true">Show gun arcs</span>
        </div>
        <div className="space-y-1" ref={planRef}>
          <p className="text-xs font-medium text-muted-foreground">Waterline plan</p>
          <div className="relative">
            <svg
              viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
              className="block w-full rounded bg-muted/40"
              role="img"
              aria-label={planLabel(facts)}
            >
              <HullOutlineLayer frame={frame} />
              <SelectionLayer frame={frame} zones={zones} draft={draft} warns={warns} />
              <HullZoneLayer frame={frame} zones={zones} />
              <HullTopsideLayer frame={frame} draft={draft} content={content} zones={zones} />
              {showArcs && <GunArcLayer frame={frame} draft={draft} mounts={mounts} />}
              <HullFittingLayer
                frame={frame}
                draft={draft}
                selectedId={tool.mode === "move" ? tool.instanceId : undefined}
              />
              {tool.mode !== "off" && (
                <rect
                  x={0}
                  y={0}
                  width={PLAN_W}
                  height={PLAN_H}
                  fill="transparent"
                  className="cursor-crosshair"
                  aria-hidden="true"
                  data-testid="plan-click-layer"
                  onClick={(e) => {
                    const point = clientToPlan(
                      e.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? {
                        left: 0,
                        top: 0,
                        width: 0,
                        height: 0,
                      },
                      e.clientX,
                      e.clientY,
                    );
                    if (point) onPlanClick(point.x, point.y);
                  }}
                />
              )}
            </svg>
            <FittingTargets
              frame={frame}
              draft={draft}
              targets={targets}
              disabled={tool.mode !== "off"}
              warns={(instanceId) => warns({ kind: "fitting", instanceId })}
            />
          </div>
          <SectionLabels
            zones={zones}
            anchor={planRef}
            renderCard={(id) => (
              <SectionCard
                id={id}
                ctx={{ draft, view, content, zones, frame, sheerBp: form?.sheerBp ?? 10000 }}
              />
            )}
          />
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
