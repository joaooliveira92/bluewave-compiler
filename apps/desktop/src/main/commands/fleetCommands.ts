import { buildFleetScreenView } from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { FleetScreenProjection } from "../../shared/fleet-contract.js";
import type {
  CancelMovementCommandPayload,
  MovementCommandOutcome,
  ReplaceMovementCommandPayload,
  SubmitMovementCommandPayload,
} from "../../shared/fleet-contract.js";
import type { MovementCommand } from "@bluewave/campaign-engine";
import type { CampaignSessionRecord } from "../campaignSessions.js";
import { getCampaignSession } from "../campaignSessions.js";
import { deletePendingEnvelope, pendingEntries } from "../pendingCommands.js";
import { currentRevision, submitPlayerCommand, verifyEnvelope } from "./playerCommandSupport.js";

/**
 * Fleet screen queries and movement orders (ADR-0062). `inspectFleetScreen` derives the
 * player's real fleets, geography and ports from the session's `CampaignState` (via
 * `@bluewave/campaign-engine`'s pure `buildFleetScreenView`) plus the movement orders
 * currently queued. A movement order is a real engine `MoveFleet` envelope: the engine's
 * own validator decides legality at issue time and `commitMonth` is the sole mutator.
 *
 * One order per fleet: the command id is derived from the turn and the fleet, so
 * submitting again for the same fleet supersedes the earlier order (that is also what
 * "replace" does), and cancel drops it.
 */
export async function inspectFleetScreen(
  sessionId: string,
): Promise<BridgeResult<FleetScreenProjection>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  if (!nation) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${record.playerSlotId} in session ${sessionId}`],
    };
  }

  const view = buildFleetScreenView(record.state.snapshot, record.playerSlotId);

  const projection: FleetScreenProjection = {
    revision: Number(record.state.snapshot.turnNumber),
    month: record.month,
    playerNationId: record.playerSlotId,
    divisions: view.divisions,
    areas: view.areas,
    areaEdges: view.areaEdges,
    ports: view.ports,
    movementCommands: queuedMovementCommands(record),
  };

  return { outcome: "success", value: projection, diagnostics: [] };
}

/** The `MoveFleet` orders waiting for the next month, as the Fleet screen lists them. */
function queuedMovementCommands(record: CampaignSessionRecord): MovementCommand[] {
  const snapshot = record.state.snapshot;
  const commands: MovementCommand[] = [];
  for (const entry of pendingEntries(record.sessionId)) {
    const body = entry.envelope.body;
    if (body.type !== "MoveFleet") continue;
    const fleet = snapshot.nations
      .get(record.playerSlotId)
      ?.fleets.find((candidate) => candidate.id === body.fleetId);
    commands.push({
      commandId: entry.envelope.commandId,
      divisionId: body.fleetId,
      fromAreaId: fleet?.locationAreaId ?? "",
      toAreaId: body.toAreaId,
      status: "submitted",
      submittedAtRevision: currentRevision(record),
    });
  }
  return commands;
}

function outcomeFor(
  sessionId: string,
  commandId: string,
  status: "submitted" | "cancelled",
): BridgeResult<MovementCommandOutcome> {
  const record = getCampaignSession(sessionId);
  return {
    outcome: "success",
    value: {
      workspace: { movementCommands: record ? queuedMovementCommands(record) : [] },
      command: { commandId, status },
    },
    diagnostics: [],
  };
}

export async function submitMovementCommand(
  payload: SubmitMovementCommandPayload,
): Promise<BridgeResult<MovementCommandOutcome>> {
  const result = await submitPlayerCommand({
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "MoveFleet",
        nationId: record.playerSlotId,
        fleetId: payload.divisionId,
        toAreaId: payload.toAreaId,
      },
      discriminator: payload.divisionId,
    }),
  });
  if (result.outcome !== "success") return result;
  // One order per fleet: drop any earlier order for the same fleet (same command id).
  for (const entry of pendingEntries(payload.sessionId)) {
    if (
      entry.envelope.commandId === result.value.commandId &&
      entry.transportRequestId !== payload.transportRequestId
    ) {
      deletePendingEnvelope(payload.sessionId, entry.transportRequestId);
    }
  }
  return outcomeFor(payload.sessionId, result.value.commandId, "submitted");
}

export async function replaceMovementCommand(
  payload: ReplaceMovementCommandPayload,
): Promise<BridgeResult<MovementCommandOutcome>> {
  const verified = verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const existing = pendingEntries(payload.sessionId).some(
    (entry) => entry.envelope.commandId === payload.commandId,
  );
  if (!existing) {
    return {
      outcome: "rejected",
      reason: "COMMAND_NOT_FOUND",
      diagnostics: [`No pending movement command ${payload.commandId}`],
    };
  }
  return submitMovementCommand(payload);
}

export async function cancelMovementCommand(
  payload: CancelMovementCommandPayload,
): Promise<BridgeResult<MovementCommandOutcome>> {
  const verified = verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const matches = pendingEntries(payload.sessionId).filter(
    (entry) =>
      entry.envelope.commandId === payload.commandId && entry.envelope.body.type === "MoveFleet",
  );
  if (matches.length === 0) {
    return {
      outcome: "rejected",
      reason: "COMMAND_NOT_FOUND",
      diagnostics: [`No pending movement command ${payload.commandId}`],
    };
  }
  for (const entry of matches) deletePendingEnvelope(payload.sessionId, entry.transportRequestId);
  return outcomeFor(payload.sessionId, payload.commandId, "cancelled");
}
