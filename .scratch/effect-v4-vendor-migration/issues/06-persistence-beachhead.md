# 06 — `persistence` beachhead: Schema save boundary + Effect runtime

**Type:** implementation
**Status:** done
**Blocked by:** 05 (typed-error foundation)
**Frontier:** no

## What to build

Re-implement the `@bluewave/persistence` boundary-heavy service with Effect:
Effect Schema owns the save boundary (metadata / sig / pointer / header /
storable-state per `SAVE-MANIFEST.md`), tagged errors replace the throw +
`DiagnosticCollector` mix, and the Effect runtime (with `Scope`/`AbortSignal`
cancellation) drives the IO. Public `SaveStore` API stays compatible.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-WIRE-1,
  MIG-WIRE-4, MIG-WAVE1-EXIT**; read Wave 1 scope, "Zod → Effect Schema
  replacement", and the runtime-usage table.
- `.scratch/effect-v4-vendor-migration/plan.md` §4 (Zod sites), §5.2 Wave 1.
- `packages/persistence/src/{store,schemas,compatibility,recovery,snapshotSerialization}.ts`;
  `docs/contracts/schemas/SAVE-MANIFEST.md`; ADR-0023 / ADR-0024.
- `.scratch/effect-v4-adoption/issues/06-beachhead-selection.md` (acceptance bar).

## Acceptance criteria

- [x] `packages/persistence/src/schemas.ts` (and any other Zod use in the package)
      converted to Effect Schema; **no `zod` import remains in the package** and
      no equivalent Zod definition is kept (`MIG-ZOD-1`).
- [x] `PERSISTENCE_*` codes survive as `Data.TaggedError`/`Schema.TaggedError`
      tagged errors (`MIG-WIRE-1`).
- [x] Cancellation/rollback preserved: `AbortSignal` honored, atomic
      tmp→rename→pointer, pointer rollback on cancel/failure (`MIG-WAVE1-EXIT`).
- [x] Effect `Schema` values round-trip through `canonicalSerialize` + envelope
      hashing and reload loadably (prove Effect values survive the serializer)
      (`MIG-WIRE-4`).
- [x] Save files written before the change still load (compatibility +
      recovery suites green) (`MIG-WIRE-1`).
- [x] Public `SaveStore` API compatible; all persistence tests green;
      `pnpm typecheck` + `pnpm check` green.
- [x] Single-copy guard still green (`MIG-GRAPH-1`).

## Notes

- Full Effect runtime is permitted and expected in this package (IO boundary).
- Consider the Effect `platform` services (FileSystem, Path, Runtime — bundled
  into `effect` in v4) and `Effect.acquireRelease`/`Scope` for the IO instead of
  raw `node:fs`, while keeping the atomic tmp→rename→pointer semantics identical.
- Never change the on-disk wire shape (save packs) as a side effect; parity tests
  come from existing fixtures.
- The `DiagnosticCollector` replacement question is resolved consistently with
  ticket 05.

## Comments

### Evidence (2026-10-11)

**Changed files**

- `packages/persistence/package.json` — dropped `zod@^4.6.5`, added
  `"effect": "workspace:*"`.
- `packages/persistence/src/schemas.ts` — all Zod → Effect `Schema`
  (`Schema.Struct`/`Record`/`Array`/`String`/`Number`/`Unknown`/`optional`),
  `typeof S.Type` aliases restored to mutable shapes via a `Mutable<T>` map.
  `.default([])` → `Schema.withDecodingDefaultType(Effect.succeed([]))` (v4
  removed `optionalWith`).
- `packages/persistence/src/store.ts` / `recovery.ts` — `parse` →
  `Schema.decodeUnknownSync`, `safeParse` → `Schema.decodeUnknownResult` (+
  `Result.isSuccess`); PERSISTENCE_* code constants re-exported from `errors.ts`.
- `packages/persistence/src/errors.ts` (new) — `Data.TaggedError` classes
  `PersistenceCorruptSaveError`/`MissingSaveError`/`CancelledError`/
  `UnsignedSaveError`/`CompatibilityMismatchError`, each `_tag` = its code, plus
  `PersistenceError` union and a `toDiagnostic()` projection.
- `packages/persistence/src/compatibility.ts` — `CompatibilityChecker` emits its
  diagnostic through `PersistenceCompatibilityMismatchError.toDiagnostic()`
  (byte-identical collector output); code re-exported from `errors.ts`.
- `packages/persistence/src/index.ts` — additive exports of the tagged errors,
  codes, and `PersistenceError` type.
- `packages/persistence/test/schema-serialization.test.ts` (new) — MIG-WIRE-4.
- `packages/persistence/test/errors.test.ts` (new) — tagged-error parity.
- `docs/adr/ADR-0104-persistence-effect-beachhead.md` (new) + ADR index.

**Tagged-error API:** `PersistenceCorruptSaveError` (`_tag`
`"PERSISTENCE_CORRUPT_SAVE"`), `PersistenceMissingSaveError`,
`PersistenceCancelledError`, `PersistenceUnsignedSaveError`,
`PersistenceCompatibilityMismatchError`; each carries `code`/`stage`/`message`/
`remediation` and has `toDiagnostic(severity?)`. The `DiagnosticCollector`
public contract is retained (adoption ticket 06) — tagged errors are additive.

**Runtime scope:** raw synchronous `node:fs` IO kept (the public `SaveStore` API
is synchronous and must stay so); the boundary adopts `Schema`, `Data.TaggedError`,
`Result`, and `Effect.succeed` for decode defaults. Recorded in ADR-0104.

**Commands + observed results**

| Command | Result |
| --- | --- |
| `pnpm --filter @bluewave/persistence typecheck` | exit 0 |
| `pnpm --filter @bluewave/persistence test` | 8 files / 63 tests passed (was 6 / 55) |
| `rg "zod" packages/persistence` | no matches; `zod` removed from package.json |
| `node scripts/assert-single-effect.mjs` | exit 0 (`workspace:vendor/effect`) |
| `pnpm lint:effect` | 0 errors (261 pre-existing `node-builtin-import`/`process-env` warnings) |
| `pnpm lint` | 0 warnings, 0 errors |
| `pnpm format` | all files correctly formatted |
| `pnpm typecheck` | 37/37 tasks successful |
| `pnpm -w turbo run build --force` | 20/20 tasks successful |
| `pnpm test:run` | 241 files / 1554 tests passed |
| `node scripts/verify-golden-hashes.cjs` | all 10 hashes match (no drift) |
| `pnpm check` | exit 0 end-to-end (incl. 30/30 e2e) |

**Residual limitations:** none blocking. The `DiagnosticCollector` call sites in
`store.ts` remain verbatim (retained contract); only `CompatibilityChecker` uses
a tagged error internally. A later wave can route the remaining sites through the
same vocabulary without touching the wire or the public surface. Full Effect
`platform` FileSystem IO is deliberately out of scope while `SaveStore` is
synchronous.
