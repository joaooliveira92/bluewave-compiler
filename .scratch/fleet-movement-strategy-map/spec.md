# Fleet Movement — Map-First Strategy Screen

- **Sprint:** fleet-movement-strategy-map (`.scratch/fleet-movement-strategy-map/`)
- **Kind:** scoping → implementation (this document is the implementation spec produced by the wayfinding sprint; execution is via `to-tickets` vertical slices)
- **Governing docs:** `CONTEXT.md` (Nation / NationId / tag vocabulary), `docs/research/content-1-world-geography.md` (1880 ownership), `docs/research/fleet-movement-strategy-map-geometry-seam.md`, `docs/research/fleet-movement-strategy-map-camera-perf.md`, `prototype-02-layout.md`
- **Baseline:** Fleet Movement today is `FleetScreen` with `DivisionPicker` radio + `OrderSection` Select + `GeographyCard` 3-column text wall over `FleetScreenView` from `buildFleetScreenView` (areas/routes/ports) and `useFleetScreen` bridge (`inspectFleetScreen`/`submitMovementCommand`). Admiralty chart lives only as `WorldMapChart` inside the throwaway `screens/map-prototype` Sheet (`MapSheet` F1).
- **Target:** Replace the `GeographyCard` text wall with an embedded Admiralty-chart ordering surface — click area→destination, click fleet→division, hover tooltip, per-division route lines — while keeping engine determinism and campaign-shell coherence. Reach `IMPLEMENTED_VERIFIED` on `dev`.
- **Delivery contract:** `FleetScreenView` remains pure deterministic derivation over `CampaignSnapshot`; renderer never decides legality; bridge owns `MovementCommand` lifecycle.

---

## Problem Statement

Players order fleet movement from a text wall. `FleetScreen` shows divisions as radio cards, destinations as a flat Select dropdown, and geography as three comma-joined lists (`areas`, `edges`, `ports`) inside a `GeographyCard`. There is no spatial read: adjacency, passages (Suez), ownership washes, and fleet positions are invisible. The Admiralty chart that could provide that read (`WorldMapChart` with ocean/land/graticule, coastline, Miller projection, pan/zoom, wrapping) is isolated in a dev-only `MapSheet` global Sheet, not in the Fleet tab. Ordering intent is divorced from geography — a player cannot click the sea they intend to sail into, see which neighbours a division can reach, or see where their fleets and possessions actually sit. Strategy signals (UK global network vs GER home-only ownership, strait/canal gating) described in the 1880 research have no visual surface at order time.

## Solution

Promote the Admiralty chart into Fleet Movement as the primary ordering surface, wrapped as `FleetWorldMap` around the existing `WorldMapChart` (no fork). The Fleet tab becomes Map 2/3 | Drawer 1/3 on ≥1024px (stacked Map+Sheet on narrow), preserving the Admiralty palette (`ocean`/`land`/`graticule`/`ink`, floating toolbar) and `usePrototypeCamera` pan/zoom inside the tab. Clicking an area sets `destinationAreaId`; clicking a fleet marker selects that division (bidirectional with the Division strip); hover shows a pinned tooltip contract (name, controller, ports, stationed divisions, neighbours with passage+distance, pending); committed and preview route lines render per-division (gold dashed) correlated by `commandId`. Live topology comes from `snapshot.world` (areas/routes/ports/distances) joined to a promoted `AREA_GEOMETRY` presentation table by `AreaId`; coastline promotes from a 6 MB TS import to a lazy `public/coastline-10m.json` fetch. Strategy signals (ownership wash 0.18/0.36, passages C/S, player fleets/ports) are always-on; fog is honestly player-only in v1. The `OrderSection` Select remains as a keyboard/a11y fallback. The global `MapSheet` stays as a read-only overview with isolated selection state; both derive overlays via a shared `campaign-geometry` helper without a second IPC round-trip. Camera stays free-wheel, three-turn wrapping, and label LOD — verified viable inside a tab.

---

## User Stories

