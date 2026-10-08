# Spec: First Month at the Admiralty (Milestone 2)

Everything from **Take command** at the end of the Opening Strategic Briefing
through the first complete strategic gameplay loop — Overview dashboard,
priorities, guided first-month inspection, Treasury/Research/Fleet/Construction/
Diplomacy inspection and control, Advance Month with pre-turn review, monthly
resolution, the Monthly Naval Estimates report, and save/load with a
campaign-list screen. Assembled from the eighteen resolved decision tickets on
the [First Month at the Admiralty map](./map.md) (`wayfinder:map`). Source
idea: [01-diagnosis.md](./01-diagnosis.md), a Rule the Waves 3-inspired design
doc — treated as inspiration/reference copy, not a binding spec; every factual
claim was verified per ticket against the real code, and unbacked proposals
were cut or reshaped (see Out of scope, below).

Domain: Bluewave Compiler, a naval strategy game (`apps/desktop`,
`packages/campaign`, `packages/campaign-engine`, `packages/phase-engine`,
`packages/persistence`, `packages/random`, `packages/commands`). Fixed inputs
from the completed Campaign Commissioning Flow effort (admiral/campaign
identity fields, preferences, archetype, fleet method, "Take command" landing
on the existing Overview dashboard) are not revisited here.

---

## 0. Executive Summary

Milestone 2 begins when the player selects **Take command** at the end of the
Opening Strategic Briefing, and delivers the first complete strategic gameplay
loop:

1. Inspect the opening naval situation (Overview dashboard + guided first-month
   inspection).
2. Review priorities and warnings (Immediate Priorities panel).
3. Review the Treasury position — **read-only**; there are no budget controls
   in M2 (research budget and government appropriation are compile-fixed,
   construction has no scalar allocation dial).
4. Allocate research funding — field-level priorities over the real
   integer-weight model.
5. Inspect active construction projects.
6. Place a new ship construction order (select-design → review → confirm).
7. Review foreign relations — the already-shipped read-only Diplomacy & War
   surface.
8. Advance the campaign by one month, through a pre-turn review.
9. Resolve the monthly simulation (the real `commitMonth` +
   `MonthExecutor` pipeline; tactical battle outcomes surface as report text
   only, no tactical UI).
10. Review the Monthly Naval Estimates report.
11. Save and continue the campaign (mature save/load + a new campaign-list
    screen).

The milestone's principal acceptance criterion is:

> A player can create a campaign, enter the Overview dashboard, make meaningful
> strategic decisions, advance one month, observe deterministic consequences,
> save the result, close the application, reload the campaign, and continue
> from the exact resulting state.

"Meaningful strategic decisions" in the resolved reality are: research field
priority edits, construction ordering (and in-flight replace/cancel), and the
Advance Month decision itself. The Treasury is a read-only projection screen.

This milestone does **not** include tactical combat UI, manual battle
resolution, full ship design, detailed regional commitments, or a complete
historical event system. Note the charting correction to the diagnosis doc's
framing: the real month pipeline already runs tactical battle generation and
resolution as part of monthly resolution — battle outcomes are surfaced
minimally (losses/outcomes as plain text in the Naval Estimates report), not
hidden.

---

## 1. Product Objective

Milestone 1 establishes identity and context. Milestone 2 must establish
**agency and consequence**.

The player should understand, within their first month:

- what the navy owns;
- what the navy costs;
- what is currently being built;
- what technologies are being researched;
- which foreign powers are dangerous;
- which problems require attention;
- which decisions can be made immediately (research field priorities,
  construction ordering, Advance Month — Treasury is read-only);
- what changes when time advances.

The milestone is successful when the Overview dashboard stops being only an
informational destination and becomes the center of a repeatable strategic
loop — inspect, prioritize, decide, advance, observe, save, repeat.

---

## 2. Player-Facing Scope

## 2.1 Included

Milestone 2 includes:

- campaign session loading and resumption, including a new campaign-list
  screen (§17);
- an upgraded Overview dashboard (§6);
- a guided first-month inspection (§8);
- actionable priority cards — 6 of the 8 doc types (§7);
- a read-only Treasury projection screen (§9) — the doc's "treasury and budget
  controls" item, reshaped: budget controls are out;
- research allocation controls — field-level priority editing over the real
  weight-based model (§10);
- fleet and construction inspection (§11, §12);
- a constrained ship-construction ordering flow (§12);
- read-only diplomacy, war and blockade inspection (§13);
- a pre-turn review ahead of Advance Month (§14);
- monthly simulation — the real `commitMonth` pipeline, with battle outcomes
  surfaced as report text (§14, §15);
- the Monthly Naval Estimates report (§16);
- autosave and explicit save (§17);
- deterministic reload behavior (§17, §18);
- clear error handling via the real `BridgeResult` shape (§4, §14, §15);
- onboarding completion tracking (§8, §17).

## 2.2 Explicitly Out of Scope

The following remain out of scope, unchanged from the diagnosis doc's §2.2
except where a charting decision changed the framing:

- tactical battle simulation and tactical battle UI — battle outcomes are
  surfaced as report text only, per the charting decision;
- player-designed ship hulls, a full ship designer, manual gun/armor/
  machinery/fire-control configuration;
- fleet deployment to strategic regions, required regional force levels,
  colonial possessions management;
- naval invasions, submarine warfare, aviation development;
- treaties and naval limitation conferences;
- random historical events, government changes;
- officer management, crew training management, detailed ammunition logistics;
- ship scrapping, mothballing and reserve fleet states, ship refits and
  reconstructions;
- player-initiated war declarations, peace negotiations — war/blockade
  *display* is in scope (read-only); war/blockade *action* is not;
- intelligence quality and uncertain enemy fleet estimates;
- generated starting-fleet behavior behind the Milestone 1 fleet-method
  setting;
- full application-wide metric conversion, automatic historical ship naming;
- ironman mode, cloud saves, multiplayer.

---

## 3. End-to-End Player Journey

After selecting **Take command**, the player arrives at the Overview dashboard.

The intended flow is:

1. Overview opens with a concise January situation summary — the upgraded
   dashboard (§6).
2. The First Month Adviser (guided inspection, §8) highlights the Treasury
   panel.
3. The player reviews monthly income and expenditures on the **read-only**
   Treasury projection (§9). There is no budget adjustment: the doc's step 4
   ("adjust the construction and research budgets") is **cut** — research's
   total budget and the government appropriation rate are both compile-fixed,
   and construction has no scalar allocation dial. Research allocation happens
   on the Research page via the real weight-based priority command.
4. The adviser highlights the Research page.
5. The player reviews the current research allocation and edits field
   priorities (§10).
6. The adviser highlights Construction.
7. The player inspects active projects (§12).
8. If capacity and funds allow, the player may order one new ship via the
   select-design → review → confirm wizard (§12). There is no ship-naming step.
9. The adviser highlights Foreign Relations — the read-only Diplomacy & War
   surface (Relations / Wars / Blockades) (§13).
10. The player returns to Overview.
11. The player selects **Advance Month**.
12. A pre-turn review identifies blockers and warnings (§14). The warnings
    section is the priorities projection (§7); the financial figures come from
    the two new `PlayerProjection.economy` fields (§9).
13. The player confirms.
14. The engine resolves exactly one campaign month — the real `commitMonth` +
    `MonthExecutor` pipeline, overlaid by a cosmetic loading sequence (§15).
15. A Monthly Naval Estimates report appears (§16).
16. The player reviews financial, research, construction, and battle changes.
17. The campaign is autosaved (the real commit path persists atomically).
18. The player closes the report and returns to Overview for the next month.

The guided inspection is recommended but non-blocking. The user may dismiss it
and navigate freely.

---

## 4. Campaign Lifecycle

Resolved by [Campaign lifecycle, time & revision model](./issues/01-campaign-lifecycle-time-revision.md).

**Campaign status — the doc's 5-value enum is dropped.** No campaign-level
status concept exists anywhere: `packages/campaign` has only unrelated
per-entity status enums, and `CampaignSessionState` carries only a binary
`isTerminal: boolean`. "Take command" is pure UI navigation with zero state
mutation. The spec describes campaign status as a **UI-derived** concept —
running / resolving / ended — built from `isTerminal` plus the in-flight-command
state the desktop app already tracks, not new engine enum work.

**CampaignDate** is documented as the canonical nested `{year, month}` shape
(the desktop app reads `month.year`/`month.month` off `PlayerProjection`), with
a one-line note that internal session state stores it flat
(`currentYear`/`currentMonth`). `turnNumber: SafeInt` is real, starts at `0`,
and increments only in `advanceCampaignMonth`.

**Campaign revision — `turnNumber` reused, not a new counter.**
`PlayerProjection.revision` is literally `Number(snapshot.turnNumber)` — not a
separate incrementing-per-command counter — yet `expectedRevision`/
`currentRevision` optimistic-concurrency is already wired through research,
diplomacy, construction, and simulation screens. **Known-gap callout:** two
conflicting same-month edits (e.g. two research-priority submissions) both see
the same "current" revision, so turnNumber-as-revision cannot detect same-month
conflicts, only stale-month submissions. Documented as a known gap, not new
work; a real per-mutation counter is flagged as a small follow-up.

