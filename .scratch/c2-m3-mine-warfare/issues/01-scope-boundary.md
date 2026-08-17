# Ticket 01 — Scope Boundary

**Type:** decision
**Status:** resolved
**Blocked by:** none

## Question

DESIGN-35 spans mine-pressure state (§1), mine types (§2), mine sources (§3),
laying value (§4), pressure increase (§5), minesweeping eligibility/values/dual
equipment/effective value/regional aggregation (§6–10), battle-mine generation
(§11), resolution order (§12), strategic route risk (§13), mine-strike
eligibility/outcome (§14–15), defensive standoff (§16), battle hazards (§17),
damage/loss application (§18), mine report (§19), misidentification (§20), decay
(§21), post-war persistence (§22), ownership/control changes (§23), mine knowledge
(§24), friendly-fire risk/outcome (§25–26), clearance (§27), records/audit (§28),
canonical ordering (§29), reason codes (§30), and 25 §31 validation items. What is
the first bounded, engine-only vertical slice for the M3 mine-warfare sprint?
(Precedent: C-1 scoped only DESIGN-40's tactical fire-resolution subset.)

## Decision

Ship the **mine-pressure lifecycle** slice:

- `AreaMinePressureRecord` (§1) — full field set, zero-pressure-as-absence rule.
- `MineTypeDefinition` (§2) — all six canonical types as data shapes; content
  version + hash; `INVALID_MINE_TYPE_DEFINITION`.
- Mine sources (§3) — all six canonical source kinds as data; laying-action
  reference fields; `MINE_LAYING_SOURCE_INELIGIBLE`. `SUBMARINE_LAID` source
  eligibility ships as a data type only — full submarine-specific mission
  integration is C-3's concern.
- Mine-laying value (§4) exact integer formula + shipped generic multiplier table.
- Mine-pressure increase/reinforcement (§5) exact formula, weighted freshness
  update (not full reset).
- Minesweeping eligibility (§6), sweeping base values (§7, exact 150/100/80/100/
  60/50/120), dual ASW/mine equipment (§8, exact 10_000/0, 0/10_000, 7_500/7_500,
  9_000/5_000, 5_000/9_000 modes), effective sweeping value (§9) incl. mine-type
  resistance multipliers, regional sweeping aggregation + allocation order (§10).
- Defensive standoff (§16) — **value computation + `mine_defensive_standoff_v1`
  contract only**; no amphibious/blockade consumer exists yet (DESIGN-36
  unassigned, DESIGN-32 basic-only per B10c) so consumption is explicitly deferred,
  not silently dropped.
- Strategic route risk (§13) — **formula only** (`routeRiskBp` as a pure computed
  value); the movement-blocking/consuming mechanic is out of scope (ticket 03).
- Mine report (§19) + misidentification classifier (§20, `underwater_explosion_
  identification_v1`) — these apply to any damaging underwater explosion
  regardless of cause, and this slice's decay/reporting cadence needs them for a
  complete monthly resolution record even before strike resolution exists;
  ship as pure functions.
- Mine decay (§21) exact monthly retention multipliers.
- Post-war persistence (§22) + ownership/control-change dispositions (§23, six
  closed dispositions + `CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`).
- Mine knowledge (§24) — knowledge assertions separate from truth.
- Mine-clearance completion (§27, `MINEFIELD_CLEARED`).
- Records/audit (§28, `MineWarfareResolutionRecord`) + canonical ordering (§29).
- Reason codes (§30, in-slice subset — ticket 05) + the §31 validation items that
  pertain to laying/sweeping/decay/reporting/persistence/knowledge/clearance
  (items 1–9, 17–21, 24–25; strike-related items 10–16, 22–23 are deferred with
  strike resolution).

## Deferred (recorded, never dropped)

- §11 battle-mine hazard generation, §17 `BattleMineHazard`, tactical battle
  mine-strike resolution — **C-2 continuation** (new `@bluewave/combat`
  minute-advance engine stage; see ticket 03).
- §14–15 mine-strike eligibility/outcome **application** (both battle and
  route-transit contexts) — **C-2 continuation**, blocked in the route-transit
  case on DESIGN-25 (deployment/logistics, unassigned/`CONTENT_ONLY`).
- §18 damage/loss application — depends on strike resolution existing; deferred
  alongside.
- §25–26 friendly-fire risk/outcome — shares strike machinery; deferred alongside.
- §12 resolution-order items 1–5 (pre-battle intelligence, pre-battle sweeping
  allocation, pre-battle controlled-mine preparation, battle-mine hazard
  generation, battle mine-strike resolution) — battle-specific, deferred with
  strike resolution. Items 6–11 (monthly laying, route checks [value only], post-
  operation sweeping, decay, knowledge/reports, persistence/hash) are in scope.
- Amphibious/blockade consumption of standoff levels — deferred until those
  systems exist (DESIGN-36 unassigned, DESIGN-32 basic-only).
- Submarine-laid mine operational/mission mechanics — C-3.
- Scenario-special mine type content — content track.
- Command-layer mine-laying orders/mission plumbing — later command/AI slice.

## Rationale / authority

The slice boundary follows an accepted-dependency test, not an arbitrary line:
every item shipped this sprint is a pure function of already-existing inputs
(area, participant, mine type, ship state, campaign month). Every deferred item
either needs a **not-yet-built** tactical engine stage or a **not-yet-accepted**
strategic mechanic (DESIGN-25). Shipping strike resolution now would force
inventing one of those two missing mechanics as an undocumented side effect —
prohibited scope expansion into a deferred subsystem
(`.ai/AUTONOMOUS-AGENT.md` stop conditions). This produces a genuinely coherent,
independently testable vertical slice (a minefield is laid, reinforced, swept,
decays, is reported/misidentified, persists through war/ownership change, and can
be cleared) rather than a half-built strike mechanic with no consumer.
