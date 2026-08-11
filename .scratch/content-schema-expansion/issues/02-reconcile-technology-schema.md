# CONTENT-SCHEMA — 02: Reconcile the Technology schema

## Question

Merge the research `Technology` entity (field, historicalAvailability,
variationEligible, researchCost, effects, adoptionType, aiValue) with the
normative/locked identifiers (`researchFieldId` SCREAMING_SNAKE, `hc_`-style
ids, `prerequisites: [{techId}]`, `category`, `cost`, `discoveryWeight`,
`year`) into one canonical schema. Resolve the research-vs-production field
conflicts: researchCost vs cost; historicalAvailability vs year/availabilityMonth;
`field` vs `researchFieldId`. Decide how the research tech corpus data
(snake_case fields, `hull_iron`-style ids) aligns or is dropped.

## Type

grilling

## Status

open

## Notes

- Research source: `content/research/schema/technologies.ts` + top-level
  `content/research/technologies.ts`.
- Normative authority: DESIGN-20 §1 field registry
  (`docs/rules/research-and-technology.md`), the package's
  `CANONICAL_RESEARCH_FIELD_IDS`, and the hash-locked production
  `technologies.yaml` (`hc_` ids, `researchFieldId` casing).
- Settlement 5 (shape wins, identifiers/locked values win) governs.
- Invoke `/grilling` and `/domain-modeling`.

## Blocked by

None.
