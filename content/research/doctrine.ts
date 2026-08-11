// doctrine.ts - Doctrine Phase - IMMUTABLE - January 1880
// Derived from: navalInstitution + geography + shipDesign + AI personality
// No DB rows - qualitative doctrinal posture
// Zod 4 compatible

import { z } from "zod";

// ── Canonical IDs ───────────────────────────────────────────────────

export const PlayableNationIdSchema = z.enum([
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
export type PlayableNationId = z.infer<typeof PlayableNationIdSchema>;

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

export const ShipTypeSchema = z.enum([
  "battleships",
  "coastal_defense_ships",
  "armored_cruisers",
  "protected_cruisers",
  "torpedo_craft",
  "torpedo_gunboats",
  "gunboats",
  "monitors",
]);

// ── Schools ─────────────────────────────────────────────────────────
// 17 schools - closed for 1880. No carriers, subs as primary, or missile doctrine.

export const DoctrineSchoolSchema = z.enum([
  "command_of_sea",
  "blockade",
  "trade_protection",
  "cruiser_warfare",
  "concentrated_battlefleet",
  "risk_theory",
  "mahanian_sea_control",
  "regional_concentration",
  "decisive_battle",
  "jeune_ecole",
  "guerre_de_course",
  "coastal_defense",
  "fleet_in_being",
  "sea_denial",
  "mine_torpedo_defense",
  "colonial_station",
  "theater_fragmented",
]);
export type DoctrineSchool = z.infer<typeof DoctrineSchoolSchema>;

// ── Profile ─────────────────────────────────────────────────────────

export const TheaterDoctrineSchema = z
  .object({
    theater: TheaterIdSchema,
    schools: z.array(DoctrineSchoolSchema).min(1).max(2),
    note: z.string().max(120).optional(),
  })
  .strict();

export const DoctrineProfileSchema = z
  .object({
    nation: PlayableNationIdSchema,
    summary: z.string().min(20).max(300).describe("One-sentence posture from Phase 1"),
    description: z.string().min(40).max(600).optional().describe("Full doctrinal paragraph"),
    schools: z
      .array(DoctrineSchoolSchema)
      .min(1)
      .max(4)
      .describe("Primary schools. Coherent=1-2, Fragmented=3-4"),
    isFragmented: z.boolean().describe("True for France/Russia/Qing"),
    isTheaterSpecific: z.boolean().describe("True for Russia/Qing - doctrines vary by sea"),
    theaterDoctrines: z
      .array(TheaterDoctrineSchema)
      .max(5)
      .optional()
      .describe("Only if isTheaterSpecific=true"),
    favoredTypes: z.array(ShipTypeSchema).min(1).max(4).describe("Ship types doctrine favors"),
    exemplarClass: z.string().max(64).optional().describe("e.g. Italia class"),
    coherence: z
      .enum(["coherent", "contested", "fragmented"])
      .optional()
      .describe("Derived from isFragmented + schools.length"),
    evolution: z
      .string()
      .max(200)
      .optional()
      .describe("Future path, e.g. Germany -> risk_theory after 1898"),
  })
  .strict()
  .superRefine((d, ctx) => {
    // Coherence rules
    if (d.isFragmented && d.schools.length < 3 && !d.schools.includes("theater_fragmented")) {
      ctx.addIssue({
        code: "custom",
        message: `Fragmented doctrine should have >=3 schools or theater_fragmented`,
        path: ["schools"],
      });
    }
    if (!d.isFragmented && d.schools.length > 2) {
      ctx.addIssue({
        code: "custom",
        message: `Coherent doctrine must have <=2 schools`,
        path: ["schools"],
      });
    }
    // Theater-specific requires theaterDoctrines
    if (d.isTheaterSpecific && (!d.theaterDoctrines || d.theaterDoctrines.length === 0)) {
      ctx.addIssue({
        code: "custom",
        message: `isTheaterSpecific=true requires theaterDoctrines`,
        path: ["theaterDoctrines"],
      });
    }
    if (!d.isTheaterSpecific && d.theaterDoctrines && d.theaterDoctrines.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `theaterDoctrines only allowed if isTheaterSpecific=true`,
        path: ["theaterDoctrines"],
      });
    }
    // Canon locks
    if (d.schools.includes("risk_theory") && d.nation !== "germany") {
      ctx.addIssue({ code: "custom", message: `risk_theory only for Germany`, path: ["schools"] });
    }
    if (d.schools.includes("jeune_ecole") && !["france", "japan"].includes(d.nation)) {
      ctx.addIssue({
        code: "custom",
        message: `jeune_ecole only for France (primary) and Japan (limited) in 1880`,
        path: ["schools"],
      });
    }
    if (d.schools.includes("mahanian_sea_control") && d.nation !== "usa") {
      ctx.addIssue({
        code: "custom",
        message: `mahanian_sea_control only for USA in 1880`,
        path: ["schools"],
      });
    }
    // Favored types must align with schools
    if (
      d.schools.includes("jeune_ecole") &&
      !d.favoredTypes.some((t) => ["torpedo_craft", "protected_cruisers"].includes(t))
    ) {
      ctx.addIssue({
        code: "custom",
        message: `jeune_ecole should favor torpedo_craft or protected_cruisers`,
        path: ["favoredTypes"],
      });
    }
  });

