# ADR-0029: Desktop Debug-Only Screens Gated Behind Build-Time Debug Mode

## Status

Accepted 2026-08-16

## Context

The desktop campaign shell ships three developer tooling screens that make sense
only for debugging / development, not for players: **Simulation & Turn**,
**Tactical Sandbox**, and **Debugging & Telemetry**. They render engine-backed
simulation, deterministic battle auto-resolution, and wide-event telemetry.
Keeping them visible (and their code reachable) in the shipped product exposes
developer surfaces to end users and fattens the production payload with
developer-only functionality.

Two candidate strategies were offered (project owner):

1. **Two invoking scripts / two versions** — a debug build and a production
   build split at build time.
2. **Single script + a togglable Option** — one build; the debug screens appear
   only when a runtime Options toggle is on.

A build-time separation (option 1) is the correct choice for this codebase:

- **Security / product posture.** Debug tooling should never ship to players. A
  runtime toggle still ships the debug screens (and their lazy chunks) in every
  installed app, where they are one flag-flip away from the surface. Gating at
  build time keeps them out of the production bundle's **runtime registry so the
  production app never renders, searches, or routes to them** (see Decision 2).
- **Consistency with precedent.** The repo already excludes a dev-only screen
  this way: the throwaway Map Prototype is registered only behind
  `import.meta.env.DEV`
  (`apps/desktop/src/renderer/shell/campaign-screen-registry.tsx`), and the
  delete-contract README frames it as "never registered in a production build, so
  a stray merge cannot ship a fixture world to players."
- **Deterministic and auditable.** Which screens exist in a given artifact is
  fixed at build time and verifyable from the produced bundle, rather than being
  runtime/user state (ENGINEERING-CONTRACT §Authority).

This ADR records the debug-mode rule and the build-gating approach chosen.

## Decision

1. **Debug mode is a build-context flag.** A screen is present when
   `import.meta.env.DEV` is true (dev server / test) **or**
   `import.meta.env.VITE_BLUEWAVE_DEBUG === "true"` (a flagged non-dev build).
   The pure rule lives in
   `apps/desktop/src/renderer/shell/debug-mode.ts` (`isDebugMode`) and is
   unit-tested. This yields the "two versions" story from a single codebase:
   - `pnpm dev` → debug screens shown;
   - `pnpm build` / `pnpm pack:*` → debug screens **excluded**;
   - `VITE_BLUEWAVE_DEBUG=true pnpm build` → a debug-enabled build with the
     screens included (e.g., for a local test artifact).
2. **Gate at build time via the registry spread, not a runtime filter.** The
   three debug screens are declared as `CAMPAIGN_SCREEN_REGISTRY` entries inside
   `...(cond ? [...] : [])` spreads gated on the debug-mode constant, mirroring
   the Map Prototype's `import.meta.env.DEV` guard. Vite/Rolldown constant-folds
   the guard in a production build, so the debug registry entries — and thus the
   sidebar entry, global-search target, and route — are absent from the runtime
   registry. A runtime `filter()` was considered and rejected because the array
   literal still carried the debug entries' labels and routes into the bundle.
3. **The debug screens are not reachable in a production build.** Production
   passes of the registry contain only the seven core screens (`overview`,
   `construction`, `fleet`, `research`, `diplomacy`, `campaign-preferences`,
   `options`); `simulation`, `tactical-sandbox`, and `debugging` are folded out
   (verified in the emitted bundle: `id: "simulation"` etc. are absent).

## Consequences

- **Positive.** Production apps never surface or route to developer tooling; the
  debug/build distinction is declarative, single-source (`debug-mode.ts` +
  registry), and auditable from the artifact. Adding a future dev-only screen is
  a one-line registry change.
- **Known limitation (accepted, matches Map Prototype popularity).** The
  production build still *emits* the debug screens' lazy chunks as unreferenced
  orphans because Rolldown retains lazy `import()` chunks in the module graph
  even when their only referencing route is dead-folded. They are dead weight
  (never loaded at runtime — nothing references them), and the Map Prototype has
  the same behaviour with its ~7 MB chunk. A future optimization could prune
  orphaned lazy chunks; it is not required for the correctness of this gate.
- **No engine/campaign/simulation code is affected.** This changes only the
  desktop renderer screen registry; authoritative outcomes and golden hashes are
  untouched (change is UI-navigation-only).