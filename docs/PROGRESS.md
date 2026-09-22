# Bluewave Engine — Implementation Progress

> Single source of truth for LLM context. Updated as milestones advance.
> Canonical spec: [`README.md`](../README.md). Delivery scope: [`docs/delivery/release-scope-and-implementation-order.md`](delivery/release-scope-and-implementation-order.md).

## Overall Status

| Milestone                    | B#      | Design                                  | Implementation                       | Tests                          | Notes                    |
| ---------------------------- | ------- | --------------------------------------- | ------------------------------------ | ------------------------------ | ------------------------ |
| M1 Strategic Campaign Kernel | B0–B8   | Complete (57 docs)                      | Core pipeline done                   | ~154 tests passing             | ACCEPTED                 |
| M1 Strategic Campaign Kernel | B9–B10  | Scope briefs ready                      | B9/B10a/B10b/B10c/B10d done          | 410 passing                    | **M1 COMPLETED (A-5 gate, 2026-08-12)** — `docs/acceptance/m1-capability-registry.md` |
| M2 Surface Tactical Core     | —       | Design docs exist (DESIGN-34–42)        | B-1..B-6 IMPL DONE (2026-08-15)      | 900 combat tests pass          | **M2 COMPLETED (B-6 gate, 2026-08-15)** — see M2 section below |
| Desktop & CLI surfaces       | —       | —       | MVP + 3 screens + CLI debug DONE; game-onboarding-first-month INC-1..11 DONE (frontier INC-12); fleet-movement-strategy-map SCOPED (INC-1..INC-6) | desktop 507, campaign-engine 49 | Surfaces PASS (2026-08-15); debug-mode gating (ADR-0029); E2E suite in progress; new strategy-map scoping landed 2026-08-28 |
| M3 Advanced Surface Warfare  | —       | Design docs exist (DESIGN-34–36, 39–42) | **C-1 COMPLETE + C-2-IMPL DONE + C-3-IMPL COMPLETE (AC-1..AC-22) + C-4 COMPLETE (AC-1..AC-11) + C-5-IMPL COMPLETE (INC-1..INC-9, AC-1..AC-15) + C-6 M3 ACCEPTANCE GATE COMPLETE (2026-08-29)** | torpedo 517, mines 357 + submarine 294 + coastal-defense 78 + smoke 203 + damage-control 505 tests pass | **M3 COMPLETED (C-6 gate, 2026-08-29)** — `docs/acceptance/m3-capability-registry.md`; next: D-1 (M4 Aviation scoping) |
| M4 Aviation                  | —       | Design docs exist (DESIGN-43–45)        | D-1 SCOPING + IMPL COMPLETE (2026-08-29). INC-1..INC-9 all done — 17 source files, 17 test files, 2696 combat tests green. Full aircraft development pipeline + squadron lifecycle + basing + phase wiring landed. `BattleResolver`/`StrengthCalculator` unmodified. **D-2 COMPLETE (2026-08-29)** — full DESIGN-44 carrier operations engine. 2992 combat tests green. **D-3 COMPLETE (2026-08-29)** — CAP & strike tactical air-combat integration. INC-1..INC-8 all done via orchestrator pipeline. 245 air-combat tests across 20 files (15 source, 19 test). 6-factor squadron-quality exchange formula (research-grounded). Full strike lifecycle (CAP patrol, detection, interception, air-to-air exchange, bombing, torpedo attack, egress, recovery). Engine stage wired at step 7.7. Cross-process two-process determinism proven. Goldens 10/10 unchanged. `BattleResolver`/`StrengthCalculator` unmodified. 3237 combat tests green. **D-4 SCOPING COMPLETE (2026-08-29)** — AA air-defense vertical slice of DESIGN-45, 20 ACs, 6 INC tickets, SAM deferred to E-track. **D-4-IMPL (INC-1) DONE 2026-08-31 — PASS** — system definitions + state model + constants, all canonical §12/§14/§16/§9 constants + reason codes, 62 air-defense tests green, reviewer NEEDS_REWORK repaired. **D-4-IMPL (INC-2) DONE 2026-09-22 — PASS** — attack model (§4), layer resolution in HEAVY→MEDIUM→LIGHT→CIWS order (AC-3), heavy-AA 5nm/9_260m protected radius (AC-4), medium-AA pre-release + 4_000bp FC (AC-5), light-AA windows + speed bands (AC-6), §18 matrix, ADR-0042, 150 air-defense tests green. **Frontier: D-4-IMPL (INC-3: engagement formula + disruption + ammunition + damage).** | 3237 combat tests (245 air-combat) + 150 air-defense | D-3 COMPLETE, D-4 SCOPED |
| M5 Electronics & Missile Era | —       | Design docs exist (DESIGN-46–48)        | Not started                          | —                              | Future                   |

Live roadmap / next-action detail: `.ai/SPRINT-PLAN.md`.

---

## ✅ Completed

### M1 — Strategic Campaign Kernel (A-5 acceptance gate)

> **Status (2026-08-12): COMPLETED.** Formal M1 acceptance gate applied
> DESIGN-55 §9 to every M1 capability and signed the milestone COMPLETED per §23
> (scoped closure; deployment/DESIGN-25 deferred per ADR-0011). Full validate run:
> clean uncached build 17/17, `tsc -b` clean, 410 tests pass (sole failure = the
> pre-existing `content-schema/test/nation.test.ts` broken import), two
> child-process runs byte-identical, golden hashes 8/8. Registry + per-capability
> evidence: `docs/acceptance/m1-capability-registry.md`; gate report:
> `.ai/reports/a5-m1-acceptance-gate.md`.

| §2 capability            | State        | Evidence |
| ------------------------ | ------------ | -------- |
| Campaign compiler        | ACCEPTED     | B0–B8    |
| Nations and world        | ACCEPTED     | B0–B8    |
| Economy                  | ACCEPTED     | B10a     |
| Research                 | ACCEPTED     | B10b     |
| Ship design & construction | ACCEPTED   | B10a+B10b|
| Deployment (DESIGN-25)   | `CONTENT_ONLY` (deferred) | ADR-0011 |
| Diplomacy                | ACCEPTED     | B10c     |
| War and peace            | ACCEPTED     | B10c     |
| Monthly phase pipeline   | ACCEPTED     | B0–B8    |
| Save/load/replay/hashes  | ACCEPTED     | B0–B8    |
| Deterministic auto-resolution | ACCEPTED | B0–B8+B10d |

#### B10a — Economy & Construction

> **Status (2026-08-11): ACCEPTED.** Acceptance evidence recorded
> (`.ai/reports/a2-b10a-acceptance.md`). All 10 brief criteria pass. Added a
> 3-nation full-turn economy test; 32 turbo tasks green.

