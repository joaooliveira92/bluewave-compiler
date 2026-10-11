# Spec: Effect v4 vendored migration (`effect-v4-vendor-migration`)

One-line purpose: vendor the exact published `effect` v4 / `@effect/vitest`
artifacts into `vendor/`, make them the single resolved Effect in the pnpm graph,
and migrate every validation boundary from Zod to Effect Schema and the
IO/orchestration boundaries onto the Effect runtime — without changing any
persisted or cross-process wire format.

Status: ready for slicing (`to-tickets`). Source of truth: this spec plus its
detailed companion plan `.scratch/effect-v4-vendor-migration/plan.md` (plan-only).
Extends, does not replace, the completed adoption map
`.scratch/effect-v4-adoption/map.md`.

---

## Problem Statement

Bluewave has **no Effect anywhere today** (greenfield adoption), a single
root-level `zod` devDependency used purely for validation at three kinds of
boundary, and no in-repo control over its Effect dependency. Effect **4.0 is now
stable** (`effect@latest` = `4.0.2`, released 2026-09-30) with an LTS policy, so
the registry line is predictable — but an engine developer / release engineer
who resolves `effect` from npm still gets an unpinned target and no frozen,
auditable copy, and any accidental mix of a registry `effect` with a locally
patched one silently breaks Effect's `Context`/`Layer`/service identity at
runtime (services not found, `instanceof` mismatches).

At the same time, the repo carries **two validator idioms** (Zod plus design
intent for Effect Schema) and no sanctioned, dependency-ordered path to convert
them without risking the save files, content packs, IPC envelopes, and event
envelopes that must stay byte-compatible (ADR-0023 / ADR-0024). The team needs a
frozen, auditable, offline-capable Effect dependency, exactly one copy of it in
the graph, a boundary-by-boundary Zod→Schema conversion that never
dual-maintains a wire shape, and measurable entry/exit/rollback gates per wave
so an agent implementator or reviewer can execute and verify one wave at a time.

## Solution

Adopt **Effect v4 as the single monorepo idiom** using a **vendored dependency**:

- **Vendor model V1** — vendor the exact published `effect` and `@effect/vitest`
  artifacts (upstream `package.json`, `src/`, built `dist/`, `LICENSE`) into
  `vendor/`, pinned by exact version **and** integrity hash, with an
  `UPSTREAM.md` provenance record. **No in-repo source build of Effect** in the
  default path. `@effect/tsgo` stays a pinned devDependency **external** to the
  vendored workspaces. Effect **4.0 is stable** (`effect@latest` = `4.0.2`,
  released 2026-09-30, LTS); the pin is the exact stable version — never an `rc`.
