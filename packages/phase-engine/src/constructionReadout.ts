// packages/phase-engine/src/constructionReadout.ts
// Compiled display readouts for a dockyard project (SB3-R31): the monthly instalment, remaining months, total cost and
// launch month. Pure derivations over the project, its compiled design and the campaign month — never authored in the
// engine state and never in the renderer, which consumes these values as display only.

import {
  advanceMonth,
  monthId,
  type CompiledDesignVersion,
  type ConstructionProject,
} from "@bluewave/campaign";

export interface ConstructionProjectReadout {
  /** The project's total cost in treasury/work units (its total work). */
  readonly totalCostUnits: number;
  /** The most work (and so payment) the project can take in one month: its yard's summed line capacity, capped by what is left. */
  readonly monthlyInstalmentUnits: number;
  /** Whole months left at the monthly instalment, 0 for a finished project. */
  readonly remainingMonths: number;
  /** The `YYYY-MM` the project reaches full work at that rate, or null when it is already complete. */
  readonly launchMonth: string | null;
}

/** The campaign month `months` later, or the same month for `months <= 0`; `YYYY-MM` in and out. */
function addMonths(month: string, months: number): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match || months <= 0) return month;
  const advanced = advanceMonth(Number(match[1]), Number(match[2]), months);
  return monthId(advanced.year, advanced.month);
}

/**
 * The compiled readout for one project. `monthlyInstalmentUnits` is the design's construction-plan capacity summed over
 * its lines (an order with no plan has no capacity record, so the whole remaining work is one instalment). Pure,
 * deterministic, integer arithmetic only; the UI slice renders these values and authors none of them.
 */
export function constructionProjectReadout(
  project: ConstructionProject,
  design: CompiledDesignVersion | undefined,
  campaignMonth: string,
): ConstructionProjectReadout {
  const totalCostUnits = Number(project.totalWork);
  const remainingWork = Math.max(0, totalCostUnits - Number(project.completedWork));
  const capacityUnits = design?.constructionPlan?.capacityUnits;
  const capacityTotal =
    capacityUnits === undefined
      ? remainingWork
      : Object.values(capacityUnits).reduce((sum, value) => sum + Number(value), 0);
  const monthlyInstalmentUnits =
    remainingWork <= 0
      ? 0
      : capacityTotal > 0
        ? Math.min(remainingWork, capacityTotal)
        : remainingWork;
  const remainingMonths =
    remainingWork <= 0 || monthlyInstalmentUnits <= 0
      ? 0
      : Math.ceil(remainingWork / monthlyInstalmentUnits);
  return {
    totalCostUnits,
    monthlyInstalmentUnits,
    remainingMonths,
    launchMonth: remainingMonths <= 0 ? null : addMonths(campaignMonth, remainingMonths),
  };
}
