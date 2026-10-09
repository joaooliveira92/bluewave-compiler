import { useRef, useState } from "react";
import type { DesignDraft, PlacementSpec, WorkshopView } from "@bluewave/ship-design";
import type { DrawingBoardContent } from "../../content.js";
import { TooltipProvider } from "../../../../../components/ui/tooltip.js";
import { Checkbox } from "../../../../../components/ui/checkbox.js";
import { Panel } from "../Panel.js";
import { bowStyleFor, planFrame, PLAN_H, PLAN_W, sternStyleFor } from "./geometry.js";
import { type DrawingFacts, planLabel } from "./describe.js";
import { HullPlanLegend } from "./HullPlanLegend.js";
import { legendEntries } from "./legend.js";
import { IDLE_TOOL, PlanToolOptions, type PlanTool } from "./PlanToolbar.js";
import {
  autoPlace,
  clientToPlan,
  fittingAt,
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
import { boardFindings, entityWarns, type BoardFinding } from "../../validation/boardFindings.js";
import { FindingMarkers, layoutMarkers } from "../../validation/FindingMarkers.js";
import { FindingsControl, useFindingsView } from "../../validation/FindingsControl.js";
import { passesFilter } from "../../validation/severity.js";
import { SECTIONS } from "./sections.js";
import { plural } from "../../plural.js";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../components/ui/popover.js";
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
  const [ownTool, setOwnTool] = useState<PlanTool>(IDLE_TOOL);
  const tool = givenTool ?? ownTool;
  const setTool = onTool ?? setOwnTool;
  // A notice belongs to the tool state it was raised under: any tool change (here or in the toolbar) clears it.
  const [raised, setRaised] = useState<{ readonly tool: PlanTool; readonly text: string } | null>(
    null,
  );
  const notice = raised?.tool === tool ? raised.text : null;
  const setNotice = (text: string, under: PlanTool = tool) => setRaised({ tool: under, text });
  const planRef = useRef<HTMLDivElement>(null);
  const [findingsView, setFindingsView] = useFindingsView();
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
  const run = (r: PlanEdit, done: string, under: PlanTool = tool) => {
    if (r.ok) {
      edit(r.edit);
      setNotice(done, under);
    } else setNotice(r.reason, under);
  };
  const whereOf = (t: ReturnType<typeof planTarget>) =>
    `${t.stationPermille}‰${t.side === "CENTRE" ? "" : t.side === "PORT" ? ", port" : ", starboard"}`;
  const moveTo = (p: PlacementSpec, svgX: number, svgY: number, under: PlanTool = tool) => {
    const target = planTarget(frame, zones, svgX, svgY);
    run(
      moveEdit(p, defOf(p.componentId), target),
      `Moved ${p.instanceId} to ${whereOf(target)}.`,
      under,
    );
  };
  /** Makes `instanceId` the fitting to move; returns the new tool state so a notice can belong to it. */
  const pick = (instanceId: string): PlanTool => {
    if (instanceId === tool.instanceId) return tool;
    const next = { ...tool, instanceId };
    setTool(next);
    return next;
  };
  const onPlanClick = (svgX: number, svgY: number) => {
    if (tool.mode === "place") {
      const target = planTarget(frame, zones, svgX, svgY);
      const def = defOf(tool.componentId);
      if (!def) setNotice("Choose a component to place first.");
      else run(placeEdit(def, target, draft), `Placed ${def.displayName} at ${whereOf(target)}.`);
    } else if (tool.mode === "move") {
      // A click on a fitting picks it; a click elsewhere moves the picked one there.
      const hit = fittingAt(frame, draft, svgX, svgY);
      if (hit !== null && hit !== tool.instanceId)
        setNotice(
          `Picked ${hit}. Click where it should go, drag it, or use the buttons.`,
          pick(hit),
        );
      else if (!selected) setNotice("Choose a fitting to move first, or click one on the plan.");
      else moveTo(selected, svgX, svgY);
    }
  };
  // Drag to move (Move mode): press on a fitting, drag, release. The same moveEdit as the buttons; one undoable edit.
  const drag = useRef<{ readonly id: string; readonly x: number; readonly y: number } | null>(null);
  const [ghost, setGhost] = useState<{ readonly x: number; readonly y: number } | null>(null);
  const suppressClick = useRef(false);
  const toPlan = (e: { currentTarget: SVGRectElement; clientX: number; clientY: number }) =>
    clientToPlan(
      e.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
      e.clientX,
      e.clientY,
    );
  const mounts = view.compiled.weapons?.mounts ?? [];
  const batteries = batteryCards(view, draft);
  const mountNames = mountNameMap(batteries);
  const findings = given ?? boardFindings(view, draft, batteries);
  const shown = findings.filter((f) => passesFilter(f.severity, findingsView.filter));
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
  const warns = (entity: ShipEntity) => entityWarns(entity, findings);
  const entityName = (e: ShipEntity): string => {
    switch (e.kind) {
      case "ship":
        return "whole ship";
      case "section":
        return SECTIONS[e.id].name;
      case "fitting": {
        const t = targets.get(e.instanceId);
        return t ? `${t.name}${t.mount ? `, mount ${t.mount}` : ""}` : e.instanceId;
      }
      case "machinery-room":
        return `machinery room ${e.index + 1}`;
    }
  };
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
        <PlanToolOptions
          tool={tool}
          onTool={setTool}
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
          onAutoPlace={() => {
            const def = defOf(tool.componentId);
            if (!def) return setNotice("Choose a component to place first.");
            const r = autoPlace(def, draft, zones, content.environmentFor(month).ctx);
            run(
              r,
              `Placed ${def.displayName} at ${r.ok ? r.stationPermille : "?"}‰, where the ship stays most level.`,
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
                  onPointerDown={(e) => {
                    if (tool.mode !== "move") return;
                    const point = toPlan(e);
                    const hit = point && fittingAt(frame, draft, point.x, point.y);
                    if (!point || !hit) return;
                    drag.current = { id: hit, x: point.x, y: point.y };
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    const point = d && toPlan(e);
                    if (!d || !point) return;
                    // A few units of travel before it counts as a drag, so a shaky click stays a click.
                    if (ghost !== null || Math.hypot(point.x - d.x, point.y - d.y) > 4)
                      setGhost(point);
                  }}
                  onPointerUp={(e) => {
                    const d = drag.current;
                    drag.current = null;
                    const point = toPlan(e);
                    if (d && ghost !== null && point) {
                      const p = draft.placements.find((x) => x.instanceId === d.id);
                      if (p) moveTo(p, point.x, point.y, pick(d.id));
                      suppressClick.current = true; // the click that follows this release is the drop, not a new click
                    }
                    setGhost(null);
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                    setGhost(null);
                  }}
                  onClick={(e) => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    const point = toPlan(e);
                    if (point) onPlanClick(point.x, point.y);
                  }}
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
              warns={(instanceId) => warns({ kind: "fitting", instanceId })}
            />
            <FindingMarkers
              groups={findingsView.visible ? layoutMarkers(shown, frame, draft, zones) : []}
              names={entityName}
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
