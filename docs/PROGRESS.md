# Bluewave Engine — Implementation Progress

> Single source of truth for LLM context. Updated as milestones advance.
> Canonical spec: [`README.md`](../README.md). Delivery scope: [`docs/delivery/release-scope-and-implementation-order.md`](delivery/release-scope-and-implementation-order.md).

## Overall Status

| Milestone                    | B#     | Design                                  | Implementation                       | Tests              | Notes                    |
| ---------------------------- | ------ | --------------------------------------- | ------------------------------------ | ------------------ | ------------------------ |
| M1 Strategic Campaign Kernel | B0–B8  | Complete (57 docs)                      | Core pipeline done                   | ~154 tests passing | ACCEPTED               |
| M1 Strategic Campaign Kernel | B9–B10 | Scope briefs ready          | B9/B10a/B10b/B10c/B10d done | 410 passing | **M1 COMPLETED (A-5 gate, 2026-08-12)** — see `docs/acceptance/m1-capability-registry.md` |
| M2 Surface Tactical Core     | —      | Design docs exist (DESIGN-38–42)        | B-1 IMPL + B-2 IMPL + **B-3 IMPL DONE (2026-08-13)** | 330 combat tests pass* | B-1 battle-gen + tactical setup; B-2 movement/spotting/contact engine (AC-1..15, ADR-0018/19); **B-3 gunnery core fire-resolution DONE (AC-1..15, ADR-0020)**. B-4..B-6 next (armor, weather, results→campaign). |
| M3 Advanced Surface Warfare  | —      | Design docs exist (DESIGN-34–36, 39–42) | Not started                          | —                  | Future                   |
| M4 Aviation                  | —      | Design docs exist (DESIGN-43–45)        | Not started                          | —                  | Future                   |
| M5 Electronics & Missile Era | —      | Design docs exist (DESIGN-46–48)        | Not started                          | —                  | Future                   |

## ✅ Completed (B0–B8)

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
| `@bluewave/phase-engine`       | ACCEPTED                | 8-phase turn pipeline, month executor, replay verifier, financial ledger                                            |
| `@bluewave/persistence`        | ACCEPTED                | Content-addressed atomic save/load, recovery                                                                        |
| `@bluewave/combat`             | ACCEPTED                | Deterministic auto-resolution with explanation                                                                      |
| `@bluewave/cross-process-test` | ACCEPTED                | Cross-process determinism proof harness                                                                             |
| `@bluewave/test-support`       | ACCEPTED                | Shared test utilities                                                                                               |
| `compiler-cli`                 | INTEGRATED_NOT_ACCEPTED | CLI (bwc): validate, compile, inspect, verify, compare, campaign:_, turn:_, replay                                  |
| `desktop`                      | VERIFIED_NOT_INTEGRATED | Electron shell with CSP, compile IPC, CLI-only renderer                                                             |

### Phase Registry (8 ordered phases)

1. **opening_validation** — validate treasury non-negative, construction caps, ship battle assignment
2. **command_collection** — player command processing
3. **appropriation** — proportional construction funding
4. **obligation** — mandatory fixed expenses
5. **construction_processing** — progress cap enforcement
6. **research_progress** — RNG-driven research point allocation
7. **battle_resolution** — auto-resolve pending battles
8. **closing_validation** — final state validation + hash

### What's solid

- Deterministic by design: canonical serialization + SHA-256 end-to-end
- Replay verifier compares ledgers across runs
- Cross-process determinism proven
- All strategic turn phases execute and produce auditable state transitions

## 🔜 In Progress / Planned (B9–B10)

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

### B10a — Economy & Construction

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

### B10b — Research & Ship Design

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

### B10c — Diplomacy & War

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

### B10d — AI & Scenario Readiness

| Capability                      | Readiness         | Key decisions                                                  |
| ------------------------------- | ----------------- | -------------------------------------------------------------- |
| AI legal-only commands          | Scope brief ready | Uniform random selection                                       |
| `AI_PLANNING` phase             | Scope brief ready |                                                                |
| Deterministic idempotency + RNG | Scope brief ready |                                                                |
| 6-gate acceptance               | Scope brief ready | compile → 1st turn → battle → save/load → replay → 24-mo smoke |
| New `@bluewave/ai` package      | Scope brief ready |                                                                |
| 2+ AI participants              | Scope brief ready |                                                                |
| Acceptance                      | —                 | Brief at `.ai/briefs/b10d-ai-scenario.md`                      |

