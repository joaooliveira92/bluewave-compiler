<!-- label: wayfinder:map -->
# Map: RTW3-equivalent campaign command screen

## Destination

A reviewed **spec + decision set** for the campaign's main "command screen": the Bluewave equivalent of Rule the Waves 3's main map screen (area tree, report tabs, nation status + budget panel, action buttons, nation flag/intel strip, Turn control), built on today's Overview/world map and the new bottom nav — **ready for `to-spec` / `to-tickets` slicing**. No code is shipped in this effort.

## Notes

- Reference: owner's RTW3 screenshots (2026-10-08, main map screen, Italy May 1935). Regions: top tab strip (Map, Ships in service, Ships under construction, Submarines, Coastal fortifications, Ships sunk or scrapped, Area overview, Base overview, Officers); left area tree with Ships/Possessions toggle; centre world map with flags/area boxes; bottom-left nation panel (Prestige, Fleet morale, Tonnage on foreign stations, Dock size, Shipyard capacity, Unrest level, Build requirement, Treaty limits/time); bottom-centre budget (Yearly/Monthly budget, Maintenance, Construction, Naval aircraft, Research %, Extra training, Intelligence, Total expenses, Monthly balance); bottom-right 3x5 action grid (Design Ship, Research, Messages, Build ship, Doctrine, Mobilization, Build sub, Air groups, All reserve, Build fort/base, Aircraft types, Division editor, Fleet Exercise, Show history, Preferences); right column: nation flags + intel bars + Intel level +/-, Almanac, Intel reports, All relations, Auto-build subs, Save / Copy game / Resign, Turn.
- Current app: Overview screen (map card Compact/Large/Fill, month report, priorities) + header (Advance Month, status strip) + new BottomNav (uncommitted WIP in `apps/desktop/src/renderer/shell/`).
- **Product principle (memory `clone-features-not-ui`, ADR-0059): clone RTW3's features and information, not its layout.** Improve the UI; keep the 3-click rule and map-first.
- **Engine-check first (ADR-0059 §1):** a readout or button only shows real engine data; otherwise a visible "Not yet modelled" deferred item — never fabricated. See `docs/research/rtw3-parity-engine-roadmap.md`.
- Prior art to build on, not redo: `.scratch/rtw3-parity-ux-overhaul` (tickets 03 map-as-home, 15 visual pass), `.scratch/fleet-movement-strategy-map`, `components/world-map/*`.
- Skills: `grilling` + `domain-modeling` (HITL tickets), `research`, `prototype`. Per AGENTS.md the orchestrator decides autonomously and records ADRs; no human gate until final delivery.
- Standing decision (owner-approved 2026-10-08): the monthly budget readout is labelled "projected" until the revenue source is confirmed (baseResources vs scaled income); research notes live in docs/research/campaign-command-screen-*.md.
- Branch `dev`; tracker `.scratch/` local markdown.

## Decisions so far

- [03 — RTW3 meaning of each readout and button](issues/03-rtw3-semantics.md): manual defines most readouts but gives no scales/colour thresholds; Build requirement, treaty time and capacity triple are undefined (need our own constants or stay deferred); many buttons are not in the manual at all.
- [02 — Readout and button inventory vs the engine](issues/02-readout-inventory.md): budget/treasury/relations/Save/Copy/Turn and most core tabs are real; prestige, morale, unrest, dock, treaties, intel, subs, air, forts, doctrine are deferred; shipyard capacity is a proxy; revenue source needs owner confirmation; no new engine work needed for a first honest screen.
- [01 — Screen identity and layout regions](issues/01-screen-identity.md): map-first command screen replaces Overview as home; full-bleed map with edge panels; one collapsible nation+budget strip above BottomNav; header Advance Month stays the only Turn control; slim right nation rail; RTW3 tabs/action grid not copied (tickets 05/06 map them).
- [06 — Action grid and nav reconciliation](issues/06-action-grid-mapping.md): no action grid; BottomNav is the only screen nav; RTW3 buttons map to existing screens or contextual actions; deferred ones become "Not yet modelled" items inside their eventual screen; Resign = Close; Save/Copy/Close in a header Campaign menu; short BottomNav labels (owner delegated).
- [05 — Report tabs: lenses, drawers or screens](issues/05-tabs-and-lenses.md): no tab strip on home; Ships in service/Area overview/Losses/Officers live as Fleet sections, under construction in Construction, Base overview as map drawer, Submarines and Coastal fortifications deferred; only lenses are the area tree's Ships/Possessions toggle (owner delegated).
- [04 — Improved layout prototype](issues/04-layout-prototype.md): prototype skipped; layout fixed: full-bleed map, floating collapsible area tree, slim right nation rail, bottom Nation|Budget strip above BottomNav, compact density collapses the strip.
- [07 — Nation strip, intel bars and relations](issues/07-nation-strip-intel.md): rail shows major powers with relation/war score from Diplomacy; intel bars/level/reports and Almanac deferred; All relations -> Diplomacy.
- [08 — Area tree hierarchy and Ships/Possessions](issues/08-area-tree.md): presentation-layer region table with exhaustiveness test over 1880 areas (no content/golden change); Ships and Possessions toggles; select focuses map + opens drawer.

## Not yet specified

- Engine tickets for readouts/buttons the engine lacks (prestige, fleet morale, unrest, dock/shipyard capacity, intel, treaties): which to build first — graduates after 02 (inventory) and the owner-ranked roadmap.
- Responsive/compact behaviour of the bottom status panel and right column — graduates after prototype 04.
- Keyboard shortcuts and accessibility contract (landmarks, focus order, Turn confirmation) — graduates after 01 and 04.
- Slicing into vertical tickets and test/e2e plan — after all decisions close.

## Out of scope

- Building any engine mechanic (prestige, intel, treaties, subs, air, forts) — separate engine efforts with their own ADRs/golden updates.
- Tactical battle screen, ship designer UI, new-game flow.
- Pixel-matching RTW3's Windows-classic layout or art.
