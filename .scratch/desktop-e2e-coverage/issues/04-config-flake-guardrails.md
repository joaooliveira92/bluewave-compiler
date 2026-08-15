# Desktop E2E Coverage — 04: Config & Flake Guardrails

Type: grilling
Status: open
Blocked by: 01, 02

## Question

What should `apps/desktop/playwright.config.ts` and the CI invocation look
like, so the suite is deterministic-first and CI-stable?

Decide, informed by the harness shape (ticket 02) and API facts (ticket 01):

- **Config shape**: `testDir`/`testMatch`; projects (a single
  "electron" project vs per-flow projects); `workers: 1` +
  `fullyParallel: false` (approved) but with isolation (ticket 02) making
  later parallel an option — record the switch condition for that;
  `timeout` (boot is slow; the smoke test uses 30s) vs per-test expect
  timeouts; `retries` on CI (allowed given determinism, or a hard no?);
  `reporter` for CI (list vs a file); artifact capture on failure
  (screenshots/video/traces — `trace: on-first-retry` / `on` in CI).
- **Build prerequisite**: `test:e2e` runs `electron-vite build` first (the
  hermetic run requires `out/`) or assumes a prior build? Script shape in
  `apps/desktop/package.json`.
- **Root wiring**: keep `test:e2e` out of turbo (like this repo keeps the
  cross-process gate separate) or add a root script that the new CI workflow
  calls (`pnpm --filter @bluewave/desktop test:e2e`)?
- **CI specifics**: the concrete `desktop-e2e.yml` steps — Node version
  (engine `>=24`), `pnpm install --frozen-lockfile`, enable corepack, build,
  run, upload artifacts (test-results/ + traces) on failure; whether to gate
  on PR + dev-push; whether `macos-latest` retries are configured.
  (Deliverable: the workflow spec, not the file — this map is plan-don't-do.)