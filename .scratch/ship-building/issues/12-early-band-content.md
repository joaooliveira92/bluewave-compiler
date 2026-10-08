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

- 2026-10-08: follow-up (3) done - DESIGN-22 intended/natural classification (`classification.ts`, DD/CL/CA/B/BB with strict/inclusive boundary tests) wired into `compileDesign` (BLOCKING `INTENDED_CLASSIFICATION_ILLEGAL` / `NATURAL_CLASSIFICATION_MISMATCH` / `NO_NATURAL_CLASSIFICATION_MATCH`). BC joins with the Dreadnought band. A second research pass for the placeholders is running (`docs/research/ship-building-early-band-2.md`).

- 2026-10-08: reference ships compile on the real content (`test/references.test.ts`): Havock-like DD (26.1 kn, 1,830 nm, valid, natural DD) and Majestic-like B (38.0 % hull, 17.3 kn, GM 1.3 m, valid, natural B because DESIGN-22 requires 3+ turrets for BB). Model additions driven by them: machinery `rooms` (boiler/engine rooms), `protectionGoal: NONE`, `deckPenetrationBp`, stress allowable calibrated on Havock. Known gap: Majestic-like ledger is ~16 % under buoyancy because boats, anchors, stores and other equipment (White: armament+equipment 17 %) have no components yet (research pass 2).
