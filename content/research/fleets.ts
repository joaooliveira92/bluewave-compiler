// fleets.ts - Phase 5 Fleet Rosters
// Historical OOB per scenario. Each scenario is a full snapshot.
// Schema updated per Phase 5 entity model decisions:
//   class → Phase 4 class ID, theater → Phase 2 area ID, homePort → Phase 3 port ID
//   builder → class-level only, keelLaid/sunkDate/strickenDate added
//   statuses expanded: lost, scrapped, sold added

import { z } from "zod";

// ── Nations ─────────────────────────────────────────────────────────

// Union of playable and AI nations from nations.ts (24 total for 1880).
// Additional nations for 1960+ scenarios may be added as needed.
export const FleetNationIdSchema = z.enum([
  // Playable (10)
  "uk",
  "germany",
  "usa",
  "japan",
  "france",
  "italy",
  "russia",
  "austria_hungary",
  "spain",
  "qing",
  // AI-only (14)
  "ottoman_empire",
  "egypt",
  "netherlands",
  "denmark",
  "sweden_norway",
  "portugal",
  "greece",
  "brazil",
  "chile",
  "argentina",
  "korea",
  "siam",
  "belgium",
  "persia",
]);
export type FleetNationId = z.infer<typeof FleetNationIdSchema>;

// ── Hull Types ──────────────────────────────────────────────────────

export const ShipHullTypeSchema = z.enum([
  "BB", // Pre-dreadnought / barbette / central battery battleship
  "B", // Older ironclad battleship
  "CA", // Armored cruiser
  "CL", // Protected / unprotected cruiser
  "MON", // Monitor / coastal defense ship - added
  "MTB", // 1st class torpedo boat
  "TB", // 2nd/3rd class torpedo boat
  "AV", // Aviso / dispatch vessel / sloop
  "GB", // Gunboat (colonial workhorse)
  "AMC", // Armed merchant cruiser
  "TR", // Transport / collier
  "SS", // Submarine (experimental only)
  // Future - in schema but blocked for 1880
  "DD",
  "BC",
  "CV",
  "CVL",
  "KE",
]);
export type ShipHullType = z.infer<typeof ShipHullTypeSchema>;

export const ALLOWED_1880_HULLS: ShipHullType[] = [
  "BB",
  "B",
  "CA",
  "CL",
  "MON",
  "MTB",
  "TB",
  "AV",
  "GB",
  "AMC",
  "TR",
  "KE",
];
export const COLONIAL_WORKHORSES: ShipHullType[] = ["CL", "GB", "AV", "TB"];

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
export type ShipStatus = z.infer<typeof ShipStatusSchema>;

// ── Ship ────────────────────────────────────────────────────────────

export const HistoricalShipSchema = z
  .object({
    id: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9_]+$/)
      .describe("e.g. uk_inflexible"),
    nation: FleetNationIdSchema,
    name: z.string().min(2).max(64),
    class: z.string().min(1).max(64).describe("Phase 4 class ID, e.g. uk_inflexible"),
    type: ShipHullTypeSchema,
    displacement: z.number().int().min(100).max(120000).describe("Full load tons"),
    speed: z.number().min(5).max(45).describe("Knots"),
    coalEndurance: z
      .number()
      .int()
      .min(0)
      .max(15000)
      .optional()
      .describe("nm @ 10kn - usable radius, critical for 1880"),
    armament: z
      .array(z.string().min(2).max(40))
      .min(1)
      .max(8)
      .describe("e.g. 4x 16in MLR, 6x 6in BL"),
    armor: z.string().min(2).max(80).describe("e.g. 24in compound belt, 3in deck"),
    machinery: z.string().min(2).max(80).describe("e.g. 2-shaft compound, 8000 ihp"),
    year: z.number().int().min(1860).max(1980).describe("Completion year"),
    status: ShipStatusSchema,
    theater: z.string().max(32).optional().describe("Phase 2 area ID, e.g. area_mediterranean"),
    homePort: z.string().max(32).optional().describe("Phase 3 port ID, e.g. port_portsmouth"),
    keelLaid: z.number().int().min(1800).max(1980).optional().describe("Keel laying year"),
    sunkDate: z.number().int().optional().describe("Year sunk"),
    strickenDate: z.number().int().optional().describe("Year stricken"),
    note: z.string().max(120).optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.displacement < 400 && ["BB", "B", "CA"].includes(s.type)) {
      ctx.addIssue({
        code: "custom",
        message: `${s.type} ${s.displacement}t too small`,
        path: ["displacement"],
      });
    }
    if (s.speed > 19 && s.year <= 1885) {
      ctx.addIssue({
        code: "custom",
        message: `Speed ${s.speed}kn unrealistic for ${s.year} (max ~18kn in 1880)`,
        path: ["speed"],
      });
    }
    if (
      s.coalEndurance !== undefined &&
      s.coalEndurance < 1000 &&
      ["BB", "CA", "CL"].includes(s.type) &&
      s.status === "active"
    ) {
      ctx.addIssue({
        code: "custom",
        message: `Active ${s.type} needs coalEndurance >=1000nm`,
        path: ["coalEndurance"],
      });
    }
  });

