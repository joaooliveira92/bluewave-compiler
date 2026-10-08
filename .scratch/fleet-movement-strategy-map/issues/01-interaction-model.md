---
Type: grilling
Status: resolved
Blocked by: none
---

# 01 — Interaction model: click-to-order on the chart

## Question

Decide the **click-first interaction contract** for the map-native Fleet Movement screen — the behavior seated inside `FleetScreen.tsx` that replaces the current `DivisionPicker` radio + `OrderSection` `<Select>` dropdown as the primary ordering path.

Resolve:

- **Click area → `destinationAreaId`**: single-click selects destination, shift-click adds ruler leg (`pushRuler` semantics in `map-prototype-screen-state.ts`). Must set the same `destinationAreaId` state `useFleetScreen` owns today so `submit`/`replace` (`submitMovementCommand`/`replaceMovementCommand`) fire unchanged. Adjacent-only vs whole-world: engine validates legality, so renderer must allow any area but visually hint adjacency (faint edge vs highlighted ring) — decide which hint.
- **Click fleet marker → `selectedDivisionId`**: bidirectional — picking radio checks marker, picking marker checks radio. Marker affordance (`rect 22×16` + ships count in `WorldMapChart`) needs a hit zone + selected ring. Decide whether a division pinned to `areaId` renders offset-stacked when multiple fleets share an anchor (current prototype `index %3 *16` offset).
- **Hover tooltip**: which fields on `FleetArea`/`FleetPort`/`FleetDivisionView`/`FleetAreaEdge` surface on hover (name, controller per `content-1-world-geography.md`, ports at area, stationed divisions, neighbours/degree, route distance `routes.yaml:distance`). Pin the tooltip content contract so spec authors can cite it.
- **Pending route line**: one gold dashed line per division? Currently `routePath` is single-global (`readRoute(state).path`). Fleet needs per-division `pendingRouteFor(state, divisionId)` — `MovementCommand` with `status: submitted` — rendered as gold `10 6` with dark under-stroke from `division.areaId` to `pendingRoute.toAreaId` or to live `destinationAreaId` preview. Decide preview vs committed styling.
- **Fallback & a11y**: `OrderSection` `<Select>` stays as keyboard/a11y fallback in v1 or is removed. Decide keys (arrow between areas?), focus order, and screen-reader announcement for "selected division X at Y, destination Z".
- **Multi-select / batch orders**: issue same destination to several divisions at once — deferred or v1? `submitMovementCommand` is per-division today.

Use `/grilling` + `/domain-modeling` (HITL). Reference: `FleetScreen.tsx:useFleetScreen`, `fleet-screen-state.ts:pendingRouteFor`, `WorldMapChart.tsx:routePath/handleAreaClick`, `prototype-world.ts:EDGES`, `apps/desktop/src/shared/fleet-contract.ts:FleetScreenProjection`.

### Acceptance for ticket close

- Recorded decision for each bullet, with rejected alternative named.
- Pending-route rendering semantics pinned (preview vs committed, per-division).
- `Not yet specified` entry for whether `DivisionPicker` cards survive as a strip or are subsumed.

## Answer

**Domain note:** This ticket pins the **renderer interaction contract** for Fleet Movement. The engine owns `CampaignSnapshot` → `FleetScreenView` (`buildFleetScreenView` over `snapshot.world` areas/routes/ports, one `FleetDivisionView` per compiled `FleetState`), the bridge owns `inspectFleetScreen`/`submitMovementCommand` (shared `MovementCommand` with `status: submitted` via `pendingRouteFor`), and the chart is pure geometry keyed by `AreaId` — consistent with `CONTEXT.md` `Nation`/`NationId` vocabulary (canonical `id` like `uk`, `germany`, `france`; `tag` is presentation `GBR`).

### 1. Click area → `destinationAreaId`

