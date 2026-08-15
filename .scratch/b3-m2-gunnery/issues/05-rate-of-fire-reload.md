# Ticket 05 — Rate-of-Fire & Reload

**Type:** decision
**State:** RESOLVED
**Blocked by:** 01

## Question
How is rate-of-fire modelled deterministically per DESIGN-39 §4?

## Decision
Reload is **integer tactical-milliseconds of work**, not binary float rounds/min.
Each battery declares `baseReloadMilliseconds` (positive integer). Effective
duration:

`effectiveReloadMs = ceil( baseReloadMs * 10_000^n / Π_m rateMultipliersBp_m )`

where `n` = count of rate multipliers, applied in DESIGN-39 §4 order 1-11
(gun-quality → mount → autoloader → crew → technology → turn-state → sea-state →
smoke → damage → range/fire-control-cycle → ammunition-state). A missing rate
factor fails with `GUNNERY_RATE_FACTOR_MISSING`. Reload progress advances by exact
tactical milliseconds; a battery fires only when progress >= effective duration AND
all firing predicates pass. After firing, progress is reset and ammunition consumed
atomically (§28).

- `ceil` for reload duration per §4 (contrast: `floor` for accuracy).
- Since autoloader/damage/etc. rate modifiers are deferred, the shipped `*_v1`
  policy pins the neutral 10_000 rate multipliers for those deferred factors and
  ships the real gun-quality + crew + technology surface as authored, so the order
  and ceiling rounding are fully exercised.

## Rationale / authority
DESIGN-39 §4 normative (integer ms, ceiling rounding, §4 multiplier order).
