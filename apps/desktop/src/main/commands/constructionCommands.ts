import type {
  CampaignSnapshot,
  CampaignState,
  CompiledDesignVersion as EngineCompiledDesignVersion,
  ConstructionProject,
} from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import {
  buildConstructionDesignCatalog,
  buildConstructionProjectQueue,
  constructionProjectIdForCommand,
  projectedConstructionOrderCosts,
  type CompiledDesignVersion,
  type ConstructionCommand,
  type ConstructionCommandStatus,
} from "@bluewave/campaign-engine";
import { createEnvelope, sha256Hex, canonicalSerialize } from "@bluewave/deterministic";
import { SaveStore } from "@bluewave/persistence";
import type {
  CancelConstructionCommandPayload,
  ConstructionCommandOutcome,
  ConstructionScreenProjection,
  ReplaceConstructionCommandPayload,
  SubmitConstructionCommandPayload,
} from "../../shared/construction-contract.js";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { CommandRecord } from "@bluewave/commands";
import type { CampaignSessionRecord } from "../campaignSessions.js";
import { getCampaignSession, registerCampaignSession } from "../campaignSessions.js";
import { toSaveableState } from "../saveHelpers.js";
import {
  CONSTRUCTION_COMMAND_DEFINITION,
  CONSTRUCTION_SETTLEMENT_BRANCH_ID,
  acceptConstructionRecord,
  constructionEconomy,
  getConstructionWorkspace,
  reservationRequirementsFor,
  settleAndRelease,
  syncReservationPools,
  uiStatusFor,
  withRecordStatus,
  workspaceView,
  type ConstructionWorkspace,
} from "../constructionWorkspace.js";

