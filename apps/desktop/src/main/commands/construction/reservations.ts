import type { CommandRecord } from "@bluewave/commands";
import type { CampaignSessionRecord } from "../../campaignSessions.js";
import {
  reservationRequirementsFor,
  syncReservationPools,
  type ConstructionWorkspace,
} from "../../constructionWorkspace.js";
import { setUiCommandStatus } from "./command-view.js";

/**
 * The reservation lifecycle for construction orders: hold treasury + drydock
 * capacity for a new order, run the replace preflight against the current
 * pools, roll a settled command back to in-flight when a persist fails, and
 * read back the amounts a record reserved. Owning it here keeps the command
 * flows free of raw pool arithmetic.
 */

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

/** Hold the projected treasury + capacity for a freshly accepted order. */
export function reserveForOrder(
  workspace: ConstructionWorkspace,
  record: CampaignSessionRecord,
  recordRef: CommandRecord,
  costs: ProjectedCosts,
): ReserveOrderResult {
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

/**
 * F2 preflight: would the replacement's reservation fit once the original's
 * supersession releases its hold? Mirrors `ReservationManager.reserve`'s own
 * affordability check (`pool.available - totalReserved >= quantity`), run
 * against the CURRENT pools with the original's released hold counted as
 * available — so a rejected replace never mutates or persists anything.
 */
export function canReserveReplacement(
  workspace: ConstructionWorkspace,
  record: CampaignSessionRecord,
  originalCommandId: string,
  costs: ProjectedCosts,
): { readonly ok: true } | ReservationFailure {
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
    const pool =
      check.resourceTypeId === "TREASURY" ? workspace.treasuryPool : workspace.capacityPool;
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

/**
 * F2 rollback: put a command that was settled/released back to a pristine
 * in-flight ACCEPTED state — the record is replaced by the untouched original
 * object and its reservation re-held (the recorded reservation ids are derived
 * deterministically from the commandId, so they match the re-reserve). Used
 * when a cancel/replace's persist fails, so the workspace can never report a
 * terminal outcome the package doesn't reflect.
 */
export function restoreInFlight(
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
