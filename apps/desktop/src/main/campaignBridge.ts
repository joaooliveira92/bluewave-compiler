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
  CancelMovementCommandPayloadSchema,
  ReplaceMovementCommandPayloadSchema,
  SubmitBudgetAllocationPayloadSchema,
  SubmitMovementCommandPayloadSchema,
  SubmitDivisionCommandPayloadSchema,
  WriteUiStatePayloadSchema,
  BattleIdPayloadSchema,
  GenerateBattlePayloadSchema,
  ResolveTacticalBattlePayloadSchema,
} from "./campaignCommandSchemas.js";
import {
  generateBattle,
  replayBattleBoundary,
  resolveBattle,
  resolveTacticalBattle,
} from "./commands/battleSandboxCommands.js";
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
  listCampaigns,
  loadCampaign,
  recoverCampaign,
  replayCampaign,
  verifyCampaign,
} from "./commands/continuityCommands.js";
import { inspectFleetScreen } from "./commands/fleetCommands.js";
import { inspectDiplomacyScreen, submitDiplomacyCommand } from "./commands/diplomacyCommands.js";
import {
  cancelMovementCommand,
  replaceMovementCommand,
  submitMovementCommand,
} from "./commands/fleetCommands.js";
import { inspectBudgetScreen, submitBudgetAllocation } from "./commands/budgetCommands.js";
import { inspectDivisionScreen, submitDivisionCommand } from "./commands/divisionCommands.js";
import { inspectCampaign } from "./commands/inspectCampaign.js";
import { inspectBattleHistory } from "./commands/inspectBattleHistory.js";
import { inspectMap } from "./commands/inspectMap.js";
import { closeCampaign, copyCampaign, saveCampaign } from "./commands/sessionCommands.js";
import { inspectOpeningBriefing } from "./commands/inspectOpeningBriefing.js";
import { inspectPriorities } from "./commands/inspectPriorities.js";
import { listNewGameOptions } from "./commands/listNewGameOptions.js";
import { inspectResearchScreen, setResearchPriorityCommand } from "./commands/researchCommands.js";
import { readUiState, writeUiState } from "./uiState.js";

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
 * framing). Fleet movement (`submit/replace/cancelMovementCommand`) is wired since ADR-0062.
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

    case "inspectBattleHistory": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectBattleHistory(parsedPayload.data);
    }

    case "inspectOpeningBriefing": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectOpeningBriefing(parsedPayload.data);
    }

    case "inspectPriorities": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectPriorities(parsedPayload.data);
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

    case "inspectDivisionScreen": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectDivisionScreen(parsedPayload.data);
    }

    case "submitDivisionCommand": {
      const parsedPayload = SubmitDivisionCommandPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return submitDivisionCommand(parsedPayload.data);
    }

    case "submitMovementCommand": {
      const parsedPayload = SubmitMovementCommandPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return submitMovementCommand(parsedPayload.data);
    }

    case "replaceMovementCommand": {
      const parsedPayload = ReplaceMovementCommandPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return replaceMovementCommand(parsedPayload.data);
    }

    case "cancelMovementCommand": {
      const parsedPayload = CancelMovementCommandPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return cancelMovementCommand(parsedPayload.data);
    }

    case "inspectBudgetScreen": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return inspectBudgetScreen(parsedPayload.data);
    }

    case "submitBudgetAllocation": {
      const parsedPayload = SubmitBudgetAllocationPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return submitBudgetAllocation(parsedPayload.data);
    }

    case "saveCampaign":
    case "closeCampaign":
    case "copyCampaign": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      if (parsedCommand.data === "saveCampaign") return saveCampaign(parsedPayload.data);
      if (parsedCommand.data === "closeCampaign") return closeCampaign(parsedPayload.data);
      return copyCampaign(parsedPayload.data);
    }

    case "readUiState": {
      const parsedPayload = SessionIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return readUiState(parsedPayload.data);
    }

    case "writeUiState": {
      const parsedPayload = WriteUiStatePayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return writeUiState(parsedPayload.data);
    }

    // The four Campaign File continuance commands (ticket 16) take an
    // `undefined` payload — grounded in `useCampaignFiles.ts`, which calls
    // them payload-less; the main process prompts for the package directory
    // via a native dialog (ticket 08's answer). No payload schema needed,
    // same as `listNewGameOptions`.
    case "loadCampaign":
      return loadCampaign(defaultContinuityDeps);

    case "listCampaigns":
      return listCampaigns(defaultContinuityDeps);

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

    // Tactical Sandbox (debug builds only; each command rejects DEBUG_ONLY otherwise).
    case "generateBattle": {
      const parsedPayload = GenerateBattlePayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return generateBattle(parsedPayload.data);
    }

    case "resolveBattle": {
      const parsedPayload = BattleIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return resolveBattle(parsedPayload.data);
    }

    case "resolveTacticalBattle": {
      const parsedPayload = ResolveTacticalBattlePayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return resolveTacticalBattle(parsedPayload.data as never);
    }

    case "replayBattleBoundary": {
      const parsedPayload = BattleIdPayloadSchema.safeParse(payload);
      if (!parsedPayload.success) {
        return invalidPayloadResult(parsedPayload.error.issues.map((i) => i.message));
      }
      return replayBattleBoundary(parsedPayload.data);
    }

    default:
      return {
        outcome: "error",
        reason: "NOT_IMPLEMENTED",
        diagnostics: [`${command} is not implemented yet (desktop-mvp ticket 11 scaffold).`],
      };
  }
}
