# Spec: Effect runtime adoption in the app surfaces (`effect-apps-runtime`)

One-line purpose: flip `apps/desktop/src/main` and `apps/compiler-cli` onto the
**full Effect v4 runtime** — one `ManagedRuntime`, composed `Context.Service`
layers, and typed error channels — with the renderer/preload still Effect-free
and every golden/hash byte-identical.

**Triage:** `ready-for-agent` — fully specified; the sliced implementation
tickets carry `Status: open`, `Frontier: yes`, and a resolved/empty
`Blocked by:` chain.
**Status:** spec — to be sliced by `to-tickets`.
**Source of truth:** this spec, together with ADR-0159, ADR-0100, and `RULES.md`.
**Grounds:** ADR-0159 (supersedes ADR-0128 for the app surfaces), ADR-0100 §2,
ADR-0100 §5 (no un-vendored platform packages), ADR-0152 (errors by
reachability), ADR-0106 (ratchet gates), ADR-0125/`MIG-EXCL-1` (renderer stays
Effect-free), ADR-0150 (determinism gate scope). Research:
`docs/research/effect-apps-runtime-01-runtime-idioms.md`,
`docs/research/effect-apps-runtime-02-io-service-inventory.md`.

**Requirement IDs:** `ERA-R<n>` (adoption requirements).

---

## Problem Statement

The desktop main process and the compiler CLI are the app's orchestration
surfaces. Today they wire dependencies by hand: each command flow constructs a
`SaveStore`, reads a directory, or opens a native dialog inline, and a handful of
ad-hoc dependency-injection objects (`CompileCampaignDeps`, `ContinuityDeps`,
`SessionCommandDeps`, `CrashContext`, `CommandRegistry`) exist only to make those
flows testable. There is no single composed service graph, no structured error
channel (failures are returned as per-handler result objects), and no
interruption/finalization story at the IO edges.

ADR-0128 declined the Effect runtime entirely — no `ManagedRuntime`, plain
facades, plain entrypoints — on the grounds that no composable async service
graph existed. That premise no longer holds: an inventory
(ticket 02) found ~9.7k LOC of main-process code coordinating many distinct IO
seams and several already-hand-rolled DI seams, and ADR-0128 §Revisit #1 named
exactly this condition as the trigger to reopen. The engine packages remain pure
and deterministic; only the app shells are involved.

The risk of leaving this as-is is drift: hand-wired construction, ad-hoc error
handling, and no enforced boundary make the app shells the least-governed part of
an otherwise rigorous codebase.

## Solution

Adopt the full Effect v4 runtime **only** in the two non-renderer app surfaces
(ADR-0159):

- Build one long-lived `ManagedRuntime` at each app entrypoint (`app.whenReady()`
  in main; `main()` in the CLI), resolved once and disposed at shutdown.
- Model the IO seams as `Context.Service` values composed by a `Layer` graph,
  wrapping raw `node:fs`/`node:path` (never the un-vendored `@effect/platform-node`).
- Replace the ad-hoc `*Deps` objects with the service graph.
- Give command handlers an Effect error channel (`Data.TaggedError` union),
  mapped at the IPC edge to the existing `BridgeResult` wire contract
  byte-for-byte.
- Keep the renderer/preload Effect-free and the engine packages runtime-free.

The change is behaviour-preserving: no gameplay, balance, or authoritative hash
changes; goldens stay byte-identical.

## User Stories

1. As a maintainer, I want the main process to compose its dependencies once in a
   `Layer`, so that construction is explicit, ordered, and testable rather than
   hand-wired per command.
   (ERA-R1)
2. As a maintainer, I want one `ManagedRuntime` per app process, disposed at
   shutdown, so that resources and fibers are closed deterministically.
   (ERA-R2)
3. As a maintainer, I want each IO seam (content artifact, project/save store,
   campaign sessions, command queue, reports, UI-state/drafts, crash bundles,
   native dialogs) modelled as a `Context.Service`, so that the storage mechanism
   can be swapped without touching command logic. (ERA-R3)
4. As an autonomous agent, I want command handlers written as `Effect` programs,
   so that failures flow through a typed error channel instead of scattered result
   objects. (ERA-R4)
5. As a maintainer, I want the IPC wire contract (`BridgeResult`) preserved
   byte-for-byte, so that the renderer and the frozen IPC schemas are unaffected.
   (ERA-R5)
6. As a maintainer, I want every app-surface failure to carry a stable `_tag` and
   `{ reason, diagnostics }`, so that the dispatcher maps `Exit` to the wire
   response with one total function. (ERA-R6)
7. As a player, I want no gameplay, balance, or save-compatibility behaviour to
   change, so that this governance/architecture work is invisible in outcomes.
   (ERA-R7)
8. As a player, I want identical commands and seeds to keep producing identical
   authoritative hashes, so that replay and save/load stay trustworthy. (ERA-R8)
9. As a maintainer, I want the renderer and preload to keep bundling no `effect`,
   so that `MIG-EXCL-1` stays executed. (ERA-R9)
