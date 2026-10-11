# Effect v4 Migration Plan — Vendored

**Type:** implementation plan (plan-only; no code here)
**Status:** proposed
**Supersedes/extends:** `.scratch/effect-v4-adoption/map.md` (the wayfinder map,
plan-only, complete). This plan keeps that map's decisions and adds the two new
constraints requested now: **vendor the dependency** and **replace Zod with
Effect Schema everywhere**.

**Companion research (already on `dev`):**
`docs/research/effect-v4-official-references.md` (**supersedes the version
context** of the notes below — Effect 4.0 is stable),
`docs/research/effect-v4-release-reality.md`,
`docs/research/effect-v4-toolchain-compatibility.md`,
`docs/research/effect-v4-incremental-adoption.md`,
`docs/research/effect-v4-runtime-determinism.md`.

**Do not execute from this file directly.** Step 1 of the handoff is to slice
this plan with the repo's `to-tickets` machinery into frontier-ordered
implementation tickets (`.scratch/effect-v4-vendor-migration/issues/`).

---

## 1. Goal & posture

Migrate Bluewave (all engine `packages/*` + the Electron **main** process +
`compiler-cli`) to **Effect v4** as the single monorepo idiom: Effect
`Schema` for all validation, `Data.TaggedError` typed failures, and the Effect
runtime for async/IO/orchestration — **without** resolving `effect` from the npm
registry.

The `effect` runtime and the `@effect/*` packages we consume are **vendored
into this repo**, built/consumed as first-class pnpm workspace packages, and
referenced as `workspace:*` by every consumer.

Non-negotiables (from the existing map, still in force):

- **Determinism gate lifted** (ticket 05): golden-hash/cross-process
  determinism is *deprecated machinery*; drift is **recorded via ADR, never a
  blocker**. The harness keeps running for information.
- **Facades stable until unification** (ticket 08): each package's public
  surface stays plain-TS-compatible through the migration; boundaries flip to
  Effect-typed interfaces in one coherent step at the end.
- **Plan-only**: this file changes no code, config, or content.

### Why vendor (recorded rationale)

Effect **4.0 is stable** (released 2026-09-30; `effect@latest` = `4.0.2` as of
2026-10-10, with a documented LTS policy: bug fixes to at least Sep 2029,
security fixes to Sep 2029+). The earlier RC-churn risk is **resolved** — an
exact stable pin is now safe. Vendoring still buys:

1. **Frozen, exact version** independent of registry/tag drift.
2. **Reproducible, offline-capable installs** (byte-identical across dev/CI).
3. **Local patchability** — if a library bug blocks tsgo/NodeNext/Electron, we
   patch in-tree instead of waiting upstream.
4. **Supply-chain auditability** — source reviewed once, checked in.
5. **One Effect in the graph** — no accidental registry/vendored mix.
6. **Agent-legible source** — per Effect's own guidance (the "weird git trick"
   post), the vendored source is read-only reference material for coding agents.

The v4 core `effect` package has **zero runtime dependencies**, which simplifies
vendoring (no native-build concerns).

---

## 2. Vendor strategy

### 2.1 What gets vendored

| Package | Vendor? | Why |
| --- | --- | --- |
| `effect` | **yes** | The v4 consolidated core: `Schema`, `Data`, `Result`, `Option`, `Context`, `Layer`, `Effect`, `Stream`, `Cause`, etc. all live here. |
| `@effect/vitest` | **yes** | Official test integration; peer-depends on `effect` + `vitest`. Needed for Effect tests. |
| `@effect/tsgo` | **no** (pinned devDependency) | TypeScript language-service wrapper + Oxlint type-aware linter (tooling), not a runtime dependency we ship. External to `vendor/`; pinned exact. |
| `@effect/platform-*`, `@effect/sql-*`, `@effect/atom-*` | **no** | Not used. `@effect/platform` itself was consolidated into `effect` in v4; only platform *providers* remain separate and we do not need them. |
| runtime transitive deps | **n/a** | The v4 core `effect` has **zero runtime dependencies** (release post). Re-verify `dependencies` at the pin; drop the RC-era `msgpackr`/native-build caveat if empty. |

