import {
  SHIPPED_CARRIER_OPERATIONS_CONTRACT,
  validateCarrierOperationsStateContract,
  validateCarrierCapacityAssignmentContract,
  validateOversizedCarrierPolicyContract,
} from "./contracts.js";

export interface CarrierOperationsContractEntry {
  policyId: string;
  shippedContract: unknown;
  validate: (value: unknown) => void;
}

export const SHIPPED_CARRIER_OPERATIONS_CONTRACTS: readonly CarrierOperationsContractEntry[] = [
  {
    policyId: "carrier_operations_state_v1",
    shippedContract: SHIPPED_CARRIER_OPERATIONS_CONTRACT.state,
    validate: validateCarrierOperationsStateContract,
  },
  {
    policyId: "carrier_capacity_assignment_v1",
    shippedContract: SHIPPED_CARRIER_OPERATIONS_CONTRACT.capacityAssignment,
    validate: validateCarrierCapacityAssignmentContract,
  },
  {
    policyId: "oversized_carrier_policy_v1",
    shippedContract: SHIPPED_CARRIER_OPERATIONS_CONTRACT.oversizedPolicy,
    validate: validateOversizedCarrierPolicyContract,
  },
] as const;

export function validateAllCarrierOperationsContracts(): void {
  for (const entry of SHIPPED_CARRIER_OPERATIONS_CONTRACTS) {
    entry.validate(entry.shippedContract);
  }
}