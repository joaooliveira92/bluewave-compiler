# Research: Fleet Movement live-data seam & chart-geometry promotion

**Ticket:** `.scratch/fleet-movement-strategy-map/issues/03-live-data-contract-geometry-promotion.md`
**Date:** 2026-08-19
**Sources:** `packages/campaign-engine/src/fleet.ts:buildFleetScreenView`, `content/production/1880/{areas,routes,ports}.yaml`, `apps/desktop/src/renderer/components/world-map/WorldMapChart.tsx` (659 loc), `apps/desktop/src/renderer/screens/map-prototype/{prototype-world.ts (36 areas, ~80 edges), prototype-coastline.ts (5969962 bytes, Natural Earth 1:10m), prototype-projection.ts, usePrototypeCamera.ts}`, `apps/desktop/src/renderer/screens/map-prototype/campaign-map-join.ts:joinWorldMap/fixtureAnchor/LiveWorldMapOverlay`, `apps/desktop/src/renderer/shell/MapSheet.tsx:inspectMap`, `apps/desktop/src/renderer/screens/fleet/hooks/useFleetScreen.ts:inspectFleetScreen`, `content-1-world-geography.md`

## 1. Canonical source & join table

- **Snapshot is canonical for topology.** `buildFleetScreenView(snapshot, playerSlotId)` is the contract the spec cites: `areas: snapshot.world.areas.map({id,name}).sort(id)` (real pack IDs like `eng_home_coast`, `sea_english_channel`, `ott_eg_coast`), `areaEdges: snapshot.world.routes.map({from,to})` (directed, e.g. `sea_english_channel→sea_mediterranean_w distance 1700`, `sea_red_sea↔ott_eg_coast 160 canal`), `ports: snapshot.world.ports.filter(nationId===player).map({id,name,areaId,capacity: level})`. It is pure/deterministic and tested against fixture data; `FleetScreenState` never decides legality.
- **Fixture is presentation only.** `prototype-world.ts:AREAS` (36, ids like `area_north_sea`) and `EDGES` (~80, undirected `{a,b,passage?}` + `PASSAGES_BY_ID` 9 canals/straits) plus `COASTLINE_POLYGONS` are the chart's *picture* of the world, not its topology. Today `MapSheet` joins them via `campaign-map-join.ts:fixtureAnchor(areaId) → label [lon,lat]` and `joinWorldMap(world)` which builds `LiveWorldMapOverlay{source:"campaign", ownership:Map<areaId,nation>, ports:[], fleets:[]}` guarded by live anchor existence.
- **Decided seam (spec-ready):** introduce a **join table keyed by real `AreaId`** (`FleetArea.id`):

  ```ts
  type AreaGeometry = {
    ring: readonly (readonly [number,number])[] // unprojected lon/lat, from bake-coastline output
    label: readonly [number,number]            // hand-placed or centroid, lon/lat
    tile?: readonly [number,number]            // optional, board variant only
  }
  const AREA_GEOMETRY: Readonly<Record<AreaId, AreaGeometry>> // presentation asset
  ```

  Topology stays `snapshot.world`; geometry stays `AREA_GEOMETRY`. At render time `projectAreas(AREAS_fixture, …)` is replaced by `projectAreas(realAreas.map(id=>AREA_GEOMETRY[id]), …)` — `projectionById/ringToPath` stay render-time (bake output is unprojected lon/lat, per `bake-coastline.ts` contract), so projection remains a toggle.

- **Missing-geometry fallback:** real `areaId` with no entry in `AREA_GEOMETRY` (new pack area before geometry authored) renders as **label-only** anchored at `0,0` with dev-only `console.warn("missing geometry", areaId)` and a translucent wash fallback `oklch(0.55 0 0 /0.08)` — never a blank or a crash. Graduates to a real polygon when authored; no build-time failure.
- **Edge alignment:** `FleetAreaEdge` (directed `{fromAreaId,toAreaId}`) is engine truth; `PrototypeEdge` (undirected `{a,b,passage?}`) is the chart's undirected adjacency plus passage gate. Seam: derive chart `EDGES` from `areaEdges` at `WorldMapChart` memo time (`Map<from→to>` dedup + attach `passage` when `areaId` pair matches `PASSAGES_BY_ID` known pairs), so passages stay chart-layer but adjacency never drifts.

## 2. Bridge reuse: `inspectFleetScreen` vs `inspectMap`

