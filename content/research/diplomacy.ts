// diplomacy.ts - Diplomacy Phase - IMMUTABLE - January 1880
// No DB rows - qualitative tension/alliance structure
// Zod 4 compatible

import { z } from "zod";

// ── Canonical Nations ───────────────────────────────────────────────
// 10 playables are strict, others allowed as free string for Ottoman, etc.
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

export const AnyNationIdSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z_]+$/);
export type AnyNationId = z.infer<typeof AnyNationIdSchema>;

// ── Tension ─────────────────────────────────────────────────────────

export const TensionScaleSchema = z
  .object({
    min: z.literal(0),
    max: z.literal(10),
    canalBlockThreshold: z.number().int().min(0).max(10).describe(">= this may block Suez"),
    warRiskThreshold: z.number().int().min(0).max(10).describe(">= this = war risk"),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.canalBlockThreshold >= s.warRiskThreshold) {
      ctx.addIssue({
        code: "custom",
        message: `canalBlockThreshold (${s.canalBlockThreshold}) must be < warRiskThreshold (${s.warRiskThreshold})`,
        path: ["canalBlockThreshold"],
      });
    }
  });

export const TensionLevelSchema = z.enum(["amicable", "rivalry", "crisis", "war_risk"]);
export type TensionLevel = z.infer<typeof TensionLevelSchema>;

export const getTensionLevel = (
  tension: number,
  scale: { canalBlockThreshold: number; warRiskThreshold: number },
): TensionLevel => {
  if (tension >= scale.warRiskThreshold) return "war_risk";
  if (tension >= scale.canalBlockThreshold) return "crisis";
  if (tension >= 4) return "rivalry";
  return "amicable";
};

// ── Alliance ────────────────────────────────────────────────────────

export const AllianceTypeSchema = z.enum(["defensive", "offensive", "non_aggression", "secret"]);

export const AllianceSchema = z
  .object({
    id: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9_]+$/)
      .describe("e.g. triple_alliance"),
    name: z.string().min(3).max(80).optional().describe("Display name"),
    type: AllianceTypeSchema,
    members: z.array(AnyNationIdSchema).min(2).max(5),
    since: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("YYYY-MM-DD - must be <= scenario date if active"),
    until: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    isSecret: z.boolean().default(false).optional(),
    provenance: z.string().min(3).optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    if (new Set(a.members).size !== a.members.length) {
      ctx.addIssue({ code: "custom", message: `Duplicate members in ${a.id}`, path: ["members"] });
    }
    if (a.until && a.until <= a.since) {
      ctx.addIssue({ code: "custom", message: `until must be > since`, path: ["until"] });
    }
  });

// ── Guarantee ───────────────────────────────────────────────────────

export const GuaranteeTypeSchema = z.enum(["neutrality", "independence", "territorial", "sphere"]);

export const GuaranteeSchema = z
  .object({
    guarantor: AnyNationIdSchema,
    guaranteed: AnyNationIdSchema,
    type: GuaranteeTypeSchema,
    since: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    source: z.string().min(3).optional().describe("Treaty source"),
  })
  .strict()
  .superRefine((g, ctx) => {
    if (g.guarantor === g.guaranteed) {
      ctx.addIssue({
        code: "custom",
        message: "Guarantor cannot guarantee itself",
        path: ["guarantor"],
      });
    }
  });

// ── Relation ────────────────────────────────────────────────────────

export const RelationSchema = z
  .object({
    a: AnyNationIdSchema,
    b: AnyNationIdSchema,
    tension: z.number().int().min(0).max(10).describe("0=amicable, 10=war imminent - int only"),
    trend: z
      .enum(["rising", "falling", "stable"])
      .default("stable")
      .optional()
      .describe("Direction for AI"),
    note: z.string().max(120).optional().describe("e.g. Alsace-Lorraine, Great Game"),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (r.a === r.b)
      ctx.addIssue({ code: "custom", message: "Self-relation forbidden", path: ["a"] });
  });

