# Error-gate scope: cover apps/** and the remaining packages?

**Type:** task
**Status:** open
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

_(empty)_
