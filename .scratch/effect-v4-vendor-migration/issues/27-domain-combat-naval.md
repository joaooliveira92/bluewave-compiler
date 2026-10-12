# 27 — Domain: `combat` naval modules on runtime-free Effect idioms

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

## What to build

Adopt the runtime-free Effect subset across the `@bluewave/combat` naval modules:
`gunnery`, `damage`, `torpedoes`, `mines`, `smoke`, `coastal-defense`. Preserve
all pure combat math and reason codes.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**; "Runtime-usage policy".
- `packages/combat/src/{gunnery,damage,torpedoes,mines,smoke,coastal-defense}/**`.
- `docs/adr/ADR-0020-b3-gunnery-scope-and-reason-codes.md`,
  `docs/adr/ADR-0021-b4-armor-damage-scope.md`,
  `docs/adr/ADR-0040-smoke-damage-control-scope-and-integration.md`,
  `docs/adr/ADR-0039-c4-coastal-defense-scope-integration.md`.

## Acceptance criteria

- [ ] The six naval modules use runtime-free Effect subset idioms; structured
      failures typed via `Data.TaggedError` (`MIG-RUNTIME-1`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`; no `Effect.run*`.
- [ ] Combat outcomes, record fields, and reason codes unchanged (any
      hash-surface change → ADR note, `MIG-DET-1`).
- [ ] Focused naval-module tests green; `pnpm typecheck` green.

## Notes

- Do not modify aviation (ticket 26) or engagement/foundation (ticket 28).

## Comments

### Audit note (ticket 00, 2026-10-12)

**Closed — not needed; folded into 26.** The naval modules throw only
`BluewaveError` (63 `mines`, 41 `torpedoes`, 25 `gunnery`, …). The two plain
throws in `mines/contracts.ts:153,170` moved to ticket 26.
