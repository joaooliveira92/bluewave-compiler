//packages/combat/src/gunnery/constants.ts
// Versioned authoritative gunnery base constants (DESIGN-39 §§1-2) shipped as a
// `gunnery_v1` policy + `SHIPPED_GUNNERY_CONTRACT` + `validateGunneryContract`,
// mirroring packages/combat/src/movement/constants.ts. Fail-closed on mismatch.
// Grounded in docs/research/b3-m2-gunnery.md and recorded in the B-3 ADR (INC-5).
import { BluewaveError } from "@bluewave/contracts";
import { GUNNERY_STATE_INVARIANT_FAILED } from "./reasonCodes.js";

export const gunneryPolicyId = "gunnery_v1" as const;

// fixed-point scale shared by every basis-point quantity in this subsystem.
export const BASIS_POINTS_PER_UNIT = 10_000 as const;

// DESIGN-39 §1 acquisition progress and fire-control solution quality are basis
// points restricted to [0, 10_000] (integer).
export const ACQUISITION_PROGRESS_MIN_BP = 0 as const;
export const ACQUISITION_PROGRESS_MAX_BP = 10_000 as const;
export const FIRE_CONTROL_SOLUTION_MIN_BP = 0 as const;
export const FIRE_CONTROL_SOLUTION_MAX_BP = 10_000 as const;

// Surface-mode firing guard: a battery MUST have a fire-control solution quality at
// or above this basis-point threshold to fire in a surface mode (DESIGN-39 §1
// fire-control solution quality; reason code GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT,
// spec §1.4). This is a versioned-ruleset constant recorded in ADR-0020 (INC-5);
// authored, not runtime-inferred. RAPID/AA eligibility predicates are deferred
// (modes.ts) and are not gated here.
export const SURFACE_FIRE_CONTROL_MINIMUM_BP = 2_000 as const;

// Canonial ammunition types tracked by exact integer count (DESIGN-39 §28). Seed
// set for this slice; a future ammunition slice may extend under a new version.
export const AMMUNITION_TYPES = [
  "ARMOR_PIERCING",
  "COMMON",
  "HIGH_EXPLOSIVE",
] as const;
export type AmmunitionType = (typeof AMMUNITION_TYPES)[number];

// The seven canonical fire modes (DESIGN-39 §2). Closed union; see modes.ts for the
// per-mode records.
export const FIRE_MODES = [
  "CEASE_FIRE",
  "RANGING",
  "NORMAL",
  "RAPID",
  "AA_TRACKING",
  "AA_BARRAGE",
  "LOCAL_CONTROL",
] as const;
export type FireMode = (typeof FIRE_MODES)[number];

// ruleset + formula versions pinned by the gunnery_v1 contract.
export const GUNNERY_RULESET_VERSION = "gunnery_ruleset_v1" as const;
export const GUNNERY_FORMULA_VERSION = "gunnery_formula_v1" as const;

// ---------------------------------------------------------------------------
// DESIGN-39 §3 Accuracy factor manifest (INC-2). The 16 multiplier factors form
// the exact basis-point product below baseAccuracyBp, divided once by 10_000^16
// and floored once (not truncated) at the final accuracy check. Every factor
// MUST be explicit + versioned; a missing/undefined factor fails with
// GUNNERY_ACCURACY_FACTOR_MISSING (never a silent 10_000 fallback). Non-slice
// factors (range/visibility/radar/etc.) are pinned to neutral 10_000 as authored
// constants until their owning modifier track lands — not invented behavior.
export const gunneryAccuracyPolicyId = "gunnery_accuracy_v1" as const;

// Ordered canonical multiplier factor manifest (DESIGN-39 §3 order, 16 factors,
// excluding base accuracy). base + these 16 = 17 named factors overall.
export const GUNNERY_ACCURACY_FACTOR_KEYS = [
  "fireControl",
  "crew",
  "officer",
  "training",
  "range",
  "visibility",
  "radar",
  "ownManeuver",
  "targetManeuver",
  "previousSalvo",
  "seaState",
  "smoke",
  "damage",
  "multipleAttacker",
  "glare",
  "targetEvasion",
] as const;
export type GunneryAccuracyFactorKey = (typeof GUNNERY_ACCURACY_FACTOR_KEYS)[number];

