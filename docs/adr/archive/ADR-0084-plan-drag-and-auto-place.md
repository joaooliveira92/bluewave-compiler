# ADR-0084: Drag to move and auto-place on the hull plan

## Status

Accepted 2026-10-09. Completes the items ticket 35 left open (drag to move, auto-place); clicking a finding marker was
already done by the finding markers overlay.

## Decisions

1. **Drag to move (Move mode).** Pressing on a fitting's dot (within 10 plan units, nearest wins, earlier placement on a tie),
   dragging more than 4 units and releasing moves it there through the same `moveEdit` as the buttons: one undoable edit, the
   same zone rules and refusals. A dashed ghost follows the pointer. Less travel is a click.
2. **Click to pick.** In Move mode a click on a fitting makes it the fitting to move; a click elsewhere moves the picked one
   there. A drop is not also treated as a click. Keyboard users keep the fitting select and the nudge buttons.
3. **Auto-place semantics.** For the chosen component: every station from 20 to 980 permille in 10 permille steps, on the
   centreline, that a click could place it at (same zone rules); of those that add no blocking finding, the one with the
   smallest absolute trim after placing; a tie goes to the lowest station. Pure and deterministic, compiled with the board's
   own rules; refused with a reason when no station qualifies. Side mounts are placed on the centreline; the player can then
   set the side.

## Consequences

The plan SVG itself stays a static image (`role="img"`); dragging and picking live on the existing click layer, so nothing
interactive is nested inside the image.
