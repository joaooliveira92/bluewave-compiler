import { z } from "zod";
import type { BridgeResult } from "../shared/bridge-contract.js";
import { CAMPAIGN_COMMAND_NAMES } from "../shared/campaign-command-contract.js";
import {
  CampaignConfigurationPayloadSchema,
  CommandEnvelopePayloadSchema,
  SessionIdPayloadSchema,
} from "./campaignCommandSchemas.js";
import { commitMonth } from "./commands/commitMonth.js";
import { compileCampaign, defaultCompileCampaignDeps } from "./commands/compileCampaign.js";
import { inspectCampaign } from "./commands/inspectCampaign.js";
import { listNewGameOptions } from "./commands/listNewGameOptions.js";

/**
 * The `campaign:execute` command registry. Every command documented across
 * the desktop-mvp map (tickets 07-10) is listed here. Command name is
 * Zod-validated at this IPC boundary (ENGINEERING-CONTRACT "Electron
 * boundary"). Ticket 12 wires up `listNewGameOptions`/`compileCampaign`/
 * `inspectCampaign` for real; ticket 13 adds `commitMonth`. Each has its own
 * payload schema; every other command stays the ticket 11 `NOT_IMPLEMENTED`
 * stub until tickets 14-16 implement it (scope discipline — see ADR-0021's
 * "ticket 11 scaffolds the boundary only" framing).
 */
const CommandNameSchema = z.enum(CAMPAIGN_COMMAND_NAMES);

function invalidPayloadResult(issues: readonly string[]): BridgeResult<unknown> {
  return {
    outcome: "error",
    reason: "INVALID_PAYLOAD",
    diagnostics: issues,
  };
}

export async function dispatchCampaignCommand(
  command: string,
  payload: unknown,
): Promise<BridgeResult<unknown>> {
  const parsedCommand = CommandNameSchema.safeParse(command);
  if (!parsedCommand.success) {
    return {
      outcome: "error",
      reason: "UNKNOWN_COMMAND",
      diagnostics: [`No such campaign command: ${command}`],
    };
  }

  switch (parsedCommand.data) {
    case "listNewGameOptions":
      return listNewGameOptions();

    case "compileCampaign": {
      const parsedPayload = CampaignConfigurationPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return compileCampaign(parsedPayload.data, defaultCompileCampaignDeps);
    }

    case "inspectCampaign": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectCampaign(parsedPayload.data);
    }

    case "commitMonth": {
      const parsedPayload = CommandEnvelopePayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return commitMonth(parsedPayload.data);
    }

    default:
      return {
        outcome: "error",
        reason: "NOT_IMPLEMENTED",
        diagnostics: [
          `${parsedCommand.data} is not implemented yet (desktop-mvp ticket 11 scaffold).`,
        ],
      };
  }
}