export type DoctrineProfile = z.infer<typeof DoctrineProfileSchema>;
export type TheaterDoctrine = z.infer<typeof TheaterDoctrineSchema>;

// ── Pack ────────────────────────────────────────────────────────────

export const ProvenanceSchema = z
  .object({
    source: z.string().min(3),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    approved: z.boolean().optional(),
    generatedAt: z.string().datetime().optional(),
  })
  .strict();

export const DoctrinePackSchema = z
  .object({
    scenario: z.string().min(3),
    continuityMode: z.enum(["historical", "alternate_continuity_v1"]),
    provenance: ProvenanceSchema,
    doctrines: z.array(DoctrineProfileSchema).length(10),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const ids = pack.doctrines.map((d) => d.nation);
    if (new Set(ids).size !== 10) {
      ctx.addIssue({
        code: "custom",
        message: `Must have 10 unique doctrines, got ${ids.join(",")}`,
        path: ["doctrines"],
      });
    }
  });

// ── Helpers ─────────────────────────────────────────────────────────

export const getDoctrine = (pack: z.infer<typeof DoctrinePackSchema>, nation: PlayableNationId) =>
  pack.doctrines.find((d) => d.nation === nation);

export const hasSchool = (d: DoctrineProfile, school: DoctrineSchool) => d.schools.includes(school);

export const getTheaterDoctrine = (d: DoctrineProfile, theater: z.infer<typeof TheaterIdSchema>) =>
  d.theaterDoctrines?.find((t) => t.theater === theater);

export const getCoherence = (d: DoctrineProfile): "coherent" | "contested" | "fragmented" => {
  if (d.coherence) return d.coherence;
  if (d.isFragmented) return "fragmented";
  if (d.schools.length === 2) return "contested";
  return "coherent";
};

// ── 1880 Canon Seed ─────────────────────────────────────────────────

