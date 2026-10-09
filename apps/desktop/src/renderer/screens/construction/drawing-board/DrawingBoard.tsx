import { useEffect, useMemo, useRef, useState } from "react";
import { armourMaterialOptions } from "@bluewave/ship-design";
import { batteryCards, mountNameMap } from "./batteryView.js";
import {
  Gauge,
  Hammer,
  LayoutGrid,
  Redo2,
  Ship,
  Undo2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Alert } from "../../../components/ui/alert.js";
import { Badge } from "../../../components/ui/badge.js";
import { Button } from "../../../components/ui/button.js";
import { ButtonGroup } from "../../../components/ui/button-group.js";
import { Separator } from "../../../components/ui/separator.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip.js";
import { ConfirmDialog } from "./ConfirmAction.js";
import { RequirementChip } from "./RequirementChip.js";
import { SelectField } from "./fields.js";
import {
  AlternativesPanel,
  ArmourPanel,
  FilePanel,
  FindingsPanel,
  ComparePanel,
  ForecastPanel,
  HistoryPanel,
  HullPanel,
  BatteryPanel,
  BriefPanel,
  HullPlanPanel,
  LedgerPanel,
  MachineryPanel,
  MetricsPanel,
  PlacementsPanel,
  RebuildPanel,
  RevisionPanel,
  SubmitPanel,
  TopsidePanel,
} from "./panels/index.js";
import { IDLE_TOOL, PlanModeButtons, type PlanTool } from "./panels/hull-plan/PlanToolbar.js";
import { useCampaignMonthId } from "../../../shell/CampaignShellContext.js";
import type { RevisionProject } from "./revisionPreview.js";
import { useDrawingBoard } from "./useDrawingBoard.js";
import { useDraftAutosave } from "./useDraftAutosave.js";
import { plural } from "./plural.js";
import { entityExists, type EntityContext } from "./selection/facts.js";
import { boardFindings } from "./validation/boardFindings.js";
import {
  BOARD_TABS,
  findDrawingControl,
  linkedEntities,
  type BoardTab,
} from "./selection/navigation.js";
import { SelectionInspector } from "./selection/SelectionInspector.js";
import { createSelectionStore } from "./selection/store.js";
import { useFormNavigation } from "./selection/useFormNavigation.js";
import { ShipSelectionProvider } from "./selection/useShipSelection.js";
import { ShipViewBoundary } from "./workspace/ShipViewBoundary.js";
import { ShipWorkspace } from "./workspace/ShipWorkspace.js";

/**
 * Tabs with icons (ReUI c-tabs-6): the board is split by what the player is doing, so nothing needs a long scroll.
 * The hull plan is not a tab's content: it stays in the workspace's ship view whichever tab is open.
 */
const TABS: readonly { value: BoardTab; label: string; Icon: LucideIcon }[] = [
  { value: "hull", label: "Hull and machinery", Icon: Ship },
  { value: "arrangement", label: "Arrangement", Icon: LayoutGrid },
  { value: "analysis", label: "Analysis", Icon: Gauge },
  { value: "build", label: "Build", Icon: Hammer },
  { value: "tools", label: "History and files", Icon: Wrench },
];
/** Two columns once the tab pane (not the window) is wide enough: the pane shares the window with the ship view. */
const TAB_GRID = "grid grid-cols-1 items-start gap-4 @4xl:grid-cols-2";

const IS_MAC = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
/** Shortcut labels in the platform's own notation. */
const MOD = IS_MAC ? "⌘" : "Ctrl+";
const SHIFT = IS_MAC ? "⇧" : "Shift+";

const MONTHS = ["1885-01", "1890-01", "1893-06", "1895-06", "1896-01", "1899-12"];

/**
 * Component-level ship designer (SB-18 v1). Local to the renderer: edits an undoable draft and shows the live
 * compile result. Submitting a design to the engine arrives with the command wiring (SB-14).
 */
