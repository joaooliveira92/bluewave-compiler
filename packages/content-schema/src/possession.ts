import { z } from "zod";

export const PossessionSchema = z.object({
  id: z.string().min(1),
  nationId: z.string().min(1),
  areaId: z.string().min(1),
  since: z.string().optional(),
});

export interface Possession extends z.infer<typeof PossessionSchema> {}