### 2.2 Vendor layout

```
vendor/
  effect/
    UPSTREAM.md            # repo, tag/commit, npm version, tarball integrity, sync date, patch list
    UPSTREAM.package.json  # upstream package.json, verbatim (provenance + integrity)
    package.json           # thin Bluewave wrapper: name "effect", same version, same exports, NO build/lint/test scripts
    LICENSE                # MIT (Effect's license, kept verbatim)
    src/                   # upstream source (reference + patch target)
    dist/                  # built artifacts (see V1 vs V2 below)
  effect-vitest/
    UPSTREAM.package.json
    package.json           # thin wrapper: name "@effect/vitest", same version/exports, no build scripts
    src/ dist/
```

**Workspace wrapper (Turbo-safety).** A pnpm workspace member is a Turbo task
target. Checking in Effect's own `package.json` unchanged would make Turbo run
Effect's upstream `build` script with its (absent) upstream devDependencies,
breaking `pnpm build`. Each vendored package therefore carries a thin
Bluewave-authored `package.json` wrapper with identical `name`, version string,
and `exports` map but **no `build`/`typecheck`/`lint`/`test` scripts**, while the
upstream `package.json` is preserved verbatim as `UPSTREAM.package.json`. `src/`,
`dist/`, `LICENSE`, `README.md` stay byte-identical to the tarball.

### 2.3 Two vendoring sub-models (pick one, record as ADR)

- **V1 — Vendor the published artifact (RECOMMENDED).** Check in the package
  exactly as npm publishes it — `dist/` (JS + d.ts), `src/`, `README.md`,
  `LICENSE` byte-identical, the upstream `package.json` retained as
  `UPSTREAM.package.json`, and a thin Bluewave wrapper `package.json` (same
  name/version/exports, no build scripts) so Turbo does not build Effect from
  source. No build step; artifacts are identical to the pinned tarball, verified
  by integrity hash. Patching means editing `src/` and re-running the upstream
  build (rare, explicit).
  - Pros: zero build risk; byte-identical; simplest CI; sync is a straight copy.
  - Cons: `dist/` adds ~12 MB of JS/d.ts to git for `effect` (source-only is
    smaller but not shippable as-is).
- **V2 — Vendor source, build in-repo with tsgo.** Copy `src/` + upstream build
  config; add a `build` script emitting to `dist/` with the repo's TS 7.0.2.
  - Pros: true source control; `dist/` can be gitignored; matches the repo's
    "every package runs `tsc -b`" model.
  - Cons: reproducing Effect's multi-entrypoint packaging is non-trivial and
    risks drift from the published artifact; Effect's own source uses
    enums/namespaces (fine outside `erasableSyntaxOnly`, which is *consumer*
    policy).

**Recommendation: V1.** The migration goal is a frozen, exact, patchable
dependency — not to re-implement Effect's build. V1 realizes "vendor" with the
least risk. Keep V2 as the documented fallback if a future patch forces a
source build. **Decision to be recorded as an ADR.**

### 2.4 pnpm mechanics

- Add `vendor/effect` and `vendor/effect-vitest` (or `vendor/effect/packages/*`)
  to `pnpm-workspace.yaml` → `packages`.
- Consumers declare `"effect": "workspace:*"` (and `"@effect/vitest":
  "workspace:*"` in dev).
- Root `overrides` map (in `pnpm-workspace.yaml` top-level `overrides:`; pnpm 11
  reads overrides there, not `package.json#pnpm.overrides`) maps `effect` and
  `@effect/vitest` to the workspace copies, so any transitive `@effect/*`
  requesting the registry resolves to the vendored copy.
- Versions: the vendored `package.json` keeps the upstream version string
  (e.g. `4.0.2`) so peer ranges (`@effect/vitest` peers
  `effect ^4.0.0`) are satisfied by the workspace package.
