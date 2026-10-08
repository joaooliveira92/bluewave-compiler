# 12: EARLY-band catalogue from research; calibration

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-12). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- Landed 2026-10-08: `content/production/1880/ship-building/{components,plants,hull-forms,balance}.yaml` + README; research note `docs/research/ship-building-early-band.md`; schemas in `@bluewave/content-schema`; `test/earlyBand.test.ts` (schema, lint against real tech ids, calibration vs six ships).
- Spec change: hull weight law replaced by `K*(L*B*D)^1.26` fitted to four sourced hull fractions (spec F-H2 updated); weapons model moved to grams/millilitres (small-bore guns); plants may carry `introduction`/`requires`.
- Open follow-ups: (1) replace every PLACEHOLDER (mount/magazine/fitting data, costs, curves) via research; (2) hull-form depth values are ESTIMATE; (3) add DESIGN-22 intended-classification validation (DD/CL/CA/B/BB) to `compileDesign` - requires reading the combat classifier's predicates; (4) pack.json wiring and content-compiler stage (SB-14); (5) reference-ship full compiles (Havock/Edgar/Majestic/Siegfried-like) once placeholders are researched.
