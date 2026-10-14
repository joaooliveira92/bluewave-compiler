# Research — Effect v4 runtime idioms for an Electron main process and a sync CLI

- **Ticket:** `.scratch/effect-apps-runtime/issues/01-research-effect-runtime-idioms.md`
- **Map:** `.scratch/effect-apps-runtime/map.md` ("Effect runtime adoption in apps").
- **Type:** research (read-only; no application code touched).
- **Date:** 2026-10-14.
- **Evidence rule:** the vendored source `vendor/effect` (`effect@4.0.2`, byte-identical
  to the npm tarball) and its declarations are the evidence-of-truth for *what an API
  does*. `repos/effect` is the read-only source subtree at the same tag and is cited only
  where it confirms a vendored name or supplies the implementation of a vendored symbol.
  Repo policy (`RULES.md`, ADRs) is the policy of record; where the vendored API and the
  policy differ, the difference is called out. **No claim here is taken from prior Effect
  knowledge** — every API name was read out of `vendor/effect/src` or
  `vendor/effect/dist/*.d.ts`.
- **Probes:** throwaway, under `.scratch/effect-apps-runtime/probe/` (never application
  code). Commands and results in §7.
- **Scope:** the two non-renderer app surfaces only (`apps/desktop/src/main`,
  `apps/compiler-cli`). The engine packages stay runtime-free (ADR-0128 §Revisit #2);
  the renderer/preload stay Effect-free (MIG-EXCL-1). This note does **not** resolve any
  `docs/OPEN-ISSUES.md` item (none is in scope) and does not author constants, specs, or
  code.

---

## 1. Question

What are the correct, vendored-verified `effect@4.0.2` idioms for hosting the full
runtime in two app surfaces — a long-lived `ManagedRuntime` in an Electron main process
and a `runPromise` facade over the `compiler-cli` — covering: (1) runtime lifecycle and
disposal, (2) edge bridging at `ipcMain.handle`/CLI `main()`, (3) `Context.Service` +
`Layer` for synchronous `node:fs` dependencies vs the core platform services, (4) error
channels (`Data.TaggedError`/`Schema.TaggedError`, `catchTag`/`catchTags`, `Cause`/`Exit`),
(5) whether `@effect/vitest` is the intended harness alongside `vite-plus/test`, and
(6) which runtime facilities are non-deterministic and how to keep app-shell
orchestration non-authoritative.

---

## 2. Sources

| tag | source | status |
| --- | --- | --- |
| [V-MRT] | `vendor/effect/src/ManagedRuntime.ts`; `vendor/effect/dist/ManagedRuntime.d.ts` | **read directly** |
| [V-EFF] | `vendor/effect/src/Effect.ts`; `vendor/effect/dist/Effect.d.ts` | **read directly** |
| [V-CTX] | `vendor/effect/src/Context.ts` | **read directly** |
| [V-LAY] | `vendor/effect/src/Layer.ts` | **read directly** |
| [V-DATA] | `vendor/effect/src/Data.ts`; `repos/effect/packages/effect/src/internal/core.ts` | **read directly** (the impl is in `repos`, same tag) |
| [V-SCH] | `vendor/effect/src/Schema.ts` | **read directly** |
| [V-EXIT] | `vendor/effect/src/Exit.ts` | **read directly** |
| [V-CAUSE] | `vendor/effect/src/Cause.ts` | **read directly** |
| [V-RT] | `vendor/effect/src/Runtime.ts` | **read directly** |
| [V-FS] | `vendor/effect/src/FileSystem.ts` | **read directly** |
| [V-PATH] | `vendor/effect/src/Path.ts` | **read directly** |
| [V-PROC] | `vendor/effect/src/process/ChildProcess.ts`, `ChildProcessSpawner.ts` | **read directly** |
| [V-CLK] | `vendor/effect/src/Clock.ts`; `vendor/effect/src/internal/effect.ts` (`ClockImpl`) | **read directly** |
| [V-RND] | `vendor/effect/src/Random.ts`; `vendor/effect/src/internal/random.ts` | **read directly** |
| [V-VIT] | `vendor/effect-vitest/src/index.ts`, `src/internal/internal.ts`, `README.md`, `package.json` | **read directly** |
| [R-PLAT] | `repos/effect/packages/platform/node/src/{NodeFileSystem,NodePath,NodeRuntime,NodeChildProcessSpawner}.ts` | **read directly** — reference only; **not vendored** |
| [P-GATE] | `scripts/assert-runtime-free.mjs`, `scripts/assert-authoritative-determinism.mjs`, `oxlint.effect.json`, `scripts/verify-package-dependencies.mjs`, `scripts/assert-single-effect.mjs` | **read directly** (policy) |
| [P-ADR] | ADR-0100, ADR-0128, ADR-0152, `RULES.md` | **read directly** (policy) |
| [P-PRIOR] | `docs/research/effect-conformance-02-tagged-errors.md`, `-05-declination.md`, `-06-determinism-advisory-gating.md`, `effect-apps-runtime-02-io-service-inventory.md` | in-repo prior grounding, reused |
| [PRB] | `.scratch/effect-apps-runtime/probe/{runtime,lifecycle,errors}.mjs`, `{effect-vitest,coexist}.test.mjs` | **executed this session** (§7) |

`node -p require('vite-plus/package.json')` and `realpathSync` comparisons were used for
§6.5. `@effect/platform-node` is **not** in `pnpm-lock.yaml`, not in `vendor/`, and not in
`node_modules/@effect/` — verified by `grep`/`ls`; ADR-0100 §5 declares satellite
`@effect/platform-*` packages out of scope.

---

## 3. Findings

### 3.1 Runtime lifecycle (`ManagedRuntime`)

**Names confirmed in v4.0.2** ([V-MRT]): the constructor is
`ManagedRuntime.make(layer, options?)` (`ManagedRuntime.ts:291`), and the returned
`ManagedRuntime<R, ER>` interface (`:117–233`) exposes `runPromise` (`:190`),
`runPromiseExit` (`:201`), `runFork` (`:137`), `runSync` (`:160`), `runSyncExit` (`:150`),
`runCallback` (`:171`), `context()` (`:121`), `dispose(): Promise<void>` (`:213`),
`disposeEffect: Effect<void>` (`:232`), and `[Symbol.asyncDispose]` (`:223`).

Lifecycle facts (read + [PRB] `lifecycle.mjs`):

- **Lazy build, cached context.** The layer is built on first use and its `Context` is
  cached (`cachedContext`, `ManagedRuntime.ts:126`; `contextEffect` `:317–331`). [PRB]
  `runtime.mjs` C: `runtime.cachedContext !== undefined` after the first run.
- **`dispose()` runs the layer scope's finalizers** and is **idempotent**. [PRB]
  `lifecycle.mjs`: a service acquired via `Effect.acquireRelease` inside `Layer.effect`
  logged `acquire` before `dispose` and `release` after; a second `dispose()` resolved
  `ok`.
- **After dispose the runtime is dead.** `disposeEffect` replaces `contextEffect` with
  `Effect.die("ManagedRuntime disposed")` (`ManagedRuntime.ts:355`); [PRB] `runtime.mjs`
  M: the next `runPromise` threw `ManagedRuntime disposed`. A runtime cannot be reused.
- **`options.memoMap`** (`Layer.MemoMap`, `ManagedRuntime.ts:293–297`) lets several
  runtimes share layer memoization; `Layer.makeMemoMapUnsafe()` is the standalone form
  (`Layer.ts:504`).
- `ManagedRuntime.runPromise` accepts an effect **with requirements** (`Effect<A,E,R>`,
  `:389–395`) and supplies the context; its options type is
  `{ signal?: AbortSignal }`. In contrast the free functions `Effect.runPromise`
  (`Effect.ts:18470`) / `runPromiseExit` (`:18547`) require `Effect<A,E>` — **`R = never`**.

**Electron placement** (`apps/desktop/src/main/index.ts`): construct **once** inside
`app.whenReady().then(...)` (`index.ts:271`), before `registerIpc()` (`:285`) and before
`createWindow()` (`:303`); register the `ipcMain.handle` bridge in `registerIpc`
(`:188–228`). Dispose on shutdown. The existing shutdown hook is `before-quit`
(`index.ts:236–257`): it `event.preventDefault()`s, sets `quitting = true`, waits up to
`QUIT_FLUSH_TIMEOUT_MS = 1_500` for the renderer, then calls `app.quit()`. `dispose()` is
asynchronous while `before-quit` is synchronous, so the disposal must be awaited in the
`proceed()` continuation (before the final `app.quit()`), or in a `will-quit` handler with
a re-entry guard. (Exact wiring is a spec decision, not a research claim.)

**No `NodeRuntime` is available.** The vendored `effect` exports only the low-level
`Runtime.makeRunMain` (`Runtime.ts:185`); the ergonomic `NodeRuntime.runMain` lives in
`@effect/platform-node` (`repos/effect/packages/platform/node/src/NodeRuntime.ts:41`),
which is not vendored and is out of scope (ADR-0100 §5). `NodeRuntime`/`NodeFileSystem`
appear in `vendor/effect/src/Runtime.ts:134` and the ai-docs only as **prose references**
to a package we do not have.

### 3.2 Edge bridging

**`ipcMain.handle`.** The handler is already `async` and returns a `Promise`
(`index.ts:189–191`). Bridge with `runtime.runPromise(program)` for a value, or
`runtime.runPromiseExit(program)` when the wire boundary needs a non-throwing result
(the existing wire type is the three-outcome `BridgeResult<T>` in
`apps/desktop/src/shared/bridge-contract.ts`). Map `Exit` → `BridgeResult` with
`Exit.isSuccess`/`isFailure` (`Exit.ts:406`/`:435`) and `Cause.squash` (`Cause.ts:889`).
`ManagedRuntime.runPromise` also accepts `{ signal?: AbortSignal }`
(`ManagedRuntime.ts:389–391`); `Effect.RunOptions` is `{ signal?, scheduler?,
uninterruptible?, onFiberStart? }` (`Effect.ts:18247–18252`).

**CLI `main()`.** `apps/compiler-cli/src/main.ts` is synchronous today: `function main():
void` (`:123`) ending in `process.exit(exitCodes[exitCategory])` (`:242`). Two sanctioned
shapes, both grounded:

1. `Effect.runPromise(program.pipe(Effect.provide(AppLayer)))` and map the result to
   `ExitCategory`; or
2. `Runtime.makeRunMain` (`Runtime.ts:185`) for process exit codes. The default teardown
   is `0` success / `130` interrupt-only / `1` otherwise, reading the `Runtime.errorExitCode`
   marker (`Runtime.ts:111–118`, `:291`, `:318`); [PRB] `lifecycle.mjs` confirmed exit
   codes `0` and `3` for an error carrying `[Runtime.errorExitCode] = 3`.

Caveat grounded in the prior inventory ([P-PRIOR] `-02` §2 item 1): every `run*` in
`commands.ts` is synchronous and the CLI has **no `async` function**; a `runPromise`
facade over sync internals forces a sync→async call-discipline change. The spec must pick
the shape; this note records the grounded options, not the choice.

**Why `runPromise`/`runFork`/`runSync` must not appear inside Effect code.** The free
runners require `R = never` (`Effect.ts:18470`, `:18284`, `:18654`), so calling them from
a program with requirements does not typecheck; and even for `R = never` they start a
**separate fiber tree** outside the current fiber (`Runtime.makeRunMain` itself calls
`Effect.runFork`, `Runtime.ts:212–219`), losing the ambient context, cooperative
interruption, and scoped finalizers. `RULES.md` §"Services, layers, composition" states
the rule: "no `runPromise`/`runFork`/`runSync` from within Effect code — bridge with
`Deferred`, `Queue`, or `FiberSet`." The v4 fork primitives are **not** `Effect.fork`/
`Effect.forkDaemon`: they are `Effect.forkChild` (`Effect.ts:17948`, auto-supervised),
`Effect.forkDetach` (`:18131`), `Effect.forkScoped` (`:18090`), `Effect.forkIn` (`:17992`).
[PRB] `runtime.mjs` K2: `Effect.runSync` on an async effect throws **`AsyncFiberError`**
(the `runSync` doc comment still says "`FiberFailure`", `Effect.ts:18608`; the actual class
is `Cause.AsyncFiberError`, `Cause.ts:1786`).

### 3.3 Services and layers for synchronous `node:fs`

**`Context.Service`.** v4 has no `Context.Tag`/`Context.GenericTag` and no `Effect.Service`
(grep: only `Context.Service`, `Context.Reference`). The class form is
`class X extends Context.Service<X, Shape>()("pkg/…/X") {}` (`Context.ts:129–134`,
`:319–334`), with `.of(self)`, `.context(self)`, `.use(f)`, `.useSync(f)`
(`Context.ts:103–108`, `ServiceProto` `:444–458`). The function form `Context.Service("Key")`
(`:261`) is for value keys; `Context.Reference` (`:497`) is for defaults.

**`Layer`.** `Layer.effect(Service, Effect)` (`Layer.ts:1380–1440`) runs the effect in the
layer's scope and removes `Scope` from the requirements (`:1420–1436`; `effectContext`
provides the scope at `:1515`). **There is no `Layer.scoped` or `Layer.scopedDiscard` in
v4** (grep: only `effect`, `effectDiscard` `:1549`). Use `Effect.acquireRelease`
(`Effect.ts:13366`) inside `Layer.effect` for resources — [PRB] `lifecycle.mjs` confirmed
release-on-dispose. Other constructors: `succeed` `:1036`, `sync` `:1220`, `suspend`
`:1581`, `unwrap` `:1621`, `empty` `:1183`, `mergeAll` `:1691`, `merge` `:1745`,
`provide` `:2053`, `provideMerge` `:2486`, `launch` `:4020`, `build` `:820`.
`RULES.md` §Services: resolve dependencies once at layer build, close over them, keep the
method `Effect<A, E, never>`; [PRB] `runtime.mjs` does exactly this with a `FileStore`
service whose `read` method is `Effect<string, ReadFailed, never>`.

