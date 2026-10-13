# Tagged-error conformance: close the residual gaps (G1–G6)

**Type:** task
**Status:** resolved
**Blocked by:** 12

## Question

Ticket 12 widened the `assert-tagged-errors` gate and moved three test capture
helpers to `_tag`, but residuals remained: the test `instanceof` backlog (G1), the
`diagnostics` vs reachability contradiction (G2), ADR-0152 §1 wording vs the app
roots (G3), the gate's `extends Error` blind spots (G4), and no regression test for
the serialization hazard (G5). Close them, or record an explicit exception.

## Answer

Resolved. One commit; no behaviour change (messages/codes/control flow identical).

- **G1 — migrated, not exempted (option a).** All remaining `instanceof
  BluewaveError` / `expect(...).toBeInstanceOf(BluewaveError)` sites across
  `packages/campaign/test` and `packages/combat/test` (30 files) now use
  `isBluewaveError` from `@bluewave/contracts`; the four `Data.TaggedError`
  `toBeInstanceOf` sites (`events`, `commands`, `phase-engine`, `air-combat`)
  drop the redundant class check and keep their existing `expect(..._tag)...`
  assertion. The **one** sanctioned class-based test form is the
  `toThrow(ErrorClass)`/`toThrowError(ErrorClass)` matcher argument; recorded in
  `RULES.md` §Errors and ADR-0152 §6 (matcher argument, not a call-site
  narrowing; production never relies on it). `toBeInstanceOf(Error)` (global)
  stays out of scope.
- **G2 — option (a): `diagnostics` is *not* renderer-reachable.** A static trace
  of the renderer's **value**-import closure reaches `campaign`,
  `campaign-engine`, `ship-design`, `contracts`, `armament`, `deterministic`,
  `random`, `content-schema`, `ship-visual`; `persistence`, `diagnostics` and
  `content-compiler` appear only through type-only imports (all-type re-exports
  and `import type`). So `DiagnosticError` stays a `Data.TaggedError` and
  `packages/diagnostics/src` stays in `engine`. ADR-0128 §Context now separates
  the value-reached packages from the type-only ones; ADR-0152 Context records
  the `diagnostics` case explicitly; the gate docstring matches.
- **G3 — ADR-0152 §1 tightened.** `Data.TaggedError` is the default in the
  non-reachable scope; an existing plain `readonly _tag` is equally conformant
  (`ContentArtifactError`, `ProjectFormatError` in `apps/desktop/src/main`).
- **G4 — gate extended.** `extendsError()` now also detects `globalThis.Error` /
  `global.Error` and imported `Error` aliases (`import { Error as E }`); a
  locally-declared non-import alias is documented as out of scope.
  Self-test fixtures added in `scripts/assert-tagged-errors.mjs` and
  `scripts/test/assert-tagged-errors.test.mjs`.
- **G5 — regression test added.** `packages/events/test/errors.test.ts` proves
  `JSON.stringify` preserves `_tag` (vendored `toJSON`) while `structuredClone`
  drops it, so a clone no longer matches `catchTag` — recover by `_tag` before
  serializing.
- **G6 — left open.** Tickets 13 (boundary-decode gate scope) and 11 (assemble
  the plan) are untouched; nothing here changes them.
