# CONTENT-SCHEMA — 01: Reconcile the Nation schema and rename Country→Nation

## Question

Land the canonical `NationSchema` in `packages/content-schema`: the research
`Nation` shape (`.strict()`, `id` = 24-member lowercase `NationIdSchema`,
`tag` = uppercase 3-letter code, `presentation` hex colors, rich required canon
fields, `military` optional), replacing `CountrySchema` / `Country` /
`ContentPack.countries`; update every in-repo consumer (content-compiler
validate stage, campaign compiler, apps/desktop, apps/compiler-cli,
test-support, cross-process-test); **no compat aliases** — a clean rename.

## Type

task

## Status

open

## Notes

- Research source: `content/research/schema/nations.ts` + `nations.ids.ts`.
- Domain term: **Nation** (DESIGN-12, DESIGN-04); field is `nationId`.
- Create `CONTEXT.md` glossary entries as terms resolve.
- Settlement 3 (Country→Nation) and 4 (lowercase id, uppercase tag) from the
  charting grilling.

## Blocked by

None.
