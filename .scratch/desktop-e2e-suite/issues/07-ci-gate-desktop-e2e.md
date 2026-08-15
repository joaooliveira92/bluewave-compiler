# 07 — CI gate: desktop-e2e.yml

**What to build:** the suite runs in CI as a dedicated macOS gate — a new
workflow that builds the desktop app, runs the full Playwright suite against
the built app hermetically, fails loudly with artifacts on a real break, and
only triggers when the desktop app, its fixtures, or the gate itself change.
The repo's root/turbo scripts stay untouched.

**Blocked by:** 01 — Harness scaffold runs green, 05 — Fleet visibility and
honest stub surface, 06 — Continuance suite (all matrix rows must exist and
pass before the gate claims green).

**Status:** ready-for-agent

- [ ] Workflow per the ratified spec (map ticket 04): `macos-latest`; push to
      the work branch(es) + pull requests; **paths-filtered** to the desktop
      app, the shipped production package the continuance suite copies, and
      the workflow file itself.
- [ ] Setup mirrors the existing gates: checkout, pinned pnpm action, Node
      24 with pnpm cache, frozen lockfile install.
- [ ] Builds the desktop app (`pnpm build`) before running
      `pnpm --filter @bluewave/desktop test:e2e`; the harness fails fast if
      the build output is missing.
- [ ] CI hardening from the ratified spec: retries on CI with
      trace-on-first-retry, succeeded screenshots on failure, `test-results`
      artifacts uploaded on failure; concurrency group with
      cancel-in-progress.
- [ ] Every coverage-matrix spec row (1–11) is exercised by the gate and
      passes on a `macos-latest` runner — recorded run output.
- [ ] No changes to `determinism.yml` / `quality.yml` / root scripts;
      clean working tree; small conventional commit(s).