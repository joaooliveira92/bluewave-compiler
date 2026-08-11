//packages/campaign/src/index.ts
export type { CampaignState, CampaignSlot, CampaignSnapshot } from "./state.js";
export type { WorldState } from "./state.js";
export type { NationState } from "./state.js";
export type { FleetState, Ship } from "./state.js";
export type { ConstructionProject } from "./state.js";
export type { ResearchState, TechnologyProgress } from "./state.js";
export type { CompiledDesignVersion, DesignFamily } from "./state.js";
export type { WarState, BattleInstance, BattleResult } from "./state.js";
export type { PersistenceManifest } from "./state.js";
export type { PoliticalState, DiplomaticRelation } from "./state.js";
export type { IntelligenceState } from "./state.js";
export type { CampaignCompilerInput, CampaignCompilerOutput, CampaignFiles } from "./compiler.js";
export { CampaignCompiler } from "./compiler.js";

// DESIGN-03 Campaign Configuration surface
export * from "./scenario.js";
export * from "./timeline.js";
export * from "./fleetSize.js";
export * from "./researchSpeed.js";
export * from "./technologyVariation.js";
export * from "./continuity.js";
export * from "./campaignConfiguration.js";

// DESIGN-03 session state + preconditions (renamed type to avoid clashing with
// the compiled-world CampaignState from ./state.js)
export {
  type CampaignSessionState,
  validateCampaignPreconditions,
  createInitialCampaignState,
  canAdvanceCampaign,
  advanceCampaignMonth,
  verifyCampaignTechnologyManifest,
  assertCampaignStateImmutability,
  hashConfiguration,
} from "./campaignSession.js";
