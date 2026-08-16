# Research: Effect v4 Release Reality (ticket 01 — Effect v4 Adoption)

Research-only note; no code, content, or spec files modified. Resolves
`.scratch/effect-v4-adoption/issues/01-effect-v4-release-reality.md` against
primary sources (npm registry, GitHub releases, official docs/blog), as of
**2026-08-16**.

## Question

What is Effect v4, precisely, as of 2026-08-16? Is it released and stable, and
what exact version (or version line) should a greenfield adopter pin? What are
the headline changes from Effect v3 — module reorganizations, renamed/deleted
APIs, package renames, breaking changes — and is there an official v3→v4
migration guide? What is the v4.x release cadence, the minimum Node/TypeScript
support, and any deprecation schedule for v3?

## Sources

All directly verified on 2026-08-16 unless noted.

1. **npm registry — dist-tags** — `https://registry.npmjs.org/-/package/effect/dist-tags`.
   `latest: 3.22.1`, `rc: 4.0.0-rc.109`, `beta: 4.0.0-beta.107`,
   `snapshot: 0.0.0-snapshot-*`. *(directly verified)*
2. **npm registry — `effect/latest` metadata** — `https://registry.npmjs.org/effect/latest`.
   Resolves to 3.22.1; no `engines` field in the published package.json.
   *(directly verified)*
3. **npm registry — publish timeline** — `npm view effect time --json`
   (registry API). Full beta/RC publish history Feb 18 → Aug 14, 2026; v3
   releases through 2026-07-30. *(directly verified)*
4. **GitHub Releases** — `https://github.com/Effect-TS/effect/releases`.
   Latest tag `effect@4.0.0-rc.109`, released 14 Aug 2026, marked
   **Pre-release**. *(directly verified)*
5. **Repo README (main branch = v4)** —
   `https://github.com/Effect-TS/effect/blob/main/README.md`. States "Effect V4
   is currently a release candidate", install via `effect@rc`, and the
   Requirements block (TS 5.9+, Node 18+, strict). *(directly verified)*
6. **MIGRATION.md (official v3→v4 guide)** —
   `https://github.com/Effect-TS/effect/blob/main/MIGRATION.md`.
   *(directly verified)*
7. **migration/v3-to-v4.md (generated import/API rename map)** —
   `https://github.com/Effect-TS/effect/blob/main/migration/v3-to-v4.md`.
   *(directly verified — head read; file is generated, ~1.3 MB)*
8. **Official RC announcement blog, "We think this is it ..."** —
   `https://www.effect.website/blog/releases/effect/40-rc` (12 Aug 2026, by
   Sebastian Lorenz). RC semantics ("interfaces presumed final", no broad
   breaking changes planned) and stable target **Q3/Q4 2026**. *(directly verified)*
9. **Effect v4 Beta: February–May Recap** —
   `https://www.effect.website/blog/effect-v4beta-launch-to-may-recap`
   (launch date, bundle-size numbers, unified versioning, unstable modules).
   *(directly verified)*
10. **Effect v4 Beta: July 2026 Updates** —
    `https://www.effect.website/blog/effect-v4beta-july-recap` (v4 moved to the
    canonical repo; `main` = v4, `v3` branch; `effect-smol` archived). *(content
    retrieved via search result — corroborated by README/releases)*
11. **v3 branch core README** —
    `https://github.com/Effect-TS/effect/blob/v3/packages/effect/README.md`
    (v3 Requirements: TypeScript 5.4+, strict). *(directly verified)*
12. **v3 branch & main branch package.json** —
    `packages/effect/package.json` on both branches. Neither declares an
    `engines` field. *(directly verified)*
