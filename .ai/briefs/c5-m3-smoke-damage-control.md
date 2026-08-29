# C-5 Sprint Brief — Smoke + Detailed Damage Control (M3 Advanced Surface Warfare)

## Summary

Implement the smoke module (DESIGN-42 §§7-23) and damage-control extension (DESIGN-41 §§13-22, §24-25, §27-28) as pure deterministic modules in `@bluewave/combat`. Smoke covers: cloud model, drift/decay, line intersection, funnel smoke, smokescreens, floats, generators. Damage-control covers: fire propagation/resolution, flooding control, damage-control resources/priority.

## Governing docs

- DESIGN-42 `docs/rules/weather-visibility-and-smoke.md` (§§7-23 smoke)
- DESIGN-41 `docs/rules/damage-fire-and-flooding.md` (§§13-22, §24-25, §27-28 remainder)
- Existing B-4 damage pipeline (`packages/combat/src/damage/`)
- Existing weather/visibility module (`packages/combat/src/weather/`)

## Key decisions

1. **Smoke scope (Decision 01):** Full smoke module (§§7-23), all source types.
2. **Damage-control scope (Decision 02):** Fire propagation + flooding control + damage-control resources. Defer full terminal state machine, survivors, rescue.
3. **Engine wiring (Decision 03):** `resolveSmoke` wires into minute-advance (step 5.5). Goldens regenerate. `resolveDamageControl` wires at step 8.6.
4. **Spatial model (Decision 04):** Line-segment + centroid-radius, reusing B-2 geometry primitives.
5. **Pipeline extension (Decision 05):** Separate `resolveDamageControl` stage, not inline.
6. **Reason codes/contracts (Decision 06):** Full set per precedent.
7. **Constants (Decision 07):** TypeScript constants this sprint.

## Implementation tickets (frontier order)

INC-1 (model + constants + reason codes) → INC-2 (drift/decay/intersection) + INC-5 (fire) + INC-6 (flooding) [parallel] → INC-3 (smokescreen) + INC-4 (floats/generators) [after INC-2] + INC-7 (damage control resources) [after INC-5/INC-6] → INC-8 (engine wiring + determinism) → INC-9 (contracts rollup + ADR + gate)

## Acceptance

15 ACs (AC-1..AC-15). See spec §1.1.

## Deferred

Full terminal state machine, survivors/rescue, aluminum superstructure, secondary hazards beyond fire/flooding, smoke→gunnery/spotting integration, phase/snapshot wiring, YAML constants.