**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §8 (Guided First Month Inspection) of [01-diagnosis.md](../01-diagnosis.md).

Decide the guided-tour UX for Milestone 2, following the same interaction
family as the Commissioning Flow effort's nation-confirmation/dossier work
(reuse existing highlight/spotlight patterns from this codebase if any
exist — check `apps/desktop/src/renderer` for a prior guide/tour
implementation before designing one from scratch).

1. **Entry condition and steps** (§8.1–§8.2): confirm the seven-step
   sequence (Overview → Treasury → Research → Construction → Fleet →
   Foreign Relations → Advance Month) matches the six sections decided in
   [Navigation & campaign shell](./02-navigation-campaign-shell.md).
2. **Behavior constraints** (§8.3): the "must not" list (no domain-state
   mutation, no blocking navigation, no manufactured values, no reopening
   after completion) — confirm these are all achievable with a purely
   renderer-side implementation, no application-layer changes needed.
3. **Persistence** (§8.4): `FirstMonthInspectionState` (status +
   lastCompletedStep) — decide where this lives (campaign UI metadata,
   alongside priority-dismissal state from
   [Immediate priorities](./04-immediate-priorities-engine.md)) and whether
   it needs its own persistence path or piggybacks on an existing one.
4. **Reconsider whether `/prototype` is warranted**: this is a
   cross-section highlighting/spotlight UI — if no comparable pattern exists
   in the codebase yet, decide whether a rough prototype is worth building
   to judge feel before committing to the interaction model.

## Answer

Grounded via a `/grilling` round (four independent questions, one round,
all confirmed as recommended):

1. **Steps and entry** — the seven-step sequence stands
   (Overview → Treasury → Research → Construction → Fleet → Foreign
   Relations → Advance Month), six real section screens plus one real
   header action for step 7 (`SiteHeader.tsx:84-89`, `onAdvanceMonth` →
   `shell.actions.advanceMonth`). Step 7 highlights that button but is
   **purely informational** — clicking it isn't wired to guide completion;
   the guide completes via its own "End inspection"/final-step action, and
   the player advances the month afterward on their own. Keeps the guide
   from special-casing or intercepting a real domain command
   (`commitMonth`), consistent with §8.3's mutation/blocking prohibitions.
2. **Behavior constraints** — all six "must not" behaviors are achievable
   as a pure renderer-side overlay (spotlight/highlight + step-card) that
   only reads existing screen state and writes nothing but its own
   `status`/`lastCompletedStep`. No application-layer or command changes
   needed.
3. **Persistence** — this ticket specifies **shape and requirement only**:
   `FirstMonthInspectionState { status, lastCompletedStep }` must persist
   per-campaign and survive save/load. It explicitly **defers the storage
   mechanism** to [Saving, loading & campaign-list](./16-saving-loading-campaign-list.md),
   since no generic UI-metadata bag exists anywhere on
   `CampaignSnapshot`/`CampaignState` (`packages/campaign/src/state.ts:327-357`)
   today — the same gap blocks priority-dismissal state in
   [Immediate priorities engine](./04-immediate-priorities-engine.md), so one
   ticket (16) settles the mechanism once for both rather than two tickets
   inventing it separately.
4. **Prototype warranted** — confirmed no comparable spotlight/tour
   component exists in `apps/desktop/src/renderer` today (checked via grep;
   no false-positive hits beyond unrelated CSS "highlight" glass variants).
   A cross-six-screen spotlight overlay has real feel questions a text spec
   can't settle. **Decision: spin off a `prototype` ticket** to build a
   rough spotlight/step-card overlay and react to it before the final spec
   locks the interaction model — see
   [Guided-inspection spotlight prototype](./18-guided-inspection-spotlight-prototype.md).
