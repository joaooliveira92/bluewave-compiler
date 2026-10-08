# INC-4: Local mine-pressure contribution

**Frontier: no** (blocked by INC-2, INC-3)

## Depends on

INC-2 (placement — determines which areas have batteries), INC-3 (damage — determines if battery is intact enough to contribute)

## Acceptance criteria

AC-5

## Files to create

- `packages/combat/src/coastal-defense/mine-pressure.ts` — `calculateCoastalArtilleryMinePressure` pure function, uses C-2's `createMinePressureRecord`
- `packages/combat/test/coastal-defense/mine-pressure.test.ts`

## Verification

`pnpm vitest run packages/combat/test/coastal-defense/mine-pressure.test.ts`