1. As a campaign player, I want to click a sea area on the chart to set my division's destination, so that ordering feels spatial rather than picking from a dropdown.
2. As a campaign player, I want any world area to be clickable (not just adjacent ones) with a gold adjacency hint, so that I can express long-range intent and learn via rejection notice rather than a missing option.
3. As a campaign player, I want clicking a fleet marker on the chart to select that division, so that the map and the Division strip stay in sync without a second state.
4. As a campaign player, I want selecting a division via the radio strip to highlight its marker on the chart, so that I always know which fleet I am ordering.
5. As a campaign player, I want a 28×28 hit zone on fleet markers (visual 22×16 rect) with a selected glow, so that markers are tappable on touch and readable when selected.
6. As a campaign player, I want multiple divisions sharing an anchor to stack with offset and a +N overflow, so that co-located fleets remain distinguishable.
7. As a campaign player, I want to hover any area and see its name, controller (or Unclaimed), ports, stationed player divisions, neighbours with passage tags and distances, and pending status, so that I can make informed movement decisions without leaving the chart.
8. As a campaign player, I want distance for each neighbour shown in the tooltip (from compiled route distance, fallback only when geometry missing), so that I can weigh range.
9. As a campaign player, I want a committed gold route line per division with a pending `submitted` command, so that I can audit which division owns which order.
10. As a campaign player, I want a fainter preview line from my selected division to the live destination, so that I can see what Submit will attempt before committing.
11. As a campaign player, I want hovering a committed route to highlight its row in the Movement Commands table (and vice-versa via `commandId`), so that I can correlate chart and list.
12. As a keyboard user, I want the Destination Select to remain as a fallback that writes the same `destinationAreaId` state as map clicks, so that ordering is reachable without a pointer.
13. As a keyboard user, I want Tab order Division strip → World map (role=application) → Order controls, with arrow keys cycling areas, Enter to set destination and Esc to clear, so that the chart is operable without a mouse.
14. As a screen-reader user, I want a live region announcing "Division X at Y, N ships. Destination Z. Pending … / No pending route", so that selection and intent are audible.
15. As a campaign player, I want ownership wash always visible (0.18 idle / 0.36 selected, contested hatch 6 4) so that the 1880 geography (UK global vs GER home-only) reads at order time.
16. As a campaign player, I want passages (canal C / strait S) always visible with open/closed styling (solid vs dashed 5 4) and midpoint badge, so that I can see why a strait blocks a route.
17. As a campaign player, I want to see my fleets and my ports always on the chart (major 5 / minor 3.5 with owner stroke), so that force disposition is immediate.
18. As a campaign player, I want the chart to show the whole world faint with gold emphasis on areas adjacent to my selected division, so that scope and hint coexist without a hide toggle.
19. As a campaign player, I want honest fog in v1 — only my fleets visible, no invented enemy intel — so that the screen does not misrepresent spotting.
20. As a campaign player, I want the Fleet tab to read as an Admiralty chart (ocean vignette, graticule, paper toolbar oklch 0.16/0.85) on the left with Order controls in a right drawer, so that the screen feels like a chart table, not a settings panel.
21. As a campaign player on a narrow viewport, I want the map stacked full-bleed with the drawer as a Sheet triggered by an Order button, so that ordering remains usable on small widths.
22. As a campaign player, I want to pan and zoom the chart inside the Fleet tab with free wheel and drag (drag suppresses click), so that I can inspect distant theatres without leaving the tab.
23. As a campaign player, I want world wrapping (west/home/east) so that fleets and polygons crossing the antimeridian remain coherent while panning.
24. As a campaign player, I want the global F1 MapSheet to remain as a read-only overview independent of Fleet selection, so that two charts do not fight over one selected state.
25. As a developer, I want Fleet chart imports to come from `components/world-map/` not `screens/map-prototype/`, so that the throwaway prototype can be deleted cleanly.
26. As a developer, I want missing chart geometry for a real `AreaId` to degrade to a label-only fallback with a dev warning, never a crash, so that new pack areas do not break the screen.
27. As a player, I want Submit / Replace / Cancel / Refresh to operate on the same `destinationAreaId` and revision guard as before, so that the ordering contract is unchanged.

---

## Implementation Decisions

- **Interaction — click area → destination (whole-world, hint-only):** Single click on any area path sets `useFleetScreen.destinationAreaId` (same `useState<string|null>` as today) so `submitMovementCommand`/`replaceMovementCommand` fire unchanged via `bridge.campaign.execute`. Shift-click follows prototype `pushRuler` ruler semantics as an optional measurement affordance, not the ordering path; future multi-hop `routeBetween` with passage respect is deferred (preview stays direct edge). Renderer never gates legality; `Button disabled` remains `busy || selectedDivision===null || destinationAreaId===null`. Visual adjacency hint: non-adjacent fill α 0.06 / stroke 0.9 oklch; adjacent to `selectedDivision.areaId` renders gold ring strokeWidth 2 oklch 0.85 0.16 85 via `areaEdges`. Rejected: adjacent-only picker (hides intent) and disabled wash (mis-privileges renderer).

