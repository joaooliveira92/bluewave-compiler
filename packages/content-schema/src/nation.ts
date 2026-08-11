import { z } from "zod";

// ══════════════════════════════════════════════════════════════════════
// Nation IDs — 24 canonical nations, January 1880
// ══════════════════════════════════════════════════════════════════════

export const NationIdSchema = z.enum([
  "uk",
  "germany",
  "usa",
  "japan",
  "france",
  "italy",
  "russia",
  "austria_hungary",
  "spain",
  "qing",
  "ottoman_empire",
  "egypt",
  "netherlands",
  "belgium",
  "denmark",
  "sweden_norway",
  "portugal",
  "greece",
  "brazil",
  "chile",
  "argentina",
  "korea",
  "persia",
  "siam",
]);
export type NationId = z.infer<typeof NationIdSchema>;

// ══════════════════════════════════════════════════════════════════════
// Regime enums — 1880-accurate
// ══════════════════════════════════════════════════════════════════════

export const RegimeTypeSchema = z.enum(["monarchy", "republic"]);
export type RegimeType = z.infer<typeof RegimeTypeSchema>;

/** Specific political systems that existed in January 1880 */
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

// ══════════════════════════════════════════════════════════════════════
// Canon sub-model enums
// ══════════════════════════════════════════════════════════════════════

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

export const AiArchetypeSchema = z.enum([
  "status_quo_maritime_hegemon",
  "restless_industrial_challenger",
  "cautious_industrial_giant_awakening",
  "urgent_regional_modernizer",
  "restless_revanchist_innovator",
  "prestige_seeking_mediterranean_opportunist",
  "fragmented_continental_giant",
  "defensive_adriatic_strategist",
  "defensive_declining_empire",
  "vast_conservative_modernizer",
  "besieged_strait_guardian",
  "canal_guardian_in_debt",
  "wealthy_neutral_colonial",
  "small_strait_guardian",
  "neutral_archipelago_defender",
  "small_colonial_survivor",
  "irredentist_small_power",
  "south_american_giant",
  "battle_tested_pacific_power",
  "growing_plate_power",
  "hermit_kingdom_flashpoint",
  "skillful_buffer_kingdom",
  "neutral_industrial_minor",
  "great_game_buffer",
]);
export type AiArchetype = z.infer<typeof AiArchetypeSchema>;

export const AiRoleSchema = z.enum([
  "strait_guardian",
  "colonial_power",
  "regional_balancer",
  "buffer_state",
  "southern_cone_rival",
  "crisis_flashpoint",
]);
export type AiRole = z.infer<typeof AiRoleSchema>;

/** 24 distinct canonical anxieties (one per nation) */
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

/** 24 distinct canonical gameplay feels (one per nation) */
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
  "survive_between_empires",
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
// Primitives
// ══════════════════════════════════════════════════════════════════════

const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .describe("CSS hex color, e.g. #C8102E");

// ══════════════════════════════════════════════════════════════════════
// Sub-objects
// ══════════════════════════════════════════════════════════════════════

export const PresentationSchema = z
  .object({
    colorBg: HexColorSchema,
    colorFg: HexColorSchema,
  })
  .strict()
  .describe("Nation flag/presentation colors");

export const NationSlotSchema = z
  .object({
    id: z.string(),
    order: z.number(),
    participation: z.enum(["active", "inactive", "conditional"]),
  })
  .strict();

export const StabilityProfileSchema = z
  .object({
    level: StabilityLevelSchema,
    factors: z.array(z.string()),
  })
  .strict()
  .describe("Domestic stability level and contributing factors");

export const CanalDependencySchema = z
  .object({
    suez: z.string(),
    panama: z.string(),
  })
  .strict();

// ══════════════════════════════════════════════════════════════════════
// Phase 1 additive fields — spec-driven
// ══════════════════════════════════════════════════════════════════════

export const StrategicObjectivesSchema = z
  .object({
    primary: z.string(),
    secondary: z.string(),
  })
  .strict()
  .describe("Primary and secondary strategic objectives per scenario era");

export const BaseResourcesSchema = z
  .object({
    gdpTier: GdpTierSchema,
    gdpDescription: z
      .string()
      .describe("Free-text elaboration on GDP tier, e.g. 'largest in Europe, #1 globally'"),
    population: z
      .string()
      .describe("Population as free-text string, e.g. '~35M (UK proper); ~300M (empire)'"),
    industrialization: IndustrializationLevelSchema,
    industrializationDescription: z.string().describe("Free-text elaboration on industrial level"),
  })
  .strict()
  .describe("Base resource indicators, January 1880");

export const NavalAppropriationSchema = z
  .object({
    budgetLevel: NavalBudgetLevelSchema,
    justification: z.string().describe("Narrative justification for the naval budget level"),
  })
  .strict()
  .describe("Naval budget appropriation for the scenario era");

// ══════════════════════════════════════════════════════════════════════
// Regime — 1880-accurate political system
// ══════════════════════════════════════════════════════════════════════