| Capability                    | Readiness | Key decisions                           |
| ----------------------------- | --------- | --------------------------------------- |
| Treasury + income             | ACCEPTED  | Balanced hashed ledger per nation       |
| Maintenance costs             | ACCEPTED  | `MAINTENANCE_EXPENDITURE` per fleet     |
| Appropriation & obligation    | ACCEPTED  | Proportional appropriation + obligation |
| Ship construction (paid-work) | ACCEPTED  | Completion promotes to FleetState       |
| Fixture                       | ACCEPTED  | 3 nations (GBR, FRA, GER)               |
| Acceptance                    | PASS      | `.ai/reports/a2-b10a-acceptance.md`     |

#### B10b — Research & Ship Design

> **Status (2026-08-11): ACCEPTED.** The A-0 acceptance pass (`.ai/reports/a0-b10b-acceptance.md`)
> originally returned BLOCKED because several brief criteria were unimplemented;
> the A-0b completion sprint closed every gap. `SetResearchPriorityCommand`
> validation, prerequisite-cycle detection, `DesignTemplateSchema` + design
> YAML, discovery revalidation, and the historical timing modifier are now
> implemented with proof tests for all 17 criteria. 32 turbo tasks green;
> golden determinism hashes unchanged.

| Capability                            | Readiness | Key decisions                                                       |
| ------------------------------------- | --------- | ------------------------------------------------------------------- |
| Research (15-field, 8-stage pipeline) | ACCEPTED  | `resolveResearchPhase` + priority command; ADR-0009 phase-id        |
| Ship design (YAML templates)          | ACCEPTED  | `DesignTemplateSchema` + deterministic compiledHash                 |
| Integration with construction         | ACCEPTED  | completion builds Ship from design attrs when `designVersionId` set |
| Fixture                               | ACCEPTED  | 3-nation research + design templates proof tests                    |
| Acceptance                            | PASS      | `.ai/reports/a0-b10b-acceptance.md`                                 |

#### B10c — Diplomacy & War

> **Status (2026-08-12): ACCEPTED.** A-3 completed; victory-level classification
> resolved via Option A (ADR-0010 + `warConstants.ts`). 7 commands (DeclareWar,
> AcceptPeace, FormAlliance, BreakAlliance, FormNonAggressionPact,
> BreakNonAggressionPact, DeclareBlockade), `RESOLVE_DIPLOMACY` phase (order 6.5),
> war side/score model, alliance auto-entry, blockade +2/mo, NAP penalty,
> surrender (score≥80), peace settlement. `BattleResolver` unchanged. 16/16 build;
> 400/401 tests (only the pre-existing `nation.test.ts` import fails); goldens
> regenerated per ADR-0007. Evidence: `.ai/reports/a3-b10c-diplomacy-war.md`.

| Capability                           | Readiness           | Key decisions                               |
| ------------------------------------ | ------------------- | ------------------------------------------- |
| Declare war, peace treaties          | ACCEPTED            | War lifecycle with side model; surrender ≥80|
| Alliances, NAPs, trade agreements    | ACCEPTED            | Pair registry; alliance auto-entry; NAP −50 |
| War score from battles               | ACCEPTED            | ADR-0010 Option A classification; ±2/5/10   |
| Blockade (+2/mo)                     | ACCEPTED            | DeclareBlockade, blockadeState              |
| `RESOLVE_DIPLOMACY` phase            | ACCEPTED            | order 6.5, rng false                        |
| All treaties (DESIGN-30) deferred    | Scope decision made | Out of scope for B10c                       |
| No settlement / separate peace       | Scope decision made | Out of scope for B10c                       |
| Acceptance                           | PASS               | `.ai/reports/a3-b10c-diplomacy-war.md`      |

#### B10d — AI & Scenario Readiness

> **Status (2026-08-12): ACCEPTED.** New `@bluewave/ai` package (legal-only, uniform-random AI via keyed RNG), `AI_PLANNING` phase (order 1.5), 3-nation 24-month zero-human-input smoke with deterministic replay. 17/17 build; full suite pass (only pre-existing `nation.test.ts` import fails); goldens regenerated (closingSnapshot+replay only). Evidence: `.ai/reports/a4-b10d-ai-scenario.md`.

| Capability | Readiness | Key decisions |
| ---------- | --------- | ------------- |
| Legal-only AI | ACCEPTED | uniform random; `ai/planning:<nation>/<type>` streams |
| AI_PLANNING phase | ACCEPTED | order 1.5, rngAllowed |
| Reuses CommandLifecycle | ACCEPTED | budget + SetResearchPriority |
| 24-mo zero-human smoke | PASS | deterministic replay |
| Acceptance | PASS | `.ai/reports/a4-b10d-ai-scenario.md` |

### M2 — Surface Tactical Core (B-6 acceptance gate)

> **Status (2026-08-15): COMPLETED.** B-1..B-6 landed through the orchestrator
> pipeline; the B-6 gate signed `M2_SURFACE_TACTICAL_CORE` COMPLETED per
> DESIGN-55 §23 (scoped closure). Gate evidence: clean uncached build 18/18,
> `tsc -b` clean, full per-package suites green (combat 900, campaign 107,
> phase-engine 108, persistence 26, cross-process 14, content-compiler 14,
> ai 22, commands 16, events 9, deterministic 11, random 16, contracts 20,
> diagnostics 7 — the only red suite is the pre-existing unrelated
> `content-schema/test/nation.test.ts` import), golden hashes 10/10, two-process
> determinism byte-identical. `BattleResolver`/`StrengthCalculator` unmodified
> throughout. Registry: `docs/acceptance/m2-capability-registry.md`; report:
> `.ai/reports/b6-m2-battle-results-impl.md`. **Deferred to M3/Track C:**
> torpedoes/mines/subs/coastal defense, smoke + detailed damage control.
> **Deferred to CONTENT-track:** B-1 AC-14 production ship→design linkage,
> climate-profile YAML.

#### B-1 — Battle Generation & Tactical Setup Scaffolding

> **Status (2026-08-12): IMPLEMENTED — PASS_WITH_LIMITATIONS.** INC-1..INC-6 through
> the orchestrator pipeline; reviewer BLOCKER (real composition) + HIGH-4 (manifest
> clone) + MEDIUM-8 (division predicates) repaired. Commits `282f21d..41c2b0e`.
> Evidence: `.ai/reports/b1-m2-battle-scaffolding-impl.md`.

