# ADR-0008: Electron Desktop Boundary

## Status

Accepted

## Context

The Bluewave engine and compiler are ready for a desktop application boundary. The ENGINEERING-CONTRACT.md mandates strict main/preload/renderer separation, context isolation, no renderer Node integration, and narrow Zod-validated IPC channels. The B9 milestone introduces the first Electron desktop shell.

## Decision

### App package

Create `apps/desktop` as a new workspace package with `@bluewave/desktop` name. Use `electron-vite` as the build tool, which provides separate main/preload/renderer build pipelines with esbuild and Vite.

### Main process

- Creates a `BrowserWindow` with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`.
- Registers a single `compile` IPC handler via `ipcMain.handle`.
- The compile handler delegates to a pure `runCompilation` function in `src/main/compiler.ts` that is testable without Electron.
- An `AbortController` guard prevents concurrent compiles — a new request aborts the in-flight one.
- Sets `Content-Security-Policy: default-src 'self'` on all responses via `session.webRequest.onHeadersReceived`.

### Preload

- Uses `contextBridge.exposeInMainWorld` to expose exactly one channel: `electronAPI.compile`.
- No other channels, capabilities, or raw `ipcRenderer` access exposed.

### Renderer

- Minimal HTML page with a "Compile Campaign" button and a `<pre>` output area.
- Vanilla TypeScript, no React, no framework.
- CSP-compliant (inline styles allowed for MVP).

### Compile IPC flow

1. Renderer calls `window.electronAPI.compile()`.
2. Preload forwards via `ipcRenderer.invoke('compile')`.
3. Main process receives the event, opens a directory dialog (or uses the provided path).
4. Reads YAML content from the selected directory.
5. Calls `CampaignCompiler.compile()` with the parsed content.
6. Returns `CompileResult` with success flag, snapshot hash, content hash, nation list, and diagnostics.

### Testing

- Unit tests for `runCompilation` cover valid compilation, invalid input, missing directory, and abort signal.
- Process/IPC smoke test verifies the Electron shell can start and register IPC handlers.
- The compile logic unit tests do not require a display or Electron runtime.

## Consequences

- The desktop app follows the repo's security and architecture constraints.
- Compile logic is testable without Electron, keeping tests fast and CI-compatible.
- Adding new IPC channels (save, load, execute turn) later requires a preload change and a new `ipcMain.handle` registration in the main process.
- The `sandbox: false` setting is required for the preload to use `contextBridge` with `electron-vite`'s bundling; if a future Electron version supports `sandbox: true` with `contextBridge`, this should be tightened.
- The renderer is deliberately minimal — no React, no authoritative state, no filesystem access.
- CSP `default-src 'self'` may need refinement as the renderer grows (e.g., loading web fonts or external assets).

## Related ADRs

- ADR-0001: Monorepo structure and package boundaries
- ADR-0006: Campaign package and aggregate architecture