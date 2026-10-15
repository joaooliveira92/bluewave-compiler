# 03: Shared Vitest baseline + config-parity gate

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** Every workspace package runs Vitest with one explicit,
load-tolerant baseline — a deliberate test timeout and the shared on-disk module
cache — and a gate fails when any package's config is missing or stops inheriting
that baseline. The one package currently without its own test config gains it, so
the suite that flaked by exceeding the default timeout under load passes reliably.

- [x] The shared baseline sets an explicit `testTimeout` and enables the shared
  module cache.
- [x] Every `packages/*` and `apps/*` test config imports the shared baseline.
- [x] The previously load-flaky suite passes reliably.
- [x] A gate fails (naming the package) when a package config is absent or stops
  importing the baseline; a fixture proves both paths.
- [x] `pnpm preflight` stays green.

## Comments

- `scripts/vitest-shared.mjs` now sets `testTimeout: 15000` alongside the existing
  `fsModuleCache: true`. 15s is the deliberate, load-tolerant baseline (3× Vitest's
  5s default; a package that needs more overrides on top of the spread, as
  combat/cross-process/desktop 60s and ship-design/phase-engine 30s already do).
  A package that drops the spread silently reverts to 5s.
- Added `packages/content-codemod/vitest.config.ts` — the one workspace package
  without its own config, and the suite `verify-codemod-determinism` runs. It now
  spreads the baseline, so its `determinism`/`publish` tests inherit the 15s timeout
  instead of the 5s default that flaked under concurrent gate load.
- Removed the now-redundant `testTimeout: 15000` override in
  `apps/compiler-cli/vitest.config.ts`: the baseline supplies the same headroom, so
  the timeout is one knob again.
- New gate `scripts/verify-vitest-config-parity.mjs` (pure `checkConfigParity` /
  `checkBaseline` + embedded `--self-test` fixtures) discovers every `packages/*`
  and `apps/*` package and fails closed, naming the package, when its `vitest.config.*`
  is absent or does not inherit the baseline. Inheritance is proven by a real named
  import from `scripts/vitest-shared.mjs` *and* a `...sharedTestConfig` spread — a
  hand-rolled config, or one that only names the baseline in a comment, fails. The
  gate also fails when the baseline itself loses `testTimeout` (or drops it to/below
  Vitest's 5000ms default) or `fsModuleCache: true`. Wired as `gate:vitest-config`
  (+ `gate:vitest-config-self-test`) into `gates:preflight` (`vite.config.ts`).
- Fixture `scripts/test/verify-vitest-config-parity.test.mjs` (10 tests, under
  `pnpm test:scripts`) covers both required failure paths, the import-without-spread
  and comment-only false positives, and the baseline keys/floor; the embedded
  self-test (9 cases) and a manual end-to-end removal of the content-codemod config
  (gate exited 1 naming `@bluewave/content-codemod`, restored) prove the real paths.
- Validation: `node scripts/verify-vitest-config-parity.mjs --self-test` (9/9),
  `node --test scripts/test/verify-vitest-config-parity.test.mjs` (10/10),
  `pnpm test:scripts` (193/193), `node scripts/verify-codemod-determinism.mjs`
  (both processes byte-identical), content-codemod suite (30/30),
  `pnpm typecheck`, full `pnpm test:run` (2022 passed, 1 pre-existing perf skip),
  `vp fmt --check` + `vp lint` on the changed files, `pnpm lint:effect`
  (0 errors), `pnpm preflight` (green, 40 tasks).
