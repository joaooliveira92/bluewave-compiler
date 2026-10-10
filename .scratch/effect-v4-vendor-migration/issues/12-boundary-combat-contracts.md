# 12 — Boundary: `combat` contract schemas Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** open
**Blocked by:** 07 (Wave 1 exit)
**Frontier:** no

## What to build

Migrate the Zod contract/definition schemas inside `@bluewave/combat` to Effect
Schema atomically: `air-combat/contracts`, `aircraft/contracts`,
`carrier-operations/contracts`, `air-defense/contracts`,
`air-defense/attack`, `air-defense/air-defense-system-definition`. No other
`combat` module is touched here (runtime migration of `combat` is Wave 4).

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-ZOD-1,
  MIG-WIRE-3**; Wave 2 (contract schemas only).
- `.scratch/effect-v4-vendor-migration/plan.md` §4.1–§4.3.
- The six files listed above; `packages/combat/src/reasonCodes.ts`.

## Acceptance criteria

- [ ] The six contract/definition files are converted to Effect Schema; no `zod`
      import remains in those files; no dual definition (`MIG-ZOD-1`).
- [ ] Any reason codes / contract constants emitted from these schemas keep
      identical values and semantics.
- [ ] `zod` removed from `combat`'s resolved dependency surface if no other Zod
      use remains in the package (otherwise leave until its last user lands in a
      later wave and record which file still uses it).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime` in these files.
- [ ] `pnpm --filter @bluewave/combat test` green for the affected schema tests;
      `pnpm typecheck` green.

## Notes

- Do **not** refactor pure combat math here; that is Wave 4.
- Existing `combat` non-contract Zod use must be enumerated and handed to the
  Wave 4 `combat` tickets / ticket 14.
