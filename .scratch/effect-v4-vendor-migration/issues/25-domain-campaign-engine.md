# 25 — Domain: `campaign-engine` (remainder) on runtime-free Effect idioms

**Type:** implementation
**Status:** open
**Blocked by:** 22 (`campaign`)
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
