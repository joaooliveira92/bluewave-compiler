# INC-1 — Mine Types + Reason Codes + Contracts Seed

**Type:** implementation
**Status:** open
**Blocked by:** scoping (issues 01–06 resolved)
**Frontier:** yes (first)

## Acceptance (spec AC-2, AC-21, AC-24 seeds)

- `MineTypeDefinition` (§2) with all six canonical types (`CONTACT`/`MAGNETIC`/
  `ACOUSTIC`/`CONTROLLED_DEFENSIVE`/`SUBMARINE_LAID`/`SCENARIO_SPECIAL`) and all
  §2 fields (type id, technology prerequisites, eligible laying sources, base
  laying value, strike profile, target eligibility, sweeping resistance, decay
  policy, friendly-fire policy, battle-generation policy, report-signature
  policy, content version, content hash); missing/invalid field →
  `INVALID_MINE_TYPE_DEFINITION` (`test/mines/type-definitions.test.ts`).
- `mines/reasonCodes.ts` seeded with the in-slice §30 partition (full list will
  be finalized in INC-8, but the module + first codes ship here).
- `mine_type_definitions_v1` contract + `SHIPPED_MINE_TYPE_DEFINITIONS_CONTRACT`
  + validate guard, wiring DESIGN-35's own exact §9/§15/§21 constants per type
  (per ticket 04 — no research-grounded catalog).

## Hints

Follow the B-4/C-1 pattern: `damage/state.ts`-style state module,
`damage/constants.ts`-style contracts module. New module directory
`packages/combat/src/mines/`. Branded-safe-int fields via `@bluewave/contracts`.
Deterministic content hash for each type definition. Do NOT touch
`packages/combat/src/torpedoes/` (C-1-IMPL is concurrent, separate worktree).