- Today `useFleetScreen → bridge.campaign.execute("inspectFleetScreen", sessionId) → FleetScreenProjection{revision, month, playerNationId, divisions, areas, areaEdges, ports, movementCommands}` and `MapSheet → "inspectMap" → LiveWorldMapOverlay{ownership, ports, fleets, world}`. Two overlays, two calls, two `useEffect` polls.
- **Decision:** Fleet chart **extends `inspectFleetScreen`** rather than reusing `inspectMap` wholesale. Reason: `inspectMap`'s `world` is not needed by other screens, but Fleet's `divisions`/`ports` already overlap `LiveWorldMapOverlay.fleets/ports`. The cheapest seam is to **share the helper**, not the endpoint: extract `campaignNationHue/campaignNationLabel/fixtureAnchor/joinWorldMap` from `campaign-map-join.ts` into `components/world-map/campaign-geometry.ts` and let both `inspectMapCommand` and `inspectFleetScreenCommand` build their overlay via the same `joinWorldMap` over `AREA_GEOMETRY`. Fleet's hook then does single `inspectFleetScreen` call; its `WorldMapChart` overlay is derived locally from the same `AREA_GEOMETRY` without a second IPC round-trip. `Empty overlay` (`EMPTY_LIVE_OVERLAY`) when `sessionId===null` still renders fixture — sheet stays usable.
- Consistency: `campaignNationHue` hash of `NationId` (e.g. `uk → 0`, `germany → …`) is the single hue ramp, so `nationFill` and `strokeFor` match across sheet and Fleet.

## 3. Coastline asset promotion (the 4.8MB problem)

- **Measured:** `prototype-coastline.ts` is `5_969_962` bytes source (5969962 `wc -c`), emitted as a TS module. Prototype README explicitly calls this "fine through Vite in dev and wrong for production. Ticket 06 still owes the real asset format." The bake script `bake-coastline.ts [110m|50m|10m]` default `10m` is the decided tier because `usePrototypeCamera MAX_SCALE 14× (~1:1.5M equator)` goes polygonal at `110m`.
- **Decision:** promote to **fingerprinted `public/coastline-10m.json`** (or `assets/coastline-10m.bin` if binary) **lazy-loaded** via `fetch` + `json()` cached in a module singleton, not `import`. Current `WorldMapChart` does `import {COASTLINE_POLYGONS} from "./prototype-coastline.js"` at bundle time — moving to `const polygons = await fetch("/coastline-10m.json")` removes ~6 MB from the renderer chunk (Vite code-splits the import; in the prototype build the renderer chunk's coastline slice is >4 MB gzipped). Measurement to cite in spec: `pnpm build && du -h apps/desktop/dist` before/after; expect renderer chunk delta ≈ `COASTLINE_POLYGONS` size minus fetch asset.
- **Keep properties:** output stays unprojected lon/lat so `projectionById` (`miller` default) stays render-time; no runtime `d3-geo`/`topojson-client` — the 40-line TopoJSON arc decoder stays in `bake-coastline.ts` (already public-domain Natural Earth, so no originality boundary).
- **Loader:** retain `pnpm tsx apps/desktop/src/renderer/screens/map-prototype/bake-coastline.ts 10m` as author-time bake writing `public/coastline-10m.json`.

## 4. IDs & types alignment

| Layer | Real type | Fixture type | Seam |
|---|---|---|---|
| Area | `FleetArea{id,name}` (`AreaId=string`, sorted `id`) | `PrototypeArea{id,name,ring,label,tile,climate}` | `AreaId` string equality after lowercasing; `AREA_GEOMETRY` keyed by real `id` |
| Edge | `FleetAreaEdge{fromAreaId,toAreaId}` directed | `PrototypeEdge{a,b,passage?}` undirected | chart derives undirected view by deduping directed edges |
| Port | `FleetPort{id,name,areaId,capacity:number}` (`capacity=level`) | `PrototypePossession{id,name,area,at,owner,base}` | `capacity 1–10` → `base major≥7` kept in overlay mapper (`level>=7 ? "major":"minor"`) |
| Fleet | `FleetDivisionView{divisionId,fleetName,areaId,ships[]}` | `PrototypeFleet{id,name,area,owner,ships:number}` | `fleet.id` ↔ `divisionId`, `fleet.area` ↔ `areaId`, `ships.length` ↔ `ships:number` |
| Passage | N/A (engine-agnostic) | `PrototypePassage{id,name,kind:canal|strait,controller,open}` | passages remain chart-layer (`PASSAGES_BY_ID`) gating `EDGES`; future engine `route` closure surfaced as `open` flag in overlay |

No schema change to `areas.yaml` (`type: land|sea|coastal`, `controller?`) required.

## Verdict

Seam is `snapshot.world` (topology) ⨝ `AREA_GEOMETRY` (presentation) via `AreaId`, single `inspectFleetScreen` call sharing `joinWorldMap` helper, `public/coastline-10m.json` lazy asset at `10m` tier, undirected chart edges derived from directed engine edges. Misses fall back to label-only with dev warn. Ready to cite in spec acceptance criteria R-03.

