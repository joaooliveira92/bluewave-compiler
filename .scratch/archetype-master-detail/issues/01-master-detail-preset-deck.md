# INC-1 — Master/detail layout with a preview-then-apply archetype deck

**Type:** implementation
**Status:** done
**Blocked by:** none
**Frontier:** no (done)
**Requirements:** ARC-1, ARC-2, ARC-3, ARC-4, ARC-6, ARC-7, ARC-8, ARC-9, ARC-10; AC-1, AC-2, AC-3, AC-4, AC-6, AC-7, AC-8, AC-9, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, AC-19; BW-ARC-001/002, BW-TST-002, BW-DET-003, DESIGN-02/03/51

## What to build

Rework the live **Choose your archetype** step into the same two-pane master/detail
surface the Rules-of-the-Naval-Age and Starting-fleet-method steps already use, so a
player can inspect one archetype at a time and only commit on an explicit gesture.

Adopt `NewGameScreenLayout fullBleed`: at `lg`+ a master deck on the left and a
detail column on the right; at narrow widths the panes stack into one scroll column.
The step's title/brief is shown by the shell header (already wired), so the in-screen
title is dropped.

Wire the **existing, already-written-but-unwired** archetype deck/detail components
into the screen — do not rebuild them against the shared primitives. The deck lists
the three named presets plus the custom-build slot as one listbox with the shared
interaction parity (arrow wrap, 32px/360ms wheel, Enter, tap on any visible card,
drag-to-fling, focus-on-mount). Moving focus only previews; Enter, a tap, or the
step's primary action applies. The detail column shows a status line, a
focused-archetype slide panel (name, tagline, allocation across the three
dimensions, consequence preview, Active/Pending "Applies on Next" state; presets also
show their description; no in-panel Select control), and the Back action.

The primary action reads "Select" while a previewed slot differs from the applied
selection (applying on the first press) and "Choose Nation" once applied (advancing
on the next press); it is disabled until an applied selection exists. A persisted
initial `ArchetypeSelection` is restored focused and Active; `null` leaves nothing
applied.

The custom slot is present as a deck option but, in this ticket, still delegates to
the existing modal so the custom path stays complete end to end.

Remove the old grid of cards, the below-screen consequence section, and the in-screen
title. Keep the applied selection flowing through the existing `ArchetypeEditorState`
/ `editorToSelection` path and the engine presets/validators — no fork, no
persistence of preview/focus state.

Rework `NewGameArchetypeScreen.test.tsx` in place for the preset path, and leave the
pure `new-game-archetype-screen-state` and `archetype-consequence` suites green.

## Acceptance

- [x] At `lg`+ the master listbox and detail region are siblings; at narrow widths they stack; no duplicate in-screen title (AC-1).
- [x] The master pane renders the three presets plus "Create Your Own" as four named options of one `role="listbox"` (AC-2).
- [x] Arrow navigation wraps at both ends via the shared helper (AC-3).
- [x] The deck is wired to the shared wheel stepper (threshold/cooldown/`deltaMode`); navigation consumes no authoritative randomness (AC-4).
- [x] Enter applies the focused preset (AC-5, preset half).
- [x] Focus-only moves (arrows/wheel/drag) preview the detail panel without changing the applied selection or the primary-action payload (AC-6).
- [x] Tapping a non-top visible card applies that archetype (AC-7).
- [x] The detail panel shows name/tagline/allocation/consequence, and preset descriptions, with no in-panel Select control (AC-8).
- [x] The focused slot reads "Active" when applied and "Applies on Next" when previewed-but-unapplied (AC-9).
- [x] The primary action reads "Select" then "Choose Nation", applies on the first press and advances on the next, disabled with no applied selection (AC-13).
- [x] Back is preserved (AC-14); continuing emits `onNext` with the preset payload (AC-15).
- [x] A persisted preset selection is restored focused and Active; `null` leaves the action disabled (AC-16).
- [x] One `ArchetypeEditorState`; applied selection via `editorToSelection`; preview/focus presentation-only and unpersisted (AC-17).
- [x] No new `as unknown` casts; one component per file; barrel surfaces respected (AC-18).
- [x] No authoritative state/hash/golden/save/engine change (AC-19).
