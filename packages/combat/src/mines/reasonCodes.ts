//packages/combat/src/mines/reasonCodes.ts
// DESIGN-35 §30 subset relevant to the mine module, kept separate from the
// top-level combat catalog (src/reasonCodes.ts) so the C-2 set-equality guard
// (reason-codes-mines.test.ts, INC-8 deliverable, per ticket 05) is not grown
// without review. Per ticket 05, all 18 §30 codes are in-slice for this sprint
// (mine warfare's catalog is lifecycle-dominated, not strike-dominated); INC-1
// ships the module plus the one code its own increment exercises
// (INVALID_MINE_TYPE_DEFINITION). The remaining in-slice codes are owned by
// INC-2..INC-7 and recorded below, never shipped here. The full partition
// (in-slice / deferred / reused combat catalog, disjointness) is verified by
// INC-8's set-equality test.

// ---- In-slice codes (INC-1) ----
export const INVALID_MINE_TYPE_DEFINITION = "INVALID_MINE_TYPE_DEFINITION" as const;

// ---- Collected catalog (INC-1 shipped set; grows through INC-7, set-equality
// checked in INC-8) ----
export const MINE_REASON_CODES = {
  INVALID_MINE_TYPE_DEFINITION,
} as const;

export type MineReasonCode = (typeof MINE_REASON_CODES)[keyof typeof MINE_REASON_CODES];

// ---- Recorded §30 in-slice codes owned by later increments (never shipped here) ----
// INC-2 (sources/laying/pressure): INVALID_MINE_PRESSURE_STATE,
//   MINE_LAYING_SOURCE_INELIGIBLE, MINE_INVENTORY_INSUFFICIENT.
// INC-3 (sweeping eligibility/values): MINESWEEPING_SHIP_INELIGIBLE,
//   DUAL_EQUIPMENT_MODE_MISSING, MINE_SWEEP_RESISTANCE_MISSING.
// INC-4 (sweeping aggregation): MINE_PRESSURE_REDUCED.
// INC-5 (standoff/route risk): MINE_ROUTE_RISK_CREATED (value-only per ticket
//   01), MINE_DEFENSIVE_STANDOFF_ACTIVE (value-only).
// INC-6 (report/misidentification): MINE_REPORT_CAUSE_UNCERTAIN.
// INC-7 (decay/persistence/knowledge/clearance): MINE_DECAY_POLICY_MISSING,
//   CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING, MINEFIELD_CLEARED.
// INC-8 (records/ordering/contracts/ADR): MINE_WARFARE_INVARIANT_FAILED (also
//   used ambiently as the fail-closed contract-mismatch code, mirroring
//   TORPEDO_STATE_INVARIANT_FAILED — INC-8 formalizes it in the catalog).

// ---- Deferred §30 codes (recorded, never shipped this sprint — C-2
// continuation owns strike resolution, per ticket 03/05) ----
// MINE_BATTLE_HAZARD_GENERATED (§11, tactical), MINE_STRIKE_OCCURRED (§14–15,
// strike application), FRIENDLY_MINE_STRIKE_OCCURRED (§25–26). A documented
// in-slice marker, MINE_STRIKE_RESOLUTION_DEFERRED, is recorded for INC-5/INC-7
// to ship (not a §30 code — a local marker mirroring C-1's
// TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED precedent).

// ---- Reused existing combat-catalog codes (no new record needed) ----
// None referenced by this increment; INC-2+ may reuse existing damage/tactical
// catalog codes per their own scoping.
