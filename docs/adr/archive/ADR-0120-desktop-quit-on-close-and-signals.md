# ADR-0120: The desktop app quits on window close and on termination signals

## Status

Accepted 2026-10-11.

## Context

The Electron shell's lifecycle could leave an orphaned, blank window behind.

- `window-all-closed` intentionally did nothing on darwin (the macOS convention
  that an app stays resident with no windows), and the app never installed an
  application menu, so there was no obvious "quit" affordance in-window.
- In development the process chain is `pnpm → turbo → electron-vite → Electron`.
  Stopping the dev run (Ctrl+C) did not reliably reap the Electron child. The
  surviving window still pointed at `http://localhost:5173`, which is served by
  the now-dead Vite dev server, so it rendered blank and stayed in the Dock.

The observable result: stopping `pnpm dev` left a blank white window open. This
is a single-window desktop game, not a multi-document app, so a resident headless
process has no value.

## Decision

1. **Quit on last window close, on every platform.** `window-all-closed` calls
   `app.quit()` unconditionally; the `process.platform !== "darwin"` exemption is
   removed.
2. **Quit on termination signals.** The main process listens for `SIGINT` and
   `SIGTERM` and calls `app.quit()`, so a stopped dev run tears the window down
   instead of orphaning it.

## Consequences

- Closing the window (Cmd+W, the macOS close button, or the non-macOS custom
  control) exits the app; stopping the dev server closes the window too.
- Diverges from the macOS "stay resident without windows" convention — a
  deliberate choice for a single-window game, where the expected close is a full
  quit.
- The `activate` recreate path is now only relevant while a window is already
  open; re-launching from the Dock still boots through `whenReady`.

## Alternatives considered

- **Keep macOS residency and add a menu Quit.** Rejected: still leaves a blank
  window when the dev server is stopped (no signal handling), and a single-window
  game gains nothing from residency.
- **Handle signals only.** Rejected: closing the window on macOS would still leave
  a Dock-resident, headless process.
