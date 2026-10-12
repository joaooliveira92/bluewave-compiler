# 25 — Domain: `campaign-engine` (remainder) on runtime-free Effect idioms

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

## What to build

Complete the `@bluewave/campaign-engine` migration beyond the Wave 2 priorities
boundary: adopt the runtime-free Effect subset across the projection engine,
keeping all projections pure and byte-identical.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1**;
  Wave 4.
- `packages/campaign-engine/src/**`.
- `.scratch/effect-v4-vendor-migration/plan.md` §3.

## Acceptance criteria

- [ ] `campaign-engine` uses runtime-free Effect subset idioms; typed errors
      where appropriate (`MIG-RUNTIME-1`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [ ] Projection outputs unchanged (any hash-surface change → ADR note,
      `MIG-DET-1`).
- [ ] `pnpm --filter @bluewave/campaign-engine test` green; `pnpm typecheck`
      green.

## Notes

- Ticket 11 already converted `priorities.ts`; this is the rest of the package.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Closed — not needed.** Renderer-reachable package: a top-level
`Data.TaggedError(...)` would bundle `effect` into the renderer
(`MIG-EXCL-1`/ADR-0125; ticket 00 §5-A, confirmed by experiment). It keeps its
plain error classes. Reopen only with an ADR giving the renderer an Effect-free
error contract.

Also: `campaign-engine` has 0 throws, 0 error classes and no async/IO;
`priorities.ts` is already Effect Schema and the package is `sideEffects:false`.
