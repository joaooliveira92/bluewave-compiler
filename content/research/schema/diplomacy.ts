import { z } from "zod";

// ── Sub-objects ─────────────────────────────────────────────────────

export const TensionScaleSchema = z.object({
  min: z.literal(0),
  max: z.literal(10),
  canalBlockThreshold: z.number(),
  warRiskThreshold: z.number(),
});

export const AllianceTypeSchema = z.enum(["defensive", "offensive", "non_aggression"]);

export const AllianceSchema = z.object({
  id: z.string(),
  type: AllianceTypeSchema,
  members: z.array(z.string()),
  since: z.string(),
  provenance: z.string().optional(),
});

export const GuaranteeTypeSchema = z.enum(["neutrality", "independence", "territorial"]);

export const GuaranteeSchema = z.object({
  guarantor: z.string(),
  guaranteed: z.string(),
  type: GuaranteeTypeSchema,
  source: z.string().optional(),
  since: z.string().optional(),
});

export const RelationSchema = z.object({
  a: z.string(),
  b: z.string(),
  tension: z.number().min(0).max(10),
  trend: z.enum(["rising", "falling", "stable"]).default("stable").optional(),
  note: z.string().optional(),
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

export const TreatyTermSchema = z.object({
  type: z.string(),
  value: z.union([z.number(), z.string(), z.array(z.string())]),
  parties: z.array(z.string()).optional(),
  detail: z.string().optional(),
});

export const TreatySchema = z.object({
  id: z.string(),
  name: z.string(),
  signed: z.string(),
  signatories: z.array(z.string()),
  type: TreatyTypeSchema,
  status: TreatyStatusSchema,
  terms: z.array(TreatyTermSchema),
  supersededBy: z.string().optional(),
  source: z.string().optional(),
});

// ── Incident ──────────────────────────────────────────────────────────

export const IncidentSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  a: z.string(),
  b: z.string(),
  tensionChange: z.number(),
  resolved: z.boolean(),
  resolution: z.string().optional(),
  description: z.string().optional(),
});

// ── Pack envelope ───────────────────────────────────────────────────

export const DiplomacyPackSchema = z.object({
  scenario: z.string(),
  continuityMode: z.enum(["historical", "alternate_continuity_v1"]),
  provenance: z.string(),
  tensionScale: TensionScaleSchema,
  alliances: z.array(AllianceSchema),
  guarantees: z.array(GuaranteeSchema),
  relations: z.array(RelationSchema),
  treaties: z.array(TreatySchema),
  incidents: z.array(IncidentSchema),
});

// ── Inferred types ──────────────────────────────────────────────────

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
