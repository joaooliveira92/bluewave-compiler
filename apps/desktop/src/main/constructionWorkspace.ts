import type { CampaignSessionRecord } from "./campaignSessions.js";
import {
  CommandLedger,
  CommandRegistry,
  ReservationManager,
  ScopedIdempotencyStore,
  canTransition,
  createCommandRecord,
  createSettlementRecord,
  hashCommandRecord,
  type CommandBody,
  type CommandEnvelope,
  type CommandRecord,
  type CommandSettlementBranch,
  type CommandSettlementRecord,
  type CommandStatus,
  type CommandTypeDefinition,
  type ResourcePool,
  type SettlementBranchId,
} from "@bluewave/commands";
import {
  buildConstructionDesignCatalog,
  buildPlayerProjection,
  constructionCommandIdForProject,
  projectedConstructionOrderCosts,
  type CompiledDesignVersion,
  type ConstructionCommand,
  type ConstructionCommandStatus,
} from "@bluewave/campaign-engine";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";

/**
 * Session-scoped construction workspace (desktop-mvp ticket 14), owning the
 * `CommandRegistry` / `CommandRecord` / `IdempotencyScope` /
 * reservation-settlement machinery from `packages/commands` — the real
 * optimistic-concurrency model ticket 10's decision mandates (NOT
 * simplified).
 *
 * The authoritative record is always the session's `CampaignState` (updated
 * and persisted by `commands/constructionCommands.ts`); this module is the
 * append-only command bookkeeping that reflects it to the Construction
 * screen:
 * - every issued order creates a `CommandRecord` and walks its status
 *   SUBMITTED → VALIDATED → AUTHORIZED → RESERVED → ACCEPTED through the
 *   registry's own `PERMITTED_TRANSITIONS` (checked via `canTransition`),
 * - the client's `transportRequestId` doubles as the idempotency key
 *   (`ScopedIdempotencyStore`), so a lost response + retry replays the same
 *   order instead of double-ordering,
 * - TREASURY + CAPACITY pools (`ReservationManager`) hold the projected cost
 *   / drydock units each order commits,
 * - replace/cancel walk the record into SUPERSEDED / CANCELLED, settle the
 *   reservation through `createSettlementRecord` (full refund — nothing is
 *   consumed before the monthly appropriation pipeline spends treasury),
 *   and release it.
 *
 * Status transitions deliberately skip the wall-clock stamp: the machinery's
 * `transitionRecord()` helper bakes a non-deterministic
 * `new Date().toISOString()` into every `CommandStatusTransitionRecord`
 * (ENGINEERING-CONTRACT "Determinism"), so transitions here recompute only
 * the deterministic `commandHash` (`hashCommandRecord`, see
 * `withRecordStatus`) — an accepted/transitioned record is timestamp-free
 * and fully deterministic. (`AuditChain` is equally unused here — it stamps
 * no timestamps of its own and is deterministic — the workspace keeps its
 * own `CommandLedger`.) The legacy `CommandEnvelope`/`CommandBody` union in
 * `packages/commands` predates construction command types; the machinery only
 * serializes + hashes the body (`createCommandRecord` never inspects
 * `body.type`), so a locally-shaped body travels through typed as
 * `CommandBody` — see `toWorkEnvelope`.
 */

export const CONSTRUCTION_COMMAND_TYPE_ID = "construction_order";
export const CONSTRUCTION_COMMAND_SCHEMA_VERSION = "1.0.0";

/**
 * The settlement branch every cancel/replace walks through. `"preLockCancellation"`
 * is one of the machinery's canonical `SettlementBranchId`s; "pre-lock" is
 * exactly the window constructions live in (nothing is locked/irreversible
 * until the monthly appropriation spends against a project).
 */
export const CONSTRUCTION_SETTLEMENT_BRANCH_ID = "preLockCancellation" as const;

/**
 * One branch for every cancellation/supersession: constructions reserve
 * (projected) treasury/drydock; nothing is consumed before the monthly
 * appropriation pipeline actually spends, so a refund is a full release —
 * 10000 basis points, no fixed fee.
 */
