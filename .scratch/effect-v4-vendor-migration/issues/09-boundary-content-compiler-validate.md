# 09 — Boundary: `content-compiler` validate stage (Schema type coupling)

**Type:** implementation
**Status:** open
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

- [ ] `content-compiler` no longer imports `ZodSchema` (or `zod`); the validate
      stage consumes `Schema.Schema<A, I, R>` (`MIG-ZOD-1`).
- [ ] `zod` removed from `content-compiler`'s `package.json`; no Zod definition
      remains in the package (`MIG-ZOD-2`).
- [ ] Content-pack compile fixtures produce identical pass/fail and identical
      diagnostics as before the change (`MIG-WIRE-2`).
- [ ] `pnpm --filter @bluewave/content-compiler test` green; `pnpm typecheck`
      green.

## Notes

- Do not change compiler stage ordering or emitted artifacts.
