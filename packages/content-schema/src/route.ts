import { z } from "zod";

export const RouteEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  type: z.enum(["land", "sea", "rail"]),
  distance: z.number().int().positive(),
});

export interface RouteEdge extends z.infer<typeof RouteEdgeSchema> {}
