# First Month at the Admiralty

## 0. Executive Summary

**Domain:** Bluewave Compiler, naval strategy game  
**Applications and packages:** `apps/desktop`, `packages/campaign`, `packages/campaign-engine`  
**Prerequisite:** Milestone 1, Campaign Commissioning Flow, is fully implemented.

Milestone 2 begins when the player selects **Take command** at the end of the Opening Strategic Briefing.

It delivers the first complete strategic gameplay loop:

1. Inspect the opening naval situation.
2. Review priorities and warnings.
3. Adjust the naval budget.
4. Allocate research funding.
5. Inspect active construction.
6. Place a new ship construction order.
7. Review foreign relations.
8. Advance the campaign by one month.
9. Resolve the monthly simulation.
10. Review the resulting naval estimates.
11. Save and continue the campaign.

The milestone's principal acceptance criterion is:

> A player can create a campaign, enter the Overview dashboard, make meaningful strategic decisions, advance one month, observe deterministic consequences, save the result, close the application, reload the campaign, and continue from the exact resulting state.

This milestone does **not** include tactical combat, manual battle resolution, full ship design, detailed regional commitments, or a complete historical event system.

---

# 1. Product Objective

Milestone 1 establishes identity and context. Milestone 2 must establish agency and consequence.

The player should understand, within their first month:

- what the navy owns;
- what the navy costs;
- what is currently being built;
- what technologies are being researched;
- which foreign powers are dangerous;
- which problems require attention;
- which decisions can be made immediately;
- what changes when time advances.

The milestone is successful when the Overview dashboard stops being only an informational destination and becomes the center of a repeatable strategic loop.

---

# 2. Player-Facing Scope

## 2.1 Included

Milestone 2 includes:

- campaign session loading and resumption;
- an upgraded Overview dashboard;
- a guided first-month inspection;
- actionable priority cards;
- treasury and budget controls;
- research allocation controls;
- fleet and construction inspection;
- a constrained ship-construction ordering flow;
- diplomacy and tension inspection;
- end-turn validation;
- monthly simulation;
- monthly report generation;
- autosave and explicit save;
- deterministic reload behavior;
- clear error handling;
- onboarding completion tracking.

## 2.2 Explicitly Out of Scope

The following remain out of scope:

- tactical battle simulation;
- tactical battle UI;
- player-designed ship hulls;
- a full ship designer;
- manual gun, armor, machinery, or fire-control configuration;
- fleet deployment to strategic regions;
- required regional force levels;
- colonial possessions management;
- naval invasions;
- submarine warfare;
- aviation development;
- treaties and naval limitation conferences;
- random historical events;
- government changes;
- officer management;
- crew training management;
- detailed ammunition logistics;
- ship scrapping;
- mothballing and reserve fleet states;
- ship refits and reconstructions;
- player-initiated war declarations;
- peace negotiations;
- intelligence quality and uncertain enemy fleet estimates;
- generated starting-fleet behavior behind the Milestone 1 fleet-method setting;
- full application-wide metric conversion;
- automatic historical ship naming;
- ironman mode;
- cloud saves;
- multiplayer.

These exclusions are intentional. Milestone 2 should prove the strategic turn architecture before introducing broader simulation systems.

---

# 3. End-to-End Player Journey

After selecting **Take command**, the player arrives at the Overview dashboard.

The intended flow is:

1. Overview opens with a concise January situation summary.
2. The First Month Adviser highlights the Treasury panel.
3. The player reviews monthly income and expenditures.
4. The player may adjust the construction and research budgets.
5. The adviser highlights the Research page.
6. The player reviews current research allocation.
7. The adviser highlights Construction.
8. The player inspects active projects.
9. If capacity and funds allow, the player may order one new ship.
10. The adviser highlights Foreign Relations.
11. The player reviews rivals and current tensions.
12. The player returns to Overview.
13. The player selects **Advance Month**.
14. A pre-turn review identifies blockers and warnings.
15. The player confirms.
16. The engine resolves exactly one campaign month.
17. A Monthly Naval Estimates report appears.
18. The player reviews financial, research, construction, and diplomatic changes.
19. The campaign is autosaved.
20. The player closes the report and returns to Overview for the next month.

The guided inspection is recommended but non-blocking. The user may dismiss it and navigate freely.

---

# 4. Campaign Lifecycle

## 4.1 Campaign Status

Introduce an explicit campaign lifecycle value:

```ts
export const campaignStatusSchema = z.enum([
  "commissioning",
  "active",
  "resolution_pending",
  "resolution_failed",
  "archived",
]);

export type CampaignStatus = z.infer<typeof campaignStatusSchema>;
```

Expected behavior:

- `commissioning`: campaign compilation or opening briefing is incomplete;
- `active`: player can inspect state, issue orders, and advance time;
- `resolution_pending`: a monthly turn is being resolved;
- `resolution_failed`: the previous resolution did not commit successfully;
- `archived`: reserved for future use; archived campaigns are read-only.

When the player presses **Take command**, the status transitions from `commissioning` to `active`.

The completion of the opening briefing must be persisted. Reloading the campaign must not show the briefing again.

## 4.2 Campaign Time

Campaign time must be represented as a canonical year and month rather than a presentation string.

```ts
export interface CampaignDate {
  readonly year: number;
  readonly month: number;
}
```

Constraints:

- `year` must be a positive integer;
- `month` must be an integer from `1` through `12`;
- monthly advancement increments the month;
- advancing December increments the year and sets the month to January;
- presentation formatting is performed outside the domain layer.

Examples:

```text
January 1900 -> February 1900
December 1900 -> January 1901
```

## 4.3 Turn Number

Each resolved month receives a monotonically increasing turn number.

```ts
export type CampaignTurnNumber = number;
```

Rules:

- the opening state is turn `0`;
- the first successful monthly resolution produces turn `1`;
- turn numbers never decrease;
- a failed or cancelled resolution does not consume a turn number;
- saved monthly reports are keyed by turn number;
- duplicate resolution requests for the same expected turn must be rejected.

