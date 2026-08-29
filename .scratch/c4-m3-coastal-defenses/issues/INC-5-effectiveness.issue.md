# INC-5: Value-only effectiveness formula

**Frontier: no** (blocked by INC-2, INC-3)

## Depends on

INC-2 (placement — positions matter for engagement), INC-3 (damage — damaged batteries have reduced effectiveness)

## Acceptance criteria

AC-6

## Files to create

- `packages/combat/src/coastal-defense/effectiveness.ts` — `coastalArtilleryEffectivenessBp` BigInt formula (floor)
- `packages/combat/test/coastal-defense/effectiveness.test.ts`

## Verification

`pnpm vitest run packages/combat/test/coastal-defense/effectiveness.test.ts`