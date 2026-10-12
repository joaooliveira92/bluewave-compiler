# 01 — Performance budget tripwire

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no
**Spec:** `.scratch/release-readiness/spec.md`

## Scope

Add a deterministic performance tripwire for the two paths a user feels: advancing a
month (engine + compile) and rendering the strategy map at maximum zoom / largest
dataset.

## Acceptance

- A benchmark (node, no GPU) for month-advance over the production pack with a fixed
  seed, asserting a generous wall-clock ceiling on CI hardware.
- A renderer benchmark for the map at max zoom, or a documented manual budget if the
  map cannot be measured headlessly.
- Budgets recorded in this ticket with the measured baseline; a breach fails CI.

## Notes

Measure first, then set the ceiling ~2-3x the baseline to avoid flake; the point is
catching order-of-magnitude regressions, not micro-tuning.

## Resolution

Landed a deterministic month-advance tripwire over the **production** 1880 pack:

- `apps/desktop/src/main/perf/monthAdvance.perf.test.ts` compiles the verified
  content artifact (`compileProductionCampaignFromArtifact`) and drives the real
  `MonthExecutor` for 12 months at a fixed seed (`perf-tripwire-1880`), timing only
  the loop (not the compile). It is gated behind `BLUEWAVE_PERF=1` so it never adds
  timing flake to the default suite.
- **Measured baseline** (2026-10-12, reference dev machine, warm Node 24):
  **1071ms for 12 months (~89ms/month)**. `BASELINE_TOTAL_MS = 1100`,
  `CEILING_TOTAL_MS = 3300` (3x) — an order-of-magnitude regression fails, a
  slower CI runner passes.
- **CI breach gate:** `.github/workflows/quality.yml` runs the tripwire as a
  dedicated step after `pnpm content:build`:
  `pnpm --filter @bluewave/desktop exec cross-env BLUEWAVE_PERF=1 vp test run src/main/perf/monthAdvance.perf.test.ts`.
- **Strategy map (max zoom / largest dataset): documented manual budget.** The map
  renders in the Electron renderer and has no headless measurement harness, so the
  budget is manual per the ticket's allowance: on the reference machine, pan/zoom
  at maximum zoom over the largest compiled map must hold ~60fps (≤16ms/frame, no
  sustained >50ms main-thread task) as read from Electron DevTools Performance
  while sweeping the chart, and must be re-checked on any strategy-map change
  (`pnpm snap` for the visual, DevTools for the frame timing). A headless map
  benchmark is a recorded follow-up, not silently dropped.

## Comments
