import type { SafeInt } from "@bluewave/contracts";

export interface CommandEnvelope<TBody> {
  commandId: string;
  version: string;
  expectedSnapshotHash: string;
  idempotencyKey: string;
  timestamp: string;
  body: TBody;
  signature?: string;
}

export type CommandBody = BudgetProjectCommand;

export interface BudgetProjectCommand {
  type: "budget_project";
  nationId: string;
  projectId: string;
  budget: SafeInt;
}