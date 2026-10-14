# 04: Service and layer decomposition of desktop main

**Type:** grilling
**Status:** resolved
**Blocked by:** 03

## Question

Which IO seams in `apps/desktop/src/main` become `Context.Service`, and what
`Layer` graph composes them?

Using the inventory (`docs/research/effect-apps-runtime-02-io-service-inventory.md`)
and the idioms note (`…01-runtime-idioms.md`):

- Pick the **authoritative/boundary services** and confirm the app-shell ones:
  `ContentArtifactStore`, `ProjectStore` (owns `ConstructionSnapshotStore`),
  `CampaignSessionStore`, `CommandQueueStore`, `CommandDispatcher`, and the
  shell stores (`UiStateStore`, `ReportsStore`, `DraftStore`, `CrashReporter`,
  `NativeDialog`, `AppPaths`, `Clock`, `BattleSandboxStore`).
- Decide the **service method signatures** — `Effect<A, E, never>` per RULES.md
  §Services (resolve deps in the Layer, close over them; per-call input as
  arguments). Which existing `*Deps` seams map to which service.
- Decide the **layer graph**: `Layer.effect` + `Effect.acquireRelease` (no
  `Layer.scoped` in v4); how `AppPaths`/`Clock`/`FileSystem`-over-`node:fs`
  compose; where the one `ManagedRuntime` is built.
- Decide **what stays outside the graph** (Electron-lifecycle seams that must
  remain at the true edge: `whenReady`, single-instance lock, `createWindow`,
  bounded shutdown, signal handlers, `ipcMain.handle` registration).
- Decide how the hand-rolled `Deps` objects are **replaced** (not double-run):
  the migration order from `defaultCompileCampaignDeps`/`defaultContinuityDeps`/
  `defaultSessionCommandDeps`/`defaultDeps` to services.

Deliverable: the service + layer map and method signatures, carried into the
spec. Evidence: the two research notes; verify any uncertain v4 API against
`vendor/effect`.

## Answer

Resolved autonomously 2026-10-14 (human approved autonomous resolution). Grounded
in `docs/research/effect-apps-runtime-0{1,2}-*.md` and `agent-patterns/effect-idioms.md`.

**Service form.** `Context.Service` class form; each method is
`Effect<A, E, never>` — dependencies are resolved in the `Layer` and closed over,
per-call input is a function argument (RULES.md §Services). Raw `node:fs`/
`node:path` are wrapped in the service, never `@effect/platform-node` (not
vendored).

**Service set (desktop main).**
- Boundary/authoritative: `ContentArtifactStore` (artifact load+verify and every
  content projection — contentArtifact/contentPack/compiler/shipBuildingContent/
  referenceDesigns/presentationContent); `ProjectStore` (`SaveStore`
  save/load/list/isCurrent/loadById/loadMonthInput/getActiveSaveId/
  getPreviousSaveId + the `session.json` sidecar + month-input; owns
  `ConstructionSnapshotStore`); `CampaignSessionStore` (in-memory
  `campaignSessions` + `constructionWorkspace` + pending-command registry —
  process state, stays in memory); `CommandQueueStore` (`pending-commands.json` +
  research facade); `ReplayService` (`ReplayVerifier`/`RecoveryManager`).
- App-shell/IO: `CommandDispatcher` (ticket 05); `UiStateStore`; `ReportsStore`;
  `DraftStore`; `CrashReporter`; `NativeDialog` (the genuinely-async
  `showSaveDialog`/`showOpenDialog` wrapper); `AppPaths` (userData/support/artifact
  dirs); `Clock` (the injectable `now: () => new Date()` seam); `BattleSandboxStore`
  (debug-gated).
- Today's seams map as: `CompileCampaignDeps`/`ContinuityDeps`/
  `SessionCommandDeps` → `NativeDialog` + `AppPaths` + `ProjectStore` +
  `CampaignSessionStore`; `CommandRegistry` → `CommandDispatcher`; `CrashContext`
  → `CrashReporter` + `AppPaths` + `Clock`.

**Layer graph.** `desktopMainLayer = Layer.mergeAll(AppPaths.layer,
NativeDialog.layer, Clock.layer, ContentArtifactStore.layer, ProjectStore.layer,
CampaignSessionStore.layer, CommandQueueStore.layer, ReplayService.layer,
UiStateStore.layer, ReportsStore.layer, DraftStore.layer, CrashReporter.layer,
CommandDispatcher.layer)`, built with `Layer.effect` + `Effect.acquireRelease`
(v4 has no `Layer.scoped`). One `ManagedRuntime` is built once in `whenReady()`
before `registerIpc()` and disposed in the bounded-shutdown continuation
(`index.ts:236-257`).

**Outside the graph (true edge).** `app.whenReady`, `app.requestSingleInstanceLock`,
`createWindow`, `installBoundedShutdown`, the signal handlers, and `ipcMain.handle`
registration — the only places `runtime.runPromise` is called.

**Migration order.** Introduce each service behind its existing `*Deps`
interface (adapter), switch call sites to resolve from `Context`, then delete the
`default*Deps` objects — one vertical slice at a time, goldens green throughout.