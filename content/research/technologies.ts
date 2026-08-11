// technologies.ts - Technologies Phase - IMMUTABLE - January 1880
// No DB rows - qualitative tech tree for 1880 start
// Zod 4 compatible

import { z } from "zod";

// ── Fields ──────────────────────────────────────────────────────────
// Your old: hull_construction/machinery/ship_design/gunnery/fire_control/torpedoes/submarines/mines_and_asw/aviation/carrier_operations/radar_and_electronics/missiles/amphibious_operations/infrastructure/damage_control
// Problem: aviation (1903), carrier_operations (1922), radar (1935), missiles (1944) don't exist in 1880

export const TechnologyFieldSchema = z.enum([
  "hull_construction", // iron -> steel, compound armor
  "machinery", // compound -> triple expansion
  "ship_design", // central battery -> barbette -> turret
  "gunnery", // MLR -> BL, quick-firing
  "fire_control", // 1880: rudimentary, not director
  "torpedoes", // Whitehead, torpedo craft
  "mines_and_asw", // mines, early ASW
  "submarines", // experimental only in 1880
  "infrastructure", // coaling, docks, yards
  "damage_control", // subdivision, pumps
  // Future - in schema but blocked for 1880
  "aviation",
  "carrier_operations",
  "radar_and_electronics",
  "missiles",
  "amphibious_operations",
]);
export type TechnologyField = z.infer<typeof TechnologyFieldSchema>;

export const ALLOWED_1880_FIELDS: TechnologyField[] = [
  "hull_construction",
  "machinery",
  "ship_design",
  "gunnery",
  "fire_control",
  "torpedoes",
  "mines_and_asw",
  "submarines",
  "infrastructure",
  "damage_control",
];

export const TechnologyAdoptionTypeSchema = z.enum([
  "immediate_knowledge",
  "doctrine_requires_training",
  "equipment_requires_production",
  "minor_installation",
  "major_refit",
  "new_construction_only",
  "new_ammunition_production",
  "infrastructure",
]);
export type TechnologyAdoptionType = z.infer<typeof TechnologyAdoptionTypeSchema>;

// ── Technology ──────────────────────────────────────────────────────

export const TechnologySchema = z
  .object({
    id: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9_]+$/)
      .describe("e.g. steel_hulls_1885"),
    name: z.string().min(3).max(80),
    field: TechnologyFieldSchema,
    prerequisites: z
      .array(z.string().min(2).max(64))
      .max(5)
      .default([])
      .describe("FKs to other tech ids"),
    historicalAvailability: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Earliest historical date YYYY-MM-DD"),
    variationEligible: z.boolean().describe("Can have national variations"),
    researchCost: z.number().int().min(1).max(100).describe("Abstract 1-100, not currency"),
    effects: z
      .array(z.string().min(5).max(120))
      .min(1)
      .max(6)
      .describe("e.g. +10% hull strength, unlocks BB"),
    adoptionType: TechnologyAdoptionTypeSchema,
    aiValue: z.number().int().min(0).max(100).describe("AI priority 0-100"),
  })
  .strict()
  .superRefine((t, ctx) => {
    if (t.historicalAvailability < "1860-01-01") {
      ctx.addIssue({
        code: "custom",
        message: `Availability ${t.historicalAvailability} too early`,
        path: ["historicalAvailability"],
      });
    }
  });

export type Technology = z.infer<typeof TechnologySchema>;

// ── Pack ────────────────────────────────────────────────────────────

export const ProvenanceSchema = z
  .object({
    source: z.string().min(3),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    approved: z.boolean().optional(),
    generatedAt: z.string().datetime().optional(),
  })
  .strict();

export const TechnologiesPackSchema = z
  .object({
    scenario: z.string().min(3),
    continuityMode: z
      .enum(["historical", "alternate_continuity_v1"])
      .optional()
      .default("historical"),
    provenance: ProvenanceSchema,
    technologies: z.array(TechnologySchema).max(500),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const ids = pack.technologies.map((t) => t.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Duplicate technology id", path: ["technologies"] });
    }
    // Check prerequisites exist
    const idSet = new Set(ids);
    for (const t of pack.technologies) {
      for (const pre of t.prerequisites) {
        if (!idSet.has(pre)) {
          ctx.addIssue({
            code: "custom",
            message: `Tech ${t.id} prerequisite ${pre} not found`,
            path: ["technologies"],
          });
          break;
        }
      }
    }
    // 1880 lock
    if (pack.scenario === "january_1880") {
      for (const t of pack.technologies) {
        if (!ALLOWED_1880_FIELDS.includes(t.field)) {
          ctx.addIssue({
            code: "custom",
            message: `Anachronistic field ${t.field} for 1880: ${t.id} (aviation 1903, radar 1935, missiles 1944)`,
            path: ["technologies"],
          });
          break;
        }
        if (t.historicalAvailability < "1880-01-01" && t.historicalAvailability < "1860-01-01") {
          ctx.addIssue({
            code: "custom",
            message: `Tech ${t.id} availability too early for 1880 pack`,
            path: ["technologies"],
          });
          break;
        }
      }
    }
  });

export type TechnologiesPack = z.infer<typeof TechnologiesPackSchema>;

// ── Helpers ─────────────────────────────────────────────────────────

export const getTechByField = (pack: TechnologiesPack, field: TechnologyField): Technology[] =>
  pack.technologies.filter((t) => t.field === field);

export const getAvailableTechs = (pack: TechnologiesPack, date: string): Technology[] =>
  pack.technologies.filter((t) => t.historicalAvailability <= date);

export const getPrerequisitesFor = (pack: TechnologiesPack, techId: string): Technology[] => {
  const tech = pack.technologies.find((t) => t.id === techId);
  if (!tech) return [];
  return tech.prerequisites
    .map((id) => pack.technologies.find((t) => t.id === id)!)
    .filter(Boolean);
};

// ── Guardrails ──────────────────────────────────────────────────────

export const TECHNOLOGY_GUARDRAILS = {
  anachronism:
    "Jan 1880: No aviation/carrier_operations/radar_and_electronics/missiles. Aviation=1903, Radar=1935, Missiles=1944",
  availability:
    "historicalAvailability must be >=1860 and realistic - steel_hulls ~1885, triple_expansion ~1886, quick_firing ~1890",
  cost: "researchCost 1-100 abstract. 1880 core techs (steel, compound) should be 10-30, advanced (torpedoes) 40-60",
  adoption:
    "1880: Most hull/machinery = new_construction_only or major_refit, not immediate_knowledge",
} as const;
