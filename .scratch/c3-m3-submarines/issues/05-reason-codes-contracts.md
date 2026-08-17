# Ticket 05 — Reason Codes & Contracts

**Type:** decision
**Status:** resolved
**Blocked by:** 01

## Question

DESIGN-34 §27 requires 14 reason codes. Which ship in this slice, which are
deferred, and what versioned contracts/validate guards accompany them?

## Decision

- **New `packages/combat/src/submarines/reasonCodes.ts`** shipping the DESIGN-34
  §27 in-slice codes with a `reason-codes-submarines.test.ts` set-equality
  partition test (in-slice / deferred / catalog) preventing silent addition, per
  the C-2/C-1 precedent.

**In-slice (all 14 §27 codes):** `INVALID_SUBMARINE_REPRESENTATION`,
`SUBMARINE_ASSET_DOUBLE_ALLOCATED` (predicate shipped; full battle-manifest
enforcement deferred), `SUBMARINE_PROVENANCE_INVALID` (predicate shipped; loss
application deferred), `SUBMARINE_MISSION_INELIGIBLE`,
`COASTAL_SUBMARINE_RANGE_RESTRICTED`, `LONG_RANGE_ASW_VULNERABILITY_MISSING`,
`SUBMARINE_RELIABILITY_INSUFFICIENT`, `SUBMARINE_FUEL_INSUFFICIENT`,
`SUBMARINE_ATTACK_OPPORTUNITY_CREATED`, `SUBMARINE_MINE_INVENTORY_INSUFFICIENT`,
`SUBMARINE_ASW_CONTACT_RESOLVED` (value/predicate surface), 
`SUBMARINE_FRIENDLY_FIRE_INCIDENT` (value-only surface),
`SUBMARINE_SEA_STATE_OPERATION_PROHIBITED`, `SUBMARINE_STATE_INVARIANT_FAILED`.
Plus a documented local marker `SUBMARINE_RESOLUTION_DEFERRED` (fires if a caller
reaches a would-be-deferred boundary, per B-3/C-1 "eligibility predicate deferred"
precedent).

**Deferred (recorded, owned by later slices):** any §27 codes whose full
application needs battle/ASW/friendly-fire machinery are surfaced as predicates/
value-only here and fully enforced in the later battle-integration + DESIGN-29
slices — none are silently dropped.

- **Versioned contracts + validate guards:** `submarine_strategic_asset_v1`,
  `submarine_types_v1`, `submarine_policies_v1`, `submarine_missions_v1`,
  `submarine_reliability_v1`, `submarine_proximity_v1`, `submarine_remote_efficiency_v1`,
  `submarine_long_range_asw_vulnerability_v1`, `submarine_effectiveness_v1`,
  `submarine_sea_state_v1`, `submarine_screening_balance_v1`,
  `submarine_attack_opportunity_v1`, `submarine_mine_laying_v1`,
  `submarine_friendly_identification_v1` (value-only) — each with
  `SHIPPED_*_CONTRACT` + `validate*Contract` fail-closed guard.

## Rationale / authority

Mirrors ADR-0031 (C-1) and ADR-0033 (C-2): authoritative §27 surface with
set-equality protection; explicit in-slice vs deferred partition recorded in the
C-3 ADR; no code is dropped or invented.