**Core platform services vs raw `node:fs`.** This is the decisive finding for the
"wrap or adopt" question:

- `FileSystem.FileSystem` is declared in core (`FileSystem.ts:474`), but core ships only
  `make` (`:498`), `makeNoop` (`:642`) and `layerNoop` (`:772`) — **no Node layer**. The
  real implementation is `NodeFileSystem.layer` in `@effect/platform-node`
  ([R-PLAT] `NodeFileSystem.ts:23`), which is not vendored.
- `Path.Path` + `Path.layer` (`Path.ts:260`, `:873`) is a **POSIX-only** static impl
  (`posixImpl`, `:482`). The platform-correct Node layers are `NodePath.layer` /
  `layerPosix` / `layerWin32` ([R-PLAT] `NodePath.ts:24,34,44`) — also not vendored.
- `Command`/`ChildProcessSpawner` live in `effect/process` (`ChildProcess.ts`,
  `ChildProcessSpawner.ts:262`); the Node spawner is in `@effect/platform-node`. The
  apps do not use `node:child_process` at all ([P-PRIOR] `-02` §2 item 5).
- **Determinism:** `RULES.md` forbids platform path separators on authoritative paths; the
  app shells are non-authoritative, but `Path.layer` (POSIX) would still be wrong for real
  Windows file access, and raw `node:path` is platform-aware.

