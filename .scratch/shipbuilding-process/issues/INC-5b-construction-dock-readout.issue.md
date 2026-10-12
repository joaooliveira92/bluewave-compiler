# INC-5b — Construction dock-size readout (UI slice of INC-5)

**State:** done · **Frontier:** no · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R15, SB3-R33) · **ADR:** none (presentation of a compiled value)

## What to build

Surface the nation's dock size (the largest hull it can build) on the Construction screen as a compiled value,
the UI half of SB3-R15 that INC-5's engine slice left deferred.

## Acceptance criteria

- [x] The Construction economy projection carries `dockMaxBuildDisplacementKg` (the nation's authored
      **dock record** `maximumNewConstructionMassKg` at the campaign month — ADR-0135: never
      `maxPracticalDisplacementKg`, which is a production/throughput figure), derived — never an authored
      constant in the UI.
- [x] The Construction screen shows "Dock size" beside Shipyard Capacity.
- [x] `pnpm snap` of the Construction screen with `aria.yaml` assertions by role + accessible name, console
      clean, no churn warning; a render test on the new readout.

## Notes for implementator

INC-5 added the `DockRecord`/eligibility model (`@bluewave/ship-design` `dock.ts`) and the order-time ceiling
check (`SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`). This ticket is the display only: thread the resolved ceiling from
`buildPlayerProjection`/`constructionEconomy` to `StatsPanel`. Deferred, not dropped, because the engine slice
landed and a UI change needs a captured screen (AGENTS.md).
