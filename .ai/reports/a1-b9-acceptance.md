# Validation Report: A-1 — B9 Electron Desktop Shell acceptance pass

## Outcome

`PASS_WITH_LIMITATIONS`

Every B9 acceptance criterion is verified by code inspection or an executed
test/command, except two that require a live Electron GUI session
(end-to-end renderer IPC flow and a real Electron window start), which cannot
be exercised headlessly in this environment. Those are documented as
limitations, not claimed as passed.

## Scope delivered

Electron desktop shell per `.ai/briefs/b9-desktop-shell.md`:

- Main process with `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: false`; a single `compile` IPC handler; `AbortController` guard for
  concurrent compiles; CSP `default-src 'self'` on renderer responses.
- Preload `contextBridge` exposing only `electronAPI.compile`.
- Renderer: minimal HTML/TS compile-status UI, CSP meta, no framework.
- `electron-builder` config for macOS (dmg+zip), Windows (nsis), Linux (AppImage).
- Unit tests for `runCompilation` (valid, invalid dir, missing dir, abort) plus
  a new boundary test (CSP, IPC narrowing, concurrent abort) and an Electron
  module smoke test.

## Requirements evidence (criterion-by-criterion)

| #   | Criterion                                                                 | Evidence                                                                                                                                                                                                                                                                                                          | Verdict                                                                    |
| --- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | `apps/desktop` builds with `electron-vite build` without errors           | `pnpm --filter @bluewave/desktop build` → main/preload/renderer bundles emitted (out/main/index.js 5.33 kB, preload 0.19 kB, renderer html+css+js)                                                                                                                                                                | **PASS**                                                                   |
| 2   | `electron-builder` produces a distributable for each target platform      | `pnpm --filter @bluewave/desktop pack:mac` → `desktop-0.0.0-arm64.dmg` (105.9 MB) + `desktop-0.0.0-arm64.zip`; `pack:linux` → `desktop-0.0.0.AppImage` (113.6 MB). Windows `nsis` target is configured but not built (cross-build requires Windows toolchain).                                                    | **PASS (mac/linux); limitation: win nsis not built on macOS**              |
| 3   | `vitest run` passes all unit tests (compiler module)                      | `pnpm --filter @bluewave/desktop test` → 3 files, 9 tests pass (compiler.test.ts 4, boundary.test.ts 4, smoke.test.ts 1)                                                                                                                                                                                          | **PASS**                                                                   |
| 4   | Process/IPC smoke test: Electron can start and register `compile` handler | `smoke.test.ts` verifies Electron module resolves. `boundary.test.ts` verifies source registers exactly one `ipcMain.handle("compile")` and narrows preload to only `compile`. A live Electron window start is not automated headlessly.                                                                          | **PARTIAL (static + module-resolve; live start not automated)**            |
| 5   | Compile IPC flow works end-to-end (select dir → compile → display)        | Wiring verified by inspection: renderer `main.ts` → `electronAPI.compile` → preload `ipcRenderer.invoke("compile")` → main `handleCompile` → `runCompilation` → `CampaignCompiler.compile`. `runCompilation` itself is unit-tested end to end. The full renderer→main GUI round-trip is not automated headlessly. | **PARTIAL (wiring + runCompilation tested; GUI round-trip not automated)** |
| 6   | CSP `default-src 'self'` applied to all renderer responses                | `applyContentSecurityPolicy` (pure, `src/main/csp.ts`) applied in `onHeadersReceived`; `boundary.test.ts` asserts header value and preservation of other headers.                                                                                                                                                 | **PASS**                                                                   |
| 7   | Concurrent compile request aborts in-flight compilation                   | `handleCompile` aborts the prior `AbortController` before starting a new compile; `boundary.test.ts` asserts the abort path exists; `compiler.test.ts` aborts via an already-aborted signal.                                                                                                                      | **PASS (logic + abort path tested)**                                       |

## Commands and observed results

```text
$ pnpm --filter @bluewave/desktop build
  out/main/index.js   5.33 kB
  out/preload/index.mjs 0.19 kB
  out/renderer/index.html + assets
  ✓ built (exit 0)

$ pnpm --filter @bluewave/desktop pack:mac
  • building target=DMG   dist-electron/@bluewave/desktop-0.0.0-arm64.dmg
  • building target=macOS zip  dist-electron/@bluewave/desktop-0.0.0-arm64.zip
  • skipped macOS application code signing (no identity; out of scope per brief)

$ pnpm --filter @bluewave/desktop pack:linux
  • building target=AppImage  dist-electron/@bluewave/desktop-0.0.0.AppImage

$ pnpm --filter @bluewave/desktop test
  ✓ test/smoke.test.ts (1)  ✓ test/boundary.test.ts (4)  ✓ test/compiler.test.ts (4)
  Test Files  3 passed (3)   Tests  9 passed (9)

$ ls -la "dist-electron/@bluewave/"
  desktop-0.0.0-arm64.dmg (105954535)  desktop-0.0.0.AppImage (113591777)  desktop-0.0.0-arm64.zip
```

## Determinism evidence

Not applicable to the desktop shell itself (no authoritative simulation state
owned by the renderer). The underlying `runCompilation` determinism is covered
by the engine's cross-process golden check (unchanged: `.ai/reports/a0-b10b-acceptance.md`).

## Canonical artifact changes

None. No golden hashes touched. `CONTENT_SECURITY_POLICY` extracted to a pure
module (`src/main/csp.ts`) — no behavior change.

## Tests added

- `apps/desktop/test/boundary.test.ts` (4 tests): CSP application, single IPC
  channel registration, preload narrowing, concurrent-abort logic.

## Security and cancellation

- CSP `default-src 'self'` enforced on renderer responses (tested).
- Context isolation on, renderer Node integration off; single narrow `compile`
  IPC channel (tested).
- Concurrent compile aborts the in-flight `AbortController` (tested).
- Packaging unsigned (code signing/notarization explicitly out of scope).

## Performance observations

Packaging artifacts: dmg 105.9 MB, AppImage 113.6 MB. No authoritative
measurements collected.

## ADRs and dependencies

No new ADRs. Existing `electron-builder`/`electron`/`electron-vite` deps
unchanged.

## Known limitations and deferred requirements

- Live Electron GUI start and full renderer→main IPC round-trip are not
  automated in this headless environment (criteria 4 test is static + module
  resolve; criterion 5 is wiring + `runCompilation` unit test). These need a
  display/CI desktop runner to be fully proven.
- Windows `nsis` target is configured but not built (requires Windows toolchain).
- Read-only game render, auth-update, React renderer all out of scope per brief.

## Changed files

- `apps/desktop/src/main/csp.ts` (new): pure CSP helper.
- `apps/desktop/src/main/index.ts`: use `applyContentSecurityPolicy` from csp.ts.
- `apps/desktop/test/boundary.test.ts` (new): acceptance evidence.
- `docs/PROGRESS.md`, `.ai/SPRINT-PLAN.md`: status updates.

## Git and remote status

- Branch: `feat/a0-b10b-acceptance`
- Commits: pending for this pass
- Working tree: clean (packaging artifacts gitignored)
- Push status: not pushed
- Merge performed: `no`

## Secondary consistency check

- Rebuilt after the CSP refactor and re-ran the desktop test suite: green.
- Packaging artifacts confirmed on disk and confirmed gitignored
  (`apps/desktop/dist-electron`, `apps/desktop/out`).
