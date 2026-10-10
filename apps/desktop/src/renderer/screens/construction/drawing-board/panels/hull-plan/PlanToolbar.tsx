import type { ComponentDef, DesignDraft, MountSide } from "@bluewave/ship-design";
import { Move, SquarePlus } from "lucide-react";
import { Button } from "../../../../../components/ui/button.js";
import { ButtonGroup } from "../../../../../components/ui/button-group.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../../../components/ui/tooltip.js";
import { SelectField } from "../../fields.js";
import { hasSide, NUDGE_PERMILLE } from "./placement-tools.js";
import { type PlanTool, type PlanToolMode } from "./plan-tool.js";

export { IDLE_TOOL, type PlanTool, type PlanToolMode } from "./plan-tool.js";

const isMountSide = (v: string): v is MountSide => v === "CENTRE" || v === "PORT" || v === "STBD";

/**
 * The plan tool switches, shown in the board toolbar: at most one mode is on, and pressing the active one turns it off.
 * The drawing itself picks up the mode (crosshair, click to place or move) and shows the options for it.
 */
export function PlanModeButtons({
  tool,
  onTool,
}: {
  readonly tool: PlanTool;
  readonly onTool: (next: PlanTool) => void;
}) {
  const toggle = (mode: PlanToolMode) =>
    onTool({ ...tool, mode: tool.mode === mode ? "off" : mode });
  return (
    <ButtonGroup aria-label="Plan tools">
      {(
        [
          ["place", "Place on plan", SquarePlus, "click the plan to fit a new component"],
          ["move", "Move on plan", Move, "click or drag a fitting to a new station"],
        ] as const
      ).map(([mode, name, Icon, hint]) => (
        <Tooltip key={mode}>
          <TooltipTrigger
            render={
              <Button
                variant={tool.mode === mode ? "default" : "outline"}
                size="icon"
                aria-label={name}
                aria-pressed={tool.mode === mode}
                onClick={() => toggle(mode)}
              />
            }
          >
            <Icon aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent>
            {name}: {hint}
          </TooltipContent>
        </Tooltip>
      ))}
    </ButtonGroup>
  );
}

/**
 * The keyboard-reachable options of the active plan tool. The plan drawing itself is a static image; clicking it is a
 * pointer shortcut for exactly what these controls do, so every action here works without a mouse.
 */
export function PlanToolOptions({
  tool,
  onTool,
  draft,
  available,
  defOf,
  onNudge,
  onSide,
  onAutoPlace,
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
  /** Places the chosen component at the most level legal station (place mode). */
  readonly onAutoPlace: () => void;
  readonly notice: string | null;
}) {
  const selected = draft.placements.find((p) => p.instanceId === tool.instanceId);
  const selectedDef = selected ? defOf(selected.componentId) : undefined;
  return (
    <div className="space-y-2" role="group" aria-label="Plan tool options">
      {tool.mode !== "off" && (
        <div className="flex flex-wrap items-end gap-2">
          {tool.mode === "place" && (
            <SelectField
              className="min-w-56 flex-1"
              label="Component to place"
              value={tool.componentId}
              options={[
                { value: "", label: "Choose a component" },
                ...available.map((c) => ({
                  value: c.id,
                  label: c.displayName,
                })),
              ]}
              onChange={(componentId) => onTool({ ...tool, componentId })}
            />
          )}
          {tool.mode === "place" && (
            <Button
              variant="outline"
              disabled={tool.componentId === ""}
              onClick={onAutoPlace}
              title="Place it where the ship stays most level"
            >
              Auto-place
            </Button>
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
      )}
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
              ? "Choose a component, then click the plan (near the centreline places it on the centreline, above port, below starboard), or use Auto-place."
              : "Click the plan to place it. Stations snap to 10‰."
            : tool.mode === "move"
              ? "Click a fitting on the plan (or choose it above), then click where it should go or drag it there."
              : "Use the Place and Move tools in the toolbar to edit the arrangement from this drawing.")}
      </p>
    </div>
  );
}