export const NationRegimeSchema = z
  .object({
    type: RegimeTypeSchema,
    politicalSystem: PoliticalSystemSchema.describe("Specific 1880 political system"),
    governmentForm: z.string().optional().describe("Deprecated — prefer politicalSystem"),
    headOfState: z.string(),
    headOfGovernment: z.string(),
    leaderTitle: z.string(),
    navalPolicyActors: z.array(z.string()),
    governmentModifiers: z
      .array(z.string())
      .describe("Tags e.g. federal_structure, fragmented_legislature"),
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
  .strict()
  .describe("Political regime, January 1880");

// ══════════════════════════════════════════════════════════════════════
// Domain sub-models
// ══════════════════════════════════════════════════════════════════════

export const IdentitySchema = z
  .object({
    oneSentence: z.string().describe("Phase 1 canonical one-sentence identity"),
    fullIdentity: z.string().describe("Phase 1 full national identity"),
    strategicProblem: z.string().describe("Core strategic problem the nation faces"),
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
    archetype: AiArchetypeSchema,
    behavior: z.array(z.string()),
    aiRole: AiRoleSchema.optional(),
    triggers: z.array(z.string()).optional(),
  })
  .strict();

// ══════════════════════════════════════════════════════════════════════
// Military — Phase 1 Nations
// ══════════════════════════════════════════════════════════════════════

export const MilitarySchema = z
  .object({
    description: z.string().describe("Army/military profile overview"),
    size: z.string().optional().describe("Free-text army size, e.g. 'peacetime ~900,000'"),
    character: z.array(z.string()).optional(),
    armyNavyBalance: ArmyNavyBalanceSchema.optional(),
  })
  .strict()
  .describe("Army/military profile for the scenario era");

// ══════════════════════════════════════════════════════════════════════
// Nation entity — single source of truth for the canon
// ══════════════════════════════════════════════════════════════════════

export const NationSchema = z
  .object({
    id: NationIdSchema,
    tag: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .describe("Uppercase 3-letter code, e.g. GBR"),
    name: z.string(),
    displayNameKey: z.string(),
    isPlayable: z.boolean(),
    slot: z.nullable(NationSlotSchema),
    presentation: PresentationSchema,
    identity: IdentitySchema,
    regime: NationRegimeSchema,
    strategicObjectives: StrategicObjectivesSchema,
    baseResources: BaseResourcesSchema,
    navalAppropriation: NavalAppropriationSchema,
    economy: EconomySchema,
    navalInstitution: NavalInstitutionSchema,
    doctrine: DoctrineSchema,
    shipDesign: ShipDesignSchema,
    ai: AiSchema,
    military: MilitarySchema.optional(),
    navalPurpose: NavalPurposeSchema,
    coreAnxiety: CoreAnxietySchema,
    gameplayFeel: GameplayFeelSchema,
    historicalAssumptions: z.array(z.string()),
  })
  .strict()
  .describe("Canonical nation definition, January 1880");

// ══════════════════════════════════════════════════════════════════════
// Pack envelope
// ══════════════════════════════════════════════════════════════════════

export const ProvenanceSchema = z.enum([
  "CANONICAL_CONTENT",
  "MANUAL_EXPLICIT",
  "DESIGN_DECISION",
  "GENERATED_CANONICAL",
  "SCENARIO_OVERRIDE",
  "RULESET_CONSTANT",
  "DEPRECATED",
]);

export const NationsPackSchema = z
  .object({
    scenario: z.string(),
    continuityMode: z.enum(["historical", "alternate_continuity_v1"]),
    provenance: ProvenanceSchema,
    nations: z.array(NationSchema),
  })
  .strict();

// ══════════════════════════════════════════════════════════════════════
// Inferred types
// ══════════════════════════════════════════════════════════════════════

export type NationRegime = z.infer<typeof NationRegimeSchema>;
export type Nation = z.infer<typeof NationSchema>;
export type NationSlot = z.infer<typeof NationSlotSchema>;
export type NationsPack = z.infer<typeof NationsPackSchema>;
export type StabilityProfile = z.infer<typeof StabilityProfileSchema>;
export type CanalDependency = z.infer<typeof CanalDependencySchema>;
export type Presentation = z.infer<typeof PresentationSchema>;
export type Identity = z.infer<typeof IdentitySchema>;
export type Economy = z.infer<typeof EconomySchema>;
export type NavalInstitution = z.infer<typeof NavalInstitutionSchema>;
export type Doctrine = z.infer<typeof DoctrineSchema>;
export type ShipDesign = z.infer<typeof ShipDesignSchema>;
export type Ai = z.infer<typeof AiSchema>;
export type Military = z.infer<typeof MilitarySchema>;
export type StrategicObjectives = z.infer<typeof StrategicObjectivesSchema>;
export type BaseResources = z.infer<typeof BaseResourcesSchema>;
export type NavalAppropriation = z.infer<typeof NavalAppropriationSchema>;
