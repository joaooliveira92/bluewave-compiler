# INC-6: Records, ordering, contracts rollup, reason-code set-equality

**Frontier: no** (blocked by INC-4, INC-5)

## Depends on

INC-4 (mine pressure — supplies mine-pressure record type for integration), INC-5 (effectiveness — supplies effectiveness record fields)

## Acceptance criteria

AC-7, AC-8, AC-9 (full), AC-10, AC-11

## Files to create

- `packages/combat/src/coastal-defense/records.ts` — `CoastalDefenseOperationsRecord` + canonical ordering
- `packages/combat/test/coastal-defense/records.test.ts`
- `packages/combat/test/coastal-defense/reason-codes-coastal-defense.test.ts` — set-equality partition
- `packages/combat/test/coastal-defense/integration-boundary.test.ts` — proves no engine/snapshot modification
- `packages/combat/test/coastal-defense/determinism.test.ts` — two-process determinism child (optional, defer if scaffold overhead is > model complexity)

## Verification

Full gate: `pnpm -w turbo run build --force`, `tsc -b`, `pnpm vitest run packages/combat/test/coastal-defense/`, golden verify