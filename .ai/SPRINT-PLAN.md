# Bluewave Sprint Plan — Full Project Backlog

Status: living backlog. Update as sprints resolve, split, or reorder.

## Purpose

Map every remaining unit of work between the current repository state and a
complete `M5_ELECTRONICS_AND_MISSILE_ERA` (DESIGN-55 §6) plus at least one
`FULLY_SUPPORTED` production scenario (DESIGN-55 §17) — i.e. **every requirement
of `README.md` met**. The goal is that an agent can move from sprint to sprint
without waiting on a human, stopping only at a genuine
`.ai/AUTONOMOUS-AGENT.md` stop condition or a `.ai/templates/decision-request.md`.

Completion is defined by DESIGN-55, not by the presence of code:

- every capability owned by a milestone is `ACCEPTED` (§9, §23);
- every required content feature for a supported scenario is `SUPPORTED_MECHANICAL`
  (§12, §17);
- every reachable era band has complete strategic + tactical coverage; and
- the release validation predicate (§32) and packaged smoke suite (§22) pass.

## Two coordinated workstreams

Every sprint below advances one or both of these workstreams. They are coupled:
a `FULLY_SUPPORTED` scenario requires **both** the mechanics (capabilities
`ACCEPTED`) and the content (features `SUPPORTED_MECHANICAL`). Neither alone
completes a milestone.

- **Workstream M — Mechanics.** The capability/milestone work already laid out in
  the original backlog (Tracks A–E). Driven by `docs/DESIGN-*` documents and
  approved briefs at `.ai/briefs/*`.
- **Workstream C — Content (new, in scope).** Autonomous research and authoring of
  a **production** content pack (real nations, ship classes, technologies, tuned
  constants) needed to make one or more scenarios `FULLY_SUPPORTED`. Previously
  this was declared out of scope and fixtures stayed non-production; that stance is
  reversed here per the project owner.

## How a sprint is executed

Every sprint is one pass through `.ai/IMPLEMENTATION-PROMPT.md`, gated by
`.ai/ENGINEERING-CONTRACT.md`, under the authority and stop conditions in
`.ai/AUTONOMOUS-AGENT.md`. There are two sprint kinds:

- **Scoping sprint** — no milestone brief exists yet. Follow the wayfinder
  convention already established at `.scratch/engine-suite-roadmap/` (see
  `docs/agents/issue-tracker.md`): open a map + numbered issue tickets, resolve
  open questions (research/prototype/grilling/task tickets), close the relevant
  `docs/OPEN-ISSUES.md` candidates, and land a brief at
  `.ai/briefs/<slug>.md` using `.ai/templates/milestone-brief.md`. B9 and B10a–d
  were produced this way — use them as the reference shape.
- **Implementation sprint** — an approved brief exists. Implement it per
  `.ai/IMPLEMENTATION-PROMPT.md` §4–8, with focused tests, a validation report,
  and Conventional Commits.

A capability is not "done" because code exists — see DESIGN-55 §8–9. Treat
`ACCEPTED` as the only status that lets a downstream sprint depend on it, and
**descope nothing silently**: every `docs/OPEN-ISSUES.md` ambiguity must be
closed via research or an ADR before a governing design contract is considered
resolved (§9). `OPEN-ISSUES.md` was reconciled at the M1 gate (Sprint A-5,
2026-08-12): the historical "126 items" figure is a migration-time lexical audit
snapshot, zero `OPEN DECISION` markers remain in the canonical docs, and every
M1 residual was closed by ADR-0001…0011 — see the file's header note for the
full reconciliation. Do not reintroduce a stale global count; new open decisions
are recorded there as individual items.

## Content research model (Workstream C)

The project owner has stated the gameplay data itself is a research step that
cannot be supplied in advance. So content is produced **autonomously by the
agent** and is a first-class, scheduled workstream — not a blocker awaiting a
human.

Rules for every content sprint:

- **Research, don't invent.** Use the `/research` skill against high-trust
  primary/secondary sources (official histories, naval reference works, published
  ship-class and timeline data) to ground real nations, hulls, weapons, aircraft,
  electronics, and era progression. Capture findings as Markdown under
  `docs/research/` before authoring YAML.
- **Classify explicitly (DESIGN-55 §12).** Each authored content feature declares
  exactly one release classification. Content whose owning mechanics are not yet
  `ACCEPTED` is authored as `CONTENT_ONLY_LOCKED` and must be proven unreachable
  (§14); it is promoted to `SUPPORTED_MECHANICAL` only when the governing
  capability lands.
- **Balance targets are non-normative.** The agent may tune constants within
  `BALANCE TARGET` bounds autonomously, recording the reasoning. A tuning choice
  that changes authoritative gameplay or cannot be grounded in the sources is a
  decision-request, not a guess.
- **Respect `OPEN DECISION`.** Never silently resolve a documented open decision.
  Close it via research into the canonical answer, an ADR, or an explicit
  decision-request.
- **Fixtures ≠ production.** Development/fixture packs stay explicitly
  non-production. The production pack is a separately authored, validated artifact
  (see CONTENT-0).
- **One production scenario is the acceptance anchor.** Pick and lock a primary
  `FULLY_SUPPORTED` scenario in CONTENT-0; every later content/support check refers
  to it.

## Current verified baseline (2026-08-16)

Last refreshed at the M2 acceptance gate (B-6, 2026-08-15); the M1 gate (A-5,
2026-08-12) supplied the milestone evidence. State below is from orchestrator
validation runs (`pnpm -w turbo run build --force`, `tsc -b`, per-package
vitest, golden verify, two-process determinism), not from reading docs:

| Area                         | Actual state                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 (B0–B8 + B9–B10)          | **COMPLETED** (A-5 gate, 2026-08-12). All 10 M1 capabilities ACCEPTED; deployment (DESIGN-25) `CONTENT_ONLY`/deferred per ADR-0011. Registry: `docs/acceptance/m1-capability-registry.md`. B10b is genuinely accepted (A-0b closed the A-0 gaps).                                                                                                                                    |
| M2 (B-1..B-6)                | **COMPLETED** (B-6 gate, 2026-08-15). Battle generation, movement/spotting/contact, gunnery, basic armor & damage, weather/visibility, battle results → campaign integration. Registry: `docs/acceptance/m2-capability-registry.md`. `BattleResolver`/`StrengthCalculator` unmodified throughout.                                                                                  |
| CONTENT-0..3                 | Production pack `content/production/1880/` at `0.3.0`: EARLY (CONTENT-1), PRE_WAR (CONTENT-2), INTERWAR (CONTENT-3) tech + design slices authored, `SUPPORTED_MECHANICAL` where owning mechanics are accepted; compiles deterministically via the desktop `runCompilation` path.                                                                                                         |
| Desktop surfaces             | Playable MVP loop (desktop-mvp), Research & Technology, Diplomacy & War, battle-outcome surfacing — all DONE/PASS (2026-08-15). Debug-mode gating landed (ADR-0029). Desktop E2E Playwright suite in progress (`.scratch/desktop-e2e-suite/`, rows 1–3 green). CLI battle/gunnery debug surface DONE (`de6eb55`).                                                                 |
| Build / test                 | Full repo gate green: clean uncached build 18/18, `tsc -b` clean, every per-package suite green except the pre-existing unrelated `content-schema/test/nation.test.ts` import; golden hashes 10/10; two-process determinism byte-identical.                                                                           |

