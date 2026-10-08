# INC-7: Phase Stage + Engine Wiring

**Frontier: no** (blocked by: INC-3, INC-5, INC-6)

## Deliverable

New `resolve_aircraft_development` phase (order 7.2, rngAllowed: true) wired into the phase registry. `resolveAircraftDevelopment` per-nation function that executes the development pipeline. Records + canonical ordering per §38-39. Strict no-op when no nation has aviation tech. Golden regeneration under ADR-0007.

## Files

- `packages/combat/src/aircraft/engine-wiring.ts` — `resolveAircraftDevelopment`, batch executor
- `packages/combat/src/aircraft/records.ts` — §38 immutable record creation
- `packages/combat/src/aircraft/ordering.ts` — §39 canonical ordering
- Phase registry update in `@bluewave/phase-engine`
- `cross-process/run-aircraft-child.ts` — two-process determinism child

## Tests

- `aircraft/records.test.ts` — record completeness, hashes
- `aircraft/ordering.test.ts` — canonical order invariant
- `aircraft/engine-wiring.test.ts` — phase resolution, no-op guard
- `cross-process/run-aircraft-child` — 2-process byte-identical

## Acceptance criteria

AC-23 (§38-39), AC-25 (phase wiring), AC-27 (two-process determinism), AC-28 (BattleResolver/StrengthCalculator unmodified)

## Dependencies

INC-3 (development pipeline), INC-5 (squadron lifecycle), INC-6 (basing model) — all needed for full phase resolution