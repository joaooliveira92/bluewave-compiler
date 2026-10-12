// packages/phase-engine/src/economyPhases.ts
// Economy phases: monthly_revenue, appropriation, maintenance, obligation.
import type { CampaignSnapshot, ConstructionProject, NationState, Ship } from "@bluewave/campaign";
import { transitionConstructionProject } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import {
  preservationCostPerMonthMicro,
  treasuryCostUnits,
  type ConstructionBalance,
} from "@bluewave/ship-design";
import { fundConstructionProject } from "./constructionFunding.js";
import { constructionResumeTarget } from "./constructionHaltResume.js";
import { fundDesignStudies } from "./designStudies.js";
import { budgetChangedEvent, constructionDelayedEvent, makeLedgerEntry } from "./events.js";
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

/** The monthly yard capacity (treasury units per line) recorded on a project's design, or undefined when it has none. */
function capacityOf(
  designs: CampaignSnapshot["designs"],
  project: ConstructionProject,
): Record<string, number> | undefined {
  const capacity = designs.get(project["designVersionId"])?.constructionPlan?.capacityUnits;
  return capacity === undefined
    ? undefined
    : Object.fromEntries(Object.entries(capacity).map(([line, v]) => [line, v as number]));
}

/** The stable reason a delayed month carries (DESIGN-23 section 32). */
export const PROJECT_DELAYED_ZERO_WORK = "PROJECT_DELAYED_ZERO_WORK" as const;

/**
 * The preservation cost one `HALTED` project pays for a month, in treasury units: half the mothballed maintenance,
 * rounded up to a whole treasury unit (RTW3 manual pp. 30-31; DESIGN-23 section 7). Pure; zero when no base is authored.
 */
export function preservationCostUnits(
  balance: ConstructionBalance,
  treasuryUnitMicro: number,
): number {
  if (!Number.isFinite(treasuryUnitMicro) || treasuryUnitMicro <= 0) return 0;
  const micro = preservationCostPerMonthMicro(balance);
  return micro <= 0 ? 0 : treasuryCostUnits(micro, treasuryUnitMicro);
}

