# Map: First Month at the Admiralty (Milestone 2)

**Label:** wayfinder:map

## Destination

A written **spec** for Milestone 2 ("First Month at the Admiralty") — the first
complete strategic gameplay loop from **Take command** through the Overview
dashboard, priorities, guided first-month inspection, Treasury/Research/Fleet
/Construction/Diplomacy inspection and control, Advance Month, monthly
resolution, the Monthly Naval Estimates report, and save/load — reconciled
against what `packages/campaign`, `packages/campaign-engine`,
`packages/phase-engine`, `packages/persistence`, `packages/random`,
`packages/commands`, and `apps/desktop`'s IPC layer actually support today.
The spec hands off to implementation tickets once done, same pattern as the
prior Campaign Commissioning Flow effort. It covers diagnosis-doc §0–§19
(product/UX-facing content) only — §20–29 (Testing Strategy, Telemetry,
Definition of Done, Required ADRs, Validation Report Template) are
process/execution bookkeeping, not spec content, and are excluded (the prior
spec had none of these sections either).

## Notes

- Source idea: [01-diagnosis.md](./01-diagnosis.md) — a Rule the Waves
  3-inspired design doc, very concrete (ships TypeScript interfaces, Zod
  schemas, command shapes, an error-code enum) but still treated as
  **inspiration/reference copy, not a binding spec**: its *shape* (schemas,
  commands) is trustworthy scaffolding to reuse, but every factual claim
  about what the engine currently exposes needs verification per ticket, and
  the default on an unbacked claim is to cut it, matching the prior effort's
  discipline.
- Domain: Bluewave Compiler, a naval strategy game (`apps/desktop`,
  `packages/campaign`, `packages/campaign-engine`, `packages/phase-engine`,
  `packages/persistence`, `packages/random`, `packages/commands`).
- **Fixed inputs from the prior map** ([Campaign Commissioning Flow](../game-onboarding/map.md),
  now closed): Identity step fields (admiral name, campaign name, naming
  convention, ship-name reuse, measurement system), the five uncertainty
  settings + presets, archetype's 3-dimension system, legacy-fleet-mode
  semantics, and "Take command" landing on the *existing, unchanged* Overview
  dashboard. None of this is revisited here — a real conflict found while
  resolving a ticket is a flag to raise, not a silent re-decision.