13. **Official Effect X/Twitter announcement** (12 Aug 2026): "Effect v4 Release
    Candidate is here! ... entering the final stretch before stable."
    *(corroborating secondary; content matches blog #8)*

## Findings

### 1. Effect v4 is REAL but NOT yet stable — the current stable major is v3

- The `latest` npm dist-tag is **`3.22.1`** (published 2026-07-30). `npm install
  effect` therefore resolves to the **v3 line** — v3 is the current stable major
  [1][2].
- v4 exists as an active prerelease line: **`4.0.0-rc.109`** is the newest
  published version (14 Aug 2026) under the `rc` dist-tag; `4.0.0-beta.107` is
  the newest beta [1][3][4].
- The repo README states: "Effect V4 is currently a release candidate. The
  `main` branch contains v4 development." [5]
- Official RC announcement (12 Aug 2026): the RC is a "statement of confidence";
  interfaces are "**presumed final**", "we have no more broad breaking changes
  planned", and the **stable release is targeted for Q3/Q4 2026** [8].
- Timeline: v4 beta launched **18 Feb 2026** [9]; ~107 beta prereleases shipped
  through 10 Aug 2026; **rc.108 (12 Aug 2026)** announced as "the release
  candidate", **rc.109 (14 Aug 2026)** is the current head [3][4][8].

### 2. Headline v3→v4 changes (official MIGRATION.md + blog recaps + rename map)

1. **Unified versioning.** All ecosystem packages now share a single version
   number and release together (v3 used independent lines: `effect@3.x`,
   `@effect/platform@0.x`, `@effect/sql@0.x`) [6][9].
2. **Package consolidation into the core `effect` package.** `@effect/platform`,
   `@effect/rpc`, `@effect/cluster`, `@effect/ai`, `@effect/experimental`,
   `@effect/cli`, `@effect/workflow` were merged into `effect`; only
   platform-, provider-, or technology-specific packages remain separate
   (`@effect/platform-node|bun|browser|deno`, `@effect/sql-*`, `@effect/ai-*`,
   `@effect/opentelemetry`, `@effect/atom-*`, `@effect/vitest`) and must bump in
   lockstep [6]. Some modules were **removed with no v4 counterpart**, e.g.
   `@effect/ai-amazon-bedrock`, `@effect/ai-google`,
   `@effect/experimental/Machine`, the LMDB persistence backend [7].
3. **Unstable module system.** New functionality ships under
   `effect/unstable/*` (ai, cli, cluster, devtools, eventlog, http, httpapi,
   observability, persistence, process, reactivity, rpc, schema, socket, sql,
   workflow, workers); modules there may break in minor releases and graduate to
   the top-level `effect/*` namespace as they stabilize [6][9].
4. **Rewritten fiber runtime + smaller bundles.** Minimal Effect program bundles
   to ~6.3 KB (minified+gzipped), ~15 KB with Schema [6]; an
   Effect+Stream+Schema program dropped from ~70 kB (v3) to ~20 kB (v4) [9].
5. **API renames/removals** (representative, from the official rename map [7]
   and migration guides [6]):
   - `effect/Either` → `effect/Result`; `effect/FiberRef` → `effect/References`;
     `effect/ParseResult` → `effect/SchemaIssue` / `effect/SchemaParser`;
     `effect/Inspectable` → `effect/Formatter` / `effect/Redactable`;
     `@effect/typeclass/Semigroup` → `effect/Combiner`,
     `@effect/typeclass/Monoid` → `effect/Reducer`.
   - STM modules: `TMap`→`TxHashMap`, `TQueue`→`TxQueue`, `TRef`→`TxRef`,
     `TSet`→`TxHashSet`, `TPubSub`→`TxPubSub`, etc.
   - Services: `Context.Tag` → `Context.Service` (ServiceMap renamed back to
     Context during the beta); `FiberRef` → `Context.Reference` [6][9][10].
   - Schema overhaul (largest migration surface): `Schema.ErrorClass` →
     `Schema.Error`, `Schema.TaggedErrorClass` → `Schema.TaggedError`;
     `Schema.Codec.ToAsserts` removed; makeUnsafe→make rename reversed;
     context-aware defaults; plus a dedicated Schema migration guide [6][9].
   - `Effect.Yieldable` removed; `Runtime<R>` generic removed; fiber keep-alive
     (automatic process lifetime management) and cross-`provide` Layer
     memoization are behavioral changes [6][10].

### 3. Minimum Node.js and TypeScript support

- **v4 (RC line):** TypeScript **5.9 or newer** (TypeScript 7 recommended), Node.js
  **18 or newer** as the general minimum (integration packages may require more,
  e.g. `@effect/sql-sqlite-node` requires Node 22.16+), `strict` flag required [5].
- **v3 (stable line):** TypeScript **5.4 or newer**, `strict` flag required [11].
  The v3 Node.js floor is **not documented** in the v3 core README or package.json
  (no `engines` field) [12] — see Deferred.

### 4. Release cadence and v3 deprecation schedule

- **v4 cadence:** very high — ~109 prereleases (beta.0 … rc.109) between
  18 Feb and 14 Aug 2026, often multiple per week (e.g. beta.103–107 in one
  week, 4–10 Aug; rc.108 → rc.109 two days apart) [3]. Weekly public recap via
  the "This Week in Effect" blog. Stable targeted Q3/Q4 2026 [8].
- **v3 line:** still actively maintained. Releases continued through July 2026
  (3.21.1 → 3.22.1), v3 source lives on the `v3` branch, and the README directs
  v3-targeted issues/PRs to that branch [3][5].
- **v3 deprecation:** **no official EOL/deprecation date has been announced** in
  any source consulted. The only forward-looking official statement is the v4
  stable target of Q3/Q4 2026 [8].

### 5. What a greenfield adopter should pin today

- v4 is **not stable**; official guidance installs it via the `rc` dist-tag [5][8].
- The only stable, `latest`-tagged line is **v3 (`3.22.1`)** [1][2].
- For existing projects the maintainers explicitly say "now is the best time to
  migrate" [8]; for greenfield the official npm surface still resolves to v3.

## Recommendations

1. **Pin the stable v3 line today: `effect@3.22.1`** (exact pin, consistent with
   the repo's frozen-lockfile policy; `^3.22.1` if floating patches are
   preferred). This is the only stable major, and v3 continues to receive
   releases with no announced EOL [1][2][3].
2. **Do not adopt `effect@4.0.0-rc.109` for production.** RC interfaces are
   "presumed final" with no broad breaking changes planned, but stable is not
   yet shipped (target Q3/Q4 2026) and the migration guide's own header still
   warns APIs "may change between beta releases" [6][8]. Treat the RC as an
   evaluation spike line only.
3. **Correct the adoption map's premise**: the map targets "the current stable
   v4 line" — no such line exists as of 2026-08-16. The decision between
   "adopt stable v3 now and migrate at 4.0.0", "wait for 4.0.0 stable", or
   "evaluate rc now" is an orchestration/ADR decision, not a research fact
   (see map note: tickets never hand-resolve decisions without the human side
   of a grilling exchange).
4. If v4 is adopted at stable, budget for the documented migration surface:
   the generated import/API rename map [7], the Schema overhaul, service
   definitions (`Context.Service`), and behavior changes (layer memoization,
   fiber keep-alive) [6]. The official tooling goal is a near-fully automated
   migration via MIGRATION.md [8].
5. Environment constraints when v4 is eventually adopted: TS ≥ 5.9 (TS 7
   recommended), Node ≥ 18, `strict` [5]. These are within Bluewave's current
   toolchain (TS 7.0.2 / NodeNext) — no toolchain blocker, but that is ticket
   02's question, not this note's.

## Deferred

- **v3 EOL/deprecation date:** no official statement exists; revisit when
  v4.0.0 stable ships (target Q3/Q4 2026) [8].
- **v3 minimum Node version:** not stated in the v3 core README or package.json
  (no `engines` field); only v4 documents Node 18+ [5][11][12].
- **Exact stable 4.0.0 version number:** unknowable until release; today the
  head is `4.0.0-rc.109` [1][3][4].
- **MIGRATION.md header staleness:** the guide's top note still says "v4 is
  currently in beta" despite the RC transition; content itself is current.
  Flagged so downstream tickets don't read the header as authoritative status.
- **Schema-vs-Zod policy (ticket 07):** whether the decision should wait for
  v4-stable Schema is an orchestration decision; the Schema migration surface
  in v4 is the largest single delta documented above.
