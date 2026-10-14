# ADR-0151: The RULES.md compliance ratchet gates

## Status

Accepted (2026-10-13). Extends
[ADR-0106](ADR-0106-documentation-and-type-safety-ratchet-gates.md) (the
ratchet-gate family), follows
[ADR-0150](ADR-0150-authoritative-determinism-gate.md) (the determinism gate),
runs under [ADR-0107](ADR-0107-verification-hardening.md) (the gate runner), and
executes [ADR-0004](archive/ADR-0004-compiler-stages.md) (stages do no ambient I/O),
ADR-0105 (strict boundary decode) and [RULES.md](../../RULES.md).

## Context

`RULES.md` distils the binding authorities into rules every change must satisfy.
The audit behind [the compliance spec](../../.scratch/archive/rules-compliance/spec.md)
found that the machine-checked rules held, but six rules were only *partly*
obeyed and most were **not machine-checked at all**: an untagged-error family, a
cast-trusted boundary, an ambient filesystem read inside a compiler stage, a raw
`JSON.stringify` on an authoritative record, and an unexamined `console.*`
allowance. A rule that lives only in prose is one an agent can drift from; the
audit showed the decay had already happened (a wall-clock read on a hashed
record — the one instance ADR-0150 fixed).

ADR-0106 established that qualities which would otherwise only decay are frozen
as fail-closed `pnpm preflight` gates with `scripts/test/` fixtures. This ADR
extends that family to the remaining `RULES.md` rules.

## Decision

1. **Five new scoped gates, each fail-closed with a bad/good fixture pair.**
   They are registered in `scripts/run-gates.mjs` (self-test → gate) and mirrored
   in CI through `pnpm preflight`, kept honest by `verify-check-parity.mjs`:
   - `scripts/assert-tagged-errors.mjs --scope engine|surface` — fails on a
     `class … extends Error` with no `_tag` in the in-process error roots
     (engine: `contracts`, `combat`, `armament`; surface: `ship-design`,
     `campaign`, `persistence`); the reviewed allowlist is inline and justified.
    - `scripts/assert-boundary-decode.mjs --scope compiler|desktop|cli` — fails
      on a `JSON.parse(...) as T` boundary cast in the content loader
      (`packages/content-compiler/src`), the desktop main loaders
      (`apps/desktop/src/main`), or the `bwc` entry point
      (`apps/compiler-cli/src`); a parse into an `unknown` binding that is then
      schema-decoded is the required shape. The `cli` sites that have an honest
      schema are decoded — campaign state via `StorableCampaignStateSchema`, the
      command ledger, the final hash and the placeholder allowlist — and the
      remainder are a reviewed, justified inline allowlist (§2): the
      `CommandEnvelope<CommandBody>` reads (no `CommandBody` schema exists
      anywhere) and the two hand-authored debug fixtures whose malformed
      contents the engine rejects downstream. The scope still ratchets, and a
      new cast in `compiler-cli` fails closed.
   - `scripts/assert-no-stage-io.mjs` — fails on any `node:fs` /
     `node:child_process` import under `packages/content-compiler/src/stages`,
     executing ADR-0004.
   - `scripts/assert-canonical-serialization.mjs` — fails on raw
     `JSON.stringify` in the authoritative serialization roots (`campaign`,
     `campaign-engine`, `commands`, `events`, `phase-engine`), with the canonical
     serializer and a small justified allowlist exempt.
   - `scripts/assert-no-library-console.mjs` — fails on `console.*` in library
     modules (`packages/*/src`) and the runtime-free desktop app roots, with a
     reviewed per-site allowlist.
2. **Allowlists are visible and justified.** Each entry states, in one line, why
   the site is allowed; entries may only shrink, matching ADR-0106's ratchet
   baselines. The boundary-decode allowlist keys each entry by the
   whitespace-normalised cast source rather than ADR-0106 §1's hashed syntax
   fingerprint: the entries are few and a spelled-out cast keeps the exception
   legible in review, trading the hash's collision-proofing for that visibility.
   This is the one deliberate deviation from ADR-0106 §1; the gate still treats a
   rewritten cast as new and fails closed on a stale entry (an entry whose cast
   was removed) in CI.
3. **The compiler loader owns I/O; the stage does not.** `Compiler.compile`
   reads every source the first stage parses into an immutable name→text map and
   hands it to `ParseStage`; a caller may supply `fileContents` directly to drive
   the stage from memory. This executes ADR-0004 without changing its contract.
4. **The manifest is decoded, not cast.** `buildFullSurfaceInput` decodes
   `pack.json` with the existing closed `PackManifestSchema` (ADR-0105); a
   malformed manifest is a `MANIFEST` diagnostic naming the file, never a cast.
5. **Every fix is governance/structure.** Goldens, hashes and simulation
   outcomes are byte-identical; any golden that changes is a bug in the fix.

## Consequences

- A new untagged error, boundary cast, ambient stage import, non-canonical
  serializer, or unallowlisted console call in a guarded root fails preflight
  with the offending file and line.
- The tag-string, serializer-name and boundary-shape rules have one detection
  home each; the gates are independent and parallelizable.
- Preflight cost rises by a few sub-second AST scans.
- The allowlists are ordinary reviewed configuration; a deliberate exception is
  a one-line edit with a reason, not an unexamined drift.

## Alternatives considered

- **Fix the instances and stop.** Rejected: ADR-0106's whole point is that an
  unfrozen quality recurs; the audit found the first instance had already
  reappeared once as a workaround convention.
- **One broad repository-wide gate per rule.** Rejected: it would flag the
  legitimate IO-boundary/display/entry-point uses (persistence metadata clocks,
  human-readable dumps, app console boundaries), forcing a large allowlist and
  crying wolf. The scopes state the boundary instead of blurring it.
- **A single meta-gate.** Rejected: separate scoped gates fail with a clear
  message and a per-scope allowlist, and each fixture pair tests one rule.
