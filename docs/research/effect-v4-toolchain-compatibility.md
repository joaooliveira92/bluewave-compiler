# Research: Effect v4 × Bluewave toolchain compatibility

Grounds wayfinder ticket `02-toolchain-compatibility` (`.scratch/effect-v4-adoption/issues/02-toolchain-compatibility.md`).
Answers whether `effect` v4 compiles and runs cleanly under this repo's exact toolchain: TypeScript 7.0.2
(native tsgo), `module`/`moduleResolution: NodeNext`, composite + declarationMap builds, pnpm 11 + turbo,
the `vp` (vite-plus) lint/format/test runner, and a Vite-bundled Electron app (main + preload + renderer, ESM).

**Headline verdict**

1. **tsgo / erasable-only: clean.** Every standard v4 consumer idiom compiles under tsgo 7.0.2 with
   `erasableSyntaxOnly: true` + `verbatimModuleSyntax: true` (empirically executed). Effect's *own* source
   uses enums, so Effect does not (and cannot) enforce the flag internally — consumer code doesn't need to.
   The one library-level wrinkle (`Channel.d.ts` references the DOM global `TextDecoderOptions`) is absorbed
   by the repo's existing `skipLibCheck: true`.
2. **NodeNext + composite: works.** `tsc -b` with `composite` + `declaration` + `declarationMap` + NodeNext
   emits successfully and the compiled output runs under Node ESM (executed). No known open core-effect
   NodeNext issues (a v3-era satellite-package issue exists: `@effect/sql-drizzle` #5108).
3. **ESM-only: yes.** v4 is single-build ESM (`"type": "module"`, no CJS dist). Requirements per the
   package's own README: **TypeScript ≥ 5.9 (TS 7 recommended), Node.js ≥ 18, `strict: true`**.
4. **Vite / electron-vite / vp interop: no blockers.** Effect has zero `node:` builtin imports anywhere in
   `dist` (browser-safe, renderer-bundleable). electron-vite 5 externalizes `dependencies` in main/preload —
   fine for ESM in Electron 41 main; **do not import `effect` in a sandboxed preload** (it would be
   externalized and unresolvable). The `vp` test runner's vitest 4.1.10 is inside `@effect/vitest@4.0.0-rc.109`'s
   peer range (`vitest >=4.1.0 <5.0.0`).
5. **Bundle cost (measured, BALANCE TARGET):** minimal Effect usage ≈ **81 KB raw / 28 KB gzip**; adding
   Schema.Struct + decodeSync ≈ **224 KB raw / 68 KB gzip**; realistic core set (Effect+Data+Schema+Context+
   Layer+Option+Result) ≈ **275 KB raw / 86 KB gzip** (esbuild minify; Rollup/Vite prod is comparable).
   Cold `import('effect')` under Node 24 ≈ **97 ms** (order-of-magnitude; browser renderer will differ).

---

## 1. Question

Does Effect v4 compile and run cleanly under this repo's exact toolchain — TypeScript 7.0.2 (native tsgo;
does consumer code need erasable-only syntax?), `module`/`moduleResolution: NodeNext` + composite/declarationMap
builds, pnpm 11 workspace + turbo, the `vp` (vite-plus) lint/format/test runner, and Vite-bundled Electron
main + renderer (ESM)? Is `effect` ESM-only in v4? What are the Node/TS requirements? What is the renderer
bundle-size / startup impact of importing `effect` (and `effect/Schema`)? Any known vite / electron / tsgo
interop gotchas?

## 2. Sources

