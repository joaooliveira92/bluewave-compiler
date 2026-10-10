# 14 — Remove `zod` from every `package.json` and the root devDependency

**Type:** implementation
**Status:** open
**Blocked by:** 08, 09, 10, 11, 12, 13 (all boundaries migrated)
**Frontier:** no

## What to build

Contract step of the Zod→Schema conversion: delete `zod` from all workspace
`package.json` files and the root devDependency, after every identified boundary
and transitive consumer has migrated. No Zod definition may remain anywhere.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-ZOD-2,
  MIG-ZOD-3**; read "Zod → Effect Schema replacement".
- `.scratch/effect-v4-vendor-migration/plan.md` §4.1 (the full boundary list).

## Acceptance criteria

- [ ] No `zod` import or `ZodSchema`/`z.*` reference remains in `packages/*` or
      `apps/*` (a repo-wide search returns zero) (`MIG-ZOD-2`).
- [ ] `zod` removed from every `package.json`, including the root
      `devDependencies` (`MIG-ZOD-3`).
- [ ] `pnpm why zod` reports no resolution; `pnpm install --frozen-lockfile`
      green (`MIG-ZOD-3`).
- [ ] No boundary retains a parallel Zod definition (`MIG-ZOD-1`).
- [ ] `pnpm check` green.

## Notes

- If a residual Zod use is found that a Wave 2 ticket missed, stop and report it
  (do not silently keep `zod`); open a boundary ticket rather than leaving a dual
  definition.
