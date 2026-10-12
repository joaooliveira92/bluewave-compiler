export { PhaseEngineError } from "./errors.js";
export type { LedgerTransaction, LedgerTransactionInput } from "./financial-ledger.js";
export { FinancialLedger } from "./financial-ledger.js";
export {
  BUDGET_COMPLETION_BRANCH_ID,
  BUDGET_PROJECT_COMMAND_DEFINITION,
  BUDGET_PROJECT_COMMAND_SCHEMA_VERSION,
  BUDGET_PROJECT_COMMAND_TYPE_ID,
  BudgetProjectLifecycle,
  HALT_CONSTRUCTION_COMMAND_DEFINITION,
  HALT_CONSTRUCTION_COMMAND_SCHEMA_VERSION,
  HALT_CONSTRUCTION_COMMAND_TYPE_ID,
  RESUME_CONSTRUCTION_COMMAND_DEFINITION,
  RESUME_CONSTRUCTION_COMMAND_SCHEMA_VERSION,
  RESUME_CONSTRUCTION_COMMAND_TYPE_ID,
  SET_ACCELERATION_COMMAND_DEFINITION,
  SET_ACCELERATION_COMMAND_SCHEMA_VERSION,
  SET_ACCELERATION_COMMAND_TYPE_ID,
} from "./commandLifecycle.js";
export type { BudgetProjectLifecycleOutcome } from "./commandLifecycle.js";
export {
  CONSTRUCTION_RESUMED_AWAITING_CAPACITY,
  CONSTRUCTION_RESUMED_NO_CAPACITY_RECORD,
  CONSTRUCTION_RESUMED_WITH_CAPACITY,
  constructionResumeTarget,
  type ConstructionResumeReason,
  type ConstructionResumeTarget,
} from "./constructionHaltResume.js";
export {
  constructionProjectReadout,
  type ConstructionProjectReadout,
} from "./constructionReadout.js";
export {
  ACCELERATION_CAPACITY_PRESSURE_DELAY,
  ACCELERATION_CAPACITY_PRESSURE_WEIGHT_BP,
  ACCELERATION_DELAY_PROBABILITY_CAP_BP,
  ACCELERATION_DELAY_THRESHOLD_BP,
  ACCELERATION_NOT_ALLOWED,
  ACCELERATION_PREMIUM_ALREADY_APPLIED,
  ACCELERATION_PRESSURE_CONTINUED,
  ACCELERATION_STREAM_FAMILY,
  ACCELERATION_TOTAL_WORK_MULTIPLIER_BP,
  ACCELERATION_WORK_RATE_MULTIPLIER_BP,
  CONSTRUCTION_ACCELERATION_POLICY_ID,
  accelerateCapacityUnits,
  acceleratedRemainingWork,
  accelerationDelayEligible,
  accelerationDelayProbabilityBp,
  accelerationExcessPressureBp,
  accelerationPremiumAlreadyApplied,
  accelerationPremiumWork,
  applyAccelerationPremium,
  constructionAccelerationAllowed,
  constructionCapacityPressureBp,
  constructionWorkStatus,
  drawAccelerationDelayBp,
  projectConstructionDemand,
  resolveAccelerationCapacityPressure,
  weightedConstructionDemand,
  type AccelerationPremiumResult,
  type AccelerationPressureInput,
  type AccelerationPressureOutcome,
} from "./constructionAcceleration.js";
export type {
  MonthExecutorEngineOptions,
  MonthResult,
  StrategicWeatherPhaseOptions,
} from "./month.js";
export { MonthExecutor } from "./month.js";
export { applyBattleConsequences, collectLostShips, resolveShipStrength } from "./battles.js";
export {
  PhaseGuard,
  PHASE_ACCESS_DENIED,
  PHASE_FOOTPRINTS,
  PhaseResource,
  type PhaseFootprint,
} from "./phase-guard.js";
export type { PhaseDefinition } from "./registry.js";
export { PhaseRegistry } from "./registry.js";
export type { ReplayMismatch, ReplayResult, ReplayStepResult } from "./replay.js";
export { ReplayVerifier, hashSnapshot, snapshotToHashable } from "./replay.js";
export type {
  TacticalBattleDivergence,
  TacticalBattleVerification,
  TacticalDivergenceField,
  TacticalReplayResult,
} from "./tacticalReplay.js";
export { TacticalReplayVerifier } from "./tacticalReplay.js";
export { resolveAircraftDevelopment } from "./aircraft.js";
export { resolveCarrierOperations } from "./carrier-operations.js";
export * from "./designStudies.js";
export { buildDesignVersion, pricingFor, type DesignPricing } from "./designVersion.js";
export {
  auxiliaryFleetCounts,
  constructionOrderEligibility,
  type OrderEligibility,
  type OrderRejection,
  type OrderRejectionCode,
} from "./orderEligibility.js";
export {
  CONSTRUCTION_BATCH_LIMIT_EXCEEDED,
  CONSTRUCTION_BATCH_MAX_QUANTITY,
  CONSTRUCTION_BATCH_MIN_QUANTITY,
  constructionProjectFor,
  placeConstructionBatch,
  placeConstructionOrder,
  type ConstructionBatchRequest,
  type ConstructionBatchResult,
  type ConstructionOrderRequest,
  type ConstructionOrderResult,
} from "./constructionOrder.js";
export {
  DOCK_EXPANSION_BASE_TOTAL_WORK_UNITS,
  DOCK_EXPANSION_COST_FORMULA_ID,
  DOCK_EXPANSION_PROJECT_TYPE,
  PRIVATE_DOCK_EXPANSION_COOLDOWN_MONTHS,
  PRIVATE_DOCK_EXPANSION_EVENT_ID,
  PRIVATE_DOCK_EXPANSION_EVENT_WEIGHT_BP,
  PRIVATE_DOCK_EXPANSION_MIN_UTILIZATION_BP,
  PRIVATE_DOCK_EXPANSION_NOT_TRIGGERED,
  PRIVATE_DOCK_EXPANSION_STREAM_FAMILY,
  PRIVATE_DOCK_EXPANSION_TRAILING_MONTHS,
  PRIVATE_DOCK_EXPANSION_TRIGGERED,
  applyDockExpansionStep,
  authorizeDockExpansion,
  dockExpansionCompletes,
  dockExpansionMonthIsActive,
  dockExpansionProjectFor,
  hasActivePrivateDockExpansion,
  isDockExpansionProject,
  privateDockExpansionEligibility,
  resolvePrivateDockExpansion,
  trailingDockUtilizationBp,
  type DockExpansionAuthorizationReason,
  type DockExpansionAuthorizationResult,
  type DockExpansionProjectInput,
  type PrivateDockExpansionEligibility,
  type PrivateDockExpansionInput,
  type PrivateDockExpansionOutcome,
  type PrivateDockExpansionReason,
  type PrivateDockExpansionTrigger,
} from "./dockExpansion.js";
export {
  INSUFFICIENT_PROJECT_CAPACITY,
  committedNewConstructionMassKg,
  designNewConstructionReservedMassKg,
  nationalConstructionCapacity,
  type NationalConstructionCapacity,
} from "./newConstructionCapacity.js";
