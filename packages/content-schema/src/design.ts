import { z } from "zod";

export const MainGunsSchema = z.object({
  caliber: z.number().int().min(1),
  count: z.number().int().min(1),
  mounts: z.number().int().min(1),
});

// DESIGN-40 §2 closed mount-type enum (mirrors @bluewave/combat TORPEDO_MOUNT_TYPES;
// content-schema stays dependency-free of the engine).
export const TORPEDO_MOUNT_TYPE_VALUES = [
  "ABOVE_WATER_FIXED",
  "ABOVE_WATER_TRAINABLE",
  "UNDERWATER_FIXED",
  "UNDERWATER_TRAINABLE",
  "SUBMARINE_INTERNAL",
] as const;

// P-1 AC-1: one entry per torpedo mount group on the design.
export const TorpedoMountSchema = z
  .object({
    mountType: z.enum(TORPEDO_MOUNT_TYPE_VALUES),
    tubeCount: z.number().int().min(1),
    torpedoModelId: z.string().min(1),
  })
  .strict();

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
  torpedoArmament: z.array(TorpedoMountSchema).min(1).optional(),
  designFamilyId: z.string().min(1).optional(),
  contentVersion: z.string().min(1).optional(),
});

export interface DesignTemplate extends z.infer<typeof DesignTemplateSchema> {}
