# 02: IO/service inventory of desktop main and compiler-cli

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

Enumerate every side-effecting seam in the two target surfaces so the service
decomposition decision (06) has facts to work from.

For `apps/desktop/src/main` (72 files, ~9.7k LOC) and `apps/compiler-cli`
(~1.9k LOC), classify each seam by:

- **Kind** — `node:fs` read/write, Electron `app`/`dialog`/`session`/`ipcMain`,
  `node:child_process`, `node:os`/`node:path`, dynamic `import()`, timers, or
  none.
- **Authority** — is this seam on an authoritative (hashed/replayed) path, or is
  it app-shell orchestration/IO-metadata only?
- **Async** — synchronous, promise-wrapper, or genuinely async.
- **Candidate service boundary** — the `Context.Service` it would become, if any.

Produce a table (file → seam → kind → authority → candidate service), plus a
short list of "unavoidably Electron-lifecycle" seams that must stay at the true
edge (`app.whenReady`, single-instance lock, window creation, signal handlers).

Note the existing dependency-injection seams already present (e.g.
`defaultCompileCampaignDeps`, `defaultContinuityDeps`, `crashContext`,
`CommandRegistry`) — these are the natural service boundaries already in the
code. Deliverable: a durable note under `docs/research/`. No application code.

## Answer

Resolved 2026-10-14 (research subagent). Note:
`docs/research/effect-apps-runtime-02-io-service-inventory.md` (350 lines).

**Proposed services.** Authoritative/boundary: `ContentArtifactStore` (artifact
read+verify + content projections: contentArtifact/contentPack/compiler/
shipBuildingContent/referenceDesigns/presentationContent), `ProjectStore`
(`SaveStore` save/load/list + `session.json` + `month_input`, owns
`ConstructionSnapshotStore`), `CampaignSessionStore` (in-memory session +
construction-workspace registries), `CommandQueueStore` (`pendingCommands.ts` +
`pending-commands.json`), `ReplayService`. App-shell: `CommandDispatcher`,
`UiStateStore`, `ReportsStore`, `DraftStore`, `CrashReporter`, `NativeDialog`,
`AppPaths`, `Clock`, `BattleSandboxStore`. Minimal authoritative set for the
first slices: `ContentArtifactStore` + `ProjectStore` + `CampaignSessionStore` +
`CommandQueueStore` + `CommandDispatcher`.

**Existing DI seams (the natural boundaries):** `CompileCampaignDeps`
(`commands/compileCampaign.ts:14,168`), `ContinuityDeps`
(`commands/continuityCommands.ts:49,59`), `SessionCommandDeps`
(`commands/sessionCommands.ts:25,30`), `CommandRegistry`/`defaultCommandRegistry`
/`createCampaignCommandDispatcher`/`dispatchCampaignCommand`
(`campaignBridge.ts:133,206,361,389`), `CrashContext`/`crashContext`
(`crashSupport.ts:16`, `index.ts:55`), `ConstructionSnapshotStore`
(`commands/construction/snapshot-store.ts:20,32,65`), `BattleSandboxDeps`
(`commands/battleSandboxCommands.ts:37,39`), plus clock/abort injections in
`drawingBoardDraft.ts:88`, `uiState.ts:90`, `monthlyReports.ts:72`,
`commands/listNewGameOptions.ts:36`.

**Unavoidable lifecycle seams (stay at the true edge):** `app.whenReady`,
`app.requestSingleInstanceLock`, `createWindow`, `installBoundedShutdown`,
signal handlers, `ipcMain.handle` registration (`index.ts`).

**Async risk (the key fact for the reversal):** genuinely async is only the three
native dialogs (`compileCampaign.ts:172`, `continuityCommands.ts:62`,
`sessionCommands.ts:32`), `app.whenReady()`, and the devtools dynamic import.
Everything else declared `async` has a synchronous body (0 awaits) over
synchronous `node:fs`/`SaveStore`. The **entire compiler-cli is fully
synchronous** (no `async`/`await`; every `run*` returns `ExitCategory`). No
`node:child_process` in production; one quit-flush `setTimeout`.

Facts for later tickets: the only genuine behavioural fork is whether
`ProjectStore`/sidecar stores stay synchronous-in-Effect or gain an async facade
→ ticket 06. Dead/legacy: `main/project.ts` and `main/campaignSave.ts` have no
production importers.
