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
  | SetBudgetAllocationCommand
  | MoveFleetCommand
  | SubmitDesignCommand
  | ReviseProjectCommand
  | AssignOfficerCommand
  | RelieveOfficerCommand
  | DeclareWarCommand
  | AcceptPeaceCommand
  | FormAllianceCommand
  | BreakAllianceCommand
  | FormNonAggressionPactCommand
  | BreakNonAggressionPactCommand
  | DeclareBlockadeCommand
  | CreateDivisionCommand
  | AddShipToDivisionCommand
  | RemoveShipFromDivisionCommand
  | DissolveDivisionCommand
  | ChangeDivisionFlagshipCommand;
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
export interface SetBudgetAllocationCommand {
  type: "SetBudgetAllocation";
  nationId: string;
  /** Naval appropriation rate in basis points (ADR-0060 bounds). */
  appropriationRateBp: SafeInt;
  /** Standing monthly research budget (ADR-0060 bounds). */
  researchBudget: SafeInt;
}
export interface MoveFleetCommand {
  type: "MoveFleet";
  nationId: string;
  fleetId: string;
  toAreaId: string;
}
/**
 * Submits a component-level ship design (ADR-0066). `draft` is a `@bluewave/ship-design` DesignDraft as JSON; the
 * lifecycle only checks its shape and ids, the authoritative compile happens when the month applies the command.
 */
export interface SubmitDesignCommand {
  type: "SubmitDesign";
  nationId: string;
  designVersionId: string;
  designFamilyId: string;
  className: string;
  hullType: string;
  machineryType: string;
  draft: unknown;
}
/**
 * Revises a construction project with a changed design (ADR-0070). `draft` is the whole new DesignDraft; the project's
 * current design must carry its source draft. The change is classified from the two drafts and the project's work
 * (spec 15.4) when the month applies the command: a free change or revision swaps the design, a redesign also
 * loses hull progress, and a change past the redesign window is refused (it needs a rebuild project).
 */
export interface ReviseProjectCommand {
  type: "ReviseProject";
  nationId: string;
  projectId: string;
  /** Id of the new design version; the project's family gains this member. */
  newDesignVersionId: string;
  draft: unknown;
}
export interface AssignOfficerCommand {
  type: "AssignOfficer";
  nationId: string;
  officerId: string;
  divisionId: string;
}
export interface RelieveOfficerCommand {
  type: "RelieveOfficer";
  nationId: string;
  divisionId: string;
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
export interface CreateDivisionCommand {
  type: "CreateDivision";
  nationId: string;
  divisionId: string;
  shipOrder: string[];
  divisionRole: string;
  preferredFormation: string;
}
export interface AddShipToDivisionCommand {
  type: "AddShipToDivision";
  nationId: string;
  divisionId: string;
  shipId: string;
}
export interface RemoveShipFromDivisionCommand {
  type: "RemoveShipFromDivision";
  nationId: string;
  divisionId: string;
  shipId: string;
}
export interface DissolveDivisionCommand {
  type: "DissolveDivision";
  nationId: string;
  divisionId: string;
}
export interface ChangeDivisionFlagshipCommand {
  type: "ChangeDivisionFlagship";
  nationId: string;
  divisionId: string;
  newFlagshipShipId: string;
}
