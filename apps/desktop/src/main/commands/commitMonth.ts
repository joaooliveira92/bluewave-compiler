import type {
  BattleInstance,
  CampaignSnapshot,
  CampaignState,
} from "@bluewave/campaign";
import {
  advanceMonth,
  canAdvance,
  VICTORY_MAJOR_MAX_FRACTION,
  VICTORY_MINOR_MAX_FRACTION,
  WAR_SCORE_DECISIVE,
  WAR_SCORE_MAJOR,
  WAR_SCORE_MINOR,
} from "@bluewave/campaign";
import type {
  BattleOutcome,
  CommitMonthResponse,
  DomainEvent,
  FinancialLedgerEntry,
} from "@bluewave/campaign-engine";
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
import { clearPendingEnvelopes, pendingEnvelopesForExecution } from "../pendingCommands.js";
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
  const result = executor.execute(executionSnapshot, pendingCommands, randomSeed, collector);

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

function sumByCategory(
  entries: readonly LedgerTransaction[],
  categoryIds: readonly string[],
): number {
  return entries
    .filter((entry) => categoryIds.includes(entry.categoryId))
    .reduce((sum, entry) => sum + Number(entry.debit), 0);
}

/**
 * Hydrate the month's `BattleOutcome` list (INC-2) strictly from the engine's
 * authoritative snapshots — nothing fabricated. One flat, vanilla-safe
 * `BattleOutcome` per battle that became `phase === "resolved"` (with a
 * `BattleResult`) THIS month, i.e. present on the post-month snapshot but not
 * yet resolved on the pre-month snapshot.
 *
 * The INC-2 ticket proposed collecting the ids from `BattleResolved` domain
 * events in `MonthResult.eventLedger.all`, but verified against the actual
 * engine the `month.ts` battle-resolution phase never emits `BattleResolved`
 * (or `BattleInitiated`) domain events (the `BattleResolved` body type exists
 * in `packages/events/src/envelope.ts` but no phase appends it). `wars.battles`
 * accumulates across months (`month.ts:2573`), so "resolved this month" is the
 * pre→post resolved-set delta — a pure, deterministic, read-only derivation
 * that keeps the read-only-over-engine boundary and yields byte-identical
 * behavior for months that resolve no battle (`[]`).
 */
function collectBattleOutcomes(
  preSnapshot: CampaignSnapshot,
  postSnapshot: CampaignSnapshot,
): BattleOutcome[] {
  const resolvedThisMonth = postSnapshot.wars.battles.filter(
    (b) =>
      b.phase === "resolved" &&
      b.result !== undefined &&
      !preSnapshot.wars.battles.some(
        (prev) => prev.id === b.id && prev.phase === "resolved",
      ),
  );

  return resolvedThisMonth.map((battle) =>
    mapBattleOutcome(battle, preSnapshot, postSnapshot),
  );
}

/**
 * Map one resolved `BattleInstance` to the flat web `BattleOutcome`.
 *
 * `warScoreDelta` re-derives the engine's victory class from the losing side's
 * loss-fraction, but on the **PRE-month snapshot** (`preSnapshot`), NOT the
 * post-battle snapshot. `applyBattleResult`
 * (`packages/phase-engine/src/month.ts:1508-1538`) computes the fraction over
 * the snapshot it is called with — which is the month's state BEFORE
 * `applyBattleConsequences` (month.ts:2724) reduces survivors' HP and REMOVES
 * sunk ships. Counting the loser's ships on the post-month snapshot would
 * therefore see post-damage HP and lose ships sunk this month, re-deriving a
 * wrong (typically smaller) class than the engine actually applied. The
 * pre-month snapshot restores exactly the HP/ship-set the engine used.
 *
 * Residual inexactness (documented, accepted): in a month that resolves MULTIPLE
 * battles against the same opponent, the engine computes battle B's class off
 * battle A's already-applied damage; deriving every battle off the single
 * pre-month snapshot cannot reproduce that per-battle cascade. For the common
 * single-battle month this matches the engine *iff* the loser's engaged fleet
 * ship-set/HP are unchanged between the pre-month snapshot and
 * `applyBattleResult` — a ship commissioned into that fleet same-month appears
 * in the engine's basis but not here, so the bridge's lossFraction can be
 * overstated. Both residuals (cascade + commissioning) are recorded in
 * ADR-0028 §Consequences and cross-referenced in INC-5; we deliberately do NOT
 * reconstruct either here (keeps the bridge read-only and simple).
 *
 * Fallback (INC-2): if the losing nation or its fleet ships are genuinely
 * unavailable on the pre-month snapshot (`loserNation === undefined`, or the
 * fleet has no non-under-construction ships / zero total HP), set
 * `warScoreDelta: 0` AND record why — the old
 * `totalHp > 0 ? lossHp / totalHp : 1` fallback would turn absence into a
 * fabricated "decisive +10". Only availability of pre-month ships permits a
 * real re-derivation.
 */
