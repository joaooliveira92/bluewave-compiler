# 23 — Domain: `ship-design` on runtime-free Effect idioms

**Type:** implementation
**Status:** open
**Blocked by:** 19 (`armament`)
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
