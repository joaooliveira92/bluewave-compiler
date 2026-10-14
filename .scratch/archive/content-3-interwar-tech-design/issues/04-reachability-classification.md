# CONTENT-3 — 04: Reachability & DESIGN-55 §12 classification

## Question

How is each authored INTERWAR feature classified, and how is no-reachable-locked-
content (DESIGN-55 §13/§14) preserved?

## Type

decision

## Status

resolved

## Notes

- `SUPPORTED_MECHANICAL` requires an accepted owning capability; a research tech
  is so classified when every prerequisite is in the authored set (Research and
  Ship Design are `ACCEPTED`).
- `scen_1880` runs to Dec 1970 and reaches INTERWAR (Jan 1920–Dec 1939), so these
  techs/designs are reachable and must be `SUPPORTED_MECHANICAL`, not
  `CONTENT_ONLY_LOCKED`.

## Answer

- **All INTERWAR techs/designs = `SUPPORTED_MECHANICAL`.** DAG acyclic; prereqs
  only in authored EARLY∪PRE_WAR∪INTERWAR set.
- **Deferred-family fields not authored** (AVIATION, CARRIER_OPERATIONS,
  RADAR_AND_ELECTRONICS, MISSILES, AMPHIBIOUS_OPERATIONS): no reachable research
  tech referencing an unsupported unit family.
- The campaign `TechnologyVariationProfile` (DESIGN-03 §6) must still pass after
  adding INTERWAR techs (acyclic eligibility metadata), and DESIGN-20 historical
  timing applies per `year`.

Sources: DESIGN-55 §11–14; DESIGN-03 §6; CONTENT-1/2 classification pattern.