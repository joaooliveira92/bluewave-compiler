# 03 — Toolchain: `@effect/tsgo` lint gate, tsconfig policy, ADR set

**Type:** implementation
**Status:** open
**Blocked by:** 02 (workspace + guard)
**Frontier:** no

## What to build

Install the pinned `@effect/tsgo` linter as an external devDependency (not
vendored) and wire the `effect-best-practices` lint gate; record the tsconfig
policy (`skipLibCheck: true` stays; decide `erasableSyntaxOnly` for consumer
code); and write the four governing ADRs.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-VENDOR-5,
  MIG-ADR-1**, and the runtime-usage policy (**MIG-RUNTIME-1**); read
  "`@effect/tsgo` policy", "Runtime-usage policy", "ADRs to be written".
- `.scratch/effect-v4-vendor-migration/plan.md` §2.1, §3, §9.
- `.scratch/effect-v4-adoption/issues/05-engine-core-effect-policy.md` and
  `09-version-line-choice.md`; `docs/research/effect-v4-incremental-adoption.md`
  (§3.4 tooling), `docs/research/effect-v4-runtime-determinism.md`.
- `.ai/ENGINEERING-CONTRACT.md` (Determinism, Content, Electron boundary),
  `docs/adr/README.md` for ADR format.

## Acceptance criteria

- [ ] `@effect/tsgo` is a pinned **exact** devDependency and lives **outside**
      `vendor/`; no `vendor/@effect/tsgo` directory exists (`MIG-VENDOR-5`).
- [ ] The `effect-best-practices` / `@effect/tsgo` lint gate runs in the repo's
      lint pipeline (as a `vp lint` rule or a dedicated `lint:effect` Turbo task)
      and reports green on the current tree (`MIG-VENDOR-5`).
- [ ] tsconfig policy recorded: `skipLibCheck: true` retained (load-bearing for
      Effect); an explicit decision on `erasableSyntaxOnly` for consumer code
      (`MIG-RUNTIME-1`).
- [ ] ADR-1 **Adopt Effect v4** (v4 line; pinned rc.109 → stable 4.0.0;
      runtime-free core vs full-Effect boundaries) (`MIG-ADR-1`).
- [ ] ADR-2 **Vendor Effect** (V1 layout incl. workspace wrapper, sync procedure,
      single-copy invariant, zero-patch default) (`MIG-ADR-1`).
- [ ] ADR-3 **Replace Zod with Effect Schema** (boundary-by-boundary, no dual
      maintenance, wire formats frozen) (`MIG-ADR-1`).
- [ ] ADR-4 **DESIGN-08 determinism spine demoted** (records the conflict with
      DESIGN-08 per adoption ticket 05) (`MIG-ADR-1`).
- [ ] `pnpm check` green.

## Notes

- `@effect/tsgo` requires TS ≥ 7 (repo has 7.0.2). If it cannot plug into
  `vp lint`, add it as a separate Turbo task rather than weakening the gate.
- Write ADR **decision records only**; do not implement migration code here.