### Workstream C — Production Content

> **Status (2026-08-11): CONTENT-1 DONE/PASS (pack authored).** Production content
> architecture locked: primary `FULLY_SUPPORTED` scenario `scen_1880`
> (Jan 1880), reachable era bands all five, max duration 1092 mo (sim end
> Dec 1970), pack layout `content/production/1880/` (`type: "production"`,
> zero compiler change), content map + DESIGN-55 §12 classification policy.
> Charter: `.ai/briefs/content-0-production-pack-charter.md`; wayfinder map
> `.scratch/content-0-production-pack/`; research `docs/research/content-0-*.md`.
> **CONTENT-1 (M1-era production pack) is DONE (2026-08-11, PASS)** at
> `content/production/1880/`, deterministically compiled; **CONTENT-2 (PRE_WAR
> tech/design) is DONE (scoping 2026-08-11, implementation 2026-08-12 — PASS)**
> at `.ai/briefs/content-2-prewar-tech-design.md`; the PRE_WAR YAML is authored
> and the pack compiles deterministically.

| Deliverable                  | Status      | Notes                                                            |
| ---------------------------- | ----------- | ---------------------------------------------------------------- |
| Primary scenario + era bands | Locked      | `scen_1880`, EARLY..LATE (sim end Dec 1970)                      |
| Max campaign duration        | Locked      | 1092 completed months                                            |
| Pack layout                  | Locked      | `content/production/<pack>/`, `type:"production"`                |
| Content map + classification | Locked      | DESIGN-55 §12 policy; CONTENT_ONLY_LOCKED→promote                |
| Charter brief                | Done        | `.ai/briefs/content-0-production-pack-charter.md`                |
| CONTENT-1 (M1-era content)   | Done — PASS | `content/production/1880/` authored + deterministically compiled |
| CONTENT-2 (PRE_WAR tech/design) | Done — PASS | scoping + impl; 25 techs + 11 designs authored, pack `0.2.0` |
| CONTENT-3 (INTERWAR tech/design) | Done — PASS | scoping PASS + impl PASS 2026-08-12; +24 techs +10 designs authored, pack `0.3.0` |

### CONTENT-1 — M1-Era Production Content Pack

> **Status (2026-08-11): DONE/PASS.** Authored the first production content
> pack at `content/production/1880/` (`type: "production"`, zero engine change)
> for the `scen_1880` anchor: 14 countries, ~100 areas, 35+ routes, ~70
> possessions, ~95 ports, 34 EARLY technologies (acyclic DAG), 16 ship
> designs, 22 fleets, 14 economies, 9 constructions, 14 research states —
> grounded in four research notes (`docs/research/content-1-*.md`). Compiles
> deterministically via the desktop `runCompilation` path (content hash
> `44953238…`, snapshot `f3e72642…`); `apps/desktop/test/production-pack.test.ts`
> locks the compile + hashes. Diplomacy relations intentionally omitted (B10c
> blocked → DESIGN-55 §14 reachable-locked concern). Evidence:
> `.ai/reports/content-1-m1-production-content.md`; brief
> `.ai/briefs/content-1-m1-production-content.md`; wayfinder
> `.scratch/content-1-m1-production-content/`.

### CONTENT-2 — PRE_WAR-Band Technology & Ship-Design Continuation

> **Status (2026-08-11): DONE/PASS (scoping).** Locked the PRE_WAR-band
> (Jan 1900 – Dec 1919) slice of `content/production/1880/`: 25 research techs
> across 10 fields (`category: PRE_WAR`, acyclic, seeded on CONTENT-1 tails) and
> 11 real-class ship-design templates (Dreadnought, Invincible, Orion, Queen
> Elizabeth, South Carolina, Nassau, Kōnig, Kongō, Fuso, Courbet, Dante
> Alighieri). All `SUPPORTED_MECHANICAL` (Research/Design `ACCEPTED`, no
> reachable-locked content). Research grounded in verified high-trust sources
> (`docs/research/content-2-prewar-era-tech-and-design.md`: HMS Dreadnought 1906,
> Fire-control system, Krupp armour). Deferred (not descended into): deployment
> (DESIGN-25, unassigned), blockades (B10c, blocked), AVIATION/CARRIER PRE_WAR
> techs (M4 unit mechanic unaccepted → DESIGN-55 §14). Scoping-only — no engine
> change, goldens untouched. Next: author the PRE_WAR YAML records (impl sprint).
> Brief `.ai/briefs/content-2-prewar-tech-design.md`; wayfinder
> `.scratch/content-2-prewar-tech-design/`.

