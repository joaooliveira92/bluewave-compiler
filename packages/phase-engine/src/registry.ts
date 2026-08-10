import { SafeInt } from "@bluewave/contracts";
import type { CampaignSnapshot } from "@bluewave/campaign";
import type { DomainEventEnvelope } from "@bluewave/events";
import type { CommandLedger } from "@bluewave/commands";
import type { EventLedger } from "@bluewave/events";

export interface PhaseDefinition {
  id: string;
  name: string;
  order: number;
  readPermissions: string[];
  writePermissions: string[];
  rngAllowed: boolean;
}

export interface PhaseContext {
  currentPhaseIndex: SafeInt;
  currentPhase: PhaseDefinition;
  turnNumber: SafeInt;
  snapshot: CampaignSnapshot;
}

export interface NoOpEvidence {
  version: string;
  phaseId: string;
  turnNumber: number;
}

export interface PhaseResult {
  phaseId: string;
  success: boolean;
  stateChanges?: Partial<CampaignSnapshot>;
  events?: DomainEventEnvelope[];
  diagnostics?: string[];
  noOp?: boolean;
  evidence?: NoOpEvidence;
}

export interface TurnResult {
  finalSnapshot: CampaignSnapshot;
  ledger: CommandLedger;
  eventLedger: EventLedger;
  phaseResults: PhaseResult[];
}

export class PhaseRegistry {
  static readonly PHASES: PhaseDefinition[] = [
    {
      id: "opening_validation",
      name: "Opening Validation",
      order: 0,
      readPermissions: ["all"],
      writePermissions: [],
      rngAllowed: false,
    },
    {
      id: "command_collection",
      name: "Command Collection",
      order: 1,
      readPermissions: ["all"],
      writePermissions: [],
      rngAllowed: false,
    },
    {
      id: "appropriation",
      name: "Appropriation",
      order: 2,
      readPermissions: ["treasury", "budget"],
      writePermissions: ["treasury"],
      rngAllowed: false,
    },
    {
      id: "obligation",
      name: "Obligation",
      order: 3,
      readPermissions: ["treasury"],
      writePermissions: ["treasury"],
      rngAllowed: false,
    },
    {
      id: "construction_processing",
      name: "Construction Processing",
      order: 4,
      readPermissions: ["constructions", "fleets"],
      writePermissions: ["constructions", "fleets"],
      rngAllowed: false,
    },
    {
      id: "research_progress",
      name: "Research Progress",
      order: 5,
      readPermissions: ["research"],
      writePermissions: ["research"],
      rngAllowed: true,
    },
    {
      id: "battle_resolution",
      name: "Battle Resolution",
      order: 6,
      readPermissions: ["wars", "fleets"],
      writePermissions: ["wars", "fleets"],
      rngAllowed: true,
    },
    {
      id: "closing_validation",
      name: "Closing Validation",
      order: 7,
      readPermissions: ["all"],
      writePermissions: [],
      rngAllowed: false,
    },
  ];

  static getById(id: string): PhaseDefinition | undefined {
    return PhaseRegistry.PHASES.find((p) => p["id"] === id);
  }

  static getByOrder(order: number): PhaseDefinition | undefined {
    return PhaseRegistry.PHASES.find((p) => p["order"] === order);
  }

  static get all(): readonly PhaseDefinition[] {
    return PhaseRegistry.PHASES;
  }

  static hasAccess(
    phase: PhaseDefinition,
    resource: string,
    accessType: "read" | "write",
  ): boolean {
    const permissions = accessType === "read"
      ? phase["readPermissions"]
      : phase["writePermissions"];
    return permissions.includes("all") || permissions.includes(resource);
  }
}