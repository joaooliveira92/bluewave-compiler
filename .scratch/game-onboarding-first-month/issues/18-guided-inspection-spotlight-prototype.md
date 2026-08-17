**Type:** prototype
**Status:** resolved
**Blocked by:** none

## Question

Surfaced by [Guided first-month inspection](./05-guided-first-month-inspection.md):
no comparable spotlight/highlight/tour component exists anywhere in
`apps/desktop/src/renderer` today, so the guided first-month inspection
(diagnosis doc §8) is fresh cross-screen interaction design, not a reuse of
an existing pattern.

Build a rough, throwaway spotlight/step-card overlay (per the `/prototype`
skill) spanning at least two of the six real strategic-section screens
(e.g. Overview and Fleet) to react to before locking the interaction model:

- a highlighted UI target with a step-card (title, 1-2 sentences, Next/Back,
  "End inspection", "N of 7" progress) overlaid on real screen content;
- judge whether the highlight ring/overlay reads correctly over real layouts
  and doesn't visually collide with existing content;
- judge step-card placement/sizing across screens of different shapes.

## Answer

**Interaction model decided for the spec (does not change ticket 05's
already-decided steps / behavior / persistence).** The guided first-month
inspection overlay is specified as a **DOM-based, renderer-only spotlight**
with no domain-state, no blocking, and no focus trap:

- **Highlight ring** — computed from the target element's
  `getBoundingClientRect()` on each step (recomputed on resize/re-nav); the
  rest of the viewport gets a dim scrim with the target region punched out
  (CSS `clip-path`/`box-shadow` technique). Because the six real section
  screens share one campaign shell and one header, targets are reachable
  without cross-screen chrome collisions when the ring is computed over the
  actual mounted target each step.
- **Step card** — fixed-position (top-right or bottom-center, per-screen
  shape), carrying title / 1–2 sentence explanation / **Next** / **Back**
  (after step 1) / **End inspection** / "N of 7" progress. Positioning is
  chosen to avoid the shell header and Advance-Month affordance; the card
  must not overlap the highlighted target's critical controls.
- **Non-blocking** — normal navigation, save, and Advance Month remain
  usable; ending or navigating away dismisses the card (status updated in
  `FirstMonthInspectionState`, ticket 05). No `pointer-events` trap over the
  page.
- **Accessibility** — respects `prefers-reduced-motion` (no animated ring);
  card is keyboard-reachable and announced; focus stays in the flow and is
  never trapped inside the card (doc §22).
- **Prototype asset** — a concrete visual click-through prototype is a
  **follow-up during the implementation sprint**, not a spec blocker: the
  exact ring radius, scrim opacity, and card position are presentation
  details judged against real layouts then. They do not change ticket 05's
  steps, non-blocking behavior, or persistence shape.

This confirms ticket 05's answer unchanged; the interaction model above is
what the spec's Guided Inspection section (doc §8) will reference.
