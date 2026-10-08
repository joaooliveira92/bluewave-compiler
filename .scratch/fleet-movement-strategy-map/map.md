## Destination

A reviewed spec + decision set for a **map-first Fleet Movement screen** — the garbage `GeographyCard` text wall replaced by an embedded Admiralty-chart map (click area → destination, click fleet → division, hover tooltip, pending route line), strategy signals (ownership wash, passages, player fleets/ports) surfaced on the chart, live topology from the compiled `1880` snapshot (`areas`/`routes`/`ports`) joined to chart geometry, and campaign-shell navigation resolved — **ready for `to-tickets` vertical slicing**. No code is shipped in this wayfinding effort.

## Notes

- Domain: `apps/desktop` Fleet screen (`FleetScreen.tsx`, `fleet-screen-state.ts`, `@bluewave/campaign-engine` `buildFleetScreenView`) + 1880 world (`content/production/1880/areas.yaml`, `routes.yaml`, `ports.yaml`) + Admiralty chart (`components/world-map/WorldMapChart.tsx`, `screens/map-prototype/prototype-world.ts`, `prototype-coastline.ts`, `prototype-projection.ts`, `usePrototypeCamera.ts`, `MapSheet` F1 sheet).
- Research grounding: `docs/research/content-1-world-geography.md` (1880 ownership — UK global network vs GER/ITA/JPN home-only), `content-0-content-map.md`, `packages/campaign-engine/src/fleet.ts`.
- Skills every session should consult: `grilling` + `domain-modeling` for grilling tickets; `research` for research tickets; `prototype` for prototype tickets. One decision ticket per session (wayfinder rule); research tickets may run in parallel via `/research` subagents.
- Engineering contract: Fleet screen never decides adjacency/legality (engine does); `FleetScreenView` is pure deterministic derivation over `CampaignSnapshot`; bridge `inspectFleetScreen`/`inspectMap` share `LiveWorldMapOverlay` where possible.
- Branch: `dev`. Tracker: `.scratch/` local markdown (`Type:`/`Status:`/`Blocked by:` front-matter, `wayfinder:map` label on this file).

## Decisions so far

- [01 — Interaction model: click-to-order on the chart](issues/01-interaction-model.md) — click area→destination (whole-world, gold adjacency hint, engine validates), click marker↔radio with 28×28 hit & stacking, pinned Fleet tooltip contract, per-division committed (gold 10 6) + preview (0.55) route lines, Select stays as a11y fallback, batch deferred.
- [02 — Visual language & layout: Admiralty chart inside Fleet Movement](issues/02-visual-language-layout.md) — `FleetScreen` = Map 2/3 | Drawer 1/3 (≥1024, narrow stack+Sheet), Admiralty palette preserved, `FleetWorldMap` wrapper reuses `WorldMapChart` (not a fork), `GeographyCard` 3-col text retired, camera pan/zoom kept inside tab with 3-turn antimeridian. Artifact: `prototype-02-layout.md`.
- [03 — Live data contract & chart-geometry promotion](issues/03-live-data-contract-geometry-promotion.md) — `snapshot.world` canonical, `AREA_GEOMETRY` join table by `AreaId`, missing→label-only, directed→undirected edges, single `inspectFleetScreen` + shared `campaign-geometry.ts` helper, coastline 5.9 MB TS → `public/coastline-10m.json` lazy fetch (10m tier, no d3-geo). Note: `docs/research/fleet-movement-strategy-map-geometry-seam.md`.
- [04 — Strategy signals & fog-of-war](issues/04-strategy-signals-fog-of-war.md) — ownership 0.18/0.36 always-on (hatch 6 4), passages always-on (C/S), player-only fleets/ports (major 5/minor 3.5), whole-world faint + gold adjacent (no hide toggle v1), player-only fog deferred, tooltip distance only.
- [05 — Shell navigation & campaign integration](issues/05-shell-navigation-integration.md) — `FleetWorldMap` wrapper reuses `WorldMapChart`, `campaign-geometry.ts` shared helper for `joinWorldMap`, single `inspectFleetScreen` call, `MapSheet` F1 stays read-only global overview (two separate `selected` states), `campaign-screen-registry` prod `"fleet"` vs `DEV` throwaway `map-prototype`, `components/world-map/` import rule + lint, session refresh isolated via `loadScreen`.
- [06 — Performance & camera inside Fleet tab](issues/06-performance-camera-ux.md) — **Go** with ref-based camera, free wheel (`passive:false`), `preserveAspectRatio xMidYMid meet`, `ZOOM_BANDS [1.8,4]`, `bounds>26000` big cull, `WORLD_WRAP_TURNS` 3× (~760→~1400 nodes <8k), `public/coastline-10m.json` lazy 10m tier, no d3-geo. Note: `docs/research/fleet-movement-strategy-map-camera-perf.md`.

## Not yet specified

- ~~Exact responsive breakpoint and drawer-vs-side-panel layout for Order/Division alongside the map (desktop 2/3-1/3 vs mobile full-bleed + Sheet) — graduates after 02.~~ → **decided in 02:** ≥1024 Map 2/3|Drawer 1/3, narrow stacked Map+Sheet; palette/toolbar `oklch(0.16/0.85)` preserved.
- ~~Fog-of-war policy for enemy fleet visibility on the Fleet chart (adjacent-only vs always-visible vs concealed) — tied to B-2 spotting constants, deferred after 04.~~ → **decided in 04:** player-only in v1; enemy deferred to later spotting-gated ticket (no enemy fleet rendered).
- ~~Coastline asset format and lazy-load trigger (fingerprinted `public/coastline-10m.json` vs binary, prefetch vs on-demand) — graduates after 03/06.~~ → **decided in 03:** `public/coastline-10m.json` lazy fetch (10m tier), `bake-coastline.ts` retained, no runtime geo dep.
- ~~Whether `DivisionPicker` radio cards survive as a filter strip or are fully subsumed by fleet markers — graduates after 01/02.~~ → **decided in 01:** strip stays as compact 1-row filter above map in v1; full subsumption deferred to 02.
- ~~Distance labeling on routes (tooltip "via X · 1700 km" vs edge label) — graduates after 03.~~ → **decided in 03:** distance in tooltip only (via routes.yaml), not edge label.

## Out of scope

- Gunnery (B-3), armor/damage (B-4), weather/visibility (B-5), smoke/M3, ECM/M5, and `battle_resolution` phase wiring (B-6) — later M2/M3 sprints.
- Construction screen, diplomacy/treasury/research screens, and battle tactical sandbox.
- Packaging/distribution — `pnpm dev` remains distribution for this effort.
- Enemy intel concealment beyond the explicit "player-only in v1" deferral recorded in 04 — returns via fog-of-war ticket if destination redrawn.
- `content/production/1880` YAML geography authoring (area additions, route rebalancing) — assumed stable input; schema geometry work lives in chart promotion.

