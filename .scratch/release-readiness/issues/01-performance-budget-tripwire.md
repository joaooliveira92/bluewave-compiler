# 01 — Performance budget tripwire

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
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