---

# 5. Navigation Architecture

## 5.1 Strategic Sections

The active campaign shell exposes these top-level sections:

1. **Overview**
2. **Fleet**
3. **Construction**
4. **Research**
5. **Treasury**
6. **Foreign Relations**

The sections must share one campaign shell and must not be implemented as unrelated full-screen processes.

The global campaign header shows:

- campaign name;
- player nation;
- current campaign date;
- current naval funds;
- projected monthly surplus or deficit;
- active alerts count;
- save state;
- **Advance Month** action.

## 5.2 Route Ownership

Navigation state belongs to the renderer.

Campaign state belongs to the campaign application layer.

The renderer may choose which section is visible, but it must not independently mutate canonical campaign data.

## 5.3 Deep-Link Behavior

Within a campaign session, priority cards may navigate to a section and optionally focus a specific item.

```ts
type StrategicDestination =
  | { section: "overview" }
  | { section: "treasury"; focus?: "deficit" | "maintenance" | "research" }
  | { section: "research"; focusTechnologyId?: string }
  | { section: "construction"; focusProjectId?: string }
  | { section: "fleet"; focusShipId?: string }
  | { section: "foreign-relations"; focusNationId?: string };
```

These destinations are renderer-level navigation instructions, not persisted domain references.

---

# 6. Overview Dashboard

## 6.1 Purpose

Overview answers four questions:

1. What is the current state of the navy?
2. What requires attention?
3. What changed recently?
4. Can the player safely advance the month?

## 6.2 Dashboard Composition

The Overview dashboard contains:

### Header Summary

- current date;
- player appointment title;
- campaign name;
- fleet strength summary;
- available funds;
- projected monthly balance;
- active construction project count;
- highest foreign tension.

### Immediate Priorities

Display up to five actionable cards sorted by severity.

### Naval Position

- number of active ships by ship type;
- total monthly maintenance;
- largest available dock;
- active construction count;
- total construction expenditure;
- current research expenditure.

### Foreign Situation

- top three highest-tension relationships;
- tension score;
- relations label;
- whether tension increased, decreased, or remained unchanged during the previous month.

### Recent Developments

A chronological list of changes from the most recently resolved turn.

Examples:

- research progress;
- construction progress;
- completed ship;
- budget change;
- diplomatic tension change;
- financial warning.

### Advance Month

The primary action remains visible without requiring the player to scroll on common desktop viewport sizes.

## 6.3 Empty States

Every dashboard region must have a truthful empty state.

Examples:

- no active construction: “No ships are currently under construction.”
- no recent developments: “No monthly developments have been recorded.”
- no immediate priorities: “The Admiralty has identified no urgent concerns.”
- no foreign relationship data: “No foreign relations are available for this campaign.”

Do not show zero-valued charts or fake placeholder content where data is absent.

---

# 7. Immediate Priorities System

## 7.1 Purpose

The priorities system turns underlying simulation data into actionable player guidance.

It must remain deterministic and explainable. It is not an AI recommendation engine.

## 7.2 Priority Shape

```ts
export const prioritySeveritySchema = z.enum([
  "information",
  "advisory",
  "warning",
  "critical",
]);

export interface StrategicPriority {
  readonly id: string;
  readonly type: StrategicPriorityType;
  readonly severity: PrioritySeverity;
  readonly title: string;
  readonly summary: string;
  readonly reason: string;
  readonly destination: StrategicDestination;
  readonly fingerprint: string;
}
```

The `fingerprint` identifies the underlying condition and supports dismissal tracking without conflating different occurrences.

## 7.3 Milestone 2 Priority Types

```ts
export const strategicPriorityTypeSchema = z.enum([
  "monthly_deficit",
  "critical_cash_reserve",
  "low_research_spending",
  "construction_near_completion",
  "construction_stalled",
  "obsolete_active_class",
  "high_foreign_tension",
  "no_active_construction",
]);
```

## 7.4 Trigger Rules

Thresholds must be centralized in the campaign engine, named, documented, and unit-tested.

Recommended initial rules:

### Monthly Deficit

Triggered when:

```text
projectedMonthlyBalance < 0
```

Severity:

- warning when the deficit is affordable from current funds;
- critical when projected available funds after one month would be negative.

### Critical Cash Reserve

Triggered when:

```text
availableFunds < max(totalMonthlyExpenditure, 1)
```

This means the treasury cannot cover one month of current expenditure from reserves.

### Low Research Spending

Triggered when either:

- research spending is zero; or
- research spending is below the configured minimum recommended share of naval allocation.

The initial recommended threshold is 8%.

This percentage must be a named policy constant, not duplicated across UI and engine code.

### Construction Near Completion

Triggered when at least one active project has:

```text
remainingMonths <= 2
```

### Construction Stalled

Triggered when a project cannot progress because of insufficient construction allocation or an invalid project state.

### Obsolete Active Class

Triggered when an active ship design's obsolescence score reaches the engine-defined warning threshold.

If the existing engine does not yet have a trustworthy obsolescence calculation, this priority may initially use only a supported technology-gap comparison. It must not derive obsolescence from ship age because Milestone 1 identified no reliable build-date path.

### High Foreign Tension

Triggered when a foreign relationship reaches the existing high-tension threshold.

The exact threshold must reuse diplomacy-domain policy. It must not be separately invented by the renderer.

### No Active Construction

Triggered when there are zero active construction projects and the nation has sufficient funds and dock capacity to begin at least one supported project.

Severity is advisory, never critical.

## 7.5 Sorting

Priorities sort by:

1. severity;
2. direct financial risk;
3. shortest time to consequence;
4. stable priority type order;
5. stable identifier.

No nondeterministic ordering is allowed.

## 7.6 Dismissal

Players may dismiss `information` and `advisory` priorities for the current turn.

Players may not permanently dismiss `warning` or `critical` priorities.

Dismissal rules:

- dismissal is persisted in campaign UI metadata;
- dismissal expires when the turn advances;
- dismissal is keyed by fingerprint;
- if the underlying condition changes materially, a new fingerprint may display again;
- dismissal does not mutate simulation state.

