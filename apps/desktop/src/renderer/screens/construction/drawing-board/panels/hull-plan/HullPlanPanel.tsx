import { useRef, useState } from "react";
import type { DesignDraft, WorkshopView } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { TooltipProvider } from "../../../../../components/ui/tooltip.js";
import { Checkbox } from "../../../../../components/ui/checkbox.js";
import { Panel } from "../Panel.js";
import { PLAN_H, PLAN_W } from "./geometry.js";
import { planLabel } from "./describe.js";
import { HullPlanLegend } from "./HullPlanLegend.js";
import { legendEntries } from "./legend.js";
import { PlanToolOptions } from "./PlanToolbar.js";
import { ProfileView } from "./ProfileView.js";
import { SectionCard } from "./SectionCard.js";
import { SectionLabels } from "./SectionLabels.js";
import { FindingMarkers, layoutMarkers } from "../../validation/FindingMarkers.js";
import { FindingsControl, useFindingsView } from "../../validation/FindingsControl.js";
import { passesFilter } from "../../validation/severity.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../components/ui/popover.js";
import { FittingTargets } from "./FittingTargets.js";
import { SelectionLayer } from "./SelectionLayer.js";
import { GunArcLayer, HullFittingLayer } from "./fitting-layers.js";
import { HullOutlineLayer, HullZoneLayer } from "./plan-layers.js";
import { HullTopsideLayer } from "./HullTopsideLayer.js";
import { planModel } from "./planModel.js";
import { useHullPlanEditing } from "./useHullPlanEditing.js";
import { Info } from "lucide-react";
import { plural } from "../../plural.js";
import type { BoardFinding } from "../../validation/boardFindings.js";
import type { PlanTool } from "./plan-tool.js";
import type { Edit } from "../types.js";

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
  findings: given,
  tool: givenTool,
  onTool,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly view: WorkshopView;
  readonly month: string;
  readonly edit: Edit;
  /** The board's findings (`boardFindings`); derived here only when the plan is shown on its own. */
  readonly findings?: readonly BoardFinding[];
  /** The plan tool, switched from the board toolbar; the plan keeps its own only when it is shown on its own. */
  readonly tool?: PlanTool;
  readonly onTool?: (next: PlanTool) => void;
}) {
  const [showArcs, setShowArcs] = useState(true);
  const [findingsView, setFindingsView] = useFindingsView();
  const planRef = useRef<HTMLDivElement>(null);
  const model = planModel(draft, content, view, month, given);
  const editing = useHullPlanEditing({
    draft,
    content,
    month,
    frame: model.frame,
    zones: model.zones,
    defOf: model.defOf,
    edit,
    givenTool,
    onTool,
  });
  const { tool, setTool, notice, ghost, planHandlers, onNudge, onAutoPlace, onSide } = editing;
  const { frame, zones, form, facts, superstructure, placedFunnels, mounts, targets } = model;
  const shown = model.findings.filter((f) => passesFilter(f.severity, findingsView.filter));
  return (
    <Panel title="Hull plan">
      <TooltipProvider>
        <PlanToolOptions
          tool={tool}
          onTool={setTool}
          draft={draft}
          available={model.available}
          defOf={model.defOf}
          notice={notice}
          onNudge={onNudge}
          onAutoPlace={onAutoPlace}
          onSide={onSide}
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
        <FindingsControl
          view={findingsView}
          onChange={setFindingsView}
          shipFindings={shown.filter((f) => f.entities.some((e) => e.kind === "ship"))}
        />
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
              <SelectionLayer frame={frame} zones={zones} draft={draft} warns={model.warns} />
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
                  {...planHandlers}
                />
              )}
              {ghost !== null && (
                <circle
                  cx={ghost.x}
                  cy={ghost.y}
                  r={7}
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="3 2"
                  pointerEvents="none"
                  data-testid="plan-drag-ghost"
                  aria-hidden="true"
                />
              )}
            </svg>
            <FittingTargets
              frame={frame}
              draft={draft}
              targets={targets}
              disabled={tool.mode !== "off"}
              warns={(instanceId) => model.warns({ kind: "fitting", instanceId })}
            />
            <FindingMarkers
              groups={findingsView.visible ? layoutMarkers(shown, frame, draft, zones) : []}
              names={model.entityName}
              hidden={tool.mode !== "off"}
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
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {frame.lengthM.toFixed(0)} m × {frame.beamM.toFixed(1)} m ·{" "}
            {plural(draft.placements.length, "fitting")} · Schematic, not a lines plan.
          </span>
          <Popover>
            <PopoverTrigger
              render={<button type="button" />}
              className="inline-flex items-center gap-1 rounded underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info aria-hidden="true" className="size-3" />
              About this drawing
            </PopoverTrigger>
            <PopoverContent aria-label="About this drawing" className="w-80 text-xs">
              Schematic design views, not construction drawings or a true lines plan. The hull
              form's waterplane coefficient, LCB, sheer and the placed fittings drive the drawing;
              bow and stern character, sheer emphasis, deck-house steps and funnel shape are visual
              conventions. Only station, side and arc width of fittings are data. Arcs show the
              effective beam arc after obstruction.
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
    </Panel>
  );
}
