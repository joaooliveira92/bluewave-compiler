# INC-2 — Accuracy Resolution

**State:** READY_FOR_AGENT · **Blocked by:** INC-1
**Spec:** `.scratch/b3-m2-gunnery/spec.md` (AC-3, AC-4) · **ADR:** (recorded at INC-5)

## Acceptance criteria
- AC-3 **Accuracy formula exactness**: `finalAccuracyBp = clamp(0, 10_000, floor(baseAccuracyBp * Π_m multiplierBp_m / 10_000^16))`
  — exact integer (basis-point) rational value retained through **all** multipliers,
  rounded **once** with `FLOOR` (§3); factor manifest explicit + versioned (17 named
  factors: base + fire-control, crew, officer, training, range, visibility, radar,
  own-maneuver, target-maneuver, previous-salvo, sea-state, smoke, damage,
  multiple-attacker, glare, target-evasion); a missing factor fails with
  `GUNNERY_ACCURACY_FACTOR_MISSING` (never silent 10_000 fallback). Proving test:
  `combat/test/gunnery/accuracy.test.ts` (exactness + floor + factor-missing).
- AC-4 **Hit-check draw semantics**: one keyed integer draw `0..9_999`
  (domain-separated `@bluewave/random` stream) compared to `finalAccuracyBp`,
  succeeding exactly when `draw < finalAccuracyBp` (§3); the draw is recorded as a
  random decision in the event record. Proving test:
  `combat/test/gunnery/hit-check.test.ts` (+ keyed-stream).

## Notes for implementator
Non-slice factors (range/visibility/radar/etc.) are pinned to neutral 10_000 as
authored constants until their owning modifier track lands — not invented behavior.
Use `@bluewave/random` keyed stream (match B-2 spotting keyed-stream scatter —
`spotting/detection.ts`). Exact integer arithmetic via `@bluewave/contracts`
safe ints / checked arithmetic.