- **Single click** on any area `path` sets `destinationAreaId` to that `AreaId` — the same `useState<string|null>` `useFleetScreen` owns today, so `submit`/`replace` (`bridge.campaign.execute("submitMovementCommand", {divisionId, fromAreaId: division.areaId, toAreaId: destinationAreaId})`) fire unchanged.
- **Shift-click** follows prototype `pushRuler` semantics (from→to→reset) but in Fleet v1 is **secondary** — ruler is a measurement affordance, not the ordering path. Milestone 6 will replace it with a proper `routeBetween(...)` that respects passages; Fleet's ruler stays optional and does not gate `destinationAreaId`.
- **Whole-world selectable, renderer never decides legality** — matches `fleet-screen-state.ts` header ("never decides whether a route is adjacent, accessible, or otherwise legal"). The chart visually hints adjacency (see below) but the `Button disabled` rule stays `busy || selectedDivision===null || destinationAreaId===null` — no client-side adjacency gate, no `isAdjacent()` check. Rejected alternative: adjacent-only picker (hides strategic intent; a player may target a 2-hop `sea_english_channel→sea_mediterranean_w 1700km` move and expect a rejection notice via `commandNotice`, not a missing option).
- **Adjacency hint (visual):** `EDGES`/`areaEdges` drives it. Non-adjacent areas render at `fill α 0.06 / stroke 0.9  oklch(0.75…/0.35)` (as today). Areas adjacent to `selectedDivision.areaId` (`areaEdges.find(from===selectedDivision.areaId)`) render with `strokeWidth 2  oklch(0.85 0.16 85)` gold ring — the same `onRouteLeg` token `WorldMapChart` already uses for `routeSet.has(id)`. No hatching, no disabled wash — just weight. Rejected: greying-out non-adjacent (reads as disabled, mis-privileges the renderer).

### 2. Click fleet marker → `selectedDivisionId` (bidirectional)

- **Source of truth:** `selectedDivisionId` stays in `useFleetScreen`. `DivisionPicker` radio `value` and chart `drawnFleets` are two views of the same state — picking radio checks marker, picking marker calls `setSelectedDivisionId(fleet.divisionId)`. No second state, no sync bug.
- **Marker affordance:** keep current prototype `rect 22×16 rx3` with `ships` count, `fill = strokeFor(owner)` / `campaignNationHue` in live mode, but enlarge hit to `28×28` invisible hit rect (pointer-events) so mobile is tappable. Selected division's marker adds `stroke CHART.ink 2.5 + outer glow oklch(0.85 0.16 85 /0.35)` so selection reads regardless of wash. Clicking a marker when `camera.isDraggingRef.current` is true is suppressed (existing `handleAreaClick` guard).
- **Stacking when multiple divisions share an `areaId`:** keep prototype `offset = (index %3)*16 -16` for 1–3 fleets sharing an anchor, plus a `+N` overflow badge (`span bg-accent`) when `ships.length >4` analogue — but now at marker level: 4th+ collapses to `+N` pill with tooltip listing the hidden `divisionId`s. Rejected alternative: anchored cards beside the map (duplicates DivisionPicker).
- **Division strip fate (bridges Not-yet-specified):** `DivisionPicker` is **not deleted in v1** — it becomes a horizontal filter strip above the map (1-row, `RadioGroup` still, but `CardContent` compact `p-3` + `areaName(division.areaId)`), so selection reads even when map is zoomed out. Full subsumption into markers is deferred to `02`.

### 3. Hover tooltip — pinned content contract (spec-citable)

Derived from `WorldMapChart:summary` / `summariseArea` shape, but for Fleet the summary is built from live `FleetScreenView`:

```
Tooltip(areaId):
  title: areas.find(a=>a.id===areaId).name
  controller: snapshot world area controller NationId → nationFill / campaignNationLabel (may be null → "Unclaimed")
  ports: ports.filter(p=>p.areaId===areaId) → `${port.name} (${level}/capacity)` (use `FleetPort.capacity = port.level`)
  stationed: divisions.filter(d=>d.areaId===areaId) → `${fleetName} · ${divisionId} · ${ships.length} ships` (player-owned only v1; enemy deferred per ticket 04)
  neighbours: areaEdges.filter(e=>e.fromAreaId===areaId || e.toAreaId===areaId) → `→ ${areaName(neighbour)}` + passage tag `C/S` + `open ? "open" : "closed"` + `routes.yaml:distance km` when edge has a compiled distance (fallback `nauticalMiles(label, neighbourLabel)` rounded)
  pending: pendingRouteFor(area divisions) → `pending ${from}→${to} (submitted r${revision})` when any division here has `status: submitted`
```

