# 08 — Boundary: `content-schema` Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** open
**Blocked by:** 07 (Wave 1 exit)
**Frontier:** no

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

- [ ] All Zod schemas in `packages/content-schema/src/**` converted to Effect
      Schema; the `zod` import and `"zod"` dependency removed from the package;
      no equivalent Zod definition remains (`MIG-ZOD-1`, `MIG-ZOD-2`).
- [ ] Exported schema types use `Schema.Schema.Type<typeof S>`; the
      `schema-validator` type surface is re-expressed over `Schema.Schema`
      (`MIG-ZOD-1`).
- [ ] `Schema.Struct` closed-by-default parity with the previous Zod `.strict()`
      behavior is **verified per schema**, not assumed (unknown/excess fields
      still rejected where they were before).
- [ ] Parity tests built from existing fixtures prove identical accept/reject
      decisions (`MIG-WIRE-2`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime` in the package.
- [ ] `pnpm --filter @bluewave/content-schema test` green; `pnpm typecheck`
      green.

## Notes

- Paired with ticket 09 (the `content-compiler` `ZodSchema` type coupling); land
  together or 09 immediately after, but neither may leave a dual definition.
- Do **not** change content-pack wire shapes.
