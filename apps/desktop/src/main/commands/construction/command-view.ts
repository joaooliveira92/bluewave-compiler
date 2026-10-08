import type { CommandRecord } from "@bluewave/commands";
import {
  buildConstructionDesignCatalog,
  type CompiledDesignVersion,
  type ConstructionCommand,
  type ConstructionCommandStatus,
} from "@bluewave/campaign-engine";
import type { CampaignSessionRecord } from "../../campaignSessions.js";
import type { ConstructionWorkspace } from "../../constructionWorkspace.js";
import { uiStatusFor } from "./command-status.js";

/**
 * The UI-facing projection of the construction workspace. Owns everything the
 * Construction screen sees about a command record — resolving the compiled
 * design behind a design id, shaping a `ConstructionCommand` row, and writing a
 * row's status back. The command flows in `constructionCommands.ts` never touch
 * these shapes directly; the status vocabulary it shares with the workspace
 * lives in `command-status.ts`.
 */

/**
 * Resolve the UI-facing design for `designId`. Looks in the nation's compiled
 * catalog and falls back to a deterministic stub rather than crashing the
 * ledger if the design is no longer catalogued.
 */
export function resolveUiDesign(
  record: CampaignSessionRecord,
  designId: string,
): CompiledDesignVersion {
  const catalog = buildConstructionDesignCatalog(record.state.snapshot, record.playerSlotId);
  const found = catalog.find((candidate) => candidate.designId === designId);
  if (found) return found;
  const engine = record.state.snapshot.designs.get(designId);
  return {
    designId,
    className: engine?.className ?? designId,
    shipType: "unknown",
    nationId: record.playerSlotId,
    year: 0,
    mass: 0,
    speed: 0,
    machineryType: engine?.machineryType ?? "",
    requiredTechnologyIds: [],
  };
}

export interface UiCommandInput {
  readonly recordRef: CommandRecord;
  readonly designId: string;
  readonly design: CompiledDesignVersion;
  readonly projectedCost: number;
  readonly projectedCapacityUnits: number;
  readonly submittedAtRevision: number;
}

/** Shape one recorded command into the Construction screen's row. */
export function toUiCommand(input: UiCommandInput): ConstructionCommand {
  return {
    commandId: input.recordRef.commandId,
    designId: input.designId,
    design: input.design,
    nationId: input.recordRef.issuerParticipantId,
    status: uiStatusFor(input.recordRef),
    submittedAtRevision: input.submittedAtRevision,
    projectedCost: input.projectedCost,
    projectedCapacityUnits: input.projectedCapacityUnits,
  };
}

/** Write a row's status in place, preserving submission order. */
export function setUiCommandStatus(
  workspace: ConstructionWorkspace,
  commandId: string,
  status: ConstructionCommandStatus,
): void {
  workspace.commands = workspace.commands.map((command) =>
    command.commandId === commandId ? { ...command, status } : command,
  );
}