| Deliverable | Readiness | Key decisions |
| ----------- | --------- | ------------- |
| Tactical-unit promotion + ship type | ACCEPTED | `promoteTacticalUnit`, `ship_type_classifier_v1` (ADR-0013) |
| Permanent divisions + commands | ACCEPTED | `NationState.divisions`; 5 division commands (ADR-0012) |
| Mission registry (9) + reachable subset | ACCEPTED | `opportunity_reachability_v1` (ADR-0014/0015) |
| Composition (gather/roles/optional/repair) | ACCEPTED | keyed streams, ≤3 repair passes |
| Manifest + seed + reservations | ACCEPTED | `manifest_hash_v1`, `battle/battle_id/root` (ADR-0016) |
| Auto-resolution proof | ACCEPTED | declared surface (ADR-0017) |
| `battle_generation` phase (order 7.5) | ACCEPTED | before `battle_resolution`, no-op keeps collections absent |
| AC-14 production ship→design linkage | **PARTIAL** (deferred) | production `fleets.yaml` ships lack `designVersionId`; CONTENT-track to author grounded links; not fabricated |
| `BattleResolver`/`StrengthCalculator` | Unmodified | resolved via M1 strength path |

#### B-2 — Tactical Movement, Spotting & Contact State

> **Status (2026-08-12): IMPLEMENTED — PASS.** Movement kinematics (integer
> direction table, formation stations), spotting/sensor model (safe-integer
> metre-quantized detection + LOS + keyed-retention seam), unified
> `TacticalContact` lifecycle (fog-of-war via `validateTargetOrder`),
> minute-advance simulation engine (DESIGN-38 steps 4–8, `BattleLedger` +
> `canonicalEventOrder`, per-minute hash, two-process determinism), versioned
> `*_v1` contracts + guards, exact §36 reason-code surface. ADR-0018 (scope),
> ADR-0019 (contact shape). Combat 166 tests green; goldens 9/9 unchanged.
> Evidence: `.ai/reports/b2-m2-movement-spotting-impl.md`.

#### B-3 — Gunnery (core surface fire-resolution)

> **Status (2026-08-13): IMPLEMENTED — PASS.** `GunneryState` + 7 fire modes +
> fixed-point guards + `gunnery_v1` contract; accuracy (17-factor manifest,
> exact integer product, one FLOOR, keyed hit-draw); rate-of-fire/reload +
> gun-quality table; salvo/event → immutable `GunneryEventRecord` + canonical
> ordering + atomic ammunition + `resolveGunnery` wired after spotting in the
> minute-advance (strict no-op when no batteries → B-2 hashes unchanged) +
> fog-of-war target legality + two-process determinism. INC-5: full `*_v1`
> contracts rollup (5 contracts), reason-code set-equality vs DESIGN-39 §32,
> research-grounded naval gun ballistics constant set (`gunnery_ballistics_v1`,
> 6 calibers + 1880s RML heavy-gun BALANCE TARGET), **ADR-0020**. Combat suite
> 44 files / 325 tests green; goldens 9/9 unchanged. A pre-existing unrelated
> `packages/ai/src/aiPlanner.ts` build defect (TS2367) was repaired en route.
> Evidence: `.ai/reports/b3-m2-gunnery-impl.md`. **Deferred (recorded):**
> autoloaders, dual-purpose guns, straddle, target allocation → later gunnery
> slices / M3.

#### B-4 — Basic Armor & Damage

> **Status (2026-08-14): IMPLEMENTED — PASS.** All AC-1..AC-16 criteria pass through
> 6 increments. ShipDamageState invariant + pipeline skeleton (INC-1); armor model
> with zone maxima, quality families, thick-armor manufacturing, splinter threshold,
> 7 penetration outcomes (INC-2); hit location + protection interaction (INC-3);
> component damage + turret states + structure/flotation + event record + ordering +
> engine wiring (INC-4); immediate fire/flooding creation + magazine secondary hazard +
> SINKING/FOUNDERED terminal detection + two-process determinism (INC-5); full contract
> rollup + reason-code set-equality + ADR-0021 (INC-6). 16 damage test files, 265 tests
> green. `BattleResolver`/`StrengthCalculator` unmodified.

| Deliverable | Readiness | Key decisions |
|------------|-----------|---------------|
| ShipDamageState + pipeline skeleton | ACCEPTED | 10-stage no-skip pipeline; transaction rollback (ADR-0021 §1) |
| Armor model (DESIGN-39 §§16-24) | ACCEPTED | Zone maxima: belt 20in, turret-face 26in; quality families (ADR-0021 §6) |
| Hit location + protection interaction | ACCEPTED | AABB geometry; simplified linear penetration (ADR-0021 §4) |
| Component damage + turret states + structure/flotation | ACCEPTED | 8 outcomes + 5 turret states + capped structure/flotation |
| Immediate fire/flooding + magazine hazard + terminal seam | ACCEPTED | Creation-only; SINKING/FOUNDERED detection |
| Event record + ordering + engine wiring | ACCEPTED | §45+§46; resolveDamage after gunnery; strict no-op |
| Contracts + reason codes + ADR-0021 | ACCEPTED | fail-closed; set-equality guard |
| Golden hashes | UNCHANGED | 9/9; strict no-op preserves B-2/B-3 |

#### B-5 — Tactical Weather & Visibility

> **Status (2026-08-15): IMPLEMENTED — PASS.** All AC-1..AC-17 criteria pass through
> 6 increments. `StrategicWeatherState` + invariant + `weather_generation` phase
> (order 0.5, keyed RNG `campaign/weather/<areaId>/<month>`) (INC-1); battle-weather
> init with area-consistency + `INVALID_BATTLE_WEATHER_INITIALIZATION` fail-closed +
> 12 tactical components (INC-2); 30-min progression (per-interval stream
> `battle/weather/interval/<n>`, ±1 sea-state clamp, fail-closed table validation) +
> visibility formula (BigInt, one FLOOR) (INC-3); glare / fog / precipitation /
> night-twilight with shipped multiplier bands (INC-4); `resolveWeather` engine
> stage (step 7.5, strict no-op) + `WeatherEventRecord` (§28) + canonical ordering
> (§29) + two-process determinism + random-ledger audit port (INC-5); 4 `*_v1`
> contracts + reason-code set-equality (§30 weather subset + 3 documented markers) +
> ADR-0022 (INC-6). 16 weather test files + 182 tests green; combat suite 84 files /
> 847 tests. `BattleResolver`/`StrengthCalculator` unmodified. Reviewer NEEDS_REWORK
> (H1 stale hashes) → repaired → APPROVE; follow-up pass closed a dormant
> solar-bearing −1 schema-vs-guard gap.

| Deliverable | Readiness | Key decisions |
|------------|-----------|---------------|
| `StrategicWeatherState` + weather phase | ACCEPTED | `weather_generation` order 0.5 (ADR-0022 §2) |
| Battle-weather initialization + components | ACCEPTED | 12 §3 components; area-consistency assert (ADR-0022 §3) |
| Tactical progression (30-min) | ACCEPTED | per-interval streams; ±1 sea-state law (ADR-0022 §5) |
| Visibility formula + one FLOOR | ACCEPTED | BigInt documented bound; `WEATHER_VISIBILITY_FORMULA_MISSING` |
| Glare / fog / precipitation / night-twilight | ACCEPTED | §24–27 shipped bands; fail-closed daylight profile (ADR-0022 §9) |
| `resolveWeather` stage + records + ordering | ACCEPTED | step 7.5 before spotting; strict no-op (ADR-0022 §6) |
| Contracts + reason codes + ADR-0022 | ACCEPTED | fail-closed; §30 set-equality; random-ledger port ≥ B-3/B-4 |
| Golden hashes | UNCHANGED | 9/9; no-op preserves B-2/B-3/B-4 |