---

# 8. Guided First Month Inspection

## 8.1 Entry

The guide appears automatically the first time the player enters the strategic dashboard after completing the Opening Strategic Briefing.

It is shown only if:

```ts
onboarding.firstMonthInspectionStatus === "not_started";
```

## 8.2 Guide Steps

The sequence is:

1. Overview
2. Treasury
3. Research
4. Construction
5. Fleet
6. Foreign Relations
7. Advance Month

## 8.3 Behavior

Each step includes:

- a concise title;
- one or two sentences explaining the section;
- a highlighted UI target;
- a **Next** action;
- a **Back** action after the first step;
- **End inspection** on every step;
- progress text such as “3 of 7.”

The guide must not:

- block normal navigation;
- change domain state;
- manufacture recommended values;
- prevent saving;
- prevent advancing the month;
- reopen after completion.

## 8.4 Persistence

```ts
export const firstMonthInspectionStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "dismissed",
]);

export interface FirstMonthInspectionState {
  readonly status: FirstMonthInspectionStatus;
  readonly lastCompletedStep: number | null;
}
```

If the application closes mid-guide, reopening resumes from the last completed step.

Once dismissed or completed, automatic reopening is disabled. A **Restart guided inspection** command is available from Help or campaign settings.

---

# 9. Treasury and Budget Management

## 9.1 Treasury Projection

The Treasury page displays:

### Income

- government naval allocation;
- other engine-backed naval income, if any.

### Expenditure

- fleet maintenance;
- active ship construction;
- research;
- any additional real expenditure category already exposed by the engine.

### Result

- projected monthly surplus or deficit;
- available funds;
- projected funds after month end.

Do not create an “Other expenses” balancing row unless the engine exposes a real category for it.

## 9.2 Budget Controls

Milestone 2 permits adjustment of:

- research allocation;
- construction allocation.

Fleet maintenance is calculated and cannot be directly edited.

Government allocation is externally determined and cannot be edited by the player.

## 9.3 Input Model

Budget values are stored as integer minor currency units.

```ts
export type MoneyAmount = number;
```

Constraints:

- integer;
- non-negative;
- safe integer;
- no floating-point currency storage;
- formatted presentation must not alter the stored value.

## 9.4 Drafting Behavior

Budget edits use renderer draft state.

Changing an input does not immediately mutate the campaign.

Controls:

- **Apply budget**
- **Reset changes**

The application command receives the complete expected budget revision, not a stream of keystrokes.

```ts
export interface ReviseNavalBudgetCommand {
  readonly campaignId: string;
  readonly expectedTurn: number;
  readonly researchAllocation: MoneyAmount;
  readonly constructionAllocation: MoneyAmount;
}
```

## 9.5 Validation

Reject when:

- campaign is not active;
- expected turn is stale;
- values are negative;
- values are not safe integers;
- total player-controlled allocation exceeds the available government allocation after mandatory maintenance;
- the revision violates an existing engine budget invariant.

The renderer must show validation next to the relevant input and preserve the user's draft.

## 9.6 Projection

While the player edits values, the renderer may request a side-effect-free projection.

```ts
export interface ProjectBudgetCommand {
  readonly campaignId: string;
  readonly expectedTurn: number;
  readonly proposedResearchAllocation: MoneyAmount;
  readonly proposedConstructionAllocation: MoneyAmount;
}
```

The projection must use domain calculations. The renderer must not reproduce financial formulas.

Projection results include:

- projected monthly surplus or deficit;
- projected month-end funds;
- warnings;
- affected construction progress;
- affected research progress.

---

# 10. Research Management

## 10.1 Scope

Milestone 2 supports allocation of research spending among existing engine-backed research areas.

It does not add direct technology selection unless the engine already models selectable research projects.

## 10.2 Research Page

The page displays for each research area:

- name;
- description;
- current allocation;
- percentage of research budget;
- current progress;
- current level or known technology state;
- projected monthly progress;
- any real bonuses or penalties.

## 10.3 Allocation Model

Allocations use integer basis points.

```ts
export type BasisPoints = number;
```

Rules:

- minimum `0`;
- maximum `10_000`;
- allocations must total exactly `10_000` when the total research budget is greater than zero;
- when the research budget is zero, the existing allocation distribution remains stored but produces no progress;
- adjustment occurs in stable increments, initially 100 basis points;
- rounding correction is deterministic.

## 10.4 Auto-Balance

If increasing one category causes the total to exceed 10,000 basis points, the UI must either:

1. reduce the previously selected balancing category; or
2. require the player to reduce another category before applying.

The chosen interaction must never silently redistribute all categories.

Recommended behavior:

- one category may be marked as the balancing category;
- changes to other categories adjust only that category;
- if it cannot absorb the difference, the draft is invalid;
- the balancing rule is visible in the UI.

## 10.5 Command

```ts
export interface ReviseResearchAllocationCommand {
  readonly campaignId: string;
  readonly expectedTurn: number;
  readonly allocations: ReadonlyArray<{
    readonly researchAreaId: string;
    readonly basisPoints: number;
  }>;
}
```

Validation must occur using Zod at the IPC boundary and domain rules in the application or domain layer.

## 10.6 Monthly Research Resolution

During month advancement:

1. determine the effective research budget;
2. apply research-speed campaign settings;
3. apply technology-variation settings;
4. distribute research points using allocations;
5. update progress;
6. determine any completed discoveries;
7. emit research report entries.

Research completion must be deterministic for a given campaign seed, turn, and command history.

If technology variation includes randomness, use the campaign RNG stream, never `Math.random()`.

---

# 11. Fleet Inspection

## 11.1 Fleet Page

The Fleet page lists active ships grouped by ship type.

Each ship row displays only engine-backed data:

- ship name or stable generated display fallback;
- class;
- hull type;
- displacement;
- status;
- maintenance cost;
- relevant design summary;
- construction or commission state, if available.

Do not display reserve status, overseas assignment, crew quality, exact ship age, or region assignment unless the underlying domain model genuinely provides those fields.

