# Research - Campaign command screen: readout and button inventory vs the engine

> Effort: `.scratch/campaign-command-screen`, ticket 02 (research). Method: source sweep of `packages/*/src`,
> `apps/desktop/src/main`, `content/production/1880` on `dev` at 8dcd4ba (2026-10-08). Read-only on code.
> Rule (ADR-0059 section 1): a readout or button shows real engine data, or a visible "Not yet modelled" item
> with its reason - never a fabricated number.
>
> **This note updates, and does not repeat, `rtw3-parity-engine-roadmap.md`.** That roadmap (2026-10-07) is
> partly out of date: since then ADR-0060 (budget allocation), ADR-0061 (loss ledger), ADR-0062 (fleet
> movement), ADR-0065 (officers) and ADR-0066 (SubmitDesign) landed. Its verdicts for areas not mentioned
> below (trade protection, subs, invasion, forts, air, doctrine, treaties, intel) still hold. Companion notes:
> `rtw3-intel-and-submarines-engine-surface.md`, `rtw3-war-panel-engine-surface.md`,
> `rtw3-losses-ledger-engine-surface.md`.

Legend: **Real** = a stored field or an existing view/command returns it. **Derived** = computed from real
fields by a pure rule that already exists (or is trivial and honest). **Proxy** = real but a stand-in for the
RTW3 concept; label it as such. **Deferred** = absent; show "Not yet modelled".

## Current command vocabulary (supersedes the roadmap's "14 commands")

Command types in `packages/commands/src/envelope.ts`: BudgetProject, SetResearchPriority,
**SetBudgetAllocation**, **MoveFleet**, **SubmitDesign**, **AssignOfficer**, **RelieveOfficer**, seven
diplomacy commands (DeclareWar, AcceptPeace, FormAlliance, BreakAlliance, FormNonAggressionPact,
BreakNonAggressionPact, DeclareBlockade) and five division commands (Create/AddShip/RemoveShip/Dissolve/
ChangeFlagship). The desktop bridge (`apps/desktop/src/main/campaignBridge.ts`) exposes inspect views for
campaign, map, priorities, construction, fleet, research, diplomacy, division, budget, battle history and
opening briefing; submit paths for diplomacy, division, movement, design, budget, research and construction;
and save / close / **copyCampaign** / load / list / verify / replay / recover.

## A. Nation status panel (bottom-left)

| RTW3 item | Source today | Verdict | Reason / note |
|---|---|---|---|
| Prestige | none. `NationState` (`packages/campaign/src/state.ts:221`) has no prestige; `site-header-state.ts:197` renders it as a placeholder. Content has only the strings `navy_prestige` / `prestige_service` (`content-schema/src/nation.ts`) | **Deferred** | Needs a campaign mechanic (what moves it), an ADR and a golden update. |
| Fleet morale | none. Division `experience` / `cohesion` exist (`PermanentDivision`) but are per division, not national | **Deferred** | A fleet-wide average of division cohesion is derivable but is not RTW3 morale; do not label it so. |
| Tonnage on foreign stations | `Ship.locationAreaId`, `AreaData.controller`, `PortData.nationId`, design `normalizedDisplacementKg` | **Derived** | Sum displacement of the player's ships in areas not controlled by the player. Needs a rule for unclaimed seas (decision for ticket 03). |
| Dock size | `ship-design` yards (`content/production/1880/ship-building/balance.yaml` `environment.facilities`: yard_small / medium / large) | **Deferred** (as a nation readout) | The yards are one reference environment "until campaign facilities are wired (SB-14b)", not per nation or port. |
| Shipyard capacity | `PlayerProjection.economy.shipyardCapacity` = sum of own ports' `level` (`campaign-engine/src/projection.ts:153`) | **Proxy** (real) | The code documents port level as a stand-in. Per-yard monthly work (`ship-design/src/yards.ts`, ADR-0067 s6) exists only for design forecasting. |
| Unrest level | none | **Deferred** | No domestic-politics model. |
| Build requirement | none. `computeConstructionCap` (`phase-engine/src/economyPhases.ts`) is a spending cap, not a required programme | **Deferred** | |
| Treaty limits / time | none. `ship-design` has a `TreatyLimits` type but wiring passes `treaty: null` (`shipBuildingContent.ts:76`) | **Deferred** | Roadmap F-11: engine plus content. |
| Date / turn | `CampaignSnapshot.turnNumber`, `startYear`, `startMonth`; `PlayerProjection.month` | **Real** | |

