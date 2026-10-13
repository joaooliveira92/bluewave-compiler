# ADR-0052: P-1 — Observational Per-Ship Cause of Loss

## Status

Accepted (2026-10-07).

## Context

`BattleResolutionResult` reported sunk ids and hp loss only, so the balance sweep
could not say WHY ships were lost (gunfire vs flooding vs torpedo).

## Decision

1. Add optional `causeOfLoss?: Record<shipId, "gunfire" | "fire" | "flooding" | "torpedo">`,
   present only when at least one ship was lost and keyed by exactly the sunk ids.
2. Derived deterministically by `CauseOfLossTracker` (`battleResolution/causeOfLoss.ts`)
   from per-minute pre/post `ShipDamageState` deltas and the minute's torpedo hit
   records: progressive-flooding growth drains flotation (-> `flooding`, or `torpedo`
   when a torpedo-caused flooding source exists); remaining flotation/structural loss
   is `gunfire`, or `torpedo` when a torpedo hit resolved that minute. The largest
   bucket at the first NORMAL -> SINKING/FOUNDERED transition wins (ties
   torpedo > flooding > gunfire). Zero attributable loss (breakup/capsize path) is
   `fire` when a fire burns, else `gunfire`. No RNG, integer only.
3. The field is OBSERVATIONAL and excluded from `resultHash`. No baseline moves.

## Consequences

No hashes changed (all pinned result/minute/golden baselines pass unchanged).
`fire` is rare by construction: fire records do not drain reserve in the current
damage model. Phase-engine consumers pick fields explicitly and are unaffected.
