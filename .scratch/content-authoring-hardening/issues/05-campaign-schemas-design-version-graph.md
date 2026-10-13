# 05: Campaign-file schemas — fleets, constructions, designs

**Type:** implementation
**Status:** done
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** The fleet, construction and campaign-design collections are
compiled and cross-referenced by hand but not schema-validated. Give each a
content schema and route them through the strict validator. The campaign-design
schema extends the existing design-template schema, which does not yet cover the
version and family fields the production content carries. A malformed record
fails with the file and field path; the design-version reference graph stays
validated.

## Acceptance criteria

- [ ] Fleet, construction and campaign-design records are each validated by a
      content schema through the strict validator.
- [ ] The campaign-design schema covers every field the production content
      carries (including version and family fields) and rejects excess keys.
- [ ] A malformed record in each collection fails with a diagnostic naming the
      file and the field path.
- [ ] A bad fixture and a positive control exist per collection.
- [ ] The production pack still compiles; existing cross-file reference checks
      remain green.
