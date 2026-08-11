# B9 Milestone: Electron Desktop Shell

## Scope

### App package

- `apps/desktop` already exists as an `electron-vite` workspace package.
- Electron main/preload/renderer separation is already implemented.

### Main process

- Already implemented: `BrowserWindow` with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`.
- One `compile` IPC handler registered via `ipcMain.handle`.
- `AbortController` guard for concurrent compiles.
- CSP `default-src 'self'` on all responses.

### Preload

- Already implemented: `contextBridge.exposeInMainWorld` with one channel: `electronAPI.compile`.

### Renderer

- Minimal HTML/TypeScript UI showing compile status and diagnostics as text.
- No React, no framework, no read-only game render.
- CSP-compliant.

### Compile IPC flow

- Renderer -> preload -> main -> `runCompilation` -> `CampaignCompiler.compile()` -> `CompileResult`.
- Directory dialog opens via Electron `dialog.showOpenDialog`.

### Testing

- Unit tests for `runCompilation` (valid, invalid, missing dir, abort signal).
- Process/IPC smoke test verifying Electron can start and register IPC handlers.

### Packaging

- `electron-builder` to produce distributable installers.
- Targets: macOS `dmg` + `zip`, Windows `nsis`, Linux `AppImage`.
- Config stub in `electron-builder.yml` at `apps/desktop/`.
- Icon placeholders and macOS entitlements files.

## Out of scope

- Read-only render of compiled game content (deferred).
- Electron auto-update mechanism (can be added post-MVP).
- React or any renderer framework.
- Multiple IPC channels (only `compile` for MVP).
- Production code signing or notarization.
- Any gameplay logic, campaign execution, or battle resolution.

## Acceptance criteria

1. `apps/desktop` builds with `electron-vite build` without errors.
2. `electron-builder` produces a distributable for each target platform.
3. `vitest run` passes all unit tests (compiler module).
4. Process/IPC smoke test passes (Electron can start and register `compile` handler).
5. Compile IPC flow works end-to-end: select a content directory -> compile -> display result.
6. CSP header `default-src 'self'` is applied to all renderer responses.
7. Concurrent compile request aborts in-flight compilation.

## Stop conditions

- Build toolchain (electron-vite or electron-builder) has an unresolvable platform-specific issue.
- CSP policy blocks legitimate compiler output rendering.
- Electron runtime cannot be resolved in CI for smoke tests.
- IPC channel cannot be narrowed to a single `compile` handler.
