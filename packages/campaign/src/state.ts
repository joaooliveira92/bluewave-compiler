//packages/campaign/src/state.ts
import type { SafeInt } from "@bluewave/contracts";
import type { CanonicalEnvelope } from "@bluewave/deterministic";
import type { PermanentDivision } from "./division.js";

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
  tension: number; // 0..10
  nap: boolean; // non-aggression pact active
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
  manifestHash?: string;
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

// Canonical battle manifest stored on the snapshot (populated by the
// battle_generation phase). Structurally defined here so campaign stays
// dependency-free; @bluewave/combat produces it via generation/manifest.ts.
export interface BattleManifest {
  battleId: string;
  opportunityId: string;
  warId: string;
  areaId: string;
  missionType: string;
  attackerId: string;
  defenderId: string;
  acceptanceClass: string;
  missionObjectives: string[];
  sides: Array<{ sideId: string; participantIds: string[] }>;
  persistentAssets: string[];
  temporaryAssets: string[];
  permanentDivisionIds: string[];
  tacticalDivisions: unknown[];
  commanders: string[];
  weather: string;
  seaState: string;
  visibility: string;
  environment: string;
  sourceStateHashes: Record<string, string>;
  reservations: string[];
  autoResolutionProof: string;
  provenanceRecords: string[];
  battleSeed: string;
  rulesetVersion: string;
  formulaVersion: string;
  aiPolicyVersion: string;
  rngVersion: string;
  contentVersion: string;
  manifestHash: string;
}

export interface WarState {
  wars: WarDeclaration[];
  battles: BattleInstance[];
  participantMemberships: WarParticipantMembership[];
  blockadeState: BlockadeState[];
  battleManifests: BattleManifest[];
}

export interface WarDeclaration {
  id: string;
  attackerSideId: string;
  defenderSideId: string;
  attackerSideMembers: string[]; // nation ids, includes attackerId first
  defenderSideMembers: string[]; // includes defenderId
  attackerWarScore: number; // -100..100
  defenderWarScore: number;
  attackerId: string; // root primary attacker
  defenderId: string; // root primary defender
  startDate: string;
  status: "DECLARED_NOT_ACTIVE" | "ACTIVE" | "ENDED";
  endDate?: string;
}

export interface WarParticipantMembership {
  warId: string;
  nationId: string;
  sideId: string;
  entryMonth: string;
  exitMonth?: string;
  status: "ACTIVE" | "EXITED";
  nationalContributionPoints: number;
}

export interface BlockadeState {
  blockaderId: string;
  blockadedNationId: string;
  areaId: string;
  establishedMonth: string;
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
  divisions: PermanentDivision[];
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

// Canonical current-month per-area strategic weather state (DESIGN-42 §1, B-6
// INC-1/ADR-0025). Structurally defined here so campaign stays dependency-free
// (the same precedent as BattleManifest above); @bluewave/combat's
// `generateStrategicWeather` produces it via the structurally-identical
// `StrategicWeatherState`. Every numeric field is integer fixed-point with the
// bounds enforced by @bluewave/combat's `assertFixedPointStrategicWeather`.
export interface CampaignWeatherState {
  /** Stable strategic-area identifier. */
  areaId: string;
  /** Campaign month identifier (e.g. "1880-02" — `campaignMonthId` derives it). */
  month: string;
  /** Climate-profile identifier the state was generated from. */
  climateProfileId: string;
  /** Season identifier resolved from the calendar month (climate profile). */
  seasonId: string;
  /** Identifier of the prior persistent weather state ("" when none). */
  persistentWeatherStateId: string;
  /** Sea state, integer 0..9. */
  seaState: number;
  /** Wind direction in canonical angular units (integer degrees 0..359). */
  windDirectionDeg: number;
  /** Wind speed in integer micrometres per second. */
  windSpeedUmPerSec: number;
  /** Precipitation type (NONE | RAIN | SNOW). */
  precipitationType: "NONE" | "RAIN" | "SNOW";
  /** Precipitation intensity in basis points 0..10_000. */
  precipitationIntensityBp: number;
  /** Fog or mist density in basis points 0..10_000. */
  fogMistDensityBp: number;
  /** Cloud cover in basis points 0..10_000. */
  cloudCoverBp: number;
  /** Daylight-profile identifier. */
  daylightProfileId: string;
  /** Whether the area is eligible for directional glare effects. */
  glareEligible: boolean;
  /** Base visibility distance in integer micrometres. */
  baseVisibilityUm: number;
  /** Phase id the state was generated in ("weather_generation"). */
  generatedAtPhase: string;
  /** Ruleset version. */
  rulesetVersion: string;
  /** Climate-profile version. */
  climateVersion: string;
  /** Formula version. */
  formulaVersion: string;
  /** RNG version. */
  rngVersion: string;
  /** Authoritative state hash (deterministic). */
  stateHash: string;
}

export interface CampaignSnapshot {
  version: string;
  turnNumber: SafeInt;
  campaignId: string;
  // The campaign's start calendar date (DESIGN-03 §2 timeline anchor, B-6
  // ADR-0025). The compiled snapshot derives it from the scenario /
  // `campaignStart` input; the phase engine derives every campaign month id
  // from it via `campaignMonthId` (never wall-clock/env/locale).
  startYear: number;
  startMonth: number;
  slots: CampaignSlot[];
  world: WorldState;
  nations: Map<string, NationState>;
  wars: WarState;
  politics: PoliticalState;
  intelligence: IntelligenceState;
  designs: Map<string, CompiledDesignVersion>;
  designFamilies: Map<string, DesignFamily>;
  // Current-month per-area StrategicWeatherState collection (DESIGN-42 §1 /
  // ADR-0025). Canonically ordered by areaId (stable serializer order; only the
  // CURRENT campaign month is stored — no unbounded growth). Empty at compile.
  strategicWeather: CampaignWeatherState[];
  rulesetVersion: string;
  compatibilityVersion: string;
}

export interface CampaignState {
  snapshot: CampaignSnapshot;
  envelope: CanonicalEnvelope;
  rawHash: string;
}