- `.npmrc` already has `strict-peer-dependencies=true` +
  `auto-install-peers=true`; verify peer resolution after wiring.

### 2.5 The single-copy invariant (highest-risk item)

Effect uses `Context`/`Layer`/service identity at runtime; **two copies of
`effect` in the graph causes silent failures** (services not found,
`instanceof` mismatches). Enforce:

- **CI guard script** (`scripts/assert-single-effect.mjs`): runs `pnpm why effect`
  / inspects `pnpm-lock.yaml` and fails if more than one resolution of `effect`
  exists, or if any registry `effect` is resolved.
- Wire it into `pnpm preflight` (or `pnpm check`) so it runs before every
  build. This is a hard gate.

### 2.6 Sync / update procedure

- `scripts/vendor-effect-sync.mjs --version <exact>` (or `--tag <git-tag>`):
  1. download the exact npm tarball (or GitHub tag),
  2. verify integrity (shasum) against a recorded value,
  3. unpack into `vendor/effect/`,
  4. (V1) copy `dist/`+`src/` verbatim; (V2) trigger a source build,
  5. re-apply `vendor/effect/patches/*.patch`,
  6. rewrite `UPSTREAM.md` (version, commit, integrity, date, patch list),
  7. print a `git diff --stat` summary.
- A version bump is a **normal PR** reviewed like any dependency bump,
  including a `pnpm check` run.
- **Patches:** keep `vendor/effect/patches/NNN-<name>.patch` + a README entry
  for each. **Adoption starts with zero patches** — the one known library
  wrinkle (`Channel.d.ts` references DOM `TextDecoderOptions`) is absorbed by
  the repo's existing `skipLibCheck: true` (research ticket 02), so we do not
  vendor to patch, we vendor to freeze. If a patch is ever needed, it is
  explicit, documented, and re-applied by the sync script.

### 2.7 Agent reference vendoring (read-only source)

Per Effect's official guidance (the "weird git trick" post), additionally vendor
the Effect **source repository** as read-only reference material for coding
agents. This is separate from — and complementary to — the runtime artifact:

- `git subtree add --prefix=repos/effect https://github.com/Effect-TS/effect.git <stable-tag> --squash`
  (update via `git subtree pull … --squash`); one squashed commit per sync.
- `repos/effect` is **not** a pnpm workspace member and is **never imported** by
  application code — app code imports the `vendor/effect` workspace package.
- Exclude `repos/**` from root `vp lint`/`vp fmt`, editor search/auto-import, and
  file watching, so our gates do not traverse Effect's own source.
- Add an `AGENTS.md` "Vendored repositories" section: read-only reference; prefer
  examples/patterns from `repos/effect`; do not edit or import from it; read
  `repos/effect/LLMS.md` before writing Effect code.
- Optionally create `agent-patterns/effect-*.md` (Schema, `Effect.gen`/`fn`,
  `Layer`/`Service`, errors) distilled from the vendored source.

---

## 3. Runtime-usage policy (how much Effect per package)

The map's ticket 05 *permits* the full runtime in the authoritative core; this
plan additionally **recommends using only what each package needs**, which is
both idiomatic and lower-risk:

| Package kind | Adopt | Do **not** add |
| --- | --- | --- |
| Pure synchronous computation (combat math, ship-design, campaign derivations, random, deterministic, contracts) | **Runtime-free subset**: `Schema` (sync decode/encode), `Data`/`Data.TaggedError`, `Result`, `Option`, `Predicate`, `Equal`/`Hash` | `Effect`/`Layer`/`ManagedRuntime`, fibers, live services |
| IO / async / orchestration (persistence, desktop `src/main`, compiler-cli, ai) | **Full Effect**: `Effect`, `Layer`, `Context.Service`, `ManagedRuntime`, cancellation via `Scope`, typed `Cause` | Blind wrapping of pure functions in `Effect` |
| React renderer | **nothing** — talks over IPC | Any Effect import |

