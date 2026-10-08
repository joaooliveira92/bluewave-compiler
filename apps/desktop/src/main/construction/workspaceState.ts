import {
  CommandLedger,
  ReservationManager,
  ScopedIdempotencyStore,
  type CommandOutcome,
  type CommandRecord,
  type ResourcePool,
} from "@bluewave/commands";
import type { ConstructionCommand, ConstructionCommandStatus } from "@bluewave/campaign-engine";
import { CONSTRUCTION_COMMAND_DEFINITION } from "./commandDefinition.js";
import { reservationRequirementsFor } from "./reservationRequirements.js";

/**
 * The session-scoped construction workspace: the append-only command
 * bookkeeping that reflects the session's authoritative `CampaignState` to the
 * Construction screen.
 *
 * It is a class, not a bag of fields, so the invariants the command flows rely
 * on are enforced in one place instead of being re-derived by every caller:
 * the machinery's reservation/idempotency/ledger objects stay private, a
 * record and its UI row are written together, and the F2 rollback
 * (`restoreInFlight`) is a single operation. The command flows still own the
 * *ordering* (validate → reserve → persist → bookkeep); the workspace owns the
 * *state transitions*.
 */

/** The projected treasury + capacity one order commits. */
export interface ProjectedCosts {
  readonly projectedCost: number;
  readonly projectedCapacityUnits: number;
}

export type ReservationFailure = {
  readonly ok: false;
  readonly reasonCode: string;
  readonly diagnostics: string[];
};

export type ReserveOrderResult =
  | { readonly ok: true; readonly recordIds: string[] }
  | ReservationFailure;

/** The phaseId recorded on every construction reservation. */
const CONSTRUCTION_RESERVATION_PHASE = "construction_submission";

export class ConstructionWorkspace {
  readonly sessionId: string;
  readonly playerSlotId: string;

  private readonly idempotency = new ScopedIdempotencyStore();
  private readonly reservations = new ReservationManager();
  private readonly ledger = new CommandLedger();
  private readonly records = new Map<string, CommandRecord>();
  private uiCommands: ConstructionCommand[] = [];
  private ordinal = 1;
  private readonly treasuryPool: ResourcePool;
  private readonly capacityPool: ResourcePool;

  constructor(sessionId: string, playerSlotId: string, treasury: number, capacity: number) {
    this.sessionId = sessionId;
    this.playerSlotId = playerSlotId;
    this.treasuryPool = makePool("TREASURY", playerSlotId, treasury);
    this.capacityPool = makePool("CAPACITY", playerSlotId, capacity);
    this.reservations.registerPool(this.treasuryPool);
    this.reservations.registerPool(this.capacityPool);
  }

  nextSubmissionOrdinal(): number {
    return this.ordinal++;
  }

  getRecord(commandId: string): CommandRecord | undefined {
    return this.records.get(commandId);
  }

  putRecord(record: CommandRecord): void {
    this.records.set(record.commandId, record);
  }

  /** The UI-facing command list in submission order. */
  commandRows(): readonly ConstructionCommand[] {
    return this.uiCommands;
  }

  appendCommand(command: ConstructionCommand): void {
    this.uiCommands.push(command);
  }

  /** Write a row's status in place, preserving submission order. */
  setCommandStatus(commandId: string, status: ConstructionCommandStatus): void {
    this.uiCommands = this.uiCommands.map((command) =>
      command.commandId === commandId ? { ...command, status } : command,
    );
  }

  rememberIdempotent(record: CommandRecord): void {
    this.idempotency.set(CONSTRUCTION_COMMAND_DEFINITION, record);
  }

  findIdempotent(transportRequestId: string): CommandRecord | undefined {
    return this.idempotency.get(CONSTRUCTION_COMMAND_DEFINITION, transportRequestId);
  }

  appendLedger(outcome: CommandOutcome): void {
    this.ledger.add(outcome);
  }

