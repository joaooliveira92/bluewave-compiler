# C-2 Spec — M3 Mine Warfare: Mine-Pressure Lifecycle (M3 Advanced Surface Warfare)

- **Sprint:** C-2 (`.ai/SPRINT-PLAN.md` Track C row 2)
- **Kind:** scoping (this document is the implementation spec produced by the C-2 scoping sprint; C-2-IMPL executes it)
- **Governing docs:** DESIGN-35 (`docs/rules/mine-warfare.md`) — **mine-pressure lifecycle slice only** (mine-pressure state §1, mine types §2, mine sources §3, laying value §4, pressure increase §5, minesweeping eligibility §6, sweeping base values §7, dual ASW/mine equipment §8, effective sweeping value §9, regional sweeping aggregation §10, defensive standoff value §16, strategic route risk value §13, mine report §19, misidentification classifier §20, mine decay §21, post-war persistence §22, ownership/control changes §23, mine knowledge §24, mine-clearance completion §27, records/audit §28, canonical ordering §29, reason codes §30); cross-refs DESIGN-38 (minute-advance substep schedule §3 step 9 — confirms mines have a tactical substep, deferred here), DESIGN-25 (deployment-and-logistics — blocks route-strike application, unassigned), DESIGN-07 (integer arithmetic), DESIGN-55 §4 (`docs/delivery/release-scope-and-implementation-order.md` — M3 scope: torpedoes/mines/submarines/coastal-defenses/smoke/detailed-damage-control).
- **Baseline:** M2 COMPLETED (B-6 gate, 2026-08-15). C-1 (torpedoes) scoping DONE, C-1-IMPL in flight in a separate worktree — **not touched by this sprint** (no files under `packages/combat/src/torpedoes/` or `packages/combat/test/torpedo/`).
- **Target:** mine-pressure lifecycle reaches `IMPLEMENTED_UNVERIFIED → VERIFIED_NOT_INTEGRATED` (phase-pipeline/campaign-snapshot integration deferred, mirrors the B-5-before-B-6 sequencing); no campaign snapshot schema change.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Golden hashes must remain unchanged (no ADR-0007 regeneration).

---

## 1. Scope