### CONTENT-3 — INTERWAR-Band Technology & Ship-Design Continuation

> **Status (2026-08-12): DONE/PASS (scoping) → IMPLEMENTED (2026-08-12, PASS).**
> Locked the INTERWAR-band (Jan 1920 – Dec 1939) slice of `content/production/1880/`:
> 24 grounded research techs across 10 supported fields (`category: INTERWAR`,
> acyclic, seeded on PRE_WAR tails) and 10 real-class design templates (Nelson, King George V,
> North Carolina, Yamato, Bismarck, Scharnhorst, Littorio, Richelieu, Nagato,
> Myōkō). All `SUPPORTED_MECHANICAL` (Research/Design `ACCEPTED`; no reachable-
> locked content). Grounded in verified high-trust sources
> (`docs/research/content-3-interwar-era-tech-and-design.md`; Nelson/NC/KGV/Yamato
> verified). Deferred (DESIGN-55 §14): AVIATION, CARRIER_OPERATIONS,
> RADAR_AND_ELECTRONICS, MISSILES, AMPHIBIOUS_OPERATIONS INTERWAR content
> (M4/M5/$); deployment (DESIGN-25); blockades (B10c). **Implementation (2026-08-12,
> PASS):** authored +24 techs +10 designs, pack `0.2.0`→`0.3.0`; production-pack
> test PASS; compiles deterministically (content `190fa7a9…`, snapshot
> `2ae3e505…`); full suite 410/410 green minus the pre-existing unrelated
> `nation.test.ts` import; goldens 8/8 unchanged. Evidence:
> `.ai/reports/content-3-interwar-tech-design-impl.md`. Brief
> `.ai/briefs/content-3-interwar-tech-design.md`; wayfinder
> `.scratch/content-3-interwar-tech-design/`.

> **Status (2026-08-12): IMPLEMENTED — PASS.** Authored the PRE_WAR slice
> (scoping PASS above became implementation): +25 techs +11 designs in
> `content/production/1880/`, pack `0.1.0`→`0.2.0`. Production-pack test passes;
> compiles deterministically (content `c3be5604…`, snapshot `cb1f1497…`). Full
> suite 37/38 files, 387/387 tests pass — the only red suite is a **pre-existing
> unrelated** broken import in `packages/content-schema/test/nation.test.ts`
> (`content/research/nations/1880/index.ts` deleted on main in `2b3d925`),
> tracked for separate repair. Evidence: `.ai/reports/content-2-prewar-tech-design.md`.

## 🔮 Not Yet Started (M2–M5)

| Area                                 | Design coverage      |
| ------------------------------------ | -------------------- |
| Tactical movement, spotting, contact | DESIGN-37, DESIGN-38 |
| Tactical gunnery + armor/damage      | DESIGN-39            |
| Torpedoes                            | DESIGN-40            |
| Damage, fire, flooding               | DESIGN-41            |
| Tactical weather, visibility, smoke  | DESIGN-42            |
| Aircraft, squadrons, airbases        | DESIGN-43            |
| Carrier operations (CAP, strikes)    | DESIGN-44            |
| Anti-aircraft defense                | DESIGN-45            |
| Radar, electronics, EW               | DESIGN-46            |
| Missiles                             | DESIGN-47            |
| Coastal defense                      | DESIGN-48            |
| Submarines                           | DESIGN-34            |
| Mine warfare                         | DESIGN-35            |
| Amphibious operations                | DESIGN-36            |

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
- **Testing**: Unit tests per package + integration tests + cross-process determinism proof
- **Packaging**: electron-builder (dmg+zip / nsis / AppImage)
- **Traceability**: Each capability maps to DESIGN-* documents in `docs/`

### B10d — AI & Scenario Readiness

> **Status (2026-08-12): ACCEPTED.** New `@bluewave/ai` package (legal-only, uniform-random AI via keyed RNG), `AI_PLANNING` phase (order 1.5), 3-nation 24-month zero-human-input smoke with deterministic replay. 17/17 build; full suite pass (only pre-existing `nation.test.ts` import fails); goldens regenerated (closingSnapshot+replay only). Evidence: `.ai/reports/a4-b10d-ai-scenario.md`.

