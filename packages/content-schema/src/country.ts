import { z } from "zod";

// ══════════════════════════════════════════════════════════════════════
// Canon enums — 1880-accurate (mirrors the Nations design canon)
// ══════════════════════════════════════════════════════════════════════

export const RegimeTypeSchema = z.enum(["monarchy", "republic"]);
export type RegimeType = z.infer<typeof RegimeTypeSchema>;

export const PoliticalSystemSchema = z.enum([
  "constitutional_monarchy",
  "federal_constitutional_monarchy",
  "dual_monarchy",
  "autocratic_monarchy",
  "absolute_monarchy",
  "parliamentary_republic",
  "presidential_republic",
  "meiji_constitutional_monarchy",
  "khedivate_autonomous",
  "union_monarchy",
]);
export type PoliticalSystem = z.infer<typeof PoliticalSystemSchema>;

export const StabilityLevelSchema = z.enum([
  "very_high",
  "high",
  "moderate",
  "brittle",
  "fragile",
  "unstable",
]);
export type StabilityLevel = z.infer<typeof StabilityLevelSchema>;

export const NavalPurposeSchema = z.enum([
  "sustain_global_empire",
  "gain_world_power_status",
  "defend_hemisphere_expand",
  "secure_sovereignty_ascent",
  "restore_status_offset_rivals",
  "gain_mediterranean_credibility",
  "escape_geographic_confinement",
  "deny_adriatic_control",
  "preserve_colonies_honor",
  "defend_sovereignty_modernize",
  "guard_straits_survive",
  "control_canal_survive",
  "sustain_colonial_network",
  "guard_baltic_entrance",
  "maintain_union_neutrality",
  "defend_coast_colonies",
  "survive_as_buffer",
  "contest_southern_cone",
]);
export type NavalPurpose = z.infer<typeof NavalPurposeSchema>;

export const LogisticsProfileSchema = z.enum([
  "global_network",
  "concentrated_home",
  "two_ocean_divided",
  "regional_concentration",
  "fragmented_theaters",
  "narrow_sea",
  "scattered_empire",
  "coastal_vulnerable",
  "strait_guardian",
  "colonial_network",
]);
export type LogisticsProfile = z.infer<typeof LogisticsProfileSchema>;

export const IndustrialBaseSchema = z.enum([
  "mature_global",
  "rising_dynamic",
  "latent_giant",
  "constrained_regional",
  "uneven",
  "fragmented",
  "vast_unintegrated",
  "agrarian_colonial",
  "resource_export",
]);
export type IndustrialBase = z.infer<typeof IndustrialBaseSchema>;

export const SenioritySchema = z.enum([
  "senior_service",
  "junior_to_army",
  "prestige_service",
  "fragmented",
  "coastal_only",
]);
export type Seniority = z.infer<typeof SenioritySchema>;

export const CoreAnxietySchema = z.enum([
  "loss_of_sea_control_overstretch",
  "encirclement_insufficient_recognition",
  "foreign_interference_americas",
  "domination_before_ready",
  "germany_land_britain_sea",
  "french_pressure_austrian_ambiguity",
  "warm_water_failure_fragmentation",
  "italian_hostility_adriatic_vulnerability",
  "colonial_collapse_humiliation",
  "foreign_encroachment_failed_modernization",
  "russian_breakthrough_and_partition",
  "foreign_occupation_and_loss_of_autonomy",
  "loss_of_east_indies",
  "great_power_pressure_over_straits",
  "union_dissolution_and_great_power_pressure",
  "loss_of_angola_mozambique",
  "ottoman_retention_of_greek_lands",
  "argentine_chilean_challenge",
  "argentine_intervention_and_loss_of_nitrates",
  "brazilian_chilean_encirclement",
  "loss_of_sovereignty_to_qing_japan_or_russia",
  "russian_british_partition",
  "partition_between_britain_and_france",
  "great_power_violation_of_neutrality",
]);
export type CoreAnxiety = z.infer<typeof CoreAnxietySchema>;

export const GameplayFeelSchema = z.enum([
  "manage_supremacy",
  "build_concentrated_relevance",
  "awaken_latent_power",
  "modernize_under_pressure",
  "forge_coherence",
  "gamble_intelligently",
  "integrate_disconnected_theaters",
  "defend_narrow_sea",
  "prevent_imperial_collapse",
  "transform_vast_potential",
  "guard_the_gate",
  "survive_between_empires",
  "defend_far_flung_empire_as_small_power",
  "leverage_geography_as_small_power",
  "defend_long_coast_as_neutral",
  "survive_as_small_colonial",
  "irredentist_gamble",
  "dominate_south_atlantic",
  "win_pacific_war_and_control_magellan",
  "grow_between_giants",
  "survive_great_game",
  "survive_as_buffer_via_diplomacy",
  "survive_as_neutral_industrial",
]);
export type GameplayFeel = z.infer<typeof GameplayFeelSchema>;

export const GdpTierSchema = z.enum([
  "global_hegemon",
  "great_power",
  "regional_power",
  "minor_power",
  "small_power",
]);
export type GdpTier = z.infer<typeof GdpTierSchema>;

export const IndustrializationLevelSchema = z.enum([
  "world_leading",
  "industrial",
  "developing_industrial",
  "agrarian",
  "pre_industrial",
]);
export type IndustrializationLevel = z.infer<typeof IndustrializationLevelSchema>;

