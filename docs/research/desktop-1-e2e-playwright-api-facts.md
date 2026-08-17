# Research: Desktop-1 — Playwright × Electron e2e API facts

Grounds the upcoming hermetic e2e specs (`apps/desktop/e2e/*.spec.ts`): launching the
**built** app (no dev server) and stubbing native dialogs. Verified against the
**installed** packages (pnpm store: `playwright-core@1.62.1`,
`playwright@1.62.1`, electron `41.10.4`), playwright.dev API docs, and a
throwaway probe app run against the installed Electron binary. All "installed"
citations are to
`apps/desktop/node_modules` / `node_modules/.pnpm/*@1.62.1/node_modules/*` (the
store copy of `types.d.ts` is md5-identical to the published 1.62.1 tarball).

**Headline findings**

1. Hermetic launch = `_electron.launch({ args: [path/to/out/main/index.js], ... })`
   **without** `--dev`; prod `loadFile` branch runs (verified in built bundle).
   Playwright adds `--inspect=0 --remote-debugging-port=0` itself; **no browser
   download is needed or performed** for Electron (it drives the app's own
   Electron binary over Node-inspector + CDP).
2. Dialog stubbing **works on Electron 41.10.4** — `dialog.showOpenDialog` is
   `writable: true, configurable: true` (empirically proven; assignment
   succeeds and intercepts later calls). Canonical pattern:
   `app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths: [p] }); }, p)`.
3. UserData isolation: **use a `--user-data-dir=<tmp>` launch arg** — it moves
   `app.getPath('userData')`, `sessionData`, and the default session's storage
   path (verified). `app.setPath('userData', …)` via `evaluate` is **too late**
   (runs after `ready`; session storage path stays at the original userData).
4. The working tree's `@playwright/test` install is **broken/incomplete**:
   `require('playwright/test')` from `apps/desktop` fails with MODULE_NOT_FOUND
   (the `playwright`/`playwright-core` deps exist only in the pnpm store).
   `pnpm install` must be re-run before any spec can execute.

---

## 1. Question

What is the canonical Playwright Electron test pattern for this repo's built
app — the full `_electron.launch` signature, executable resolution, browser
download requirement, window/page acquisition (devtools handling,
`firstWindow()` vs `waitForEvent`), and how to run the **prod** `loadFile`
branch hermetically — and how to stub `electron.dialog.showOpenDialog`/
`showSaveDialog` from a test, plus reliable per-test userData isolation and
teardown.

## 2. Sources

| Source | What it is | Verified |
| --- | --- | --- |
| `node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/types/types.d.ts` | installed public type defs (md5 `fd4096f5…`) | ✅ read directly |
| `node_modules/.pnpm/playwright-core@1.62.1/node_modules/playwright-core/lib/coreBundle.js` | installed JS implementation (`_electron.launch`, `ElectronApplication`, process launcher) | ✅ read directly |
| https://playwright.dev/docs/api/class-electron · /api/class-electronapplication · /docs/test-configuration · /docs/browsers | official API/docs | ✅ read |
| `apps/desktop/node_modules/electron/electron.d.ts` (41.10.4) | `Dialog` interface, `app.setPath`/`sessionData` doc | ✅ read |
| https://github.com/electron/electron/blob/v41.10.4/lib/browser/api/dialog.ts (raw) | Electron 41 dialog module source (plain ESM function exports) | ✅ read |
| Probe app run **against the installed Electron binary** (throwaway in /tmp) | writability of `dialog.*`, storage paths, `--user-data-dir` behavior | ✅ executed |
| `apps/desktop/{package.json,playwright.config.ts,e2e/smoke.spec.ts,out/main/index.js,src/main/commands/{compileCampaign,continuityCommands}.ts,src/main/campaignSessionMetadata.ts,src/renderer/screens/campaign-file/utils/recent-files.ts}` | repo files (facts cited with line numbers) | ✅ read |

## 3. Findings

### 3.1 Hermetic launch (`_electron.launch`)

**Full launch options (installed 1.62.1 `types.d.ts` `Electron.launch`, lines
23474–23707; docs page `class-electron`):**
`acceptDownloads`, `args`, `artifactsDir`, `bypassCSP`, `chromiumSandbox`,
`colorScheme`, `cwd`, `env`, `executablePath`, `extraHTTPHeaders`, `geolocation`,
`httpCredentials`, `ignoreHTTPSErrors`, `locale`, `offline`, `recordHar`,
`recordVideo`, `timeout`, `timezoneId`, `tracesDir`.

