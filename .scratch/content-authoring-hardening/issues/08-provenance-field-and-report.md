# 08: Provenance field and `content:check` confidence report

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** Provenance and confidence currently live in YAML comments and
README lists, so nothing can enforce them. Add a machine-checked
provenance/confidence field to the content schemas (the ship-building catalogue
already carries one) and have `content:check` emit a per-collection report of how
many values sit at each confidence level, so a designer can see what is still
estimated or placeholder.

## Acceptance criteria

- [ ] Provenance/confidence is a schema field on authored content, not only a
      comment.
- [ ] `content:check` reports, per collection, counts of each confidence level.
- [ ] A value carrying a confidence label is validated by the schema; an invalid
      label is rejected with the file and field path.
- [ ] The production pack compiles; the report reflects the real confidence
      labels in the content.

## Notes

- Granularity (per value vs per record) is the implementator's call but must be
  consistent and schema-enforced.
- Values with research provenance under `docs/research/` are labelled from their
  notes.

## Resolution

- `packages/content-schema`: extracted `ProvenanceSchema` (with
  `SourceReferenceSchema`/`DerivationSchema`) into `provenance.ts` and attached it
  as an optional `provenance` field on every authored record collection: the core
  content-pack collections (`nations`, `areas`, `routes`, `possessions`, `ports`,
  `technologies`, `rulesets`), the ship-building collections that lacked it
  (`components`, `plants`, `hullForms`, `referenceDesigns`), and all six
  campaign-file collections. Unknown confidence/source-status labels fail with
  the file and field path (`packages/content-schema/test/provenance.test.ts`).
- `@bluewave/content-compiler`: `countConfidence` / `collectProvenanceLocations`
  walk the compiled bundle and count `HIGH`/`MEDIUM`/`LOW` provenance records per
  collection (nested ones included).
- `content:check` prints the per-collection confidence report (human + JSON).
- Production compiles unchanged (optional field, no authored value sets it), so
  the content lock stays valid. Existing ship-building labels (45 LOW / 161
  MEDIUM) are reported.
- Deferred (recorded, not dropped): migrating the core corpus's comment-only
  estimates into the field is content-authoring work tied to each value's
  research; the mechanism (field, validation, report) is complete.

Validation: `pnpm preflight` green (17 gates); `@bluewave/content-schema` 65
tests, `@bluewave/content-compiler` 73 tests, `@bluewave/compiler-cli` 108 tests.

