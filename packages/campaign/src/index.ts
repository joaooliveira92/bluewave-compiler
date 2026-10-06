//packages/campaign/src/index.ts

export * from "./campaignConfiguration.js";
// DESIGN-03 session state + preconditions (renamed type to avoid clashing with
// the compiled-world CampaignState from ./state.js)
export {
  advanceCampaignMonth,
  assertCampaignStateImmutability,
  type CampaignSessionState,
  canAdvanceCampaign,
  createInitialCampaignState,
  hashConfiguration,
  validateCampaignPreconditions,
  verifyCampaignTechnologyManifest,
} from "./campaignSession.js";
export * from "./continuity.js";
// DESIGN-26 divisions (types + constants + aggregate commands).
export * from "./division.js";
// ADR-0037: compiled design-unit conversions (mm/knots authoring -> µm/µm·s⁻¹).
export * from "./designUnits.js";
export * from "./fleetSize.js";
export * from "./researchSpeed.js";
// DESIGN-03 Campaign Configuration surface
export * from "./scenario.js";
export type {
  BattleInstance,
  BattleManifest,
  BattleManifestSide,
  BattleResult,
  BlockadeState,
  CampaignSlot,
  CampaignSnapshot,
  CampaignState,
  CampaignWeatherState,
  CompiledDesignVersion,
  CompiledTorpedoMount,
  ConstructionProject,
  DesignFamily,
  DiplomaticRelation,
  FleetState,
  IntelligenceState,
  NationState,
  PersistenceManifest,
  PoliticalState,
  ResearchState,
  Ship,
  TechnologyProgress,
  WarDeclaration,
  WarParticipantMembership,
  WarState,
  WorldState,
} from "./state.js";
export * from "./technologyVariation.js";
export * from "./timeline.js";
export * from "./warConstants.js";