- **Interaction — click fleet marker ↔ radio (single source of truth):** `selectedDivisionId` stays sole state in `useFleetScreen`; `DivisionPicker` radio value and `drawnFleets` markers are two views of it. Marker stays rect 22×16 rx3 with ships count, enlarged to 28×28 hit rect; selected adds `CHART.ink 2.5 + glow oklch 0.85 0.16 85 /0.35`; click suppressed when `camera.isDraggingRef.current`. Stacking at shared `areaId`: offset `(index%3)*16-16` for 1–3, 4th+ collapses to `+N` pill listing hidden `divisionId`s in its tooltip. `DivisionPicker` is not deleted in v1 — becomes compact 1-row filter strip above map (RadioGroup p-3 + `areaName(division.areaId)`). Rejected: anchored cards and immediate subsumption into markers.

- **Tooltip — pinned content contract (citable):** Built from live `FleetScreenView` at `labelAnchor` projected via `projectPoint`, rendered as React `absolute` (not SVG title, `pointerEvents:none` text layer). Contract:
  - title: `areas.find(id).name`
  - controller: snapshot area controller `NationId` → `campaignNationLabel`/`nationFill` (null → "Unclaimed")
  - ports: `ports.filter(areaId)` → `name (level/capacity)` with `FleetPort.capacity = port.level`
  - stationed: `divisions.filter(areaId)` → `fleetName · divisionId · ships.length` (player-only v1; enemy deferred)
  - neighbours: `areaEdges.filter(from===id||to===id)` → `→ name` + passage `C/S` + `open/closed` + compiled distance km (fallback nauticalMiles of labels)
  - pending: `pendingRouteFor` → `pending from→to (submitted r{revision})` when any division here has status submitted.
  Rejected: edge-label distance on lines.

- **Pending route lines — per-division, preview vs committed:** Current single-global `routePath` is replaced. Committed: for each `divisionId` with `pendingRouteFor !== null`, render gold line `from→to` as dark under-stroke `oklch 0.2 6 round` + gold over-stroke `oklch 0.85 0.16 85 2.5 dash 10 6 round` (one per division, multiple gold lines allowed, matches `MovementCommandsTable` row). Preview: for selected division when `destinationAreaId !== null && !== division.areaId` and no committed line already equals that toAreaId, render fainter preview same dash `opacity 0.55 width 2` no under-stroke, straight `M…L…` between label anchors (honest direct-edge preview; multi-hop `routeBetween` deferred). Hover correlation via shared `commandId`.

- **Fallback & a11y — Select stays:** `OrderSection` Select stays in v1 as keyboard/a11y fallback, `value === destinationAreaId`, `onValueChange === setDestinationAreaId`. Tab order: Division strip (radio) → WorldMapChart `role=application aria-label="World map"` → OrderSection (Destination, Submit, Replace/Cancel, Refresh). Within chart, arrow keys cycle `areas` insertion order (sorted id from `buildFleetScreenView`), Enter sets destination, Esc clears. Live region under OrderSection announces division fleetName/divisionId/areaName/ships/destination/pending. Map does not steal F1. Rejected: ARIA grid and immediate Select removal.

- **Batch orders — deferred:** Single-selection only; `submitMovementCommand` is per-division with `transportRequestId`/`expectedRevision`/`commandNotice`. No "Issue to selected" batch button in v1 (would promise atomic batch the engine lacks). Graduates when `fleetCommands` offers a batch envelope.

- **Layout & visual language — Map 2/3 | Drawer 1/3, Admiralty preserved:** Desktop ≥1024px FleetScreen is Map left 2/3 (`WorldMapChart` with `CHART.ocean` oklch 0.19, `oceanDeep` vignette, `land` 0.30, graticule, ink, floating `left-3 top-3` toolbar oklch 0.16/0.85) | Drawer right 1/3 (Destination Select, ships/pending meta, Submit/Replace/Cancel, Refresh/Retry, MovementCommandsTable, notice live region). Division strip is compact 1-row scroll above map. Narrow <1024px stacks Map ~360px full-bleed + Drawer as Sheet triggered by Order button; DivisionPicker collapses to 2-col grid. `GeographyCard` 3-col `areas.join/edges.join` Card is retired; empty states kept (`divisions.length===0` → strip Empty "No player division"; total geometry miss → map chrome Empty "No chart geometry", unreachable with 1880 pack). Toolbar fits tab and wraps at 220.

