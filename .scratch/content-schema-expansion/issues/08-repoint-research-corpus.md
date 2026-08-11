# CONTENT-SCHEMA — 08: Re-point the research corpus and retire content/research/schema/

## Question

Mechanically re-point the 109 research data files' type imports at
`@bluewave/content-schema`, delete `content/research/schema/`, and add a
standalone tsconfig (not in the turbo build) so the corpus typechecks against
the package. Align or drop the technology corpus data per 02's resolution.

## Type

task

## Status

open

## Notes

- Settlement 9 (validation corpus) governs.
- The corpus is the validation proof for the absorbed schemas and the seed for
  future content authoring.
- Domains whose data conflicts with the reconciled schemas are aligned in this
  ticket (or explicitly dropped if superseded — e.g. technology tree data is
  superseded by the production `technologies.yaml`).

## Blocked by

01, 02, 03, 04, 05, 06.
