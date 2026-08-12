# CONTENT-0 — 02: Maximum supported campaign duration for the anchor scenario

## Question

What is the maximum supported campaign duration (in completed months) that the
primary scenario declares, and how does that bound its reachable era bands?
DESIGN-55 §17 requires every reachable band to have full coverage, and §20 lets
an unreachable family be proven unreachable. The chosen max duration is a
materially constraining decision because it determines which era bands are
"reachable" and therefore which mechanics must be accepted at REL-1.

## Type

research

## Status

resolved

## Notes

- DESIGN-01 §1: long-form = at least 120 strategic turns after any supported
  start date (except explicit early terminal condition). This is a FLOOR on the
  intended sim length, not necessarily a cap.
- DESIGN-03 §2: sim end is completion of December 1970; a campaign may end
  earlier under DESIGN-02 terminal conditions.
- DESIGN-55 §11 era bands are calendar-based (EARLY 1880–1899 … LATE 1960–1970).
- A campaign starting scen_1880 that runs to Dec 1970 reaches all five bands; a
  bounded max duration keeps it inside fewer bands.

## Blocked by

01

## Answer

**Maximum supported campaign duration: 1092 completed months** (January 1880
through completion of December 1970) — the full simulation span, per DESIGN-03
§2 (sim ends at completion of Dec 1970; `SIMULATION_END_REACHED` blocks Jan
1971). There is no canonical numeric whole-campaign maximum shorter than the
simulation end (research §4); the 120-turn figure is the `long-form` floor, and
the 120-month figure in war-and-peace.md is war-specific.

Therefore scen_1880's reachable era bands are all five (§11). The
`ScenarioSupportManifest` (DESIGN-55 §15) declares `maximum supported campaign
duration = 1092` months, which forces the full M1–M5 closure at REL-1 but is
the coherent end-state the project targets.

Sources: `docs/rules/campaign-configuration.md` §2; `docs/delivery/release-scope-and-implementation-order.md` §11/§15;
`docs/vision/game-vision.md` §1; `docs/research/content-0-scenario-era-bands.md` §4–§5.
