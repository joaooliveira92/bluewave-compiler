# Fleet Movement map prototype — throwaway, ticket 02

This is the cheap artifact for `02-visual-language-layout` (prototype, HITL).
It locks the visual language before a spec is written — not a component.

## Layout verdict (the decision)

**Desktop ≥1024px:** `FleetScreen` = `Map left 2/3 (WorldMapChart) | Drawer right 1/3`

```
┌─────────────────────────────────────────────────────────┐
│ Fleet Movement — 3/1880  Rev 12                         │
│ ┌──────────────────────┬──────────────────────────────┐ │
│ │ Division strip       │  Order drawer                │ │
│ │ [UK Home Fleet · Plymouth 3] [Med Sqn · Malta 2] … │  │  ← RadioGroup compact p-3 (from 01), 1-row scroll
│ ├──────────────────────┤                              │ │
│ │                      │ Destination: [Mediterranean] │ │
│ │  WorldMapChart       │ Ships: 3 commissioned        │ │
│ │  (Admiralty palette: │ Pending: none                │ │
│ │   ocean oklch0.19    │ [Submit] [Replace] [Cancel]  │ │
│ │   land 0.30, graticule, ink) │ [Refresh] [Retry]      │ │
│ │  Floating toolbar    │ Movement commands · 2        │ │
│ │  left-3 top-3        │ ┌────────┐                   │ │
│ │  oklch 0.16/0.85     │ │ table  │                   │ │
│ │  Miller projection   │ └────────┘                   │ │
│ │  centre 0, zoomBand  │ Notice live region           │ │
│ └──────────────────────┴──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

*Map* uses its own chrome (`CHART.oceanDeep` vignette, floating `left-3 top-3` toolbar `oklch(0.16 0.025 245 /0.85)` — deliberate paper-chart read, not app theme) so it reads as a chart. Wrapper is `FleetWorldMap.tsx` forwarding `state/route/overlay/onSelect/onRuler` to `WorldMapChart`, filtering `LAYERS` to movement-relevant: `ownership, routes, passages, possessions, fleets, labels` (all true by default, as in `initialMapPrototypeState`). Chart keeps `usePrototypeCamera` pan/zoom (`MAX_SCALE 14×, preserveAspectRatio xMidYMid meet`) and `WORLD_WRAP_TURNS` 3-turn antimeridian — three renders of every layer (west/home/east) so markers wrap with polygons.

**Narrow <1024px:** stacked `Map full-bleed ~360px | Drawer as Sheet` triggered by "Order" button; `DivisionPicker` collapses to 2-col grid.

**Reuse vs fork:** Wrapper reuses `WorldMapChart` directly (already promoted from `variants/VariantAChart.tsx`). Rejected: forking a second chart (duplicates `control/drawnPorts/drawnFleets/coastline/graticule/routePath`, diverges palette). Wrapper only filters `LAYERS` and injects per-division route memo (see 01). Imports must move off `screens/map-prototype/` after ticket 03 promotion → `components/world-map/campaign-geometry.ts`.

**GeographyCard:** text wall `grid sm:grid-cols-3` with `areas.join(", ") / edges.join(" ↔ ")` is retired — `Card` with comma lists is removed. Empty states kept: `divisions.length===0 → <Empty>No player division</Empty>` (in strip), `areas.length===0 → none` is unreachable with real 1880 pack (55–65 areas), but fallback is a single `Empty` in the map chrome ("No chart geometry") when `AREA_GEOMETRY` miss is total.

**Projection & camera:** keep `PROJECTIONS` toggle (miller default) + `usePrototypeCamera` wheel/pinch inside the tab. Wheel is free (no Ctrl), as in `MapSheet`; dragging suppresses `handleAreaClick` via `camera.isDraggingRef`. Rejected: locked camera (kills inspection; naval game needs pan).

**Division marker:** `rect 22×16 rx3` + `ships` count, hit `28×28`, selected adds `CHART.ink 2.5 + glow`. Stacking `offset=(index%3)*16-16` for 1–3 sharing an anchor, 4th+ collapses to `+N` pill (deferred to implementation).

## What this artifact is

This README is the prototype asset linked from `02`. A future `FleetWorldMap.tsx` wrapper implementing it is one `to-tickets` vertical slice — not part of this wayfinding effort. Disposal: `rm -r /tmp/fleet-map-prototype` after ticket 02 closes.

