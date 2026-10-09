# 29: Run construction progress per work package

**Type:** implementation (engine milestone)
**Status:** open (deferred)
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
