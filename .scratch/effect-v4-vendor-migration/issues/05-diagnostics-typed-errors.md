# 05 — `diagnostics`: typed-error foundation

**Type:** implementation
**Status:** open
**Blocked by:** 04 (Wave 0 exit)
**Frontier:** yes

## What to build

Establish the in-process typed-error foundation in `@bluewave/diagnostics` using
`Data.TaggedError`, so every later wave has one error idiom. Keep the
`DiagnosticCollector` observable contract stable (facade rule); whether the
collector itself becomes an Effect `Ref`-backed service is decided here.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1** for
  this package; read "Runtime-usage policy" (pure vs boundary) and "Further
  Notes" (the `DiagnosticCollector` open flag).
- `.scratch/effect-v4-vendor-migration/plan.md` §3, §5.2 Wave 1, §5.3.
- `packages/diagnostics/src/index.ts`, `.ai/ENGINEERING-CONTRACT.md`.
- `docs/research/effect-v4-incremental-adoption.md` §3.2–§3.3
  (`Data.TaggedError` vs wire `Schema.TaggedError`).

## Acceptance criteria

- [ ] A `Data.TaggedError` error model exists for diagnostics-level failures;
      `DiagnosticCode` remains a stable branded code and may gain a `Schema`
      brand (`MIG-RUNTIME-1`).
- [ ] The public `DiagnosticCollector` behavior (add/addError/addWarning/addInfo,
      `all`/`errors`/`warnings`/`hasErrors`, `toJSON`, `toHuman`) is unchanged for
      existing callers (facade compatibility).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime` in this package
      (`MIG-RUNTIME-1`).
- [ ] Existing diagnostics tests green; new tests cover the tagged-error
      construction and any new brand/`Result` helpers.
- [ ] `pnpm --filter @bluewave/diagnostics typecheck` and its tests green;
      `pnpm check` not regressed.

## Notes

- This is the first real `workspace:*` consumer of `effect` — re-run
  `scripts/assert-single-effect.mjs` here (`MIG-GRAPH-1`).
- Do not change `DiagnosticCode` string values (they are used across packages).
