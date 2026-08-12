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
export type CommandBody =
  | BudgetProjectCommand
  | SetResearchPriorityCommand
  | DeclareWarCommand
  | AcceptPeaceCommand
  | FormAllianceCommand
  | BreakAllianceCommand
  | FormNonAggressionPactCommand
  | BreakNonAggressionPactCommand
  | DeclareBlockadeCommand;
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
export interface DeclareWarCommand {
  type: "DeclareWar";
  nationId: string;
  targetNationId: string;
  warGoalsId?: string;
}
export interface AcceptPeaceCommand {
  type: "AcceptPeace";
  nationId: string;
  warId: string;
}
export interface FormAllianceCommand {
  type: "FormAlliance";
  nationId: string;
  partnerNationId: string;
}
export interface BreakAllianceCommand {
  type: "BreakAlliance";
  nationId: string;
  partnerNationId: string;
}
export interface FormNonAggressionPactCommand {
  type: "FormNonAggressionPact";
  nationId: string;
  partnerNationId: string;
}
export interface BreakNonAggressionPactCommand {
  type: "BreakNonAggressionPact";
  nationId: string;
  partnerNationId: string;
}
export interface DeclareBlockadeCommand {
  type: "DeclareBlockade";
  nationId: string;
  targetNationId: string;
  areaId: string;
}