/**
 * The Construction screen's four real commands (desktop-mvp ticket 14), wired
 * to `packages/commands`'s real command-lifecycle machinery through
 * `constructionWorkspace.ts`. Each command follows the exact
 * `commitMonth`/`inspectCampaign` conventions: session lookup, `expectedRevision`
 * against `snapshot.turnNumber` (a mismatch returns REVISION_MISMATCH with the
 * session untouched), and envelope recomputation + `toSaveableState` +
 * `SaveStore.save` + session re-registration on every authoritative mutation.
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
  const verified = await verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  const workspace = getConstructionWorkspace(record);
  const commandId = commandIdFor(
    payload.transportRequestId,
    payload.designId,
    payload.expectedRevision,
  );

  // Idempotent retry: the same transportRequestId was already processed —
  // replay its outcome instead of double-ordering.
  const replayed = replayIdempotent(workspace, payload.transportRequestId, commandId);
  if (replayed) return replayed;

  const design = record.state.snapshot.designs.get(payload.designId);
  if (!design) {
    return {
      outcome: "rejected",
      reason: "UNKNOWN_DESIGN",
      diagnostics: [`No design ${payload.designId} in the compiled snapshot`],
    };
  }
  if (design.nationId !== record.playerSlotId) {
    return {
      outcome: "rejected",
      reason: "DESIGN_NOT_FOR_PLAYER",
      diagnostics: [
        `Design ${payload.designId} belongs to ${design.nationId}, not player slot ${record.playerSlotId}`,
      ],
    };
  }

  const costs = projectedConstructionOrderCosts(design);

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
  const uiDesign = buildUiDesign(record, payload.designId);

  // Authoritative mutation first, THEN the in-memory bookkeeping: if the
  // persist fails, the workspace has only the (rolled-back) pool reservation
  // and the command reports SAVE_FAILED with no record/command/idempotency
  // entry — no partial in-memory state is persisted under a failure (F2).
  const project = constructionProjectFor(
    commandId,
    payload.designId,
    costs.projectedCost,
    record.month,
  );
  const persisted = persistSnapshotMutation(record, (snapshot) =>
    addProjectToNation(snapshot, record.playerSlotId, project),
  );
  if (!persisted.ok) {
    workspace.reservations.release(commandId);
    return persisted.result;
  }

  workspace.records.set(commandId, accepted);
  workspace.idempotency.set(CONSTRUCTION_COMMAND_DEFINITION, accepted);
  workspace.commands.push(
    makeUiCommand(
      accepted,
      payload.designId,
      uiDesign,
      costs.projectedCost,
      costs.projectedCapacityUnits,
      Number(record.state.snapshot.turnNumber),
    ),
  );
  workspace.ledger.add({
    type: "success",
    commandId,
    snapshotHash: record.state.rawHash,
    result: { status: accepted.status, designId: payload.designId },
  });

  return {
    outcome: "success",
    value: {
      command: { commandId, status: uiStatusFor(accepted) },
      workspace: workspaceView(workspace),
    },
    diagnostics: [],
  };
}

// ---------------------------------------------------------------------------
// replaceConstructionCommand
// ---------------------------------------------------------------------------

export async function replaceConstructionCommand(
  payload: ReplaceConstructionCommandPayload,
): Promise<BridgeResult<ConstructionCommandOutcome>> {
  const verified = await verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  const workspace = getConstructionWorkspace(record);
  const newCommandId = commandIdFor(
    payload.transportRequestId,
    payload.designId,
    payload.expectedRevision,
  );

  // Idempotent retry of the replace itself — the replacement command (created
  // below) is stored under the replace's transportRequestId.
  const replaceReplay = replayIdempotent(workspace, payload.transportRequestId, newCommandId);
  if (replaceReplay) return replaceReplay;

  const target = workspace.records.get(payload.commandId);
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
  const valid = validateDesignForPlayer(record, payload.designId);
  if (!valid.ok) return valid.result;
  const costs = projectedConstructionOrderCosts(valid.design);

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
  workspace.records.set(payload.commandId, supersededRecord);
  setUiCommandStatus(workspace, payload.commandId, "superseded");

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
    restoreInFlight(workspace, record, target);
    return {
      outcome: "rejected",
      reason: reserved.reasonCode,
      diagnostics: reserved.diagnostics,
    };
  }
  const accepted = { ...recordCreated, reservationRecordIds: reserved.recordIds };
  const uiDesign = buildUiDesign(record, payload.designId);

  // The ONE authoritative persist: original's project out, replacement's in.
  const replacementProject = constructionProjectFor(
    newCommandId,
    payload.designId,
    costs.projectedCost,
    record.month,
  );
  const persisted = persistSnapshotMutation(record, (snapshot) =>
    addProjectToNation(
      removeProjectForCommand(snapshot, record.playerSlotId, payload.commandId),
      record.playerSlotId,
      replacementProject,
    ),
  );
  if (!persisted.ok) {
    // Roll the whole supersession back: the original is in-flight again with
    // its reservation re-held, the replacement leaves no trace, and the
    // session is exactly as it was (nothing was persisted).
    restoreInFlight(workspace, record, target);
    workspace.reservations.release(newCommandId);
    return persisted.result;
  }

  workspace.records.set(newCommandId, accepted);
  workspace.idempotency.set(CONSTRUCTION_COMMAND_DEFINITION, accepted);
  workspace.commands.push(
    makeUiCommand(
      accepted,
      payload.designId,
      uiDesign,
      costs.projectedCost,
      costs.projectedCapacityUnits,
      Number(record.state.snapshot.turnNumber),
    ),
  );
  workspace.ledger.add({
    type: "success",
    commandId: payload.commandId,
    snapshotHash: record.state.rawHash,
    result: { status: "SUPERSEDED", supersededBy: newCommandId },
  });
  workspace.ledger.add({
    type: "success",
    commandId: newCommandId,
    snapshotHash: record.state.rawHash,
    result: { status: accepted.status, designId: payload.designId },
  });

  return {
    outcome: "success",
    value: {
      command: { commandId: newCommandId, status: uiStatusFor(accepted) },
      workspace: workspaceView(workspace),
    },
    diagnostics: [],
  };
}

// ---------------------------------------------------------------------------
// cancelConstructionCommand
// ---------------------------------------------------------------------------

export async function cancelConstructionCommand(
  payload: CancelConstructionCommandPayload,
): Promise<BridgeResult<ConstructionCommandOutcome>> {
  const verified = await verifyEnvelope(payload.sessionId, payload.expectedRevision);
  if (verified.outcome !== "success") return verified;
  const record = verified.record;

  const workspace = getConstructionWorkspace(record);

  // Idempotent retry: the cancelled record itself is stored under the cancel
  // request's transportRequestId.
  const cancelReplay = replayIdempotent(workspace, payload.transportRequestId, payload.commandId);
  if (cancelReplay) return cancelReplay;

  const target = workspace.records.get(payload.commandId);
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
  workspace.records.set(payload.commandId, cancelledRecord);
  setUiCommandStatus(workspace, payload.commandId, "cancelled");

  // Authoritative mutation first (F2): if the persist fails, the in-memory
  // cancellation is rolled back — the record is in-flight again with its
  // reservation re-held — so the workspace can never report a cancellation
  // the package doesn't reflect. Idempotency/ledger entries are written only
  // after the save succeeded.
  const removed = persistSnapshotMutation(record, (snapshot) =>
    removeProjectForCommand(snapshot, record.playerSlotId, payload.commandId),
  );
  if (!removed.ok) {
    restoreInFlight(workspace, record, target);
    return removed.result;
  }

  workspace.idempotency.set(CONSTRUCTION_COMMAND_DEFINITION, cancelledRecord);
  workspace.ledger.add({
    type: "success",
    commandId: payload.commandId,
    snapshotHash: record.state.rawHash,
    result: { status: "CANCELLED" },
  });

  return {
    outcome: "success",
    value: {
      command: { commandId: payload.commandId, status: "cancelled" },
      workspace: workspaceView(workspace),
    },
    diagnostics: [],
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

type EnvelopeVerification =
  | { outcome: "success"; record: CampaignSessionRecord }
  | {
      outcome: "rejected";
      reason: string;
      diagnostics: readonly string[];
      currentRevision?: number;
    }
  | { outcome: "error"; reason: string; diagnostics: readonly string[] };

async function verifyEnvelope(
  sessionId: string,
  expectedRevision: number,
): Promise<EnvelopeVerification> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }
  const currentRevision = Number(record.state.snapshot.turnNumber);
  if (expectedRevision !== currentRevision) {
    return {
      outcome: "rejected",
      reason: "REVISION_MISMATCH",
      diagnostics: [
        `Expected revision ${expectedRevision} but session ${sessionId} is at revision ${currentRevision}`,
      ],
      currentRevision,
    };
  }
  return { outcome: "success", record };
}

function commandIdFor(
  transportRequestId: string,
  designId: string,
  expectedRevision: number,
): string {
  // Deterministic per payload: a retry of the SAME request reproduces the
  // same id (idempotent replay), while reusing a transportRequestId with a
  // DIFFERENT payload produces a different id -> IDEMPOTENCY_CONFLICT instead
  // of silently serving the wrong order.
  const fingerprint = sha256Hex(canonicalSerialize({ designId, expectedRevision })).slice(0, 8);
  return `cmd-${transportRequestId}-${fingerprint}`;
}

function replayIdempotent(
  workspace: ConstructionWorkspace,
  transportRequestId: string,
  commandId: string,
): BridgeResult<ConstructionCommandOutcome> | undefined {
  const existing = workspace.idempotency.get(CONSTRUCTION_COMMAND_DEFINITION, transportRequestId);
  if (!existing) return undefined;
  if (existing.commandId !== commandId) {
    return {
      outcome: "rejected",
      reason: "IDEMPOTENCY_CONFLICT",
      diagnostics: [
        `transportRequestId ${transportRequestId} was already used by command ${existing.commandId}`,
      ],
    };
  }
  return {
    outcome: "success",
    value: {
      command: { commandId: existing.commandId, status: uiStatusFor(existing) },
      workspace: workspaceView(workspace),
    },
    diagnostics: [],
  };
}

function reserveForOrder(
  workspace: ConstructionWorkspace,
  record: CampaignSessionRecord,
  recordRef: CommandRecord,
  costs: { projectedCost: number; projectedCapacityUnits: number },
): { ok: true; recordIds: string[] } | { ok: false; reasonCode: string; diagnostics: string[] } {
  syncReservationPools(workspace, record);
  const result = workspace.reservations.reserve(
    recordRef,
    reservationRequirementsFor(record.playerSlotId, costs),
    "construction_submission",
  );
  if (result.ok)
    return { ok: true, recordIds: result.records.map((reservation) => reservation.reservationId) };
  const reasonCode =
    result.reasonCode === "INSUFFICIENT_FUNDS" || result.reasonCode === "INSUFFICIENT_CAPACITY"
      ? result.reasonCode
      : "RESERVATION_FAILED";
  return {
    ok: false,
    reasonCode,
    diagnostics: [
      `${result.reasonCode}: could not reserve ${result.failedResource} for construction order ${recordRef.commandId}`,
    ],
  };
}

/** Validate that `designId` exists in the compiled snapshot and belongs to
 * the player's nation — the exact checks the submit path performs, extracted
 * so replace can run them BEFORE mutating (F2). */
