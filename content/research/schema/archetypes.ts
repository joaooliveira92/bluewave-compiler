import { z } from "zod";

export const ArchetypeAllocationSchema = z.object({
  strategy: z.number(),
  engineering: z.number(),
  administration: z.number(),
  politics: z.number(),
  command: z.number(),
  intelligence: z.number(),
});

export const ArchetypePresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  allocation: ArchetypeAllocationSchema,
});

export const ArchetypesPackSchema = z.object({
  default: ArchetypeAllocationSchema,
  presets: z.array(ArchetypePresetSchema),
});

export type ArchetypeAllocation = z.infer<typeof ArchetypeAllocationSchema>;
export type ArchetypePreset = z.infer<typeof ArchetypePresetSchema>;
export type ArchetypesPack = z.infer<typeof ArchetypesPackSchema>;
