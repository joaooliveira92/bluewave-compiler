# INC-7 — Adopt `@effect/vitest` and add test Layers

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** no

**What to build:** Adopt the vendored `@effect/vitest` for the app-runtime tests and
provide the service graph as test Layers, so runtime programs are tested with a
controlled clock and in-memory IO.

## Acceptance criteria

- [ ] `@effect/vitest@4.0.2` is declared (`"workspace:*"`) in the app packages and
      resolves to `vendor/effect-vitest`; the `assert-single-effect` guard stays green
      (ERA-R14).
- [ ] The harness rule is recorded (RULES.md §Tests and/or the runtime-free-gate/effect
      docs): `it.effect` for Effect programs (TestClock), `it.live` for the real-runtime
      IO-boundary tests, `vite-plus/test` elsewhere.
- [ ] Test Layers exist for at least in-memory `ProjectStore`, fake `NativeDialog`, and
      fake `AppPaths`; the service graph is exercised through them (ERA-R15).
- [ ] ADR-0100 §1 is amended from "vendored and unused" to record the adoption.
- [ ] `pnpm preflight`, `pnpm test:scripts` and the app test suites are green.

## Notes for implementator

- `@effect/vitest` shares the installed `vitest@5.0.3`; no second vitest copy
  (verify against `scripts/assert-single-effect.mjs`).
- The production `ManagedRuntime` is never constructed in unit tests — `it.effect`
  owns the runtime, or a per-suite runtime is disposed in `afterAll`.
- Amend ADR-0100 via a short `## Status`/amendment note rather than a new overlapping
  ADR unless the change is larger than the "unused" → "used" flip.
