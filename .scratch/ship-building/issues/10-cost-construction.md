# 10: Cost, work split, packages, facility fit

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-10). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- Landed: `computeCost`, `planConstruction`, `simulateConstruction` (pure forecast); ADR-0064 records the DESIGN-23 §18 extension.
- Facility fit and treaty checks already live in `compileDesign`. Engine wiring and DESIGN-23 amendment are SB-14.
