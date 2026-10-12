# 19 — Foundation: `armament` on Effect `Schema`/`Data`

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

## What to build

Adopt the runtime-free Effect subset in `@bluewave/armament` (armament domain
model + resolver): `Schema`/`Data`/tagged errors where a schema or structured
error is warranted, keeping the resolver pure.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1**;
  "Runtime-usage policy", Wave 3.
- `packages/armament/src/**`;
  `docs/adr/ADR-0093-armament-domain-and-resolver.md`.
- `.scratch/effect-v4-vendor-migration/plan.md` §3, §5.1.

## Acceptance criteria

- [ ] `armament` uses runtime-free Effect subset idioms; structured failures use
      `Data.TaggedError` where the resolver previously threw or returned ad-hoc
      results (`MIG-RUNTIME-1`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [ ] Resolver outputs (values, provenance, reason codes) unchanged.
- [ ] `pnpm --filter @bluewave/armament test` green; `pnpm typecheck` green.

## Notes

- `armament` may have uncommitted in-flight work in the shared tree; re-read files
  before editing and do not overwrite concurrent changes.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Closed — not needed.** Renderer-reachable package: a top-level
`Data.TaggedError(...)` would bundle `effect` into the renderer
(`MIG-EXCL-1`/ADR-0125; ticket 00 §5-A, confirmed by experiment). It keeps its
plain error classes. Reopen only with an ADR giving the renderer an Effect-free
error contract.

Also: `armament` defines no error type; its four throws
(`arithmetic.ts:16,30,47,50`) are `BluewaveError`, which stays plain.