// Neutral multiplier for every factor in this slice (1.0 basis-point scale).
export const NEUTRAL_ACCURACY_MULTIPLIER_BP = 10_000 as const;

// Final accuracy bounds (basis points) and the §3 exponent (16 multipliers).
export const GUNNERY_ACCURACY_FINAL_MIN_BP = 0 as const;
export const GUNNERY_ACCURACY_FINAL_MAX_BP = 10_000 as const;
export const GUNNERY_ACCURACY_SCALE_EXPONENT = 16 as const;
export const GUNNERY_ACCURACY_ROUNDING = "floor" as const;

// Authored neutral constants for the non-slice factors pinned until their owning
// modifier track lands. Explicit names (not invented behavior); all neutral 10_000.
export const GUNNERY_ACCURACY_NEUTRAL_FACTORS: Record<
  GunneryAccuracyFactorKey,
  number
> = {
  fireControl: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  crew: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  officer: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  training: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  range: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  visibility: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  radar: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  ownManeuver: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  targetManeuver: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  previousSalvo: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  seaState: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  smoke: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  damage: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  multipleAttacker: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  glare: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  targetEvasion: NEUTRAL_ACCURACY_MULTIPLIER_BP,
};

export interface GunneryContract {
  policyId: string;
  basisPointsPerUnit: number;
  acquisitionProgressMinBp: number;
  acquisitionProgressMaxBp: number;
  fireControlSolutionMinBp: number;
  fireControlSolutionMaxBp: number;
  surfaceFireControlMinimumBp: number;
  rulesetVersion: string;
  formulaVersion: string;
  ammunitionTypes: readonly AmmunitionType[];
  fireModes: readonly FireMode[];
}

export const SHIPPED_GUNNERY_CONTRACT: GunneryContract = {
  policyId: gunneryPolicyId,
  basisPointsPerUnit: BASIS_POINTS_PER_UNIT,
  acquisitionProgressMinBp: ACQUISITION_PROGRESS_MIN_BP,
  acquisitionProgressMaxBp: ACQUISITION_PROGRESS_MAX_BP,
  fireControlSolutionMinBp: FIRE_CONTROL_SOLUTION_MIN_BP,
  fireControlSolutionMaxBp: FIRE_CONTROL_SOLUTION_MAX_BP,
  surfaceFireControlMinimumBp: SURFACE_FIRE_CONTROL_MINIMUM_BP,
  rulesetVersion: GUNNERY_RULESET_VERSION,
  formulaVersion: GUNNERY_FORMULA_VERSION,
  ammunitionTypes: AMMUNITION_TYPES,
  fireModes: FIRE_MODES,
};

function throwMismatch(contract: unknown, reason: string): never {
  throw new BluewaveError(GUNNERY_STATE_INVARIANT_FAILED, {
    code: GUNNERY_STATE_INVARIANT_FAILED,
    contract,
    reason,
  });
}

