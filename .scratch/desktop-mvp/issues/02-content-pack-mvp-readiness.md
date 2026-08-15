Type: research
Status: resolved

## Question

Does the existing canonical content pack at `content/production/1880/`
(loaded via `pack.json`, see `apps/desktop/src/main/project.ts`'s
`loadContentDirectory`) contain enough canonical content (nations, ships,
research, economy) to compile and run a full MVP campaign loop — new game →
at least one strategic month advance → fleet/construction visibility —
without hitting missing-content errors?

Identify any gaps that would block the MVP loop, checking:

- `content/production/1880/` itself (what nations/ship classes/research
  entries/economy data it actually contains).
- `packages/content-schema` and `packages/content-compiler` for what a
  campaign compile requires as a minimum.
- Whether `docs/audit/MIGRATION-AUDIT.md` or `docs/OPEN-ISSUES.md` already
  document known content gaps relevant to this pack.
- Whether existing test fixtures (e.g. those used by
  `apps/desktop/test/production-pack.test.ts`,
  `apps/desktop/test/production-promotion.test.ts`, or
  `packages/cross-process-test`) already exercise a full compile-and-advance
  cycle against this pack, which would be strong evidence either way.

Write findings to a markdown file in the repo (follow existing convention —
`docs/research/` already holds similarly-scoped content research notes) and
link it from this ticket on resolution.

## Answer

**Ready with caveats, not blocked.** Full findings:
[docs/research/content-4-desktop-mvp-pack-readiness.md](../../../docs/research/content-4-desktop-mvp-pack-readiness.md).

- The pack (14 nations, 19 ships, 37 designs, 84 techs, 9 construction
  projects) compiles cleanly and deterministically through the full
  `CampaignCompiler` with zero diagnostics — confirmed by re-running
  `apps/desktop/test/production-pack.test.ts` and
  `production-promotion.test.ts` locally (3/3 pass).
- **Caveat 1 (already tracked in-repo):** all 19 ships lack
  `designVersionId` (`production-promotion.test.ts` asserts this
  explicitly). Raw ship stats render fine; anything needing full design
  detail or tactical promotion per ship won't resolve. Construction-project
  → design linkage is intact (all 9 `constructions.yaml` entries have valid
  `designVersionId`s).
- **Caveat 2 (new finding):** playable nation **Spain** has zero ship
  designs and zero construction projects — a playtester picking Spain sees
  an empty Construction screen. 4 non-playable nations share the gap.
- **Caveat 3 (new finding, most load-bearing for this map):** no test in
  the repo compiles `content/production/1880` and then advances a month /
  saves / loads. `packages/cross-process-test/src/run-child.ts` exercises
  exactly that full loop (compile → `MonthExecutor` → `SaveStore` → replay →
  battle generation) but against a fully synthetic 2-nation fixture defined
  inline, not the canonical pack — the MVP loop's month-advance step is
  untested against real content.
- `docs/audit/MIGRATION-AUDIT.md` and `docs/OPEN-ISSUES.md` are scoped to
  spec-ambiguity auditing, not content-pack gaps — no relevant hits.
