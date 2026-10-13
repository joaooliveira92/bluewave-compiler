import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import type { BatteryRole, ComponentCategory } from "@bluewave/ship-design";
import { Alert } from "../../components/ui/alert.js";
import { Button } from "../../components/ui/button.js";
import {
  AlternativesPanel,
  ArmourPanel,
  BatteryPanel,
  BriefPanel,
  ComparePanel,
  ConfirmDialog,
  FilePanel,
  FindingsPanel,
  ForecastPanel,
  HistoryPanel,
  HullPanel,
  HullPlanPanel,
  IDLE_TOOL,
  LedgerPanel,
  MachineryPanel,
  MetricsPanel,
  PlacementsPanel,
  PlanModeButtons,
  ShipSelectionProvider,
  ShipTypePanel,
  ShipViewBoundary,
  SubmitPanel,
  TopsidePanel,
  handleUndoShortcut,
  linkedEntities,
  mountNameMap,
  planModel,
  plural,
  shipTypeChoices,
  shipTypeIcon,
  useDraftAutosave,
  useFindingsView,
  useHullPlanEditing,
  useRestoredDraftToast,
  useDesignSession,
  technologyMonths,
  type EntityContext,
  type PlanTool,
} from "../../components/design-workspace/index.js";
import {
  DEFAULT_VIEW,
  overlaysOf,
  toggleOverlay,
  type ShipOverlay,
  type ShipView,
} from "../../components/design-workspace/panels/hull-plan/ship-view.js";
import { sameEntity, type ShipEntity } from "../../components/design-workspace/selection/store.js";
import { useCampaignMonthId } from "../../shell/CampaignShellContext.js";
import {
  CommandBar,
  DesignMap,
  EngineeringStatusBar,
  Inspector,
  InspectorResizeHandle,
  NotAvailable,
  ShipStage,
  ViewToolbar,
  WorkspaceDialog,
} from "./components/index.js";
import {
  SECTIONS,
  categoriesOf,
  placeOf,
  type DesignSectionId,
  type InspectorPlace,
} from "./design-sections.js";
import { engineeringStatus } from "./engineering-status.js";
import { INSPECTOR_COLLAPSED_PX } from "./inspector-layout.js";
import { sectionStatuses } from "./section-status.js";
import { focusEntityControl, placeForEntity } from "./selection.js";
import { useInspectorLayout } from "./useInspectorLayout.js";

/** How long "Saved" shows after an explicit save. */
const SAVED_FLASH_MS = 2000;

type OverflowDialog = "start" | "file" | "history" | "alternatives";

/** The battery each Armament tab shows; "other" holds no battery. */
const TAB_BATTERY: { readonly [tab: string]: BatteryRole } = {
  main: "MAIN",
  secondary: "SECONDARY",
  torpedoes: "TORPEDO",
};

/**
 * The Shipbuilding workspace: navigate by ship system (the design map), edit through a contextual inspector, and
 * watch the consequences without losing sight of the ship. It hosts the same designer as the Drawing Board (the
 * shared design-workspace layer) and the same campaign working design, under a different layout.
 */