| # | Source | What it is | Verified |
| --- | --- | --- | --- |
| S1 | npm registry: `effect` dist-tags + full metadata for `4.0.0-rc.109` and `3.22.1` (`registry.npmjs.org/effect`, `/-/package/effect/dist-tags`) | authoritative published-package metadata | ✅ directly read |
| S2 | `effect-4.0.0-rc.109.tgz` tarball (extracted): `package.json` (exports map, `type`, deps, `sideEffects`), `README.md` (Requirements), `dist/**/*.d.ts`, `dist/**/*.js`, `src/**/*.ts` | the published artifact itself — the highest-trust source for packaging facts | ✅ read directly + grep-scanned |
| S3 | `github.com/Effect-TS/effect/blob/main/MIGRATION.md` (raw) | official v3→v4 migration guide (unstable modules, single versioning, merged packages, `@effect/vitest`) | ✅ read |
| S4 | `effect.website/docs/getting-started/importing-effect/` | official docs: import styles + tree-shaking guidance (Rollup/Webpack 5+ do deep-scope analysis) | ✅ read |
| S5 | `effect.website/blog/releases/effect/40-beta` (2026-02-18) | official v4 beta release note ("API may change between beta releases") | ✅ read (search snippet) |
| S6 | `github.com/Effect-TS/tsgo` README | Effect's official TS7/tsgo wrapper (`@effect/tsgo`, LSP tooling; supports TS `7.0.2`); "use effect-tsgo instead of tsgo" | ✅ read |
| S7 | `github.com/Effect-TS/effect` root `package.json` (raw) | Effect's own toolchain: `typescript ^7.0.2`, `@effect/tsgo ^0.21.0`, `vitest ^4.1.10`, `vite ^8.1.5` | ✅ read |
| S8 | GitHub API: Effect-TS/effect issues #1450, #5108, #6401, #6381, #7197 | issue history: NodeNext types condition, satellite NodeNext issue, tsgo adoption | ✅ read |
| S9 | npm registry: `@effect/vitest@4.0.0-rc.109` | official vitest integration (peer: `effect ^4.0.0-rc.109`, `vitest >=4.1.0 <5.0.0`) | ✅ read |
| S10 | `typescriptlang.org/tsconfig/erasableSyntaxOnly` | TS docs: what erasableSyntaxOnly forbids (enums, runtime namespaces, parameter properties, `import =`/`export =`, `<T>` assertions) | ✅ read |
| S11 | devblogs.microsoft.com/typescript: "Announcing TypeScript 7.0 Beta" (2026-04-21), "Progress on TypeScript 7 — December 2025", "Announcing TypeScript Native Previews" | TS7/tsgo official announcements (native port replaces tsc; node10 deprecations; declaration emit status over time) | ✅ read |
| S12 | microsoft/typescript-go issues #911, #491, #1955 (+ PR #1956) | tsgo erasableSyntaxOnly history: flag now supported (fixed in #1068); JS-file check bug fixed in #1956 | ✅ read |
| S13 | `nodejs.org/api/typescript` | Node type-stripping rules: only erasable syntax runs; type-only namespaces are supported; recommended tsconfig (nodenext, erasableSyntaxOnly, verbatimModuleSyntax) | ✅ read |
| S14 | `electron-vite.org/guide/dependency-handling` | electron-vite 5: main/preload `dependencies` external by default; renderer deps bundled; sandboxed preload requires bundling | ✅ read |
| S15 | vitejs/vite issues #12421, #12843; electron-vite `vite-plugin-electron-renderer` docs | Electron renderer pre-bundling history (CJS/ESM interop for Node modules — not applicable to `effect`) | ✅ read |
| S16 | vitest-dev/vitest issue #9098 | "Standard Schema matcher incompatible with Effect" (closed) — use `@effect/vitest` | ✅ read |
| S17 | **Empirical probe (executed in `/var/folders/.../opencode/effect-probe`)**: `typescript@7.0.2` + `effect@4.0.0-rc.109` + `@types/node@24`; scenarios: erasableSyntaxOnly ± skipLibCheck, `tsc -b` composite/declarationMap, bundler resolution, node ESM runtime smoke, esbuild bundle sizes, cold-import timing | ground truth against the exact compiler + exact package versions | ✅ executed (commands + outputs in §3) |
| S18 | Repo files: `tsconfig.base.json`, `package.json`, `pnpm-workspace.yaml`, `apps/desktop/{electron.vite.config.ts, vitest.config.ts, tsconfig.node.json, tsconfig.web.json, package.json}` | the actual toolchain being evaluated (TS 7.0.2, vite = `@voidzero-dev/vite-plus-core@0.2.8`, vitest 4.1.10, electron-vite 5, Electron 41.10.4, Node 24.18.0) | ✅ read |

