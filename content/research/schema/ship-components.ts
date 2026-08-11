import { z } from "zod";

// ── Enums ───────────────────────────────────────────────────────────

export const ShipComponentTypeSchema = z.enum([
  "hull",
  "machinery",
  "armor",
  "armament",
  "torpedo",
  "torpedo_tube",
]);

// ── ShipComponent entity ────────────────────────────────────────────

export const ShipComponentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ShipComponentTypeSchema,
  displacement: z.number().optional(),
  weight: z.number(),
  cost: z.number(),
  power: z.number().optional(),
  thickness: z.number().optional(),
  caliber: z.number().optional(),
  tubes: z.number().optional(),
  protection: z.number().optional(),
  range: z.number().optional(),
  rof: z.number().optional(),
  speed: z.number().optional(),
  speedBonus: z.number().optional(),
  requires: z.array(z.string()),
  enablesType: z.array(z.string()).optional(),
});

// ── Pack envelope ───────────────────────────────────────────────────

export const ShipComponentsPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  components: z.array(ShipComponentSchema),
});

// ── Inferred types ──────────────────────────────────────────────────

export type ShipComponentType = z.infer<typeof ShipComponentTypeSchema>;
export type ShipComponent = z.infer<typeof ShipComponentSchema>;
export type ShipComponentsPack = z.infer<typeof ShipComponentsPackSchema>;
