# 01 — Harness scaffold runs green

**What to build:** the shared Playwright–Electron test harness for the
desktop suite, wired so `pnpm --filter @bluewave/desktop test:e2e` passes
green from a clean build with at least the boot/landing assertion running
hermetically (no dev server). This is the foundation every later spec builds
on — the harness contract and config spec are already ratified by the map.

**Blocked by:** None — can start immediately (run
`pnpm install --frozen-lockfile` first; the working tree's `@playwright/test`
symlink is incomplete).

**Status:** ready-for-agent

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