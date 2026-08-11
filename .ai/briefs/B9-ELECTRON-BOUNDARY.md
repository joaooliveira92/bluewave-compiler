# Milestone B9: Electron Desktop Boundary

## Objective

Add a minimal secure Electron desktop shell (`apps/desktop`) with strict main/preload/renderer separation, a single `compile` IPC channel, strict CSP, and a process-boundary smoke test. The desktop app opens a directory of content YAML, compiles it via the existing `CampaignCompiler`, and displays the result.

## Canonical requirements

BW-ARC-001, BW-ARC-002, BW-RUL-002, BW-SEC-001.

## Starting state

The repository implements B0-B8 with 154 passing tests, cross-process determinism proven, CI pipeline active, and golden hash references committed. No Electron, Electron-vite, or desktop packaging exists. The compiler-cli app exists at `apps/compiler-cli`.

## In scope

- Electron app at `apps/desktop` using `electron-vite`.
- Strict main/preload/renderer boundary: renderer never imports engine packages or filesystem APIs.
- Single `compile` IPC channel: opens a content directory dialog, compiles via `CampaignCompiler`, returns result.
- Preload script exposes only the `compile` channel via `contextBridge`.
- Strict Content Security Policy: `default-src 'self'`.
- Process/IPC smoke test verifying app starts, responds to compile IPC, and exits cleanly.
- The main process depends on `@bluewave/campaign`, `@bluewave/content-compiler`, `@bluewave/content-schema`, `@bluewave/diagnostics`, `@bluewave/deterministic`, `@bluewave/contracts`.
- main process compilation bundled by electron-vite using esbuild, resolving from built workspace packages.
- Timer, AbortSignal, and concurrency guard on repeated compile requests.

## Out of scope

- Renderer React or UI framework — MVP uses vanilla HTML/JS.
- Multiple IPC channels beyond `compile`.
- File save/load, turn execution, or replay from the desktop app.
- Production packaging or code signing (dmg/nsis/AppImage).
- Authority claims about the desktop app.

## Required implementation

### Main process (`src/main/index.ts`)

- Creates a `BrowserWindow` with `webPreferences.preload` pointing to the preload script, `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Sets CSP header: `default-src 'self'`.
- Registers `ipcMain.handle('compile', ...)` that:
  - Opens a directory dialog (`dialog.showOpenDialog`).
  - Reads the YAML fixture files from the selected directory.
  - Instantiates `CampaignCompiler`, compiles the fixture.
  - Returns compiled state summary (snapshot hash, nation names, success/failure, diagnostics).
  - Guards against concurrent compiles with an `AbortController` — a second compile request aborts the first.
  - Handles errors gracefully and returns them as structured diagnostics.
- App `ready` event handler does not open devtools in production mode.

### Preload script (`src/preload/index.ts`)

- Uses `contextBridge.exposeInMainWorld` to expose:
  ```ts
  electronAPI: {
    compile: () => Promise<CompileResult>
  }
  ```
- No other channels or capabilities exposed.

### Renderer (`src/renderer/`)

- Minimal `index.html` with:
  - A "Compile Campaign" button.
  - A `<pre>` or `<div>` to display compile results.
- Inline JavaScript that calls `window.electronAPI.compile()` on button click and renders the result.
- No React, no framework, no additional dependencies.
- CSP must allow inline styles if any are used.

### Configuration

- `electron.vite.config.ts`: configures main, preload, and renderer. Main and preload use esbuild Node target. Renderer uses Vite with `base: './'`.
- `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json` as per electron-vite conventions, extending the repo's base config.
- `package.json` with scripts: `dev` (electron-vite dev), `build` (electron-vite build), `test`, `typecheck`.

## Acceptance tests

1. Unit test: compile handler function, given valid fixture paths, returns a successful `CompileResult` with snapshot hash.
2. Unit test: compile handler, given invalid fixture, returns `CompileResult` with errors and no hash.
3. Unit test: concurrent compile guard aborts the first when a second is initiated.
4. Process/IPC smoke test: start Electron app via `electron .` with a test script that sends `compile` IPC, verifies response, exits with code 0.
5. CSP header is set on the renderer window.
6. Preload exposes exactly one channel (`compile`) on `window.electronAPI`.

## Determinism proof

The desktop app is not authoritative. No determinism proof required beyond what B0-B8 already provide. The compile IPC calls the same deterministic `CampaignCompiler` — if the compiler's determinism changes, B0-B8 tests catch it.

## Compatibility and versions

- No on-disk format changes.
- No new compatibility versions.
- The desktop app pins the same Node.js version as the repo.
- electron-vite and Electron versions are specified in `apps/desktop/package.json`.

## Stop conditions

- If electron-vite cannot resolve workspace packages, stop and assess whether the main process needs a separate build step or external configuration.
- If Electron sandbox prevents the preload from using `contextBridge`, document the limitation and proceed with `sandbox: false` for MVP.
- If the CSP blocks necessary inline content for the MVP renderer, document the specific exception and keep the rest strict.
- Do not add React, routing, IPC channels beyond `compile`, filesystem access in the renderer, or any renderer import of engine packages.

## Required delivery

- `apps/desktop/` with electron-vite setup, main, preload, renderer.
- `@bluewave/desktop` package in workspace.
- CSP configuration in main process.
- Smoke test and unit tests.
- ADR for Electron boundary architecture.
- Updated root `tsconfig.json` references.
- Validation report.
- Changed-file summary.
- Small Conventional Commits.
- Pull-request description when remote access exists.