- **Reuse vs fork — wrapper, not fork:** `FleetWorldMap` wrapper in `components/world-map/` forwards `state/route/overlay/onSelect/onRuler` to `WorldMapChart` (659 loc, already promoted from `variants/VariantAChart`), filtering `LAYERS` to movement-relevant `{ownership, routes, passages, possessions, fleets, labels}` all true by default (`initialMapPrototypeState`) and injecting per-division route memo. No duplication of `coastline/graticule/control/routePath`. Imports for Fleet chart must come from `components/world-map/` after promotion; `screens/map-prototype/` imports are lint-blocked. Rejected: second chart fork.

- **Live data contract & geometry promotion — snapshot canonical, join table:** `snapshot.world` is canonical for IDs/adjacency/distances (`areas` id/name sorted, `areaEdges` directed from/to, `ports` filtered by `playerSlotId` with `capacity=level`). Chart geometry is presentation keyed by `AreaId`. Introduce `AREA_GEOMETRY: Record<AreaId,{ring: [lon,lat][], label: [lon,lat], tile?: [col,row]}>` with unprojected lon/lat so `projectionById/ringToPath` stay render-time and projection remains a toggle. Directed engine edges derive undirected chart edges at memo time (dedup + attach `passage` when pair matches `PASSAGES_BY_ID`). Port level→base mapping `level>=7 major 5 else minor 3.5` lives in overlay mapper; fleet `divisionId↔fleet.id`, `areaId↔area`, `ships.length↔ships` alignment pinned. Missing geometry falls back to label-only at 0,0 with dev `console.warn` and translucent wash `oklch 0.55/0.08` — never crash, never blank, graduates when authored.

- **Bridge — share helper, not endpoint:** No new `bridge.campaign.execute` command. `inspectFleetScreen` and `inspectMap` share extracted helper `campaign-geometry` (`joinWorldMap`/`fixtureAnchor`/`campaignNationHue`/`campaignNationLabel` + `EMPTY_LIVE_OVERLAY`) promoted from `campaign-map-join` into `components/world-map/`. `useFleetScreen` does single `inspectFleetScreen → FleetScreenProjection` call; its `LiveWorldMapOverlay{source, ownership:Map<AreaId,NationId>, ports, fleets, world?}` for the chart is derived locally via same `joinWorldMap(AREA_GEOMETRY)` without a second IPC. Hue ramp is single `campaignNationHue` so `nationFill`/`strokeFor` match across Sheet and Fleet. Rejected: merging endpoints.

- **Coastline asset promotion — lazy JSON, no runtime geo:** `prototype-coastline` 5.9 MB TS source (Natural Earth 1:10m, public domain) is dev-only. Promote to fingerprinted `public/coastline-10m.json` (10m tier; 110m goes polygonal at `MAX_SCALE 14 ~1:1.5M`) lazy `fetch` singleton `json()` cached in module, not `import`. Output stays unprojected lon/lat. No `d3-geo`/`topojson-client` runtime; 40-line TopoJSON arc decoder stays in `bake-coastline.ts`. Author-time bake remains `pnpm tsx bake-coastline.ts 10m`. Expected delta: ~5–6 MB removed from renderer chunk (measure `du -h apps/desktop/dist` before/after).

