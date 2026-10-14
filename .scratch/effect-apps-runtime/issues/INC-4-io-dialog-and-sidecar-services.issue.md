# INC-4 — IO, dialog and sidecar services

**Type:** implementation
**Status:** open
**Blocked by:** INC-1
**Frontier:** no

**What to build:** Model the remaining IO edges and sidecars as services —
`NativeDialog` (the genuinely-async `showSaveDialog`/`showOpenDialog` wrapper),
`AppPaths` (userData/support/artifact directories), `Clock` (the injectable
`now: () => new Date()` seam), `UiStateStore`, `ReportsStore`, `DraftStore`, and
`CrashReporter` — and migrate their call sites to resolve them from context.

## Acceptance criteria

- [ ] `NativeDialog`, `AppPaths`, `Clock`, `UiStateStore`, `ReportsStore`,
      `DraftStore` and `CrashReporter` are `Context.Service` values (ERA-R3).
- [ ] The native-dialog call sites (`compileCampaign`'s save prompt, the continuity
      package prompt, `copyCampaign`'s copy prompt) resolve `NativeDialog` and return
      the same cancellation outcomes (`SAVE_LOCATION_CANCELLED`,
      `PACKAGE_SELECTION_CANCELLED`) (ERA-R5).
- [ ] The crash-support path resolves `CrashReporter` + `AppPaths` + `Clock`; the
      bounded shutdown still flushes and exits within the existing timeout.
- [ ] Sidecar read/write call sites (`readUiState`/`writeUiState`, `readMonthlyReports`,
      `readDrawingBoardDraft`/`writeDrawingBoardDraft`) resolve their services;
      `BridgeResult` JSON is byte-identical (ERA-R18).
- [ ] `pnpm preflight` and the desktop main test suite are green.

## Notes for implementator

- `native dialog`, `app.whenReady()` and the devtools dynamic import are the only
  genuinely async seams in main; everything else is synchronous `node:fs` behind an
  `Effect` method.
- Electron imports for dialogs stay dynamic (`await import("electron")`) inside the
  service layer, exactly as today, so the test layer can substitute a fake.