## B. Budget panel (bottom-centre)

| RTW3 item | Source today | Verdict | Reason / note |
|---|---|---|---|
| Monthly budget (appropriation) | `PlayerProjection.economy.monthlyAppropriation` = `scaleValue(income, navalAppropriationRateBp)` | **Real (projected)** | See finding F1 on how this relates to what the month phase pays. |
| Yearly budget | monthly x 12 | **Derived** | Label it as 12 times the monthly figure. |
| Maintenance | `economy.maintenanceCost`, re-derived per ship by `shipMaintenanceCost` (`maintenance_v1`, mirrors `computeMaintenanceCost`). Raw `nation.maintenanceCost` is 0 before the first commit: never read it | **Real (derived)** | |
| Construction | `economy.constructionSpend` = sum of `paidWork` (cumulative commitment); `MonthReport.newConstructionSpending` after a commit | **Real**, with caveat | Label "committed", not "monthly", before the first commit. |
| Research % | `ResearchState.researchBudget` / `standingResearchBudget`; `SetBudgetAllocation` (rate 500..5000 bp, research 0..1000, `budgetConstants.ts`); `inspectBudgetScreen` | **Real**, editable | RTW3 shows a percentage; the engine stores an absolute monthly amount. Show the amount (share of appropriation is derivable). |
| Naval aircraft | `NationState.aircraft` is `Record<string, unknown>`, unused at campaign level | **Deferred** | |
| Extra training | none | **Deferred** | Roadmap F-10. |
| Intelligence (spend) | `IntelligenceState.shells` is an empty placeholder | **Deferred** | |
| Total expenses | maintenance + construction + research (`priorities.ts:127`, `projection.ts:172`) | **Derived** | The engine's own chain. Omit deferred lines rather than showing them as zero. |
| Monthly balance | `PlayerProjection.projectedSurplusDeficit` | **Real (derived)** | Already in the header as "Projected balance". |
| Treasury | `economy.treasury` | **Real** | |

## C. Right column (nation flags, intel, relations, game)

| RTW3 item | Source today | Verdict | Reason / note |
|---|---|---|---|
| Nation flags / identity strip | `WorldMapNationView {id, name, tag}`; `PlayerProjection.nationName`; flag art is a UI asset | **Real** (data) | |
| Intel bars, Intel level +/- | none | **Deferred** | See the intel note. |
| Intel reports | none (month events and `inspectPriorities` alerts are not intel) | **Deferred** | |
| Almanac | `content/production/1880/countries.yaml`; `renderer/content/nationDossierFields.ts` | **Real (content)** | Static content, not engine state; cheap to ship. |
| All relations | `DiplomacyRelationRow` (relation, tension 0..10, nap, since) via `inspectDiplomacyScreen` | **Real** | Already on the Diplomacy screen. |
| World tension (header) | per-pair `tension`; no global figure | **Derived** (max or mean) or **Deferred** | Pick one rule; the header marks it placeholder today. |
| Auto-build subs | none; 1880 content has no submarine hull | **Deferred / era-gated** | |
| Save | `saveCampaign` | **Real** | |
| Copy game | `copyCampaign` (`sessionCommands.ts:144`) | **Real** | The roadmap lists this as absent; it now exists. |
| Resign | none; ADR-0060 "Not done": ending is Close | **Deferred** (use Close) | |
| Turn | `commitMonth` ("Advance Month") | **Real** | |

## D. Action grid (bottom-right, 3x5)

| RTW3 button | Engine support | Verdict |
|---|---|---|
| Design Ship | `SubmitDesign` + `submitDesignCommand`; Drawing Board UI exists | **Real** (yards still a reference environment, SB-14b) |
| Research | `SetResearchPriority`, `inspectResearchScreen` | **Real** |
| Messages | per-month `DomainEvent`s and `MonthReport` of the last commit only; priorities/alerts | **Derived** (last month only) |
| Build ship | `BudgetProject` + construction commands, `inspectConstructionScreen` | **Real** |
| Doctrine | only the new-game archetype allocation (`archetype.ts`); no campaign choice | **Deferred** |
| Mobilization / All reserve | none | **Deferred** |
| Build sub | no sub design or hull in 1880 content | **Deferred / era-gated** |
| Air groups / Aircraft types | tactical-only | **Deferred** |
| Build fort/base | tactical coastal defence only | **Deferred** |
| Division editor | five division commands + `inspectDivisionScreen` | **Real** |
| Fleet Exercise | none | **Deferred** |
| Show history | `inspectBattleHistory` (battles, `lostShips`); no persisted message history | **Derived** (battles only) |
| Preferences | `campaign-preferences` screen, UI-state sidecar | **Real** (app-level) |

