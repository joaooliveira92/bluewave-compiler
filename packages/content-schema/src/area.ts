import { z } from "zod";

export const AreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["land", "sea", "coastal"]),
  controller: z.string().optional(),
});

export interface Area extends z.infer<typeof AreaSchema> {}
