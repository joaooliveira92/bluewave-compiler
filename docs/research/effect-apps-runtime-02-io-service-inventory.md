# Research — IO/service inventory of `apps/desktop/src/main` and `apps/compiler-cli`

- **Ticket:** `.scratch/effect-apps-runtime/issues/02-research-app-io-service-inventory.md`
- **Map:** `.scratch/effect-apps-runtime/map.md` ("Effect runtime adoption in apps").
- **Type:** research (read-only; no application code touched).
- **Date:** 2026-10-14.
- **Scope:** every side-effecting seam in the two non-renderer app surfaces that the
  service-decomposition decision (ticket 06) must reason about. The engine packages stay
  runtime-free; the renderer/preload must stay Effect-free (MIG-EXCL-1). This note did not
  edit code; it read the current tree at the state below.
- **Method:** directory listing + targeted `rg` for `node:fs`, `node:os`, `node:path`,
  `node:child_process`, `electron`, timers, dynamic `import()`, `process.*`, and module-level
  `Map`/`Set`, then read each hit in full. Sources are the repository files themselves
  (primary source = the code that owns the seam). Line numbers are from the 2026-10-14 tree.

---

## 1. Question

Enumerate every side-effecting seam in (`apps/desktop/src/main`, 72 non-test files,
~9.7 kLOC) and (`apps/compiler-cli`, ~1.9 kLOC), classify each by **kind**,
**authority**, **async**, and **candidate service**, record the dependency-injection seams
already present, and list the unavoidable Electron-lifecycle seams that must stay at the
true edge.

## 2. Headline findings

1. **The two surfaces are almost entirely synchronous.** Every `run*` in
   `apps/compiler-cli/src/commands.ts` returns `ExitCategory` synchronously; there is **no
   `async` function** in the CLI at all (verified). In desktop main, the only genuinely
   awaited operations are the three native dialogs plus `app.whenReady()` and the
   `electron-devtools-installer` dynamic import. `commitMonth`, the player-command queue,
   `readUiState`/`writeUiState`, the report/draft/metadata stores, and every `SaveStore`
   call are `async`-declared functions with **zero `await`s** over synchronous
   `node:fs`. This is the central risk for the reversal: moving these to an Effect
   program changes their call discipline from sync to async even though no real IO becomes
   asynchronous.
2. **No side-effecting seam lies on the authoritative hash/replay path except the
   `SaveStore` boundary and the content-artifact read.** All other file writes
   (`ui-state.json`, `monthly-reports.json`, `drawing-board-draft.json`,
   `session.json`, `pending-commands.json`, crash bundles) are app-owned sidecars
   explicitly outside the `SaveStore` envelope/hash (their own doc comments say so). The
   engine (`MonthExecutor`/`ReplayVerifier`) is deterministic and stays in the runtime-free
   packages; main only orchestrates it.
3. **The natural service boundaries already exist as injected deps/registries.** The
   codebase carries six explicit DI seams (`CompileCampaignDeps`, `ContinuityDeps`,
   `SessionCommandDeps`, `CommandRegistry`, `ConstructionSnapshotStore`, `CrashContext`)
   plus `BattleSandboxDeps`. These are the shape the `Layer` graph should mirror.
4. **Two files are dead/legacy and must not be migrated as if live:** `main/project.ts`
   (the retired `.bluewave` authoring format; no production importer — only its own test)
   and `main/campaignSave.ts` (`loadCampaignSave`; no production importer — only
   `apps/desktop/test/campaignSave.test.ts`).
5. **`node:child_process` is not used.** The only process-spawn is a *test fixture*:
   `commands/researchDeterminismChild.ts` is spawned by its orchestrator test, not by the
   app. It is a plain-Node determinism harness, not a runtime seam.

---

## 3. (a) Seam inventory — `apps/desktop/src/main`

Legend — **Kind:** FS = `node:fs`; PATH/OS = `node:path`/`node:os`; EL = Electron
(`app`/`dialog`/`session`/`ipcMain`/`BrowserWindow`); DYN = dynamic `import()`;
TIMER = `setTimeout`/`setInterval`; MEM = in-memory module state; PROC = `process.*`;
none = no side effect. **Authority:** AUTH = authoritative (hashed/enveloped/replayed);
BOUNDARY = trust/identity boundary feeding an authoritative value; SIDECAR =
non-authoritative app-owned file; SHELL = app-shell orchestration / IO metadata only.
**Async:** sync; async-decl = async function with a fully synchronous body; real = genuinely
awaited.

