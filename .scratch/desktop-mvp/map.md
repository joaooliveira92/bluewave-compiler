# Wayfinder Map: Desktop MVP

## Destination

A scoped MVP spec for the Bluewave desktop app naming which screens/flows count
as "MVP-done" for a playable campaign loop: New Game (archetype → nation →
preferences) → Overview → advance ≥1 strategic month via Simulation →
Fleet/Construction → save/reload via Campaign File. Plus execution tickets
for the foundational plumbing (IPC bridge, tsconfig wiring, entry-point
change) that every other MVP decision is blocked behind. Not a `DESIGN-55`
`FULLY_SUPPORTED` release — an internal/playtest slice for the user plus a
small playtester group, macOS-only, distributed via `pnpm dev` (no packaging).

This map is a **deliberate reversal** of prior desktop-scope calls (see
below) — confirmed explicitly by the user, not a silent override.

## Notes

- Domain: Bluewave is a deterministic 1880–1970 naval strategy sim (see root
  `README.md` doc map). Desktop app: Electron + React 19 (`apps/desktop`),
  IPC between `src/main` and `src/renderer` via `src/preload`.
- Consult `docs/architecture/ui-and-player-interaction.md` (DESIGN-51) for
  UI/interaction contracts when a ticket touches screen behavior.
- Default to `/grilling` + `/domain-modeling` for grilling tickets; dispatch
  `/research` subagents for research tickets.
- This effort's tickets MAY carry execution (not just decisions) for the
  bridge/tsconfig/entry-point work — overriding wayfinder's default
  plan-don't-do stance, because that plumbing blocks every other MVP
  decision and re-litigating it as a separate handoff just adds a
  round-trip.
- **Provenance / supersession**: two closed maps already scoped
  `apps/desktop`'s renderer and made an opposite call:
  - [Desktop UI Kit Migration](../desktop-ui-kit-migration/map.md) migrated
    the renderer to React 19 but scoped strictly to the existing Editor +
    Campaign Save Viewer pair, explicitly ruling `shell/`/`screens/` and the
    `BluewaveDesktopBridge`/`campaign.execute` contract out of scope as
    "set-aside game-client ambition," and treated excluding that tree from
    `tsconfig.web.json` as a deliberate fix.
  - [Desktop Campaign Viewer](../desktop-campaign-viewer/map.md) built the
    current read-only, JSON-dump Campaign Save Viewer — explicitly not
    issuing commands or advancing turns.
  - Both maps treated the desktop app as lower priority than the active
    tactical-combat engine track (B-3..B-6). This map explicitly reverses
    that sequencing at the user's confirmed direction — the game-client
    shell (`shell/` + `screens/`) is now in scope, ahead of/alongside the
    engine track. The prior two maps' decisions still stand for what they
    built (the Editor/Viewer app worked, and works); they just no longer
    bound what comes next.
  - The current renderer entry (`src/renderer/index.html` →
    `src/renderer/src/main.tsx` → `App.tsx`) is that closed effort's real,
    intentional product — not legacy drift. Treat it as "the current
    shipped screen," to be superseded deliberately, not deleted as cruft.
- Real (parked, now reactivated) game-client tree lives at
  `apps/desktop/src/renderer/shell/` + `screens/`. It depends on a
  `BluewaveDesktopBridge`/`campaign.execute` IPC contract that has never
  been implemented, and is excluded from `tsconfig.web.json`'s `include`
  (deliberately, per Desktop UI Kit Migration ticket 03).
- No packaging/distribution work needed: `pnpm dev` is the agreed
  distribution mechanism for the playtester group.

## Decisions so far

- [Bridge Command Surface](issues/01-bridge-command-surface.md) — scope
  turned out much bigger than one ticket: the whole
  `apps/desktop/src/shared/*-contract.ts` layer (6 files) and the
  `@bluewave/campaign-engine` package are missing, and the real command
  surface is 19 `campaign.execute` commands, not ~6. Split into
  [Campaign-Engine Projection Package Shape](issues/07-campaign-engine-projection-shape.md)
  (prerequisite), then [New-Game & Continuity Contract](issues/08-new-game-continuity-contract.md),
  [Simulation Contract](issues/09-simulation-contract.md), and
  [Construction & Fleet Contract](issues/10-construction-fleet-contract.md).
  Standing decisions that apply to all four: build `@bluewave/campaign-engine`
  as a thin wrapper package; keep the existing envelope/Zod-boundary
  conventions; `SaveStore`'s Map-serialization bug is now in scope (was
  deferred by `desktop-campaign-viewer`); construction-order issuing is in
  MVP scope, fleet-movement orders are not.
- [Campaign-Engine Projection Package Shape](issues/07-campaign-engine-projection-shape.md) —
  new `packages/campaign-engine` package (depends on `@bluewave/campaign` +
  `@bluewave/persistence`). `CampaignConfiguration` re-exported unchanged
  from `@bluewave/campaign`. **Addendum during ticket 11**: the archetype
  system's "cosmetic-but-honest" call (Q14) was reversed after discovering
  pre-existing, already-tested application code
  (`archetype-consequence.ts`/`.test.ts`) that already computes real
  numeric effects with pinned formulas — `archetypeEffects` is now
  implemented for real, matching those tests. `PlayerProjection` shape
  confirmed as a flattened per-nation slice of `CampaignSnapshot`.
  `BluewaveDesktopBridge`/envelope lives at
  `apps/desktop/src/shared/bridge-contract.ts` (app-level, not part of the
  new package).
