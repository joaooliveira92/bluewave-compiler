//packages/combat/src/aircraft/contracts.ts
// DESIGN-43 §2 AircraftModelDefinition_v1 Zod contract + fail-closed guard.
// INC-1 ships the model-definition contract that the §2 boundary exercises.
// Mirrors packages/combat/src/submarines/contracts.ts pattern.
import { z } from "zod";
import { BluewaveError, SafeInt } from "@bluewave/contracts";
import {
  AIRCRAFT_BASING_CLASSES,
  AIRCRAFT_TYPES,
  AIRCRAFT_SCORE_MIN,
  AIRCRAFT_SCORE_MAX,
} from "./constants.js";
import {
  INVALID_AIRCRAFT_MODEL_DEFINITION,
} from "./reasonCodes.js";

const safeIntSchema = z.custom<SafeInt>(
  (v) => SafeInt.isSafeInt(v as number),
  { message: "must be a SafeInt" },
);

const scoreSchema = safeIntSchema.refine(
  (v) => Number(v) >= AIRCRAFT_SCORE_MIN && Number(v) <= AIRCRAFT_SCORE_MAX,
  { message: `score must be ${AIRCRAFT_SCORE_MIN}..${AIRCRAFT_SCORE_MAX}` },
);

export const AircraftModelDefinition_v1 = z.object({
  aircraftModelId: z.string().min(1),
  aircraftType: z.enum(AIRCRAFT_TYPES),
  ownerOrLicenseHolder: z.string().min(1),
  introductionMonth: z.string().min(1),
  speed: scoreSchema,
  firepower: scoreSchema,
  maneuverability: scoreSchema,
  toughness: scoreSchema,
  payloadCapacity: safeIntSchema,
  rangeClass: z.string().min(1),
  rangeDistance: safeIntSchema,
  eligibleRoleIds: z.array(z.string().min(1)).min(1),
  basingRequirementId: z.enum(AIRCRAFT_BASING_CLASSES),
  carrierSuitable: z.boolean(),
  deckRequirement: z.string().optional(),
  catapultRequirement: z.string().optional(),
  technologyPrerequisiteIds: z.array(z.string().min(1)),
  productionWork: safeIntSchema,
  unitCost: safeIntSchema,
  maintenanceRequirement: safeIntSchema,
  crewRequirement: safeIntSchema,
  contentVersion: z.string().min(1),
  contentHash: z.string().min(1),
});

export type AircraftModelDefinitionContract = z.infer<typeof AircraftModelDefinition_v1>;

export function validateAircraftModelDefinitionContract(
  value: unknown,
): AircraftModelDefinitionContract {
  const result = AircraftModelDefinition_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(INVALID_AIRCRAFT_MODEL_DEFINITION, {
      code: INVALID_AIRCRAFT_MODEL_DEFINITION,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "contract validation failed",
      value,
    });
  }
  return result.data;
}

export const SHIPPED_AIRCRAFT_CONTRACT = {
  modelDefinition: AircraftModelDefinition_v1,
} as const;