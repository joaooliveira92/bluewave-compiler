# CONTENT-2 — 04: Reachability & DESIGN-55 §12 classification

## Question

How is every authored PRE_WAR feature classified, and how is the no-unreachable-
locked-content invariant (DESIGN-55 §13/§14) preserved?

## Type

decision

## Status

resolved

## Notes

- DESIGN-55 §12: `SUPPORTED_MECHANICAL` requires an accepted owning capability;
  anything else is `CONTENT_ONLY_LOCKED` and must be proven unreachable (§14).
- Research (DESIGN-20) and Ship Design (DESIGN-21) are `ACCEPTED` (A-0b PASS),
  so a research tech / design template is `SUPPORTED_MECHANICAL` when every
  prerequisite is itself in the authored set.
- `scen_1880` runs to Dec 1970 (1092 months), so PRE_WAR (Jan 1900–Dec 1919)
  techs are reachable in a normal campaign — they must be `SUPPORTED_MECHANICAL`,
  not `CONTENT_ONLY_LOCKED`.

## Answer

- **All PRE_WAR techs and designs in tickets 02–03 are declared
  `SUPPORTED_MECHANICAL`.** Owning capabilities Research + Ship Design are
  accepted; the DAG stays acyclic with prerequisites only in the authored EARLY∪PRE_WAR
  set, so no `TECHNOLOGY_PREREQUISITE_CYCLE` and no cross-era forward reference.
- **AVIATION / CARRIER_OPERATIONS PRE_WAR techs are not authored** (not even
  `CONTENT_ONLY_LOCKED`): authoring a reachable AVIATION research tech whose unit
  family is M4 (unaccepted) would violate §14 (unreachable-locked content).
  They are deferred to the D-track content sprints.
- The campaign `TechnologyVariationProfile` (DESIGN-03 §6) must still pass after
  adding PRE_WAR techs (acyclic eligibility metadata), and DESIGN-20 historical
  timing applies to each `year`.

Sources: DESIGN-55 §11–14, §20; `.ai/briefs/content-1-m1-production-content.md`
(classification pattern); `Apps/…` campaign `technologyVariation.ts`.