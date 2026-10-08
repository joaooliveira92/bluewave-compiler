import { describe, expect, it } from "vite-plus/test";
import type { MonthBattleSummary, MonthSummary } from "../../lib/month-summary.js";
import { describeBattle, progressLine, signed } from "./month-report-format.js";

const nation = (id: string) => ({ uk: "Britain", france: "France" })[id] ?? id;
const area = (id: string) => ({ malta: "Malta" })[id] ?? id;

const battle = (over: Partial<MonthBattleSummary> = {}): MonthBattleSummary => ({
  battleId: "b",
  areaId: "malta",
  attackerId: "uk",
  defenderId: "france",
  winnerId: "uk",
  attackerLosses: 1,
  defenderLosses: 2,
  ...over,
});

const summary = (over: Partial<MonthSummary> = {}): MonthSummary => ({
  month: { year: 1880, month: 2 },
  openingTreasury: 0,
  closingTreasury: 0,
  netChange: 0,
  maintenanceCost: 0,
  constructionSpending: 0,
  battles: [],
  technologiesDiscovered: 0,
  constructionUpdates: 0,
  researchUpdates: 0,
  ...over,
});

describe("signed", () => {
  it("shows direction explicitly, with a real minus sign", () => {
    expect(signed(20)).toBe("+20");
    expect(signed(-56)).toBe("−56");
    expect(signed(0)).toBe("0");
    expect(signed(12345)).toBe("+12,345");
  });
});

describe("describeBattle", () => {
  it("says who won where and what it cost each side", () => {
    expect(describeBattle(battle(), nation, area)).toBe(
      "Britain defeated France in Malta. Britain lost 1 ship, France lost 2 ships.",
    );
  });

  it("names the defender as winner when the attacker lost", () => {
    expect(describeBattle(battle({ winnerId: "france" }), nation, area)).toBe(
      "France defeated Britain in Malta. Britain lost 1 ship, France lost 2 ships.",
    );
  });

  it("calls an undecided battle a draw, never a win", () => {
    const text = describeBattle(battle({ winnerId: null }), nation, area);
    expect(text).toContain("fought to a draw");
    expect(text).not.toContain("defeated");
  });

  it("falls back to the given names for unknown nations and areas", () => {
    expect(
      describeBattle(battle({ attackerId: "x", areaId: "y", winnerId: "x" }), nation, area),
    ).toContain("x defeated France in y.");
  });
});

describe("progressLine", () => {
  it("lists only what happened, pluralised", () => {
    expect(progressLine(summary({ constructionUpdates: 2, technologiesDiscovered: 1 }))).toBe(
      "2 construction updates · 1 technology discovered",
    );
    expect(progressLine(summary({ researchUpdates: 1 }))).toBe("1 research update");
  });

  it("is null for a month with no progress to report", () => {
    expect(progressLine(summary())).toBeNull();
  });
});
