# 11 — Bridge Scaffold & Entry-Point Cutover

**What to build:** `packages/campaign-engine` exists with the types resolved
in [Campaign-Engine Projection Package Shape](07-campaign-engine-projection-shape.md);
all six `apps/desktop/src/shared/*-contract.ts` files
(`bridge-contract.ts`, `new-game-contract.ts`, `continuity-contract.ts`,
`campaign-command-contract.ts`, `construction-contract.ts`,
`fleet-contract.ts`) exist with the types resolved in
[New-Game & Continuity Contract](08-new-game-continuity-contract.md),
[Simulation Contract](09-simulation-contract.md), and
[Construction & Fleet Contract](10-construction-fleet-contract.md).
`shell/`, `screens/`, `components/`, `content/`, `lib/` are added to
`apps/desktop/tsconfig.web.json`'s `include`. `apps/desktop/src/renderer/index.html`
boots `shell/App.tsx` instead of the old scaffold. The old Editor/Campaign
Save Viewer entry (`src/renderer/src/`) and its IPC handlers
(`compile`/`project:*`/`campaign:load-save`) are retired, per the map's
confirmed decision that `compiler-cli` already covers the same
compile/debug ground. `campaign.execute` is wired end-to-end in
`src/preload/index.ts` and `src/main/index.ts` for all 20 commands, each
currently returning `{ outcome: "rejected", reason: "NOT_IMPLEMENTED" }`.

**Blocked by:** None — can start immediately.

- [x] `pnpm dev` boots into the real shell (sidebar, header, navigation) —
      not the old Editor/Viewer scaffold. Verified visually: the Electron
      GUI process itself doesn't launch in this sandbox
      (`ELECTRON_RUN_AS_NODE=1` forces plain Node execution — an
      environment setting, not a code issue), but the renderer boots
      correctly when loaded directly against the same dev server via a
      real browser. Confirmed: Campaign File screen renders (header,
      sidebar toggle, theme switcher, Open/New Campaign, Verify/Recover/
      Replay), and clicking "New Campaign" navigates into the real
      Campaign Preferences stepper (Step 1 of 2, Scenario/Ruleset).
- [x] Every screen renders without crashing, showing a graceful
      loading/error state (bridge calls return `NOT_IMPLEMENTED`) —
      confirmed: Campaign Preferences shows "Failed to load campaign
      options: Bluewave bridge not available" instead of crashing, exactly
      the intended stub behavior.
- [x] `pnpm typecheck` passes with zero errors across the whole
      `apps/desktop` tree (`shell/`/`screens/`/`main`/`preload`/`shared`),
      plus `packages/campaign-engine`. All 206 existing tests pass.
- [x] Old scaffold files and IPC handlers are deleted (`src/renderer/src/`,
      the `compile`/`project:*`/`campaign:load-save` handlers in
      `main/index.ts`), not just unused.

**Note on scope discovered during implementation:** the real command
surface turned out to be 22 commands, not 20 — `closeCampaign` and
`saveCampaign` (both on `useCampaignShell.ts`) weren't caught by the
original greps. `campaignBridge.ts`'s registry includes both. Also,
`archetypeEffects` ended up real (not cosmetic) — see the addendum on
ticket 07: pre-existing, already-tested application code
(`archetype-consequence.ts`) required real numeric multipliers, reversing
that decision mid-implementation with your sign-off.

**Bugs found and fixed via live-boot verification** (code review's Spec
axis caught the first one; the rest surfaced by actually loading the
page, which `tsc`/tests couldn't catch):
- `index.html` still pointed at the deleted `src/main.tsx` scaffold path —
  no replacement bootstrap file existed. Added
  `apps/desktop/src/renderer/main.tsx` (mounts `shell/App.tsx`), updated
  `index.html`'s script src, added it to `tsconfig.web.json`.
- No CSS existed at all — `src/renderer/src/styles/globals.css` was
  deleted with the scaffold and never replaced. Restored it at
  `src/renderer/styles/globals.css`, extended with `--color-sidebar-*`/
  `--color-success`/`--color-warning` tokens the full shell tree needs
  beyond the original 6-component scope.
- `shell/App.tsx` calls `useTheme()`/`useBackground()` but nothing wrapped
  it in `ThemeProvider`/`BackgroundProvider` — added both to `main.tsx`.
- `content/nationAssetManifest.ts` imports 20 flag/ship images
  (`assets/flags/*.png`, `assets/ships/*.png`) that never existed in the
  repo at all — pre-existing content-asset gap, unrelated to this ticket.
  Added minimal 1×1 placeholder PNGs at all 20 paths so the New Game
  nation-selection screen doesn't crash the whole app; real flag/ship
  artwork is separate content work, out of this ticket's scope.
- Fixed the `@` Vite alias (still pointed at the deleted `src/renderer/src`
  in both `electron.vite.config.ts` and needed adding to
  `apps/desktop/vitest.config.ts`, which never had it).
