# Error-gate scope: cover apps/** and the remaining packages?

**Type:** task
**Status:** resolved
**Blocked by:** none

## Question

Surfaced by ticket 02 (F4/F6). `scripts/assert-tagged-errors.mjs` scans only packages
and misses live `RULES.md:64` violations: `ContentArtifactError`
(`apps/desktop/src/main/contentArtifact.ts:20`) has no `_tag` and is discriminated with
`instanceof` (`contentCommands.ts:25,43`, `index.ts:295`). The gate's `SCOPES` also
diverge from ADR-0152 (`campaign-engine` + the five `Data.TaggedError` packages
unscanned; `contracts` mis-scoped), and ADR-0152 is self-inconsistent on `persistence`
(§1 vs §5) with "renderer-reachable" undefined.

Decide: extend the gate to `apps/**` and align `SCOPES` with ADR-0152, or record the
exclusions explicitly. Decide the value-vs-type-import definition of
"renderer-reachable" that resolves F5, and fix ADR-0152 §1/§5 accordingly.

Deliver: a verdict + remedy (gate scope change and/or ADR/doc fix + the
`ContentArtifactError._tag` fix). Feeds ticket 11.

## Answer

Resolved. Verdict: **widen the gate and fix the code, don't record an exception.**
Applied the ticket 02 remedies F4/F5/F6.

- **Definition (resolves F5):** "renderer-reachable" means the renderer
  **value-imports** the package, directly or transitively; a type-only import is
  erased by the bundler and does not count. The renderer-reachable packages that
  carry renderer-facing error classes are `contracts`, `ship-design`, `campaign`,
  `campaign-engine`, `ship-visual` (ADR-0128 §Context records the wider error-free
  module graph). `persistence` and `phase-engine` are type-only imports, so
  neither is renderer-reachable — ADR-0152 §1 is correct and §5's
  "renderer-reachable" clause was the error. Recorded in ADR-0152 Context/§2/§5.
- **F4 fix:** `ContentArtifactError` gains `readonly _tag = "ContentArtifactError"`
  and a structural `static is(value)` guard
  (`apps/desktop/src/main/contentArtifact.ts`); the live `instanceof` sites move to
  `ContentArtifactError.is(...)` (`commands/contentCommands.ts:25,43`,
  `index.ts:295`; test helper in `contentArtifact.test.ts`).
- **F6 fix:** `SCOPES` in `scripts/assert-tagged-errors.mjs` now covers every
  first-party source root — all packages plus `apps/desktop/src/{main,preload,renderer,shared}`
  and `apps/compiler-cli/src` — split by value-reachability (`contracts` moves to
  `surface`; `campaign-engine` and `ship-visual` added; `persistence` moves to
  `engine`; the five `Data.TaggedError` packages now scanned). ADR-0152 §4 updated.
- **F2 fix:** the three package test helpers narrow on `_tag` via a local
  structural guard instead of `instanceof` (`ai`, `commands`, `phase-engine`
  `test/errors.test.ts`).

Gate green: `assert-tagged-errors --scope engine|surface` and `pnpm preflight`
(31/31). No code behaviour change; messages/codes identical.

Feeds ticket 11.
