// packages/combat/src/air-defense/air-defense-system-definition.ts
// D-4 M4 Aviation: Air Defense — AirDefenseSystemDefinition interface
// per DESIGN-45 §3. Strict Zod validation at construction boundaries, fail-closed guards.

import { z } from "zod";
import { AIR_DEFENSE_MODEL_VERSION, INVALID_AIR_DEFENSE_SYSTEM_DEFINITION } from "./constants.js";
import { BluewaveError, SafeInt } from "@bluewave/contracts";

export const AIR_DEFENSE_RULESET_VERSION = "air_defense_v1" as const;

// ---- Layer and category literals ----

export const Layer = {
  HEAVY_AA: "HEAVY_AA" as const,
  MEDIUM_AA: "MEDIUM_AA" as const,
  LIGHT_AA: "LIGHT_AA" as const,
  CIWS_TERMINAL_DEFENSE: "CIWS_TERMINAL_DEFENSE" as const,
} as const;

export type LayerId = (typeof Layer)[keyof typeof Layer];

export const Category = {
  HEAVY_AA: "HEAVY_AA" as const,
  MEDIUM_AA: "MEDIUM_AA" as const,
  LIGHT_AA: "LIGHT_AA" as const,
  CIWS_TERMINAL_DEFENSE: "CIWS_TERMINAL_DEFENSE" as const,
} as const;

export type CategoryId = (typeof Category)[keyof typeof Category];

// ---- Zod literal types for strict validation ----

const LayerLiteral = z.enum([
  "HEAVY_AA",
  "MEDIUM_AA",
  "LIGHT_AA",
  "CIWS_TERMINAL_DEFENSE",
] as const);
const CategoryLiteral = z.enum([
  "HEAVY_AA",
  "MEDIUM_AA",
  "LIGHT_AA",
  "CIWS_TERMINAL_DEFENSE",
] as const);

// Standard SafeInt schema: accept a number (or SafeInt), validate integer + safe range.
function safeIntSchema(
  message: string,
  opts?: { min?: number; max?: number; nonNegative?: boolean; positive?: boolean },
): z.ZodType<SafeInt> {
  if (opts?.positive) {
    return z.custom<SafeInt>(
      (val) => typeof val === "number" && SafeInt.isSafeInt(val) && val > 0,
      { message },
    );
  }
  if (opts?.nonNegative) {
    return z.custom<SafeInt>(
      (val) => typeof val === "number" && SafeInt.isSafeInt(val) && val >= 0,
      { message },
    );
  }
  if (opts?.min !== undefined || opts?.max !== undefined) {
    return z.custom<SafeInt>(
      (val) => {
        if (typeof val !== "number" || !SafeInt.isSafeInt(val)) return false;
        return val >= (opts?.min ?? -Infinity) && val <= (opts?.max ?? Infinity);
      },
      { message },
    );
  }
  return z.custom<SafeInt>((val) => typeof val === "number" && SafeInt.isSafeInt(val), { message });
}

// ---- AirDefenseSystemDefinition interface ----

export interface AirDefenseSystemDefinition {
  systemId: string;
  layer: LayerId;
  category: CategoryId;
  mountCount: SafeInt; // non-negative integer
  barrels: SafeInt; // positive integer
  rangeMinM: SafeInt;
  rangeMaxM: SafeInt; // positive integer
  altitudeMinM: SafeInt;
  altitudeMaxM: SafeInt;
  targetSpeedLimitMps: SafeInt;
  arcDegreesMax: SafeInt; // 0-360 degrees; maximum angular offset (bearing) the mount can engage
  profileEligibility: ReadonlySet<string>;
  fireControl: {
    trackingRangeM: SafeInt;
    maxElevationDegrees: SafeInt; // 0-90 degrees
    updateRateHz: SafeInt;
  };
  radar: {
    frequencyBand: "S" | "X" | "K" | "Ka";
    peakPowerW: SafeInt;
    maxRangeM: SafeInt;
    resolutionDegrees: SafeInt;
  };
  engagementChannels: ReadonlySet<string>;
  baseKillBp: SafeInt;
  baseDamageBp: SafeInt;
  baseAbortBp: SafeInt;
  baseDisruptionBp: SafeInt;
  rate: SafeInt; // rounds per minute / engagement rate
  roundsPerEngagement: SafeInt; // §20 "rounds or missiles per engagement" (positive)
  magazineCapacity: SafeInt; // §20 "magazine or ready-service capacity" (positive)
  localControlSupported: boolean; // §21: system may use local control (5_000 bp) when its director is unavailable
  saturationGroup: SafeInt; // group ID for saturation calculations
  contentVersion: string;
  contentHash: string;
}

