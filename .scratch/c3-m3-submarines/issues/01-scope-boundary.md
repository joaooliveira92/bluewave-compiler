# Ticket 01 — Scope Boundary

**Type:** decision
**Status:** resolved
**Blocked by:** none

## Question

DESIGN-34 spans strategic representation (§1), tactical allocation (§2), tactical
loss application (§3), submarine types (§4), policies (§5), operational missions
(§6), reliability (§7), base proximity bands (§8), type remote-efficiency (§9),
long-range ASW vulnerability (§10), strategic mission effectiveness (§11), coastal
submarines (§12), sea-state scale (§13) + detection/observation/attack/surface-
snorkel multipliers (§14–17), heavy-ship-to-destroyer screening balance (§18),
merchant/warship attacks (§19), mine laying (§20), post-battle returning-ship
attack (§21), ASW resolution (§22), friendly-fire identification risk (§23) +
outcomes (§24), records/reports (§25), canonical ordering (§26), reason codes
(§27), and 24 §28 validation items. What is the first bounded, engine-only vertical
slice for the M3 submarine sprint? (Precedent: C-1 scoped only DESIGN-40's tactical
fire-resolution subset; C-2 scoped only DESIGN-35's pressure lifecycle.)

## Decision

Ship the **strategic submarine-operations lifecycle** slice:

- `SubmarineStrategicAsset` (§1) — full field set (persistent unit vs flotilla
  pool); exactly one representation; `INVALID_SUBMARINE_REPRESENTATION`.
- `SubmarineTypeDefinition` (§4) — all five canonical types (`COASTAL`,
  `MEDIUM_RANGE`, `LONG_RANGE`, `MINELAYING`, `MISSILE`) with range class,
  remote-efficiency profile, ASW-vulnerability profile, mission eligibility,
  base-support requirement, tactical projection, technology prerequisites.
- Submarine policies (§5) — three policies (`FLEET_SUPPORT`, `PRIZE_RULES`,
  `UNRESTRICTED`) with exact target weights summing to 10_000; policy change =
  accepted command, effective next trade-warfare resolution.
- Operational missions (§6) — seven canonical missions; eligibility predicate
  (`SUBMARINE_MISSION_INELIGIBLE`).
- Reliability (§7) — integer 0..100 + shipped operational multiplier table; below
  `20` prohibits offensive deployment (`SUBMARINE_RELIABILITY_INSUFFICIENT`).
- Base proximity bands (§8) — `LOCAL`/`REGIONAL`/`REMOTE`/`EXTREME_REMOTE`
  route-edge classification.
- Type remote-efficiency multipliers (§9) — exact table; coastal `0` → mission-
  ineligible in that band.
- Long-range ASW vulnerability (§10) — exact 10_500/10_750/11_000/11_500 by
  proximity; permitted range 10_000..12_500 bp; `LONG_RANGE_ASW_VULNERABILITY_MISSING`.
- Strategic mission effectiveness (§11) — exact formula, one `FLOOR`, multipliers
  versioned.
- Coastal submarine range restriction (§12) — normal-movement predicate +
  `COASTAL_SUBMARINE_RANGE_RESTRICTED`; no chained exceptions/remote raiding.
- Sea-state profile (§13–17) — scale 0..9 + categories + detection/observation/
  attack/surface-snorkel multiplier tables (ticket 04); §17 sea state 8–9
  prohibition predicate + `SUBMARINE_SEA_STATE_OPERATION_PROHIBITED`.
- Heavy-ship-to-destroyer screening balance (§18) — exact `screenRatioBp` formula
  + opportunity-multiplier table.
- Strategic attack-opportunity **selection** (§19, value-only) — policy weights +
  keyed stream `submarine/month/war/area/attack_opportunity` producing typed
  opportunities (`SUBMARINE_ATTACK_OPPORTUNITY_CREATED`); **no loss application**
  (needs owning battle/attack resolver — deferred).
- Submarine-laid mine laying (§20) — eligibility + `AreaMinePressureRecord`
  creation via C-2's mine model + exact inventory consumption
  (`SUBMARINE_MINE_INVENTORY_INSUFFICIENT`).
- Records (§25 `SubmarineOperationsRecord`) + canonical ordering (§26) + reason
  codes (§27, in-slice subset — ticket 05) + the §28 validation items that pertain
  to representation/type/policy/mission/reliability/proximity/efficiency/
  vulnerability/effectiveness/sea-state/screening/opportunity/mine-laying/records
  (items 1–8, 11–18, 23–24; battle/ASW/friendly-fire items 9–10, 19–22 deferred).

## Deferred (recorded, never dropped)

- §2 tactical allocation + §3 tactical loss application — **battle-integration
  slice** (needs accepted battle manifest + provenance wiring; ticket 03).
- §21 post-battle returning-ship interception — needs battle-attack machinery +
  keyed decision + battle-local manifest.
- §22 ASW **resolution application** — needs enemy ASW strength, trade-protection
  coverage, DESIGN-29 intelligence; §10/§14 multipliers ship as tables.
- §23–24 friendly-fire risk/outcome application — needs DESIGN-29 knowledge/ROE +
  ASW contacts; base `submarine_friendly_identification_v1` (500 bp) ships value-only.
- §19 strategic attack **loss application** — needs owning battle/attack resolver.
- §20 mine **strike** resolution — C-2 continuation owns.
- Phase-engine/snapshot wiring — deferred (mirrors B-5→B-6).
- Command-layer submarine mission/policy orders — later command/AI slice.
- Missile-payload mechanics — E-track (M5).

## Rationale / authority

The slice boundary follows an accepted-dependency test: every item shipped this
sprint is a pure function of already-existing inputs (submarine asset state, type,
policy, mission, area/proximity, sea state, campaign month, C-2 mine model). Every
deferred item either needs a **not-yet-built** battle/attack machinery, a
**not-yet-accepted** DESIGN-29 intelligence mechanic, or an owning resolver.
Shipping those now would force inventing a missing mechanic's shape as an
undocumented side effect — prohibited scope expansion
(`.ai/AUTONOMOUS-AGENT.md` stop conditions). This yields a coherent, independently
testable vertical slice (a submarine is represented, typed, assigned a policy and
mission, assessed for reliability/proximity/efficiency/effectiveness, exposed to
sea state and screening, offered attack opportunities, and can lay mines) rather
than a half-built attack/ASW mechanic with no consumer.
