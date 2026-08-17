# 01 — Harness scaffold runs green

**What to build:** the shared Playwright–Electron test harness for the
desktop suite, wired so `pnpm --filter @bluewave/desktop test:e2e` passes
green from a clean build with at least the boot/landing assertion running
hermetically (no dev server). This is the foundation every later spec builds
on — the harness contract and config spec are already ratified by the map.

**Blocked by:** None — can start immediately (run
`pnpm install --frozen-lockfile` first; the working tree's `@playwright/test`
symlink is incomplete).

**Status:** resolved

- [ ] `@playwright/test` resolves from `apps/desktop` after (re)install —
      a trivial spec currently fails with MODULE_NOT_FOUND, and does after
      this ticket too, both ways clean.
- [ ] Harness implements the ratified contract (from
      `prototype/desktop-e2e-harness/`): hermetic boot (built main, no
      `--dev`), per-test `--user-data-dir` scratch + `mkdtemp`, one
      `dialog.showOpenDialog` stub via `app.evaluate`, teardown in `finally`
      (close app, remove scratch), fail fast with a readable message when
      the build output is missing.
- [ ] `playwright.config.ts` per the ratified spec: testDir `e2e`,
      `workers: 1`, `fullyParallel: false`, generous test/expect timeouts,
      `outputDir: "test-results"`, CI-aware reporter + retries + trace
      (retries only on CI, isolation makes them safe).
- [ ] The existing smoke spec is hermetic (no `--dev`), boots the built app,
      and passes as the boot/landing (row 0) assertion.
- [ ] `pnpm --filter @bluewave/desktop test:e2e` is green end to end from
      `electron-vite build` — exact commands + results recorded.
- [ ] No authoritative package, content pack, or shipped fixture touched;
      clean working tree; small conventional commit(s).

## Answer

Resolved. Harness scaffold green:

- Wrote `apps/desktop/e2e/fixtures.ts` — the ratified contract: hermetic boot
  (`out/main/index.js`, no `--dev`), per-test `--user-data-dir` + `mkdtemp`
  scratch, dialog stubs for BOTH call sites (`showSaveDialog` → `filePath` for
  compile; `showOpenDialog` → `filePaths` for continuance) via `app.evaluate`
  (inlined — outer helpers aren't in the Electron main-process scope),
  `retargetDialog`, `copyFixturePackage`, serial fixture `test.extend`,
  fail-fast when `out/main/index.js` is missing, `test-results` output.
- `apps/desktop/e2e/smoke.spec.ts` — hermetic boot/landing spec on the
  harness (no `--dev`; asserts the URL is not localhost ⇒ prod `loadFile`).
- Import with `.js` extension (repo ESM convention); playwright resolves it.
- `test-results/` is gitignored; `out/` rebuilt via `pnpm build`.

Validation (exact commands + results):
- `pnpm install --frozen-lockfile` → repaired the broken `@playwright/test`
  symlink (resolves, `_electron` present).
- `pnpm --filter @bluewave/desktop build` → `✓ built in 642ms`.
- `pnpm --filter @bluewave/desktop test:e2e` → `1 passed (1.7s)` hermetic.
- Standalone `tsc --noEmit` on the two e2e files → clean. (`pnpm --filter
  @bluewave/desktop typecheck` surfaces two pre-existing errors in
  `packages/combat` from the in-progress b6 sprint work — not this effort's
  files; untouched.)

Known surface for later tickets: this harness only asserts boot/landing.
The dialog stub now intercepts real calls, but no spec has exercised a
full campaign flow yet — that's tickets 02–06.

Commits: `test(desktop): hermetic Playwright harness scaffold + config (boot
green)` (ac12c5a). Working tree contains only the b6 sprint's own
in-progress files (unrelated, untouched).