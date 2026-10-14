# 01: Effect v4 runtime idioms for an Electron main process and a sync CLI

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

What are the *correct, vendored-verified* Effect v4 (`effect@4.0.2`) idioms for
hosting the full runtime in two app surfaces?

Answer, against `vendor/effect` source + tests (not prior Effect knowledge), at
least:

1. **Runtime lifecycle** — how to build one long-lived `ManagedRuntime` and when
   to `dispose()` it, in an Electron `app.whenReady()` / `before-quit` main
   process. Confirm the v4 API names (`ManagedRuntime.make`, `.runPromise`,
   `.dispose`) from `vendor/effect`.
2. **Edge bridging** — the sanctioned way to call `runPromise` at the
   `ipcMain.handle` callback edge and at a CLI `main()`, and why
   `runPromise`/`runFork`/`runSync` must not appear *inside* Effect code
   (RULES.md §Services).
3. **Services & layers** — `Context.Service` + `Layer` construction for
   synchronous `node:fs` dependencies; how `FileSystem`/`Path`/`Command` from
   Effect platform compare to raw `node:fs`, and whether to wrap node modules or
   adopt the platform services (reconcile with the vendored, runtime-free policy).
4. **Error channels** — `Data.TaggedError` vs `Schema.TaggedError` in a runtime
   program, `Effect.catchTag`/`catchTags`, and `Cause`/`Exit` at the edge.
5. **Testing** — whether `@effect/vitest` (vendored, currently unused) is the
   intended harness for runtime programs, and how it coexists with RULES.md's
   "tests run on `vite-plus/test`".
6. **Determinism** — which runtime facilities are forbidden on authoritative
   paths (Clock, Random, fiber scheduling) and how to keep app-shell
   orchestration non-authoritative.

Deliverable: a durable note under `docs/research/`, source-cited to
`vendor/effect` / `repos/effect`, with a short "idioms we will adopt" list. No
application code.

## Answer

Resolved 2026-10-14 (research subagent). Note:
`docs/research/effect-apps-runtime-01-runtime-idioms.md` (415 lines); throwaway
probes under `.scratch/effect-apps-runtime/probe/` (runtime/lifecycle/errors +
an `@effect/vitest` coexistence run — 6 passed on `vitest@5.0.3`).

1. **Lifecycle.** `ManagedRuntime.make(layer, { memoMap? })` builds lazily and
   caches the context; `dispose(): Promise<void>` runs the layer scope's
   finalizers (idempotent; post-dispose runs die). Build once in `whenReady()`
   before `registerIpc()`; await disposal in the existing bounded-shutdown
   continuation (`index.ts:236-257`). `ManagedRuntime.runPromise` accepts
   `Effect<A,E,R>`; the free `Effect.runPromise` needs `R = never`.
2. **Edge bridging.** `ipcMain.handle` → `runtime.runPromise` / `runPromiseExit`
   (map `Exit`→`BridgeResult`); CLI `main()` → `Effect.runPromise` over a
   provided program or `Runtime.makeRunMain` (exit codes 0/130/1). `run*` inside
   Effect code is forbidden (starts a separate fiber tree, loses
   context/interruption/finalizers).
3. **Services & layers.** `Context.Service` class form (`.of`/`.use`),
   `Layer.effect` + `Effect.acquireRelease` — **v4 has no `Layer.scoped`**.
   Core `FileSystem` ships only `makeNoop`/`layerNoop`; `NodeFileSystem`/`Path`/
   `NodeRuntime` live in un-vendored `@effect/platform-node` (out of scope per
   ADR-0100 §5). **Wrap raw `node:fs`/`node:path` in a bespoke service; do not
   adopt platform services.**
4. **Errors.** `Data.TaggedError` in-process, `Schema.TaggedError` for wire
   (ADR-0152); recover with `Effect.catchTag`/`catchTags`/`catchReason`; at the
   edge use `Exit.isSuccess/isFailure/match`, `Cause.squash/pretty`. `runPromise`
   rejects with the raw tagged-error instance. No `Effect.orDie`.
5. **Testing.** `@effect/vitest@4.0.2` works on the **same** `vitest@5.0.3` that
   `vite-plus/test` re-exports (verified); adopting it needs an ADR-0100 §1
   amendment ("unused" → used) and a `@effect/vitest: workspace:*` declaration.
   Carried to ticket 07.
6. **Determinism.** Forbidden on hashed paths: `Clock` (live = `Date.now()`),
   `Random` (default = `Math.random()`), fiber scheduling, `Effect.log`
   timestamps. The hard determinism gate covers only `packages/**`; app shells
   are behavioural-gated. Keep the engine runtime-free.

**API names that differ from training data (pin these):** `Context.Service`
(not `Context.Tag`/`Effect.Service`); `Layer.effect` (not `Layer.scoped`);
`Effect.forkChild`/`Effect.forkDetach`; `Random.next`; `runSync` throws
`Cause.AsyncFiberError` (not `FiberFailure`).

Carried to ticket 03: superseding ADR + `RUNTIME_FREE_ROOTS`/doc edits. Carried
to tickets 06/07: CLI sync→async shape, `BridgeResult` mapping, `@effect/vitest`
adoption.
