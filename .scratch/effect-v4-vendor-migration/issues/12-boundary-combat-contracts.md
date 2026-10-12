# 12 — Boundary: `combat` contract schemas Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** done
**Blocked by:** 00 (reconciliation audit), 07 (Wave 1 exit)
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

- [x] The six contract/definition files are converted to Effect Schema; no `zod`
      import remains in those files; no dual definition (`MIG-ZOD-1`).
- [x] Any reason codes / contract constants emitted from these schemas keep
      identical values and semantics.
- [x] `zod` removed from `combat`'s resolved dependency surface if no other Zod
      use remains in the package (otherwise leave until its last user lands in a
      later wave and record which file still uses it).
- [x] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime` in these files.
- [x] `pnpm --filter @bluewave/combat test` green for the affected schema tests;
      `pnpm typecheck` green.

## Notes

- Do **not** refactor pure combat math here; that is Wave 4.
- Existing `combat` non-contract Zod use must be enumerated and handed to the
  Wave 4 `combat` tickets / ticket 14.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Already satisfied in code — closed.** Landed in `5df46569` (migration),
`652da67e` (SafeInt/strictness hardening) and `248cd6ed` (parity repairs);
the tracker was never updated.

- The six files import only `{ Result, Schema }` from `effect`
  (`air-combat/contracts.ts:5`, `aircraft/contracts.ts:7`,
  `carrier-operations/contracts.ts:3`, `air-defense/contracts.ts:19`,
  `air-defense/attack.ts:8`, `air-defense/air-defense-system-definition.ts:6`);
  support modules `safe-int-schema.ts`, `schema-issues.ts`.
- No `zod` in `packages/combat/package.json` (`effect: workspace:*` only); no
  `Effect`/`Layer`/`ManagedRuntime` import in the package.
- `pnpm --filter @bluewave/combat test`: 288 files / 3797 tests passed;
  `pnpm --filter @bluewave/combat typecheck`: exit 0.
- Non-contract Zod use in `combat`: none (repo-wide `zod` import search → only
  `apps/desktop/src/renderer/zodJitless.ts`).
