# 08 — Boundary: `content-schema` Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** done
**Blocked by:** 07 (Wave 1 exit)
**Frontier:** yes

## What to build

Migrate the entire `@bluewave/content-schema` pack-schema surface from Zod to
Effect Schema in one coherent change (the largest validation boundary). Every
Zod definition is deleted as its Effect Schema replacement lands; no dual
definitions.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-ZOD-1, MIG-ZOD-2**;
  read "Zod → Effect Schema replacement" (boundary list, atomicity rule, mapping,
  parity) and Wave 2.
- `.scratch/effect-v4-vendor-migration/plan.md` §4.1–§4.3.
- `packages/content-schema/src/*` (area, design, manifest, nation, naval-profile,
  naval-profile-vocab, port, possession, route, ship-component, technology,
  schema-validator, yaml-parser, research-fields); `docs/requirements` /
  `SAVE-MANIFEST`/content docs as needed; `docs/research/effect-v4-incremental-adoption.md`
  §3.3.

## Acceptance criteria

- [x] All Zod schemas in `packages/content-schema/src/**` converted to Effect
      Schema; the `zod` import and `"zod"` dependency removed from the package;
      no equivalent Zod definition remains (`MIG-ZOD-1`, `MIG-ZOD-2`).
- [x] Exported schema types use `Schema.Schema.Type<typeof S>`; the
      `schema-validator` type surface is re-expressed over `Schema.Schema`
      (`MIG-ZOD-1`). (v4 idiom `typeof S.Type`, permitted by spec §"API mapping";
      validator consumes `Schema.ConstraintDecoder<A, never>`.)
- [x] `Schema.Struct` closed-by-default parity with the previous Zod `.strict()`
      behavior is **verified per schema**, not assumed (unknown/excess fields
      still rejected where they were before).
- [x] Parity tests built from existing fixtures prove identical accept/reject
      decisions (`MIG-WIRE-2`).
- [x] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime` in the package.
- [x] `pnpm --filter @bluewave/content-schema test` green; `pnpm typecheck`
      green.

## Notes

- Paired with ticket 09 (the `content-compiler` `ZodSchema` type coupling); land
  together or 09 immediately after, but neither may leave a dual definition.
- Do **not** change content-pack wire shapes.

## Comments

**DONE 2026-10-11 — PASS (orchestrator pipeline).** Implemented + reviewed +
gated. All 16 `src` files moved to Effect Schema atomically; the coupled
`content-compiler` validate stage (ticket 09) and every transitive consumer
(`ship-design`, `phase-engine`, `campaign`, desktop main + renderer, compiler
tests) moved with it. **Strictness policy (ADR-0105):** decode every boundary
with `{ onExcessProperty: "error" }` via the new `decode.ts` helpers
(`decodeStrict`/`decodeStrictResult`), preserving every prior `.strict()`
rejection exactly and tightening previously-open `z.object` schemas fail-closed;
`Schema.Finite` reproduces Zod v4's non-finite rejection. Reviewer verdict
APPROVE (3 MEDIUM reconciled in ADR-0105's "Known deviations": renderer
transitively bundles Effect → Wave-5 `MIG-EXCL-1`; readonly `.Type` vs ADR-0104
`Mutable<>`; `SCHEMA` diagnostic granularity). Gate: build 20/20 uncached,
typecheck 37/37, lint 0/0, lint:effect 0 errors, format clean, `test:run` 241
files/1554 tests, goldens 10/10, cross-process byte-identical `success:true`,
e2e 30 passed. Report `.ai/reports/effect-v4-ticket-08-content-schema.md`.
