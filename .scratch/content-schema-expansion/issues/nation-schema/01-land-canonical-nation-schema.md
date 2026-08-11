# 01 — Land the canonical NationSchema in the package (with corpus tags and glossary)

**What to build:** `@bluewave/content-schema` gains the canonical Nation schema: the
research `Nation` shape (strict; `id` is the 24-member lowercase `NationIdSchema`;
`tag` is an uppercase 3-letter code; `presentation` uses hex colors; the rich canon
fields are required; `military` is optional) with the reconciled deltas — the `Ai`
archetype/role are the research enums, `NationSlot` carries an `id`, and the legacy
`color`/`logisticsProfile` fields are dropped. The 24 research nation canon data files
each gain their uppercase `tag` and parse against the schema. A `CONTEXT.md` glossary
is created at the repo root with `Nation`, `NationId`, and `tag` entries. The legacy
`CountrySchema` / `Country` type / `ContentPack` are left untouched this ticket — the
repo stays green.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `@bluewave/content-schema` exports `NationSchema`, `Nation`, `NationIdSchema`,
      `NationId`, and the nation sub-schemas/types; `CountrySchema`/`Country` are
      still exported and unchanged.
- [ ] `NationSchema` is strict; `id` accepts only the 24 lowercase nation ids, `tag`
      only uppercase 3-letter codes, `presentation` only hex colors; the rich canon
      fields are required and `military` is optional.
- [ ] All 24 research nation canon objects carry an uppercase 3-letter `tag` and
      parse against `NationSchema`.
- [ ] `CONTEXT.md` exists at the repo root with `Nation`, `NationId`, and `tag`
      glossary entries.
- [ ] Package tests pass; repo-wide typecheck, tests, and lint stay green (no
      consumer-facing wiring changed).