export type HistoricalShip = z.infer<typeof HistoricalShipSchema>;

// ── Pack ────────────────────────────────────────────────────────────

export const ProvenanceSchema = z
  .string()
  .min(3)
  .describe("Source identifier, e.g. CANONICAL_CONTENT, RESEARCH_2024");

export const FleetsPackSchema = z
  .object({
    scenario: z.string().min(3),
    provenance: ProvenanceSchema,
    fleets: z.array(HistoricalShipSchema).max(2000),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const ids = pack.fleets.map((f) => f.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Duplicate ship id", path: ["fleets"] });
    }
    const names = pack.fleets.map((f) => `${f.nation}:${f.name.toLowerCase()}`);
    if (new Set(names).size !== names.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate ship name within nation",
        path: ["fleets"],
      });
    }
    if (pack.scenario === "scen_1880") {
      for (const s of pack.fleets) {
        if (!ALLOWED_1880_HULLS.includes(s.type)) {
          ctx.addIssue({
            code: "custom",
            message: `Anachronistic ${s.type} for 1880: ${s.id} (DD 1893, BC 1908, CV 1922)`,
            path: ["fleets"],
          });
          break;
        }
        if (s.year > 1880 && !["building", "fitting_out", "ordered"].includes(s.status)) {
          ctx.addIssue({
            code: "custom",
            message: `${s.id} year ${s.year} >1880 must be building/fitting_out/ordered, got ${s.status}`,
            path: ["fleets"],
          });
          break;
        }
      }
    }
  });

export type FleetsPack = z.infer<typeof FleetsPackSchema>;

// ── Helpers ─────────────────────────────────────────────────────────

export const getFleetsForNation = (pack: FleetsPack, nation: FleetNationId): HistoricalShip[] =>
  pack.fleets.filter((s) => s.nation === nation);

export const getActiveFleets = (pack: FleetsPack): HistoricalShip[] =>
  pack.fleets.filter((s) => s.status === "active");

export const getByTheater = (pack: FleetsPack, theater: string): HistoricalShip[] =>
  pack.fleets.filter((s) => s.theater === theater);

export const getColonialFleets = (pack: FleetsPack): HistoricalShip[] =>
  pack.fleets.filter((s) => COLONIAL_WORKHORSES.includes(s.type));

export const countByType = (pack: FleetsPack, type: ShipHullType): number =>
  pack.fleets.filter((s) => s.type === type).length;

export const countByNationAndType = (
  pack: FleetsPack,
  nation: FleetNationId,
  type: ShipHullType,
): number => pack.fleets.filter((s) => s.nation === nation && s.type === type).length;

// ── Guardrails ──────────────────────────────────────────────────────

export const FLEETS_GUARDRAILS = {
  anachronism:
    "scen_1880: No DD/BC/CV/CVL operational. DD=Havock 1893, BC=Invincible 1908, CV=Hosho 1922, SS=Holland 1900",
  speed: "1880 BB 14-16kn, CA/CL 15-18kn. >19kn is 1890s triple-expansion",
  coal: "1880 fleets are coal-limited. Always set coalEndurance - BB/CA/CL active without it is invalid",
  colonial:
    "Colonial workhorses are CL/GB/AV/TB, not BB. UK needs 30+ of these for empire, not just battleships",
  year: "For scen_1880, year>1880 only if status=building/fitting_out/ordered",
  schema:
    "class → Phase 4 class ID, theater → Phase 2 area ID, homePort → Phase 3 port ID. builder is class-level only.",
} as const;