- **Read-only agent reference** — additionally vendor the Effect **source
  repository** via `git subtree` at `repos/effect` as read-only reference for
  coding agents (Effect's own recommended workflow). It is not a pnpm workspace
  member, is never imported by application code, and is excluded from lint/format
  and editor search.
- **Exactly one `effect` in the graph** — internal consumers declare
  `"effect": "workspace:*"`; root-level pnpm `overrides` force every transitive
  `@effect/*` request onto the vendored copy; a CI/preflight guard
  (`scripts/assert-single-effect.mjs`) hard-fails on more than one resolution or
  any registry `effect`, reinforced by the `@effect/tsgo` `duplicatePackage`
  diagnostic.
- **Runtime-usage policy** — pure domain packages use only the runtime-free
  subset (`Schema`, `Data`, `Result`, `Option`, `Predicate`, `Equal`/`Hash`);
  the full `Effect`/`Layer`/`ManagedRuntime` runtime is permitted **only** at
  explicit IO, infrastructure, application-orchestration, and executable
  entrypoint boundaries.
- **Zod → Effect Schema, atomically, boundary-by-boundary** — Effect Schema
  becomes the single validator at every boundary; the equivalent Zod definition
  is removed in the same step (never dual-maintained); `zod` is deleted only
  after all boundaries and transitive consumers have migrated.
- **Wire formats frozen** — save packs, IPC, event, content, and every other
  persisted or cross-process wire format stays **exactly** byte-compatible; each
  schema change carries a parity test built from existing fixtures.
- **Determinism gate demoted** — per adoption ticket 05, golden-hash /
  cross-process determinism is deprecated machinery: drift is **recorded via
  ADR, never a blocker**; the harness keeps running for information.
- **Wave-gated execution** — Waves 0–5, each with an entry gate, exit gate, and
  rollback point, sliced into small dependency-ordered tickets.

## User Stories

1. As an **engine developer**, I want `effect` vendored at an exact pinned
   version, so that my package builds are reproducible and never shift under me
   when the registry publishes a new release.
2. As an **engine developer**, I want exactly one resolved `effect` in the whole
   pnpm graph, so that `Context`/`Layer`/service identity works and I never hit
   silent "service not found" failures from duplicate copies.
3. As an **engine developer**, I want to import `Schema`, `Data`, `Result`, and
   `Option` in pure packages without pulling in a runtime, so that deterministic
   derivations stay cheap and runtime-free.
4. As an **engine developer**, I want the full Effect runtime available at IO
   and orchestration boundaries, so that persistence, the desktop main process,
   and `compiler-cli` can express typed cancellation, retries, and typed errors
   idiomatically.
5. As an **engine developer**, I want tagged errors to replace `throw` /
   `undefined` / ad-hoc `Result` at package boundaries, so that failures are
   typed and composable.
6. As a **desktop app developer**, I want the main process to own a single
   long-lived `ManagedRuntime`, so that IPC handlers and command orchestration
   share one runtime instead of constructing one per call.
7. As a **desktop app developer**, I want the renderer to import **no** `effect`,
   so that the renderer bundle does not grow by ~86 KB gzip and the UI stays
   presentational over IPC.
8. As a **desktop app developer**, I want the sandboxed preload to import **no**
   `effect`, so that electron-vite's externalized dependencies remain
   resolvable in the sandbox.
9. As a **compiler-CLI maintainer**, I want the CLI entrypoint converted last
   behind a `runPromise` facade, so that callers keep a plain-`Promise` API while
   internals become Effect-typed.
10. As a **compiler-CLI maintainer**, I want the content-compiler validation
    stage migrated to Effect Schema, so that content-pack validation shares one
    validator idiom with the engine.
11. As a **release engineer**, I want `scripts/vendor-effect-sync.mjs` to
    download, integrity-verify, unpack, and re-patch on demand, so that a version
    bump is one reviewed, reproducible operation.
12. As a **release engineer**, I want `UPSTREAM.md` to record repo, tag/commit,
    exact npm version, tarball integrity hash, sync date, and patch list, so that
    the vendored artifact is auditable.
13. As a **release engineer**, I want zero patches by default, so that a version
    bump is a straight copy and the one known library wrinkle is absorbed by
    `skipLibCheck: true`.
14. As a **release engineer**, I want `pnpm preflight` to run the single-copy
    guard, so that a broken dependency graph is caught before every build.
15. As a **release engineer**, I want the vendored `package.json` to keep the
    upstream version string, so that peer ranges on `@effect/vitest` resolve
    against the workspace copy under `strict-peer-dependencies`.
16. As an **agent implementator**, I want each wave to declare a measurable entry
    gate and exit gate, so that I know exactly when I may start and when a wave
    is done.
17. As an **agent implementator**, I want the spec sliced into small,
    dependency-ordered, frontier-ordered tickets, so that I can complete and
    validate one independently.
18. As an **agent implementator**, I want a rollback point per wave, so that a
    failed wave can be reverted to the prior green state without unwinding later
    work.
19. As an **agent implementator**, I want the full orchestrator gate command, so
    that "done" is a single objective check rather than a judgement call.
20. As a **reviewer**, I want every acceptance criterion to name a proving test
    or command, so that I can verify it adversarially.
21. As a **reviewer**, I want per-boundary parity tests built from existing Zod
    fixtures, so that schema migrations cannot silently change accept/reject
    decisions.
22. As a **reviewer**, I want an explicit do-not-migrate list, so that unrelated
    code (renderer, preload, deprecated harness, fixtures, prototypes) is not
    dragged into the change.
23. As a **reviewer**, I want confirmation that no public wire format changed as
    a side effect, so that saves and content packs remain loadable.
24. As a **future maintainer**, I want the runtime-usage policy written down as a
    table, so that I know which packages may legitimately run an Effect.
25. As a **future maintainer**, I want the determinism demotion recorded in an
    ADR, so that golden-hash drift is intentionally permitted and traceable.
26. As a **future maintainer**, I want the Zod→Schema API mapping documented at a
    conceptual level, so that the migration intent survives API churn.
27. As a **future maintainer**, I want the vendored Effect to remain patchable in
    tree, so that a blocking library bug can be fixed locally rather than waiting
    upstream.
28. As a **future maintainer**, I want `@effect/tsgo` pinned but external, so
    that language-service tooling upgrades independently of the vendored
    runtime.
29. As an **engine developer**, I want save files to still load and
    `PERSISTENCE_*` error codes to survive as tagged errors, so that persisted
    games are not broken by the migration.
30. As an **engine developer**, I want content-pack validation to make identical
    accept/reject decisions on existing fixtures, so that compiled content is
    unaffected.
31. As a **desktop app developer**, I want IPC and event envelopes to stay
    byte-compatible, so that main/renderer and event consumers keep interop.
32. As a **release engineer**, I want the deprecated cross-process harness to
    keep running (informational), so that determinism diffs still surface even
    though they no longer block.
33. As a **reviewer**, I want any golden-hash change recorded as an ADR note, so
    that drift is documented without being a failure.
34. As an **engine developer**, I want the DESIGN-08 named-stream ledger kept and
    `random`'s PRNG not silently swapped for Effect `Random`, so that the RNG
    authority is not diluted.
35. As a **future maintainer**, I want the renderer/preload/test-support/content
    fixtures explicitly excluded, so that the migration stays scoped to what
    changes runtime behavior.
36. As a **release engineer**, I want packaged Electron smoke tests in the
    acceptance criteria, so that the desktop boundary is proven after the main
    process migrates.
37. As an **agent implementator**, I want no implementation to occur while
    producing the spec or tickets, so that planning stays separable from
    execution.

## Implementation Decisions

### Vendor specification (V1)

- **V1 layout (chosen; V2 source-build is the documented fallback only).**
  `vendor/effect/` and `vendor/effect-vitest/` hold the package exactly as npm
  publishes it: `src/` (reference + patch target), built `dist/` (JS + `.d.ts`),
  `README.md`, `LICENSE` (MIT, verbatim), and `UPSTREAM.md`. The upstream
  `package.json` is retained verbatim as `UPSTREAM.package.json` for provenance and
  integrity verification.
- **Workspace wrapper (Turbo-safety).** Because a pnpm workspace member is a
  Turbo task target, checking in Effect's own `package.json` unchanged would make
  Turbo run Effect's upstream `build` script with its upstream devDependencies
  absent — breaking `pnpm build`. So each vendored package carries a **thin
  Bluewave-authored `package.json` shim**: identical `name`, identical version
  string, and identical `exports` map to upstream, but **zero `build`/`typecheck`/
  `lint`/`test` scripts** (so Turbo skips it) and `files`/`sideEffects` preserved.
  `src/` + `dist/` + `LICENSE` + `README.md` remain byte-identical to the tarball
  and the upstream `package.json` is kept as `UPSTREAM.package.json`. No build
  step in the default path.
- **Provenance.** `UPSTREAM.md` records the upstream repo, git tag/commit, exact
  npm version, tarball integrity hash, sync date, and patch list. `LICENSE` is
  kept verbatim.
- **Integrity pinning.** The vendored `package.json` keeps the upstream version
  string so peer ranges resolve against the workspace copy. The exact pin is the
  current stable `effect@4.0.2` (or the exact stable `4.0.x` at execution time) —
  never an `rc`. `@effect/vitest` shares the unified version and is pinned in
  lockstep. The integrity hash in `UPSTREAM.md` is re-verified by the sync
  script. The v4 core `effect` has **zero runtime dependencies** (re-verify at
  the pin).
- **Sync procedure.** `scripts/vendor-effect-sync.mjs` (`--version <exact>` or
  `--tag <git-tag>`): download the exact tarball/tag → verify shasum against the
  recorded value → unpack → copy `src/` + `dist/` verbatim (V1) → re-apply
  `vendor/effect/patches/*.patch` if any → rewrite `UPSTREAM.md` → print
  `git diff --stat`. A no-op run against the pinned version produces an empty
  diff.
- **Zero-patch default.** Adoption starts with **no patches**. The known
  library-level wrinkle (`Channel.d.ts` referencing the DOM global
  `TextDecoderOptions`) is absorbed by the repo's existing `skipLibCheck: true`
  (load-bearing). If a patch is ever needed it is explicit, documented in
  `UPSTREAM.md`, and re-applied by the sync script.
- **pnpm mechanics.** Add `vendor/effect` and `vendor/effect-vitest` to
  `pnpm-workspace.yaml` → `packages`. Consumers declare
  `"effect": "workspace:*"` (and `"@effect/vitest": "workspace:*"` in dev). The
  root `overrides` map (in `pnpm-workspace.yaml`'s top-level `overrides:` — pnpm 11
  reads overrides here, not `package.json#pnpm.overrides`) maps `effect` and
  `@effect/vitest` to the workspace copies so any transitive `@effect/*`
  requesting the registry resolves to the vendored copy. Re-verify peer resolution
  after wiring under the existing `strict-peer-dependencies=true` +
  `auto-install-peers=true`.
- **Single-copy guard.** `scripts/assert-single-effect.mjs` inspects
  `pnpm why effect` / `pnpm-lock.yaml` and fails if more than one resolution of
  `effect` exists or if any registry `effect` is resolved. It is wired into
  `pnpm preflight` as a hard gate.
- **Read-only agent reference (`repos/effect`).** Per Effect's official guidance,
  vendor the Effect source repository via `git subtree add --prefix=repos/effect
  … <stable-tag> --squash` (update with `git subtree pull … --squash`) as
  **read-only reference material** for coding agents and humans. It is not a pnpm
  workspace member, is **never imported** by application code, and is excluded
  from `vp lint`/`vp fmt`, editor search/auto-import, and file watchers. An
  `AGENTS.md` "Vendored repositories" section instructs agents to treat it as
  read-only reference and to read `repos/effect/LLMS.md` before writing Effect
  code; optional `agent-patterns/effect-*.md` files distill common idioms.

### `@effect/tsgo` policy

- Pinned **exact** devDependency, **external to `vendor/`** — it is LSP tooling,
  not a runtime dependency we ship. It targets **Effect v4** and provides the
  Effect LSP diagnostics/quick-fixes/refactors plus an **Oxlint type-aware
  linter**. It requires a native `typescript >= 7` alongside (repo has 7.0.2).
- **Wiring.** `pnpm add -D @effect/tsgo oxlint oxlint-tsgolint`; run
  `effect-tsgo patch --oxlint` (via a `prepare`/lint script); configure Oxlint to
  extend `@effect/tsgo/oxlint-presets/recommended.json` (optionally
  `correctness`/`effect-native`/`style`/`strict`; `maintainers` opt-in). Set the
  `@effect/language-service` plugin option `diagnostics: false` so LSP and Oxlint
  do not double-report.
- **`duplicatePackage`** (warns on multiple Effect-package versions) reinforces
  the single-copy invariant alongside `scripts/assert-single-effect.mjs`.
- **`preferSchemaTaggedError`** suggests `Schema.TaggedError` over
  `Data.TaggedError`; we keep the in-process/wire split and configure severity.
- **`preferSchemaTypeProperty`** prefers `typeof S.Type` over
  `Schema.Schema.Type<typeof S>`; the migration mapping follows that idiom.
- **`outdatedApi` / `obsoleteSchemaImport` / `obsoleteMatchImport`** catch
  v3-isms; `unstableApiUsage`/`experimentalApiUsage` gate `effect/unstable/*`
  via `allowedUnstableApis`/`allowedExperimentalApis`.

### Runtime-usage policy

| Package kind | Adopt | Do **not** add |
| --- | --- | --- |
| Pure synchronous computation (`combat` math, `ship-design`, `campaign` derivations, `random`, `deterministic`, `contracts`, `armament`, `events` validation) | Runtime-free subset: `Schema` (sync decode/encode), `Data`/`Data.TaggedError`, `Result`, `Option`, `Predicate`, `Equal`/`Hash` | `Effect`/`Layer`/`ManagedRuntime`, fibers, live services |
| IO / async / orchestration (`persistence`, desktop `src/main`, `compiler-cli`, `ai`, `phase-engine`) | Full Effect: `Effect`, `Layer`, `Context.Service`, `ManagedRuntime`, cancellation via `Scope`, typed `Cause` | Blind wrapping of pure functions in `Effect` |
| React renderer (`apps/desktop/src/renderer/**`) | Nothing — talks over IPC | Any Effect import |

Rule of thumb: introduce a runtime **at the boundary where an effect is run**,
not inside pure derivations. Keep the DESIGN-08 named hierarchical streams as the
RNG authority; Effect's `Random` is a primitive, not a replacement.

### Zod → Effect Schema replacement

- **Boundary list (all Zod sites, from plan.md §4.1):** `content-schema` (its
  area/design/manifest/nation/naval-profile/naval-profile-vocab/port/possession/
  route/ship-component/technology schemas plus the type-only `schema-validator`),
  `events/validation`, `content-compiler/stages/validate` (type-only
  `ZodSchema`), `campaign-engine/priorities`, `persistence/schemas`, the `combat`
  `*-contracts` (air-combat, aircraft, carrier-operations, air-defense) plus the
  air-defense attack/system-definition schemas, and the seven desktop
  `src/main` schemas (campaignBridge, campaignCommandSchemas, campaignSaveSchema,
  campaignSessionMetadata, drawingBoardDraft, monthInput, pendingCommands,
  campaignCommandSchemas). The root `zod` devDependency is removed once the last
  boundary lands.
- **The atomicity rule.** Each boundary migrates **in place** in one coherent
  step: Effect Schema becomes the single source of truth and the equivalent Zod
  definition is deleted in the same change. **Never maintain equivalent Zod and
  Effect Schema definitions simultaneously.** No generic Schema→Zod bridge is
  shipped (Zod is validation-only here; there are no downstream Zod consumers).
- **API mapping (conceptual, v4 names).** Representative mappings —
  `z.object`→`Schema.Struct`; `z.string`/`z.number`/`z.boolean`/`z.unknown`→
  `Schema.String`/`Schema.Number`/`Schema.Boolean`/`Schema.Unknown`;
  `z.array`/`z.record`→`Schema.Array`/`Schema.Record`; `z.literal`/`z.enum`→
  `Schema.Literal`/`Schema.Literals`; `.optional`/`.nullable`/`.default`→
  `Schema.optional`/`Schema.NullOr`/`Schema.optionalWith`; `.regex`/`.min`/
  `.max`/`.int`→`Schema.pattern`/`Schema.int`/`Schema.between`; `.transform`/
  `.refine`/`.superRefine`→`Schema.transform`/`Schema.filter`; `z.discriminated
  Union`→`Schema.Union` of tagged `Schema.Struct`s; `safeParse`→
  `Schema.decodeUnknownResult`; `parse`→`Schema.decodeUnknownSync`; `z.infer`→
  `typeof S.Type` (the v4 idiom; `preferSchemaTypeProperty` recommends it over
  `Schema.Schema.Type<typeof S>`); the `ZodSchema` type→`Schema.Schema<A, I, R>`.
  In-process domain errors become `Data.TaggedError`; wire/serializable errors
  become `Schema.TaggedError` (v4's rename of `TaggedErrorClass`; note
  `preferSchemaTaggedError` suggests the latter — keep the split, configure
  severity). At IO boundaries prefer Effect `platform` services (FileSystem,
  Path, Runtime) and `Scope`/`acquireRelease` over raw `node:fs`.
- **Parity & safety.** Default/optional/strict semantics differ subtly between
  Zod and Schema (e.g. default arrays, excess-property rejection, refinement
  ordering); verify `Schema.Struct` closed-by-default parity per schema. Each
  schema change carries a parity test built from existing Zod fixtures. Prefer
  `decodeUnknownSync` at boundaries; keep schemas runtime-free in pure packages.
  The one hard rule: **never change a public wire format as a side effect** of
  this migration.

### Dependency order + execution waves

Raw topological order (informative): `contracts → diagnostics → deterministic →
armament → content-schema → content-compiler → random → campaign → events →
ship-design → commands → campaign-engine → combat → ai → persistence →
phase-engine → test-support → cross-process-test`.

Execution waves (risk-front-loaded, facades stable):

**Wave 0 — Vendor & toolchain.** Scope: vendor `effect` + `@effect/vitest`;
workspace + overrides; single-copy guard; pin; tsconfig decision (`skipLibCheck`
stays, `erasableSyntaxOnly` for consumer code); `@effect/tsgo` lint gate; no
domain code. Blocked by: —. Entry gate: repo synced on `dev`; `pnpm preflight`
green; no in-progress merge/conflict markers. Exit gate: vendor present and
integrity-verified; single-copy guard green in `pnpm preflight`; `pnpm check`
green; `@effect/tsgo` lint gate green; git diff confined to vendor/toolchain/
scripts (no domain changes). Rollback point: revert the Wave 0 commit(s) — no
domain code to unwind.

**Wave 1 — Error + IO beachhead.** Scope: `diagnostics` (typed-error
foundation), then `persistence` (Schema at the save boundary; Effect runtime +
`Scope`/`AbortSignal` cancellation; tagged `PERSISTENCE_*` errors). Blocked by:
Wave 0. Entry gate: Wave 0 exit met. Exit gate: tagged errors replace the
throw + `DiagnosticCollector` mix at the persistence boundary; saves round-trip
loadably; `PERSISTENCE_*` codes survive as tagged errors; `SaveStore` API
compatible; `pnpm check` green. Rollback point: revert Wave 1 to the Wave 0 exit
state.

**Wave 2 — Validation boundaries (Zod → Schema; remove `zod`).** Scope:
`content-schema` + `content-compiler/stages/validate` (paired via the
`ZodSchema` type), `events/validation`, `campaign-engine/priorities`, `combat`
`*-contracts` + air-defense schemas, desktop `src/main` schemas; **delete `zod`
from every `package.json` + root devDep**. Blocked by: Wave 1 (error model).
Entry gate: Wave 1 exit met. Exit gate: every boundary in the list is on Schema;
parity tests green; `zod` absent from all `package.json` files and the root
devDep; content-pack/IPC/event wire parity green; `pnpm check` green. Rollback
point: revert Wave 2 to the Wave 1 exit state (restores Zod only if the wave is
fully reverted).

**Wave 3 — Foundation core.** Scope: `contracts` → `deterministic` → `random` →
`armament` → remainder of `events`. Blocked by: Wave 2. Entry gate: Wave 2 exit
met. Exit gate: Schema/Data/typed errors in place; pure packages runtime-free;
`pnpm typecheck` + `pnpm lint` + package tests green. Rollback point: revert
Wave 3 to the Wave 2 exit state.

**Wave 4 — Domain core (bottom-up).** Scope: `campaign` → `ship-design` →
`commands` → `campaign-engine` (rest) → `combat` (rest) → `ai` → `phase-engine`.
Blocked by: Wave 3. Entry gate: Wave 3 exit met. Exit gate: migrated bottom-up;
`ai`/`phase-engine` on the full runtime; pure math stays runtime-free; facades
still plain-TS-compatible; `pnpm check` green. Rollback point: revert Wave 4 to
the Wave 3 exit state.

**Wave 5 — Unification & entrypoints.** Scope: flip cross-package facades to
Effect-typed interfaces; one long-lived `ManagedRuntime`;
`apps/desktop/src/main` entrypoint + IPC handlers; `apps/compiler-cli` behind
`runPromise` facades; retire deprecated wiring. Blocked by: Wave 4. Entry gate:
Wave 4 exit met. Exit gate: single long-lived runtime wired; entrypoints behind
`runPromise` facades; packaged Electron smoke + `pnpm test:e2e` green;
`pnpm check` green. Rollback point: revert Wave 5 to the Wave 4 exit state.

### Migrate / do-not-migrate

**Migrate** (Schema/Data/typed errors; runtime only where the table above
permits): `packages/contracts`, `packages/diagnostics`, `packages/deterministic`,
`packages/random` (keep the DESIGN-08 named-stream ledger; do **not** swap for
Effect `Random`), `packages/armament`, `packages/content-schema`,
`packages/content-compiler`, `packages/events`, `packages/campaign`,
`packages/ship-design`, `packages/commands`, `packages/campaign-engine`,
`packages/combat`, `packages/ai`, `packages/persistence`, `packages/phase-engine`,
`apps/desktop/src/main/**`, `apps/compiler-cli`.

**Do not migrate** (explicit): `apps/desktop/src/renderer/**` (React UI; talks
over IPC); `apps/desktop/src/preload/**` (sandboxed; externalized deps
unresolvable); `packages/cross-process-test` (deprecated determinism harness;
leave running); `packages/test-support` (fixtures; only follow type changes);
`content/**`, `golden/**` (data/fixtures); `prototype/**`,
`graph-memory-starter/**`, `codefetch/**` (not in the workspace); existing
`scripts/**` (build tooling; new `vendor-*` scripts are additive); `tsconfig.base.
json`, `turbo.json`, `vite.config.ts` (keep; additive changes only, `skipLibCheck`
stays); the test suite broadly (keep `vp test`; use `@effect/vitest` only for
new or Effect-specific tests — do not rewrite the suite); renderer-side UI libs
(react, d3, tailwind, base-ui, …).

### ADRs to be written

1. **Adopt Effect v4** — stable line; pin exact `4.0.2` (or the exact stable at
   execution time); runtime-free core vs full-Effect boundaries.
2. **Vendor Effect** — vendor model V1, layout, sync procedure, single-copy
   invariant, zero-patch default, read-only `repos/effect` agent reference.
3. **Replace Zod with Effect Schema** — boundary-by-boundary, no dual
   maintenance, wire formats frozen.
4. **DESIGN-08 determinism spine demoted** — conflict recorded (adoption ticket
   05); plus per-package ADR notes wherever a hash-surface output changed.

## Acceptance Criteria

Each criterion is measurable and independently verifiable. `MIG-*` IDs are
stable and referenced by the sliced tickets.

| AC id | Requirement / constraint | Proving test / command |
| --- | --- | --- |
| MIG-VENDOR-1 | `vendor/effect` + `vendor/effect-vitest` exist as V1 published-artifact copies (`src/`, `dist/`, `README.md`, `LICENSE`, `UPSTREAM.package.json`, `UPSTREAM.md`) plus a thin Bluewave wrapper `package.json` (identical name/version/exports, no build/lint/test scripts), with no in-repo source build in the default path. | File-presence check on `vendor/effect/{package.json,UPSTREAM.package.json,src,dist,UPSTREAM.md,LICENSE}` and the `effect-vitest` equivalent; wrapper `package.json` has no `build` script. |
| MIG-VENDOR-2 | Vendored `package.json` carries the exact stable pin (`effect@4.0.2`, or the exact `4.0.x` at execution time — never an `rc`); `@effect/vitest` pinned in lockstep; `UPSTREAM.md` records repo/tag/commit, exact version, tarball integrity hash, sync date, patch list. | `node scripts/vendor-effect-sync.mjs --verify` re-checks the integrity hash; grep the pinned version. |
| MIG-VENDOR-3 | `scripts/vendor-effect-sync.mjs` download → verify → unpack → copy → re-patch → rewrite `UPSTREAM.md` → `git diff --stat`; a no-op re-run against the pin is an empty diff. | Run the sync script twice at the pin; second `git diff --stat` is empty. |
| MIG-VENDOR-4 | `pnpm-workspace.yaml` includes both vendored packages; consumers use `"effect": "workspace:*"`; root `pnpm.overrides` maps `effect` and `@effect/vitest` to the workspace copies. | `pnpm install --frozen-lockfile` green; grep workspace/overrides wiring. |
| MIG-VENDOR-5 | `@effect/tsgo` is a pinned devDependency **external** to `vendor/`, targeting v4, powering the Effect LSP + Oxlint type-aware lint gate (presets, `duplicatePackage`, `outdatedApi`), with native TS ≥ 7 alongside. | `pnpm lint`/`oxlint` (tsgo gate) green; no `vendor/@effect/tsgo` directory; `effect-tsgo patch --oxlint` recorded. |
| MIG-VENDOR-6 | Zero-patch adoption at Wave 0; any future patch is explicit, documented in `UPSTREAM.md`, and re-applied by the sync script. | No `vendor/effect/patches/*` present; `UPSTREAM.md` patch list reads "none". |
| MIG-REF-1 | `repos/effect` is a read-only `git subtree` of the Effect source at the stable tag; not a workspace member, never imported by app code, excluded from lint/format/editor search; `AGENTS.md` documents the read-only rule and `repos/effect/LLMS.md`; optional `agent-patterns/effect-*.md`. | `git subtree` history present; `repos/**` excluded in lint/format/editor config; `AGENTS.md` section present; no app import path resolves into `repos/`. |
| MIG-GRAPH-1 | Exactly one resolved `effect` across the entire pnpm graph; no registry `effect`; guard is a hard `pnpm preflight` gate. | `node scripts/assert-single-effect.mjs` exits 0; a seeded duplicate-resolution fixture makes it exit non-zero. |
| MIG-GRAPH-2 | Internal consumers use `workspace:*`; resolution enforced via root overrides; no registry `effect` resolves. | `pnpm why effect` shows one workspace path; lockfile has no registry `effect` resolution. |
| MIG-WIRE-1 | Save files still load across the migration; `PERSISTENCE_*` codes survive as tagged errors. | `@bluewave/persistence` save/load + compatibility tests green (ADR-0023 / ADR-0024). |
| MIG-WIRE-2 | Content-pack validation produces identical accept/reject decisions on existing fixtures. | `content-schema` / `content-compiler` fixture validation tests green. |
| MIG-WIRE-3 | IPC and event envelopes stay byte-compatible. | Desktop IPC envelope + `@bluewave/events` envelope serialization tests green. |
| MIG-WIRE-4 | Serialization compatibility: Effect `Data`/`Schema` values survive `canonicalSerialize` + envelope hashing and reload loadably. | Beachhead round-trip test asserting Effect values serialize + deserialize loadably. |
| MIG-ZOD-1 | Each boundary migrates atomically; never both Zod and Effect Schema for the same shape simultaneously (single source of truth). | Per-boundary parity tests + reviewer check that no boundary has both definitions. |
| MIG-ZOD-2 | Every enumerated boundary (plan.md §4.1) migrated to Effect Schema, including transitive consumers. | Search for Zod imports in the migrated scope returns zero; per-boundary tests green. |
| MIG-ZOD-3 | `zod` deleted from every `package.json` and the root devDependency only after all boundaries + transitive consumers migrated. | `pnpm why zod` empty; no `zod` in any `package.json`. |
| MIG-RUNTIME-1 | Pure domain packages use only the runtime-free subset; `Effect`/`Layer`/`ManagedRuntime` only at IO/infrastructure/orchestration/entrypoint boundaries. | Architecture/import check + review; no `Effect.run*` in pure packages; `pnpm check` green. |
| MIG-RUNTIME-2 | DESIGN-08 named hierarchical streams retained; `random`'s PRNG not swapped for Effect `Random` (absent a later ticket + ADR). | `@bluewave/random` named-stream ledger tests green. |
| MIG-EXCL-1 | Renderer imports no `effect`; renderer bundle delta ≈ 0. | Renderer build + bundle-size check; `pnpm snap` capture unchanged. |
| MIG-EXCL-2 | Sandboxed preload imports no `effect`; `cross-process-test`, `test-support` runtime, `content/**`, `golden/**`, `prototype/**` unchanged except unavoidable compile-only adjustments. | Preload build green; `git diff` limited to allowed compile-only changes. |
| MIG-WAVE0-ENTRY | Repo synced on `dev`; preflight green; no in-progress merge/conflict markers. | `git pull --rebase` clean; `pnpm preflight` green. |
| MIG-WAVE0-EXIT | Vendor + guard + pin landed; `pnpm check` green; `effect-best-practices` lint gate green; zero domain changes. | `pnpm check` green; `git diff --name-only` touches only vendor/toolchain/scripts. |
| MIG-WAVE1-ENTRY | Wave 0 exit met. | Review of Wave 0 exit evidence. |
| MIG-WAVE1-EXIT | `diagnostics` typed-error model + `persistence` beachhead full-Effect + Schema save boundary; saves load; `PERSISTENCE_*` codes survive; `SaveStore` API compatible; tests green. | `pnpm --filter @bluewave/persistence test`; save round-trip; `pnpm check`. |
| MIG-WAVE2-ENTRY | Wave 1 exit met (error model landed). | Review of Wave 1 exit evidence. |
| MIG-WAVE2-EXIT | All plan.md §4.1 boundaries on Schema; parity tests per schema; `zod` removed everywhere; content-pack/IPC/event wire parity green. | `pnpm test:run`; `pnpm why zod` empty; wire-parity tests green. |
| MIG-WAVE3-ENTRY | Wave 2 exit met. | Review of Wave 2 exit evidence. |
| MIG-WAVE3-EXIT | `contracts`/`deterministic`/`random`/`armament`/remainder-`events` migrated; runtime-free where pure; tests + typecheck + lint green. | `pnpm typecheck`; `pnpm lint`; focused package tests. |
| MIG-WAVE4-ENTRY | Wave 3 exit met. | Review of Wave 3 exit evidence. |
| MIG-WAVE4-EXIT | `campaign`/`ship-design`/`commands`/`campaign-engine`/`combat`/`ai`/`phase-engine` migrated bottom-up; facades still plain-TS-compatible; tests green. | `pnpm check`; facade-compat tests green. |
| MIG-WAVE5-ENTRY | Wave 4 exit met. | Review of Wave 4 exit evidence. |
| MIG-WAVE5-EXIT | Cross-package facades flipped to Effect-typed interfaces; one long-lived `ManagedRuntime`; desktop main + IPC handlers + `compiler-cli` behind `runPromise` facades; deprecated wiring retired. | `pnpm check`; `pnpm test:e2e`; packaged Electron smoke. |
| MIG-RB-0 | Rollback point for Wave 0 (vendor + workspace/overrides wiring) — revertible with no domain code to unwind. | `git revert`/checkout of Wave 0 commit(s) returns `pnpm preflight` green. |
| MIG-RB-1..5 | Rollback point for each migration wave: the wave is a merge point revertible to the prior green `pnpm check`; no wave depends on a partial later wave. | Revert the wave commit to the prior wave exit state; `pnpm check` green at that state. |
| MIG-GATE-1 | Per-wave full orchestrator gate green before merge. | `pnpm check` (preflight incl. single-copy guard → format → lint → typecheck → build → `test:run` → `test:e2e`). |
| MIG-GATE-SMOKE-1 | Packaged Electron smoke + `pnpm snap` for any desktop-visible change. | `pnpm test:e2e`; `pnpm snap` screenshot + `aria.yaml`, console clean. |
| MIG-GATE-TYPE-1 | Composite `tsc -b` typecheck clean under tsgo with `skipLibCheck: true`. | `pnpm typecheck`. |
| MIG-GATE-UNIT-1 | Unit tests green. | `pnpm test:run`. |
| MIG-GATE-INT-1 | Integration tests green (save/load, compiler fixtures; cross-process harness informational). | Focused integration suites + `pnpm test:cross-process` (informational). |
| MIG-DET-1 | Determinism/golden gate demoted: harness keeps running; hash drift recorded via ADR, never a blocker. | `node scripts/verify-golden-hashes.cjs` runs informational; ADR note exists for any drift. |
| MIG-WAVE-ORDER-1 | Waves executed in dependency order 0→5; each depends only on earlier waves. | Ticket blocking edges reflect the wave order; review. |
| MIG-TICKET-1 | Sliced by `to-tickets` into small, independently completable/validatable frontier-ordered tickets with blocking edges. | `.scratch/effect-v4-vendor-migration/issues/` present with `Status`/`Blocked by`/`Frontier` fields. |
| MIG-SCOPE-1 | No implementation during spec/ticket production. | Spec/ticket commits contain no code/config/content/tests. |
| MIG-ADR-1 | ADR set written (plan.md §9) incl. DESIGN-08 demotion + per-package hash-change notes. | ADR files present and linked; `.ai/specs/` pointer exists. |

## Testing Decisions

- **What makes a good test.** Test external behavior at the highest seam, not
  implementation details. For this migration the load-bearing seams are: the
  **save round-trip** (does a save written before still load loadably and
  preserve future outcomes?); the **boundary accept/reject decision** (does
  Effect Schema accept/reject exactly what Zod did on existing fixtures?); the
  **wire envelope** (do IPC/event/content-pack bytes stay identical?); and the
  **dependency graph** (is there exactly one `effect`?). Prefer existing seams
  over new ones; the fewest new seams is best.
- **Full required test matrix (per non-negotiable 10):** dependency-graph
  validation (`scripts/assert-single-effect.mjs`), type checks (`pnpm
  typecheck`), unit tests (`pnpm test:run`), integration tests (save/load,
  compiler fixtures, cross-process harness), packaged Electron smoke tests
  (`pnpm test:e2e`), serialization-compatibility tests (Effect values survive
  `canonicalSerialize`), and deterministic-behavior tests (harness
  informational).
- **Modules tested.** `@bluewave/persistence` (save/recovery/compatibility,
  Effect-value serialization), `@bluewave/content-schema` +
  `@bluewave/content-compiler` (fixture validation parity), `@bluewave/events`
  (envelope validation), `@bluewave/combat` contract schemas, `@bluewave/random`
  (named-stream ledger), `@bluewave/deterministic` (hash primitives), desktop
  `src/main` schemas + IPC envelopes, and `apps/compiler-cli` entrypoint facade.
- **Prior art in the repo.** Existing `vp test` suites across `packages/*`;
  the `@bluewave/cross-process-test` child-process harness (deprecated,
  informational) and its `pnpm test:cross-process` runner;
  `scripts/verify-golden-hashes.cjs`; the Electron e2e suite under
  `apps/desktop` driven by `pnpm test:e2e` and `pnpm snap`. Use `@effect/vitest`
  only for new or Effect-specific tests; do not rewrite existing suites.

## Wave Plan

| Wave | Packages | Entry gate | Exit gate | Rollback |
| --- | --- | --- | --- | --- |
| 0 — Vendor & toolchain | `vendor/effect`, `vendor/effect-vitest`, workspace/overrides, guard scripts, tsconfig decision, tsgo lint gate | Repo synced on `dev`; `pnpm preflight` green; no merge/conflict markers | Vendor + guard + pin landed; `pnpm check` green; tsgo lint gate green; zero domain changes | Revert Wave 0 commits (no domain code to unwind) — MIG-RB-0 |
| 1 — Error + IO beachhead | `diagnostics`, `persistence` | Wave 0 exit | Typed-error model + Schema save boundary; saves load; `PERSISTENCE_*` codes survive; `SaveStore` API compatible; tests green | Revert to Wave 0 exit — MIG-RB-1 |
| 2 — Validation boundaries (Zod → Schema; remove `zod`) | `content-schema`, `content-compiler`, `events/validation`, `campaign-engine/priorities`, `combat` contracts + air-defense, desktop `src/main` schemas | Wave 1 exit | All boundaries on Schema; parity green; `zod` removed everywhere; wire parity green | Revert to Wave 1 exit — MIG-RB-2 |
| 3 — Foundation core | `contracts`, `deterministic`, `random`, `armament`, remainder of `events` | Wave 2 exit | Schema/Data/typed errors; pure packages runtime-free; typecheck/lint/tests green | Revert to Wave 2 exit — MIG-RB-3 |
| 4 — Domain core (bottom-up) | `campaign`, `ship-design`, `commands`, `campaign-engine`, `combat`, `ai`, `phase-engine` | Wave 3 exit | Migrated bottom-up; facades plain-TS-compatible; `pnpm check` green | Revert to Wave 3 exit — MIG-RB-4 |
| 5 — Unification & entrypoints | cross-package facades, one `ManagedRuntime`, desktop `src/main` entrypoint + IPC handlers, `compiler-cli` | Wave 4 exit | One long-lived runtime; `runPromise` facades; packaged Electron smoke + e2e green | Revert to Wave 4 exit — MIG-RB-5 |

## Out of Scope

- Renderer React adoption: Effect-React / effect-atom, UI-framework migration.
- Runtime Effect in the sandboxed preload.
- Rewriting or removing the deprecated determinism machinery (`cross-process-test`
  runtime, `ReplayVerifier`, `Design-08` machinery, envelope hashing, m1/m2
  acceptance registries) — kept deprecated, not cleaned up.
- `test-support` runtime changes (only follows type changes from its deps).
- Content YAML format or content-schema shape changes.
- Golden-hash regeneration as a blocker (demoted to ADR-recorded information).
- Git/commit mechanics and PR choreography.
- Satellite `@effect/*` packages (`platform-*`, `sql-*`, `atom-*`) — not used.
- A standalone Zod upgrade independent of the Schema-vs-Zod decision.

## Further Notes

- **Companion documents.** This spec is self-contained; the detailed plan
  `.scratch/effect-v4-vendor-migration/plan.md` (sections §2 vendor strategy,
  §4.1 concrete Zod sites, §5 waves, §6 migrate/do-not-migrate, §9 ADRs) remains
  the detailed companion. The completed adoption map
  `.scratch/effect-v4-adoption/map.md` and its tickets (01–09) supply the
  decision rationale; this spec extends them and does not replace them. The
  official-reference digest (Effect 4.0 stable, `git subtree` agent vendoring,
  `@effect/tsgo`/Oxlint setup) is `docs/research/effect-v4-official-references.md`.
- **Self-contained execution.** A fresh session with only this spec plus the
  repository has enough to execute: names, provenance rules, wave gates,
  rollback points, and proving commands are all stated. Where an implementation
  detail is intentionally deferred, the owning wave/ticket is named.
- **Open flags / uncertainties (do not silently resolve):**
  - The exact pin is stable `effect@4.0.2` at time of writing; re-check the
    exact `4.0.x` at Wave 0. `@effect/vitest` is pinned in lockstep. No `rc` pin.
  - `Schema.Struct` "closed by default" parity with Zod `.strict()` must be
    **verified per schema**, not assumed.
  - Whether the `DiagnosticCollector` contract itself is replaced is owned by the
    diagnostics ticket (Wave 1), not assumed here.
  - Whether `random`'s hand-rolled PRNG is ever replaced by Effect `Random` is
    owned by a Wave 3 ticket; the default (this spec) is **no**.
  - `erasableSyntaxOnly: true` for consumer code is a Wave 0 policy call; the
    research proves feasibility, not requirement.
  - `preferSchemaTaggedError` (Effect's lint) suggests `Schema.TaggedError` over
    `Data.TaggedError`; we keep the in-process/wire split and configure severity.
  - Any change to a hash-surface output must be recorded as an ADR note
    (record, not block) — this is a documentation obligation, not a gate.
- **Canonical-contract note.** Wire-format preservation is the only hard rule;
  any apparent conflict between a Schema conversion and an authoritative wire
  contract is to be reported to the orchestrator, not resolved by altering the
  format.

## Definition of Done

- [ ] Spec published at `.scratch/effect-v4-vendor-migration/spec.md`; one-line
      pointer added at `.ai/specs/effect-v4-vendor-migration.md` (index only).
- [ ] Waves 0–5 each defined with scope, blocked-by, entry gate, exit gate, and
      rollback point (MIG-WAVE0-*..MIG-WAVE5-*, MIG-RB-*).
- [ ] All 13 non-negotiables encoded as acceptance criteria with proving
      tests/commands (MIG-VENDOR-*, MIG-GRAPH-*, MIG-WIRE-*, MIG-ZOD-*,
      MIG-RUNTIME-*, MIG-EXCL-*, MIG-DET-*, MIG-GATE-*, MIG-WAVE-ORDER-1,
      MIG-TICKET-1, MIG-SCOPE-1).
- [ ] Vendor V1 layout, `UPSTREAM.md` provenance, sync procedure, zero-patch
      default, integrity pinning, and single-copy guard specified with the named
      scripts (`scripts/assert-single-effect.mjs`,
      `scripts/vendor-effect-sync.mjs`).
- [ ] `@effect/tsgo` pinned and external; runtime-usage policy table present;
      Zod→Schema boundary list + atomicity rule + conceptual mapping present.
- [ ] Migrate / do-not-migrate lists complete; ADR set (4 ADRs + per-package
      hash notes) enumerated.
- [ ] Validation commands stated: `pnpm preflight`, `pnpm check`,
      `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test:run`,
      `pnpm test:e2e`, `pnpm snap`, plus the two named scripts.
- [ ] No implementation performed while producing the spec/tickets; no code,
      tests, ADRs, or other files created or edited outside the two allowed
      writes.
- [ ] Ready for `to-tickets` slicing into frontier-ordered vertical tickets with
      blocking edges.

## Sliced tickets (frontier order)

Published at `.scratch/effect-v4-vendor-migration/issues/`. Only ticket 01 is
`Frontier: yes` initially; work the frontier top-to-bottom.

| # | Ticket | Wave | Blocked by |
| --- | --- | --- | --- |
| 01 | Vendor `effect` + `@effect/vitest` (V1 artifacts) | 0 | none |
| 02 | Wire vendored packages + single-copy guard | 0 | 01 |
| 03 | `@effect/tsgo` lint gate + tsconfig policy + ADRs | 0 | 02 |
| 04 | Wave 0 exit gate & rollback | 0 (gate) | 01,02,03 |
| 05 | `diagnostics` typed-error foundation | 1 | 04 |
| 06 | `persistence` beachhead (Schema + Effect runtime) | 1 | 05 |
| 07 | Wave 1 exit gate & rollback | 1 (gate) | 06 |
| 08 | Boundary: `content-schema` Zod→Schema | 2 | 07 |
| 09 | Boundary: `content-compiler` validate stage | 2 | 08 |
| 10 | Boundary: `events` validation | 2 | 07 |
| 11 | Boundary: `campaign-engine` priorities | 2 | 07 |
| 12 | Boundary: `combat` contract schemas | 2 | 07 |
| 13 | Boundary: desktop `src/main` schemas | 2 | 07 |
| 14 | Remove `zod` everywhere | 2 | 08–13 |
| 15 | Wave 2 exit gate & rollback | 2 (gate) | 14 |
| 16 | `contracts` | 3 | 15 |
| 17 | `deterministic` | 3 | 16 |
| 18 | `random` (keep DESIGN-08 ledger) | 3 | 17 |
| 19 | `armament` | 3 | 18 |
| 20 | `events` remainder | 3 | 19 |
| 21 | Wave 3 exit gate & rollback | 3 (gate) | 20 |
| 22 | `campaign` | 4 | 21 |
| 23 | `ship-design` | 4 | 19 |
| 24 | `commands` | 4 | 22,23 |
| 25 | `campaign-engine` remainder | 4 | 22 |
| 26 | `combat` aviation modules | 4 | 22 |
| 27 | `combat` naval modules | 4 | 22 |
| 28 | `combat` engagement/foundation modules | 4 | 22 |
| 29 | `ai` | 4 | 24 |
| 30 | `phase-engine` foundation | 4 | 24,25,26,27,28,29 |
| 31 | `phase-engine` domain phases | 4 | 30 |
| 32 | `phase-engine` battle + replay | 4 | 30 |
| 33 | Wave 4 exit gate & rollback | 4 (gate) | 31,32 |
| 34 | Unify cross-package facades | 5 | 33 |
| 35 | Desktop main `ManagedRuntime` + IPC | 5 | 34 |
| 36 | Compiler-CLI `runPromise` facade | 5 | 34 |
| 37 | Final acceptance (full gate + smoke + ADRs) | 5 | 35,36 |
| 38 | Wave 5 exit gate & rollback | 5 (gate) | 37 |