**Recommendation (grounded):** wrap raw `node:fs`/`node:path` in a purpose-built
`Context.Service` whose methods return `Effect<A, E, never>`, lifting sync throws with
`Effect.try` (`Effect.ts:2459`/`:2532`) or `Effect.sync` (`:1790`). Do **not** adopt the
core `FileSystem`/`Path`/`Command` interfaces: their concrete Node layers are un-vendored,
and adding `@effect/platform-node` (a registry dependency) conflicts with the vendored
single-copy policy (`pnpm-workspace.yaml` overrides `effect`/`@effect/vitest` to
`workspace:*`) and ADR-0100 §5. Reimplementing the platform interfaces over `node:fs`
would add more surface than a purpose-built service.

### 3.4 Error channels

- **`Data.TaggedError`** is a factory returning a class (`Data.ts:1124–1128`; impl
  `repos/effect/packages/effect/src/internal/core.ts:689–699`). TS shape:
  `class X extends Data.TaggedError("X")<{…}> {}`. **`Schema.TaggedError`** is
  `Schema.TaggedError<Self>()("Tag", fields)` (`Schema.ts:15968–16035`), schema-backed
  with `fields` and encode/decode. Both are `Cause.YieldableError` → yieldable in
  `Effect.gen`, carry a `readonly _tag`, and are `instanceof Error` ([PRB] `errors.mjs`
  J, `runtime.mjs` J).
