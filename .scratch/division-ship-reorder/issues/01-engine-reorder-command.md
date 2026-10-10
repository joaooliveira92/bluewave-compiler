# INC-1 — Engine `ReorderDivisionShips` command (end to end in packages)

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** yes
**Requirements:** E-1, E-2, E-3, E-4, E-5, E-6; AC-2, AC-3, AC-4

## Scope

Add the reorder command to `@bluewave/commands` (envelope union + export +
validation + payload dispatch + lifecycle success result), `@bluewave/campaign`
(`applyDivisionCommand` reorder op + `DivisionReorgReason "REORDER"` +
`reorderWithoutFlagship` penalty), `@bluewave/phase-engine` (dispatch in
`divisionCommands.ts` + `commandPhases.ts`), and expose `penalties.reorder` in
`buildDivisionScreenView`.

## Acceptance

- A valid reorder sets `shipOrder`, keeps the flagship first, applies exactly
  `reorderWithoutFlagship` (`experience 0`, `cohesion -3`), refreshes
  `lastReorganizationMonth` and `aggregateHash`.
- Reject codes exactly as E-2 (not found / bad permutation / flagship moved /
  unchanged).
- Package unit tests cover apply + penalty + each reject; determinism (V-2).
- `pnpm --filter @bluewave/campaign test`, `@bluewave/commands test`,
  `@bluewave/phase-engine test` pass; typecheck clean.