export function ShipbuildingWorkspace({ sessionId }: { readonly sessionId?: string }) {
  const campaignMonth = useCampaignMonthId();
  const {
    state,
    actions,
    env,
    batteries,
    findings,
    selection,
    loadPreset,
    loadDraft,
    requestPreset,
    pendingPreset,
    setPendingPreset,
    starters,
    armourMaterials,
  } = useDesignSession(campaignMonth);
  const { draft, view, content } = state;
  const autosave = useDraftAutosave({
    sessionId,
    presetId: state.preset.id,
    log: state.log,
    restore: actions.restore,
  });
  const [findingsView, setFindingsView] = useFindingsView();
  const [shipView, setShipView] = useState<ShipView>(DEFAULT_VIEW);
  const [overlays, setOverlays] = useState<ReadonlySet<ShipOverlay>>(() =>
    overlaysOf(DEFAULT_VIEW),
  );
  const [planTool, setPlanTool] = useState<PlanTool>(IDLE_TOOL);
  const {
    layout: inspectorLayout,
    setWidth: setInspectorWidth,
    toggleCollapsed: toggleInspector,
  } = useInspectorLayout(sessionId);
  const inspectorId = useId();
  const [selectedEntity, setSelectedEntity] = useState<ShipEntity | null>(null);
  const inspectorBodyRef = useRef<HTMLDivElement>(null);
  const changeView = (next: ShipView) => {
    setShipView(next);
    setOverlays(overlaysOf(next));
  };
  const flipOverlay = (overlay: ShipOverlay) =>
    setOverlays((current) => toggleOverlay(current, overlay));
  const model = useMemo(
    () => planModel(draft, content, view, state.month, findings),
    [draft, content, view, state.month, findings],
  );
  const editing = useHullPlanEditing({
    draft,
    content,
    month: state.month,
    frame: model.frame,
    zones: model.zones,
    defOf: model.defOf,
    edit: actions.edit,
    givenTool: planTool,
    onTool: setPlanTool,
  });
  const [place, setPlace] = useState<InspectorPlace>(() => placeOf("overview"));
  const openSection = (section: DesignSectionId, tab?: string) => setPlace(placeOf(section, tab));
  const [shipClassName, setShipClassName] = useState("");
  const [dialog, setDialog] = useState<OverflowDialog | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  useEffect(() => {
    if (savedAt === null) return;
    const t = setTimeout(() => setSavedAt(null), SAVED_FLASH_MS);
    return () => clearTimeout(t);
  }, [savedAt]);

  useRestoredDraftToast({
    restored: autosave.restored,
    dismiss: autosave.dismiss,
    startOver: () => loadPreset(state.preset.id),
  });

  const shipTypes = shipTypeChoices(env.ctx, draft.requirement.category).map((c) => {
    const Icon = shipTypeIcon(c.value);
    return { ...c, icon: <Icon aria-hidden="true" className="size-4" /> };
  });
  const status = {
    label: view.valid ? "Can be submitted" : "Cannot be built",
    tone: view.valid ? ("ok" as const) : ("bad" as const),
    detail: `${view.counts.BLOCKING} blocking · ${view.counts.CRITICAL} critical · ${plural(view.counts.WARNING, "warning")}`,
  };
  const readouts = useMemo(() => engineeringStatus(view), [view]);

  const fittings = useMemo(() => {
    const category = new Map(content.components.map((c) => [c.id, c.category]));
    return new Map(
      draft.placements.flatMap((p): [string, ComponentCategory][] => {
        const c = category.get(p.componentId);
        return c === undefined ? [] : [[p.instanceId, c]];
      }),
    );
  }, [draft, content]);
  const statuses = useMemo(() => sectionStatuses(findings, fittings), [findings, fittings]);

  const entityCtx: EntityContext = {
    draft,
    view,
    content,
    zones: model.zones,
    batteries,
    findings,
  };
  // Drawing → inspector: pinning a ship element opens the section/tab that edits it and focuses its control.
  // Only a change of the pinned entity navigates: linked/finding churn from focus must not steal focus back.
  const lastPinned = useRef<ShipEntity | null>(null);
  useEffect(() => {
    const unsubscribe = selection.subscribe(() => {
      const pinned = selection.get().selected;
      if (sameEntity(pinned, lastPinned.current)) return;
      lastPinned.current = pinned;
      setSelectedEntity(pinned);
      if (pinned === null) return;
      const at = placeForEntity(pinned, { draft, content });
      if (at === null) return;
      // The new place must render before its control exists to focus, so flush that one update synchronously.
      flushSync(() => setPlace(at));
      focusEntityControl(inspectorBodyRef.current ?? document, pinned);
    });
    return unsubscribe;
  }, [selection, draft, content]);
  const selectedInstanceId = selectedEntity?.kind === "fitting" ? selectedEntity.instanceId : null;

  const section = SECTIONS[place.section];
  const tab = section.tabs.find((t) => t.id === place.tab) ?? section.tabs[0]!;
  const body = tabBody(place);

  /** The tab's own fittings (listed, edited and added there); null when the tab holds none and none exist. */
  function fittingsPanel(at: InspectorPlace): ReactNode {
    const categories = categoriesOf(at);
    const hasFittings =
      [...fittings.values()].some((c) => categories.has(c)) ||
      content.components.some((c) => categories.has(c.category));
    if (!hasFittings) return null;
    return (
      <PlacementsPanel
        title={`${tab.label} fittings`}
        categories={categories}
        names={mountNameMap(batteries)}
        draft={draft}
        content={content}
        month={state.month}
        view={view}
        edit={actions.edit}
        onSelect={(instanceId) => selection.select({ kind: "fitting", instanceId })}
        selectedInstanceId={selectedInstanceId}
      />
    );
  }

  /** A tab made only of fittings: the fittings, or a plain not-available note when there are none to fit. */
  function fittingsOnly(at: InspectorPlace): ReactNode {
    return (
      fittingsPanel(at) ?? (
        <NotAvailable title={`${tab.label}: not available`}>
          Nothing of this kind can be fitted to this design yet.
        </NotAvailable>
      )
    );
  }

  function tabBody(at: InspectorPlace): ReactNode {
    switch (at.section) {
      case "overview":
        return at.tab === "brief" ? (
          <BriefPanel draft={draft} view={view} edit={actions.edit} ctx={env.ctx} />
        ) : (
          <>
            <MetricsPanel view={view} />
            <LedgerPanel view={view} />
            <ForecastPanel view={view} treasuryUnitMicro={content.treasuryUnitMicro} />
          </>
        );
      case "hull":
        return at.tab === "stability" ? (
          <TopsidePanel view={view} />
        ) : (
          <>
            <HullPanel draft={draft} content={content} edit={actions.edit} />
            {fittingsPanel(at)}
          </>
        );
      case "machinery":
        return at.tab === "performance" ? (
          <MetricsPanel view={view} />
        ) : (
          <>
            <MachineryPanel draft={draft} content={content} edit={actions.edit} />
            {fittingsPanel(at)}
          </>
        );
      case "protection":
        return at.tab === "armour" ? (
          <>
            <ArmourPanel
              draft={draft}
              view={view}
              materials={armourMaterials}
              edit={actions.edit}
            />
            {fittingsPanel(at)}
          </>
        ) : (
          fittingsOnly(at)
        );
      case "armament": {
        const role = TAB_BATTERY[at.tab];
        const cards = batteries.filter((b) => b.row.role === role);
        return (
          <>
            {cards.length > 0 && (
              <BatteryPanel
                cards={cards}
                draft={draft}
                content={content}
                edit={actions.edit}
                onSelect={selection.select}
                selectedInstanceId={selectedInstanceId}
              />
            )}
            {fittingsOnly(at)}
          </>
        );
      }
      case "systems":
        return fittingsOnly(at);
      case "review":
        return at.tab === "findings" ? (
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
        ) : sessionId !== undefined ? (
          <SubmitPanel
            sessionId={sessionId}
            draft={draft}
            valid={view.valid}
            name={shipClassName}
            onNameChange={setShipClassName}
          />
        ) : (
          <NotAvailable title="Finishing: not available">
            A design is finished into a campaign; open the Shipbuilding workspace from a campaign to
            submit it.
          </NotAvailable>
        );
    }
  }

  return (
    <ShipSelectionProvider store={selection}>
      <div
        data-testid="shipbuilding-workspace"
        className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-lg border bg-background"
        onKeyDown={(e) => handleUndoShortcut(e, { ...state, ...actions })}
        onKeyDownCapture={(e) => {
          // ⌘/Ctrl+B folds the inspector away and restores it, wherever focus is on the screen.
          if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "b") {
            e.preventDefault();
            toggleInspector();
            return;
          }
          // Escape clears a pinned ship element from the drawing or the inspector, one step per press.
          if (e.key !== "Escape") return;
          const s = selection.get();
          if (s.selected === null || s.preview !== null || s.markerPreview) return;
          if (!(e.target instanceof Element) || !e.target.closest("[data-selection-scope]")) return;
          e.preventDefault();
          e.stopPropagation();
          if (s.finding !== null) selection.clearFinding();
          else selection.clear();
        }}
      >
        <CommandBar
          shipClassName={shipClassName}
          onShipClassName={setShipClassName}
          shipType={draft.requirement.category}
          shipTypes={shipTypes}
          onShipType={(v) => actions.edit({ kind: "set_requirement", patch: { category: v } })}
          month={state.month}
          months={campaignMonth !== null ? null : technologyMonths(state.month)}
          onMonth={actions.setMonth}
          status={status}
          canUndo={state.canUndo}
          canRedo={state.canRedo}
          onUndo={actions.undo}
          onRedo={actions.redo}
          compare={<ComparePanel baseline={state.baseline} view={view} name={state.preset.name} />}
          onSave={
            autosave.enabled
              ? () => {
                  if (autosave.saveNow()) setSavedAt(Date.now());
                }
              : null
          }
          saveLabel={savedAt !== null ? "Saved" : "Save draft"}
          onValidate={() => openSection("review", "findings")}
          onFinish={() => openSection("review", "finish")}
          overflow={[
            { label: "Start from a reference design…", onSelect: () => setDialog("start") },
            { label: "Import or export design…", onSelect: () => setDialog("file") },
            { label: "Edit history…", onSelect: () => setDialog("history") },
            { label: "Design alternatives…", onSelect: () => setDialog("alternatives") },
            {
              label: "Reset to the starting design",
              destructive: true,
              onSelect: () => setPendingPreset(state.preset.id),
            },
          ]}
        />
        <div
          data-testid="workspace-grid"
          className="grid min-h-0 grid-cols-[3.5rem_minmax(0,1fr)_var(--inspector-width)] xl:grid-cols-[13rem_minmax(0,1fr)_var(--inspector-width)]"
          style={
            {
              "--inspector-width": `${
                inspectorLayout.collapsed ? INSPECTOR_COLLAPSED_PX : inspectorLayout.widthPx
              }px`,
            } as CSSProperties
          }
        >
          <DesignMap
            active={place.section}
            statuses={statuses}
            onSelect={(id) => openSection(id)}
          />
          <ShipStage
            toolbar={
              <>
                <ViewToolbar
                  view={shipView}
                  onView={changeView}
                  overlays={overlays}
                  onToggleOverlay={flipOverlay}
                />
                <PlanModeButtons
                  tool={planTool}
                  onTool={setPlanTool}
                  draft={draft}
                  available={model.available}
                  defOf={model.defOf}
                  onAutoPlace={editing.onAutoPlace}
                />
              </>
            }
          >
            <ShipViewBoundary resetKey={draft}>
              <HullPlanPanel
                draft={draft}
                content={content}
                view={view}
                month={state.month}
                edit={actions.edit}
                findings={findings}
                model={model}
                editing={editing}
                shipView={shipView}
                overlays={overlays}
                findingsView={findingsView}
                onFindingsView={setFindingsView}
              />
            </ShipViewBoundary>
          </ShipStage>
          <div id={inspectorId} className="relative min-h-0">
            {!inspectorLayout.collapsed && (
              <InspectorResizeHandle
                widthPx={inspectorLayout.widthPx}
                onChange={setInspectorWidth}
                controls={inspectorId}
                className="absolute inset-y-0 -left-2 z-10 w-4"
              />
            )}
            <Inspector
              title={section.label}
              breadcrumb={[shipClassName.trim() || state.preset.name, section.label, tab.label]}
              tabs={section.tabs}
              tab={tab.id}
              onTab={(t) => openSection(place.section, t)}
              collapsed={inspectorLayout.collapsed}
              onToggleCollapsed={toggleInspector}
            >
              <div
                ref={inspectorBodyRef}
                data-selection-scope=""
                className="space-y-3"
                // Inspector → drawing: focus in a form group about ship elements lights them on the drawing.
                onFocus={(e) => selection.setLinked(linkedEntities(e.target, entityCtx))}
                onBlur={(e) => {
                  if (
                    !(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))
                  )
                    selection.setLinked([]);
                }}
              >
                {selectedEntity !== null && (
                  <div
                    data-testid="selection-banner"
                    className="flex items-center justify-between gap-2 rounded-md border border-primary/40 bg-card px-2 py-1.5 text-xs"
                  >
                    <span>
                      <span className="text-muted-foreground">Selected on ship: </span>
                      {model.entityName(selectedEntity)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => selection.clear()}
                    >
                      Clear
                    </Button>
                  </div>
                )}
                {state.editError !== null && <Alert variant="destructive">{state.editError}</Alert>}
                {body}
              </div>
            </Inspector>
          </div>
        </div>
        <EngineeringStatusBar readouts={readouts} />
        <ConfirmDialog
          open={pendingPreset !== null}
          onOpenChange={(open) => !open && setPendingPreset(null)}
          title={
            pendingPreset === state.preset.id
              ? "Reset to the starting design?"
              : "Start from a different design?"
          }
          description="This replaces the design you are working on, and its edit history is cleared."
          confirmLabel="Replace my design"
          onConfirm={() => {
            if (pendingPreset !== null) loadPreset(pendingPreset);
            setPendingPreset(null);
          }}
        />
        <WorkspaceDialog
          open={dialog === "start"}
          onClose={() => setDialog(null)}
          title="Start from a reference design"
          description="Each ship type has a starting design. Your current design is replaced only after you confirm."
        >
          <ShipTypePanel
            env={env}
            starters={starters}
            currentCategory={draft.requirement.category}
            onStart={(id) => {
              setDialog(null);
              requestPreset(id);
            }}
          />
        </WorkspaceDialog>
        <WorkspaceDialog
          open={dialog === "file"}
          onClose={() => setDialog(null)}
          title="Import or export design"
          description="Save the design to a file, or load one."
        >
          <FilePanel
            draft={draft}
            view={view}
            content={content}
            presetName={state.preset.name}
            onLoad={loadDraft}
            dirty={state.editCount > 0}
          />
        </WorkspaceDialog>
        <WorkspaceDialog
          open={dialog === "history"}
          onClose={() => setDialog(null)}
          title="Edit history"
          description="Every change, oldest first. Choose an entry to go back to it."
        >
          <HistoryPanel
            history={state.history}
            cursor={state.editCount}
            startName={state.preset.name}
            content={content}
            jumpTo={actions.jumpTo}
          />
        </WorkspaceDialog>
        <WorkspaceDialog
          open={dialog === "alternatives"}
          onClose={() => setDialog(null)}
          title="Design alternatives"
          description="Designs the naval architects propose from this one, under the same rules."
        >
          <AlternativesPanel
            dirty={state.editCount > 0}
            generate={actions.generateAlternatives}
            onLoad={(d) => {
              setDialog(null);
              loadDraft(d);
            }}
          />
        </WorkspaceDialog>
      </div>
    </ShipSelectionProvider>
  );
}
