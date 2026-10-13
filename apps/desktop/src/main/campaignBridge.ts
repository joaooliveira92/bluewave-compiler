import { Result, Schema, SchemaIssue } from "effect";
import type { BridgeResult } from "../shared/bridge-contract.js";
import { CAMPAIGN_COMMAND_NAMES } from "../shared/campaign-command-contract.js";
import type { ResolveTacticalBattlePayload } from "../shared/campaign-command-contract.js";
import {
  BattleIdPayloadSchema,
  CampaignConfigurationPayloadSchema,
  CancelConstructionOrderPayloadSchema,
  CancelMovementCommandPayloadSchema,
  CommandEnvelopePayloadSchema,
  ConstructionOrderPayloadSchema,
  GenerateBattlePayloadSchema,
  ReplaceConstructionOrderPayloadSchema,
  ReplaceMovementCommandPayloadSchema,
  ResolveTacticalBattlePayloadSchema,
  SessionIdPayloadSchema,
  SeedCampaignBattleDrillPayloadSchema,
  SetResearchPriorityCommandPayloadSchema,
  SubmitBudgetAllocationPayloadSchema,
  LoadProjectDraftPayloadSchema,
  LoadShipDraftPayloadSchema,
  RebuildCheckPayloadSchema,
  StartRebuildCommandPayloadSchema,
  ReviseProjectCommandPayloadSchema,
  SubmitDesignCommandPayloadSchema,
  SubmitDiplomacyCommandPayloadSchema,
  SubmitDivisionCommandPayloadSchema,
  SubmitMovementCommandPayloadSchema,
  WriteUiStatePayloadSchema,
  HaltConstructionCommandPayloadSchema,
  ResumeConstructionCommandPayloadSchema,
  SetAccelerationCommandPayloadSchema,
  OrderConstructionBatchCommandPayloadSchema,
  PreviewConstructionBatchCommandPayloadSchema,
  AuthorizeDockExpansionCommandPayloadSchema,
  PlaceForeignConstructionCommandPayloadSchema,
  PreviewForeignConstructionCommandPayloadSchema,
} from "./campaignCommandSchemas.js";
import {
  generateBattle,
  replayBattleBoundary,
  resolveBattle,
  resolveTacticalBattle,
  seedCampaignBattleDrill,
} from "./commands/battleSandboxCommands.js";
import { commitMonth } from "./commands/commitMonth.js";
import { compileCampaign, defaultCompileCampaignDeps } from "./commands/compileCampaign.js";
import {
  inspectDrawingBoardContent,
  inspectPresentationContent,
} from "./commands/contentCommands.js";
import {
  cancelConstructionCommand,
  inspectConstructionScreen,
  previewConstructionBatchCommand,
  previewForeignConstructionCommand,
  replaceConstructionCommand,
  submitConstructionCommand,
} from "./commands/constructionCommands.js";
import {
  authorizeDockExpansionCommand,
  haltConstructionCommand,
  orderConstructionBatchCommand,
  placeForeignConstructionCommand,
  resumeConstructionCommand,
  setAccelerationCommand,
} from "./commands/constructionStatusCommands.js";
import {
  defaultContinuityDeps,
  listCampaigns,
  loadCampaign,
  recoverCampaign,
  replayCampaign,
  verifyCampaign,
} from "./commands/continuityCommands.js";
import {
  checkRebuild,
  listRebuildableShips,
  loadProjectDraft,
  loadShipDraft,
  reviseProjectCommand,
  startRebuildCommand,
  submitDesignCommand,
} from "./commands/designCommands.js";
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
import {
  readDrawingBoardDraft,
  WriteDrawingBoardDraftPayloadSchema,
  writeDrawingBoardDraft,
} from "./drawingBoardDraft.js";

/**
 * The `campaign:execute` command registry. Command name is validated at
 * this IPC boundary (ENGINEERING-CONTRACT "Electron boundary"); each command's
 * `{schema, execute}` pair is registered below and the dispatcher itself knows
 * nothing about individual commands. Adding a command means adding one registry
 * entry — the router never changes (ADR-0021's boundary, ADR-0057 debug-gated
 * battle commands, ADR-0062 fleet movement, linked from the desktop-mvp map).
 */