> **Historical note (2026-08-11, A-0 pass):** an earlier draft claimed B10b was
> "committed and green with nothing but evidence missing"; Sprint A-0 re-verified
> the 17 acceptance criteria against the code and found the claim false (several
> criteria had no implementation). A-0b then completed B10b and re-verified it
> PASS — the plan no longer treats B10b as anything but accepted (see Track A
> rows A-0/A-0b).

## Sprint sequence

### Track A — M1 (Strategic Campaign Kernel) + its content — **COMPLETED (A-5 gate, 2026-08-12)**

Numbers below continue the original A-track series. "C-" rows are the content
workstream paired to each milestone.

| #         | Sprint                                         | Kind                    | Depends on                   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------- | ---------------------------------------------- | ----------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-0       | **B10b acceptance pass**                       | Implementation (verify) | none                         | **DONE 2026-08-11 — BLOCKED initially.** Re-verified all 17 criteria against code. Verdict BLOCKED: 3 criteria unimplemented, 10+ unproven, only 15–17 pass. Evidence: `.ai/reports/a0-b10b-acceptance.md`. Drove A-0b.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| A-0b      | **B10b completion**                            | Implementation          | A-0                          | **DONE 2026-08-11 — PASS.** Closed every verified gap: `SetResearchPriorityCommand` lifecycle (+`RESEARCH_PRIORITY_CONSTRAINT_VIOLATED`, `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`), `TECHNOLOGY_PREREQUISITE_CYCLE` cycle detection, `DesignTemplateSchema` + design YAML + deterministic `compiledHash`, discovery revalidation + historical timing modifier, canonical field registry, and proof tests for all 17 criteria. Commits `15453f2` (+ ADR-0009). 32 turbo tasks green, golden hashes unchanged. Re-verified A-0 → PASS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| A-1       | B9 acceptance pass                             | Implementation (verify) | none                         | **DONE 2026-08-11 — PASS_WITH_LIMITATIONS.** Build green, packaging (mac dmg/zip + linux AppImage) + unit/boundary tests green (9 tests). Added `boundary.test.ts` (CSP, IPC narrowing, concurrent abort) and extracted pure CSP helper. Live GUI start + renderer→main IPC round-trip not automated headlessly; win nsis not built on macOS. Evidence: `.ai/reports/a1-b9-acceptance.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| A-2       | B10a acceptance pass                           | Implementation (verify) | none                         | **DONE 2026-08-11 — PASS.** All 10 brief criteria verified. Added `economy.test.ts` (3-nation full turn, balanced ledger, finance-hash determinism, paid-work, completion→ship, non-negative treasury). 32 turbo tasks green. Evidence: `.ai/reports/a2-b10a-acceptance.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| A-3       | B10c Diplomacy & War                           | Implementation          | A-0b (A-0 PASS)              | **DONE 2026-08-12 — PASS.** Resolved the victory-classification decision request via Option A (ADR-0010, `warConstants.ts`); implemented 7 commands, `RESOLVE_DIPLOMACY` (order 6.5), war side/score model, alliance auto-entry, blockade +2/mo, surrender, NAP penalty, peace settlement. `BattleResolver` unchanged. 16/16 build; 400/401 tests (only pre-existing `nation.test.ts` fails); golden regenerated per ADR-0007, cross-process green. Evidence: `.ai/reports/a3-b10c-diplomacy-war.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| A-4       | B10d AI & Scenario Readiness                   | Implementation          | A-3                          | **DONE 2026-08-12 — PASS.** New `@bluewave/ai` package (AiPlanner/AiCommandGenerator/AiPhaseExecutor, legal-only uniform-random via keyed RNG), `AI_PLANNING` phase (order 1.5), 3-nation 24-month zero-human-input smoke with deterministic replay. 17/17 build; full suite green (only pre-existing `nation.test.ts` fails); goldens regenerated (closingSnapshot+replay only). Evidence: `.ai/reports/a4-b10d-ai-scenario.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| A-5       | M1 formal acceptance gate                      | Gate                    | A-0…A-4                      | **DONE 2026-08-12 — PASS.** Applied DESIGN-55 §9 to every M1 capability and signed `M1_STRATEGIC_CAMPAIGN_KERNEL` COMPLETED per §23 (scoped closure). Materialized `docs/acceptance/m1-capability-registry.md` (10 capabilities ACCEPTED; deployment DESIGN-25 `CONTENT_ONLY`/deferred). Reconciled `docs/OPEN-ISSUES.md`: "126 items" is a migration-time lexical audit snapshot; zero `OPEN DECISION` markers remain; M1 residuals closed via ADR-0001…0011. Added ADR-0011 (M1 deployment scope). Refresh PROGRESS (M1 COMPLETED). 17/17 build, `tsc -b` clean, 410 tests pass (only pre-existing `nation.test.ts` import), cross-process byte-identical, goldens 8/8; fixed 5 residual lint errors + repo formatting (cosmetic, verified no behavioral drift). Evidence: `.ai/reports/a5-m1-acceptance-gate.md`.                                                                                                                                                                                                                                                                                                                                           |
| CONTENT-0 | **Content strategy + production-pack charter** | Scoping                 | none (runs parallel to A-0…) | **DONE 2026-08-11.** Locked primary `FULLY_SUPPORTED` scenario `scen_1880` (Jan 1880), reachable era bands all five, max duration 1092 mo (sim end Dec 1970), pack layout `content/production/1880/` (`type: "production"`, zero compiler change), content map + DESIGN-55 §12 classification policy. Landed `.ai/briefs/content-0-production-pack-charter.md`, wayfinder map `.scratch/content-0-production-pack/` (tickets 01–05 resolved), research notes `docs/research/content-0-*.md`. This founders CONTENT-1 and the C-track.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| CONTENT-1 | **M1-era production content**                  | Scoping/Impl            | CONTENT-0                    | **DONE 2026-08-11 — PASS.** Authored the first production pack at `content/production/1880/` (`type: "production"`, zero engine change): 14 countries, ~100 areas, 35+ routes, ~70 possessions, ~95 ports, 34 EARLY technologies (acyclic DAG), 16 designs, 22 fleets, 14 economies, 9 constructions, 14 research states — grounded in 4 research notes (`docs/research/content-1-*.md`). Diplomacy relations omitted (B10c blocked → §14 concern). Compiles deterministically via desktop `runCompilation` (content `44953238…`, snapshot `f3e72642…`); `production-pack.test.ts` locks it. Evidence: `.ai/reports/content-1-m1-production-content.md`. Brief + wayfinder: `.ai/briefs/content-1-m1-production-content.md`, `.scratch/content-1-m1-production-content/`.                                                                                                                                                                                                                                                                                                                                                                                      |
| CONTENT-2 | **PRE_WAR tech + ship-design continuation**    | Scoping/Impl            | CONTENT-1 (done)             | **DONE — scoping 2026-08-11 PASS + implementation 2026-08-12 PASS.** Locked and authored the PRE_WAR-band (Jan 1900–Dec 1919) slice of `content/production/1880/`: 25 research techs across 10 fields + 11 real-class design templates, all `SUPPORTED_MECHANICAL` (Research/Design accepted; acyclic DAG seeded on CONTENT-1 tails). Pack `0.1.0`→`0.2.0`. Production-pack test PASS; compiles deterministically (content `c3be5604…`, snapshot `cb1f1497…`). **Deferred (mechanics-gated):** deployment (DESIGN-25, unassigned), blockades (B10c, blocked), AVIATION/CARRIER PRE_WAR techs (M4, §14). Grounded in `docs/research/content-2-prewar-era-tech-and-design.md`. Pre-existing unrelated defect surfaced: `content-schema/test/nation.test.ts` broken import (see PROGRESS). Brief/wayfinder: `.ai/briefs/content-2-prewar-tech-design.md`, `.scratch/content-2-prewar-tech-design/`. Evidence: `.ai/reports/content-2-prewar-tech-design.md`.                                                                                                                                                                                                      |
| CONTENT-3 | **INTERWAR tech + ship-design continuation**   | Scoping/Impl            | CONTENT-2 (done)             | **DONE 2026-08-12 — PASS (scoping + implementation).** Locked and authored the INTERWAR-band (Jan 1920–Dec 1939) slice of `content/production/1880/`: 24 grounded research techs across 10 supported fields (`category: INTERWAR`, acyclic, seeded on PRE_WAR tails) + 10 real-class design templates (Nelson, King George V, North Carolina, Yamato, Bismarck, Scharnhorst, Littorio, Richelieu, Nagato, Myōkō), all `SUPPORTED_MECHANICAL` (Research/Design accepted). Pack `0.2.0`→`0.3.0`; production-pack test PASS; compiles deterministically (content `190fa7a9…`, snapshot `2ae3e505…`); full suite green (only pre-existing `nation.test.ts` import fails); goldens 8/8 unchanged (content-only). **Deferred (DESIGN-55 §14):** AVIATION, CARRIER_OPERATIONS, RADAR_AND_ELECTRONICS, MISSILES, AMPHIBIOUS_OPERATIONS INTERWAR content (M4/M5/$), plus deployment (DESIGN-25) & blockades (B10c). Grounded: `docs/research/content-3-interwar-era-tech-and-design.md`. Brief + wayfinder: `.ai/briefs/content-3-interwar-tech-design.md`, `.scratch/content-3-interwar-tech-design/`. Evidence: `.ai/reports/content-3-interwar-tech-design-impl.md`. |

