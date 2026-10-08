import type { CampaignState } from "@bluewave/campaign";
import { advanceMonth, canAdvance } from "@bluewave/campaign";
import type { CommitMonthResponse } from "@bluewave/campaign-engine";
import { SafeInt } from "@bluewave/contracts";
import { createEnvelope } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { MonthExecutor } from "@bluewave/phase-engine";
import { loadShipBuildingContent } from "../shipBuildingContent.js";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { CommitMonthPayload } from "../../shared/campaign-command-contract.js";
import { getCampaignSession, registerCampaignSession } from "../campaignSessions.js";
import { clearPendingEnvelopes, pendingEnvelopesForExecution } from "../pendingCommands.js";
import { toSaveableState } from "../saveHelpers.js";
import { collectBattleOutcomes } from "./commitMonth/battleOutcomes.js";
import {
  sumByCategory,
  toDomainEvents,
  toFinancialLedgerEntries,
  toRandomDecisions,
} from "./commitMonth/responseMappers.js";
import { promotePlayerSlotForExecution } from "./commitMonth/snapshot.js";

/**
 * `commitMonth(sessionId, expectedRevision, transportRequestId) -> CommitMonthResponse`
 * (ticket 13): the real monthly pipeline, per
 * `.scratch/desktop-mvp/issues/09-simulation-contract.md`'s resolved
 * design. `MonthExecutor.execute()` (`packages/phase-engine/src/month.ts`)
 * turned out to already generate *and* resolve any war-triggered battle
 * inline (its phases 9.5/10, via `@bluewave/combat`'s `generateBattles` +
 * `BattleResolver`, folding the outcome back into the snapshot via its own
 * `applyBattleResult`) — proven end-to-end by the pre-existing
 * `packages/phase-engine/test/battle-generation-phase.test.ts`. So this
 * command does not need to separately call anything in
 * `packages/combat/src/autoResolution.ts` itself: `assertAutoResolvable`/
 * `AUTO_RESOLUTION_THRESHOLDS` are validation guards for the statistical
 * auto-resolution *proof* (`packages/combat/src/generation/autoResolutionProof.ts`),
 * not a per-battle gate `commitMonth` needs to invoke — `MonthExecutor`
 * already always resolves inline, never leaving a pending/blocking battle
 * state. See ticket 13's "Note on scope discovered during implementation"
 * for the full account (this contradicts ticket 09's original assumption
 * that the integration still needed to be built).
 */