## 3. Findings

### 3.1 Q1 — TypeScript 7 / tsgo / erasable-only syntax

**Version pin reality.** As of 2026-08-16 the npm dist-tags for `effect` are: `latest: 3.22.1`, `rc: 4.0.0-rc.109`,
`beta: 4.0.0-beta.107` (S1). **Effect v4 is not yet a stable release**; the current v4 line is `4.0.0-rc.109`.
The rc's README carries an explicit "Note: Effect v4 is currently in beta. APIs may change between beta
releases" framing in the migration guide (S3), and the official v4 beta blog post (2026-02-18) says the same
(S5). All v4 facts below are rc.109 facts.

**Effect's own toolchain is TS 7.** The Effect repo's root `package.json` declares `typescript ^7.0.2` and
`@effect/tsgo ^0.21.0` (S7); the v4 README's Requirements say "**TypeScript 5.9 or newer. TypeScript 7 is
recommended** for the best performance and compatibility with Effect's TypeScript tooling" (S2). `@effect/tsgo`
officially supports TS `7.0.2` (S6). So the repo's TypeScript 7.0.2 is inside Effect's tested envelope.

**Erasable-only syntax: what tsgo actually enforces.** TS docs define `erasableSyntaxOnly` as forbidding:
`enum` declarations, `namespace`/`module` with runtime code (type-only namespaces are legal — Node docs
confirm this, S13), parameter properties, `import =`/`export =`, and angle-bracket assertions (S10). Two
nuances verified empirically against the exact repo compiler:

- **tsgo 7.0.2 type-checks non-erasable syntax fine when the flag is off.** A control file with `enum`,
  a parameter property, and a runtime namespace compiled with exit 0 without the flag (S17).