const CommandNameSchema = Schema.Literals(CAMPAIGN_COMMAND_NAMES);

type CampaignCommandName = (typeof CAMPAIGN_COMMAND_NAMES)[number];

type CommandOutcome = BridgeResult<unknown>;

/**
 * A routed command, with its payload already validated. `payload` stays
 * `unknown` here so a heterogeneous registry can hold every command; the
 * schema-adapting helpers below recover the concrete type per entry.
 */
export type CampaignCommandHandler = (payload: unknown) => CommandOutcome | Promise<CommandOutcome>;

export type CommandRegistry = Partial<Record<CampaignCommandName, CampaignCommandHandler>>;

/** Formats an Effect `SchemaError`'s issue tree into Zod-style per-field messages. */
const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();

function issueMessages(error: Schema.SchemaError): readonly string[] {
  return formatIssues(error.issue).issues.map((issue) => issue.message);
}

function invalidPayloadResult(issues: readonly string[]): BridgeResult<unknown> {
  return {
    outcome: "error",
    reason: "INVALID_PAYLOAD",
    diagnostics: issues,
  };
}

/**
 * Adapts a typed handler to the uniform {@link CampaignCommandHandler} contract
 * by validating the incoming wire payload against `schema` first. This owns the
 * "validate then execute" responsibility once, instead of repeating it per
 * `switch` case (SRP).
 */
function withSchema<T>(
  schema: Schema.ConstraintDecoder<T, never>,
  execute: (payload: T) => CommandOutcome | Promise<CommandOutcome>,
): CampaignCommandHandler {
  return (payload) => {
    const decoded = Schema.decodeUnknownResult(schema)(payload);
    if (Result.isFailure(decoded)) {
      return invalidPayloadResult(issueMessages(decoded.failure));
    }
    return execute(decoded.success);
  };
}

/**
 * Like {@link withSchema} but decodes with `onExcessProperty: "error"`, so a
 * payload carrying a key the schema does not model is rejected rather than
 * silently stripped. Used only where an extra field would be an authority leak
 * (`placeForeignConstructionCommand`, whose renderer must not supply contract
 * `terms`/`capability`).
 */
function withStrictSchema<T>(
  schema: Schema.ConstraintDecoder<T, never>,
  execute: (payload: T) => CommandOutcome | Promise<CommandOutcome>,
): CampaignCommandHandler {
  return (payload) => {
    const decoded = Schema.decodeUnknownResult(schema, { onExcessProperty: "error" })(payload);
    if (Result.isFailure(decoded)) {
      return invalidPayloadResult(issueMessages(decoded.failure));
    }
    return execute(decoded.success);
  };
}

/**
 * Commands whose payload is intentionally `undefined` (`listNewGameOptions`,
 * and the Campaign File continuance commands grounded in
 * `useCampaignFiles.ts`) — no wire schema, same as before.
 */
function payloadless(
  execute: () => CommandOutcome | Promise<CommandOutcome>,
): CampaignCommandHandler {
  return () => execute();
}

/**
 * Every command the bridge routes, keyed by its contract name. The `withSchema`
 * adapter keeps each handler typed against its own payload while the registry
 * stays uniformly keyed, so a missing entry is a `NOT_IMPLEMENTED` response
 * rather than a missing `switch` case.
 */