function validateDesignForPlayer(
  record: CampaignSessionRecord,
  designId: string,
):
  | { ok: true; design: EngineCompiledDesignVersion }
  | { ok: false; result: BridgeResult<ConstructionCommandOutcome> } {
  const design = record.state.snapshot.designs.get(designId);
  if (!design) {
    return {
      ok: false,
      result: {
        outcome: "rejected",
        reason: "UNKNOWN_DESIGN",
        diagnostics: [`No design ${designId} in the compiled snapshot`],
      },
    };
  }
  if (design.nationId !== record.playerSlotId) {
    return {
      ok: false,
      result: {
        outcome: "rejected",
        reason: "DESIGN_NOT_FOR_PLAYER",
        diagnostics: [
          `Design ${designId} belongs to ${design.nationId}, not player slot ${record.playerSlotId}`,
        ],
      },
    };
  }
  return { ok: true, design };
}

/**
 * F2 preflight: would the replacement's reservation fit once the original's
 * supersession releases its hold? Mirrors `ReservationManager.reserve`'s own
 * affordability check (`pool.available - totalReserved >= quantity`), run
 * against the CURRENT pools with the original's released hold counted as
 * available — so a rejected replace never mutates or persists anything.
 */
function canReserveReplacement(
  workspace: ConstructionWorkspace,
  record: CampaignSessionRecord,
  originalCommandId: string,
  costs: { projectedCost: number; projectedCapacityUnits: number },
): { ok: true } | { ok: false; reasonCode: string; diagnostics: string[] } {
  syncReservationPools(workspace, record);
  const checks: Array<{
    resourceTypeId: "TREASURY" | "CAPACITY";
    quantity: number;
    failCode: "INSUFFICIENT_FUNDS" | "INSUFFICIENT_CAPACITY";
    label: string;
  }> = [
    {
      resourceTypeId: "TREASURY",
      quantity: costs.projectedCost,
      failCode: "INSUFFICIENT_FUNDS",
      label: "treasury",
    },
    {
      resourceTypeId: "CAPACITY",
      quantity: costs.projectedCapacityUnits,
      failCode: "INSUFFICIENT_CAPACITY",
      label: "shipyard capacity",
    },
  ];
  for (const check of checks) {
    const pool = resourcePoolFor(workspace, check.resourceTypeId);
    const totalReserved = [...pool.reserved.values()].reduce((sum, reserved) => sum + reserved, 0);
    const originalHeld = pool.reserved.get(originalCommandId) ?? 0;
    const availableForReplacement = pool.available - (totalReserved - originalHeld);
    if (availableForReplacement < check.quantity) {
      return {
        ok: false,
        reasonCode: check.failCode,
        diagnostics: [
          `${check.failCode}: replacement needs ${check.quantity} ${check.label}; only ${Math.max(0, availableForReplacement)} would be available after releasing ${originalCommandId}'s hold`,
        ],
      };
    }
  }
  return { ok: true };
}

