// content/shipbuilding/monthlyProcessor.ts - Monthly Construction Processor
// RTW3: monthly instalments, halted=less, accelerated=faster+more, delayed=skip cost

import type { ConstructionProject, MonthlyConstructionProgress } from "./construction.ts";

export interface MonthlyProcessorInput {
  campaignId: string;
  campaignTurnId: string;
  nationId: string;
}

export interface MonthlyProcessorOutput {
  progressRows: MonthlyConstructionProgress[];
  paymentLinks: string[];
  delayEvents: string[];
  completionEvents: string[];
  domainEvents: string[];
}

export const MONTHLY_PROCESSOR_STEPS = [
  "1. Load active construction projects",
  "2. Compute available funds",
  "3. Compute shipyard capacity load",
  "4. Apply halt/accelerate status",
  "5. Roll delay risks",
  "6. Charge monthly payments",
  "7. Reduce remaining time",
  "8. Emit progress rows",
  "9. Complete finished projects",
  "10. Create ships from completed ship projects",
] as const;

// Core monthly behaviors per manual
export const MONTHLY_RULES = {
  haltedCost: "Halted ships cost less per month",
  acceleratedCost: "Accelerated ships build faster but cost more, may cause delays elsewhere",
  delayedSkip: "Delayed ships do not deduct monthly build cost that month",
  insufficientFunds:
    "Running out of money is politically/operationally painful - prestige/funds consequences",
} as const;

export const processMonth = (
  _input: MonthlyProcessorInput,
  _projects: ConstructionProject[],
): MonthlyProcessorOutput => {
  // Stub - implement steps 1-10
  return {
    progressRows: [],
    paymentLinks: [],
    delayEvents: [],
    completionEvents: [],
    domainEvents: [],
  };
};
