import type { ComponentDef, DesignDraft, MountSide } from "@bluewave/ship-design";
import { Button } from "../../../../../components/ui/button.js";
import { SelectField } from "../../fields.js";
import { hasSide, NUDGE_PERMILLE } from "./placement-tools.js";

export type PlanToolMode = "off" | "place" | "move";

export interface PlanTool {
  readonly mode: PlanToolMode;
  /** Component to place (place mode). */
  readonly componentId: string;
  /** Fitting to move (move mode). */
  readonly instanceId: string;
}

export const IDLE_TOOL: PlanTool = { mode: "off", componentId: "", instanceId: "" };

const isMountSide = (v: string): v is MountSide => v === "CENTRE" || v === "PORT" || v === "STBD";

/**
 * The keyboard-reachable controls for placing and moving fittings on the plan. The plan drawing itself is a static image;
 * clicking it is a pointer shortcut for exactly what these controls do, so every action here works without a mouse.
 */
export function PlanToolbar({
  tool,
  onTool,
  draft,
  available,
  defOf,
  onNudge,
  onSide,
  notice,
}: {
  readonly tool: PlanTool;
  readonly onTool: (next: PlanTool) => void;
  readonly draft: DesignDraft;
  /** Components that can be fitted this month. */
  readonly available: readonly ComponentDef[];
  readonly defOf: (componentId: string) => ComponentDef | undefined;
  readonly onNudge: (deltaPermille: number) => void;
  readonly onSide: (side: MountSide) => void;
  readonly notice: string | null;
}) {
  const selected = draft.placements.find((p) => p.instanceId === tool.instanceId);
  const selectedDef = selected ? defOf(selected.componentId) : undefined;
  const toggle = (mode: PlanToolMode) =>
    onTool({ ...tool, mode: tool.mode === mode ? "off" : mode });
  return (
    <div className="space-y-2" role="group" aria-label="Plan tools">
      <div className="flex flex-wrap items-end gap-2">
        <Button
          variant={tool.mode === "place" ? "default" : "outline"}
          size="sm"
          aria-pressed={tool.mode === "place"}
          onClick={() => toggle("place")}
        >
          Place on plan
        </Button>
        <Button
          variant={tool.mode === "move" ? "default" : "outline"}
          size="sm"
          aria-pressed={tool.mode === "move"}
          onClick={() => toggle("move")}
        >
          Move on plan
        </Button>
        {tool.mode === "place" && (
          <SelectField
            className="min-w-56 flex-1"
            label="Component to place"
            value={tool.componentId}
            options={[
              { value: "", label: "Choose a component" },
              ...available.map((c) => ({ value: c.id, label: c.displayName })),
            ]}
            onChange={(componentId) => onTool({ ...tool, componentId })}
          />
        )}
        {tool.mode === "move" && (
          <SelectField
            className="min-w-56 flex-1"
            label="Fitting to move"
            value={tool.instanceId}
            options={[
              { value: "", label: "Choose a fitting" },
              ...draft.placements.map((p) => ({
                value: p.instanceId,
                label: `${defOf(p.componentId)?.displayName ?? p.componentId} (${p.instanceId})`,
              })),
            ]}
            onChange={(instanceId) => onTool({ ...tool, instanceId })}
          />
        )}
      </div>
      {tool.mode === "move" && selected !== undefined && (
        <div className="flex flex-wrap items-end gap-2">
          {(
            [
              -NUDGE_PERMILLE.large,
              -NUDGE_PERMILLE.step,
              NUDGE_PERMILLE.step,
              NUDGE_PERMILLE.large,
            ] as const
          ).map((delta) => (
            <Button
              key={delta}
              variant="outline"
              size="sm"
              aria-label={`Move ${Math.abs(delta)} permille ${delta < 0 ? "toward the bow" : "toward the stern"}`}
              onClick={() => onNudge(delta)}
            >
              {delta < 0 ? "◀" : ""} {Math.abs(delta)}‰ {delta > 0 ? "▶" : ""}
            </Button>
          ))}
          {hasSide(selectedDef) && (
            <SelectField
              className="w-36"
              label="Side of the selected fitting"
              shortLabel="Side"
              value={selected.side ?? "CENTRE"}
              options={[
                { value: "CENTRE", label: "Centreline" },
                { value: "PORT", label: "Port" },
                { value: "STBD", label: "Starboard" },
              ]}
              onChange={(v) => {
                if (isMountSide(v)) onSide(v);
              }}
            />
          )}
        </div>
      )}
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {notice ??
          (tool.mode === "place"
            ? tool.componentId === ""
              ? "Choose a component, then click the plan: near the centreline places it on the centreline, above port or below starboard."
              : "Click the plan to place it. Stations snap to 10‰."
            : tool.mode === "move"
              ? "Choose a fitting, then click the plan or use the buttons to move it."
              : "Use Place on plan or Move on plan to edit the arrangement from this drawing.")}
      </p>
    </div>
  );
}
