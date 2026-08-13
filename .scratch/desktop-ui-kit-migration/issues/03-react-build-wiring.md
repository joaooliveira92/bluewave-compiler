Type: task
Status: resolved

## Question

Wire React 19 into `apps/desktop`'s build: add `react`/`react-dom` (and
`@types/react`/`@types/react-dom`) as dependencies, add `jsdom` as a test
dependency (currently missing — this is why the untracked tree's `.tsx` tests
fail today), configure `electron.vite.config.ts`'s renderer to build JSX/TSX
and mount a React root, and add the `components/ui/` kit's own dependencies
(`@base-ui/react`, `class-variance-authority`, `cmdk`, `lucide-react`,
`motion`, `clsx`, `tailwind-merge`) per the charted dependency stance (take
the full set needed by adopted components, don't trim by avoiding
components).

This is infrastructure only — no screen content changes here, just getting a
React app to build, render, and test inside the existing Electron shell
alongside the current `compile`/`project:*`/`campaign:load-save` IPC channels
(unchanged).

## Answer

Added `react@^19.2.8`, `react-dom@^19.2.8`, `@base-ui/react`, `class-variance-authority`,
`cmdk`, `lucide-react`, `motion`, `clsx`, `tailwind-merge` as production
dependencies; `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`,
`tailwindcss`, `@tailwindcss/vite`, `jsdom` as dev dependencies.
`electron.vite.config.ts`'s renderer now uses `plugins: [react(), tailwindcss()]`.
`vitest.config.ts` also needed the same `react()` plugin (Vite's JSX transform
isn't shared between the electron-vite build config and a standalone Vitest
run) plus `environment: "jsdom"`.

**Scope containment fix, discovered during this ticket:** `tsconfig.web.json`'s
`include` was `["src/renderer/**/*.ts", "src/renderer/**/*.html"]` — broad
enough to transitively pull the untracked, out-of-scope `screens/`/`shell/`/
`components/`/`content/`/`lib/` tree into any real typecheck (it doesn't
match `.tsx` directly, but `.ts` files in the untracked `lib/` import `.tsx`
files transitively, and `composite: true` then errors on every file not
explicitly in the include set). Separately, `apps/desktop`'s own
`"typecheck": "tsc --noEmit"` script has been a silent no-op all along — the
root `tsconfig.json` is solution-style (`"files": []` + `references`), and
plain `tsc --noEmit` without `-b` doesn't build references, so it always
checked 0 files. Neither of these is something this ticket set out to fix,
but both had to be addressed to type-check the new React code at all:
- Narrowed `tsconfig.web.json`'s `include` to `src/renderer/src/**/*.{ts,tsx}`
  plus `src/renderer/index.html` — exactly this map's in-scope surface, and a
  path that structurally excludes the untracked sibling directories (they
  live at `src/renderer/{screens,shell,...}`, not under `src/renderer/src/`).
- Changed the `typecheck` script to `tsc -b`, which now actually runs.
  Verified clean (`tsc -b --force`, exit 0) across all three project
  references (main/preload, renderer, config).

Old `src/renderer/src/main.ts` and `style.css` (superseded by `main.tsx` +
`App.tsx` + `styles/globals.css`) were removed. `index.html` now mounts
`#root` and loads `./src/main.tsx`.

Verified: `tsc -b` clean; `electron-vite build` succeeds (renderer bundle
includes React + Tailwind output); `vitest run test/` (this package's own
tracked tests) 8 files/25 tests pass; full `vitest run` (including the
untracked tree) shows the same pre-existing, out-of-scope failures only
(`@bluewave/campaign-engine`, `@testing-library/react` — both from
`screens/`/`shell/`, neither touched by this map) — no regressions, and more
of those tests now actually execute past the missing-`jsdom` barrier than
before. `vp lint .` is clean on every tracked file this ticket touched.

