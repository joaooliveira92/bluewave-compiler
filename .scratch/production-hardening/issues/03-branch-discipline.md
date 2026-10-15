# 03: Enforce branch discipline (no direct-to-`dev` commits)

**What to build:** the repository can no longer be put into an inconsistent state by two agents
committing in the same checkout on `dev`. A branch-protection rule requires a green status check and a
PR before `dev` moves; the agent convention document mandates a short-lived branch in a dedicated
worktree per session; and a local hook refuses a commit made directly on `dev`. This closes the class
of incident where one agent's `git add -A` swept another agent's uncommitted files into a commit and
left `dev` self-inconsistent.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `dev` requires a PR and a passing check before merge (branch protection configured).
- [ ] The agent convention document states: one worktree per session, never commit on `dev`, deliver
      via PR — and is referenced from the always-read rules.
- [ ] A local hook (or preflight gate) fails a commit attempted while `dev` is checked out.
- [ ] The convention explains why (link the recorded divergence/ADR) so it is not silently reverted.
