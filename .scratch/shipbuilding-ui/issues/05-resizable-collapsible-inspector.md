# 05: Resizable, collapsible inspector

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Right inspector design" / "Recommended width".

## What to build

Make the right inspector a resizable, collapsible panel: drag its left edge to resize within
bounds, collapse/restore it with a keyboard shortcut, and remember its width between sessions
through the renderer's non-authoritative UI-state sidecar.

## Acceptance criteria

- [ ] Dragging the inspector's left edge resizes it between roughly 360px (min) and 560px
      (max), defaulting around 440px.
- [ ] The chosen width is remembered between sessions.
- [ ] A keyboard shortcut collapses and restores the inspector.
- [ ] Width/collapse state is presentation-only and never persisted as authoritative state.
