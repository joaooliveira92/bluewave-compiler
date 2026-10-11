# ADR-0099: Release verification gates and push discipline

## Status

Accepted (2026-10-10).

## Context

Four verification gaps surfaced while closing out ADR-0098:

- The packaged Electron smoke (`apps/desktop/scripts/packaged-smoke.mjs`) verifies
  what dev-mode E2E cannot — `file://` loading, the lazy coastline chunk, and the
  **production** CSP. It existed but was not wired into CI, so it had never run.
  When first run it failed on a Zod v4 eval-capability probe under the strict
  production CSP (`default-src 'self'`): a **false positive** (the probe is
  self-caught), but a real red gate.
- The P-1 balance reports (`docs/research/p1-tactical-benchmark.md`,
  `docs/research/p1-balance-sweep.md`) are **generated** by their tests under
  `BALANCE_BENCH_WRITE=1` / `BALANCE_SWEEP_WRITE=1`, but nothing asserted the
  committed copies matched, so they could silently go stale or be hand-edited.
- Commit subjects were not enforced; the ADR-0098 commit landed with a subject
  different from the one requested.
- A commit reached `origin/dev` ~29s after creation with **no** operator
  `git push` and **no** repository hooks configured (`core.hooksPath=/dev/null`).
  Unverified code can reach the shared remote.

## Decision

1. **The packaged smoke is a required gate.** `desktop-e2e.yml` builds the
   unpackaged app (`electron-builder --mac --dir --config electron-builder.yml`),
   compiles a campaign save (`snap --make-save`), and runs `smoke:packaged`. A
   change that ships a broken packaged artifact now fails CI.
2. **Reports are generated, never authored.** `scripts/check-balance-reports.cjs`
   re-runs both balance tests with the `*_WRITE=1` flags and fails if the tracked
   report files change. Wired into `quality.yml` and exposed as
   `pnpm check:balance-reports`, which is part of `pnpm check`.
3. **Commit subjects are Conventional Commits.** `scripts/check-commit-msgs.cjs`
   (dependency-free) validates every subject in the push/PR range;
   `commit-convention.yml` runs it.
4. **Nothing reaches the shared remote unverified.** The required checks are
   recorded in `docs/delivery/ci-gates.md` and enforced by branch protection. The
   release flow stays `dev` → `main` via PR (per `AGENTS.md`).
5. **The renderer configures Zod jitless under the strict CSP.**
   `apps/desktop/src/renderer/zodJitless.ts`, imported first in `main.tsx`, calls
   `z.config({ jitless: true })`. This is **not** a production behaviour change —
   the strict CSP already forced Zod's jitless path — it only removes the console
   error so the smoke is a true signal. The smoke's error check separates
   uncaught exceptions (always fatal) from a short, documented allowlist of
   self-caught probes.

## Consequences

- The release artifact is verified end-to-end, and the gates cannot silently rot.
- Balance reports are provably current.
- `pnpm check` now includes the balance-report guard.
- Gate enforcement in CI depends on repository settings (branch protection),
  which are a process obligation recorded in `docs/delivery/ci-gates.md`, not a
  committed file.

## Alternatives considered

- **Relax the smoke's "no renderer errors" check.** Rejected: it would hide real
  renderer faults. The failure was fixed at its source (Zod jitless) instead.
- **Add `commitlint` as a dependency.** Rejected: a dependency-free script covers
  the rule without lockfile churn.
- **Rely on a local git hook.** Rejected: hooks are not installed and cannot gate
  a remote push.
- **Require a pull request on `dev`.** Rejected: `AGENTS.md` lands work directly
  on `dev`; strict protection belongs on `main`, where the release merge happens.
