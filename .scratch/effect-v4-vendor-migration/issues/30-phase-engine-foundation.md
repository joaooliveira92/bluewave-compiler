# 30 — `phase-engine` foundation + orchestration

**Type:** implementation
**Status:** open
**Blocked by:** 24 (`commands`), 26 (`combat`), 29 (`ai`)
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

## Comments

### Audit note (ticket 00, 2026-10-12)

**Rescoped; absorbs 31.** `phase-engine` is 8244 LOC with 0 async, 0 `node:`
imports and 0 IO: it is a synchronous deterministic pipeline, so an Effect
`Layer`/`Context.Service` rewrite would be exactly the "blind wrapping of pure
functions" ADR-0100 §2 forbids, and would add fiber surface to the determinism
spine. Scope: type the 8 throws (`snapshotClone.ts:61,124,595,604,614,636`,
`financial-ledger.ts:33`, `commandLifecycle.ts:524`) with `Data.TaggedError`; the one consumer that catches
`BluewaveError` (`battlePhases.ts:291`) is unchanged.

**Required deliverable:** amend ADR-0100's runtime-usage table so `ai` and
`phase-engine` sit in the runtime-free row, `content-compiler` is listed as an
IO package, and `campaign`'s filesystem read is acknowledged. Not renderer-reachable.
Blocked-by corrected: 25, 27, 28 are closed.
