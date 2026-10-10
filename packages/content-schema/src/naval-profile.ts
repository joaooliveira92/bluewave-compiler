import { z } from "zod";
import { CANONICAL_RESEARCH_FIELD_IDS } from "./research-fields.js";
import {
  COMPONENT_ACCESS_STATUSES_SCHEMA,
  CONFIDENCE_LEVELS_SCHEMA,
  NAVAL_POSTURES_SCHEMA,
  PROVENANCE_KINDS_SCHEMA,
  SOURCE_STATUSES_SCHEMA,
  SHIP_TYPE_ID_VALUES,
} from "./naval-profile-vocab.js";

/**
 * Content schema for `content/production/<scenario>/ship-building/naval-profiles.yaml` (NationNavalProfile).
 * Structural authority only: cross-references (component families, plants, hull forms, nations) and semantic
 * rules are enforced by the domain validator `validateNavalProfiles` in `@bluewave/ship-design`, so a schema
 * change here cannot silently widen what a nation may build.
 */

const SourceReferenceSchema = z
  .object({
    sourceId: z.string().optional(),
    title: z.string().min(1),
    author: z.string().optional(),
    year: z.number().int().optional(),
    page: z.string().optional(),
    section: z.string().optional(),
    archiveOrUrl: z.string().optional(),
    accessedAt: z.string().optional(),
  })
  .strict();

const DerivationSchema = z
  .object({
    sourceValue: z.string(),
    sourceUnit: z.string(),
    conversion: z.string(),
    gameValue: z.string(),
    roundingRule: z.string().optional(),
    originalValue: z.string().optional(),
    originalUnit: z.string().optional(),
    convertedValue: z.string().optional(),
    convertedUnit: z.string().optional(),
  })
  .strict();

export const ProvenanceSchema = z
  .object({
    sourceStatus: SOURCE_STATUSES_SCHEMA,
    confidence: CONFIDENCE_LEVELS_SCHEMA,
    kind: PROVENANCE_KINDS_SCHEMA,
    sources: z.array(SourceReferenceSchema),
    derivation: DerivationSchema.optional(),
    note: z.string().optional(),
  })
  .strict();

const ComponentAccessSchema = z
  .object({
    status: COMPONENT_ACCESS_STATUSES_SCHEMA,
    producer: z.string().optional(),
    provenance: ProvenanceSchema.optional(),
  })
  .strict();

const MOUNT_TYPE_VALUES = [
  "TURRET",
  "BARBETTE",
  "CASEMATE",
  "DECK_SHIELDED",
  "DECK_OPEN",
  "BROADSIDE_BATTERY",
  "SUBMERGED_TUBE",
  "ABOVE_WATER_TUBE",
] as const;
const AMMUNITION_PATTERN_VALUES = ["AP", "APC", "CPC", "SAP", "HE", "MELINITE"] as const;

/** Overrides are a shallow map of scalar/list values; keys are checked by the domain linter. */
const OverridesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.array(z.string())]),
);

const GunModelSchema = z
  .object({
    id: z.string().min(1),
    familyId: z.string().min(1),
    designation: z.string().min(1),
    overrides: OverridesSchema,
    mounts: z.array(z.enum(MOUNT_TYPE_VALUES)).min(1),
    introductionMonth: z.string().optional(),
    obsoleteMonth: z.string().nullable().optional(),
    provenance: ProvenanceSchema,
  })
  .strict();

const AmmunitionPatternSchema = z
  .object({
    id: z.string().min(1),
    pattern: z.enum(AMMUNITION_PATTERN_VALUES),
    penetrationBiasBp: z.number().int().min(0).max(10_000),
    provenance: ProvenanceSchema,
  })
  .strict();

const ComponentVariantSchema = z
  .object({
    id: z.string().min(1),
    familyId: z.string().min(1),
    designation: z.string().min(1),
    overrides: OverridesSchema,
    introductionMonth: z.string().optional(),
    obsoleteMonth: z.string().nullable().optional(),
    provenance: ProvenanceSchema,
  })
  .strict();

const HardCapabilitiesSchema = z
  .object({
    maxGunCaliberUm: z.number().int().positive(),
    maxArmourThicknessUm: z.number().int().positive(),
    domesticTorpedoDiameterUm: z.number().int().positive(),
    hullForms: z.array(z.string()),
    domesticPlants: z.array(z.string()),
    restrictedShipTypes: z.array(z.enum(SHIP_TYPE_ID_VALUES)),
    grants: z.array(z.string()),
  })
  .strict();

