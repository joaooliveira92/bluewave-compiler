// schema/aircraft.ts
// Aviation — NOT AVAILABLE IN 1880
// First powered flight 1903, first naval aircraft ~1910. For january_1880 this pack MUST be empty.
// This file exists only as a forward-compatible placeholder for later scenarios. Do not seed aircraft in 1880.
// Zod 4 compatible

import { z } from "zod";

export const AircraftTypeSchema = z.enum([
  "fighter",
  "bomber",
  "torpedo_bomber",
  "dive_bomber",
  "recon",
  "flying_boat",
  "airship",
]);

export const AircraftRoleSchema = z.enum([
  "air_superiority",
  "strike",
  "reconnaissance",
  "anti_submarine",
  "transport",
]);

export const AircraftSchema = z
  .object({
    id: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9_]+$/),
    name: z.string().min(2).max(64),
    type: AircraftTypeSchema,
    role: AircraftRoleSchema,
    // All performance in consistent units — document them
    speed: z.number().min(50).max(800).describe("Max speed in km/h"),
    range: z.number().min(50).max(8000).describe("Combat range in km"),
    toughness: z.number().min(1).max(10).describe("Abstract durability 1-10"),
    requires: z.array(z.string().min(2)).max(5).default([]).describe("FKs to technology ids"),
    year: z
      .number()
      .int()
      .min(1903)
      .max(1950)
      .describe("Service entry year — no aircraft before 1903"),
  })
  .strict();

export const ProvenanceSchema = z
  .object({
    source: z.string().min(3),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    approved: z.boolean().optional(),
    generatedAt: z.string().datetime().optional(),
  })
  .strict();

export const AircraftPackSchema = z
  .object({
    scenario: z.string().min(3).describe("Must match NationsPack.scenario"),
    continuityMode: z.enum(["historical", "alternate_continuity_v1"]),
    provenance: ProvenanceSchema,
    aircraft: z.array(AircraftSchema),
  })
  .strict()
  .superRefine((pack, ctx) => {
    // CANON LOCK: 1880 has no aircraft
    if (pack.scenario === "january_1880" && pack.aircraft.length > 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "Canon violation: No powered aircraft exist in January 1880. aircraft[] must be empty for january_1880. First flight is 1903.",
        path: ["aircraft"],
      });
    }
    const ids = pack.aircraft.map((a) => a.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: "custom",
        message: "Aircraft ids must be unique",
        path: ["aircraft"],
      });
    }
    for (const ac of pack.aircraft) {
      if (ac.year < 1903) {
        ctx.addIssue({
          code: "custom",
          message: `Aircraft ${ac.id} has year ${ac.year} — no aircraft before 1903`,
          path: ["aircraft"],
        });
        break;
      }
    }
  });

export type Aircraft = z.infer<typeof AircraftSchema>;
export type AircraftPack = z.infer<typeof AircraftPackSchema>;
