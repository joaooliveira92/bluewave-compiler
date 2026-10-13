# Boundary-decode gate scope: cover apps/compiler-cli?

**Type:** task
**Status:** open
**Blocked by:** none

## Question

Surfaced by ticket 03 (F3). `scripts/assert-boundary-decode.mjs` scopes only
`packages/content-compiler/src` + `apps/desktop/src/main`, but `apps/compiler-cli` is an
ADR-0100 §2 IO boundary that does `JSON.parse(...) as T` at
`apps/compiler-cli/src/main.ts:251` and `commands.ts:371,510,589,827,834,841,1071`,
violating `RULES.md:75-76` / ADR-0143. ADR-0151 excluded a repo-wide gate for
display/entry-point reasons, not these specific sites.

Decide: extend `assert-boundary-decode.mjs` with a `cli` scope (and decode the eight
sites), or add a justified allowlist. Also weigh ticket 03's F4 decode-then-`as`-nominal
sites.

Deliver: a verdict + remedy (gate scope + decode the sites, or allowlist rationale).
Feeds ticket 11.

## Answer

_(empty)_
