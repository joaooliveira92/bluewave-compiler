# 04: Torpedo launchers and national variants through the read path (P1)

**Type:** implementation
**Status:** resolved
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

- [x] For every one of the 28 tube placements, `mountCount` equals the legacy tube count,
      and launcher count and total launcher mass match the legacy result.
- [x] Exactly 15 national launcher variants and 5 waivers are produced. The waivers
      affect the 9 entries listed in the proposal's §9.4 table. *(Deviation: content has 17;
      see Comments.)*
- [x] Changing only a variant's display name changes no compatibility or derived value.
- [x] A waiver on a non-migrated record, or one naming a different constraint, fails decoding.
- [ ] Fit-validation fixtures from ticket 06 are extended to launchers: a diameter that
      doesn't match the bore is `FIT_CONSTRAINT_VIOLATED` unless a waiver covers it.
      *(Handed to ticket 06: the fit stage does not exist yet; the launcher inputs do.)*
- [x] Production content and every golden are unchanged.

## Comments

- 2026-10-13: Implemented in `packages/ship-design/src/torpedoPartAdapter.ts`, with
  `test/torpedoReadPath.test.ts` (22 tests).
  - **Launchers.** Each `TORPEDO_TUBE` component becomes a single-tube
    `torpedo_launcher` part that keeps the legacy id (`tube_14in_above_water`,
    `tube_14in_submerged`). Its bore is the structured diameter of the torpedo it loads
    (`torpedoMount.torpedoModelId`, read through an injected lookup; the tests supply the
    combat catalogue's `diameterMm`). Its own `torpedo` slot carries
    `diameterUmEqualsBore: true`. Quantities are `PER_PART_UNIT` (`tube_mass`,
    `stowed_torpedo_mass` = 3 × 300 kg, `tube_cost`), with no fixed term.
  - **Variants.** Each national `componentVariants` entry over a launcher becomes a
    flattened variant: bore from `hardCapabilities.domesticTorpedoDiameterUm`, quantities
    from `applyComponentOverrides`, and `origin.prototype` recording the inherited fields.
    Labels are names only. A bore that differs from the loaded torpedo gets the
    `DQ-TORPEDO-001` waiver (`forPart: whitehead_14in_1886`, the legacy torpedo model id).
  - **Entries.** `mountCount` = legacy `tubes`. An absent count becomes 1, flagged
    `defaulted`. A zero, negative, fractional or non-finite count returns an
    `UntranslatedTubePlacement` diagnostic. The entry uses the launcher that
    `catalogueForNation` overlays today, in slot `<zone>.torpedo_launcher`.
  - **Verified.** For all 28 placements, launcher count, mass and cost equal the legacy
    component formula on the nation's catalogue. The 5 waivered variants cover exactly the
    9 §9.4 entries (France 3–7, Germany 8–10, Russia 18). Renaming variants changes nothing
    but `name`. Every part, entry and per-design gun+tube loadout decodes unchanged
    through the strict schemas.
- **Deviation: 17 variants, not 15.** The production profiles (added 2026-10-11 in
  `4fac57ea`) also give Spain (`es_tube_356_aw`) and the USA (`us_tube_14in_aw`) a 356 mm
  variant; the proposal's §9.4 table lists both as "none (base launcher)". Both match the
  356 mm torpedo, so the waiver count (5) and the affected entries (9) are unchanged. The
  test pins all 17 ids. Ticket 08/09's coverage line (`nationalLauncherVariants: 15`)
  should read 17.
- **"Non-migrated record" (SPM-R7)** is enforced as a decode rule: a legacy exception is
  admissible only on a `torpedo_launcher` record (the only family whose constraint it
  waives) and fails at `legacyExceptions` on any other family, in both `PartSchema` and
  `FlattenedPartSchema` (ADR-0154 §10). The compiler `forPart` fixture moved to a launcher.
- **Provenance.** Components carry no structured provenance, so a base launcher's is an
  explicit `PLACEHOLDER` naming the legacy component. The codemod (ticket 11) must author
  real provenance; the placeholder gate would reject it in content.
- **Lifecycle.** Component `obsoleteMonth` is exclusive (the compile blocks when
  `obsoleteMonth <= month`), so it copies to `availableUntil` unchanged. Only armament
  `retirementMonth` (inclusive) shifts by one month (ticket 03).
- **Handed to ticket 06:** the launcher fit fixtures (a bore mismatch is
  `FIT_CONSTRAINT_VIOLATED` unless a `DQ-TORPEDO-001` waiver for that torpedo covers it).
  The launcher parts already carry the constraint and the waivers.
