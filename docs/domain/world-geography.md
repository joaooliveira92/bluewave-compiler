# DESIGN-14: World Geography

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-14`

World Entities:

- Area.
- Sea zone.
- Possession.
- Port.
- Home area.
- Build area.
- Canal.
- Choke point.
- Route edge.
- Climate profile.

Area State:

- Stable identifier.
- Adjacency.
- Climate.
- Strategic position.
- Associated possessions.
- Eligible battle templates.
- Mine pressure by belligerent.
- Operational reports.

Movement:

- A normal strategic movement traverses one eligible area edge per month unless
  a special rule grants additional movement.
- Long routes are stored as planned paths.
- Each monthly resolution advances the force to the next legal node.
- Operational battle presence is derived from resolved movement.
- A ship is never stored in two areas simultaneously.

Canals:

- Suez is operational at applicable scenario starts unless scenario content
  overrides condition.
- Panama is scheduled to become operational in 1914, subject to scenario event
  and condition rules.
- Canal state includes:
  - legal owner;
  - military controller;
  - operating condition;
  - access policy;
  - mined or blocked state.
- Transit is denied when:
  - the traveler is at war with the controlling authority;
  - bilateral tension with the controller is 7 or higher;
  - the canal is physically closed;
  - another explicit access restriction applies.
- Ships already in transit use the ruleset's locked-route resolution.

Choke Points:

- The Baltic–Northern Europe route may be restricted against Germany's enemies
  after active mine-warfare capability exists and applicable wartime conditions
  are met.
- Choke-point restrictions are explicit route predicates.
