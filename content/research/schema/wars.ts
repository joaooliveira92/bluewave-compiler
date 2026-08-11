import { z } from "zod";

export const WarSideSchema = z.object({
  id: z.string(),
  members: z.array(z.string()),
  warGoals: z.array(z.string()),
});

export const WarSchema = z.object({
  id: z.string(),
  name: z.string(),
  sides: z.array(WarSideSchema),
  startDate: z.string(),
  endDate: z.union([z.string(), z.null()]).optional(),
  status: z.string(),
  warScore: z.record(z.string(), z.number()),
});

export const WarsPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  wars: z.array(WarSchema),
});

export type War = z.infer<typeof WarSchema>;
export type WarsPack = z.infer<typeof WarsPackSchema>;
