# Ticket 05 — Reason Codes & Content Constants

**Type:** decision
**State:** RESOLVED
**Blocked by:** 04

## Question
Which DESIGN-41 §47 reason codes ship in-slice, and what is the content
deliverable?

## Decision
- **In-slice §47 codes (new, recorded in ADR-0021):** `INVALID_SHIP_DAMAGE_STATE`,
  `DAMAGE_RESOLUTION_FAILED`, `DAMAGE_HIT_LOCATION_INVALID`,
  `DAMAGE_PROTECTION_INTERACTION_INVALID`, `DAMAGE_COMPONENT_OUT_OF_SCOPE`,
  `DAMAGE_SECONDARY_HAZARD_CREATED`, `FLOODING_SOURCE_CREATED`,
  `FIRE_SOURCE_CREATED`, `SHIP_SINKING`, `SHIP_FOUNDERED`,
  `DAMAGE_STATE_INVARIANT_FAILED`, plus DESIGN-39 armor codes:
  `ARMOR_ZONE_MAXIMUM_MISSING`, `ARMOR_THICKNESS_LIMIT_EXCEEDED`,
  `SPLINTER_PROTECTION_NOT_QUALIFIED` (the three §32 codes B-3 recorded as
  deferred — they land here, recorded in ADR-0021), and a new
  `ARMOR_QUALITY_MULTIPLIER_MISSING` (recorded, versioned). **Reused existing:**
  `TACTICAL_STATE_INVARIANT_FAILED` (state-invariant guard), `INVALID_TACTICAL_CLOCK`,
  `INVALID_TACTICAL_TIME_CONTRACT` (minute-advance clock), `GUNNERY_*` event seam.
- **Deferred §47 codes (recorded → M3/C-5, never fabricated):**
  `DAMAGE_SECONDARY_HAZARD_CREATED` stays in-slice only for the magazine class;
  `FLOODING_HIGH_SPEED_LOSS_CHECK`, `CARRIER_OPERATIONS_OBSTRUCTED_BY_FIRE`,
  `ALUMINUM_SUPERSTRUCTURE_FIRE_VULNERABILITY`, `SHIP_MISSION_KILLED`,
  `SHIP_STABILIZED`, `SHIP_ABANDONED`, `SHIP_SCUTTLED`, `SHIP_CAPTURED`,
  `SHIP_RECOVERED`, `SURVIVOR_RESCUE_INELIGIBLE`, `SURVIVOR_RESCUE_COMPLETED`,
  `SINKING_CREDIT_NOT_YET_CONFIRMED`, `DAMAGE_*` flooding/fire-resolution codes.
- A `reason-codes-damage.test.ts` **set-equality check** against DESIGN-41 §47 +
  DESIGN-39 §32 + the existing combat catalog prevents silent addition (AC pattern
  from B-2/B-3).
- **Content deliverable:** ship armor/damage tables as engine versioned constants
  (`armor_v1`, `damage_v1` + `SHIPPED_ARMOR_CONTRACT`/`SHIPPED_DAMAGE_CONTRACT` +
  validate guards), grounded in `docs/research/b4-m2-armor-damage.md`: armor zone
  maxima, `thick_armor_manufacturing_v1` (7 500 bp excess), splinter 2-in
  threshold, fire/flooding creation multipliers (§20 fire-risk + §15 flooding
  multiplier tables are needed for creation-record typing and are BALANCE
  constants), armor-technology quality-multiplier families (iron → compound →
  Harvey → Krupp/KC → post-KC) grounded in armor-history sources. No
  production-pack YAML change; goldens unchanged.

## Rationale / authority
DESIGN-41 §47/§48, DESIGN-39 §32 (deferred armor codes land here per B-3 spec
§1.4/§3), ENGINEERING-CONTRACT ADR + versioned-constant rule. Mirrors B-2
(reason-codes.test.ts) and B-3 (AC-10 set-equality) patterns.

## Consequence
Every new code + authorable constant is a recorded versioned-ruleset decision in
ADR-0021; silent addition is prevented by the set-equality test.