import { z } from "zod";

export const TechPrerequisiteSchema = z.object({
  techId: z.string().min(1),
});

export const TechnologyPrerequisiteChainSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  prerequisites: z.array(TechPrerequisiteSchema).optional(),
  cost: z.number().int().positive().optional(),
  year: z.number().int().min(1880).max(1970).optional(),
});

export interface TechnologyPrerequisite extends z.infer<typeof TechnologyPrerequisiteChainSchema> {}
