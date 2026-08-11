//packages/campaign/src/state.ts
import type { SafeInt } from "@bluewave/contracts";
import type { CanonicalEnvelope } from "@bluewave/deterministic";

export interface Ship {
  id: string;
  name: string;
  classId: string;
  nationId: string;
  locationAreaId: string;
  designVersionId: string;
  hitPoints: SafeInt;
  maxHitPoints: SafeInt;
  speed: SafeInt;
  firepower: SafeInt;
  armor: SafeInt;
  isUnderConstruction: boolean;
  constructionProgress: SafeInt;
  constructionTotalWork: SafeInt;
  inBattleId?: string;
}

export interface FleetState {
  id: string;
  nationId: string;
  name: string;
  ships: Ship[];
  locationAreaId: string;
}

export interface TechnologyProgress {
  techId: string;
  investedPoints: SafeInt;
  completed: boolean;
}

export interface ResearchState {
  nationId: string;
  technologies: TechnologyProgress[];
  currentProjectTechId?: string;
  fieldPriorities: Record<string, SafeInt>;
  researchBudget: SafeInt;
  activeCandidates: Map<string, string>;
  discoveredTechs: string[];
}

export interface CompiledDesignVersion {
  designVersionId: string;
  designFamilyId: string;
  className: string;
  nationId: string;
  hullType: string;
  normalizedDisplacementKg: SafeInt;
  normalizedSpeedUms: SafeInt;
  normalizedArmorUm: SafeInt;
  hitPoints: SafeInt;
  mainGunsCaliber: SafeInt;
  mainGunsCount: SafeInt;
  machineryType: string;
  crewComplement: SafeInt;
  contentVersion: string;
  compiledHash: string;
}

export interface DesignFamily {
  designFamilyId: string;
  nationId: string;
  rootDesignVersionId: string;
  memberDesignVersionIds: string[];
  familyCreationMonth: string;
}

export interface DiplomaticRelation {
  nationA: string;
  nationB: string;
  relation: "neutral" | "allied" | "at_war" | "trade_agreement";
  since: string;
}

export interface PoliticalState {
  relations: DiplomaticRelation[];
  shells: Record<string, unknown>;
}

export interface BattleInstance {
  id: string;
  phase: "pending" | "resolving" | "resolved";
  attackerId: string;
  defenderId: string;
  areaId: string;
  attackerFleetIds: string[];
  defenderFleetIds: string[];
  result?: BattleResult;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  attackerLosses: string[];
  defenderLosses: string[];
  damageReport: Record<string, SafeInt>;
  explanation: string[];
}

export interface WarState {
  wars: WarDeclaration[];
  battles: BattleInstance[];
}

export interface WarDeclaration {
  id: string;
  attackerId: string;
  defenderId: string;
  startDate: string;
  status: "active" | "ended";
  endDate?: string;
}

export interface NationState {
  id: string;
  name: string;
  tag: string;
  treasury: SafeInt;
  income: SafeInt;
  expenses: SafeInt;
  baseResources: SafeInt;
  navalAppropriationRateBp: SafeInt;
  maintenanceCost: SafeInt;
  fleets: FleetState[];
  research: ResearchState;
  constructionProjects: ConstructionProject[];
  isPlayable: boolean;
  isAI: boolean;
}

export interface ConstructionProject {
  id: string;
  type: "ship" | "building" | "technology";
  projectType: "NEW_CONSTRUCTION";
  targetId: string;
  designVersionId: string;
  totalWork: SafeInt;
  completedWork: SafeInt;
  paidWork: SafeInt;
  status: "PLANNED" | "AUTHORIZED" | "ACTIVE" | "COMPLETED";
  startedAt: string;
}

export interface WorldState {
  areas: AreaData[];
  routes: RouteData[];
  ports: PortData[];
}

export interface AreaData {
  id: string;
  name: string;
  type: "land" | "sea" | "coastal";
  controller?: string;
}

export interface RouteData {
  id: string;
  from: string;
  to: string;
  type: "land" | "sea" | "rail";
  distance: SafeInt;
}

export interface PortData {
  id: string;
  name: string;
  areaId: string;
  nationId: string;
  level: SafeInt;
}

export interface IntelligenceState {
  shells: Record<string, unknown>;
}

export interface PersistenceManifest {
  version: string;
  campaignId: string;
  turnNumber: SafeInt;
  snapshotHash: string;
  contentArtifactHash: string;
  rulesetVersion: string;
  compatibilityVersion: string;
  createdAt: string;
}

export interface CampaignSlot {
  nationId: string;
  type: "playable" | "ai";
}

export interface CampaignSnapshot {
  version: string;
  turnNumber: SafeInt;
  campaignId: string;
  slots: CampaignSlot[];
  world: WorldState;
  nations: Map<string, NationState>;
  wars: WarState;
  politics: PoliticalState;
  intelligence: IntelligenceState;
  designs: Map<string, CompiledDesignVersion>;
  designFamilies: Map<string, DesignFamily>;
  rulesetVersion: string;
  compatibilityVersion: string;
}

export interface CampaignState {
  snapshot: CampaignSnapshot;
  envelope: CanonicalEnvelope;
  rawHash: string;
}