export async function commitMonth(
  payload: CommitMonthPayload,
): Promise<BridgeResult<CommitMonthResponse>> {
  const record = getCampaignSession(payload.sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${payload.sessionId}`],
    };
  }

  const currentRevision = Number(record.state.snapshot.turnNumber);
  if (payload.expectedRevision !== currentRevision) {
    return {
      outcome: "rejected",
      reason: "REVISION_MISMATCH",
      diagnostics: [
        `Expected revision ${payload.expectedRevision} but session ${payload.sessionId} is at revision ${currentRevision}`,
      ],
      currentRevision,
    };
  }

  if (!canAdvance(record.month.year, record.month.month)) {
    return {
      outcome: "rejected",
      reason: "SIMULATION_END_REACHED",
      diagnostics: [
        `Campaign cannot advance beyond December 1970 (at ${record.month.year}-${record.month.month})`,
      ],
    };
  }

  const playerNationBefore = record.state.snapshot.nations.get(record.playerSlotId);
  if (!playerNationBefore) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${record.playerSlotId} in session ${payload.sessionId}`],
    };
  }

  // Domain-separated, non-ambient seed (ENGINEERING-CONTRACT "Determinism"):
  // derived from the player's own campaign-creation seed plus the turn being
  // executed, not from wall-clock time or `Math.random()`. Same shape as
  // `packages/campaign/src/technologyVariation.ts`'s existing
  // `campaignSeed`-rooted stream-key convention.
  const randomSeed = `${record.campaignSeed}:month:${String(record.state.snapshot.turnNumber)}`;

  const executor = new MonthExecutor();
  const collector = new DiagnosticCollector();
  // The session's queued player command envelopes — research priorities AND
  // diplomacy commands (desktop-diplomacy-war INC-2: one shared queue, one
  // drain seam). Drained only NOW, after every revision/end-of-simulation
  // check and BEFORE the month executes, so a rejected commit leaves the
  // queue fully intact. When no command was ever issued the list is `[]` —
  // byte-identical behavior to the pre-queue pipeline. The engine
  // (command_collection) stays the sole mutator of
  // politics/wars/blockades/research.
  //
  // `MonthExecutor`'s command_collection authorizes human commands against
  // `snapshot.slots[0]` only (month.ts), while the desktop lets the player
  // pick ANY playable nation. Present the engine with the player's slot FIRST
  // for the execute() call — nothing else reads the slot array's order except
  // the AI-planning loop (which skips playable slots and keeps every AI slot
  // in its relative order), so the final content is unaffected — and restore
  // the canonical compiled slot order before persisting, keeping the save
  // byte-identical for campaigns that never issue commands.
  const originalSlots = record.state.snapshot.slots;
  const executionSnapshot = promotePlayerSlotForExecution(
    record.state.snapshot,
    record.playerSlotId,
  );
  const pendingCommands = pendingEnvelopesForExecution(payload.sessionId, executionSnapshot);
  const result = executor.execute(
    executionSnapshot,
    pendingCommands,
    randomSeed,
    collector,
    undefined,
    {
      shipBuilding: loadShipBuildingContent(),
    },
  );

  if (!result.success) {
    return {
      outcome: "error",
      reason: "MONTH_EXECUTION_FAILED",
      diagnostics: collector.all.map((d) => d.message),
    };
  }

  const playerNationAfter = result.finalSnapshot.nations.get(record.playerSlotId);
  if (!playerNationAfter) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`Nation ${record.playerSlotId} missing from post-month snapshot`],
    };
  }

  const ledgerEntries = result.financialLedger.all.filter(
    (entry) => entry.nationId === record.playerSlotId,
  );
  const maintenanceCost = sumByCategory(ledgerEntries, ["MAINTENANCE_EXPENDITURE"]);
  // Both automatic per-project appropriation (fires every month with active
  // construction, even with zero player-issued commands) and any
  // player-issued budget command (this slice's `commitMonth` payload never
  // carries one, per the map, but the category exists for when a later
  // ticket wires construction commands through the same pipeline) count as
  // "new construction spending" for the report.
  const newConstructionSpending = sumByCategory(ledgerEntries, [
    "APPROPRIATION",
    "CONSTRUCTION_BUDGET",
  ]);

  const nextTurnNumber = SafeInt.add(result.finalSnapshot.turnNumber, SafeInt.ONE);
  // Restore the canonical compiled slot order on the persisted snapshot (the
  // player-slot-first layout was execution-only; see the execute call above).
  const nextSnapshot = {
    ...result.finalSnapshot,
    turnNumber: nextTurnNumber,
    slots: originalSlots,
  };
  const nextMonth = advanceMonth(record.month.year, record.month.month, 1);

  // `record.state.envelope` was computed by `CampaignCompiler.compile()`
  // (`createEnvelope("campaign-snapshot", compatibilityVersion, snapshot)`,
  // `packages/campaign/src/compiler.ts`) over the *pre-month* snapshot.
  // `SaveStore.load()` calls `verifyEnvelope(envelope, snapshot)`, which
  // re-hashes the snapshot and compares — reusing the stale envelope here
  // would fail that check on every load after the first `commitMonth`, so
  // the envelope must be recomputed over `nextSnapshot`, matching the
  // compiler's own convention exactly (same artifact-kind string).
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
    return { outcome: "error", reason: "SAVE_FAILED", diagnostics: [message] };
  }

  registerCampaignSession({
    ...record,
    month: nextMonth,
    state: nextState,
  });

  // The queued player envelopes were handed to MonthExecutor above and the
  // new state is persisted + registered — drop them. This runs only after a
  // successful execute + save; every earlier `return` (MONTH_EXECUTION_FAILED,
  // SAVE_FAILED, revision/end checks) leaves the queue intact so a retry
  // re-delivers the player's commands (INC-2).
  clearPendingEnvelopes(payload.sessionId);

  const activeWars = result.finalSnapshot.wars.wars.filter((war) => war.status !== "ENDED");

  const response: CommitMonthResponse = {
    report: {
      month: record.month,
      openingTreasury: Number(playerNationBefore.treasury),
      maintenanceCost,
      newConstructionSpending,
      closingTreasury: Number(playerNationAfter.treasury),
    },
    domainEvents: toDomainEvents(result.eventLedger.all),
    financialLedger: toFinancialLedgerEntries(ledgerEntries),
    randomDecisions: toRandomDecisions(result.randomLedger.all),
    closingSnapshot: {
      revision: Number(nextTurnNumber),
      month: nextMonth,
      submarinePools: [],
      minePressure: [],
      landTargetDamage: [],
      battleOutcomes: collectBattleOutcomes(record.state.snapshot, result.finalSnapshot),
      activeWars,
    },
  };

  return { outcome: "success", value: response, diagnostics: [] };
}
