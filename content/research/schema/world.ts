import { z } from "zod";

// ── Area ────────────────────────────────────────────────────────────

export const AreaTypeSchema = z.enum(["home_area", "sea_zone", "choke_point", "canal_zone"]);

export const ClimateSchema = z.enum(["temperate", "mediterranean", "arid", "tropical"]);

export const AreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AreaTypeSchema,
  climate: ClimateSchema,
  adjacency: z.array(z.string()),
});

export const WorldAreasPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  areas: z.array(AreaSchema),
});

// ── Port ────────────────────────────────────────────────────────────

export const PortSchema = z.object({
  id: z.string(),
  name: z.string(),
  area: z.string(),
  nation: z.string(),
  coordinates: z.tuple([z.number(), z.number()]),
  portCapacity: z.number(),
  dockSize: z.number(),
  isHomePort: z.boolean(),
});

// ── Canal ───────────────────────────────────────────────────────────

export const CanalOperatingConditionSchema = z.enum(["operational", "closed", "damaged"]);

export const CanalAccessPolicySchema = z.enum(["open", "closed", "restricted"]);

export const CanalSchema = z.object({
  id: z.string(),
  name: z.string(),
  area: z.string(),
  legalOwner: z.string(),
  militaryController: z.string(),
  operatingCondition: CanalOperatingConditionSchema,
  openSince: z.union([z.string(), z.null()]).optional(),
  scheduledOpen: z.union([z.string(), z.null()]).optional(),
  accessPolicy: CanalAccessPolicySchema,
  tensionBlockThreshold: z.number().optional(),
});

export const PortsCanalsPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  ports: z.array(PortSchema),
  canals: z.array(CanalSchema),
});

// ── Inferred types ──────────────────────────────────────────────────

export type AreaType = z.infer<typeof AreaTypeSchema>;
export type Climate = z.infer<typeof ClimateSchema>;
export type Area = z.infer<typeof AreaSchema>;
export type WorldAreasPack = z.infer<typeof WorldAreasPackSchema>;
export type Port = z.infer<typeof PortSchema>;
export type CanalOperatingCondition = z.infer<typeof CanalOperatingConditionSchema>;
export type CanalAccessPolicy = z.infer<typeof CanalAccessPolicySchema>;
export type Canal = z.infer<typeof CanalSchema>;
export type PortsCanalsPack = z.infer<typeof PortsCanalsPackSchema>;
