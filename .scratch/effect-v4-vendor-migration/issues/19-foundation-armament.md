# 19 — Foundation: `armament` on Effect `Schema`/`Data`

**Type:** implementation
**Status:** open
**Blocked by:** 18 (`random`)
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