// Phase 4: appropriation — proportional funding of construction projects within
// the nation's construction cap. Halted projects take no ordinary charge and pay
// the preservation cost instead; delayed projects take no charge at all and
// resume the following month (DESIGN-23 section 7).
export function runAppropriationPhase(ctx: MonthContext): void {
  // Design studies are paid first: design-office work is small and gates every new class (ADR-0085).
  fundDesignStudies(ctx);
  const { campaignMonth, eventLedger, financialLedger, nextSeq, collector } = ctx;
  const shipBuilding = ctx.engineOptions?.shipBuilding;

  for (const [nationId, nation] of ctx.currentSnapshot["nations"]) {
    if (!nation["isPlayable"] && !nation["isAI"]) continue;

    const projects = nation["constructionProjects"];
    const haltedProjects = projects.filter((p) => p["status"] === "HALTED");
    const delayedProjects = projects.filter((p) => p["status"] === "DELAYED");

    // One explicit delay record per delayed project, whatever funds are available (DESIGN-23 section 7).
    for (const project of delayedProjects)
      eventLedger.append(
        constructionDelayedEvent(
          project["id"],
          nationId,
          PROJECT_DELAYED_ZERO_WORK,
          nextSeq(),
          campaignMonth,
        ),
      );

    // Preservation cost: half the mothballed maintenance, taking the place of a halted hull's ordinary work charge.
    let preservationDelta = 0;
    if (haltedProjects.length > 0) {
      const balance = shipBuilding?.environmentFor(campaignMonth).constructionBalance;
      const unitMicro = shipBuilding?.treasuryUnitMicro;
      if (balance === undefined || unitMicro === undefined)
        collector.addWarning(
          "CONSTRUCTION_PRESERVATION_BALANCE_MISSING",
          `Nation ${nationId} has ${haltedProjects.length} halted project(s) but no ship-building balance; no preservation cost charged`,
          { stage: "appropriation" },
        );
      else preservationDelta = preservationCostUnits(balance, unitMicro) * haltedProjects.length;
    }

    let updatedProjects = projects;
    let totalDelta = SafeInt.ZERO;

    const expenseReserve = nation["expenses"];
    const available = SafeInt.sub(nation["treasury"], expenseReserve);
    const fundable =
      (available as number) > 0
        ? projects.filter(
            (p) =>
              (p["completedWork"] as number) < (p["totalWork"] as number) &&
              p["status"] !== "COMPLETED" &&
              p["status"] !== "HALTED" &&
              p["status"] !== "DELAYED",
          )
        : [];
    if (fundable.length > 0) {
      const totalRemainingWork = fundable.reduce(
        (sum: SafeInt, p) => SafeInt.add(sum, SafeInt.sub(p["totalWork"], p["completedWork"])),
        SafeInt.ZERO,
      );
      if ((totalRemainingWork as number) > 0) {
        const constructionCap = computeConstructionCap(nation);
        let remainingFunds = available;
        let remainingCap = constructionCap;
        updatedProjects = [...projects];

        for (const project of fundable) {
          if ((remainingCap as number) <= 0) break;

          const remainingWork = SafeInt.sub(project["totalWork"], project["completedWork"]);
          const proportion = (remainingWork as number) / (totalRemainingWork as number);
          const alloc = SafeInt(Math.floor(proportion * (available as number)));
          const cappedAlloc =
            (remainingCap as number) > 0 && alloc > remainingCap ? remainingCap : alloc;
          const clampedAlloc = cappedAlloc > remainingWork ? remainingWork : cappedAlloc;
          if ((clampedAlloc as number) <= 0) continue;

          if (project["packages"] !== undefined) {
            // Per-package construction (ADR-0077): only what the yard can do this month is applied and charged.
            const funded = fundConstructionProject(
              project,
              capacityOf(ctx.currentSnapshot["designs"], project),
              clampedAlloc as number,
              campaignMonth,
            );
            if (funded.applied <= 0) continue;
            const applied = SafeInt(funded.applied);
            totalDelta = SafeInt.add(totalDelta, applied);
            remainingFunds = SafeInt.sub(remainingFunds, applied);
            remainingCap = SafeInt.sub(remainingCap, applied);
            updatedProjects = updatedProjects.map((p) =>
              p["id"] === project["id"] ? funded.project : p,
            );
            continue;
          }

          totalDelta = SafeInt.add(totalDelta, clampedAlloc);
          remainingFunds = SafeInt.sub(remainingFunds, clampedAlloc);
          remainingCap = SafeInt.sub(remainingCap, clampedAlloc);

          updatedProjects = updatedProjects.map((p) =>
            p["id"] === project["id"]
              ? {
                  ...transitionConstructionProject(p, "ACTIVE"),
                  completedWork: SafeInt.add(p["completedWork"], clampedAlloc),
                  paidWork: SafeInt.add(p["paidWork"], clampedAlloc),
                }
              : p,
          );
        }

        // Apply leftover funds to first incomplete project if within cap
        const leftover = applyLeftoverFunding(
          updatedProjects,
          remainingFunds,
          remainingCap,
          ctx.currentSnapshot["designs"],
          campaignMonth,
        );
        updatedProjects = leftover.projects;
        totalDelta = SafeInt.add(totalDelta, leftover.delta);
      }
    }

    // A delayed project resumes the following month: the delay lasts exactly one month (DESIGN-23 section 9).
    if (delayedProjects.length > 0) {
      const designs = ctx.currentSnapshot["designs"];
      updatedProjects = updatedProjects.map((p) =>
        p["status"] === "DELAYED"
          ? transitionConstructionProject(
              p,
              constructionResumeTarget(designs.get(p["designVersionId"])).status,
            )
          : p,
      );
    }

    const totalCharge = SafeInt.add(totalDelta, SafeInt(preservationDelta));
    if ((totalCharge as number) > 0 || delayedProjects.length > 0) {
      const previousTreasury = nation["treasury"];
      const newTreasury = SafeInt.sub(previousTreasury, totalCharge);

      const updatedNation: NationState = {
        ...nation,
        treasury: newTreasury,
        constructionProjects: updatedProjects,
      };
      const updatedNations = new Map(ctx.currentSnapshot["nations"]);
      updatedNations.set(nationId, updatedNation);
      ctx.currentSnapshot = { ...ctx.currentSnapshot, nations: updatedNations };

      if ((totalDelta as number) > 0) {
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
      }

      if (preservationDelta > 0) {
        financialLedger.append(
          makeLedgerEntry(
            nationId,
            "appropriation",
            "CONSTRUCTION_PRESERVATION",
            SafeInt(preservationDelta),
            SafeInt(preservationDelta),
            previousTreasury,
            newTreasury,
            `Preservation cost for ${haltedProjects.length} halted project(s)`,
            campaignMonth,
          ),
        );
      }

      if ((totalCharge as number) > 0) {
        eventLedger.append(
          budgetChangedEvent(
            nationId,
            previousTreasury,
            newTreasury,
            SafeInt.mul(totalCharge, SafeInt(-1)),
            preservationDelta > 0
              ? "Construction appropriation and preservation cost"
              : "Proportional appropriation to construction projects",
            nextSeq(),
            campaignMonth,
          ),
        );
      }
    }
  }
}

// Spend any funds left after proportional allocation on the first incomplete
// project, still bounded by the remaining construction cap.
function applyLeftoverFunding(
  projects: ConstructionProject[],
  remainingFunds: SafeInt,
  remainingCap: SafeInt,
  designs: CampaignSnapshot["designs"],
  campaignMonth: string,
): { projects: ConstructionProject[]; delta: SafeInt } {
  if ((remainingFunds as number) <= 0 || (remainingCap as number) <= 0) {
    return { projects, delta: SafeInt.ZERO };
  }
  // Projects with work packages take leftover funds in order, skipping one the yard cannot work on this month (ADR-0077).
  const offered =
    (remainingFunds as number) > (remainingCap as number) ? remainingCap : remainingFunds;
  for (const candidate of projects) {
    if (candidate["packages"] === undefined || candidate["status"] === "COMPLETED") continue;
    if (candidate["status"] === "HALTED" || candidate["status"] === "DELAYED") continue;
    if ((candidate["completedWork"] as number) >= (candidate["totalWork"] as number)) continue;
    const funded = fundConstructionProject(
      candidate,
      capacityOf(designs, candidate),
      offered as number,
      campaignMonth,
    );
    if (funded.applied <= 0) continue;
    return {
      projects: projects.map((p) => (p["id"] === candidate["id"] ? funded.project : p)),
      delta: SafeInt(funded.applied),
    };
  }
  const firstIncomplete = projects.find(
    (p) =>
      p["packages"] === undefined &&
      (p["completedWork"] as number) < (p["totalWork"] as number) &&
      p["status"] !== "COMPLETED" &&
      p["status"] !== "HALTED" &&
      p["status"] !== "DELAYED",
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
            ...transitionConstructionProject(p, "ACTIVE"),
            completedWork: SafeInt.add(p["completedWork"], cappedExtra),
            paidWork: SafeInt.add(p["paidWork"], cappedExtra),
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