export const defaultCommandRegistry: CommandRegistry = {
  listNewGameOptions: payloadless(() => listNewGameOptions()),
  compileCampaign: withSchema(CampaignConfigurationPayloadSchema, (payload) =>
    compileCampaign(payload, defaultCompileCampaignDeps),
  ),
  inspectCampaign: withSchema(SessionIdPayloadSchema, (sessionId) => inspectCampaign(sessionId)),
  inspectMap: withSchema(SessionIdPayloadSchema, (sessionId) => inspectMap(sessionId)),
  inspectBattleHistory: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectBattleHistory(sessionId),
  ),
  inspectOpeningBriefing: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectOpeningBriefing(sessionId),
  ),
  inspectPriorities: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectPriorities(sessionId),
  ),
  inspectDrawingBoardContent: payloadless(() => inspectDrawingBoardContent()),
  inspectPresentationContent: payloadless(() => inspectPresentationContent()),
  commitMonth: withSchema(CommandEnvelopePayloadSchema, (payload) => commitMonth(payload)),
  inspectConstructionScreen: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectConstructionScreen(sessionId),
  ),
  submitConstructionCommand: withSchema(ConstructionOrderPayloadSchema, (payload) =>
    submitConstructionCommand(payload),
  ),
  replaceConstructionCommand: withSchema(ReplaceConstructionOrderPayloadSchema, (payload) =>
    replaceConstructionCommand(payload),
  ),
  cancelConstructionCommand: withSchema(CancelConstructionOrderPayloadSchema, (payload) =>
    cancelConstructionCommand(payload),
  ),
  haltConstructionCommand: withSchema(HaltConstructionCommandPayloadSchema, (payload) =>
    haltConstructionCommand(payload),
  ),
  resumeConstructionCommand: withSchema(ResumeConstructionCommandPayloadSchema, (payload) =>
    resumeConstructionCommand(payload),
  ),
  setAccelerationCommand: withSchema(SetAccelerationCommandPayloadSchema, (payload) =>
    setAccelerationCommand(payload),
  ),
  orderConstructionBatchCommand: withSchema(OrderConstructionBatchCommandPayloadSchema, (payload) =>
    orderConstructionBatchCommand(payload),
  ),
  previewConstructionBatchCommand: withSchema(
    PreviewConstructionBatchCommandPayloadSchema,
    (payload) => previewConstructionBatchCommand(payload),
  ),
  authorizeDockExpansionCommand: withSchema(AuthorizeDockExpansionCommandPayloadSchema, (payload) =>
    authorizeDockExpansionCommand(payload),
  ),
  placeForeignConstructionCommand: withStrictSchema(
    PlaceForeignConstructionCommandPayloadSchema,
    (payload) => placeForeignConstructionCommand(payload),
  ),
  previewForeignConstructionCommand: withSchema(
    PreviewForeignConstructionCommandPayloadSchema,
    (payload) => previewForeignConstructionCommand(payload),
  ),
  inspectFleetScreen: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectFleetScreen(sessionId),
  ),
  submitMovementCommand: withSchema(SubmitMovementCommandPayloadSchema, (payload) =>
    submitMovementCommand(payload),
  ),
  replaceMovementCommand: withSchema(ReplaceMovementCommandPayloadSchema, (payload) =>
    replaceMovementCommand(payload),
  ),
  cancelMovementCommand: withSchema(CancelMovementCommandPayloadSchema, (payload) =>
    cancelMovementCommand(payload),
  ),
  submitDesignCommand: withSchema(SubmitDesignCommandPayloadSchema, (payload) =>
    submitDesignCommand(payload),
  ),
  reviseProjectCommand: withSchema(ReviseProjectCommandPayloadSchema, (payload) =>
    reviseProjectCommand(payload),
  ),
  loadProjectDraft: withSchema(LoadProjectDraftPayloadSchema, (payload) =>
    loadProjectDraft(payload),
  ),
  readDrawingBoardDraft: withSchema(SessionIdPayloadSchema, (sessionId) =>
    readDrawingBoardDraft(sessionId),
  ),
  writeDrawingBoardDraft: withSchema(WriteDrawingBoardDraftPayloadSchema, (payload) =>
    writeDrawingBoardDraft(payload),
  ),
  listRebuildableShips: withSchema(SessionIdPayloadSchema, (sessionId) =>
    listRebuildableShips(sessionId),
  ),
  loadShipDraft: withSchema(LoadShipDraftPayloadSchema, (payload) => loadShipDraft(payload)),
  checkRebuild: withSchema(RebuildCheckPayloadSchema, (payload) => checkRebuild(payload)),
  startRebuildCommand: withSchema(StartRebuildCommandPayloadSchema, (payload) =>
    startRebuildCommand(payload),
  ),
  inspectResearchScreen: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectResearchScreen(sessionId),
  ),
  setResearchPriorityCommand: withSchema(SetResearchPriorityCommandPayloadSchema, (payload) =>
    setResearchPriorityCommand(payload),
  ),
  inspectDiplomacyScreen: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectDiplomacyScreen(sessionId),
  ),
  submitDiplomacyCommand: withSchema(SubmitDiplomacyCommandPayloadSchema, (payload) =>
    submitDiplomacyCommand(payload),
  ),
  inspectDivisionScreen: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectDivisionScreen(sessionId),
  ),
  submitDivisionCommand: withSchema(SubmitDivisionCommandPayloadSchema, (payload) =>
    submitDivisionCommand(payload),
  ),
  inspectBudgetScreen: withSchema(SessionIdPayloadSchema, (sessionId) =>
    inspectBudgetScreen(sessionId),
  ),
  submitBudgetAllocation: withSchema(SubmitBudgetAllocationPayloadSchema, (payload) =>
    submitBudgetAllocation(payload),
  ),
  saveCampaign: withSchema(SessionIdPayloadSchema, (sessionId) => saveCampaign(sessionId)),
  closeCampaign: withSchema(SessionIdPayloadSchema, (sessionId) => closeCampaign(sessionId)),
  copyCampaign: withSchema(SessionIdPayloadSchema, (sessionId) => copyCampaign(sessionId)),
  readUiState: withSchema(SessionIdPayloadSchema, (sessionId) => readUiState(sessionId)),
  writeUiState: withSchema(WriteUiStatePayloadSchema, (payload) => writeUiState(payload)),
  loadCampaign: payloadless(() => loadCampaign(defaultContinuityDeps)),
  listCampaigns: payloadless(() => listCampaigns(defaultContinuityDeps)),
  verifyCampaign: payloadless(() => verifyCampaign(defaultContinuityDeps)),
  replayCampaign: payloadless(() => replayCampaign(defaultContinuityDeps)),
  recoverCampaign: payloadless(() => recoverCampaign(defaultContinuityDeps)),
  generateBattle: withSchema(GenerateBattlePayloadSchema, (payload) => generateBattle(payload)),
  resolveBattle: withSchema(BattleIdPayloadSchema, (payload) => resolveBattle(payload)),
  resolveTacticalBattle: withSchema(ResolveTacticalBattlePayloadSchema, (payload) =>
    resolveTacticalBattle(payload as ResolveTacticalBattlePayload),
  ),
  replayBattleBoundary: withSchema(BattleIdPayloadSchema, (payload) =>
    replayBattleBoundary(payload),
  ),
  seedCampaignBattleDrill: withSchema(SeedCampaignBattleDrillPayloadSchema, (payload) =>
    seedCampaignBattleDrill(payload),
  ),
};

/**
 * Builds the `campaign:execute` dispatcher around a registry. Depends on the
 * {@link CommandRegistry} seam rather than the concrete command set (DIP), so
 * tests can inject a registry and the production one is just a value.
 */
export function createCampaignCommandDispatcher(
  registry: CommandRegistry,
): (command: string, payload: unknown) => Promise<BridgeResult<unknown>> {
  return async (command, payload) => {
    const parsedCommand = Schema.decodeUnknownResult(CommandNameSchema)(command);
    if (Result.isFailure(parsedCommand)) {
      return {
        outcome: "error",
        reason: "UNKNOWN_COMMAND",
        diagnostics: [`No such campaign command: ${command}`],
      };
    }

    const handler = registry[parsedCommand.success];
    if (handler === undefined) {
      return {
        outcome: "error",
        reason: "NOT_IMPLEMENTED",
        diagnostics: [
          `${parsedCommand.success} is not implemented yet (desktop-mvp ticket 11 scaffold).`,
        ],
      };
    }

    return handler(payload);
  };
}

export const dispatchCampaignCommand = createCampaignCommandDispatcher(defaultCommandRegistry);
