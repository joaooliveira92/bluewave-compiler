import { z } from "zod";

// ── Enums ───────────────────────────────────────────────────────────

export const TechnologyFieldSchema = z.enum([
  "hull_construction",
  "machinery",
  "ship_design",
  "gunnery",
  "fire_control",
  "torpedoes",
  "submarines",
  "mines_and_asw",
  "aviation",
  "carrier_operations",
  "radar_and_electronics",
  "missiles",
  "amphibious_operations",
  "infrastructure",
  "damage_control",
]);

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

// ── Technology entity ───────────────────────────────────────────────

export const TechnologySchema = z.object({
  id: z.string(),
  name: z.string(),
  field: TechnologyFieldSchema,
  prerequisites: z.array(z.string()),
  historicalAvailability: z.string(),
  variationEligible: z.boolean(),
  researchCost: z.number(),
  effects: z.array(z.string()),
  adoptionType: TechnologyAdoptionTypeSchema,
  aiValue: z.number(),
});

// ── Pack envelope ───────────────────────────────────────────────────

export const TechnologiesPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  technologies: z.array(TechnologySchema),
});

// ── Inferred types ──────────────────────────────────────────────────

export type TechnologyField = z.infer<typeof TechnologyFieldSchema>;
export type TechnologyAdoptionType = z.infer<typeof TechnologyAdoptionTypeSchema>;
export type Technology = z.infer<typeof TechnologySchema>;
export type TechnologiesPack = z.infer<typeof TechnologiesPackSchema>;
