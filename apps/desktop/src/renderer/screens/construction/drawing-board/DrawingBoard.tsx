import { useState } from "react";
import { Redo2, Undo2 } from "lucide-react";
import { Alert } from "../../../components/ui/alert.js";
import { Badge } from "../../../components/ui/badge.js";
import { Button } from "../../../components/ui/button.js";
import { ButtonGroup } from "../../../components/ui/button-group.js";
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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <HullPlanPanel draft={draft} content={content} view={view} />
          <HullPanel draft={draft} content={content} edit={actions.edit} />
          <MachineryPanel draft={draft} content={content} edit={actions.edit} />
          <PlacementsPanel
            draft={draft}
            content={content}
            month={state.month}
            view={view}
            edit={actions.edit}
          />
          <ArmourPanel draft={draft} edit={actions.edit} />
        </div>
        <div className="space-y-4">
          <FindingsPanel view={view} suggest={actions.suggest} onApply={actions.edit} />
          <MetricsPanel view={view} />
          <ComparePanel baseline={state.baseline} view={view} name={state.preset.name} />
          <TopsidePanel view={view} />
          <LedgerPanel view={view} />
          <ForecastPanel view={view} />
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
          <HistoryPanel
            history={state.history}
            cursor={state.editCount}
            startName={state.preset.name}
            content={content}
            jumpTo={actions.jumpTo}
          />
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
      </div>
    </div>
  );
}
