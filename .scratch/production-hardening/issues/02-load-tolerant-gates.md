# 02: Make the gate suite load-tolerant

**What to build:** `pnpm check` no longer fails on host contention. Today two suites time out at a
fixed 5s per test when the machine is loaded (the content-codemod property/permutation determinism
test and one Electron e2e), which makes CI an unreliable signal. The fast and heavy tiers are
separated, test concurrency is bounded, the slow property/e2e suites carry an appropriate timeout, and
a transient e2e failure is retried once.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The content-codemod determinism/permutation suite and the e2e suite pass repeatedly while the
      host is under induced load (e.g. a parallel build), and never fail purely on a per-test timeout.
- [ ] The fast tier (unit/package tests) and the heavy tier (e2e) are distinct, so one is not starved
      by the other.
- [ ] A documented, bounded test-concurrency setting exists and is honoured by CI.
- [ ] The change does not mask a genuine slow regression: a test that legitimately exceeds its budget
      still fails with a clear message.
