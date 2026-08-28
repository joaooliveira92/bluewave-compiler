# Research: Camera & performance inside the Fleet tab (ticket 06)

**Ticket:** `.scratch/fleet-movement-strategy-map/issues/06-performance-camera-ux.md`
**Date:** 2026-08-19
**Sources:** `usePrototypeCamera.ts` (MAX_SCALE 14, ZOOM_BANDS [1.8,4], ref pan/zoom, getScreenCTM), `prototype-projection.ts` (WORLD_WIDTH 2000, 3× WORLD_WRAP_TURNS, ticket 13's ~8k SVG degradation threshold, current 36→760 nodes), `WorldMapChart.tsx` (659 loc, 3-turn rendering of coastline/graticule/areas/routes/passages/possessions/fleets/labels), `prototype-coastline.ts` (5969962 bytes, Natural Earth 1:10m, 40-line TopoJSON decoder in bake), `prototype-world.ts` (36 areas), `content/production/1880/areas.yaml` (measured 55–65 real areas), `fleet.ts` (`AREA_GEOMETRY` seam from 03)

## Pan/zoom in a tab

- **Ref-based, not state.** `usePrototypeCamera(width,height)` keeps `scale/x/y` in a `ref` and writes `transform: translate(x y) scale(s)` straight onto one `<g>` (`worldRef`). Dragging does not re-render variants — only `zoomBand` (0|1|2) reaches React state, changing 3–4 times per session. Measured via built-in frame meter (`meterRef` span written out of React). This stays true inside a ~640×400 tab pane (`Map left 2/3` per 02) because the SVG `viewBox` + `preserveAspectRatio xMidYMid meet` path uses `getScreenCTM()` to convert screen pixels→user units — pan stays under cursor at any tab width.
- **Wheel handling is manual.** `addEventListener("wheel", {passive:false})` in the hook (no React `onWheel` — React 19 passive can't `preventDefault()`). In Electron a passive wheel would scroll the tab behind the map. So wheel zoom is **free**, not `Ctrl`+wheel, same as `MapSheet`. Touch uses pointer capture in the same hook. `isDraggingRef` suppresses `handleAreaClick` on drag end.
- **Verdict:** keep `preserveAspectRatio="xMidYMid meet"`, keep free wheel (no Ctrl), keep `WORLD_WRAP_TURNS` (`[-1,0,1]` turns, `translate(turn*width)`) — tab clipping is the viewport, world still wraps.

## Thinning & scale with real area count

- **Label LOD:** `state.layers.labels && areas.map` culls by `big = bounds.width*height > 26000` at `zoomBand 0` (shows only large seas like `sea_pacific_n`), all labels at `zoomBand ≥1`, port names (`POSSESSIONS`) only at `zoomBand ≥2`. With 36 areas the prototype LOD is conservative. With real `1880` pack 55–65 areas, `bounds>26000` will naturally cull fewer (more small coastal areas below threshold), so Fleet will show fewer labels at rest — desirable. No threshold change needed. Bump only if `fleet-movement` QA shows Barents/Channel crowding.
- **Guardrail:** keep `ZOOM_BANDS [1.8,4]` and `bounds>26000`. Spec must pin them so future passes don't tune by eye.

## Wrapping node count

- Every layer is rendered 3× (west/home/east), markers included — the prototype's bug of "polygons 3×, labels 1×" looked like a projection bug. Cost at 36 areas is ~760 nodes (prototype-projection comment), an order of magnitude under ticket 13's SVG degradation (~8k nodes). Scaling to 60 areas × 3 = 180 area paths + 88 port circles×3 + ~60 route lines×3 + fleet markers×3 still stays ~1200–1400 nodes, well under 8k. `projectAreas` memo (`useMemo([projection, centre])`) and `coastline` memo keep ring decode out of the frame path — only `transform` mutates per drag.

## Asset load tier

- **10m is the decided tier** (prototype README, baking contract). `110m` goes polygonal at Fleet's `MAX_SCALE 14× (~1:1.5M equator)` where the coast is the subject. Bake `pnpm tsx bake-coastline.ts 10m` stays unprojected lon/lat. Asset was `5_969_962` bytes as TS source; as `public/coastline-10m.json` lazy `fetch` the renderer chunk loses ~6 MB (Vite code-split). JSON is fetched once via module singleton `fetch("/coastline-10m.json").then(r=>r.json())` cached; projection stays render-time (`projectPoint`/`ringToPath`). No `d3-geo`/`topojson-client` runtime — 40-line decoder stays in bake, per prototype boundary.

## Graticule & chrome in tab

- `graticule` (`lat -60..60 step30` + `lon -180..180 step30` → single path string) and `CHART` chrome (`ocean oklch(0.19)/oceanDeep 0.15`, `land 0.30`, `landEdge 0.42`, `graticule 0.30`, `ink 0.92`) are deliberate chart-read. Floating toolbar `absolute left-3 top-3 rounded border p-2.5 oklch(0.16/0.85)` fits tab at full width; spec constrains it to not occlude selected area tooltip (tooltip renders at label anchor, toolbar sits opposite). At 640px pane width the `LAYERS` buttons (ownership/routes/passages…) wrap at `maxWidth 220`.

## Bundle delta

- `WorldMapChart` itself is 659 loc + ~200 projection; coastline is the weight. Removing the TS import and lazy-fetching JSON is the only required production split for Fleet viability. No image, no wasm.

## Go / no-go

**Go** for chart-in-tab at Fleet's 640×400 with guarded thresholds above. Guardrails the spec must carry: `MAX_SCALE 14`, `MIN_SCALE 0.9`, `ZOOM_BANDS [1.8,4]`, `bounds>26000 big` cull, `3×` wrap, `fetch` coastline singleton, `zoomBand≥2` port labels. Re-measure after promotion via `pnpm build && du -h apps/desktop/dist` (expect renderer chunk − ~5–6 MB vs today).