export const CANON_1880_DOCTRINES: Record<PlayableNationId, Omit<DoctrineProfile, "nation">> = {
  uk: {
    summary: "Command of sea, blockade, trade protection, cruiser coverage",
    description:
      "Global command requires concentration for battle and dispersion for empire. Cruisers are working ships of empire.",
    schools: ["command_of_sea", "blockade"],
    isFragmented: false,
    isTheaterSpecific: false,
    favoredTypes: ["battleships", "protected_cruisers"],
    coherence: "coherent",
  },
  germany: {
    summary: "Coastal defense transitioning to concentrated battlefleet",
    description:
      "North/Baltic defense now, concentrated North Sea fleet as future leverage. Short radius, strong protection.",
    schools: ["coastal_defense", "concentrated_battlefleet"],
    isFragmented: false,
    isTheaterSpecific: false,
    favoredTypes: ["coastal_defense_ships", "protected_cruisers"],
    coherence: "coherent",
    evolution: "May evolve to risk_theory after 1898 if politically enabled",
  },
  usa: {
    summary: "Coastal defense transitioning to Mahanian sea control",
    description:
      "Theorizing sea power before living it. Hemispheric defense now, blue-water battlefleet later.",
    schools: ["coastal_defense", "mahanian_sea_control"],
    isFragmented: false,
    isTheaterSpecific: false,
    favoredTypes: ["protected_cruisers", "coastal_defense_ships"],
    coherence: "contested",
  },
  japan: {
    summary: "Regional concentration, decisive battle, torpedo equalizers",
    description:
      "Must dominate Korea Strait/Yellow Sea before mainland action. High readiness, imported ships.",
    schools: ["regional_concentration", "decisive_battle"],
    isFragmented: false,
    isTheaterSpecific: false,
    favoredTypes: ["protected_cruisers", "torpedo_craft"],
    coherence: "coherent",
  },
  france: {
    summary: "Competing visions: battlefleet vs Jeune Ecole vs guerre de course",
    description:
      "Brilliant but unstable. Cabinet instability drives doctrinal swings between Toulon/Mediterranean and Atlantic.",
    schools: ["concentrated_battlefleet", "jeune_ecole", "guerre_de_course"],
    isFragmented: true,
    isTheaterSpecific: false,
    favoredTypes: ["protected_cruisers", "torpedo_craft"],
    coherence: "fragmented",
  },
  italy: {
    summary: "Mediterranean fleet-in-being, fast heavy ships",
    description:
      "Deterrence against France with bold design. Speed and heavy guns over belt armor.",
    schools: ["fleet_in_being", "decisive_battle"],
    isFragmented: false,
    isTheaterSpecific: false,
    favoredTypes: ["battleships", "armored_cruisers"],
    exemplarClass: "Italia class",
    coherence: "coherent",
  },
  russia: {
    summary: "Theater-specific: Baltic defense, Black Sea pressure, Pacific expansion",
    description: "No unified doctrine. Each fleet has different geography, enemy, and logistics.",
    schools: ["theater_fragmented", "coastal_defense", "sea_denial"],
    isFragmented: true,
    isTheaterSpecific: true,
    theaterDoctrines: [
      {
        theater: "baltic",
        schools: ["coastal_defense", "mine_torpedo_defense"],
        note: "Protect St. Petersburg, fortress sea",
      },
      {
        theater: "black_sea_turkish_straits",
        schools: ["fleet_in_being", "coastal_defense"],
        note: "Trapped by Straits",
      },
      {
        theater: "east_asia_western_pacific",
        schools: ["regional_concentration", "cruiser_warfare"],
        note: "Future Far East ambition",
      },
    ],
    favoredTypes: ["coastal_defense_ships", "armored_cruisers"],
    coherence: "fragmented",
  },
  austria_hungary: {
    summary: "Adriatic sea denial, fleet-in-being at Pola",
    description: "Compact, professional, mine/torpedo/fortress defense. Otranto controls exit.",
    schools: ["sea_denial", "fleet_in_being"],
    isFragmented: false,
    isTheaterSpecific: false,
    favoredTypes: ["coastal_defense_ships", "torpedo_craft"],
    coherence: "coherent",
  },
  spain: {
    summary: "Colonial station, port defense, avoid decisive battle",
    description:
      "Scattered empire exposes weakness. Preserve fleet, deter opportunists, defend Cuba/Philippines.",
    schools: ["colonial_station", "coastal_defense"],
    isFragmented: false,
    isTheaterSpecific: false,
    favoredTypes: ["protected_cruisers", "gunboats"],
    coherence: "coherent",
  },
  qing: {
    summary: "Regional coastal defense, no unified national doctrine",
    description:
      "Beiyang dominant but regionally fragmented. Cannot share resources between fleets.",
    schools: ["theater_fragmented", "coastal_defense", "fleet_in_being"],
    isFragmented: true,
    isTheaterSpecific: true,
    theaterDoctrines: [
      {
        theater: "east_asia_western_pacific",
        schools: ["coastal_defense", "fleet_in_being"],
        note: "Bohai/Yellow Sea, Beiyang",
      },
      {
        theater: "southeast_asia",
        schools: ["coastal_defense", "colonial_station"],
        note: "Nanyang, treaty ports",
      },
    ],
    favoredTypes: ["coastal_defense_ships", "protected_cruisers"],
    coherence: "fragmented",
  },
};

// ── Guardrails ──────────────────────────────────────────────────────

export const DOCTRINE_GUARDRAILS = {
  jeuneEcole: "Jeune Ecole only France (+limited Japan) in 1880",
  riskTheory: "Risk Theory is post-1898 German evolution, not Jan 1880 active doctrine",
  mahan: "Mahan is theorizing (book 1890), USA is coastal_defense + mahanian transition",
  fragmented: "France/Russia/Qing must be fragmented + theater_fragmented where applicable",
  favoredTypes:
    "Favored types must be ShipType enum, not free string - ensures shipbuilding phase can validate",
} as const;
