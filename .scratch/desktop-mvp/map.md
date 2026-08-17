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
- [Bridge Scaffold & Entry-Point Cutover](issues/11-bridge-scaffold-entry-point-cutover.md) —
  execution ticket (this effort MAY carry execution): `@bluewave/campaign-engine`
  package, all six `shared/*-contract.ts` files, and the full `campaign.execute`
  bridge (22 commands, one `ipcMain` channel) wired end to end through
  `src/preload` + `src/main`; renderer boots `shell/App.tsx`; old
  Editor/Campaign Save Viewer entry + its IPC handlers retired
  (superseding tickets 03 and 04). Live-boot verification found & fixed
  `index.html` root path (added `renderer/main.tsx`), missing global CSS,
  missing `ThemeProvider`/`BackgroundProvider`, and a 20-image missing
  content-asset gap (1×1 placeholder PNGs added at `assets/` paths so New
  Game doesn't crash; real flag/ship artwork deferred).
- [New Game → Overview](issues/12-new-game-to-overview.md) —
  `listNewGameOptions`, `compileCampaign`, `inspectCampaign` real against
  `CampaignCompiler`/`SaveStore`. Map-serialization fix proved, not written
  (pre-existing commit); found + fixed a second hash mismatch (`rawHash`
  over snapshot vs whole-state) at the call site via the extracted
  `toSaveableState` helper (now in `saveHelpers.ts`); `scenarioId` narrowed
  to `scen_1880`; `regimeName` sourced from validated `pack.nations`;
  `shipyardCapacity` proxied by summed port levels (judgment call,
  documented).
- [Advance a Month](issues/13-advance-a-month.md) — `commitMonth` wired to
  the real `MonthExecutor.execute`; battle phases 9.5/10 inside
  `execute()` were already auto-resolving (ticket 09's premise reversed —
  `autoResolution.ts` was validation guards, not a per-battle gate). Fixed a
  latent envelope bug (`bodyHash` over pre-month snapshot would fail every
  load) by recomputing the envelope post-month; added `campaignSeed` to
  `CampaignSessionRecord` so month seeds derive as
  `` `${seed}:month:${turnNumber}` ``; `turnNumber`/calendar advance left to
  the caller per `execute()`'s contract.
- [Construction Ordering](issues/14-construction-ordering.md) — all four
  construction commands real against `packages/commands`' `CommandRegistry`/
  reservation-settlement (per ticket 10; lifecycle-subset + projected-cost
  formula `construction_order_v1` recorded in ADR-0023). Reviewer-driven
  repairs: replace is now failure-atomic (preflight reserve before
  supersede; rollback on save failure), and the projection + workspace
  surface snapshot `constructionProjects` (authored starts + pre-restart
  orders) by rebuilding the workspace from the snapshot on load.
- [Fleet Visibility](issues/15-fleet-visibility.md) — `inspectFleetScreen`
  read-only, real divisions/ships/ports from compiled `FleetState`/`Ship`
  (compiler always emits `divisions: []`, so FleetState is the real source).
  Movement commands stay `NOT_IMPLEMENTED` stubs; `FleetScreenView` lives in
  `packages/campaign-engine/src/fleet.ts`.
- [Save, Load & Continuity](issues/16-save-load-continuity.md) —
  `loadCampaign`/`verifyCampaign`/`replayCampaign`/`recoverCampaign` real
  against `SaveStore`/`CompatibilityChecker`/`RecoveryManager`/`ReplayVerifier`,
  proven on real production saves (close→reopen→load restores state; replay
  deterministic hash incl. tamper→mismatch; recover reverts a corrupted
  package). New atomic `session.json` sidecar (seed/slot/scenario) written by
  `compileCampaign`; construction workspace deliberately not persisted
  (snapshot is the authority, workspace rebuilt from it). Deterministic
  newest-save tie-break added to `SaveStore.list` (reviewer F6).
  **Known caveat:** `SaveStore`'s envelope hash doesn't cover Map-backed
  state (ADR-0024) — replay is the strong integrity check; serializer
  migration deferred to the persistence track.

## Not yet specified

- Whether Campaign Preferences or Options turn out to be load-bearing for
  the critical path (e.g., save-on-close) once the above is exercised —
  deferred unless this surfaces.
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
- The `SaveStore` serializer hash-integrity migration (`canonicalSerialize`
  collapses Maps to `{}`, so envelope hashes don't cover Map-backed state) —
  closed as past this map's destination in
  [17-serializer-hash-integrity](issues/17-serializer-hash-integrity.md);
  recorded in ADR-0024 and owned by the persistence track. This MVP ships
  replay as the strong integrity check.
- Real flag/ship artwork for the New Game nation-selection screen — ticket 11
  added 1×1 placeholders so the screen doesn't crash; real art is separate
  content work (a missing `assets/` content-asset gap), out of this effort.
- The currently-open missing `renderer`-side wiring of the new `projects`
  field on `ConstructionScreenProjection` (the contract field landed with
  ticket 14; the screen's own render of it and its component test are
  follow-up UI work, not the command-surface slice).
- `OperationStatus.tsx` rendering success copy regardless of
  `valid`/`matched`/`recovered` on the Campaign File screen — correct
  data already returned; copy is a screen follow-up.
