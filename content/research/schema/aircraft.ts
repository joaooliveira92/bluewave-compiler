import { z } from "zod";

export const AircraftSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  role: z.string(),
  speed: z.number(),
  range: z.number(),
  toughness: z.number(),
  requires: z.array(z.string()),
  year: z.number(),
});

export const AircraftPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  aircraft: z.array(AircraftSchema),
});

export type Aircraft = z.infer<typeof AircraftSchema>;
export type AircraftPack = z.infer<typeof AircraftPackSchema>;