// ---- Zod schema for AirDefenseSystemDefinition ----

const AirDefenseSystemDefinitionSchema = z
  .object({
    systemId: z.string().min(1, "systemId must be a non-empty string"),

    layer: LayerLiteral,

    category: CategoryLiteral,

    mountCount: safeIntSchema("mountCount must be a non-negative integer", { nonNegative: true }),

    barrels: safeIntSchema("barrels must be a positive integer", { positive: true }),

    rangeMinM: safeIntSchema("rangeMinM must be a non-negative integer", { nonNegative: true }),

    rangeMaxM: safeIntSchema("rangeMaxM must be a positive integer", { positive: true }),

    altitudeMinM: safeIntSchema("altitudeMinM must be a non-negative integer", {
      nonNegative: true,
    }),

    altitudeMaxM: safeIntSchema("altitudeMaxM must be a non-negative integer", {
      nonNegative: true,
    }),

    targetSpeedLimitMps: safeIntSchema("targetSpeedLimitMps must be a non-negative integer", {
      nonNegative: true,
    }),

    arcDegreesMax: safeIntSchema("arcDegreesMax must be 0-360", { min: 0, max: 360 }),

    profileEligibility: z
      .set(z.string())
      .transform((set) => new Set(set) as ReadonlySet<string>)
      .refine((set) => set.size > 0, {
        message: "profileEligibility must not be empty",
      }),

    fireControl: z
      .object({
        trackingRangeM: safeIntSchema("trackingRangeM must be a non-negative integer", {
          nonNegative: true,
        }),
        maxElevationDegrees: safeIntSchema("maxElevationDegrees must be 0-90", {
          min: 0,
          max: 90,
        }),
        updateRateHz: safeIntSchema("updateRateHz must be a positive integer", { positive: true }),
      })
      .strict(),

    radar: z
      .object({
        frequencyBand: z.enum(["S", "X", "K", "Ka"] as const),
        peakPowerW: safeIntSchema("peakPowerW must be a non-negative integer", {
          nonNegative: true,
        }),
        maxRangeM: safeIntSchema("maxRangeM must be a positive integer", { positive: true }),
        resolutionDegrees: safeIntSchema("resolutionDegrees must be a positive integer", {
          positive: true,
        }),
      })
      .strict(),

    engagementChannels: z
      .set(z.string())
      .transform((set) => new Set(set) as ReadonlySet<string>)
      .refine((set) => set.size > 0, {
        message: "engagementChannels must not be empty",
      }),

    baseKillBp: safeIntSchema("baseKillBp must be a non-negative integer", {
      nonNegative: true,
    }).optional(),
    baseDamageBp: safeIntSchema("baseDamageBp must be a non-negative integer", {
      nonNegative: true,
    }).optional(),
    baseAbortBp: safeIntSchema("baseAbortBp must be a non-negative integer", {
      nonNegative: true,
    }).optional(),
    baseDisruptionBp: safeIntSchema("baseDisruptionBp must be a non-negative integer", {
      nonNegative: true,
    }).optional(),
    rate: safeIntSchema("rate must be a positive integer", { positive: true }).optional(),
    roundsPerEngagement: safeIntSchema("roundsPerEngagement must be a positive integer", {
      positive: true,
    }).optional(),
    magazineCapacity: safeIntSchema("magazineCapacity must be a positive integer", {
      positive: true,
    }).optional(),
    localControlSupported: z.boolean().optional(),
    saturationGroup: safeIntSchema("saturationGroup must be a non-negative integer", {
      nonNegative: true,
    }).optional(),

    contentVersion: z.string().min(1, "contentVersion must be a non-empty string"),

    contentHash: z.string().length(64, "contentHash must be a 64-character SHA-256 hex string"),
  })
  .strict();

// ---- fail-closed guard: rejects unknown fields ----

export function validateAirDefenseSystemDefinition(value: unknown): AirDefenseSystemDefinition {
  const result = AirDefenseSystemDefinitionSchema.safeParse(value);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    throw new BluewaveError(
      `AirDefenseSystemDefinition validation failed: ${JSON.stringify(errors, null, 2)}`,
      { code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION, errors },
    );
  }
  return result.data as AirDefenseSystemDefinition;
}