**Command results — the real `BridgeResult<T>` shape.** All campaign commands
are documented in terms of the real 3-outcome shape
(`success` / `rejected` with free-text `reason` + optional `currentRevision` /
`error` with free-text `reason`), already used across research/diplomacy/
construction/simulation screens. The doc's invented closed
`CampaignCommandResult<T>` union is dropped; `reason` stays free-text
(tightening into a closed enum is a cross-cutting API-hardening change out of
this milestone's scope).

---

## 5. Navigation & Campaign Shell

Resolved by [Navigation & campaign shell](./issues/02-navigation-campaign-shell.md).

A real campaign shell already exists (`apps/desktop/src/renderer/shell/`); this
section reconciles the doc against it, not designs from scratch.

**Sections.** All six sections ship together in the nav shell. The registry
already has real routes for Overview, Construction, Fleet, Research, and
Diplomacy. Treasury gets a sixth registry slot (sidebar entry + route) that
renders a stub ("not yet available") until the Treasury ticket lands and wires
it to real state — same conditional-registration pattern already used for
debug-only screens. Treasury's missing IPC command blocks *that ticket's*
implementation only, never nav-shell design.

**Campaign header** — real vs. gap:

| Header field | Real state |
|---|---|
| Current date | Real — `month.year`/`month.month` on `PlayerProjection` |
| Current funds | Real — `economy.treasury` |
| Advance Month | Real, already wired — `commitMonth` via `SiteHeader`'s `onAdvanceMonth` |
| Nation name | **New small `PlayerProjection` addition** — project `NationState.name` alongside the existing `economy`/`month` fields (header plumbing, not Treasury logic) |
| Projected surplus/deficit | **New small `PlayerProjection` addition** — sourced from `NationState.income`/`expenses`/`maintenanceCost` (the same raw fields Treasury uses), added now |
| Active alerts count | **Forward-wired** — the slot is populated once the Immediate Priorities engine (§7) lands; not built here |
| Save state | The existing `saving`/`saveMessage` pair (transient save-in-progress/toast state); a dirty-flag concept is out of scope |

**Route ownership** — confirmed matching as-is: navigation state belongs to the
renderer (`campaign-shell-state.ts` is a pure reducer over navigation/UI state;
`CampaignScreenOutlet` passes only `sessionId` into screens); campaign state
belongs to the campaign application layer, and all mutations route through
`CampaignCommandClient.execute(...)`, never a direct renderer state write.

**Deep-link destinations.** The `StrategicDestination` union is renderer-level
navigation, not persisted. One concrete correction: the shipped screen is
labeled "Diplomacy & War" (id `diplomacy`), so the union's
`"foreign-relations"` literal is **renamed to `"diplomacy"`** — the doc
conforms to the real, working screen. Every `focus*` field (`focusTechnologyId`,
`focusProjectId`, `focusShipId`, `focusNationId`, treasury's `focus`) stays
**unvalidated for now** — their real targets are produced by later tickets.
Standing follow-up: re-check the union once those tickets land, trimming any
field with no real navigable target. Note: no `treasury` route exists (only the
stub slot); cash priorities point at `overview`, where the treasury panel lives.

---

## 6. Overview Dashboard

Resolved by [Overview dashboard](./issues/03-overview-dashboard.md).

Correction recorded by the ticket: the map's earlier Fleet note (ships as
"`name`/`designId`/`status`-only") was inaccurate — the real `Ship` has **no
`status` field at all** but carries `classId`, `firepower`, `armor`, `speed`,
`constructionProgress`, and `isUnderConstruction` directly; only hull
type/displacement require the design-catalog join (see §11).

### Header Summary

All doc fields kept, with these reshapes:

- **Player appointment title** → repurposed to the real persisted `admiralName`
  field (Milestone 1 identity). No "appointment title" concept exists anywhere
  in the domain.
- **Fleet strength summary, active construction project count, highest foreign
  tension** — none backed by an existing aggregate field; all three are
  **fresh derivations** (the ticket decides *what* they summarize; the
  derivation itself belongs to the projection builder).
- Current date, available funds, and projected monthly balance as in §5;
  campaign name from the Milestone 1 identity field (kept — ticket 03 lists no
  reshape for it).

### Naval Position

- Number of active ships by ship type — derived.
- **Total monthly maintenance** — **re-derived** fresh from ships (the
  `OpeningBriefingProjection.treasury` pattern), *not* read from
  `maintenanceCost`, which is `0` before the first `commitMonth` and unreliable
  at the exact moment Overview first matters.
- **Largest available dock → renamed "Largest port capacity"** — no real dock
  entity exists; this is the same approximate port-`level` proxy already used
  elsewhere (`largestDockCapacity`, `PlayerProjection.economy.shipyardCapacity`).
- Active construction count — derived.
- Total construction expenditure — `constructionSpend` (§9's new economy
  field).
- Current research expenditure — `researchSpend` (§9's new economy field).

### Foreign Situation

- Top three highest-tension relationships with tension score.
- **Relations label** — specified as depending on the tension-threshold
  policy ticket (§13): the field is `tensionLabel(tension)` from
  `@bluewave/campaign-engine` — the ONE engine taxonomy, never renderer-
  re-derived.
- **Tension trend (increased/decreased/unchanged) — cut.** No previous-turn
  tension is stored anywhere; adding a `previousTension` field is persisted-
  state/save-schema surface area not worth spending against this milestone's
  "prove the strategic loop" goal. Left as a future-milestone candidate.

### Immediate Priorities panel

The doc's shape is accepted **as-is, presentation only**: a card list
(title/summary/severity badge/`destination` link), **hard cap at 5**, sorted by
severity per the §7 sort rules, no pagination, and the doc's empty-state copy
verbatim ("The Admiralty has identified no urgent concerns."). Per-severity
visual treatment (color/icon) is implementation detail, not a spec decision.
The underlying priority *system* is §7.

### Recent Developments

**Confirmed to draw from the Monthly Naval Estimates report's entries** — no
separate report-independent activity-feed concept exists (the phase engine's
only related primitive is the single `"ConstructionProgressed"` event type).
Explicit forward dependency: "renders the most recently resolved turn's report
entries; exact entry shape TBD by §16."

### Advance Month

The primary action remains visible without scrolling on common desktop viewport
sizes (unchanged).

### Empty States

The doc's four example empty states stand as-is ("no active construction," "no
monthly developments," "no immediate priorities," "no foreign relations"). No
new empty state is needed for the cut tension-trend indicator; no empty state
is needed for a portless nation (every nation has a home port by construction).

---

## 7. Immediate Priorities System

Resolved by [Immediate priorities engine](./issues/04-immediate-priorities-engine.md).
A wholly new, pure, **read-only projection** in `@bluewave/campaign-engine`
(new `src/priorities.ts`, re-exported like `diplomacy.ts`/`research.ts`): a pure
function `buildPrioritiesProjection(snapshot, playerNationId)`. It never writes
to the snapshot and is **not** wired into `MonthExecutor`, so it cannot change
authoritative hashes (projections are read-only over the immutable snapshot;
`commitMonth` builds the executor from the snapshot directly, never from a
projection).

**Headline: M2 ships 6 of the 8 doc priority types.** `obsolete_active_class`
and `construction_stalled` are cut with recorded reasons — neither has a
trustworthy derivable signal on the real snapshot today.

### Shape

`StrategicPriority { id, type, severity, title, summary, reason, destination,
fingerprint }` + `prioritySeveritySchema`
(`information | advisory | warning | critical`) + `strategicPriorityTypeSchema`
are adopted as-is — a presentation record. Deterministic `id` and `fingerprint`
derive from the *condition identity* via canonical serialization
(`high_foreign_tension:<relationNationId>`,
`construction_near_completion:<projectId>`), so distinct occurrences never
conflate. `destination` maps to a **real screen** from the shipped registry
(`overview | construction | fleet | research | diplomacy`); `focus*` fields
stay unvalidated per §5. No `treasury` route exists — cash priorities point at
`overview`.

### Per-type verdicts

| Type | Verdict | Real backing |
| --- | --- | --- |
| `monthly_deficit` | **BUILDABLE** | projected balance = `monthlyAppropriation − maintenanceCost − constructionSpend − researchSpend`, all engine-backed once §9's two new `PlayerProjection.economy` fields land |
| `critical_cash_reserve` | **BUILDABLE** | `treasury < max(totalMonthlyExpenditure, 1)` with `totalMonthlyExpenditure = maintenanceCost + constructionSpend + researchSpend` (same §9 fields) |
| `low_research_spending` | **BUILDABLE** | `researchBudget` is real (compiled, default 0); ratio to `monthlyAppropriation` real; 8% threshold centralized as `MIN_RESEARCH_SHARE_BP = 800` |
| `construction_near_completion` | **BUILDABLE (adapted)** | `totalWork`/`completedWork`/`status` real; trigger adapted to a work-ratio proxy — see below |
| `construction_stalled` | **CUT** | No from-snapshot signal — see below |
| `obsolete_active_class` | **CUT** | No signal at all — see below |
| `high_foreign_tension` | **BUILDABLE** | `isHighTension`/`HIGH_TENSION_THRESHOLD = 8`/`tensionLabel` real (§13); numeric `tension` per relation real |
| `no_active_construction` | **BUILDABLE** | Real predicate from the appropriation phase: zero `constructionProjects` with `status !== "COMPLETED"`; "sufficient funds + dock capacity" = `treasury > 0` and `shipyardCapacity > 0` and ≥ 1 eligible design in the real construction design catalog. Severity advisory, never critical |

**`obsolete_active_class` — CUT.** No obsolescence score exists anywhere;
`CompiledDesignVersion` has no era/introduced-year/vintage field; and the doc's
own fallback — a technology-gap comparison — is also unbuildable because
**no design→required-tech mapping exists**: `requiredTechnologyIds` is
hardcoded `[]`. The briefing's "obsolescence" concern category is actually a
capital-ship-presence heuristic (no `battleship`/`battlecruiser` → fires) and
must not be reused as this trigger. The trigger becomes buildable once a
trustworthy design-era/tech-gap datum exists (deferred; a future engine slice).

**`construction_stalled` — CUT.** The stall signal (month-over-month
`completedWork` delta) is not derivable from a single snapshot: per-project
deltas exist only transiently at commit time (`ConstructionProgressed` events /
`APPROPRIATION` ledger entries) and are **not persisted**; `MonthReport`
carries only the aggregate `newConstructionSpending`. A persistent priority card
evaluated by a read-only projection over the current snapshot cannot see last
month's delta. §12's *display* stall flag on the Construction page still works
(it consumes the just-committed month's transient report delta), but the
*persistent priority card* is cut. The trigger becomes buildable when a
per-project last-month-progress field exists on the snapshot (future engine
slice / schema change).

### Trigger rules and thresholds

Centralized as **named, documented, unit-tested constants in `priorities.ts`**:
`MIN_RESEARCH_SHARE_BP = 800`, `NEAR_COMPLETION_WORK_RATIO = 0.9`, the
cash-reserve inequality `treasury < max(totalMonthlyExpenditure, 1)`, and the
deficit-criticality predicate `treasury + projectedBalance < 0`.
`HIGH_TENSION_THRESHOLD = 8` is **imported from `diplomacy.ts` — never
re-declared**. Severity assignments per type: `monthly_deficit` warning when
affordable / critical when insolvent; `critical_cash_reserve` warning;
`low_research_spending` warning; `construction_near_completion` information;
`high_foreign_tension` warning; `no_active_construction` advisory (never
critical).

**`construction_near_completion` adaptation (recorded deviation).** The doc's
`remainingMonths <= 2` trigger requires a months-to-completion value, which is
not derivable from a snapshot: `computeConstructionCap` is module-private and
returns `0` for compiled campaigns because the compiler hardcodes
`baseResources: SafeInt(0)` — so "expected monthly spend" is undefined. The
trigger is **adapted to a work-ratio proxy**: near-completion =
`completedWork / totalWork >= NEAR_COMPLETION_WORK_RATIO` (0.9), reusing the
briefing's existing heuristic as the named constant. The doc's
"`remainingMonths <= 2`" intent is recorded as the approximation target; the
deviation is documented and becomes a literal months trigger when a real
per-nation construction-cap/expected-spend value exists.

**Recorded finding — revenue-base divergence (flagged, not resolved).** The
engine's authoritative `monthly_revenue` phase computes on `baseResources`
(compiled `0`), so compiled campaigns receive `0` monthly revenue, while the
projection surface (`monthlyAppropriation = income × navalAppropriationRateBp`)
uses `income` and is nonzero. The priority engine consumes the **projection
surface** (consistent with the shipped Overview/Treasury display). The
divergence is a pre-existing engine concern affecting M1 economy-display
truthfulness, recorded as a flagged candidate for a future engine repair
decision — not silently resolved here.

### Sorting

The 5-key sort chain is feasible and deterministic; each key is a pure
derivation with a stable total order:

1. **Severity** — ordinal rank of the 4-value enum.
2. **Direct financial risk** — per-type numeric: `monthly_deficit` → deficit
   magnitude; `critical_cash_reserve` → shortfall magnitude
   (`max(totalMonthlyExpenditure,1) − treasury`); `low_research_spending` →
   shortfall below the 8% share; `construction_near_completion` → remaining
   cost (`totalWork − completedWork`); `high_foreign_tension` → tension score;
   `no_active_construction` → stable constant.
3. **Shortest time to consequence** — `monthly_deficit` → months of reserves
   (`treasury / |projectedBalance|`); `critical_cash_reserve` /
   `high_foreign_tension` → `0` (imminent); `construction_near_completion` →
   the work-ratio proxy; remaining types → stable neutral constant.
4. **Stable priority type order** — fixed enum order (the type schema itself).
5. **Stable id** — the deterministic `fingerprint`.

No nondeterministic ordering; identical inputs → identical order.

### Dismissal

Adopted verbatim from the doc: only `information`/`advisory` priorities are
dismissible; `warning`/`critical` are never permanently dismissible; dismissal
is keyed by `fingerprint`, expires on turn advance, and never mutates
simulation state.

**Storage (genuinely new — no existing mechanism fits).** There is no
UI-metadata bag on `CampaignSnapshot`, no arbitrary keyed save metadata
(`SaveMetadataSchema` is a fixed-shape `z.object`; unknown keys stripped), and
no per-campaign renderer-owned UI-state persistence. **Decision: a small
per-campaign UI-state sidecar — `ui-state.json`** in the campaign save
directory, written atomically (tmp-dir → rename, matching `SaveStore.save`),
read **tolerantly** (missing/corrupt → empty defaults), containing
`{ turnNumber, dismissedFingerprints: string[], firstMonthInspection?: {...} }`
and keyed by `campaignId`. It is renderer-owned, **never part of the
authoritative envelope/hash, never loaded into authoritative state**, and
expiry is inherent (entries are compared against the current `turnNumber`).
This **also resolves the storage gap deferred from §8** (first-month-inspection
state) — both share one mechanism.

---

## 8. Guided First Month Inspection

Resolved by [Guided first-month inspection](./issues/05-guided-first-month-inspection.md)
+ [Guided-inspection spotlight prototype](./issues/18-guided-inspection-spotlight-prototype.md).

### Steps and entry

The seven-step sequence stands: **Overview → Treasury → Research → Construction
→ Fleet → Foreign Relations → Advance Month** — six real section screens plus
one real header action for step 7 (`SiteHeader`'s `onAdvanceMonth`). Step 7
highlights that button but is **purely informational** — clicking it is not
wired to guide completion; the guide completes via its own "End
inspection"/final-step action, and the player advances the month afterward on
their own. Keeps the guide from special-casing or intercepting a real domain
command (`commitMonth`).

The guide appears automatically the first time the player enters the strategic
dashboard after completing the Opening Strategic Briefing, shown only while
`firstMonthInspectionStatus === "not_started"`.

### Behavior

All six "must not" behaviors (no blocking normal navigation, no domain-state
mutation, no manufactured values, no preventing save or Advance Month, no
reopening after completion) are achievable as a **pure renderer-side overlay**
that only reads existing screen state and writes nothing but its own
`status`/`lastCompletedStep`. No application-layer or command changes needed.
Each step carries a concise title, one or two sentences, a highlighted target,
**Next**, **Back** after the first step, **End inspection** on every step, and
"N of 7" progress text.

### Interaction model (from the spotlight prototype)

The overlay is a **DOM-based, renderer-only spotlight** with no domain-state, no
blocking, and no focus trap:

- **Highlight ring** — computed from the target element's
  `getBoundingClientRect()` on each step (recomputed on resize/re-nav); the
  rest of the viewport gets a dim scrim with the target region punched out.
  Because the six real section screens share one campaign shell and one header,
  targets are reachable without cross-screen chrome collisions when the ring is
  computed over the actual mounted target each step.
- **Step card** — fixed-position (top-right or bottom-center, per-screen
  shape), carrying title / 1–2 sentence explanation / **Next** / **Back** /
  **End inspection** / "N of 7" progress. Positioning avoids the shell header
  and the Advance-Month affordance; the card must not overlap the highlighted
  target's critical controls.
- **Non-blocking** — normal navigation, save, and Advance Month remain usable;
  ending or navigating away dismisses the card (status updated in
  `FirstMonthInspectionState`). No `pointer-events` trap over the page.
- **Accessibility** — respects `prefers-reduced-motion` (no animated ring); the
  card is keyboard-reachable and announced; focus stays in the flow and is
  never trapped inside the card.

### Persistence

Shape-only: `FirstMonthInspectionState { status, lastCompletedStep }` with
`status` in `not_started | in_progress | completed | dismissed`; it must
persist per-campaign and survive save/load (closing mid-guide resumes from the
last completed step; once dismissed/completed, automatic reopening is disabled;
a **Restart guided inspection** command is available from Help or campaign
settings). The storage mechanism is the `ui-state.json` sidecar settled in §7 —
one mechanism for both priority-dismissal and inspection state.

A concrete visual click-through prototype (exact ring radius, scrim opacity,
card position) is a **follow-up during the implementation sprint**, not a spec
blocker — presentation details judged against real layouts then; they do not
change the steps, non-blocking behavior, or persistence shape above.

---

## 9. Treasury and Budget

Resolved by [Treasury and budget](./issues/06-treasury-budget.md).

**The central finding: nothing on Treasury is player-adjustable in Milestone 2.**
Research's total budget (`ResearchState.researchBudget`) and the government
naval appropriation (`navalAppropriationRateBp`) are both fixed at compile time
and mutated by no command; construction has no scalar "allocation" field at all
— only per-project authorize/cancel (§12) plus the automatic month-end
work-allocation pass. Research's *field* allocation is real and player-
adjustable, but that is §10's screen, not Treasury's.

**Treasury is a read-only projection screen** backed by the existing
`inspectCampaign` command:

- **Income** — government naval allocation.
- **Expenditure** — fleet maintenance (real, calculated); construction spend
  (derived by summing active projects' this-month work allocation); research
  spend (the real `researchBudget` field).
- **Result** — projected surplus/deficit; available funds; projected month-end
  funds.

No "Other expenses" balancing row is needed — these three categories cover it.

**Three new `PlayerProjection.economy` fields.** `PlayerProjection.economy` gets
three new derived fields — **`constructionSpend`**, **`researchSpend`**, and
**`maintenanceCost`** (added at INC-4 to keep Treasury's "Fleet maintenance" row
internally consistent with `projectedSurplusDeficit`, reusing the same
`fleetMaintenance` derivation) — added alongside the surplus/deficit fields §5
already specified there, still served via the existing `inspectCampaign`
command. **No new Treasury-specific command.**
`maintenanceCost` is already real and direct on `NationState`.

**§9.2 / §9.4–§9.6 cut entirely.** No `ReviseNavalBudgetCommand`, no
`ProjectBudgetCommand`, no draft/apply/reset UI, no validation rules, no
side-effect-free projection command — there is nothing real to submit or
validate. Confirmed: fleet maintenance is calculated-only and government
allocation is externally-determined-only, matching the doc.

**Input model.** `SafeInt` is adopted in place of the doc's `MoneyAmount`.
`SafeInt` enforces integer + safe-integer-range, **not** non-negativity — but
since Treasury has no player-facing money inputs, that discrepancy is moot:
surplus/deficit legitimately goes negative, and nothing else on a read-only
screen needs the constraint.

---

## 10. Research Management

Resolved by [Research allocation](./issues/07-research-allocation.md).

The real weight-based model is **already fully implemented end-to-end**; M2 adds
only the field-level edit UX around it — no basis-points/10,000-total system is
built.

### Page fields

The projection already exists: `buildResearchScreenProjection` exposes
`researchBudget`, `fieldPriorities` (Record<fieldId, weight>),
`discoveredTechIds`, `inProgressTechnologies` (`{techId, investedPoints,
completed}`), and `currentProjectTechId`. The 15 canonical fields come from
`CANONICAL_RESEARCH_FIELD_IDS`.

| Doc field | Real treatment |
|---|---|
| Name | Real — the 15 canonical `ResearchFieldId`s |
| Description | **Cut** — no authored description exists for any field; display only the stable field id/name |
| Current allocation | Real — `fieldPriorities[fieldId]` integer weight (`HIGH=4 / MEDIUM=2 / LOW=1`); no per-row derived cost |
| Progress / level / known-tech state | Real — `inProgressTechnologies[].investedPoints` + `completed`, and `discoveredTechIds` |
| Projected monthly progress | A **pure derivation** — the engine allocates by largest-remainder proportional split over weight-bearing fields, so projected points-per-field is a pure function of `researchBudget` + weights; not a stored field |
| Bonuses/penalties | Only where real — research-speed and technology-variation settings modulate monthly resolution; surfacing an explainable "effective modifier" is in scope only where they actually affect that field's progress; no invented per-field bonuses |

### Allocation editing model (replaces doc §10.3–§10.4)

Adopt the real integer-weight model. There is **no fixed-total invariant** on
weights, so the doc's basis-points "auto-balance / balancing category" concept
**does not apply and is cut**. The UI analog of the weight cap is
**`MAX_HIGH_PRIORITY_FIELDS = 5`**: a field's priority is selectable as
`HIGH / MEDIUM / LOW / (unset)` with a deterministic rule that **no more than 5
fields may be `HIGH`** — raising a 6th field to `HIGH` is rejected (or the
player must first lower another `HIGH` field); there is no silent
redistribution. Editing writes the complete `fieldPriorities` record in stable
increments (one priority change per command), matching the command's
whole-record payload.

### Command

Use the real `SetResearchPriorityCommand`:
`{ type: "SetResearchPriority", nationId, fieldPriorities: Record<string, SafeInt>, exactTechId? }`
issued as the existing desktop command (`setResearchPriorityCommand`), with Zod
at the IPC boundary + domain validation in the phase engine. **No new command
name or payload shape.** The doc's basis-points
`ReviseResearchAllocationCommand` is dropped.

### Monthly resolution

Already implemented: `resolveResearchPhase` runs as phase `resolve_research`
(phase 7, order 7), spends the research budget from treasury (ADR-0036),
allocates by
largest-remainder, does a seeded weighted field draw via the campaign RNG
stream (keyed `research/month/{nation}/{field}`, ledgered), and is
deterministic. **Genuinely new for M2: nothing in the resolution itself** — only
the field-level edit UX and any missing wiring on top of the shipped Research &
Technology screen.

---

## 11. Fleet Inspection

Resolved by [Fleet inspection](./issues/08-fleet-inspection.md).

The real `Ship` (`packages/campaign/src/state.ts:6-22`) carries `name`,
`classId`, `speed`, `firepower`, `armor`, `hitPoints`/`maxHitPoints`,
`constructionProgress`, `isUnderConstruction` directly — combat stats and
construction state are on the ship, no join needed for those. There is **no
`status` field**; "status" is a presentation derivation
(`"commissioned" | "under_construction"` from `isUnderConstruction`).

### Ship rows

- **Identity** — `name` (real), `classId` (direct, no join).
- **Hull type + displacement** — via `snapshot.designs.get(designVersionId)` →
  `hullType`, `normalizedDisplacementKg`. Feasible: the construction projection
  proves the same design join works.
- **Design summary** — the join also yields `normalizedSpeedUms`,
  `normalizedArmorUm`, `mainGunsCaliber`/`mainGunsCount`, `machineryType`
  (real `CompiledDesignVersion` fields).
- **Per-row maintenance cost — cut.** No per-ship maintenance figure exists
  anywhere; the fleet-wide maintenance aggregate (already derived on
  Overview/Treasury from ships) is the acceptable substitute; no per-row figure
  is fabricated.
- **Doc's exclusion list carried verbatim:** no reserve status, overseas
  assignment, crew quality, exact ship age, or region assignment —
  `locationAreaId` and `inBattleId?` exist on `Ship`, but the exclusions still
  hold for this read-only inspection surface.

### Filtering, sorting, summary

- **Filters:** ship type (`hullType` via join), class (`classId`), status
  (derived). Real.
- **Sorting:** name, ship type (`hullType`), displacement
  (`normalizedDisplacementKg` via join). **`maintenance cost` is dropped** from
  the sort list. All sorts stable by `id` tie-break.
- **Summary:** active ship count + count by ship type (real); **total
  maintenance** uses the fleet-wide aggregate (§6's re-derivation pattern —
  never the raw `maintenanceCost`, which is 0 before the first `commitMonth`);
  **"most expensive active class" — cut** (no per-class maintenance cost);
  **largest active ship by displacement** (via join, real). All figures are
  derived in projection builders, never in React.

### Ship detail panel

A renderer detail view over the same projection; shows only identity,
class/design, and the principal characteristics the design catalog already
exposes (displacement, speed, armor, main-guns, machinery, hit points). **No
refit / scrap / reserve / rename / deploy actions** — per the doc's own "don't
show nonfunctional buttons" rule; none are implemented. No new command or
state.

---

## 12. Construction Management

Resolved by [Construction projects state model](./issues/09-construction-projects-state-model.md)
+ [Ordering a ship wizard](./issues/10-ordering-a-ship-wizard.md).

### Project states

**Adopt the real 4-state enum `PLANNED | AUTHORIZED | ACTIVE | COMPLETED`**
(upper-cased) in place of the doc's lower-cased 5-value proposal:

- `PLANNED` / `AUTHORIZED` — pre-resolution project records (authored starting
  builds and newly placed orders); nothing funded yet. The doc's `planned` maps
  onto this pair; `AUTHORIZED` vs `PLANNED` is not a player-facing distinction
  for M2 — the Construction page presents both as "not yet started."
- `ACTIVE` — the project has received construction work (the `appropriation`
  phase sets any funded project's status to `ACTIVE`).
- `COMPLETED` — `completedWork >= totalWork`; the `construction-processing`
  phase instantiates the finished ship.

**No `paused` or `cancelled` state is added.** The engine's real policy: an
unfunded project simply does not progress (the `appropriation` phase skips it
when `available <= 0` or the per-nation construction cap is exhausted). The
doc's "paused by insufficient funding" becomes a **display-only derived
"stalled" flag** — meaning *no progress in the resolved month* — surfaced in the
report and on the Construction page, derived from the month-over-month
`completedWork` delta already produced by `ConstructionProgressed` events / the
monthly report, **not** a new persisted state. (This is the same transient
signal the §7 `construction_stalled` priority would have consumed; the
persistent card is cut, the display flag is real.) Player-initiated
cancellation stays out of scope — no `cancelled` state and no reimbursement
semantics exist. Completed projects appear in historical reports, not the
default active list.

### Active project fields

- **Total projected cost** = `totalWork`; **cost paid** = `paidWork`;
  **remaining cost** = `totalWork − paidWork` — work and treasury are 1:1
  (ADR-0036), so these are direct reads, not stored separately.
- **Progress percentage** = `completedWork / totalWork`, derived.
- **Projected months remaining** = `(totalWork − completedWork) / expected
  monthly spend` where expected monthly spend uses the nation's construction
  cap (`computeConstructionCap`) — an **estimate, explicitly labeled as such**
  in the UI; derived, not stored.
- **Assigned shipyard/dock** — **omitted.** No per-project dock is modeled;
  only the aggregate port-`level` capacity proxy (`shipyardCapacity`) exists.
- **Project state** = the real `status` enum.

The real cost formula is **`construction_order_v1`**: 1 cost unit per 100 tons
displacement, capacity in kilotons.

### Monthly resolution

The **real cost-formula/allocation policy is authoritative**, replacing the
doc's 10-step proposal:

1. `appropriation` phase — for each playable/AI nation with `treasury >
   expenses`, distributes available funds **proportionally** across incomplete
   projects (weighted by remaining work), each capped by the per-nation
   `computeConstructionCap`, spending real treasury and advancing
   `completedWork`/`paidWork`.
2. `construction-processing` phase — clamps `completedWork` (overflow →
   `CONSTRUCTION_OVERFLOW` diagnostic), marks `COMPLETED` at
   `completedWork >= totalWork`, and instantiates the new `Ship` (stats from the
   compiled design, ADR-0037), appending it to the nation's fleet.

The spec's copy describes **this** actual policy — proportional-to-available-
funds with a construction cap, unfunded projects stalling in place — not the
doc's idealized 10 steps.

### Ordering a Ship wizard

A **select-design → review → confirm** flow over the real
`submitConstructionCommand` / `replaceConstructionCommand` /
`cancelConstructionCommand` family. **8 of the 10 doc steps are real:**

| Doc step | Real backing |
| --- | --- |
| 1 Select **Order ship** | Real (screen action). |
| 2 Choose an available design | Real — design catalog filtered to the player nation, sorted by `designVersionId`. |
| 3 Review design summary | Real — `className`, `shipType` (hull-type label), `year` (design-family month, `0` fallback), `mass` (t), `speed` (kt), `machineryType`, `requiredTechnologyIds` (empty — nothing links techs). |
| 4 Enter ship name / accept fallback | **CUT — no name input exists** (see below). |
| 5 Review dock requirement | Real — `projectedCapacityUnits` (kt) vs the reservation CAPACITY pool. |
| 6 Review total projected cost | Real — `projectedConstructionOrderCosts`, `construction_order_v1`. |
| 7 Review estimated completion time | **CUT** — no months-to-completion is derivable (same finding as §7: `computeConstructionCap` private + `baseResources` compiled `0`). The wizard shows the real project work/treasury commitment instead, with no completion-time claim. |
| 8 Review effect on projected monthly balance | Real, honest copy — the order reserves `projectedCost` treasury + `projectedCapacityUnits` capacity immediately (the workspace's `treasuryReserved`/`capacityReserved`); wording uses the reservation, not a fabricated monthly figure. |
| 9 Confirm order | Real — `submitConstructionCommand`. |
| 10 Return to Construction with project visible | Real — the queued project appears via the construction project queue; `projectId` = `constructionProjectIdForCommand(commandId)`. |

**Ship naming (§12.6) — CUT from M2.** No ship-name input exists anywhere in
the real engine: the `SubmitConstructionCommandPayload` carries only
`{sessionId, expectedRevision, transportRequestId, designId}` — no `shipName`,
no `portId`. `ConstructionProject` has no name field, and the completed ship is
auto-named `Ship {className}` at completion. The commissioning-flow
`namingConvention`/`shipNameReuse` preferences remain UI-captured-only; no
command or engine path consumes them. M2's wizard **does not collect a ship
name** — projects are identified by their real design class + project id, and
the completed ship's name is documented as the engine-generated
`Ship {className}`. Player-entered ship naming is recorded as a deferred engine
slice. This also means §12.6's reuse-dedupe logic has no input to operate on —
deferred with it.

### Design eligibility

Real, checkable conditions, each backed by an engine rejection code:

- **belongs to / available to the player nation** → `DESIGN_NOT_FOR_PLAYER`
  (catalog already filters by `design.nationId === playerSlotId`);
- **constructible in the current campaign state** → `UNKNOWN_DESIGN`;
- **at least one player port has sufficient dock capacity** → `INSUFFICIENT_CAPACITY`
  (reservation CAPACITY pool, backed by `projectedCapacityUnits` vs the real
  `shipyardCapacity` proxy);
- **its data validates** → trivially true (snapshot designs are compile-
  validated);
- **its projected cost can be computed** → real;
- **not an unsupported foreign-intelligence-only design** → **CUT** — no such
  design class exists; the catalog only ever lists the player's own designs.

**Reversed — the doc's "insufficient current cash doesn't make a design
ineligible if construction pays over time" is FALSE for the real engine.** The
real model **reserves the full projected cost up front** (the reservation
TREASURY pool → `INSUFFICIENT_FUNDS`). There is no "placed despite low cash"
state — either the treasury can cover the projected cost and the order is
accepted, or it can't and it is rejected. The doc's pay-over-time framing and
its "financial warning" UI are cut; the spec documents the real reservation
policy. A near-boundary affordability read is still available in the review
(workspace `treasuryReserved` vs the nation's `treasury`) for honest copy, but
it never produces a "placed with warning" outcome.

### Order command

The doc's `PlaceConstructionOrderCommand`/`Result` map onto the real family;
**no new command name or payload**:

- **Place order** → `submitConstructionCommand` — the doc's `expectedTurn` =
  real `expectedRevision`; `campaignId` + revision live in the real
  `CommandEnvelope` triple (`sessionId`, `expectedRevision`,
  `transportRequestId`).
- **Change design** → `replaceConstructionCommand` (supersede-in-place for an
  in-flight order).
- **Cancel order** → `cancelConstructionCommand`.
- **`projectId`** → `constructionProjectIdForCommand(commandId)`.
- **`campaignRevision`** → real `expectedRevision` / `snapshot.turnNumber`.
- **`warnings`** → **CUT** — no real warnings array exists; outcomes are
  `success` (with the workspace view: reserved treasury/capacity + command
  status) or a hard rejection reason code (surfaced verbatim). Idempotency
  (same `transportRequestId` replay, `IDEMPOTENCY_CONFLICT` on reuse-with-
  different-payload) and failure atomicity (a rejected/replace/cancel
  persist-failure leaves the session untouched) are already real — the spec
  documents them, doesn't rebuild them.

---

## 13. Foreign Relations

Resolved by [Foreign Relations page](./issues/12-foreign-relations-page.md)
(and the [Diplomacy tension-threshold policy](./issues/11-diplomacy-tension-threshold-policy.md)
task it depends on).

**Headline: the page is the already-shipped read-only Diplomacy & War surface**
(Relations / Wars / Blockades three-section layout). Two doc §13.4 features are
cut: "monthly change" and the "future-war critical warning" framing. The
"likely rival" marker is real presentation-only flavor data. No engine change,
no new command, no RNG flag flip; goldens stay 10/10.

### The tension-threshold policy (task, implemented)

`tensionLabel(tension): TensionLabel` + `isHighTension(tension): boolean` +
`HIGH_TENSION_THRESHOLD = 8` were added to `campaign-engine/src/diplomacy.ts`
(pure, re-exported via the package index — consumable from both §7 and this
page with no Electron/React dependency). Taxonomy over the real 0..10 scale
(compiler validates authored tension in 0..10; `TENSION_PEACE = 5`,
`TENSION_WAR = 10`):

| tension | label |
| ------- | ----- |
| `>= 10` | `war_imminent` |
| `>= 8`  | `hostile` |
| `>= 6`  | `strained` |
| `>= 3`  | `neutral` |
| `< 3`   | `cordial` |

`HIGH_TENSION_THRESHOLD = 8` is the band lower bound of `hostile` — the
"high foreign tension" trigger (§7) and this page's warning treatment both call
`isHighTension`/`tensionLabel`, so neither re-derives the interpretation.
Verified by `tension-label.test.ts`.

### Relationship list

From `buildDiplomacyScreenProjection` (`DiplomacyRelationRow`):

- **nation** → `partnerNationId`/`partnerName` (real, sorted by partner id).
- **relations label** → `relation` kind (`neutral | allied | at_war |
  trade_agreement`) + `tensionLabel(tension)` — the ONE engine taxonomy, never
  renderer-re-derived.
- **tension score** → numeric `tension` (0..10).
- **likely rival** → real presentation-only flavor data:
  `NATION_DOSSIER_FIELDS.likelyRivals`, a static per-playable-nation list
  (GB → Germany/France/Russia, etc.), keyed by playable country. Marking a row
  whose `partnerName` matches the dossier's list is presentation-only, never
  alters simulation (the field's own ADR-0003 presentation-only contract).
  Non-playable nations fall back to no-rival marker rather than inventing one.

**Cut — "change since previous month".** No previous-turn tension is stored
anywhere, and no monthly tension-change processing runs (`resolve_diplomacy` is
`rngAllowed: false`; the flag was deliberately not flipped; monthly tension
randomness is owned by a future M2 slice). Displaying a "change" requires
persisted history that doesn't exist — the spec shows current tension + label
only.

### War / blockade display

Keep the shipped three-section layout (Relations / Wars / Blockades), i.e. a
per-section split rather than a per-nation badge. Safe, meaningful, read-only
`DiplomacyWarRow` fields: `warId`, `attackerId`/`defenderId`, both
`*SideMembers`, `attackerWarScore`/`defenderWarScore`, `status`
(`DECLARED_NOT_ACTIVE | ACTIVE | ENDED`), `startDate`/`endDate?`, `playerSide`.
`DiplomacyBlockadeRow`: `blockaderId`, `blockadedNationId`, `areaId`,
`establishedMonth`. Nothing on this page submits a command — the screen is a
read-only projection over the snapshot. Declaring war / negotiating peace
remains out of scope.

### The high-tension warning — reframed to current state

The doc's "may lead to war in a **future milestone**" copy is false twice over:
war already exists (it is modeled, resolved, and displayed on this very page).
The correct in-milestone framing for `isHighTension(tension)` (≥ 8, i.e.
`hostile` or `war_imminent`) is a **current-state warning** — e.g. "Relations
with X are hostile; war is possible" — tied to the real label, with no "future
milestone" caveat and no pretense that war mechanics are absent. This is
exactly the warning the §7 `high_foreign_tension` priority and the §14 pre-turn
review consume via the same `isHighTension` predicate.

---

## 14. Advance Month Flow

Resolved by [Advance Month flow](./issues/13-advance-month-flow.md).

**The month pipeline is already fully built** (`commitMonth` +
`MonthExecutor` + `SaveStore`), and already runs tactical battle generation +
resolution as part of resolution — battle outcomes surface as report text only.
§14 is therefore largely **"document what's real"**; the genuinely new bits are
the pre-turn review UI + the warnings it feeds off.

### Pre-turn review

| Review field | Real source |
|---|---|
| Current date | `record.month` / `PlayerProjection.month` |
| Next date | `advanceMonth(year, month, 1)` — the exact helper `commitMonth` already uses |
| Available funds | `PlayerProjection.economy.treasury` |
| Projected monthly surplus/deficit | The two new derived `PlayerProjection.economy` fields (§9): `constructionSpend` + `researchSpend`; projected balance = `monthlyAppropriation − maintenanceCost − constructionSpend − researchSpend` |
| Active construction project count | `nation.constructionProjects` with `status !== "COMPLETED"` (the same predicate the appropriation phase filters on) |
| Expected completions | Derived from the construction projection: a project whose `completedWork + this month's cap ≥ totalWork` |
| Current research spending | `PlayerProjection.economy.researchSpend` (to-be-added, §9) |
| Unresolved warnings | The priorities engine (§7) — the review's warning section IS the priority projection; it cannot be built before §7 |
| Save status | The shell's `saving`/`saveMessage` pair |

Actions: **Cancel** and **Advance to [Month Year]**.

### Blockers vs. warnings

Real pre-commit blockers — every one already enforced by `commitMonth`:

- **campaign state invalid / stale revision** → `REVISION_MISMATCH` (rejected
  with `currentRevision`) and `SESSION_NOT_FOUND`;
- **cannot advance** → `SIMULATION_END_REACHED`;
- **missing player nation** → `UNKNOWN_PLAYER_SLOT`;
- **another resolution already running** → no server-side lock; the real
  equivalent is the renderer `committing` flag that disables the Advance action
  for the in-flight (synchronous) commit — renderer-side, matching the doc's
  intent;
- **unsaved command persistence failure** → the pending-envelope queue is
  in-memory only; a rejected/failed commit leaves it intact, but there is no
  durable record to *detect* pre-commit — a documented limitation (queue is
  lost on process restart), not a blocker the engine can surface in advance;
- **allocation / missing-data domain invariants** → the `opening_validation`
  phase (`NEGATIVE_TREASURY`, `CONSTRUCTION_OVERFLOW`,
  `SHIP_IN_MULTIPLE_BATTLES`) + the engine's command lifecycle validation at
  drain time.

Warnings (deficit, zero research, no construction, construction stalls, critical
tension, low cash) are **exactly the §7 priority outputs** — the pre-turn
review's warning section IS the priority projection.

### Resolution request, idempotency & double submission

The doc's `AdvanceCampaignMonthCommand` (with its own `requestId`) maps onto the
real **`CommandEnvelope`** triple `{sessionId, expectedRevision,
transportRequestId}` — `requestId` is **not genuinely new**, it is
`transportRequestId`, already Zod-validated at the IPC boundary and already the
real `CommitMonthPayload`. Per §4, `expectedRevision` = `turnNumber`.

**Reconciled double-submit model:** the real protection is (a) the renderer
`committing` flag disabling the action, and (b) `expectedRevision`: a successful
commit advances revision to the closing snapshot's revision, so a second click
sends the stale old revision → `REVISION_MISMATCH`. The engine's
`CommandIdempotencyMap`/`CommandLedger` idempotency governs the *queued player
command envelopes*, keyed by `envelope.idempotencyKey` — it does **not** cover
the month-advance itself. **Gap, recorded:** the doc's "repeated call with the
same `requestId` returns the existing committed result" (result-replay caching)
is **not implemented** — the shell generates a fresh id per call and `commitMonth`
ignores `transportRequestId` beyond the schema. The spec documents the real
revision-based guard + committing flag, and notes same-turn idempotent-replay
caching as a small follow-up — not new work commissioned here.

### Cancellation

No `AbortSignal` path exists in the `commitMonth` flow; `MonthExecutor.execute`
is fully synchronous. **Decision: M2 ships without mid-resolution
cancellation.** `commitMonth` is effectively atomic-and-synchronous once
invoked; the Advance action is disabled via `committing` for the operation's
duration, and a post-success re-click is blocked by the advanced revision. True
abort (`AbortSignal` mid-execution) is deferred — new, nontrivial work with no
player-visible benefit for a fast synchronous commit. The doc's "closing the
resolution screen does not destroy the session" is already real (the commit
lives in the shell hook, not the screen).

### Resolution stages — the real phase list

The doc's 17-step sequence maps onto the real `PhaseRegistry` order plus the
app layer. Date/turn advancement is **not** inside `MonthExecutor` (it operates
on a fixed turn); it happens in `commitMonth`.

| Doc §14.6 step | Real owner |
| --- | --- |
| 1 Validate command + revision | app layer (`REVISION_MISMATCH`, `SESSION_NOT_FOUND`) + phase 0 `opening_validation` |
| 2 Clone/stage working state | `MonthExecutor` cloneSnapshot |
| 3 Government allocation | phase 1 `monthly_revenue` (treasury income) |
| 4 Mandatory fleet maintenance | phase 4 `maintenance` |
| 5 Apply research expenditure | phase 7 `resolve_research` (spends research budget; reads/writes treasury) |
| 6 Resolve research progress | phase 7 `resolve_research` |
| 7 Apply construction expenditure | phase 3 `appropriation` |
| 8 Resolve project progress/completions | phase 6 `construction_processing` (completion → fleet ship) |
| 9 Update treasury balance | phases 1/3/4/5 (all write treasury) |
| 10 Resolve diplomacy changes | phase 6.5 `resolve_diplomacy` (war-score/blockade only; **tension changes NOT yet resolved** — `rngAllowed: false`, monthly tension randomness owned by a future M2 slice) |
| 11 Rebuild strategic priorities | **not an engine phase** — priorities are the §7 read-only projection, app layer |
| 12 Generate monthly report | app layer: `commitMonth` builds `CommitMonthResponse` (report + closingSnapshot) |
| 13 Increment date + turn | app layer: `commitMonth` (`turnNumber+1`, `advanceMonth(+1)`) |
| 14 Validate resulting state | phase 9 `closing_validation` (`NEGATIVE_TREASURY`, `CONSTRUCTION_OVERFLOW`) |
| 15 Persist atomically | `SaveStore.save` (tmp dir → rename → pointer update) |
| 16 Register committed revision | `registerCampaignSession` |
| 17 Return monthly report projection | `CommitMonthResponse` (success value) |

### Transactional requirement

Atomicity is **already handled** by `SaveStore.save`: build every artifact in a
temp dir, rename as a unit, then update the pointer via atomic write+rename. A
failure before publication leaves the previous save authoritative and cleans
the temp dir. `commitMonth`'s ordering guarantees the same from the app side:
execute → rebuild envelope over the next snapshot → `SaveStore.save` →
`registerCampaignSession` → **then** clear pending envelopes. A `SAVE_FAILED`
return leaves the queue intact (retry re-delivers) and the on-disk pointer
unchanged — the previous state remains the authoritative state. The doc's
"partially updated campaign must never become loadable" is satisfied by the
envelope/hash/signature integrity gates on load. §14.7–§14.8 reduce to
documenting the real revision + committing-flag double-submit model (with the
one recorded result-replay gap) and the no-mid-resolution-cancellation decision.

---

## 15. Monthly Resolution Presentation

Resolved by [Monthly resolution presentation](./issues/14-monthly-resolution-presentation.md).

**M2 does NOT build real progress streaming.** `commitMonth` is synchronous and
atomic — the `MonthExecutor.execute` call is one opaque call with no progress
callback, no `AbortSignal`, no streaming — and the commit returns in well under
a second. The doc's own gate says progress may be exposed "if the engine command
is structured into meaningful stages"; it is not. The renderer plays a
**cosmetic, timing-raced stage sequence** over the opaque call (the exact
world-generation-pattern precedent): show the loading screen with a stage
indicator, run the commit, and reveal the report when the response arrives. No
fine-grained percentage claims (a stage indicator only). The doc's
`MonthResolutionProgress` schema and its scope/cleanup rules are moot with a
cosmetic sequence — the renderer owns the animation lifecycle; unmount clears
it; there are no cross-window events.

**Stage labels — kept but re-ordered and made truthful to the real
`PhaseRegistry` order** (diplomacy 6.5 **before** research 7 — the doc listed
research before diplomacy; the cosmetic sequence follows the real order):

| Cosmetic stage label | Real owner (phase order) |
| --- | --- |
| Reviewing naval finances | phase 1 `monthly_revenue` (+ phase 5 `obligation`) |
| Processing fleet maintenance | phase 4 `maintenance` |
| Advancing ship construction | phase 3 `appropriation` + phase 6 `construction_processing` |
| Assessing foreign relations | phase 6.5 `resolve_diplomacy` |
| Reviewing research programs | phase 7 `resolve_research` |
| Compiling the naval estimates | phase 9 `closing_validation` + app-layer report assembly |
| Saving the campaign | `SaveStore.save` (app layer) |

Title: "Preparing the Monthly Naval Estimates." Battle generation/resolution
phases (7.5/8) are not a listed stage — battle outcomes surface as report text
per the charting decision; the loading screen may either skip a battle stage or
include a truthful "Resolving engagements" label. Nothing on the loading screen
claims a stage the engine does not perform.

**Failure UI** — keyed off real `BridgeResult` outcomes + §14's atomicity:

- **Concise error title / safe explanation** → the real rejection reason codes
  surfaced verbatim: `REVISION_MISMATCH`, `SIMULATION_END_REACHED`,
  `UNKNOWN_PLAYER_SLOT`, `MONTH_EXECUTION_FAILED` (with diagnostic messages),
  `SAVE_FAILED`. No stack traces, no local paths.
- **Whether the previous month remains intact** → TRUE, with the exact
  guarantee from §14: a failed save leaves the on-disk pointer unchanged and
  the queue intact; a `MONTH_EXECUTION_FAILED`/`REVISION_MISMATCH`/`SAVE_FAILED`
  return persists nothing. The failure UI states this honestly.
- **Return to Overview** → real.
- **Try Again** → real and safe: every failure path leaves the session and the
  pending-command queue untouched, so a retry re-issues the same commit with no
  double-application (revision guard + queue-intact semantics).
- **Open campaign folder** → **CUT.** The doc conditions it on "an existing
  narrow preload capability that supports it safely" — **no such capability
  exists** in the preload surface. Not commissioned; recorded as deferred.

---

## 16. Monthly Naval Estimates Report

Resolved by [Monthly naval estimates report](./issues/15-monthly-naval-estimates-report.md).

**Headline: the report is largely "document what's real" + a few small additive
projection sections.** The `commitMonth` response already carries the Treasury
ledger, per-event construction/research progress, battle outcomes, and the
closing summary. Cuts: Diplomacy's monthly-change/label-change sections,
Research budget-effectiveness and settings-effect copy, Fleet's per-ship "new
maintenance effect," and Construction's "stalled projects."

### Report sections — real vs. needs-adding

| Section | Real today | Needs adding |
| --- | --- | --- |
| **Treasury** | `report.openingTreasury`, `report.closingTreasury`, `report.maintenanceCost`, `report.newConstructionSpending`; government allocation + research expense derivable from `financialLedger` (`NAVAL_APPROPRIATION`, `RESEARCH_EXPENDITURE` categories); surplus/deficit = `closingTreasury − openingTreasury` | "Research expense" as a named line (derive from ledger `RESEARCH_EXPENDITURE`). The real ledger categories ARE the honest "other" list (`MAINTENANCE_EXPENDITURE`, `APPROPRIATION`, `CONSTRUCTION_BUDGET`, `RESEARCH_EXPENDITURE`, `NAVAL_APPROPRIATION`) — render the ledger rows, no invented balancing row |
| **Construction** | `ConstructionProgressed` domain events carry per-project work progress (`projectId`, `previousWork → newWork`) — "progress by project" real | "Completed ships" — derivable from the fleet ship-set delta (pre→post `isUnderConstruction: false` additions) or projects reaching `totalWork`. "Newly active projects" — derivable from `status` becoming `ACTIVE` in the month's project snapshots. **"Stalled projects" CUT** — no from-snapshot signal (§7's finding; the transient report delta doesn't persist per-project) |
| **Research** | `ResearchProgressed` events carry per-tech progress; `TechnologyDiscovered` events — "progress by research area" + "discoveries" real | **"Budget effectiveness" + "settings effects" CUT** — no research-effectiveness formula and no explainable speed/variation effect surface exists; show the real per-tech progress + discoveries only |
| **Diplomacy** | `resolve_diplomacy` runs but monthly tension changes do NOT (§13) | **"Tension changes" + "relationship label changes" CUT** (no changes occur). "Nations reaching warning thresholds" — real via §13's `isHighTension`/`tensionLabel` over current relations (a read-only derivation), folded into the **Priorities** section as `high_foreign_tension` |
| **Fleet** | Fleet ship additions derivable (see Construction "completed ships"); active totals real (per-nation fleet ship lists post-month) | **"New maintenance effect from completed ships" CUT** — only the aggregate `maintenanceCost` is real; per-ship maintenance attribution isn't modeled |
| **Priorities** | Nothing (the priorities engine is §7's new read-only projection) | New — the report's Priorities section = the §7 projection over the post-month snapshot: **new / resolved / continuing** derived by comparing against the previous report's stored priority fingerprints |
| **Battle outcomes** (charting addition) | Real — `closingSnapshot.battleOutcomes`, plain-text losses/outcomes, no tactical UI | Nothing. **Decision: its own small "Battle Outcomes" subsection** (it already renders as one in the Turn Report accordion; keeping it distinct from Fleet reads naturally and matches the shipped surface) |

### Report data model

The doc's `MonthlyCampaignReport` is replaced by the **real
`CommitMonthResponse`** + a thin derived view; no new invented interface:

- `reportId` → the month's save identity (real `SaveMetadata.saveId` /
  `campaignId`);
- `campaignId` → real;
- `turn` → real (`nextTurnNumber` / revision);
- `period.from` → the resolved month; `period.to` → the new month (real via
  `advanceMonth`);
- `treasury` → real `MonthReport` + the two derived lines (research expense
  from ledger, government allocation from `NAVAL_APPROPRIATION`) — all numbers
  from the report/ledger, none invented;
- `construction` / `research` / `fleet` → the domain-event + pre→post-delta
  derivations above;
- `diplomacy` → **dropped as a section** (nothing monthly changes); its one
  real contribution (`isHighTension`) lives under Priorities;
- `priorities` → the §7 projection, new;
- `generatedAt` → real persistence metadata, **not** an engine field:
  `SaveMetadata.timestamp` or the sidecar's own write time; never `Date.now()`
  inside an authoritative path (the report is app-layer, never hashed into the
  snapshot).

### Report history

**No report persistence exists** — verified: `SaveMetadata` is per-save listing
metadata; the snapshot schema has no report field and reports are never hashed
(adding them to the authoritative snapshot would be a schema/hash change — not
done). The `CommitMonthResponse` is app-layer and ephemeral. **Decision: a new
per-campaign `monthly-reports.json` sidecar** in the campaign save directory —
the same family as §7's `ui-state.json` (renderer/app-owned, written atomically
via tmp-dir → rename, read tolerantly (missing/corrupt → empty), keyed by
`campaignId`, **never part of the authoritative envelope/hash**). It stores the
most recent **12** reports (the derived view above + the §7 priority
fingerprints so the report's new/resolved/continuing comparison has a
baseline), pruned to 12 at write. The Overview reads it read-only. No migration
(new file); legacy campaigns simply have no history.

---

## 17. Saving and Loading

Resolved by [Saving, loading & campaign-list](./issues/16-saving-loading-campaign-list.md).

Save/load is a **mature and real** system: `SaveStore` with string-typed
compatibility versioning (`CURRENT_COMPATIBILITY_VERSION = "1.1.0"`), atomic
replace, recovery/corruption handling. The doc's §17 mostly "documents what's
real"; the genuinely new pieces are the **campaign-list screen** and the small
metadata extension it needs.

### Autosave triggers

| Doc trigger | Real status |
|---|---|
| After completing the Opening Strategic Briefing | Already fires (Commissioning Flow briefing-completion autosave) |
| After a budget revision | **Moot for M2** — Treasury is read-only (§9); no budget-revision command exists. Dropped from the trigger list |
| After a research allocation revision | **Genuinely new** — autosave after a successful `SetResearchPriority` command |
| After placing a construction order | **Genuinely new** — autosave after a successful construction-order command |
| After completing monthly resolution | Already the real commit path (`commitMonth` persists atomically) |
| After onboarding-status change | **Genuinely new** — autosave after a first-month-inspection status change is persisted |

All M2-new triggers follow the existing pattern: a domain command is not
considered successful until its required persistence contract succeeds, and the
shell's saving/message pair drives the indicator.

### Save indicator

The doc's four-way Saved/Saving/Unsaved/Failed maps onto the real
`Saving`/`Saved`/`Save failed`/`Unsaved changes` driven by the command/
persistence lifecycle, not a new dirty-flag concept: **Saving** = command
in-flight; **Saved** = last command's persistence succeeded; **Save failed** =
last persistence threw (visible, never "Saved"); **Unsaved changes** = a
renderer-only draft that diverges from the last committed snapshot (only
meaningful for the one editable surface — research allocation — since Treasury
edits were cut).

### Manual save

Confirmed: the real `saveCampaign` command writes the current authoritative
state, does not advance time, does not generate a report, and returns a
structured result (including `savePath`/`hash`/`metadata`). It already
implements the doc's §17.3; nothing new.

### Campaign-list screen (genuinely new UI)

No dedicated campaign-list/load screen exists. Backing: `SaveStore.list(saveDir)`
→ `SaveMetadata[]` (real, deterministically newest-first) + the `loadCampaign`
command for the actual load.

**Metadata gap.** The real `SaveMetadata` stores `saveId`, `timestamp`,
`turnNumber`, `campaignId`, `snapshotHash`, `compatibilityVersion`,
`contentArtifactHash` — but not campaign name, nation, or current date, which
the list columns require. Design decision: **extend `SaveMetadata` with three
additive, optional fields** — `campaignName: string`, `nationId: string`, and
`campaignDate: { year, month }` — written at save time alongside the existing
fields. Existing/legacy saves (and degraded records from the `list()` fallback)
simply omit them, so the list renders them as `—` rather than fabricating
values (no migration needed; additive-only). The load still goes through
`loadCampaign` and the real `CompatibilityChecker`.

| List column | Real source |
|---|---|
| Campaign name | `metadata.campaignName` (new field; `—` for legacy) |
| Nation | `metadata.nationId` (new field) |
| Current date | `metadata.campaignDate` (new field; `turnNumber` as the honest fallback where absent) |
| Last saved time | `metadata.timestamp` (real) |
| Save-format version | `metadata.compatibilityVersion` (real, **string-typed** `"1.1.0"` — substituting the doc's integer `CURRENT_CAMPAIGN_SAVE_VERSION` proposal; there is no integer schema version) |
| Campaign status | Derived UI state (§4: `isTerminal` + in-flight-command), not a stored field |

### Failed load & save versioning

"Document what's real": the `CompatibilityChecker`/`store.ts` already implement
the doc's intent — a structurally-obsolete save gets the stable compatibility
diagnostic (version-mismatch), a corrupt save is refused with
`PERSISTENCE_CORRUPT_SAVE`, and there is **no silent destructive repair** (the
integrity gates — state-hash, signature, envelope — hard-reject). A
corrupt/incompatible save does not crash the list (`list()` skips invalid
directories). The doc's integer `CURRENT_CAMPAIGN_SAVE_VERSION` and `v1→v2`
migration are replaced by the real string-typed compatibility version; no
integer migration is added.

---

## 18. Determinism / RNG Audit

Resolved by [Determinism/RNG audit](./issues/17-determinism-rng-audit.md) —
a compliance audit, not a design decision.

**RNG infrastructure is real and already load-bearing for research.** The real
seeded-stream abstraction exists (`packages/random`'s `RandomEngine.stream()` /
`RandomStream.next()`, backed by a seeded PRNG, with a `RandomLedger` recording
`RandomDecision` entries); `rngAllowed` is a first-class per-phase flag in
`PhaseRegistry`, and `PhaseGuard.rng(phaseId, seed)` is the only sanctioned way
a phase obtains a `RandomEngine`.

**Streams needed vs. wired:**

| Spec area | RNG stream needed | Currently wired? |
|---|---|---|
| Research completion (§10) | `research/month/{nation}/{field}` | **Yes** — real, ledgered, `rngAllowed: true` |
| Diplomacy tension change (§13) | e.g. `diplomacy/month/{nation}` | **No** — `resolve_diplomacy` phase is `rngAllowed: false`; needs a deliberate registry change if randomness is actually required |
| Ship naming (§12 generated fallback) | e.g. `naming/{campaignId}/{seq}` | **No** — no phase-engine involvement at all; naming would happen at construction-order time (UI/application layer), not monthly resolution; a stream could be wired there directly without touching `PhaseRegistry` |
| Construction resolution (§12) | none specified | **No** — `construction_processing` is `rngAllowed: false`; the doc's resolution steps are deterministic, consistent with this |

`RandomEngine.stream(domain: string)` takes a free-form domain string, so any
named stream is trivially expressible following the `area/scope/...ids`
convention research already established. The **phase-level gating is the real
constraint**, not the API: `resolve_diplomacy` (order 6.5) and
`construction_processing` (order 6) are both `rngAllowed: false` today —
diplomacy's monthly tension change and any construction randomness are
phase-gated to be deterministic/rule-based only. No phase exists for ship
naming at all.

**Stable iteration** — spot-checked `diplomacy.ts`, `research.ts`, and
`state.ts` for `for...in`/`Object.keys(`/`.entries()` patterns that would leak
insertion/Map order into results: no hits. No immediate violation found in the
core domain modules.

**Net:** M2's touched subsystems require no `PhaseRegistry` change — research is
wired, diplomacy stays deterministic (no monthly tension randomness ships),
construction is deterministic by design, and ship naming is a deferred slice.
The forbidden `Math.random()`/`Date.now()`/`crypto.randomUUID()` pattern holds
for simulation-relevant code; the one flagged divergence is §7's
`baseResources`-vs-`income` revenue question, recorded as a pre-existing engine
concern, not resolved here.

---

## 19.1 Ownership Split

Adapted from the doc's §19.1 to the resolved reality:

### Domain (`packages/campaign`, `packages/campaign-engine`, `packages/phase-engine`)

Owns:

- campaign date/time and turn number (§4);
- treasury rules and the monthly finance phases (§9, §14);
- research allocation invariants and the weight-based resolution (§10);
- construction progression and the real allocation policy (§12);
- diplomacy progression, the tension-label taxonomy and the
  high-tension threshold (§13);
- **strategic-priority evaluation — a read-only projection in the engine
  layer, not the renderer** (§7);
- monthly report facts (§16).

### Application (desktop command layer)

Owns:

- campaign command orchestration (`CampaignCommandClient.execute(...)` and the
  main-process command handlers);
- expected-revision checks and the `CommandEnvelope` triple (§4, §14);
- idempotency (queued command envelopes keyed by `idempotencyKey`, §14);
- transactions and persistence sequencing (`commitMonth`'s ordering, §14);
- projection construction (`PlayerProjection`, the priorities projection, the
  report's derived view).

### Infrastructure (`packages/persistence`, Electron main)

Owns:

- save file access, atomic replacement, recovery/corruption handling
  (`SaveStore`, §17);
- session registry;
- Electron IPC transport (the single 28-command `window.bluewave.campaign.execute`
  contract, typed via `CAMPAIGN_COMMAND_NAMES`);
- system dialogs and shell capabilities (none added — "Open campaign folder"
  is cut for lack of a safe capability).

### Renderer (`apps/desktop/src/renderer`)

Owns:

- navigation and the campaign shell (§5);
- ephemeral input drafts (research field-priority edits, §10);
- disclosure state, sorting/filtering preferences, selected rows and panels;
- guide presentation (the DOM-based spotlight overlay, §8);
- the cosmetic month-resolution loading sequence (§15);
- dismissal UI — and the dismissal/inspection state stored in the `ui-state.json`
  sidecar, which is renderer-owned and **never authoritative** (§7, §8).

The renderer must not contain authoritative simulation formulas — the resolved
tickets hold this line consistently (tension labels, priority triggers, and
projected balances all come from engine projections, never re-derived in React).

---

## Out of scope

Work consciously ruled beyond this effort's destination — returns only if the
destination is redrawn, as a fresh effort.

**Carried forward from the diagnosis doc's §2.2** (unchanged except where noted
above — battle outcomes and war/blockade state are now surfaced **read-only**
where real data already exists, but the underlying player *actions* remain out
of scope):

- tactical battle simulation and tactical battle UI (battle outcomes are
  surfaced as report text only);
- player-designed ship hulls, a full ship designer, manual gun/armor/
  machinery/fire-control configuration;
- fleet deployment to strategic regions, required regional force levels,
  colonial possessions management;
- naval invasions, submarine warfare, aviation development;
- treaties and naval limitation conferences;
- random historical events, government changes;
- officer management, crew training management, detailed ammunition logistics;
- ship scrapping, mothballing and reserve fleet states, ship refits and
  reconstructions;
- player-initiated war declarations, peace negotiations (war/blockade *display*
  is in scope; war/blockade *action* is not);
- intelligence quality and uncertain enemy fleet estimates (true strategic
  fog-of-war);
- generated starting-fleet behavior behind the Milestone 1 fleet-method
  setting;
- full application-wide metric conversion, automatic historical ship naming;
- ironman mode, cloud saves, multiplayer.

**Per-section cuts decided by the tickets:**

- **Player-entered ship naming** (§12.6) — no `shipName` input exists anywhere;
  completed ships are engine-named `Ship {className}`; `namingConvention`/
  `shipNameReuse` stay UI-only; recorded as a deferred engine slice (including
  the reuse-dedupe logic).
- **"Open campaign folder"** (§15.3) — no safe preload capability exists;
  recorded as deferred.
- **Foreign Relations "change since previous month" and the "future-war
  milestone" warning framing** (§13.4) — no previous-turn tension is stored, no
  monthly tension processing runs; the high-tension warning is reframed to
  current-state copy ("hostile; war is possible") because war already exists
  and is displayed.
- **Research budget-effectiveness and settings-effect copy** (§16.3) — no
  formula or explainable surface exists.
- **Fleet per-ship maintenance** (per-row figure, sort key, and the "new
  maintenance effect from completed ships" report line) — only the fleet-wide
  aggregate is real.
- **Construction "stalled" as a persistent priority card** (`construction_stalled`
  cut in §7) — the transient report-delta display flag on the Construction page
  remains; a persistent card needs a snapshot field that doesn't exist.
- **`obsolete_active_class` priority** — no obsolescence score, no design
  vintage, no design→required-tech mapping; the briefing's capital-ship
  heuristic is not reused as this trigger.
- **Real month-resolution progress streaming** (§15.2) — no
  `subscribeToMonthProgress`-equivalent is built; a cosmetic sequence races the
  synchronous commit. No `MonthResolutionProgress` schema.
- **Real mid-resolution cancellation** (§14.5) — no `AbortSignal` path;
  Advance is disabled during the in-flight commit; true abort deferred.
- **Same-`requestId` result-replay caching** (§14.8) — the engine's idempotency
  covers queued command envelopes, not the month-advance itself; recorded as a
  small follow-up.
- **True strategic fog-of-war** — intelligence quality and uncertain enemy
  fleet estimates (no derivation path from existing data).
- **Treasury budget controls, drafting, validation, and projection commands**
  (§9.2, §9.4–§9.6) — Treasury is read-only; nothing to submit or validate.

**Recorded but not resolved (flagged for future decisions, not shipped):**

- The `baseResources`-vs-`income` revenue divergence (§7) — a pre-existing
  engine concern affecting M1 economy-display truthfulness.
- The same-month-conflict gap in turnNumber-as-revision (§4) — a per-mutation
  revision counter is a small follow-up.
- The `ui-state.json`/`monthly-reports.json` sidecars are renderer-owned and
  outside the authoritative envelope by contract — never migrated into the
  snapshot schema.

## Handoff

This spec is ready to hand off to implementation tickets (`to-tickets`),
following the same frontier-ordered vertical-slice pattern as the prior
Commissioning Flow effort. Definition of done for the implementation: every
section above lands against the real code surfaces it cites; goldens stay 10/10
(the priorities projection, the two new `PlayerProjection.economy` fields, the
sidecars, and the report view add **no** authoritative schema/hash surface);
the two new engine-layer additions are the read-only priorities projection
(§7) and the already-implemented tension policy (§13); every flagged item above
remains recorded, never silently resolved.

Notable implementation-sequencing items not pinned by any decision ticket (left
to whoever plans the implementation):

- The exact `ui-state.json` / `monthly-reports.json` sidecar write path shared
  with ticket 05 — §7 settles the mechanism (atomic tmp-dir → rename, tolerant
  read, keyed by `campaignId`, never authoritative) but not the concrete file
  layout/helper module.
- The exact `PlayerProjection.economy` field addition from ticket 06 —
  `constructionSpend` + `researchSpend` alongside the surplus/deficit fields §5
  specified; exact derivation and where they're computed is implementation.
- The priorities projection (§7) and its consumption by three surfaces: the
  Overview panel (§6), the pre-turn review's warnings section (§14), and the
  report's new/resolved/continuing comparison baseline (§16).
- The campaign-list screen + the additive `SaveMetadata` extension
  (`campaignName`, `nationId`, `campaignDate`) from ticket 16, including the
  `—` fallback rendering for legacy records.
- The `StrategicDestination` focus-field re-check (ticket 02's standing
  follow-up) once the Research/Construction/Fleet screens are wired.
- The concrete visual click-through details deferred by tickets 10 and 18
  (wizard layout, spotlight ring radius/scrim opacity/card position).