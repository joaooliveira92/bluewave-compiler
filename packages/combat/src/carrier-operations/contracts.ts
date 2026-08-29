import { z } from "zod";
import { BluewaveError, SafeInt } from "@bluewave/contracts";
import {
  CARRIER_CLASSIFICATIONS,
  DECK_CYCLE_STATES,
  CARRIER_OPERATIONS_RULESET_VERSION,
  JET_CARRIER_CAPABILITIES,
  OVERSIZED_CARRIER_THRESHOLD,
  OVERSIZED_DECK_CYCLE_EFFICIENCY_BP,
  OVERSIZED_SORTIE_GENERATION_BP,
  OVERSIZED_MAINTENANCE_COST_BP,
  OVERSIZED_COORDINATION_BP,
  OVERSIZED_HAZARD_BP,
} from "./constants.js";
import { INVALID_CARRIER_OPERATIONS_STATE, CARRIER_OPERATIONS_INVARIANT_FAILED } from "./reasonCodes.js";

const safeIntSchema = z.custom<SafeInt>((v) => SafeInt.isSafeInt(v as number), {
  message: "must be a SafeInt",
});

const nonNegativeSafeIntSchema = safeIntSchema.refine((v) => Number(v) >= 0, {
  message: "must be non-negative",
});

const basisPointSchema = z.number().int().min(0).max(10_000);

const catapultDefinitionSchema = z.object({
  catapultId: z.string().min(1),
  compatible: z.boolean(),
  operational: z.boolean(),
  steamPowered: z.boolean(),
  conditionBp: basisPointSchema,
});

const liftDefinitionSchema = z.object({
  liftId: z.string().min(1),
  operational: z.boolean(),
  conditionBp: basisPointSchema,
});

const fuelStateSchema = z.object({
  fuelRemainingBp: nonNegativeSafeIntSchema,
  fuelCapacityBp: nonNegativeSafeIntSchema,
});

const ordnanceEntrySchema = z.object({
  ordnanceTypeId: z.string().min(1),
  quantity: nonNegativeSafeIntSchema,
});

const reservationSchema = z.object({
  reservationId: z.string().min(1),
  squadronId: z.string().min(1),
  aircraftModelId: z.string().min(1),
  count: nonNegativeSafeIntSchema,
});

const weatherOperabilitySchema = z.object({
  currentSeaState: nonNegativeSafeIntSchema,
  windOverDeckKnots: nonNegativeSafeIntSchema,
  precipitationIntensityBp: basisPointSchema,
  visibilityNauticalMiles: nonNegativeSafeIntSchema,
  deckFireIntensityBp: basisPointSchema,
  nightOperationsActive: z.boolean(),
});

export const CarrierOperationsState_v1 = z.object({
  shipId: z.string().min(1),
  compiledDesignId: z.string().min(1),
  classification: z.enum(CARRIER_CLASSIFICATIONS),
  physicalCapacityUnits: nonNegativeSafeIntSchema,
  occupiedCapacityUnits: nonNegativeSafeIntSchema,
  currentSpotValue: nonNegativeSafeIntSchema,
  deckCycleState: z.enum(DECK_CYCLE_STATES),
  deckConfigurationId: z.string().min(1),
  catapultDefinitions: z.array(catapultDefinitionSchema),
  liftDefinitions: z.array(liftDefinitionSchema),
  flightDeckCondition: basisPointSchema,
  hangarCondition: basisPointSchema,
  aviationFuelState: fuelStateSchema,
  ordnanceInventory: z.array(ordnanceEntrySchema),
  assignedAirGroupSquadronIds: z.array(z.string().min(1)),
  spottedAircraftCount: nonNegativeSafeIntSchema,
  fueledAircraftCount: nonNegativeSafeIntSchema,
  armedAircraftCount: nonNegativeSafeIntSchema,
  airborneAircraftCount: nonNegativeSafeIntSchema,
  returningAircraftCount: nonNegativeSafeIntSchema,
  damagedAircraftCount: nonNegativeSafeIntSchema,
  activeLaunchReservations: z.array(reservationSchema),
  activeRecoveryReservations: z.array(reservationSchema),
  weatherOperabilityState: weatherOperabilitySchema,
  rulesetVersion: z.literal(CARRIER_OPERATIONS_RULESET_VERSION),
  formulaVersion: z.string().min(1),
  stateHash: z.string().min(1),
});

export type CarrierOperationsStateContract = z.infer<typeof CarrierOperationsState_v1>;

export function validateCarrierOperationsStateContract(value: unknown): CarrierOperationsStateContract {
  const result = CarrierOperationsState_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(INVALID_CARRIER_OPERATIONS_STATE, {
      code: INVALID_CARRIER_OPERATIONS_STATE,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "contract validation failed",
      value,
    });
  }
  return result.data;
}

const assignmentSchema = z.object({
  squadronId: z.string().min(1),
  aircraftModelId: z.string().min(1),
  aircraftType: z.string().min(1),
  capacityUnits: nonNegativeSafeIntSchema,
  assignmentPriority: z.number().int().min(1).max(8),
});

export const CarrierCapacityAssignment_v1 = z.object({
  assignments: z.array(assignmentSchema),
  physicalCapacityUnits: nonNegativeSafeIntSchema,
  occupiedCapacityUnits: nonNegativeSafeIntSchema,
});

export type CarrierCapacityAssignmentContract = z.infer<typeof CarrierCapacityAssignment_v1>;

