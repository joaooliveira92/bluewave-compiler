# Ticket 04 — Fire Solution & Salvo

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary

## Question

How are DESIGN-40 §10 fire-solution quality and §11 salvo size represented so the
results are exact, integer-safe, and deterministic?

## Decision

- **§10 solution quality:** integer within `0..10_000` bp. Formula exactly per the
  shipped expression: `clamp(0, 10_000, floor(baseSolutionBp * rangeMultiplierBp *
  bearingMultiplierBp * targetMotionMultiplierBp * ownManeuverMultiplierBp *
  crewMultiplierBp * trainingMultiplierBp * seaStateMultiplierBp *
  visibilityMultiplierBp * technologyMultiplierBp * damageMultiplierBp / 10_000^10))`
  — an **11-factor manifest**, exact integer basis-point product retained through
  all multipliers, rounded **once** with `FLOOR`. A missing factor fails closed
  (`TORPEDO_FIRE_SOLUTION_INSUFFICIENT` or an explicit factor-missing reason;
  never a silent `10_000` fallback).
- **§10 minimums** (versioned-ruleset constants, shipped as authored constants):
  automated single-target `5_000`; manual Captain-mode `4_000`; area-denial/spread
  doctrine `3_000`; friendly-in-danger-sector `7_500` or prohibited. No mode below
  an explicit doctrine threshold.
- **§9 inputs:** the resolver uses only the firing side's knowledge estimates
  (target estimated range/bearing/speed/course/uncertainty, own speed/course/turn
  rate, launcher geometry, crew, training, sea state, visibility/ID, fire-control
  tech, launcher damage, target maneuver history, selected setting) — never hidden
  true target state.
- **§11 salvo:** a salvo specifies exact tube identifiers; ≤ physical tube count;
  the AI salvo-policy factors are authored as an explicit constant list (target
  combat value, size, range, solution quality, remaining ammo, friendly launchers,
  overkill, mission objective, withdrawal state) with a deterministic selection
  function; manual + AI salvos reserve ammunition **atomically** before any tube
  fires.
- **§12 timing/failure:** tubes fire in ascending tube-identifier order at their
  declared firing substep; per-tube mechanical failure consumes no torpedo except
  `TORPEDO_STUCK_IN_TUBE`; later tubes continue only per the salvo policy; every
  result recorded separately; no random branch changes canonical tube order. Base
  launch-failure probability `100` bp per tube before model/damage/crew/reliability
  modifiers.

## Deferred (recorded)

- Target-allocation / multi-ship fire distribution beyond the salvo policy —
  later command slice.
- Evasion affects on solution quality (§25) — ship-maneuver track.

## Rationale / authority

DESIGN-40 §9–12 are normative and fully specified; the integer product + one-FLOOR
shape matches the B-3 gunnery accuracy precedent (`gunnery/accuracy.ts`,
`GUNNERY_ACCURACY_FACTOR_MISSING`).