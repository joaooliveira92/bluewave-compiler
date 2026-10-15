# ADR-0164: Consolidate task orchestration on the Vite+ task runner

## Status

Accepted (2026-10-14). Supersedes decision 2 of ADR-0107 (the hand-rolled gate
scheduler); the hooks and dependency policy of ADR-0107 remain in force.

## Context

The repository adopted Vite+ (`vite-plus`, the `vp` CLI) as its unifying
toolchain: `vite.config.ts` owns `fmt` and `lint`, `vp fmt`/`vp lint` are the
formatting and lint entry points, and `vp test run` runs the suites. But task
orchestration was never migrated, leaving two task runners side by side:

- **Turborepo** ran `build`, `typecheck`, `test`, `dev`, and `clean`
  (`turbo run …`, `turbo.json`), while `vp run`/`vp test` ran tests.
- **A hand-rolled scheduler**, `scripts/run-gates.mjs`, reimplemented
  dependency-aware scheduling for `pnpm preflight`: a bounded worker pool,
  `needs` edges, per-gate timeouts, and fail-fast — the exact features `vp run`
  provides through `run.tasks`, `dependsOn`, and `--concurrency-limit`.

Two task runners, two caches, and a bespoke scheduler for a first-class Vite+
capability is drift: it duplicates maintenance, splits the mental model, and
means the Vite+ toolchain's headline feature (task caching) is paid for but
unused. `vp run` was validated in a worktree to reproduce both behaviours before
this change: `vp run -r build` builds all 25 workspace tasks in dependency
order, `dependsOn` both orders tasks and skips a dependent when a prerequisite
fails, and `run.cache.scripts` caches package scripts.

## Decision

1. **The `preflight` gate graph lives in `vite.config.ts`.** Every gate that
   `scripts/run-gates.mjs` scheduled is now a `run.tasks` entry (`gate:<id>`),
   with the scheduler's `needs` edges expressed as `dependsOn`. A
   `gates:preflight` aggregate depends on every terminal gate, so `pnpm
   preflight` runs one `vp run` DAG. Task caching is off (`run.cache.tasks:
   false`), so a gate always re-runs; concurrency is `VP_RUN_CONCURRENCY_LIMIT`
   (replacing `BLUEWAVE_GATE_CONCURRENCY`). `scripts/run-gates.mjs` and its
   scheduler test are deleted: `vp run` owns scheduling, ordering, skipping, and
   output.
2. **Turborepo is replaced by `vp run -r`.** `build`, `typecheck`, `test`,
   `dev`, `clean`, and `test:run` are workspace runs through `vp run` against
   each package's existing scripts; cross-package ordering comes from `vp run`'s
   dependency graph, and caching from `run.cache.scripts` with Vite Task's
   automatic data tracking. `turbo.json` and the `turbo` devDependency are
   removed.
3. **The composite `pnpm check` stays a `pnpm <step>` chain.**
   `verify-check-parity` requires every `pnpm check` step to be a literal
   `pnpm <step>` mirrored by CI, so `check` keeps its explicit steps rather than
   collapsing into `vp check`. `vp check` (format + lint + typecheck in one
   command) remains the intended human entry point, and stays documented as such.
4. **CI keeps `pnpm/action-setup` + `setup-node`.** `voidzero-dev/setup-vp` is
   the Vite+-native setup, but it installs a toolchain from the network and its
   GitHub Action must be pinned to an exact release; the current steps are
   equivalent, already cached, and pinned by the lockfile. The workflows' task
   invocations change from `turbo` to `vp run`; the setup steps are left as a
   deliberate follow-up rather than a same-change CI risk.

## Consequences

- One task runner and one cache. `vp run` orders tasks by the workspace package
  graph, skips dependents of a failed task, and replays unchanged work.
- `pnpm preflight` loses per-gate timeouts (Vite Task has none); a hung gate is
  now bounded by the CI job and the developer's patience rather than
  `BLUEWAVE_GATE_TIMEOUT_MS`. Gates are short, so this is accepted.
- `run.cache.scripts: true` caches build/test scripts through automatic data
  tracking, replacing `turbo.json`'s `inputs`/`outputs`. The turbo cache
  (`.turbo/`) is gone; Vite Task caches under `node_modules/.vite/task-cache`.
- Task and script names cannot overlap, so gate tasks are namespaced `gate:` and
  the aggregate is `gates:preflight`, leaving the public `pnpm preflight`
  script name intact.
- The gate list is now TypeScript data in `vite.config.ts`; a new gate is a task
  plus an aggregate edge, still fail-closed because `vp run` fails the run.

## Alternatives considered

- **Keep `run-gates.mjs` and also adopt `vp run` for build tasks.** Rejected:
  that is the two-runner status quo the change exists to remove.
- **Move only the gate graph, keep Turborepo.** Rejected: leaves the larger of
  the two task runners and its cache in place, half-migrated.
- **Collapse `check` into `vp check`.** Rejected: `vp check` is
  format+lint+typecheck only, cannot cover golden/heavy/E2E, and would break the
  `pnpm check`↔CI parity gate's `pnpm <step>` grammar.
- **Adopt `setup-vp` in the same change.** Rejected as CI risk: it needs a
  network-pinned release and rewrites every workflow's setup; the turbo→`vp run`
  command changes are the part that must land now.
