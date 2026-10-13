# ADR-0087: Section hover card draws a faithful crop of the plan and profile

## Status

Accepted 2026-10-10. Supersedes the "vertical scale may be compressed" drawing convention of the section
hover cards (commit `ca3a0f1`).

## Context

The hull plan's section hover cards show a plan band and a profile band, drawn from the main drawing's own
layers under a transform. That transform magnified a narrow station window horizontally (~4.2x on a typical
ship) but compressed it vertically — and by a different factor for each band (plan ~0.40, profile ~0.27). Both
bands therefore read as a different hull from the waterline plan and the side profile shown directly below,
which the player reported as the hover "not being equivalent" to either main view.

## Decisions

1. **One uniform scale on both axes and both bands.** The plan band and the profile band share a single scale,
   so each is a faithful crop of the main drawing and can never disagree with it. No compression, no
   exaggeration.
2. **The window widens to fill the card.** A uniform scale cannot magnify past the band heights, so the card
   shows the section plus its neighbours (dimmed) instead of squashing the drawing. The section sits centred
   with at least a sliver (`EDGE_MARGIN`, 20 permille) of each neighbour inside the window.
3. **Taller bands.** `PLAN_BAND` / `PROFILE_BAND` grow from 112/92 to 230/230 so the section stays magnified
   rather than collapsing into a full-ship overview. The card is taller and scrolls on short windows.
4. **The scale is bounded by the tighter band.** Usually the profile, which must hold the whole hull height
   (deck to keel, including the tallest funnel); the plan's beam is rarely the limit. Content is centred
   vertically in the profile band.

## Consequences

- The hover drawing is now visually equivalent to the waterline plan and the side profile.
- The card is taller (about 1000 px) and scrolls when the window is short; it uses the dialog's available
  height, so it is never clipped.
- The two bands no longer draw at different vertical scales, so the section-drawing golden snapshot changes.
- `section-drawing.test.ts` asserts the invariant (uniform scale; the section and its neighbours stay inside
  the window) so a future refactor cannot silently reintroduce the distortion.
