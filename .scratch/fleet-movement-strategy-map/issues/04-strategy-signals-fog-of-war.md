---
Type: grilling
Status: resolved
Blocked by: 01, 03
---

# 04 — Strategy signals & fog-of-war: what the chart must reveal

## Question

Decide **which signals the Fleet Movement chart surfaces in v1** and where fog-of-war is explicitly deferred — the readability choices that make the screen strategic instead of decorative.

Grill breadth-first (`/grilling` + `/domain-modeling`, HITL) across:

- **Ownership wash**: `areaControl()` → `nationFill(nation, alpha)` / `campaignNationHue` with `live` branch — translucent wash over `COASTLINE_POLYGONS`. In 1880 the signal is extreme (UK wash over `med_gibraltar`/`med_malta`/`sea_singapore`/`africa_cape`/… vs GER `ger_baltic_coast`/`ger_north_sea` home-only, per `docs/research/content-1-world-geography.md` §2). Decide opacity, contested hatching `6 4`, and whether `LAYERS.ownership` stays toggled or is always-on inside Fleet.
- **Passages** (Suez `sea_red_sea↔ott_eg_coast 160km` canal, straits): `EDGES.filter(edge.passage)` → midpoint circle `C/S` + dashed edge when closed (`strokeDasharray "5 4"`). Fleet Movement needs them because a route that crosses a closed passage is unusable. Decide always-on vs layer toggle.
- **Fleets / possessions**: `drawnFleets` rect + `ships` count and `drawnPorts` circles (`major 5`/`minor 3.5`, `strokeFor(owner)`). v1: **player divisions always**, allied maybe; enemy/neutral visibility is the fog boundary. Decide marker stacking, `camera.zoomBand >=2` label thinning, and whether neutral ports show.
- **Routes / adjacency**: `EDGES` vs `areaEdges` directed edges, graticule faint, gold `routePath` highlight. Whole-world vs adjacent-only — engine validates, so chart can show whole world faint + emphasize adjacent with thicker `strokeWidth 2`; decide whether to add a "hide non-adjacent" toggle.
- **Fog-of-war boundary**: three policies — always-visible, adjacent-only, concealed-with-intel. v1 gut is **player-only** (no enemy on chart) to avoid inventing B-2 spotting rules this sprint; record deferral in `Out of scope` and graduate via `Not yet specified` when spotting constants land. Name the deferred ticket.
- **Distance / legality cues**: `routes.yaml:distance` in tooltip ("→ Malta · 1400 km") vs edge label; no legality badge — the screen "never decides whether a route is adjacent, accessible, or otherwise legal" (`fleet-screen-state.ts` header).

Reference: `WorldMapChart.tsx:control/drawnPorts/drawnFleets/coastline/graticule/routePath`, `map-prototype-screen-state.ts:LAYERS`, `campaign-map-join.ts`, `federation`/`passages`.

Blocked by `01` (interaction determines signal hit) and `03` (overlay seam determines what ownership is joinable).

## Answer

**Domain grounding:** Fleet Movement is a **strategic ordering** screen over `FleetScreenView{divisions, areas, areaEdges, ports}` (engine truth) — not a tactical spotting screen. Signals are split by `LAYERS` in `map-prototype-screen-state.ts:LAYERS` as toggles, but Fleet Movement biases to **always-on for strategic essentials, toggle for inspection**.

### Decisions

- **Ownership wash — always-on, 0.18/0.36 α, no toggle in Fleet.** `areaControl()`→`nationFill/campaignNationHue` translucent wash over `COASTLINE_POLYGONS` at `α 0.18` idle, `0.36` selected, same `campaignNationHue` ramp as sheet. Contested hatching `6 4` retained when `control.contested`. In 1880 the wash is the primary strategic cue (UK `med_gibraltar/med_malta/sea_singapore/africa_cape` global vs GER `ger_baltic_coast` home-only) per `content-1-world-geography.md §2` — hiding it behind a toggle kills the geography read. Rejected: ownership as opt-in toggle (sheet default) — Fleet always shows it. Opacity pinned so `CHART.land` and `CHART.ink` labels still read.
- **Passages — always-on.** `EDGES.filter(passage)` midpoint `C/S` circle (`7px`, `open: oklch(0.28 0.03 245)/closed: oklch(0.36 0.11 25)`) + edge line (`open: 0.3 solid` / `closed: 0.55 dash 5 4`). Suez `sea_red_sea↔ott_eg_coast 160km canal` closed would invalidate any `indian_adden↔sea_mediterranean_c` route; a toggle would hide impassable. Rejected: passages as toggle.
- **Fleets / possessions — player fleets + player ports always-on, others deferred.** `drawnFleets` rect `22×16` (hit 28×28, selected glow per 01) and `drawnPorts` `major 5 / minor 3.5` with `strokeFor(owner)`. v1 shows **player divisions only** and **player ports only** (`ports.filter(nationId===playerSlotId)` from `buildFleetScreenView`). Allied/neutral/enemy fleets are **not rendered**. Allied ports maybe but deferred — at 88 ports total, neutral clutter drowns selection. Label thinning stays `camera.zoomBand>=2` for port names (same as prototype) and `big` area label `bounds>26000 or zoomBand>0`. Stacking is 01's `index%3*16`. Rejected: show all fleets (invents intel).
- **Routes / adjacency — whole-world faint + gold adjacent emphasis, no hide toggle in v1.** Engine validates adjacency (`routes.yaml:distance` is truth, chart never decides). Render all directed `areaEdges` as `stroke oklch(0.75/0.35) 0.9` faint; edges adjacent to `selectedDivision.areaId` render `strokeWidth 2 oklch(0.85 0.16 85)` gold (01's hint) and the committed/preview gold dashed line stays the ordering signal. `LAYERS.routes` stays true; no "adjacent only" hide toggle in v1 — a toggle would hide impassable but also hide long-range intent (player learns via rejection notice, not missing edge). Rejected: adjacent-only hide toggle (added only if later A/B shows clutter at 60 areas).
- **Fog-of-war — player-only in v1, explicitly deferred.** Policy: **no enemy fleet displayed**. Three policies evaluated: always-visible (dishonest without spotting), adjacent-only (implies B-2 spotting model), concealed-with-intel (needs M5 ECM). None is grounded today. So v1 is honest: "you see your fleets". Deferred ticket is `Not yet specified → "Enemy fleet visibility on Fleet chart"` to graduate when `b2-m2-movement-spotting` / `b5-m2-weather-visibility` spotting constants land. Recorded in map `Out of scope` as "Enemy intel concealment beyond player-only".
- **Distance / legality cues — tooltip only, no legality badge.** `routes.yaml:distance` surfaces in Fleet tooltip header per 01 (`→ ${areaName(neighbour)} · ${distance} km`), computed from compiled edge distance, fallback `nauticalMiles(label)` only when geometry fallback. No check/X legality badge — `FleetScreenState` docblock forbids it; submission rejection via `commandNotice` is the signal. Edge labels rejected (clutters at world scale). Spec will cite `FleetPort.capacity` and `MovementCommandStatus` vocabulary, not invented thresholds.

**Spec-ready acceptance:** Criteria will read "Ownership 0.18/0.36 always-on, passages always-on, player-only fleets/ports always-on, whole-world faint + gold adjacent, player-only fog, tooltip distance" with rejected toggle variants named.
