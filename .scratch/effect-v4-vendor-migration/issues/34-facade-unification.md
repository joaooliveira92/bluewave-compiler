# 34 — Unify cross-package facades onto Effect-typed interfaces

**Type:** implementation
**Status:** open
**Blocked by:** 33 (Wave 4 exit)
**Frontier:** no

## What to build

The wide-refactor **contract** step: flip the public surfaces that were held
plain-TS-compatible through Waves 1–4 to their Effect-typed interfaces in one
coherent step, so the monorepo exposes one idiom. Flip boundaries deliberately,
package by package, keeping `pnpm check` green throughout.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-WAVE5-EXIT,
  MIG-RUNTIME-1**; read "facades stable until unification" in Solution and Wave 5.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2 (facade rule), §5.3.
- `.scratch/effect-v4-adoption/issues/08-adoption-sequencing-dod.md` (facade
  rule).

## Acceptance criteria

- [ ] Cross-package public surfaces that were deferred now expose Effect-typed
      interfaces (`Effect`/`Schema`/typed errors), with a single coherent idiom
      (`MIG-RUNTIME-1`).
- [ ] Each flip keeps `pnpm check` green (batch the flips so intermediate states
      stay green; use an integrate-and-verify step if a batch cannot).
- [ ] No package reintroduces `zod`, changes a wire format, or adds ambient
      randomness/wall-clock reads (`MIG-WIRE-1..3`, `MIG-DET-1`).
- [ ] `pnpm check` green; single-copy guard green.

## Notes

- This is the migration's only wide, fan-out change; size batches by blast radius
  (per package) and keep the old form until no caller remains.