- **Strategy signals & fog — always-on essentials, player-only fog:** Ownership wash always-on α 0.18 idle / 0.36 selected with contested hatch 6 4 via `areaControl→nationFill/campaignNationHue`; same ramp as sheet. Passages always-on: `EDGES.filter(passage)` midpoint C/S circle 7px (`open oklch 0.28 / closed 0.36 0.11 25`) + edge `open 0.3 solid / closed 0.55 dash 5 4`; Suez `sea_red_sea↔ott_eg_coast 160km canal` closure gating is visible. Fleets/ports player-only: `drawnFleets` rect + `drawnPorts` major/minor with `strokeFor(owner)`, filtered by `playerSlotId`; allied/neutral/enemy fleets and neutral ports not rendered in v1. Routes: whole-world faint `oklch 0.75/0.35 0.9` + gold adjacent `width 2 oklch 0.85 0.16 85` + per-division gold lines as ordering signal; no adjacent-only hide toggle in v1; `LAYERS.routes` stays true. Fog policy is player-only; enemy visibility deferred to a spotting-gated follow-up when `b2-m2-movement-spotting`/`b5-m2-weather-visibility` constants land. Distance surfaces only in tooltip; no legality badge (renderer never decides; `commandNotice` is the rejection signal). Label thinning stays `bounds>26000` big + `zoomBand>=1` all / `>=2` port names. Rejected: ownership/passage toggles and enemy-always-visible.

- **Shell navigation — two states, wrapper reuses chart:** `FleetWorldMap` wrapper reuses `WorldMapChart` with shared `usePrototypeCamera`, `projectionById`, `projectAreas`, `ringToPath`, `WORLD_WRAP_TURNS`, `graticule`. `MapSheet` F1 `Sheet side="right" w-3/4` stays read-only global overview (renders with `EMPTY_LIVE_OVERLAY` when `sessionId===null`, fixture usable); Fleet chart is the ordering surface. Selection state is isolated: Fleet owns `selectedDivisionId/destinationAreaId`; `MapSheet` owns `MapPrototypeState{selected,rulerFrom,rulerTo,layers,centre}` — selecting in Fleet does not update `MapSheet.state.selected`. Registry: `campaign-screen-registry` `CampaignScreen "fleet"` stays prod (`Ship` icon, `campaign` group, lazy `FleetScreen`); `MapPrototypeScreen` stays `import.meta.env.DEV` throwaway behind spread with `?variant=` bar, deletion plan `rm -r screens/map-prototype/` unaffected; Fleet chart is never `DEV`-gated; no new union member; `FleetWorldMap` is inside `FleetScreen` (no extra lazy split). Refresh: `useFleetScreen:loadScreen()` owns Fleet refresh (Refresh button calls only `loadScreen`); `MapSheet:useEffect(inspectMap)` owns its poll on `sessionId` change; coherence is `revision` (badge)-anchored, one tick drift, `loadError→LoadErrorCard onReload:loadScreen` (Fleet) / `EMPTY_LIVE_OVERLAY` (Sheet), `requiresRefresh/pendingRequest` Fleet-only.

- **Performance & camera inside tab — Go with guardrails:** `usePrototypeCamera` is ref-based (`scale/x/y` in ref, `worldRef transform` direct) so drag never re-renders `WorldMapChart`; only `zoomBand 0|1|2` (thresholds `[1.8,4]`) hits React. Spec pins `MAX_SCALE 14`, `MIN_SCALE 0.9`, `ZOOM_BANDS [1.8,4]`, `bounds>26000` big cull, `WORLD_WRAP_TURNS` 3× (west/home/east) rendering every layer three times so markers wrap with polygons (fix prior bug: polygons 3×, labels 1× → now consistent 3×), `WORLD_WRAP_TURNS` translate by `turn*width`. At 36 areas ~760 nodes, 60 areas ~1200–1400 nodes, order-of-magnitude under ~8k degradation. `projectAreas`/`coastline` memoised; only `transform` mutates per frame; `getScreenCTM()` keeps pan under cursor at ~640×400 tab pane with `preserveAspectRatio xMidYMid meet` kept. Wheel is free via manual `addEventListener("wheel",{passive:false})` (`preventDefault` under Electron; React `onWheel` passive cannot), `isDraggingRef` still suppresses `handleAreaClick`; pinch retained. Graticule `lat ±60 30°, lon 30°` + toolbar fits tab. Coastline is `fetch` singleton lazy at 10m tier. Re-measure `du -h dist`.

---

## Testing Decisions

- **What makes a good test:** Test external behavior at the highest seam possible, not implementation detail. Prefer one deterministic seam per feature: the Fleet ordering seam (`useFleetScreen` + `FleetScreenView` + `FleetWorldMap` rendering) over unit-testing internal projection helpers where an integration assertion covers them. Assert what the player can observe (selected destination, marker selection, tooltip, route line, a11y announcement) or what the bridge sends (`submitMovementCommand` payload, `pendingRouteFor` correlation), not CSS class names or SVG path string shape beyond the contract (dash 10 6, stroke widths, opacity 0.55 as stated are part of the contract and are asserted). Existing campaign-engine pure tests remain pure; desktop renderer tests drive the hook via a mocked `window.bluewave` bridge (no Electron).

