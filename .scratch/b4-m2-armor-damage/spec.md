# B-4 Spec — M2 Armor & Damage: Basic Armor + Damage-Resolution (M2 Surface Tactical Core)

- **Sprint:** B-4 (`.ai/SPRINT-PLAN.md` Track B row 4)
- **Kind:** scoping → implementation (this document is the implementation spec produced by the B-4 scoping sprint; B-4-IMPL executes it)
- **Governing docs:** DESIGN-41 (`docs/rules/damage-fire-and-flooding.md`) — **basic armor & damage subset only** (§§1–9, §45–48); DESIGN-39 §§16–24 (`docs/rules/gunnery.md` armor model folded in from B-3); cross-refs DESIGN-38 (minute-advance, `BattleLedger`, `canonicalEventOrder`, reason-code catalog), DESIGN-07 (integer arithmetic), DESIGN-55 §3–4 (M2 scope, M3 boundary).
- **Baseline:** B-3-IMPL DONE (2026-08-13, PASS). `@bluewave/combat` has the B-2 minute-advance engine (`simulation/engine.ts` steps 4–8), B-3 `resolveGunnery` wired after spotting, `GunneryEventRecord` with **reserved impact/armor inputs**, versioned `*_v1` contracts + validate guards, reason-code catalogs with set-equality tests. `BattleResolver`/`StrengthCalculator` unmodified.
- **Target:** basic armor & damage-resolution reaches `IMPLEMENTED_UNVERIFIED → VERIFIED_NOT_INTEGRATED` (phase-pipeline integration + campaign persistence is B-6); no campaign snapshot schema change.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Golden hashes unchanged (no ADR-0007 regeneration).

---

## 1. Scope