### Track B — M2 Surface Tactical Core — **COMPLETED (B-6 gate, 2026-08-15)**

Depends on accepted M1 (DESIGN-55 §3) — satisfied at the A-5 gate. Every row
went through the full scoping → implementation pipeline with wayfinder maps and
briefs at `.ai/briefs/b*-m2-*.md`; M2 was engine-only (tactical content
classifications land via the CONTENT-track, not inline here).

| #   | Sprint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Governing docs                                                                                                                              | Content deliverable                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| B-1 | Battle generation & tactical setup scaffolding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | DESIGN-37 (battle-generation.md, 931 lines — largest rules doc, likely splits further during scoping), DESIGN-26 (divisions-and-formations) | Ship data consumed by tactical battles (armor, guns, crew) promoted to reachable-format |
|     | **B-1 IMPL: DONE 2026-08-12 — PASS_WITH_LIMITATIONS (orchestrator pipeline).** INC-1..INC-6 implemented: tactical-unit promotion + ship-type classifier, permanent-division aggregate + 5 division commands, 9-type mission registry + reachable opportunity predicate (ADR-0014/0015), eligible-gather/roles/optional/repair/manifest/seed/reservations/auto-resolve proof, `BattleGenerator` facade + `generateBattles` (15 stages), `battle_generation` phase (order 7.5) before `battle_resolution`. Reviewer BLOCKER (real battle composition) + HIGH-4 (manifest clone) + MEDIUM-8 (division predicates) repaired. Commits `282f21d, ce62f89, f939d17, 5547c27, 591e234, 73e8b96, 6303100, 41c2b0e`. Golden regen documented (ADR-0007). Evidence: `.ai/reports/b1-m2-battle-scaffolding-impl.md`. **Limitation:** AC-14 per-ship production promotion is PARTIAL — mechanism proven (AC-1), but the production `fleets.yaml`→`designs.yaml` `designVersionId` content linkage is deferred to the CONTENT-track (not fabricated; pack classIds don't uniquely map to designs). `BattleResolver`/`StrengthCalculator` unmodified. Next: **B-2** (movement/spotting).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |                                                                                                                                             |                                                                                         |
| B-2 | Tactical movement, spotting, contact state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | DESIGN-38 (tactical-combat.md) — movement/spotting subset only                                                                              | Formation/movement constants                                                            |
|     | **B-2 SCOPING: DONE 2026-08-12 (orchestrator pipeline).** Scoped DESIGN-38 movement/spotting/contact subset as an engine-only deterministic minute-advance tactical simulation in `@bluewave/combat` (no phase/snapshot change; `BattleResolver` unmodified; goldens unchanged). Wayfinder map + decision tickets `01..06` (resolved): scope boundary, phase-integration boundary (B-6), movement kinematics, spotting/sensor model, contact lifecycle, content constants. ADR-0018 (scope/integration boundary). Research: `docs/research/b2-m2-movement-spotting.md`. Spec: `.scratch/b2-m2-movement-spotting/spec.md` (AC-1..15, INC-1..5). Brief: `.ai/briefs/b2-m2-movement-spotting.md`. Next: **B-2-IMPL**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |                                                                                                                                             |                                                                                         |
|     | **B-2-IMPL: DONE 2026-08-12 — PASS (orchestrator pipeline).** INC-1..5 implemented: movement kinematics (integer direction table, formation stations), spotting/sensor model (safe-integer metre-quantized detection + LOS + keyed-retention seam), contact lifecycle (unified `TacticalContact`, fog-of-war via `validateTargetOrder`), minute-advance engine (DESIGN-38 steps 4–8, `BattleLedger`+`canonicalEventOrder`, per-minute hash, two-process determinism), versioned `*_v1` contracts+guards, exact §36 reason-code surface. ADR-0019 (contact shape). Reviewer NEEDS_REWORK → repaired (F1 safe-int, F2 reason-code, F3 integer dir table, F4 hold-course, F7 literal scan). Combat 166 tests green; cross-process 13 green; goldens 9/9 unchanged; `BattleResolver`/`StrengthCalculator` unmodified. Evidence: `.ai/reports/b2-m2-movement-spotting-impl.md`. **Next: B-3 (gunnery).**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |                                                                                                                                             |                                                                                         |
| B-3 | Gunnery                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | DESIGN-39 (gunnery.md)                                                                                                                      | Naval gun ballistics stats                                                              |
|     | **B-3 SCOPING + IMPL (core surface fire-resolution slice): DONE 2026-08-13 — PASS.** Scoping DONE + committed (`fd3fabe`): wayfinder map `.scratch/b3-m2-gunnery/map.md` + decision tickets `issues/01..06`, spec `.scratch/b3-m2-gunnery/spec.md` (AC-1..15, INC-1..5), brief `.ai/briefs/b3-m2-gunnery.md`, research `docs/research/b3-m2-gunnery.md`, `.ai/specs/b3-m2-gunnery.md`. **INC-1..4 IMPL DONE + committed (9777180, e85efb9, 33e721e, 7cc73f8)** — gunnery state/modes/guards/constants, accuracy (17-factor, floor-once, keyed hit-draw), rate-of-fire/reload (ceil) + gun-quality, salvo/event/ordering + atomic ammo + `resolveGunnery` wired after spotting in minute-advance (strict no-op when no batteries → B-2 hashes unchanged) + fog-of-war targeting + two-process determinism. **INC-5 DONE** — full `*_v1` contracts rollup (5 contracts, AC-14), reason-code set-equality vs DESIGN-39 §32 + catalog (AC-10), research-grounded naval gun ballistics constant set (`gunnery_ballistics_v1`, 6 grounded calibers + 1880s RML heavy-gun BALANCE TARGET), **ADR-0020** (scope/integration boundary + in-slice reason-code/constant policy incl. `SURFACE_FIRE_CONTROL_MINIMUM_BP=2_000`, seeded ammo set, `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`, RML ballistics decision). Combat suite 44 files / 325 tests green; full-repo orchestrator gate PASS (uncached build 17/17, `tsc -b` clean, lint clean outside pre-existing unrelated failures, full test suite 32/34 — only the two documented pre-existing unrelated failures, golden verify 9/9, two-process determinism); `BattleResolver`/`StrengthCalculator` unmodified. A pre-existing unrelated `packages/ai/src/aiPlanner.ts` build defect (TS2367) blocking the repo-wide gate was repaired en route (dead unreachable comparison, not a gunnery change). Evidence: `.ai/reports/b3-m2-gunnery-impl.md`. **Next: B-4** (armor & damage). |                                                                                                                                             |                                                                                         |
| B-4 | **Basic armor & damage — DONE 2026-08-14 — PASS.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | DESIGN-41 (damage-fire-and-flooding.md) — basic subset; detailed damage control deferred to M3 per DESIGN-55 §4                             | Armor/damage tables                                                                     |
| B-5 | **Tactical weather & visibility — DONE 2026-08-15 — PASS.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | DESIGN-42 (weather-visibility-and-smoke.md) — weather/visibility subset; smoke deferred to M3                                               | Weather/visibility constants                                                            |
| B-6 | **Battle results → campaign integration + M2 acceptance gate: DONE 2026-08-15 — M2 COMPLETED.** Wayfinder scoping (commit `bf77843`), research `docs/research/b6-m2-battle-results.md`, spec `.scratch/b6-m2-battle-results/spec.md`, brief `.ai/briefs/b6-m2-battle-results.md`. IMPL: INC-1 (`62fba1d`) authoritative `weather_generation` + per-area strategic weather on snapshot (ADR-0025); INC-2 (`405bace`) `resolveBattleAuto` deterministic tactical auto-resolver + gunnery→damage seam, DESIGN-38 §32 battle end (ADR-0026); INC-3 (`1c7b76a`) `battle_resolution` phase wiring + war-score/ship-loss/reservation consequences, A-3 `applyBattleResult` unchanged (ADR-0027); INC-4 folded (contracts/reason-codes/goldens two-process); INC-5 M2 §9/§23 gate. Goldens 10/10 (INC-1 regen under ADR-0007, documented). Registry `docs/acceptance/m2-capability-registry.md`; report `.ai/reports/b6-m2-battle-results-impl.md`. `BattleResolver`/`StrengthCalculator` unmodified. Next: **M3 (Track C).** | ties back into `@bluewave/combat` and phase-engine `battle_resolution` | M2 content `SUPPORTED_MECHANICAL`; **sign M2 COMPLETED** |

### Track C — M3 Advanced Surface Warfare

Depends on accepted M1 + M2 (DESIGN-55 §4) — both COMPLETED. **This is the
current track; C-1 is in flight.**

| #   | Sprint                          | Governing docs                                                     | Content deliverable                                  |
| --- | ------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| C-1 | Torpedoes                       | DESIGN-40                                                          | Torpedo types/performance                            |
|     | **C-1 SCOPING: DONE 2026-08-16 — PASS (committed `dddb11d`).** Scoped the torpedo **fire-resolution** vertical slice of DESIGN-40 as an engine-only, deterministic, minute-advancing resolution in `@bluewave/combat` (model → launcher → ammunition → launch legality → launch → track → hit → detonation → damage package; no campaign snapshot schema change; goldens must remain unchanged). Wayfinder map `.scratch/c1-m3-torpedoes/map.md` + decision tickets `01..06` (resolved), spec (AC-1..25, INC-1..8), brief `.ai/briefs/c1-m3-torpedoes.md`, research `docs/research/c1-m3-torpedoes.md`. **Deferred:** manual-launch command + tactical AI authority, §18 progressive-flooding resolution (C-5), §25 evasion, §26 persistence, submarine launch (C-3), aerial torpedoes (D-track). **Next: C-1-IMPL (INC-1..8).** |
|     | **C-1 IMPL: INC-1..INC-7 DONE (2026-08-16).** INC-1 (`1777312`, repairs `c075170`, `6688ca2`): model/launcher/ammunition/compatibility/reason codes/constants (AC-1..4). INC-2 (`5a6944e`): launch legality/eligibility/speed limits (AC-5..8). INC-3 (`f97a3c9`): fire solution/salvo/friendly-fire (AC-9..11, AC-19). **INC-4 (`ffa65ea`): launch timing/failure + TorpedoTrack (AC-12, AC-13 p1)**. **INC-5 (`a2ed7c3`): hit resolution + detonation outcomes (AC-13 p2, AC-14)**. **INC-6 (`072b704`): TorpedoDamagePackage (AC-15..AC-18)** — ADR-0031 entries 1–10. **INC-7 (`db840c7`): engine stage + records/ordering + two-process determinism (AC-20/22/23)** — optional torpedo context in `advanceMinute` after damage, strict no-op keeps B-2..B-6 hashes byte-identical, §27 records + §28 locale-free ordering, `run-torpedo-child` AC-23; reviewer NEEDS_REWORK resolved (chain id uniqueness, same-minute damage composition, battleLedger locale); reports `.ai/reports/c1-m3-torpedoes-inc{4..7}-*.md`; torpedo 504/504, simulation 19/19, goldens 10/10 unchanged. **INC-8 (contracts rollup + reason-codes set-equality + ADR + traceability + gate, AC-21/24/25) DONE 2026-08-16 — PASS**: full `*_v1` rollup + `validate*Contract` fail-closed guards (AC-24); `reason-codes-torpedoes.test.ts` AC-21 set-equality (21 §29 codes, no deferred-in-§29, 2 markers, retired marker never re-added, disjointness); research-grounded `torpedo_models_v1` rolled to 8 models (Whitehead 14-in 1886, RN 21-in Mk VIII 1927, USN 21-in Mk 14 1931 appended; original 5 byte-unchanged); ADR-0031 decision 6 reconciled (MEDIUM-1), reason-codes coupling note (LOW-1); combat `tsc -b` clean, torpedo 517/517, `BattleResolver`/`StrengthCalculator` unmodified. Report `.ai/reports/c1-m3-torpedoes-inc8-contracts-gate.md`. **C-1 COMPLETE (AC-1..AC-25).** |
| C-2 | Mine warfare                    | DESIGN-35                                                          | Mine types/laying                                    |
|     | **C-2 SCOPING: DONE 2026-08-16 — PASS (committed `2ad7f1c`).** Scoped the mine-pressure **lifecycle** vertical slice of DESIGN-35 as pure functions in `@bluewave/combat` (`packages/combat/src/mines/`; no phase/snapshot wiring this sprint, mirrors B-5-before-B-6): mine types/pressure record (§1–2), sources/laying value/pressure increase (§3–5), sweeping eligibility/base values/dual-purpose equipment/effective value/regional aggregation (§6–10), defensive standoff + route risk as value-only (§13, §16), report/misidentification (§19–20), decay/post-war persistence/ownership dispositions/knowledge/clearance (§21–24, §27), records/ordering/reason codes (§28–30). Wayfinder map + decision tickets `01..06` (resolved), spec (AC-1..25, INC-1..8), brief `.ai/briefs/c2-m3-mine-warfare.md`, research note `docs/research/c2-m3-mine-warfare.md` (no primary-source grounding required — DESIGN-35 ships exact constants). **Deferred in full to a C-2 continuation:** all mine-strike resolution (§11, §14–15, §17–18, §25–26) — blocked on either a not-yet-built tactical battle-hazard engine stage or DESIGN-25 (deployment/logistics, still unassigned/`CONTENT_ONLY` per ADR-0011). Scoped in parallel with C-1-IMPL (disjoint file paths). **Next: C-2-IMPL (INC-1..8), after C-1-IMPL completes.** |
|     | **C-2 IMPL: DONE 2026-08-16 — PASS (orchestrator pipeline, INC-1..INC-8).** Mine-pressure lifecycle fully implemented in `packages/combat/src/mines/` (25 ACs, all green; mines suite 26 files / 357 tests). INC-1 (`4b5dde3`): MineTypeDefinition + contracts + reason codes (AC-2/21/24 seed). INC-2 (`fc769e4`): sources + §4 laying value (bigint one-FLOOR) + §5 pressure increase (weighted-freshness law) (AC-1/3/4/5). INC-3 (`4792bad`): sweeping eligibility/base values/dual-equipment/effective value (AC-6..9). INC-4 (`3ed06b8`): regional aggregation + §10 allocation; localeCompare→codepoint determinism repair (AC-10). INC-5 (`6af47d9`): defensive standoff + route risk value-only + NON-§30 marker (AC-11/12). INC-6 (`398ed2b`): mine report + underwater-explosion classifier (AC-13/14). INC-7 (`705f401`): decay/post-war/ownership/knowledge/clearance (AC-15..19). INC-8 (`d1ac1e2`): §28 records + §29 ordering (codepoint, `warIds` + §10 allocation order regression fixes), contracts rollup (`validateAllMineContracts`), two-process determinism child (`run-mines-child.ts`, AC-23), integration-boundary proof (AC-22), goldens 10/10 at INC-2..INC-7 gates. **ADR-0033** (scope/integration + strike deferral + reason-code/constant policy: 16 shipped incl. marker + `MINE_WARFARE_INVARIANT_FAILED`; 3 deferred §30 strike codes). Report: `.ai/reports/c2-m3-mine-warfare-impl.md`. `BattleResolver`/`StrengthCalculator` unmodified throughout. **Deferred (recorded):** strike resolution + phase/snapshot wiring + route-strike application (DESIGN-25) → C-2 continuation. **Environment note:** the INC-8 golden gate was blocked mid-sprint by the concurrent C-1 agent's in-flight `phase-engine`/`events`/`cross-process-test` hardening edits in the same working tree (Zod `datetime` on their envelope; no mines frame, AC-22 proves zero wiring) — recorded, not repaired here. **Next: C-3 (Submarines).** |
| C-3 | Submarines                      | DESIGN-34                                                          | Submarine classes                                    |
|     | **C-3 SCOPING: DONE 2026-08-17 — PASS.** Scoped the **strategic submarine-operations lifecycle** vertical slice of DESIGN-34 (`docs/rules/submarines.md`, 464 lines / 28 §) as an engine-only, deterministic pure-function set in `@bluewave/combat` (new `packages/combat/src/submarines/`): strategic representation (persistent-unit vs flotilla-pool) → type definitions (5 types) → policies (weights sum 10_000) → mission eligibility → reliability → base-proximity bands → remote-efficiency → long-range ASW vulnerability → mission effectiveness (one FLOOR) → coastal restriction → sea-state profile (§13–17) → screening balance → attack-opportunity **selection** value-only → submarine-laid mine laying (→ C-2 `AreaMinePressureRecord`) → records/ordering/reason codes. Wayfinder map `.scratch/c3-m3-submarines/map.md` + decision tickets `01..06` (resolved), spec (AC-1..22, INC-1..8), brief `.ai/briefs/c3-m3-submarines.md`, research `docs/research/c3-m3-submarines.md` (DESIGN-34 ships exact integers — no grounding pass needed, mirrors C-2). **Deferred (recorded):** tactical allocation/loss (§2–3), returning-ship interception (§21), ASW resolution application (§22), friendly-fire risk/outcome (§23–24), strategic attack loss application (§19) — each needs battle/attack machinery or DESIGN-29 (intelligence, unassigned); mine-strike (C-2 continuation); phase/snapshot wiring (mirrors B-5→B-6). No snapshot schema change; goldens must stay 10/10. **Next: C-3-IMPL (INC-1..INC-8).** |
| C-4 | Coastal defenses                | DESIGN-48 (short doc, 48 lines — may fold into C-3 during scoping) | Coastal-defense content                              |
| C-5 | Smoke + detailed damage control | remainder of DESIGN-42, DESIGN-41                                  | Damage-control / smoke constants                     |
| C-6 | M3 acceptance gate              |                                                                    | M3 content `SUPPORTED_MECHANICAL`; sign M3 COMPLETED |

### Track D — M4 Aviation

Depends on accepted M1 + M2 always; any capability using torpedoes/mines/subs/smoke/
detailed damage control also depends on the corresponding M3 capability (DESIGN-55 §5).

| #   | Sprint                                    | Governing docs           | Content deliverable                                  |
| --- | ----------------------------------------- | ------------------------ | ---------------------------------------------------- |
| D-1 | Aircraft development, squadrons, airbases | DESIGN-43 (768 lines)    | Aircraft/squadron/airbase data                       |
| D-2 | Carrier operations                        | DESIGN-44                | Carrier + airgroup content                           |
| D-3 | CAP & strikes                             | DESIGN-43/44 integration | Mission/CAP constants                                |
| D-4 | Air defense / AA                          | DESIGN-45                | AA gun/ship data                                     |
| D-5 | M4 acceptance gate                        |                          | M4 content `SUPPORTED_MECHANICAL`; sign M4 COMPLETED |

### Track E — M5 Electronics and Missile Era

Depends on all earlier accepted milestones plus full cross-domain integration
(DESIGN-55 §6) — the heaviest dependency closure in the project.

| #   | Sprint                                             | Governing docs                                         | Content deliverable                                             |
| --- | -------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| E-1 | Radar & electronic warfare                         | DESIGN-46                                              | Radar/EW equipment data                                         |
| E-2 | Data links & fighter direction                     | DESIGN-46 remainder                                    | Data-link/FD content                                            |
| E-3 | Missiles, SAM, CIWS                                | DESIGN-47                                              | Missile/SAM/CIWS data                                           |
| E-4 | Jets & helicopters                                 | cross-cutting update to DESIGN-43/44/45 for later eras | Jet/helo aircraft data                                          |
| E-5 | Full cross-domain integration + M5 acceptance gate | DESIGN-55 §6, §17                                      | All remaining content `SUPPORTED_MECHANICAL`; sign M5 COMPLETED |

### Release sprint (project completion)

| #     | Sprint                      | Kind | Depends on           | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----- | --------------------------- | ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REL-1 | **Full release validation** | Gate | all of A–E, C-tracks | Materialize the DESIGN-55 §15 scenario support manifest, §17 full-support predicate, §19 era coverage matrix, §18 capability closure, §14 unsupported-content isolation, and §29 release validation report for the production scenario; run the §22 packaged smoke suite (compile → 24 resolvable months → battle auto-resolve for every reachable mission family → save/restart/load → replay at strategic + tactical checkpoints → locked-content reachability → final hash verification). `finalDecision = PASS`. Refresh `docs/PROGRESS.md`, sign release, produce the §24 release support manifest. **This is the human-free completion gate.** |

## Cross-cutting domain docs not yet assigned to a track

These have design docs but no package or milestone owner identified yet; resolve
ownership during the relevant scoping sprint rather than guessing now:

- `docs/domain/fleet-management.md`, `officers-and-personnel.md` — partially covered
  by M1's `FleetState`/`Ship`; crew/personnel mechanics (DESIGN-27, DESIGN-28
  crew-training-and-morale.md) are unassigned — likely folds into B10a/B10c follow-up
  or M2.
