import { Redo2, Undo2 } from "lucide-react";
import { Button } from "../../../components/ui/button.js";
import { SelectField } from "./fields.js";
import {
  ArmourPanel,
  FindingsPanel,
  ForecastPanel,
  HullPanel,
  LedgerPanel,
  MachineryPanel,
  MetricsPanel,
  PlacementsPanel,
} from "./panels.js";
import { useDrawingBoard } from "./useDrawingBoard.js";

const MONTHS = ["1885-01", "1890-01", "1893-06", "1895-06", "1896-01", "1899-12"];

/**
 * Component-level ship designer (SB-18 v1). Local to the renderer: edits an undoable draft and shows the live
 * compile result. Submitting a design to the engine arrives with the command wiring (SB-14).
 */
export function DrawingBoard() {
  const { state, actions } = useDrawingBoard();
  const { draft, view, content } = state;
  return (
    <div className="space-y-4" data-testid="drawing-board">
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          className="min-w-64"
          label="Starting design"
          value={state.preset.id}
          options={content.references.map((r) => ({ value: r.id, label: r.name }))}
          onChange={actions.loadPreset}
        />
        <SelectField
          className="min-w-32"
          label="Technology as of"
          value={state.month}
          options={[...new Set([...MONTHS, state.month])]
            .sort()
            .map((m) => ({ value: m, label: m }))}
          onChange={actions.setMonth}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={actions.undo} disabled={!state.canUndo}>
            <Undo2 aria-hidden="true" className="mr-1 size-4" />
            Undo
          </Button>
          <Button variant="outline" onClick={actions.redo} disabled={!state.canRedo}>
            <Redo2 aria-hidden="true" className="mr-1 size-4" />
            Redo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {state.editCount} edit(s) · requirement: {draft.requirement.category},{" "}
          {(draft.requirement.requiredSpeedMilliKnots / 1000).toFixed(1)} kn,{" "}
          {draft.requirement.requiredRangeNm.toLocaleString("en-US")} nm
        </p>
      </div>
      {state.editError !== null && (
        <p role="alert" className="rounded border border-red-300 p-2 text-sm text-red-700">
          {state.editError}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <HullPanel draft={draft} content={content} edit={actions.edit} />
          <MachineryPanel draft={draft} content={content} edit={actions.edit} />
          <PlacementsPanel
            draft={draft}
            content={content}
            month={state.month}
            edit={actions.edit}
          />
          <ArmourPanel draft={draft} edit={actions.edit} />
        </div>
        <div className="space-y-4">
          <FindingsPanel view={view} suggest={actions.suggest} onApply={actions.edit} />
          <MetricsPanel view={view} />
          <LedgerPanel view={view} />
          <ForecastPanel view={view} />
        </div>
      </div>
    </div>
  );
}
