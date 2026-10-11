# ADR-0121: Desktop shell hardening — renderer recovery, single instance, and a bounded flushing quit

## Status

Accepted 2026-10-11.

## Context

The Electron shell could leave a **blank window that never recovers or closes**:
a crashed or unresponsive renderer, or a renderer whose content came from a dead
Vite dev server, was never detected or torn down. There was also no
single-instance guard, and no shutdown step that lets a deferred write finish, so
a quit could race the drawing-board draft autosave (ADR-0082).

ADR-0120 removed the darwin `window-all-closed` exemption and quit on
SIGINT/SIGTERM. This ADR covers the remaining shell lifecycle gaps.

## Decision

1. **Recover, or fail loudly — never a blank window.** The window recovers from a
   `render-process-gone`, an `unresponsive` window, or an actionable main-frame
   `did-fail-load` by reloading at most `MAX_RENDERER_RECOVERIES` times; past
   that it shows an error dialog and quits. In development a failed main-frame
   load means the Vite dev server is gone, so the shell quits rather than
   reloading into nothing. The policy (which failures are actionable, how many
   reloads are allowed) is a pure, unit-tested module, `src/main/shellPolicy.ts`.
2. **Single instance.** `app.requestSingleInstanceLock()` gates startup; a second
   launch focuses and restores the running window instead of starting a rival
   instance.
3. **Bounded, state-flushing quit.** On `before-quit` with a live window, the
   shell asks the renderer to flush (`app:quit-flush`) and waits for
   `app:quit-flush-complete` or `QUIT_FLUSH_TIMEOUT_MS` (1.5 s), then proceeds —
   so a quit can never hang on an unresponsive renderer. The renderer runs a
   registered flush set (`src/renderer/lib/app-flush.ts`); the drawing-board draft
   autosave registers its pending write, so quitting mid-edit does not drop it.
4. **Preload surface.** The bridge gains optional `onQuitFlush` /
   `notifyQuitFlushComplete` methods (optional so existing test doubles are
   unaffected); the real preload always provides them.

## Consequences

- A crashed renderer reloads once and, failing that, surfaces an error and quits;
  no state leaves the app showing an unrecoverable white window.
- Only one instance runs per user-data directory; relaunching focuses the window.
- Quitting with unsaved drawing-board edits flushes them, bounded to 1.5 s.
- Development no longer leaves an orphaned blank window when the dev server stops.
- The `e2e`/`snap` harnesses pass a distinct `--user-data-dir`, so the
  single-instance lock never collides between test launches and a running dev app.

## Alternatives considered

- **Reload forever on renderer failure.** Rejected: a persistently failing
  renderer would spin instead of telling the user.
- **Quit immediately on the first failure.** Rejected: a transient crash (e.g. the
  GPU process) would discard the session; one reload covers the common case.
- **Rely on the renderer's `beforeunload` for flush.** Rejected: it cannot await
  an async IPC write, and does not fire for every quit path; an explicit,
  main-driven handshake is deterministic and bounded.
- **No single-instance lock.** Rejected: two instances sharing one user-data
  directory corrupt each other's sessions.
