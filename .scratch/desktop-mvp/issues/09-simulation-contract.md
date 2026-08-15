Type: grilling
Status: resolved
Blocked by: 07

## Question

Design the simulation contract (`shared/campaign-command-contract.ts`,
doesn't exist) covering `useSimulationScreen.ts`'s commands: `commitMonth`,
`generateBattle`, `resolveBattle`, `resolveTacticalBattle` — plus
`inspectCampaign` (also used by Overview and Campaign Preferences).

Central question given this map's scope: the MVP loop requires "advance at
least one strategic month" but explicitly excludes tactical battle play.
`commitMonth`'s underlying monthly pipeline may generate battles that
`@bluewave/campaign`/`@bluewave/combat` can auto-resolve deterministically
(per `DESIGN-55`'s auto-resolution requirement) — decide whether MVP's
`commitMonth` command:

- always auto-resolves any generated battle inline and returns a
  `MonthReport`/`CommitMonthResponse` with the outcome baked in (no
  `generateBattle`/`resolveBattle`/`resolveTacticalBattle` round-trip
  needed for MVP), or
- still surfaces a battle-in-progress state that Simulation's UI must
  handle (even if Tactical Sandbox itself stays dev-only) — in which case
  `generateBattle`/`resolveBattle`/`resolveTacticalBattle` need real
  payload/result shapes too, not just a stub.

Ground `MonthReport`'s and `CommitMonthResponse`'s shape in what
`TurnReportTab.tsx`, `TreasuryGrid.tsx`, `StrategicOverviewTab.tsx`,
`BattleManifestView.tsx`, and `BattleResolutionPanel.tsx` actually render.

## Answer

**`commitMonth` auto-resolves inline; battle-specific commands/panels are
dev-tool-only for MVP.**

Found the real monthly pipeline: `MonthExecutor.execute(snapshot, commands,
randomSeed, collector) → MonthResult` (`packages/phase-engine/src/month.ts`)
— much richer than `campaignSession.ts`'s `advanceCampaignMonth`, which
turned out to be only a bare date-ticker (year/month/turnNumber), no
economy/construction/battle logic. `MonthResult` returns `finalSnapshot`
plus four ledgers (command/event/random/financial) and `success`; battle
generation isn't automatic — it's triggered by war-related events landing
in the event ledger, which is where `packages/combat/src/autoResolution.ts`
(`assertAutoResolvable`, `AUTO_RESOLUTION_THRESHOLDS` — real, already
implemented) plugs in.

`commitMonth(sessionId, commands: CommandEnvelope[]) → CommitMonthResponse`
maps to `MonthExecutor.execute()`, with any triggered battle auto-resolved
inline via `autoResolution.ts` before the response is built — never
surfaced as a pending/blocking UI state for MVP.

```ts
interface CommitMonthResponse {
  readonly report: MonthReport;
  readonly domainEvents: readonly DomainEvent[]; // from MonthResult.eventLedger
  readonly financialLedger: readonly FinancialLedgerEntry[]; // MonthResult.financialLedger, as-is
  readonly projection: PlayerProjection; // refreshed post-commit, ticket 07's shape
}
interface MonthReport {
  readonly month: { readonly month: number; readonly year: number };
  readonly openingTreasury: number;
  readonly maintenanceCost: number;
  readonly newConstructionSpending: number;
  readonly closingTreasury: number;
}
```

(`month`/`openingTreasury`/`maintenanceCost`/`newConstructionSpending`/
`closingTreasury` grounded directly in `TurnReportTab.tsx`/`TreasuryGrid.tsx`'s
rendering.)

**Out of MVP scope, deferred as dev-tool-only** (shared with Tactical
Sandbox, which is already dev-only per this map's destination):
`generateBattle`, `resolveBattle`, `resolveTacticalBattle`,
`replayBattleBoundary`, and the `BattleManifest`/`BattleResolution`/
`TacticalBattleOutcome`/`SubmarinePool`/`MinePressure`/`LandTargetDamage`
types their panels (`BattleManifestView.tsx`, `BattleResolutionPanel.tsx`,
`BattleArenaTab.tsx`) consume. These stay unimplemented stubs in
`@bluewave/campaign-engine` for now — implementing them for real is its own
effort once tactical play comes into scope (this map already ruled it
out).