- `docs/rules/politics-confidence-and-unrest.md` (DESIGN-18) — unassigned; DESIGN-55
  §20 lists "diplomacy, politics, objectives, war, peace, treaties" together but B10c
  only scoped war/peace/basic diplomacy. Needs its own scoping sprint, likely after
  M1.
- `docs/rules/treaties.md` (DESIGN-30) — explicitly deferred out of B10c; needs its
  own scoping sprint.
- `docs/rules/bases-and-infrastructure.md` (DESIGN-16), `deployment-and-logistics.md`
  (DESIGN-25), `trade-raiding-and-merchant-shipping.md` (DESIGN-33), `blockade.md`
  (DESIGN-32, basic version only landed in B10c) — unassigned; required by DESIGN-55
  §20 strategic/economic coverage before a scenario can be `FULLY_SUPPORTED`.
- `docs/rules/amphibious-operations.md` (DESIGN-36) — DESIGN-55 doesn't list it under
  any milestone's contents explicitly; confirm placement (likely M3) during scoping.
- `docs/domain/strategic-objectives.md`, `possessions-and-territorial-control.md`,
  `world-geography.md` — mostly consumed already by the M1 compiler; verify no gaps
  remain when M2 needs territorial/geographic data for tactical battles, and ensure
  the CONTENT-0 production pack re-authors these with real geography.