10. As a maintainer, I want the engine packages (combat, campaign, commands,
    phase-engine, …) to stay runtime-free with plain facades, so that the
    embedded deterministic core is unaffected. (ERA-R10)
11. As an autonomous agent, I want the runtime-free gate updated in the same
    change that introduces the runtime, so that local and CI enforcement cannot
    drift. (ERA-R11)
12. As a maintainer, I want the compiler CLI to adopt the runtime at its
    entrypoint without converting its synchronous reads to async, so that its
    behaviour and exit codes are unchanged. (ERA-R12)
13. As a maintainer, I want the CLI's six-code exit contract
    (`0/1/2/3/4/5`) preserved, so that scripts depending on it do not break.
    (ERA-R13)
14. As an autonomous agent, I want a test harness that runs Effect programs with
    a controlled clock (`@effect/vitest`), so that runtime tests are deterministic
    and readable. (ERA-R14)
15. As a maintainer, I want the app's IO boundaries covered by test Layers
    (in-memory stores, fake dialogs), so that the service graph is exercised
    without real filesystem or Electron. (ERA-R15)
16. As a maintainer, I want the existing `*Deps` seams migrated behind adapters
    and then deleted, so that there is one dependency mechanism, not two.
    (ERA-R16)
17. As a reviewer, I want the migration delivered as behaviour-preserving vertical
    slices, so that each slice can be validated independently with green goldens.
    (ERA-R17)
18. As a maintainer, I want a byte-identical `BridgeResult` invariant test, so
    that the IPC contract can never silently change.
    (ERA-R18)
19. As an autonomous agent, I want the entrypoint (`whenReady`, window creation,
    shutdown, `ipcMain.handle`) to stay at the true edge, so that the runtime is
    only introduced where an effect is run, never inside a pure derivation.
    (ERA-R19)
20. As a maintainer, I want the documentation of record (ADR-0159, RULES.md,
    runtime-free-gate) consistent with the code, so that the policy is auditable.
    (ERA-R20)

## Implementation Decisions

### D1 — Runtime placement and lifecycle

One `ManagedRuntime` per app process. In `apps/desktop/src/main` it is built in
`app.whenReady()` before `registerIpc()` and disposed in the existing
bounded-shutdown continuation. In `apps/compiler-cli` it is built in `main()`.
The managed runtime is the only place `runPromise`/`runPromiseExit` is called
(the `ipcMain.handle` callbacks and the CLI dispatch); `run*` never appears
inside Effect code (RULES.md §Services).

### D2 — Service set and layer graph (desktop main)

Services, `Context.Service` form with methods `Effect<A, E, never>` (deps resolved
in the Layer, closed over; per-call input as arguments):

- Boundary/authoritative: `ContentArtifactStore` (artifact load+verify and every
  content projection), `ProjectStore` (`SaveStore` operations + `session.json`
  sidecar + month-input; owns `ConstructionSnapshotStore`), `CampaignSessionStore`
  (in-memory session/construction-workspace/pending-command registries),
  `CommandQueueStore`, `ReplayService`.
- App-shell/IO: `CommandDispatcher`, `UiStateStore`, `ReportsStore`, `DraftStore`,
  `CrashReporter`, `NativeDialog`, `AppPaths`, `Clock`, `BattleSandboxStore`.

`desktopMainLayer` composes them with `Layer.effect` + `Effect.acquireRelease`
(v4 has no `Layer.scoped`). Raw `node:*` is wrapped in the service; the
un-vendored `@effect/platform-node` is not adopted (ADR-0100 §5).

The Electron-lifecycle seams (`app.whenReady`, `app.requestSingleInstanceLock`,
`createWindow`, `installBoundedShutdown`, signal handlers, `ipcMain.handle`
registration) stay outside the graph at the true edge.

### D3 — Command dispatch and error channel

Each `CommandRegistry` entry becomes `Effect<A, CommandError, CommandEnv>`. The
payload adapters (`withSchema`/`withStrictSchema`/`payloadless`) decode with
`Schema.decodeUnknownResult` inside the Effect and fail with an
`InvalidCommandPayload` tagged error. `CommandError` is a `Data.TaggedError`
union (`UnknownCommand`, `NotImplemented`, `InvalidCommandPayload`,
`SessionNotFound`, `CompileFailed`, `SaveFailed`, `LoadFailed`, `ReplayFailed`,
`RecoveryFailed`, `SessionMetadataMissing`, and the business-rejected outcomes
`SaveLocationCancelled`/`PackageSelectionCancelled`/`InvalidCampaignConfiguration`/
`UnknownPlayerSlot`/`PlayerSlotNotSupported`/`CopyTarget*`), each with
`{ reason, diagnostics }`.

The dispatcher runs via `runtime.runPromiseExit` and a single total mapping
`Exit → BridgeResult`: success → `success`; failure → the tag's
`reason`/`diagnostics`; interruption → `error`/`INTERRUPTED`. The wire payload is
unchanged and structured-clone-safe. No shared transformer/guard probes the
channel; recovery uses `Effect.catchTag` at the handler.

### D4 — compiler-cli