function resourcePoolFor(
  workspace: ConstructionWorkspace,
  resourceTypeId: "TREASURY" | "CAPACITY",
): import("@bluewave/commands").ResourcePool {
  return resourceTypeId === "TREASURY" ? workspace.treasuryPool : workspace.capacityPool;
}

/**
 * F2 rollback: put a command that was settled/released back to a pristine
 * in-flight ACCEPTED state — the record is replaced by the untouched original
 * object and its reservation re-held (the recorded reservation ids are derived
 * deterministically from the commandId, so they match the re-reserve).
 * Used when a cancel/replace's persist fails, so the workspace can never
 * report a terminal outcome the package doesn't reflect.
 */
function restoreInFlight(
  workspace: ConstructionWorkspace,
  record: CampaignSessionRecord,
  original: CommandRecord,
): void {
  workspace.records.set(original.commandId, original);
  workspace.reservations.release(original.commandId);
  workspace.reservations.reserve(
    original,
    reservationRequirementsFor(record.playerSlotId, {
      projectedCost: forecastCostOf(original),
      projectedCapacityUnits: forecastCapacityUnitsOf(original),
    }),
    "construction_submission",
  );
  setUiCommandStatus(workspace, original.commandId, "submitted");
}

function buildUiDesign(record: CampaignSessionRecord, designId: string): CompiledDesignVersion {
  const catalog = buildConstructionDesignCatalog(record.state.snapshot, record.playerSlotId);
  const found = catalog.find((candidate) => candidate.designId === designId);
  if (found) return found;
  // Unreachable in practice (submit validates design.nationId first); keep a
  // deterministic fallback rather than crashing the ledger on bad data.
  const engine = record.state.snapshot.designs.get(designId);
  return {
    designId,
    className: engine?.className ?? designId,
    shipType: "unknown",
    nationId: record.playerSlotId,
    year: 0,
    mass: 0,
    speed: 0,
    machineryType: engine?.machineryType ?? "",
    requiredTechnologyIds: [],
  };
}

