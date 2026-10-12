# 11 — Boundary: `campaign-engine` priorities Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** done
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

- [x] Zod enum/schema use in `priorities.ts` (and any other file in the package)
      converted to Effect Schema; no `zod` import remains; dependency removed;
      no dual definition (`MIG-ZOD-1`).
- [x] Exported types (`PrioritySeverity`, `StrategicPriorityType`) preserve their
      previous literal unions (`Schema.Schema.Type`) — structurally identical.
- [x] Pure/runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [x] `pnpm --filter @bluewave/campaign-engine test` green; `pnpm typecheck`
      green.

## Notes

- This projection is a pure read over the immutable snapshot; keep it pure.

## Comments

**DONE 2026-10-11 — PASS (orchestrator pipeline).** `priorities.ts`'s two
`z.enum`s → `Schema.Literals` with member order preserved; types →
`typeof s.Type`; `effect` added to the package (it had no declared `zod` — the
import previously resolved via hoisting, now removed). No decode call site
(these schemas are type-only; zero consumers). Reviewer APPROVE (LOW-only).
Gate: build 20/20 uncached, typecheck 37/37 forced, `pnpm check` exit 0
(test:run 241 files/1554 tests, e2e 30), goldens 10/10, cross-process
byte-identical `success:true`. Report
`.ai/reports/effect-v4-ticket-11-campaign-engine-priorities.md`.