## 11.2 Filtering and Sorting

Supported filters:

- ship type;
- class;
- status.

Supported sorting:

- name;
- ship type;
- displacement;
- maintenance cost.

Sorting must be stable.

## 11.3 Fleet Summary

The Fleet page header displays:

- active ship count;
- count by ship type;
- total maintenance expense;
- most expensive active class;
- largest active ship by displacement.

All figures are derived in projection builders, not calculated independently inside React components.

## 11.4 Ship Detail

Selecting a ship opens a detail panel rather than a separate application window.

The panel may display:

- identity;
- class and design;
- principal characteristics;
- maintenance;
- supported armament summary;
- supported armor summary;
- supported performance values.

Actions such as refit, scrap, reserve, rename, or deploy are not shown unless implemented. Do not display nonfunctional primary buttons.

---

# 12. Construction Management

## 12.1 Construction Page

The Construction page has two sections:

1. Active projects
2. Available designs

## 12.2 Active Projects

Each project displays:

- ship or project name;
- design or class;
- ship type;
- total projected cost;
- cost paid;
- remaining cost;
- progress percentage;
- projected months remaining;
- assigned shipyard or dock, if the engine exposes one;
- project state.

## 12.3 Supported Project States

```ts
export const constructionProjectStatusSchema = z.enum([
  "planned",
  "active",
  "paused",
  "completed",
  "cancelled",
]);
```

For Milestone 2:

- newly accepted orders become `active`;
- `paused` may be produced automatically by insufficient funding;
- completed projects become `completed`;
- player-initiated cancellation is out of scope unless the engine already safely supports reimbursement and cancellation semantics;
- completed and cancelled projects are shown in historical reports, not the default active list.

## 12.4 Ordering a Ship

Milestone 2 permits construction only from existing compatible designs.

The player cannot create or modify a ship design.

Flow:

1. Select **Order ship**.
2. Choose an available design.
3. Review design summary.
4. Enter a ship name or accept a generated fallback if generation is available.
5. Review dock requirement.
6. Review total projected cost.
7. Review estimated completion time.
8. Review effect on projected monthly balance.
9. Confirm order.
10. Return to Construction with the project visible.

## 12.5 Design Eligibility

A design is eligible only when:

- it belongs to or is available to the player nation;
- it is constructible in the current campaign state;
- at least one player port has sufficient dock capacity;
- its data validates;
- it is not an unsupported foreign-intelligence-only design;
- its projected cost can be computed.

Insufficient current cash does not necessarily make a design ineligible if the engine's construction model pays over time. Instead, the review displays a financial warning.

## 12.6 Ship Naming

Milestone 1 captured:

```ts
namingConvention: "historical" | "generated" | "custom";
shipNameReuse: "allowed" | "disabled";
```

Milestone 2 applies only the minimum naming behavior needed to order a ship.

### Custom

The user enters a name.

Validation:

- trimmed;
- non-empty;
- 60-character maximum;
- no control characters.

### Generated

If a real name-generation source exists, propose a generated name.

If it does not exist, use a neutral sequential fallback:

```text
New [Ship Type] 1
New [Ship Type] 2
```

This fallback must be clearly presented as temporary project identification, not a historically accurate generated name.

### Historical

If no historical naming dataset exists, apply the same fallback as `generated`.

Do not invent historical names in the renderer.

### Reuse Disabled

Reject a name whose normalized form matches:

- an active ship;
- another active construction project;
- another name reserved during the same command.

Normalization must be centralized and deterministic.

## 12.7 Order Command

```ts
export interface PlaceConstructionOrderCommand {
  readonly campaignId: string;
  readonly expectedTurn: number;
  readonly designId: string;
  readonly shipName: string;
  readonly portId?: string;
}
```

The command returns:

```ts
export interface PlaceConstructionOrderResult {
  readonly projectId: string;
  readonly campaignRevision: number;
  readonly warnings: readonly ConstructionWarning[];
}
```

## 12.8 Monthly Construction Resolution

At turn resolution:

1. determine construction budget available;
2. load active projects in stable order;
3. calculate required monthly spending;
4. distribute available construction funds deterministically;
5. advance funded projects;
6. mark unfunded projects paused or stalled;
7. complete qualifying projects;
8. instantiate completed fleet ships;
9. emit construction report entries;
10. carry remaining projects forward.

If the engine already defines a different allocation policy, that policy is authoritative. The UI copy must explain the actual policy.

---

# 13. Foreign Relations

## 13.1 Scope

Foreign Relations remains read-only during Milestone 2.

The player can inspect diplomacy but cannot directly perform diplomatic actions.

## 13.2 Relationship List

For each foreign nation, display:

- nation;
- relations label;
- tension score;
- change since previous month;
- whether the nation is identified as a likely rival in flavor data.

The likely-rival marker is presentation-only and must not alter simulation.

## 13.3 Tension Presentation

The renderer must use domain-provided thresholds or labels. It must not define independent interpretations of numeric tension.

Examples of labels may include cordial, neutral, strained, hostile, and war imminent. Only labels supported by the domain should be used.

## 13.4 Monthly Change

Monthly diplomacy processing may produce bounded tension changes.

Requirements:

- deterministic campaign RNG;
- stable nation processing order;
- persisted resulting values;
- report entries for material changes;
- no transition to a tactical battle;
- no full war system.

If tension reaches a future-war threshold, Milestone 2 emits a critical warning such as:

> Relations have deteriorated to a level that may lead to war in a future milestone.

It must not pretend war mechanics are already implemented.

---

# 14. Advance Month Flow

## 14.1 Entry

The player selects **Advance Month** from the campaign shell or Overview.

## 14.2 Pre-Turn Review

Before resolution, display a review dialog with:

- current date;
- next date;
- available funds;
- projected monthly surplus or deficit;
- active construction project count;
- expected completions;
- current research spending;
- unresolved warnings;
- save status.

Actions:

- **Cancel**
- **Advance to [Month Year]**

## 14.3 Blockers versus Warnings

