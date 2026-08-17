# Wayfinder Map: M3 Submarines (C-3)

## Destination

Scope the first coherent **vertical slice of DESIGN-34 (`docs/rules/submarines.md`)**
as an engine-only, deterministic **strategic submarine-operations lifecycle** in
`@bluewave/combat` (new `packages/combat/src/submarines/`): strategic
representation (persistent unit vs flotilla pool) → type definitions → policies →
mission eligibility → reliability → base proximity → type remote-efficiency →
long-range ASW vulnerability → strategic mission effectiveness → coastal range
restriction → sea-state profile (scale + detection/observation/attack/surface-
snorkel multipliers) → heavy-ship-to-destroyer screening balance → strategic
attack-opportunity **selection** (value/keyed-decision only) → submarine-laid
mine-laying (produces `AreaMinePressureRecord` via C-2's model + consumes
inventory) → records/ordering/reason codes. **Tactical allocation and loss
application, post-battle returning-ship attacks, ASW resolution application, and
friendly-fire risk/outcome are explicitly deferred** — see ticket 03. No campaign
snapshot schema change; no phase-engine wiring this sprint (mirrors the
B-5-before-B-6 boundary). Golden hashes must remain unchanged.

## Notes

- Domain: `@bluewave/combat` (pure, platform-independent, deterministic).
  Precedent for a *strategic/monthly* mechanic living in `@bluewave/combat`:
  `packages/combat/src/weather/strategic-state.ts` (ADR-0022) + the C-2
  `packages/combat/src/mines/` module (ADR-0033) — same placement.
- DESIGN-34 is 464 lines / 28 sections — comparable size to DESIGN-35 (mines,
  611 lines) and DESIGN-40 (torpedoes, 628 lines). DESIGN-40 was "too large for
  one sprint"; DESIGN-34 needs the same scope-carving discipline. Mirrors the
  C-1 (tactical fire-resolution only) and C-2 (pressure lifecycle only)
  precedent.
- **Key finding driving the scope boundary (ticket 03):** several DESIGN-34
  sections are battle-integration or strategic-consumer dependent:
  - §2 tactical allocation + §3 tactical loss application need an **accepted
    battle manifest** (battle-integration slice, analogous to C-1's torpedo
    tactical context) and provenance wiring — deferred.
  - §21 post-battle returning-ship interception needs the battle-attack machinery
    and a "battle ended in this area" integration point — deferred.
  - §22 ASW **resolution** needs enemy ASW strength, trade-protection coverage,
    and ASW intelligence under **DESIGN-29 (intelligence-and-knowledge,
    unassigned)** — the vulnerability/sea-state *multipliers* ship as explicit
    tables, but the full resolution application is deferred.
  - §23–24 friendly-fire risk/outcome shares the same knowledge/identification
    machinery (DESIGN-29, unassigned) — deferred.
  - §19 strategic attack **loss application** (merchant-loss resolution, warship
    battle opportunity) "MUST NOT apply a warship loss directly without the
    owning battle or attack resolver" — so only the **opportunity selection**
    (policy weights + keyed stream `submarine/month/war/area/attack_opportunity`)
    ships as a pure decision producing typed opportunities; no loss application.
  Building these against nothing would invent a missing mechanic's shape as a
  side effect — documented scope boundary, not a silent drop.
- §20 submarine-laid mine laying produces an `AreaMinePressureRecord` (DESIGN-14)
  and consumes exact inventory. C-2 already ships `AreaMinePressureRecord` +
  `SUBMARINE_LAID` as a data type; this slice wires the submarine-side eligibility
  + record creation + inventory consumption as pure functions calling into
  C-2's mine model (a cross-module `submarines → mines` dependency within
  `@bluewave/combat`). No mine-**strike** resolution (C-2 continuation owns that).
- DESIGN-55 §4 confirms M3 = torpedoes, mines, submarines, coastal defenses,
  smoke, detailed damage control (`docs/delivery/release-scope-and-implementation-order.md`).
- Skills: `/domain-modeling` for the `SubmarineStrategicAsset`/`SubmarineOperationsRecord`
  shape; research skill **not invoked as a background agent** — DESIGN-34's
  constants are already exact shipped integers (see
  `docs/research/c3-m3-submarines.md`).
- This is the **current M3 frontier** after C-1 and C-2 COMPLETE. C-3 scoping is
  independent of any concurrent session's in-flight work in the shared tree
  (new module at `packages/combat/src/submarines/`, disjoint from
  `torpedoes/`, `mines/`, `weather/`, and the concurrent `phase-engine`/`events`
  hardening edits).
- ADR required at implementation time: the C-3 scope/integration boundary + the
  tactical/ASW/friendly-fire deferral rationale + reason-code/constant policy
  (mirrors ADR-0018/0020/0029/0031/0033).

## Decisions so far

- [Scope Boundary](issues/01-scope-boundary.md) — **resolved.** Ships the
  **strategic submarine-operations lifecycle**: strategic representation (§1),
  type definitions (§4), policies (§5, weights sum to 10_000), mission eligibility
  (§6), reliability (§7), base proximity bands (§8), type remote-efficiency (§9),
  long-range ASW vulnerability (§10, 10_000..12_500 bp), strategic mission
  effectiveness (§11, one FLOOR), coastal range restriction (§12), sea-state scale
  + detection/observation/attack/surface-snorkel multipliers (§13–17), heavy-ship
  screening balance (§18), strategic attack-opportunity **selection** value-only
  (§19), submarine-laid mine laying → `AreaMinePressureRecord` + inventory
  consumption (§20), records (§25), canonical ordering (§26), reason codes (§27,
  in-slice subset), and the §28 validation items pertaining to this slice.
  **Deferred:** tactical allocation (§2), tactical loss application (§3),
  post-battle returning-ship interception (§21), ASW resolution application (§22),
  friendly-fire risk/outcome (§23–24), strategic attack **loss application** (§19
  losses) — all to later slices (ticket 03).
