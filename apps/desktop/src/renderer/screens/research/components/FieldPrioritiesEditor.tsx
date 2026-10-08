import { MAX_HIGH_PRIORITY_FIELDS } from "@bluewave/campaign-engine";
import { FlaskConical } from "lucide-react";
import { Button } from "../../../components/ui/button.js";
import { Toggle } from "../../../components/ui/toggle.js";
import { GlassSectionCard } from "../../../components/shared/GlassSectionCard.js";
import { WEIGHT_OPTIONS } from "../research-screen-state.js";
import type { ResearchFieldRow } from "../research-view-model.js";

export interface FieldPrioritiesEditorProps {
  readonly fields: readonly ResearchFieldRow[];
  readonly highCount: number;
  readonly highCountValid: boolean;
  readonly dirty: boolean;
  readonly busy: boolean;
  readonly canSubmit: boolean;
  readonly onSetFieldWeight: (fieldId: string, weight: 1 | 2 | 4) => void;
  readonly onSubmit: () => void;
}

export function FieldPrioritiesEditor({
  fields,
  highCount,
  highCountValid,
  dirty,
  busy,
  canSubmit,
  onSetFieldWeight,
  onSubmit,
}: FieldPrioritiesEditorProps) {
  return (
    <GlassSectionCard
      icon={<FlaskConical className="h-4 w-4 text-muted-foreground" />}
      title="Field priorities"
      description="High (4) / Medium (2) / Low (1) weight scale; exactly 1..5 fields may stay High."
    >
      {dirty && (
        <p className="text-xs font-medium text-amber-600" role="status" aria-live="polite">
          Unsaved changes — draft differs from the last committed priorities
        </p>
      )}
      <div className="space-y-2.5">
        {fields.map((field) => {
          const wouldExceedHighCap = !field.isHigh && highCount >= MAX_HIGH_PRIORITY_FIELDS;
          return (
            <div
              key={field.fieldId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">{field.label}</span>
                <span className="text-xs text-muted-foreground">
                  ~{field.projectedPoints.toLocaleString()} pts next month
                </span>
              </div>
              <div className="flex items-center gap-1" role="group" aria-label={field.label}>
                {WEIGHT_OPTIONS.map((option) => {
                  const exceedsHighCap = option.weight === 4 && wouldExceedHighCap;
                  return (
                    <Toggle
                      key={option.label}
                      pressed={field.weight === option.weight}
                      onPressedChange={() => onSetFieldWeight(field.fieldId, option.weight)}
                      disabled={busy || exceedsHighCap}
                      size="sm"
                      aria-label={`${field.label} ${option.label}`}
                      title={
                        exceedsHighCap
                          ? `At most ${MAX_HIGH_PRIORITY_FIELDS} fields may be High — lower another High field first`
                          : undefined
                      }
                    >
                      {option.label}
                    </Toggle>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {highCount} high-priority field{highCount === 1 ? "" : "s"} (
          {highCountValid ? "within" : "outside"} the engine's 1..{MAX_HIGH_PRIORITY_FIELDS} limit)
          {highCount >= MAX_HIGH_PRIORITY_FIELDS
            ? " — lower a High field before raising another"
            : ""}
        </p>
        <Button onClick={onSubmit} disabled={!canSubmit || busy} size="sm">
          {busy ? "Applying…" : "Set priorities"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Queued priorities are applied by the engine on the <strong>next turn advance</strong> — the
        engine remains the only writer of research state. Projected points use the engine's
        largest-remainder split over the budget and current weights.
      </p>
    </GlassSectionCard>
  );
}
