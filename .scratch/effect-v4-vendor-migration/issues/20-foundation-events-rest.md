# 20 — Foundation: `events` remainder on Effect `Data`/typed errors

**Type:** implementation
**Status:** open
**Blocked by:** none (15 done)
**Frontier:** yes

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

## Comments

### Audit note (ticket 00, 2026-10-12)

**Rescoped to the concrete gap.** `events` is not reachable from the renderer.
Remaining plain throws: `ledger.ts:22,28` (`Error`: duplicate/ordering),
`explanation.ts:15,44` (`TypeError`). Target: `Data.TaggedError` subclasses
(runtime-free, `_tag` = existing code/message prefix; the message text must stay
identical for callers that match it). Envelope wire format unchanged.
Blocked-by corrected: 16–19 are closed, so this follows the Wave 2 exit directly.
