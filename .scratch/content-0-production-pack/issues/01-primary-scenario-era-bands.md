# CONTENT-0 — 01: Primary FULLY_SUPPORTED scenario and reachable era bands

## Question

Which canonical scenario is the primary `FULLY_SUPPORTED` acceptance anchor
(DESIGN-55 §17) for the production content effort, what is its start date, and
which era bands (DESIGN-55 §11) does it reach? This fixes the mechanics that
must be `ACCEPTED` at REL-1 and bounds CONTENT-1's authoring scope.

## Type

research

## Status

claimed

## Notes

- `DESIGN-03` §1 defines five scenarios, all starting in January;
  §2 sim ends Dec 1970.
- `DESIGN-01` §1: "long-form" = at least 120 strategic turns after any start;
  §3 MAY span multiple eras; §5 player experience spans supported eras.
- `DESIGN-55` §11 era bands; §17 full-support requires every reachable band to
  have complete required strategic + tactical coverage; §20 an unreachable
  system family does not block support only when unreachability is PROVED.
- The plan's anchor rule: lock ONE primary scenario here; later content/support
  checks refer to it.

## Blocked by

None.

## Answer

**Primary scenario: `scen_1880`, start January 1880.** The earliest canonical
scenario is the natural acceptance anchor: it spans the game's full declared
simulation scope (1880–Dec 1970, DESIGN-01 §1, DESIGN-03 §2), matches the 1880
fixture lineage, and its reachable bands determine the full mechanics closure.

**Reachable era bands: all five** — `EARLY`, `PRE_WAR`, `INTERWAR`,
`MID_CENTURY`, `LATE` (DESIGN-55 §11). Grounds: the simulation always ends at
completion of December 1970 (DESIGN-03 §2); no canonical whole-campaign
maximum-duration constant shortens it (research note §4); the 120-turn
`long-form` floor (DESIGN-01 §1) is a minimum. Jan 1880 → Dec 1970 = 1092
turns, touching all five bands (research note §5).

Consequence: FULLY_SUPPORTED (DESIGN-55 §17) for scen_1880 requires complete
strategic + tactical coverage across all five bands, which by §20 also lets
any system family prove unreachability where truly out of reach. This is the
end-state the project targets (M1–M5 accepted). CONTENT-1 authors the EARLY/M1
slice first; later milestones fill later bands. Locked for all later content
and support checks.

Sources: `docs/rules/campaign-configuration.md` §1–§2; `docs/delivery/release-scope-and-implementation-order.md` §11/§17/§20;
`docs/vision/game-vision.md` §1; `docs/research/content-0-scenario-era-bands.md`.