- **Policy (`RULES.md` §Errors, ADR-0152, [P-PRIOR] `-02` §3.3):** in-process domain
  errors → `Data.TaggedError`; serializable/wire errors → `Schema.TaggedError`;
  renderer-reachable packages → a plain class with `readonly _tag`. The app shells are
  **not** renderer-reachable, so `Data.TaggedError` is the default. The IPC `BridgeResult`
  is a plain data envelope, so an error should be **projected** to plain data at the
  boundary, not thrown across it. `_tag` serialization hazard ([P-PRIOR] `-02` §3.2):
  `JSON.stringify` **adds** `_tag`, `structuredClone` **drops** it — do not rely on
  structured-cloning an error instance across IPC.
- **Recovery:** `Effect.catchTag(tagOrTags, handler, orElse?)` (`Effect.ts:4639`; the array
  form is supported — [PRB] `runtime.mjs` H), `Effect.catchTags({ Tag: handler })`
  (`:4835`, [PRB] I), `Effect.catchReason`/`catchReasons` for a nested `reason`
  (`:5045`, `:5243`). `catchTag` matches on the `_tag` property, not the prototype.
- **At the edge:** `Exit.isSuccess`/`isFailure` (`Exit.ts:406`/`:435`), `Exit.match`
  (`:776`, [PRB] `errors.mjs` 7), `Cause.squash` (`Cause.ts:889`), `Cause.pretty`/`prettyErrors`
  (`:1281`/`:1233`), `Cause.hasInterruptsOnly` (`:648`). `runPromise` rejects with the
  **raw tagged error instance**, not a wrapper ([PRB] `errors.mjs` 1: identity-true).
  `Effect.die(x)` puts `x` in the defect channel; `Cause.squash` returns it
  ([PRB] 5). `Effect.orDie` exists (`Effect.ts:6731`) but `RULES.md` §Errors declines it:
  select the branch and `Effect.die(error)` only where recovery is intentional.