- **Seams (preferred → fallback):**
  1. **Fleet ordering seam (primary, highest):** `useFleetScreen` hook + `FleetScreen` render + `FleetWorldMap`/`WorldMapChart` props. Proves click area → `destinationAreaId`, click marker ↔ radio, tooltip content, per-division committed/preview lines, Select fallback sync, live region, empty states, and bridge payloads. Most user stories prove here.
  2. **Geometry-join seam:** `campaign-geometry` helper (`joinWorldMap` over `AREA_GEOMETRY`, directed→undirected edge derivation, missing-geometry fallback, level→base mapping). Proves live snapshot ⨝ presentation without rendering.
  3. **Camera seam:** `usePrototypeCamera` + `WorldMapChart` wiring (ref-based transform, `zoomBand` thresholds, `isDraggingRef` click suppression, 3× wrap). Proves tab viability without pixel tests.

  No new low-level projection seam is introduced; `projectionById`/`ringToPath` are exercised through seam 1.

- **Modules under test:**
  - `useFleetScreen` / `fleet-screen-state` (selection, destination, pendingRouteFor, submit/replace/cancel/refresh flows)
  - `FleetScreen` + `FleetWorldMap` + `WorldMapChart` (click/hover, markers, stacking, route lines, wash/passages, graticule/toolbar, empty states)
  - `campaign-geometry` / campaign-map-join promotion (join table, edge conversion, coastline lazy loader)
  - `usePrototypeCamera` (scale bands, transform, drag suppression, wheel handler)
  - `shell/MapSheet` vs `FleetWorldMap` isolation (two states, no cross-update), `campaign-screen-registry` dev/prod split

