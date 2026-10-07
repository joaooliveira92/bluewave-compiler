import type { CommandBody } from "@bluewave/commands";
import { buildDiplomacyScreenProjection } from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  DiplomacyCommandBody,
  DiplomacyCommandOutcome,
  DiplomacyScreenProjection,
  SubmitDiplomacyCommandPayload,
} from "../../shared/diplomacy-contract.js";
import { getCampaignSession } from "../campaignSessions.js";
import { currentRevision, submitPlayerCommand } from "./playerCommandSupport.js";

/**
 * The Diplomacy & War screen's two bridge commands
 * (desktop-diplomacy-war INC-1/INC-2), following the exact
 * `researchCommands.ts` conventions: session lookup (`SESSION_NOT_FOUND`),
 * `expectedRevision` against `snapshot.turnNumber` (`REVISION_MISMATCH` with
 * the session untouched), deterministic envelope construction, and
 * `transportRequestId` idempotency.
 *
 * Authority (spec D1): the desktop ONLY queues a real engine envelope
 * through the shared per-session command queue (`pendingCommands.ts`, drained
 * by `commitMonth`); the engine (`MonthExecutor` command_collection, order
 * 6.5 diplomacy phase) is the sole mutator of politics/wars/blockades.
 * Issue-time validity is the ENGINE's own `CommandLifecycle.validate()` —
 * never a hand-mirror — so an invalid request surfaces the engine's stable
 * code + message verbatim (e.g. `ALREADY_AT_WAR`, `DECLARE_WAR_INVALID_TARGET`,
 * `BLOCKADE_NOT_AT_WAR`) and leaves the session/queue untouched.
 */
export async function inspectDiplomacyScreen(
  sessionId: string,
): Promise<BridgeResult<DiplomacyScreenProjection>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const projection = buildDiplomacyScreenProjection(
    record.state,
    record.playerSlotId,
    record.month,
  );
  if (!projection) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${record.playerSlotId} in session ${sessionId}`],
    };
  }

  return {
    outcome: "success",
    value: { ...projection, revision: currentRevision(record), month: record.month },
    diagnostics: [],
  };
}

export async function submitDiplomacyCommand(
  payload: SubmitDiplomacyCommandPayload,
): Promise<BridgeResult<DiplomacyCommandOutcome>> {
  return submitPlayerCommand({
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: engineBodyFor(record.playerSlotId, payload.command),
      discriminator: discriminatorFor(payload.command),
    }),
  });
}

/** The command-specific part of the idempotency identity — the nontrivial
 * operand (target / partner / war / area). Deterministic, mirrors the body. */
function discriminatorFor(command: DiplomacyCommandBody): string {
  switch (command.type) {
    case "DeclareWar":
      return command.targetNationId;
    case "AcceptPeace":
      return command.warId;
    case "FormAlliance":
    case "BreakAlliance":
    case "FormNonAggressionPact":
    case "BreakNonAggressionPact":
      return command.partnerNationId;
    case "DeclareBlockade":
      return `${command.targetNationId}\u0000${command.areaId}`;
  }
}

/** Maps the wire command onto the engine's own `CommandBody` — `nationId` is
 * always the session's player slot, never on the wire. */
function engineBodyFor(
  playerSlotId: string,
  command: DiplomacyCommandBody,
): Extract<CommandBody, { type: DiplomacyCommandBody["type"] }> {
  switch (command.type) {
    case "DeclareWar":
      return {
        type: "DeclareWar",
        nationId: playerSlotId,
        targetNationId: command.targetNationId,
        ...(command.warGoalsId !== undefined ? { warGoalsId: command.warGoalsId } : {}),
      };
    case "AcceptPeace":
      return { type: "AcceptPeace", nationId: playerSlotId, warId: command.warId };
    case "FormAlliance":
      return {
        type: "FormAlliance",
        nationId: playerSlotId,
        partnerNationId: command.partnerNationId,
      };
    case "BreakAlliance":
      return {
        type: "BreakAlliance",
        nationId: playerSlotId,
        partnerNationId: command.partnerNationId,
      };
    case "FormNonAggressionPact":
      return {
        type: "FormNonAggressionPact",
        nationId: playerSlotId,
        partnerNationId: command.partnerNationId,
      };
    case "BreakNonAggressionPact":
      return {
        type: "BreakNonAggressionPact",
        nationId: playerSlotId,
        partnerNationId: command.partnerNationId,
      };
    case "DeclareBlockade":
      return {
        type: "DeclareBlockade",
        nationId: playerSlotId,
        targetNationId: command.targetNationId,
        areaId: command.areaId,
      };
  }
}
