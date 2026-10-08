# Spec: RTW3-equivalent campaign command screen

Slug: `campaign-command-screen`
Status: approved (owner delegated all decisions, 2026-10-08); sliced into `issues/IMP-*`.
Source: map.md + closed decision tickets 01-08; research `docs/research/campaign-command-screen-engine-surface.md`, `...-rtw3-semantics.md`.
Principle: clone RTW3 features/information, not its layout (ADR-0059). Engine-check first: real data or a visible "Not yet modelled" item; never fabricated.

## Problem
The home screen is an Overview card dashboard. RTW3's main screen puts the map, nation status, budget, relations and the next-turn control in one view; ours scatters this across screens and hides the figures.

## Requirements
- CC-1 Home is the command screen (replaces Overview); month report + priorities become collapsible panels.
- CC-2 Map is full-bleed; panels overlay at edges.
- CC-3 Bottom status strip above BottomNav, two groups, collapsible. Nation: tonnage on foreign stations, shipyard capacity (labelled proxy), plus deferred rows (prestige, fleet morale, unrest, dock size, build requirement, treaty limits). Budget: treasury, monthly budget (labelled "projected"), maintenance, construction, research, total expenses, monthly balance (negative = alert styling + text, never colour alone), deferred rows (naval aircraft, extra training, intelligence). Compact density collapses to one line (balance, treasury, alerts).
- CC-4 Area tree panel: regions (presentation-layer table, exhaustiveness test over compiled 1880 areas, no content change) > areas; Ships / Possessions toggle; selecting focuses the map and opens the area drawer.
- CC-5 Right nation rail: major powers, player first; relation + war score from Diplomacy views; selecting opens nation drawer; intel bars/level/reports and Almanac shown only as deferred; "All relations" -> Diplomacy & War.
- CC-6 No tab strip, no action grid. Header Campaign menu holds Save / Copy game / Close. Advance Month stays the single Turn control with pre-turn review.
- CC-7 BottomNav short labels (no truncation); full names in tooltips/titles.
- CC-8 Fleet gains Losses and Officers sections; deferred items placed inside owning screens (Fleet: Submarines, Air groups, Aircraft types, Fleet Exercise; Construction: Build sub, Build fort/base, Coastal fortifications; Government/Research: Doctrine, Mobilization).
- CC-9 Every item reachable in <=3 clicks (registry depth test stays green); 12 px type floor; narrow (<1024) stacks map, strip, panels in a Sheet.

## User stories
1. As an admiral I see treasury, balance and expenses without leaving the map.
2. As an admiral I browse areas by region and jump the map to one.
3. As an admiral I see who is at war with me at a glance.
4. As an admiral I always know which readouts are real and which are not yet modelled.

## Tests
Pure view-model unit tests per region (strip, tree, rail); render tests; region-table exhaustiveness; depth test; type-floor guard; `pnpm snap` capture of the home screen per ticket; e2e updated for the new home. No engine change, so determinism/golden unchanged.

## Open item
Confirm the revenue source (baseResources vs scaled income); until then the budget is "projected".

## Definition of done
All CC-* implemented or recorded deferred with reason; full gate green.
