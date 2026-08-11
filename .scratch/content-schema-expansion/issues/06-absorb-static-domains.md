# CONTENT-SCHEMA — 06: Absorb the static domains (ship-components, ruleset, ai-profiles, aircraft, archetypes, coastal-defenses)

## Question

Land canonical zod schemas + inferred types for ship-components, ruleset,
ai-profiles, aircraft, archetypes, and coastal-defenses from
`content/research/schema/`, conforming to 04's envelope conventions; export
from the package index.

## Type

task

## Status

open

## Notes

- Research source: `content/research/schema/{ship-components,ruleset,ai-profiles,aircraft,archetypes,coastal-defenses}.ts`.
- Settlement 1 (absorb all researched domains) governs.
- `RulesetPackSchema.provenance` uses the literal `RULESET_CONSTANT`; it folds
  into the unified `ProvenanceSchema.source` enum per 04.

## Blocked by

04.
