# INC-2: Placement rules

**Frontier: yes** (blocks INC-3..INC-6)

## Blocks

INC-3 (damage progression), INC-4 (mine pressure), INC-5 (effectiveness), INC-6 (records/ordering)

## Acceptance criteria

AC-4

## Depends on

INC-1 (model types, constants)

## Files to create

- `packages/combat/src/coastal-defense/placement.ts` — `selectCoastalDefensePositions` pure function, geographic zone model, seed-driven RNG stream
- `packages/combat/test/coastal-defense/placement.test.ts`

## Verification

`pnpm vitest run packages/combat/test/coastal-defense/placement.test.ts`