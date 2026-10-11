# 05 — `diagnostics`: typed-error foundation

**Type:** implementation
**Status:** done
**Blocked by:** 04 (Wave 0 exit)
**Frontier:** no

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

- [x] A `Data.TaggedError` error model exists for diagnostics-level failures;
      `DiagnosticCode` remains a stable branded code and may gain a `Schema`
      brand (`MIG-RUNTIME-1`).
- [x] The public `DiagnosticCollector` behavior (add/addError/addWarning/addInfo,
      `all`/`errors`/`warnings`/`hasErrors`, `toJSON`, `toHuman`) is unchanged for
      existing callers (facade compatibility).
- [x] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime` in this package
      (`MIG-RUNTIME-1`).
- [x] Existing diagnostics tests green; new tests cover the tagged-error
      construction and any new brand/`Result` helpers.
- [x] `pnpm --filter @bluewave/diagnostics typecheck` and its tests green;
      `pnpm check` not regressed.

## Notes

- This is the first real `workspace:*` consumer of `effect` — re-run
  `scripts/assert-single-effect.mjs` here (`MIG-GRAPH-1`).
- Do not change `DiagnosticCode` string values (they are used across packages).

## Comments

**Implemented (2026-10-11).** First real `workspace:*` consumer of `effect`.

- **Dep:** `packages/diagnostics/package.json` gained `"effect": "workspace:*"`
  (kept `@bluewave/contracts`). `pnpm install` links
  `packages/diagnostics/node_modules/effect -> ../../../vendor/effect`; the
  lockfile importer now records `effect: {specifier: workspace:*, version:
  link:../../vendor/effect}` with **no registry `effect@<version>` package entry**.
- **Error model:** `DiagnosticError extends Data.TaggedError("DiagnosticError")<{…}>`
  (runtime-free, in-process) carrying `code`, `message`, and the optional
  `stage`/`sourceLocation`/`entityId`/`relatedLocations`/`remediation` fields of
  `Diagnostic`, plus a `toDiagnostic()` projection (severity always `"error"`,
  stage defaults to `"unknown"` to match `addError`). `DiagnosticCode` is
  unchanged (`string & { readonly __diagnosticCode: never }`); no `Schema` brand
  added (optional per AC, and changing the brand would ripple through existing
  `as DiagnosticCode` call sites in other packages). No `Result` helper added.
- **Facade:** `DiagnosticCollector` is byte-for-byte unchanged — no new methods,
  no output-shape change.
- **Tests:** `test/diagnostics.test.ts` 7 → 10 tests; new cases prove tagged
  construction (`_tag`, `instanceof Error`, field access), the `toDiagnostic()`
  projection/defaults, and **facade parity** (collecting via
  `add(error.toDiagnostic())` yields byte-identical `toJSON()`/`toHuman()` to
  `addError` for the same input).

**Commands + observed results**

- `pnpm --filter @bluewave/diagnostics typecheck` → exit 0 (clean).
- `pnpm --filter @bluewave/diagnostics test` → exit 0, 1 file / **10 tests passed**.
- `node scripts/assert-single-effect.mjs` → exit 0:
  `ok (no registry effect; workspace:vendor/effect)`.
- `pnpm preflight` → exit 0 (guard self-test 9/9 ok; docs-check ok).
- `pnpm format` → exit 0 (all 2154 files formatted).
- `pnpm lint` → exit 0 (0 warnings / 0 errors).
- `pnpm lint:effect` → exit 0 (249 pre-existing warnings / 0 errors; none in
  `packages/diagnostics`).
- `pnpm -w turbo run build --force` → exit 0 (20/20 tasks).
- `pnpm typecheck` → exit 0 (37/37 tasks; all downstream consumers of
  `@bluewave/diagnostics` still compile).
- `pnpm test:run` → exit 0 (**241 files / 1554 tests passed**).
- `node scripts/verify-golden-hashes.cjs` → exit 0 (`All 10 hashes match golden
  reference`) — no hash surface touched, confirming the AC expectation.

**Conflict check:** no runtime-free invariant weakened, no `DiagnosticCode` string
changed, no collector output shape changed, no ADR-hash note owed. No files
outside the ticket touched; no commit made.