Rule of thumb: introduce a runtime **at the boundary where an effect is run**,
not inside pure derivations. This preserves the determinism hygiene
(`Random.withSeed`, no live Clock) that the deprecated machinery still relies
on for informational checks, and avoids pointless fiber overhead in hot loops.

---

## 4. Zod → Effect Schema replacement

**Decision (ticket 07): replace entirely, boundary-by-boundary. No dual
maintenance, no Schema→Zod bridge** (Zod is validation-only here; there are no
downstream Zod consumers). `zod` is removed from all `package.json` files and
the root devDependency once the last boundary lands.

### 4.1 Concrete Zod sites (all of them)

```text
packages/content-schema/src/{area,design,manifest,nation,naval-profile,
  naval-profile-vocab,port,possession,route,ship-component,technology}.ts   (11 files)
packages/content-schema/src/schema-validator.ts        (type-only: z)
packages/events/src/validation.ts
packages/content-compiler/src/stages/validate.ts        (type-only: ZodSchema)
packages/campaign-engine/src/priorities.ts
packages/persistence/src/schemas.ts
packages/combat/src/air-combat/contracts.ts
packages/combat/src/aircraft/contracts.ts
packages/combat/src/carrier-operations/contracts.ts
packages/combat/src/air-defense/contracts.ts
packages/combat/src/air-defense/attack.ts
packages/combat/src/air-defense/air-defense-system-definition.ts
apps/desktop/src/main/{campaignBridge,campaignCommandSchemas,
  campaignSaveSchema,campaignSessionMetadata,drawingBoardDraft,monthInput,
  pendingCommands}.ts                                   (7 files)
root package.json devDependency "zod"
```

### 4.2 API mapping (v4 names)

| Zod | Effect Schema (v4) |
| --- | --- |
| `z.object({...})` | `Schema.Struct({...})` |
| `z.string()` / `z.number()` / `z.boolean()` / `z.unknown()` | `Schema.String` / **`Schema.Finite`** (Zod v4 `z.number()` rejects `NaN`/`Infinity`; `Schema.Number` would accept them) / `Schema.Boolean` / `Schema.Unknown` |
| `z.array(x)` / `z.record(k, v)` | `Schema.Array(x)` / `Schema.Record({key, value})` |
| `z.literal("x")` / `z.enum([...])` | `Schema.Literal("x")` / `Schema.Literal(...)` union or `Schema.Literals([...])` |
| `.optional()` | `Schema.optional(x)` |
| `.default(v)` | `Schema.optionalWith(x, { default: () => v })` |
| `.nullable()` | `Schema.NullOr(x)` |
| `.regex(...)` / `.min/.max/.int` | `Schema.String.pipe(Schema.pattern(...))`, `Schema.Number.pipe(Schema.int(), Schema.between(...))` |
| `.transform(f)` / `.refine(f,msg)` | `Schema.transform(...)` / `Schema.filter(...)` |
| `.strict()` (excess-property rejection) | `Schema.Struct` is closed by default in v4 — verify parity per schema |
| `z.discriminatedUnion("kind", [...])` | `Schema.Union(...)` with `Schema.Struct({ kind: Schema.Literal(...) })`, or tagged-union helper |
| `.superRefine(...)` (cross-field) | `Schema.filter` on the struct |
| `Schema.parse(x)` | `Schema.decodeUnknownSync(s)(x)` |
| `Schema.safeParse(x)` | `Schema.decodeUnknownResult(s)(x)` (or `Exit`/`Option`) |
| `z.infer<typeof S>` | `typeof S.Type` (v4 idiom; `Schema.Schema.Type<typeof S>` also works but `preferSchemaTypeProperty` recommends `typeof S.Type`) |
| `ZodSchema` (type) | `Schema.Schema<A, I, R>` |
| `z.ZodIssueCode.custom` | `Schema.Issue` / `Schema.makeIssue` |