// ── Treaty ────────────────────────────────────────────────────────────

export const TreatyTypeSchema = z.enum([
  "arms_control",
  "peace",
  "boundary",
  "canal",
  "neutrality",
  "commercial",
  "alliance",
  "other",
]);

export const TreatyStatusSchema = z.enum([
  "active",
  "expired",
  "superseded",
  "replaced",
  "never_ratified",
]);

export const TreatyTermSchema = z
  .object({
    type: z
      .string()
      .min(1)
      .describe("e.g. tonnage_limit, construction_holiday, territorial_concession"),
    value: z.union([z.number(), z.string(), z.array(z.string())]),
    parties: z.array(z.string()).optional(),
    detail: z.string().max(500).optional(),
  })
  .strict();

export const TreatySchema = z
  .object({
    id: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9_]+$/),
    name: z.string().min(3).max(200),
    signed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    signatories: z.array(AnyNationIdSchema).min(2),
    type: TreatyTypeSchema,
    status: TreatyStatusSchema,
    terms: z.array(TreatyTermSchema),
    supersededBy: z.string().optional(),
    source: z.string().max(200).optional(),
  })
  .strict()
  .superRefine((t, ctx) => {
    if (t.status === "superseded" && !t.supersededBy) {
      ctx.addIssue({
        code: "custom",
        message: `Superseded treaty ${t.id} must specify supersededBy`,
        path: ["supersededBy"],
      });
    }
  });

// ── Incident ──────────────────────────────────────────────────────────

export const IncidentSchema = z
  .object({
    id: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9_]+$/),
    name: z.string().min(3).max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    a: AnyNationIdSchema,
    b: AnyNationIdSchema,
    tensionChange: z.number().int().describe("+/- tension delta this incident caused"),
    resolved: z.boolean(),
    resolution: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
  })
  .strict()
  .superRefine((i, ctx) => {
    if (i.a === i.b)
      ctx.addIssue({ code: "custom", message: "Incident cannot involve one nation", path: ["a"] });
  });

// ── Pack ────────────────────────────────────────────────────────────

export const ProvenanceSchema = z
  .object({
    source: z.string().min(3),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    approved: z.boolean().optional(),
    generatedAt: z.string().datetime().optional(),
  })
  .strict();

