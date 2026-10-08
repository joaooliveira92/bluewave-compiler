import type { BridgeResult } from "../../../shared/bridge-contract.js";
import type { ConstructionCommandOutcome } from "../../../shared/construction-contract.js";
import {
  CONSTRUCTION_COMMAND_DEFINITION,
  workspaceView,
  type ConstructionWorkspace,
} from "../../constructionWorkspace.js";
import { uiStatusFor } from "./command-status.js";

/**
 * Idempotent-retry lookup for construction commands. The client's
 * `transportRequestId` doubles as the idempotency key, so a retry of the same
 * request replays its outcome instead of double-ordering; reusing the key for a
 * different command is an `IDEMPOTENCY_CONFLICT`.
 */
export function replayIdempotent(
  workspace: ConstructionWorkspace,
  transportRequestId: string,
  commandId: string,
): BridgeResult<ConstructionCommandOutcome> | undefined {
  const existing = workspace.idempotency.get(CONSTRUCTION_COMMAND_DEFINITION, transportRequestId);
  if (!existing) return undefined;
  if (existing.commandId !== commandId) {
    return {
      outcome: "rejected",
      reason: "IDEMPOTENCY_CONFLICT",
      diagnostics: [
        `transportRequestId ${transportRequestId} was already used by command ${existing.commandId}`,
      ],
    };
  }
  return {
    outcome: "success",
    value: {
      command: { commandId: existing.commandId, status: uiStatusFor(existing) },
      workspace: workspaceView(workspace),
    },
    diagnostics: [],
  };
}
