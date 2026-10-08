# Full-bleed home composition

**Type:** implementation
**Status:** resolved
**Blocked by:** IMP-01, IMP-02, IMP-03
**Frontier:** no
**Requirements:** CC-1, CC-2, CC-9

## Acceptance
Overview replaced by command screen; map full-bleed; month report/priorities panels; responsive stack; e2e + snap.

## Resolution (2026-10-08)
Overview is now the command screen: full-bleed `WorldMapChart variant="command"` (frameless; left dock = Layers button, collapsible Areas tree, Immediate priorities, Recent developments; right dock = collapsible Nations rail + area inspector; docks are `pointer-events-none`, panels `pointer-events-auto`). Panel open state is remembered per session (sessionStorage); compact density defaults every panel collapsed. Under 1024 px: map (60vh) then the same panels stacked. h1 and campaign id are visually hidden. F1 sheet kept (still useful from other screens). Minimap is hidden on the command map to keep the right dock clear (scale bar stays). Dropped from Overview: summary cards, Naval Position, Foreign Situation, Quick Actions, Campaign Identity/hash card (all covered by status strip, BottomNav and screens; campaign id kept as sr-only text).
