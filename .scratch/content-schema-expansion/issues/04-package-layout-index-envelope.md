# CONTENT-SCHEMA — 04: Package layout, index surface & shared envelope conventions

## Question

Decide and land the expanded package's module layout (one module per domain,
mirroring the research structure), the public export surface, and the shared
envelope conventions: unified `ProvenanceSchema` (object:
`{ source: <7-enum>, version, approved?, generatedAt? }`) and the per-domain
pack pattern `{ scenario, continuityMode, provenance, <data> }`. The legacy
`PackManifest` / `ContentPack` / `RulesetManifest` stay untouched this effort,
marked for bundle reconciliation in the wiring follow-up.

## Type

task

## Status

open

## Notes

- Research source: `content/research/schema/*.ts` pack envelopes; the two
  `ProvenanceSchema` variants (nations enum vs diplomacy object) fold into one.
- Settlements 9 (provenance object + per-domain envelopes + SCREAMING_SNAKE
  registry) and 2 (package-only, no wiring) govern.
- Create `CONTEXT.md` glossary entries (Provenance, per-domain pack) here.

## Blocked by

None.
