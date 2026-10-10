# 06 — `persistence` beachhead: Schema save boundary + Effect runtime

**Type:** implementation
**Status:** open
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

- [ ] `packages/persistence/src/schemas.ts` (and any other Zod use in the package)
      converted to Effect Schema; **no `zod` import remains in the package** and
      no equivalent Zod definition is kept (`MIG-ZOD-1`).
- [ ] `PERSISTENCE_*` codes survive as `Data.TaggedError`/`Schema.TaggedError`
      tagged errors (`MIG-WIRE-1`).
- [ ] Cancellation/rollback preserved: `AbortSignal` honored, atomic
      tmp→rename→pointer, pointer rollback on cancel/failure (`MIG-WAVE1-EXIT`).
- [ ] Effect `Schema` values round-trip through `canonicalSerialize` + envelope
      hashing and reload loadably (prove Effect values survive the serializer)
      (`MIG-WIRE-4`).
- [ ] Save files written before the change still load (compatibility +
      recovery suites green) (`MIG-WIRE-1`).
- [ ] Public `SaveStore` API compatible; all persistence tests green;
      `pnpm typecheck` + `pnpm check` green.
- [ ] Single-copy guard still green (`MIG-GRAPH-1`).

## Notes

- Full Effect runtime is permitted and expected in this package (IO boundary).
- Never change the on-disk wire shape (save packs) as a side effect; parity tests
  come from existing fixtures.
- The `DiagnosticCollector` replacement question is resolved consistently with
  ticket 05.
