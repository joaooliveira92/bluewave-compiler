import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs.js";
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
  HullPlanPanel,
  LedgerPanel,
  MachineryPanel,
  MetricsPanel,
  PlacementsPanel,
  RevisionPanel,
  SubmitPanel,
  TopsidePanel,
} from "./panels/index.js";
import { useCampaignMonthId } from "../../../shell/CampaignShellContext.js";
import type { RevisionProject } from "./revisionPreview.js";
import { useDrawingBoard } from "./useDrawingBoard.js";

/** Tabs with icons (ReUI c-tabs-6): the board is split by what the player is doing, so nothing needs a long scroll. */
const TABS: readonly { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "hull", label: "Hull and machinery", Icon: Ship },
  { value: "arrangement", label: "Arrangement", Icon: LayoutGrid },
  { value: "analysis", label: "Analysis", Icon: Gauge },
  { value: "build", label: "Build", Icon: Hammer },
  { value: "tools", label: "History and files", Icon: Wrench },
];
const TAB_GRID = "grid grid-cols-1 items-start gap-4 xl:grid-cols-2";

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
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);
  const [tab, setTab] = useState("hull");
  return (
    <div className="space-y-4" data-testid="drawing-board">
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          className="min-w-64"
          label="Starting design"
          value={state.preset.id}
          options={content.references.map((r) => ({ value: r.id, label: r.name }))}
          onChange={(id) => (state.editCount > 0 ? setPendingPreset(id) : actions.loadPreset(id))}
        />
        <SelectField
          className="min-w-32"
          label="Technology as of"
          value={state.month}
          options={(campaignMonth !== null
            ? [campaignMonth]
            : [...new Set([...MONTHS, state.month])].sort()
          ).map((m) => ({
            value: m,
            label: campaignMonth !== null ? `${m} (campaign date)` : m,
          }))}
          onChange={actions.setMonth}
        />
        <ButtonGroup aria-label="History">
          <Button variant="outline" onClick={actions.undo} disabled={!state.canUndo}>
            <Undo2 aria-hidden="true" className="mr-1 size-4" />
            Undo
          </Button>
          <Button variant="outline" onClick={actions.redo} disabled={!state.canRedo}>
            <Redo2 aria-hidden="true" className="mr-1 size-4" />
            Redo
          </Button>
        </ButtonGroup>
        <Badge variant="secondary">{state.editCount} edit(s)</Badge>
        <RequirementChip requirement={draft.requirement} />
      </div>
      <ConfirmDialog
        open={pendingPreset !== null}
        onOpenChange={(open) => !open && setPendingPreset(null)}
        title="Start from a different design?"
        description="This replaces the design you are working on, and its edit history is cleared."
        confirmLabel="Replace my design"
        onConfirm={() => {
          if (pendingPreset !== null) actions.loadPreset(pendingPreset);
          setPendingPreset(null);
        }}
      />
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
          {view.counts.BLOCKING} blocking · {view.counts.CRITICAL} critical · {view.counts.WARNING}{" "}
          warning
        </span>
        {view.metrics.slice(0, 3).map((m) => (
          <span key={m.id} className="tabular-nums">
            <span className="text-muted-foreground">{m.label}:</span> {m.value}
          </span>
        ))}
      </button>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="h-auto w-full flex-wrap">
          {TABS.map(({ value, label, Icon }) => (
            <TabsTrigger key={value} value={value} className="flex-1 gap-2">
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="hull" keepMounted className={TAB_GRID}>
          <HullPlanPanel draft={draft} content={content} view={view} />
          <div className="space-y-4">
            <HullPanel draft={draft} content={content} edit={actions.edit} />
            <MachineryPanel draft={draft} content={content} edit={actions.edit} />
          </div>
        </TabsContent>

        <TabsContent value="arrangement" keepMounted className="space-y-4">
          <PlacementsPanel
            draft={draft}
            content={content}
            month={state.month}
            view={view}
            edit={actions.edit}
          />
          <div className={TAB_GRID}>
            <ArmourPanel draft={draft} edit={actions.edit} />
            <TopsidePanel view={view} />
          </div>
        </TabsContent>

        <TabsContent value="analysis" keepMounted className={TAB_GRID}>
          <div className="space-y-4">
            <FindingsPanel view={view} suggest={actions.suggest} onApply={actions.edit} />
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
            onLoad={actions.loadDraft}
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
              onLoad={actions.loadDraft}
              dirty={state.editCount > 0}
            />
            <AlternativesPanel
              dirty={state.editCount > 0}
              generate={actions.generateAlternatives}
              onLoad={actions.loadDraft}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
