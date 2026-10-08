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
- Branch `dev`; tracker `.scratch/` local markdown.

## Decisions so far

<!-- one line per resolved ticket -->

## Not yet specified

- Engine tickets for readouts/buttons the engine lacks (prestige, fleet morale, unrest, dock/shipyard capacity, intel, treaties): which to build first — graduates after 02 (inventory) and the owner-ranked roadmap.
- Responsive/compact behaviour of the bottom status panel and right column — graduates after prototype 04.
- Keyboard shortcuts and accessibility contract (landmarks, focus order, Turn confirmation) — graduates after 01 and 04.
- Whether the full-bleed home canvas (M-1 second half of parity ticket 03) lands inside this screen or stays separate — graduates after 01.
- Slicing into vertical tickets and test/e2e plan — after all decisions close.

## Out of scope

- Building any engine mechanic (prestige, intel, treaties, subs, air, forts) — separate engine efforts with their own ADRs/golden updates.
- Tactical battle screen, ship designer UI, new-game flow.
- Pixel-matching RTW3's Windows-classic layout or art.
