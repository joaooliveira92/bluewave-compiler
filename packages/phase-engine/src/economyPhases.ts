// packages/phase-engine/src/economyPhases.ts
// Economy phases: monthly_revenue, appropriation, maintenance, obligation.
import type { ConstructionProject, NationState, Ship } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import { budgetChangedEvent, makeLedgerEntry } from "./events.js";
import type { MonthContext } from "./monthContext.js";

function computeMaintenanceCost(ship: Ship): SafeInt {
  return SafeInt.div(SafeInt.mul(ship["hitPoints"], SafeInt(10)), SafeInt(100), "floor");
}

function computeConstructionCap(nation: NationState): SafeInt {
  const base = nation["baseResources"] ?? (0 as SafeInt);
  return SafeInt.div(SafeInt.div(base, SafeInt(12)), SafeInt(100), "floor");
}

// Phase 2: monthly_revenue — naval appropriation into each active nation's treasury.
export function runMonthlyRevenuePhase(ctx: MonthContext): void {
  const { campaignMonth, eventLedger, financialLedger, nextSeq } = ctx;

  for (const [nationId, nation] of ctx.currentSnapshot["nations"]) {
    if (!nation["isPlayable"] && !nation["isAI"]) continue;
    const baseResources = nation["baseResources"] ?? (0 as SafeInt);
    const rateBp = nation["navalAppropriationRateBp"] ?? (0 as SafeInt);
    const revenue = SafeInt.div(
      SafeInt.div(SafeInt.mul(baseResources, rateBp), SafeInt(10000)),
      SafeInt(12),
      "floor",
    );
    if ((revenue as number) <= 0) continue;

    const previousBalance = nation["treasury"];
    const newBalance = SafeInt.add(previousBalance, revenue);

    const updatedNation: NationState = {
      ...nation,
      treasury: newBalance,
    };
    const updatedNations = new Map(ctx.currentSnapshot["nations"]);
    updatedNations.set(nationId, updatedNation);
    ctx.currentSnapshot = { ...ctx.currentSnapshot, nations: updatedNations };

    financialLedger.append(
      makeLedgerEntry(
        nationId,
        "monthly_revenue",
        "NAVAL_APPROPRIATION",
        revenue,
        revenue,
        previousBalance,
        newBalance,
        "Monthly naval appropriation revenue",
        campaignMonth,
      ),
    );

    eventLedger.append(
      budgetChangedEvent(
        nationId,
        previousBalance,
        newBalance,
        revenue,
        "Monthly naval appropriation revenue",
        nextSeq(),
        campaignMonth,
      ),
    );
  }
}

// Phase 4: appropriation — proportional funding of construction projects within
// the nation's construction cap.
export function runAppropriationPhase(ctx: MonthContext): void {
  const { campaignMonth, eventLedger, financialLedger, nextSeq } = ctx;

  for (const [nationId, nation] of ctx.currentSnapshot["nations"]) {
    if (!nation["isPlayable"] && !nation["isAI"]) continue;
    const expenseReserve = nation["expenses"];
    const available = SafeInt.sub(nation["treasury"], expenseReserve);
    if ((available as number) <= 0) continue;

    const projects = nation["constructionProjects"].filter(
      (p) =>
        (p["completedWork"] as number) < (p["totalWork"] as number) && p["status"] !== "COMPLETED",
    );
    if (projects.length === 0) continue;

    const totalRemainingWork = projects.reduce(
      (sum: SafeInt, p) => SafeInt.add(sum, SafeInt.sub(p["totalWork"], p["completedWork"])),
      SafeInt.ZERO,
    );
    if ((totalRemainingWork as number) <= 0) continue;

    const constructionCap = computeConstructionCap(nation);
    let remainingFunds = available;
    let remainingCap = constructionCap;
    let updatedProjects = [...nation["constructionProjects"]];
    let totalDelta = SafeInt.ZERO;

    for (const project of projects) {
      if ((remainingCap as number) <= 0) break;

      const remainingWork = SafeInt.sub(project["totalWork"], project["completedWork"]);
      const proportion = (remainingWork as number) / (totalRemainingWork as number);
      const alloc = SafeInt(Math.floor(proportion * (available as number)));
      const cappedAlloc =
        (remainingCap as number) > 0 && alloc > remainingCap ? remainingCap : alloc;
      const clampedAlloc = cappedAlloc > remainingWork ? remainingWork : cappedAlloc;
      if ((clampedAlloc as number) <= 0) continue;

      totalDelta = SafeInt.add(totalDelta, clampedAlloc);
      remainingFunds = SafeInt.sub(remainingFunds, clampedAlloc);
      remainingCap = SafeInt.sub(remainingCap, clampedAlloc);

      updatedProjects = updatedProjects.map((p) =>
        p["id"] === project["id"]
          ? {
              ...p,
              completedWork: SafeInt.add(p["completedWork"], clampedAlloc),
              paidWork: SafeInt.add(p["paidWork"], clampedAlloc),
              status: "ACTIVE" as const,
            }
          : p,
      );
    }

    // Apply leftover funds to first incomplete project if within cap
    const leftover = applyLeftoverFunding(updatedProjects, remainingFunds, remainingCap);
    updatedProjects = leftover.projects;
    totalDelta = SafeInt.add(totalDelta, leftover.delta);

    if ((totalDelta as number) > 0) {
      const previousTreasury = nation["treasury"];
      const newTreasury = SafeInt.sub(previousTreasury, totalDelta);

      const updatedNation: NationState = {
        ...nation,
        treasury: newTreasury,
        constructionProjects: updatedProjects,
      };
      const updatedNations = new Map(ctx.currentSnapshot["nations"]);
      updatedNations.set(nationId, updatedNation);
      ctx.currentSnapshot = { ...ctx.currentSnapshot, nations: updatedNations };

      financialLedger.append(
        makeLedgerEntry(
          nationId,
          "appropriation",
          "APPROPRIATION",
          totalDelta,
          totalDelta,
          previousTreasury,
          newTreasury,
          "Proportional appropriation to construction projects",
          campaignMonth,
        ),
      );

      eventLedger.append(
        budgetChangedEvent(
          nationId,
          previousTreasury,
          newTreasury,
          SafeInt.mul(totalDelta, SafeInt(-1)),
          "Proportional appropriation to construction projects",
          nextSeq(),
          campaignMonth,
        ),
      );
    }
  }
}

