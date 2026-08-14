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

- [~] `pnpm dev` boots into the real shell (sidebar, header, navigation) —
      not the old Editor/Viewer scaffold. Main + preload build cleanly and
      the renderer dev server starts; the Electron GUI process itself
      couldn't be launched in this sandbox (no display/window-server
      access — the binary is present, this is an environment limitation,
      not verified code behavior). Needs a real visual check on a machine
      with a display before calling this done.
- [~] Every screen renders without crashing, showing a graceful
      loading/error state (bridge calls return `NOT_IMPLEMENTED`) — same
      caveat as above, not visually verified.
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
