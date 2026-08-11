import { z } from "zod";

export const MainGunsSchema = z.object({
  caliber: z.number().int().min(1),
  count: z.number().int().min(1),
  mounts: z.number().int().min(1),
});

export const DesignTemplateSchema = z.object({
  designId: z.string().min(1),
  nationId: z.string().min(1),
  className: z.string().min(1),
  hullType: z.string().min(1),
  displacementKg: z.number().int().positive(),
  speedUms: z.number().min(1),
  armorBeltUm: z.number().min(1),
  mainGuns: MainGunsSchema,
  machineryType: z.string().min(1),
  hitPoints: z.number().int().positive(),
  crewComplement: z.number().int().positive(),
  designFamilyId: z.string().min(1).optional(),
  contentVersion: z.string().min(1).optional(),
});

export interface DesignTemplate extends z.infer<typeof DesignTemplateSchema> {}