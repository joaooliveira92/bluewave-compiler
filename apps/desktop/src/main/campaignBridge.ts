import { Effect, ManagedRuntime, Result, Schema, SchemaIssue } from "effect";
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
  CancelConstructionProjectPayloadSchema,
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
  inspectDrawingBoardContentProgram,
  inspectPresentationContentProgram,
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
  cancelConstructionProjectCommand,
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
import {
  closeCampaignProgram,
  copyCampaign,
  saveCampaignProgram,
} from "./commands/sessionCommands.js";
import { inspectOpeningBriefing } from "./commands/inspectOpeningBriefing.js";
import { inspectPriorities } from "./commands/inspectPriorities.js";
import { listNewGameOptionsProgram } from "./commands/listNewGameOptions.js";
import { inspectResearchScreen, setResearchPriorityCommand } from "./commands/researchCommands.js";
import { readUiState, writeUiState } from "./uiState.js";
import { readMonthlyReports } from "./monthlyReports.js";
import {
  readDrawingBoardDraft,
  WriteDrawingBoardDraftPayloadSchema,
  writeDrawingBoardDraft,
} from "./drawingBoardDraft.js";
import { projectCommandExit } from "./runtime/bridgeResult.js";
import {
  CommandFailed,
  InvalidCommandPayload,
  NotImplemented,
  UnknownCommand,
  type CommandError,
} from "./runtime/commandError.js";
import { type CommandEnv, desktopMainLayer } from "./runtime/desktopMainLayer.js";

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

/**
 * An Effect-program command handler (INC-1; ADR-0159). Its error channel is the
 * command error union; its requirement is the services the Layer provides. The
 * success value is the frozen `BridgeResult` envelope, so the IPC bytes are
 * unchanged.
 */
export type CommandProgram = (
  payload: unknown,
) => Effect.Effect<BridgeResult<unknown>, CommandError, CommandEnv>;

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
 * Adapts a typed Effect program to a {@link CommandProgram} by decoding the wire
 * payload against `schema` first (INC-3); a decode failure fails with
 * `InvalidCommandPayload`, preserving the `INVALID_PAYLOAD` envelope.
 */
function withSchemaProgram<T>(
  schema: Schema.ConstraintDecoder<T, never>,
  run: (payload: T) => Effect.Effect<BridgeResult<unknown>, CommandError, CommandEnv>,
): CommandProgram {
  return (payload) =>
    Effect.gen(function* () {
      const decoded = Schema.decodeUnknownResult(schema)(payload);
      if (Result.isFailure(decoded)) {
        return yield* new InvalidCommandPayload({ issues: issueMessages(decoded.failure) });
      }
      return yield* run(decoded.success);
    });
}

/**
 * Commands migrated to Effect programs. The dispatcher prefers these over the
 * legacy {@link CommandRegistry}; INC-2..INC-5 widen this set until the registry
 * is fully replaced (INC-5).
 */
export const defaultCommandPrograms: Partial<Record<CampaignCommandName, CommandProgram>> = {
  listNewGameOptions: () => listNewGameOptionsProgram,
  inspectDrawingBoardContent: () => inspectDrawingBoardContentProgram,
  inspectPresentationContent: () => inspectPresentationContentProgram,
  saveCampaign: withSchemaProgram(SessionIdPayloadSchema, (sessionId) =>
    saveCampaignProgram(sessionId),
  ),
  closeCampaign: withSchemaProgram(SessionIdPayloadSchema, (sessionId) =>
    closeCampaignProgram(sessionId),
  ),
};

/**
 * Every command the bridge routes, keyed by its contract name. The `withSchema`
 * adapter keeps each handler typed against its own payload while the registry
 * stays uniformly keyed, so a missing entry is a `NOT_IMPLEMENTED` response
 * rather than a missing `switch` case.
 */
