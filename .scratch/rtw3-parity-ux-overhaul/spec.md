# Spec: RTW3 feature parity + UX modernization (map-first shell, deep zoom, 3-click rule)

Slug: `rtw3-parity-ux-overhaul`
Status: approved by owner ("approved all"); ready for slicing (to-tickets).
Source: UI/UX gap analysis of Rule the Waves 3 vs `apps/desktop` (2026-10-07).

## Problem

The desktop shell is a card-based dashboard with the world map hidden behind F1.
Many RTW3 menus have no UI (see Gap table). The map zooms only 0.9x-14x with one
coastline resolution; the tactical view has no scaled map. No guard enforces
the 3-click reachability rule.

## Requirements

### Map (M)
- M-1 The strategic world map is the campaign home canvas, not an F1 sheet.
  Overview widgets become panels/drawers around it.
- M-2 Strategic map uses level-of-detail coastlines (3 resolutions, switched by
  zoom band) and a Canvas/WebGL renderer; stays interactive at max zoom.
- M-3 Area tree (RTW3 left panel) with Ships/Possessions toggle; selecting
  focuses the map.
- M-4 Minimap + scale bar.
- M-5 Tactical battle map clamps to 1 px = 1,600 m (out) .. 1 px = 50 m (in)
  (32x range); constants `TACTICAL_MIN_M_PER_PX=50`, `TACTICAL_MAX_M_PER_PX=1600`;
  HUD shows current scale.
- M-6 Tactical LOD: at >= ~800 m/px NATO-style symbols, scouting lines, threat
  vectors; at <= ~100 m/px silhouettes, firing arcs, per-turret damage state.
- M-7 Camera pan/zoom stays in a ref (not React state); only LOD band is state.

### Navigation (N)
- N-1 Every feature id is reachable within 3 clicks of the dashboard (home map).
- N-2 Sidebar regrouped: Operations, Industry, Government, Foreign, Records.
- N-3 Dev-only screens (Tactical Sandbox, Debugging, Map Prototype) excluded
  from production registry/depth accounting.
- N-4 Any ship/area/nation entity opens a side drawer in 1 click; GlobalSearch
  reaches every entity.
- N-5 A registry-driven test fails if any feature is deeper than 3 clicks.

### Feature parity (F) — each screen is engine-derived, nothing fabricated;
features whose engine support is absent are recorded as deferred, not faked.
- F-1 War panel: VP vs enemy VP, trade protection, ASW, submarine policy
  (fleet support / prize rules / unrestricted), invasion planning.
- F-2 Intel: per-nation intel level, spend, reports; relations matrix, almanac.
- F-3 Submarines roster + auto-build setting.
- F-4 Coastal fortifications, build fort/base, base overview.
- F-5 Ships sunk or scrapped ledger (persisted, uses cause of loss, ADR-0052).
- F-6 Area overview table.
- F-7 Fleet organization tree + division editor.
- F-8 Air groups, aircraft types, naval aircraft budget.
- F-9 Officers.
- F-10 Doctrine, mobilization/all-reserve, fleet exercise/extra training.
- F-11 Treaty limits/time/peace-treaty limit readouts.
- F-12 Budget allocation (research %, intelligence) beyond read-only Treasury.
- F-13 Message/event history browser; Copy game; Resign.
- F-14 Free-form ship design with live stats.

### Visual (V)
- V-1 Type scale (display / tabular mono / 12 px floor); V-2 one primary region
  per screen; V-3 compact-density toggle; V-4 stacked-bar budget, relations
  matrix, shipyard gauge; V-5 alert badges (war, negative balance, treaty).

## Decisions (resolved, no human gate)
1. Keep Admiralty-chart design (ticket 06); promote, don't rewrite.
2. Renderer: Canvas/WebGL for the map; SVG retained for overlays/labels only.
3. Engine-absent features (F-8/F-9/F-10 where unsupported) ship as read-only
   "deferred" panels with a recorded reason (AGENTS.md rule).
4. Order: M-1/M-2/M-5 -> N-* -> F-1..F-3 -> remaining F -> V.

## Tests
- Registry depth test (N-5); camera clamp unit tests (M-5); LOD band selection
  tests (M-2/M-6); per-screen render + bridge tests; golden/determinism gates
  unchanged (renderer-only; no authoritative behaviour changes).

## Definition of done
All requirement IDs implemented or explicitly recorded deferred with reason;
depth test green; full gate (build, typecheck, lint, format, tests, determinism,
golden) green.

## Suggested frontier tickets (to-tickets input)
01 tactical camera + scale clamp (M-5,M-7) · 02 LOD coastlines + renderer (M-2) ·
03 map-as-home shell (M-1,M-3,M-4) · 04 sidebar regroup + depth test (N-*) ·
05 war panel (F-1) · 06 intel (F-2) · 07 subs (F-3) · 08 losses ledger + area
overview (F-5,F-6) · 09 forts/bases (F-4) · 10 org/division (F-7) · 11 air (F-8) ·
12 officers/doctrine/mobilization (F-9,F-10) · 13 treaties/budget/history (F-11-13) ·
14 ship designer (F-14) · 15 visual pass (V-*) · 16 tactical LOD (M-6)
