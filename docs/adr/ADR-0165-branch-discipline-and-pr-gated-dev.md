# ADR-0165: Branch discipline — a PR-gated `dev` and one worktree per session

## Status

Accepted (2026-10-15). Complements ADR-0107 (local verification hooks) and
ADR-0044 (the 2026-10-06 `origin/dev` divergence this prevents recurring).

## Context

`dev` is the integration branch every session commits to, and nothing stopped a
commit from landing directly on it. Two agents working in one `dev` checkout
produced the incident recorded in ADR-0044: one agent's `git add -A` swept the
other agent's uncommitted files into a commit, leaving `dev` self-inconsistent;
resolving it cost a whole merge-resolution session, and a later `git reset`
silently reverted uncommitted work (deletions included). The autonomous-agent
convention already prefers short-lived branches (AGENTS.md), and sessions
already run in dedicated worktrees (`bluewave-compiler-maintainability`,
`bluewave-effect-apps`, …), but neither was enforced: nothing refused a commit on
`dev`, and no server-side rule required a pull request or a passing check before
`dev` moved.

## Decision

1. **`dev` is protected.** Branch protection on `dev` requires a pull request
   before merging and requires the always-run CI checks to pass (`quality`,
   `gates` on both OSes, `determinism` on all three OSes, `commit-msgs`). Direct
   pushes to `dev` are refused for everyone, admins included. The
   path-filtered `desktop-e2e` check is deliberately not required (it does not
   run for PRs that touch no `apps/desktop` path, so requiring it would wedge
   those PRs); it still runs and reports where it applies.
2. **One worktree per session, never commit on `dev`, deliver via PR.** The
   agent convention (AGENTS.md, the always-read rules) mandates a short-lived
   branch in a dedicated worktree per session, and reaching `dev` only through a
   pull request.
3. **A local hook refuses a commit on `dev`/`main`.** `.githooks/pre-commit`
   runs `scripts/check-branch-discipline.mjs`, which fails closed on the current
   branch being `dev` or `main`. The escape hatch is the standard
   `git commit --no-verify`, for a genuinely exceptional local commit; CI and
   the branch protection remain the authority.

## Consequences

- The class of incident where two writers collide in one `dev` checkout is
  closed locally (the hook) and server-side (the protection): a stray `git add
  -A` can no longer land on `dev`, and uncommitted work lives on its own branch.
- A session now ends with a branch and a pull request rather than commits on
  `dev`; the human merges at the release boundary (AGENTS.md "Human validation").
- The check is a pure function of the branch name (`isProtectedBranch`), so it
  is cheap, deterministic, and unit-tested (`scripts/test/check-branch-discipline.test.mjs`).
  It is intentionally *not* part of `pnpm preflight`: CI runs preflight while
  checked out on `dev`, so a preflight gate would fail every CI run.
- `desktop-e2e` is not a required check; a desktop-touching PR still cannot merge
  on a red `desktop-e2e` because the merge is blocked until checks complete, but
  it is not *required* — an accepted, documented gap rather than a silent one.

## Alternatives considered

- **A `preflight` gate instead of a hook.** Rejected: CI checks out `dev` and
  runs `pnpm preflight`, so a branch gate there would turn every CI run red.
- **Require an approving review (≥1) on `dev`.** Rejected: it would stall the
  autonomous sessions on a human for every change, contradicting the
  "fully autonomous, human validation only at the release boundary" convention.
  A pull request with the required checks is the enforced gate; review stays a
  release-boundary activity.
- **`enforce_admins: false`.** Rejected: the only actors are admins (the owner
  and the agents), so exempting admins would leave the protection toothless.