- `docs/architecture/intelligence-and-knowledge.md` (DESIGN-29) — strategic fog
  of war; tactical fog-of-war (target legality) landed in B-2, but the strategic
  intelligence layer is still unassigned; DESIGN-55 §20 requires intelligence
  coverage for full support.

## Immediate next action

**ACTIVE CHARTING (spec-writing): M2 "First Month at the Admiralty"
(`.scratch/game-onboarding-first-month/`) — IN PROGRESS 2026-08-17.** A
wayfinder effort producing the Milestone 2 strategic-loop spec (Take command
→ Overview → priorities → Treasury/Research/Construction/Fleet/Diplomacy
inspection → Advance Month → Monthly Naval Estimates → save/load). This
session resolved the frontier decision tickets **07 (research)**, **08
(fleet)**, **09 (construction)**, **11 (diplomacy tension-threshold policy —
implemented in `campaign-engine/src/diplomacy.ts`, `tensionLabel`/
`isHighTension`/`HIGH_TENSION_THRESHOLD=8`, + test)**, **16 (save/load &
campaign-list)**, **18 (guided-inspection spotlight model)**, **13
(Advance Month flow — resolved 2026-08-17: the month pipeline is largely real,
so §14 reduces to documenting `commitMonth`+`MonthExecutor`+`SaveStore`, the
real `PhaseRegistry` stage list, the revision/committing-flag double-submit
model with the same-`requestId` result-replay gap recorded, "no mid-resolution
cancellation" as the decided deferral, and the new pre-turn review feeding off
the priorities engine (04) + two new `PlayerProjection.economy` fields (06);
unblocks 14 + 15)**, and **04 (Immediate priorities engine — resolved
2026-08-17 via research-subagent grounding: new read-only
`campaign-engine/src/priorities.ts` projection, 6 of 8 doc types ship —
`obsolete_active_class` cut (no obsolescence score and no design→tech
mapping, so even the tech-gap fallback is unbuildable) and `construction_stalled`
cut (month-over-month `completedWork` delta not persisted); cash triggers feed
off ticket 06's two new `PlayerProjection.economy` fields; `high_foreign_tension`
imports ticket 11's `isHighTension`; `construction_near_completion` adapted to a
work-ratio proxy since months-to-completion is underivable; dismissal persisted
in a new tolerant `ui-state.json` per-campaign sidecar that also resolves
ticket 05's deferred storage; **recorded finding:** engine `monthly_revenue`
uses `baseResources` (compiled 0) vs projection `income` — a pre-existing M1
economy display concern, flagged not resolved)**. **ALL 18/18 TICKETS RESOLVED + SPEC ASSEMBLED + SLICED — the M2 "First Month
at the Admiralty" charting effort is COMPLETE.** The single M2 spec is
assembled at `.scratch/game-onboarding-first-month/spec.md` (+
`.ai/specs/game-onboarding-first-month.md` pointer) and sliced into 14
frontier-ordered implementation tickets at
`.scratch/game-onboarding-first-month/issues/INC-01..14` (to-tickets,
tracer-bullet vertical slices). **Implementation frontier: INC-1 (economy
projection extension) DONE 2026-08-17 (commit `4a5eb20`, 5 tests, goldens
10/10, desktop tsc -b clean); INC-3 (ui-state.json sidecar) DONE 2026-08-18
(reviewer APPROVE; ADR-0038; merge-preserve write semantics; desktop 470/470;
goldens 10/10; two-process byte-identical — report
`.ai/reports/game-onboarding-first-month-inc3.md`); **INC-14 (campaign shell
header — 14 files, 488 desktop, goldens 10/10, byte-identical, `StrategicDestination`
`foreign-relations`→`diplomacy`) + INC-2 (priorities projection — pure
`buildPrioritiesProjection`, 6 of 8 types, 79/79 campaign-engine, goldens
10/10) DONE 2026-08-18 (commits `5f8f348` + `ebadc5c`, report
`.ai/reports/game-onboarding-first-month-inc14-inc2.md`)** → **INC-13
(campaign-list screen — `listCampaigns` IPC + `SaveStore.list` read + 6-column
UI, `—` for legacy/status, load via `loadCampaign`) + INC-4 (read-only
Treasury screen — `PlayerProjection.economy.maintenanceCost` added, stub route
replaced; no budget controls) DONE 2026-08-19** (report
`.ai/reports/game-onboarding-first-month-inc13-inc4.md`; desktop 507/507,
goldens 10/10, byte-identical) → **INC-5 (research allocation edit UX — field-level priorities, `MAX_HIGH_PRIORITY_FIELDS=5` cap, projected monthly progress as pure largest-remainder derivation, autosave via `SaveStore` with `SAVE_FAILED` rollback, renderer-only unsaved indicator; 5 files via the existing `SetResearchPriorityCommand` path) DONE 2026-08-19 (commit `a0079ed`, report `.ai/reports/game-onboarding-first-month-inc5.md`; desktop 507/507, `tsc -b` clean, goldens 10/10, byte-identical)** → **INC-6 (Overview dashboard) is next**, then the remaining screens (INC-7..INC-12) in
blocking order.
The M2 spec covers §0–§19.1 (6-of-8 priorities with cuts; read-only Treasury;
no ship naming; no real progress streaming; two new tolerant renderer-owned
sidecars; report = real `CommitMonthResponse`; battle outcomes as report text)
+ Out of scope + Handoff. **C-3-IMPL (submarines, queued below) remains on the
implementation track, not dropped.**

