# Starting-fleet-method screen

**Type:** grilling
**Status:** resolved
**Blocked by:** 04

## Question

Spec the starting-fleet-method screen (diagnosis doc step 5) using the
id→meaning mapping decided in ticket 04 (legacy-fleet-mode semantics).

Cover:
- Screen content per mode: description, recommendation framing (e.g.
  "Recommended for your first campaign"), and any warnings, matched to
  whatever ticket 04 decided each mode actually does.
- Default selection.
- What info is shown when the manual-build mode is selected (if that mode
  survives ticket 04): total allocation, minimums/maximums, required force
  structure, etc., per the doc — only to the extent ticket 04's semantics
  support it.

## Answer

- **Era-gating:** none at the UI level. All three modes (`generated`/inherit,
  `disabled`/manual-build, `historical`/curated) are presented as selectable
  in every era. The engine's `supportedLegacyFleetModeIds` is identical
  across all 5 canonical scenarios (`packages/campaign/src/scenario.ts`) —
  nothing gates manual-build to 1900 the way the diagnosis doc's flavor text
  implies. The doc's "1900 special case" framing is not carried forward as a
  constraint.
- **Default selection:** `generated` (Inherit an existing navy) — matches
  the doc's explicit recommendation and "Recommended for your first
  campaign" framing.
- **Manual-build (`disabled`) card:** fully selectable, descriptive-only.
  No Phase 1/Phase 2 ship-purchase breakdown, no numeric allocation figures
  — that mechanic doesn't exist in the engine (out of scope per ticket 04).
  Card shows title/blurb/recommendation framing plus a brief note that
  detailed fleet construction isn't available yet. Not omitted, not
  grayed-out — all three ids are equally real, equally unimplemented,
  per ticket 04's mapping.
- **`generated`/`historical` cards:** same descriptive-only treatment — no
  numeric/statistical preview (no ship counts, no allocation figures),
  consistent with ticket 02's qualitative-only cut of "estimated starting
  navy."
- **Layout:** three-card select pattern, matching the Archetype screen
  (ticket 03) and preset picker (ticket 02) for visual consistency across
  the commissioning flow.