| File | Seam (symbol:line) | Kind | Authority | Async | Candidate service |
| --- | --- | --- | --- | --- | --- |
| `index.ts` | `crashContext` built at module load, reads `app.getPath("userData")` (:56), `app.getVersion()` (:57), `homedir()` (:61), `new Date` (:62) | EL/OS/PROC | SHELL | sync | AppPaths + Clock + CrashReporter |
| `index.ts` | `hardFail` → `dialog.showErrorBox` (:44); crash `onFatal` → `dialog.showErrorBox` (:72) | EL | SHELL | sync | NativeDialog + CrashReporter |
| `index.ts` | `createWindow()` (:151); `session.defaultSession.webRequest.onHeadersReceived` + `applyContentSecurityPolicy` (:166) | EL | SHELL | sync | ElectronLifecycle (edge); CSP applied by shell |
| `index.ts` | `attachFailureRecovery` webContents/window events (:102–120); `attachDevToolsPageHook` `executeJavaScript` (:129–148) | EL | SHELL | sync | ElectronLifecycle (edge) |
| `index.ts` | `win.webContents.send("window:state-changed")` (:174–175) | EL | SHELL | sync | ElectronLifecycle (edge) |
| `index.ts` | `registerIpc()` → `ipcMain.handle("campaign:execute")` (:189) | EL | SHELL (routes to AUTH commands) | real (returns promise) | CommandDispatcher + IpcBridge |
| `index.ts` | `ipcMain.on("support:report-crash")` → `parseRendererCrashInput` + `captureCrash` (:196–205) | EL/FS | SHELL | sync | CrashReporter |
| `index.ts` | `ipcMain.handle("window:get-state")` (:207); `ipcMain.on(window:minimize/maximize-toggle/close)` (:216–227) | EL | SHELL | sync | ElectronLifecycle (edge) |
| `index.ts` | `installBoundedShutdown` `setTimeout`/`clearTimeout` timer (:248,252), `ipcMain.once/removeListener("app:quit-flush-complete")` (:249,254), `webContents.send("app:quit-flush")` (:255) | TIMER/EL | SHELL | sync | ElectronLifecycle (edge); Clock for timeout |
| `index.ts` | `app.requestSingleInstanceLock()` (:261), `app.quit()` (:46,78,116,250,262,313), `app.on("second-instance"/"before-quit"/"activate"/"window-all-closed")` (:236,264,305,312), `app.whenReady()` (:271) | EL | SHELL | real | ElectronLifecycle (edge) |
| `index.ts` | `await import("electron-devtools-installer")` (:275); `withModernExtensionApi(session.defaultSession)` (:277) | DYN/EL | SHELL | real | ElectronLifecycle (edge, dev-only) |
| `index.ts` | `loadContentArtifact()` startup verification (:292) | FS (via contentArtifact) | BOUNDARY | sync | ContentArtifactStore |
| `index.ts` | `process.on("SIGINT"/"SIGTERM")` → `app.quit()` (:319–321) | PROC | SHELL | sync | ElectronLifecycle (edge) |
| `contentArtifact.ts` | `readContentArtifact` `existsSync`/`readFileSync` (:59,69–70), `loadContentArtifact` (:92) | FS | BOUNDARY (SHA-256 verify) | sync | ContentArtifactStore |
| `contentPack.ts` | `packagedResourcesDir` reads `process.resourcesPath`/`process.defaultApp` (:13–17); `resolveContentDir`/`resolveGeneratedContentDir` `join`/`resolve` (:20,34) | PATH/PROC | SHELL (path resolution) | sync | AppPaths / ContentArtifactStore |
| `compiler.ts` | `compileProductionCampaignFromArtifact` → `readContentArtifact` (:26) | FS (via contentArtifact) | AUTH (compile input) | sync | ContentArtifactStore + ContentCompiler |
| `shipBuildingContent.ts` | `readContentArtifact` (:36), module cache `loaded`/`cached` (:24–25), `hashWithContext` identity (:67–68) | FS (via contentArtifact)/MEM | BOUNDARY (content identity hash) | sync | ContentArtifactStore |
| `referenceDesigns.ts` | `readContentArtifact` (:23) | FS (via contentArtifact) | BOUNDARY | sync | ContentArtifactStore |
| `presentationContent.ts` | `readContentArtifact` (:13) | FS (via contentArtifact) | BOUNDARY | sync | ContentArtifactStore |
| `campaignSessions.ts` | module-level `Map` registry (:34); `register/get/removeCampaignSession` (:36–46) | MEM | AUTH state held in memory (transient) | sync | CampaignSessionStore |
| `pendingCommands.ts` | `persistQueue` `writeFileSync`/`renameSync`/`rmSync` (:84–108); `restorePendingQueue` `existsSync`/`readFileSync`/`rmSync` (:114–142); `writeFileSync` (:95) | FS/MEM | SIDECAR (envelopes re-validated by engine at drain) | sync | CommandQueueStore |
| `uiState.ts` | `loadUiState` `existsSync`/`readFileSync` (:64–80); `saveUiState` `writeFileSync`/`renameSync`/`rmSync` (:90–103) | FS | SIDECAR (never authoritative) | sync (async-decl handlers) | UiStateStore |
| `monthlyReports.ts` | `loadMonthlyReports` `existsSync`/`readFileSync` (:46–62); `saveMonthlyReports` `writeFileSync`/`renameSync`/`rmSync` (:72–89) | FS | SIDECAR (never authoritative) | sync (async-decl handler) | ReportsStore |
| `drawingBoardDraft.ts` | `loadDrawingBoardDraft` `existsSync`/`readFileSync`/`renameSync` (:46–71); `writeDrawingBoardDraft` `writeFileSync`/`renameSync`/`rmSync` (:86–126) | FS | SIDECAR (never authoritative) | sync (async-decl) | DraftStore |
| `campaignSessionMetadata.ts` | `writeSessionMetadata` `writeFileSync`/`renameSync` (:41–46); `readSessionMetadata` `existsSync`/`readFileSync` + Schema decode (:49–59) | FS | SIDECAR (outside hash, but required for replay/continuance) | sync | SessionMetadataStore (fold into ProjectStore) |
| `crashSupport.ts` | `captureCrash` `mkdirSync`/`writeFileSync` (:224–225), `pruneBundles` `readdirSync`/`unlinkSync` (:187–203), limiter clock `Date.now` (:162) | FS | SIDECAR (local-only diagnostic) | sync | CrashReporter |
| `campaignSave.ts` | `loadCampaignSave` → `SaveStore.load` + Map→plain conversion (:33–60) | (via SaveStore) FS | AUTH read (test-only importer) | sync | ProjectStore (legacy harness) |
| `project.ts` | `loadContentDirectory` `readFileSync` (:42,62); `saveProjectFile` (:87–97); `loadProjectFile` (:99–110); `extractProject` `mkdirSync`/`writeFileSync` (:145–155) | FS/PATH | retired `.bluewave` format — **not on runtime path** | sync | none (dead/legacy) |
| `commands/compileCampaign.ts` | `SaveStore.save` (:123); `writeSessionMetadata` (:140); `dialog.showSaveDialog` dynamic import (:172–180); `randomUUID` (:170) | FS/DYN/EL | AUTH (initial save) + SIDECAR (session.json) | real (dialog) | ProjectStore + NativeDialog + SessionId generator |
| `commands/continuityCommands.ts` | `SaveStore.load/list/loadById` (:104,194,224,298,482); `readSessionMetadata` (:115,287); `RecoveryManager.revert` (:526); `ReplayVerifier.verify` (:422); `dialog.showOpenDialog` dynamic import (:62); `randomUUID` (:60) | FS/DYN/EL | AUTH (hash/envelope + replay) | real (dialog) | ProjectStore + ReplayService + NativeDialog |
| `commands/sessionCommands.ts` | `SaveStore.isCurrent/save` (:59,174); `readdirSync`/`realpathSync`/`statSync`/`existsSync` (:89,95,129,133); `writeSessionMetadata` (:175); `dialog.showSaveDialog` dynamic import (:32); `node:path` (:2) | FS/PATH/DYN/EL | AUTH (save/copy) | real (dialog) | ProjectStore + NativeDialog |
| `commands/commitMonth.ts` | `SaveStore.save` with `monthInput` (:200–211); `saveMonthlyReports`/`loadMonthlyReports` (:282–284); `MonthExecutor.execute` (:127) | FS (via SaveStore) | AUTH (month execution + save + month_input) + SIDECAR (reports) | async-decl (0 awaits) | ProjectStore + CampaignEngine + ReportsStore |
| `commands/construction/snapshot-store.ts` | `SaveStoreConstructionSnapshotStore.persist` → `SaveStore.save` (:32–62); interface (:20); singleton (:65) | FS (via SaveStore) | AUTH (snapshot mutation) | sync | ProjectStore (snapshot store) |
| `commands/researchCommands.ts` | `SaveStore.save` INC-5 autosave (:138) | FS (via SaveStore) | AUTH autosave + SIDECAR queue | async-decl (0 awaits) | ProjectStore |
| `commands/battleSandboxCommands.ts` | module-level `Map` `stored` (:72); `BattleSandboxDeps` debug gate (:37) | MEM | SHELL (observational, debug-only) | sync | BattleSandboxStore (debug) |
| `commands/researchDeterminismChild.ts` | `mkdtempSync` (:53), `rmSync` (:104), `SaveStore.save/load` (:66,93), `process.stdout.write`/`process.exit` (:101,109–112) | FS/OS/PROC | determinism test fixture (plain Node); **not in app runtime** | sync | none (test entrypoint) |
| `commands/listNewGameOptions.ts` | `compileProductionCampaignFromArtifact` (reads artifact) (:43) | FS (via compiler) | BOUNDARY | async-decl (0 awaits) | ContentArtifactStore |
| `commands/contentCommands.ts` | `loadPresentationContent`/`loadShipBuildingData` (read artifact) (:7–8) | FS (via content) | BOUNDARY | sync | ContentArtifactStore |
| `commands/designCommands.ts` | `loadShipBuildingContent`/`Data` + `submitPlayerCommand` env queue (:43–44) | MEM (via queue) | AUTH envelope queued | async-decl (awaits only queue) | CommandQueueStore |
| `commands/playerCommandSupport.ts` | `submitPlayerCommand` → `queuePendingEnvelope` (:131) → `persistQueue` | MEM/FS (via queue) | AUTH envelope queued (engine validates) | async-decl (0 awaits) | CommandQueueStore |
| `commands/constructionCommands.ts` | `constructionSnapshotStore.persist` authoritative mutation (:240,371,461) | FS (via snapshot store) | AUTH (snapshot mutation) | async-decl (0 awaits) | ProjectStore (snapshot store) |
| `commands/constructionStatusCommands.ts` | `submitPlayerCommand` queue (:21,27) | MEM (via queue) | AUTH envelope queued | async-decl | CommandQueueStore |
| `commands/diplomacyCommands.ts` | `submitPlayerCommand` queue (:65) | MEM (via queue) | AUTH envelope queued | async-decl | CommandQueueStore |
| `commands/divisionCommands.ts` | `submitPlayerCommand` queue (:49) | MEM (via queue) | AUTH envelope queued | async-decl | CommandQueueStore |
| `commands/fleetCommands.ts` | `submitPlayerCommand` queue (:105) | MEM (via queue) | AUTH envelope queued | async-decl | CommandQueueStore |
| `commands/budgetCommands.ts` | `submitPlayerCommand` queue (:64) | MEM (via queue) | AUTH envelope queued | async-decl | CommandQueueStore |
| `campaignBridge.ts` | `defaultCommandRegistry` (:206), `createCampaignCommandDispatcher` (:361), `dispatchCampaignCommand` (:389) | none | BOUNDARY (IPC router) | real (returns promise) | CommandDispatcher |
| `extensionSession.ts` | Proxy over Electron `Session` `extensions.*` (:19–33) | EL (types only) | SHELL | sync | ElectronLifecycle (edge) |
| `csp.ts` | `applyContentSecurityPolicy` (pure) (:40) | none | SHELL (pure) | sync | none |
| `debugGate.ts` | `__BLUEWAVE_DEBUG__` build constant (:9–15) | none | SHELL | sync | none (config constant) |
| `shellPolicy.ts` | pure policy (:1–38) | none | SHELL | sync | none |
| `saveHelpers.ts` | pure `toSaveableState` (:16) | none | AUTH-adjacent pure | sync | none |
| `monthInput.ts` | pure schema/parse (:20–57) | none | AUTH-adjacent pure | sync | none |
| `campaignCommandSchemas.ts` | pure schemas/wire decode | none | BOUNDARY (pure) | sync | none |
| `campaignSaveSchema.ts` | pure schema | none | pure | sync | none |

