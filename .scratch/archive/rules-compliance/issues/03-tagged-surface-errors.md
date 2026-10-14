# 03: Tagged ship-design / campaign / persistence error families (surface scope)

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** The remaining in-process errors without a stable discriminator
live in `@bluewave/ship-design` (eight classes), `@bluewave/campaign` (the
dockyard transition error), and `@bluewave/persistence` (the compatibility
error). They are told apart with `instanceof`. Give each a plain
`readonly _tag` discriminator and replace its production `instanceof` consumers
(phase-engine commands, the desktop renderer design workspace, desktop main
drawing-board/status paths) with `_tag` checks. These packages are reachable from
the renderer, so the errors stay plain TypeScript with a `_tag` field and add **no**
`effect` import, keeping `MIG-EXCL-1` intact. This ticket also owns the ADR that
records the errors-by-reachability split and amends ADR-0128. Ship a scoped
`assert-tagged-errors-surface` gate so a new untagged class cannot land.

## Acceptance criteria

- [ ] Every listed class carries a stable `_tag`; no `effect` value-import is
      added to any of these packages.
- [ ] No production site discriminates these classes with `instanceof`; all use
      `_tag`.
- [ ] A new `assert-tagged-errors-surface` gate over `{ship-design, campaign,
      persistence}` fails on a fixture with a new untagged `class extends Error`
      and passes on the real tree.
- [ ] The gate ships a bad-fixture / good-fixture pair, is registered in
      `run-gates.mjs`, and is invoked by CI (`verify-check-parity` green).
- [ ] The renderer boundary source-scan and the built-bundle tripwire stay green.
- [ ] Affected ship-design, campaign, persistence, phase-engine, and desktop
      tests stay green.

## Notes

- Sibling of ticket 02; same rule, disjoint scope. Neither blocks the other.
- ADR amends ADR-0128 (facades stay plain; renderer must not bundle `effect`).