B-4 delivers a deterministic, pure, minute-advancing **damage-resolution** engine stage
(`resolveDamage`) in `@bluewave/combat` running after `resolveGunnery` (step 8) in the
minute-advance simulation, implementing DESIGN-41 §§1–9 and §45–48 basic armor & damage
**plus the DESIGN-39 §§16–24 armor model**, emitting immutable `DamageEventRecord`s through
the existing `BattleLedger` + `canonicalEventOrder`. It ships the armor/damage versioned
constants + in-slice reason codes, a research-grounded armor-content constant set, and the
B-4 ADR.

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-41/39 + contract) | Proving test |
|----|----------------------------------------|--------------|
| AC-1 | **ShipDamageState invariant** — authoritative integer `ShipDamageState` (§1: shipId, ordered compartments + components, structural-integrity score, flotation-reserve score, stability score, fire-intensity records, flooding-source records, progressive-flooding total, current performance modifiers, terminal-state status, ruleset/formula versions, aggregate hash); non-integers rejected (`INVALID_SHIP_DAMAGE_STATE` / `DAMAGE_STATE_INVARIANT_FAILED`). | `combat/test/damage/state.test.ts` |
| AC-2 | **Damage categories** — the seven canonical §2 categories; every damaging event produces ≥ one typed package or an explicit `NO_EFFECT`; narrative never mutates state. | `combat/test/damage/categories.test.ts` |
| AC-3 | **10-stage pipeline** — every event executes §3 stages in exact order; no-skip rule (empty stage → successful empty record); stage failure rolls back the whole transaction with `DAMAGE_RESOLUTION_FAILED`. | `combat/test/damage/pipeline.test.ts` (order + empty + rollback) |
| AC-4 | **Hit location (Stage 1)** — deterministic impact→zone from authoritative geometry; exactly one primary compartment/zone (+ optional adjacent); no convenience relocation (`DAMAGE_HIT_LOCATION_INVALID`). | `combat/test/damage/hit-location.test.ts` |
| AC-5 | **Protection interaction (Stage 2)** — DESIGN-39 §16–24 armor model: zone maxima (`ARMOR_ZONE_MAXIMUM_MISSING` / `ARMOR_THICKNESS_LIMIT_EXCEEDED`, equality legal), thick-armor manufacturing (threshold 304 800 µm, excess 7 500 bp), quality-adjusted thickness, impact geometry/obliquity, 2-in splinter threshold + classes, 7 penetration outcomes via deterministic predicate or keyed draw; unrounded µm operands only. | `combat/test/damage/armor-model.test.ts` (table exactness + bounds + outcomes) |
| AC-6 | **Local component damage (Stage 3) + turret states (§7)** — spatially eligible components, stable-id order, exact outcome set incl. the five turret states + restoration rules (no elapsed-time restoration) (`DAMAGE_COMPONENT_OUT_OF_SCOPE`). | `combat/test/damage/component-damage.test.ts`, `combat/test/damage/turret-states.test.ts` |
| AC-7 | **Structure & flotation (Stage 4)** — `structuralIntegrityAfter = max(0, before − structuralDamage)`, `flotationReserveAfter = max(0, before − immediateFlotationDamage)`; separate tracks; uncapped amount preserved in record. | `combat/test/damage/structure-flotation.test.ts` |
| AC-8 | **Immediate fire/flooding creation (Stage 5)** — evaluated independently; each created source is a separate stable record (intensity/rate, location, cause, version) (`FIRE_SOURCE_CREATED` / `FLOODING_SOURCE_CREATED`); creation-only this sprint (resolution is M3/C-5). | `combat/test/damage/immediate-fire-flooding.test.ts` |
| AC-9 | **Minimal secondary hazard + terminal seam (Stages 6/8)** — magazine/ammunition reaction on full/critical magazine-zone penetration via keyed draw (`battle/ship/damage/magazine` + `DAMAGE_SECONDARY_HAZARD_CREATED`); others empty-record. Basic terminal detection: flotation 0 → `SINKING` (formula `clamp(10,360, floor(baseSurvivalMinutes × flotation × stability × damageControl / 10_000^3))`), catastrophic structure → `FOUNDERED` (`SHIP_SINKING` / `SHIP_FOUNDERED`). | `combat/test/damage/secondary-hazard-magazine.test.ts`, `combat/test/damage/terminal-seam.test.ts` |
| AC-10 | **DamageEventRecord completeness (Stage 9)** — every damage transaction produces one immutable record (§45 fields: minute/substep, source/target/causal weapon, hit location, protection interaction, component effects, structure+flotation effects, created fire/flooding sources, secondary hazards, performance before/after, terminal transition, RNG decisions, formula+ruleset versions, record hash). | `combat/test/damage/event-record.test.ts` |
| AC-11 | **Canonical ordering (§46)** — damage events order by minute/substep → source priority → target ship → hit id → zone → component → secondary-hazard priority → fire/flooding source id → transition/record id; emitted via `BattleLedger`+`canonicalEventOrder`. | `combat/test/damage/ordering.test.ts`, `combat/test/damage/ledger-order.test.ts` |
| AC-12 | **Damage-in-minute-advance** — `resolveDamage` runs as a pure engine stage after `resolveGunnery` each minute given armored units + presented impacts/hazards, strictly no-op when none (B-2/B-3 hashes unchanged); `BattleResolver`/`StrengthCalculator` UNMODIFIED (diff). | `combat/test/damage/advance.test.ts`, `combat/test/damage/pipeline-order.test.ts`, `combat/test/damage/integration-boundary.test.ts` |
| AC-13 | **Reason-code set-equality** — in-slice §47 + DESIGN-39 §32 armor codes + reused catalog exactly as ticket 05; `reason-codes-damage.test.ts` prevents silent addition; deferred codes recorded (never shipped). | `combat/test/reason-codes-damage.test.ts` |
| AC-14 | **Two-process determinism** — identical state+inputs → identical per-minute hashes + damage events; two separate child processes (node-spawn ×2, byte-compared). | `combat/test/damage/determinism.test.ts` + cross-process child ×2 |
| AC-15 | **Contracts + validate guards** — every new armor/damage constant ships `*_v1` + `SHIPPED_*_CONTRACT` + validate guard + `validateDamageContract`; pinning fails closed. | `combat/test/damage/contracts.test.ts` |
| AC-16 | **Goldens unchanged** — no snapshot schema/phase change; `verify-golden-hashes.cjs` 9/9; `BattleResolver`/`StrengthCalculator` unmodified (diff). | orchestrator gate |

### 1.2 In scope

1. **ShipDamageState + pipeline skeleton + reason codes + constants** (INC-1):
   authoritative integer `ShipDamageState` (§1) + `assertFixedPointDamage` guards;
   the 10-stage pipeline orchestrator with no-skip empty-stage semantics + rollback
   (AC-1..AC-3, AC-15 seeds); the in-slice §47 + armor reason codes (ticket 05).