function makeUiCommand(
  recordRef: CommandRecord,
  designId: string,
  design: CompiledDesignVersion,
  projectedCost: number,
  projectedCapacityUnits: number,
  submittedAtRevision: number,
): ConstructionCommand {
  return {
    commandId: recordRef.commandId,
    designId,
    design,
    nationId: recordRef.issuerParticipantId,
    status: uiStatusFor(recordRef),
    submittedAtRevision,
    projectedCost,
    projectedCapacityUnits,
  };
}

function setUiCommandStatus(
  workspace: ConstructionWorkspace,
  commandId: string,
  status: ConstructionCommandStatus,
): void {
  workspace.commands = workspace.commands.map((command) =>
    command.commandId === commandId ? { ...command, status } : command,
  );
}

function isTerminal(record: CommandRecord): boolean {
  return ["COMPLETED", "PARTIALLY_COMPLETED", "REJECTED", "CANCELLED", "SUPERSEDED"].includes(
    record.status,
  );
}

/** The projected treasury amount a record reserved — read off its canonical
 * payload (written by `acceptConstructionRecord`), never recomputed. */
function forecastCostOf(record: CommandRecord): number {
  const payload = record.canonicalPayload as { projectedCost?: number } | null;
  return typeof payload?.projectedCost === "number" ? payload.projectedCost : 0;
}

/** The projected capacity units a record reserved — see `forecastCostOf`. */
function forecastCapacityUnitsOf(record: CommandRecord): number {
  const payload = record.canonicalPayload as { projectedCapacityUnits?: number } | null;
  return typeof payload?.projectedCapacityUnits === "number" ? payload.projectedCapacityUnits : 0;
}

function constructionProjectFor(
  commandId: string,
  designId: string,
  projectedCost: number,
  month: { month: number; year: number },
): ConstructionProject {
  return {
    id: constructionProjectIdForCommand(commandId),
    type: "ship",
    projectType: "NEW_CONSTRUCTION",
    targetId: designId,
    designVersionId: designId,
    totalWork: SafeInt(projectedCost),
    completedWork: SafeInt.ZERO,
    paidWork: SafeInt.ZERO,
    status: "PLANNED",
    startedAt: `${String(month.year)}-${String(month.month).padStart(2, "0")}`,
  };
}

function addProjectToNation(
  snapshot: CampaignSnapshot,
  playerSlotId: string,
  project: ConstructionProject,
): CampaignSnapshot {
  const nation = snapshot.nations.get(playerSlotId);
  if (!nation) return snapshot;
  const updatedNations = new Map(snapshot.nations).set(playerSlotId, {
    ...nation,
    constructionProjects: [...nation.constructionProjects, project],
  });
  return { ...snapshot, nations: updatedNations };
}

function removeProjectForCommand(
  snapshot: CampaignSnapshot,
  playerSlotId: string,
  commandId: string,
): CampaignSnapshot {
  const nation = snapshot.nations.get(playerSlotId);
  if (!nation) return snapshot;
  const projectId = constructionProjectIdForCommand(commandId);
  const updatedNations = new Map(snapshot.nations).set(playerSlotId, {
    ...nation,
    constructionProjects: nation.constructionProjects.filter((project) => project.id !== projectId),
  });
  return { ...snapshot, nations: updatedNations };
}

/** Apply an authoritative snapshot mutation, recompute the envelope + hash,
 * persist via `SaveStore`, and re-register the session (commitMonth's exact
 * pattern). */
function persistSnapshotMutation(
  record: CampaignSessionRecord,
  mutate: (snapshot: CampaignSnapshot) => CampaignSnapshot,
): { ok: true } | { ok: false; result: BridgeResult<ConstructionCommandOutcome> } {
  const nextSnapshot = mutate(record.state.snapshot);
  const nextEnvelope = createEnvelope(
    "campaign-snapshot",
    nextSnapshot.compatibilityVersion,
    nextSnapshot,
  );
  const nextState: CampaignState = toSaveableState({
    snapshot: nextSnapshot,
    envelope: nextEnvelope,
    rawHash: record.state.rawHash,
  });

  const store = new SaveStore();
  try {
    store.save(nextState, record.saveDir);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      result: { outcome: "error", reason: "SAVE_FAILED", diagnostics: [message] },
    };
  }
  registerCampaignSession({ ...record, state: nextState });
  return { ok: true };
}
