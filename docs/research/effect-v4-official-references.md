# Research: Effect v4 — Official References for the Vendored Migration

Grounds `.scratch/effect-v4-vendor-migration/` (plan → spec → tickets) against
the official references supplied 2026-10-10. Supersedes the version context in
`docs/research/effect-v4-release-reality.md`, `effect-v4-toolchain-compatibility.md`,
`effect-v4-incremental-adoption.md`, and `effect-v4-runtime-determinism.md`
(those were written against the RC line on 2026-08-16).

## Headline findings

1. **Effect 4.0 is STABLE (released 2026-09-30).** npm dist-tags (verified
   2026-10-10): `latest: 4.0.2`, `rc: 4.0.0-rc.118`, `beta: 4.0.0-beta.107`,
   `snapshot: 0.0.0-snapshot-*`. The RC-churn premise that motivated against
   pinning (research note dated 2026-08-16) is **resolved**: adopt an exact
   stable pin (`4.0.2` at time of writing), never the `rc` tag.
2. **LTS from 4.0 onward.** Bug fixes until September 2029 or one year after
   5.0 (whichever is later); security fixes until September 2029 or two years
   after 5.0. This is a documented support commitment. (Vendoring is still
   justified for freeze/integrity/patchability/agent-reference, but the
   "RC moves every week" risk is gone.)
3. **The core `effect` package has ZERO runtime dependencies.** The v4 release
   post: "The core `effect` package has **zero runtime dependencies**." This
   **supersedes** the RC-era note that v4 adds `msgpackr`/`fast-check`/
   `@standard-schema/spec` to the runtime graph — verify transitives at the pin,
   but plan for a dependency-free core (simpler vendoring, no native-build
   concerns).
4. **Official agent-reference vendoring recipe = `git subtree` into `repos/`.**
   The Effect blog "The One Weird Git Trick…" prescribes vendoring the Effect
   **Git repository** (source, read-only) so coding agents can read real usage
   patterns; `repos/effect` is **reference only** — *"Do not import from
   @repos/ — application code should continue importing from normal package
   dependencies."* This is complementary to (not a replacement for) our
   runtime-artifact vendor (`vendor/effect` as a `workspace:*` package).
   Mechanics: `git subtree add --prefix=repos/effect <url> <ref> --squash`;
   update via `git subtree pull … --squash`; add AGENTS.md guidance; exclude
   `repos/**` from editor search/auto-import; optionally create
   `agent-patterns/effect-*.md`; read `@repos/effect/LLMS.md` before writing
   Effect code.
5. **`@effect/tsgo` is the official v4 LSP + linter.** Targets v4 primarily.
   Provides Effect diagnostics/quick-fixes/refactors and emits **Oxlint
   type-aware rules** (`pnpm add -D @effect/tsgo oxlint oxlint-tsgolint`;
   `effect-tsgo patch --oxlint`; config extends
   `@effect/tsgo/oxlint-presets/recommended.json`; presets: `correctness`,
   `antipattern`, `effect-native`, `style`, `maintainers`, `strict`). Requires a
   native `typescript >= 7` alongside. Set `@effect/language-service`
   `diagnostics: false` so LSP and Oxlint do not double-report.
