# 02: Make the gate suite load-tolerant

**What to build:** `pnpm check` no longer fails on host contention. Today two suites time out at a
fixed 5s per test when the machine is loaded (the content-codemod property/permutation determinism
test and one Electron e2e), which makes CI an unreliable signal. The fast and heavy tiers are
separated, test concurrency is bounded, the slow property/e2e suites carry an appropriate timeout, and
a transient e2e failure is retried once.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The content-codemod determinism/permutation suite and the e2e suite pass repeatedly while the
      host is under induced load (e.g. a parallel build), and never fail purely on a per-test timeout.
- [x] The fast tier (unit/package tests) and the heavy tier (e2e) are distinct, so one is not starved
      by the other.
- [x] A documented, bounded test-concurrency setting exists and is honoured by CI.
- [x] The change does not mask a genuine slow regression: a test that legitimately exceeds its budget
      still fails with a clear message.

## Comments

Most of this ticket was already satisfied by work landed just before it was sliced; the reconciliation
below names the evidence, and the one real gap (a deliberate, pinned fast-tier concurrency bound and an
explicit heavy-suite budget) is what changed here.

**Already in place (verified, not re-built):**

- The 5s-default flakiness the ticket describes was fixed by `a205001b` (maintainability-hardening
  ticket 03): `scripts/vitest-shared.mjs` pins `testTimeout: 15000` for every workspace package and
  `scripts/verify-vitest-config-parity.mjs` fails a package that stops inheriting it. The desktop
  renderer suite carries `testTimeout: 60000` and `maxWorkers: 4` (`apps/desktop/vitest.config.ts`).
- Fast/heavy tiers are distinct commands: `test:run` (per-package unit suites), `test:heavy`
  (`scripts/run-heavy-tests.mjs`, phase-engine long simulations, `--maxWorkers=2`), `test:e2e`
  (Playwright, separate `desktop-e2e.yml` workflow).
- E2E load tolerance: `apps/desktop/playwright.config.ts` sets `timeout: 120_000`, `workers: 1`, and
  retries a transient failure once locally / twice in CI.

**Changed here (production-hardening ticket 02):**

1. `packages/content-codemod/vitest.config.ts` — the determinism/permutation suites (the named slow
   suite) now carry an explicit, documented `testTimeout: 30000` as deliberate headroom above the 15s
   shared baseline.
2. `package.json` — `test:run`/`test` pin `vp run -r --concurrency-limit 4 test` so the fast-tier
   concurrency bound is explicit rather than an unpinned `vite-plus` default that a bump could
   silently raise.
3. `.github/workflows/quality.yml` — comment documenting the fast tier's bound and its separation
   from the separately-bounded heavy step.

**Evidence — induced load:** 8 CPU burners on a 10-core box (`yes > /dev/null`), three consecutive
runs of `pnpm exec vp test run test/determinism.test.ts test/publish.test.ts test/equivalence.test.ts`
in `packages/content-codemod`: all green, 3 files / 17 tests each (durations 8.31s, 4.90s, 5.01s).

**Evidence — full gate (uncached):** `pnpm check` exit 0 (~9m11s): preflight, format, lint,
lint:effect, test:scripts (193), licenses, typecheck, build, content:verify, test:run, test:heavy,
check:golden (11/11), check:determinism, check:equivalence, check:golden-repin, check:balance-reports,
and `test:e2e` (30 passed). `node scripts/verify-check-parity.mjs` → ok (17 steps, all covered by CI);
`pnpm test:scripts` → 193 pass / 0 fail.

**Note on overlap:** the broader "bound the whole workspace test run below everything-at-once" ask is
maintainability-hardening ticket 04 (`Status: open`); it is a different tracker and was not touched
here. `vp run`'s pinned `--concurrency-limit 4` already satisfies this ticket's criterion.

**Follow-up (2026-10-15, during ticket 05's gate):** the `construction-batch` e2e flaked once under the
full `pnpm check` load (a campaign compile exceeding a per-step `toBeVisible` timeout), passing in
isolation. That exposed a gap in this ticket's fix: `playwright.config.ts` retried only in CI
(`retries: CI ? 2 : 0`), so a transient failure failed the *local* `pnpm check` too. The retry is now
`CI ? 2 : 1` — a transient e2e failure is retried once locally, as the ticket specifies.
