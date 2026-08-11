# CONTENT-SCHEMA — 07: Keep the production pipeline green

## Question

With the canonical schemas in place: port the 14 research nation canons into
production `countries.yaml` (lowercase ids, full rich fields, `isPlayable`),
cascade `nationId` across `fleets`/`economies`/`research`/`constructions`/
`designs` YAML, update the validate stage and campaign compiler reads (playable
from `isPlayable`, not `id === "GBR"`), and re-lock the golden deterministic
content/snapshot hashes in `production-pack.test.ts`.

## Type

task

## Status

open

## Notes

- Research source: `content/research/nations/1880/*.ts` (24 nations; 14 map
  onto production).
- Settlements 11 (port the canon, migrate now), 8 (replace + pipeline green),
  6 (lowercase id / uppercase tag) govern.
- Existing campaign collections (`fleets`, `economies`, …) use uppercase
  `nationId` today; the cascade re-keys them to lowercase.
- `buildSlots`/`buildNationStates` read `id === "GBR"` for playable — switch to
  the data's `isPlayable`.

## Blocked by

01, 02, 03.
