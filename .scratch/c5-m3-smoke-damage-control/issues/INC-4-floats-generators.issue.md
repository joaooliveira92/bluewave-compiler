# INC-4: Smoke floats, generators, source precedence

**Frontier: yes** (blocked by INC-1, INC-2)

## Acceptance criteria

AC-2 (partial), AC-3 (partial)

## Scope

Smoke-float technology (§17): requires `smoke_float_operations` tech, CL only, storage and deployment equipment, doctrine adoption (3 paid months).

Smoke-float capacity (§18): 4 floats, permitted range 3-5, per design. Deployment consumes one.

Smoke-float deployment (§19): eligible CL, ≥1 float, equipment operational, ≤25 knots, no simultaneous deployment, stern-position deployment, 5-minute emission, 8_500 initial density, 400m reference width.

Smoke-generator technology (§20): `shipboard_smoke_generator` tech, compatible CL designs, generator installation, fuel/power/DC connections, 3-month doctrine.

Generator replacement policy (§21): generator → no floats, mode change from FLOATS to GENERATOR.

Generator capacity (§22): 5-minute generation, 20-minute cooldown, 3 charges/battle, 9_000 density, 500m width.

Source precedence (§23): funnel smoke + one deliberate source allowed; no simultaneous floats + generator; overlapping clouds merge spatially under §8.

## Files to create

- `packages/combat/src/smoke/smokeFloats.ts`
- `packages/combat/src/smoke/smokeGenerator.ts`
- `packages/combat/src/smoke/sourcePrecedence.ts`
- `packages/combat/test/smoke/smoke-floats.test.ts`
- `packages/combat/test/smoke/smoke-generator.test.ts`
- `packages/combat/test/smoke/source-precedence.test.ts`

## Verification

`pnpm vitest run packages/combat/test/smoke/smoke-floats.test.ts packages/combat/test/smoke/smoke-generator.test.ts packages/combat/test/smoke/source-precedence.test.ts`