- [Phase / Engine Integration Boundary](issues/02-phase-integration-boundary.md) —
  **resolved.** Ships as a pure function set in `@bluewave/combat`
  (`packages/combat/src/submarines/`), **not** wired into `phase-engine` or
  `CampaignSnapshot` this sprint — mirrors B-5→B-6 / C-2 sequencing. No snapshot
  schema change; no new phase registered. Goldens unchanged.
- [Tactical / ASW / Friendly-Fire Deferral](issues/03-resolution-deferral.md) —
  **resolved.** §2–3 (tactical allocation/loss), §21 (returning-ship), §22 (ASW
  resolution), §23–24 (friendly-fire), and §19 strategic **loss application** are
  deferred because each needs a not-yet-built battle-attack machinery,
  DESIGN-29 intelligence, or an accepted battle manifest. The vulnerability /
  sea-state / screening **values** and the attack-opportunity **selection** ship
  as pure computations with no consumer; nothing is fabricated.
- [Sea-State Profile Policy](issues/04-sea-state-profile.md) — **resolved.** All
  §13–17 sea-state scale + detection/observation/attack/surface-snorkel
  multipliers are exact DESIGN-34 shipped integers; no BALANCE TARGET, no research
  needed; sea-state attack modifiers never alter torpedo warhead damage/speed/
  range (fail-closed guard); §17 sea state 8–9 prohibitions ship as a predicate +
  `SUBMARINE_SEA_STATE_OPERATION_PROHIBITED`.
- [Reason Codes & Contracts](issues/05-reason-codes-contracts.md) — **resolved.**
  New `packages/combat/src/submarines/reasonCodes.ts` shipping the DESIGN-34 §27
  in-slice codes with a set-equality partition test; `submarine_*_v1` versioned
  contracts + `validate*Contract` fail-closed guards; `submarine_strategic_asset_v1`,
  `submarine_types_v1`, `submarine_policies_v1`, `submarine_missions_v1`,
  `submarine_reliability_v1`, `submarine_proximity_v1`, `submarine_remote_efficiency_v1`,
  `submarine_long_range_asw_vulnerability_v1`, `submarine_effectiveness_v1`,
  `submarine_sea_state_v1`, `submarine_screening_balance_v1`,
  `submarine_attack_opportunity_v1`, `submarine_mine_laying_v1`,
  `submarine_friendly_identification_v1` (value-only).
- [Content/Constant Policy & Research Scope](issues/06-content-constant-policy.md) —
  **resolved.** No background research agent invoked; DESIGN-34's mechanical
  constants are already exact shipped integers (unlike DESIGN-40's open
  torpedo-model catalog). `docs/research/c3-m3-submarines.md` records this finding
  plus light historical framing for the five canonical submarine types, explicitly
  flagged as non-normative context, not a grounding requirement.

## Not yet specified (later slices / follow-up tickets)

- **Tactical submarine allocation + loss application** (§2–3): battle-manifest
  provenance (persistent-unit one-to-one / flotilla-pool exact-quantity), asset
  reservation, `SUBMARINE_ASSET_DOUBLE_ALLOCATED` / `SUBMARINE_PROVENANCE_INVALID` —
  a battle-integration slice sequenced after a battle-manifest/attack-machinery
  stage exists (analogous to C-1's torpedo tactical context wiring).
- **Post-battle returning-ship interception** (§21) — needs post-battle attack
  machinery + a keyed decision + battle-local attack manifest.
- **ASW resolution application** (§22) — needs enemy ASW strength, trade-protection
  coverage, DESIGN-29 intelligence, screening consumer; the §10 vulnerability and
  §14 detection multipliers ship this sprint as tables.
- **Friendly-fire identification risk + outcomes** (§23–24) —
  `submarine_friendly_identification_v1` base probability (500 bp) ships as a
  value-only formula this sprint; the risk/outcome application needs DESIGN-29
  knowledge/ROE + ASW contacts, deferred.
- **Phase-engine/snapshot wiring** — `submarine_operations` phase +
  `SubmarineStrategicAsset[]` on `CampaignSnapshot`, deferred to whenever a
  later slice lands (mirrors B-6's weather wiring).
- **Command-layer submarine mission/policy orders** — later command/AI slice.
- **Missile submarines (M5)** — `MISSILE` type data ships; missile-payload mechanics
  are E-track.

## Out of scope for C-3

- Tactical battle attack machinery / battle manifest integration (§2–3, §21) —
  later battle-integration slice.
- ASW resolution application + friendly-fire risk/outcome (§22–24) — blocked on
  DESIGN-29 (intelligence, unassigned) + ASW screening consumers.
- Strategic attack **loss application** (§19 losses) — needs owning battle/attack
  resolver; only opportunity *selection* ships (value-only).
- Mine-strike resolution (C-2 continuation owns), phase/snapshot wiring,
  command-layer orders, missile-payload mechanics (E-track), production-pack YAML
  changes (content track).