2. **Armor model** (INC-2): DESIGN-39 §§16–24 as pure functions + `armor_v1`
   constants (`SHIPPED_ARMOR_CONTRACT` + validate guard): zone maxima, thick-armor
   manufacturing, quality adjustment, impact geometry, splinter, 7 penetration
   outcomes (AC-5).
3. **Hit location + protection interaction** (INC-3): Stage 1 + Stage 2 consuming
   armored units + presented impact/hazard packages → outcome (AC-4, AC-5 wiring).
4. **Component damage + turret states + structure/flotation** (INC-4):
   Stage 3 + §7 + Stage 4, damage event record + ordering + engine wiring after
   gunnery (AC-6, AC-7, AC-10..AC-12).
5. **Immediate fire/flooding + magazine reaction + terminal seam** (INC-5):
   Stage 5 creation-only, magazine/ammunition secondary hazard, basic SINKING/
   FOUNDERED detection (AC-8, AC-9); two-process determinism (AC-14).
6. **Contracts rollup + research content constants + ADR + traceability** (INC-6):
   full `*_v1` rollup + `reason-codes-damage.test.ts` set-equality (AC-13);
   research-grounded **armor/damage content constant set** (armor zone maxima + 
   armor-technology quality families + fire/flooding creation-type multipliers)
   grounded in `docs/research/b4-m2-armor-damage.md`; ADR-0021; PROGRESS/SPRINT-PLAN
   update; goldens unchanged (AC-16).

### 1.3 Content deliverable

Ship armor/damage tables as engine versioned constants (`armor_v1` +
`damage_v1` + `SHIPPED_ARMOR_CONTRACT` + `SHIPPED_DAMAGE_CONTRACT` + validate
guards), grounded in `docs/research/b4-m2-armor-damage.md`: armor zone maxima
(§17 µm values), `thick_armor_manufacturing_v1` (7 500 bp), splinter threshold
(50 800 µm), fire-risk + flooding multipliers (§15/§20 tables as BALANCE
constants for creation typing), and **armor-technology quality-multiplier
families** (iron → compound → Harvey → Krupp/KC → post-KC) grounded in
armor-history sources. No production-pack YAML change; goldens unchanged.

### 1.4 Reason codes (ticket 05 — in-slice)

**In-slice new (recorded ADR-0021):** `INVALID_SHIP_DAMAGE_STATE`,
`DAMAGE_RESOLUTION_FAILED`, `DAMAGE_HIT_LOCATION_INVALID`,
`DAMAGE_PROTECTION_INTERACTION_INVALID`, `DAMAGE_COMPONENT_OUT_OF_SCOPE`,
`DAMAGE_SECONDARY_HAZARD_CREATED`, `FIRE_SOURCE_CREATED`, `FLOODING_SOURCE_CREATED`,
`SHIP_SINKING`, `SHIP_FOUNDERED`, `DAMAGE_STATE_INVARIANT_FAILED`, plus
`ARMOR_ZONE_MAXIMUM_MISSING`, `ARMOR_THICKNESS_LIMIT_EXCEEDED`,
`SPLINTER_PROTECTION_NOT_QUALIFIED` (landing from DESIGN-39 §32 deferred record,
B-3) and new `ARMOR_QUALITY_MULTIPLIER_MISSING`.

**Reused existing:** `TACTICAL_STATE_INVARIANT_FAILED`, `INVALID_TACTICAL_CLOCK`,
`INVALID_TACTICAL_TIME_CONTRACT`, gunnery event seam.

**Deferred §47 (recorded → M3/C-5):** all flooding/fire-resolution codes
(`FLOODING_HIGH_SPEED_LOSS_CHECK`, `CARRIER_OPERATIONS_OBSTRUCTED_BY_FIRE`,
`ALUMINUM_SUPERSTRUCTURE_FIRE_VULNERABILITY`), terminal/survivor/rescue/scoring
codes (`SHIP_MISSION_KILLED`, `SHIP_STABILIZED`, `SHIP_ABANDONED`, `SHIP_SCUTTLED`,
`SHIP_CAPTURED`, `SHIP_RECOVERED`, `SURVIVOR_RESCUE_INELIGIBLE`,
`SURVIVOR_RESCUE_COMPLETED`, `SINKING_CREDIT_NOT_YET_CONFIRMED`).

