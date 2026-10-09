# SB-2: Ship-building parity with the reference design screen

Source: owner comparison of Rule the Waves 3 design screens against the Drawing Board (2026-10-09), approved in full
("approve all"). Beneath DESIGN-21/22/23; SB-1 (`spec.md`) stays the base. Mechanics are matched, the UI is not cloned
([[clone-features-not-ui]]). Era scope is the EARLY band (1880-1899): later-era items are recorded as deferred, not built.

## Problem
The Drawing Board covers hull, machinery, armour thickness, placements, topside and forecasts, but a player cannot see or
steer several things the reference screen exposes: which shipyard will build the design, the ship type and class code,
armour coverage and scheme, named turret positions and per-battery gun options, and placing fittings directly on the
drawing.

## Solution (five features, in dependency order)
- **F1 Yard fit and choice (SB-31).** Show the yard the forecast picked, per-yard fit (length, beam, displacement, crane
  lift) and finish time; let the player prefer a yard. Domain exists (`yards.ts`, `forecast.yardId`); this is display plus a
  `preferredYardId` on the submission.
- **F2 Ship type and class code (SB-32).** Show the natural class (existing) as a chosen-or-natural ship type with a class
  code line (type + main-gun count/calibre, e.g. `BB4X12`-style, derived) and a finding when the chosen type disagrees with
  the natural class. BC is deferred (arrives with the Dreadnought band).
- **F3 Armour coverage and scheme (SB-33).** New draft fields: belt coverage, extended belt/deck, inclined belt, armour
  scheme (all-or-nothing | sloped | none), with a coverage percentage and weight/cost effects through compile.
- **F4 Turret and battery editor (SB-34).** Named positions (A forward, B superimposed, Y aft...), add/delete/clear turret,
  guns per mount (turret | casemate | pedestal), battery view (calibre, number, rounds per gun, director flag), auto-place.
- **F5 Click-to-place on the hull plan (SB-35).** Place, move and remove fittings by clicking the plan, with keyboard
  parity, snapping to zone/station/side and the same edits as the Arrangement panel.

## Decisions (resolved autonomously; recorded in ADR-0076)
- New draft fields are optional with a documented default so existing drafts, goldens and persistence stay valid; the
  persistence schema version is bumped only if a field becomes required.
- Armour coverage effects are balance constants in `balance.yaml`, marked PLACEHOLDER until research pass 2 is applied.
- Position names are a deterministic function of station order and zone, not stored data (except an override label).
- The Drawing Board never invents data: every new control either edits a draft field or displays a compiled value.

## Testing
Pure-package tests per domain change (units, boundaries, determinism, persistence round-trip); desktop render tests for
each new control; `pnpm snap` capture for each screen change; `pnpm check` plus cross-process determinism at the gate.

## Out of scope / deferred
Aircraft, CIWS, radar directors, HAA factor, oil/turbine/aluminium (later bands); mines; custom graphics tab; BC type;
superstructure drawing; template import (already tracked).
