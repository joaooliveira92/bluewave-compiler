# 08: Unify the command error model and pin the `BridgeResult` contract

**What to build:** one documented rule decides when a command failure rides the Effect error channel
versus when it is an expected business value, and the IPC projection is the single place that
translates to the frozen `BridgeResult` envelope. A regression fixture pins the exact JSON for every
command's success and for each failure reason, so the wire contract cannot drift silently.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`; 07 — Adopt `@effect/vitest` and shared
test Layers

**Status:** ready-for-agent

- [ ] The error-vs-value rule is written down and applied consistently across the command programs.
- [ ] The `Exit → BridgeResult` projection is the only translation point; no command re-implements it.
- [ ] A fixture asserts the byte-identical `BridgeResult` JSON for every command's success and each
      declared failure reason.
- [ ] No channel collapses a typed failure into `unknown`, a generic `Error`, or an unchecked promise.