// Spend any funds left after proportional allocation on the first incomplete
// project, still bounded by the remaining construction cap.
function applyLeftoverFunding(
  projects: ConstructionProject[],
  remainingFunds: SafeInt,
  remainingCap: SafeInt,
): { projects: ConstructionProject[]; delta: SafeInt } {
  if ((remainingFunds as number) <= 0 || (remainingCap as number) <= 0) {
    return { projects, delta: SafeInt.ZERO };
  }
  const firstIncomplete = projects.find(
    (p) =>
      (p["completedWork"] as number) < (p["totalWork"] as number) && p["status"] !== "COMPLETED",
  );
  if (!firstIncomplete) return { projects, delta: SafeInt.ZERO };

  const remainingWork = SafeInt.sub(firstIncomplete["totalWork"], firstIncomplete["completedWork"]);
  const extra = remainingFunds > remainingWork ? remainingWork : remainingFunds;
  const cappedExtra = extra > remainingCap ? remainingCap : extra;
  if ((cappedExtra as number) <= 0) return { projects, delta: SafeInt.ZERO };

  return {
    projects: projects.map((p) =>
      p["id"] === firstIncomplete["id"]
        ? {
            ...p,
            completedWork: SafeInt.add(p["completedWork"], cappedExtra),
            paidWork: SafeInt.add(p["paidWork"], cappedExtra),
            status: "ACTIVE" as const,
          }
        : p,
    ),
    delta: cappedExtra,
  };
}

// Phase 5: maintenance — monthly ship maintenance, floored at zero treasury.
export function runMaintenancePhase(ctx: MonthContext): void {
  const { campaignMonth, eventLedger, financialLedger, nextSeq } = ctx;

  for (const [nationId, nation] of ctx.currentSnapshot["nations"]) {
    if (!nation["isPlayable"] && !nation["isAI"]) continue;

    let totalMaintenance = SafeInt.ZERO;
    for (const fleet of nation["fleets"]) {
      for (const ship of fleet["ships"]) {
        totalMaintenance = SafeInt.add(totalMaintenance, computeMaintenanceCost(ship));
      }
    }

    if ((totalMaintenance as number) <= 0) continue;

    const previousTreasury = nation["treasury"];
    const newTreasury = SafeInt.sub(previousTreasury, totalMaintenance);
    const actualNew = newTreasury < (0 as SafeInt) ? (0 as SafeInt) : newTreasury;

    const updatedNation: NationState = {
      ...nation,
      treasury: actualNew,
      maintenanceCost: totalMaintenance,
    };
    const updatedNations = new Map(ctx.currentSnapshot["nations"]);
    updatedNations.set(nationId, updatedNation);
    ctx.currentSnapshot = { ...ctx.currentSnapshot, nations: updatedNations };

    financialLedger.append(
      makeLedgerEntry(
        nationId,
        "maintenance",
        "MAINTENANCE_EXPENDITURE",
        totalMaintenance,
        totalMaintenance,
        previousTreasury,
        actualNew,
        "Monthly ship maintenance costs",
        campaignMonth,
      ),
    );

    eventLedger.append(
      budgetChangedEvent(
        nationId,
        previousTreasury,
        actualNew,
        SafeInt.mul(totalMaintenance, SafeInt(-1)),
        "Monthly ship maintenance costs",
        nextSeq(),
        campaignMonth,
      ),
    );
  }
}

// Phase 6: obligation — mandatory fixed expenses, floored at zero treasury.
export function runObligationPhase(ctx: MonthContext): void {
  const { campaignMonth, collector, eventLedger, financialLedger, nextSeq } = ctx;

  for (const [nationId, nation] of ctx.currentSnapshot["nations"]) {
    if (!nation["isPlayable"] && !nation["isAI"]) continue;
    const expense = nation["expenses"];
    const previousTreasury = nation["treasury"];
    const newTreasury = SafeInt.sub(previousTreasury, expense);
    const actualNew = newTreasury < (0 as SafeInt) ? (0 as SafeInt) : newTreasury;

    if ((newTreasury as number) < 0) {
      collector.addError(
        "NEGATIVE_TREASURY_OBLIGATION",
        `Nation ${nationId} would have negative treasury after obligation`,
        { stage: "obligation" },
      );
    }

    const updatedNation: NationState = {
      ...nation,
      treasury: actualNew,
    };
    const updatedNations = new Map(ctx.currentSnapshot["nations"]);
    updatedNations.set(nationId, updatedNation);
    ctx.currentSnapshot = { ...ctx.currentSnapshot, nations: updatedNations };

    financialLedger.append(
      makeLedgerEntry(
        nationId,
        "obligation",
        "OBLIGATION",
        expense,
        expense,
        previousTreasury,
        actualNew,
        "Mandatory fixed expenses",
        campaignMonth,
      ),
    );

    eventLedger.append(
      budgetChangedEvent(
        nationId,
        previousTreasury,
        actualNew,
        SafeInt.mul(expense, SafeInt(-1)),
        "Mandatory fixed expenses",
        nextSeq(),
        campaignMonth,
      ),
    );
  }
}