Implementation (`lib/coreBundle.js` around line 43974, "Electron.launch"): the
actual process argv is
`["--inspect=0", "--remote-debugging-port=0", ...options.args]`; on Linux a
`--no-sandbox` is prepended unless `chromiumSandbox`. `NODE_OPTIONS` is deleted
from env. Stdio is piped; `cwd` passed through.

**Having built app hermetically:** point at the built main process with
`args: [resolve(…, "../out/main/index.js")]` and **omit `--dev` and any
`NODE_ENV=development`** — `apps/desktop/src/main/index.ts:21` / compiled
`apps/desktop/out/main/index.js:20775` decide via
`process.env.NODE_ENV === "development" || process.argv.includes("--dev")`, and
the prod branch is `win.loadFile(out/renderer/index.html)` (`out/main/index.js`).
The existing smoke spec passes `--dev` (it needs the dev server); hermetic
specs must not. Keep the smoke spec's env override
`env: { ...process.env, ELECTRON_RUN_AS_NODE: "" }` (`e2e/smoke.spec.ts:10`) so
an inherited `ELECTRON_RUN_AS_NODE` can't turn the binary into plain Node.

Electron resolves the target via `options.executablePath` **or**
`require("electron/index.js")` (`coreBundle.js`…, catch yields "Electron
executablePath not found! Please install it using `npm install -D electron`…").
`node_modules/electron/index.js` returns the string from `path.txt` → the
binary under `dist/`. There is **no separate `electronLookup` step** in 1.62.1
— it's the `require('electron')` resolution above, per installed `coreBundle.js`.

When `executablePath` is **not** set, Playwright injects
`-r lib/server/electron/loader.js` (which patches `app.whenReady`, appends
Chromium switch flags, removes `--remote-debugging-port=0` from `process.argv`).
When `executablePath` **is** set the loader is not injected; launch still
worked in an empirical run against the installed binary (`firstWindow` +
`close` OK) — but flags/cleanup don't apply, so prefer the default resolution.

**Browser download:** none. `_electron.launch` spawns the app's own Electron
binary and connects over the Node inspector (`--inspect=0` →
`Debugger listening on ws://…`) plus Chromium CDP (`--remote-debugging-port=0`
→ `DevTools listening on ws://…`) WebSockets; there is no `browsers.json` entry
for Electron and no `npx playwright install` step (docs `browsers` page lists
only chromium/firefox/webkit + branded channels; docs `class-electron` shows no
install).

**Windows from an Electron app:** `app.waitForEvent("window",
{ predicate })` waits for the "window" event — emitted "for every window that
is created **and loaded** in Electron" and carries a `Page` usable for
automation (docs `class-electronapplication`). `firstWindow()` is a convenience:
returns the existing window if already open, else waits for the first "window"
event. `windows()` lists all. In the **prod (no `--dev`)** run, `openDevTools()`
never runs (`src/main/index.ts:32-37` — dev branch only), so no `devtools://` window is
expected; but keeping the existing predicate (`!win.url().startsWith("devtools://")`)
is harmless and future-proofs dev-mode reuse. `app.browserWindow(page)` returns
a `JSHandle` to the real `BrowserWindow` if needed.

### 3.2 Dialog stubbing

Playwright's own docs/types sanction the assignment pattern **verbatim**
(`types.d.ts` "Mocking native dialogs" block 23439–23467; docs
`class-electron` same text): `electronApp.evaluate(({ dialog }, filePaths) => {
dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths });
}, ['/path']);` — "The replacement persists until the application is closed.
Synchronous variants (`showOpenDialogSync`, `showSaveDialogSync`,
`showMessageBoxSync`) can be stubbed the same way."
`evaluate(pageFunction, arg)` runs the function **in the main Electron
process**; first argument is the result of `require('electron')` (docs +
`coreBundle.js` constructor: it evaluates `require('electron')` on the Node
connection's default execution context). `contextIsolation: true` /
`sandbox: false` are irrelevant to this — the stub lives in the main process,
not the renderer.

**Writability on the installed Electron 41.10.4 (primary-source probe):**
`Object.getOwnPropertyDescriptor(dialog, 'showOpenDialog')` →
`{ writable: true, configurable: true, enumerable: true }` (plain function, no
getter), and `dialog.showOpenDialog = stub` **succeeds**; a subsequent call
returned the stub value. (41.10.4 `dialog` source exposes plain `export
function` entries, and the module-namespace object's methods are writable.)
One caveat: the **`dialog` property itself** on the electron module has
`configurable: false` — you cannot replace `electron.dialog` wholesale, only
mutate its methods. Identity check `require('electron').dialog ===
(await import('electron')).dialog` → `true`, so the stub set via `evaluate`
(which uses `require('electron')`) intercepts calls the app makes via dynamic
`import("electron")` — exactly what `compileCampaign.ts:168-183` and
`continuityCommands.ts:53-65` wait for (`const { dialog } = await import("electron")`).

Stub shapes the app expects (from the call sites):
- `compileCampaign.ts:…chooseSaveDirectory` → `dialog.showSaveDialog({ … })`
  expects `{ canceled: false, filePath }` (or `{ canceled: true }`).
- `continuityCommands.ts:…choosePackageDirectory` → `dialog.showOpenDialog({ …, properties: ["openDirectory"] })`
  expects `{ canceled: false, filePaths: [dir] }` (or `{ canceled: true, filePaths: [] }`).

### 3.3 UserData isolation and teardown

Where state actually lives locally:
- **localStorage `'bluewave-recent-files'`** (`recent-files.ts:3`, written
  by `writeRecentFiles`) → stored by the default session at
  `session.defaultSession.getStoragePath()` = `userData/<name>` (probe: with no
  isolation and the probe app it was `~/Library/Application Support/pw-probe`,
  verified `Local Storage/` exists there). **Leaks across tests unless isolated.**
- **`session.json` sidecar** (`campaignSessionMetadata.ts` comments) is written
  by `SaveStore` at the **save package root** chosen by the user (per
  `continuityCommands.ts:252-258` / metadata path) — i.e. under a save dir a
  test controls, **not** under `userData`.
- **In-memory `CampaignSessionRecord` maps** are per-app-process state; each
  `_electron.launch` spawns a fresh process, so no cross-test leakage (but
  persists for the duration of one app instance).

Isolation options (empirically verified on the installed binary):

| Approach | userData moves? | session storage moves? | Verdict |
| --- | --- | --- | --- |
| `--user-data-dir=<tmp>` arg via `args` | ✅ `app.getPath('userData')` = the arg dir | ✅ `getStoragePath()` = the arg dir (`Local Storage` created there) | ✅ reliable, applied before any window |
| `app.setPath('userData', tmp)` in `app.evaluate` | ✅ `getPath('userData')` updates | ❌ `getStoragePath()` **stays at the old dir** | ❌ NOT reliable — too late |

Why: Playwright returns the app only after the main script's `whenReady`
callbacks have run and windows exist, so an `evaluate` runs **after** `ready`;
Electron's own `electron.d.ts` (`app.setPath`) documents that "you have to
override the `sessionData` path before the `ready` event of the `app` module is
emitted" (cookies/caches sit under `sessionData`). A `--user-data-dir` arg is
the field-proven, race-free mechanism.

**Teardown / `app.close()`:** `close()` is documented as `Promise<void>` with
**no timeout argument** (docs `class-electronapplication`). Implementation:
`browserContext.close` → a custom close handler evaluates `({ app }) =>
app.quit()` in the main process, closes the Node transport, and waits for the
app's "close" event (`coreBundle.js…`). If the app ignores `quit()` the close
hangs until the test/worker timeout; the launcher's `gracefullyClose`→`kill()`
force-kill path (`SIGKILL` to the process group on POSIX, `taskkill /T /F` on
Win) is wired to the test runner's teardown (signal handlers + a second-close
shortcut), so orphans are *usually* reaped, but do not rely on it — use
try/finally around `app.close()` and keep `workers: 1` so one hung app can't
take others with it.

### 3.4 Version / pitfalls

- **Installed versions differ from the manifest range**: `apps/desktop/package.json` declares `@playwright/test: ^1.49.0`, but the lock/install resolved **1.62.1** (store: `@playwright+test@1.62.1`, `playwright@1.62.1`, `playwright-core@1.62.1`; Electron `41.10.4`).
- **Compatibility:** only documented statement is "Supported Electron versions are: v12.2.0+, v13.4.0+, v14+" (`types.d.ts …` + docs) — no 41/no-upper-bound caveat. Empirically 1.62.1 launcher + Electron 41.10.4 works end-to-end (launch → firstWindow → close, both with default resolution and with `executablePath`).
- **Known issue (types.d.ts block / docs):** if launch times out, ensure the `nodeCliInspect` fuse
  (`FuseV1Options.EnableNodeCliInspectArguments`) is **not** disabled — applies
  to packaged apps (the dev-dependency electron binary is not fuse-stripped — inference, not probed).
- **`--user-data-dir` subtlety:** on mac the arg is seen as `--user-data-dir=…`
  and both `userData` and `sessionData` move (`getPath('userData')` = the dir).
- **Broken install blocker (this repo):** `require('playwright/test')` fails
   (MODULE_NOT_FOUND) from `apps/desktop`; `.bin/playwright` exists but the
   `playwright` package is only in the store. Run `pnpm install` (and verify
   resolution) before `pnpm test:e2e` — the smoke test cannot run today.
- **Cold boot / timeouts:** docs say `launch({ timeout })` defaults to
  30000 ms for the app start, but the installed `coreBundle.js` constant
  `DEFAULT_PLAYWRIGHT_LAUNCH_TIMEOUT` is 180 000 ms (`3 * 60 * 1000`). On CI
  (macOS) first run includes V8/Chromium warm-up; recommend explicit
  `timeout: 60_000–120_000` in `_electron.launch` and consider raising the
  per-test `timeout` in `playwright.config.ts:5` (currently `30_000`) for
  launch-heavy specs.
- **Config options (docs `test-configuration`):** `testDir`, `testMatch`
  (default "any file that matches `.*(test|spec).(js|ts|mjs)`"), `testIgnore`,
  `projects`, `retries` (default 0), `workers`, `reporter` (default `list`),
  `outputDir` (default `test-results`), `timeout` (default 30 s), `use: {
  trace: 'on-first-retry', … }` for artifacts. Existing
  `apps/desktop/playwright.config.ts` already sets `testDir: "e2e"`, `timeout:
  30_000`, `fullyParallel: false`, `workers: 1`, `reporter: "list"` — the
  electron specs should live alongside `e2e/smoke.spec.ts`.

## 4. Recommendations (what the implementer may rely on)

1. **Launch fixture:** `const app = await electron.launch({ args:
   [outMain, `--user-data-dir=${tmpDir}`, /* no --dev */], env: {
   ...process.env, ELECTRON_RUN_AS_NODE: "" }, timeout: 90_000 })` (each
   spec/launch uses a fresh `mkdtemp`-ish dir; prove isolation by asserting
   the marker falls in the tmp dir or by launching twice with two dirs).
   Use `--user-data-dir`, **not** evaluate-`setPath`.
2. **Wait for the window** — `const win = await app.waitForEvent("window", {
   predicate: w => !w.url().startsWith("devtools://") })` (or `firstWindow()`
   when the app opens exactly one window); both give a `Page`.
3. **Stub dialogs immediately after launch:**
   `await app.evaluate(({ dialog }, paths) => { dialog.showOpenDialog = () =>
   Promise.resolve({ canceled: false, filePaths: paths }); dialog.showSaveDialog
   = () => Promise.resolve({ canceled: false, filePath: paths[0] }); }, [tmpDir])`
   — persists for the app's lifetime.
4. **Teardown:** `try { … } finally { await app.close().catch(() => {}) }`.
5. **Stay hermetic:** no dev server, no webServer config; the built bundle must
   exist (`pnpm build`/`electron-vite build` before `test:e2e`); pass
   `ELECTRON_RUN_AS_NODE: ""`.
6. **Before running:** fix the node_modules link (`pnpm install`) — today
   `playwright/test` is unresolvable from `apps/desktop`.

### Balance-target / non-normative notes

Things an implementer must **not** treat as facts already in the repo: the
exact future dialog-stub behavior on Electron ≥42 (assignment may change with
ESM exports; guard with a quick probe same as §3.2), and "cold-boot timeout"
values (see §3.4 constants vs docstring discrepancy — pass explicit timeouts).

## 5. Deferred

- **Electron ≥42 dialog module writability** — not researched (repo pins
  41.10.4; revisit if the pin moves).
- **`app.close()` timeout hardening** — no official option exists; if orphan
  processes appear on CI, track as its own ticket (candidate: pass `exitCode`
  or a pre-quit listener, or use `workers: 1` + `retries` as the guard).
- Nothing in `docs/OPEN-ISSUES.md` or DESIGN-55 conflicts with any figure
  above.