- [Verify Full Loop Against Production Pack](issues/05-verify-full-loop-against-production-pack.md) —
  new integration test (`packages/cross-process-test/test/production-pack-loop.test.ts`)
  proves compile → advance-month → save → load → replay against
  `content/production/1880` passes clean end to end — closes caveat 3 from
  the content-pack research. Note for the projection package: replay
  verification needs an internal, unexported hash helper from
  `@bluewave/phase-engine`.
- [Empty-Nation Content Gap](issues/06-empty-nation-content-gap.md) —
  Spain and the 4 other zero-design/zero-construction nations are excluded
  from nation selection via the existing `supportedValues.playerSlotId`
  gate in `new-game-nation-screen-state.ts` — no special UI messaging
  needed; feeds into ticket 08's `NewGameOptions` design.
- [New-Game & Continuity Contract](issues/08-new-game-continuity-contract.md) —
  mostly wiring: `SaveStore`, `RecoveryManager`, `CompatibilityChecker`
  (`@bluewave/persistence`) and `ReplayVerifier` (`@bluewave/phase-engine`,
  proven by ticket 05) already cover `loadCampaign`/`verifyCampaign`/
  `replayCampaign`/`recoverCampaign`. "Package" = `SaveStore`'s save
  directory, distinct from the old `.bluewave` content-project format.
  Found a 6th command, `listNewGameOptions` (full surface now 20
  commands). `compileCampaign` writes the initial save immediately so
  there's always something recoverable. `activeRevision` is just
  `CampaignSnapshot.turnNumber` renamed.
- [Simulation Contract](issues/09-simulation-contract.md) — `commitMonth`
  maps to the real monthly pipeline (`MonthExecutor.execute`, not
  `campaignSession.ts`'s bare date-ticker), auto-resolving any triggered
  battle inline via the already-implemented `autoResolution.ts` rather than
  surfacing a pending battle state. `generateBattle`/`resolveBattle`/
  `resolveTacticalBattle`/`replayBattleBoundary` and the battle-detail
  panels stay dev-tool-only stubs, shared with Tactical Sandbox, out of MVP
  scope.
- [Construction & Fleet Contract](issues/10-construction-fleet-contract.md) —
  the screens' `expectedRevision`/`transportRequestId` optimistic-concurrency
  pattern is real, not to be simplified — `packages/commands`'s
  `CommandRegistry`/reservation-settlement model already implements it
  (same machinery ticket 05's test exercised). Construction's
  submit/replace/cancel implemented for real (in MVP scope); Fleet stays
  read-only, movement commands stay unimplemented stubs.
- [Content Pack MVP Readiness](issues/02-content-pack-mvp-readiness.md) —
  the `content/production/1880` pack is ready with caveats, not blocked: it
  compiles cleanly (14 nations, 19 ships, 37 designs, 84 techs), but all
  ships lack `designVersionId` (tracked pre-existing gap), playable nation
  Spain has zero designs/construction (new gap — see ticket 06), and no
  existing test exercises compile→advance-month→save→load against this
  pack specifically (new gap — see ticket 05). Full findings:
  [docs/research/content-4-desktop-mvp-pack-readiness.md](../../docs/research/content-4-desktop-mvp-pack-readiness.md).

## Not yet specified

- Per-screen MVP-readiness for the critical-path screens (New Game
  archetype/nation/preferences, Overview, Simulation & Turn, Fleet,
  Construction, Campaign File save/load) once the IPC bridge exists — can't
  ticket precisely until the bridge's command surface (ticket 01) and
  implementation (ticket 03) land and each screen can actually be exercised
  against real data.
- Whether Campaign Preferences or Options turn out to be load-bearing for
  the critical path (e.g., save-on-close) once the above is exercised —
  deferred unless this surfaces.
- How the current Editor + Campaign Save Viewer (the `desktop-ui-kit-migration`
  / `desktop-campaign-viewer` product) relates to the new game-client shell
  once it's wired up — coexist, get subsumed, or get retired — graduates
  once ticket 04 is reached and the shell is proven to cover its use cases.
- Real mechanical effects for the archetype system (how a point allocation
  across economy/industry/combat actually changes a compiled campaign's
  starting conditions) — deliberately deferred past this MVP (ticket 07);
  would need its own design effort if wanted later, since nothing in
  `@bluewave/campaign` models this today.

## Out of scope

- Map rendering / map-prototype's rendering-technology decision — ruled out
  for this effort; stays a throwaway dev-only screen.
- `DESIGN-55` formal capability acceptance (`ACCEPTED` states, packaged
  smoke tests, `ReleaseSupportManifest`) — this MVP intentionally sits below
  that bar.
- Tactical battle play (beyond the existing dev-only Tactical Sandbox) — not
  required for the MVP loop.
- Packaged `.dmg` / cross-platform distribution — `pnpm dev` is sufficient;
  Windows/Linux packaging not pursued.
