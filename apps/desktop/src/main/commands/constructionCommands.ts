import {
  buildConstructionDesignCatalog,
  buildConstructionProjectQueue,
  type ConstructionCommandStatus,
} from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  CancelConstructionCommandPayload,
  ConstructionCommandOutcome,
  ConstructionScreenProjection,
  ReplaceConstructionCommandPayload,
  SubmitConstructionCommandPayload,
} from "../../shared/construction-contract.js";
import { getCampaignSession } from "../campaignSessions.js";
import {
  CONSTRUCTION_SETTLEMENT_BRANCH_ID,
  acceptConstructionRecord,
  constructionEconomy,
  getConstructionWorkspace,
  settleAndRelease,
  syncReservationPools,
  withRecordStatus,
  workspaceView,
  type ConstructionWorkspace,
} from "../constructionWorkspace.js";
import { forecastCostOf } from "../construction/commandRecord.js";
import { verifyEnvelope } from "./commandEnvelope.js";
import { deriveConstructionCommandId } from "./construction/command-id.js";
import { isTerminal, uiStatusFor } from "./construction/command-status.js";
import { resolveUiDesign, toUiCommand } from "./construction/command-view.js";
import { placeOrderFor } from "./construction/design-validation.js";
import { replayIdempotent } from "./construction/idempotency.js";
import {
  canReserveReplacement,
  reserveForOrder,
  restoreInFlight,
} from "./construction/reservations.js";
import { removeProjectForCommand } from "./construction/snapshot-mutations.js";
import { constructionSnapshotStore } from "./construction/snapshot-store.js";

/**
 * The Construction screen's four real commands (desktop-mvp ticket 14).
 *
 * This module is deliberately thin: it owns only the command FLOW — session
 * envelope verification, the F2 ordering of validate/reserve/persist/bookkeep,
 * and the per-command supersession/cancellation semantics. Every supporting
 * concern lives in `commands/construction/`:
 * - `command-id`          deterministic per-payload command ids
 * - `idempotency`         transportRequestId replay / conflict
 * - `design-validation`   design-exists-and-belongs-to-player
 * - `reservations`        treasury/capacity holds, replace preflight, rollback
 * - `command-view`        UI-facing command rows and status mapping
 * - `snapshot-mutations`  pure queued-project add/remove edits
 * - `snapshot-store`      the authoritative persistence seam (DIP)
 *
 * Each command follows the exact `commitMonth`/`inspectCampaign` conventions:
 * session lookup, `expectedRevision` against `snapshot.turnNumber` (a mismatch
 * returns REVISION_MISMATCH with the session untouched), and envelope
 * recomputation + `toSaveableState` + `SaveStore.save` + session
 * re-registration on every authoritative mutation (behind `snapshot-store`).
 */

// ---------------------------------------------------------------------------
// inspectConstructionScreen
// ---------------------------------------------------------------------------

export async function inspectConstructionScreen(
  sessionId: string,
): Promise<BridgeResult<ConstructionScreenProjection>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const workspace = getConstructionWorkspace(record);
  syncReservationPools(workspace, record);

  const projection: ConstructionScreenProjection = {
    revision: Number(record.state.snapshot.turnNumber),
    month: record.month,
    economy: constructionEconomy(record),
    designs: buildConstructionDesignCatalog(record.state.snapshot, record.playerSlotId),
    projects: buildConstructionProjectQueue(record.state.snapshot, record.playerSlotId),
    workspace: workspaceView(workspace),
  };

  return { outcome: "success", value: projection, diagnostics: [] };
}

// ---------------------------------------------------------------------------
// submitConstructionCommand
// ---------------------------------------------------------------------------

