# 17: AI candidate generator

**Type:** implementation
**Status:** resolved
**Blocked by:** 16
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-17). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- Landed: `generateCandidates` (threshold-accepting search per archetype, farthest-first diversity, seeded + ledgered, only zero-BLOCKING candidates returned).
- Archetype objective weights are data (`AiEnvironment.archetypes`); authored YAML lands with SB-12.
