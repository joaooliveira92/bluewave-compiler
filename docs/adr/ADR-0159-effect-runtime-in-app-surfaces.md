# ADR-0159: The app surfaces adopt the full Effect runtime — desktop main and compiler-cli

## Status

Accepted (2026-10-14). Executes [RULES.md](../../RULES.md) "Effect source of
truth" and "Services, layers, composition"; amends ADR-0100 §2's runtime-usage
boundary to name the app surfaces explicitly.

Supersedes: ADR-0128 (for the app surfaces only — the runtime-free package policy
and the renderer constraint are retained and restated below).

## Context

ADR-0128 declined to introduce the Effect runtime anywhere: cross-package facades
stay plain-TS, no `ManagedRuntime` was added to `apps/desktop/src/main`, and
`apps/compiler-cli` kept a plain synchronous entrypoint. Its §Revisit clause kept
the decision revisable and named the trigger — "a non-renderer-reachable async IO
seam that has a composable service graph" — and a hard constraint: a reversal
"must update that gate's `RUNTIME_FREE_ROOTS` in the same change".

Since then the two app surfaces have grown a real orchestration graph. An
inventory (`.scratch/effect-apps-runtime/issues/02-research-app-io-service-inventory.md`)
found that `apps/desktop/src/main` (~9.7k LOC across 72 files) coordinates many
distinct IO seams — the compiled content artifact, the project/`SaveStore`,
campaign sessions, the pending-command queue, monthly reports, UI-state and
drawing-board drafts, crash bundles, native dialogs — and several already carry
hand-rolled dependency-injection seams (`CompileCampaignDeps`,
`ContinuityDeps`, `SessionCommandDeps`, `CommandRegistry`, `CrashContext`). These
are exactly the composable services ADR-0128 §Revisit #1 anticipated, and the
current hand-wired construction is not a coherent composition.

The renderer constraint is unchanged and remains absolute: the renderer
value-imports `ship-design`/`campaign`/`campaign-engine`, so any Effect-typed
surface it can reach bundles the runtime (`MIG-EXCL-1`, ADR-0125, ADR-0128
§Context). Nothing in this decision touches the renderer or preload.

The vendored runtime (`effect@4.0.2`) and its idioms are established
(`docs/research/effect-apps-runtime-01-runtime-idioms.md`): `ManagedRuntime.make`/
`runPromise`/`dispose`, `Context.Service` + `Layer`, `Data`/`Schema.TaggedError`
with `Effect.catchTag`; v4 has no `Layer.scoped`, and the Node platform layers
(`@effect/platform-node`) are **not** vendored, so raw `node:fs`/`node:path` are
wrapped in bespoke services rather than adopted from the platform.

## Decision

1. **The full Effect runtime is adopted in the two non-renderer app surfaces**,
   and only those: `apps/desktop/src/main` and `apps/compiler-cli`. Each builds
   one long-lived `ManagedRuntime` at its entrypoint (`app.whenReady()` and the
   CLI `main()` respectively), resolved once and disposed at shutdown; per-call
   input stays a function argument (RULES.md "Services").
2. **The renderer and preload stay Effect-free.** No `effect` value or type may
   enter `apps/desktop/src/{renderer,preload}`, or any package the renderer
   value-imports. This is guarded by `scripts/check-renderer-bundle.mjs` and the
   renderer content-boundary test, which stay green.
3. **The engine packages stay runtime-free, and cross-package facades stay
   plain-TS** (ADR-0128 §1 retained). Only app-internal code becomes Effect
   programs; no package exports an Effect-typed signature. ADR-0100 §2's
   runtime-free row is unchanged.
4. **The runtime-free gate narrows in the same change.** `apps/desktop/src/main`
   is removed from `RUNTIME_FREE_ROOTS` in `scripts/assert-runtime-free.mjs`;
   `apps/compiler-cli` was never guarded. The packages stay guarded.
   `scripts/verify-check-parity.mjs`, `RULES.md` §Effect, and
   `docs/agents/runtime-free-gate.md` are updated together.
5. **IO is modelled with bespoke services over raw `node:*`** — `Context.Service`
   + `Layer`, wrapped with `Layer.effect`/`Effect.acquireRelease` (v4 has no
   `Layer.scoped`). The un-vendored `@effect/platform-node` layers are **not**
   adopted. The existing `*Deps`/`CommandRegistry`/`CrashContext` seams are the
   natural service boundaries.
6. **Runtime errors use the Effect error channel**: `Data.TaggedError` in-process
   and `Schema.TaggedError` on the wire, discriminated with `_tag` /
   `Effect.catchTag` (ADR-0152). The `campaign:execute` `BridgeResult` wire
   contract is preserved and mapped from `Exit` at the `ipcMain.handle` edge; the
   IPC payloads remain structured-clone values with no Effect types.
7. **No authoritative behaviour changes.** The app shells are non-authoritative
   orchestration; `Clock`, `Random`, fiber scheduling, and log timestamps must
   never reach a hashed path. Goldens and cross-process hashes stay
   byte-identical. The hard determinism gate remains scoped to `packages/**`
   (ADR-0150); the app shells stay behaviourally gated.
8. **Testing may adopt `@effect/vitest`** for runtime programs (it shares the
   installed `vitest`; amends ADR-0100 §1's "vendored and unused"). The
   reconciliation with RULES.md's "tests run on `vite-plus/test`" is a recorded
   sub-decision of the implementation spec.

## Consequences

- `apps/desktop/src/main` and `apps/compiler-cli` gain a single composed service
  graph, structured error channels, and interruption/finalization at their IO
  edges, replacing hand-wired dependency construction.
- The monorepo deliberately carries two idioms at the boundary — runtime-free
  engine packages and runtime app shells — as ADR-0128 §Consequences already
  accepted; this ADR moves the line from "no runtime anywhere" to "runtime only
  at the two app entrypoints".
- `assert-runtime-free` no longer covers desktop main, so the renderer bundle
  tripwire and the boundary test become the sole guards of `MIG-EXCL-1`; they
  must stay green.
- Cross-process determinism is unaffected: the engine and its hashes are
  untouched, and the app shells were never on a hashed path.

## Revisit triggers

- An Effect-typed surface is ever needed by a renderer-reachable package — that
  must be resolved by moving the seam out of the renderer's import graph, never
  by exposing the runtime to the renderer (`MIG-EXCL-1`, ADR-0125).
- A runtime-free package gains genuine async IO/orchestration — it moves to the
  IO row of ADR-0100 §2 rather than being wrapped in place.

## Alternatives considered

- **Keep ADR-0128 as-is.** Rejected: the app surfaces now have the composable IO
  service graph §Revisit #1 named, and hand-wired construction is the cost.
- **Flip cross-package facades to Effect-typed signatures too.** Rejected: pulls
  `effect` into the renderer (`MIG-EXCL-1`) and blind-wraps pure functions
  (ADR-0100 §2).
- **Adopt `@effect/platform-node` for `FileSystem`/`Path`.** Rejected: not
  vendored (ADR-0100 §5); wrapping raw `node:*` in bespoke services keeps the
  single-copy and vendor policy intact.
- **Convert the compiler-cli `node:fs` pipeline to async.** Rejected as a
  behaviour change with no present need; the CLI adopts the runtime for its
  entrypoint/orchestration, not to make its synchronous reads asynchronous
  (carried as a sub-decision of the implementation spec).
