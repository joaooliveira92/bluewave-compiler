---
Type: task
Status: resolved
Blocked by: 02, 03
---

# 05 — Shell navigation & campaign integration: Fleet chart vs global MapSheet

## Question

Remove the **shell duplication** and wire the campaign flow: the same Admiralty chart now appears in two places — the new Fleet Movement central panel and the existing global `MapSheet` (F1 `Sheet side="right"` in `shell/MapSheet.tsx` that calls `bridge.campaign.execute("inspectMap", sessionId)` → `joinWorldMap`). Decide the integration so the human sees one chart system, not two.

Resolve (manual/task, HITL where shell affordance needs a human eye):

- **Reuse**: extract importable `FleetWorldMap` wrapper vs duplicating `WorldMapChart` props. Keep `usePrototypeCamera`, `projectionById`, `projectAreas`, `WORLD_WRAP_TURNS` shared. Ensure `window.bluewave` bridge (`shared/bridge-contract.ts`, `campaign-command-contract.ts`) is not forked — `inspectFleetScreen` and `inspectMap` share `LiveWorldMapOverlay` shape or are documented as distinct.
- **MapSheet fate**: keep F1 global sheet as a read-only world overview (dev-available sheet that still renders with `EMPTY_LIVE_OVERLAY` when no session), while Fleet's chart is the ordering surface. Decide whether selecting an area in Fleet also updates `MapSheet.state.selected` (shared `MapPrototypeState` or two states).
- **Registry**: `shell/campaign-screen-registry.tsx` — `MapPrototypeScreen` is `import.meta.env.DEV` throwaway, `FleetScreen` is prod (`CampaignScreen "fleet"`). Remove any dev-only gating on the Fleet chart; confirm `MAP_PROTOTYPE_SCREEN` deletion plan is unaffected (this folder remains throwaway per its README). Fleet chart must not import from `screens/map-prototype/` after promotion — imports must come from `components/world-map/`.
- **Session lifecycle**: `useFleetScreen` already does `bridge.campaign.execute("inspectFleetScreen", sessionId)` with `projectFleetScreen`/`acceptMovementCommand`; `MapSheet` does `inspectMap`. Decide refresh/coherence — one `loadScreen` refreshes both, or each owns its poll. Handle `sessionId:null` (sheet still renders fixture), `loadError` → `LoadErrorCard`.

Record the shell contract diff (which `campaign-screen-registry` union members, lazy imports, and `Bridge` commands change) — spec-ready, not code this sprint unless Notes override.

Blocked by `02` (layout decides wrapper seam) and `03` (overlay seam decides bridge).

## Answer

**Reuse:** new wrapper `FleetWorldMap.tsx` in `apps/desktop/src/renderer/components/world-map/FleetWorldMap.tsx` that **reuses** `WorldMapChart` (659 loc, already promoted from `variants/VariantAChart.tsx`). It forwards `state/route/overlay: LiveWorldMapOverlay/onSelect(campaignId)/onRuler/toggles` but filters `LAYERS` to movement-relevant and injects per-division route memo (01). Shared kernels extracted from `screens/map-prototype/` into `components/world-map/campaign-geometry.ts` (holds `AREA_GEOMETRY` join, `campaignNationHue/campaignNationLabel/joinWorldMap/fixtureAnchor`) and `components/world-map/projection.ts` (`projectionById/projectAreas/ringToPath/WORLD_WRAP_TURNS/projection widths`). `usePrototypeCamera` stays shared. No duplication of `coastline/graticule/control`. After 03, Fleet chart imports **only** from `components/world-map/`, not `screens/map-prototype/` — enforced by a lint rule added in spec (blocked import). Rejected: forking a second chart.

**Bridge:** `inspectFleetScreen` and `inspectMap` share **helper, not endpoint**. Both call the same `campaign-geometry.ts:joinWorldMap(AREA_GEOMETRY)` to build `LiveWorldMapOverlay{source, ownership:Map<AreaId,NationId>, ports, fleets, world?}`. Fleet's `useFleetScreen` stays single call `bridge.campaign.execute("inspectFleetScreen", sessionId)` → `FleetScreenProjection`; its overlay is derived locally without a second `inspectMap` IPC. `bridge-contract.ts / campaign-command-contract.ts` add no new command — `inspectFleetScreen` already exists (20-command surface from `desktop-mvp` ticket 09). Rejected: merging endpoints (would couple Fleet to global world).

**MapSheet fate:** keep `shell/MapSheet.tsx` F1 `Sheet side="right" w-3/4` as **read-only global overview** (dev-visible, still renders with `EMPTY_LIVE_OVERLAY` when `sessionId===null` so sheet is usable fixture). Fleet's chart is the **ordering surface** — selection state is separate: `Fleet` owns `selectedDivisionId/destinationAreaId`, `MapSheet` owns `MapPrototypeState:selected/rulerFrom/rulerTo/layers/centre`. No shared `selected` — selecting an area in Fleet does **not** update `MapSheet.state.selected` (two states, no sync bug). F1 is not stolen.

**Registry:** `shell/campaign-screen-registry.tsx` — `CampaignScreen "fleet"` stays prod (lazy `FleetScreen`, icon `Ship`, group `campaign`). `MapPrototypeScreen` stays `import.meta.env.DEV` throwaway behind the `if (import.meta.env.DEV)` spread, with its `?variant=` bar, per its `README.md` deletion plan (`rm -r screens/map-prototype/` + remove the `MAP_PROTOTYPE_SCREEN` const and union member) — unaffected. Fleet chart is never gated by `DEV`. No new union member, no lazy split for `FleetWorldMap` (it is inside `FleetScreen`).

**Session lifecycle:** `useFleetScreen:loadScreen()` (derived from `useCommandScreenWorkflow` + `projectFleetScreen/acceptMovementCommand/pendingRouteFor`) owns refresh for Fleet; `MapSheet:useEffect(inspectMap)` owns its own poll when session changes. Fleet's `Refresh` button calls only `loadScreen`; sheet independently refetches on `sessionId` change. Coherence is snapshot-anchored: both derive from same `CampaignSnapshot` revision (`state.revision` badge), so eventual drift is one `loadScreen` tick. `sessionId===null` → sheet fixture, Fleet shows `LoadingState`. `loadError!==null` → `LoadErrorCard onReload:loadScreen` (Fleet) / `EMPTY_LIVE_OVERLAY` (sheet). `requiresRefresh/pendingRequest` stays Fleet-only (bridge `RequestLifecycle`).

**Contract diff (spec-ready, no code this sprint):** `apps/desktop/src/shared/campaign-command-contract.ts` documents the shared `LiveWorldMapOverlay` helper; no new `command` string; `campaign-screen-registry.tsx` docs the `DEV` vs prod split and the `components/world-map/` import rule; `shell/MapSheet.tsx` docs two-state isolation.

