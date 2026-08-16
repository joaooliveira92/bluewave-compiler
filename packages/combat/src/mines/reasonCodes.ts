//packages/combat/src/mines/reasonCodes.ts
// DESIGN-35 §30 subset relevant to the mine module, kept separate from the
// top-level combat catalog (src/reasonCodes.ts) so the C-2 set-equality guard
// (reason-codes-mines.test.ts, INC-8 deliverable, per ticket 05) is not grown
// without review. Per spec §1.4, DESIGN-35 §30 is authoritative: 15 direct +
// 2 value-only codes are in-slice for this sprint, and 3 are owned by the C-2
// continuation (strike resolution). INC-1
// ships the module plus INVALID_MINE_TYPE_DEFINITION, the one code it exercises.
// INC-2 ships the sources/laying/pressure codes it
// exercises. INC-3 ships the sweeping
// eligibility/base-value/dual-equipment/resistance codes (MINESWEEPING_SHIP_INELIGIBLE,
// DUAL_EQUIPMENT_MODE_MISSING, MINE_SWEEP_RESISTANCE_MISSING) that its §6/§7/§8/§9
// boundaries exercise. INC-4 ships the sweeping-aggregation/allocation code
// (MINE_PRESSURE_REDUCED). INC-5 ships the §16/§13 value-only codes
// (MINE_DEFENSIVE_STANDOFF_ACTIVE, MINE_ROUTE_RISK_CREATED) that its standoff /
// route-risk boundaries exercise, PLUS the documented in-slice NON-§30 marker
// MINE_STRIKE_RESOLUTION_DEFERRED (mirrors C-1's TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED
// precedent — a local marker a later increment fires if any caller reaches a
// would-be-strike boundary; it is NOT one of §30's required codes). The
// remaining in-slice codes are owned by INC-7/INC-8 and recorded below, never
// shipped here. The full partition (in-slice / deferred / reused combat
// catalog, disjointness) is verified by INC-8's set-equality test.

// ---- In-slice codes (INC-1) ----
export const INVALID_MINE_TYPE_DEFINITION = "INVALID_MINE_TYPE_DEFINITION" as const;

// ---- In-slice codes (INC-2: sources/laying/pressure, DESIGN-35 §1/§3/§4/§5) ----
// §1: any violated AreaMinePressureRecord invariant (guard + builders).
export const INVALID_MINE_PRESSURE_STATE = "INVALID_MINE_PRESSURE_STATE" as const;
// §3: a laying source missing required technology, inventory, access, control,
// or mission (an ineligible source NEVER gets a silent default).
export const MINE_LAYING_SOURCE_INELIGIBLE = "MINE_LAYING_SOURCE_INELIGIBLE" as const;
// §4: inventory consumption exceeding the source's exact on-hand count.
export const MINE_INVENTORY_INSUFFICIENT = "MINE_INVENTORY_INSUFFICIENT" as const;

// ---- In-slice codes (INC-3: sweeping eligibility/values, §6/§7/§8/§9) ----
// §6: a sweeping ship failing any §6 predicate, or a §7 base-value lookup with
// no shipped equipment definition. Raised by the CALLER of
// minesweepingShipEligible (the eligibility verdict itself returns a reason
// string, never this code, keeping the predicate never-throwing); the
// fail-closed §7/§9 value lookups throw it directly.
export const MINESWEEPING_SHIP_INELIGIBLE = "MINESWEEPING_SHIP_INELIGIBLE" as const;
// §8: a dual-ASW/mine-equipment configuration that is missing or contradicts
// the shipped dual_asw_mine_equipment_v1 modes (e.g. single-purpose equipment
// claiming a mode, or an unknown mode) — fail closed, never a silent default.
export const DUAL_EQUIPMENT_MODE_MISSING = "DUAL_EQUIPMENT_MODE_MISSING" as const;
// §9: mine-type resistance metadata is required but missing (scenario-special
// types are definition-required; no definition is shipped this sprint).
export const MINE_SWEEP_RESISTANCE_MISSING = "MINE_SWEEP_RESISTANCE_MISSING" as const;

// ---- In-slice codes (INC-4: regional sweeping aggregation/allocation, §10) ----
// §10: a mine-pressure record's pressure is reduced by the swept amount. Emitted
// whenever a sweeping allocation consumes positive pressure from a record. INC-7
// owns the MINEFIELD_CLEARED transition at pressure 0; this code is the reduction
// event, distinct from clearance.
export const MINE_PRESSURE_REDUCED = "MINE_PRESSURE_REDUCED" as const;

