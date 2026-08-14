import type { CampaignState } from "@bluewave/campaign";
import { advanceMonth, canAdvance } from "@bluewave/campaign";
import type { DomainEvent, FinancialLedgerEntry } from "@bluewave/campaign-engine";
import type { CommitMonthResponse } from "@bluewave/campaign-engine";
import { SafeInt } from "@bluewave/contracts";
import { createEnvelope } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import type { DomainEventBody, DomainEventEnvelope } from "@bluewave/events";
import { SaveStore } from "@bluewave/persistence";
import { MonthExecutor, type LedgerTransaction } from "@bluewave/phase-engine";
import type { RandomDecision } from "@bluewave/random";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { CommitMonthPayload } from "../../shared/campaign-command-contract.js";
import { getCampaignSession, registerCampaignSession } from "../campaignSessions.js";
import { toSaveableState } from "../saveHelpers.js";

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
  const result = executor.execute(record.state.snapshot, [], randomSeed, collector);

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
  const nextSnapshot = { ...result.finalSnapshot, turnNumber: nextTurnNumber };
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
      activeWars,
    },
  };

  return { outcome: "success", value: response, diagnostics: [] };
}

function sumByCategory(
  entries: readonly LedgerTransaction[],
  categoryIds: readonly string[],
): number {
  return entries
    .filter((entry) => categoryIds.includes(entry.categoryId))
    .reduce((sum, entry) => sum + Number(entry.debit), 0);
}

function toFinancialLedgerEntries(entries: readonly LedgerTransaction[]): FinancialLedgerEntry[] {
  return entries.map((entry) => ({
    id: entry.transactionId,
    description: entry.reason,
    phase: entry.phaseId,
    amount: Number(entry.newBalance) - Number(entry.previousBalance),
    runningBalance: Number(entry.newBalance),
  }));
}

function toDomainEvents(events: readonly DomainEventEnvelope[]): DomainEvent[] {
  return events.map((event) => ({
    id: event.eventId,
    kind: event.eventType,
    phase: event.aggregateType,
    message: describeDomainEventBody(event.body),
  }));
}

function toRandomDecisions(
  decisions: readonly RandomDecision[],
): CommitMonthResponse["randomDecisions"] {
  return decisions.map((decision) => ({
    purpose: decision.streamId,
    phase: decision.phase,
    entityKey: decision.entityKey,
    value: decision.draw,
    outcome: decision.outcome,
  }));
}

function describeDomainEventBody(body: DomainEventBody): string {
  switch (body.kind) {
    case "NationBudgetChanged":
      return `${body.nationId}: treasury ${String(body.previousTreasury)} -> ${String(body.newTreasury)} (${body.reason})`;
    case "ConstructionProgressed":
      return `${body.nationId}: project ${body.projectId} work ${String(body.previousWork)} -> ${String(body.newWork)}`;
    case "ResearchProgressed":
      return `${body.nationId}: ${body.techId} progress ${String(body.previousPoints)} -> ${String(body.newPoints)}`;
    case "BattleInitiated":
      return `Battle ${body.battleId}: ${body.attackerId} vs ${body.defenderId} in ${body.areaId}`;
    case "BattleResolved":
      return `Battle ${body.battleId}: ${body.winnerId} defeated ${body.loserId}`;
    case "TechnologyDiscovered":
      return `${body.nationId} discovered ${body.techId}`;
  }
}