**B-6: DONE 2026-08-15 — M2 COMPLETED.** Battle results → campaign integration
+ M2 acceptance gate landed (commits `bf77843` scoping, `62fba1d` INC-1,
`405bace` INC-2, `1c7b76a` INC-3; INC-4 folded; INC-5 gate). Authoritative
`weather_generation` + per-area strategic weather on snapshot (ADR-0025),
`resolveBattleAuto` deterministic auto-resolver (ADR-0026), `battle_resolution`
phase wiring + consequences (ADR-0027). `M2_SURFACE_TACTICAL_CORE` **COMPLETED**
(§23) — registry `docs/acceptance/m2-capability-registry.md`, report
`.ai/reports/b6-m2-battle-results-impl.md`. Goldens 10/10.

**Next: Track C — M3 Advanced Surface Warfare.** **C-1 IMPL INC-1..INC-7 DONE
(2026-08-16):** INC-1 (`1777312`/`c075170`/`6688ca2`), INC-2 (`5a6944e`),
INC-3 (`f97a3c9`), INC-4 (`ffa65ea`), INC-5 (`a2ed7c3`), INC-6 (`072b704`),
INC-7 (`db840c7`) — fire solution → salvo → launch/track → hit/detonation →
damage package → engine stage all green (504/504 torpedo, goldens 10/10,
ADR-0031). **C-2-IMPL (mines) DONE 2026-08-16 — PASS:** INC-1..INC-8 all landed
(`4b5dde3`, `fc769e4`, `4792bad`, `3ed06b8`, `6af47d9`, `398ed2b`, `705f401`,
`d1ac1e2`), mines 26 files / 357 tests green, ADR-0033 (scope/integration +
strike deferral + reason-code/constant policy), report
`.ai/reports/c2-m3-mine-warfare-impl.md`. **C-1 INC-8 (contracts rollup +
reason-codes set-equality + ADR + traceability + gate, AC-21/24/25) DONE
2026-08-16 — PASS** (committed; report
`.ai/reports/c1-m3-torpedoes-inc8-contracts-gate.md`): full `*_v1` rollup,
research-grounded `torpedo_models_v1` (8 models), AC-21 set-equality guard,
ADR-0031 decision-6 reconciled, combat 517/517 torpedo tests + combat `tsc -b`
clean. Repo-wide golden/two-process gate in this shared tree is blocked by the
concurrent session's `events` Zod-`datetime` WIP (unrelated; recorded). **C-1
COMPLETE (AC-1..AC-25).** **C-3 SCOPING DONE 2026-08-17 — PASS:** strategic
submarine-operations lifecycle slice of DESIGN-34 scoped (map + decision tickets
01–06 resolved, spec AC-1..22 / INC-1..8, brief `.ai/briefs/c3-m3-submarines.md`,
research `docs/research/c3-m3-submarines.md`); tactical allocation/loss (§2–3),
returning-ship (§21), ASW resolution (§22), friendly-fire (§23–24), and strategic
attack loss application (§19) deferred (battle machinery / DESIGN-29 unassigned).
**Next frontier: C-3-IMPL (INC-1..INC-8).** Candidate
parallel work recorded: content climate-profile YAML (CONTENT-track), DESIGN-38
§34 statistical study (REL-1), repair `content-schema/nation.test.ts`.

