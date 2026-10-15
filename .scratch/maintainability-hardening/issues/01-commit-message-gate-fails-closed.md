# 01: Fail-closed commit-message gate

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** The commit-message check must not silently pass in CI when it
cannot resolve the range it was asked to scan. In CI an unresolvable range
becomes a hard failure naming the range; from the local `commit-msg` hook (single
message file) behaviour is unchanged, so a developer is never blocked by a
missing range.

- [x] With an unresolvable range and the CI indicator set, the check exits
  non-zero and says the range was unavailable (no silent green).
- [x] `--message-file` mode validates the single subject and needs no range.
- [x] A fixture covers both the CI-fails-closed and hook-allows branches and runs
  under `pnpm test:scripts`.
- [x] This change keeps every preflight gate it touches green; the unrelated,
  pre-existing preflight red is documented in Comments.

## Comments

- `scripts/check-commit-msgs.cjs` now mirrors the other gates' `isStrictEnvironment`
  (`env.CI`): an unresolvable range exits 1 naming the range in CI, and skips
  locally so the `commit-msg` hook is never blocked. `--message-file` is unchanged.
- `commit-convention.yml` computes `COMMIT_RANGE` in a shell step so a push whose
  `before` is the all-zero SHA (first push of a branch) leaves the range unset
  instead of failing closed on a bogus `0000…0..sha` range.
- New fixture `scripts/test/check-commit-msgs.test.mjs` spawns the script for six
  branches: CI fail-closed, local skip, `CI=false` skip, a resolvable range still
  green, and both `--message-file` paths.
- Validation: `node --test scripts/test/check-commit-msgs.test.mjs` (6/6),
  `pnpm test:scripts` (179/179), `vp fmt --check` + `vp lint` on the changed files.
- Code review (Standards + Spec, parallel sub-agents): PASS / APPROVE; the only
  actionable findings were the workflow zero-SHA guard (fixed) and a comment
  wording fix (fixed). `isStrictEnvironment` is a third copy of a byte-identical
  helper (noted; a shared `scripts/lib/` module is a follow-up, out of scope).
- `pnpm preflight` is red at HEAD for reasons unrelated to this ticket: the recent
  merge `b47c8dab` left a duplicate `ADR-0161` number (derive-first vs consolidate
  task-runner) so `docs-check` reports `docs/adr/README.md` stale, and a
  machine-load timeout/OOM surfaced in `verify-codemod-determinism` (SIGKILL 137).
  Both reproduce without this change.