export async function submitConstructionCommand(
  payload: SubmitConstructionCommandPayload,
): Promise<BridgeResult<ConstructionCommandOutcome>> {
  const verified = verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  const workspace = getConstructionWorkspace(record);
  const commandId = deriveConstructionCommandId(
    payload.transportRequestId,
    payload.designId,
    payload.expectedRevision,
  );

  // Idempotent retry: the same transportRequestId was already processed —
  // replay its outcome instead of double-ordering.
  const replayed = replayIdempotent(workspace, payload.transportRequestId, commandId);
  if (replayed) return replayed;

  // The engine-side policy decides (ownership, revalidation, auxiliary limits) and builds the project; this layer
  // only orchestrates reservations and persistence around it (ADR-0088).
  const placed = placeOrderFor(record, commandId, payload.designId);
  if (!placed.ok) return placed.result;
  const costs = placed.costs;

  const recordCreated = acceptConstructionRecord(
    workspace,
    record,
    commandId,
    payload.transportRequestId,
    payload.expectedRevision,
    payload.designId,
    costs.projectedCost,
    costs.projectedCapacityUnits,
  );

  const reserved = reserveForOrder(workspace, record, recordCreated, costs);
  if (!reserved.ok) {
    // Rejected before any snapshot mutation, reservation, or ledger entry —
    // the workspace is untouched.
    return {
      outcome: "rejected",
      reason: reserved.reasonCode,
      diagnostics: reserved.diagnostics,
    };
  }

  const accepted = { ...recordCreated, reservationRecordIds: reserved.recordIds };
  const uiDesign = resolveUiDesign(record, payload.designId);

  // Authoritative mutation first, THEN the in-memory bookkeeping: if the
  // persist fails, the workspace has only the (rolled-back) pool reservation
  // and the command reports SAVE_FAILED with no record/command/idempotency
  // entry — no partial in-memory state is persisted under a failure (F2).
  const persisted = constructionSnapshotStore.persist(record, () => placed.snapshot);
  if (!persisted.ok) {
    workspace.release(commandId);
    return persisted.result;
  }

  workspace.putRecord(accepted);
  workspace.rememberIdempotent(accepted);
  workspace.appendCommand(
    toUiCommand({
      recordRef: accepted,
      designId: payload.designId,
      design: uiDesign,
      projectedCost: costs.projectedCost,
      projectedCapacityUnits: costs.projectedCapacityUnits,
      submittedAtRevision: Number(record.state.snapshot.turnNumber),
    }),
  );
  workspace.appendLedger({
    type: "success",
    commandId,
    snapshotHash: record.state.rawHash,
    result: { status: accepted.status, designId: payload.designId },
  });

  return commandSuccess(workspace, commandId, uiStatusFor(accepted));
}

// ---------------------------------------------------------------------------
// replaceConstructionCommand
// ---------------------------------------------------------------------------

export async function replaceConstructionCommand(
  payload: ReplaceConstructionCommandPayload,
): Promise<BridgeResult<ConstructionCommandOutcome>> {
  const verified = verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  const workspace = getConstructionWorkspace(record);
  const newCommandId = deriveConstructionCommandId(
    payload.transportRequestId,
    payload.designId,
    payload.expectedRevision,
  );

  // Idempotent retry of the replace itself — the replacement command (created
  // below) is stored under the replace's transportRequestId.
  const replaceReplay = replayIdempotent(workspace, payload.transportRequestId, newCommandId);
  if (replaceReplay) return replaceReplay;

  const target = workspace.getRecord(payload.commandId);
  if (!target) {
    return {
      outcome: "rejected",
      reason: "COMMAND_NOT_FOUND",
      diagnostics: [`No command ${payload.commandId} in session ${payload.sessionId}`],
    };
  }
  if (isTerminal(target)) {
    return {
      outcome: "rejected",
      reason: "COMMAND_NOT_IN_FLIGHT",
      diagnostics: [
        `Command ${payload.commandId} is ${target.status}; only in-flight commands can be replaced`,
      ],
    };
  }

  // F2 — failure-atomic replace: BOTH rejectable conditions of the
  // replacement (unknown/foreign design, unaffordable reservation) are
  // checked BEFORE the original is superseded, so a rejected replace leaves
  // the original exactly as it was (in-flight, project queued, no extra
  // save). The single snapshot persist below then removes the original's
  // project AND queues the replacement's in ONE SaveStore.save.
  const placed = placeOrderFor(record, newCommandId, payload.designId, payload.commandId);
  if (!placed.ok) return placed.result;
  const costs = placed.costs;

  const affordable = canReserveReplacement(workspace, record, payload.commandId, costs);
  if (!affordable.ok) {
    return {
      outcome: "rejected",
      reason: affordable.reasonCode,
      diagnostics: affordable.diagnostics,
    };
  }

  // In-memory supersession of the original (nothing persisted yet).
  const superseded = withRecordStatus(target, "SUPERSEDED");
  const settlement = settleAndRelease(
    workspace,
    superseded,
    "supersession",
    forecastCostOf(superseded),
  );
  const supersededRecord = {
    ...superseded,
    settlementRecord: settlement,
    supersededByCommandId: newCommandId,
  };
  workspace.putRecord(supersededRecord);
  workspace.setCommandStatus(payload.commandId, "superseded");

  // In-memory acceptance of the replacement (reservation confirmed by the
  // preflight above; the original's release already freed its hold).
  const recordCreated = acceptConstructionRecord(
    workspace,
    record,
    newCommandId,
    payload.transportRequestId,
    payload.expectedRevision,
    payload.designId,
    costs.projectedCost,
    costs.projectedCapacityUnits,
  );
  const reserved = reserveForOrder(workspace, record, recordCreated, costs);
  if (!reserved.ok) {
    // Defensive only — the preflight made this unreachable. Restore the
    // original to in-flight before reporting the rejection.
    restoreInFlight(workspace, target);
    return {
      outcome: "rejected",
      reason: reserved.reasonCode,
      diagnostics: reserved.diagnostics,
    };
  }
  const accepted = { ...recordCreated, reservationRecordIds: reserved.recordIds };
  const uiDesign = resolveUiDesign(record, payload.designId);

  // The ONE authoritative persist: original's project out, replacement's in.
  const persisted = constructionSnapshotStore.persist(record, () => placed.snapshot);
  if (!persisted.ok) {
    // Roll the whole supersession back: the original is in-flight again with
    // its reservation re-held, the replacement leaves no trace, and the
    // session is exactly as it was (nothing was persisted).
    restoreInFlight(workspace, target);
    workspace.release(newCommandId);
    return persisted.result;
  }

  workspace.putRecord(accepted);
  workspace.rememberIdempotent(accepted);
  workspace.appendCommand(
    toUiCommand({
      recordRef: accepted,
      designId: payload.designId,
      design: uiDesign,
      projectedCost: costs.projectedCost,
      projectedCapacityUnits: costs.projectedCapacityUnits,
      submittedAtRevision: Number(record.state.snapshot.turnNumber),
    }),
  );
  workspace.appendLedger({
    type: "success",
    commandId: payload.commandId,
    snapshotHash: record.state.rawHash,
    result: { status: "SUPERSEDED", supersededBy: newCommandId },
  });
  workspace.appendLedger({
    type: "success",
    commandId: newCommandId,
    snapshotHash: record.state.rawHash,
    result: { status: accepted.status, designId: payload.designId },
  });

  return commandSuccess(workspace, newCommandId, uiStatusFor(accepted));
}

