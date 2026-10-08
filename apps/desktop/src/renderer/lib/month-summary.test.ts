import type { CommitMonthResponse } from "@bluewave/campaign-engine";
import { describe, expect, it } from "vite-plus/test";
import {
  MONTH_HISTORY_LIMIT,
  appendMonthSummary,
  summarizeMonth,
  type MonthSummary,
} from "./month-summary.js";

function response(over: Partial<CommitMonthResponse> = {}): CommitMonthResponse {
  return {
    report: {
      month: { month: 2, year: 1880 },
      openingTreasury: 1000,
      maintenanceCost: 16,
      newConstructionSpending: 60,
      closingTreasury: 944,
    },
    domainEvents: [
      { id: "1", kind: "NationBudgetChanged", phase: "n", message: "uk: treasury 1000 -> 944 (x)" },
      { id: "2", kind: "ConstructionProgressed", phase: "n", message: "uk: project p work 1 -> 2" },
      { id: "3", kind: "ConstructionProgressed", phase: "n", message: "uk: project q work 1 -> 2" },
      { id: "4", kind: "TechnologyDiscovered", phase: "n", message: "uk discovered tech_x" },
      { id: "5", kind: "ResearchProgressed", phase: "n", message: "uk: tech_y progress 1 -> 2" },
    ],
    financialLedger: [],
    randomDecisions: [],
    closingSnapshot: {
      revision: 1,
      month: { month: 2, year: 1880 },
      submarinePools: [],
      minePressure: [],
      landTargetDamage: [],
      battleOutcomes: [
        {
          battleId: "b1",
          areaId: "malta",
          attackerId: "uk",
          defenderId: "france",
          winnerId: "uk",
          loserId: "france",
          warScoreDelta: 2,
          attackerLosses: ["s1"],
          defenderLosses: ["f1", "f2"],
          explanation: [],
        },
      ],
      activeWars: [],
    },
    ...over,
  } as CommitMonthResponse;
}

describe("summarizeMonth", () => {
  it("reports the month's treasury movement and spending from the engine's report", () => {
    const summary = summarizeMonth(response());
    expect(summary).toMatchObject({
      month: { year: 1880, month: 2 },
      openingTreasury: 1000,
      closingTreasury: 944,
      netChange: -56,
      maintenanceCost: 16,
      constructionSpending: 60,
    });
  });

  it("counts events by kind and never carries the debug message strings", () => {
    const summary = summarizeMonth(response());
    expect(summary).toMatchObject({
      technologiesDiscovered: 1,
      constructionUpdates: 2,
      researchUpdates: 1,
    });
    expect(JSON.stringify(summary)).not.toMatch(/tech_x|tech_y|project p/);
  });

  it("describes battles with loss counts, not ship ids", () => {
    const [battle] = summarizeMonth(response()).battles;
    expect(battle).toEqual({
      battleId: "b1",
      areaId: "malta",
      attackerId: "uk",
      defenderId: "france",
      winnerId: "uk",
      attackerLosses: 1,
      defenderLosses: 2,
    });
  });

  it("keeps an undecided battle undecided", () => {
    const base = response();
    const summary = summarizeMonth({
      ...base,
      closingSnapshot: {
        ...base.closingSnapshot,
        battleOutcomes: [
          { ...base.closingSnapshot.battleOutcomes[0]!, winnerId: null, loserId: null },
        ],
      },
    });
    expect(summary.battles[0]?.winnerId).toBeNull();
  });

  it("handles a quiet month: no battles, no events", () => {
    const base = response();
    const summary = summarizeMonth({
      ...base,
      domainEvents: [],
      closingSnapshot: { ...base.closingSnapshot, battleOutcomes: [] },
    });
    expect(summary.battles).toEqual([]);
    expect(summary.technologiesDiscovered).toBe(0);
  });
});

describe("appendMonthSummary", () => {
  const entry = (month: number, closing = 0): MonthSummary => ({
    ...summarizeMonth(response()),
    month: { year: 1880, month },
    closingTreasury: closing,
  });

  it("puts the newest month first", () => {
    const history = appendMonthSummary(appendMonthSummary([], entry(2)), entry(3));
    expect(history.map((h) => h.month.month)).toEqual([3, 2]);
  });

  it("replaces a month that is reported twice instead of duplicating it", () => {
    const history = appendMonthSummary(appendMonthSummary([], entry(2, 1)), entry(2, 2));
    expect(history).toHaveLength(1);
    expect(history[0]?.closingTreasury).toBe(2);
  });

  it("keeps only the most recent months", () => {
    let history: readonly MonthSummary[] = [];
    for (let i = 0; i < MONTH_HISTORY_LIMIT + 5; i++) {
      history = appendMonthSummary(history, {
        ...entry(1),
        month: { year: 1880 + Math.floor(i / 12), month: (i % 12) + 1 },
      });
    }
    expect(history).toHaveLength(MONTH_HISTORY_LIMIT);
  });
});