export const defaultCommandRegistry: CommandRegistry = {
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
  cancelConstructionProjectCommand: withSchema(CancelConstructionProjectPayloadSchema, (payload) =>
    cancelConstructionProjectCommand(payload),
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
  copyCampaign: withSchema(SessionIdPayloadSchema, (sessionId) => copyCampaign(sessionId)),
  readUiState: withSchema(SessionIdPayloadSchema, (sessionId) => readUiState(sessionId)),
  writeUiState: withSchema(WriteUiStatePayloadSchema, (payload) => writeUiState(payload)),
  readMonthlyReports: withSchema(SessionIdPayloadSchema, (sessionId) =>
    readMonthlyReports(sessionId),
  ),
  loadCampaign: payloadless(() => loadCampaign(defaultContinuityDeps)),
  listCampaigns: payloadless(() => listCampaigns(defaultContinuityDeps)),
  verifyCampaign: payloadless(() => verifyCampaign(defaultContinuityDeps)),
  replayCampaign: payloadless(() => replayCampaign(defaultContinuityDeps)),
  recoverCampaign: payloadless(() => recoverCampaign(defaultContinuityDeps)),
  generateBattle: withSchema(GenerateBattlePayloadSchema, (payload) => generateBattle(payload)),
  resolveBattle: withSchema(BattleIdPayloadSchema, (payload) => resolveBattle(payload)),
  // Accepted narrowing (ticket INC-3): the boundary schema only asserts
  // `scriptedOrders` is an array of unknown (a debug-gated seam, ADR-0057); the
  // renderer builds the concrete `RawScriptedForceOrder[]` via
  // `parseScriptedOrders` before sending.
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
 * Lifts a legacy synchronous/promise handler onto the command error channel so
 * the dispatcher has one program shape. A thrown/rejected error becomes an
 * `INTERNAL` `CommandFailed`.
 */
function liftLegacy(
  handler: CampaignCommandHandler,
  payload: unknown,
): Effect.Effect<BridgeResult<unknown>, CommandError> {
  return Effect.tryPromise({
    try: () => Promise.resolve(handler(payload)),
    catch: (error) =>
      new CommandFailed({
        reason: "INTERNAL",
        diagnostics: [error instanceof Error ? error.message : String(error)],
      }),
  });
}

/**
 * Builds the `campaign:execute` dispatcher. It decodes the command name, prefers
 * an Effect {@link CommandProgram}, falls back to the legacy
 * {@link CommandRegistry}, runs the program on the injected runtime, and
 * projects the `Exit` to the frozen `BridgeResult` envelope (INC-1; ADR-0159).
 * Depends on the registry/runtime seams rather than the concrete command set
 * (DIP), so tests can inject both.
 */
export function createCampaignCommandDispatcher(
  registry: CommandRegistry,
  getRuntime: () => ManagedRuntime.ManagedRuntime<CommandEnv, never>,
  programs: Partial<Record<CampaignCommandName, CommandProgram>> = defaultCommandPrograms,
): (command: string, payload: unknown) => Promise<BridgeResult<unknown>> {
  return async (command, payload) => {
    const program = Effect.gen(function* () {
      const parsedCommand = Schema.decodeUnknownResult(CommandNameSchema)(command);
      if (Result.isFailure(parsedCommand)) {
        return yield* new UnknownCommand({ command });
      }

      const commandProgram = programs[parsedCommand.success];
      if (commandProgram !== undefined) {
        return yield* commandProgram(payload);
      }

      const handler = registry[parsedCommand.success];
      if (handler === undefined) {
        return yield* new NotImplemented({ command: parsedCommand.success });
      }

      return yield* liftLegacy(handler, payload);
    });

    const exit = await getRuntime().runPromiseExit(program);
    return projectCommandExit(exit);
  };
}

let commandRuntimeSingleton: ManagedRuntime.ManagedRuntime<CommandEnv, never> | undefined;

/**
 * The process-wide default runtime for the dispatcher. The Electron main process
 * builds and owns its own runtime (disposed on quit); this lazy singleton serves
 * tests and any non-Electron caller of {@link dispatchCampaignCommand}.
 */
export function getDefaultCommandRuntime(): ManagedRuntime.ManagedRuntime<CommandEnv, never> {
  commandRuntimeSingleton ??= ManagedRuntime.make(desktopMainLayer());
  return commandRuntimeSingleton;
}

export const dispatchCampaignCommand = createCampaignCommandDispatcher(
  defaultCommandRegistry,
  getDefaultCommandRuntime,
);
