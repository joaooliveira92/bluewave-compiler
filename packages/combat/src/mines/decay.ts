//packages/combat/src/mines/decay.ts
// DESIGN-35 §21 monthly mine decay (INC-7):
//
//   pressureAfterDecay = floor(pressureAfterSweeping * retentionMultiplierBp / 10_000)
//   decayedPressure     = pressureAfterSweeping - pressureAfterDecay
//
// The monthly pressure-retention multiplier comes from the mine type's decay
// policy (§21 shipped values, already authored on each MineTypeDefinition):
//   - FLAT                 -> retentionBp            (9_750 / 9_500 / 9_250 / 9_500)
//   - INFRASTRUCTURE_GATED -> operationalRetentionBp (9_900) when control
//                             infrastructure is operational, else
//                             nonOperationalRetentionBp (9_000) — CONTROLLED_DEFENSIVE.
//   - DEFINITION_REQUIRED  -> no decay metadata (SCENARIO_SPECIAL) ->
//                             throw MINE_DECAY_POLICY_MISSING (§21).
//
// Freshness retention uses the SAME retention multiplier unless the mine-type
// definition provides a NARROWER explicit `freshnessRetentionBp` (§21: "uses the
// same multiplier unless ... a narrower explicit value"). All shipped types carry
// freshnessRetentionBp: null, so every shipped type decays freshness by its
// pressure-retention multiplier.
//
// ARITHMETIC BOUND: retentionMultiplierBp <= 10_000, pressure <= 1_000_000, so
// the product pressure * retentionMultiplierBp <= 1e10, far below
// Number.MAX_SAFE_INTEGER (~9.007e15); the /division is exact. We still perform
// the product in bigint and apply EXACTLY ONE floor (bigint division floors), so
// rounding is deterministic and cannot overflow. Pure/deterministic: no
// I/O/clock/random; the updated record is a NEW immutable object.
//
// ZERO-PRESSURE SEAM: when pressureAfterDecay reaches 0 the record is at the
// §1 CLEARED boundary (zero pressure = absence of an active record), so it can
// no longer pass the active-surface validation that withAreaMinePressureRecordHash
// enforces (pressure >= 1). Mirroring applySweptPressure (INC-4), we KEEP the
// reduction + a deterministic hash of the zero-pressure transitional state and DO
// NOT delete it — full closure is §27/INC-7 part D (clearance.ts). A decay applied
// to an already-absent (pressure-0) record is a graceful no-op.
import { BluewaveError, SafeInt } from "@bluewave/contracts";
import { MINE_BASIS_POINTS_PER_UNIT, type MineDecayPolicy } from "./constants.js";
import { mineTypeDefinitionById } from "./model.js";
import {
  MINE_PRESSURE_MIN,
  type AreaMinePressureRecord,
  computeAreaPressureRecordHash,
  withAreaMinePressureRecordHash,
} from "./pressure-record.js";
import { MINE_DECAY_POLICY_MISSING, INVALID_MINE_PRESSURE_STATE } from "./reasonCodes.js";

export interface DecayedPressure {
  /** The retention multiplier resolved from the type's decay policy (§21). */
  retentionMultiplierBp: number;
  /** floor(pressure * retentionMultiplierBp / 10_000) — never below zero. */
  pressureAfterDecay: SafeInt;
  /** pressure - pressureAfterDecay — the pressure removed by this month's decay. */
  decayedPressure: SafeInt;
  /** Retention multiplier applied to freshness (same-else-narrower, §21). */
  freshnessRetentionMultiplierBp: number;
}

function throwDecayPolicyMissing(record: AreaMinePressureRecord): never {
  throw new BluewaveError(MINE_DECAY_POLICY_MISSING, {
    code: MINE_DECAY_POLICY_MISSING,
    minePressureId: record.minePressureId,
    mineTypeId: record.mineTypeId,
    reason:
      "scenario-special minefield has no §21 decay metadata — a decay policy definition is required",
  });
}

// AC-15: resolve the retention multiplier from the mine type's decay policy.
// FLAT -> retentionBp; INFRASTRUCTURE_GATED -> the operational/non-operational
// value selected by controlInfrastructureOperational; DEFINITION_REQUIRED ->
// throw MINE_DECAY_POLICY_MISSING (a scenario-special minefield without decay
// metadata MUST fail, §21).
export function resolveDecayRetentionMultiplier(
  record: AreaMinePressureRecord,
  controlInfrastructureOperational: boolean,
): number {
  const policy: MineDecayPolicy = mineTypeDefinitionById(record.mineTypeId).decayPolicy;
  switch (policy.kind) {
    case "FLAT":
      return policy.retentionBp;
    case "INFRASTRUCTURE_GATED":
      return controlInfrastructureOperational
        ? policy.operationalRetentionBp
        : policy.nonOperationalRetentionBp;
    case "DEFINITION_REQUIRED":
      return throwDecayPolicyMissing(record);
  }
}

