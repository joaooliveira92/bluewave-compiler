# C-3 Spec — M3 Submarines: Strategic Submarine-Operations Lifecycle (M3 Advanced Surface Warfare)

- **Sprint:** C-3 (`.ai/SPRINT-PLAN.md` Track C row 3)
- **Kind:** scoping (this document is the implementation spec produced by the C-3 scoping sprint; C-3-IMPL executes it)
- **Governing docs:** DESIGN-34 (`docs/rules/submarines.md`) — **strategic submarine-operations lifecycle slice only** (strategic representation §1, type definitions §4, policies §5, missions §6, reliability §7, base proximity §8, type remote-efficiency §9, long-range ASW vulnerability §10, strategic mission effectiveness §11, coastal range restriction §12, sea-state scale §13 + detection/observation/attack/surface-snorkel multipliers §14–17, screening balance §18, attack-opportunity selection §19 value-only, submarine-laid mine laying §20, records §25, canonical ordering §26, reason codes §27); cross-refs DESIGN-14 (AreaMinePressureRecord — produced by §20 via C-2's mine model), DESIGN-29 (intelligence — blocks ASW/friendly-fire application, unassigned), DESIGN-07 (integer arithmetic), DESIGN-55 §4 (`docs/delivery/release-scope-and-implementation-order.md` — M3 scope: torpedoes/mines/submarines/coastal-defenses/smoke/detailed-damage-control).
- **Baseline:** M2 COMPLETED (B-6 gate, 2026-08-15). C-1 (torpedoes) COMPLETE, C-2 (mines) COMPLETE (both 2026-08-16). **Not touched by this sprint:** `packages/combat/src/torpedoes/`, `packages/combat/src/mines/` (only *read* for C-2's `AreaMinePressureRecord` type), `packages/combat/src/weather/`, and any concurrent `phase-engine`/`events` hardening in the shared tree (this sprint writes only new files under `packages/combat/src/submarines/` and `packages/combat/test/submarines/`).
- **Target:** strategic submarine-operations lifecycle reaches `IMPLEMENTED_UNVERIFIED → VERIFIED_NOT_INTEGRATED` (phase-pipeline/campaign-snapshot integration deferred, mirrors the B-5-before-B-6 and C-2 sequencing); no campaign snapshot schema change.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Golden hashes must remain unchanged (no ADR-0007 regeneration).

---

## 1. Scope

C-3 delivers a deterministic, pure **strategic submarine-operations lifecycle**
function set in a new `packages/combat/src/submarines/` module: strategic
representation (persistent unit vs flotilla pool), submarine type definitions,
policies (target weights summing to 10_000), mission eligibility, reliability,
base-proximity bands, type remote-efficiency multipliers, long-range ASW
vulnerability, strategic mission effectiveness (one FLOOR), coastal range
restriction, sea-state profile (scale + detection/observation/attack/surface-
snorkel multipliers), heavy-ship screening balance, strategic attack-opportunity
**selection** (value/keyed-decision only, no loss application), submarine-laid
mine laying (produces `AreaMinePressureRecord` via C-2's model + consumes
inventory), records, canonical ordering, and the DESIGN-34 §27 reason-code surface
for this slice. It ships versioned constants + in-slice reason codes and the C-3
ADR. See `.scratch/c3-m3-submarines/issues/01-scope-boundary.md`,
`02-phase-integration-boundary.md`, and `03-resolution-deferral.md` for the full
reasoning behind excluding tactical/ASW/friendly-fire/loss-application resolution.

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-34 + contract) | Proving test |
|----|-------------------------------------|--------------|
| AC-1 | **Strategic representation** — every submarine capability uses exactly one of `PERSISTENT_UNIT`/`TYPED_FLOTILLA_POOL`; every `SubmarineStrategicAsset` has all §1 fields (stable asset id, owner nation, submarine type, quantity `1` for persistent units, readiness, reliability, current strategic area, home-base id, fuel/supply state, mission policy, damage/loss state, monthly battle-participation count, ruleset version, aggregate hash); missing/mixed representation → `INVALID_SUBMARINE_REPRESENTATION`. | `combat/test/submarines/strategic-representation.test.ts` |
| AC-2 | **Type definitions** — all five canonical types (`COASTAL`/`MEDIUM_RANGE`/`LONG_RANGE`/`MINELAYING`/`MISSILE`) with all §4 fields (range class, remote-efficiency profile, ASW-vulnerability profile, mission eligibility, base-support requirement, tactical projection, technology prerequisites); `MISSILE` maps to `PERSISTENT_UNIT`, the rest to `TYPED_FLOTILLA_POOL` (§1). | `combat/test/submarines/type-definitions.test.ts` |
| AC-3 | **Policies** — three policies (`FLEET_SUPPORT`/`PRIZE_RULES`/`UNRESTRICTED`) with exact target weights (warship/merchant/neutral-incident-multiplier) summing to exactly 10_000 each; policy change requires an accepted command and becomes effective at the next trade-warfare resolution. | `combat/test/submarines/policies.test.ts` |
| AC-4 | **Mission eligibility** — seven canonical missions (`FLEET_INTERDICTION`/`MERCHANT_RAIDING`/`MINE_LAYING`/`RECONNAISSANCE`/`TACTICAL_BATTLE_SUPPORT`/`RETURNING_SHIP_INTERCEPTION`/`MISSILE_PATROL`); eligibility validates type, technology, range, base support, readiness, damage, reliability, fuel, policy, area, war state; ineligible → `SUBMARINE_MISSION_INELIGIBLE`. | `combat/test/submarines/mission-eligibility.test.ts` |
| AC-5 | **Reliability** — integer 0..100; shipped operational multiplier table (0..19:4_000, 20..39:6_000, 40..59:8_000, 60..79:10_000, 80..94:11_000, 95..100:12_000); below 20 prohibits offensive deployment (repair transfer/training/emergency defense only) → `SUBMARINE_RELIABILITY_INSUFFICIENT`. | `combat/test/submarines/reliability.test.ts` |
| AC-6 | **Base proximity bands** — `LOCAL` 0..1, `REGIONAL` 2..3, `REMOTE` 4..6, `EXTREME_REMOTE` ≥7 or no legal support route, by shortest legal route-edge distance; route distance uses authoritative diplomacy/access/canal/choke-point/blockade state. | `combat/test/submarines/proximity.test.ts` |
| AC-7 | **Remote-efficiency multipliers** — exact §9 table (coastal 10_000/7_500/2_500/0; medium 10_000/10_000/7_500/5_000; long 10_000/11_000/12_500/10_000; minelaying 10_000/10_000/8_000/5_000; missile 10_000/10_000/10_000/9_000); coastal `0` → mission-ineligible in that band; long-range remote is exactly 12_500 and extreme-remote 10_000. | `combat/test/submarines/remote-efficiency.test.ts` |
| AC-8 | **Long-range ASW vulnerability** — exact §10 multipliers (LOCAL 10_500, REGIONAL 10_750, REMOTE 11_000, EXTREME_REMOTE 11_500); permitted range 10_000..12_500 bp; applies only to enemy ASW detection/attack-effectiveness on an operational mission; MUST NOT modify submarine hit points/construction cost/tactical weapon damage/friendly detection; missing → `LONG_RANGE_ASW_VULNERABILITY_MISSING`. | `combat/test/submarines/asw-vulnerability.test.ts` |
| AC-9 | **Strategic mission effectiveness** — exact §11 formula `floor(base * typeRemoteEfficiencyBp * reliabilityMultiplierBp * baseSupportMultiplierBp * policyMultiplierBp * intelligenceMultiplierBp * enemyProtectionMultiplierBp * blockadeMultiplierBp / 10_000^7)`; exact rational retained through all multipliers, rounded once with FLOOR; every multiplier explicit + versioned. | `combat/test/submarines/effectiveness.test.ts` |
| AC-10 | **Coastal range restriction** — coastal subs get full local efficiency only in `LOCAL`; during war normal movement only within home area / across one adjacent edge to an area with accessible support base / via typed emergency redeployment; no chained exceptions / remote raiding; violation → `COASTAL_SUBMARINE_RANGE_RESTRICTED`. | `combat/test/submarines/coastal-restriction.test.ts` |
| AC-11 | **Sea-state scale** — integer 0..9; shipped categories (`CALM` 0–1, `OPTIMAL` 2–5, `HEAVY` 6–7, `SEVERE` 8–9); exact optimum band 2–5. | `combat/test/submarines/sea-state-scale.test.ts` |
| AC-12 | **Sea-state detection/observation/attack/surface-snorkel multipliers** — exact §14 detection (0:13_000 … 9:12_500), §15 observation (0:11_000 … 9:3_500), §16 attack (0:10_000, 3:11_000, 4:11_000 … 9:2_500), §17 surface/snorkel (snorkel machinery 7_500, surfaced transit 7_500, sea state 0–1 surfaced detection +12_500) tables; §16 attack modifiers MUST NOT alter torpedo warhead damage/speed/range (fail-closed guard); §17 sea state 8–9 deck-gun attack + surface battery charging prohibited → `SUBMARINE_SEA_STATE_OPERATION_PROHIBITED`. | `combat/test/submarines/sea-state-multipliers.test.ts` |
| AC-13 | **Screening balance** — exact §18 `screenRatioBp = floor(eligibleDestroyerAndEscortStrength * 10_000 / max(1, eligibleHeavyShipStrength))`; heavy ships `BB`/`BC`/`B`/`CV`/`CVL`/`CA`, escorts eligible `DD`/`KE`/ASW-capable `CL`; opportunity multiplier table (ratio <2_500:15_000, 2_500–4_999:12_500, 5_000–7_499:10_000, 7_500–9_999:8_500, ≥10_000:7_500). | `combat/test/submarines/screening-balance.test.ts` |
| AC-14 | **Attack-opportunity selection (value-only)** — §19 opportunity selection uses policy weights + target availability + intelligence + regional protection + mission strength; keyed stream `submarine/month/war/area/attack_opportunity`; creates a typed opportunity record (`SUBMARINE_ATTACK_OPPORTUNITY_CREATED`) — merchant-loss/warship-battle/interception **selection only, no loss application** (DESIGN-34 §19 MUST NOT apply a warship loss directly without owning battle/attack resolver). | `combat/test/submarines/attack-opportunity.test.ts` |
| AC-15 | **Submarine-laid mine laying** — only `MINELAYING` or explicitly capable types execute `MINE_LAYING`; requires mine inventory, technology, legal route, target area, readiness, reliability ≥40, fuel; success creates an `AreaMinePressureRecord` (DESIGN-14 via C-2's model) + consumes exact inventory; insufficient inventory → `SUBMARINE_MINE_INVENTORY_INSUFFICIENT`; no mine-strike resolution (C-2 continuation). | `combat/test/submarines/mine-laying.test.ts` |
| AC-16 | **Friendly-identification (value-only)** — `submarine_friendly_identification_v1` base misidentification probability `500` bp + exact §23 clamp formula; ships as a pure value function only; no risk/outcome application (DESIGN-29-dependent). | `combat/test/submarines/friendly-identification.test.ts` |
| AC-17 | **Records + canonical ordering** — monthly resolution creates one immutable `SubmarineOperationsRecord` with all §25 fields; §26 ordering (wars by id → areas by id → submarine assets by id → missions by priority → targets by id → tactical allocations by battle id → ASW contacts by id → friendly-fire checks by contact+submarine id) via deterministic collection + explicit sort; DB/UI/wall-clock order MUST NOT affect outcomes. | `combat/test/submarines/records.test.ts`, `combat/test/submarines/ordering.test.ts` |
| AC-18 | **Reason-code set-equality** — all 14 §27 codes ship (see §1.4); `reason-codes-submarines.test.ts` partition (in-slice/deferred/catalog) prevents silent addition; every code recorded in the C-3 ADR. | `combat/test/submarines/reason-codes-submarines.test.ts` |
| AC-19 | **No engine/phase integration** — no `phase-engine` registration, no `CampaignSnapshot` schema change, no `@bluewave/combat` minute-advance stage; every function in `packages/combat/src/submarines/` is pure (explicit inputs → explicit outputs); `BattleResolver`/`StrengthCalculator`/existing engine files UNMODIFIED (diff); `mines/`/`torpedoes/`/`weather/` modules not modified. | `combat/test/submarines/integration-boundary.test.ts` |
| AC-20 | **Two-process determinism** — identical inputs produce identical outputs + record hashes across two separate child processes (node-spawn ×2, byte-compared) via the `@bluewave/cross-process-test` pattern (new `run-submarines-child.ts`); only keyed RNG draws (`submarine/month/war/area/attack_opportunity`, `submarine/.../friendly_identification`), no ambient randomness. | `combat/test/submarines/determinism.test.ts` |
| AC-21 | **Contracts + validate guards** — every new constant ships `*_v1` + `SHIPPED_*_CONTRACT` (see §1.3) + `validate*Contract` fail-closed guards. | `combat/test/submarines/contracts.test.ts` |
| AC-22 | **Goldens unchanged** — no snapshot schema/phase change; `verify-golden-hashes.cjs` 10/10; every pre-existing engine/combat file unmodified outside the new `submarines/` module (diff). | orchestrator gate |

### 1.2 In scope

1. **Strategic representation + types + policies + reason codes + contracts seed** (INC-1): `SubmarineStrategicAsset` (§1) + representation rule + `INVALID_SUBMARINE_REPRESENTATION`; `SubmarineTypeDefinition` (§4) five types + `MISSILE`→PERSISTENT_UNIT mapping; §5 policies + `submarine_policies_v1`; in-slice reason codes module seed (AC-1, AC-2, AC-3, AC-18, AC-21 seeds).
2. **Mission eligibility + reliability** (INC-2): §6 seven missions + eligibility predicate + `SUBMARINE_MISSION_INELIGIBLE`; §7 reliability + multiplier table + `SUBMARINE_RELIABILITY_INSUFFICIENT` (AC-4, AC-5).
3. **Proximity + remote-efficiency + long-range ASW vulnerability** (INC-3): §8 base proximity bands; §9 remote-efficiency multipliers; §10 long-range ASW vulnerability + range guard + `LONG_RANGE_ASW_VULNERABILITY_MISSING` (AC-6, AC-7, AC-8).
4. **Strategic mission effectiveness + coastal restriction** (INC-4): §11 formula (one FLOOR); §12 coastal range restriction + `COASTAL_SUBMARINE_RANGE_RESTRICTED` (AC-9, AC-10).
5. **Sea-state profile** (INC-5): §13 scale/categories; §14–17 detection/observation/attack/surface-snorkel tables + §16 fail-closed guard + §17 predicate + `SUBMARINE_SEA_STATE_OPERATION_PROHIBITED` (AC-11, AC-12).
6. **Screening balance + attack-opportunity selection (value-only)** (INC-6): §18 `screenRatioBp` + opportunity table; §19 keyed opportunity selection + typed opportunity record (AC-13, AC-14).
7. **Mine laying + friendly-identification (value-only)** (INC-7): §20 eligibility + `AreaMinePressureRecord` via C-2 + inventory consumption + `SUBMARINE_MINE_INVENTORY_INSUFFICIENT`; §23 `submarine_friendly_identification_v1` value-only (AC-15, AC-16).
8. **Records/ordering + contracts rollup + determinism + ADR + traceability** (INC-8): §25 `SubmarineOperationsRecord` + §26 canonical ordering; full `*_v1` rollup + `reason-codes-submarines.test.ts` set-equality (AC-17, AC-18, AC-21); two-process child `run-submarines-child.ts` (AC-20); integration-boundary proof (AC-19); C-3 scope/integration + deferral ADR; PROGRESS/SPRINT-PLAN update; goldens unchanged (AC-22).

### 1.3 Content deliverable

No production-pack YAML change (`content/production/1880/` untouched; goldens
unchanged). The "content deliverable" is the **engine-versioned constant set**
(`submarine_strategic_asset_v1`, `submarine_types_v1`, `submarine_policies_v1`,
`submarine_missions_v1`, `submarine_reliability_v1`, `submarine_proximity_v1`,
`submarine_remote_efficiency_v1`, `submarine_long_range_asw_vulnerability_v1`,
`submarine_effectiveness_v1`, `submarine_sea_state_v1`,
`submarine_screening_balance_v1`, `submarine_attack_opportunity_v1`,
`submarine_mine_laying_v1`, `submarine_friendly_identification_v1` +
`SHIPPED_*_CONTRACT` + validate guards) wired directly from DESIGN-34's own exact
shipped integers (ticket 04/06 — no research-grounded catalog required, unlike
torpedoes' `torpedo_models_v1`).

### 1.4 Reason codes (DESIGN-34 §27 in-slice partition)

DESIGN-34 §27 is **authoritative for this subsystem**. This slice ships all 14
required codes.

**In-slice (14 direct, recorded in the C-3 ADR):**
`INVALID_SUBMARINE_REPRESENTATION`, `SUBMARINE_ASSET_DOUBLE_ALLOCATED`,
`SUBMARINE_PROVENANCE_INVALID`, `SUBMARINE_MISSION_INELIGIBLE`,
`COASTAL_SUBMARINE_RANGE_RESTRICTED`, `LONG_RANGE_ASW_VULNERABILITY_MISSING`,
`SUBMARINE_RELIABILITY_INSUFFICIENT`, `SUBMARINE_FUEL_INSUFFICIENT`,
`SUBMARINE_ATTACK_OPPORTUNITY_CREATED`, `SUBMARINE_MINE_INVENTORY_INSUFFICIENT`,
`SUBMARINE_ASW_CONTACT_RESOLVED`, `SUBMARINE_FRIENDLY_FIRE_INCIDENT`,
`SUBMARINE_SEA_STATE_OPERATION_PROHIBITED`, `SUBMARINE_STATE_INVARIANT_FAILED`.
Plus documented in-slice marker: `SUBMARINE_RESOLUTION_DEFERRED` (local, not a
§27 code — fires if any caller reaches a would-be-deferred battle/ASW/friendly-fire
boundary in this slice's functions, per B-3/C-1/C-2 "eligibility predicate
deferred" precedent).

**Deferred §27 ownership (recorded, not dropped, owned by later battle-integration
+ DESIGN-29 slices):** the full *application* of `SUBMARINE_ASSET_DOUBLE_ALLOCATED`,
`SUBMARINE_PROVENANCE_INVALID`, `SUBMARINE_ASW_CONTACT_RESOLVED`,
`SUBMARINE_FRIENDLY_FIRE_INCIDENT` (their value/predicate surfaces ship here; the
battle-manifest / ASW / friendly-fire application is deferred per ticket 03). A
`reason-codes-submarines.test.ts` set-equality check against §27 + the existing
combat catalog prevents silent addition (AC-18).

---

## 2. Increments (frontier-ordered implementation tickets, to-tickets output)

- **INC-1 — Strategic representation + types + policies + reason codes + contracts seed** (AC-1, AC-2, AC-3, AC-18, AC-21 seeds).
- **INC-2 — Mission eligibility + reliability** (AC-4, AC-5).
- **INC-3 — Proximity + remote-efficiency + long-range ASW vulnerability** (AC-6, AC-7, AC-8).
- **INC-4 — Strategic mission effectiveness + coastal restriction** (AC-9, AC-10).
- **INC-5 — Sea-state profile** (AC-11, AC-12).
- **INC-6 — Screening balance + attack-opportunity selection (value-only)** (AC-13, AC-14).
- **INC-7 — Mine laying + friendly-identification (value-only)** (AC-15, AC-16).
- **INC-8 — Records/ordering + contracts rollup + determinism + ADR + traceability + gate** (AC-17..AC-22).

Each increment passes its AC tests and the reviewer before the next. All
increments add no snapshot schema, phase, or engine-stage change; INC-8 verifies
goldens unchanged and records the C-3 ADR.

---

## 3. Out of scope (deferred — enumerated, owning track)

- **Tactical submarine allocation (§2) + tactical loss application (§3)** —
  battle-integration slice (needs accepted battle manifest + provenance wiring;
  `SUBMARINE_ASSET_DOUBLE_ALLOCATED`/`SUBMARINE_PROVENANCE_INVALID` predicates ship
  here, full enforcement deferred).
- **Post-battle returning-ship interception (§21)** — needs battle-attack
  machinery + distinct keyed decision + battle-local attack manifest.
- **ASW resolution application (§22)** — needs enemy ASW strength, trade-protection
  coverage, DESIGN-29 intelligence, screening consumer; §10/§14 multipliers ship
  as tables here.
- **Friendly-fire identification risk + outcomes (§23–24)** — needs DESIGN-29
  knowledge/ROE + ASW contacts; `submarine_friendly_identification_v1` base
  probability + clamp formula ships value-only here.
- **Strategic attack loss application (§19 losses)** — needs owning battle/attack
  resolver; only opportunity *selection* ships (value-only).
- **Mine-strike resolution (§20)** — C-2 continuation owns.
- **Phase-engine/campaign-snapshot wiring** (`submarine_operations` phase,
  `SubmarineStrategicAsset[]` on `CampaignSnapshot`) — deferred, mirrors the
  B-5→B-6 sequencing (ticket 02).
- **Command-layer submarine mission/policy orders** — later command/AI slice.
- **Missile-payload mechanics** — E-track (M5); `MISSILE` type data ships here.
- **Production-pack YAML changes** (content tracked separately). **Golden
  regeneration** — none unless an authoritative cause is documented.

---

## 4. Testing and validation

- Unit tests per submarine function (representation, type definitions, policies,
  mission eligibility, reliability, proximity, remote-efficiency, ASW
  vulnerability, effectiveness, coastal restriction, sea-state scale +
  multipliers, screening balance, attack-opportunity selection, mine laying,
  friendly-identification, records, ordering) incl. invalid/boundary cases.
- Integration-boundary test proving zero coupling to `phase-engine`,
  `CampaignSnapshot`, the `@bluewave/combat` minute-advance simulation, and that
  `mines/`/`torpedoes/`/`weather/` modules are not modified (diff-clean).
- Determinism: **two separate child processes** (node-spawn ×2, byte-compared)
  via the `@bluewave/cross-process-test` pattern (new `run-submarines-child.ts`);
  **keyed** RNG draws only (`submarine/month/war/area/attack_opportunity`,
  `submarine/.../friendly_identification`), no ambient randomness.
- Reason-code set-equality vs DESIGN-34 §27 + existing catalog.
- Continuity: `pnpm -w turbo run build --force`, `pnpm typecheck`, `pnpm lint`,
  `pnpm format`, `pnpm test:run`, `node scripts/verify-golden-hashes.cjs`
  (10/10), cross-process byte-identical; every pre-existing engine file unchanged
  (diff) outside the new `submarines/` module.
- Pre-existing unrelated failures documented (not newly caused): content-schema
  `nation.test.ts` broken import (recorded in SPRINT-PLAN).
- **Concurrency note:** this sprint's implementation must not modify
  `packages/combat/src/torpedoes/`, `packages/combat/src/mines/`,
  `packages/combat/src/weather/`, `packages/phase-engine/`, `packages/random/`,
  or the desktop-e2e harness — those are concurrent sessions' active working sets
  in the shared tree. This sprint writes only new files under
  `packages/combat/src/submarines/` + `packages/combat/test/submarines/` (+ the
  cross-process child + ADR + docs).

---

## 5. Definition of done (C-3-IMPL)

- All AC-1..AC-22 pass with proving tests; no skipped/loosened tests.
- Golden hashes unchanged (verified 10/10); no pre-existing engine file modified
  outside the new `submarines/` module (verified by diff).
- Versioned contracts + reason codes + ADR landed; research note
  `docs/research/c3-m3-submarines.md` present (explains why no primary-source
  grounding pass was needed).
- Traceability updated (SPRINT-PLAN C-3 row, PROGRESS, validation report
  `.ai/reports/c3-m3-submarines-impl.md`); Conventional Commits on `dev`;
  clean working tree.
