# Ticket 05 — Reason Codes & Contracts

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary

## Question

What reason-code surface and versioned constant contracts does the C-2
mine-pressure-lifecycle slice ship, and what does it record-but-not-ship (mirrors
C-1 ticket 06)?

## Decision

- **Reason codes:** new `packages/combat/src/mines/reasonCodes.ts` shipping the
  DESIGN-35 §30 codes relevant to this slice, with a
  `test/mines/reason-codes-mines.test.ts` set-equality partition (hand-code the
  full §30 list of 18 required codes; partition into `IN_SLICE` + `DEFERRED`;
  assert the union covers §30 with no gaps/overlap, shipped catalog == in-slice,
  no deferred code shipped, reused combat-catalog codes not redefined).

  **In-slice (18 of 18 §30 codes are actually relevant to this slice — mine
  warfare's reason-code catalog is dominated by lifecycle codes, not strike
  codes):** `INVALID_MINE_TYPE_DEFINITION`, `INVALID_MINE_PRESSURE_STATE`,
  `MINE_LAYING_SOURCE_INELIGIBLE`, `MINE_INVENTORY_INSUFFICIENT`,
  `MINESWEEPING_SHIP_INELIGIBLE`, `DUAL_EQUIPMENT_MODE_MISSING`,
  `MINE_SWEEP_RESISTANCE_MISSING`, `MINE_PRESSURE_REDUCED`,
  `MINE_ROUTE_RISK_CREATED` (value-only per ticket 01 — the code fires when the
  formula computes a positive `routeRiskBp`, independent of any consuming
  movement check), `MINE_DEFENSIVE_STANDOFF_ACTIVE` (value-only, same pattern),
  `MINE_REPORT_CAUSE_UNCERTAIN`, `MINE_DECAY_POLICY_MISSING`,
  `CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`, `MINEFIELD_CLEARED`,
  `MINE_WARFARE_INVARIANT_FAILED`.

  **Deferred (recorded, not shipped this sprint — owned by the C-2
  continuation):** `MINE_BATTLE_HAZARD_GENERATED` (§11, tactical),
  `MINE_STRIKE_OCCURRED` (§14–15, strike application), `FRIENDLY_MINE_STRIKE_
  OCCURRED` (§25–26). A documented in-slice marker,
  `MINE_STRIKE_RESOLUTION_DEFERRED`, is added (not a §30 code — an explicit local
  marker, mirroring C-1's `TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED` precedent) so
  any caller that reaches a would-be-strike boundary in this slice's functions
  fails closed with a traceable code rather than silently no-op'ing.

- **Contracts:** versioned `*_v1` contracts + `SHIPPED_*_CONTRACT` +
  `validate*Contract` fail-closed guards for: `mine_pressure_v1`
  (§1 record shape + §4–5 laying/reinforcement formulas), `mine_sweeping_v1`
  (§6–10 eligibility/base-values/aggregation), `dual_asw_mine_equipment_v1`
  (§8, DESIGN-35 names it explicitly), `mine_defensive_standoff_v1` (§16,
  DESIGN-35 names it explicitly), `underwater_explosion_identification_v1`
  (§20, DESIGN-35 names it explicitly), `mine_decay_v1` (§21 retention
  multipliers), `mine_type_definitions_v1` (§2 six canonical type shapes with
  DESIGN-35's own exact constants — see ticket 04).

- **Constant grounding policy:** exact shipped integers from DESIGN-35 §4–10,
  §15 (referenced for type-definition wiring), §16, §21 are authoritative — no
  BALANCE override (ticket 04). No research-grounded catalog is required this
  sprint (ticket 06 / `docs/research/c2-m3-mine-warfare.md`).

## Deferred (recorded)

- Battle-hazard and strike-outcome reason codes (`MINE_BATTLE_HAZARD_GENERATED`,
  `MINE_STRIKE_OCCURRED`, `FRIENDLY_MINE_STRIKE_OCCURRED`) — C-2 continuation.
- `underwater_tube_hit_hazard_v1`-style torpedo-specific contracts are NOT
  touched or referenced by this slice (no cross-module coupling to
  `packages/combat/src/torpedoes/`).

## Rationale / authority

DESIGN-35 §30 lists exactly 18 required codes; unlike DESIGN-40 (torpedoes),
where the §29 catalog split roughly evenly between in-slice and deferred codes,
DESIGN-35's catalog is almost entirely lifecycle-oriented (only 3 of 18 codes are
strike-specific), so this slice ships 15 of 18 directly plus 2 value-only codes
that fire without a consumer (`MINE_ROUTE_RISK_CREATED`,
`MINE_DEFENSIVE_STANDOFF_ACTIVE`) — only the 3 strike-outcome codes are deferred.
The set-equality test pattern mirrors `reason-codes-torpedoes.test.ts` /
`reason-codes-gunnery.test.ts` / `reason-codes-damage.test.ts` precedent.