// AC-15: freshness retention multiplier. Same as the pressure-retention multiplier
// UNLESS the mine-type definition provides a NARROWER explicit freshnessRetentionBp
// (§21). All shipped types carry null, so they use the pressure multiplier.
export function resolveDecayFreshnessRetentionMultiplier(
  record: AreaMinePressureRecord,
  controlInfrastructureOperational: boolean,
): number {
  const policy: MineDecayPolicy = mineTypeDefinitionById(record.mineTypeId).decayPolicy;
  if (policy.kind === "DEFINITION_REQUIRED") return throwDecayPolicyMissing(record);
  if (policy.freshnessRetentionBp !== null) return policy.freshnessRetentionBp;
  return resolveDecayRetentionMultiplier(record, controlInfrastructureOperational);
}

function assertActiveRecordForDecay(record: AreaMinePressureRecord): void {
  if (record.pressure < MINE_PRESSURE_MIN) {
    throw new BluewaveError(INVALID_MINE_PRESSURE_STATE, {
      code: INVALID_MINE_PRESSURE_STATE,
      field: "pressure",
      reason:
        "decay requires an active pressure record (0 means absence, §1) — apply decay to the active record",
      value: record.pressure,
    });
  }
  if (!SafeInt.isSafeInt(record.pressure) || !SafeInt.isSafeInt(record.freshnessBp)) {
    throw new BluewaveError(INVALID_MINE_PRESSURE_STATE, {
      code: INVALID_MINE_PRESSURE_STATE,
      field: "pressure|freshnessBp",
      reason: "decay inputs must be safe integers",
      value: { pressure: record.pressure, freshnessBp: record.freshnessBp },
    });
  }
}

// AC-15: exact §21 decay math. pressureAfterDecay = floor(pressure *
// retentionBp / 10_000); decayedPressure = pressure - pressureAfterDecay.
// bigint product + ONE floor (bigint integer division); product bound documented
// in the header above.
export function computeDecayedPressure(
  record: AreaMinePressureRecord,
  controlInfrastructureOperational: boolean,
): DecayedPressure {
  assertActiveRecordForDecay(record);
  const retentionMultiplierBp = resolveDecayRetentionMultiplier(
    record,
    controlInfrastructureOperational,
  );
  const freshnessRetentionMultiplierBp = resolveDecayFreshnessRetentionMultiplier(
    record,
    controlInfrastructureOperational,
  );
  const pressureAfterDecay = Number(
    (BigInt(record.pressure) * BigInt(retentionMultiplierBp)) / BigInt(MINE_BASIS_POINTS_PER_UNIT),
  );
  return {
    retentionMultiplierBp,
    pressureAfterDecay: SafeInt(pressureAfterDecay),
    decayedPressure: SafeInt(Number(BigInt(record.pressure) - BigInt(pressureAfterDecay))),
    freshnessRetentionMultiplierBp,
  };
}

// AC-15: apply a monthly decay, returning an updated AreaMinePressureRecord with
// pressure = pressureAfterDecay, freshnessBp = floor(freshness * freshnessRetention /
// 10_000), lastDecayedMonth = decayMonth, and the record hash recomputed.
// ZERO-PRESSURE SEAM (INC-4 parity): a decay that drives pressure to 0 keeps the
// transitional zero-pressure hash (computeAreaPressureRecordHash) and does NOT
// delete the record — closure is §27 part D. A decay applied to an already-absent
// (pressure-0) record is a graceful no-op (returns the input unchanged) so the
// monthly resolver never trips on a record that clearance already finalized.
export function applyDecayedMonth(
  record: AreaMinePressureRecord,
  controlInfrastructureOperational: boolean,
  decayMonth: SafeInt,
): AreaMinePressureRecord {
  if (!SafeInt.isSafeInt(decayMonth))
    throw new BluewaveError(INVALID_MINE_PRESSURE_STATE, {
      code: INVALID_MINE_PRESSURE_STATE,
      field: "decayMonth",
      reason: "decay month must be a safe integer (§21)",
      value: decayMonth,
    });
  // Graceful no-op when the record is already absent (pressure-0). Decay is the
  // per-month reducer; clearance (§27) has already closed this record and the
  // caller handed us the transitional state — do not re-enter decay.
  if (record.pressure < MINE_PRESSURE_MIN) return record;

  const { pressureAfterDecay, freshnessRetentionMultiplierBp } = computeDecayedPressure(
    record,
    controlInfrastructureOperational,
  );
  const freshnessAfterDecay = Number(
    (BigInt(record.freshnessBp) * BigInt(freshnessRetentionMultiplierBp)) /
      BigInt(MINE_BASIS_POINTS_PER_UNIT),
  );
  const updated: Omit<AreaMinePressureRecord, "recordHash"> = {
    ...record,
    pressure: pressureAfterDecay,
    freshnessBp: SafeInt(freshnessAfterDecay),
    lastDecayedMonth: decayMonth,
  };

  if (pressureAfterDecay >= MINE_PRESSURE_MIN) {
    // Still an active record -> full validation + hash.
    return withAreaMinePressureRecordHash(updated);
  }
  // pressureAfterDecay === 0: the §1 cleared boundary, same seam as applySweptPressure.
  return {
    ...updated,
    recordHash: computeAreaPressureRecordHash(updated as AreaMinePressureRecord),
  };
}
