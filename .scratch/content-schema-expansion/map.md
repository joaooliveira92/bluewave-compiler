# Wayfinder Map: CONTENT-SCHEMA — Canonical Content Definitions

## Destination

Make `packages/content-schema` the single canonical home of the researched
content definitions from `content/research/`. Every researched domain lands as
canonical zod schemas (all 15 `content/research/schema/` files, plus the rich
top-level diplomacy schema); the legacy first-gen schemas are reconciled to
them (Country→Nation rename, lowercase 24-member `NationId` enum,
research-shape Port/Area/Possession/Technology); `content/research/schema/`
is retired; the research corpus is re-pointed at the package and typechecks
against it as a validation corpus (standalone tsconfig, not in the turbo
build); and the production pack + compiler/campaign reads are updated so the
existing pipeline stays green — **without** adding validation of new
collections to the compiler.

## Notes

- Domain: `README.md`, `docs/domain/`, and `docs/rules/` (DESIGN-xx) are
  canonical. Canonical entity term is **Nation** (DESIGN-12, DESIGN-04);
  "country" is deprecated. Domain docs use `nationId`.
- Approved rules (grilling, this session): research wins on **shape**,
  normative docs + hash-locked production win on **identifiers**;
  `Nation.id` = lowercase 24-member enum, `tag` = uppercase 3-letter code;
  the rich top-level `content/research/diplomacy.ts` is the canonical
  diplomacy source; `Provenance` = unified object
  `{ source: <7-enum>, version, approved?, generatedAt? }`; per-domain pack
  envelopes are canonical; `CANONICAL_RESEARCH_FIELD_IDS` stays SCREAMING_SNAKE.
- Pipeline-green constraint: the content-compiler validate stage and the
  campaign compiler must keep compiling against the canonical schemas; the
  deterministic content/snapshot hashes are re-locked, not frozen.
- Wiring the NEW collections (diplomacy, wars, events, fleets, …) into the
  compiler is a follow-up effort, out of scope here.
- `content/research/` is not in any tsconfig today; the corpus gets its own
  standalone tsconfig, not wired into turbo.
- Skills: `/grilling` + `/domain-modeling` for 02 and 03; create the
  `CONTEXT.md` glossary (Nation, NationId, tag, Provenance, per-domain pack,
  validation corpus) as terms resolve.

## Decisions so far

<!-- populated as tickets are resolved -->

## Not yet specified

- Field-level merges for Technology (researchCost vs cost; historicalAvailability
  vs year/availabilityMonth) — sharpened by [02-reconcile-technology-schema](issues/02-reconcile-technology-schema.md).
- Whether the research world/ports/possessions data set matches production
  (area/port/possession counts and identities) and which path production takes
  to the canonical shapes — inside [03-reconcile-world-possessions-schemas](issues/03-reconcile-world-possessions-schemas.md).
- Reconciliation of the per-domain pack envelopes with the legacy
  `ContentPack`/`PackManifest` bundle — the wiring follow-up.
- Whether the research technology corpus data is aligned to the reconciled
  schema or dropped — inside [02-reconcile-technology-schema](issues/02-reconcile-technology-schema.md).

## Out of scope

- Wiring new domain collections into the compiler validate stage and campaign
  compiler reads (diplomacy, wars, events, fleets, …) — the wiring follow-up.
- Zod 4 upgrade (research schemas are written zod-4-compatible; the package
  stays on zod 3 this effort).
- Authoring content beyond the ported nation canon (later era bands,
  diplomacy content, etc.).
- Wider engine playable-slot/logic refactors beyond the minimal
  `isPlayable` read.
