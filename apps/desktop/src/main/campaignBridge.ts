import { z } from "zod";
import type { BridgeResult } from "../shared/bridge-contract.js";
import { CAMPAIGN_COMMAND_NAMES } from "../shared/campaign-command-contract.js";
import {
  CampaignConfigurationPayloadSchema,
  CancelConstructionOrderPayloadSchema,
  CommandEnvelopePayloadSchema,
  ConstructionOrderPayloadSchema,
  ReplaceConstructionOrderPayloadSchema,
  SessionIdPayloadSchema,
  SetResearchPriorityCommandPayloadSchema,
  SubmitDiplomacyCommandPayloadSchema,
} from "./campaignCommandSchemas.js";
import { commitMonth } from "./commands/commitMonth.js";
import { compileCampaign, defaultCompileCampaignDeps } from "./commands/compileCampaign.js";
import {
  cancelConstructionCommand,
  inspectConstructionScreen,
  replaceConstructionCommand,
  submitConstructionCommand,
} from "./commands/constructionCommands.js";
import {
  defaultContinuityDeps,
  loadCampaign,
  recoverCampaign,
  replayCampaign,
  verifyCampaign,
} from "./commands/continuityCommands.js";
import { inspectFleetScreen } from "./commands/fleetCommands.js";
import { inspectDiplomacyScreen, submitDiplomacyCommand } from "./commands/diplomacyCommands.js";
import { inspectCampaign } from "./commands/inspectCampaign.js";
import { inspectMap } from "./commands/inspectMap.js";
import { listNewGameOptions } from "./commands/listNewGameOptions.js";
import { inspectResearchScreen, setResearchPriorityCommand } from "./commands/researchCommands.js";

/**
 * The `campaign:execute` command registry. Every command documented across
 * the desktop-mvp map (tickets 07-10) is listed here. Command name is
 * Zod-validated at this IPC boundary (ENGINEERING-CONTRACT "Electron
 * boundary"). Ticket 12 wires up `listNewGameOptions`/`compileCampaign`/
 * `inspectCampaign` for real; ticket 13 adds `commitMonth`; ticket 14 adds
 * the construction commands; ticket 15 adds `inspectFleetScreen` (read-only
 * fleet query); ticket 16 adds the four Campaign File continuance commands
 * (`loadCampaign`/`verifyCampaign`/`replayCampaign`/`recoverCampaign`).
 * Each has its own payload schema; every other command stays
 * the ticket 11 `NOT_IMPLEMENTED` stub until a later ticket implements it
 * (scope discipline — see ADR-0021's "ticket 11 scaffolds the boundary only"
 * framing). `submitMovementCommand`/`replaceMovementCommand`/
 * `cancelMovementCommand` stay in that stub set deliberately: fleet movement
 * is out of this map's scope (ticket 10 ruling).
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

    case "inspectMap": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectMap(parsedPayload.data);
    }

    case "commitMonth": {
      const parsedPayload = CommandEnvelopePayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return commitMonth(parsedPayload.data);
    }

    case "inspectConstructionScreen": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectConstructionScreen(parsedPayload.data);
    }

    case "inspectFleetScreen": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectFleetScreen(parsedPayload.data);
    }

    case "inspectResearchScreen": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectResearchScreen(parsedPayload.data);
    }

    case "setResearchPriorityCommand": {
      const parsedPayload = SetResearchPriorityCommandPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return setResearchPriorityCommand(parsedPayload.data);
    }

    case "inspectDiplomacyScreen": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectDiplomacyScreen(parsedPayload.data);
    }

    case "submitDiplomacyCommand": {
      const parsedPayload = SubmitDiplomacyCommandPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return submitDiplomacyCommand(parsedPayload.data);
    }

    // The four Campaign File continuance commands (ticket 16) take an
    // `undefined` payload — grounded in `useCampaignFiles.ts`, which calls
    // them payload-less; the main process prompts for the package directory
    // via a native dialog (ticket 08's answer). No payload schema needed,
    // same as `listNewGameOptions`.
    case "loadCampaign":
      return loadCampaign(defaultContinuityDeps);

    case "verifyCampaign":
      return verifyCampaign(defaultContinuityDeps);

    case "replayCampaign":
      return replayCampaign(defaultContinuityDeps);

    case "recoverCampaign":
      return recoverCampaign(defaultContinuityDeps);

    case "submitConstructionCommand": {
      const parsedPayload = ConstructionOrderPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return submitConstructionCommand(parsedPayload.data);
    }

    case "replaceConstructionCommand": {
      const parsedPayload = ReplaceConstructionOrderPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return replaceConstructionCommand(parsedPayload.data);
    }

    case "cancelConstructionCommand": {
      const parsedPayload = CancelConstructionOrderPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return cancelConstructionCommand(parsedPayload.data);
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