### 3.5 Testing — `@effect/vitest` vs `vite-plus/test`

- `@effect/vitest@4.0.2` is vendored (`vendor/effect-vitest`); peer deps are
  `vitest >=5.0.0 <6.0.0` and `effect ^4.0.2` (`vendor/effect-vitest/package.json`). It
  `export * from "vitest"` and adds `it.effect`, `it.live`, `it.layer`, `it.prop`,
  `it.flakyTest` (`vendor/effect-vitest/src/index.ts`).
- The repo's runner is `vite-plus@1.1.0`, which bundles `vitest@5.0.3`
  (`node_modules/vite-plus/package.json`), and `vite-plus/test` is literally
  `export * from 'vitest'` (`vite-plus/dist/test/index.js`). `@effect/vitest` resolves
  `vitest` from `vendor/effect-vitest/node_modules/vitest`, which symlinks to the **same**
  `.pnpm/vitest@5.0.3_…` store path as vite-plus's copy — verified equal via
  `fs.realpathSync`. So there is **one** vitest instance, and the peer range is satisfied.
- [PRB] `effect-vitest.test.mjs` and `coexist.test.mjs` ran under `vitest run` (reported
  `v5.0.3`): `it.effect` (scoped, with a provided layer), `it.live`, and coexistence with
  `describe`/`expect` imported from `vite-plus/test` all passed.