// ---------------------------------------------------------------------------
// cancelConstructionCommand
// ---------------------------------------------------------------------------

export async function cancelConstructionCommand(
  payload: CancelConstructionCommandPayload,
): Promise<BridgeResult<ConstructionCommandOutcome>> {
  const verified = verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  const workspace = getConstructionWorkspace(record);

  // Idempotent retry: the cancelled record itself is stored under the cancel
  // request's transportRequestId.
  const cancelReplay = replayIdempotent(workspace, payload.transportRequestId, payload.commandId);
  if (cancelReplay) return cancelReplay;

  const target = workspace.getRecord(payload.commandId);
  if (!target) {
    return {
      outcome: "rejected",
      reason: "COMMAND_NOT_FOUND",
      diagnostics: [`No command ${payload.commandId} in session ${payload.sessionId}`],
    };
  }
  if (isTerminal(target)) {
    return {
      outcome: "rejected",
      reason: "COMMAND_NOT_IN_FLIGHT",
      diagnostics: [
        `Command ${payload.commandId} is already ${target.status}; only in-flight commands can be cancelled`,
      ],
    };
  }

  const cancelled = withRecordStatus(target, "CANCELLED");
  const settlement = settleAndRelease(
    workspace,
    cancelled,
    CONSTRUCTION_SETTLEMENT_BRANCH_ID,
    forecastCostOf(cancelled),
  );
  const cancelledRecord = { ...cancelled, settlementRecord: settlement };
  workspace.putRecord(cancelledRecord);
  workspace.setCommandStatus(payload.commandId, "cancelled");

  // Authoritative mutation first (F2): if the persist fails, the in-memory
  // cancellation is rolled back — the record is in-flight again with its
  // reservation re-held — so the workspace can never report a cancellation
  // the package doesn't reflect. Idempotency/ledger entries are written only
  // after the save succeeded.
  const removed = constructionSnapshotStore.persist(record, (snapshot) =>
    removeProjectForCommand(snapshot, record.playerSlotId, payload.commandId),
  );
  if (!removed.ok) {
    restoreInFlight(workspace, target);
    return removed.result;
  }

  workspace.rememberIdempotent(cancelledRecord);
  workspace.appendLedger({
    type: "success",
    commandId: payload.commandId,
    snapshotHash: record.state.rawHash,
    result: { status: "CANCELLED" },
  });

  return commandSuccess(workspace, payload.commandId, "cancelled");
}

// ---------------------------------------------------------------------------
// flow helpers
// ---------------------------------------------------------------------------

/** The one success shape every mutating command returns. */
function commandSuccess(
  workspace: ConstructionWorkspace,
  commandId: string,
  status: ConstructionCommandStatus,
): BridgeResult<ConstructionCommandOutcome> {
  return {
    outcome: "success",
    value: {
      command: { commandId, status },
      workspace: workspaceView(workspace),
    },
    diagnostics: [],
  };
}