// ---- createAirDefenseSystemDefinition ----

export function createAirDefenseSystemDefinition(
  params: Partial<AirDefenseSystemDefinition>,
): AirDefenseSystemDefinition {
  // First, validate that the input does not contain unknown fields.
  // This is the "fail-closed" guarantee for the Partial<...> input.
  // We strip optionality (all fields become required) for this check,
  // and we keep the partial schema identical to the strict one.
  const inputCheck = AirDefenseSystemDefinitionSchema.partial().safeParse(params);
  if (!inputCheck.success) {
    // Partial schema permits missing fields, so any failure here is from
    // invalid values, not from missing fields. Re-throw as validation error.
    const errors = inputCheck.error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    throw new BluewaveError(
      `AirDefenseSystemDefinition validation failed: ${JSON.stringify(errors, null, 2)}`,
      { code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION, errors },
    );
  }

  // Detect unknown fields by re-parsing the original key set
  // against the strict (non-partial) schema via Object.keys comparison.
  const knownKeys = new Set(Object.keys(AirDefenseSystemDefinitionSchema.shape));
  for (const key of Object.keys(params)) {
    if (!knownKeys.has(key)) {
      throw new BluewaveError(
        `AirDefenseSystemDefinition validation failed: unknown field "${key}"`,
        { code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION, field: key },
      );
    }
  }

  const merged = {
    systemId: params.systemId ?? "",
    layer: params.layer ?? Layer.HEAVY_AA,
    category: params.category ?? Category.HEAVY_AA,
    mountCount: params.mountCount ?? SafeInt.ZERO,
    barrels: params.barrels ?? SafeInt(1),
    rangeMinM: params.rangeMinM ?? SafeInt.ZERO,
    rangeMaxM: params.rangeMaxM ?? SafeInt(10_000),
    altitudeMinM: params.altitudeMinM ?? SafeInt.ZERO,
    altitudeMaxM: params.altitudeMaxM ?? SafeInt(30_000),
    targetSpeedLimitMps: params.targetSpeedLimitMps ?? SafeInt(500),
    arcDegreesMax: params.arcDegreesMax ?? SafeInt(360),
    profileEligibility: params.profileEligibility ?? new Set(["DEFAULT"]),
    fireControl: params.fireControl ?? {
      trackingRangeM: SafeInt(10_000),
      maxElevationDegrees: SafeInt(85),
      updateRateHz: SafeInt(10),
    },
    radar: params.radar ?? {
      frequencyBand: "S",
      peakPowerW: SafeInt(1_000),
      maxRangeM: SafeInt(50_000),
      resolutionDegrees: SafeInt(1),
    },
    engagementChannels: params.engagementChannels ?? new Set(["default"]),
    baseKillBp: params.baseKillBp ?? SafeInt(100),
    baseDamageBp: params.baseDamageBp ?? SafeInt(50),
    baseAbortBp: params.baseAbortBp ?? SafeInt(30),
    baseDisruptionBp: params.baseDisruptionBp ?? SafeInt(15),
    rate: params.rate ?? SafeInt(100),
    roundsPerEngagement: params.roundsPerEngagement ?? SafeInt.ONE,
    magazineCapacity: params.magazineCapacity ?? SafeInt(1_000),
    localControlSupported: params.localControlSupported ?? false,
    saturationGroup: params.saturationGroup ?? SafeInt.ZERO,
    contentVersion: params.contentVersion ?? AIR_DEFENSE_MODEL_VERSION,
    contentHash:
      params.contentHash ?? "0000000000000000000000000000000000000000000000000000000000000000",
  };

  // Validate the merged result with the strict schema
  // Cast through `unknown` since Zod infers `number` from z.number()
  return validateAirDefenseSystemDefinition(merged as unknown as AirDefenseSystemDefinition);
}

// ---- isValidLayer ----

export function isValidLayer(layer: string): layer is LayerId {
  return ["HEAVY_AA", "MEDIUM_AA", "LIGHT_AA", "CIWS_TERMINAL_DEFENSE"].includes(layer);
}

// ---- isValidCategory ----

export function isValidCategory(category: string): category is CategoryId {
  return ["HEAVY_AA", "MEDIUM_AA", "LIGHT_AA", "CIWS_TERMINAL_DEFENSE"].includes(category);
}
