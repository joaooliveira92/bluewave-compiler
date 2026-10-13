# 04: Torpedo launchers and national variants through the read path (P1)

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** no
**Requirements:** SPM-R3 (diameter constraints), SPM-R7, SPM-R20 (torpedo rows, in memory only) · Stories 3, 15, 16

## What to build

The adapter carries torpedo tubes into the new model. Each of the 28 tube placements
becomes `mountCount: n` of a **single-tube launcher** that keeps the legacy component id
(T1–T6). The 15 national launcher variants become **prototypes** of the base launcher,
with bore taken from the nation's structured `domesticTorpedoDiameterUm`.

- The five French, German and Russian variants carry `DQ-TORPEDO-001` waivers on
  `diameterUmEqualsBore` for the 356 mm torpedo they fire, so those entries stay legal and
  the issue is reported rather than fixed.
- The "35 cm"/"350 mm" labels (Austro-Hungarian, Italian, Japanese) are display-only.
  Engineering dimensions come only from structured fields (story 15).
- An absent tube count → 1. An invalid count fails. Launcher quantities are
  `PER_PART_UNIT` with no fixed term. No multi-tube launcher is inferred.

## Acceptance criteria

- [ ] For every one of the 28 tube placements, `mountCount` equals the legacy tube count,
      and launcher count and total launcher mass match the legacy result.
- [ ] Exactly 15 national launcher variants and 5 waivers are produced. The waivers
      affect the 9 entries listed in the proposal's §9.4 table.
- [ ] Changing only a variant's display name changes no compatibility or derived value.
- [ ] A waiver on a non-migrated record, or one naming a different constraint, fails decoding.
- [ ] Fit-validation fixtures from ticket 06 are extended to launchers: a diameter that
      doesn't match the bore is `FIT_CONSTRAINT_VIOLATED` unless a waiver covers it.
- [ ] Production content and every golden are unchanged.
