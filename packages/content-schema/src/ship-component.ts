import { z } from "zod";

/** Mirrors `COMPONENT_CATEGORIES` in `@bluewave/ship-design` (a test keeps the two lists identical). */
export const SHIP_COMPONENT_CATEGORIES = [
  "HULL_FORM",
  "MATERIAL",
  "BOILER",
  "ENGINE",
  "SHAFT_PROPELLER",
  "FUEL_BUNKER",
  "GENERATOR",
  "MAIN_GUN",
  "SECONDARY_GUN",
  "DUAL_PURPOSE_GUN",
  "AA_WEAPON",
  "TORPEDO_TUBE",
  "MINE_GEAR",
  "AIRCRAFT_FACILITY",
  "MISSILE_LAUNCHER",
  "MOUNT",
  "MAGAZINE",
  "AMMUNITION",
  "ARMOUR_SCHEME",
  "UNDERWATER_PROTECTION",
  "DIRECTOR",
  "RANGEFINDER",
  "RADAR",
  "SONAR",
  "COMMS",
  "SPECIAL_EQUIPMENT",
  "DAMAGE_CONTROL",
  "ACCOMMODATION",
] as const;

export const SHIP_ZONE_IDS = [
  "FORECASTLE",
  "FWD_MAGAZINE",
  "FWD_SERVICE",
  "CENTRAL_MACHINERY",
  "SUPERSTRUCTURE",
  "AFT_SERVICE",
  "AFT_MAGAZINE",
  "QUARTERDECK",
  "MISSION",
] as const;

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "must be YYYY-MM");
const stableId = z.string().regex(/^[a-z][a-z0-9_]*$/, "must be lower snake_case");
const formula = z.string().min(1);

const ParameterRangeSchema = z
  .object({ min: z.number().int(), max: z.number().int(), step: z.number().int().min(1) })
  .strict()
  .refine((r) => r.min <= r.max, "min must be <= max");

/** One catalogue component (spec §6.1). Formulas use the restricted grammar parsed by `@bluewave/ship-design`. */
export const ShipComponentSchema = z
  .object({
    id: stableId,
    displayName: z.string().min(1),
    category: z.enum(SHIP_COMPONENT_CATEGORIES),
    introduction: z.object({ fromMonth: month, obsoleteMonth: month.nullable() }).strict(),
    requires: z.array(stableId),
    parameters: z.record(ParameterRangeSchema),
    constants: z.record(z.number().int()),
    weightKg: formula,
    volumeLitre: formula,
    costMicro: formula,
    crew: formula,
    powerKw: formula,
    upgradePath: z.array(stableId),
    tags: z.array(z.string().min(1)),
    deckFootprintMm2: formula.optional(),
    heightMm: formula.optional(),
    zCgMm: formula.optional(),
    coolingKw: formula.optional(),
    attributes: z.record(formula).optional(),
    allowedZones: z.array(z.enum(SHIP_ZONE_IDS)).optional(),
    forbidsCoLocation: z.array(z.enum(SHIP_COMPONENT_CATEGORIES)).optional(),
    critical: z.boolean().optional(),
    fcClass: z.string().min(1).optional(),
    fcClasses: z.array(z.string().min(1)).optional(),
    torpedoMount: z
      .object({ mountType: z.string().min(1), torpedoModelId: z.string().min(1) })
      .strict()
      .optional(),
    maintenanceMonthlyBp: z.number().int().min(0).optional(),
    buildWorkMicro: formula.optional(),
    productionLine: z.string().min(1).optional(),
  })
  .strict();

export const ShipComponentCatalogueSchema = z
  .object({ components: z.array(ShipComponentSchema) })
  .strict();

export const PropulsionPlantSchema = z
  .object({
    id: stableId,
    fuelType: z.enum(["COAL", "OIL", "MIXED"]),
    weightMilliKgPerKw: z.number().int().positive(),
    volumeLitrePerKw: z.number().int().positive(),
    sfcGramPerKwh: z
      .object({ points: z.array(z.tuple([z.number().int(), z.number().int()])).min(1) })
      .strict(),
    reliabilityBp: z.number().int().min(0).max(10_000),
    minKw: z.number().int().min(1),
    maxKw: z.number().int().min(1),
    introduction: z.object({ fromMonth: month, obsoleteMonth: month.nullable() }).strict(),
    requires: z.array(stableId),
  })
  .strict()
  .refine((p) => p.minKw <= p.maxKw, "minKw must be <= maxKw");

export const PropulsionPlantCatalogueSchema = z
  .object({ plants: z.array(PropulsionPlantSchema) })
  .strict();

export const ShipHullFormSchema = z
  .object({
    id: stableId,
    lengthMinMm: z.number().int().positive(),
    lengthMaxMm: z.number().int().positive(),
    lbMinX100: z.number().int().positive(),
    lbMaxX100: z.number().int().positive(),
    formBp: z.number().int().positive(),
    waterplaneCoeffBp: z.number().int().min(1).max(10_000),
    sheerBp: z.number().int().positive(),
    volumeFullnessBp: z.number().int().min(1).max(10_000),
    deckFullnessBp: z.number().int().min(1).max(10_000),
    lcbPermille: z.number().int().min(0).max(1000),
    zones: z
      .array(
        z
          .object({
            id: z.enum(SHIP_ZONE_IDS),
            startPermille: z.number().int().min(0).max(1000),
            endPermille: z.number().int().min(0).max(1000),
            volumeBp: z.number().int().min(0).max(10_000),
            deckAreaBp: z.number().int().min(0).max(10_000),
            buoyancyBp: z.number().int().min(0).max(10_000),
          })
          .strict(),
      )
      .length(9),
  })
  .strict()
  .refine((h) => h.lengthMinMm <= h.lengthMaxMm && h.lbMinX100 <= h.lbMaxX100, "min must be <= max")
  .refine(
    (h) => h.zones.reduce((a, z) => a + z.volumeBp, 0) === 10_000,
    "zone volumeBp must sum to 10000",
  )
  .refine(
    (h) => h.zones.reduce((a, z) => a + z.deckAreaBp, 0) === 10_000,
    "zone deckAreaBp must sum to 10000",
  )
  .refine(
    (h) => h.zones.reduce((a, z) => a + z.buoyancyBp, 0) === 10_000,
    "zone buoyancyBp must sum to 10000",
  );

export const ShipHullFormCatalogueSchema = z
  .object({ hullForms: z.array(ShipHullFormSchema) })
  .strict();

export type ShipComponentData = z.infer<typeof ShipComponentSchema>;
export type PropulsionPlantData = z.infer<typeof PropulsionPlantSchema>;
export type ShipHullFormData = z.infer<typeof ShipHullFormSchema>;