**Previous: B-5-IMPL (INC-1..6) DONE — PASS (2026-08-15).** M2 tactical weather &
visibility: `StrategicWeatherState` + `weather_generation` phase (order 0.5),
battle-weather init, 12 tactical components, 30-min progression, visibility /
glare / fog / precipitation / night-twilight, `resolveWeather` engine stage
(step 7.5, strict no-op), `WeatherEventRecord` + ordering, random-ledger port,
4 `*_v1` contracts, reason-code set-equality, ADR-0022. Evidence:
`.ai/reports/b5-m2-weather-visibility-impl.md`.

**Previous: B-5 SCOPING DONE (2026-08-15).** Wayfinder map, decision tickets,
spec (17 ACs, 6 INC slices), brief, and `.ai/specs/` pointer at
`.scratch/b5-m2-weather-visibility/`.

**Backlog after M2 (recorded deferrals / order):**

1. **C-1 Torpedoes (DESIGN-40) — COMPLETE 2026-08-16 (INC-1..INC-8, all green;
   ADR-0031; AC-1..AC-25).** Deferred (recorded): progressive-flooding resolution
   (C-5), evasion, damage persistence, submarine launch (C-3), aerial torpedoes
   (D-track), phase/snapshot wiring (later battle-results slice).
2. **C-2 Mine warfare (DESIGN-35) — DONE 2026-08-16 (INC-1..INC-8, all green;
   ADR-0033).** Deferred to a **C-2 continuation**: mine-strike resolution
    (§11/§14–15/§17–18/§25–26), phase/snapshot wiring, route-strike application
    (blocked on DESIGN-25). **Next C-2 frontier: C-3 Submarines (DESIGN-34) — SCOPED 2026-08-17; C-3-IMPL queued.**