export const CONSTRUCTION_REFUND_BRANCH: CommandSettlementBranch = {
  refundBasisPoints: 10000,
  fixedNonRefundableAmount: 0,
  consumedAmountFormulaId: "NONE",
  releasedAmountFormulaId: "FULL_REFUND",
  recipientAccount: "TREASURY",
  ledgerPostingCategory: "REFUND",
  roundingMode: "FLOOR",
  explanationReasonCode: "COMMAND_CANCELLED",
};

/**
 * The single `CommandTypeDefinition` for construction orders. Registered
 * once in a module-level `CommandRegistry` (append-only; duplicate
 * registrations throw, so this is safe at import time).
 */
export const CONSTRUCTION_COMMAND_DEFINITION: CommandTypeDefinition = {
  commandTypeId: CONSTRUCTION_COMMAND_TYPE_ID,
  commandSchemaVersion: CONSTRUCTION_COMMAND_SCHEMA_VERSION,
  allowedIssuerClasses: ["PLAYER"],
  targetAggregateType: "nation",
  submissionPhaseId: "construction_submission",
  authorizationPolicyId: "player_nation_self",
  validationPolicyId: "construction_order_validation",
  reservationPolicyId: "treasury_and_capacity_reservation",
  lockPhaseId: "monthly_commitment_lock",
  irreversiblePhaseId: "construction_irreversible_phase",
  resolutionPhaseId: "construction_acceptance",
  cancellationPolicyId: "UNTIL_LOCK",
  settlementPolicyId: "construction_order_settlement",
  resultSchemaId: "construction_acceptance_result",
  reasonCodeNamespace: "construction",
  idempotencyScope: "campaign:construction",
  owningDesignContractId: "bluewave:construction-order:v1",
  handlerImplementationId: "desktop/construction-commands/v1",
  handlerVersion: "1.0.0",
  testVectorIds: [],
  contentHash: sha256Hex(
    canonicalSerialize({ commandTypeId: CONSTRUCTION_COMMAND_TYPE_ID, version: "1.0.0" }),
  ),
};

const constructionCommandRegistry = new CommandRegistry();
constructionCommandRegistry.register(CONSTRUCTION_COMMAND_DEFINITION);

export interface ConstructionWorkspace {
  readonly sessionId: string;
  readonly registry: CommandRegistry;
  readonly idempotency: ScopedIdempotencyStore;
  readonly reservations: ReservationManager;
  readonly ledger: CommandLedger;
  readonly records: Map<string, CommandRecord>;
  /** UI-facing command list in submission order. */
  commands: ConstructionCommand[];
  readonly nextSubmissionOrdinal: () => number;
  treasuryPool: ResourcePool;
  capacityPool: ResourcePool;
}

const workspaces = new Map<string, ConstructionWorkspace>();

export function getConstructionWorkspace(record: CampaignSessionRecord): ConstructionWorkspace {
  const existing = workspaces.get(record.sessionId);
  if (existing) {
    syncReservationPools(existing, record);
    return existing;
  }

  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  const treasuryPool = makePool(
    "TREASURY",
    record.playerSlotId,
    nation ? Number(nation.treasury) : 0,
  );
  const capacityPool = makePool(
    "CAPACITY",
    record.playerSlotId,
    constructionEconomy(record).shipyardCapacity,
  );
  const reservations = new ReservationManager();
  reservations.registerPool(treasuryPool);
  reservations.registerPool(capacityPool);

  let nextOrdinal = 1;
  const workspace: ConstructionWorkspace = {
    sessionId: record.sessionId,
    registry: constructionCommandRegistry,
    idempotency: new ScopedIdempotencyStore(),
    reservations,
    ledger: new CommandLedger(),
    records: new Map(),
    commands: [],
    nextSubmissionOrdinal: () => nextOrdinal++,
    treasuryPool,
    capacityPool,
  };
  // F1: a fresh session re-opening an existing save directory must see the
  // orders that were queued before the restart — the snapshot still carries
  // their projects, so rebuild the command records + reservations from them.
  reconstructWorkspaceFromSnapshot(workspace, record);
  workspaces.set(record.sessionId, workspace);
  return workspace;
}

