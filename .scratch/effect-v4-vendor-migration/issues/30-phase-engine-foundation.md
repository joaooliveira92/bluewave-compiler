# 30 — `phase-engine` foundation + orchestration

**Type:** implementation
**Status:** open
**Blocked by:** 24 (`commands`), 25 (`campaign-engine`), 26, 27, 28 (`combat`), 29 (`ai`)
**Frontier:** no

## What to build

Adopt the full Effect runtime across the `@bluewave/phase-engine` foundation:
`index`, `registry`, `month`, `monthContext`, `phase-guard`, `snapshotClone`,
`commandLifecycle`, `commandPhases`. This is an orchestration boundary, so
`Effect`/`Layer`/`Context.Service` are permitted; typed errors and `Scope`-based
lifecycle replace ad-hoc failure handling.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**; "Runtime-usage policy" (phase-engine is orchestration).
- `packages/phase-engine/src/{index,registry,month,monthContext,phase-guard,snapshotClone,commandLifecycle,commandPhases}.ts`.
- `.ai/ENGINEERING-CONTRACT.md` (state authority, cancellation).

## Acceptance criteria

- [ ] The listed modules use Effect `Layer`/`Context.Service`/typed errors as
      appropriate for orchestration (`MIG-RUNTIME-1`).
- [ ] Monthly phase execution order and outputs unchanged; deterministic
      behavior preserved (fixed seed/inputs ⇒ identical results) (`MIG-DET-1`).
- [ ] Public entry surface remains compatible (facade rule).
- [ ] `pnpm --filter @bluewave/phase-engine typecheck` green; focused tests
      green.

## Notes

- Full-Effect use is expected here; keep pure helpers pure.
- Domain phase modules (ticket 31) and battle/replay (ticket 32) are separate.