  /** Hold the projected treasury + capacity for a freshly accepted order. */
  reserve(record: CommandRecord, costs: ProjectedCosts): ReserveOrderResult {
    const result = this.reservations.reserve(
      record,
      reservationRequirementsFor(this.playerSlotId, costs),
      CONSTRUCTION_RESERVATION_PHASE,
    );
    if (result.ok) return { ok: true, recordIds: result.records.map((r) => r.reservationId) };
    const reasonCode =
      result.reasonCode === "INSUFFICIENT_FUNDS" || result.reasonCode === "INSUFFICIENT_CAPACITY"
        ? result.reasonCode
        : "RESERVATION_FAILED";
    return {
      ok: false,
      reasonCode,
      diagnostics: [
        `${result.reasonCode}: could not reserve ${result.failedResource} for construction order ${record.commandId}`,
      ],
    };
  }

  release(commandId: string): void {
    this.reservations.release(commandId);
  }

  /**
   * F2 rollback: put a command that was settled/released back to a pristine
   * in-flight ACCEPTED state — the record is restored and its reservation
   * re-held (the reservation ids are derived deterministically from the
   * commandId, so they match the re-reserve). Used when a cancel/replace's
   * persist fails, so the workspace can never report a terminal outcome the
   * package doesn't reflect.
   */
  restoreInFlight(original: CommandRecord): void {
    this.records.set(original.commandId, original);
    this.release(original.commandId);
    this.reserve(original, {
      projectedCost: forecastCostOf(original),
      projectedCapacityUnits: forecastCapacityUnitsOf(original),
    });
    this.setCommandStatus(original.commandId, "submitted");
  }

  /**
   * F2 preflight: would the replacement's reservation fit once the original's
   * supersession releases its hold? Mirrors `ReservationManager.reserve`'s own
   * affordability check (`pool.available - totalReserved >= quantity`), run
   * against the CURRENT pools with the original's released hold counted as
   * available — so a rejected replace never mutates or persists anything.
   */
  canReserveReplacement(
    originalCommandId: string,
    costs: ProjectedCosts,
  ): { readonly ok: true } | ReservationFailure {
    const checks = [
      {
        pool: this.treasuryPool,
        quantity: costs.projectedCost,
        failCode: "INSUFFICIENT_FUNDS",
        label: "treasury",
      },
      {
        pool: this.capacityPool,
        quantity: costs.projectedCapacityUnits,
        failCode: "INSUFFICIENT_CAPACITY",
        label: "shipyard capacity",
      },
    ] as const;
    for (const check of checks) {
      const totalReserved = [...check.pool.reserved.values()].reduce((sum, r) => sum + r, 0);
      const originalHeld = check.pool.reserved.get(originalCommandId) ?? 0;
      const availableForReplacement = check.pool.available - (totalReserved - originalHeld);
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

  /**
   * Re-point both pools at the session's current real numbers before a command
   * (`nation.treasury`, shipyard capacity), so reservations can never outrun
   * the current snapshot even after `commitMonth` moved them. The pool objects
   * are held by reference by `ReservationManager`, so the in-place `available`
   * update preserves existing reservations.
   */
  syncPools(treasury: number, capacity: number): void {
    this.treasuryPool.available = treasury;
    this.capacityPool.available = capacity;
  }
}

function makePool(
  resourceTypeId: "TREASURY" | "CAPACITY",
  resourceId: string,
  available: number,
): ResourcePool {
  return { resourceTypeId, resourceId, available, reserved: new Map() };
}

/** The projected treasury amount a record reserved — read off its canonical
 * payload (written by `acceptConstructionRecord`), never recomputed. */
export function forecastCostOf(record: CommandRecord): number {
  const payload = record.canonicalPayload as { projectedCost?: number } | null;
  return typeof payload?.projectedCost === "number" ? payload.projectedCost : 0;
}

/** The projected capacity units a record reserved — see `forecastCostOf`. */
export function forecastCapacityUnitsOf(record: CommandRecord): number {
  const payload = record.canonicalPayload as { projectedCapacityUnits?: number } | null;
  return typeof payload?.projectedCapacityUnits === "number" ? payload.projectedCapacityUnits : 0;
}