- **With `erasableSyntaxOnly: true` the same file errors** (TS1294 "This syntax is not allowed when
  'erasableSyntaxOnly' is enabled" on all three constructs) — the flag is the enforcement mechanism (S17).

So "TS7 requires erasable-only syntax" is really "TS7 + erasableSyntaxOnly (the mode Node type-stripping and
tsgo's emit model are built around) forbids it". The repo's tsconfig.base.json does **not** currently set
`erasableSyntaxOnly` (S18); the ticket's constraint is the team's chosen discipline.

**Effect v4 consumer patterns are 100% erasable-safe (verified).** A realistic consumer using only documented
v4 idioms — `Data.TaggedError("X")<{...}>`, `Effect.gen`, `Effect.fn` (+ `Effect.fn.Return<A>` annotation),
`Schema.Struct`, `Schema.Schema.Type<typeof X>`, `Schema.decodeSync`, `Context.Service<Self, Shape>()("Key", { make })`,
`Schema.TaggedError<Self>()("Tag", fields)`, `Option`/`Result` — compiled cleanly under tsgo 7.0.2 with
`erasableSyntaxOnly: true` + `verbatimModuleSyntax: true` + `isolatedModules` + `noUncheckedIndexedAccess` +
NodeNext + `skipLibCheck: true` (exit 0, S17). With `skipLibCheck: false` the *only* extra error is inside
Effect's own `.d.ts`:

```
effect/dist/Channel.d.ts(4911,75): error TS2304: Cannot find name 'TextDecoderOptions'.
```

`TextDecoderOptions` is a DOM-lib global; engine packages compile with `lib: ["ES2024"]` + `types: ["node"]`
and no DOM lib. The repo's existing `skipLibCheck: true` absorbs this (S18). **Recommendation: keep
`skipLibCheck: true` — do not flip it off for packages that consume Effect.**

**Effect itself cannot be erasableSyntaxOnly-clean.** The shipped `src/` uses real `enum` declarations
(`src/Schema.ts`, `src/Data.ts`, `src/JsonSchema.ts`, `src/SchemaRepresentation.ts`, `src/SchemaAST.ts`,
`src/unstable/cli/Flag.ts`, etc.) and the shipped `dist/**/*.d.ts` contains ambient enums (12 files) and
namespaces (87 files) (S2). That is a library-internal matter: the flags are consumer-side disciplines, and
`skipLibCheck` keeps the ambient declarations from leaking into consumer builds (verified: erasableSyntaxOnly
did **not** flag the `.d.ts` enums/namespaces — S17).

### 3.2 Q2 — NodeNext, composite project references

**Verified working end-to-end.** `tsc -b` with `composite: true` + `declaration: true` + `declarationMap: true`
+ `module/moduleResolution: NodeNext` + `strict` against the rc.109 consumer emitted `dist/index.{js,d.ts,.d.ts.map}`
successfully (exit 0); the declarationMap correctly maps to `../src/index.ts` (S17). The compiled output then
ran under Node 24 ESM: `run() => n=42`, `Schema.decodeSync` decoded a struct, `Effect.fn` returned a runnable
effect (S17). Type-only namespace merging (`export interface Box` + `export namespace Box { export type Meta }`,
an idiom Effect's `.d.ts` uses pervasively) also type-checks under the flag (S17, S13 for legality).

**Resolution mechanics.** v4's exports map has no `"types"` condition — TS infers the sibling `./dist/*.d.ts`
next to `./dist/*.js`; subpaths resolve through the `"./*"` wildcard → `./dist/*.js` (S2). This worked under
both NodeNext (engine packages) and `moduleResolution: bundler` (apps/desktop renderer tsconfigs) (S17).

**Known issues.** No open core-`effect` NodeNext issue was found. Historical context: v3 issue #1450 ("hotfix
exports types condition for consumers with NodeNext") was closed long ago (S8). The one open NodeNext report
(#5108, "`@effect/sql-drizzle` — NodeNext as the module type is not supported", v3-era, satellite package,
unfixed) is about a **satellite** package (drizzle ORM glue), not core `effect` — a caution only for
unstable/satellite modules (S8).

### 3.3 Q3 — ESM-only + Node/TS requirements

**v4 is ESM-only, single build.** rc.109's `package.json`: `"type": "module"`, no `main`/`module`/`types`
fields, exports map pointing only at `./dist/*.js` (no CJS build exists in the tarball — `dist/` contains only
`.js` + `.d.ts` pairs) (S2). v3.22.1 (latest stable) is still dual (`main: ./dist/cjs/index.js`,
`module: ./dist/esm/index.js`) (S1) — so this is a v4 break, not a v3 fact. This repo is already fully ESM
(`"type": "module"` throughout, S18), so **no interop action is needed**.

**Requirements (v4 rc README, S2):** TypeScript **5.9 or newer** (TS 7 recommended); **Node.js 18 or newer**
when running on Node; **`strict: true`** mandatory. No `engines` field is published (S1/S2), so the README is
the operative statement. Repo baseline (Node 24.18.0, TS 7.0.2, strict everywhere, S18) exceeds all three.

**New runtime dependencies in v4 (S2):** `@standard-schema/spec ^1.1.0`, `fast-check ^4.9.0`, `msgpackr ^2.0.4`
(v3 had no msgpackr — it is new in the v4 line). `msgpackr` has an optional native extractor
(`msgpackr-extract`, seen in the install log); it is a pure-JS fallback when the native binary is absent.
This repo's pnpm `allowBuilds` whitelist (electron, esbuild only) will block its postinstall — harmless for
functionality, but **flag for the runtime-determinism ticket (04)**: msgpackr sits on the data/serialization
path (`Data`/persistence-adjacent), so its behavior must be pinned into the determinism profile rather than
left implicit.

### 3.4 Q4 — Vite / electron-vite / vp interop gotchas

**Browser-safety: clean.** Zero `node:`-builtin imports anywhere in `dist/` (top-level **and** `unstable/`)
(S2 grep). Core `effect` + `effect/Schema` bundle for a browser renderer with no shims; the old Electron
renderer pre-bundling pain (vitejs/vite #12421/#12843, `vite-plugin-electron-renderer`) exists only for
packages that import Node builtins — `effect` is not one of them (S15). `sideEffects: []` is declared (S2),
so Vite/Rollup fully tree-shakes Effect, and the official docs explicitly bless named imports under Rollup
("bundlers that support deep scope analysis: Rollup, Webpack 5+" — S4; Effect's functions-over-methods
design exists precisely for tree-shakeability, S4). Vite prod builds use Rollup, so the repo is on the blessed
side.

**electron-vite 5 specifics (this repo uses electron-vite 5 + `externalizeDepsPlugin`, S18):** main and
preload treat `dependencies` as external by default; renderer bundles them (S14). Effect in the **main**
process as an externalized ESM dep is fine (Electron 41 supports ESM main; apps/desktop is `"type": "module"`,
S18). **Gotcha: do not import `effect` in a sandboxed preload** — externalized deps cannot be resolved there;
electron-vite's docs state that disabling dependency externalization is required to support sandboxed preloads
(S14). Keep Effect out of preload (current preload is IPC-only, S18); if ever needed, opt it into bundling
via `build.externalizeDeps.exclude` for the preload config only.

**`vp` test runner (vitest 4.1.10 via the vite-plus fork, S18):** no blocker found. The official integration
`@effect/vitest@4.0.0-rc.109` declares `peerDependencies: effect ^4.0.0-rc.109, vitest >=4.1.0 <5.0.0` (S9) —
the repo's vitest 4.1.10 is in range. One known vitest-side wart: vitest's standard-schema matchers were
incompatible with Effect (vitest#9098, closed); the recommended path is `@effect/vitest`'s own matchers
(S9/S16). No open vitejs/vite issue specific to the Effect library exists (searched, S15).

**tsgo quirk (library-side, not consumer-side):** tsgo once misapplied `erasableSyntaxOnly` checks to `.js`
files (microsoft/typescript-go #1955; fixed in #1956) and the flag itself is fully supported since #1068 (S12).
Not actionable for this repo, but relevant if the team turns the flag on and sees spurious `.js` diagnostics
on an older tsgo.

### 3.5 Q5 — Bundle size / startup cost (measured)

Method: esbuild (0.28.x, same class of minifier Vite uses) bundle + minify of ESM entries against the
installed rc.109, gzip after; Node 24.18.0 cold `import()` timing (S17). These are **lower-bound floors for
"imported and used" surface**, thanks to `sideEffects: []` (S2); Rollup (Vite prod) tree-shakes at least as
well. Treat as BALANCE TARGET data, not normative constants.

| Entry (what a Bluewave consumer would realistically import) | Raw (minified) | gzip | Cold import (Node 24) |
| --- | --- | --- | --- |
| `import { Effect } from "effect"` (succeed/gen/runSync) | 80.7 KB | 28.3 KB | 96.9 ms (whole package graph) |
| `import { Schema } from "effect"` (Struct + decodeSync) | 223.9 KB | 67.6 KB | +0.3 ms incremental |
| Combined core set: Effect + Data + Schema + Context + Layer + Option + Result | 274.9 KB | 85.9 KB | — |
| Whole `dist/` on disk (unminified `.js` only) | 11.98 MB | — | upper bound if everything were kept (it isn't — tree-shaken) |

Reading: importing `effect` in the Electron renderer adds roughly **85–90 KB gzipped** for a realistic core
usage including Schema; parse/eval cost is in the tens-of-ms class (the 97 ms Node figure includes cold
disk reads + full module-graph eval and is an order-of-magnitude proxy; a browser renderer will differ).
The docs' own guidance (S4) plus `sideEffects: []` means named imports keep this at the floor; importing
`effect` root barrel only pulls what is referenced.

## 4. Recommendations

Concrete values the implementator / policy tickets may use (factual, grounded):

1. **Version pin:** v4 is not stable; pin the `4.0.0-rc.109` line (via `rc` dist-tag or exact version) and
   re-verify at stable release — cross-checked with ticket 01. Do not treat any v4 API name as frozen
   (official "APIs may change between beta releases", S3/S5).
2. **tsconfig:** no changes required. Optionally add `"erasableSyntaxOnly": true` to `tsconfig.base.json` —
   every Effect v4 consumer pattern passes it (S17) — but that is a policy decision for the engine-core
   ticket, not a requirement. **Keep `skipLibCheck: true`** — it is load-bearing for Effect (Channel.d.ts
   `TextDecoderOptions`, S17).
3. **NodeNext/composite:** adopt Effect in engine packages as-is; verified against `tsc -b`
   composite/declarationMap (S17). Avoid `@effect/*` **satellite** packages with known NodeNext friction
   (`@effect/sql-drizzle`, #5108) until confirmed; core `effect` is clear.
4. **ESM-only:** no action — repo is fully ESM; Node ≥ 18 requirement (S2) is satisfied by Node 24.18.0.
5. **Electron:** renderer bundling is the natural home (bundled, tree-shaken, zero Node builtins). Main
   process OK as externalized ESM dep. **Do not import `effect` in the sandboxed preload** (S14).
6. **vp test runner:** use `@effect/vitest@4.0.0-rc.109` for Effect tests (vitest 4.1.10 in peer range,
   S9); avoid vitest's built-in standard-schema matchers with Effect (S16).
7. **Bundle budget (BALANCE TARGET, non-normative):** ~28 KB gzip for core-only, ~68 KB gzip for Schema,
   ~86 KB gzip for the realistic core set; renderer startup impact tens of ms. Decide acceptance against the
   beachhead (ticket 06); if the renderer must stay lean, keep Schema usage out of the renderer shell and in
   main/engine packages where possible.
8. **Determinism watch (hand off to ticket 04):** v4 adds `msgpackr` (+ optional native `msgpackr-extract`)
   to the dependency graph (S2); pnpm's `allowBuilds` whitelist already prevents its native postinstall here
   (pure-JS fallback). Pin and profile msgpackr behavior in the determinism work rather than assuming
   stability.

## 5. Deferred

- **Exact stable v4 pin + v3→v4 API delta inventory** → ticket 01 (`effect-v4-release-reality`).
- **Runtime determinism profile of v4** (msgpackr, `Data` equality/hash semantics, `Schema` encode/decode
  purity) → ticket 04 (`runtime-determinism-profile`); this note only flags msgpackr's presence.
- **`erasableSyntaxOnly: true` in `tsconfig.base.json` (enable or not)** → engine-core policy ticket 05
  (this note proves feasibility; adoption is a policy call).
- **Preload policy for Effect** (if a future IPC/validation path wants Effect in preload, the electron-vite
  externalizeDeps.exclude change + sandbox implications must be decided) → engine-core policy ticket 05.
- **Renderer bundle-budget acceptance** (~86 KB gzip core set acceptable?) → beachhead ticket 06.
- **Effect's own enums-in-src** (why Effect cannot self-enforce erasableSyntaxOnly) — informational only;
  no owner needed, no action for consumers.
