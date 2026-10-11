# ADR-0118: React DevTools are an opt-in dev dependency kept out of the production main bundle

## Status

Accepted 2026-10-11.

## Context

The desktop app is an Electron shell that renders React. In development React logs
its "Download the React DevTools…" notice, and there is no React tab in the
DevTools window, because a browser extension cannot attach to Electron the way it
attaches to a browser; the extension has to be installed into the app's session.

`electron-devtools-installer` does exactly that. Introducing it raised two
concerns:

- **Production payload.** The main process is built with
  `externalizeDepsPlugin()`, which externalizes `dependencies` but *bundles*
  `devDependencies`. A static import of a dev-only installer therefore compiled
  ~318 KB (≈13.5% of `out/main/index.js`, from `jszip`, `yaku` and `mkdirp`) into
  the production main process for a tool that only ever runs in development.
- **Hermeticity / supply chain.** The installer downloads a CRX from the Chrome
  Web Store at runtime with no integrity pin, transitively pulling
  `unzip-crx-3` → `jszip`/`yaku`/`mkdirp@0.5.1`. That is acceptable only if it is
  strictly dev-only and never runs on a normal `pnpm dev`.

## Decision

1. **Dev-only and opt-in.** The extension is installed only when the app is in
   development *and* the panel is requested — either debug mode is on (the
   `VITE_BLUEWAVE_DEBUG=true` flag, `pnpm dev:debug`) or the dedicated
   `VITE_BLUEWAVE_DEVTOOLS=true` flag is set (`pnpm dev:devtools`, which does not
   enable the debug screens). The debug-mode path is read in the main process
   through `isDebugModeEnabled()` (`apps/desktop/src/main/debugGate.ts`), the same
   build-time constant that gates the renderer debug screens (ADR-0029). Plain
   `pnpm dev` performs no network fetch.
2. **Externalized, loaded lazily.** `electron-devtools-installer` is an exact-pinned
   `devDependency` (dependency policy, ADR-0107) listed in `main.external` in
   `electron.vite.config.ts`, and imported with a dynamic `import()` inside the
   debug guard. The production main bundle carries neither the installer nor its
   transitive dependencies, and the import is never evaluated in production, so it
   is never `require`d at packaging time.
3. **Failure is non-fatal.** A failed install logs a warning and the app continues;
   React DevTools are a convenience, never a startup dependency.

## Consequences

- Production `out/main/index.js` drops the installer's bytes (verified:
  2,362,875 → 2,044,554, ≈ −318 KB); the bundle shrinks and a dev tool never
  reaches players.
- `pnpm dev:debug` (or `pnpm dev:devtools`) gets a working React tab; `pnpm dev`
  stays hermetic (no startup network call), at the cost of the React notice
  remaining in plain dev.
- The Chrome-Web-Store fetch (unpinned CRX) is confined to an explicit,
  developer-invoked mode.

## Alternatives considered

- **Static import plus a `dependencies` entry.** Rejected: ships ~318 KB of dev
  tooling inside the production main process.
- **Always install in development.** Rejected: a hidden network fetch on every
  `pnpm dev`, breaking offline and CI hermeticity.
- **Load a locally unpacked CRX.** Rejected: machine-specific, no pinned artifact,
  more moving parts than the documented installer.
