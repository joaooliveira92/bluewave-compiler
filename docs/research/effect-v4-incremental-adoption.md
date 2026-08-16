# Research: Effect v4 — Incremental Adoption Path

Grounds wayfinder ticket 03 (`.scratch/effect-v4-adoption/issues/03-incremental-adoption-path.md`)
for the "Effect v4 Adoption" map: the officially recommended incremental
adoption path, which submodules are standalone-adoptable without the runtime,
how Effect Schema coexists with Zod, and what tooling supports the transition.

**Version context (verified 2026-08-16):** Effect v4 is at **Release Candidate**
— npm dist-tags: `latest: 3.22.1` (v3 still npm-latest), `beta: 4.0.0-beta.107`,
`rc: 4.0.0-rc.109`. The RC announcement ("We think this is it…", 2026-08-12)
declares interfaces "presumed final", targets stable Q3/Q4 2026, and calls the
v3→v4 migration guide "intended to give your coding agent enough context to
perform a **near-fully automated migration**". The v4 codebase now lives in
`Effect-TS/effect` (main); the official v4 docs are at **effect.plants.sh**.

**Headline findings**

1. Incremental adoption is the **officially designed path**, not a compromise:
   "Effect is designed to be adopted **gradually**, one module at a time, while
   the rest of your code keeps running as plain `async`/`Promise` TypeScript"
   (official v4 docs, "Incrementally migrating to Effect"). There is **no
   official "all-in" requirement**.
2. The official adoption **order is architectural, not a module ladder**: (1)
   centralize platform edges in plain code, (2) one self-contained
   boundary-heavy service (incl. Schema validation), (3) set conventions day
   one, (4) effectify **leaf services first, orchestration last**, (5) unify
   into **one long-lived `ManagedRuntime`**, (6) push Effect to entrypoints
   last — behind `runPromise` "facades". **No official "schema → data → errors →
   effect" module order exists.**