export function DrawingBoard({
  sessionId,
  projects = [],
}: { readonly sessionId?: string; readonly projects?: readonly RevisionProject[] } = {}) {
  const campaignMonth = useCampaignMonthId();
  const { state, actions } = useDrawingBoard(campaignMonth);
  const { draft, view, content } = state;
  const autosave = useDraftAutosave({
    sessionId,
    presetId: state.preset.id,
    log: state.log,
    restore: actions.restore,
  });
  const batteries = batteryCards(view, draft);
  const armourEnv = content.environmentFor(state.month).ctx;
  const armourMaterials = armourMaterialOptions(
    armourEnv.balance.armour,
    state.month,
    armourEnv.unlockedTechs,
  );
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);
  const [tab, setTab] = useState<BoardTab>("hull");
  // Switched from the toolbar, used by the drawing: the one tool state survives tab changes with the ship view.
  const [planTool, setPlanTool] = useState<PlanTool>(IDLE_TOOL);
  const zones = content.hullForms.find((f) => f.id === draft.hull.hullFormId)?.zones ?? [];
  // One finding list per compile, shared by the drawing, the inspector and the Analysis tab.
  const findings = useMemo(
    () => boardFindings(view, draft, batteryCards(view, draft)),
    [view, draft],
  );
  const entityCtx: EntityContext = { draft, view, content, zones, batteries, findings };
  // Presentation selection (pinned, form-linked, hover preview): one store for the board, never design state.
  const [selection] = useState(createSelectionStore);
  useEffect(() => selection.prune((e) => entityExists(e, draft, zones)), [selection, draft, zones]);
  // A resolved finding drops out of the selection; its entity stays pinned while it exists.
  useEffect(
    () => selection.pruneFinding((key) => findings.some((f) => f.key === key)),
    [selection, findings],
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const goTo = useFormNavigation(setTab, rootRef);
  const clearSelection = () => {
    const was = selection.get().selected;
    selection.clear();
    if (was && rootRef.current) findDrawingControl(rootRef.current, was)?.focus();
  };
  // Another ship replaces everything the selection could point at.
  const loadPreset = (id: string) => {
    selection.clear();
    actions.loadPreset(id);
  };
  const loadDraft: typeof actions.loadDraft = (d) => {
    selection.clear();
    actions.loadDraft(d);
  };
  return (
    <ShipSelectionProvider store={selection}>
      <div
        ref={rootRef}
        className="flex h-full min-h-0 flex-col gap-4"
        data-testid="drawing-board"
        onKeyDown={(e) => {
          // Undo/redo for the design: ⌘Z / Ctrl+Z, ⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y. A text field keeps its own undo.
          if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
          const t = e.target;
          if (
            t instanceof HTMLElement &&
            (t.isContentEditable ||
              (t instanceof HTMLInputElement && t.type !== "checkbox") ||
              t instanceof HTMLTextAreaElement)
          )
            return;
          const key = e.key.toLowerCase();
          const redo = (key === "z" && e.shiftKey) || (key === "y" && !e.shiftKey);
          if (key === "z" && !e.shiftKey) {
            if (state.canUndo) actions.undo();
          } else if (redo) {
            if (state.canRedo) actions.redo();
          } else return;
          e.preventDefault();
        }}
        onKeyDownCapture={(e) => {
          // Escape, one step per press, from the drawing or the inspector: an open preview (hover card or
          // finding marker) closes itself first; then the opened finding; then the pinned entity; only then does
          // the dialog get the key. Capture phase, so a control's own key handling cannot swallow it first.
          if (e.key !== "Escape") return;
          const s = selection.get();
          if (s.selected === null || s.preview !== null || s.markerPreview) return;
          if (!(e.target instanceof Element) || !e.target.closest("[data-selection-scope]")) return;
          e.preventDefault();
          e.stopPropagation();
          if (s.finding !== null) selection.clearFinding();
          else clearSelection();
        }}
      >
        <TooltipProvider>
          <div
            role="group"
            aria-label="Design toolbar"
            className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2"
          >
            <SelectField
              inline
              label="Starting design"
              shortLabel="Design"
              value={state.preset.id}
              options={content.references.map((r) => ({ value: r.id, label: r.name }))}
              onChange={(id) => (state.editCount > 0 ? setPendingPreset(id) : loadPreset(id))}
            />
            {campaignMonth !== null ? (
              // In a campaign the rules date is the campaign month (the engine uses the same), so it is shown, not chosen.
              <p
                className="flex h-9 items-center gap-2 text-sm"
                title="Technology is fixed to the campaign date"
              >
                <span className="text-xs text-muted-foreground">Technology</span>
                {campaignMonth} (campaign date)
              </p>
            ) : (
              <SelectField
                inline
                label="Technology as of"
                shortLabel="Technology"
                value={state.month}
                options={[...new Set([...MONTHS, state.month])]
                  .sort()
                  .map((m) => ({ value: m, label: m }))}
                onChange={actions.setMonth}
              />
            )}
            <Separator orientation="vertical" className="h-6" />
            <ButtonGroup aria-label="History">
              {(
                [
                  ["Undo", Undo2, actions.undo, state.canUndo],
                  ["Redo", Redo2, actions.redo, state.canRedo],
                ] as const
              ).map(([name, Icon, run, can]) => (
                <Tooltip key={name}>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={name}
                        onClick={run}
                        disabled={!can}
                      />
                    }
                  >
                    <Icon aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {name} ({name === "Undo" ? `${MOD}Z` : `${SHIFT}${MOD}Z`})
                  </TooltipContent>
                </Tooltip>
              ))}
            </ButtonGroup>
            <span className="text-xs text-muted-foreground tabular-nums">
              {plural(state.editCount, "edit", "edits", "No edits")}
            </span>
            <Separator orientation="vertical" className="h-6" />
            <PlanModeButtons tool={planTool} onTool={setPlanTool} />
            <div className="ml-auto">
              <RequirementChip requirement={draft.requirement} />
            </div>
          </div>
        </TooltipProvider>
        <ConfirmDialog
          open={pendingPreset !== null}
          onOpenChange={(open) => !open && setPendingPreset(null)}
          title="Start from a different design?"
          description="This replaces the design you are working on, and its edit history is cleared."
          confirmLabel="Replace my design"
          onConfirm={() => {
            if (pendingPreset !== null) loadPreset(pendingPreset);
            setPendingPreset(null);
          }}
        />
        {autosave.restored !== null && (
          <Alert role="status" className="flex flex-wrap items-center gap-3">
            <span className="flex-1">
              Your unsubmitted design was restored, with its edit history (last changed{" "}
              {new Date(autosave.restored.savedAt).toLocaleString()}). Changes are saved as you
              work.
            </span>
            <Button variant="outline" size="sm" onClick={autosave.dismiss}>
              Keep working
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                autosave.dismiss();
                loadPreset(state.preset.id);
              }}
            >
              Start over
            </Button>
          </Alert>
        )}
        {state.editError !== null && <Alert variant="destructive">{state.editError}</Alert>}
        <button
          type="button"
          onClick={() => setTab("analysis")}
          aria-label="Design status: open the analysis tab"
          className="flex w-full flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Badge variant={view.valid ? "secondary" : "destructive"}>
            {view.valid ? "Can be submitted" : "Cannot be built"}
          </Badge>
          <span className="text-muted-foreground">
            {view.counts.BLOCKING} blocking · {view.counts.CRITICAL} critical ·{" "}
            {plural(view.counts.WARNING, "warning")}
          </span>
          {view.metrics.slice(0, 3).map((m) => (
            <span key={m.id} className="tabular-nums">
              <span className="text-muted-foreground">{m.label}:</span> {m.value}
            </span>
          ))}
        </button>
        <ShipWorkspace
          ship={
            <div data-selection-scope="">
              <ShipViewBoundary resetKey={draft}>
                <HullPlanPanel
                  draft={draft}
                  content={content}
                  view={view}
                  month={state.month}
                  edit={actions.edit}
                  findings={findings}
                  tool={planTool}
                  onTool={setPlanTool}
                />
              </ShipViewBoundary>
            </div>
          }
        >
          <div
            // Form-to-drawing linking: focus in a form group about ship elements lights them on the drawing.
            onFocus={(e) => selection.setLinked(linkedEntities(e.target, entityCtx))}
            onBlur={(e) => {
              if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)))
                selection.setLinked([]);
            }}
          >
            <Tabs
              value={tab}
              onValueChange={(v) => {
                const next = BOARD_TABS.find((t) => t === v);
                if (next) setTab(next);
              }}
            >
              <TabsList className="h-auto w-full flex-wrap">
                {TABS.map(({ value, label, Icon }) => (
                  <TabsTrigger key={value} value={value} className="flex-1 gap-2">
                    <Icon aria-hidden="true" className="hidden size-4 @3xl:block" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <SelectionInspector ctx={entityCtx} onGoTo={goTo} onClear={clearSelection} />

              <TabsContent value="hull" keepMounted className={TAB_GRID}>
                <BriefPanel draft={draft} view={view} edit={actions.edit} />
                <div className="space-y-4">
                  <HullPanel draft={draft} content={content} edit={actions.edit} />
                  <MachineryPanel draft={draft} content={content} edit={actions.edit} />
                </div>
              </TabsContent>

              <TabsContent value="arrangement" keepMounted className="space-y-4">
                <BatteryPanel
                  cards={batteries}
                  draft={draft}
                  content={content}
                  edit={actions.edit}
                />
                <PlacementsPanel
                  names={mountNameMap(batteries)}
                  draft={draft}
                  content={content}
                  month={state.month}
                  view={view}
                  edit={actions.edit}
                />
                <div className={TAB_GRID}>
                  <ArmourPanel
                    draft={draft}
                    view={view}
                    materials={armourMaterials}
                    edit={actions.edit}
                  />
                  <TopsidePanel view={view} />
                </div>
              </TabsContent>

              <TabsContent value="analysis" keepMounted className={TAB_GRID}>
                <div className="space-y-4">
                  <FindingsPanel
                    view={view}
                    findings={findings}
                    suggest={actions.suggest}
                    onApply={actions.edit}
                    onShowOnShip={(f) => {
                      const target = f.entities[0];
                      if (target) selection.select(target, f.key);
                    }}
                  />
                  <LedgerPanel view={view} />
                </div>
                <div className="space-y-4">
                  <MetricsPanel view={view} />
                  <ComparePanel baseline={state.baseline} view={view} name={state.preset.name} />
                  <ForecastPanel view={view} treasuryUnitMicro={content.treasuryUnitMicro} />
                </div>
              </TabsContent>

              <TabsContent value="build" keepMounted className={TAB_GRID}>
                {sessionId !== undefined && (
                  <SubmitPanel sessionId={sessionId} draft={draft} valid={view.valid} />
                )}
                <RevisionPanel
                  sessionId={sessionId}
                  projects={projects}
                  history={state.history.slice(0, state.editCount)}
                  draft={draft}
                  startDraft={state.preset.draft}
                  content={content}
                  onLoad={loadDraft}
                  dirty={state.editCount > 0}
                />
                <RebuildPanel
                  sessionId={sessionId}
                  draft={draft}
                  content={content}
                  onLoad={loadDraft}
                  dirty={state.editCount > 0}
                />
              </TabsContent>

              <TabsContent value="tools" keepMounted className={TAB_GRID}>
                <HistoryPanel
                  history={state.history}
                  cursor={state.editCount}
                  startName={state.preset.name}
                  content={content}
                  jumpTo={actions.jumpTo}
                />
                <div className="space-y-4">
                  <FilePanel
                    draft={draft}
                    view={view}
                    content={content}
                    presetName={state.preset.name}
                    onLoad={loadDraft}
                    dirty={state.editCount > 0}
                  />
                  <AlternativesPanel
                    dirty={state.editCount > 0}
                    generate={actions.generateAlternatives}
                    onLoad={loadDraft}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ShipWorkspace>
      </div>
    </ShipSelectionProvider>
  );
}