- `it.effect` wraps the program in `Effect.scoped` and provides
  `TestEnv = Layer.mergeAll(TestConsole.layer, TestClock.layer())`
  (`vendor/effect-vitest/src/internal/internal.ts:57–59`, `:386`); `it.live` uses the live
  environment; `it.layer` uses `Layer.provideMerge(layer_, TestEnv)` (`:267`).

**Reconciliation.** Adopting `@effect/vitest` for runtime-program tests does not replace
`vite-plus/test` — it is the same runner plus Effect helpers, so `RULES.md` "tests run on
`vite-plus/test`" stays true. Three concrete consequences the spec must own: (a) ADR-0100
§1's "`@effect/vitest` is vendored but **unused**" must be amended; (b) an app package must
declare `@effect/vitest: "workspace:*"` (it is not a declared dependency anywhere today;
`scripts/verify-package-dependencies.mjs` requires exactly `workspace:*` for it); (c)
`scripts/assert-runtime-free.mjs` bans `@effect/*` imports in guarded roots, and its
`isGuarded` matches the **whole root prefix**, so `apps/desktop/src/main/*.test.ts` is
guarded today — that becomes moot once the ADR-0128 reversal removes
`apps/desktop/src/main` from `RUNTIME_FREE_ROOTS` (the map says the gate moves with the
ADR). The alternative (keep `vite-plus/test` only and call
`Effect.runPromise(program.pipe(Effect.provide(testLayer)))` at the test edge) keeps
ADR-0100 §1 literally true but loses `TestClock`/`TestConsole` and the scoped-test helpers.

### 3.6 Determinism

Non-deterministic runtime facilities, grounded:

- **`Clock`** — the live default `ClockImpl.currentTimeMillisUnsafe()` is `Date.now()`
  (`internal/effect.ts:6301–6302`); `Clock.currentTimeMillis` (`Clock.ts:270`) reads it.
- **`Random`** — the default `Random` uses `Math.random()`
  (`internal/random.ts:8,12`); `Random.next` (`Random.ts:97`), `nextInt` (`:141`).
  (`Random.nextDouble` does **not** exist in v4 — it is `Random.next`.)
- **Fiber scheduling** — concurrent interleaving is not fixed; `Effect.sleep` (`Effect.ts:9027`)
  is clock-driven; `Schedule` likewise.
- **Logging** — the default logger stamps wall-clock time (observed `[HH:MM:SS.mmm]` in
  [PRB]; `defaultLogger`/`defaultDateFormat` at `internal/effect.ts:6883`/`:6709`).

Enforcement model ([P-PRIOR] `-06` §2; [P-GATE]): the hard gate
`assert-authoritative-determinism.mjs` scopes `DETERMINISM_ROOTS` to the `packages/**`
entries of `RUNTIME_FREE_ROOTS` only; `apps/desktop/src/main` and the IO packages are
excluded by construction (`:12–16`, `:46–48`, test-locked). The `@effect/tsgo` advisories
(`globalRandom`, `globalDate`, `cryptoRandomUUID`, `processEnv`, `nodeBuiltinImport`, and
their `-in-effect` variants) are **warn** (`oxlint.effect.json`). App-shell safety is
therefore **behavioural** (golden hashes + cross-process determinism), not source-gated.