## E. Top tab strip and area tree

| RTW3 tab | Source today | Verdict |
|---|---|---|
| Map | `inspectMap` -> `WorldMapView` (nations, areas with controller, ports with level, fleets with `shipCount`) | **Real** |
| Ships in service | `NationState.fleets[].ships` (hp, speed, firepower, armor, location, design, `isUnderConstruction`); `inspectFleetScreen` | **Real** |
| Ships under construction | `NationState.constructionProjects` + `buildConstructionProjectQueue` | **Real** |
| Submarines | no sub hulls in 1880; `FleetShipView` has no hull type (designs do: `hullType`) | **Deferred / era-gated** (an empty list would be correct) |
| Coastal fortifications | none at campaign level | **Deferred** |
| Ships sunk or scrapped | `BattleResult.lostShips` via `inspectBattleHistory` (ADR-0061) | **Real (sunk only)**; scrapping **Deferred** |
| Area overview | `AreaData` (type, controller), fleets per area, relations/blockades | **Real / Derived** |
| Base overview | `PortData` (level, nation, area); no base facilities | **Real (ports) / Deferred (forts, bases)** |
| Officers | `NationState.officers` (six-strong deterministic roster: name, rank, skill), division commander, `AssignOfficer` / `RelieveOfficer` (ADR-0065) | **Real** (roadmap F-9 "absent" is stale) |
| Area tree: Ships | fleets grouped by `locationAreaId` | **Derived** |
| Area tree: Possessions | `possessions.yaml` is compiled content (`content-schema/src/possession.ts`) but not in `CampaignSnapshot`; `AreaData.controller` is the in-state substitute | **Derived from `controller`** (Deferred if the authored list is wanted) |

## Findings to carry into the spec

- **F1 - appropriation vs what the month pays (verify before wiring the budget panel).**
  `nationCompilation.ts:216` hard-codes `baseResources: SafeInt(0)` (`priorities.ts:103` acknowledges it), while
  `runMonthlyRevenuePhase` pays `baseResources x rate / 10000 / 12`, and the projection shows
  `scaleValue(income, rate)`. If both hold, the displayed "monthly budget" is a projection the revenue phase
  does not pay. Label it "projected" and confirm the intended revenue source before it is the headline figure.
  Not confirmed by running the engine; this is from reading the code.
- **F2 - no single read model.** Relations, officers, loss ledger, research and budget bounds arrive through
  separate inspect views, not `PlayerProjection`. The command screen needs one composed read model or several
  parallel inspects (decision for tickets 01 and 04).
- **F3 - shipyard/dock honesty.** Only port `level` is per nation. Present "Shipyard capacity" as port levels
  and keep "Dock size" deferred until SB-14b.
- **F4 - era gating.** Submarines, aircraft, forts and mobilization read "Not yet modelled" (or "Not available
  in this era" where content, not engine, is the gap).
- **F5 - engine tickets implied** (ranking is the owner's, per the roadmap): prestige, fleet morale, unrest,
  treaties, intel levels/spend, persisted message history, per-nation facilities (SB-14b), scrapping, doctrine,
  mobilization. A first, honest command screen needs none of them.

## Tally (approximate)

Real: about 21 items (save, copy, turn, relations, research, construction, officers, sunk ships, design,
division editor, map, ships, treasury, balance, maintenance, and so on). Derived or proxy: about 9
(foreign-station tonnage, yearly budget, total expenses, shipyard capacity, messages, history, area and
possession tree, world tension). Deferred: about 21 (prestige, morale, unrest, dock size, build requirement,
treaties, aircraft spend, extra training, intel spend/levels/reports/bars, doctrine, mobilization, subs and
auto-subs, air, forts, fleet exercise, resign, scrapping).
