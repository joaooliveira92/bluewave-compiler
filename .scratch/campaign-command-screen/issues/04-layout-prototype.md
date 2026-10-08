# Improved layout prototype

**Type:** prototype
**Status:** resolved
**Blocked by:** 01, 02

## Question
Which modernised layout carries RTW3's information density best while staying map-first, fitting the Admiralty chart design, density toggle and 12px floor? Prototype 2-3 variants of status/budget panels and the action grid around the map (throwaway, linked as asset) and pick one.

## Answer

Owner asked the orchestrator to proceed to implementation (2026-10-08), so the prototype step is skipped and the layout is decided from ticket 01 and the existing chart/density system (a throwaway prototype adds no information the spec cannot already fix). Variant chosen: **full-bleed map; floating left area-tree panel (collapsible); slim right nation rail; bottom collapsible status strip with two groups (Nation | Budget) above BottomNav; month report and priorities as a collapsible top-left/summary panel; header unchanged except a Campaign menu**. Compact density collapses the strip to one line of key figures (balance, treasury, alerts). Narrow widths (<1024) stack: map, then strip, panels in a Sheet. Revisit via the visual snap review (`pnpm snap`) during implementation; no further decision gate.
