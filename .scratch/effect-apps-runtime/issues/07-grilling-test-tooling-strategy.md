# 07: Test and tooling strategy for the runtime surfaces

**Type:** grilling
**Status:** resolved
**Blocked by:** 03

## Question

How do tests exercise the new runtime programs, and does `@effect/vitest` enter
the toolchain?

- Decide whether to adopt `@effect/vitest@4.0.2` (vendored, currently unused) for
  the app-runtime tests — it shares the installed `vitest`, so it can run
  alongside `vite-plus/test`. If yes, amend ADR-0100 §1 ("vendored and unused")
  and declare `@effect/vitest: workspace:*`.
- Reconcile with RULES.md "tests run on `vite-plus/test`": state the rule that
  keeps both harnesses coherent (e.g. `it.effect` only for runtime programs,
  `it.effect`/TestClock for determinism, `vite-plus/test` elsewhere).
- Decide how the **Layer graph** is exercised: `Layer` test doubles vs the
  existing `*Deps` fakes; how the one `ManagedRuntime` is provided in tests; how
  the `ipcMain`/Electron boundary is faked.
- Decide the **determinism test posture**: TestClock in unit tests; goldens +
  cross-process determinism stay the authority for authoritative paths.
- Decide the **gate/test wiring**: any new test root must be covered by
  `verify-test-focus`/`assert-runtime-free` scopes as appropriate.

Deliverable: the test/tooling decision + any ADR amendment + the harness rule,
carried into the spec.

## Answer

Resolved autonomously 2026-10-14.

**Adopt `@effect/vitest@4.0.2` for the app-runtime tests.** It is vendored at
`vendor/effect-vitest` and shares the installed `vitest@5.0.3`, so it runs
alongside `vite-plus/test`. This amends ADR-0100 §1 ("vendored and unused") and
adds `"@effect/vitest": "workspace:*"` to the app workspace packages (desktop,
compiler-cli).

**Harness rule (recorded).** `it.effect` for Effect programs (provides TestClock
and a deterministic runtime), `it.live` for the real-runtime IO-boundary tests
(native dialogs, ManagedRuntime disposal); `vite-plus/test`'s `it`/`test`
everywhere else (engine, pure packages, pure helpers). Keeps both harnesses
coherent and satisfies RULES.md §Tests.

**Layer testing.** Provide test Layers (in-memory `ProjectStore`, fake
`NativeDialog`, fake `AppPaths`, `TestClock`) via `Layer`; the existing `*Deps`
fakes stay until their service is migrated (per slice). The production
`ManagedRuntime` is never constructed in unit tests — `it.effect` owns the
runtime, or a per-suite runtime is disposed in `afterAll`.

**Determinism.** Unit tests use TestClock; goldens + `check:determinism`
(cross-process) remain the authority for authoritative paths.

**Gate wiring.** App tests stay under the existing roots (`verify-test-focus`
unaffected); `assert-runtime-free` no longer scans main once 08 lands.