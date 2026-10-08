# INC-6 — Shell isolation, camera guardrails & integration verification

**Type:** implementation
**Status:** open
**Blocked by:** INC-4, INC-5
**Frontier:** no

**What to build:** The integration that makes two Admiralty charts coexist and proves the tab is viable: isolated selection, registry, ref-based camera, wrapping, and final verification.

**Spec:** `.scratch/fleet-movement-strategy-map/spec.md` (Shell navigation; Performance & camera; User Stories 22–24; Further Notes)

## Acceptance

- [ ] `MapSheet` F1 `Sheet side="right" w-3/4` stays read-only global overview rendering with `EMPTY_LIVE_OVERLAY` when `sessionId===null` (fixture usable); Fleet chart is ordering surface; selection isolated: Fleet `selectedDivisionId/destinationAreaId` does not update `MapSheet.state.selected/rulerFrom/rulerTo/layers/centre` and vice-versa.
- [ ] `campaign-screen-registry` prod `CampaignScreen "fleet"` (Ship, campaign group, lazy `FleetScreen`) vs `DEV` throwaway `MapPrototypeScreen` (`import.meta.env.DEV` spread, `?variant=` bar) preserved; Fleet never `DEV`-gated; no new union member; `FleetWorldMap` inside `FleetScreen` (no extra lazy split); `screens/map-prototype/` deletion plan documented, not executed this increment.
- [ ] Refresh coherence: `useFleetScreen:loadScreen()` owns Fleet (Refresh button → `loadScreen` only); `MapSheet:useEffect(inspectMap)` owns its poll on `sessionId` change; both anchored to `revision` badge, one-tick drift, `loadError→LoadErrorCard onReload:loadScreen` (Fleet) / `EMPTY_LIVE_OVERLAY` (Sheet), `requiresRefresh/pendingRequest` Fleet-only.
- [ ] Camera guardrails pinned: `MAX_SCALE 14`, `MIN_SCALE 0.9`, `ZOOM_BANDS [1.8,4]`, `bounds>26000` big cull, `WORLD_WRAP_TURNS` 3× west/home/east (every layer three times via `turn*width`, markers wrap with polygons — fix prior 3× polygons / 1× labels bug), `preserveAspectRatio xMidYMid meet`, `getScreenCTM()` pan under cursor at ~640×400 tab, ref-based `scale/x/y` + `worldRef transform` (drag never re-renders chart, only `zoomBand` 0|1|2 hits React), `projectAreas`/`coastline` memoised.
- [ ] Wheel free via `addEventListener("wheel",{passive:false})` `preventDefault` (React `onWheel` passive cannot in Electron); `isDraggingRef` suppresses `handleAreaClick`; pinch retained; graticule `lat ±60 30° lon 30°` + toolbar `left-3 top-3` fits tab (wraps at 220); coastline `fetch` singleton from INC-1 lazy, 10m tier.
- [ ] Scale budget verified: 36 areas ~760 nodes, 60 areas ~1200–1400 nodes, order-of-magnitude under ~8k degradation; `du -h apps/desktop/dist` delta re-measured in this ticket.
- [ ] Tests at shell + camera seams: two-state isolation, registry prod/DEV, wheel/drag/camera bands, 3× wrap, plus full `pnpm -w turbo run build --force && pnpm typecheck && pnpm lint && pnpm test:run` green.

## Notes

This is the integration ticket — block it on both signal and route-line tracks. Keep `screens/map-prototype/` throwaway (no deletion here). Document `components/world-map/` import rule in lint config.
