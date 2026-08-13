# Wayfinder Map: Desktop UI Kit Migration

## Destination

Migrate `apps/desktop`'s renderer from plain-DOM/TS to React 19, restyling the
*current* functionality only — the Editor screen (New/Open/Save/Save As/Compile)
and the Campaign Save Viewer (Load Campaign Save + curated snapshot display) —
using the `components/ui/` kit copied from the untracked reference tree at
`apps/desktop/src/renderer/components/ui/`. No new features, no game-client
screens, no shell chrome. Closes with resolved tickets and an
implementation-ready sequence — no formal `.ai/briefs/` milestone brief, since
this isn't new engine-facing scenario capability the way B9/B10/the Desktop
Campaign Viewer were.

## Notes

- Domain: `apps/desktop`'s Electron main/preload/renderer boundary
  (`.ai/ENGINEERING-CONTRACT.md`'s Electron boundary section) is untouched by
  this map — it's a renderer-only UI-framework swap, no IPC/capability changes.
- Skills: `/grilling` + `/domain-modeling` for scope; `/prototype` for "how
  should it look/behave" questions.
- Side track: lower priority than the active B-3..B-6 tactical-combat track
  (M2). Should not block or compete with it.
- Provenance (from charting): `components/ui/` (and the rest of the untracked
  `components/`, `content/`, `lib/`, `screens/`, `shell/` tree) is the user's
  own prior design work, built in a separate session/tool, not an AI-generated
  mockup or third-party template.
- Charting-session facts (direct inspection, re-verify if stale):
  - `components/ui/*.tsx` imports only from `../../lib/{use-mobile,utils,ease}.ts`
    (small, generic utilities) and external packages — **not** from `shell/`,
    `content/`, or `screens/`. It is genuinely separable from the rest of the tree.
  - External deps required, **none currently in the repo**: `@base-ui/react`
    (headless component primitives — not Radix), `class-variance-authority`,
    `cmdk`, `lucide-react`, `motion` (the `motion/react` entry point),
    `clsx`, `tailwind-merge`, and Tailwind CSS itself.
  - No Tailwind config, no PostCSS config, and no `globals.css` exist anywhere
    in the tree — `lib/ease.ts`'s own comment references a `globals.css` design
    token file that isn't present. The styling foundation the kit assumes was
    not carried over with it and needs reconstructing.
  - Current renderer entry: `apps/desktop/src/renderer/index.html` →
    `src/main.ts` (plain DOM). `electron.vite.config.ts`'s renderer build
    input is still this `index.html`.
- Dependency stance (settled): take the full dependency set needed by whichever
  `ui/` components get adopted. Don't trim by avoiding components to save
  dependencies — decide by what the two current screens need, not by dependency
  weight.
- Do not resolve more than one non-research/non-task ticket per session.

## Decisions so far

- [Component Mapping](issues/01-component-mapping.md) — 6 of 37 kit components
  adopted (tabs, button, card, alert, scroll-area, spinner; `separator` was
  copied speculatively then found unused in code review and removed); the
  other 31 don't correspond to anything in the current two screens.
- [Styling Foundation](issues/02-styling-foundation.md) — standard shadcn/ui
  "neutral" light-mode Tailwind v4 token set, scoped to only what the 7
  adopted components use; no external source existed to copy from.
- [React Build Wiring](issues/03-react-build-wiring.md) — React 19 +
  `@vitejs/plugin-react` + `@tailwindcss/vite` wired into
  `electron.vite.config.ts` and `vitest.config.ts`; also fixed two pre-existing
  latent bugs surfaced along the way (`tsconfig.web.json`'s include pulling in
  the untracked out-of-scope tree; `apps/desktop`'s `typecheck` script being a
  silent no-op since it never ran in `-b` build mode).
- [Editor/Viewer Composition](issues/04-editor-viewer-composition.md) —
  prototype and production fold done as one step; `App.tsx` recomposes the
  Editor and Campaign Save Viewer screens with the adopted components,
  behavior held 1:1 with the old plain-DOM version.

## Not yet specified

<!-- destination reached — all four tickets resolved, nothing left to decide -->
- Structured/richer presentation beyond the current 1:1 plain-DOM parity (e.g.
  using `badge`, `separator`, or other unadopted kit components for a nicer
  layout, not just a like-for-like swap) — deliberately not pursued this pass;
  would need its own "how should it look, now that it's not constrained to
  parity" prototype ticket if wanted later.

## Out of scope

- Adopting `screens/` (new-game nation selection, fleet, construction,
  simulation, tactical sandbox, debugging, map prototypes, campaign-file,
  campaign-preferences, options, overview) — the user was explicit this map is
  not about implementing the app or copying features, only about how UI
  elements should be shown.
- Adopting `shell/` (header, sidebar, global search, theming,
  campaign-screen-registry) and `components/backgrounds/`,
  `components/motion/` — part of the same set-aside game-client ambition.
- Reconciling the tree's assumed `@bluewave/campaign-engine` package and
  `BluewaveDesktopBridge`/`shared/bridge-contract.js`/`shared/new-game-contract.js`
  preload shape — moot once `screens/`/`shell/` are out of scope; the `ui/` kit
  doesn't depend on any of it.
