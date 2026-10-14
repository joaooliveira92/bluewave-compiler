import { Schema } from "effect";

import { ProvenanceSchema } from "./provenance.js";
import { SHIP_ZONE_IDS } from "./ship-component.js";

/**
 * Authored reference-design schema (CAH-SCH-1). Reference designs are compiled
 * into the ship-building catalogue's `referenceDesigns`; before this schema they
 * were only duplicate-id and cross-reference checked, so a structurally
 * malformed design could still compile. The shape mirrors the drawing board's
 * domain `DesignDraft` (packages/ship-design/src/compileShared.ts) without
 * importing it, keeping content-schema free of engine dependencies.
 */

/** Mirrors `ARMOUR_REGIONS` in `@bluewave/ship-design` (a test keeps the two lists identical). */
export const ARMOUR_REGION_IDS = [
  "BELT_MAIN",
  "BELT_UPPER",
  "BELT_ENDS",
  "DECK_MAIN",
  "DECK_SLOPE",
  "TURRET_FACE",
  "BARBETTE",
  "CONNING_TOWER",
  "MAGAZINE_BOX",
  "SPLINTER_PLATING",
  "TORPEDO_BULKHEAD",
  "TORPEDO_BELT",
] as const;

/** Mirrors `MountSide` in `@bluewave/ship-design` (a test keeps the two lists identical). */
export const MOUNT_SIDES = ["CENTRE", "PORT", "STBD"] as const;

/** Mirrors `AccommodationStandard` in `@bluewave/ship-design` (a test keeps the two lists identical). */
export const ACCOMMODATION_STANDARDS = ["SPARTAN", "STANDARD", "GENEROUS"] as const;

const month = Schema.String.check(
  Schema.isPattern(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "must be YYYY-MM" }),
);
const nonNegativeInt = Schema.Finite.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));
const positiveInt = Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0));
const bp = Schema.Finite.check(Schema.isInt(), Schema.isBetween({ minimum: 0, maximum: 10_000 }));

const ZoneIdSchema = Schema.Literals(SHIP_ZONE_IDS);

export const DesignRequirementSchema = Schema.Struct({
  category: Schema.NonEmptyString,
  requiredSpeedMilliKnots: nonNegativeInt,
  cruiseSpeedMilliKnots: nonNegativeInt,
  requiredRangeNm: nonNegativeInt,
  designThreatId: Schema.NonEmptyString,
  modernizationExpectation: Schema.Literals(["NONE", "MINOR", "MAJOR"]),
  crewQualityBp: bp,
  accommodationStandard: Schema.Literals(ACCOMMODATION_STANDARDS),
  protectionGoal: Schema.optional(Schema.Literals(["NONE", "STANDARD"])),
});

export const HullSpecSchema = Schema.Struct({
  hullFormId: Schema.NonEmptyString,
  lengthWl: positiveInt,
  beam: positiveInt,
  draught: positiveInt,
  depthToMainDeck: positiveInt,
  blockCoeffBp: bp,
  materialId: Schema.NonEmptyString,
  structuralSchemeId: Schema.NonEmptyString,
  subdivisionGrade: Schema.Finite.check(
    Schema.isInt(),
    Schema.isBetween({ minimum: 0, maximum: 4 }),
  ),
  targetDisplacementKg: positiveInt,
  limitDisplacementKg: Schema.NullOr(positiveInt),
  designMarginBp: bp,
  growthReserveBp: bp,
});

const MachineryRoomSchema = Schema.Struct({
  zoneId: ZoneIdSchema,
  stationPermille: bp,
  shareBp: bp,
});

const MachineryPlanSchema = Schema.Struct({
  plantId: Schema.NonEmptyString,
  installedKw: nonNegativeInt,
  zoneId: ZoneIdSchema,
  stationPermille: bp,
  fuelCapacityKg: nonNegativeInt,
  fuelZoneId: ZoneIdSchema,
  fuelStationPermille: bp,
  foulingBp: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(-10_000)),
  rooms: Schema.optional(Schema.Array(MachineryRoomSchema)),
});

const ArmourRegionSchema = Schema.Struct({
  region: Schema.Literals(ARMOUR_REGION_IDS),
  thicknessUm: positiveInt,
  lengthMm: positiveInt,
  heightMm: positiveInt,
  materialId: Schema.NonEmptyString,
  cosObliquityBp: bp,
});

const ArmourPlanSchema = Schema.Struct({
  regions: Schema.Array(ArmourRegionSchema),
  citadelLengthMm: nonNegativeInt,
  torpedoWarheadKg: nonNegativeInt,
  bunkerProtectionBp: bp,
});

const PlacementSpecSchema = Schema.Struct({
  instanceId: Schema.NonEmptyString,
  componentId: Schema.NonEmptyString,
  zoneId: ZoneIdSchema,
  stationPermille: bp,
  side: Schema.optional(Schema.Literals(MOUNT_SIDES)),
  params: Schema.optional(Schema.Record(Schema.String, Schema.Finite)),
  magazineRef: Schema.optional(Schema.NonEmptyString),
});

const DesignDraftSchema = Schema.Struct({
  nationId: Schema.NonEmptyString,
  requirement: DesignRequirementSchema,
  hull: HullSpecSchema,
  machinery: MachineryPlanSchema,
  armour: ArmourPlanSchema,
  placements: Schema.Array(PlacementSpecSchema),
});

export const ReferenceDesignSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  month,
  starterFor: Schema.optional(Schema.NonEmptyString),
  draft: DesignDraftSchema,
  provenance: Schema.optional(ProvenanceSchema),
});

export type ReferenceDesign = typeof ReferenceDesignSchema.Type;
export type DesignDraft = typeof DesignDraftSchema.Type;
