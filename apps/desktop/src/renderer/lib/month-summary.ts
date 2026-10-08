import type { CommitMonthResponse } from "@bluewave/campaign-engine";

/**
 * A player-readable report of one committed month, built only from the structured parts of the
 * engine's commit response. The response's `domainEvents[].message` strings are written for the
 * debug tools and print raw ids, so they are counted by kind here, never shown.
 */
export interface MonthBattleSummary {
  readonly battleId: string;
  readonly areaId: string;
  readonly attackerId: string;
  readonly defenderId: string;
  /** Null when the battle ended undecided (tie or time limit). */
  readonly winnerId: string | null;
  readonly attackerLosses: number;
  readonly defenderLosses: number;
}

export interface MonthSummary {
  readonly month: { readonly year: number; readonly month: number };
  readonly openingTreasury: number;
  readonly closingTreasury: number;
  /** Closing minus opening: the month's net movement of funds. */
  readonly netChange: number;
  readonly maintenanceCost: number;
  readonly constructionSpending: number;
  readonly battles: readonly MonthBattleSummary[];
  readonly technologiesDiscovered: number;
  readonly constructionUpdates: number;
  readonly researchUpdates: number;
}

function countKind(events: CommitMonthResponse["domainEvents"], kind: string): number {
  return events.filter((event) => event.kind === kind).length;
}

export function summarizeMonth(response: CommitMonthResponse): MonthSummary {
  const { report, domainEvents, closingSnapshot } = response;
  return {
    month: { year: report.month.year, month: report.month.month },
    openingTreasury: report.openingTreasury,
    closingTreasury: report.closingTreasury,
    netChange: report.closingTreasury - report.openingTreasury,
    maintenanceCost: report.maintenanceCost,
    constructionSpending: report.newConstructionSpending,
    battles: closingSnapshot.battleOutcomes.map((battle) => ({
      battleId: battle.battleId,
      areaId: battle.areaId,
      attackerId: battle.attackerId,
      defenderId: battle.defenderId,
      winnerId: battle.winnerId,
      attackerLosses: battle.attackerLosses.length,
      defenderLosses: battle.defenderLosses.length,
    })),
    technologiesDiscovered: countKind(domainEvents, "TechnologyDiscovered"),
    constructionUpdates: countKind(domainEvents, "ConstructionProgressed"),
    researchUpdates: countKind(domainEvents, "ResearchProgressed"),
  };
}

/** The most recent months kept in the in-session history, newest first. */
export const MONTH_HISTORY_LIMIT = 24;

export function appendMonthSummary(
  history: readonly MonthSummary[],
  summary: MonthSummary,
): readonly MonthSummary[] {
  const withoutDuplicate = history.filter(
    (entry) => entry.month.year !== summary.month.year || entry.month.month !== summary.month.month,
  );
  return [summary, ...withoutDuplicate].slice(0, MONTH_HISTORY_LIMIT);
}