6. **Directly relevant `@effect/tsgo` rules for our invariants:**
   - `duplicatePackage` — "warns when multiple versions of an Effect-related
     package are detected in the program" → a built-in complement to our
     `scripts/assert-single-effect.mjs` (use both; keep our hard preflight gate).
   - `preferSchemaTypeProperty` — "Disallows `Schema.Schema.Type<typeof X>` in
     favor of `typeof X.Type`" → our Zod→Schema mapping should use the v4 idiom
     `typeof S.Type`, not `Schema.Schema.Type<typeof S>`.
   - `outdatedApi`, `obsoleteSchemaImport`, `obsoleteMatchImport` — v3→v4
     migration lints; `preferSchemaTaggedError` — suggests `Schema.TaggedError`
     over `Data.TaggedError` (we keep the in-process/wire distinction; configure
     severity, don't blindly follow).
   - Determinism-relevant: `globalRandom`/`globalRandomInEffect`,
     `globalDate`/`globalDateInEffect`, `cryptoRandomUUID`/`…InEffect`,
     `processEnv`/`…InEffect`, `globalTimers`/`…InEffect`,
     `nodeBuiltinImport`, `asyncFunction`, `floatingEffect`,
     `missingEffectError`/`Context`.
   - Stability gating: `unstableApiUsage`/`experimentalApiUsage` with
     `allowedUnstableApis`/`allowedExperimentalApis` for `effect/unstable/*`.
7. **Docs restructure (v4).** Docs now live at `effect.website/docs/v4`.
   Learning path: The Effect Type → Installation → Creating Effects → Two Types
   of Errors → Basic Concurrency. New/expanded areas relevant to us: Code Style
   (Guidelines, Dual APIs, **Branded Types**, Pattern Matching, Control Flow),
   Schema (Class APIs, Default Constructors, **Standard Schema**, Projections,
   Transformations), Resource Management (`Scope`, `acquireRelease`),
   Requirements Management (Services/Layers/Memoization), Runtime, Platform
   (**FileSystem**, **Path**, Terminal, Runtime), State Management (`Ref`),
   Data Types, Error Management (expected vs unexpected, retry, timeout,
   sandboxing), Testing (`TestClock`).

## Implications for the migration plan/spec/tickets

- **Pin to exact stable `4.0.2`** (or the exact stable at execution time);
  remove all `4.0.0-rc.109` / "RC line" / "wait for stable" language; the
  implementation track starts at stable **now**. `@effect/vitest` shares the
  unified version → pin `4.0.2` in lockstep.
- **Vendoring has two layers:**
  1. **Runtime artifact** (`vendor/effect`, `vendor/effect-vitest`) — the
     `workspace:*` dependency (V1, as decided).
  2. **Read-only agent reference** (`repos/effect`) — the blog's `git subtree`,
     excluded from pnpm/Turbo/lint/format/editor; AGENTS.md guidance; optional
     `agent-patterns/effect-*.md`. Never imported by application code.
- **`@effect/tsgo` wiring is concrete** (Oxlint presets + patch step + native
  TS 7), and `duplicatePackage` reinforces the single-copy invariant.
- **Zod→Schema mapping** uses `typeof S.Type` (v4 idiom), not
  `Schema.Schema.Type<typeof S>`.
- **IO boundary (persistence/desktop/CLI)** may use Effect `platform`
  FileSystem/Path/Runtime services and `Scope`/`acquireRelease` instead of raw
  `node:fs` — a decision for the beachhead ticket.
- **Zero runtime deps** removes the `msgpackr`/native-build caveat (re-verify at
  the pin).

## Sources (verified 2026-10-10)

| Source | What it is |
| --- | --- |
| https://effect.website/docs/v4/onboarding | Official v4 onboarding; "one building block: the Effect type"; AI-era framing |
| https://effect.website/docs/v4/getting-started | Official v4 getting-started index; guide sections; LLM coding guidance; points at tsgo |
| https://effect.website/blog/the-one-weird-git-trick-that-makes-coding-agents-more-effect-ive | Official recipe: vendor Effect via `git subtree` into `repos/` as read-only reference; AGENTS.md guidance; pattern files |
| https://github.com/Effect-TS/tsgo (README, "#lsp-based-linter") | `@effect/tsgo@0.51.1`: LSP linter, Oxlint emission, full diagnostic list, plugin options, version pinning |
| https://github.com/Effect-TS/tsgo/blob/main/docs/README.md | Oxlint setup: `oxlint` + `oxlint-tsgolint` + `effect-tsgo patch --oxlint`; presets; `duplicatePackage`; limitations |
| https://registry.npmjs.org/-/package/effect/dist-tags | `latest: 4.0.2`, `rc: 4.0.0-rc.118`, `beta: 4.0.0-beta.107`, `snapshot: …` |
| https://effect.website/blog/releases/effect/40 | Effect 4.0 release (2026-09-30): zero runtime deps, consolidated packages, LTS policy, migration guide |

## Deferred / uncertainties

- **Exact stable patch at execution time** — pin `4.0.2` now; re-check before
  Wave 0 (any later 4.0.x is a patch bump under the same contract).
- **Transitive runtime deps at the pin** — release post says zero; verify the
  published `package.json` `dependencies` at the pin and drop the `msgpackr`
  caveat if empty.
- **`preferSchemaTaggedError` vs our in-process/wire split** — keep
  `Data.TaggedError` for in-process and `Schema.TaggedError` for wire; configure
  the rule's severity rather than removing one.
- **`repos/effect` subtree weight** — large; `--squash` keeps it one commit;
  exclude from root lint/format/search so it does not enter our gates.