Tooltip is `absolute` following `projectPoint(labelAnchor)` but rendered in React (`pointerEvents:none` text layer stays), not SVG `<title>`. Rejected: edge-label distance on route lines (clutters at world scale).

### 4. Pending route line — per-division, preview vs committed

Current `WorldMapChart:routePath` is single-global (`readRoute(state).path`). Fleet needs **per-division**:

- **Committed:** for `divisionId` where `pendingRouteFor(state, divisionId) !== null`, render a gold line `from pending.fromAreaId → pending.toAreaId` as two strokes: dark under-stroke `stroke oklch(0.2 0/0.6) 6 round`, gold over-stroke `oklch(0.85 0.16 85) 2.5 dash 10 6 round`. One line per such division (multiple gold lines may be on map at once). This is the audit line matching `MovementCommandsTable` row.
- **Preview:** for the **currently selected** division (`selectedDivisionId`) when `destinationAreaId !== null && destinationAreaId !== division.areaId` and no committed line for that division already equals that `toAreaId`, render a **fainter** preview of the same stroke: same dash but `opacity 0.55` + `strokeWidth 2` (no under-stroke), from `division.areaId`'s `areasById.get(division.areaId).label` to `areasById.get(destinationAreaId).label` via straight `M…L…` (no multi-hop `routeBetween` yet — multi-hop pathfinding is ticket 03's `routeBetween` with passage respect; v1 preview is direct edge, because `areaEdges` are directed adjacencies and a straight line is the honest preview of what `submitMovementCommand` will attempt).
- **Interaction:** hovering a committed line highlights its `MovementCommandsTable` row (and vice-versa) via shared `commandId` key — spec will cite `commandId` as correlation id.
- Rejected: single global route (hides which division owns which order).

### 5. Fallback & a11y

- **`OrderSection` `<Select>` stays in v1** as keyboard/a11y fallback, labelled `Destination` with `SelectTrigger id="destination"` unchanged. Its `value === destinationAreaId` and `onValueChange === setDestinationAreaId`, so map click and dropdown write the same state. Removal is deferred until map hit-testing is keyboard-reachable.
- **Keyboard:** Tab order: `DivisionPicker strip (radio) → WorldMapChart (role=application, aria-label="World map") → OrderSection (Destination select, Submit, Replace/Cancel, Refresh)`. Within the chart, arrow keys cycle `areas` in `areasById` insertion order (sorted `id` from `buildFleetScreenView`); Enter sets `destinationAreaId`; Esc clears selection. No new global shortcut; map does not steal `F1` (that stays `MapSheet` global).
- **Screen reader announcement:** live region under `OrderSection` announces `"Division ${division.fleetName} (${division.divisionId}) at ${areaName(division.areaId)}, ${ships.length} ships. Destination ${areaName(destinationAreaId)}. ${pendingRoute ? "Pending " + areaName(pendingRoute.fromAreaId) + " to " + areaName(pendingRoute.toAreaId) : "No pending route"}."` Rejected: ARIA grid for the map (over-spec for v1).

### 6. Multi-select / batch orders — deferred

- **Deferred.** `submitMovementCommand` is per-division (`{divisionId, fromAreaId, toAreaId, expectedRevision, transportRequestId}`) and the workspace holds one `MovementCommand` per `divisionId`. Batch-issuing the same destination to N divisions is N calls — spec will require sequential `transportRequestId`s and a per-command `notice`/`commandNotice`. A batch UI (checkboxes on DivisionPicker, "Issue to selected" button) would promise an atomic batch the engine does not provide. So v1 stays single-selection. `Not yet specified` for batch graduates only when `fleetCommands.ts` offers a batch envelope. Rejected: v1 multi-select.

### Traceability

- `FleetScreen.tsx` wiring: `useFleetScreen`'s `selectedDivisionId`/`destinationAreaId` setters become the sole handlers for both pickers.
- `fleet-screen-state.ts:pendingRouteFor` is the committed-line source.
- `WorldMapChart.tsx:handleAreaClick`, `routePath`, `areasById`, `WORLD_WRAP_TURNS` reused.

