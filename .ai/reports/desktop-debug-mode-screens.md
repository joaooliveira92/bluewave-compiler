# Validation Report: Desktop Debug-Only Screens Gate

## Outcome

`PASS`

## Sprint / scope delivered

New desktop renderer sprint (project owner request): **Simulation & Turn**,
**Tactical Sandbox**, and **Debugging & Telemetry** are developer-only surfaces
and must appear only when the app is in a debug build.

Strategy chosen (owner offered two; decision in ADR-0029): **build-time
separation via a debug-mode flag** — a single codebase delivering two /versions/,
rather than a runtime Options toggle. Rationale: debug tooling should never ship
to players (a runtime toggle still ships it, one flag-flip from the surface), and
it matches the existing `import.meta.env.DEV` Map Prototype precedent.

### Changes

- **`apps/desktop/src/renderer/shell/debug-mode.ts`** (new) — the pure, tested
  rule: a screen is present when `import.meta.env.DEV` is true **or**
  `VITE_BLUEWAVE_DEBUG === "true"` (`isDebugMode`).
- **`campaign-screen-registry.tsx`** — the three debug screens are declared as
  registry entries inside `...(cond ? [...] : [])` spreads gated on the
  debug-mode constant (mirroring the Map Prototype guard) instead of as plain
  entries. This lets the bundler fold the branch out of a production build, so
  the registry, sidebar (`CAMPAIGN_SCREENS`), global search
  (`CAMPAIGN_SCREEN_SEARCH_TARGETS`), and route map all exclude them.
- **`debug-mode.test.ts`** (new) + **`campaign-screen-registry.test.tsx`** —
  unit tests for the rule and registry membership.
- **`docs/adr/ADR-0029-desktop-debug-mode-screens.md`** (new).

## Approach decision (owner asked the agent to choose)

Rejected option 2 (runtime Options toggle): the toggle ships the debug screens'
code in every installed app and makes exposure user/runtime state rather than a
fixed, auditable build property, and it would require wiring new shell/environment
state. Chosen option 1 (build-time) as a **debug-mode flag**:

1. `pnpm dev` → debug screens shown.
2. `pnpm build` / `pnpm pack:*` → debug screens **excluded** (production).
3. `VITE_BLUEWAVE_DEBUG=true pnpm build` → debug-enabled build, screens included.

Recorded as ADR-0029.

## Validation evidence (exact commands + observed results)

All run in `apps/desktop` unless noted.

- `pnpm typecheck` → clean (no output / exit 0).
- `pnpm test run src/renderer/shell/debug-mode.test.ts src/renderer/shell/campaign-screen-registry.test.tsx`
  → 2 files / 24 tests passed (incl. routing of the three debug screens in the
  dev test env).
- `pnpm test` (full suite) → 49 files / 360 tests passed.
- `pnpm lint` → "Found 0 warnings and 0 errors".
- `pnpm exec vp fmt --check <changed files>` → "All matched files use the correct
  format".
- Production-build verification (`pnpm build`, NODE_ENV production, no debug flag):
  - emitted `out/renderer/assets/index-*.js` contains `id: "overview"`,
    `id: "construction"`, `id: "fleet"`, `id: "research"`, `id: "diplomacy"`,
    `id: "campaign-preferences"`, `id: "options"` → **true**;
    `id: "simulation"`, `id: "tactical-sandbox"`, `id: "debugging"` → **false**.
    The three debug screens are folded out of the runtime registry (and thus the
    sidebar, search, and routes) in production.
  - The registry's first debug spread compiled to `...[]`, confirming the guard
    constant-folded.
- Debug-enabled-build verification (`VITE_BLUEWAVE_DEBUG=true pnpm build`):
  `id: "simulation" → true`, `id: "tactical-sandbox" → true`,
  `id: "debugging" → true` in the emitted index — the debug "version" includes
  them. One codebase, two build variants.

## Known limitation (accepted, not corrected)

The production bundle still **emits** the debug screens' lazy chunks as
unreferenced orphans (Rolldown retains lazy `import()` chunks even when their
only referencing route is dead-folded). They are never loaded at runtime —
nothing in the runtime graph references them — and the pre-existing Map Prototype
chunk (`MapPrototypeScreen-…js`, ~7 MB) behaves identically. So the production
app never renders, searches, or routes to a debug screen; the orphans are dead
weight only. Documented in ADR-0029. Authoritative engine/combat/campaign outcomes
and golden hashes are unaffected (UI-navigation-only change).

## Unrelated pre-existing condition (not introduced here)

`pnpm format` (repo-wide, `vp fmt --check .`) flags ~19 files I did not touch
(e.g. `apps/desktop/e2e/smoke.spec.ts`, `playwright.config.ts`,
`new-game/utils/campaign-seed.ts`, `nation-selection/slotBridge.ts`,
`packages/phase-engine/test/battle-resolution-phase.test.ts`, `prototype/…`).
They are unchanged on `HEAD` (git status) and outside this sprint's scope; I
formatted only this sprint's files. This is logged for a separate hygiene pass.

## Concurrent sprint note

A background agent is independently progressing the **C-1 Torpedoes** research
sprint (`.ai/SPRINT-PLAN.md` and `docs/research/c1-m3-torpedoes.md` were being
written concurrently). This report and its commit touch only the desktop
debug-screen files + ADR; I did not modify or commit the concurrent sprint's
files.

## Changed-file summary (this sprint)

- `apps/desktop/src/renderer/shell/debug-mode.ts` (new)
- `apps/desktop/src/renderer/shell/debug-mode.test.ts` (new)
- `apps/desktop/src/renderer/shell/campaign-screen-registry.tsx`
- `apps/desktop/src/renderer/shell/campaign-screen-registry.test.tsx`
- `docs/adr/ADR-0029-desktop-debug-mode-screens.md` (new)
- this report: `.ai/reports/desktop-debug-mode-screens.md`

Security: N/A (UI-navigation-only; no secrets, IPC, or engine change).
Compatibility: N/A (no authoritative serialization/save impact).
