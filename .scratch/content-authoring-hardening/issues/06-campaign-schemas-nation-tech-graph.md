# 06: Campaign-file schemas — economies, research, diplomacy

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

**What to build:** The economy, research and diplomacy collections are compiled
but not schema-validated. Give each a content schema and route them through the
strict validator, so a malformed record fails with the file and field path and
nation/technology references stay validated.

## Acceptance criteria

- [ ] Economy, research and diplomacy records are each validated by a content
      schema through the strict validator.
- [ ] A malformed record in each collection fails with a diagnostic naming the
      file and the field path.
- [ ] A bad fixture and a positive control exist per collection.
- [ ] The production pack still compiles; nation/technology reference checks
      remain green.
- [ ] A collection absent from a pack is not a false positive.
