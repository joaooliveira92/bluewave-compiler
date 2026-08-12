# CONTENT-0 — 04: Content map and release-classification policy

## Question

What is the content map (the full inventory of content the production pack must
author across collections and eras), and how is every feature classified per
DESIGN-55 §12 (`SUPPORTED_MECHANICAL` / `CONTENT_ONLY_LOCKED` /
`PRESENTATION_ONLY` / `MIGRATION_ONLY` / `DEPRECATED`) relative to mechanic
acceptance? The classification policy determines what may ship as reachable vs.
locked-unreachable and what must be proven unreachable (§13/§14).

## Type

task

## Status

resolved

## Notes

- DESIGN-55 §12: `SUPPORTED_MECHANICAL` requires an accepted owning capability;
  content whose owner is not accepted is authored `CONTENT_ONLY_LOCKED` and
  must be proven unreachable (§14).
- §13 lists the isolation conditions a locked item must satisfy.
- The content map is the inventory that every later content sprint (C-track +
  CONTENT-1) fills, tied to the primary scenario's reachable bands.

## Blocked by

01, 02, 03

## Answer

**Content map** = the full inventory the production pack must author, grouped
by collection, across the reachable era bands, tied to scen_1880. The charter
brief lists the required collections (content + campaign sides) and the
per-feature classification policy; the concrete authored feature inventory and
per-item marks are the deliverable of CONTENT-1, not CONTENT-0.

**Classification policy (DESIGN-55 §12/§13/§14):** every authored content
feature declares exactly one release classification. `SUPPORTED_MECHANICAL`
requires an accepted owning capability. Content whose owning mechanic is not
accepted is authored `CONTENT_ONLY_LOCKED` and MUST be proven unreachable
(§14 traversal; `UNSUPPORTED_CONTENT_REACHABLE` on any reachable locked item);
§13 lists the eight isolation conditions. Because at CONTENT-0 only M1
strategic staples (economy/research/design/construction) are accepted, most
M1-era content authored early is `CONTENT_ONLY_LOCKED` until its governing
mechanic lands; it is promoted to `SUPPORTED_MECHANICAL` per the plan's
promotion rule.

Sources: `docs/delivery/release-scope-and-implementation-order.md` §12:184-200, §13:202-215, §14:217-233;
`docs/research/content-0-pack-layout-classification.md` §4.
