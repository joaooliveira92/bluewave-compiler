# 13: Progressive disclosure, unit-aware number fields, comparison deltas

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Important interaction patterns" (progressive
disclosure, cause-and-effect feedback, comparison before commitment, editable numbers).

## What to build

Deliver the cross-cutting interaction patterns the sections rely on: progressive disclosure
(show only what a valid design needs, with specialist fields under an "Advanced" disclosure),
unit-aware editable number fields (direct entry, increment/decrement, wheel only when focused,
units, valid range, reset to recommended, undo), and comparison-before-commitment deltas that
preview the consequence of an option before the player chooses it.

## Acceptance criteria

- [ ] Specialist fields are hidden behind an "Advanced" disclosure; the default view of a
      section is not a wall of fields (e.g. main belt shows thickness + coverage; inclination,
      tapering, material, internal backing sit under Advanced).
- [ ] A numeric field supports direct keyboard entry, increment/decrement buttons, mouse wheel
      **only while the field is focused**, a unit label, an enforced valid range, reset to the
      recommended value, and undo.
- [ ] Scrolling over the inspector never changes an unfocused numeric value.
- [ ] Hovering or selecting an alternative option previews the delta it would cause (e.g. speed
      +1.3 kn, weight −84 t, cost +£1,260, reliability +8%, required year) without committing.
- [ ] Every edit promptly updates the visualization, displacement, cost, performance, and
      stability; a short (~150–250 ms) visual transition may be used but never delays
      calculation, and a stale result never replaces a newer one.
