// schema/a-profiles.ts
// Canonical AI Profiles — January 1880
// Derived from: Consolidated Final Canon Document Phase 1 (National Identities) + Phase 2 (World Geography)
// Immutable canon. Do not add WWII/anachronistic values (fascist, communist, kamikaze).
// Zod 4 compatible

import { z } from "zod";

// ── Canonical IDs ───────────────────────────────────────────────────

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
]);
export type NationId = z.infer<typeof NationIdSchema>;

export const TheaterIdSchema = z.enum([
  "home_waters_north_atlantic",
  "mediterranean",
  "baltic",
  "black_sea_turkish_straits",
  "west_africa_south_atlantic",
  "caribbean_gulf",
  "indian_ocean_red_sea",
  "southeast_asia",
  "east_asia_western_pacific",
  "north_pacific",
  "south_pacific",
  "southern_passage",
]);

export const ChokepointIdSchema = z.enum([
  "gibraltar",
  "suez",
  "bab_el_mandeb",
  "cape_of_good_hope",
  "turkish_straits",
  "danish_straits",
  "channel_approaches",
  "otranto",
  "malacca_singapore",
  "korea_tsushima",
  "taiwan_strait",
  "luzon_strait",
  "caribbean_passages",
  "magellan_cape_horn",
]);

// ── Canonical Enums ─────────────────────────────────────────────────

export const NavalPurposeSchema = z.enum([
  "sustain_global_empire", // UK
  "gain_world_power_status", // Germany
  "defend_hemisphere_expand", // USA
  "secure_sovereignty_ascent", // Japan
  "restore_status_offset_rivals", // France
  "gain_mediterranean_credibility", // Italy
  "escape_geographic_confinement", // Russia
  "deny_adriatic_control", // Austria-Hungary
  "preserve_colonies_honor", // Spain
  "defend_sovereignty_modernize", // Qing
]);

export const AiArchetypeSchema = z.enum([
  "status_quo_hegemon", // UK
  "restless_industrial_challenger", // Germany
  "awakening_industrial_giant", // USA
  "urgent_regional_modernizer", // Japan
  "wounded_revanchist_innovator", // France
  "prestige_seeking_opportunist", // Italy
  "fragmented_continental_giant", // Russia
  "defensive_adriatic_strategist", // Austria-Hungary
  "defensive_declining_empire", // Spain
  "conservative_modernizer", // Qing
]);

export const RiskToleranceSchema = z.enum(["very_low", "low", "moderate", "high", "very_high"]);

export const FleetDoctrineSchema = z.enum([
  "command_of_sea",
  "blockade",
  "trade_protection",
  "concentrated_battlefleet",
  "risk_theory",
  "mahanian_sea_control",
  "regional_concentration",
  "decisive_local_battle",
  "jeune_ecole",
  "guerre_de_course",
  "coastal_defense",
  "fleet_in_being",
  "sea_denial",
  "colonial_station",
  "theater_fragmented",
]);

export const ResearchFocusSchema = z.enum([
  "steel_hulls",
  "heavy_guns",
  "quick_firing_guns",
  "torpedoes",
  "torpedo_craft",
  "protected_cruisers",
  "armored_cruisers",
  "coastal_defense_ships",
  "submarine_experiment",
  "machinery_endurance",
  "armor_subdivision",
  "mine_warfare",
  "coaling_logistics",
]);

// 1880-correct traits — no kamikaze/fascist/communist
export const AiTraitSchema = z.enum([
  "global_coaling_network",
  "overstretched",
  "prestige_sensitive",
  "navalist_press_sensitive",
  "army_dominated",
  "concentrated_fleet",
  "two_ocean_divided",
  "regional_concentration_advantage",
  "doctrinally_fragmented",
  "experimental_designs",
  "theater_fragmented_fleets",
  "adriatic_contained",
  "colonially_dispersed",
  "regionally_fragmented",
  "rapid_learner",
  "crisis_reactive",
  "budget_constrained",
]);

// ── AI Profile ──────────────────────────────────────────────────────

