# 01: Deterministic transition records + the authoritative-determinism gate

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** The command lifecycle's status-transition helper stamps the
ambient clock into the very record it hashes, so the same command inputs can hash
differently across runs — the one surviving wall-clock read inside an authoritative
package. Make the transition record a pure function of an explicit campaign-time
input (the value every call site already has in scope), so replay and save/load
reproduce the same hashes. Then freeze the rule: a new fail-closed preflight gate
rejects ambient wall-clock, randomness, environment, and filesystem reads in the
runtime-free/authoritative roots, carrying a small, justified allowlist for the
IO-boundary timestamps and injectable clocks the codebase already accepts
(persistence save metadata, desktop crash/support and drawing-board clocks,
`node:fs` in the IO-boundary packages). This ticket establishes the gate +
allowlist pattern the later rule tickets reuse, and owns the gate-set ADR that
extends ADR-0106.

## Acceptance criteria

- [ ] The transition record is a pure function of its explicit inputs; no
      `new Date()` / `Date.now()` remains on the authoritative path.
- [ ] The desktop construction workspace and the phase-engine full-lifecycle
      records are byte-identical to before (goldens green, hashes unchanged).
- [ ] A new `assert-authoritative-determinism` gate fails on `Date.now()`,
      `new Date()`, `Math.random()`, `randomUUID()`, `process.env`, and ambient
      filesystem reads in the authoritative/runtime-free roots (non-test source),
      and passes on the real tree.
- [ ] The gate ships a bad-fixture / good-fixture pair under `scripts/test/`,
      is registered in `run-gates.mjs`, and is invoked by CI
      (`verify-check-parity` stays green).
- [ ] Every allowlist entry carries a one-line justification; the gate-set ADR
      extends ADR-0106 (ratchet gates).

## Notes

- Prefer promoting the existing `@effect/tsgo` determinism advisories to a hard
  scoped gate over hand-rolling a second AST scanner if that keeps the rule
  single-sourced.
- The gate must scope to the runtime-free/authoritative roots; IO-boundary and
  test files are out of scope by construction.

## Comments

Implemented and validated (2026-10-13); changes present in the working tree,
not yet committed. The `@effect/tsgo` advisories stay warn-level repository-wide;
the enforcement is the new scoped gate, per the ADR.

- Fix: `packages/commands/src/lifecycle.ts` — `transitionRecord` takes an
  explicit `timestamp` argument (no ambient clock); its test caller passes a
  fixed value. Goldens byte-identical.
- Gate: `scripts/assert-authoritative-determinism.mjs` (AST scan over the
  `packages/**` runtime-free roots; allowlist ratchet
  `scripts/authoritative-determinism.baseline.json`, empty at adoption) plus
  fixtures `scripts/test/assert-authoritative-determinism.test.mjs`.
- Wiring: `scripts/run-gates.mjs` (self-test → gate), `package.json`
  `check:authoritative-determinism`, ADR-0150 (extends ADR-0106; indexed).
- Validation: `pnpm preflight` 19/19 · `pnpm test:scripts` 114/114 ·
  `pnpm format` clean · `pnpm lint` 0/0 · `pnpm --filter @bluewave/commands
  exec tsc -b --force` clean · `pnpm --filter @bluewave/commands exec vp test
  run` 43/43 · `node scripts/verify-golden-hashes.cjs` 10/10 · commands `src`
  now yields 0 `@effect/tsgo` diagnostics.
