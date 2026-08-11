// content/shipbuilding/monthlyProcessor.wired.ts - M6 Halt/Accelerate/Delay wiring
// Wires halt/accelerate/delay + yard overload + funds into monthly loop

import type { ConstructionProject } from "./construction.ts";
import * as dockEnlargement from "./dockEnlargement.ts";
import { getDelayRisk } from "./shipyardCapacity.ts";

export interface WiredProcessorInput {
  campaignId: string;
  turnId: string;
  nationId: string;
  projects: ConstructionProject[];
  dockSize: number;
  availableFunds: number;
}

export const runWiredMonth = (input: WiredProcessorInput) => {
  const maxTonnage = dockEnlargement.getMaxTonnageCapacity(input.dockSize);
  const currentTonnage = dockEnlargement.getCurrentTonnage(input.projects);
  const isOverloaded = currentTonnage > maxTonnage;
  const overloadRatio = currentTonnage / maxTonnage;
  const delayRisk = getDelayRisk(overloadRatio);

  let fundsRemaining = input.availableFunds;
  const results: {
    projectId: string;
    charged: number;
    remaining: number;
    delayed: boolean;
    halted: boolean;
  }[] = [];

  for (const p of input.projects) {
    if (p.status === "halted" || p.isHalted) {
      // RTW3: halted costs less
      const haltedCost = Math.round(p.monthlyCost * 0.2);
      fundsRemaining -= haltedCost;
      results.push({
        projectId: p.id,
        charged: haltedCost,
        remaining: p.remainingMonths,
        delayed: false,
        halted: true,
      });
      continue;
    }
    if (p.isDelayedThisMonth) {
      // RTW3: delayed = skip cost this month
      results.push({
        projectId: p.id,
        charged: 0,
        remaining: p.remainingMonths,
        delayed: true,
        halted: false,
      });
      continue;
    }
    // Roll delay if overloaded or accelerated elsewhere
    const willDelay = isOverloaded && Math.random() < delayRisk;
    if (willDelay) {
      results.push({
        projectId: p.id,
        charged: 0,
        remaining: p.remainingMonths + 1,
        delayed: true,
        halted: false,
      });
      continue;
    }
    const cost = p.isAccelerated ? Math.round(p.monthlyCost * 1.3) : p.monthlyCost;
    if (fundsRemaining < cost) {
      // Insufficient funds - must halt or delay - prestige consequence
      results.push({
        projectId: p.id,
        charged: 0,
        remaining: p.remainingMonths,
        delayed: true,
        halted: false,
      });
      continue;
    }
    fundsRemaining -= cost;
    const decrement = p.isAccelerated ? 2 : 1;
    results.push({
      projectId: p.id,
      charged: cost,
      remaining: Math.max(0, p.remainingMonths - decrement),
      delayed: false,
      halted: false,
    });
  }

  return {
    maxTonnage,
    currentTonnage,
    isOverloaded,
    delayRisk,
    fundsRemaining,
    results,
    // Caller should emit monthly_construction_progress + payment_links + delay_events + completion_events
  };
};

// Example M6
export const exampleM6 = runWiredMonth({
  campaignId: "camp_1880",
  turnId: "1880_02",
  nationId: "uk",
  dockSize: 12000,
  availableFunds: 500,
  projects: [
    {
      id: "p1",
      orderId: "o1",
      campaignId: "camp_1880",
      nationId: "uk",
      shipClassDesignId: "bb_a",
      status: "active",
      totalCost: 1200,
      monthlyCost: 100,
      totalMonths: 12,
      remainingMonths: 10,
      isHalted: false,
      isAccelerated: false,
      isDelayedThisMonth: false,
      dockSizeRequired: 10000,
      createdTurnId: "1880_01",
    } as ConstructionProject,
    {
      id: "p2",
      orderId: "o2",
      campaignId: "camp_1880",
      nationId: "uk",
      shipClassDesignId: "bb_b",
      status: "halted",
      totalCost: 1200,
      monthlyCost: 100,
      totalMonths: 12,
      remainingMonths: 12,
      isHalted: true,
      isAccelerated: false,
      isDelayedThisMonth: false,
      dockSizeRequired: 10000,
      createdTurnId: "1880_01",
    } as ConstructionProject,
  ],
});
// p1 charged 100, remaining 9; p2 halted charged 20, remaining 12
