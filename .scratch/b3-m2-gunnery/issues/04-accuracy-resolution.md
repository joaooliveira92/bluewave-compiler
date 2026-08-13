# Ticket 04 — Accuracy Resolution

**Type:** decision
**State:** RESOLVED
**Blocked by:** 01

## Question
How is the DESIGN-39 §3 accuracy formula implemented deterministically and
exactly?

## Decision
For every firing solution compute:

`finalAccuracyBp = clamp(0, 10_000, floor( Π_m multiplierBp_m / 10_000^(m-1) * baseAccuracyBp ))`

retaining the **exact integer (basis-point) rational value** through ALL multipliers
and rounding **once** with `FLOOR` (per §3 "rounded once with FLOOR"). The factor
manifest is **explicit and versioned** — every multiplier is a named, ordered
factor (base accuracy, fire-control, crew, officer, training, range, visibility,
radar, own maneuver, target maneuver, previous salvo, sea-state, smoke, damage,
multiple attacker, glare, target evasion). A missing/undefined factor fails with
`GUNNERY_ACCURACY_FACTOR_MISSING` — no silent 10_000 fallback.

Hit check: compare **one keyed integer draw** `0..9_999` (from the domain-separated
random stream) against `finalAccuracyBp`, succeeding exactly when `draw < finalAccuracyBp`
(§3). The draw is recorded as a random decision in the `GunneryEventRecord`.

This slice ships the manifest with all 17 factors present (many pinned to their
neutral 10_000 value until the owning modifier track lands — range/visibility/
radar/etc. are as-authored neutral constants, not invented behavior), so the
formula and its floor-rounding are fully exercised and provable.

## Rationale / authority
DESIGN-39 §3 normative (exact values, one FLOOR, missing→`GUNNERY_ACCURACY_FACTOR_MISSING`).
Versioned factor manifest satisfies ENGINEERING-CONTRACT §Formulas-and-explanations.
