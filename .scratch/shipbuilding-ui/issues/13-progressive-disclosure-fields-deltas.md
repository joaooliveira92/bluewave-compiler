# 13: Progressive disclosure, unit-aware number fields, comparison deltas

**Type:** implementation
**Status:** resolved
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

- [x] Specialist fields are hidden behind an "Advanced" disclosure; the default view of a
      section is not a wall of fields (e.g. main belt shows thickness + coverage; inclination,
      tapering, material, internal backing sit under Advanced).
- [x] A numeric field supports direct keyboard entry, increment/decrement buttons, mouse wheel
      **only while the field is focused**, a unit label, an enforced valid range, reset to the
      recommended value, and undo.
- [x] Scrolling over the inspector never changes an unfocused numeric value.
- [x] Hovering or selecting an alternative option previews the delta it would cause (e.g. speed
      +1.3 kn, weight −84 t, cost +£1,260, reliability +8%, required year) without committing.
- [x] Every edit promptly updates the visualization, displacement, cost, performance, and
      stability; a short (~150–250 ms) visual transition may be used but never delays
      calculation, and a stale result never replaces a newer one.

## Answer

The three cross-cutting patterns are now shared primitives in the design-workspace layer, used by the
Shipbuilding sections:

- **Progressive disclosure** — `components/design-workspace/Advanced.tsx`: a labelled `<details>`
  (closed by default, keyboard- and screen-reader-reachable). `ProtectionEditor` folds each armour
  region's specialist fields (material, inclination) into it, so a belt opens on thickness + coverage;
  `MachineryEditor` folds the supporting **Fuel capacity** detail into it. The main-belt example the
  ticket names is satisfied directly. Tapering and internal backing are not modelled (named under the
  section's "What the model does not carry"), so they are not fabricated as controls.
- **Unit-aware number field** — `NumberField` gains a `recommended` prop: when the value differs from
  the recommended one a **Reset** control commits it (clamped to the valid range), wired for the
  Machinery targets (the starting design's requirement values) and for each fitted armour region's
  thickness/length/height (the model's `newArmourRegion` starting size). It keeps direct keyboard entry,
  increment/decrement buttons, a unit label, an enforced `min`/`max`, and works under the workspace's
  undo. The field now sets Base UI's `allowWheelScrub`, which scrubs **only while the input is focused**
  (Base UI checks the active element), so scrolling the inspector never changes an unfocused value.
  Wheel-only-when-focused and the unfocused no-op are locked by tests.
- **Comparison before commitment** — `components/design-workspace/optionDelta.ts` (pure):
  `viewDeltas(before, after)` turns two compiled views into signed, unit-aware deltas of speed,
  displacement, cost and stability; `previewOptionDeltas(draft, env, before, edit)` compiles the
  hypothetical and returns them, or null when the edit is rejected. `DeltaPreview` renders them.
  `plantDeltas(draft, env, view, content)` composes the compiled deltas with each plant's reliability
  and required year. `MachineryEditor` shows the preview for the plant the player hovers/keyboard-focuses
  in the select (via a new `Select.onActiveValueChange` → `SelectField`), e.g. `Speed +1.3 kn`,
  `Displacement −84 t`, `Cost +£1,260`, `Reliability +8%`, `Required from 1885-01` — nothing is committed
  until the option is chosen. `SelectField` keeps every calculation out of the render path: the map is
  built with `useMemo`, only while the Machinery section is open. The primitive is wired at the ticket's
  example (the propulsion plant); other option selects adopt it the same way, but the Protection material
  select still commits without a preview (a per-region × per-material compile is not worth running eagerly).
- **Immediate cause and effect** — edits already recompile synchronously (`buildWorkshopView` in a
  `useMemo`), so the drawing, displacement, cost, performance and stability update in the same render.
  No transition is used: there is no asynchronous calculation to delay or to replace with a stale
  result. Locked by the existing "edit … updates the strip, and undoes it" tests.

**Tests** `optionDelta.test.ts` (only changed values, signed text, rejected edit → null, draft untouched),
`Advanced.test.tsx`, `fields.test.tsx` (reset-to-recommended, wheel ignored while unfocused),
`machinery-view.test.ts` (per-plant deltas: current plant empty, reliability/year previewed) and
`ShipbuildingWorkspace.test.tsx` ("previews what an alternative plant would change, without committing";
"keeps the supporting fuel detail behind a closed Advanced disclosure"; "resets a target to the
recommended value"; belt Advanced disclosure). The renderer test harness gained a `scrollIntoView`
no-op (a jsdom gap the select's active-option scroll needs).

**Commands:** desktop suite → 288 files / 1965 passed; `pnpm typecheck` → 37/37 tasks clean;
`vp lint` and `vp fmt --check` on the changed files → clean.
**Snap:** `pnpm snap --save /tmp/bw-save --click "Shipbuilding" --click "Machinery"` → the Machinery
section renders with the closed Advanced disclosure and the calculated results; console clean,
`idle mutations/s: structural=0 attributes=0`.
**No ADR:** presentation-only (no authoritative state, save format, hash or golden change).
