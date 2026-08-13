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