### Blockers

A blocker prevents advancement.

Initial blockers:

- campaign state is invalid;
- another resolution is already running;
- campaign has unsaved command persistence failure;
- a required allocation does not satisfy domain invariants;
- an active project references missing required data;
- campaign revision is stale;
- save store is unavailable before committing the turn.

### Warnings

Warnings require acknowledgment but do not prevent advancement.

Initial warnings:

- projected monthly deficit;
- zero research spending;
- no active construction;
- construction expected to stall;
- critical foreign tension;
- critically low cash reserve.

The dialog includes:

```text
I understand these warnings and wish to continue.
```

This acknowledgment is required only when at least one critical warning exists.

## 14.4 Resolution Request

```ts
export interface AdvanceCampaignMonthCommand {
  readonly campaignId: string;
  readonly expectedTurn: number;
  readonly expectedRevision: number;
  readonly acknowledgedWarningIds: readonly string[];
  readonly requestId: string;
}
```

`requestId` supplies idempotency.

## 14.5 Cancellation

The IPC command accepts cancellation through an application-layer `AbortSignal`.

Cancellation semantics:

- before commit begins: cancellation returns the campaign to `active`;
- after durable commit begins: cancellation must not produce an ambiguous partial state;
- if the operation cannot safely stop after commit begins, the application finishes the commit and returns the consistent result;
- closing the resolution screen does not destroy the session;
- renderer unmount triggers deterministic listener cleanup.

## 14.6 Resolution Stages

The engine resolves a month in this order:

1. Validate command and current campaign revision.
2. Clone or stage the mutable monthly working state.
3. Determine monthly government allocation.
4. Calculate mandatory fleet maintenance.
5. Apply research expenditure.
6. Resolve research progress and discoveries.
7. Apply construction expenditure.
8. Resolve project progress and completions.
9. Update treasury balance.
10. Resolve diplomacy changes.
11. Rebuild strategic priorities.
12. Generate monthly report.
13. Increment campaign date and turn.
14. Validate the resulting complete campaign state.
15. Persist the new state atomically.
16. Register the committed revision.
17. Return the monthly report projection.

The exact internal placement of date advancement may differ, but all report entries must agree about the resolved period.

## 14.7 Transactional Requirement

Monthly resolution must be atomic from the player's perspective.

Either:

- the entire next-month state and report are saved; or
- the previous state remains the authoritative saved state.

A partially updated campaign must never become loadable.

Recommended save strategy:

1. produce staged state;
2. validate;
3. serialize to a temporary path;
4. flush and close;
5. atomically replace the authoritative campaign state where supported;
6. update metadata only after campaign state succeeds.

## 14.8 Double Submission

While resolution is active:

- disable the advance action;
- disable duplicate confirmation;
- reject another command with the same campaign and expected turn unless it reuses the same idempotent `requestId`;
- repeated calls with the same completed `requestId` return the existing committed result.

---

# 15. Monthly Resolution Presentation

## 15.1 Loading Screen

Title:

> Preparing the Monthly Naval Estimates

Unlike Milestone 1's campaign compilation screen, this process may expose truthful application-level stage progress if the engine command is structured into meaningful stages.

Allowed stages:

- Reviewing naval finances
- Processing fleet maintenance
- Advancing ship construction
- Reviewing research programs
- Assessing foreign relations
- Compiling the naval estimates
- Saving the campaign

The UI must not claim fine-grained percentage completion unless the application reports real measurable progress.

A stage indicator is sufficient.

## 15.2 Progress Contract

```ts
export const monthResolutionStageSchema = z.enum([
  "validating",
  "finances",
  "maintenance",
  "research",
  "construction",
  "diplomacy",
  "reporting",
  "saving",
  "completed",
]);

export interface MonthResolutionProgress {
  readonly requestId: string;
  readonly stage: MonthResolutionStage;
}
```

Progress events:

- are scoped by request ID;
- are validated;
- contain no mutable domain objects;
- are cleaned up after completion, cancellation, or renderer unmount;
- cannot be emitted to unrelated windows.

## 15.3 Failure

On failure, show:

- concise error title;
- safe user-facing explanation;
- whether the previous month remains intact;
- **Return to Overview**;
- **Try Again**, only when retry is safe;
- **Open campaign folder**, only if an existing narrow preload capability supports it safely.

Do not expose stack traces or local paths in the normal UI.

---

# 16. Monthly Naval Estimates Report

## 16.1 Purpose

After a successful turn, show a report explaining exactly what happened.

The report is part of the committed campaign history.

## 16.2 Report Header

Display:

- resolved month;
- new current month;
- turn number;
- campaign name;
- player nation.

## 16.3 Report Sections

### Treasury

- opening funds;
- government allocation;
- maintenance expense;
- construction expense;
- research expense;
- other real engine-backed expenses;
- closing funds;
- surplus or deficit.

### Construction

- progress by project;
- stalled projects;
- completed ships;
- newly active projects, if applicable.

### Research

- progress by research area;
- discoveries completed;
- research budget effectiveness;
- effects of research-speed and technology-variation settings, when explainable.

### Diplomacy

- tension changes;
- relationship label changes;
- nations reaching warning thresholds.

### Fleet

- ships commissioned during the month;
- active fleet totals after resolution;
- new maintenance effect from completed ships.

### Priorities

- new warnings;
- resolved warnings;
- continuing warnings.

## 16.4 Report Data Model

```ts
export interface MonthlyCampaignReport {
  readonly reportId: string;
  readonly campaignId: string;
  readonly turn: number;
  readonly period: {
    readonly from: CampaignDate;
    readonly to: CampaignDate;
  };
  readonly treasury: TreasuryReport;
  readonly research: readonly ResearchReportEntry[];
  readonly construction: readonly ConstructionReportEntry[];
  readonly diplomacy: readonly DiplomacyReportEntry[];
  readonly fleet: readonly FleetReportEntry[];
  readonly priorities: PriorityReport;
  readonly generatedAt: string;
}
```

`generatedAt` is persistence metadata and must not affect simulation determinism.

