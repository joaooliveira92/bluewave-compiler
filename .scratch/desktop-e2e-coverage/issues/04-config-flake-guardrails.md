# Desktop E2E Coverage — 04: Config & Flake Guardrails

Type: grilling
Status: resolved
Blocked by: 01, 02

## Answer

Config, flake guardrails, and CI invocation spec — ratified by the user
(workflow `.yml` file itself is built by the follow-up effort, plan-don't-do;
this is the spec it implements):

- **Config shape** (`apps/desktop/playwright.config.ts`): single default
  project, `testDir: "e2e"`, `workers: 1`, `fullyParallel: false`,
  `timeout: 120_000`, `expect.timeout: 15_000`, `outputDir: "test-results"`,
  `reporter: process.env.CI ? "github" : "list"`, CI-aware retries/trace (D3).
- **Build prerequisite**: `test:e2e` stays `playwright test`; the harness
  fails fast if `out/` is missing. The workflow runs `pnpm build` (turbo,
  desktop + deps) before e2e. No new package script, no turbo wiring —
  e2e deliberately outside `turbo run test`, matching the cross-process gate.
- **Retries & trace**: `retries: process.env.CI ? 2 : 0` with
  `trace: "on-first-retry"` in CI; screenshots on failure. Isolation (ticket
  02) makes retries safe; a deterministic break fails 3×, a transient
  Electron cold-boot flake doesn't, and failures carry traces.
  `--disable-gpu` is a documented fallback knob if macOS CI flakes
  (unverified, off by default).
- **CI invocation** (`desktop-e2e.yml`): new gate, `macos-latest`; triggers
  `push: [dev, main]` + `pull_request` **paths-filtered** to
  `apps/desktop/**`, `content/production/1880/bluewave-austria_hungary-scen_1880/**`,
  and the workflow file. Steps mirror the existing gates at
  `.github/workflows`: `actions/checkout@v4` → `pnpm/action-setup@v4`
  (11.9.0) → `actions/setup-node@v4` (node 24.0.0, pnpm cache) →
  `pnpm install --frozen-lockfile` → `pnpm build` →
  `pnpm --filter @bluewave/desktop test:e2e`; `concurrency` group with
  `cancel-in-progress: true`; upload `test-results/` artifact on failure.