// ---- In-slice codes (INC-5: defensive standoff + route risk, §16 + §13) ----
// §16: a pressure-derived defensive standoff level above "none" is ACTIVE. Emitted
// as a flag in the computeDefensiveStandoff result when level > none; it NEVER
// auto-cancels an accepted operation (documented in defensive-standoff.ts — there
// is no such mechanic to cancel).
export const MINE_DEFENSIVE_STANDOFF_ACTIVE = "MINE_DEFENSIVE_STANDOFF_ACTIVE" as const;
// §13: a route-risk value is CREATED for a pressure-covered route edge. Emitted in
// the computeRouteRiskBp result when routeRiskBp > 0; it does NOT automatically deny
// movement (§13: a route-risk check does not auto-deny movement; consumption is
// blocked on DESIGN-25, recorded in ticket 03).
export const MINE_ROUTE_RISK_CREATED = "MINE_ROUTE_RISK_CREATED" as const;

// ---- In-slice marker (INC-5): NOT a §30 code ----
// MINE_STRIKE_RESOLUTION_DEFERRED is a LOCAL marker (mirroring C-1's
// TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED precedent) that a LATER increment
// (INC-6/INC-7 or the C-2 continuation) fires if any caller reaches a
// would-be-strike boundary (e.g. a report/clearance path implying strike application)
// in a slice that ships no strike machinery. INC-5 ships the marker into the catalog
// but DOES NOT fire it — this increment is value-only (standoff level/multiplier,
// route-risk value) and reaches no would-be-strike boundary.
export const MINE_STRIKE_RESOLUTION_DEFERRED = "MINE_STRIKE_RESOLUTION_DEFERRED" as const;

// ---- In-slice codes (INC-6: mine report + misidentification, §19 + §20) ----
// §19/§20: cause estimation produced a report/classification whose confidence is
// BELOW the certain threshold (§20 runs a probabilistic classifier that is
// inherently a guess). DESIGN-35 does NOT ship a numeric certain threshold, so
// it is an AUTHORED constant (MINE_REPORT_CAUSE_CERTAIN_CONFIDENCE_BP = 10_000:
// only fully-certain confidence is "certain"; see mine-report.ts /
// misidentification.ts for the comment-logged authored-vs-shipped decision).
// Emitted as (a) the report's causeUncertain flag when confidenceBp < 10_000 and
// (b) the classifier's decision reasonCode (a weight-based classification is
// ALWAYS a guess — all three §20 outcomes keep positive weight, see
// misidentification.ts).
export const MINE_REPORT_CAUSE_UNCERTAIN = "MINE_REPORT_CAUSE_UNCERTAIN" as const;

// ---- Collected catalog (INC-1..INC-6 shipped set; grows through INC-7,
// set-equality checked in INC-8) ----
export const MINE_REASON_CODES = {
  INVALID_MINE_TYPE_DEFINITION,
  INVALID_MINE_PRESSURE_STATE,
  MINE_LAYING_SOURCE_INELIGIBLE,
  MINE_INVENTORY_INSUFFICIENT,
  MINESWEEPING_SHIP_INELIGIBLE,
  DUAL_EQUIPMENT_MODE_MISSING,
  MINE_SWEEP_RESISTANCE_MISSING,
  MINE_PRESSURE_REDUCED,
  MINE_DEFENSIVE_STANDOFF_ACTIVE,
  MINE_ROUTE_RISK_CREATED,
  MINE_STRIKE_RESOLUTION_DEFERRED,
  MINE_REPORT_CAUSE_UNCERTAIN,
} as const;

export type MineReasonCode = (typeof MINE_REASON_CODES)[keyof typeof MINE_REASON_CODES];

// ---- Recorded §30 in-slice codes owned by later increments (never shipped here) ----
// INC-7 (decay/persistence/knowledge/clearance): MINE_DECAY_POLICY_MISSING,
//   CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING, MINEFIELD_CLEARED.
// INC-8 (records/ordering/contracts/ADR): MINE_WARFARE_INVARIANT_FAILED (also
//   used ambiently as the fail-closed contract-mismatch code, mirroring
//   TORPEDO_STATE_INVARIANT_FAILED — INC-8 formalizes it in the catalog).

// ---- Deferred §30 codes (recorded, never shipped this sprint — C-2
// continuation owns strike resolution, per ticket 03/05) ----
// MINE_BATTLE_HAZARD_GENERATED (§11, tactical), MINE_STRIKE_OCCURRED (§14–15,
// strike application), FRIENDLY_MINE_STRIKE_OCCURRED (§25–26). These three remain
// deferred; the in-slice marker MINE_STRIKE_RESOLUTION_DEFERRED (shipped above, not
// a §30 code) is the local stand-in a later increment fires at a would-be-strike
// boundary until the real §30 strike codes land.

// ---- Reused existing combat-catalog codes (no new record needed) ----
// None referenced by this increment; INC-4+ may reuse existing damage/tactical
// catalog codes per their own scoping.
