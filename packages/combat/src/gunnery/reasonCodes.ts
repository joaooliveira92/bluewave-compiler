//packages/combat/src/gunnery/reasonCodes.ts
// DESIGN-39 §32 subset relevant to the B-3 gunnery modules, kept separate from the
// top-level combat catalog (src/reasonCodes.ts) so B-2's set-equality guard is not
// grown without review. Per spec §1.4 these are the in-slice gunnery codes; the
// deferred-subsystem §32 codes (autoloader/dual-purpose/armor/target/straddle) are
// recorded in the spec and owned by later slices, never shipped here.
export const INVALID_GUNNERY_STATE = "INVALID_GUNNERY_STATE" as const;
export const GUNNERY_STATE_INVARIANT_FAILED = "GUNNERY_STATE_INVARIANT_FAILED" as const;
export const GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT =
  "GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT" as const;
// GUNNERY_ACCURACY_FACTOR_MISSING (INC-2), GUNNERY_RATE_FACTOR_MISSING (INC-3),
// GUN_QUALITY_OUT_OF_RANGE (INC-3), GUNNERY_AMMUNITION_UNAVAILABLE (INC-4) ship in
// their owning increments.
// RAPID / AA_TRACKING / AA_BARRAGE eligibility predicates are DEFERRED to a later
// slice (DESIGN-39 §2, spec §3 straddle/AA). A firing guard reports this deferred
// predicate rather than fabricating one (AC-2).
export const GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED =
  "GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED" as const;

export const GUNNERY_REASON_CODES = {
  INVALID_GUNNERY_STATE,
  GUNNERY_STATE_INVARIANT_FAILED,
  GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT,
  GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED,
} as const;