**Pure / no-IO modules (no seam, listed for completeness):**
`constructionWorkspace.ts` (barrel), `construction/commandDefinition.ts`,
`construction/commandRecord.ts` (deterministic hash walk; deliberately avoids the
machinery's wall-clock `transitionRecord` — see its header), `construction/economy.ts`,
`construction/reservationLedger.ts`, `construction/reservationRequirements.ts`,
`construction/settlement.ts`, `construction/view.ts`, `construction/workspaceState.ts`
(pure value object with an internal `Map`), `construction/workspaceReconstruction.ts`,
`commands/commandEnvelope.ts` (deterministic timestamp),
`commands/inspect{Map,Campaign,BattleHistory,OpeningBriefing,Priorities}.ts`,
`commands/commitMonth/{battleOutcomes,reportEntry,responseMappers,snapshot}.ts`.

> Note: `construction/workspace.ts` holds a module-level `Map` `workspaces` (:14) — this is
> the one in-memory construction registry; it is keyed by session and cleared on close
> (`clearConstructionWorkspace`). Candidate service: fold into `CampaignSessionStore`.

---

## 4. (a) Seam inventory — `apps/compiler-cli`

All `run*` functions are **synchronous** (`(): ExitCategory`). `main()` is synchronous.
There is no `async`, no `await`, no timer, and no `node:child_process` anywhere in the
package.

| File | Seam (symbol:line) | Kind | Authority | Async | Candidate service |
| --- | --- | --- | --- | --- | --- |
| `main.ts` | `readFileSync` commands file (:250); `process.argv`/`stdout`/`stderr`/`exit` (:124–127,159–161,242); `process.env.VITEST` auto-run guard (:258) | FS/PROC | SHELL (CLI entry) | sync | CliRuntime / FileSystem port |
| `commands.ts` | `buildInput` `existsSync`/`readFileSync` (:950–961) | FS/PATH | BOUNDARY (content input) | sync | ContentCompilerService + FileSystem |
| `commands.ts` | `runValidate`/`runCompile` (:80,94): compile then `mkdirSync`/`writeFileSync`/`rmSync` artifact+envelope (:105–122) | FS | AUTH artifact output | sync | ContentCompilerService + FileSystem |
| `commands.ts` | `runInspect`/`runVerify`/`runCompare` `existsSync`/`readFileSync` (:145–155,191–197) | FS | AUTH verify | sync | ContentCompilerService + FileSystem |
| `commands.ts` | `runCampaignCompile` `mkdirSync`/`writeFileSync` campaign-state.json (:324–351); `buildContentSurfaceInput` (:991) | FS | AUTH compile output | sync | CampaignCompilerService + FileSystem |
| `commands.ts` | `runCampaignSave` `readFileSync` state (:392), `SaveStore.save` (:404) | FS | AUTH save | sync | CampaignPersistence |
| `commands.ts` | `runCampaignLoad` `SaveStore.load` (:424) | (via SaveStore) FS | AUTH load | sync | CampaignPersistence |
| `commands.ts` | `runBattleGenerate` `SaveStore.load` + `generateBattles` (:458–…) | (via SaveStore) | AUTH read, debug tool | sync | CampaignPersistence + CombatService |
| `commands.ts` | `runBattleAdvanceMinute` `existsSync`/`readFileSync` (:529,536) | FS | tool input | sync | FileSystem + CombatService |
| `commands.ts` | `runGunneryResolveShot` `existsSync`/`readFileSync` (:608,615) | FS | tool input | sync | FileSystem + CombatService |
| `commands.ts` | `runTurnExecute` `SaveStore.load/save` (:730,759), writes commands.json/command-ledger.json/final-hash.json (:764–789) | FS | AUTH turn execute + replay artifacts | sync | CampaignPersistence + CampaignEngine |
| `commands.ts` | `runReplay` `SaveStore.loadById` (:838), `existsSync`/`readFileSync` commands/ledger/final-hash (:847–871), `ReplayVerifier.verify` (:883) | FS | AUTH replay | sync | CampaignPersistence + ReplayService |
| `commands.ts` | `runContentCheck`/`runContentBuild` (:1003,1171) `buildContentBundleArtifact`; `writeContentBundleArtifact` (:1180) | FS (via compiler/compiler-fs) | AUTH content build | sync | ContentCompilerService + FileSystem |
| `commands.ts` | `runContentGate` `existsSync`/`readFileSync` allowlist (:1106–1109) | FS | gate input | sync | FileSystem + ContentCompilerService |
| `commands.ts` | `runContentVerify` `existsSync`/`readFileSync` lock (:1219–1228) | FS | AUTH lock verify | sync | FileSystem + ContentCompilerService |
| `commands.ts` | `printDiagnostics`/`printResult` `process.stdout.write` (:1272–1280) | PROC | SHELL | sync | CliRuntime |
| `options.ts` | pure argv parsing (:26–155) | none | SHELL | sync | none |
| `safePath.ts` | pure `node:path.normalize` traversal guard (:10–20) | PATH (pure) | SHELL | sync | none |
| `combatDiagnostics.ts` | pure error→collector mapper (:19–50) | none | SHELL | sync | none |
| `index.ts` | re-exports only | none | — | — | — |

> `buildContentBundleArtifact` / `writeContentBundleArtifact` live in
> `packages/content-compiler` (runtime-free) and are called from both surfaces; they are a
> pure builder plus a filesystem writer respectively, not an app DI seam. They are the
> content counterpart of the `SaveStore` boundary.

---

## 5. (b) Existing dependency-injection seams (the natural service boundaries)

These are already-shaped ports/registries. File:line is the declaration; "current shape"
is the injected surface.

| Seam | File:line | Current shape |
| --- | --- | --- |
| `CompileCampaignDeps` | `apps/desktop/src/main/commands/compileCampaign.ts:14` | `{ artifactDir: string; chooseSaveDirectory(name): Promise<string\|null>; generateSessionId(): string }` |
| `defaultCompileCampaignDeps` | `.../commands/compileCampaign.ts:168` | concrete value; `chooseSaveDirectory` does the dynamic `import("electron")` dialog |
| `ContinuityDeps` | `.../commands/continuityCommands.ts:49` | `{ choosePackageDirectory(): Promise<string\|null>; generateSessionId(): string }` |
| `defaultContinuityDeps` | `.../commands/continuityCommands.ts:59` | concrete value; dynamic `import("electron")` `showOpenDialog`; `randomUUID` |
| `SessionCommandDeps` | `.../commands/sessionCommands.ts:25` | `{ chooseCopyDirectory(name): Promise<string\|null> }` |
| `defaultSessionCommandDeps` | `.../commands/sessionCommands.ts:30` | concrete value; dynamic `import("electron")` `showSaveDialog` |
| `CommandRegistry` | `.../campaignBridge.ts:133` | `Partial<Record<CampaignCommandName, CampaignCommandHandler>>`; handler returns `CommandOutcome \| Promise<CommandOutcome>` |
| `defaultCommandRegistry` | `.../campaignBridge.ts:206` | concrete value wiring all command modules (incl. `defaultCompileCampaignDeps`/`defaultContinuityDeps`) |
| `createCampaignCommandDispatcher` | `.../campaignBridge.ts:361` | `(registry) => (command, payload) => Promise<BridgeResult<unknown>>` — DIP factory |
| `dispatchCampaignCommand` | `.../campaignBridge.ts:389` | singleton = `createCampaignCommandDispatcher(defaultCommandRegistry)` |
| `CrashContext` | `.../crashSupport.ts:16` | `{ bundleDir; appVersion; platform; arch; processId; homeDir; now(): Date; log(msg); limiter?; maxBundles? }` — clock + logger + paths injected |
| `crashContext` | `.../index.ts:55` | concrete value built from Electron/OS at module load |
| `installProcessCrashHandlers(ctx, onFatal, emitter = process)` | `.../crashSupport.ts:247` | injectable emitter + `onFatal` callback |
| `ConstructionSnapshotStore` | `.../commands/construction/snapshot-store.ts:20` | `{ persist(record, mutate): SnapshotMutationResult }` — persistence DIP seam |
| `SaveStoreConstructionSnapshotStore` / `constructionSnapshotStore` | `.../commands/construction/snapshot-store.ts:32,65` | concrete impl + default singleton |
| `BattleSandboxDeps` / `defaultDeps` | `.../commands/battleSandboxCommands.ts:37,39` | `{ debugEnabled(): boolean }` |
| `writeDrawingBoardDraft(payload, now = () => new Date())` | `.../drawingBoardDraft.ts:88` | injectable clock |
| `loadDrawingBoardDraft(saveDir, currentVersion)` | `.../drawingBoardDraft.ts:48` | injectable compatibility version |
| `saveUiState(saveDir, uiState, signal?)` / `writeUiState(payload, signal?)` | `.../uiState.ts:90,136` | injectable `AbortSignal` |
| `saveMonthlyReports(saveDir, data, signal?)` | `.../monthlyReports.ts:72` | injectable `AbortSignal` |
| `listNewGameOptions(artifactDir = resolveGeneratedContentDir())` | `.../commands/listNewGameOptions.ts:36` | injectable artifact dir |
| `loadSaveForTurn(store, saveDir, …)` | `.../commands/continuityCommands.ts:448` | private `SaveStore`-parameterized helper |

These map 1:1 onto the candidate services in §7: the `...Deps` dialogs → `NativeDialog`;
`artifactDir` → `AppPaths`; `generateSessionId` → `Clock`/`IdGenerator`;
`CommandRegistry`/dispatcher → `CommandDispatcher`; `ConstructionSnapshotStore` +
`SaveStore` usages → `ProjectStore`; `CrashContext` → `CrashReporter` + `Clock` + `AppPaths`;
`AbortSignal` params → cancellation channel on the store services.

---

## 6. (c) Unavoidable Electron-lifecycle seams (must stay at the true edge)

These cannot become `Context.Service`s inside a `ManagedRuntime`: they are the process
entry, the app event loop, and the OS/Chromium handle. They belong in a thin edge
`Layer`/module that builds the runtime and hands off, or that the runtime calls outward.

| Seam | File:line | Why it stays at the edge |
| --- | --- | --- |
| `app.requestSingleInstanceLock()` + `app.on("second-instance")` | `index.ts:261,264` | process-global, must run before any runtime work |
| `app.whenReady().then(...)` | `index.ts:271` | Electron's own lifecycle promise; owns runtime startup/teardown |
| `createWindow()` / `new BrowserWindow` / `win.loadURL`/`loadFile` | `index.ts:151–186` | Chromium handle creation |
| `app.on("before-quit")` + `installBoundedShutdown` (`event.preventDefault`, flush handshake, timer) | `index.ts:235–257` | app-loop quit control |
| `app.on("activate" / "window-all-closed")` | `index.ts:305,312` | app-loop events |
| `process.on("SIGINT"/"SIGTERM")` | `index.ts:319–321` | OS signal handling |
| `ipcMain.handle/on/once/removeListener` registration | `index.ts:189–227,249,254` | Chromium IPC registration must exist before/around runtime |
| `session.defaultSession.webRequest.onHeadersReceived` (CSP) | `index.ts:166` | Chromium session hook |
| `withModernExtensionApi(session.defaultSession)` + `electron-devtools-installer` dynamic import | `index.ts:275–277` | Chromium extension install, dev-only |
| `BrowserWindow.fromWebContents(event.sender)` window controls | `index.ts:208–226` | window handle per IPC event |
| `win.webContents.send(...)` | `index.ts:174–175,255` | renderer channel |
| `app.getPath("userData")` / `app.getVersion()` | `index.ts:56–57` | Electron app metadata (used to build `CrashContext`; the *values* can be injected, the *read* stays edge) |
| `installProcessCrashHandlers(..., emitter = process)` | `crashSupport.ts:247` | process-level `uncaughtException`/`unhandledRejection`; the handler *body* can be a `CrashReporter` service, the registration stays edge |
| `process.stdout/stderr/exit`, `process.argv` | `compiler-cli/src/main.ts` | CLI process entry; the run* bodies become services, the entry stays a `runPromise` facade |

---

## 7. (d) Proposed service list

Aligned with the map's named candidates. Only the first group is on or adjacent to the
authoritative path.

**Authoritative / boundary services**
1. **ContentArtifactStore** — read + verify the compiled artifact and derive content
   identity/hashes; project ship-building/reference-design/presentation views from it.
   Absorbs `contentArtifact.ts`, `contentPack.ts` (path resolution), `compiler.ts`,
   `shipBuildingContent.ts`, `referenceDesigns.ts`, `presentationContent.ts`.
2. **ProjectStore** (save-store facade) — the `SaveStore` save/load/list/isCurrent +
   `RecoveryManager` boundary, plus the `session.json` sidecar and `month_input`. Absorbs
   every `new SaveStore()` site and `campaignSessionMetadata.ts`; owns the
   `ConstructionSnapshotStore` persistence implementation. **IO stays synchronous today**
   (see §2.1), so its façade must decide sync-in-Effect vs. async.
3. **CampaignSessionStore** — the in-memory `sessionId → CampaignSessionRecord` registry
   (and the construction workspace registry).
4. **CommandQueueStore** — per-session pending envelope queue + `pending-commands.json`
   mirror; absorbs `pendingCommands.ts` and the `researchWorkspace.ts` facade.
5. **ReplayService** — `ReplayVerifier` orchestration for `replayCampaign`/CLI `replay`.

**App-shell / sidecar services**
6. **CommandDispatcher** — the `CommandRegistry` + router (`campaignBridge.ts`); the
   `campaign:execute` program runner. The existing `CommandRegistry` seam is its interface.
7. **UiStateStore** — `ui-state.json`.
8. **ReportsStore** — `monthly-reports.json`.
9. **DraftStore** — `drawing-board-draft.json` (could merge with `UiStateStore` as
   "AppSidecars"; they share the same save-dir/tmp+rename/tolerant-read shape).
10. **CrashReporter** — support bundle build/write/prune + limiter; the `CrashContext` seam
    is its config. Registration of process handlers stays at the edge.
11. **NativeDialog** — the three `dialog.show*` seams; the injected
    `choose*Directory` deps become methods on this service.
12. **AppPaths** — `resolveGeneratedContentDir()`, `userData`/support dir, version/platform
    metadata (the path values; the Electron *reads* stay edge).
13. **Clock** — injected `now`/`Date` for `CrashReporter`, `DraftStore.savedAt`, report
    timestamps, and the quit-flush timeout.
14. **BattleSandboxStore** (debug-only) — the `stored` battle map.

**compiler-cli**
15. **CliRuntime / `runMain` facade** — `process.argv`/stdio/exit behind a `runPromise`
    entrypoint.
16. **FileSystem port** — one IO service for the raw `node:fs` reads/writes (artifacts,
    state JSON, lock, allowlist, commands files).
17. **ContentCompilerService** / **CampaignCompilerService** / **CampaignPersistence** /
    **CombatService** — the bounded `run*` bodies (`buildInput`/`compile`,
    `buildContentSurfaceInput`/`compile`, `SaveStore` save/load, `MonthExecutor`/`replay`,
    combat tool calls).

Merge candidates: `DraftStore`+`UiStateStore`; `ReportsStore` could live with them as
"Campaign sidecars"; `SessionMetadataStore` folds into `ProjectStore`; `AppPaths` may fold
into `ContentArtifactStore` + `CrashReporter`. The minimal authoritative set is
`ContentArtifactStore` + `ProjectStore` + `CampaignSessionStore` + `CommandQueueStore` +
`CommandDispatcher`.

---

## 8. Async vs. sync (the reversal-risk call-out)

This is the fact that most affects ticket 06's migration sequencing.

- **Genuinely async (must be `Effect`/async in any shape):** the three native dialogs
  (`compileCampaign.ts:172`, `continuityCommands.ts:62`, `sessionCommands.ts:32`);
  `app.whenReady()`; the `electron-devtools-installer` dynamic import.
- **`async`-declared but fully synchronous bodies (0 `await`s):** `commitMonth`,
  `setResearchPriorityCommand`, all player-command handlers, `readUiState`/`writeUiState`,
  `readMonthlyReports`, `readDrawingBoardDraft`/`writeDrawingBoardDraft`,
  `listNewGameOptions`, and (in continuity) `listCampaigns`/`verifyCampaign` once the
  dialog has resolved. Their real IO is synchronous `node:fs` / synchronous `SaveStore`.
- **Synchronous:** every `run*` in `compiler-cli` (the entire CLI), `SaveStore` itself
  (confirmed: `packages/persistence/src/store.ts` uses `readFileSync`/`writeFileSync`/
  `renameSync`/`existsSync` — see `docs/research/effect-conformance-08-persistence-facade.md`
  §1.1), all sidecar stores, the content-artifact read, the in-memory registries.
- **Test-fixture spawn only:** `commands/researchDeterminismChild.ts` (spawned by its
  orchestrator test; plain-Node, synchronous, parallel to the real CLI `runCombatOperation`
  entrypoints).

Implication: converting these to Effect programs makes the *call discipline* async
everywhere even though the underlying IO barely changes, so the risk is behavioural
(scheduling order, IPC reply timing, error timing) rather than throughput. The CLI is
wholly synchronous today (`ExitCategory` return), so a `runPromise` facade over unchanged
sync `run*` bodies is the lowest-risk shape; converting internals to Effect programs is the
higher-risk one.

## 9. Uncertainty / not grounded

- **LOC/file-count figures** ("~72 files, ~9.7 kLOC / ~1.9 kLOC") come from the ticket/map,
  not from an independent count in this session; the per-file enumeration in §3–§4 is the
  authoritative output.
- **`project.ts` and `campaignSave.ts` liveness** is inferred from the absence of any
  non-test importer (verified by `rg`). They are not marked deprecated in code; whether they
  should be deleted is a decision for the owner, not asserted here.
- **Which sidecars *should* merge into one AppSidecar service** is a design preference, not
  a fact; §7 lists the merge as a candidate only.

## 10. Recommendations for the spec (ticket 06)

- Treat the six existing DI seams (§5) as the ports to lift into `Context.Service`; do not
  invent new boundaries that cut across them.
- Keep the authoritative path services (`ContentArtifactStore`, `ProjectStore`) and the
  edge lifecycle (§6) explicitly separate: the edge builds the `ManagedRuntime` and calls
  into it; services never call `app.*`/`ipcMain.*`/`BrowserWindow`.
- Decide the `ProjectStore`/sidecar **sync-in-Effect vs. async-facade** question first — it
  is the only genuine behavioural fork and it gates the CLI shape (whole-package sync today).
- Preserve byte-identical goldens/hashes: the only hashed writes are `SaveStore.save` and
  `month_input`; the sidecars (`ui-state.json`, `monthly-reports.json`,
  `drawing-board-draft.json`, `session.json`, `pending-commands.json`, crash bundles) are
  explicitly outside the envelope and must stay so.
