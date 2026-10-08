# Report tabs: lenses, drawers or screens

**Type:** grilling
**Status:** resolved
**Blocked by:** 01

## Question
RTW3's tab strip (Ships in service, under construction, Submarines, Coastal fortifications, Ships sunk or scrapped, Area overview, Base overview, Officers) swaps the map for tables. In Bluewave, does each become a map lens, a side drawer, or a link to an existing screen (Fleet, Construction)? Settle per tab, honouring the 3-click rule and deferred panels for absent engine features.

## Answer

Owner delegated the call (2026-10-08); the orchestrator decided. Rule: the home screen has **no tab strip**. Each RTW3 tab lands on a surface that already exists or will exist, so there is exactly one navigation surface (BottomNav, ticket 06) and every tab stays within 2 clicks of home (3-click rule, N-1).

| RTW3 tab | Bluewave target | Form |
|---|---|---|
| Map | Home command screen | The screen itself (full-bleed map) |
| Ships in service | Fleet screen | Screen; the area tree's Ships toggle is the map lens (ticket 08) |
| Ships under construction | Construction screen | Screen |
| Ships sunk or scrapped | Fleet screen, "Losses" section | Section (uses the loss ledger, ADR-0061); scrapping stays deferred |
| Area overview | Fleet screen's area overview table + a one-click area drawer from the map | Section + drawer |
| Base overview | Port/area drawer from the map; the area tree's Possessions toggle is the lens | Drawer + lens |
| Officers | Fleet screen, "Officers" section (division commanders, ADR-0065) | Section |
| Submarines | "Not yet modelled" item in Fleet (era-gated, no 1880 content) | Deferred |
| Coastal fortifications | "Not yet modelled" item in Construction (with Build fort/base) | Deferred |

Map lenses are limited to the two the area tree already offers (Ships, Possessions); no further lens modes in v1.

Follow-up for the spec: Fleet gains Losses and Officers sections; confirm Fleet does not become overloaded (candidate for the layout prototype, ticket 04).
