import { z } from "zod";

export const CoastalDefenseSchema = z.object({
  id: z.string(),
  possession: z.string(),
  nation: z.string(),
  type: z.string(),
  guns: z.array(z.string()),
  fortificationLevel: z.number(),
  mineSupport: z.boolean(),
});

export const CoastalDefensesPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  coastalDefenses: z.array(CoastalDefenseSchema),
});

export type CoastalDefense = z.infer<typeof CoastalDefenseSchema>;
export type CoastalDefensesPack = z.infer<typeof CoastalDefensesPackSchema>;
