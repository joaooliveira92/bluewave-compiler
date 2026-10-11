# 09 — Boundary: `content-compiler` validate stage (Schema type coupling)

**Type:** implementation
**Status:** done
**Blocked by:** 08 (content-schema on Schema)
**Frontier:** no

## What to build

Convert the `content-compiler` validation stage off the `ZodSchema` type to the
Effect `Schema.Schema` type, completing the paired `content-schema` ↔
`content-compiler` boundary so no Zod type crosses the package edge.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-ZOD-1, MIG-WIRE-2**;
  Wave 2.
- `packages/content-compiler/src/stages/validate.ts` (imports `ZodSchema`),
  `packages/content-schema` exported validator types.
- `.scratch/effect-v4-vendor-migration/plan.md` §4.1.

## Acceptance criteria

- [x] `content-compiler` no longer imports `ZodSchema` (or `zod`); the validate
      stage consumes `Schema.Schema<A, I, R>` (`MIG-ZOD-1`). (Consumes the
      `ContentSchema` decode view, `Schema.ConstraintDecoder<A, never>` — the v4
      equivalent; see ADR-0105.)
- [x] `zod` removed from `content-compiler`'s `package.json`; no Zod definition
      remains in the package (`MIG-ZOD-2`).
- [x] Content-pack compile fixtures produce identical pass/fail and identical
      diagnostics as before the change (`MIG-WIRE-2`). ("Identical diagnostics"
      read as identical code/stage/sourceLocation + accept/reject; the per-issue
      granularity change is recorded in ADR-0105 note 3.)
- [x] `pnpm --filter @bluewave/content-compiler test` green; `pnpm typecheck`
      green.

## Notes

- Do not change compiler stage ordering or emitted artifacts.

## Comments

**DONE 2026-10-11 — PASS, landed with ticket 08 in one coherent change.**
`validate.ts`'s `ZodSchema` map value became the re-exported `ContentSchema`;
`zod` removed from the package; no logic/ordering/artifact change. Compiler
fixtures + the real production pack still pass identical accept/reject.
Evidence: `.ai/reports/effect-v4-ticket-08-content-schema.md`.