**How to keep app-shell orchestration non-authoritative:** keep the engine packages
runtime-free (ADR-0128 §Revisit #2); run engine calls as pure sync functions inside
`Effect.sync`/`Effect.gen` and hash only their outputs; never let `Effect.log` timestamps,
`Date.now`, `Random`, or fiber ordering reach a canonical serializer; in tests use
`it.effect` (TestClock) so no wall clock is read.

---

## 4. Idioms we will adopt

1. **One long-lived `ManagedRuntime` per app surface.**
   `ManagedRuntime.make(AppLayer, { memoMap })`, built once in `app.whenReady()` (main) /
   once at CLI entry; disposed exactly once (`runtime.dispose()`), awaited before the final
   `app.quit()` (main) or before `process.exit` (CLI). Never reuse after disposal.
2. **Bridge at the true edge only.** `ipcMain.handle` → `runtime.runPromise` /
   `runPromiseExit` → project to `BridgeResult`. CLI `main()` → `Effect.runPromise` over a
   provided program or `Runtime.makeRunMain` for exit codes. No `runPromise`/`runFork`/
   `runSync` inside any `Effect` program; bridge with `Deferred`/`Queue`/`FiberSet` and the
   v4 fork primitives (`Effect.forkChild`/`forkScoped`/`forkDetach`).
3. **`Context.Service` + `Layer` for every `node:` dependency**, dependency resolved at
   layer build and closed over, method `Effect<A, E, never>`. Use `Layer.effect` +
   `Effect.acquireRelease` for resources (there is no `Layer.scoped`). Wrap raw
   `node:fs`/`node:path`; do **not** adopt the core platform `FileSystem`/`Path`/`Command`
   services (their Node layers are un-vendored and out of scope).
4. **`Data.TaggedError` for in-process failures, discriminated by `_tag`** with
   `Effect.catchTag`/`catchTags`; `Schema.TaggedError` only for a genuinely serializable
   error; project errors to plain data at the IPC wire boundary. Handle `Exit`/`Cause` at
   the edge; no `Effect.orDie`; `Effect.die` only where recovery is intentional.
5. **`@effect/vitest` for runtime-program tests** (`it.effect`/`it.live`/`it.layer`), on the
   same `vitest@5.0.3` instance that `vite-plus/test` re-exports; engine tests stay on
   `vite-plus/test`. Declare `@effect/vitest: workspace:*`; amend ADR-0100 §1's "unused".
6. **Determinism by construction.** Engine packages stay runtime-free; the shell's
   `Clock`/`Random`/fiber/log surface never enters a hashed path; tests that run Effect
   programs use `it.effect` (TestClock).

---

## 5. Recommendations for the implementator

These are **grounded API facts / structural recommendations**, not authored constants:

- Use the exact v4 names: `ManagedRuntime.make`, `runtime.runPromise`/`runPromiseExit`/
  `dispose`/`disposeEffect`, `Context.Service`, `Layer.effect`, `Effect.forkChild`,
  `Random.next`, `Cause.AsyncFiberError`. The names a reader is likely to import from
  memory and that **do not exist** in `effect@4.0.2` are listed in §6.
- Prefer `runtime.runPromiseExit` + `Exit`/`Cause` mapping at the `BridgeResult` boundary
  so the wire envelope never throws.
- Put the disposal await in the existing bounded-shutdown continuation
  (`index.ts:245–255`), not directly in the synchronous `before-quit` body.
- Wrap `node:fs`/`node:path` in a bespoke service; keep `@effect/platform-node` out of the
  dependency graph.

**For the spec / decision-requests (not resolved here):**

- Which `BridgeResult` mapping function to add and whether handlers become
  `Effect<A, E, R>` programs (map "Command-dispatch shape").
- The CLI adoption shape (sync→async facade vs `Runtime.makeRunMain`), given the
  all-synchronous internals ([P-PRIOR] `-02` §2 item 1).
- Whether to adopt `@effect/vitest` (and amend ADR-0100 §1) or keep `vite-plus/test` only.
- The superseding ADR (next free number ADR-0159) and the matching
  `RUNTIME_FREE_ROOTS`/doc edits — map-owned.

No BALANCE TARGET values appear in this note; no content constant is proposed.

---

## 6. API names that differ from a reader's likely expectation

| likely (v3 / memory) | actual in `effect@4.0.2` | source |
| --- | --- | --- |
| `Context.Tag` / `Context.GenericTag` | **`Context.Service`** (and `Context.Reference`) | `Context.ts:103,209,497` |
| `Effect.Service` | **`Context.Service`** class form | `Context.ts:129,319` |
| `Layer.scoped` / `Layer.scopedDiscard` | **`Layer.effect`** (scoped) / `Layer.effectDiscard` | `Layer.ts:1380,1549` |
| `Effect.fork` | **`Effect.forkChild`** (auto-supervised) | `Effect.ts:17948` |
| `Effect.forkDaemon` | **`Effect.forkDetach`** | `Effect.ts:18131` |
| `Random.nextDouble` | **`Random.next`** | `Random.ts:97` |
| `FiberFailure` (thrown by `runSync`) | **`Cause.AsyncFiberError`** (the `runSync` doc still says `FiberFailure`) | `Cause.ts:1786`; `Effect.ts:18608` |
| `NodeRuntime.runMain` / `NodeFileSystem` from `effect` | only `Runtime.makeRunMain` in core; the Node layers are in un-vendored `@effect/platform-node` | `Runtime.ts:185`; [R-PLAT] |

Also confirmed **absent** from v4: `Effect.orDie` is present but declined by `RULES.md`;
`Layer.scoped*` absent; `Context.Tag`/`GenericTag` absent; `@effect/vitest` is not a
declared dependency anywhere.

---

## 7. Probes run (throwaway, under `.scratch/effect-apps-runtime/probe/`)

Symlinks created in `probe/node_modules/` (absolute, to `vendor/effect`,
`vendor/effect-vitest`, and the resolved `vite-plus`), then:

```
node runtime.mjs     # service+layer over node:fs; runPromise/runPromiseExit; catchTag
                     # (pipe/array/data-first), catchTags; Schema vs Data TaggedError;
                     # runSync async -> AsyncFiberError; Clock/Random default; dispose
node lifecycle.mjs   # Layer.effect + acquireRelease -> release on dispose; dispose
                     # idempotent; Runtime.makeRunMain exit codes 0 / 3 (errorExitCode)
node errors.mjs      # runPromise rejects with the raw error instance; Exit/Cause squash
                     # identity; prettyErrors; die; Exit.match; Schema.TaggedError.fields
node_modules/.bin/vitest run --root .   # effect-vitest.test.mjs (it.effect/it.live) and
                                        # coexist.test.mjs (with vite-plus/test) -> 6 passed, v5.0.3
```

Key observed results: `ManagedRuntime` cached context after first run; `dispose` ran the
acquire-release finalizer and was idempotent; post-dispose `runPromise` threw
`ManagedRuntime disposed`; `catchTag` array + pipe + data-first forms all recovered;
`runPromise` rejected with the same tagged-error instance; `runSync` on an async effect
threw `AsyncFiberError`; `Runtime.makeRunMain` produced exit codes `0` and `3`;
`@effect/vitest` and `vite-plus/test` coexisted on one `vitest@5.0.3` instance.

---

## 8. Deferred / not resolved here

- **The superseding ADR (ADR-0159)** and the `RUNTIME_FREE_ROOTS`/`docs/agents/runtime-free-gate.md`/
  `RULES.md` edits — map-owned, not a research artifact.
- **Service/layer decomposition and command-dispatch shape** — map "Not yet specified";
  grounded inputs are [P-PRIOR] `-02` (seam inventory + existing DI seams) and this note's
  §3.3/§3.4.
- **CLI sync→async decision** — map "compiler-cli adoption shape"; the behaviour-change
  risk is recorded, not decided.
- **`@effect/vitest` adoption** — map "Test/tooling strategy"; §3.5 gives the grounded
  compatibility facts and the three edits it entails.
- **No `docs/OPEN-ISSUES.md` item is in scope**, so none is resolved or surfaced.
