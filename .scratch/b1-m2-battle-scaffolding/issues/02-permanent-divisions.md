---
Type: task
Status: resolved
Blocked by: 01
---

# B-1 / 02 — Permanent division aggregate (campaign)

## Question

Campaign-authoritative divisions/formations data model.

## Answer

Per spec INC-2: add `PermanentDivision` aggregate + DESIGN-26 §29 invariants
(items 1–15), roles/formations/effects, the 5 division commands (Create,
AddShip, RemoveShip, Dissolve, ChangeFlagship) wired into the command lifecycle,
and `NationState.divisions`. **Snapshot schema change** → clone in `month.ts`,
persistence/replay, golden regen (ADR-0007, documented cause).
