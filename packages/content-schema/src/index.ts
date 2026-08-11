export type { ContentPack, PackManifest, RulesetManifest } from "./manifest.js";
export { PackManifestSchema, RulesetManifestSchema } from "./manifest.js";

// Legacy Country entity — kept until the Nation contract lands (ticket 03).
export type { Country } from "./country.js";
export { CountrySchema, LogisticsProfileSchema } from "./country.js";
export type { LogisticsProfile } from "./country.js";

// Canonical Nation entity.
export {
  NationSchema,
  NationIdSchema,
  RegimeTypeSchema,
  PoliticalSystemSchema,
  StabilityLevelSchema,
  NavalPurposeSchema,
  IndustrialBaseSchema,
  SenioritySchema,
  AiArchetypeSchema,
  AiRoleSchema,
  CoreAnxietySchema,
  GameplayFeelSchema,
  GdpTierSchema,
  IndustrializationLevelSchema,
  NavalBudgetLevelSchema,
  ArmyNavyBalanceSchema,
  PresentationSchema,
  NationSlotSchema,
  StabilityProfileSchema,
  StrategicObjectivesSchema,
  BaseResourcesSchema,
  NavalAppropriationSchema,
  NationRegimeSchema,
  IdentitySchema,
  EconomySchema,
  NavalInstitutionSchema,
  DoctrineSchema,
  ShipDesignSchema,
  AiSchema,
  MilitarySchema,
} from "./nation.js";
export type {
  Nation,
  NationId,
  RegimeType,
  PoliticalSystem,
  StabilityLevel,
  NavalPurpose,
  IndustrialBase,
  Seniority,
  AiArchetype,
  AiRole,
  CoreAnxiety,
  GameplayFeel,
  GdpTier,
  IndustrializationLevel,
  NavalBudgetLevel,
  ArmyNavyBalance,
  NationRegime,
  NationSlot,
  StabilityProfile,
  Presentation,
  Identity,
  Economy,
  NavalInstitution,
  Doctrine,
  ShipDesign,
  Ai,
  Military,
  StrategicObjectives,
  BaseResources,
  NavalAppropriation,
} from "./nation.js";

export type { Area } from "./area.js";
export { AreaSchema } from "./area.js";
export type { RouteEdge } from "./route.js";
export { RouteEdgeSchema } from "./route.js";
export type { Possession } from "./possession.js";
export { PossessionSchema } from "./possession.js";
export type { Port } from "./port.js";
export { PortSchema } from "./port.js";
export type { TechnologyPrerequisite } from "./technology.js";
export { TechnologyPrerequisiteChainSchema } from "./technology.js";
export type { DesignTemplate } from "./design.js";
export { DesignTemplateSchema, MainGunsSchema } from "./design.js";
export {
  CANONICAL_RESEARCH_FIELD_IDS,
  RESEARCH_FIELD_PRIORITY_WEIGHTS,
  MAX_HIGH_PRIORITY_FIELDS,
} from "./research-fields.js";
export type { ResearchFieldId } from "./research-fields.js";
export { parseYamlSafe, type SafeParseResult } from "./yaml-parser.js";
export { validateAgainstSchema } from "./schema-validator.js";
