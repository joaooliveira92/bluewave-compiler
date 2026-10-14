# 02: Tagged `BluewaveError` family (engine scope)

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** `@bluewave/contracts` exports a plain `BluewaveError` with no
`_tag`, and its consumers tell one failure from another with `instanceof` — the
rule RULES.md forbids. Give the error a stable `_tag` discriminator and replace
every production `instanceof BluewaveError` discrimination with a `_tag` check
(combat damage pipeline, phase-engine battle phases, compiler-cli combat
diagnostics). Because `contracts` is reachable from the renderer, keep the class
plain TypeScript with a `readonly _tag` field — do **not** introduce an `effect`
import, which would risk bundling the runtime into the renderer
(`MIG-EXCL-1`). Behaviour is otherwise identical; the `context.code` vocabulary is
unchanged. Ship a scoped `assert-tagged-errors-engine` gate so a new untagged
error in these packages cannot land.

## Acceptance criteria

- [ ] `BluewaveError` exposes a stable `_tag`; its `context` fields and code
      vocabulary are unchanged.
- [ ] No production site discriminates with `instanceof BluewaveError`; all use
      `_tag`.
- [ ] A new `assert-tagged-errors-engine` gate over `{contracts, combat,
      armament}` fails on a fixture with a new `class extends Error` lacking
      `_tag` and passes on the real tree.
- [ ] The gate ships a bad-fixture / good-fixture pair, is registered in
      `run-gates.mjs`, and is invoked by CI (`verify-check-parity` green).
- [ ] Combat, phase-engine, and compiler-cli tests stay green; goldens unchanged.

## Notes

- The class stays in-process and plain; this is a `_tag` discriminator, not an
  Effect error-channel migration (ADR-0128 §1).
- Cross-reference the errors-by-reachability ADR owned by ticket 03.