In-process domain errors → `Data.TaggedError`; wire/serializable errors →
`Schema.TaggedError` (v4 rename of `TaggedErrorClass`). Note the `@effect/tsgo`
rule `preferSchemaTaggedError` suggests `Schema.TaggedError` over
`Data.TaggedError`; we keep the in-process/wire distinction and configure that
rule's severity rather than collapsing it. `DiagnosticCode` (string brand) may
become a `Schema` brand; `DiagnosticCollector` may remain a plain collector or
become an Effect `Ref`-backed service (decide in the diagnostics ticket).

For IO-boundary packages (persistence, desktop main, compiler-cli), prefer the
Effect `platform` services (FileSystem, Path, Runtime) and
`Scope`/`acquireRelease` over raw `node:fs` — a decision for the beachhead
ticket.

### 4.3 Parity & safety rules

- **Never change a public wire format as a side effect of this migration**
  (research ticket 03, Trap 6). Save files, content packs, IPC envelopes, and
  event envelopes must stay byte-compatible. This is the one hard rule.
- Default/optional/strict semantics differ subtly between Zod and Schema
  (e.g. `.default([])`, `.strict()`, `.superRefine` ordering). **Each schema
  change carries a parity test** built from existing Zod fixtures.
- Prefer `decodeUnknownSync` at boundaries; keep schemas **runtime-free** in
  pure packages (no `Effect` needed for sync decode).

---

## 5. Migration order

### 5.1 Dependency order (informative, bottom-up)

```text
contracts
  ├─ diagnostics ──────┐
  ├─ deterministic ────┤
  ├─ armament ─────────┤
  └─ content-schema ───┼─ content-compiler ─┐
                       │                    │
      random ◄─ deterministic/diagnostics   │
                       │                    ▼
                    campaign ◄─────── events ◄──── ship-design ◄─ armament/random
                       │                 │
                  campaign-engine        │
                       │                 ▼
                    commands ◄───── combat
                       │                 │
                       └──────► ai ◄─────┘
                                  │
                              phase-engine ◄─ persistence
```

Raw topological order (all of `packages/*`):
`contracts → diagnostics → deterministic → armament → content-schema →
content-compiler → random → campaign → events → ship-design → commands →
campaign-engine → combat → ai → persistence → phase-engine → test-support →
cross-process-test`.

### 5.2 Execution waves (the actual plan: risk-front-loaded, facades stable)

| Wave | Scope | Depends on |
| --- | --- | --- |
| **0 — Vendor & toolchain** | Vendor `effect` + `@effect/vitest`; workspace/overrides; single-copy guard; pin; tsconfig decision (`skipLibCheck` stays; `erasableSyntaxOnly` for consumer code); `@effect/tsgo` lint gate; no domain code | — |
| **1 — Error + IO beachhead** | `diagnostics` (typed-error foundation), then `persistence` (Schema at the save boundary; Effect runtime + `Scope`/AbortSignal cancellation; tagged `PERSISTENCE_*` errors) | 0 |
| **2 — Validation boundaries (Zod → Schema; remove `zod`)** | `content-schema` + `content-compiler/stages/validate` (paired via `ZodSchema` type), `events/validation.ts`, `campaign-engine/priorities.ts`, `combat` `*-contracts.ts` + air-defense schemas, desktop `src/main` schemas; **delete `zod` from every `package.json` + root devDep** | 1 (error model) |
| **3 — Foundation core** | `contracts` → `deterministic` → `random` → `armament` → remainder of `events` | 2 |
| **4 — Domain core (bottom-up)** | `campaign` → `ship-design` → `commands` → `campaign-engine` (rest) → `combat` (rest) → `ai` → `phase-engine` | 3 |
| **5 — Unification & entrypoints** | Flip cross-package facades to Effect-typed interfaces; one long-lived `ManagedRuntime`; `apps/desktop/src/main/index.ts` + IPC handlers; `apps/compiler-cli` behind `runPromise` facades; retire deprecated wiring | 4 |

Wave boundaries are **merge points**, not necessarily separate sprints; `to-tickets`
will slice each wave into vertical tickets with blocking edges.

### 5.3 Per-wave definition of done (strict idiom)

For every migrated package:

