export type { Area } from "./area.js";
export { AreaSchema } from "./area.js";
export type { DesignTemplate } from "./design.js";
export {
  DesignTemplateSchema,
  MainGunsSchema,
  TorpedoMountSchema,
  TORPEDO_MOUNT_TYPE_VALUES,
} from "./design.js";
export type { ContentPack, PackManifest, RulesetManifest } from "./manifest.js";
export { PackManifestSchema, RulesetManifestSchema } from "./manifest.js";
export type {
  Ai,
  AiArchetype,
  AiRole,
  ArmyNavyBalance,
  BaseResources,
  CoreAnxiety,
  Doctrine,
  Economy,
  GameplayFeel,
  GdpTier,
  Identity,
  IndustrialBase,
  IndustrializationLevel,
  Military,
  Nation,
  NationId,
  NationRegime,
  NationSlot,
  NavalAppropriation,
  NavalBudgetLevel,
  NavalInstitution,
  NavalPurpose,
  PoliticalSystem,
  Presentation,
  RegimeType,
  Seniority,
  ShipDesign,
  StabilityLevel,
  StabilityProfile,
  StrategicObjectives,
} from "./nation.js";
// Canonical Nation entity.
export {
  AiArchetypeSchema,
  AiRoleSchema,
  AiSchema,
  ArmyNavyBalanceSchema,
  BaseResourcesSchema,
  CoreAnxietySchema,
  DoctrineSchema,
  EconomySchema,
  GameplayFeelSchema,
  GdpTierSchema,
  IdentitySchema,
  IndustrialBaseSchema,
  IndustrializationLevelSchema,
  MilitarySchema,
  NationIdSchema,
  NationRegimeSchema,
  NationSchema,
  NationSlotSchema,
  NavalAppropriationSchema,
  NavalBudgetLevelSchema,
  NavalInstitutionSchema,
  NavalPurposeSchema,
  PoliticalSystemSchema,
  PresentationSchema,
  RegimeTypeSchema,
  SenioritySchema,
  ShipDesignSchema,
  StabilityLevelSchema,
  StabilityProfileSchema,
  StrategicObjectivesSchema,
} from "./nation.js";
export type { Port } from "./port.js";
export { PortSchema } from "./port.js";
export type { Possession } from "./possession.js";
export { PossessionSchema } from "./possession.js";
export type { ResearchFieldId } from "./research-fields.js";
export {
  CANONICAL_RESEARCH_FIELD_IDS,
  MAX_HIGH_PRIORITY_FIELDS,
  RESEARCH_FIELD_PRIORITY_WEIGHTS,
} from "./research-fields.js";
export type { RouteEdge } from "./route.js";
export { RouteEdgeSchema } from "./route.js";
export { validateAgainstSchema } from "./schema-validator.js";
export type { TechnologyPrerequisite } from "./technology.js";
export { TechnologyPrerequisiteChainSchema } from "./technology.js";
export { parseYamlSafe, type SafeParseResult } from "./yaml-parser.js";
export type { PropulsionPlantData, ShipComponentData, ShipHullFormData } from "./ship-component.js";
export {
  PropulsionPlantCatalogueSchema,
  PropulsionPlantSchema,
  SHIP_COMPONENT_CATEGORIES,
  SHIP_ZONE_IDS,
  ShipComponentCatalogueSchema,
  ShipComponentSchema,
  ShipHullFormCatalogueSchema,
  ShipHullFormSchema,
} from "./ship-component.js";