## 16.5 Closing Actions

- **Return to Overview**
- **Review Construction**, when construction events exist
- **Review Research**, when research events exist

Only one action is primary: **Return to Overview**.

## 16.6 Report History

The most recent 12 reports are available from Overview.

The save format may preserve all reports, but the default UI needs to expose only the most recent 12.

Report history is read-only.

---

# 17. Saving and Loading

## 17.1 Autosave

Autosave occurs:

- after completing the Opening Strategic Briefing;
- after applying a budget revision;
- after applying a research allocation revision;
- after placing a construction order;
- after completing monthly resolution;
- after changing onboarding status.

Multiple rapid UI-only changes may be debounced, but domain commands must not be considered successful until their required persistence contract succeeds.

## 17.2 Save Indicator

The header shows one of:

- Saved
- Saving
- Unsaved changes
- Save failed

The indicator must represent real persistence state.

## 17.3 Manual Save

Provide **Save Campaign** in the campaign menu.

Manual save:

- writes the current authoritative campaign state;
- does not advance time;
- does not generate a report;
- returns a structured result;
- handles permissions and storage errors.

## 17.4 Loading

The campaign list displays:

- campaign name;
- nation;
- current date;
- last successfully saved time;
- campaign status;
- save-format version.

Loading must validate:

- metadata;
- campaign document schema;
- internal references;
- save-format compatibility;
- required engine version constraints.

## 17.5 Failed Load

A corrupt or incompatible campaign must not crash the campaign list.

Show:

- campaign identity where metadata remains readable;
- a concise compatibility or corruption message;
- **Reveal save location**, if securely supported;
- **Return to campaigns**.

Do not attempt silent destructive repair.

## 17.6 Save Versioning

Add an explicit save schema version:

```ts
export const CURRENT_CAMPAIGN_SAVE_VERSION = 2;
```

Milestone 1 saves must either:

- already produce version 2; or
- migrate through a tested `v1 -> v2` migration.

Migration must:

- be deterministic;
- preserve the original save until successful;
- validate its result;
- record no fabricated gameplay events;
- initialize new UI metadata with safe defaults.

---

# 18. Determinism

## 18.1 Requirement

Given:

- the same initial campaign state;
- the same campaign seed;
- the same ordered player commands;
- the same engine version;
- the same turn number;

monthly resolution must produce the same simulation result.

## 18.2 Randomness

All simulation randomness must use explicit campaign RNG facilities.

Forbidden in domain and application simulation:

```ts
Math.random();
Date.now();
crypto.randomUUID();
```

These may be used for non-simulation metadata only where appropriate, but not to determine research, diplomacy, construction, finances, or fleet results.

## 18.3 RNG Streams

Prefer named RNG streams:

```ts
type CampaignRandomStream = "research" | "diplomacy" | "events" | "naming";
```

Milestone 2 uses only streams required by implemented behavior.

One subsystem must not change another subsystem's results merely because it consumes an additional random number.

## 18.4 Stable Iteration

All domain collections whose ordering affects results must be explicitly sorted by stable identifiers before resolution.

Do not rely on object property insertion order, filesystem ordering, database retrieval order, or React render order.

---

# 19. State and Command Architecture

## 19.1 Separation

### Domain

Owns:

- campaign date;
- treasury rules;
- budget constraints;
- research allocation invariants;
- construction progression;
- diplomacy progression;
- strategic-priority evaluation;
- monthly report facts.

### Application

Owns:

- campaign command orchestration;
- expected-turn checks;
- idempotency;
- transactions;
- cancellation;
- persistence sequencing;
- projection construction.

### Infrastructure

Owns:

- save file access;
- atomic replacement;
- session registry;
- Electron IPC transport;
- system dialogs and shell capabilities.

### Renderer

Owns:

- navigation;
- ephemeral input drafts;
- disclosure state;
- sorting and filtering preferences;
- guide presentation;
- selected rows and panels.

The renderer must not contain authoritative simulation formulas.

## 19.2 Campaign Revision

Add a monotonically increasing campaign revision independent of the monthly turn number.

The revision increments after every successful state-changing command, including:

- budget revision;
- research allocation revision;
- construction order;
- onboarding completion if stored with campaign data;
- monthly advancement.

Commands include `expectedRevision` when stale writes would be dangerous.

## 19.3 Command Result

All state-changing commands return:

```ts
export type CampaignCommandResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
      readonly campaignRevision: number;
    }
  | {
      readonly ok: false;
      readonly error: CampaignCommandError;
    };
```

No command may communicate ordinary expected failure only by throwing an untyped exception.

---

# 20. IPC and Electron Security

## 20.1 Preload Capabilities

Expose narrow capabilities, not raw Electron objects.

```ts
interface CampaignApi {
  loadOverview(input: LoadOverviewInput): Promise<LoadOverviewResult>;
  loadFleet(input: LoadFleetInput): Promise<LoadFleetResult>;
  loadConstruction(
    input: LoadConstructionInput,
  ): Promise<LoadConstructionResult>;
  loadResearch(input: LoadResearchInput): Promise<LoadResearchResult>;
  loadTreasury(input: LoadTreasuryInput): Promise<LoadTreasuryResult>;
  loadDiplomacy(input: LoadDiplomacyInput): Promise<LoadDiplomacyResult>;

  reviseBudget(input: ReviseBudgetInput): Promise<ReviseBudgetResult>;
  reviseResearch(input: ReviseResearchInput): Promise<ReviseResearchResult>;
  placeConstructionOrder(
    input: PlaceConstructionOrderInput,
  ): Promise<PlaceConstructionOrderResult>;

  advanceMonth(input: AdvanceMonthInput): Promise<AdvanceMonthResult>;
  saveCampaign(input: SaveCampaignInput): Promise<SaveCampaignResult>;

  subscribeToMonthProgress(
    requestId: string,
    listener: (event: MonthProgressEvent) => void,
  ): () => void;
}
```

## 20.2 Validation

Validate:

