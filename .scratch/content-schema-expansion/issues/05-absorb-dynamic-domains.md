# CONTENT-SCHEMA — 05: Absorb the dynamic domains (diplomacy, fleets, wars, events)

## Question

Land canonical zod schemas + inferred types for diplomacy (the rich top-level
`content/research/diplomacy.ts` variant — the data's source — folding the
distilled `schema/diplomacy.ts` enum drift into it), fleets, wars, and events,
conforming to 04's envelope conventions; export from the package index.

## Type

task

## Status

open

## Notes

- Research source: top-level `content/research/diplomacy.ts` (rich),
  `content/research/schema/{fleets,wars,events}.ts`.
- Settlement 7 (rich diplomacy wins, enum drift folds in) and 9 (envelope)
  govern.
- The diplomacy `superRefine` cross-field checks and scenario guardrails
  (anachronism, Triple Alliance date) are part of the canonical schema;
  data-adjacent helpers (`getTension`, `DEFAULT_TENSION_SCALE`, …) stay in the
  corpus, not the package.

## Blocked by

04.