#### B-6 — Battle Results → Campaign Integration + M2 Gate

> **Status (2026-08-15): IMPLEMENTED — M2 COMPLETED.** INC-1 (`62fba1d`)
> snapshot `startYear/startMonth` + per-area strategic weather; authoritative
> `weather_generation` phase (order 0.5) via `defaultClimateProfile_v1`
> (ADR-0025). INC-2 (`405bace`) `resolveBattleAuto` deterministic tactical
> auto-resolver + gunnery→damage seam closure, DESIGN-38 §32 battle end
> (ADR-0026). INC-3 (`1c7b76a`) `battle_resolution` phase (order 8) wiring +
> war-score/ship-loss/reservation consequences, A-3 `applyBattleResult`
> unchanged (ADR-0027). INC-4 folded (contracts/reason-codes/goldens
> two-process). INC-5 M2 §9/§23 gate — signed COMPLETED. Goldens 10/10
> (INC-1 regenerated under ADR-0007, documented). Registry:
> `docs/acceptance/m2-capability-registry.md`; report:
> `.ai/reports/b6-m2-battle-results-impl.md`. **Next: M3 (Track C).**

### Core engine packages (B0–B8) — ACCEPTED

Each entry uses a _capability readiness state_: CONTENT_ONLY / IMPLEMENTED_UNVERIFIED / VERIFIED_NOT_INTEGRATED / INTEGRATED_NOT_ACCEPTED / ACCEPTED.

