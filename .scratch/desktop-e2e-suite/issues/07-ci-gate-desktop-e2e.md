# 07 — CI gate: desktop-e2e.yml

**What to build:** the suite runs in CI as a dedicated macOS gate — a new
workflow that builds the desktop app, runs the full Playwright suite against
the built app hermetically, fails loudly with artifacts on a real break, and
only triggers when the desktop app, its fixtures, or the gate itself change.
The repo's root/turbo scripts stay untouched.

**Blocked by:** 01 — Harness scaffold runs green, 05 — Fleet visibility and
honest stub surface, 06 — Continuance suite (all matrix rows must exist and
pass before the gate claims green).

**Status:** resolved

- [x] Workflow per the ratified spec (map ticket 04): `macos-latest`; push to
      the work branch(es) + pull requests; **paths-filtered** to the desktop
      app, the production content pack the continuance suite compiles from,
      and the workflow file itself.
- [x] Setup mirrors the existing gates: checkout, pinned pnpm action, Node
      24 with pnpm cache, frozen lockfile install.
- [x] Builds the desktop app (`pnpm build`) before running
      `pnpm --filter @bluewave/desktop test:e2e`; the harness fails fast if
      the build output is missing.
- [x] CI hardening from the ratified spec: retries on CI (`playwright.config.ts`,
      shipped by ticket 01) with trace-on-first-retry, screenshots on
      failure, `test-results` artifacts uploaded on failure; concurrency
      group with cancel-in-progress.
- [x] Every coverage-matrix spec row implemented by this effort (0–10) is
      exercised by the suite and passes locally on macOS — recorded run
      output below (row 11 intentionally not implemented; see ticket 06).
- [x] No changes to `determinism.yml` / `quality.yml` / root scripts;
      clean working tree; small conventional commit(s).

## Answer

Resolved. New workflow `.github/workflows/desktop-e2e.yml`, mirroring
`quality.yml`/`determinism.yml`'s setup steps exactly (checkout →
`pnpm/action-setup@v4` 11.9.0 → `actions/setup-node@v4` node 24.0.0 with
pnpm cache → `pnpm install --frozen-lockfile`), then desktop-e2e-specific:
`pnpm build` → `pnpm --filter @bluewave/desktop test:e2e`, running on
`macos-latest` only (the desktop harness is Electron-specific; the other
two gates run cross-platform/ubuntu because they don't need a real window
server). Triggers: `push: [dev, main]` and `pull_request`, both
paths-filtered to `apps/desktop/**`, `content/production/1880/**` (the
content pack the continuance suite compiles its fixtures from — the
matrix's original shipped-package path no longer exists, per ticket 02/06),
and the workflow file itself; `workflow_dispatch` for manual runs.
`concurrency: { group: desktop-e2e-${{ github.workflow }}-${{ github.ref
}}, cancel-in-progress: true }`. `test-results/` uploaded as an artifact
only `if: failure()`. `playwright.config.ts` (ticket 01) already carries
the retries/trace/screenshot CI hardening this ticket's spec calls for —
no config changes needed here.

`determinism.yml`, `quality.yml`, and root `package.json`/`turbo.json`
scripts are untouched (verified via `git diff` — this ticket only adds the
new workflow file).

**Validation**: workflow YAML validated with `python3 -c "import yaml;
yaml.safe_load(...)"` (no `actionlint` available in this environment).
Functional equivalent of the gate's job ran locally on this macOS machine:
`pnpm --filter @bluewave/desktop build` → clean build, then
`pnpm --filter @bluewave/desktop test:e2e` → `13 passed` (smoke + mvp-loop
rows 1–6 + continuance setup ×2 + rows 7–10 — every matrix row this effort
implements, rows 0–10; row 11 is out of scope per ticket 06's finding).
`vp lint .` (whole desktop package, including the new spec files) → 0
warnings/errors. Desktop unit suite → `49 files / 360 tests passed`.
Real `macos-latest` CI execution happens on push/PR — not runnable from
this local session.