function arrayEquals(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function validateGunneryContract(
  c: Partial<GunneryContract> | null | undefined,
): asserts c is GunneryContract {
  if (!c) throwMismatch(c, "gunnery_v1 missing contract");
  if (c.policyId !== gunneryPolicyId) throwMismatch(c, "gunnery_v1 expectant policy id");
  if (c.basisPointsPerUnit !== BASIS_POINTS_PER_UNIT)
    throwMismatch(c, "gunnery_v1 basis-point scale");
  if (
    c.acquisitionProgressMinBp !== ACQUISITION_PROGRESS_MIN_BP ||
    c.acquisitionProgressMaxBp !== ACQUISITION_PROGRESS_MAX_BP
  )
    throwMismatch(c, "gunnery_v1 acquisition bounds");
  if (
    c.fireControlSolutionMinBp !== FIRE_CONTROL_SOLUTION_MIN_BP ||
    c.fireControlSolutionMaxBp !== FIRE_CONTROL_SOLUTION_MAX_BP
  )
    throwMismatch(c, "gunnery_v1 fire-control solution bounds");
  if (c.surfaceFireControlMinimumBp !== SURFACE_FIRE_CONTROL_MINIMUM_BP)
    throwMismatch(c, "gunnery_v1 surface fire-control minimum");
  if (c.rulesetVersion !== GUNNERY_RULESET_VERSION || c.formulaVersion !== GUNNERY_FORMULA_VERSION)
    throwMismatch(c, "gunnery_v1 ruleset/formula versions");
  if (!c.ammunitionTypes || !arrayEquals(c.ammunitionTypes, AMMUNITION_TYPES))
    throwMismatch(c, "gunnery_v1 ammunition types");
  if (!c.fireModes || !arrayEquals(c.fireModes, FIRE_MODES))
    throwMismatch(c, "gunnery_v1 fire modes");
}

// DESIGN-39 §3 accuracy manifest contract (INC-2). Ships *_v1 policy id +
// factor manifest + scale bounds + rounding, fail-closed on any drift, mirroring
// the SHIPPED_*_CONTRACT + validate guard pattern above.
export interface GunneryAccuracyContract {
  policyId: string;
  basisPointsPerUnit: number;
  factorKeys: readonly GunneryAccuracyFactorKey[];
  neutralMultiplierBp: number;
  finalMinBp: number;
  finalMaxBp: number;
  scaleExponent: number;
  rounding: string;
  rulesetVersion: string;
  formulaVersion: string;
}

export const SHIPPED_GUNNERY_ACCURACY_CONTRACT: GunneryAccuracyContract = {
  policyId: gunneryAccuracyPolicyId,
  basisPointsPerUnit: BASIS_POINTS_PER_UNIT,
  factorKeys: GUNNERY_ACCURACY_FACTOR_KEYS,
  neutralMultiplierBp: NEUTRAL_ACCURACY_MULTIPLIER_BP,
  finalMinBp: GUNNERY_ACCURACY_FINAL_MIN_BP,
  finalMaxBp: GUNNERY_ACCURACY_FINAL_MAX_BP,
  scaleExponent: GUNNERY_ACCURACY_SCALE_EXPONENT,
  rounding: GUNNERY_ACCURACY_ROUNDING,
  rulesetVersion: GUNNERY_RULESET_VERSION,
  formulaVersion: GUNNERY_FORMULA_VERSION,
};

function throwAccuracyMismatch(contract: unknown, reason: string): never {
  throw new BluewaveError(GUNNERY_STATE_INVARIANT_FAILED, {
    code: GUNNERY_STATE_INVARIANT_FAILED,
    contract,
    reason,
  });
}

export function validateGunneryAccuracyContract(
  c: Partial<GunneryAccuracyContract> | null | undefined,
): asserts c is GunneryAccuracyContract {
  if (!c) throwAccuracyMismatch(c, "gunnery_accuracy_v1 missing contract");
  if (c.policyId !== gunneryAccuracyPolicyId)
    throwAccuracyMismatch(c, "gunnery_accuracy_v1 expectant policy id");
  if (c.basisPointsPerUnit !== BASIS_POINTS_PER_UNIT)
    throwAccuracyMismatch(c, "gunnery_accuracy_v1 basis-point scale");
  if (!c.factorKeys || !arrayEquals(c.factorKeys, GUNNERY_ACCURACY_FACTOR_KEYS))
    throwAccuracyMismatch(c, "gunnery_accuracy_v1 factor manifest");
  if (c.neutralMultiplierBp !== NEUTRAL_ACCURACY_MULTIPLIER_BP)
    throwAccuracyMismatch(c, "gunnery_accuracy_v1 neutral multiplier");
  if (
    c.finalMinBp !== GUNNERY_ACCURACY_FINAL_MIN_BP ||
    c.finalMaxBp !== GUNNERY_ACCURACY_FINAL_MAX_BP
  )
    throwAccuracyMismatch(c, "gunnery_accuracy_v1 final bounds");
  if (c.scaleExponent !== GUNNERY_ACCURACY_SCALE_EXPONENT)
    throwAccuracyMismatch(c, "gunnery_accuracy_v1 scale exponent");
  if (c.rounding !== GUNNERY_ACCURACY_ROUNDING)
    throwAccuracyMismatch(c, "gunnery_accuracy_v1 rounding mode");
  if (c.rulesetVersion !== GUNNERY_RULESET_VERSION || c.formulaVersion !== GUNNERY_FORMULA_VERSION)
    throwAccuracyMismatch(c, "gunnery_accuracy_v1 ruleset/formula versions");
}
