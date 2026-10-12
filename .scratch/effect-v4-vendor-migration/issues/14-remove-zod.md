# 14 — Remove `zod` from every `package.json` and the root devDependency

**Type:** implementation
**Status:** open
**Blocked by:** none (08–13 all done)
**Frontier:** yes

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

## Comments

### Audit note (ticket 00, 2026-10-12)

**Frontier now.** The whole job is the renderer shim and one dependency line
(full table in ticket 00 §4):

1. Delete `apps/desktop/src/renderer/zodJitless.ts` (the only `zod` import left).
2. Drop `import "./zodJitless.js"` + its comment from
   `apps/desktop/src/renderer/main.tsx:1-3`.
3. Drop the `src/renderer/zodJitless.ts` entry from
   `apps/desktop/tsconfig.web.json:33`.
4. Remove `"zod": "^4.6.5"` from `apps/desktop/package.json:43`; run
   `pnpm install` (lockfile lines `169, 4291, 7631` go away) and confirm
   `pnpm why zod` is empty and `pnpm install --frozen-lockfile` passes.
5. Reword the stale Zod claims in `apps/desktop/src/main/csp.ts:12-16` and
   `apps/desktop/scripts/packaged-smoke.mjs:42-45` (the latter had uncommitted
   owner changes at audit time — re-read, don't overwrite).
6. Re-run the packaged smoke / `pnpm test:e2e`: the benign-console-error list is
   unchanged, and no library left in the renderer probes `unsafe-eval`.
7. Adjacent hardening (code change; belongs here because the gates that justify
   closing 16–25 rely on it): add `"~effect/"` to `MARKERS` in
   `apps/desktop/scripts/check-renderer-bundle.mjs:17`. `EffectTypeId` does not
   survive minification (ticket 00 §5-C). Verify by building the renderer and
   seeding a throwaway `import { Data } from "effect"` to see the guard fail.

Leave historical "previously Zod" comments in tests/schemas (parity
provenance) and `scripts/test/verify-package-dependencies.test.mjs:15` (a
fixture string). The root `package.json` has no `zod`; only `@bluewave/desktop`
does.
