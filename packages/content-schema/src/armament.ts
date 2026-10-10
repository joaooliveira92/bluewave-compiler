import { z } from "zod";
import { ProvenanceSchema } from "./naval-profile.js";

/**
 * Content schema for the first-class armament catalogue (ADR-0093, national armament integration
 * Step 2). Four separately authored collections live under
 * `content/production/<scenario>/ship-building/armament/`:
 *
 * - `gun-families.yaml`  — shared physical/technical families (never duplicated per nation);
 * - `gun-models.yaml`    — national models that reference a shared family;
 * - `gun-mounts.yaml`    — the mount catalogue, kept separate from the gun model;
 * - `ammunition.yaml`    — national ammunition patterns.
 *
 * Every numeric field names its unit (`caliberUm`, `gunMassKg`, `shellMassG`, `...UmPerSec`,
 * `...Bp`, `...KgM`, `...Litre`, `...Mm`, `...Deg`). Each object is `.strict()`, so an ambiguous
 * field such as `weight`, `speed`, `rate`, `range` or `size` is rejected rather than silently
 * accepted. Structural authority only: cross-references, ranges and provenance completeness are
 * enforced by `lintArmament` in `@bluewave/armament` and the ship-design release wrapper.
 */

const ID_RE = /^[a-z][a-z0-9_]*$/;
const id = z.string().regex(ID_RE, "must be a canonical lower snake_case id");

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
const GUN_CATEGORY_VALUES = ["MAIN_GUN", "SECONDARY_GUN", "DUAL_PURPOSE_GUN", "AA_WEAPON"] as const;
const SHELL_TYPE_VALUES = ["AP", "APC", "CPC", "SAP", "HE", "MELINITE"] as const;

const nonNegativeInt = z.number().int().nonnegative();
const positiveInt = z.number().int().positive();

export const GunFamilySchema = z
  .object({
    id,
    designation: z.string().min(1),
    category: z.enum(GUN_CATEGORY_VALUES),
    /** The canonical installation a family is fielded in when a national model does not override it. */
    defaultMountType: z.enum(MOUNT_TYPE_VALUES),
    provenance: ProvenanceSchema,
  })
  .strict();

export const GunFamilyCatalogueSchema = z
  .object({ gunFamilies: z.array(GunFamilySchema) })
  .strict();

export const GunModelSchema = z
  .object({
    id,
    familyId: z.string().min(1),
    /** The nation that fields this model. Purely data; the resolver has no nation-id branch. */
    nationId: z.string().min(1),
    designation: z.string().min(1),
    caliberUm: positiveInt.optional(),
    barrelLengthCalibers: z.number().positive().optional(),
    gunMassKg: nonNegativeInt.optional(),
    loadingSystem: z.string().optional(),
    nominalMuzzleVelocityUmPerSec: positiveInt.optional(),
    mechanicalRateOfFireRoundsPerMinuteX100: positiveInt.optional(),
    propellantChargeBp: nonNegativeInt.optional(),
    shellMassG: nonNegativeInt.optional(),
    roundVolumeMl: nonNegativeInt.optional(),
    reliabilityBp: z.number().int().min(0).max(10_000).optional(),
    introductionMonth: z.string().optional(),
    retirementMonth: z.string().nullable().optional(),
    supportedMountTypes: z.array(z.enum(MOUNT_TYPE_VALUES)).min(1),
    requiredTechnologyIds: z.array(z.string()),
    provenance: ProvenanceSchema,
  })
  .strict();

export const GunModelCatalogueSchema = z.object({ gunModels: z.array(GunModelSchema) }).strict();

export const GunMountSchema = z
  .object({
    id,
    mountType: z.enum(MOUNT_TYPE_VALUES),
    compatibleGunFamilies: z.array(z.string()).optional(),
    gunCount: positiveInt,
    baseInstallationMassKg: nonNegativeInt.optional(),
    perGunInstallationMassKg: nonNegativeInt.optional(),
    topWeightKg: nonNegativeInt.optional(),
    supportedArmorMm: nonNegativeInt.optional(),
    traverseDeg: z.number().int().min(0).max(360).optional(),
    elevationMinDeg: z.number().int().min(-90).max(90).optional(),
    elevationMaxDeg: z.number().int().min(-90).max(90).optional(),
    firingArcDeg: z.number().int().min(0).max(360).optional(),
    rateOfFireModifierBp: z.number().int().nonnegative().optional(),
    ammunitionHandlingModifierBp: z.number().int().nonnegative().optional(),
    crewProtection: z.string().optional(),
    hullSpaceUsageLitre: nonNegativeInt.optional(),
    stabilityContributionKgM: z.number().int().optional(),
    vulnerability: z.string().optional(),
    introductionMonth: z.string().optional(),
    retirementMonth: z.string().nullable().optional(),
    requiredTechnologyIds: z.array(z.string()),
    provenance: ProvenanceSchema,
  })
  .strict();

export const GunMountCatalogueSchema = z.object({ gunMounts: z.array(GunMountSchema) }).strict();

export const AmmunitionPatternSchema = z
  .object({
    id,
    shellType: z.enum(SHELL_TYPE_VALUES),
    nationId: z.string().min(1),
    compatibleGunFamilies: z.array(z.string()).optional(),
    compatibleGunModelIds: z.array(z.string()).optional(),
    shellMassG: nonNegativeInt.optional(),
    propellantInteractionBp: z.number().int().nonnegative().optional(),
    penetrationBiasBp: z.number().int().min(0).max(10_000).optional(),
    explosiveFillerG: nonNegativeInt.optional(),
    burstingEffectBp: z.number().int().nonnegative().optional(),
    fireEffectBp: z.number().int().nonnegative().optional(),
    storageHazard: z.string().optional(),
    ammunitionCostMicro: nonNegativeInt.optional(),
    rateOfFireModifierBp: z.number().int().nonnegative().optional(),
    introductionMonth: z.string().optional(),
    retirementMonth: z.string().nullable().optional(),
    provenance: ProvenanceSchema,
  })
  .strict();

export const AmmunitionCatalogueSchema = z
  .object({ ammunition: z.array(AmmunitionPatternSchema) })
  .strict();

export type GunFamilyData = z.infer<typeof GunFamilySchema>;
export type GunModelData = z.infer<typeof GunModelSchema>;
export type GunMountData = z.infer<typeof GunMountSchema>;
export type AmmunitionPatternData = z.infer<typeof AmmunitionPatternSchema>;
