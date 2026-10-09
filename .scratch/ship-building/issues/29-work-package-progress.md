# 29: Run construction progress per work package

**Type:** implementation (engine milestone)
**Status:** in progress (slice 29a done; 29b-e open, see ADR-0077)
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
