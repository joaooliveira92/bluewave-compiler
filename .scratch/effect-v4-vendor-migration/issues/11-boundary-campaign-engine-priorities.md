# 11 — Boundary: `campaign-engine` priorities Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** open
**Blocked by:** 07 (Wave 1 exit)
**Frontier:** no

## What to build

Migrate the Zod enums/schemas in `@bluewave/campaign-engine`'s priorities
projection (`prioritySeveritySchema`, `strategicPriorityTypeSchema`, and any
other Zod use) to Effect Schema atomically.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-ZOD-1**; Wave 2.
- `packages/campaign-engine/src/priorities.ts`.
- `.scratch/effect-v4-vendor-migration/plan.md` §4.1–§4.3.

## Acceptance criteria

- [ ] Zod enum/schema use in `priorities.ts` (and any other file in the package)
      converted to Effect Schema; no `zod` import remains; dependency removed;
      no dual definition (`MIG-ZOD-1`).
- [ ] Exported types (`PrioritySeverity`, `StrategicPriorityType`) preserve their
      previous literal unions (`Schema.Schema.Type`) — structurally identical.
- [ ] Pure/runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [ ] `pnpm --filter @bluewave/campaign-engine test` green; `pnpm typecheck`
      green.

## Notes

- This projection is a pure read over the immutable snapshot; keep it pure.