- **Prior art reused:**
  - `fleet-screen-state.test.ts` (pure `FleetScreenView` + `pendingRouteFor` over fixture snapshot) and `FleetScreen.test.tsx` patterns for hook+Bride mock tests
  - `WorldMapChart` prototype interaction tests (if present) and `MapSheet` bridge-mock tests for overlay derivation
  - `campaign-engine/src/fleet.test.ts` for `buildFleetScreenView` via `snapshot.world`
  - Desktop `pnpm -w turbo run build --force`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test:run` as contract gates (no new harness)

- **Key proving cases (map to user stories, non-exhaustive):**
  - Click any area sets `destinationAreaId`; Submit sends `{divisionId, fromAreaId: division.areaId, toAreaId: clickedAreaId}`; Submit disabled until both selected; Replace/Cancel flows unchanged
  - Whole-world selectable: clicking non-adjacent still sets destination; gold ring only on adjacent edges; no client-side adjacency rejection
  - Click marker selects division and checks radio; select radio highlights marker with glow; hit rect 28×28 present; dragging suppresses `handleAreaClick`
  - Stacking: 2–3 co-located divisions render with offset, 4th+ shows `+N` pill with tooltip listing hidden ids
  - Tooltip for area shows controller (or Unclaimed), ports `level/capacity`, stationed divisions, neighbours with `C/S open/closed` and `km`, pending row when `submitted`
  - Committed line per division with pending; preview fainter for selected division; hover correlation by `commandId`; no preview when equals committed destination
  - Select fallback value syncs with map clicks; a11y tab order and arrow/Enter/Esc within chart; live region text matches contract
  - Ownership wash 0.18/0.36 always-on, contested hatch 6 4; passages always-on C/S with open/closed edge styles; player-only fleets/ports; whole-world faint + gold adjacent
  - Missing geometry renders label-only at 0,0 with dev warn and translucent wash; does not crash
  - Coastline lazy fetch `fetch("/coastline-10m.json")` singleton, no TS import in bundle; dist delta measured
  - `WORLD_WRAP_TURNS` 3× renders west/home/east; `MAX_SCALE 14`, `MIN_SCALE 0.9`, `ZOOM_BANDS [1.8,4]`, `bounds>26000`, `zoomBand≥2` port labels
  - `MapSheet` selection does not follow Fleet selection and vice versa; `campaign-screen-registry` prod `fleet` vs `DEV` `map-prototype` remains; `components/world-map/` lint blocks `screens/map-prototype/` imports from Fleet
  - Determinism: `buildFleetScreenView`/`FleetScreenProjection` remain pure; repeated renders of same snapshot produce identical areas/edges/ports

---

## Out of Scope

- Gunnery, armor/damage, weather/visibility, smoke, ECM, and battle-resolution phase wiring (later M2/M3 sprints)
- Construction, diplomacy/treasury/research screens, and battle tactical sandbox
- Pack geography authoring (new area additions, route rebalancing, capacity tuning) — `content/production/1880` YAML is stable input; geometry work is chart promotion (this spec) only
- Packaging/distribution — `pnpm dev` remains distribution for this effort
- Enemy/neutral/allied fleet rendering and concealment beyond explicit player-only v1 — deferred to a spotting-gated follow-up (graduate when B-2/B-5 spotting constants land); no adjacent-only or concealed-with-intel variant in v1
- Batch/multi-select ordering (checkboxes, "Issue to selected") — deferred until `fleetCommands` offers a batch envelope
- Multi-hop preview `routeBetween` with passage respect — v1 preview is honest direct edge; full pathfinding graduates after this spec
- `GeographyCard` 3-col text retention — retired (replaced by map); only empty states are kept
- `d3-geo`/`topojson-client` runtime — rejected (keep 40-line decoder in bake)
- Merging `inspectFleetScreen` and `inspectMap` into one endpoint — rejected (share helper only)
- Adjacent-only hide toggle, ownership/passage toggles, and legality badges/X — rejected for v1
- Forking a second chart component — rejected (wrapper reuses `WorldMapChart`)

---

## Further Notes

- **Branch & tracker:** `dev` branch; tracker is local Markdown `.scratch/fleet-movement-strategy-map/` with `map.md` + `issues/01..06` all `resolved`. This spec is `.scratch/fleet-movement-strategy-map/spec.md`; index pointer is `.ai/specs/fleet-movement-strategy-map.md` (index, not store). Ready for `to-tickets` vertical slicing into `issues/INC-*.issue.md` with `Blocked by:` frontier edges.

- **Research grounding:** `docs/research/fleet-movement-strategy-map-geometry-seam.md` (join table, coastline promotion, bridge helper), `docs/research/fleet-movement-strategy-map-camera-perf.md` (tab viability, thresholds), `docs/research/content-1-world-geography.md` (UK global vs GER home-only ownership), prototype artifact `prototype-02-layout.md` (throwaway ASCII verdict; to be removed after its ticket closes).

- **Domain language:** Use `CONTEXT.md` vocabulary throughout — `Nation`/`NationId` (canonical `uk`, `germany`), `tag` (presentation `GBR`), `ContentPack` compiled artifact. `FleetArea`/`FleetAreaEdge`/`FleetPort`/`FleetDivisionView`/`MovementCommand`/`MovementCommandStatus` as in `fleet-contract`/`FleetScreenProjection`.

- **Engineering contract:** Fleet screen never decides legality; `FleetScreenView` is pure deterministic derivation; bridge `inspectFleetScreen`/`inspectMap` share `LiveWorldMapOverlay` helper; lint enforces `components/world-map/` import rule; coastline singleton fetch; renderer chunk measured via `du -h apps/desktop/dist`.

- **Traceability:** Tickets 01..06 map 1:1 to sections above — 01→Interaction, 02→Layout/wrapper, 03→Data contract/geometry promotion, 04→Signals/fog, 05→Shell/navigation, 06→Performance/camera. Not-yet-specified items cleared in tickets are now pinned in this spec (breakpoint ≥1024, player-only fog, 10m tier, strip-not-subsumed, tooltip-only distance, free wheel, 3× wrap).

- **Deletion plan for prototype:** `screens/map-prototype/` remains throwaway per its README; this spec does not delete it — removal (`rm -r screens/map-prototype/` + `MAP_PROTOTYPE_SCREEN` const/union) is a later dev-only cleanup, not part of this increment.

- **Risk with mitigation:** Largest bundle risk (coastline) is mitigated by lazy JSON; largest interaction risk (world-size faint clutter) is mitigated by gold adjacent emphasis + per-division lines without a hide toggle (A/B later if needed); largest shell risk (two charts fighting) is mitigated by two-state isolation and single `inspectFleetScreen` call.