- renderer input in preload;
- IPC input again in main or application boundary;
- command results before exposing them to renderer;
- progress events before invoking renderer callbacks;
- persisted documents on load.

Schemas should live in a package usable from both sides without importing Electron into domain packages.

## 20.3 Listener Cleanup

Every subscription returns an unsubscribe function.

Required cleanup paths:

- operation completion;
- operation failure;
- cancellation;
- React effect cleanup;
- renderer navigation;
- window destruction.

Listeners must be keyed by request ID and sender identity.

## 20.4 Electron Configuration

Retain:

- `contextIsolation: true`;
- `nodeIntegration: false`;
- sandboxing where compatible;
- no raw `ipcRenderer` exposure;
- no arbitrary filesystem capability;
- no arbitrary shell execution;
- no renderer-selected unrestricted path writes;
- restrictive navigation and window-opening policy.

---

# 21. Error Taxonomy

```ts
export const campaignOperationFailureReasonSchema = z.enum([
  "CAMPAIGN_NOT_FOUND",
  "INVALID_CAMPAIGN_STATE",
  "INVALID_COMMAND",
  "STALE_CAMPAIGN_REVISION",
  "TURN_ALREADY_IN_PROGRESS",
  "TURN_ALREADY_RESOLVED",
  "INSUFFICIENT_DOCK_CAPACITY",
  "DUPLICATE_SHIP_NAME",
  "DESIGN_NOT_AVAILABLE",
  "INVALID_BUDGET_ALLOCATION",
  "INVALID_RESEARCH_ALLOCATION",
  "SAVE_FAILED",
  "LOAD_FAILED",
  "SAVE_VERSION_UNSUPPORTED",
  "CAMPAIGN_DATA_CORRUPT",
  "RESOLUTION_FAILED",
  "OPERATION_CANCELLED",
]);
```

## 21.1 User Treatment

### Validation Failures

Show inline, retain input, allow correction.

### Stale State

Refresh the affected projection and explain:

> The campaign changed after this page was opened. Your information has been refreshed.

Preserve the draft only if it is safe to revalidate.

### Save Failure

Make the failure persistent and visible. Do not show “Saved.”

### Resolution Failure

Return to the previous committed state.

State clearly:

> The month was not advanced. Your previous saved campaign remains intact.

### Cancellation

Treat user cancellation as neutral, not an error.

---

# 22. Accessibility and Interaction Requirements

All interactive elements must:

- be keyboard reachable;
- have visible focus indication;
- expose accessible names;
- not depend on color alone;
- support reduced-motion preferences;
- preserve logical focus after dialogs close;
- announce validation and save failures;
- announce monthly resolution completion.

Charts must have a textual or tabular equivalent.

Progress animation must respect `prefers-reduced-motion`.

The guide must not trap keyboard focus outside its active explanation and target controls.

---

# 23. Performance Requirements

Initial targets:

- Overview projection for a normal campaign: under 250 ms at the application layer;
- section navigation after data is loaded: under 100 ms perceived response;
- command validation: under 50 ms excluding persistence;
- ordinary campaign save: under 1 second on supported local storage;
- no unbounded renderer list rendering;
- no full save-document transfer when a narrow projection is sufficient.

These are engineering targets rather than player-visible guarantees. Performance tests should use representative campaign fixtures rather than empty campaigns only.

---

# 24. Telemetry and Diagnostics

If the project has no established telemetry policy, do not add external analytics in this milestone.

Local structured diagnostics may include:

- campaign command type;
- request ID;
- campaign ID in redacted or non-personal form;
- expected and actual revision;
- resolution stage;
- duration;
- failure category.

Diagnostics must not include:

- admiral name;
- campaign name;
- ship names;
- full save paths;
- complete campaign documents.

---

# 25. Testing Strategy

## 25.1 Domain Unit Tests

At minimum:

### Date

- January to February;
- December to January with year increment;
- invalid month rejection.

### Budgets

- valid budget;
- negative allocation rejection;
- over-allocation rejection;
- exact balance;
- projected deficit;
- safe-integer validation.

### Research

- allocations total 10,000;
- under-total rejection;
- over-total rejection;
- zero-budget behavior;
- deterministic progress;
- research-speed modifier;
- technology-variation determinism.

### Construction

- project progresses;
- insufficient funding stalls project;
- completion creates one ship;
- completed project does not complete twice;
- stable allocation order;
- duplicate name rejection;
- dock-capacity rejection.

### Priorities

- each trigger;
- severity;
- stable sorting;
- fingerprints;
- dismissal expiration.

### Monthly Resolution

- full successful turn;
- no partial mutation on failure;
- turn increments once;
- date increments once;
- report reconciles with final state;
- same input produces same output;
- repeated request does not double-advance.

## 25.2 Application Tests

Test:

- expected-turn enforcement;
- expected-revision enforcement;
- command idempotency;
- cancellation before commit;
- cancellation after commit begins;
- atomic persistence failure;
- projection building;
- report retrieval;
- save migration;
- failed migration preserves original.

## 25.3 IPC Contract Tests

Test:

- malformed input rejected;
- unexpected fields rejected where schemas are strict;
- malformed output not exposed;
- progress event scoping;
- sender isolation;
- unsubscribe cleanup;
- destroyed-window cleanup.

## 25.4 Renderer Tests

Test:

- dashboard empty states;
- priority navigation;
- budget draft preservation;
- research total validation;
- construction-order validation;
- double-click advance protection;
- warning acknowledgment;
- loading and failure states;
- monthly report navigation;
- guided inspection resume;
- guided inspection dismissal;
- accessible labels.

## 25.5 End-to-End Tests

### Happy Path

1. Create campaign.
2. Complete briefing.
3. Inspect Overview.
4. Revise research allocation.
5. Place construction order.
6. Advance one month.
7. View report.
8. Close application.
9. Reopen campaign.
10. Verify date, funds, project progress, and report.

### Deficit Path

1. Configure a projected deficit.
2. Start advancement.
3. Verify warning.
4. Acknowledge.
5. Resolve.
6. Verify closing funds and priority.

