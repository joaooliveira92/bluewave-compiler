# 05: Resizable, collapsible inspector

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Right inspector design" / "Recommended width".

## What to build

Make the right inspector a resizable, collapsible panel: drag its left edge to resize within
bounds, collapse/restore it with a keyboard shortcut, and remember its width between sessions
through the renderer's non-authoritative UI-state sidecar.

## Acceptance criteria

- [x] Dragging the inspector's left edge resizes it between roughly 360px (min) and 560px
      (max), defaulting around 440px.
- [x] The chosen width is remembered between sessions.
- [x] A keyboard shortcut collapses and restores the inspector.
- [x] Width/collapse state is presentation-only and never persisted as authoritative state.

## Answer

The inspector is resizable and collapsible, remembered per campaign through the renderer-owned
`ui-state.json` sidecar (ADR-0038) — the mechanism the ticket named and that ADR directs future
renderer state to, rather than the per-machine `localStorage` the Drawing Board's split width uses.

- **Vocabulary + bounds:** `inspector-layout.ts` — `INSPECTOR_MIN_PX` 360 / `INSPECTOR_MAX_PX` 560 /
  `INSPECTOR_DEFAULT_PX` 440 / `INSPECTOR_COLLAPSED_PX` (restore strip) / `INSPECTOR_RESIZE_STEP_PX`,
  `clampInspectorWidth`, and the tolerant `normalizeInspectorLayout`. The column width is a CSS
  variable (`--inspector-width`) on the workspace grid, so the layout no longer hard-codes rems.
- **Resize:** `InspectorResizeHandle` is a WAI-ARIA vertical splitter at the pane's left edge — drag
  sets the width from the pointer's distance to the pane's right edge; ArrowLeft/Right nudge (the edge
  moves left to widen), Home/End jump to the bounds, Enter restores the default. `Inspector.tsx` keeps
  an icon-only "Hide inspector" toggle in its breadcrumb row.
- **Collapse:** ⌘/Ctrl+B folds the pane to its restore strip (a "Show inspector" button and the
  section name set vertically) and restores it; the toggle button carries the same `aria-keyshortcuts`.
- **Persistence:** `useInspectorLayout(sessionId)` reads the layout from `readUiState` on mount and
  writes it through `writeUiState` (debounced) with the dismissal set read back first, so neither it
  nor the guided inspection erases the other. The sidecar schema gained an optional `inspector` field
  (shared contract + `InspectorLayoutSchema`, carried forward on merge like `firstMonthInspection`).
  Outside a campaign session the choice still applies for the session but is not stored.

**Tests** — `inspector-layout.test.ts` (clamp/normalize), `InspectorResizeHandle.test.tsx`
(keyboard + pointer drag), `useInspectorLayout.test.tsx` (read on mount, write carries the dismissal
set, no write without a session), `ShipbuildingWorkspace.test.tsx` ("Inspector layout": default width,
keyboard resize within bounds, ⌘/Ctrl+B collapse/restore, strip-button restore), plus
`uiState.test.ts` (round-trip + merge-preserve) and `campaignCommandSchemas.test.ts` (optional,
malformed rejection).

**Commands:** desktop shipbuilding + uiState/schema suites → 126 passed; `pnpm typecheck` → clean;
`vp lint`/`vp fmt --check` → clean; `pnpm snap` (expanded: handle + "Hide inspector" visible) and
`pnpm snap --click "Hide inspector"` (collapsed strip: "Show inspector" + vertical "Overview") →
`idle mutations/s: structural=0 attributes=0`, console clean.
