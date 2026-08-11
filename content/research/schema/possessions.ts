import { z } from "zod";

// ── Sub-objects ─────────────────────────────────────────────────────

export const BaseInfrastructureSchema = z.object({
  portCapacity: z.number(),
  coastalDefenses: z.number().optional(),
});

export const PossessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  area: z.string(),
  legalOwner: z.string(),
  militaryController: z.string(),
  coordinates: z.tuple([z.number(), z.number()]),
  portCoordinates: z.tuple([z.number(), z.number()]),
  economicValue: z.number(),
  peaceValue: z.number(),
  baseInfrastructure: BaseInfrastructureSchema,
  oilResources: z.number(),
  localUnrest: z.number(),
});

// ── Pack envelope ───────────────────────────────────────────────────

export const PossessionsPackSchema = z.object({
  scenario: z.string(),
  continuityMode: z.enum(["historical", "alternate_continuity_v1"]),
  provenance: z.string(),
  possessions: z.array(PossessionSchema),
});

// ── Inferred types ──────────────────────────────────────────────────

export type BaseInfrastructure = z.infer<typeof BaseInfrastructureSchema>;
export type Possession = z.infer<typeof PossessionSchema>;
export type PossessionsPack = z.infer<typeof PossessionsPackSchema>;