export function validateCarrierCapacityAssignmentContract(
  value: unknown,
): CarrierCapacityAssignmentContract {
  const result = CarrierCapacityAssignment_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(INVALID_CARRIER_OPERATIONS_STATE, {
      code: INVALID_CARRIER_OPERATIONS_STATE,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "contract validation failed",
      value,
    });
  }
  return result.data;
}

export const OversizedCarrierPolicy_v1 = z.object({
  threshold: z.literal(OVERSIZED_CARRIER_THRESHOLD),
  deckCycleEfficiencyBp: z.literal(OVERSIZED_DECK_CYCLE_EFFICIENCY_BP),
  sortieGenerationBp: z.literal(OVERSIZED_SORTIE_GENERATION_BP),
  maintenanceCostBp: z.literal(OVERSIZED_MAINTENANCE_COST_BP),
  coordinationBp: z.literal(OVERSIZED_COORDINATION_BP),
  hazardBp: z.literal(OVERSIZED_HAZARD_BP),
});

export type OversizedCarrierPolicyContract = z.infer<typeof OversizedCarrierPolicy_v1>;

export function validateOversizedCarrierPolicyContract(
  value: unknown,
): OversizedCarrierPolicyContract {
  const result = OversizedCarrierPolicy_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(CARRIER_OPERATIONS_INVARIANT_FAILED, {
      code: CARRIER_OPERATIONS_INVARIANT_FAILED,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "contract validation failed",
      value,
    });
  }
  return result.data;
}

export const CarrierSpotValue_v1 = z.object({
  baseSpotValue: nonNegativeSafeIntSchema,
  operationalCatapultCount: z.number().int().min(0),
  speedKnots: z.number().min(0),
  deckConfigurationId: z.string().min(1),
  flightDeckConditionBp: basisPointSchema,
  technologyLevel: z.string().min(1),
  compiledAircraftCapacity: z.number().int().min(0),
  finalSpotValue: nonNegativeSafeIntSchema,
});

export type CarrierSpotValueContract = z.infer<typeof CarrierSpotValue_v1>;

export const CarrierDeckCycleState_v1 = z.object({
  fromState: z.enum(DECK_CYCLE_STATES),
  toState: z.enum(DECK_CYCLE_STATES),
  timestamp: z.number().int().min(0),
  transitionValidated: z.boolean(),
});

export type CarrierDeckCycleStateContract = z.infer<typeof CarrierDeckCycleState_v1>;

export function validateCarrierDeckCycleStateContract(value: unknown): CarrierDeckCycleStateContract {
  const result = CarrierDeckCycleState_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(INVALID_CARRIER_OPERATIONS_STATE, {
      code: INVALID_CARRIER_OPERATIONS_STATE,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "contract validation failed",
      value,
    });
  }
  return result.data;
}

const operationClassSchema = z.enum([
  "EMERGENCY_RECOVERY",
  "ORDINARY_RECOVERY",
  "ALERT_CAP_LAUNCH",
  "ACTIVE_STRIKE_LAUNCH",
  "SEARCH_LAUNCH",
  "ORDINARY_CAP_LAUNCH",
  "SPOTTING",
  "REFUELING_REARMING",
  "STRIKE_DOWN",
]);

const contentionPredicatesSchema = z.object({
  hasAngledDeck: z.boolean(),
  deckDamagePermitsOverlap: z.boolean(),
  weatherPermitsOverlap: z.boolean(),
  trafficPermitsOverlap: z.boolean(),
  hasFueledArmedAircraftOnDeck: z.boolean(),
  clearDeckCapacitySufficient: z.boolean(),
});

export const CarrierDeckContention_v1 = z.object({
  requested: operationClassSchema,
  currentOperations: z.array(operationClassSchema),
  predicates: contentionPredicatesSchema,
  permitted: z.boolean(),
});

export type CarrierDeckContentionContract = z.infer<typeof CarrierDeckContention_v1>;

export function validateCarrierDeckContentionContract(value: unknown): CarrierDeckContentionContract {
  const result = CarrierDeckContention_v1.safeParse(value);
  if (!result.success) {
    throw new BluewaveError(INVALID_CARRIER_OPERATIONS_STATE, {
      code: INVALID_CARRIER_OPERATIONS_STATE,
      field: result.error.errors[0]?.path.join(".") ?? "unknown",
      reason: result.error.errors[0]?.message ?? "contract validation failed",
      value,
    });
  }
  return result.data;
}

export const JetCarrierCapability_v1 = z.object({
  trueStandardDisplacementKg: nonNegativeSafeIntSchema,
  hasCompatibleOperationalSteamCatapult: z.boolean(),
  hasAngledDeck: z.boolean(),
  hasStrengthenedArrestingGear: z.boolean(),
  hasJetCompatibleLiftsAndHangar: z.boolean(),
  hasAdequateDeckStrengthAndHeatResistance: z.boolean(),
  adoptedTechnologies: z.array(z.string().min(1)),
  determinedCapability: z.enum(JET_CARRIER_CAPABILITIES),
});

export type JetCarrierCapabilityContract = z.infer<typeof JetCarrierCapability_v1>;

export const SHIPPED_CARRIER_OPERATIONS_CONTRACT = {
  state: CarrierOperationsState_v1,
  capacityAssignment: CarrierCapacityAssignment_v1,
  oversizedPolicy: OversizedCarrierPolicy_v1,
  deckCycleState: CarrierDeckCycleState_v1,
  deckContention: CarrierDeckContention_v1,
} as const;