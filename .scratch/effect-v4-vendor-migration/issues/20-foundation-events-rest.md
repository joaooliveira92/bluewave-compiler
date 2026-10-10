# 20 — Foundation: `events` remainder on Effect `Data`/typed errors

**Type:** implementation
**Status:** open
**Blocked by:** 19 (`armament`)
**Frontier:** no

## What to build

Complete the `@bluewave/events` migration beyond the Wave 2 validation boundary:
adopt Effect `Data`/typed errors across the event envelope/body construction
surface, keeping the package runtime-free and the envelope wire format
unchanged.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-WIRE-3**; Wave 3.
- `packages/events/src/**`.
- `.scratch/effect-v4-vendor-migration/plan.md` §3, §5.1.

## Acceptance criteria

- [ ] Event construction/envelope modules use Effect `Data`/`Schema`/tagged
      errors where appropriate; envelope wire format unchanged (`MIG-WIRE-3`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [ ] Existing event tests green; `pnpm --filter @bluewave/events test` green;
      `pnpm typecheck` green.

## Notes

- Ticket 10 already converted `events/validation.ts`; this covers the rest of the
  package.