const SoftPreferencesSchema = z
  .object({
    speedOverArmourBp: z.number().int().min(0).max(10_000),
    secondaryBatteryWeightBp: z.number().int().positive(),
    enduranceWeightBp: z.number().int().positive(),
    riskToleranceBp: z.number().int().min(0).max(10_000),
    colonialServiceWeightBp: z.number().int().positive(),
    torpedoOnCruisersBp: z.number().int().positive(),
    accommodationStandard: z.enum(["SPARTAN", "STANDARD", "GENEROUS"]),
  })
  .strict();

const DatedValueSchema = z
  .object({ fromMonth: z.string(), value: z.number().int().nonnegative() })
  .strict();

const IndustrialProfileSchema = z
  .object({
    buildTimeMultiplierBp: z.number().int().positive(),
    costMultiplierBp: z.number().int().positive(),
    machineryReliabilityBp: z.number().int().min(0).max(10_000),
    constructionQualityVarianceBp: z.number().int().nonnegative(),
    maxPracticalDisplacementKg: z.array(DatedValueSchema).min(1),
    heavyGunProduction: COMPONENT_ACCESS_STATUSES_SCHEMA,
    armourPlateProduction: COMPONENT_ACCESS_STATUSES_SCHEMA,
    provenance: ProvenanceSchema,
  })
  .strict();

const DoctrineProfileSchema = z
  .object({
    engagementRangeM: z.number().int().positive(),
    hePreferenceBp: z.number().int().min(0).max(10_000),
    postures: z.array(NAVAL_POSTURES_SCHEMA).min(1),
    provenance: ProvenanceSchema,
  })
  .strict();

const ResearchPreferenceSchema = z
  .object({
    field: z.enum(CANONICAL_RESEARCH_FIELD_IDS),
    priority: z.number().int().min(1).max(4),
  })
  .strict();

const DesignWeightsSchema = z
  .object({
    firepowerBp: z.number().int().positive(),
    protectionBp: z.number().int().positive(),
    speedBp: z.number().int().positive(),
    enduranceBp: z.number().int().positive(),
    torpedoBp: z.number().int().positive(),
    reliabilityBp: z.number().int().positive(),
    colonialBp: z.number().int().positive(),
    costBp: z.number().int().positive(),
  })
  .strict();

const ProcurementPolicySchema = z
  .object({
    battleLineShareBp: z.number().int().nonnegative(),
    cruiserShareBp: z.number().int().nonnegative(),
    torpedoCraftShareBp: z.number().int().nonnegative(),
    colonialShareBp: z.number().int().nonnegative(),
    foreignProcurementAppetiteBp: z.number().int().min(0).max(10_000),
    unprovenTechAppetiteBp: z.number().int().min(0).max(10_000),
    buildOrder: z.array(z.enum(SHIP_TYPE_ID_VALUES)).min(1),
  })
  .strict();

const NamingPolicySchema = z
  .object({
    stems: z.record(z.string(), z.array(z.string())),
    convention: z.record(z.string(), z.string()),
  })
  .strict();

export const NationNavalProfileSchema = z
  .object({
    nationId: z.string().min(1),
    activeFrom: z.string(),
    activeUntil: z.string().nullable(),
    strategicSituation: z.string().min(1),
    hardCapabilities: HardCapabilitiesSchema,
    softPreferences: SoftPreferencesSchema,
    industrialProfile: IndustrialProfileSchema,
    doctrineProfile: DoctrineProfileSchema,
    researchPreferences: z.array(ResearchPreferenceSchema),
    componentAccess: z.record(z.string(), ComponentAccessSchema),
    gunModels: z.array(GunModelSchema),
    ammunitionPatterns: z.array(AmmunitionPatternSchema),
    componentVariants: z.array(ComponentVariantSchema),
    designWeights: z.record(z.string(), DesignWeightsSchema),
    procurementPolicy: ProcurementPolicySchema,
    namingPolicy: NamingPolicySchema,
    sourceReferences: z.array(SourceReferenceSchema),
    provenance: ProvenanceSchema,
  })
  .strict();

export const NavalProfileCatalogueSchema = z
  .object({ navalProfiles: z.array(NationNavalProfileSchema) })
  .strict();

export type NationNavalProfileData = z.infer<typeof NationNavalProfileSchema>;
