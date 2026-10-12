# 23 — Domain: `ship-design` on runtime-free Effect idioms

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

## What to build

Adopt the runtime-free Effect subset across `@bluewave/ship-design`
(assemblies, formulas, units): `Schema`/`Data`/tagged errors where appropriate,
keeping the design/formula outputs deterministic and unchanged.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1**;
  "Runtime-usage policy", Wave 4.
- `packages/ship-design/src/**` (incl. `formula/`).
- `.scratch/effect-v4-vendor-migration/plan.md` §3.
- `docs/adr/ADR-0083-fittings-inside-hull-weight.md`,
  `docs/adr/ADR-0076-sb2-ship-building-parity.md` (domain context).

## Acceptance criteria

- [ ] `ship-design` uses runtime-free Effect subset idioms; structured failures
      typed via `Data.TaggedError` (`MIG-RUNTIME-1`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [ ] Formula outputs and unit arithmetic unchanged (integer/fixed-point
      discipline preserved).
- [ ] `pnpm --filter @bluewave/ship-design test` green; `pnpm typecheck` green.

## Notes

- `ship-design` may have in-flight uncommitted work in the shared tree; re-read
  files before editing.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Closed — not needed.** Renderer-reachable package: a top-level
`Data.TaggedError(...)` would bundle `effect` into the renderer
(`MIG-EXCL-1`/ADR-0125; ticket 00 §5-A, confirmed by experiment). It keeps its
plain error classes. Reopen only with an ADR giving the renderer an Effect-free
error contract.

Eight `Error` subclasses (`edits.ts:44`, `persistence.ts:11`, `units.ts:18`,
`engineAdapter.ts:49`, `contextBuilder.ts:32`, `construction.ts:249`,
`study.ts:23`, `formula/ast.ts:8`) and 42 plain throws. `EditError` is
value-imported by the renderer (`useDrawingBoard.ts:11,102`).