export function mapBattleOutcome(
  battle: BattleInstance,
  preSnapshot: CampaignSnapshot,
  _postSnapshot: CampaignSnapshot, // unused: `battle` already carries the post-month state; the derivation reads PRE
): BattleOutcome {
  const result = battle.result!;
  const explanation = [...result.explanation];
  const loserId = result.loserId;
  // A non-decided battle (winnerId/loserId both null, ADR-0026 §7) contributes
  // NO war score, so its delta is 0 — the bridge never fabricates a winner.
  if (result.winnerId === null || loserId === null) {
    return {
      battleId: battle.id,
      areaId: battle.areaId,
      attackerId: battle.attackerId,
      defenderId: battle.defenderId,
      winnerId: result.winnerId,
      loserId: result.loserId,
      warScoreDelta: 0,
      attackerLosses: [...result.attackerLosses],
      defenderLosses: [...result.defenderLosses],
      explanation,
    };
  }

  const loserIsAttacker = loserId === battle.attackerId;
  const loserFleetIds = loserIsAttacker ? battle.attackerFleetIds : battle.defenderFleetIds;
  // The losing side's ships at PRE-battle HP, including any sunk this month
  // (they are still counted), mirroring the snapshot `applyBattleResult`
  // computed over (month.ts:1508-1538).
  const loserNation = preSnapshot.nations.get(loserId);
  const loserShips = loserNation
    ? loserNation.fleets
        .filter((f) => loserFleetIds.includes(f.id))
        .flatMap((f) => f.ships)
        .filter((s) => !s.isUnderConstruction)
    : [];
  const totalHp = loserShips.reduce((sum, s) => sum + Number(s.hitPoints), 0);
  const lossHp = loserShips.reduce(
    (sum, s) => sum + Number(result.damageReport[s.id] ?? 0),
    0,
  );
  // INC-2 fallback: a genuinely unavailable loser nation / no fleet ships
  // cannot yield a real class — report 0 and why, never a fabricated +10.
  if (loserNation === undefined || loserShips.length === 0 || totalHp <= 0) {
    explanation.push(
      `war-score delta not re-derived: losing nation "${loserId}" or its fleet ships are unavailable on the pre-month snapshot`,
    );
    return {
      battleId: battle.id,
      areaId: battle.areaId,
      attackerId: battle.attackerId,
      defenderId: battle.defenderId,
      winnerId: result.winnerId,
      loserId: result.loserId,
      warScoreDelta: 0,
      attackerLosses: [...result.attackerLosses],
      defenderLosses: [...result.defenderLosses],
      explanation,
    };
  }

  const lossFraction = lossHp / totalHp;
  const level =
    lossFraction >= VICTORY_MAJOR_MAX_FRACTION
      ? "decisive"
      : lossFraction >= VICTORY_MINOR_MAX_FRACTION
        ? "major"
        : "minor";
  const magnitude =
    level === "decisive"
      ? WAR_SCORE_DECISIVE
      : level === "major"
        ? WAR_SCORE_MAJOR
        : WAR_SCORE_MINOR;

  return {
    battleId: battle.id,
    areaId: battle.areaId,
    attackerId: battle.attackerId,
    defenderId: battle.defenderId,
    winnerId: result.winnerId,
    loserId: result.loserId,
    warScoreDelta: magnitude,
    attackerLosses: [...result.attackerLosses],
    defenderLosses: [...result.defenderLosses],
    explanation,
  };
}

/**
 * A copy of `snapshot` with the player's slot promoted to index 0, keeping
 * every other slot (including all AI slots) in its original relative order.
 * `MonthExecutor`'s command_collection authorizes human commands against
 * `slots[0]` only, so this is the delivery-seam fix for the desktop's
 * any-nation player choice. Returns the SAME snapshot when the player is
 * already first (no-op), and never mutates the input.
 */
function promotePlayerSlotForExecution(
  snapshot: import("@bluewave/campaign").CampaignSnapshot,
  playerSlotId: string,
): import("@bluewave/campaign").CampaignSnapshot {
  const playerIndex = snapshot.slots.findIndex((slot) => slot.nationId === playerSlotId);
  if (playerIndex <= 0) return snapshot;
  const playerSlot = snapshot.slots[playerIndex]!;
  return {
    ...snapshot,
    slots: [
      playerSlot,
      ...snapshot.slots.slice(0, playerIndex),
      ...snapshot.slots.slice(playerIndex + 1),
    ],
  };
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
