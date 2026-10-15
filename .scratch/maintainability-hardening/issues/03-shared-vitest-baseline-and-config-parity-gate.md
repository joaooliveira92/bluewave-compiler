# 03: Shared Vitest baseline + config-parity gate

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** Every workspace package runs Vitest with one explicit,
load-tolerant baseline — a deliberate test timeout and the shared on-disk module
cache — and a gate fails when any package's config is missing or stops inheriting
that baseline. The one package currently without its own test config gains it, so
the suite that flaked by exceeding the default timeout under load passes reliably.

- [ ] The shared baseline sets an explicit `testTimeout` and enables the shared
  module cache.
- [ ] Every `packages/*` and `apps/*` test config imports the shared baseline.
- [ ] The previously load-flaky suite passes reliably.
- [ ] A gate fails (naming the package) when a package config is absent or stops
  importing the baseline; a fixture proves both paths.
- [ ] `pnpm preflight` stays green.