3. Standalone-adoptable without the runtime: `Schema` (sync decode APIs exist),
   `Data`, `Option`, `Result` (v4's rename of `Either`), `Predicate`, `Cause`/
   `Exit` (data structures), `Equal`/`Hash` — all in the single `effect` package
   root barrel. **There is no `effect/Error` module in v4.**
4. Zod coexistence: official guidance is **one source of truth** — define once
   in Effect `Schema`, **derive** the Zod representation from the Schema AST
   during the transition, then **delete the generic bridge** once domains are
   migrated. No official schema↔zod npm bridge package exists from Effect-TS.
5. Tooling: no v4 codemod; the official migration aid is the machine-generated
   rename map + per-topic guides + the **`@effect/tsgo` LSP linter** (incl. an
   `outdatedApi` diagnostic that flags v3 APIs and suggests v4 replacements).
   No official `@effect/tsconfig` package (npm 404).

---

## 1. Question

What is Effect's officially recommended path for adopting v4 **incrementally**
into an existing codebase — Schema first? Data-only? Effect confined to isolated
modules? Which submodules (`effect/Schema`, `effect/Data`, `effect/Error`,
`effect/Cause`, `effect/Either`/`Result`, `effect/Option`, `effect/Predicate`)
can be adopted standalone without pulling in the runtime? How does Effect Schema
coexist with other validators (Zod) in the same codebase, and is there official
guidance on gradual adoption vs. the "all-in" stance — including any official
recommended order and tooling (codemods, eslint rules, tsconfig helpers)?

## 2. Sources

| Source | What it is | Verified |
| --- | --- | --- |
| https://effect.plants.sh/additional-resources/incremental-migration/ | Official v4 docs: "Incrementally migrating to Effect" (strategy guide grounded in opencode's real migration) | ✅ read in full |
| https://effect.plants.sh/additional-resources/migrating-from-v3/ | Official v4 docs: "Migrating from v3" (v3→v4 delta, packaging, imports, bundle size) | ✅ read in full |
| https://effect.plants.sh/introduction/importing-effect/ | Official v4 docs: package layout, core vs `effect/unstable/*`, named vs deep imports | ✅ read |
| https://effect.plants.sh/introduction/why-effect/ | Official v4 docs: "You don't have to adopt all of it at once — start with the pieces that solve your immediate problem" | ✅ read |
| https://effect.plants.sh/schema/ + /data-types/data/ | Official v4 docs: Schema overview (sync decode), Data module (`Data.TaggedError` vs `Schema.TaggedErrorClass`) | ✅ read |
| https://effect.website/ (homepage FAQ) | Official site FAQ: "Is it possible to adopt Effect in an existing codebase? Yes!" (wrap via `Effect.tryPromise` / `Effect.runPromise`, refactor leaf modules upward) | ✅ read |
| https://effect.website/blog/releases/effect/40-rc/ | Official RC announcement (2026-08-12): rc.108, "presumed final", agent-assisted migration via MIGRATION.md | ✅ read |
| https://effect.website/blog/releases/effect/40-beta/ | Official v4 beta post (2026-02-18): bundle-size numbers (70→20 kB), 17 unstable modules, v3 feature-freeze, "v3 remains recommended for production" (as of beta) | ✅ read |
| `Effect-TS/effect` (main): `MIGRATION.md`, `migration/v3-to-v4.md`, `packages/effect/src/*.ts`, `packages/effect/src/unstable/*`, `packages/*` | The v4 source of truth: official migration guide + machine-generated rename maps (16,125 lines) + stable-core module listing | ✅ read via GitHub raw/API |
| npm registry (`registry.npmjs.org`): `effect`, `@effect/tsconfig`, `@effect/eslint-plugin` | dist-tags and publish status (rc.109 / 3.22.1; tsconfig 404; eslint-plugin 0.3.2 @ 2025-04-24) | ✅ queried |
| https://unpkg.com/effect@4.0.0-rc.109/package.json | v4 rc exports map (root barrel, `./*` deep wildcard, `./unstable/*`) | ✅ read |
| https://github.com/Effect-TS/tsgo (+ mintlify tsgo docs, "Migrating from V3") | Official LSP-based linter (linked as "Linting Rules" from effect.website footer): diagnostics incl. `outdatedApi` | ✅ read |
| Effect-TS org repos (`api.github.com/orgs/Effect-TS/repos`): `codemod`, `eslint-plugin`, `tsgo`, `language-service`, `skills` | Org-level tooling inventory + last-push dates (codemod stale since 2024-07) | ✅ queried |
| https://effect.website/docs/v3/schema/introduction | v3 Schema intro (TS 5.4+ / `strict` / `exactOptionalPropertyTypes` requirements, Standard Schema capability) | ✅ read |
| Effect Days 2025 workshop "Incremental Adoption of Effect" (Tim Smart, YouTube) | Official event content; supplementary, not treated as normative | ⚠️ listed only |

## 3. Findings

### 3.1 Q1 — The official incremental-adoption path (and the "all-in" stance)

**The official stance is explicitly pro-gradual.** There is no all-in
requirement anywhere in the v4 docs:

- Homepage FAQ (effect.website): "Is it possible to adopt Effect in an existing
  codebase? **Yes!** You can start small, wrapping existing async code or APIs
  in Effect and expanding from there… From there, you can progressively refactor
  **leaf modules** into Effects, moving upward through your codebase."
- "Why Effect?" (v4 docs): "You don't have to adopt all of it at once — start
  with the pieces that solve your immediate problem, and reach for more as you
  go."
- "Incrementally migrating to Effect" (v4 docs, the canonical page): "Most teams
  cannot stop the world and rewrite an application in Effect. The good news is
  that you do not have to: Effect is designed to be adopted **gradually**, one
  module at a time, while the rest of your code keeps running as plain
  `async`/`Promise` TypeScript."

**The one idea everything rests on:** Effect code is a lazy value until you run
it. Incremental adoption = build **one long-lived runtime**
(`ManagedRuntime.make(AppLayer)`), call into it from existing code via
`runtime.runPromise(...)` returning a normal `Promise`. That "facade" keeps
Effect and non-Effect code coexisting indefinitely; delete facades once callers
are themselves Effects.

**The order that works (official, verbatim structure):**

1. **Centralize platform edges first — in plain code** (no Effect yet): funnel
   all I/O through a handful of internal modules so the later swap is contained.
2. **Start with one self-contained, boundary-heavy service** — a brand-new leaf
   service with network + database + **schema validation**, an end-to-end
   vertical slice (service → layer → runtime → facade). Not "a sprinkle of
   Schema across existing files".
3. **Set conventions on day one** (services, errors, tracing): `Context.Service`,
   `Effect.fn("Name.method")`, `Schema.TaggedErrorClass` for errors, one module
   per service, flat exports.
4. **Effectify leaf services first, orchestration last** — convert services with
   few dependencies before high-fan-in ones (config, provider, session came
   last in the reference migration).
5. **Unify into one runtime** once enough services exist (each can carry a small
   `ManagedRuntime` early).
6. **Push Effect to the outermost edges last** — CLI entrypoints / HTTP server
   converted after the services they call.

Resulting shape of a half-migrated codebase: **pure Effect core** (services +
layers), **thin facade ring** (Promise-translating boundaries), **plain code at
the edges** (entrypoints, UI).

**Recommended start, per the docs, is service/boundary-shaped — not
"Schema first" or "Data first" as standalone phases.** Schema is introduced *as
part of* the first boundary-heavy service. The page's explicit anti-pattern is
"sprinkle Schema across existing files" before a service exists to host it.

### 3.2 Q2 — Standalone-adoptable submodules (without pulling in the runtime)

All of these ship inside the **single `effect` package** (v4 package
consolidation) and are imported from the root barrel
(`import { Data, Schema } from "effect"`); deep namespace imports (`effect/Data`,
`effect/Schema`, …) also resolve via the rc exports map's `"./*": "./dist/*.js"`
wildcard. Verified against `packages/effect/src/` (main) and the rc package
exports:

| v3 name | v4 name | In v4 stable core? | Standalone (no runtime needed)? |
| --- | --- | --- | --- |
| `effect/Schema` | `Schema` (root barrel) | ✅ (`Schema.ts` + `SchemaAST`/`SchemaParser`/…) | ✅ — **sync** decode/encode/assert APIs (`Schema.decodeUnknownSync`, etc.) run in plain TS with no runtime; requires `strict` + `exactOptionalPropertyTypes` (recommended) and TS 5.4+ |
| `effect/Data` | `Data` (root barrel) | ✅ | ✅ — pure value constructors (`Class`, `TaggedClass`, `taggedEnum`, `TaggedError`, `Error`) + `Equal`/`Hash` traits; no runtime |
| `effect/Either` | **`Result`** (renamed; root barrel) | ✅ (`Result.ts`; rename map: `effect/Either -> effect/Result`) | ✅ — pure data type |
| `effect/Option` | `Option` (root barrel) | ✅ | ✅ — pure data type (note: `Yieldable` in v4, not an `Effect` subtype) |
| `effect/Predicate` | `Predicate` (root barrel) | ✅ | ✅ — pure predicate helpers |
| `effect/Cause` | `Cause` (root barrel; **flat** in v4 — array of `Fail`/`Die`/`Interrupt` `Reason`s) | ✅ | ✅ for construction/inspection; it is the runtime's failure structure, so it is *most useful* where effects run. Base class for yieldable errors: `Cause.YieldableError` |
| `effect/Exit` | `Exit` (root barrel) | ✅ | ✅ data structure; runtime-oriented (produced by running effects) |
| `effect/Error` | **does not exist in v4** | ❌ no `Error.ts` in src; no `./Error` export; rename map has no `effect/Error` entry | n/a — error modeling is `Data.TaggedError` (in-process) vs `Schema.TaggedErrorClass` (serializable/wire), plus `Schema.Defect` for causes |

**Runtime cost is explicitly addressed by the maintainers and is tiny:**
- `MIGRATION.md` (current main): "The core `effect` package supports aggressive
  tree-shaking — a minimal Effect program bundles to **~6.3 KB** (minified +
  gzipped). With Schema, ~15 KB."
- v4 beta post: "A minimal program using Effect, Stream, and Schema drops from
  roughly **70 kB in v3 to about 20 kB in v4**."

So "pulling in the runtime" is not a binary — the runtime is tree-shakeable and
cheap; the practical rule from the docs is: **you only need a runtime the moment
you `run` an Effect** (Schema/Data/Option/Result/Predicate values never require
it).

### 3.3 Q3 — Effect Schema × Zod coexistence

The official guidance is a dedicated section of the incremental-migration page:
**"Bridging Effect Schema with an existing validation library"** — and it is
prescriptive:

1. **You do not have to choose overnight.** Zod and Effect Schema can coexist
   during the transition.
2. **Make Effect `Schema` the single source of truth, and *derive* the other
   representation from it** — never maintain two hand-written schemas in
   parallel. The reference implementation walks the Schema AST and emits a
   `ZodType`, so a module defines its schema once in Effect and still hands a
   Zod type to legacy consumers (config, tool arguments, HTTP DTOs).
3. **Delete the generic bridge once a domain is fully on Schema**, replacing it
   with narrow boundary-specific helpers. Codified rule quoted verbatim:
   "Effect Schema should own the type. Boundaries should consume Effect Schema
   directly or use narrow boundary-specific helpers. Avoid reintroducing a
   generic Effect Schema → Zod bridge." The generic bridge is "the right tool
   *during* the transition… the wrong tool *after*".
4. **Migrating one schema boundary at a time** is the supported pattern, with
   one hard rule (Trap 6): *never* change public schemas / wire formats
   mid-migration — treat wire/schema changes as deliberate, separately reviewed
   breaking changes, never a side effect of a refactor.
5. **No official bridge package exists.** Verified: no zod↔schema interop
   package in the Effect-TS org, and no entry in the v3→v4 rename map. The
   Schema→Zod translator is a ~small DIY AST-walker (opencode's pattern, now
   documented as the official approach). A neutral interop path that is
   *officially part of Schema* is **Standard Schema** generation (v3 docs list
   it among Schema's capabilities; v4 docs site not re-verified — see Deferred).

### 3.4 Q4 — Tooling support for the transition

- **Codemods: none for v4.** `Effect-TS/codemod` ("Code mod's for the Effect
  ecosystem") has had no push since 2024-07 (v2→v3 era). The official
  v3→v4 "automation" is: the **machine-generated import/API rename map**
  (`migration/v3-to-v4.md`, ~16k lines) + per-topic migration guides
  (`migration/{services,cause,error-handling,forking,yieldable,fiber-keep-alive,
  layer-memoization,fiberref,runtime,scope,equality,schema,generators,annotations}.md`)
  in `Effect-TS/effect`, explicitly framed by the RC blog as agent-fodder for a
  "near-fully automated migration"; plus the official **`Effect-TS/skills`**
  repo (active 2026-08) with an `effect-v3-to-v4` agent skill.
- **Linting / editor diagnostics:** the tool linked from the official website
  footer ("Linting Rules") is the **`@effect/tsgo` LSP-based linter** — a
  typescript-go wrapper embedding the Effect Language Service, **targeting v4
  primarily** (`npx @effect/tsgo setup`; needs TS ≥ 7). Diagnostics include
  `floatingEffect`, `missingEffectContext`, `missingEffectError`,
  `missingLayerContext`, `missingStarInYieldEffectGen`,
  `missingReturnYieldStar`, `anyUnknownInErrorContext`, `effectFnImplicitAny`,
  `classSelfMismatch`, etc., plus **`outdatedApi`** — flags v3 APIs in a v4
  project and suggests replacements (a migration linter). The older
  `@effect/eslint-plugin` (0.3.2, last published 2025-04-24) exists as a
  separate repo but is not the v4-linked tool.
- **tsconfig helpers: none published.** `@effect/tsconfig` returns 404 on npm
  (2026-08-16) and there is no tsconfig package/repo in the org. The only
  documented tsconfig requirements are inline: `strict: true` (+ recommended
  `exactOptionalPropertyTypes: true`) for Schema.
- **No official "schema → data → errors → effect" adoption ladder.** The only
  officially ordered path is the architectural one in §3.1. The v4 docs do pair
  specific idioms: `Data.TaggedError` → in-process errors, `Schema.TaggedErrorClass`
  → wire errors, `Effect.fn` → traced methods, `Context.Service` → services.

## 4. Recommendations

Concrete values the implementation plan (map → spec → tickets) may use:

1. **Adopt the official incremental shape, not a module ladder:**
   `ManagedRuntime` (single, memoized) + `runPromise` facade ring; leaf services
   first, orchestration last; entrypoints last; conventions on day one. This is
   the only officially sequenced path.
2. **Engine-core packages (pure/deterministic) can adopt Schema/Data/Result/
   Option/Predicate standalone** with no runtime entry point — use sync Schema
   APIs (`Schema.decodeUnknownSync` / `is` / `asserts`) at save/content-pack
   boundaries. Bundle impact is tree-shaken (~6.3–15 kB, verified figures).
3. **Use v4 names, not v3 names:** `Result` (not `Either`); **no `effect/Error`
   module** — model domain errors with `Data.TaggedError` (in-process) or
   `Schema.TaggedErrorClass` (wire), `cause` fields typed `Schema.Defect`.
4. **Zod coexistence (feed to ticket 07):** single source of truth in Effect
   `Schema`; derive Zod for the transition; never dual-maintain; plan to delete
   the generic bridge; keep Zod only where a consumer forces it. Do not ship a
   generic bridge as a permanent artifact.
5. **Tooling plan:** adopt `@effect/tsgo` for lint (incl. `outdatedApi`) when
   v4 code lands; budget for mechanical cross-RC/RC→stable API renames (the
   docs warn this is the norm during beta/RC — keep service modules uniform so
   renames stay find-and-replace); expect agent-assisted v3→v4 migration via
   `MIGRATION.md` + rename maps, not a codemod.
6. **Version pin:** v4 stable is not yet out (target Q3/Q4 2026; RC =
   `4.0.0-rc.109` as of 2026-08-16). Exact pin belongs to ticket 01
   (release reality) — cross-reference, not decided here.

Items that must remain **policy decisions** (not facts): which specific
boundaries keep Zod permanently; whether any module-order ladder beyond the
official service order is desired; the exact adoption sequencing (ticket 08).

## 5. Deferred

- **Standard Schema interop in v4** — documented as a Schema capability in the
  v3 docs; not re-verified on the v4 docs site (v4 Schema pages fetched do not
  mention it explicitly). Owner: ticket 07 if Zod/RPC interop needs it.
- **`effect/Error` v3 history** — v3's `Error` module existence could not be
  conclusively confirmed (rename map contains no `effect/Error` entry; v4
  absence is verified from source). Irrelevant to v4 planning, recorded for
  completeness.
- **"Schema-first vs data-first" module ladder** — no official source exists;
  if the map wants one beyond the documented service/boundary order, that is a
  human/wayfinder decision, not a researched fact.
- **Beta-era instability of import paths** — early v4 beta listed `schema`
  among `effect/unstable/*` areas; current docs + rc package map put `Schema`
  in stable core while an `effect/unstable/schema` area also exists. Tracked as
  churn; re-verify at the pinned version (ticket 01).
- **`@effect/eslint-plugin` vs `@effect/tsgo` overlap** — the eslint plugin's
  v4 status is unverified (no v4-era release); the official link points to tsgo.

*Note path: `docs/research/effect-v4-incremental-adoption.md` (created 2026-08-16).*