export const AiProfileSchema = z
  .object({
    nation: NationIdSchema.describe("FK to NationsPack — must be one of 10 playable powers"),

    archetype: AiArchetypeSchema.describe("Phase 1 AI Personality archetype"),

    summary: z.string().min(20).max(280).describe("One-sentence AI behavior summary from canon"),

    navalPurpose: NavalPurposeSchema.describe("Phase 1 Naval Purpose — why the navy exists"),

    coreAnxiety: z
      .string()
      .min(10)
      .max(200)
      .describe("Phase 1 Core Anxiety — what the AI fears most"),

    behavior: z
      .array(z.string().min(5).max(120))
      .min(3)
      .max(8)
      .describe(
        "Canonical behavior directives, e.g. 'protect home waters', 'preserve cruiser coverage'",
      ),

    triggers: z
      .array(z.string().min(5).max(120))
      .min(1)
      .max(6)
      .optional()
      .describe("Crisis triggers that cause strong reaction, e.g. 'naval scare', 'korea crisis'"),

    riskTolerance: RiskToleranceSchema.describe(
      "Qualitative risk — maps to quantitative 0.0-1.0 in engine",
    ),

    riskToleranceValue: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe(
        "Optional numeric override for engine. If omitted, derived from riskTolerance enum",
      ),

    fleetDoctrine: z
      .array(FleetDoctrineSchema)
      .min(1)
      .max(3)
      .describe("Primary doctrine(s). Use 1-2, 3 only for fragmented powers like France/Russia"),

    researchFocus: z
      .array(ResearchFocusSchema)
      .min(1)
      .max(4)
      .describe("Tech priorities consistent with Ship Design Identity"),

    traits: z.array(AiTraitSchema).min(1).max(5).describe("1880-correct traits — no anachronisms"),

    theaterPriorities: z
      .object({
        primary: z.array(TheaterIdSchema).min(1).max(3),
        secondary: z.array(TheaterIdSchema).max(4).default([]),
      })
      .strict()
      .describe("Phase 2 theater priorities — where AI will concentrate"),

    chokepointFocus: z
      .array(ChokepointIdSchema)
      .max(4)
      .default([])
      .describe(
        "Chokepoints AI obsesses over — e.g. Russia: turkish_straits, Japan: korea_tsushima",
      ),

    canalDependency: z
      .object({
        suez: z.enum(["critical", "important", "limited", "none"]),
        panama: z.enum(["future_interest", "none"]),
      })
      .strict()
      .describe("Phase 2 canal logic: Suez exists, Panama does not in 1880"),
  })
  .strict();

// ── Pack Envelope ───────────────────────────────────────────────────

export const ProvenanceSchema = z
  .object({
    source: z.string().min(3).describe("e.g. 'canon_phase1_phase2_v1'"),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/)
      .describe("semver"),
    approved: z.boolean().optional(),
    generatedAt: z.string().datetime().optional(),
  })
  .strict();

export const AiProfilesPackSchema = z
  .object({
    scenario: z.string().min(3).describe("e.g. 'january_1880' — must match NationsPack.scenario"),
    continuityMode: z.enum(["historical", "alternate_continuity_v1"]),
    provenance: ProvenanceSchema,
    aiProfiles: z.array(AiProfileSchema).length(10),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const ids = pack.aiProfiles.map((p) => p.nation);
    const unique = new Set(ids);
    if (unique.size !== 10) {
      ctx.addIssue({
        code: "custom",
        message: `aiProfiles must contain exactly one profile per playable nation (10 unique). Got: ${ids.join(", ")}`,
        path: ["aiProfiles"],
      });
    }
    const archetypes = pack.aiProfiles.map((p) => p.archetype);
    if (new Set(archetypes).size !== archetypes.length) {
      ctx.addIssue({
        code: "custom",
        message: "Ai archetypes should be unique per nation in 1880 canon",
        path: ["aiProfiles"],
      });
    }
  });

// ── Inferred Types ──────────────────────────────────────────────────

export type AiProfile = z.infer<typeof AiProfileSchema>;
export type AiProfilesPack = z.infer<typeof AiProfilesPackSchema>;
export type AiArchetype = z.infer<typeof AiArchetypeSchema>;
export type AiTrait = z.infer<typeof AiTraitSchema>;
export type FleetDoctrine = z.infer<typeof FleetDoctrineSchema>;
export type ResearchFocus = z.infer<typeof ResearchFocusSchema>;
export type TheaterId = z.infer<typeof TheaterIdSchema>;
export type ChokepointId = z.infer<typeof ChokepointIdSchema>;
