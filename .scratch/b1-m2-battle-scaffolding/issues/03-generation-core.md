---
Type: task
Status: resolved
Blocked by: 02
---

# B-1 / 03 — Battle-generation core (stages 1–9)

## Question

Opportunities → sides → force requirements → eligible gathering → division
preservation → mandatory/optional roles → allied structural caps.

## Answer

Per spec INC-3: mission registry (9 types), opportunity determination (ADR B-1-3
+ **B-1-7** predicate), participating sides, force requirements, deterministic
eligible-asset gathering, permanent-division preservation/projection, mandatory
roles, optional-asset selection (`optional_asset_selection_v1`, ADR B-1-4/5
boundary). Pure, in `@bluewave/combat`; no phase change. Must be preceded by
ADR B-1-7 (reviewer follow-up).