/**
 * Rebuilds the per-command bookkeeping (records + reservations + UI rows) for
 * every order-queued project still in the snapshot when a fresh session opens
 * an existing save directory. Without this a restart would empty the
 * workspace and cancel/replace on a pre-restart order would return
 * COMMAND_NOT_FOUND even though the order's project is still authoritative.
 *
 * Reconstruction is fully deterministic:
 * - the commandId is recovered from the project id (`project-<commandId
 *   minus cmd->`, the exact pairing `constructionCommands.ts` writes), so
 *   cancel/replace resolve to the same commandId the renderer's rows show;
 * - projected costs come from the same design formula the original
 *   submission used (`projectedConstructionOrderCosts`), so the re-held
 *   reservation matches what was originally committed;
 * - status walks to ACCEPTED (in-flight) exactly like a fresh submission.
 *
 * Authored starting projects (`con_...` ids) have no command record behind
 * them and are left alone (they surface through the screen's `projects`
 * projection instead). Idempotency keys are NOT reconstructed — the original
 * `transportRequestId` is unrecoverable from the snapshot — so a retried
 * transportRequestId after a restart is treated as a fresh request.
 */
function reconstructWorkspaceFromSnapshot(
  workspace: ConstructionWorkspace,
  record: CampaignSessionRecord,
): void {
  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  const projects = nation?.constructionProjects ?? [];
  const revision = Number(record.state.snapshot.turnNumber);
  for (const project of projects) {
    const commandId = constructionCommandIdForProject(project.id);
    if (!commandId) continue; // authored start — no command record exists
    const design = record.state.snapshot.designs.get(project.designVersionId);
    const costs = design
      ? projectedConstructionOrderCosts(design)
      : { projectedCost: Number(project.totalWork), projectedCapacityUnits: 0 };
    const recordRef = acceptConstructionRecord(
      workspace,
      record,
      commandId,
      commandId, // deterministic placeholder — the original key is unrecoverable
      revision,
      project.designVersionId,
      costs.projectedCost,
      costs.projectedCapacityUnits,
    );
    const result = workspace.reservations.reserve(
      recordRef,
      reservationRequirementsFor(record.playerSlotId, costs),
      "construction_submission",
    );
    if (!result.ok) continue; // unreachable: pools are synced from this same snapshot
    const accepted: CommandRecord = {
      ...recordRef,
      reservationRecordIds: result.records.map((r) => r.reservationId),
    };
    workspace.records.set(commandId, accepted);
    workspace.commands.push(
      reconstructedUiCommand(record, accepted, project.designVersionId, costs, revision),
    );
  }
}

function reconstructedUiCommand(
  record: CampaignSessionRecord,
  recordRef: CommandRecord,
  designId: string,
  costs: { projectedCost: number; projectedCapacityUnits: number },
  submittedAtRevision: number,
): ConstructionCommand {
  const catalog = buildConstructionDesignCatalog(record.state.snapshot, record.playerSlotId);
  const found = catalog.find((candidate) => candidate.designId === designId);
  const design: CompiledDesignVersion = found ?? deterministicFallbackDesign(record, designId);
  return {
    commandId: recordRef.commandId,
    designId,
    design,
    nationId: record.playerSlotId,
    status: uiStatusFor(recordRef),
    submittedAtRevision,
    projectedCost: costs.projectedCost,
    projectedCapacityUnits: costs.projectedCapacityUnits,
  };
}