- Tagged errors replace `throw` / `undefined` / ad-hoc `Result` at the boundary.
- `Schema` owns every validation boundary; no `zod` import remains.
- Effect runtime used for async/IO where present (runtime-free subset in pure
  packages).
- `effect-best-practices` lint gate passes (`@effect/tsgo` diagnostics).
- Package tests green; `pnpm typecheck` / `pnpm build` clean under tsgo.
- No public API break (facade rule); wire formats unchanged (parity tests).
- Any change to hash-surface output recorded as an **ADR note** (record, not
  block).

---

## 6. Migrate / do-not-migrate

### 6.1 Migrate

| Path | What changes |
| --- | --- |
| `packages/contracts` | `Schema` for shared contracts; `Result`/`Option` helpers |
| `packages/diagnostics` | `Data.TaggedError` error model; keep `DiagnosticCollector` contract |
| `packages/deterministic` | `Schema`/`Data`; keep hash primitives |
| `packages/random` | typed errors; keep DESIGN-08 named-stream ledger (do **not** swap for Effect `Random`) |
| `packages/armament` | `Schema`/`Data` types |
| `packages/content-schema` | all 12 Zod files → `Schema` (largest boundary) |
| `packages/content-compiler` | `validate.ts` `ZodSchema` → `Schema`; tagged errors |
| `packages/events` | `validation.ts` → `Schema`; envelope types |
| `packages/campaign` | `Schema`/`Data`; tagged errors |
| `packages/ship-design` | `Schema` validation + tagged errors (runtime-free) |
| `packages/commands` | tagged errors; command envelopes via `Schema` |
| `packages/campaign-engine` | `priorities.ts` → `Schema`; rest |
| `packages/combat` | contract schemas → `Schema`; tagged errors; pure math stays runtime-free |
| `packages/ai` | full Effect (orchestration) |
| `packages/persistence` | beachhead full Effect + `Schema` |
| `packages/phase-engine` | full Effect orchestration; tagged errors |
| `apps/desktop/src/main/**` | full Effect: IPC handlers, command orchestration, one `ManagedRuntime` |
| `apps/compiler-cli` | `runPromise` facade entrypoint |

### 6.2 Do **not** migrate (explicit)

| Path | Why |
| --- | --- |
| `apps/desktop/src/renderer/**` | React UI. Effect stays out of components; renderer talks over IPC. effect-atom/Effect-React is out of scope (map). Avoids ~86 KB gzip in the renderer. |
| `apps/desktop/src/preload/**` | Sandboxed preload; electron-vite externalizes deps and they are unresolvable in a sandboxed preload (research ticket 02). Keep IPC-only. |
| `packages/cross-process-test` | Deprecated determinism harness (ticket 05); leave running, do not invest. |
| `packages/test-support` | Test fixtures; only follow type changes from its deps, no runtime/Effect. |
| `content/**`, `golden/**` | Data/fixtures, not code. |
| `prototype/**`, `graph-memory-starter/**`, `codefetch/**` | Not in the pnpm workspace. |
| `scripts/**` (existing) | Build tooling, plain Node/CJS. (New `vendor-*` scripts are added here.) |
| `tsconfig.base.json`, `turbo.json`, `vite.config.ts` | Keep; only additive changes (lint gate, skipLibCheck stays). |
| Test files broadly | Keep `vp test`; use `@effect/vitest` only for new/Effected tests — do not rewrite the suite. |
| Renderer-side UI libs (react, d3, tailwind, base-ui, …) | Unrelated. |

---

## 7. Verification (post-demotion)

- `pnpm preflight` (now incl. **single-copy Effect guard**) → `pnpm check`
  (format, lint, typecheck, build, `test:run`, `test:e2e`) green per wave.
- **Save round-trip**: existing saves still load (ADR-0023 / ADR-0024);
  `PERSISTENCE_*` codes survive as tagged errors.
- **Wire parity**: content-pack validation, IPC envelopes, event envelopes
  produce identical accept/reject decisions on existing fixtures.
- **Cross-process harness** keeps running (informational): determinism diffs
  surface and are **recorded via ADR note, never a failing blocker**.