| Capability | Readiness | Key decisions |
| ---------- | --------- | ------------- |
| Legal-only AI | ACCEPTED | uniform random; `ai/planning:<nation>/<type>` streams |
| AI_PLANNING phase | ACCEPTED | order 1.5, rngAllowed |
| Reuses CommandLifecycle | ACCEPTED | budget + SetResearchPriority |
| 24-mo zero-human smoke | PASS | deterministic replay |
| Acceptance | PASS | `.ai/reports/a4-b10d-ai-scenario.md` |

### B-1 — M2 Battle Generation & Tactical Setup Scaffolding

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

### B-2 — M2 Tactical Movement, Spotting & Contact State

> **Status (2026-08-12): SCOPING DONE — PASS.** Scoped the DESIGN-38 movement/
> spotting/contact subset as an engine-only deterministic minute-advance tactical
> simulation in `@bluewave/combat` (no phase/snapshot change; `BattleResolver`
> unmodified; goldens unchanged). Wayfinder map + decision tickets 01–06 resolved;
> ADR-0018; research `docs/research/b2-m2-movement-spotting.md`; spec
> `.scratch/b2-m2-movement-spotting/spec.md` (AC-1..15, INC-1..5); brief
> `.ai/briefs/b2-m2-movement-spotting.md`. Reviewer APPROVE (MEDIUM repairs applied).
> **Next: B-2-IMPL** — movement kinematics, spotting/sensor model, contact lifecycle,
> minute-advance simulation engine, versioned constants/reason codes/content
> constants (INC-1..5).

### B-3 — M2 Gunnery (core surface fire-resolution)

> **Status (2026-08-13): SCOPING DONE + IMPL INC-1..4 DONE — PASS.** Scoped DESIGN-39
> (`docs/rules/gunnery.md`) to an engine-only deterministic surface gunnery
> fire-resolution slice (committed `fd3fabe`): map `.scratch/b3-m2-gunnery/map.md`,
> decision tickets `issues/01..06`, spec (AC-1..15, INC-1..5), brief
> `.ai/briefs/b3-m2-gunnery.md`, research `docs/research/b3-m2-gunnery.md`
> (naval gun ballistics), `.ai/specs/b3-m2-gunnery.md`. **INC-1..4 committed
> (`9777180`, `e85efb9`, `33e721e`, `7cc73f8`):** `GunneryState` + 7 fire modes +
> fixed-point guards + `gunnery_v1` contract; accuracy (17-factor manifest, exact
> integer product, one FLOOR, `GUNNERY_ACCURACY_FACTOR_MISSING`, keyed hit-draw);
> rate-of-fire/reload (integer ms, CEIL, §4 order 1-11) + gun-quality -3..+2 table;
> salvo/event → immutable `GunneryEventRecord` + §31 canonical ordering + atomic
> ammunition (`GUNNERY_AMMUNITION_UNAVAILABLE`) + `resolveGunnery` wired after
> spotting in the minute-advance simulation (**strict no-op when no batteries → B-2
> hashes unchanged**) + fog-of-war target legality + two-process determinism.
> Combat suite 43 files / 297 tests green; tsc + lint clean; goldens 9/9 unchanged;
> `BattleResolver`/`StrengthCalculator` unmodified. **IMPL STATUS: INC-5 pending** —
> reason-code set-equality vs §32 + catalog, `*_v1` contracts rollup, ADR-0020
> (scope boundary + in-slice constant/reason-code policy incl.
> `SURFACE_FIRE_CONTROL_MINIMUM_BP=2_000`, seeded ammo set, new
> `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`), full orchestrator gate + report
> `.ai/reports/b3-m2-gunnery-impl.md`. **CAVEAT:** concurrent external commits
> (`b65154f`, `d1e5403`) + uncommitted `packages/ai/*` edits appeared during the
> sprint; reconcile the ai working tree before the full-repo gate.
>
> **Deferred (recorded, not dropped):** autoloaders (§6-10), dual-purpose (§11-15) —
> later gunnery slices; armor zones/thickness/penetration (§16-24) → **B-4**
> armor-and-damage; straddle (§25) + RAPID/AA eligibility predicates; target
> allocation (§26-27); damage effects (§29) → B-4/DAMAGE; phase wiring (B-6).

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