| Package                        | State                   | What it does                                                                                                        |
| ------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@bluewave/contracts`          | ACCEPTED                | SafeInt branded integers, checked arithmetic                                                                        |
| `@bluewave/deterministic`      | ACCEPTED                | Canonical serialization + SHA-256 enveloping                                                                        |
| `@bluewave/diagnostics`        | ACCEPTED                | Structured diagnostic collector (error/warning/info)                                                                |
| `@bluewave/content-schema`     | ACCEPTED                | YAML schema definitions, Zod validation, YAML parser                                                                |
| `@bluewave/content-compiler`   | ACCEPTED                | 4-stage pipeline: parse → validate → normalize → compile                                                            |
| `@bluewave/campaign`           | ACCEPTED                | Campaign compiler + state aggregates (world, nations, fleets, research, construction, war, diplomacy, intelligence) |
| `@bluewave/random`             | ACCEPTED                | SHA-256 domain-separated PRNG with audit ledger                                                                     |
| `@bluewave/commands`           | ACCEPTED                | 7-step command lifecycle, idempotency, ledger                                                                       |
| `@bluewave/events`             | ACCEPTED                | Domain event envelopes, 5 event types, explanation trees                                                            |
| `@bluewave/phase-engine`       | ACCEPTED                | 14-phase turn pipeline (see registry below), month executor, replay verifier, financial ledger                       |
| `@bluewave/persistence`        | ACCEPTED                | Content-addressed atomic save/load, recovery                                                                        |
| `@bluewave/combat`             | ACCEPTED                | Deterministic auto-resolution; M2 tactical simulation (minute-advance, gunnery, armor/damage, weather, auto-resolve) |
| `@bluewave/ai`                 | ACCEPTED                | B10d: legal-only uniform-random AI planning (AiPlanner/AiCommandGenerator/AiPhaseExecutor) via keyed RNG            |
| `@bluewave/campaign-engine`    | ACCEPTED                | Desktop read-only projections over the compiled snapshot + `campaign:execute` bridge commands                        |
| `@bluewave/cross-process-test` | ACCEPTED                | Cross-process determinism proof harness                                                                             |
| `@bluewave/test-support`       | ACCEPTED                | Shared test utilities                                                                                               |
| `compiler-cli`                 | INTEGRATED_NOT_ACCEPTED | CLI (bwc): validate, compile, inspect, verify, compare, campaign:_, turn:_, replay; `battle:generate`/`advance-minute`/`resolve-shot` debug surface |
| `desktop`                      | INTEGRATED              | Electron (41) + React 19 game client: playable MVP loop + Research & Technology + Diplomacy & War + battle outcomes + debug-mode gating; E2E Playwright suite in progress |

#### Phase Registry (16 ordered phases)

Authoritative source: `packages/phase-engine/src/registry.ts`. Added since M1:
`weather_generation` (B-5/B-6, ADR-0022/0025), `ai_planning` (B10d),
`resolve_diplomacy` (B10c), `battle_generation` (B-1), `resolve_aircraft_development` (D-1),
`resolve_carrier_operations` (D-2).

| Order | Phase                  | RNG allowed | Notes                                        |
| ----- | ---------------------- | ----------- | -------------------------------------------- |
| 0     | `opening_validation`   | no          | validate treasury/caps/battle assignment     |
| 0.5   | `weather_generation`   | yes         | per-area strategic weather (B-5/B-6)         |
| 1     | `monthly_revenue`      | no          | treasury income                              |
| 1.5   | `ai_planning`          | yes         | legal-only AI command generation (B10d)      |
| 2     | `command_collection`   | no          | player command processing                    |
| 3     | `appropriation`        | no          | proportional construction funding            |
| 4     | `maintenance`          | no          | `MAINTENANCE_EXPENDITURE` per fleet          |
| 5     | `obligation`           | no          | mandatory fixed expenses                     |
| 6     | `construction_processing` | no        | progress cap enforcement                     |
| 6.5   | `resolve_diplomacy`    | no          | diplomacy/war/blockade resolution (B10c)     |
| 7     | `resolve_research`     | yes         | RNG-driven research point allocation         |
| 7.2   | `resolve_aircraft_development` | yes | Aircraft development pipeline (D-1)     |
| 7.3   | `resolve_carrier_operations` | yes | Carrier operations advancement (D-2)     |
| 7.5   | `battle_generation`    | yes         | manifest battles from reachable missions (B-1)|
| 8     | `battle_resolution`    | yes         | auto-resolve pending battles (B-6)           |
| 9     | `closing_validation`   | no          | final state validation + hash                |

### What's solid

- Deterministic by design: canonical serialization + SHA-256 end-to-end
- Replay verifier compares ledgers across runs
- Cross-process determinism proven
- All 14 strategic turn phases execute and produce auditable state transitions
- Tactical layer (B-1..B-6) is engine-only, deterministic, and slotted into the
  monthly pipeline via `battle_generation`/`battle_resolution`/`weather_generation`
- Desktop surfaces are read-only over the engine (projection + bridge + renderer);
  the engine stays the only writer of authoritative state

---

## 🖥 Desktop & CLI surfaces

### Desktop MVP — playable campaign loop (`apps/desktop`)

> **Status (2026-08-15): IMPLEMENTATION COMPLETE — READY FOR PLAYTEST.** The
> desktop-mvp wayfinder effort (`.scratch/desktop-mvp/`) delivered the
> reversed-scope game-client shell on `dev`: `@bluewave/campaign-engine`
> projection package, single `campaign:execute` bridge (22 commands, 1 IPC
> channel), renderer boots `shell/App.tsx`, and all 16 tickets resolved.
> New Game (archetype → nation → preferences) → compile real campaign →
> Overview → Simulation (advance a month vs `MonthExecutor`, battles
> auto-resolved) → Construction (submit/replace/cancel, real
> `packages/commands` lifecycle) → Fleet (read-only) → Save/Load/Verify/
> Replay/Recover all real against `content/production/1880`. Distribution
> via `pnpm dev` (no packaging). Commits: `db1e6e1`, `18ce4b3` (+ ticket
> 11–13 work in prior commits). Known caveats: `SaveStore` envelope hash
> doesn't cover Map-backed state (ADR-0024, replay is the strong integrity
> check; serializer migration deferred to the persistence track);
> `OperationStatus.tsx` success-copy and Construction `projects` render are
> screen follow-ups (map "Out of scope"); pre-existing `content-schema`
> `nation.test.ts` import is broken (unrelated).

### Desktop Engine-Feature Gate — Research & Technology screen

> **Status (2026-08-15): DONE — PASS.** The desktop-engine-feature-gate effort
> (`.scratch/desktop-engine-feature-gate/`) gated engine-built-but-desktop-missing
> capabilities and delivered the **Research & Technology** screen as its
> frontier. `@bluewave/campaign-engine` gains a pure
> `research.ts` projection (budget, field priorities, in-progress tech work,
> discovered techs, current project — one-to-one with `nation.research`); the
> bridge grows to 24 `campaign:execute` commands
> (`inspectResearchScreen`, `setResearchPriorityCommand`); the desktop queues a
> real `SetResearchPriorityCommand` envelope and `commitMonth` drains it into
> `MonthExecutor`'s command_collection — the engine stays the only writer of
> `nation.research`. Deterministic envelope scheme mirrors `@bluewave/ai`;
> two-process issue+commit child is byte-identical. Desktop 298 tests,
> campaign-engine 40, goldens 10/10 unchanged. Report:
> `.ai/reports/desktop-engine-feature-gate.md`.

### Desktop Diplomacy & War screen

> **Status (2026-08-15): DONE — PASS.** B10c surfaced end to end
> (`.scratch/desktop-diplomacy-war/`). `@bluewave/campaign-engine` gains a pure
> `diplomacy.ts` projection (known nations, player relations kind/tension/nap/since,
> player-membered wars w/ war scores + player side, blockades, world areas); the
> bridge grows to 26 commands (`inspectDiplomacyScreen`, `submitDiplomacyCommand`
> — a Zod-discriminated union over the 7 B10c command bodies). The per-session
> command queue is generalized (`pendingCommands.ts`, with `researchWorkspace.ts`
> as a facade) so research + diplomacy share one `commitMonth` drain seam; the
> desktop issues envelopes only — `MonthExecutor`'s command_collection (order 2) +
> `resolveDiplomacyPhase` (order 6.5) are the sole mutators of politics/wars/
> blockades, and issue-time validity comes from the engine's own public
> `CommandLifecycle.validate` (codes surfaced verbatim). Renderer: Relations /
> Wars / Blockades cards with honest copy + engine rejection notices. Goldens
> 10/10 unchanged; cross-process 14/14; desktop 343; campaign-engine 46. Report:
> `.ai/reports/desktop-diplomacy-war.md`. **Known limitations recorded:**
> DeclareBlockade `areaId` membership is an upstream engine gap (unreachable via
> the honest picker); during-drain same-batch rejection is silent-by-design.

### Desktop battle-outcome surfacing

> **Status (2026-08-15): DONE — PASS.** Third gate-queue desktop surface
> (`.scratch/desktop-battle-outcomes/`). `@bluewave/campaign-engine` gains a flat
> `BattleOutcome` type + `ClosingSnapshotSummary.battleOutcomes` (type-only, no
> hash impact); `commitMonth` hydrates one outcome per battle resolved THIS
> month (pre→post resolved-set delta — the engine never emits `BattleResolved`
> events) with `warScoreDelta` re-derived from the engine's own victory rule
> (`month.ts:1508-1538`) over the **pre-battle** snapshot (ADR-0028; `0` when
> undecided or the loser is unavailable — never fabricated). Renderer adds a
> "Battle Outcomes" accordion to the Turn Report (sides, winner/loser honest
> tie copy, war-score delta, ship losses, engine explanation; honest empty
> state). Fully read-only over the engine — no phase-engine/combat/content
> change, goldens 10/10 unchanged, `BattleResolver`/`StrengthCalculator`
> untouched. Desktop 353, campaign-engine 49; cross-process 14/14. Report:
> `.ai/reports/desktop-battle-outcomes.md`. **Queued next candidates**
> (`.scratch/desktop-feature-gate/`): strategic weather surfacing (B-5/ADR-0025),
> AI-plan read-only, divisions/formation view, design-template catalog.
> **Follow-up (deferred, engine-sprint):** persist the war-score delta on
> `BattleResult`.

### Desktop debug-mode gating

> **Status (2026-08-16): DONE.** Simulation & Turn, Tactical Sandbox, and
> Debugging & Telemetry screens are gated behind build-time debug mode
> (`import.meta.env.DEV || VITE_BLUEWAVE_DEBUG === "true"`), folded out of the
> production registry via inline spreads (commit `c8553a1`, ADR-0029). The
> bundler constant-folds the guard so the production app never exposes
> developer tooling; `VITE_BLUEWAVE_DEBUG=true` builds include it. Desktop 360
> tests green; production bundle verified to drop the debug registry entries.

### Desktop E2E suite

> **Status (2026-08-16): IN PROGRESS.** Hermetic Playwright suite for
> `apps/desktop` (`.scratch/desktop-e2e-suite/`), charted by
> `.scratch/desktop-e2e-coverage/` (coverage matrix:
> `.scratch/desktop-e2e-coverage/coverage-matrix.md`). Boots the **built** app
> (no dev server), stubs native dialogs against on-disk fixtures, asserts
> user-visible behavior only. Tickets 1–3 resolved (harness scaffold,
> new-game-compile, advance-month); 4–7 ready-for-agent (construction,
> fleet/honest-stub surface, continuance, CI gate `desktop-e2e.yml`).

### Fleet Movement Strategy Map (desktop scoping)

> **Status (2026-08-28): SCOPING DONE — PASS.** New desktop-side charting effort
> for the campaign strategy map (`.scratch/fleet-movement-strategy-map/`), scoped
> and sliced with a wayfinder map, 6 resolved decision tickets, a spec (29 742
> bytes), and 6 frontier-ordered implementation tickets (INC-1..INC-6). Covers:
> campaign-geometry seam with real MapData coastline promotion (`@bluewave/campaign`
> `compiler`, `compileOutput`), fleet-chart shell wrapper, click-to-order interaction,
> per-division tooltip and route lines, strategy-signals and fog-of-war
> faithfulness, and shell-isolation with camera + performance (tile-atlas + viewport
> culling). Research notes: `docs/research/fleet-movement-strategy-map-geometry-seam.md`,
> `docs/research/fleet-movement-strategy-map-camera-perf.md`. Brief + spec pointer:
> `.ai/specs/fleet-movement-strategy-map.md`. **Frontier: INC-1 (campaign geometry
> & coastline asset promotion).** See `.scratch/fleet-movement-strategy-map/`.

### Campaign commissioning flow (game-onboarding)
> **Status (2026-08-16): COMPLETE (INC-1..INC-8).** `.scratch/game-onboarding/`
> (wayfinder map + 8 resolved decision tickets + assembled spec). Reorders and
> enriches the new-game flow into the spec's 9-step commissioning sequence
> (Nation confirmation → Rules of the Naval Age → Archetype → Admiral &
> Campaign Identity → Starting Fleet Method → Final Commissioning Review →
> World-generation presentation → Opening Strategic Briefing → Overview
> dashboard). INC-2 (nation dossier enrichment), INC-3 (Rules of the Naval
> Age presets), INC-4 (identity step), INC-5 (fleet-method screen), INC-6
> (commissioning review) landed in earlier commits; **INC-1** (state-machine
> reorder) and **INC-7** (world-generation presentation) verified done;
> **INC-8 (Opening Strategic Briefing)** implemented this session — a new
> `@bluewave/campaign-engine` read-only projection
> (`buildOpeningBriefingProjection`, `src/opening-briefing.ts`), a new
> `inspectOpeningBriefing` bridge command, the 5-page briefing screen
> (Appointment / State of the Navy / Treasury / Foreign Intelligence /
> Immediate Concerns), and the world-gen → briefing → dashboard handoff.
> Every page derives from real snapshot data (design-catalog hullType tally,
> construction-queue paid-work, port-level dock, income×appropriation
> allocation, research budget, diplomacy relations+tension); nothing is
> fabricated and no new domain concept is introduced. Component/engine tests
> cover the derivation and the Back/Next/Take-command path. All data-backed
> decision tickets recorded as ADR-less documented judgment calls in the
> projection's header.

### First Month at the Admiralty (game-onboarding-first-month)

> **Status (2026-08-17): CHARTING + SPEC ASSEMBLY COMPLETE; SLICED.** The M2
> "First Month at the Admiralty" wayfinder effort
> (`.scratch/game-onboarding-first-month/`) resolved **all 18 decision tickets**
> (01–18, wayfinder charting), assembled the **single M2 spec**
> (`spec.md`, 1 508 lines; pointer `.ai/specs/game-onboarding-first-month.md`),
> and sliced it into **14 frontier-ordered implementation tickets**
> (`issues/INC-01..14`). Headline decisions, all grounded per-ticket against
> the real code: **Immediate Priorities** = a new read-only
> `@bluewave/campaign-engine` projection shipping **6 of 8** doc types
> (`obsolete_active_class` + `construction_stalled` cut — no trustworthy
> signal; `construction_near_completion` adapted to a 0.9 work-ratio);
> **Treasury** is a read-only projection screen (two new
> `PlayerProjection.economy` fields, no budget commands); **no ship-naming
> step** (no `shipName` input exists; completed ships auto-name
> `Ship {className}`); **no real month-resolution progress streaming**
> (cosmetic world-gen-pattern sequence over the synchronous `commitMonth`);
> two **new tolerant renderer-owned sidecars** (`ui-state.json` for
> dismissal/inspection state, `monthly-reports.json` for last-12 report
> history) — both outside the authoritative envelope; the naval-estimates
> report = the real `CommitMonthResponse` rendered faithfully with battle
> outcomes as a dedicated plain-text subsection; Foreign Relations = the
> already-shipped read-only Diplomacy & War surface with a `likelyRivals`
> flavor marker and a current-state high-tension warning (ticket 11's
> `tensionLabel`/`isHighTension` implemented in `campaign-engine`). Two items
> **flagged, not resolved**: the `baseResources`-vs-`income` revenue
> divergence (compiler hardcodes `baseResources: SafeInt(0)`) and the
> turnNumber-as-revision same-month-conflict gap. Commits
> `06014b2`/`ae951eb`/`b95073c`/`81066d6`/`3f83d1d`. **Frontier:** INC-1
> (economy projection extension) DONE (2026-08-17, `4a5eb20`); **INC-3
> (`ui-state.json` per-campaign renderer-owned sidecar) DONE 2026-08-18** —
> atomic tmp→rename write, tolerant read (missing/corrupt→defaults), expiry of
> dismissal fingerprints on turn advance, merge-preserve write semantics (a
> dismissal-only write never erases inspection state), narrow Zod-validated
> `readUiState`/`writeUiState` IPC pair, `turnNumber` stamped server-side, never
> authoritative (zero hash surface; goldens 10/10; two-process byte-identical);
> reviewer APPROVE; ADR-0038; report
> `.ai/reports/game-onboarding-first-month-inc3.md`. **INC-14 (campaign shell
> header) + INC-2 (priorities projection) DONE 2026-08-18** (report
> `.ai/reports/game-onboarding-first-month-inc14-inc2.md`). **INC-13
> (campaign-list screen) + INC-4 (read-only Treasury screen) DONE 2026-08-19**
> — `listCampaigns` IPC (native-dialog package dir → `SaveStore.list`, real
> `SaveMetadata[]` newest-first, corrupt skipped), a 6-column CampaignListScreen
> (legacy/degraded rows render `—`; status column `—` — not derivable from
> `SaveMetadata`; load via real `loadCampaign`/`CompatibilityChecker`), and the
> Treasury screen replacing INC-14's stub (`PlayerProjection.economy
> .maintenanceCost` added; income/expenditure/result all from `inspectCampaign`;
> no budget controls). Desktop 507/507, goldens 10/10, two-process byte-identical;
> report `.ai/reports/game-onboarding-first-month-inc13-inc4.md`. **INC-5 (research allocation edit UX — field-level priorities, `MAX_HIGH_PRIORITY_FIELDS=5` cap, projected monthly progress as pure largest-remainder derivation, autosave via `SaveStore` with `SAVE_FAILED` rollback, renderer-only unsaved indicator via the existing `SetResearchPriorityCommand` path) DONE 2026-08-19** (commit `a0079ed`, report `.ai/reports/game-onboarding-first-month-inc5.md`; desktop 507/507, `tsc -b` clean, goldens 10/10, byte-identical). **INC-6 (Overview dashboard — header/naval-position/foreign-situation via tensionLabel, cap-5 priorities verbatim empty-state, Recent Developments honest empty-state) DONE 2026-08-19** (report `.ai/reports/game-onboarding-first-month-inc6.md`; OverviewScreen + state helpers). **INC-7 (guided inspection — 7-step DOM spotlight, ui-state sidecar, restart, autosave) DONE 2026-08-20** (GuidedInspectionOverlay + guided-inspection-state + useGuidedInspection + CampaignPreferences restart; 16 new tests, desktop 523/523, goldens 10/10). **INC-8 (construction ordering wizard — select design → review → confirm over real commands, no ship-naming, honest rejection codes, replace/cancel, autosave) DONE 2026-08-28** (commit `295d678`). **INC-9 (foreign relations polish — likely-rival markers, isHighTension warnings, read-only) + INC-10 (pre-turn review dialog — all fields from real state, honest blockers, double-submit guard) + INC-11 (monthly-resolution presentation — 7-stage cosmetic loading screen over synchronous commitMonth, failure UI with real BridgeResult codes) DONE 2026-08-28** (bundled commit `a1a3b2b`). **Tour guide repair:** fixed guided-inspection overlay pinning at campaign start (`7e624cb`). **Next frontier: INC-12 (Monthly Naval Estimates report + monthly-reports.json history sidecar).**
> C-3-IMPL (submarines) remains queued on the implementation track.

### CLI battle/gunnery debug surface

> **Status (2026-08-16): DONE.** `.scratch/cli-battle-debug-surface/` (all 5
> tickets resolved, commit `de6eb55`): `battle:generate`, `battle:advance-minute`,
> `battle:resolve-shot` drive `@bluewave/combat` standalone, plus enriched
> `turn:execute`/`replay` battle output (generation records, damage reports,
> outcomes) via a `BluewaveError` → `DiagnosticCollector` adapter.

### Desktop renderer side-tracks — DONE

> UI-kit React 19 migration (`.scratch/desktop-ui-kit-migration/`), campaign
> save viewer (`.scratch/desktop-campaign-viewer/`), and the `SaveStore`
> Map-serialization fix (`d72438c` / `3441427`). The earlier desktop test/lint
> repair (missing `@testing-library/react` + wrong `@bluewave/campaign-engine`
> import) is resolved — the `campaign-engine` package exists and desktop suites
> are green.

### B9 — Electron Desktop Shell

> **Status (2026-08-11): PASS_WITH_LIMITATIONS.** Acceptance evidence recorded
> (`.ai/reports/a1-b9-acceptance.md`). Build, packaging (mac dmg/zip + linux
> AppImage), unit + boundary tests all green. CSP and IPC narrowing tested.
> Limitations: live Electron GUI start and full renderer→main IPC round-trip
> are not automated headlessly; Windows nsis not built on macOS.

| Capability              | Readiness             | Key decisions                                                 |
| ----------------------- | --------------------- | ------------------------------------------------------------- |
| Electron packaging      | PASS_WITH_LIMITATIONS | dmg+zip/nsis/AppImage config; mac+linux built, win configured |
| Desktop content display | CLI-only for B9       | read-only renderer deferred                                   |
| CSP / IPC boundary      | PASS                  | `default-src 'self'`; single `compile` channel                |
| Acceptance              | PASS_WITH_LIMITATIONS | `.ai/reports/a1-b9-acceptance.md`                             |

---

## 📦 Workstream C — Production Content

> Primary `FULLY_SUPPORTED` scenario anchor: `scen_1880` (Jan 1880), reachable
> era bands all five, max duration 1092 mo (sim end Dec 1970), pack layout
> `content/production/1880/` (`type: "production"`, zero compiler change),
> content map + DESIGN-55 §12 classification policy (DESIGN-55 §14 reachability
> is the gate for promoting `CONTENT_ONLY_LOCKED` → `SUPPORTED_MECHANICAL`).
> Charter: `.ai/briefs/content-0-production-pack-charter.md`; wayfinder map
> `.scratch/content-0-production-pack/`; research `docs/research/content-0-*.md`.
> Pack version: **`0.3.0`** (INTERWAR).

### CONTENT-1 — M1-Era Production Content Pack

> **Status (2026-08-11): DONE/PASS.** Authored the first production content
> pack at `content/production/1880/` for the `scen_1880` anchor: 14 countries,
> ~100 areas, 35+ routes, ~70 possessions, ~95 ports, 34 EARLY technologies
> (acyclic DAG), 16 ship designs, 22 fleets, 14 economies, 9 constructions,
> 14 research states — grounded in four research notes
> (`docs/research/content-1-*.md`). Compiles deterministically via the desktop
> `runCompilation` path (content hash `44953238…`, snapshot `f3e72642…`);
> `apps/desktop/test/production-pack.test.ts` locks the compile + hashes.
> Diplomacy relations intentionally omitted (B10c blocked → DESIGN-55 §14
> reachable-locked concern). Evidence: `.ai/reports/content-1-m1-production-content.md`;
> brief `.ai/briefs/content-1-m1-production-content.md`; wayfinder
> `.scratch/content-1-m1-production-content/`.

### CONTENT-2 — PRE_WAR-Band Technology & Ship-Design Continuation

> **Status (2026-08-11): SCOPING DONE — PASS; (2026-08-12): IMPLEMENTED — PASS.**
> Locked and authored the PRE_WAR-band (Jan 1900 – Dec 1919) slice of
> `content/production/1880/`: 25 research techs across 10 fields
> (`category: PRE_WAR`, acyclic, seeded on CONTENT-1 tails) + 11 real-class
> ship-design templates (Dreadnought, Invincible, Orion, Queen Elizabeth, South
> Carolina, Nassau, Kōnig, Kongō, Fuso, Courbet, Dante Alighieri). All
> `SUPPORTED_MECHANICAL` (Research/Design `ACCEPTED`, no reachable-locked
> content). Grounded in verified high-trust sources
> (`docs/research/content-2-prewar-era-tech-and-design.md`). Pack `0.1.0`→`0.2.0`;
> production-pack test PASS; compiles deterministically (content `c3be5604…`,
> snapshot `cb1f1497…`). **Deferred (mechanics-gated):** deployment (DESIGN-25,
> unassigned), blockades (B10c, blocked), AVIATION/CARRIER PRE_WAR techs (M4,
> DESIGN-55 §14). Brief `.ai/briefs/content-2-prewar-tech-design.md`; wayfinder
> `.scratch/content-2-prewar-tech-design/`; evidence
> `.ai/reports/content-2-prewar-tech-design.md`.

### CONTENT-3 — INTERWAR-Band Technology & Ship-Design Continuation

> **Status (2026-08-12): DONE/PASS (scoping + implementation).** Locked and
> authored the INTERWAR-band (Jan 1920 – Dec 1939) slice of
> `content/production/1880/`: 24 grounded research techs across 10 supported
> fields (`category: INTERWAR`, acyclic, seeded on PRE_WAR tails) + 10 real-class
> design templates (Nelson, King George V, North Carolina, Yamato, Bismarck,
> Scharnhorst, Littorio, Richelieu, Nagato, Myōkō). All `SUPPORTED_MECHANICAL`
> (Research/Design `ACCEPTED`; no reachable-locked content). Grounded in verified
> high-trust sources (`docs/research/content-3-interwar-era-tech-and-design.md`).
> Pack `0.2.0`→`0.3.0`; production-pack test PASS; compiles deterministically
> (content `190fa7a9…`, snapshot `2ae3e505…`); full suite green (only pre-existing
> `nation.test.ts` import fails); goldens 8/8 unchanged (content-only).
> **Deferred (DESIGN-55 §14):** AVIATION, CARRIER_OPERATIONS,
> RADAR_AND_ELECTRONICS, MISSILES, AMPHIBIOUS_OPERATIONS INTERWAR content
> (M4/M5); deployment (DESIGN-25); blockades. Brief
> `.ai/briefs/content-3-interwar-tech-design.md`; wayfinder
> `.scratch/content-3-interwar-tech-design/`; evidence
> `.ai/reports/content-3-interwar-tech-design-impl.md`.

---

## 🔮 Not Yet Started (M3–M5)

### M3 — Advanced Surface Warfare (Track C — COMPLETED 2026-08-29)

Depends on accepted M1 + M2 (DESIGN-55 §4) — both COMPLETED. **M3 COMPLETED at
the C-6 acceptance gate (2026-08-29).** All six §4 capabilities signed ACCEPTED:
torpedoes (C-1), mines (C-2), submarines (C-3), coastal defenses (C-4), smoke (C-5),
and detailed damage control (C-5). Registry: `docs/acceptance/m3-capability-registry.md`.
Full validation gate evidence: clean uncached build 18/18, `tsc -b` clean,
combat 197 files / 2524 tests green, golden hashes 10/10, two-process
determinism byte-identical, `BattleResolver`/`StrengthCalculator` unmodified
throughout. Pre-existing unrelated failures: `content-schema/test/nation.test.ts`
(broken import), desktop 2 tests (campaignBridge, ConstructionWizard). **Next: D-1
(M4 Aviation scoping).**

| Area                                  | Design coverage |
| ------------------------------------- | --------------- |
| Torpedoes (C-1)                       | DESIGN-40 — **COMPLETE** (INC-1..8, AC-1..25, ADR-0031) |
| Mine warfare (C-2)                    | DESIGN-35 — **COMPLETE** (INC-1..8 PASS, AC-1..25, ADR-0033) |
| Submarines (C-3)                      | DESIGN-34 — **C-3-IMPL COMPLETE 2026-08-28** (AC-1..AC-22, INC-1..INC-8, 8 commits, 294 submarine tests) |
| Coastal defenses (C-4)                      | DESIGN-48       | **COMPLETE 2026-08-28** — value-model vertical slice (AC-1..AC-11, INC-1..INC-6, 78 tests, ADR-0039); full spec at `.scratch/c4-m3-coastal-defenses/` |
| Smoke (drift, decay, screens) (C-5)   | DESIGN-42 §§7-23 | **C-5-IMPL COMPLETE 2026-08-29** — full smoke module (cloud model, drift/decay, line intersection, funnel smoke, smokescreens, floats, generators, source precedence); INC-1..INC-9 all green; 203 tests |
| Detailed damage control (C-5)         | DESIGN-41 remainder | **C-5-IMPL COMPLETE 2026-08-29** — fire propagation (§19-22, §24-25), flooding control (§13-18), damage-control resources (§27-28); deferred: full terminal state machine, survivors/rescue |

### M4 — Aviation (Track D)

| Area                                  | Design coverage |
| ------------------------------------- | --------------- |
| Aircraft, squadrons, airbases         | DESIGN-43       |
| Carrier operations (CAP, strikes)     | DESIGN-44       |
| Anti-aircraft defense                 | DESIGN-45       |

### M5 — Electronics & Missile Era (Track E)

| Area                                  | Design coverage |
| ------------------------------------- | --------------- |
| Radar, electronics, EW                | DESIGN-46       |
| Missiles, SAM, CIWS                   | DESIGN-47       |
| Jets & helicopters (later eras)       | DESIGN-43/44/45 cross-cutting update |

### Unassigned / cross-domain (ownership pending a scoping sprint)

| Area                                  | Design coverage | Note |
| ------------------------------------- | --------------- | ---- |
| Amphibious operations                 | DESIGN-36       | Placement to confirm during scoping (likely M3) |
| Deployment & logistics                | DESIGN-25       | M1 capability deferred `CONTENT_ONLY` (ADR-0011) |
| Bases & infrastructure                | DESIGN-16       | Required for §20 strategic/economic coverage |
| Trade raiding & merchant shipping     | DESIGN-33       | Required for §20 coverage |
| Blockade (full rules)                 | DESIGN-32       | Basic version landed in B10c |
| Treaties                              | DESIGN-30       | Deferred out of B10c |
| Politics, confidence, unrest          | DESIGN-18       | §20 lists diplomacy/politics together; own scoping sprint |
| Strategic intelligence / fog of war   | DESIGN-29       | Tactical fog-of-war landed in B-2; strategic layer unassigned |
| Officers, personnel, crew training    | DESIGN-27/28    | Unassigned; may fold into M1 follow-up or M2 |

---

## 🎯 Open Design Decisions

See [`docs/OPEN-ISSUES.md`](OPEN-ISSUES.md) — reconciled at the M1 gate
(2026-08-12): the prior "126 open ambiguity candidates" figure was a stale
migration-time lexical audit snapshot; zero `OPEN DECISION` markers remain in the
canonical docs and no M1 ambiguity is blocking (all closed by ADR-0001…0011 or
per-sprint records). Genuinely new decisions are tracked as individual items
there. Implementations **MUST NOT** silently resolve an open decision.

## 📐 Implementation Approach

- **Technology**: TypeScript (Node >=24), pnpm workspaces, Turborepo, Vitest
- **Paradigm**: Immutable state transitions, pure functions, deterministic by construction
- **Testing**: Unit tests per package + integration tests + cross-process determinism proof + golden-hash verification
- **Packaging**: electron-builder (dmg+zip / nsis / AppImage)
- **Traceability**: Each capability maps to DESIGN-* documents in `docs/`
- **Validation gate (per sprint)**: uncached build, `tsc -b`, lint, format, full tests, golden verify, two-process determinism — see `.ai/ENGINEERING-CONTRACT.md` and `.ai/ORCHESTRATION.md`