# ADR-0077: Construction progress per work package (model, migration, slicing)

## Status

Accepted 2026-10-09. Implements ticket 29 on top of ADR-0064 (work packages) and ADR-0067 (yards, build time). First slice delivered.

Supersedes: ADR-0076 (decision 1).

## Context

A `ConstructionProject` carries one `completedWork` figure that a player's budget advances one-to-one (`applyBudgetProject`). The workshop forecast, the revision rules and the yard model all reason about packages (hull, machinery, armour, ordnance, launch, fit-out, trials, acceptance) and per-line capacity, but the engine never does. So `ReviseProject` must assume nothing is armoured or launched, and the forecast's build time is unrelated to the time a project really takes.

## Decisions

1. **One resumable step.** `advanceConstructionMonth(plan, progress, capacity, fundsWork)` is a pure, deterministic single month from any state; `simulateConstruction` is that step repeated (a test proves month-for-month equality), so the forecast and the engine cannot diverge. Progress is `PackageProgress`: work done per package id.
2. **Revision reads real state.** `buildProgressOf(plan, progress)` produces the `BuildProgress` the revision rules use (hull progress, armour and machinery started, launched), replacing the "assume nothing started" default. A launched ship then classifies as T3.
3. **Old saves keep loading.** `progressFromSingleFigure` maps a project's single `completedWork` onto the plan by pouring it into packages in canonical order (hull first): a partly built ship reads as hull work only, which is the conservative reading the revision rules already assumed; a finished one is fully done.
4. **Package state is optional on the project.** The engine slice adds `packages?: Record<string, number>` to `ConstructionProject`; absent means legacy and is mapped on read. Authored (non-designed) projects have no plan and keep the single figure, so their golden hashes do not move; only designed-ship projects change.
5. **Yards enter at slice c.** The monthly step takes the capacity of the yard that builds the ship; the yard is chosen at order time (the same rule as the forecast: smallest fitting yard that finishes soonest) and stored on the project, which is what turns the Drawing Board's "forecast only" yard list into the real thing.
6. **Money to work.** The engine's work unit is the treasury unit (ADR-0074); the plan's work is in micro-units. Package work is scaled to the project's `totalWork` in units by largest remainder so the packages sum to it exactly; the player's monthly budget is the funds argument.

## Slices

- **29a (done):** the pure model above in `ship-design`, with tests; no engine change.
- **29b:** persistence: optional `packages` and `yardId` on `ConstructionProject`, snapshot clone, validation (done never exceeds total per package), migration on read, round-trip tests; no behaviour change.
- **29c:** `SubmitDesign` stores the plan scaled to units and the chosen yard; `applyBudgetProject` advances packages through `advanceConstructionMonth` (funds = budget, capacity = the yard's); `completedWork` is the sum; golden hashes for designed-ship projects are regenerated and explained.
- **29d:** `ReviseProject` uses `buildProgressOf`; a launched ship is T3; the desktop revision preview does the same.
- **29e:** Construction screen shows per-package progress and the yard; the Drawing Board yard list drops "forecast only".

## Consequences

Each slice leaves the tree green and shippable. Slices b and c touch determinism and persistence, so they carry the cross-process determinism and golden checks.
