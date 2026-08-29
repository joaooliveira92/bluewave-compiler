# INC-3: Damage state progression

**Frontier: no** (blocked by INC-2)

## Depends on

INC-2 (placement — supplies zone context for where damage can be applied)

## Acceptance criteria

AC-3 (full)

## Files to create

- `packages/combat/src/coastal-defense/damage.ts` — `applyLandTargetDamage` pure function, 5-state linear progression, typed damage events
- `packages/combat/test/coastal-defense/damage-states.test.ts`

## Verification

`pnpm vitest run packages/combat/test/coastal-defense/damage-states.test.ts` (AC-3 all sub-cases)