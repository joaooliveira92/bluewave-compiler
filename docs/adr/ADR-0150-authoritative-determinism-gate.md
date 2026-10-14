# ADR-0150: The authoritative-determinism ratchet gate

## Status

Accepted (2026-10-13). Extends [ADR-0106](ADR-0106-documentation-and-type-safety-ratchet-gates.md)
(the ratchet-gate family) and [ADR-0107](ADR-0107-verification-hardening.md)
(where the gate runs); informs [RULES.md](../../RULES.md) "Determinism".

## Context

Bluewave's core promise is reproducibility: identical content, ruleset, inputs,
commands, seeds, and compatibility versions must produce identical authoritative
hashes across supported operating systems (`README.md`; the ENGINEERING-CONTRACT
"Determinism" section). The pure engine packages therefore must not read ambient
wall-clock time, randomness, process environment, or enumerate the filesystem.

The `@effect/tsgo` integration already *detects* these (`globalRandom`,
`globalDate`, `cryptoRandomUUID`, `processEnv`, `nodeBuiltinImport`) but reports
them as **warnings**, so `pnpm lint:effect` exits 0 and a new ambient read can land
without failing CI. A quality that can only decay, with nothing to stop it, is
exactly the class ADR-0106 freezes with a ratchet gate.

The audit behind [the RULES.md compliance spec](../../.scratch/archive/rules-compliance/spec.md)
found the decay had already happened once: the command lifecycle's
`transitionRecord` helper stamped `new Date().toISOString()` into a record it then
hashed. Every real consumer worked around it, so it stayed safe only by
convention.

## Decision

1. **`scripts/assert-authoritative-determinism.mjs` is a `pnpm preflight` gate.**
   It walks the authored AST (via the already-present `oxc-parser`, per ADR-0106
   §2) over the `packages/**` entries of `assert-runtime-free.mjs`'s
   `RUNTIME_FREE_ROOTS` — the pure engine. `apps/desktop/src/main` (an app entry
   point and synchronous `node:fs` pipeline, ADR-0128) and the IO-boundary
   packages are out of scope by construction; tests are excluded.
2. **Detection is narrow and true to the rule.** The gate rejects `Date.now()`,
   the ambient zero-argument `new Date()`, `Math.random()`, `randomUUID()` /
   `crypto.randomUUID()`, `process.env`, and filesystem *enumeration*
   (`readdir`/`readdirSync`/`opendir`/`opendirSync`, identifier or member form).
   An explicit `new Date(ms)` value conversion and an explicit-path
   `readFileSync` are deterministic and **allowed**.
3. **The inventory is a ratchet.** New occurrences are rejected; a reviewed
   allowlist (`scripts/authoritative-determinism.baseline.json`) keyed by file +
   content fingerprint may only shrink. `--write` reseeds it; `--self-test` runs
   the embedded fixtures. The list is empty at adoption: the rule is enforced with
   no exemptions.
4. **The triggering instance is fixed, not exempted.** `transitionRecord` takes
   its `timestamp` as an explicit argument instead of reading the ambient clock;
   its only caller (a test) passes a fixed value, and the authoritative paths
   (desktop construction, phase-engine full lifecycle) already build
   timestamp-free records. Goldens are byte-identical.
5. **The gate runs in the ADR-0107 gate runner** as `determinism-self-test` →
   `determinism-gate`, alongside the runtime-free guard, and is exercised
   cross-OS by `gates.yml` (`pnpm preflight`) and by `scripts/test/` fixtures via
   `pnpm test:scripts`.

## Consequences

- A new ambient clock, randomness, env read, or directory enumeration in a pure
  engine package fails preflight with the offending file, line, and kind.
- The gate deliberately overlaps the `@effect/tsgo` advisories but is *scoped and
  hard*, where the advisories are repository-wide and soft; the linter remains the
  broad detector, the gate the authoritative enforcement.
- The `packages/commands` transition helper is now a pure function; no golden or
  hash changes, so the guarantee is preserved without a compatibility break.
- Preflight cost rises by a sub-second AST scan.
- The allowlist is an ordinary tracked file: visible in review and owned by the
  repository, matching ADR-0106's ratchet-baseline pattern.

## Alternatives considered

- **Promote the `@effect/tsgo` advisories to errors repository-wide.** Rejected:
  it would flag the legitimate IO-boundary and app-entry-point clocks (persistence
  save metadata, desktop crash/support and drawing-board injectable clocks), and
  couples preflight to the install-time tsgo patch. A scoped gate with an explicit
  allowlist states the boundary instead of blurring it.
- **Reject every `new Date(...)` and every `node:fs` import.** Rejected: explicit
  argument/value conversions and explicit-path reads are deterministic; a gate
  that cries wolf gets disabled.
- **Leave it to review.** Rejected: the promise is machine-checkable, and a
  warning that does not fail CI already failed to catch the one real instance.
