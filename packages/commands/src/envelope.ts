import type { SafeInt } from "@bluewave/contracts";
import type { IssuerClass } from "./types.js";
export interface CommandEnvelope<TBody> {
  commandId: string;
  version: string;
  expectedSnapshotHash: string;
  idempotencyKey: string;
  timestamp: string;
  body: TBody;
  signature?: string;
  issuerClass?: IssuerClass;
  issuerParticipantId?: string;
}
export type CommandBody = BudgetProjectCommand | SetResearchPriorityCommand;
export interface BudgetProjectCommand {
  type: "budget_project";
  nationId: string;
  projectId: string;
  budget: SafeInt;
}
export interface SetResearchPriorityCommand {
  type: "SetResearchPriority";
  nationId: string;
  fieldPriorities: Record<string, SafeInt>;
  exactTechId?: string;
}
