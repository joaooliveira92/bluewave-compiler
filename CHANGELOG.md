# Changelog

All notable player-facing and release-relevant changes. Newest first. Versions follow the desktop
app (`apps/desktop/package.json`); everything below is **Unreleased** until a release is cut from `dev`
to `main` (see `AGENTS.md`).

## Unreleased

### Added

- **Map as the home screen.** Overview opens on a live world map (Compact / Large / Fill) with ownership,
  fleets and routes, a scale bar in nautical miles, a minimap, deep zoom to 60× with detailed coastlines,
  an area list (filter, select, zoom, with a Ships/Possessions toggle), keyboard pan/zoom, and a text table of area control. F1 opens the
  same map in a larger side panel.
- **Fleet organization (division editor).** Create divisions on a flagship, add and remove ships, change
  the flagship, dissolve — with the experience/cohesion cost of each change stated first.
- **Fleet positions map and area overview** on the Fleet screen, focused on the selected division.
- **Battle history** on Diplomacy & War (outcome, sides, area, ships lost per battle).
- **War score bar** (you vs. the enemy) for each war.
- **Real alerts and priorities:** the header shows an alert count and Overview lists the Admiralty's
  concerns, each linking to where you can act.
- **Budget at a glance** on Treasury.
- **Display density** setting (Comfortable / Compact) in Options.
- **Save a Copy…** in Options.
- **Monthly report** on Overview: after you advance the month, treasury movement, spending, construction and
  research progress and battles (in words, with names), plus earlier months from this session.

### Fixed

- **Save and Close Campaign did nothing** (they reported "not implemented"). Both now work (covered by integration
  tests and an end-to-end test). Save is safe to click
  repeatedly, and Close frees everything the session held.
- Fleet, Construction and the division editor no longer show pre-advance data after you advance the month.
- Engine ids, session ids and revision numbers no longer appear in the release UI (debug builds only).
- Map labels and markers keep a constant size when zoomed; coastlines render smoothly at every zoom.

### Changed
- **Sidebar grouped by job:** Admiralty, Operations, Government, Foreign (and Settings). Group headings now
  actually display — the shared sidebar-label component was dropping its text.

- **Fleet** no longer offers a movement-order form that could only fail; it says plainly that the engine has no
  movement command yet. The screen title is now "Fleet".

### Not yet modelled by the engine (shown as such in the app, never faked)

Trade protection, anti-submarine rating, submarine warfare policy and roster, invasion planning,
intelligence levels/spend/reports, ship names and dates in the losses ledger, scrapping, forts and bases,
air groups, officers, doctrine, mobilization, treaties, budget allocation, ship designer, fleet movement
orders. See `docs/research/rtw3-parity-engine-roadmap.md`.

### Internal

- Canvas coastline renderer with level-of-detail tiers (ADR-0055); baked binary coastline asset.
- Packaged-app smoke script (`pnpm --filter @bluewave/desktop run smoke:packaged`).
- Type-floor, click-depth and content-coverage guard tests.
- Automated accessibility audit (axe-core) over the new screens, with a control test proving it detects violations.
