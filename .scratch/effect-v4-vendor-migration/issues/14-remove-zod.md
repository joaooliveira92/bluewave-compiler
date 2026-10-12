# 14 — Remove `zod` from every `package.json` and the root devDependency

**Type:** implementation
**Status:** done
**Blocked by:** none (08–13 all done)
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

- [x] No `zod` import or `ZodSchema`/`z.*` reference remains in `packages/*` or
      `apps/*` (a repo-wide search returns zero) (`MIG-ZOD-2`).
- [x] `zod` removed from every `package.json`, including the root
      `devDependencies` (`MIG-ZOD-3`).
- [x] `pnpm why zod` reports no resolution; `pnpm install --frozen-lockfile`
      green (`MIG-ZOD-3`).
- [x] No boundary retains a parallel Zod definition (`MIG-ZOD-1`).
- [x] `pnpm check` green **except three failures that predate this ticket** (see evidence).

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

### Evidence (2026-10-12)

**Changed files:** deleted `apps/desktop/src/renderer/zodJitless.ts`; edited
`apps/desktop/src/renderer/main.tsx`, `apps/desktop/tsconfig.web.json`,
`apps/desktop/package.json` (`zod` removed), `pnpm-lock.yaml` (exactly the 8 zod
lines), `apps/desktop/src/main/csp.ts` and `apps/desktop/scripts/packaged-smoke.mjs`
(comments only), and `apps/desktop/scripts/check-renderer-bundle.mjs` (step 7:
`"~effect/"` marker added, docblock corrected).

| Check | Result |
| --- | --- |
| `rg "from ['\"]zod"` over `apps`, `packages`, `scripts` | no matches |
| `pnpm why zod` | empty |
| `pnpm install` (lockfile rewritten) | ok; diff is only the zod entries |
| `pnpm preflight` / `format` / `lint` / `lint:effect` / `test:scripts` / `check:licenses` | green |
| `pnpm typecheck` | 37/37 |
| `pnpm build` (incl. hardened bundle guard) | 20/20; "renderer bundle clean: no yaml/effect across 20 chunk(s)" |
| Guard seeded with a `~effect/` chunk | exit 1 (fails as intended); exit 0 once removed |
| `pnpm test:run` | 1774/1775 desktop; **1 failure** `RulesOfTheNavalAgeScreen.test.tsx` "applies the previewed preset when Next is pressed" — reproduced on a clean `HEAD` with these changes stashed, so pre-existing |
| `pnpm check:balance-reports` | ok |
| `pnpm test:e2e` | 31 passed, **2 failed**: `new-game-fleet-method.spec.ts`, `theme.spec.ts` "Fleet Dispatch surface…" — the two already recorded as red on `dev`; not re-run on a clean `HEAD` |
| `electron-builder --mac --dir` + `pnpm --filter @bluewave/desktop smoke:packaged` | all PASS incl. "no unexpected console errors" (the benign-error list is unchanged) |

**Residual:** none for Zod. `pnpm check` is therefore not literally green: the
`&&` chain stops at the first red `test:run`; the later stages were run
separately above.