---

## 2. Increments (frontier-ordered implementation tickets)

- **INC-1 — ShipDamageState + pipeline skeleton + reason codes + constants** (AC-1..3, AC-15 seeds).
- **INC-2 — Armor model (DESIGN-39 §§16–24)** (AC-5).
- **INC-3 — Hit location + protection interaction (Stages 1–2)** (AC-4, AC-5 wiring).
- **INC-4 — Component damage + turret states + structure/flotation + event/ordering + engine wiring** (AC-6, AC-7, AC-10..12).
- **INC-5 — Immediate fire/flooding + magazine hazard + terminal seam + determinism** (AC-8, AC-9, AC-14).
- **INC-6 — Contracts rollup + research content constants + ADR + traceability** (AC-13, AC-15..16).

Each increment passes its AC tests and the reviewer before the next. No snapshot
schema or phase change this sprint. INC-6 runs the orchestrator gate (goldens 9/9).

---

## 3. Out of scope (deferred — enumerated, owning track)

- **Flooding operations** (§13–18: serious/major/critical severity, speed/stability
  multipliers, safe-control 10-kt threshold, high-speed loss, ingress/control/
  dewatering), **fire resolution** (§19–26: intensity, spread, suppression,
  ship-type risk, ROF penalty, carrier ops, night visibility, smoke, aluminum
  superstructure), **damage-control resources/priority** (§27–28),
  **terminal-state adjudication** (§29–43: mission-kill, stabilization,
  abandonment, scuttling/capture/recovery, sinking credit, victory timing,
  post-battle survival, survivors/rescue), **fire/flooding persistence** (§44) →
  **M3/C-5** (SPRINT-PLAN C-5 "remainder of DESIGN-41").
- **Secondary hazards beyond magazine reaction** (§10 items 2–9) → M3/C-5.
- **Torpedo/mine/bomb/missile weapon contracts** into Stage 2 → DESIGN-40/35/43–47
  owning sprints (M3/M4); Stage 2 ships the gunnery armor seam only.
- **Phase-engine wiring / BattleResolver replacement / campaign persistence /
  damage effects on gunnery state (§29 DESIGN-39) / M2 acceptance gate** → **B-6**.
- **Weather/visibility damage modifiers** → B-5; **smoke** → M3/C-5.
- **Production-pack YAML changes** (content tracked separately). **Golden
  regeneration** — none unless an authoritative cause is documented.

---

## 4. Testing and validation

- Unit tests per damage function (state, categories, pipeline, hit location,
  armor model, component damage, turret states, structure/flotation, immediate
  fire/flooding, magazine hazard, terminal seam, event record, ordering) incl.
  invalid/boundary cases.
- Integration: `resolveDamage` minute-advance order + strict no-op path (B-2/B-3
  hashes unchanged) + `BattleLedger`/`canonicalEventOrder` emission.
- Determinism: two separate child processes (node-spawn ×2, byte-compared) via
  `@bluewave/cross-process-test` pattern; **keyed** RNG draws
  (`battle/ship/damage/...` streams), no ambient randomness.
- Reason-code set-equality vs DESIGN-41 §47 + DESIGN-39 §32 + existing catalog.
- Continuity: `pnpm -w turbo run build --force`, `pnpm typecheck`, `pnpm lint`,
  `pnpm format`, `pnpm test:run`, `node scripts/verify-golden-hashes.cjs` (9/9),
  cross-process byte-identical; `BattleResolver`/`StrengthCalculator` unchanged
  (diff).
- Pre-existing unrelated failures documented (not newly caused): desktop renderer
  suite + `project.test.ts` + `content-schema/test/nation.test.ts` (unchanged).

---

## 5. Definition of done (B-4-IMPL)

- All AC-1..AC-16 pass with proving tests; no skipped/loosened tests.
- Golden hashes unchanged (verified 9/9); `BattleResolver`/`StrengthCalculator`
  unmodified (verified by diff); strict no-op path preserving B-2/B-3 hashes.
- Versioned contracts + reason codes + ADR-0021 landed; research note
  `docs/research/b4-m2-armor-damage.md` present.
- Traceability updated (SPRINT-PLAN B-4 row, PROGRESS, validation report
  `.ai/reports/b4-m2-armor-damage-impl.md`); Conventional Commits on `dev`;
  clean working tree.