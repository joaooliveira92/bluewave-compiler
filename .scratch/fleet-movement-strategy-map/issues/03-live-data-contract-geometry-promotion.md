---
Type: research
Status: resolved
Blocked by: 01
---

# 03 — Live data contract & chart-geometry promotion

## Question

Pin the **data seam** between the live compiled snapshot and the chart geometry — how `FleetScreenProjection`'s real topology (`snapshot.world.areas`/`routes`/`ports` via `buildFleetScreenView` in `packages/campaign-engine/src/fleet.ts:buildFleetScreenView`) joins to the presentation geometry the chart needs (`prototype-world.ts:AREAS/EDGES`, `prototype-coastline.ts:COASTLINE_POLYGONS`, `prototype-projection.ts:projectAreas/ringToPath`, `campaign-map-join.ts:joinWorldMap/fixtureAnchor/LiveWorldMapOverlay`).

Research (use `/research` subagent, AFK) and decide:

- **Canonical source of truth**: `snapshot.world` is canonical for IDs, adjacency, and `routes.yaml:distance`. Chart geometry is presentation keyed by `areaId` — ring `lon/lat[]`, label anchor `[lon,lat]`, optional tile `[col,row]`. Fixture `AREAS` (36 areas, ~80 edges) diverges from the real 1880 pack (`content/production/1880/areas.yaml` excerpt shows `eng_home_coast`, `sea_english_channel`, `ott_eg_coast` etc. with `sea_english_channel→sea_mediterranean_w 1700km`); decide the join table shape (`areaId → {ring, label}`) and what happens for a real `areaId` with no geometry (render as label-only, warn in dev, or fail).
- **Bridge reuse**: `inspectFleetScreen` (→ `FleetScreenProjection`) and `inspectMap` (→ `LiveWorldMapOverlay` via `joinWorldMap`) currently allocate separate overlays. Decide whether Fleet chart reuses `inspectMap`'s overlay wholesale or extends `FleetScreenProjection` with `world` needed for the chart, and how `campaignNationHue`/`campaignNationLabel` stay consistent.
- **Coastline asset promotion**: `prototype-coastline.ts` is a 4.8MB TS source module (prototype README: "fine through Vite in dev and wrong for production"). Ticket 06's owed real asset format: decide `public/coastline-10m.json` fingerprinted lazy import vs binary, loader (`bake-coastline.ts` 10m tier retained), and whether `d3-geo`/`topojson-client` runtime is allowed (prototype intentionally has none — 40-line TopoJSON decoder in bake script). Quantify bundle impact (measure current `WorldMapChart` chunk size vs proposed).
- **IDs & types**: `FleetArea.id` vs `PrototypeArea.id` (`AreaId = string`) alignment; `FleetAreaEdge` (directed `{fromAreaId,toAreaId}` from `snapshot.world.routes`) vs `PrototypeEdge` (undirected `{a,b,passage?}` + `PASSAGES_BY_ID`) — passage gating belongs to chart, adjacency belongs to engine.

Produce a research note `docs/research/fleet-movement-strategy-map-*.md` with primary sources (Natural Earth public domain for coastline, pack YAML for IDs) and a one-paragraph seam contract spec-ready.

Blocked by `01` because interaction contract fixes which geometry (hit zones, anchors) is required.

## Answer

**Research note:** `docs/research/fleet-movement-strategy-map-geometry-seam.md` (55 lines).

Gist: `snapshot.world` (real `areas` like `eng_home_coast`, `sea_english_channel` + directed `routes` like `sea_english_channel→sea_mediterranean_w 1700` + `ports` 88 `level→capacity`) is canonical for topology; fixture `AREAS` (36 `area_north_sea`)/`EDGES` (~80 undirected+`passage`)/`COASTLINE_POLYGONS` (5969962 bytes Natural Earth 1:10m) is presentation only. Seam is `AREA_GEOMETRY: Record<AreaId,{ring,label,tile?}>` keyed by real `AreaId` — ring/label are unprojected lon/lat so `projectionById/ringToPath` stay render-time and projection remains a toggle (bake stays `pnpm tsx bake-coastline.ts 10m`). Directed engine edges → undirected chart edges derived at memo time; passages stay chart-layer `PASSAGES_BY_ID`. Missing geometry falls back to label-only at 0,0 with dev warn `oklch(0.55/0.08)` — never crash. Bridge: share helper `campaign-geometry.ts` (`joinWorldMap/fixtureAnchor/campaignNationHue`) extracted from `campaign-map-join.ts`; Fleet's single `inspectFleetScreen` derives overlay locally, no second `inspectMap` round-trip; `EMPTY_LIVE_OVERLAY` when `sessionId===null` still hosts fixture. Coastline promotes from TS import to fingerprinted `public/coastline-10m.json` lazy `fetch` — removes ~6 MB from renderer chunk (measure `du -h apps/desktop/dist` before/after), no `d3-geo`/`topojson-client` runtime (keep 40-line TopoJSON decoder in bake). Ready as spec criterion R-03.
