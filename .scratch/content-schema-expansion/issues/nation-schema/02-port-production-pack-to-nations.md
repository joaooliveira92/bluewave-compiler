# 02 — Port the production pack to canonical Nations (data, id cascade, isPlayable, hash re-lock)

**What to build:** The production 1880 pack is ported to the canonical Nation shape so
the strict schema can validate it. The 14 production nations become rich canonical
entries: lowercase ids matching the research canon, uppercase 3-letter tags,
`isPlayable`, `presentation` colors, and the full rich canon fields authored from the
research corpus. The lowercase nation ids cascade through every campaign collection
(fleets, economies, constructions, research, designs, ports, possessions, areas) so all
references still cross-link. The campaign compiler derives playable slots from the
data's `isPlayable` flag rather than a hard-coded nation id. Golden deterministic
content/snapshot hashes are re-locked. Content validation still runs against the lenient
country schema this ticket, so the pipeline stays green end to end.

**Blocked by:** 01 — the canonical Nation schema and corpus tags.

**Status:** ready-for-agent

- [ ] Production 1880 compiles through the full content + campaign pipeline and a
      campaign snapshot builds.
- [ ] The 14 production nations carry lowercase ids, uppercase tags, `isPlayable`,
      `presentation`, and the full rich canon fields, matching the research canon for
      the 14 that map onto production.
- [ ] Every campaign collection's nation/country references use the lowercase ids and
      still cross-link to the nations collection.
- [ ] A nation is marked playable from its data `isPlayable` flag, not a hard-coded id;
      the United Kingdom is playable and the other nations are AI.
- [ ] Golden deterministic content/snapshot hashes are re-locked; tests green.