export const DiplomacyPackSchema = z
  .object({
    scenario: z.string().min(3).describe("e.g. january_1880"),
    continuityMode: z.enum(["historical", "alternate_continuity_v1"]),
    provenance: ProvenanceSchema,
    tensionScale: TensionScaleSchema,
    alliances: z.array(AllianceSchema).max(10),
    guarantees: z.array(GuaranteeSchema).max(20),
    relations: z.array(RelationSchema).min(1),
    treaties: z.array(TreatySchema),
    incidents: z.array(IncidentSchema),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const seen = new Set<string>();
    for (const r of pack.relations) {
      const key = [r.a, r.b].sort().join("|");
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate relation ${r.a}–${r.b}`,
          path: ["relations"],
        });
        break;
      }
      seen.add(key);
    }
    // 1880 anachronism guard
    const anachronistic = ["nato", "warsaw_pact", "entente_cordiale", "franco_russian_alliance"];
    for (const al of pack.alliances) {
      if (anachronistic.some((x) => al.id.includes(x))) {
        ctx.addIssue({
          code: "custom",
          message: `Anachronistic alliance ${al.id} for 1880`,
          path: ["alliances"],
        });
      }
      // Triple Alliance signed 1882-05-20 - cannot be active in Jan 1880
      if (al.id === "triple_alliance" && al.since < "1882-05-20") {
        ctx.addIssue({
          code: "custom",
          message: "Triple Alliance since must be >= 1882-05-20",
          path: ["alliances"],
        });
      }
    }
  });

// ── Types ───────────────────────────────────────────────────────────

export type TensionScale = z.infer<typeof TensionScaleSchema>;
export type Alliance = z.infer<typeof AllianceSchema>;
export type Guarantee = z.infer<typeof GuaranteeSchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type TreatyType = z.infer<typeof TreatyTypeSchema>;
export type TreatyStatus = z.infer<typeof TreatyStatusSchema>;
export type TreatyTerm = z.infer<typeof TreatyTermSchema>;
export type Treaty = z.infer<typeof TreatySchema>;
export type Incident = z.infer<typeof IncidentSchema>;
export type DiplomacyPack = z.infer<typeof DiplomacyPackSchema>;

// ── Helpers ─────────────────────────────────────────────────────────

export const getTension = (pack: DiplomacyPack, a: string, b: string): number | undefined =>
  pack.relations.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a))?.tension;

export const getTensionLevelFor = (
  pack: DiplomacyPack,
  a: string,
  b: string,
): TensionLevel | undefined => {
  const t = getTension(pack, a, b);
  return t === undefined ? undefined : getTensionLevel(t, pack.tensionScale);
};

export const isWarRisk = (pack: DiplomacyPack, tension: number): boolean =>
  tension >= pack.tensionScale.warRiskThreshold;

export const isCanalBlocked = (pack: DiplomacyPack, tension: number): boolean =>
  tension >= pack.tensionScale.canalBlockThreshold;

export const getAlliancesFor = (pack: DiplomacyPack, nation: string): Alliance[] =>
  pack.alliances.filter((a) => a.members.includes(nation));

export const getGuaranteesFor = (pack: DiplomacyPack, nation: string): Guarantee[] =>
  pack.guarantees.filter((g) => g.guarantor === nation || g.guaranteed === nation);

export const getRelationsFor = (pack: DiplomacyPack, nation: string): Relation[] =>
  pack.relations.filter((r) => r.a === nation || r.b === nation);

export const getRivals = (pack: DiplomacyPack, nation: string, threshold = 6): Relation[] =>
  getRelationsFor(pack, nation)
    .filter((r) => r.tension >= threshold)
    .sort((a, b) => b.tension - a.tension);

// ── 1880 Defaults ───────────────────────────────────────────────────

export const DEFAULT_TENSION_SCALE: TensionScale = {
  min: 0,
  max: 10,
  canalBlockThreshold: 7,
  warRiskThreshold: 9,
};

// Canonical 1880 tensions for seeding (use as reference, not enforced)
export const CANON_1880_TENSIONS: Array<Pick<Relation, "a" | "b" | "tension" | "note">> = [
  { a: "france", b: "germany", tension: 8, note: "Alsace-Lorraine, revanchism" },
  { a: "uk", b: "russia", tension: 7, note: "Great Game, Straits" },
  { a: "uk", b: "france", tension: 6, note: "Colonial rivalry, Egypt" },
  { a: "france", b: "italy", tension: 6, note: "Tunisia 1881 crisis brewing" },
  { a: "austria_hungary", b: "russia", tension: 7, note: "Balkans" },
  { a: "austria_hungary", b: "italy", tension: 5, note: "Irredentism, Adriatic" },
  { a: "japan", b: "qing", tension: 6, note: "Korea, Ryukyu" },
  { a: "spain", b: "usa", tension: 5, note: "Cuba, Caribbean" },
];

// ── Guardrails ──────────────────────────────────────────────────────

export const DIPLOMACY_GUARDRAILS = {
  tripleAlliance:
    "Triple Alliance inactive in Jan 1880 (signed 1882-05-20). Seed with since >= 1882-05-20",
  francoRussian: "Franco-Russian Alliance 1892 - must not exist in 1880",
  entente: "Entente Cordiale 1904 - must not exist in 1880",
  tension: "0-3 amicable, 4-6 rivalry, 7-8 crisis (canal may block), 9-10 war risk",
} as const;