- **Charting-session facts and decisions** (from three research forks plus a
  grilling round; these constrain every ticket below, not just one):
  - Turn/month orchestration already exists as a real, ordered pipeline
    (`packages/phase-engine`'s `PhaseRegistry`/`month.ts`) — far more built
    than the doc assumes, and **already runs tactical battle
    generation/consequences as part of month resolution**, contradicting the
    doc's "no tactical combat in this milestone" framing. Decision: the
    Monthly Naval Estimates report surfaces battle outcomes **minimally**
    (losses/outcomes as plain text, no tactical UI) rather than hiding real
    engine output.
  - No `campaignRevision` exists, but `BridgeResult`'s `rejected` outcome
    already carries `currentRevision` for optimistic-concurrency — treat
    this as the real substitute for the doc's proposed revision machinery,
    not something to build fresh.
  - No `AbortSignal`/`requestId` cancellation path exists in the campaign
    command flow; a real idempotency/ledger system already exists in
    `packages/commands` (`CommandIdempotencyMap`, `CommandLedger`,
    `ReservationManager`, `ScopedIdempotencyStore` — consumed by
    `phase-engine/month.ts`). Advance-Month ticket work reconciles the doc's
    proposed cancellation/idempotency model against this real one rather
    than inventing a parallel one.
  - RNG is clean today (no `Math.random()`/`Date.now()`/`crypto.randomUUID()`
    in `packages/campaign`, `packages/campaign-engine`, `packages/phase-engine`
    simulation code) and a real seeded-stream abstraction already exists
    (`packages/random`'s `RandomEngine.stream()` / `RandomLedger`), not yet
    confirmed consumed by research/diplomacy/construction.
  - Save/load is a mature, already-built system (`packages/persistence`:
    string-typed compatibility versioning via `CURRENT_COMPATIBILITY_VERSION`,
    atomic replace, recovery, corruption handling) — the doc's §17 reads like
    new work but mostly isn't. No `CURRENT_CAMPAIGN_SAVE_VERSION`-style
    integer schema version exists (the real mechanism is string-typed and
    different in shape).
  - IPC is a single 28-command contract (`window.bluewave.campaign.execute`,
    typed via `CAMPAIGN_COMMAND_NAMES`), not per-method like the doc's
    proposed `CampaignApi`. Most doc methods already have a same-shaped real
    command under a different name (`inspectCampaign`, `commitMonth` =
    `advanceMonth`, `saveCampaign`, `loadCampaign`, etc.). No
    Treasury-specific command/screen exists yet. No progress-streaming
    exists for month resolution (no `subscribeToMonthProgress` equivalent).
    No campaign-list screen was found either.
  - `BridgeResult<T>` already gives a 3-outcome (`success`/`rejected`/`error`)
    shape with free-text `reason` strings, not the doc's closed
    `campaignOperationFailureReasonSchema` enum — adopt the real shape.
  - Treasury has real aggregate `treasury`/`income`/`expenses`/
    `maintenanceCost` fields (`SafeInt`, not the doc's `MoneyAmount`), but no
    category breakdown of `expenses` into construction/research — the doc's
    itemized Income/Expenditure table needs reconciling against this.
  - Research's real allocation mechanism is integer-weighted
    `fieldPriorities` (`RESEARCH_FIELD_PRIORITY_WEIGHTS`,
    `MAX_HIGH_PRIORITY_FIELDS`), **not** the doc's proposed basis-points
    system. Decision: adopt the real weight-based model — building a
    parallel basis-points allocator would be unscoped new engine work
    disguised as a UI ticket.
  - Fleet ships carry almost none of the doc's assumed per-ship fields.
    **Correction (found resolving the Overview Dashboard ticket):** the real
    `Ship` type has no `status` field at all — `id`, `name`, `classId`,
    `nationId`, `locationAreaId`, `designVersionId`, `hitPoints`,
    `maxHitPoints`, `speed`, `firepower`, `armor`, `isUnderConstruction`,
    `constructionProgress`, `constructionTotalWork`, `inBattleId?`
    (`packages/campaign/src/state.ts:6-22`) — combat stats and construction
    state are directly on the ship, no join needed for those; only hull
    type/displacement require the design-catalog join through
    `snapshot.designs`. No per-ship maintenance cost exists anywhere.
  - Construction's real state enum is 4 values, upper-cased, and shaped
    differently than the doc's proposal: `PLANNED | AUTHORIZED | ACTIVE |
    COMPLETED` — no `paused` or `cancelled`. A real cost formula already
    exists (`construction_order_v1`: 1 cost unit per 100 tons displacement)
    that the doc doesn't mention.
  - **Diplomacy is materially richer than the doc assumes: wars
    (`WarDeclaration`) and blockades (`BlockadeState`) are already fully
    modeled and already projected to a screen**, contradicting the doc's
    §2.2 claim that war declarations/peace negotiations/a full war system
    are out of scope. Decision: Foreign Relations surfaces war/blockade
    status **read-only**, same reasoning as the battle-outcome decision
    above — but *declaring* war or negotiating peace stays out of scope.
  - No engine-defined tension→label taxonomy (cordial/neutral/strained/
    hostile/war-imminent) or "high tension" threshold exists — only raw
    numeric `tension` and the `relation` enum (`neutral | allied | at_war |
    trade_agreement`). Decision: defining that threshold/label policy is its
    own small blocking **task** ticket (real, well-scoped engine work — one
    threshold plus a label function), not deferred to numeric-only display,
    because it unblocks both Foreign Relations and the priority engine's
    "High Foreign Tension" trigger.
  - No priority/warning-card system exists anywhere in the engine — §7
    (Immediate Priorities System) is confirmed wholly new, nothing to
    reconcile against.
  - §7.4's numeric policy constants (8% minimum research share, the cash-
    reserve/deficit formulas, `remainingMonths <= 2`, etc.) are tunable
    game-balance numbers with no existing engine authority either way —
    adopted as-is per the doc, to be centralized as named constants, not
    reopened for renegotiation.
- Every ticket is a **grilling** ticket (HITL, always invoke `/grilling` and
  `/domain-modeling`) unless its `Type:` line says otherwise. Two exceptions:
  [Determinism/RNG audit](./issues/17-determinism-rng-audit.md) is `research`
  (no judgment call, pure compliance audit), and
  [Diplomacy tension-threshold policy](./issues/11-diplomacy-tension-threshold-policy.md)
  is `task` (small, real, well-scoped engine work, not a decision). Reach for
  `/prototype` where a screen's layout or a multi-step wizard needs to be
  seen to be judged, not just described — flagged per-ticket below.
- Each resolved ticket's answer is the corresponding section of the spec;
  once all tickets are resolved, assemble the sections into a single spec
  document as the final act of this effort (not itself a ticket). §0
  (Executive Summary), §1 (Product Objective), §2 (Player-Facing Scope), §3
  (End-to-End Journey), and §19.1 (Domain/Application/Infrastructure/Renderer
  ownership split — architectural boilerplate, no open decision) are
  assembled from the other tickets' answers at that point, not ticketed
  individually.

## Decisions so far

- [Determinism/RNG audit](./issues/17-determinism-rng-audit.md) — RNG
  infra is real and already wired for research (`resolve_research` phase,
  ledgered, keyed `research/month/{nation}/{field}`); diplomacy and
  construction resolution phases are currently `rngAllowed: false` in
  `PhaseRegistry`, so any diplomacy-tension randomness needs a deliberate
  phase-flag change, not just a new stream call; ship naming has no
  phase-engine involvement (application-layer concern) and can wire a
  stream directly; no stable-iteration violations found in a spot check.
- [Campaign lifecycle, time & revision model](./issues/01-campaign-lifecycle-time-revision.md) —
  no campaign-status concept exists (doc's 5-value enum dropped; spec
  describes status as UI-derived from `isTerminal` + in-flight-command
  state); `CampaignDate` documented as canonical nested `{year, month}`
  (real state is flat internally, nested at the projection layer);
  `campaignRevision` = `turnNumber` reused, with a known-gap callout that
  it can't detect same-month conflicts across research/diplomacy/
  construction edits; commands documented via the real `BridgeResult<T>`
  shape (free-text `reason`, not a closed enum), doc's invented
  `CampaignCommandResult<T>` dropped.
- [Navigation & campaign shell](./issues/02-navigation-campaign-shell.md) —
  a real campaign shell already exists (`apps/desktop/src/renderer/shell/`);
  all six sections ship together, Treasury as a stub slot until its ticket
  lands; header gets two small `PlayerProjection` additions (nation name,
  projected surplus/deficit) but alert count stays forward-wired to the
  Immediate Priorities ticket and save state uses the existing
  saving/message pair (no new dirty-flag concept); route-ownership split
  confirmed matching as-is; `StrategicDestination`'s `"foreign-relations"`
  renamed to `"diplomacy"` to match the real shipped screen, focus fields
  accepted provisionally pending the tickets that produce their targets.
- [Overview dashboard](./issues/03-overview-dashboard.md) — all §6.2 fields
  kept with reshapes: "player appointment title" repurposed to real
  `admiralName`; three header fields (fleet strength, construction count,
  highest tension) confirmed as fresh derivations, not aggregate reads;
  Naval Position's maintenance re-derived (not read from
  `maintenanceCost`, which is 0 before first `commitMonth`); "largest
  available dock" renamed to "largest port capacity" (no real dock entity,
  same port-`level` proxy used elsewhere); Foreign Situation's relations
  label specified as depending on the still-open
  [tension-threshold policy](./issues/11-diplomacy-tension-threshold-policy.md)
  ticket; tension trend (increased/decreased/unchanged) cut — no
  previous-turn tension is stored. Immediate Priorities panel: doc's
  layout/cap-5/empty-state accepted as-is, presentation only. Recent
  Developments: confirmed to draw from the Monthly Naval Estimates report's
  entries (exact shape still TBD by that ticket), no separate feed. Doc's
  four empty-state examples stand unchanged. Also corrected the map's Fleet
  Notes above (`Ship` has no `status` field; combat/construction stats are
  direct, not joined).
- [Guided first-month inspection](./issues/05-guided-first-month-inspection.md) —
  seven-step sequence confirmed (six real section screens + the real
  Advance Month header button for step 7, purely informational, not wired
  to trigger `commitMonth`); all §8.3 "must not" behaviors confirmed
  achievable as a pure renderer-side overlay; persistence narrowed to
  shape-only (`FirstMonthInspectionState { status, lastCompletedStep }`,
  must survive save/load per-campaign), storage mechanism explicitly
  deferred to [Saving, loading & campaign-list](./issues/16-saving-loading-campaign-list.md)
  since no generic UI-metadata bag exists anywhere on `CampaignSnapshot`
  today (same gap blocks priority-dismissal state in
  [Immediate priorities engine](./issues/04-immediate-priorities-engine.md));
  no comparable spotlight/tour pattern exists in the codebase, so a
  `/prototype` ticket was spun off —
  [Guided-inspection spotlight prototype](./issues/18-guided-inspection-spotlight-prototype.md).
- [Treasury and budget](./issues/06-treasury-budget.md) — Treasury becomes a
  **read-only projection screen** in M2, not the doc's editable-budget
  screen: research's total budget and government appropriation rate are
  both compile-fixed (no command mutates either), and construction has no
  scalar allocation dial at all (only per-project authorize/cancel, owned
  by [Construction projects state model](./issues/09-construction-projects-state-model.md));
  doc §9.2/§9.4–§9.6 (budget controls, drafting, validation, projection
  commands) cut entirely as a result. §9.1's income/expenditure/result
  display stands, backed by two new derived `PlayerProjection.economy`
  fields (`constructionSpend`, `researchSpend`) via the existing
  `inspectCampaign` command — no new command. `SafeInt` adopted in place of
  `MoneyAmount`; its lack of a non-negativity guarantee is moot with no
  player-facing money inputs left on this screen.
- [Research allocation](./issues/07-research-allocation.md) — the real
  weight-based model is already implemented end-to-end
  (`buildResearchScreenProjection`; `resolveResearchPhase` spends budget,
  largest-remainder allocates, seeded weighted draw, ADR-0036). M2 adds only
  the field-level edit UX around it: no basis-points/10,000-total system and
  **no "balancing category"** (weights have no fixed-total invariant); the
  only cap is `MAX_HIGH_PRIORITY_FIELDS = 5` (reject raising a 6th `HIGH`).
  Command = real `SetResearchPriorityCommand` (no new name/payload). Field
  "description"/"bonuses" cut unless real; projected progress is a pure
  derivation.
- [Fleet inspection](./issues/08-fleet-inspection.md) — real `Ship`
  (state.ts:6-22) carries `name`/`classId`/`speed`/`firepower`/`armor`/
  `isUnderConstruction` directly; hull type + displacement via the
  `snapshot.designs` join (feasible — construction projection proves it).
  **Per-row maintenance cost cut** (fleet-wide aggregate is the substitute);
  "most expensive active class" sort/summary cut. No refit/scrap/reserve/
  rename/deploy buttons. Doc's exclusion list carried verbatim.
- [Construction projects state model](./issues/09-construction-projects-state-model.md) —
  adopt real 4-state enum `PLANNED | AUTHORIZED | ACTIVE | COMPLETED`
  (upper-cased). **No `paused`/`cancelled` state added**: unfunded projects
  simply don't progress (appropriation phase skips them); the doc's "paused
  by insufficient funding" becomes a **display-only derived "stalled" flag**
  (no-progress this month from the report delta), not a new persisted state —
  same signal the priority engine's `construction_stalled` trigger consumes.
  Cost/progress/remaining fields derived from `totalWork`/`completedWork`/
  `paidWork` + `construction_order_v1`; "projected months remaining" is a
  labeled estimate (uses `computeConstructionCap`); per-project dock omitted.
  Real resolution policy (appropriation → construction-processing) is
  authoritative over the doc's 10-step list.
- [Diplomacy tension-threshold policy](./issues/11-diplomacy-tension-threshold-policy.md)
  (**task, implemented**) — `tensionLabel(t): TensionLabel` + `isHighTension`
  + `HIGH_TENSION_THRESHOLD = 8` added to
  `campaign-engine/src/diplomacy.ts` (pure, re-exported). Taxonomy over the
  real 0..10 scale: `>=10 war_imminent, >=8 hostile, >=6 strained, >=3 neutral,
  <3 cordial`; high tension = `>= 8`. Consumed by both the priority engine
  (04) and Foreign Relations (12). RNG flag (`rngAllowed: false` on
  `resolve_diplomacy`) deliberately **not** flipped — monthly tension
  randomness is owned by ticket 13. Verified by
  `campaign-engine/test/tension-label.test.ts`.
- [Saving, loading & campaign-list](./issues/16-saving-loading-campaign-list.md) —
  save/load is mature and real (string-typed `CURRENT_COMPATIBILITY_VERSION =
  "1.1.0"`, atomic replace, `SaveStore.list`, `CompatibilityChecker` rejects
  mismatches with no silent repair). "Budget revision" autosave trigger is
  **moot** (Treasury read-only). Genuinely new: the **campaign-list screen**,
  which needs an **additive, optional 3-field `SaveMetadata` extension**
  (`campaignName`, `nationId`, `campaignDate {year,month}`) written at save
  time (legacy records render `—`; no migration). Manual save (`saveCampaign`)
  and failed-load/versioning sections are "document what's real."
- [Guided-inspection spotlight prototype](./issues/18-guided-inspection-spotlight-prototype.md) —
  interaction model decided: DOM-based, renderer-only spotlight (ring from
  `getBoundingClientRect` over the shared shell + fixed-position step card),
  non-blocking, no focus trap, respects `prefers-reduced-motion`. Does **not**
  change ticket 05's steps/behavior/persistence. Concrete visual click-through
  prototype deferred to the implementation sprint (presentation detail only).

## Not yet specified

_(empty — the charting session ticketed everything sharp; nothing left in
fog within scope)_

## Out of scope

Carried forward from the diagnosis doc's §2.2, unchanged except where noted
above (battle outcomes and war/blockade state are now surfaced **read-only**
where real data already exists — but the underlying player *actions* below
remain out of scope):

- tactical battle simulation and tactical battle UI (battle outcomes are
  surfaced as report text only, per the charting decision above);
- player-designed ship hulls, a full ship designer, manual gun/armor/
  machinery/fire-control configuration;
- fleet deployment to strategic regions, required regional force levels,
  colonial possessions management (no "required presence" domain model
  exists — same gap the prior map already flagged);
- naval invasions, submarine warfare, aviation development;
- treaties and naval limitation conferences;
- random historical events, government changes;
- officer management, crew training management, detailed ammunition
  logistics;
- ship scrapping, mothballing and reserve fleet states, ship refits and
  reconstructions;
- player-initiated war declarations, peace negotiations (war/blockade
  *display* is in scope; war/blockade *action* is not);
- intelligence quality and uncertain enemy fleet estimates;
- generated starting-fleet behavior behind the Milestone 1 fleet-method
  setting;
- full application-wide metric conversion, automatic historical ship naming;
- ironman mode, cloud saves, multiplayer.
