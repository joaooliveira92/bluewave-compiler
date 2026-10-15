# 07: Adopt `@effect/vitest` and shared test Layers

**What to build:** the runtime programs are tested with the vendored `@effect/vitest` harness and
shared in-memory test Layers, instead of each test hand-rolling `ManagedRuntime.make(...)` plus
`runPromiseExit` plus `projectCommandExit`. Deterministic runtime tests get a controlled clock, and the
duplicated per-file harnesses disappear. ADR-0100 §1's "vendored but unused" note is amended.

**Blocked by:** 01 — Land the Effect runtime migration on `dev`

**Status:** ready-for-agent

- [ ] `@effect/vitest` is declared for the app workspace and resolves to the vendored tree; the
      single-effect guard stays green.
- [ ] `it.effect`/`it.live` cover the runtime programs with a controlled clock; the harness rule
      (which harness for which test) is recorded.
- [ ] Shared test Layers exist for the in-memory stores and the fake native dialog/paths, and the
      desktop command tests use them instead of their own runtime harnesses.
- [ ] ADR-0100 §1 records the adoption; the full check stays green.
