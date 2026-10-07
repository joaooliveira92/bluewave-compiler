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
    build: (record) => {
      const nationId = record.playerSlotId;
      const turn = Number(record.state.snapshot.turnNumber);
      return {
        body: engineBodyFor(nationId, turn, payload.command),
        discriminator: discriminatorFor(nationId, turn, payload.command),
      };
    },
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

function discriminatorFor(nationId: string, turn: number, command: DivisionCommandBody): string {
  switch (command.type) {
    case "CreateDivision":
      return newDivisionId(nationId, turn, command.flagshipShipId);
    case "AddShipToDivision":
    case "RemoveShipFromDivision":
      return `${command.divisionId}\u0000${command.shipId}`;
    case "ChangeDivisionFlagship":
      return `${command.divisionId}\u0000${command.newFlagshipShipId}`;
    case "DissolveDivision":
      return command.divisionId;
  }
}

/** Maps the wire command onto the engine's `CommandBody`; `nationId` is always the player slot. */
function engineBodyFor(
  nationId: string,
  turn: number,
  command: DivisionCommandBody,
): Extract<CommandBody, { type: DivisionCommandBody["type"] }> {
  switch (command.type) {
    case "CreateDivision":
      return {
        type: "CreateDivision",
        nationId,
        divisionId: newDivisionId(nationId, turn, command.flagshipShipId),
        // The engine founds a division on exactly its first ship (the flagship);
        // other ships join afterwards via AddShipToDivision.
        shipOrder: [command.flagshipShipId],
        divisionRole: command.role,
        preferredFormation: command.formation,
      };
    case "AddShipToDivision":
      return {
        type: "AddShipToDivision",
        nationId,
        divisionId: command.divisionId,
        shipId: command.shipId,
      };
    case "RemoveShipFromDivision":
      return {
        type: "RemoveShipFromDivision",
        nationId,
        divisionId: command.divisionId,
        shipId: command.shipId,
      };
    case "ChangeDivisionFlagship":
      return {
        type: "ChangeDivisionFlagship",
        nationId,
        divisionId: command.divisionId,
        newFlagshipShipId: command.newFlagshipShipId,
      };
    case "DissolveDivision":
      return { type: "DissolveDivision", nationId, divisionId: command.divisionId };
  }
}
