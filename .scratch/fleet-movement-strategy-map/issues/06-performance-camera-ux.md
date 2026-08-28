---
Type: research
Status: resolved
Blocked by: 02, 03
---

# 06 — Performance & camera UX inside the Fleet tab

## Question

Prove the Admiralty chart is **viable inside a tab**, not just as a full-viewport sheet — measure and decide the camera, rendering, and asset-loading posture.

Research via `/research` subagent (AFK):

- **Pan/zoom in a tab**: `usePrototypeCamera(width,height)` (`MAX_SCALE 14×, ≈1:1.5M equator`, `zoomBand` thinning, `isDraggingRef`, `svgRef/worldRef`) currently drives a full-height `SheetContent`. Measure pointer capture, wheel, and touch behaviour when the SVG is ~60% viewport width × 400px height inside `FleetScreen` (Division strip above, Order drawer right). Decide whether wheel requires `Ctrl`/pinch or is free, and whether `preserveAspectRatio="xMidYMid meet"` stays.
- **Thinning & scale**: `state.layers.labels && areas.map` with `big = bounds.width*height > 26000` plus `camera.zoomBand >=2` for port labels — with the real pack's area count (~55–65 from `content/production/1880/areas.yaml`) vs prototype 36, does label culling still read. Profile frame cost of `coastline` `ringToPath` memo vs asset decode.
- **Wrapping**: `WORLD_WRAP_TURNS.map(turn => translate(turn*width))` renders every layer three times (west/home/east). No clipping, no ring splitting — markers wrap with polygons. Quantify DOM/SVG node count in Fleet vs Sheet and confirm it fits tab scroll.
- **Asset load**: 10m coastline is the decided tier (prototype README: 110m goes polygonal at naval zoom). Coastline 4.8MB TS source is dev-only; measure production chunk with fingerprinted `public/coastline-10m.json` lazy-loaded (dynamic `import()` or `fetch`), `bake-coastline.ts` unprojected lon/lat output stays render-time projectable. Confirm no `d3-geo`/`topojson-client` runtime needed (keep 40-line decoder in bake).
- **Graticule & chrome**: `graticule` path (`lat ±60 30°, lon 30°`) + floating toolbar `oklch(0.16…/0.85)` chart-styled chrome (deliberate, so chart reads as chart) — confirm toolbar fits Fleet's drawer seam and doesn't occlude the map.

Deliver a one-page measurement note with bundle byte deltas and a go/no-go for "chart in Fleet tab" plus any guardrail (max `MAX_SCALE`, `zoomBand` thresholds) the spec must carry.

Blocked by `02` (layout fixes viewport size) and `03` (asset format fixes what is measured).

## Answer

**Note:** `docs/research/fleet-movement-strategy-map-camera-perf.md` (37 lines).

Gist: **Go** for chart-in-tab. `usePrototypeCamera` is ref-based (`scale/x/y` in `ref`, `worldRef transform` direct) so drag never re-renders `WorldMapChart`; only `zoomBand` 0|1|2 (`ZOOM_BANDS [1.8,4]`) hits React a handful of times per session (meter writes out of React). `getScreenCTM()` keeps pan under cursor at any tab width, so a ~640×400 tab pane (`Map 2/3` per 02) is fine with `preserveAspectRatio xMidYMid meet` kept. Wheel stays **free** via manual `addEventListener("wheel",{passive:false})` (React `onWheel` passive can't `preventDefault` in Electron), `isDraggingRef` still suppresses `handleAreaClick`. `WORLD_WRAP_TURNS` 3× (west/home/east) stays — markers wrap with polygons (the prototype bug was "polygons 3×, labels 1×"). 36 areas→~760 nodes, 60 areas→~1200–1400 nodes, still order-of-magnitude under ticket 13's ~8k SVG degradation; `projectAreas/coastline` are `useMemo` so only `transform` mutates per frame. Label LOD `big = bounds>26000` + `zoomBand≥1` all, `zoomBand≥2` ports stays — with 55–65 real areas it naturally culls more small coastals at rest, desirable. Coastline is `5969962` bytes TS source at `10m` tier (decided, 110m goes polygonal at `MAX_SCALE 14~1:1.5M`); promotion is `public/coastline-10m.json` lazy `fetch` singleton, projection stays render-time (`miller` default), no `d3-geo`/`topojson-client` (keep 40-line decoder in bake). Graticule (`lat±60 30°, lon 30°`) + toolbar `oklch(0.16/0.85) left-3 top-3` fits tab, wraps at 220. Spec must pin `MAX_SCALE 14`, `MIN_SCALE 0.9`, `ZOOM_BANDS [1.8,4]`, `bounds>26000`, `3×` wrap, `fetch` singleton, `zoomBand≥2` port labels; re-measure `du -h dist` expecting −~5–6 MB renderer chunk.