### Save Failure Path

1. Inject save failure.
2. Advance month.
3. Verify previous month remains loadable.
4. Verify no success report is registered.

### Duplicate Submission Path

1. Trigger advance twice.
2. Verify only one committed turn.
3. Verify only one monthly report.

### Packaged Smoke Test

In a packaged Electron build:

1. Launch application.
2. Load a fixture campaign.
3. Navigate to all six strategic sections.
4. Advance a month.
5. Save.
6. Quit.
7. Relaunch.
8. Confirm persisted state.

---

# 26. Implementation Sequence

## Ticket Group A: Campaign Time and Revision

- canonical campaign date;
- turn number;
- campaign revision;
- campaign lifecycle;
- schemas and migrations;
- domain tests.

## Ticket Group B: Strategic Projections

- Overview projection;
- Fleet projection;
- Treasury projection;
- Research projection;
- Construction projection;
- Diplomacy projection.

## Ticket Group C: Priority Engine

- priority rules;
- severity;
- stable sorting;
- fingerprints;
- dismissal metadata;
- tests.

## Ticket Group D: Campaign Shell

- global navigation;
- campaign header;
- save indicator;
- Advance Month entry;
- error boundary;
- responsive desktop layout.

## Ticket Group E: Treasury

- projection;
- budget draft;
- validation;
- application command;
- persistence;
- renderer tests.

## Ticket Group F: Research

- allocation model;
- allocation editor;
- projection;
- monthly research resolution;
- report entries;
- deterministic tests.

## Ticket Group G: Fleet and Construction

- fleet list and detail;
- active-project list;
- available designs;
- order review;
- naming validation;
- order command;
- completion integration.

## Ticket Group H: Diplomacy

- relationship projection;
- tension labels;
- monthly deterministic change;
- report entries;
- high-tension priority.

## Ticket Group I: Monthly Resolution

- command;
- stage orchestration;
- cancellation;
- idempotency;
- transaction;
- atomic save;
- structured result.

## Ticket Group J: Monthly Report

- report model;
- report projection;
- report screen;
- report history;
- cross-section navigation.

## Ticket Group K: Guided Inspection

- persisted status;
- seven steps;
- highlighting;
- focus behavior;
- dismissal and restart.

## Ticket Group L: Hardening

- migration fixtures;
- packaged smoke test;
- listener-leak testing;
- save corruption handling;
- performance checks;
- accessibility audit;
- validation report.

---

# 27. Definition of Done

Milestone 2 is complete only when all the following are true:

- `Take command` transitions into an active strategic campaign.
- The opening briefing does not repeat after completion.
- Overview displays only real or explicitly presentation-derived data.
- Treasury values reconcile with the campaign economy.
- Research allocation is editable and validated.
- Existing ship designs can be ordered for construction.
- Construction progresses when a month advances.
- Completed construction produces a valid fleet ship.
- Foreign relations are visible.
- Priorities are deterministic and actionable.
- The guided first-month inspection can be completed or dismissed.
- The player can advance exactly one month.
- Duplicate requests cannot advance two months.
- Monthly resolution is deterministic.
- Monthly resolution is atomic.
- A monthly report explains the resulting changes.
- Autosave persists the successful turn.
- Save failures do not corrupt the previous campaign.
- Reload restores the exact committed state.
- IPC inputs and outputs are Zod-validated.
- Preload exposes only narrow capabilities.
- All progress listeners are cleaned up.
- Domain and application packages remain independent of Electron and React.
- Boundary tests pass.
- End-to-end tests pass.
- Packaged smoke tests pass.
- An ADR records the monthly-resolution transaction and idempotency model.
- A validation report documents commands run, results, known limitations, and remaining risks.

---

# 28. Required ADRs

## ADR: Monthly Resolution Transaction Boundary

Must decide and document:

- staged-state strategy;
- atomic persistence mechanism;
- commit point;
- rollback behavior;
- report persistence ordering;
- cancellation behavior around the commit point.

## ADR: Deterministic Random Streams

Must document:

- seed derivation;
- subsystem stream isolation;
- stable collection ordering;
- serialization of RNG state;
- compatibility expectations across engine versions.

## ADR: Command Idempotency and Campaign Revision

Must document:

- request ID lifecycle;
- duplicate command handling;
- stale revision handling;
- distinction between turn and revision;
- recovery after a renderer or application restart.

## ADR: Projection versus Persisted Domain Data

Must document which data is:

- canonical;
- derived by engine projection;
- persisted UI metadata;
- renderer-only state.

---

# 29. Validation Report Template

```md
# Milestone 2 Validation Report

## Environment

- Operating system:
- Node version:
- pnpm version:
- Electron version:
- Commit:
- Build type:

## Static Validation

- pnpm lint:
- pnpm typecheck:
- pnpm test:
- pnpm build:

## Package Validation

- campaign:
- campaign-engine:
- desktop main:
- desktop preload:
- desktop renderer:

## Behavioral Validation

- Campaign loading:
- Budget revision:
- Research revision:
- Construction order:
- Month advancement:
- Monthly report:
- Autosave:
- Reload:
- Duplicate submission:
- Cancellation:
- Save failure recovery:

## Packaged Smoke Test

- Package creation:
- Application launch:
- Campaign load:
- Month advancement:
- Save and relaunch:

## Persistence Validation

- Save version:
- Migration:
- Atomic replacement:
- Corrupt save handling:

## Security Validation

- Context isolation:
- Node integration:
- Preload capability review:
- IPC schema review:
- Listener cleanup:

## Known Limitations

- ...

## Result

PASS | PASS WITH LIMITATIONS | FAIL
```

---

# 30. Recommended Milestone Boundary

The milestone should end after the player has completed at least one peaceful strategic month.

The ideal transition into Milestone 3 is:

> The strategic loop works, saves reliably, produces deterministic monthly results, and can now support incidents, war pressure, and eventually tactical battles.

A suitable Milestone 3 would then be **International Incidents, War Risk, and Battle Generation**, followed by a later milestone for tactical combat.
