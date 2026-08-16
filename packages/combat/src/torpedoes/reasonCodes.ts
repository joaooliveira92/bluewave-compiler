//packages/combat/src/torpedoes/reasonCodes.ts
// DESIGN-40 §29 subset relevant to the torpedo module, kept separate from the
// top-level combat catalog (src/reasonCodes.ts) so the C-1 set-equality guard
// (reason-codes-torpedoes.test.ts, INC-8 deliverable) is not grown without
// review. Per spec §1.4 INC-1 ships ONLY the five §29 codes this increment
// exercises (model / launcher state / ammunition / compatibility / constants).
// The remaining §29 in-slice codes are owned by INC-2..INC-6 and are recorded
// below, never shipped here. The full partition (in-slice / deferred / reused
// combat catalog, disjointness) is verified by INC-8's set-equality test.

// ---- In-slice codes (INC-1) ----
export const INVALID_TORPEDO_MODEL_DEFINITION = "INVALID_TORPEDO_MODEL_DEFINITION" as const;
export const INVALID_TORPEDO_LAUNCHER_STATE = "INVALID_TORPEDO_LAUNCHER_STATE" as const;
export const TORPEDO_MODEL_INCOMPATIBLE = "TORPEDO_MODEL_INCOMPATIBLE" as const;
export const TORPEDO_AMMUNITION_UNAVAILABLE = "TORPEDO_AMMUNITION_UNAVAILABLE" as const;
export const TORPEDO_STATE_INVARIANT_FAILED = "TORPEDO_STATE_INVARIANT_FAILED" as const;

// ---- Collected catalog (INC-1 shipped set; set-equality checked in INC-8) ----
export const TORPEDO_REASON_CODES = {
  INVALID_TORPEDO_MODEL_DEFINITION,
  INVALID_TORPEDO_LAUNCHER_STATE,
  TORPEDO_MODEL_INCOMPATIBLE,
  TORPEDO_AMMUNITION_UNAVAILABLE,
  TORPEDO_STATE_INVARIANT_FAILED,
} as const;

// ---- Recorded §29 in-slice codes owned by later increments (never shipped here) ----
// INC-2 (launch legality): TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED,
//   TORPEDO_LAUNCH_AUTHORITY_DENIED, TORPEDO_TARGET_CONTACT_INSUFFICIENT,
//   TORPEDO_FIRE_SOLUTION_INSUFFICIENT, TORPEDO_LAUNCH_ARC_INVALID,
//   TORPEDO_LAUNCH_SPEED_LIMIT_MISSING, UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED,
//   TORPEDO_FRIENDLY_FIRE_RISK_PROHIBITED.
// INC-4 (launch + track): TORPEDO_LAUNCH_FAILURE.
// INC-5 (hit + detonation): TORPEDO_DUD, TORPEDO_HIT_RESOLVED.
// INC-6 (damage package): TORPEDO_PROGRESSIVE_FLOODING_CREATED,
//   TORPEDO_MACHINERY_DAMAGE_CREATED, TORPEDO_SYSTEM_SHOCK_DAMAGE_CREATED,
//   UNDERWATER_TUBE_SEVERE_FLOODING, TORPEDO_CHAIN_REACTION.
// Documented in-slice markers (spec §1.4): TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED
//   (INC-2 guard, per B-3 GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED precedent),
//   TORPEDO_FIRE_SOLUTION_FACTOR_MISSING (INC-3 §10 factor-missing failure).

// ---- Recorded deferred §29 ownership (owned by other tracks, never dropped) ----
// Submarine-launch speed/hazard codes (→ C-3), aerial-torpedo codes (→ D-track),
// production/inventory-delivery + refit codes (→ supply / DESIGN-23 track),
// command-layer manual-launch / division-order codes (→ command slice).

// ---- Reused existing combat-catalog codes (no new record needed, spec §1.4) ----
// TACTICAL_STATE_INVARIANT_FAILED, TACTICAL_FOG_OF_WAR_VIOLATION (target legality
// via reused validateTargetOrder), INVALID_TACTICAL_CLOCK, damage-pipeline codes
// (DAMAGE_STATE_INVARIANT_FAILED, SHIP_SINKING, SHIP_FOUNDERED), the B-4
// ComponentOutcome vocabulary, FIRE_SOURCE_CREATED / FLOODING_SOURCE_CREATED.