export const NavalBudgetLevelSchema = z.enum([
  "very_low",
  "low",
  "moderate",
  "high",
  "very_high",
  "crisis",
]);
export type NavalBudgetLevel = z.infer<typeof NavalBudgetLevelSchema>;

export const ArmyNavyBalanceSchema = z.enum([
  "army_dominant",
  "army_heavy",
  "balanced",
  "navy_prestige",
  "navy_focused",
]);
export type ArmyNavyBalance = z.infer<typeof ArmyNavyBalanceSchema>;

// ══════════════════════════════════════════════════════════════════════
// Primitives & sub-objects
// ══════════════════════════════════════════════════════════════════════

const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .describe("CSS hex color, e.g. #C8102E");

export const PresentationSchema = z
  .object({
    colorBg: HexColorSchema,
    colorFg: HexColorSchema,
  })
  .strict();

export const NationSlotSchema = z
  .object({
    order: z.number(),
    participation: z.enum(["active", "inactive", "conditional"]),
  })
  .strict();

export const StabilityProfileSchema = z
  .object({
    level: StabilityLevelSchema,
    factors: z.array(z.string()),
  })
  .strict();

export const StrategicObjectivesSchema = z
  .object({
    primary: z.string(),
    secondary: z.string(),
  })
  .strict();

export const BaseResourcesSchema = z
  .object({
    gdpTier: GdpTierSchema,
    gdpDescription: z.string(),
    population: z.string(),
    industrialization: IndustrializationLevelSchema,
    industrializationDescription: z.string(),
  })
  .strict();

export const NavalAppropriationSchema = z
  .object({
    budgetLevel: NavalBudgetLevelSchema,
    justification: z.string(),
  })
  .strict();

export const NationRegimeSchema = z
  .object({
    type: RegimeTypeSchema,
    politicalSystem: PoliticalSystemSchema,
    governmentForm: z.string().optional(),
    headOfState: z.string(),
    headOfGovernment: z.string(),
    leaderTitle: z.string(),
    navalPolicyActors: z.array(z.string()),
    governmentModifiers: z.array(z.string()),
    navyMinister: z
      .object({
        name: z.string(),
        title: z.string(),
        traits: z.string().optional(),
      })
      .strict()
      .optional(),
    stabilityProfile: StabilityProfileSchema,
    description: z.string(),
  })
  .strict();

export const IdentitySchema = z
  .object({
    oneSentence: z.string(),
    fullIdentity: z.string(),
    strategicProblem: z.string(),
  })
  .strict();

export const EconomySchema = z
  .object({
    description: z.string(),
    character: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    industrialBase: IndustrialBaseSchema,
  })
  .strict();

export const NavalInstitutionSchema = z
  .object({
    description: z.string(),
    character: z.array(z.string()),
    seniority: SenioritySchema,
    cruiserRole: z.string().optional(),
    formativeExperience: z.string().optional(),
  })
  .strict();

export const DoctrineSchema = z
  .object({
    summary: z.string(),
    schools: z.array(z.string()),
    isFragmented: z.boolean().optional(),
    isTheaterSpecific: z.boolean().optional(),
  })
  .strict();

export const ShipDesignSchema = z
  .object({
    summary: z.string(),
    principles: z.array(z.string()),
    favoredTypes: z.array(z.string()),
    tradeOffs: z.string().optional(),
    exemplarClass: z.string().optional(),
  })
  .strict();

export const AiSchema = z
  .object({
    archetype: z.string(),
    behavior: z.array(z.string()),
    aiRole: z.string().optional(),
    triggers: z.array(z.string()).optional(),
  })
  .strict();

export const MilitarySchema = z
  .object({
    description: z.string(),
    size: z.string().optional(),
    character: z.array(z.string()).optional(),
    armyNavyBalance: ArmyNavyBalanceSchema.optional(),
  })
  .strict();

// ══════════════════════════════════════════════════════════════════════
// Country entity
// ══════════════════════════════════════════════════════════════════════
//
// `id` doubles as the 3-letter tag (GBR, FRA, ...) referenced throughout
// the pack. The rich fields below are optional at the schema level so packs
// that predate the enrichment still validate; production content should
// populate them fully.

export const CountrySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    tag: z.string().length(3),
    color: z.string().optional(),

    displayNameKey: z.string().optional(),
    isPlayable: z.boolean().optional(),
    slot: NationSlotSchema.optional(),
    presentation: PresentationSchema.optional(),

    identity: IdentitySchema.optional(),
    regime: NationRegimeSchema.optional(),
    strategicObjectives: StrategicObjectivesSchema.optional(),
    baseResources: BaseResourcesSchema.optional(),
    navalAppropriation: NavalAppropriationSchema.optional(),

    economy: EconomySchema.optional(),
    navalInstitution: NavalInstitutionSchema.optional(),
    doctrine: DoctrineSchema.optional(),
    shipDesign: ShipDesignSchema.optional(),
    ai: AiSchema.optional(),
    military: MilitarySchema.optional(),

    navalPurpose: NavalPurposeSchema.optional(),
    logisticsProfile: LogisticsProfileSchema.optional(),
    coreAnxiety: CoreAnxietySchema.optional(),
    gameplayFeel: GameplayFeelSchema.optional(),
    historicalAssumptions: z.array(z.string()).optional(),
  })
  .strict()
  .describe("Canonical country definition, January 1880");

export interface Country extends z.infer<typeof CountrySchema> {}
