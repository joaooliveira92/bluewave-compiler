import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { BatteryRole, ComponentCategory } from "@bluewave/ship-design";
import { Alert } from "../../components/ui/alert.js";
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
  type PlanTool,
} from "../../components/design-workspace/index.js";
import { useCampaignMonthId } from "../../shell/CampaignShellContext.js";
import {
  CommandBar,
  DesignMap,
  EngineeringStatusBar,
  Inspector,
  NotAvailable,
  ShipStage,
  WorkspaceDialog,
  type StatusValue,
} from "./components/index.js";
import {
  SECTIONS,
  categoriesOf,
  placeOf,
  type DesignSectionId,
  type InspectorPlace,
} from "./design-sections.js";
import { sectionStatuses } from "./section-status.js";

/** How long "Saved" shows after an explicit save. */
const SAVED_FLASH_MS = 2000;

const tonnes = (kg: number) => `${Math.round(kg / 1000).toLocaleString("en-US")} t`;
const pounds = (micro: number) => `£${Math.round(micro / 1_000_000).toLocaleString("en-US")}`;

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
  const [showArcs, setShowArcs] = useState(true);
  const [planTool, setPlanTool] = useState<PlanTool>(IDLE_TOOL);
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
  const warnings = view.counts.CRITICAL + view.counts.WARNING;
  const statusValues: StatusValue[] = [
    {
      id: "validity",
      label: "Design",
      value: view.valid ? "Valid" : `${plural(view.counts.BLOCKING, "blocking finding")}`,
      tone: view.valid ? "neutral" : "bad",
    },
    {
      id: "displacement",
      label: "Displacement",
      value: tonnes(view.totalKg),
      tone: view.metrics.find((m) => m.id === "displacement")?.tone === "bad" ? "bad" : "neutral",
    },
    { id: "cost", label: "Cost", value: pounds(view.forecast.costMicro), tone: "neutral" },
    {
      id: "warnings",
      label: "Warnings",
      value: String(warnings),
      tone: warnings > 0 ? "warn" : "neutral",
    },
  ];

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
              <BatteryPanel cards={cards} draft={draft} content={content} edit={actions.edit} />
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
        <div className="grid min-h-0 grid-cols-[3.5rem_minmax(0,1fr)_24rem] xl:grid-cols-[13rem_minmax(0,1fr)_27.5rem]">
          <DesignMap
            active={place.section}
            statuses={statuses}
            onSelect={(id) => openSection(id)}
          />
          <ShipStage
            toolbar={
              <PlanModeButtons
                tool={planTool}
                onTool={setPlanTool}
                draft={draft}
                available={model.available}
                defOf={model.defOf}
                onAutoPlace={editing.onAutoPlace}
              />
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
                showArcs={showArcs}
                onShowArcs={setShowArcs}
                findingsView={findingsView}
                onFindingsView={setFindingsView}
              />
            </ShipViewBoundary>
          </ShipStage>
          <Inspector
            title={section.label}
            breadcrumb={[shipClassName.trim() || state.preset.name, section.label, tab.label]}
            tabs={section.tabs}
            tab={tab.id}
            onTab={(t) => openSection(place.section, t)}
          >
            {state.editError !== null && <Alert variant="destructive">{state.editError}</Alert>}
            {body}
          </Inspector>
        </div>
        <EngineeringStatusBar values={statusValues} />
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
