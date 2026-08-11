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
// Geography enums — Phase 2 Canon
// ══════════════════════════════════════════════════════════════════════

/** 12 canonical theaters (A-L) */
export const TheaterIdSchema = z.enum([
  "home_waters_north_atlantic",
  "mediterranean",
  "baltic",
  "black_sea_turkish_straits",
  "west_africa_south_atlantic",
  "caribbean_gulf",
  "indian_ocean_red_sea",
  "southeast_asia_crossroads",
  "east_asia_western_pacific",
  "north_pacific",
  "south_pacific",
  "south_american_southern_passage",
]);
export type TheaterId = z.infer<typeof TheaterIdSchema>;

/** 14 canonical chokepoints */
export const ChokepointIdSchema = z.enum([
  "gibraltar",
  "suez_canal",
  "bab_el_mandeb",
  "cape_of_good_hope",
  "turkish_straits",
  "danish_straits",
  "english_channel",
  "otranto",
  "malacca_singapore",
  "korea_tsushima",
  "taiwan_strait",
  "luzon_strait",
  "caribbean_passages",
  "magellan_cape_horn",
]);
export type ChokepointId = z.infer<typeof ChokepointIdSchema>;

export const OceanIdSchema = z.enum(["atlantic", "pacific", "indian", "southern_ocean", "arctic"]);
export type OceanId = z.infer<typeof OceanIdSchema>;

// ══════════════════════════════════════════════════════════════════════
// Regime enums — 1880-accurate
// ══════════════════════════════════════════════════════════════════════

export const RegimeTypeSchema = z.enum(["monarchy", "republic"]);

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

export const SenioritySchema = z.enum([
  "senior_service",
  "junior_to_army",
  "prestige_service",
  "fragmented",
  "coastal_only",
]);

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

export const AiRoleSchema = z.enum([
  "strait_guardian",
  "colonial_power",
  "regional_balancer",
  "buffer_state",
  "southern_cone_rival",
  "crisis_flashpoint",
]);

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

// ══════════════════════════════════════════════════════════════════════
// Base resource enums — Phase 1 Nations
// ══════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════
// Military enums — Phase 1 Nations
// ══════════════════════════════════════════════════════════════════════

export const ArmyNavyBalanceSchema = z.enum([
  "army_dominant",
  "army_heavy",
  "balanced",
  "navy_prestige",
  "navy_focused",
]);
export type ArmyNavyBalance = z.infer<typeof ArmyNavyBalanceSchema>;