function deterministicFallbackDesign(
  record: CampaignSessionRecord,
  designId: string,
): CompiledDesignVersion {
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

/**
 * The TREASURY + CAPACITY reservation requirements one construction order
 * commits — the exact shape `ReservationManager.reserve` checks, shared by
 * the submit/replace/cancel paths and the post-restart reconstruction so the
 * amounts and units can never drift apart.
 */
export function reservationRequirementsFor(
  playerSlotId: string,
  costs: { projectedCost: number; projectedCapacityUnits: number },
): Array<{
  resourceTypeId: string;
  resourceId: string;
  quantity: number;
  canonicalUnit: string;
  priority: number;
}> {
  return [
    {
      resourceTypeId: "TREASURY",
      resourceId: playerSlotId,
      quantity: costs.projectedCost,
      canonicalUnit: "TREASURY",
      priority: 1,
    },
    {
      resourceTypeId: "CAPACITY",
      resourceId: playerSlotId,
      quantity: costs.projectedCapacityUnits,
      canonicalUnit: "CAPACITY_UNITS",
      priority: 1,
    },
  ];
}

/** Test-only: clears every workspace so test files don't leak state. */
/** Drops one session's construction workspace (called when the campaign is closed). */
export function clearConstructionWorkspace(sessionId: string): void {
  workspaces.delete(sessionId);
}

/** True while a construction workspace is held for the session (for teardown tests). */
export function hasConstructionWorkspace(sessionId: string): boolean {
  return workspaces.has(sessionId);
}

export function clearConstructionWorkspacesForTest(): void {
  workspaces.clear();
}

/**
 * Re-point both resource pools at the session's current real numbers before
 * each command (`nation.treasury`, shipyard capacity), so reservations can
 * never outrun the current snapshot even after `commitMonth` moved them.
 * `ReservationManager` keeps the registered pool objects by reference, so the
 * in-place `available` update preserves existing reservations.
 */
export function syncReservationPools(
  workspace: ConstructionWorkspace,
  record: CampaignSessionRecord,
): void {
  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  workspace.treasuryPool.available = nation ? Number(nation.treasury) : 0;
  workspace.capacityPool.available = constructionEconomy(record).shipyardCapacity;
}

function makePool(
  resourceTypeId: "TREASURY" | "CAPACITY",
  resourceId: string,
  available: number,
): ResourcePool {
  return { resourceTypeId, resourceId, available, reserved: new Map() };
}

/**
 * The same derived economy the Overview/Construction projections expose —
 * treasury, monthly appropriation (real basis-point formula) and shipyard
 * capacity (nation's port levels' sum, ticket 12's documented proxy).
 */
export function constructionEconomy(record: CampaignSessionRecord): {
  readonly treasury: number;
  readonly monthlyAppropriation: number;
  readonly shipyardCapacity: number;
} {
  const projection = buildPlayerProjection(record.state, record.playerSlotId, record.month);
  if (projection) return projection.economy;
  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  return {
    treasury: nation ? Number(nation.treasury) : 0,
    monthlyAppropriation: 0,
    shipyardCapacity: 0,
  };
}

/** The UI-facing command list + reservation totals the projection exposes. */
export function workspaceView(workspace: ConstructionWorkspace): ConstructionScreenWorkspace {
  let treasuryReserved = 0;
  let capacityReserved = 0;
  for (const command of workspace.commands) {
    if (uiCommandHoldsReservation(command)) {
      treasuryReserved += command.projectedCost;
      capacityReserved += command.projectedCapacityUnits;
    }
  }
  return { commands: workspace.commands, treasuryReserved, capacityReserved };
}

type ConstructionScreenWorkspace = {
  readonly commands: readonly ConstructionCommand[];
  readonly treasuryReserved: number;
  readonly capacityReserved: number;
};

function uiCommandHoldsReservation(command: ConstructionCommand): boolean {
  return command.status === "submitted";
}

/** Map a `CommandRecord`'s machinery status onto the screen's four-way UI status. */
export function uiStatusFor(record: CommandRecord): ConstructionCommandStatus {
  switch (record.status) {
    case "SUPERSEDED":
      return "superseded";
    case "CANCELLED":
      return "cancelled";
    default:
      // SUBMITTED..ACCEPTED are all "in flight" for the UI: the Command
      // Ledger shows submit/replace/cancel actions only for these.
      return "submitted";
  }
}

/**
 * The optimistic-concurrency envelope for one work order. `expectedRevision`
 * is checked by the caller against `snapshot.turnNumber` before this runs;
 * it is still recorded on the body so the record hash pins the revision the
 * order was issued against.
 */
export function toWorkEnvelope(
  workspace: ConstructionWorkspace,
  commandId: string,
  transportRequestId: string,
  expectedRevision: number,
  nationId: string,
  designId: string,
  projectedCost: number,
  projectedCapacityUnits: number,
  snapshotHash: string,
): CommandEnvelope<CommandBody> {
  return {
    commandId,
    version: "0.1.0",
    expectedSnapshotHash: snapshotHash,
    idempotencyKey: transportRequestId,
    timestamp: `${workspace.sessionId}:${commandId}`,
    body: {
      type: "construction_order",
      nationId,
      designId,
      expectedRevision,
      transportRequestId,
      projectedCost,
      projectedCapacityUnits,
    } as unknown as CommandBody,
  };
}

/** Build + walk a fresh `CommandRecord` to ACCEPTED through the permitted chain. */
export function acceptConstructionRecord(
  workspace: ConstructionWorkspace,
  record: CampaignSessionRecord,
  commandId: string,
  transportRequestId: string,
  expectedRevision: number,
  designId: string,
  projectedCost: number,
  projectedCapacityUnits: number,
): CommandRecord {
  const snapshot = record.state.snapshot;
  const envelope = toWorkEnvelope(
    workspace,
    commandId,
    transportRequestId,
    expectedRevision,
    record.playerSlotId,
    designId,
    projectedCost,
    projectedCapacityUnits,
    record.state.rawHash,
  );
  const created = createCommandRecord(
    envelope,
    CONSTRUCTION_COMMAND_DEFINITION,
    snapshot.campaignId,
    campaignMonthKey(record),
    "PLAYER",
    record.playerSlotId,
    record.playerSlotId,
    CONSTRUCTION_COMMAND_DEFINITION.submissionPhaseId,
    workspace.nextSubmissionOrdinal(),
    record.state.rawHash,
  );
  return walkToAccepted(created);
}

export function campaignMonthKey(record: CampaignSessionRecord): string {
  return `${String(record.month.year)}-${String(record.month.month).padStart(2, "0")}`;
}

/**
 * Walk SUBMITTED → VALIDATED → AUTHORIZED → RESERVED → ACCEPTED, verifying
 * every hop. Each hop goes through `withRecordStatus` (NOT the machinery's
 * `transitionRecord`, which stamps a wall-clock `new Date().toISOString()`
 * into the transition record) — the walked record stays timestamp-free and
 * whose hash is recomputed deterministically at every step.
 */
function walkToAccepted(record: CommandRecord): CommandRecord {
  const chain: CommandStatus[] = ["VALIDATED", "AUTHORIZED", "RESERVED", "ACCEPTED"];
  let current: CommandRecord = record;
  for (const next of chain) {
    if (!canTransition(current.status, next)) {
      throw Object.assign(
        new Error(`INVALID_COMMAND_STATUS_TRANSITION: ${current.status} -> ${next}`),
        { code: "INVALID_COMMAND_STATUS_TRANSITION" },
      );
    }
    current = withRecordStatus(current, next);
  }
  return current;
}

/**
 * Immutable status assignment + deterministic `commandHash` recomputation.
 * Deliberately no wall-clock timestamp (unlike the machinery's
 * `transitionRecord`), so the resulting record — and its hash — is fully
 * deterministic and timestamp-free.
 */
export function withRecordStatus(record: CommandRecord, status: CommandStatus): CommandRecord {
  const next: CommandRecord = { ...record, status };
  return { ...next, commandHash: hashCommandRecord(next) };
}

export function settleAndRelease(
  workspace: ConstructionWorkspace,
  record: CommandRecord,
  settlementBranchId: SettlementBranchId,
  reservedAmount: number,
): CommandSettlementRecord {
  const settlement = createSettlementRecord(
    record.commandId,
    settlementBranchId,
    CONSTRUCTION_REFUND_BRANCH,
    reservedAmount,
    0,
  );
  workspace.reservations.release(record.commandId);
  return settlement;
}