Entrypoint facade only: `main.ts` builds one runtime and runs a single dispatch
program; the `run*` internals stay synchronous (called directly inside
`Effect.gen`, never wrapped in `Effect.sync`). The six-code `ExitCategory`
contract (`success:0`…`usage-error:5`) is preserved via an explicit mapping; the
`Runtime.makeRunMain` defaults are not adopted. Services (`CliFileSystem`,
`ContentCompilerService`, `CampaignCompilerService`, `CampaignPersistence`,
`CombatService`) are extracted per slice; `parseOptions` and the output modes
stay at the edge.

### D5 — Testing and tooling

Adopt `@effect/vitest@4.0.2` (vendored, shares `vitest@5.0.3`) for app-runtime
tests; amend ADR-0100 §1 ("vendored and unused") and declare
`"@effect/vitest": "workspace:*"` in the app packages. Harness rule: `it.effect`
for Effect programs (TestClock), `it.live` for real-runtime IO-boundary tests,
`vite-plus/test` elsewhere. Test Layers provide in-memory `ProjectStore`, fake
`NativeDialog`, fake `AppPaths`.

### D6 — Gate and documentation edits (with the code)

`scripts/assert-runtime-free.mjs` drops `"apps/desktop/src/main"` from
`RUNTIME_FREE_ROOTS` (and reconciles its comment, embedded fixtures, and
`scripts/test/assert-runtime-free.test.mjs`); `RULES.md` §Effect names the two
app surfaces; `docs/agents/runtime-free-gate.md` drops main and cites ADR-0159.
The renderer/preload remain guarded by `scripts/check-renderer-bundle.mjs` and the
renderer content-boundary test.

### D7 — Migration order

Behaviour-preserving vertical slices, thinnest-first: (1) one command through one
`ManagedRuntime` with a service or two, behind an adapter; (2) widen to the full
service graph and replace the `*Deps` objects; (3) the compiler-cli entrypoint
facade. Each slice leaves goldens byte-identical and the renderer bundle clean.

## Testing Decisions

**Seams.** Two, both existing public boundaries, no new test-only seam:

1. **The IPC command boundary (`campaign:execute`).** Already the codebase's
   `BridgeResult` seam. A fixture set asserts the exact JSON response for one
   success and each failure reason — byte-identical across the migration. This is
   the primary seam and proves D3/D4 are behaviour-preserving (ERA-R5, R18).
2. **The service graph via test Layers.** The existing `*Deps` fakes become test
   Layers (in-memory `ProjectStore`, fake `NativeDialog`, fake `AppPaths`), so
   command flows are exercised without real filesystem or Electron (ERA-R15).

The CLI has the same primary seam: golden stdout/exit-code fixtures per command
(`vite-plus/test` today, unchanged), proving D4 (ERA-R12/R13).

**A good test** asserts external behaviour — the `BridgeResult` JSON, the process
exit code, the content artifact body hash — never the internal shape of a helper
or the layer object graph. Bad-fixture + positive-control pairs are the norm.

**Modules tested:** `apps/desktop/src/main` (command dispatch, service graph,
entrypoint lifecycle), `apps/compiler-cli` (dispatch + exit codes), and the gate
`scripts/assert-runtime-free.mjs` (fixtures).

**Prior art:** `apps/desktop/src/main/campaignBridge.test.ts` (dispatch fixture),
`apps/desktop/src/main/contentArtifact.test.ts` (boundary fail-closed),
`apps/compiler-cli/test/options.test.ts` (pure option/exit-code tests),
`scripts/test/assert-runtime-free.test.mjs` (gate fixtures), the phase-engine
full-lifecycle/golden tests (determinism).

## Out of Scope

- Any `effect` import in `apps/desktop/src/renderer` or `apps/desktop/src/preload`.
- Flipping `packages/*` runtime-free roots to the runtime, or changing their
  exported (plain) facades.
- Any gameplay, balance, save-compatibility, or authoritative-hash change.
- Adopting `@effect/platform-node` (or any un-vendored package).
- Converting the compiler-cli's synchronous reads to async.
- Reworking the renderer screens or the IPC schemas.

## Further Notes

- **ADR-0159** is the governing decision and supersedes ADR-0128 for the app
  surfaces; the vendored-idioms pins (`Context.Service`, `Layer.effect`,
  `Effect.forkChild`, `runSync`→`Cause.AsyncFiberError`, `ManagedRuntime.make`)
  are recorded in `docs/research/effect-apps-runtime-01-runtime-idioms.md`.
- **Determinism** stays enforced by `packages/**`; the app shells are
  non-authoritative and behaviourally gated (goldens, cross-process). The
  app-surface determinism gate is deliberately not extended (ADR-0150 §1).
- **Definition of done** on the exact commit: `pnpm preflight`, `pnpm test:scripts`,
  and `pnpm check` green; clean tree; goldens byte-identical; renderer bundle
  clean; Conventional Commit subjects.
- **Deferred / recorded, never dropped:** if a genuine async IO seam appears in a
  runtime-free package, it moves to the IO row of ADR-0100 §2 (ADR-0159
  §Revisit) — a separate effort.
