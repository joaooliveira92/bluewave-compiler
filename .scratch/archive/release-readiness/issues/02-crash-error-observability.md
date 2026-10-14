# 02 — Crash / error observability

**Type:** decision + implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no
**Spec:** `.scratch/release-readiness/spec.md`

## Scope

Decide whether the shipped desktop app reports failures, and if so how — offline and
single-player, so privacy and consent matter. Minimum: uncaught exception/rejection
handling in main + renderer that writes a local, user-visible support bundle, with an
explicit opt-in for any network reporting.

## Acceptance

- A decision (ADR) on local-only vs opt-in reporting, with the privacy stance stated.
- Main and renderer install global handlers that never hide a failure silently.
- A "save a support bundle" path the user can share; verified by a test that forces a
  crash and asserts the bundle is produced.
- No network call without explicit consent.

## Out of scope

- A hosted crash service. This decides the policy and wires local capture.

## Resolution

**Decision: local-only support bundle, no network reporting; any future remote
reporting is strictly opt-in and default-off — `docs/adr/ADR-0133-crash-error-observability.md`.**

- `apps/desktop/src/main/crashSupport.ts` (runtime-free; Node builtins + `Schema`)
  writes a user-shareable JSON bundle to `<userData>/support/` (error message +
  stack, app version, platform/arch, pid, timestamp, and a "no network" note —
  **no** save contents or player data). `installProcessCrashHandlers` wires
  `uncaughtException`/`unhandledRejection`, writes the bundle, prints it, and
  calls back to quit — a failure is never hidden.
- `apps/desktop/src/main/index.ts` installs the handlers and surfaces the bundle
  path in the error box; `ipcMain.on("support:report-crash", …)` validates the
  renderer payload via `Schema` before writing.
- `apps/desktop/src/renderer/lib/crash-report.ts` installs `error` /
  `unhandledrejection` listeners that `console.error` and forward a bounded
  payload through the preload bridge (`reportCrash`); installed in
  `renderer/main.tsx`.
- **Tests forcing a crash:** `apps/desktop/src/main/crashSupport.test.ts` (5
  tests: bundle contents, unwritable-dir null+log, `uncaughtException` /
  `unhandledRejection` through a fake emitter → bundle exists + `onFatal`, IPC
  schema accept/reject) and `renderer/lib/crash-report.test.ts` (4 tests). All 9
  pass. `pnpm --filter @bluewave/desktop typecheck` clean.
- No network call is made anywhere in the capture path (ADR-0133 §3).
