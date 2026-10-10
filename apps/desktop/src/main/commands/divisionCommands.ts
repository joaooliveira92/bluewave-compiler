import type { CommandBody } from "@bluewave/commands";
import { buildDivisionScreenView } from "@bluewave/campaign-engine";
import { sha256Hex } from "@bluewave/deterministic";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  DivisionCommandBody,
  DivisionCommandOutcome,
  DivisionScreenProjection,
  SubmitDivisionCommandPayload,
} from "../../shared/division-contract.js";
import { getCampaignSession } from "../campaignSessions.js";
import { currentRevision, submitPlayerCommand } from "./playerCommandSupport.js";

/**
 * The Fleet-organization (division editor) bridge commands. Same authority model
 * as diplomacy (`playerCommandSupport.ts`): the desktop only queues a real engine
 * envelope; the engine validates at issue time and is the sole mutator when
 * `commitMonth` applies it.
 */
export async function inspectDivisionScreen(
  sessionId: string,
): Promise<BridgeResult<DivisionScreenProjection>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }
  const view = buildDivisionScreenView(record.state.snapshot, record.playerSlotId);
  if (!view) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${record.playerSlotId} in session ${sessionId}`],
    };
  }
  return {
    outcome: "success",
    value: { ...view, revision: currentRevision(record), month: record.month },
    diagnostics: [],
  };
}

export async function submitDivisionCommand(
  payload: SubmitDivisionCommandPayload,
): Promise<BridgeResult<DivisionCommandOutcome>> {
  return submitPlayerCommand({
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) =>
      planDivisionCommand(
        record.playerSlotId,
        Number(record.state.snapshot.turnNumber),
        payload.command,
      ),
  });
}

/**
 * A deterministic division id from the nation, the turn and the founding ship: the
 * same request in the same turn replays the same id; a different flagship cannot
 * collide. The renderer never supplies ids for new divisions.
 */
export function newDivisionId(nationId: string, turn: number, flagshipShipId: string): string {
  const digest = sha256Hex(`division:${nationId}:${turn}:${flagshipShipId}`);
  return `div_${nationId}_${digest.slice(0, 10)}`;
}

/** Everything one command's wire→engine mapping needs beyond the command itself. */
interface DivisionCommandContext {
  readonly nationId: string;
  readonly turn: number;
}

interface DivisionCommandPlan {
  readonly body: Extract<CommandBody, { type: DivisionCommandBody["type"] }>;
  readonly discriminator: string;
}

/**
 * The per-command descriptor: its idempotency discriminator and its engine body.
 * Keeping BOTH in one entry (rather than a discriminator switch plus a body
 * switch) means a new division command is a single addition — the two can no
 * longer drift out of sync.
 */
interface DivisionCommandDescriptor<T extends DivisionCommandBody> {
  readonly discriminator: (command: T, context: DivisionCommandContext) => string;
  readonly toEngineBody: (
    command: T,
    context: DivisionCommandContext,
  ) => Extract<CommandBody, { type: T["type"] }>;
}

type DivisionCommandPlanner = (
  command: DivisionCommandBody,
  context: DivisionCommandContext,
) => DivisionCommandPlan;

/**
 * Adapts a descriptor for one union member into a uniform planner. The table is
 * keyed by the discriminant and only ever entered via {@link planDivisionCommand}'s
 * `command.type` lookup, so asserting that `command` is member `T` is sound;
 * TypeScript cannot express that correlation across an indexed lookup (same
 * registry discipline as `campaignBridge.ts`).
 */
function planWith<T extends DivisionCommandBody["type"]>(
  descriptor: DivisionCommandDescriptor<Extract<DivisionCommandBody, { type: T }>>,
): DivisionCommandPlanner {
  return (command, context) => {
    const typed = command as Extract<DivisionCommandBody, { type: T }>;
    return {
      body: descriptor.toEngineBody(typed, context),
      discriminator: descriptor.discriminator(typed, context),
    };
  };
}

/** One entry per wire command: its body mapping and idempotency discriminator. */
const DIVISION_COMMANDS: {
  readonly [K in DivisionCommandBody["type"]]: DivisionCommandPlanner;
} = {
  CreateDivision: planWith<"CreateDivision">({
    discriminator: (command, context) =>
      newDivisionId(context.nationId, context.turn, command.flagshipShipId),
    toEngineBody: (command, context) => ({
      type: "CreateDivision",
      nationId: context.nationId,
      divisionId: newDivisionId(context.nationId, context.turn, command.flagshipShipId),
      // The engine founds a division on exactly its first ship (the flagship);
      // other ships join afterwards via AddShipToDivision.
      shipOrder: [command.flagshipShipId],
      divisionRole: command.role,
      preferredFormation: command.formation,
    }),
  }),
  AddShipToDivision: planWith<"AddShipToDivision">({
    discriminator: (command) => `${command.divisionId}\u0000${command.shipId}`,
    toEngineBody: (command, context) => ({
      type: "AddShipToDivision",
      nationId: context.nationId,
      divisionId: command.divisionId,
      shipId: command.shipId,
    }),
  }),
  RemoveShipFromDivision: planWith<"RemoveShipFromDivision">({
    discriminator: (command) => `${command.divisionId}\u0000${command.shipId}`,
    toEngineBody: (command, context) => ({
      type: "RemoveShipFromDivision",
      nationId: context.nationId,
      divisionId: command.divisionId,
      shipId: command.shipId,
    }),
  }),
  ChangeDivisionFlagship: planWith<"ChangeDivisionFlagship">({
    discriminator: (command) => `${command.divisionId}\u0000${command.newFlagshipShipId}`,
    toEngineBody: (command, context) => ({
      type: "ChangeDivisionFlagship",
      nationId: context.nationId,
      divisionId: command.divisionId,
      newFlagshipShipId: command.newFlagshipShipId,
    }),
  }),
  ReorderDivisionShips: planWith<"ReorderDivisionShips">({
    discriminator: (command) => `${command.divisionId}\u0000${command.shipOrder.join(",")}`,
    toEngineBody: (command, context) => ({
      type: "ReorderDivisionShips",
      nationId: context.nationId,
      divisionId: command.divisionId,
      shipOrder: [...command.shipOrder],
    }),
  }),
  DissolveDivision: planWith<"DissolveDivision">({
    discriminator: (command) => command.divisionId,
    toEngineBody: (command, context) => ({
      type: "DissolveDivision",
      nationId: context.nationId,
      divisionId: command.divisionId,
    }),
  }),
};

/** Maps the wire command onto the engine's `CommandBody` and its idempotency
 * discriminator; `nationId`/`turn` always come from the session, never the wire. */
function planDivisionCommand(
  nationId: string,
  turn: number,
  command: DivisionCommandBody,
): DivisionCommandPlan {
  return DIVISION_COMMANDS[command.type](command, { nationId, turn });
}
