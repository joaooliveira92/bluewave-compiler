# 10 — Boundary: `events` validation Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** open
**Blocked by:** 07 (Wave 1 exit)
**Frontier:** no

## What to build

Migrate `@bluewave/events` domain-event validation from Zod to Effect Schema
atomically, preserving the event-envelope wire format exactly (including the
`eventType === body.kind` cross-field rule and discriminated union).

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-ZOD-1, MIG-WIRE-3**;
  Wave 2.
- `packages/events/src/validation.ts`; `packages/events/src/envelope.ts`.
- `.scratch/effect-v4-vendor-migration/plan.md` §4.1–§4.3.

## Acceptance criteria

- [ ] `packages/events/src/validation.ts` converted to Effect Schema; `zod`
      import and dependency removed; no dual definition (`MIG-ZOD-1`).
- [ ] The discriminated union over `kind` and the `eventType must match
      body.kind` refinement are preserved with identical accept/reject behavior
      (`MIG-WIRE-3`).
- [ ] Event-envelope serialization tests prove byte-compatible envelopes
      (`MIG-WIRE-3`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [ ] `pnpm --filter @bluewave/events test` green; `pnpm typecheck` green.

## Notes

- Do not change event envelope field names, ordering, or the `YYYY-MM` timestamp
  regex semantics.
