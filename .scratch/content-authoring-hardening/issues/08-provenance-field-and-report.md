# 08: Provenance field and `content:check` confidence report

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

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
