Type: grilling
Status: resolved

## Question

Design the `BluewaveDesktopBridge`/`campaign.execute(command, payload)`
command surface that `apps/desktop/src/renderer/shell/useCampaignShell.ts`
and `useNewGameFlow.ts` already assume but that doesn't exist in
`src/preload/index.ts` or `src/main/index.ts` (confirmed: no
`BluewaveDesktopBridge` type or `campaign:execute`/`campaign.execute`
handler exists anywhere in the repo today).

Pin down:

- The full list of commands needed for the MVP loop (new game → overview →
  advance a strategic month → fleet/construction → save/load). At minimum:
  `compileCampaign`, `inspectCampaign`, advancing a strategic month,
  fleet/construction queries, save, load.
- Payload and result shapes. The renderer already expects an
  `{ outcome: "success" | ..., value | reason }`-style envelope (see
  `useCampaignShell.ts`'s handling of `bridge.campaign.execute(...)`) —
  decide whether to keep that shape or something else, and whether it
  reuses the Zod-validated IPC envelope pattern established by
  `desktop-campaign-viewer`'s `campaign:load-save` channel
  (`.scratch/desktop-campaign-viewer/issues/01-load-save-ipc-contract.md`).
- How each command maps onto `@bluewave/campaign` (campaign compiler,
  snapshot inspection, phase advancement) and `@bluewave/persistence`
  (`SaveStore`) operations.
- Error/diagnostic propagation, matching the existing
  `diagnostics: [...]` convention used elsewhere in the preload layer.
- Relationship to the existing `compile`/`project:*`/`campaign:load-save`
  channels — superseded, kept alongside, or folded in.

Note the known `SaveStore.save` Map-serialization bug surfaced (but not
fixed) by `desktop-campaign-viewer` ticket 04 — decide whether this bridge
needs to route around it or whether fixing it becomes a dependency.

The result should be a contract precise enough that ticket 03 (implement
the bridge) can build directly against it without further design decisions.

## Answer

**Scope discovered to be larger than one grilling session — split, not
answered directly.**

Investigation surfaced that the gap is much bigger than an IPC handler:

- Nearly the whole `screens/`/`shell/` tree imports from
  `@bluewave/campaign-engine` (11 exports: `PlayerProjection`,
  `CampaignConfiguration`, `ArchetypeSelection`, `ARCHETYPE_PRESETS`,
  `CommitMonthResponse`, `MonthReport`, `MovementCommand`, `BattleManifest`,
  `CompiledDesignVersion`, `SupportedConfigurationValues`,
  `createCompiledDesignVersion`) — a package that doesn't exist anywhere in
  the workspace. The real dependency, `@bluewave/campaign`, has a lower-level
  shape (`CampaignSnapshot`, `NationState`, `advanceCampaignMonth`,
  `CampaignCompiler`, etc.) that only partially overlaps.
- An entire `apps/desktop/src/shared/` contracts directory is imported
  throughout (`bridge-contract.ts`, `new-game-contract.ts`,
  `campaign-command-contract.ts`, `fleet-contract.ts`,
  `construction-contract.ts`, `continuity-contract.ts`) and **does not
  exist at all**.
- The real command surface already assumed by the screens is 19 distinct
  `campaign.execute` commands, not the ~6 originally guessed:
  `compileCampaign`, `inspectCampaign`, `commitMonth`, `generateBattle`,
  `resolveBattle`, `resolveTacticalBattle`, `replayBattleBoundary`,
  `loadCampaign`, `verifyCampaign`, `replayCampaign`, `recoverCampaign`,
  `inspectConstructionScreen`, `submitConstructionCommand`,
  `replaceConstructionCommand`, `cancelConstructionCommand`,
  `inspectFleetScreen`, `submitMovementCommand`, `replaceMovementCommand`,
  `cancelMovementCommand`.
- Persistence is package/revision-based (`packagePath`, `campaignIdentity`,
  `activeRevision`, verify/replay/recover — `DESIGN-52` replay-integrity
  vocabulary), not the simple `SaveStore.save`/`load` API originally
  assumed.

Decisions made before the split (apply to all follow-on tickets):

- Build `@bluewave/campaign-engine` as a real, thin package wrapping
  `@bluewave/campaign` + `@bluewave/persistence`, producing the UI-shaped
  types the screens already assume. The bridge/IPC layer stays a thin
  JSON-safe pass-through; all domain logic lives in this new package.
- Keep the existing `{ outcome: "success" | ..., value | reason }` envelope
  and the Zod-validated IPC boundary pattern `desktop-campaign-viewer`
  established.
- `SaveStore.save`'s Map-dropping bug (deferred by `desktop-campaign-viewer`
  ticket 04 since that effort was read-only) is now in scope — this MVP's
  loop requires save-then-reload to actually work.
- Construction-order issuing (`submitConstructionCommand`) is in scope for
  MVP player agency; fleet movement orders
  (`submit`/`replace`/`cancelMovementCommand`) stay read-only/deferred,
  consistent with tactical play being out of this map's scope.

**Restructured into**: [Campaign-Engine Projection Package Shape](07-campaign-engine-projection-shape.md)
(prerequisite — the cross-cutting `BluewaveDesktopBridge` envelope and
`@bluewave/campaign-engine`'s core types), then three per-domain contract
tickets blocked on it: [New-Game & Continuity Contract](08-new-game-continuity-contract.md),
[Simulation Contract](09-simulation-contract.md), and
[Construction & Fleet Contract](10-construction-fleet-contract.md).
