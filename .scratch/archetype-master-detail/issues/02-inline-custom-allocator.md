# INC-2 — Inline custom allocator in the detail panel

**Type:** implementation
**Status:** done
**Blocked by:** INC-1 (01-master-detail-preset-deck)
**Frontier:** no (done)
**Requirements:** ARC-2, ARC-3, ARC-5, ARC-6, ARC-8; AC-2 (custom option), AC-5 (custom half), AC-10, AC-11, AC-12, AC-13 (custom half); DESIGN-03/51, BW-ARC-002

## What to build

Replace the full-screen custom-build dialog with an **inline, editable detail slot**:
activating the custom card in the deck shows the 20-point allocator in the right
detail pane — the same place the read-only preset panel appears — instead of opening
a modal.

Extend the focused-archetype detail panel's custom body with the existing allocation
editor (three labelled dimension controls with increase/decrease steppers, the
used-points budget, the validation diagnostics, and a reset-to-balanced action) plus
the live consequence preview beside it. Editing a dimension updates a working custom
allocation held in screen-local state; the preview recomputes from it. The allocator
is valid only when the engine's allocation validator passes (each dimension in
range, total exactly the point budget).

Committing applies an `ArchetypeSelection` of `kind: "custom"` with the built
allocation and the custom card then reads Active. While the build is invalid the
primary action is disabled and the diagnostics are shown. Delete the `Dialog` and its
footer entirely; keep the applied-selection path through `editorToSelection`.

Port the modal's validation/reset/commit tests to the inline allocator, and add a
test proving no dialog is opened.

## Acceptance

- [x] Activating the custom slot renders the allocator inline in the detail pane and opens **no** `dialog` (AC-10).
- [x] Three editable dimension controls carry accessible labels `Economy/Industry/Combat allocation`, with a used-points readout and a Reset control (AC-10).
- [x] An invalid total shows the "Allocation needs fixing" diagnostics and blocks committing; correcting the split (or Reset) restores validity (AC-11).
- [x] Reset returns the allocator to the balanced baseline `7 / 7 / 6` (AC-11).
- [x] Committing a valid build applies `kind: "custom"` with the built allocation and the custom slot reads Active (AC-12).
- [x] With the custom slot applied or being committed, the primary action gates on custom validity (AC-13).
- [x] Enter/tap on the custom card reveals/focuses the inline allocator; focusing it previews its allocation and consequence (AC-5, custom half).
- [x] The four deck options (three presets + custom) remain one listbox (AC-2).
- [x] One `ArchetypeEditorState`; no fork of the engine presets or validator (AC-17).
- [x] No new `as unknown` casts; one component per file; barrel surfaces respected (AC-18).
