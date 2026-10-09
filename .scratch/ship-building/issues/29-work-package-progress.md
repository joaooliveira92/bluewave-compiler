# 29: Run construction progress per work package

**Type:** implementation (engine milestone)
**Status:** in progress (29a-29d done; 29e open, see ADR-0077)
**Blocked by:** none (ADR-0064 gives the package model)
**Frontier:** yes

Spec: ADR-0064 (new-construction work packages), `.scratch/ship-building/spec.md` sections 15.3-15.5; DESIGN-23 sections 6, 18-19.

## State today

`packages/ship-design` models eight work packages (HULL, MACHINERY, ARMOUR, ...) and a schedule, and the Drawing Board forecasts from it.
The campaign engine does not use them: a `ConstructionProject` carries one `totalWork` / `completedWork` figure that the player's
budget advances (`applyBudgetProject`). Consequences:

- `ReviseProject` can only classify by overall progress, and must assume "armour/machinery not ordered, not launched" (it can only
  understate the real tier).
- Build time in the forecast and the time a project really takes are unrelated.

## What it needs

1. Per-package progress on `ConstructionProject` (completed work per package, started flags), with the package ordering and
   parallelism of DESIGN-23 sections 18-19; the single `completedWork` becomes the sum.
2. Monthly progress `min(paid work, capacityAvailable, workforce, material)` (spec 15.3) instead of "budget equals work".
3. `launched` and `armourStarted` / `machineryStarted` derived from package state; `progressFromWork` (ship-design) takes them from the
   project instead of assuming false.
4. Migration: existing projects (one figure) map to a hull-only package split so saves keep loading; golden hashes change only for
   designed-ship projects.
5. The forecast's build time and the engine's real duration come from the same schedule.

## Acceptance

- A project advances package by package; trials and launch are states, not guesses.
- `ReviseProject` reads real package state; a launched ship classifies as T3.
- Determinism, persistence round trip, and the cross-process golden checks pass.

## Comments

### 2026-10-09 orchestrator

Sliced in ADR-0077. **29a done:** `advanceConstructionMonth`, `emptyProgress`, `isConstructionComplete`, `PackageProgress` (in `construction.ts`; `simulateConstruction` now repeats the step) and `buildProgressOf`, `progressFromSingleFigure`, `totalDone` (`constructionProgress.ts`). Tests: `constructionProgress.test.ts` (10: dependencies read at the month start, capacity and funds limits, purity, determinism, stepping equals simulating for several capacities and funding, resumability, revision flags, legacy mapping); the 364 existing ship-design tests still pass unchanged. ship-design 36 files / 374 tests; tsc and lint exit 0.
Next: 29b (persistence, no behaviour change), then 29c (engine advancement, the first slice that moves golden hashes).

### 2026-10-09 orchestrator (29b)

**29b done, no behaviour change.** `ConstructionProject` gains optional `packages: ConstructionPackage[]` (id, kind, line, totalWork,
doneWork, dependsOn: the plan is stored on the project, so the engine never needs the design or the content to advance it) and
`yardId`; absent for authored and legacy projects, so no golden hash moves. `snapshotClone` covers both (new record type
`ConstructionPackage`, deep-copied, absent fields stay absent). `constructionPackageProblems` (pure) checks unique ids, known
dependencies, 0 <= done <= total, sum(total) = totalWork, sum(done) = completedWork; closing validation reports
`CONSTRUCTION_PACKAGE_INCONSISTENT`. Tests: `construction-packages.test.ts` (problems, validation wiring, clone), the clone audit
fixture now carries both fields. phase-engine 20 files / 186 tests. A flaky a11y audit I introduced earlier (one test with nine axe
passes timed out under full-suite load and left axe running for the next test) was split into three tests with their own timeouts.
Next: 29c (the first slice that changes behaviour and golden hashes for designed-ship projects).

### 2026-10-09 orchestrator (29c)

**29c done: designed-ship projects now advance package by package.** Steps: (1) `scalePlanToUnits` / `capacityInUnits` (largest remainder onto the project's treasury units); (2) `chooseYard` extracted from the forecast and shared, `constructionOrderPlan`; (3) `CompiledDesignVersion.constructionPlan` (packages in units, yard, per-line capacity) stored by `buildDesignVersion` for SubmitDesign and ReviseProject; (4) the desktop order builder (`constructionProjectFor`, submit and replace) starts a project with packages and `yardId` when the plan adds up to the cost; (5) `fundConstructionProject` (phase-engine) is the one funding rule used by `applyBudgetProject`, the appropriation phase and its leftover funding. Per-month capacity is accounted on the project (`monthUsage`: work applied per line, progress at the month's start), and `advanceConstructionMonth` takes an optional `dependencyProgress`, so several funding calls in one month cannot spend a line's capacity twice or start a dependent package early. Money that cannot be used is not spent: `budget_project` charges only the work applied and warns `PROJECT_CAPACITY_EXHAUSTED` when nothing can be done; the appropriation phase skips such projects and lets leftover funds go to the next project that can use them.
Key proof: through the real month executor a package project completes in exactly `simulateConstruction`'s number of months for yard capacities 20, 45 and 1000 (`construction-engine.test.ts`), so the forecast and the engine agree. Legacy and authored projects (no packages) keep the single-figure arithmetic and every golden hash unchanged.
Tests: ship-design 37 files / 390; phase-engine 22 files / 206 (construction-funding 8, construction-engine 8, clone audit); desktop main 22 files / 217 (snapshot-mutations 4). `pnpm check` exit 0 (173 desktop files, 1146 tests, 19 e2e, goldens and cross-process determinism unchanged).
Known behaviour change (intended, ADR-0077): a designed ship now takes as many months as its yard allows, not one month per budget. Open: 29d (ReviseProject reads real state and rescales packages; a launched ship is T3), 29e (Construction screen shows packages and the yard; the Drawing Board yard list drops "forecast only").

### 2026-10-09 orchestrator (29d)

**29d done: revision reads real state and keeps packages consistent.** Found while testing: after 29c, revising a project made from the Drawing Board would have left its `packages` stale against the new design (closing validation would fail), because the existing revise tests only used one-figure projects. Now `applyReviseProject` (a) classifies from `projectBuildProgress` (hull share, armour/machinery started, launched) for a project with packages, so a launched ship is T3 and `REVISION_REQUIRES_REBUILD` is raised; (b) rescales the packages onto the new design's plan with `revisePackages`: the share done is kept per package (`floor(done x newTotal / oldTotal)`), T1 rework is added to the package its change kind reworks (structure, armour, machinery, main armament, fittings, in that order) so remaining work grows by exactly the rework, T2 keeps only hull work up to what the rules keep, the yard follows the new design and this month's capacity use is carried; (c) falls back to the single figure when the new design has no plan. The desktop revision preview and the construction queue entry read the same packages, so preview and engine agree.
**Bug fixed in 29a/29b code:** a package with no work (a very small ship rounds some packages to zero units) counted as complete from the start, so `launched` was true at 0% and later packages could start before the hull. `isPackageComplete` now requires a package's dependencies to be complete too; `advanceConstructionMonth`, `isConstructionComplete` and `buildProgressOf` use it (tests: tiny plan, launched flag, dependents wait).
Tests: ship-design 37 files / 394; phase-engine 23 files / 221 (construction-revision 9, revise-project +6 package cases); campaign-engine 15 files / 101; desktop construction 17 files / 166. Open: 29e (Construction screen shows packages and the yard; the Drawing Board yard list drops "forecast only").
