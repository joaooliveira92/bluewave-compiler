// packages/combat/src/air-defense/contractRollup.ts
// D-4 M4 Aviation: Air Defense — INC-5: every shipped air-defense contract in a single typed
// registry, plus a fail-closed validation guard.
// Parallel to air-combat/contractRollup.ts pattern.
import {
  type AirDefensePolicyContract,
  validateAirDefenseContract,
  validateAaDirectorScalingContract,
  validateRadarSaturationContract,
  validateCiwsRedundancyContract,
} from "./contracts.js";
import {
  AIR_DEFENSE_MODEL_VERSION,
  PROTECTED_RADIUS,
  ENGAGEMENT_FORMULA_SCALE_EXPONENT,
  DIRECTOR_SCALING_TABLE,
  RADAR_SATURATION_TABLE,
  CIWS_REDUNDANCY_TABLE,
} from "./constants.js";
import { AIR_DEFENSE_RULESET_VERSION } from "./air-defense-system-definition.js";

export interface AirDefenseContractEntry {
  policyId: string;
  shippedContract: unknown;
  validate: (value: unknown) => void;
}

function makeValidAirDefensePolicy(): AirDefensePolicyContract {
  return {
    rulesetVersion: AIR_DEFENSE_RULESET_VERSION,
    modelVersion: AIR_DEFENSE_MODEL_VERSION,
    protectedRadiusM: PROTECTED_RADIUS,
    scaleExponent: ENGAGEMENT_FORMULA_SCALE_EXPONENT,
  };
}

function makeValidAaDirectorScaling() {
  return {
    contractId: "aa_director_scaling_v1" as const,
    scalingTable: [...DIRECTOR_SCALING_TABLE],
  };
}

function makeValidRadarSaturation() {
  return {
    contractId: "radar_saturation_v1" as const,
    saturationTable: [...RADAR_SATURATION_TABLE],
  };
}

function makeValidCiwsRedundancy() {
  return {
    contractId: "ciws_redundancy_v1" as const,
    redundancyTable: [...CIWS_REDUNDANCY_TABLE],
  };
}

export const SHIPPED_AIR_DEFENSE_CONTRACTS: readonly AirDefenseContractEntry[] = [
  {
    policyId: "air_defense_v1",
    shippedContract: makeValidAirDefensePolicy(),
    validate: validateAirDefenseContract,
  },
  {
    policyId: "aa_director_scaling_v1",
    shippedContract: makeValidAaDirectorScaling(),
    validate: validateAaDirectorScalingContract,
  },
  {
    policyId: "radar_saturation_v1",
    shippedContract: makeValidRadarSaturation(),
    validate: validateRadarSaturationContract,
  },
  {
    policyId: "ciws_redundancy_v1",
    shippedContract: makeValidCiwsRedundancy(),
    validate: validateCiwsRedundancyContract,
  },
] as const;

export function validateAllAirDefenseContracts(): void {
  for (const entry of SHIPPED_AIR_DEFENSE_CONTRACTS) {
    entry.validate(entry.shippedContract);
  }
}
