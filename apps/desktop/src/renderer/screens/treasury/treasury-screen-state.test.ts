import { describe, expect, it } from "vite-plus/test";
import type { PlayerProjection } from "@bluewave/campaign-engine";

import {
  applyLoadFailed,
  applyProjectionLoaded,
  buildBudgetBar,
  initialTreasuryScreenState,
  summarizeTreasury,
  type TreasuryBreakdown,
} from "./treasury-screen-state.js";

const projection: PlayerProjection = {
  campaignIdentity: "campaign_1",
  revision: 3 as PlayerProjection["revision"],
  month: { year: 1880, month: 3 },
  nationName: "United Kingdom",
  projectedSurplusDeficit: 1000,
  economy: {
    treasury: 50000,
    monthlyAppropriation: 4000,
    shipyardCapacity: 50,
    constructionSpend: 500,
    researchSpend: 300,
    maintenanceCost: 200,
  },
  knownTechnologyIds: ["tech_steel_hull"],
  fleet: [
    {
      name: "Channel Fleet",
      divisions: [{ name: "Channel Squadron", areaId: "area_northern_europe", ships: [] }],
    },
  ],
  strategicAreas: [{ id: "area_northern_europe", name: "Northern Europe" }],
  ports: [
    {
      id: "port_portsmouth",
      name: "Portsmouth",
      areaId: "area_northern_europe",
      capacity: 30,
    },
  ],
  knownEnemyNations: ["nation_germany"],
  commandWorkspace: { commands: [], movementCommands: [] },
  snapshotHash: "hash_abc123",
};

describe("treasury-screen-state", () => {
  it("starts with no projection loaded", () => {
    const state = initialTreasuryScreenState();
    expect(state.projection).toBeNull();
    expect(state.loadError).toBeNull();
  });

  it("applies a loaded projection and clears prior errors", () => {
    const failed = applyLoadFailed(initialTreasuryScreenState(), "SESSION_NOT_FOUND");
    const loaded = applyProjectionLoaded(failed, projection);
    expect(loaded.projection).toBe(projection);
    expect(loaded.loadError).toBeNull();
  });

  it("records a load failure", () => {
    const state = applyLoadFailed(initialTreasuryScreenState(), "SESSION_NOT_FOUND");
    expect(state.loadError).toBe("SESSION_NOT_FOUND");
  });

  it("summarizes every row from the projection (income, expenditure, result)", () => {
    const t = summarizeTreasury(projection);
    expect(t.income).toBe(4000);
    expect(t.fleetMaintenance).toBe(200);
    expect(t.constructionSpend).toBe(500);
    expect(t.researchSpend).toBe(300);
    expect(t.totalExpenditure).toBe(1000);
    expect(t.projectedSurplusDeficit).toBe(1000);
    expect(t.availableFunds).toBe(50000);
    expect(t.projectedMonthEndFunds).toBe(51000);
  });

  it("carries a negative projected surplus/deficit honestly", () => {
    const deficit: PlayerProjection = {
      ...projection,
      projectedSurplusDeficit: -250,
      economy: { ...projection.economy, maintenanceCost: 2500 },
    };
    const t = summarizeTreasury(deficit);
    expect(t.projectedSurplusDeficit).toBe(-250);
    expect(t.projectedMonthEndFunds).toBe(49750);
  });
});

describe("buildBudgetBar", () => {
  const breakdown = (over: Partial<TreasuryBreakdown>): TreasuryBreakdown => ({
    income: 100,
    fleetMaintenance: 20,
    constructionSpend: 10,
    researchSpend: 10,
    totalExpenditure: 40,
    projectedSurplusDeficit: 60,
    availableFunds: 0,
    projectedMonthEndFunds: 60,
    ...over,
  });

  it("scales segments and the income marker to one shared width", () => {
    const bar = buildBudgetBar(breakdown({}));
    expect(bar.overBudget).toBe(false);
    expect(bar.incomeMarker).toBe(1);
    expect(bar.segments.map((s) => [s.id, s.width])).toEqual([
      ["maintenance", 0.2],
      ["construction", 0.1],
      ["research", 0.1],
    ]);
    expect(bar.segments.map((s) => s.shareOfSpend)).toEqual([0.5, 0.25, 0.25]);
  });

  it("shows over-spending as the stack running past the income marker", () => {
    const bar = buildBudgetBar(
      breakdown({
        income: 50,
        fleetMaintenance: 60,
        constructionSpend: 30,
        researchSpend: 10,
        totalExpenditure: 100,
      }),
    );
    expect(bar.overBudget).toBe(true);
    // The scale becomes the spend (100): income sits at the halfway line.
    expect(bar.incomeMarker).toBe(0.5);
    expect(bar.segments.reduce((sum, s) => sum + s.width, 0)).toBeCloseTo(1, 10);
  });

  it("copes with a zero budget without dividing by zero", () => {
    const bar = buildBudgetBar(
      breakdown({
        income: 0,
        fleetMaintenance: 0,
        constructionSpend: 0,
        researchSpend: 0,
        totalExpenditure: 0,
      }),
    );
    expect(bar.incomeMarker).toBe(0);
    expect(bar.overBudget).toBe(false);
    expect(bar.segments.every((s) => s.width === 0 && s.shareOfSpend === 0)).toBe(true);
  });
});
