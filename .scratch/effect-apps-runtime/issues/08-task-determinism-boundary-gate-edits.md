# 08: Determinism, boundary preservation, and the gate/doc edits

**Type:** task
**Status:** resolved
**Blocked by:** 04, 05, 06, 07

## Question

What exactly must stay true when the app surfaces move to the runtime, and what
gate/doc edits land with the code?

Assemble the invariants and the edit list (executed in the implementation, not
here):

- **Renderer/preload stay Effect-free** (`MIG-EXCL-1`): confirm no Effect value or
  type can reach `apps/desktop/src/{renderer,preload}` or any package they
  value-import; `scripts/check-renderer-bundle.mjs` and the renderer
  content-boundary test are the guards and must stay green.
- **Authoritative determinism is untouched**: goldens, `check:golden`,
  `check:determinism` (cross-process), and `check:equivalence` stay byte-identical
  — the app shells were never on a hashed path. Confirm Clock/Random/fiber
  scheduling/log timestamps cannot reach a hashed path, and that the hard
  determinism gate stays scoped to `packages/**` (ADR-0150).
- **Gate edits** (with the code): `scripts/assert-runtime-free.mjs`
  `RUNTIME_FREE_ROOTS` drops `apps/desktop/src/main`; reconcile its top comment,
  embedded `FIXTURES`, and `scripts/test/assert-runtime-free.test.mjs`;
  `scripts/verify-check-parity.mjs` stays green.
- **Doc edits**: `RULES.md` §Effect names the two app surfaces;
  `docs/agents/runtime-free-gate.md` drops main and cites ADR-0159.
- **Single-copy guard**: `scripts/assert-single-effect.mjs` stays green (no new
  `effect` copy; `@effect/vitest` if adopted resolves to the vendored tree).

Deliverable: the invariant list + exact edit list, carried into the spec's
definition of done.

## Answer

Resolved autonomously 2026-10-14. Invariants + exact edit list (executed with the
code, not here).

**Invariants (fail closed).**
- Renderer/preload Effect-free (`MIG-EXCL-1`): no Effect value/type reaches
  `apps/desktop/src/{renderer,preload}` or any value-imported package;
  `scripts/check-renderer-bundle.mjs` + the renderer content-boundary test green.
- Authoritative hashes unchanged: `check:golden`, `check:determinism`,
  `check:equivalence` byte-identical; Clock/Random/fiber-scheduling/log timestamps
  never reach a hashed path; the hard determinism gate stays scoped to
  `packages/**` (ADR-0150).
- Single `effect` copy: `scripts/assert-single-effect.mjs` green (any adopted
  `@effect/vitest` resolves to `vendor/effect-vitest`).

**Edit list (implementation).**
- `scripts/assert-runtime-free.mjs`: remove `"apps/desktop/src/main"` from
  `RUNTIME_FREE_ROOTS` (line 37); update the file-top comment; reconcile the
  embedded `FIXTURES` and `scripts/test/assert-runtime-free.test.mjs`.
- `scripts/verify-check-parity.mjs`: stays green (no new gate).
- `RULES.md` §Effect (lines ~54–58): name the two app surfaces as runtime-permitted.
- `docs/agents/runtime-free-gate.md`: drop main from "Guarded roots"; cite ADR-0159.
- ADR artifacts already landed by ticket 03 (ADR-0159; ADR-0128 superseded;
  `scripts/adr-index.cjs`; regenerated `docs/adr/README.md`).

**Definition of done:** `pnpm preflight`, `pnpm test:scripts`, `pnpm check` green
on the exact commit; goldens byte-identical; renderer bundle clean; the service
graph built once and disposed.