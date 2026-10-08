---
Type: prototype
Status: resolved
Blocked by: 01
---

# 02 — Visual language & layout: Admiralty chart inside Fleet Movement

## Question

Raise fidelity with a **throwaway prototype** that locks the visual language and layout of the map-first Fleet Movement screen — the "how should it look" question that `01-interaction-model`'s decisions will hang behaviour on.

Build one cheap artifact (Figma export, single `FleetWorldMap.tsx` wrapper, or `prototype/screens/fleet-map/` stub — use `/prototype` skill, link asset) that shows:

- **Chart inside Fleet, not beside it**: Fleet screen as `Map (left ~2/3) + Order+Division drawer (right ~1/3)` on ≥1024px, stacked map-on-top on narrow. Chart uses its own palette (`CHART.ocean` `oklch(0.19…)`, `land`, `graticule`, `ink` — the paper-chart independence noted in `WorldMapChart.tsx` header) so it reads as a chart, not another panel of the app theme. Decide placement of legend/toolbar (floating `absolute left-3 top-3` vs docked).
- **Reuse vs divergence**: `WorldMapChart` already promoted from `variants/VariantAChart.tsx` — wrapper `FleetWorldMap` that forwards `state/route/overlay/onSelect/onRuler` but filters `LAYERS` to movement-relevant (ownership, routes, passages, possessions, fleets, labels) vs forking a second chart component. Show the tradeoff.
- **`GeographyCard` fate**: text wall `grid sm:grid-cols-3` with `areas.join(", ")` / `edges.join(" ↔ ")` retired — but empty/0-areas `Empty` state retained somewhere (keep `Card` fallback for `divisions.length===0`).
- **Projection & camera**: keep `PROJECTIONS` toggle + `usePrototypeCamera` pan/zoom inside the Fleet tab (deliberate — the chart is interactive even inside a tab) vs locked camera. Show `WORLD_WRAP_TURNS` three-turn antimeridian strategy is preserved.
- **Division affordance on chart**: fleet rect marker vs anchored card — evaluate hit target and stacking when 2–3 divisions share `areaId`.

Prototype is disposable; the decision record is the deliverable. Link the asset from the ticket. Blocked by `01` because interaction choices (click target, preview line) dictate what the prototype must demonstrate.

### Acceptance

- Linked throwaway artifact + one-paragraph verdict for each bullet (kept vs discarded variant noted).
- `Not yet specified` entry for breakpoint/drawer choice cleared or refined.

## Answer

**Artifact:** `.scratch/fleet-movement-strategy-map/prototype-02-layout.md` (throwaway ASCII + verdict, 46 lines). Keeps the glossary: `FleetWorldMap` wrapper around `WorldMapChart`, not a fork.

Verdict per bullet:

- **Chart inside Fleet, not beside it:** `FleetScreen` becomes `Map left 2/3 | Drawer right 1/3` on ≥1024px (Division strip compact 1-row above map, Order drawer right with Destination select + Submit/Replace/Cancel + MovementCommandsTable), stacked `Map ~360px + Drawer Sheet` on narrow. Chart keeps its own Admiralty palette (`CHART.ocean oklch(0.19)`, `CHART.oceanDeep`, `land 0.30`, `graticule`, `ink` vignette, floating `left-3 top-3` toolbar `oklch(0.16/0.85)`) — deliberate chart-read per `WorldMapChart.tsx` header. Rejected: chart as global sheet only (F1 stays but is read-only overview) and chart-as-theme panel (kills paper-chart affordance).
- **Reuse vs divergence:** wrap `WorldMapChart` as `FleetWorldMap` forwarding `state/route/overlay/onSelect/onRuler` and filtering `LAYERS` to `ownership, routes, passages, possessions, fleets, labels` (all true, as `initialMapPrototypeState`). Wrapper injects per-division route memo (from 01) and does not duplicate `coastline/graticule/routePath/control`. Rejected: second chart fork (duplicates 659 loc, drifts palette). Imports must move off `screens/map-prototype/` after 03 → `components/world-map/campaign-geometry.ts`.
- **GeographyCard fate:** the 3-column `areas.join(", ") / edges.join(" ↔ ") / ports` `Card` is **retired** — replaced by the map. `Empty` states kept: `divisions.length===0`→strip `Empty No player division`, total geometry miss→map chrome `Empty No chart geometry` (unreachable with 1880 pack). Rejected: keep text wall beside map (two truths).
- **Projection & camera:** keep `PROJECTIONS` toggle (miller default) + `usePrototypeCamera` pan/zoom inside the tab (`MAX_SCALE 14×`, `preserveAspectRatio xMidYMid meet`, `WORLD_WRAP_TURNS` three-turn antimeridian rendering every layer west/home/east so markers wrap). Wheel is free, drag suppresses `handleAreaClick` via `camera.isDraggingRef`. Rejected: locked camera.
- **Division affordance:** `rect 22×16 rx3` + ships count, hit `28×28`, selected `CHART.ink 2.5 + glow`, stacking `offset=(index%3)*16-16` for 1–3 sharing an anchor, 4th+ `+N` pill (deferred pill impl). Prototype is disposable; implementation is a `to-tickets` slice.

**Graduates:** breakpoint/drawer choice cleared (≥1024 split, narrow stack+Sheet).