- Golden hash drift: permitted and recorded via ADR (ticket 05).
- `pnpm snap`/`test:e2e` for any desktop-visible change (AGENTS.md rule).

---

## 8. Risks & mitigations

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | v4 RC API churn (weekly releases) | Vendor + pin exact; rc→stable bump is one reviewed PR riding `MIGRATION.md`. |
| 2 | Two `effect` copies → `Context`/`Layer` identity breakage | Hard CI guard (2.5); `overrides` + `workspace:*`. |
| 3 | Reproducing Effect's build (V2) | Choose **V1** (published artifact); V2 is documented fallback only. |
| 4 | Zod→Schema semantic drift (defaults/optional/strict) | Parity tests from existing fixtures; never change wire formats mid-migration. |
| 5 | Runtime transitive deps (RC-era `msgpackr`/native build) | v4 core has zero runtime deps; re-verify at the pin and drop this caveat if `dependencies` is empty. |
| 6 | Renderer bundle bloat | Keep Effect/Schema out of `renderer/` and `preload/`; main-only. |
| 7 | `@effect/vitest` peer resolution under strict pnpm | Verify after wiring; `workspace:*` + matching pinned version. |
| 8 | tsgo friction (`Channel.d.ts` `TextDecoderOptions`) | Keep `skipLibCheck: true` (load-bearing). |
| 9 | Effort size (`combat` 56k lines, `ship-design` 12.7k, `phase-engine` 8.2k) | Runtime-free subset for pure packages; slice into many vertical tickets; don't wrap pure code in `Effect`. |
| 10 | Patches drifting on sync | Zero-patch adoption by default; documented `patches/` re-applied by sync script. |
| 11 | `DiagnosticCollector` contract confusion | Decide in the diagnostics ticket; keep the collector's observable behavior stable. |
| 12 | `repos/effect` source subtree pollutes root lint/format/search | Exclude `repos/**` from `vp lint`/`vp fmt`, editor search/auto-import, and watchers; keep it out of the pnpm workspace and Turbo graph. |

---

## 9. ADRs to write at handoff

1. **Adopt Effect v4** (stable line; pin exact `4.0.2`, or the exact stable at
   execution time; runtime-free core vs full-Effect boundaries).
2. **Vendor Effect** (vendor model V1, layout, sync procedure, single-copy
   invariant, zero-patch default, read-only `repos/effect` agent reference).
3. **Replace Zod with Effect Schema** (boundary-by-boundary, no dual
   maintenance, wire formats frozen).
4. **DESIGN-08 determinism spine demoted** (conflict recorded by ticket 05).

---

## 10. Next steps

1. Confirm the two open choices (both have a recommended default):
   - **Vendor sub-model V1 vs V2** → default **V1**.
   - **Runtime usage policy** → default **runtime-free subset in pure packages,
     full Effect at IO/orchestration boundaries**.
2. Run the **spec-creator** (`to-spec`) to publish `.scratch/effect-v4-vendor-migration/spec.md`.
3. Run **`to-tickets`** to slice Waves 0–5 into `issues/` tickets (frontier-ordered,
   blocking edges).
4. Execute Wave 0 (vendor + guard) first; it unblocks every other wave and ships
   no domain changes.

---

## 11. References (official, verified 2026-10-10)

- Onboarding — https://effect.website/docs/v4/onboarding
- Getting started — https://effect.website/docs/v4/getting-started
- Agent vendoring recipe — https://effect.website/blog/the-one-weird-git-trick-that-makes-coding-agents-more-effect-ive
- Effect LSP / linter — https://github.com/Effect-TS/tsgo#lsp-based-linter
- Oxlint setup — https://github.com/Effect-TS/tsgo/blob/main/docs/README.md
- Effect 4.0 release — https://effect.website/blog/releases/effect/40
- npm dist-tags — https://registry.npmjs.org/-/package/effect/dist-tags
- Full digest and implications: `docs/research/effect-v4-official-references.md`.
