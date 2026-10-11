# ADR-0106: Documentation and type-safety ratchet gates

## Status

Accepted (2026-10-11). Three follow-ups are deferred: gating required checks on
`change-scope`, paying down the production `as unknown` inventory, and a
bounded-concurrency gate runner (D-4, D-5, D-6).

## Context

Three properties of this repository can only decay, never break loudly, so
nothing stopped the rot:

- **Type erasure at the boundary.** `as unknown` (and angle syntax, and
  `unknown` members of asserted unions) discards the type information the
  strict-`tsc` and Effect-schema work exists to preserve. There is no lint rule
  that freezes the current inventory while forbidding new assertions, so each one
  is invisible until it causes a downstream bug.
- **Markdown cross-links.** `docs-check` verified that a relative `.md` **target**
  exists but never that a `#fragment` names a real heading, so a renamed heading
  silently orphans every link onto it.
- **Doc bloat.** Standing process/standards docs grow without bound; nothing
  pushes back when a 300-word note becomes a 3000-word manual.

These gates were reviewed and adapted from the public `deepseek-harness`
repository's `scripts/` tree.

## Decision

1. **`scripts/verify-no-unknown-casts.mjs` is a `pnpm preflight` gate.** It walks
   the authored TypeScript/JavaScript AST and rejects any assertion to `unknown`
   not present in `scripts/no-unknown-casts.baseline.json`. The baseline is keyed
   by file + a syntax fingerprint of the asserted type, so the same assertion in
   two places counts twice and a rewrite is treated as new. The inventory is a
   ratchet: it may only fall (`--prune` retires removed entries); `--write`
   reseeds it. `as any` is intentionally out of scope.
2. **The gate uses `oxc-parser`** as an exact-pinned root devDependency. The
   repository's `typescript` is the native TS 7 compiler and exposes no JS
   compiler API, and `oxc-parser` is already the parser behind the Oxlint /
   `vite-plus` toolchain, so no new AST dialect enters the repo.
3. **`docs-check` validates Markdown anchors.** A `#fragment` onto a Markdown
   target (same-file `#anchor` included) must name a real GitHub heading slug or
   an explicit `<a id>`; fenced code is not scanned. Scheme-qualified,
   protocol-relative, and root-absolute targets stay excluded.
4. **`scripts/verify-doc-budgets.mjs` is a `pnpm preflight` gate** enforcing
   word ceilings from `scripts/doc-budgets.manifest.json`. Ceilings carry ~10%
   headroom, ratchet down as a doc shrinks, and rise only with a justification in
   the change that needs it. Rolling logs (`PROGRESS.md`, the sprint plan) and
   ledgers that grow by design are not budgeted.
5. **`scripts/change-scope.mjs`** prints a versioned JSON report of the paths a
   change touches (committed vs. base, plus staged/unstaged/untracked). It is a
   tool, not a gate, intended to feed change-based CI filtering from one
   deterministic source.

## Consequences

- New type-erasure at the `unknown` boundary fails preflight; existing debt is
  explicit and monotonically decreasing.
- Renaming a heading can no longer silently orphan anchors.
- `docs-check` prints an anchored-link count alongside its link total.
- Standing docs have a public ceiling; growth is a deliberate, reviewed act.
- Preflight cost rises by ~0.7s (AST scan) plus a negligible word count.
- The baseline and the ceilings are ordinary tracked files: visible in review,
  editable, and owned by the repository rather than by a tool.
- Each gate is covered by fixtures in `scripts/test/` (`pnpm test:scripts`),
  including the fail-closed parse path and the anchor-detection boundary.
- The gates run in the Linux `quality.yml` job. They are platform-independent
  and deliberately not duplicated across the `determinism.yml` OS matrix.

## Alternatives considered

- **A regex scan for `as unknown`.** Rejected: it false-positives in strings and
  comments and cannot see angle syntax or union members; a gate that cries wolf
  gets disabled.
- **Add `@babel/parser` / `typescript@5` for the compiler API.** Rejected: a new
  AST dialect (or a second TypeScript) when the Oxlint parser is already present.
- **Enforce a lint rule instead of a baseline.** Rejected: Oxlint cannot express
  "no *new* instances while grandfathering the current ones"; the ratchet needs
  the recorded inventory.
- **Budget every document.** Rejected: canonical content and rolling logs
  legitimately grow; only standing process/standards docs are budgeted.