3. **Content C-track climate-profile YAML** — CONTENT-track; confirm coupling
   to the M3 weather-mechanic acceptance rather than standalone.
4. **Content C-track continuation** — MID_CENTURY + LATE-era content (M4/M5) as
   the corresponding mechanics land; deployment (DESIGN-25) scoping; the **B-1
   AC-14 production ship→design linkage**.
5. **Repair `content-schema/test/nation.test.ts`** — pre-existing broken import
   (canonical nation-corpus-home decision; defer to owner at final validation).
**Side-track desktop / CLI surface work (recorded, not dropped):**

5. **Desktop engine-feature gate (`.scratch/desktop-engine-feature-gate/`)** —
   all shipped surfaces are DONE/PASS (2026-08-15):
   - **Research & Technology screen** — report
     `.ai/reports/desktop-engine-feature-gate.md`; `@bluewave/campaign-engine`
     `research.ts` projection + 24 `campaign:execute` commands + engine-authoritative
     `SetResearchPriorityCommand` issue via `MonthExecutor`.
   - **Diplomacy & War screen (B10c)** — `.scratch/desktop-diplomacy-war/`,
     report `.ai/reports/desktop-diplomacy-war.md`; `diplomacy.ts` projection +
     26 commands (`inspectDiplomacyScreen`, `submitDiplomacyCommand` over the 7
     B10c bodies) + shared command queue (`pendingCommands.ts`) + relations /
     wars / blockades renderer.
   - **Tactical battle-outcome surfacing (B-6 follow-up)** —
     `.scratch/desktop-battle-outcomes/`, report
     `.ai/reports/desktop-battle-outcomes.md`; flat `BattleOutcome` +
     `ClosingSnapshotSummary.battleOutcomes` (campaign-engine, type-only) +
     `commitMonth` hydration (pre→post resolved-set delta; `warScoreDelta`
     re-derived from `month.ts:1508-1538` over the pre-battle snapshot,
     ADR-0028; `0` when undecided/loser-unavailable — never fabricated) +
     Turn-Report "Battle Outcomes" accordion. Fully read-only over the engine;
     goldens 10/10 unchanged; desktop 353, campaign-engine 49, cross-process 14/14.
   - **Debug-mode gating** — Simulation/Tactical Sandbox/Debugging screens
     gated behind build-time debug mode (2026-08-16, `c8553a1`, ADR-0029).
   - **Queued next candidates** (`.scratch/desktop-feature-gate/`, candidates 2–5):
     strategic weather surfacing (B-5/ADR-0025), AI-plan read-only, divisions /
     formation view, design-template catalog.
   - **Follow-up (deferred, engine-sprint):** persist the war-score delta on
     `BattleResult`.
6. **Desktop E2E suite** — **IN PROGRESS.** Hermetic Playwright harness green
   (`.scratch/desktop-e2e-suite/`); tickets 1–3 resolved (harness scaffold,
   new-game compile, advance-month), 4–7 ready-for-agent. Coverage matrix:
   `.scratch/desktop-e2e-coverage/coverage-matrix.md`.
7. **CLI battle/gunnery debug surface** — **DONE** (`de6eb55`;
   `.scratch/cli-battle-debug-surface/`, all 5 tickets resolved): `battle:generate`,
   `battle:advance-minute`, `battle:resolve-shot`, enriched `turn:execute` /
   `replay` battle output.
8. **Desktop renderer side-tracks — DONE:** UI-kit React 19 migration
   (`.scratch/desktop-ui-kit-migration/`), campaign save viewer
   (`.scratch/desktop-campaign-viewer/`), and the `SaveStore` Map-serialization
   fix (`d72438c` / `3441427`). The earlier `apps/desktop` test/lint repair item
   (missing `@testing-library/react` + wrong `@bluewave/campaign-engine` import)
   is **resolved** (vite-plus migration + the `campaign-engine` package now
   exists; desktop suites green per the reports above).
