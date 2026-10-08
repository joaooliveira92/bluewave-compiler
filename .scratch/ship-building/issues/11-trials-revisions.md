# 11: Seeded trials, acceptance, revision tiers T0-T3

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-11). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- Landed: `runTrials` (seeded via `@bluewave/random`, every draw ledgered), `classifyRevision`/`changeKindOf` (T0-T3).
- Trials-found defects are a trial outcome here; hidden defect state/discovery/repair stay in DESIGN-23 §10-16 and are wired in SB-14.