C-2 delivers a deterministic, pure **mine-pressure lifecycle** function set in a
new `packages/combat/src/mines/` module: mine-type definitions, mine sources,
laying value computation, pressure increase/reinforcement, minesweeping
eligibility/values/dual-equipment/aggregation/allocation, defensive-standoff
value computation, strategic route-risk value computation, mine reporting and
underwater-explosion misidentification, monthly decay, post-war persistence,
ownership/control-change dispositions, mine knowledge tracking, clearance, and
the full DESIGN-35 records/ordering/reason-code surface for this slice. It ships
versioned constants + in-slice reason codes and the C-2 ADR. See
`.scratch/c2-m3-mine-warfare/issues/01-scope-boundary.md`,
`02-phase-integration-boundary.md`, and `03-strike-resolution-deferral.md` for
the full reasoning behind excluding mine-strike resolution.

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-35 + contract) | Proving test |
|----|-------------------------------------|--------------|
| AC-1 | **AreaMinePressureRecord** — one authoritative record per area/laying-participant/mine-type/target-set when pressure is positive, with all §1 fields (minePressureId, areaId, layingParticipantId, ordered target belligerents, mineTypeId, pressure `1..1_000_000`, freshness bp `0..10_000`, source composition, mine count/abstracted equivalent, detection-confidence records, creation/reinforced/decay/swept months, legal owner/controller, ruleset/formula versions, record hash); zero pressure = absence of active record (historical append-only); no undifferentiated area value. | `combat/test/mines/pressure-record.test.ts` |
| AC-2 | **MineTypeDefinition** — all six canonical types (`CONTACT`/`MAGNETIC`/`ACOUSTIC`/`CONTROLLED_DEFENSIVE`/`SUBMARINE_LAID`/`SCENARIO_SPECIAL`) with all §2 fields (type id, tech prereqs, eligible laying sources, base laying value, strike profile, target eligibility, sweeping resistance, decay policy, friendly-fire policy, battle-generation policy, report-signature policy, content version, content hash); missing/invalid → `INVALID_MINE_TYPE_DEFINITION`. | `combat/test/mines/type-definitions.test.ts` |
| AC-3 | **Mine sources** — all six canonical source kinds referenced by a laying action (source, inventory/allocation, target belligerents, area, month, policy); ineligible source (missing tech/inventory/access/control/mission) → `MINE_LAYING_SOURCE_INELIGIBLE`. | `combat/test/mines/sources.test.ts` |
| AC-4 | **Mine-laying value** — exact §4 integer formula (six-multiplier product, exact rational retained through all multipliers, rounded once with `FLOOR`); shipped generic multiplier table (tech `10_000`/`7_500`, crew `7_500`/`10_000`/`11_000`/`12_000`, readiness ineligible-below-40/`7_500`/`10_000`/`11_000`, degraded damage `5_000`, unsupported `0`); inventory consumption exactly equals declared quantity. | `combat/test/mines/laying-value.test.ts` |
| AC-5 | **Mine-pressure increase** — `addedPressure = min(1_000_000 - currentPressure, effectiveLayingValue)`; saturation at `1_000_000` blocks further addition until decay/sweep; reinforcement updates source composition + freshness via weighted integer calculation, never a full freshness reset. | `combat/test/mines/pressure-increase.test.ts` |
| AC-6 | **Minesweeping eligibility** — all §6 predicates enforced (ship type incl. converted TR, equipment installed/operational/compatible, mission `MINE_WARFARE`/`TRADE_PROTECTION`-with-authorization, `ACTIVE` readiness, `OPERATIONAL`/`DEGRADED` damage, location in swept area/connected approach, fuel/supply/crew/ammunition, not working-up/mobilizing/unavailable/interned/captured/major-dockyard, validated command/plan active); ineligible → zero contribution + `MINESWEEPING_SHIP_INELIGIBLE`. | `combat/test/mines/sweeping-eligibility.test.ts` |
| AC-7 | **Sweeping base values exactness** — dedicated fleet minesweeper `150`, dedicated coastal minesweeper `100`, DD `80`, KE `100`, CL `60`, AMC `50`, converted TR `120`; every equipment definition identifies exactly one base value or explicit replacement formula; a ship name/class description MUST NOT grant sweeping value. | `combat/test/mines/sweeping-base-values.test.ts` |
| AC-8 | **Dual ASW/mine equipment** — `dual_asw_mine_equipment_v1` exact five-mode table (`10_000/0`, `0/10_000`, `7_500/7_500`, `9_000/5_000`, `5_000/9_000`); mode selected by locked mission/equipment command before resolution; never full ASW + full sweeping simultaneously; missing mode on dual-purpose-declared equipment defaults to balanced ONLY (per ticket 04's narrow reading); other missing configurations → `DUAL_EQUIPMENT_MODE_MISSING`. | `combat/test/mines/dual-equipment.test.ts` |
| AC-9 | **Effective sweeping value** — exact §9 formula (base × mode × tech × crew × readiness × damage × support / `10_000^6`, one FLOOR) + exact mine-type resistance multipliers applied after aggregation (contact `10_000`, magnetic `7_500`/`10_000`, acoustic `7_500`/`10_000`, controlled-defensive `5_000`, submarine-laid `9_000`, scenario-special definition-required); missing resistance data → `MINE_SWEEP_RESISTANCE_MISSING`. | `combat/test/mines/effective-sweeping.test.ts` |
| AC-10 | **Regional sweeping aggregation + allocation** — sum of eligible-ship values in ascending ship-identifier order; `typeAdjustedSweeping`/`sweptPressure`/`pressureAfterSweeping` exact formulas, never below zero; one allocation never double-applied across records; allocation order exactly (1) controlled-defensive-threatening-sweeper, (2) highest strike risk, (3) highest pressure, (4) mine-type id, (5) mine-pressure id; unused value passes to the next record. | `combat/test/mines/sweeping-aggregation.test.ts` |
| AC-11 | **Defensive standoff (value only)** — exact §16 thresholds (`<100_000` none, `100_000..249_999` level 1, `250_000..499_999` level 2, `500_000..749_999` level 3, `750_000..1_000_000` level 4) and exact effect multipliers (`9_000`/`7_500`/`5_000`/`2_500`); `mine_defensive_standoff_v1` contract computes the level + multiplier as a pure derived value; no automatic operation cancellation; no consumer wired (amphibious/blockade contracts don't exist yet — documented, not fabricated). | `combat/test/mines/defensive-standoff.test.ts` |
| AC-12 | **Strategic route risk (value only)** — exact §13 formula (`min(10_000, floor(currentPressure * freshnessBp * routeExposureMultiplierBp * targetSusceptibilityMultiplierBp / 1_000_000 / 10_000 / 10_000))`) with exact shipped route-exposure multipliers (open sea `5_000`, coastal passage `10_000`, canal approach `15_000`, choke point `15_000`, port approach `12_500`); computed as a pure function returning `routeRiskBp`; no movement-blocking/consuming behavior wired (ticket 03). | `combat/test/mines/route-risk.test.ts` |
| AC-13 | **Mine report** — every observed/suspected event creates a `MineIncidentReport` with all §19 fields; reports never overwrite true pressure/type/cause/laying-participant. | `combat/test/mines/report.test.ts` |
| AC-14 | **Mine/torpedo misidentification classifier** — `underwater_explosion_identification_v1` exact base weights (mine `6_000`, torpedo `3_000`, unknown `1_000`) + exact modifiers (known hostile pressure mine `+2_000`, observed torpedo track `+5_000`, no submarine contact torpedo `-1_000` floor `0`, port/choke-point mine `+1_000`); normalized selection via stream `mine_warfare/report/underwater_explosion`; a false torpedo report never creates a real submarine asset/attack. | `combat/test/mines/misidentification.test.ts` |
| AC-15 | **Mine decay** — exact monthly retention multipliers (contact `9_750`, magnetic `9_500`, acoustic `9_250`, controlled-defensive-with-control `9_900`, controlled-defensive-without-control `9_000`, submarine-laid `9_500`, scenario-special definition-required); `pressureAfterDecay`/`decayedPressure` exact formulas; freshness retention uses the same multiplier unless a narrower explicit value is defined; scenario-special without decay metadata → `MINE_DECAY_POLICY_MISSING`. | `combat/test/mines/decay.test.ts` |
| AC-16 | **Post-war persistence** — war termination never auto-removes pressure; target sets preserved historically; minefields remain active to configured targets + misidentified traffic; decay continues; clearance remains available; new laying requires a separate legal policy; peace settlement alters target sets/lanes/disclosure/clearance only through typed terms. | `combat/test/mines/post-war-persistence.test.ts` |
| AC-17 | **Ownership/control changes** — legal/military control change never auto-deletes/neutralizes pressure; every transition declares exactly one of the six closed dispositions (`PRESERVE_ACTIVE`/`TRANSFER_CONTROLLED_MINE_AUTHORITY`/`DEACTIVATE_CONTROLLED_MINES`/`DISCLOSE_SAFE_LANES`/`ASSIGN_CLEARANCE_OBLIGATION`/`DESTROY_CONTROL_INFRASTRUCTURE_WITH_DECLARED_EFFECT`); uncontrolled mine types remain active until decay/clearance by default; missing disposition for controlled-defensive mines → `CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`. | `combat/test/mines/ownership-transitions.test.ts` |
| AC-18 | **Mine knowledge** — separate per-participant knowledge assertions (suspected area/route, estimated pressure interval, mine type, suspected laying participant, known cleared lanes, freshness estimate, last observed/swept date); true pressure never exposed absent an explicit source policy; sweeping improves knowledge only via explicit sweep-observation records. | `combat/test/mines/knowledge.test.ts` |
| AC-19 | **Mine-clearance completion** — a record clears when pressure reaches `0` after sweeping/decay; clearance closes the active record, preserves historical source/action records, updates knowledge per source/reporting rules, removes battle/route risk for that record from subsequent phases, emits `MINEFIELD_CLEARED`; clearing one participant's minefield never clears another's. | `combat/test/mines/clearance.test.ts` |
| AC-20 | **Records + canonical ordering** — every monthly resolution creates one immutable `MineWarfareResolutionRecord` with all §28 fields; §29 ordering (wars by id → areas by id → mine-pressure records by laying-participant/type/id → laying sources by id → sweeping ships by id → sweep allocation per §10 → route checks by target id → effects by declared ordinal) via `BattleLedger`-equivalent deterministic collection + explicit sort, not incidental JS ordering; DB/UI/wall-clock order MUST NOT affect outcomes. | `combat/test/mines/records.test.ts`, `combat/test/mines/ordering.test.ts` |
| AC-21 | **Reason-code set-equality** — this slice ships 15 direct + 2 value-only DESIGN-35 §30 in-slice codes (see §1.4) plus the `MINE_STRIKE_RESOLUTION_DEFERRED` local marker; `reason-codes-mines.test.ts` partition (in-slice/deferred/catalog) prevents silent addition; every new code recorded in the C-2 ADR. | `combat/test/mines/reason-codes-mines.test.ts` |
| AC-22 | **No engine/phase integration** — no `phase-engine` registration, no `CampaignSnapshot` schema change, no `@bluewave/combat` minute-advance stage; every function in `packages/combat/src/mines/` is pure (explicit inputs → explicit outputs), independently callable from a future phase-wiring or tactical-stage sprint; `BattleResolver`/`StrengthCalculator`/existing engine files UNMODIFIED (diff). | `combat/test/mines/integration-boundary.test.ts` |
| AC-23 | **Two-process determinism** — identical inputs produce identical outputs + record hashes across two separate child processes (node-spawn ×2, byte-compared) via the `@bluewave/cross-process-test` pattern (new `run-mines-child.ts`); only keyed RNG draws (`mine_warfare/...` streams per §11/§25/§20 stream names as applicable to shipped codes), no ambient randomness. | `combat/test/mines/determinism.test.ts` |
| AC-24 | **Contracts + validate guards** — every new mine constant ships `*_v1` + `SHIPPED_*_CONTRACT` (`mine_pressure_v1`, `mine_sweeping_v1`, `dual_asw_mine_equipment_v1`, `mine_defensive_standoff_v1`, `underwater_explosion_identification_v1`, `mine_decay_v1`, `mine_type_definitions_v1`) + `validate*Contract` fail-closed guards. | `combat/test/mines/contracts.test.ts` |
| AC-25 | **Goldens unchanged** — no snapshot schema/phase change; `verify-golden-hashes.cjs` 10/10; every pre-existing engine/combat file unmodified outside the new `mines/` module (diff). | orchestrator gate |

### 1.2 In scope

1. **Mine types + reason codes + contracts seed** (INC-1): `MineTypeDefinition`
   (§2) all six canonical types + `INVALID_MINE_TYPE_DEFINITION`; in-slice reason
   codes module seed; `mine_type_definitions_v1` contract (AC-2, AC-21, AC-24
   seeds).
2. **Mine sources + laying value + pressure increase** (INC-2): mine sources
   (§3) + `MINE_LAYING_SOURCE_INELIGIBLE`; §4 laying-value exact formula +
   shipped multiplier table + `MINE_INVENTORY_INSUFFICIENT`; §5 pressure
   increase/reinforcement (AC-3, AC-4, AC-5).
3. **Sweeping eligibility + base values + dual equipment + effective value**
   (INC-3): §6 eligibility predicates + `MINESWEEPING_SHIP_INELIGIBLE`; §7 exact
   base values; §8 `dual_asw_mine_equipment_v1` + `DUAL_EQUIPMENT_MODE_MISSING`;
   §9 effective value + resistance multipliers + `MINE_SWEEP_RESISTANCE_MISSING`
   (AC-6..AC-9).
4. **Regional sweeping aggregation + allocation** (INC-4): §10 aggregation +
   exact allocation order + `MINE_PRESSURE_REDUCED` (AC-10).
5. **Defensive standoff + route risk (value-only)** (INC-5): §16
   `mine_defensive_standoff_v1` + `MINE_DEFENSIVE_STANDOFF_ACTIVE`; §13 route-risk
   formula + `MINE_ROUTE_RISK_CREATED` (AC-11, AC-12).
6. **Mine report + misidentification classifier** (INC-6): §19
   `MineIncidentReport` + `MINE_REPORT_CAUSE_UNCERTAIN`; §20
   `underwater_explosion_identification_v1` + stream
   `mine_warfare/report/underwater_explosion` (AC-13, AC-14).
7. **Decay + post-war persistence + ownership/control changes + knowledge +
   clearance** (INC-7): §21 decay + `MINE_DECAY_POLICY_MISSING`; §22 persistence;
   §23 six dispositions + `CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`; §24
   knowledge; §27 clearance + `MINEFIELD_CLEARED` (AC-15..AC-19).
8. **Records/ordering + contracts rollup + determinism + ADR + traceability**
   (INC-8): §28 `MineWarfareResolutionRecord` + §29 canonical ordering; full
   `*_v1` rollup + `reason-codes-mines.test.ts` set-equality (AC-20, AC-21,
   AC-24); two-process child `run-mines-child.ts` (AC-23); integration-boundary
   proof (AC-22); C-2 scope/integration + strike-deferral ADR; PROGRESS/
   SPRINT-PLAN update; goldens unchanged (AC-25).

### 1.3 Content deliverable

No production-pack YAML change (`content/production/1880/` untouched; goldens
unchanged). The "content deliverable" for this slice is the **engine-versioned
constant set** (`mine_type_definitions_v1` + `mine_pressure_v1` +
`mine_sweeping_v1` + `dual_asw_mine_equipment_v1` + `mine_defensive_standoff_v1`
+ `underwater_explosion_identification_v1` + `mine_decay_v1` +
`SHIPPED_*_CONTRACT` + validate guards) wired directly from DESIGN-35's own
exact shipped integers (ticket 04/06 — no research-grounded catalog required,
unlike torpedoes' `torpedo_models_v1`).

### 1.4 Reason codes (DESIGN-35 §30 in-slice partition)

DESIGN-35 §30 is **authoritative for this subsystem**. This slice ships all but
3 of the 18 required codes.

**In-slice (15 direct + 2 value-only, recorded in the C-2 ADR):**
`INVALID_MINE_TYPE_DEFINITION`, `INVALID_MINE_PRESSURE_STATE`,
`MINE_LAYING_SOURCE_INELIGIBLE`, `MINE_INVENTORY_INSUFFICIENT`,
`MINESWEEPING_SHIP_INELIGIBLE`, `DUAL_EQUIPMENT_MODE_MISSING`,
`MINE_SWEEP_RESISTANCE_MISSING`, `MINE_PRESSURE_REDUCED`,
`MINE_ROUTE_RISK_CREATED` (value-only), `MINE_DEFENSIVE_STANDOFF_ACTIVE`
(value-only), `MINE_REPORT_CAUSE_UNCERTAIN`, `MINE_DECAY_POLICY_MISSING`,
`CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`, `MINEFIELD_CLEARED`,
`MINE_WARFARE_INVARIANT_FAILED`. Plus documented in-slice marker:
`MINE_STRIKE_RESOLUTION_DEFERRED` (local, not a §30 code — fires if any caller
reaches a would-be-strike boundary in this slice's functions, per B-3/C-1
"eligibility predicate deferred" precedent).

**Deferred §30 ownership (recorded, not dropped, owned by the C-2
continuation):** `MINE_BATTLE_HAZARD_GENERATED`, `MINE_STRIKE_OCCURRED`,
`FRIENDLY_MINE_STRIKE_OCCURRED`. A
`reason-codes-mines.test.ts` set-equality check against §30 + the existing
combat catalog prevents silent addition (AC-21).

---

## 2. Increments (frontier-ordered implementation tickets, to-tickets output)

- **INC-1 — Mine types + reason codes + contracts seed** (AC-2, AC-21, AC-24 seeds).
- **INC-2 — Mine sources + laying value + pressure increase** (AC-3, AC-4, AC-5).
- **INC-3 — Sweeping eligibility + base values + dual equipment + effective value** (AC-6..AC-9).
- **INC-4 — Regional sweeping aggregation + allocation** (AC-10).
- **INC-5 — Defensive standoff + route risk (value-only)** (AC-11, AC-12).
- **INC-6 — Mine report + misidentification classifier** (AC-13, AC-14).
- **INC-7 — Decay + post-war persistence + ownership/control changes + knowledge + clearance** (AC-15..AC-19).
- **INC-8 — Records/ordering + contracts rollup + determinism + ADR + traceability + gate** (AC-20..AC-25).

Each increment passes its AC tests and the reviewer before the next. All
increments add no snapshot schema, phase, or engine-stage change; INC-8 verifies
goldens unchanged and records the C-2 ADR.

---

## 3. Out of scope (deferred — enumerated, owning track)

- **Tactical battle-mine hazard generation + `BattleMineHazard` + battle
  mine-strike resolution (§11, §17–18, in-battle §14–15)** — C-2 continuation
  (new `@bluewave/combat` minute-advance engine stage, sequenced after this
  sprint; see ticket 03).
- **Strategic route-transit mine-strike application (§14–15 for routes)** —
  blocked on DESIGN-25 (deployment-and-logistics) acceptance, currently
  unassigned; §13's `routeRiskBp` formula ships as a value with no consumer.
- **Friendly-fire risk/outcome (§25–26)** — shares strike machinery with the
  above; deferred alongside.
- **Phase-engine/campaign-snapshot wiring** (`mine_warfare_generation` phase,
  `AreaMinePressureRecord[]` on `CampaignSnapshot`) — deferred, mirrors the
  B-5→B-6 sequencing (ticket 02).
- **Submarine-laid mine operational/mission mechanics** — C-3 (submarines);
  `SUBMARINE_LAID` ships as a data type only this sprint.
- **Scenario-special mine type production content** — content track.
- **Command-layer mine-laying orders/mission plumbing** — later command/AI
  slice; this sprint ships eligibility/value formulas as pure functions.
- **Amphibious/blockade consumption of defensive-standoff levels** — deferred
  until DESIGN-36 (amphibious operations, unassigned) or a fuller DESIGN-32
  blockade mechanic exists.
- **Production-pack YAML changes** (content tracked separately). **Golden
  regeneration** — none unless an authoritative cause is documented.

---

## 4. Testing and validation

- Unit tests per mine function (type definitions, sources, laying value,
  pressure increase, sweeping eligibility, base values, dual equipment,
  effective sweeping value, regional aggregation/allocation, defensive
  standoff, route risk, report, misidentification, decay, post-war
  persistence, ownership/control-change dispositions, knowledge, clearance,
  records, ordering) incl. invalid/boundary cases.
- Integration-boundary test proving zero coupling to `phase-engine`,
  `CampaignSnapshot`, and the `@bluewave/combat` minute-advance simulation
  (`engine.ts` diff-clean).
- Determinism: **two separate child processes** (node-spawn ×2, byte-compared)
  via the `@bluewave/cross-process-test` pattern (new `run-mines-child.ts`);
  **keyed** RNG draws only (`mine_warfare/...` streams), no ambient randomness.
- Reason-code set-equality vs DESIGN-35 §30 + existing catalog.
- Continuity: `pnpm -w turbo run build --force`, `pnpm typecheck`, `pnpm lint`,
  `pnpm format`, `pnpm test:run`, `node scripts/verify-golden-hashes.cjs`
  (10/10), cross-process byte-identical; every pre-existing engine file
  unchanged (diff) outside the new `mines/` module.
- Pre-existing unrelated failures documented (not newly caused): content-schema
  `nation.test.ts` broken import (recorded in SPRINT-PLAN).
- **Concurrency note:** this sprint's implementation must not touch
  `packages/combat/src/torpedoes/`, `packages/combat/test/torpedo/`, or
  `.scratch/c1-m3-torpedoes/` — those are C-1-IMPL's active working set on a
  separate worktree.

---

## 5. Definition of done (C-2-IMPL)

- All AC-1..AC-25 pass with proving tests; no skipped/loosened tests.
- Golden hashes unchanged (verified 10/10); no pre-existing engine file
  modified outside the new `mines/` module (verified by diff).
- Versioned contracts + reason codes + ADR landed; research note
  `docs/research/c2-m3-mine-warfare.md` present (explains why no primary-source
  grounding pass was needed).
- Traceability updated (SPRINT-PLAN C-2 row, PROGRESS, validation report
  `.ai/reports/c2-m3-mine-warfare-impl.md`); Conventional Commits on `dev`;
  clean working tree.
