import { z } from "zod";

// ── Enums ───────────────────────────────────────────────────────────

export const ShipHullTypeSchema = z.enum([
  "DD",
  "CL",
  "CA",
  "B",
  "BB",
  "BC",
  "CV",
  "CVL",
  "AV",
  "SS",
  "KE",
  "AMC",
  "TR",
  "MTB",
  "MON",
  "GB",
  "TB",
]);

export const ShipStatusSchema = z.enum([
  "active",
  "reserve",
  "mothballed",
  "building",
  "fitting_out",
  "ordered",
  "lost",
  "scrapped",
  "sold",
]);

// ── HistoricalShip entity ───────────────────────────────────────────

export const HistoricalShipSchema = z.object({
  id: z.string(),
  nation: z.string(),
  name: z.string(),
  class: z.string(),
  type: ShipHullTypeSchema,
  displacement: z.number(),
  speed: z.number(),
  armament: z.array(z.string()),
  armor: z.string(),
  machinery: z.string(),
  year: z.number(),
  status: ShipStatusSchema,
  theater: z.string().optional(),
  homePort: z.string().optional(),
  keelLaid: z.number().optional(),
  sunkDate: z.number().optional(),
  strickenDate: z.number().optional(),
  note: z.string().optional(),
});

// ── Pack envelope ───────────────────────────────────────────────────

export const FleetsPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  fleets: z.array(HistoricalShipSchema),
});

// ── Inferred types ──────────────────────────────────────────────────

export type ShipHullType = z.infer<typeof ShipHullTypeSchema>;
export type ShipStatus = z.infer<typeof ShipStatusSchema>;
export type HistoricalShip = z.infer<typeof HistoricalShipSchema>;
export type FleetsPack = z.infer<typeof FleetsPackSchema>;
