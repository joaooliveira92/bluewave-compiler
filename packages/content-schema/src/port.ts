import { z } from "zod";

export const PortSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  areaId: z.string().min(1),
  nationId: z.string().min(1),
  level: z.number().int().min(1).max(10).optional(),
});

export interface Port extends z.infer<typeof PortSchema> {}
