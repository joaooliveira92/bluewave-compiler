//packages/combat/src/torpedoes/reasonCodes.ts
// DESIGN-40 §29 subset relevant to the torpedo module, kept separate from the
// top-level combat catalog (src/reasonCodes.ts) so the C-1 set-equality guard
// (reason-codes-torpedoes.test.ts, INC-8 deliverable) is not grown without
// review. Per spec §1.4 INC-1 ships the five §29 codes its increment exercises;
// INC-2 (launch legality) ships the §5/§6/§7/§8 in-slice codes below. The
// remaining §29 in-slice codes are owned by INC-3..INC-6 and are recorded
// below, never shipped here. The full partition (in-slice / deferred / reused
// combat catalog, disjointness) is verified by INC-8's set-equality test.

// ---- In-slice codes (INC-1) ----
export const INVALID_TORPEDO_MODEL_DEFINITION = "INVALID_TORPEDO_MODEL_DEFINITION" as const;
export const INVALID_TORPEDO_LAUNCHER_STATE = "INVALID_TORPEDO_LAUNCHER_STATE" as const;
export const TORPEDO_MODEL_INCOMPATIBLE = "TORPEDO_MODEL_INCOMPATIBLE" as const;
export const TORPEDO_AMMUNITION_UNAVAILABLE = "TORPEDO_AMMUNITION_UNAVAILABLE" as const;
export const TORPEDO_STATE_INVARIANT_FAILED = "TORPEDO_STATE_INVARIANT_FAILED" as const;

// ---- In-slice codes (INC-2: launch legality, DESIGN-40 §5/§6/§7/§8) ----
// §5: manual launch is prohibited in ADMIRAL/REAR_ADMIRAL modes.
export const TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED =
  "TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED" as const;
// §5: a launch lacking a valid authority grant fails closed.
export const TORPEDO_LAUNCH_AUTHORITY_DENIED = "TORPEDO_LAUNCH_AUTHORITY_DENIED" as const;
// §6: known contact below the 4_000 bp confidence gate (after the reused
// validateTargetOrder fog gate; unknown/zero-confidence contacts throw the
// reused TACTICAL_FOG_OF_WAR_VIOLATION instead).
export const TORPEDO_TARGET_CONTACT_INSUFFICIENT = "TORPEDO_TARGET_CONTACT_INSUFFICIENT" as const;
// §6/§10: fire-solution quality below the shipped §10 minimum for the launch kind.
export const TORPEDO_FIRE_SOLUTION_INSUFFICIENT = "TORPEDO_FIRE_SOLUTION_INSUFFICIENT" as const;
// §6: target outside the launcher training/bearing limits (also the best-fit
// §29 code for the launch-arc geometry family).
export const TORPEDO_LAUNCH_ARC_INVALID = "TORPEDO_LAUNCH_ARC_INVALID" as const;
// §8: an above-water launcher without any maximum-launch-speed metadata.
export const TORPEDO_LAUNCH_SPEED_LIMIT_MISSING = "TORPEDO_LAUNCH_SPEED_LIMIT_MISSING" as const;
// §7: launching-ship speed strictly above 25 kn (12_861_100 µm/s) at command
// validation or at the exact firing substep.
export const UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED = "UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED" as const;

// ---- Documented in-slice marker (spec §1.4, B-3 GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED
// precedent). INC-2 reports this marker for §6 predicates whose full semantics
// ship in a later increment — the §24 friendly-fire family (target-not-friendly
// identification + danger sector), whose natural failure code
// TORPEDO_FRIENDLY_FIRE_RISK_PROHIBITED is owned by INC-3. Never a fabricated
// rule: the predicate is reported as deferred, not invented.
export const TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED =
  "TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED" as const;

// ---- Collected catalog (INC-1 + INC-2 shipped set; set-equality checked in INC-8) ----
export const TORPEDO_REASON_CODES = {
  INVALID_TORPEDO_MODEL_DEFINITION,
  INVALID_TORPEDO_LAUNCHER_STATE,
  TORPEDO_MODEL_INCOMPATIBLE,
  TORPEDO_AMMUNITION_UNAVAILABLE,
  TORPEDO_STATE_INVARIANT_FAILED,
  TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED,
  TORPEDO_LAUNCH_AUTHORITY_DENIED,
  TORPEDO_TARGET_CONTACT_INSUFFICIENT,
  TORPEDO_FIRE_SOLUTION_INSUFFICIENT,
  TORPEDO_LAUNCH_ARC_INVALID,
  TORPEDO_LAUNCH_SPEED_LIMIT_MISSING,
  UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED,
  TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED,
} as const;

export type TorpedoReasonCode = (typeof TORPEDO_REASON_CODES)[keyof typeof TORPEDO_REASON_CODES];

// ---- Recorded §29 in-slice codes owned by later increments (never shipped here) ----
// INC-3 (fire solution + salvo + friendly-fire): TORPEDO_FRIENDLY_FIRE_RISK_PROHIBITED
//   (§24 — INC-2 reports the §24 family through TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED
//   instead; the danger sector + 1_000 m threshold ship with INC-3),
//   TORPEDO_FIRE_SOLUTION_FACTOR_MISSING (§10 factor-missing failure).
// INC-4 (launch + track): TORPEDO_LAUNCH_FAILURE.
// INC-5 (hit + detonation): TORPEDO_DUD, TORPEDO_HIT_RESOLVED.
// INC-6 (damage package): TORPEDO_PROGRESSIVE_FLOODING_CREATED,
//   TORPEDO_MACHINERY_DAMAGE_CREATED, TORPEDO_SYSTEM_SHOCK_DAMAGE_CREATED,
//   UNDERWATER_TUBE_SEVERE_FLOODING, TORPEDO_CHAIN_REACTION.

// ---- Recorded deferred §29 ownership (owned by other tracks, never dropped) ----
// Submarine-launch speed/hazard codes (→ C-3), aerial-torpedo codes (→ D-track),
// production/inventory-delivery + refit codes (→ supply / DESIGN-23 track),
// command-layer manual-launch / division-order codes (→ command slice).

// ---- Reused existing combat-catalog codes (no new record needed, spec §1.4) ----
// TACTICAL_STATE_INVARIANT_FAILED, TACTICAL_FOG_OF_WAR_VIOLATION (target legality
// via reused validateTargetOrder), INVALID_TACTICAL_CLOCK, damage-pipeline codes
// (DAMAGE_STATE_INVARIANT_FAILED, SHIP_SINKING, SHIP_FOUNDERED), the B-4
// ComponentOutcome vocabulary, FIRE_SOURCE_CREATED / FLOODING_SOURCE_CREATED.
