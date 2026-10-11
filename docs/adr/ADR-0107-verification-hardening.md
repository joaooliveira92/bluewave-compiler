# ADR-0107: Verification hardening — local hooks, a gate runner, and a dependency policy

## Status

Accepted (2026-10-11). Closes D-6 (bounded gate runner); D-4 and D-5 remain open.

## Context

A production-readiness review of how `scripts/`, `package.json`, and the agent
workflow fit together found five gaps:

- **No local enforcement.** `core.hooksPath` was unset, so the gates ran only in
  CI, after the fact; an agent could commit and push unverified.
- **Linux-only gates.** The gates and their fixtures ran only in `quality.yml`
  (ubuntu), while the app ships for macOS and Windows.
- **A flat check chain.** `pnpm preflight` was a `&&` chain with no dependency
  graph, no concurrency bound, and no per-gate timeout.
- **A tree-coupled ratchet.** `verify-no-unknown-casts.mjs` failed on retired
  baseline entries, so a concurrent editor removing casts made another agent's
  preflight flap between "stale" and "new".
- **Prose-only guidance.** `.ai/ENGINEERING-CONTRACT.md` demanded "exact
  validation commands and results" but never enumerated them.

## Decision

1. **Dependency-free git hooks.** `.githooks/{pre-commit,commit-msg,pre-push}`
   run the fast gates, and `scripts/install-hooks.mjs` points Git at them via
   `core.hooksPath`, wired through the `prepare` lifecycle (and `pnpm
   hooks:install`). This is deliberately dependency-free, consistent with
   ADR-0099's rejection of hook-tooling packages. `commit-msg` uses the new
   `--message-file` mode of `check-commit-msgs.cjs`; bypass with `--no-verify`.
2. **A bounded gate runner.** `scripts/run-gates.mjs` schedules the preflight set
   with a concurrency bound (`BLUEWAVE_GATE_CONCURRENCY`), `needs` edges that skip
   dependents of a failed gate, a per-gate timeout (`BLUEWAVE_GATE_TIMEOUT_MS`),
   optional fail-fast, and buffered output. `pnpm preflight` now runs through it.
   (Closes D-6.)
3. **A dependency-policy gate.** `scripts/verify-package-dependencies.mjs`
   forbids floating specifiers (`*`/`latest`/`next`/`x`), requires
   `effect`/`@effect/vitest` to be `workspace:*`, requires internal `@bluewave/*`
   deps to use the `workspace:` protocol, and requires the pinned toolchain
   (`@effect/tsgo`, `oxlint`, `oxlint-tsgolint`, `typescript`, `oxc-parser`) to be
   exact — reinforcing the single-copy invariant where dependencies are declared,
   not only where they resolve.
4. **Ratchet semantics.** `verify-no-unknown-casts.mjs` treats retired (stale)
   baseline entries as fatal in CI and a warning locally (`--strict` opts in), so
   a concurrent editor's removals cannot block an unrelated commit while CI keeps
   the baseline exact against the committed tree.
5. **Cross-OS gates.** `gates.yml` runs `preflight` and `test:scripts` on Windows
   and macOS (ubuntu is covered by `quality.yml`); `test:scripts` uses Node's own
   glob so it is shell-independent.
6. **Definition of done.** `.ai/ENGINEERING-CONTRACT.md` enumerates the exact
   commands and the machine-checked gates, so "run the validation" is concrete.

## Consequences

- A commit and a push now run the fast gates locally; CI remains the authority
  and re-runs everything on every OS.
- A hung gate fails on timeout instead of hanging CI; independent gates run
  concurrently within a bound.
- The ratchet no longer flaps under concurrent edits, and CI still keeps it exact.
- Gate and fixture regressions on Windows/macOS are caught before release.
- `prepare` runs the installer on every install; it is a fast no-op when the
  hooks are already installed.

## Alternatives considered

- **lefthook / husky.** Rejected (ADR-0099): a committed hook directory plus
  `core.hooksPath` needs no dependency and no lockfile churn.
- **Port the harness's ~1600-line gate runner.** Rejected: the preflight set is
  seven gates; a focused, tested scheduler covers it and stays reviewable.
- **Make stale entries fatal everywhere.** Rejected: a shared, multi-agent tree
  makes that a false-positive factory; CI is strict instead.
