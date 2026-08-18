**Type:** grilling
**Status:** resolved
**Blocked by:** 09

## Question

Spec §12.4–§12.7 (Ordering a Ship, Design Eligibility, Ship Naming, Order
Command) of [01-diagnosis.md](../01-diagnosis.md).

Split out from [Construction: active projects & state model](./09-construction-projects-state-model.md)
per charting decision — this is a distinct multi-step wizard (select design
→ review summary → name ship → review dock/cost/completion/balance impact →
confirm) with its own naming/validation/eligibility rules, too much to fold
into one session with the state-model ticket.

Decide:

1. **Flow steps** (§12.4): confirm each of the 10 steps is backed by real
   data (design catalog, dock capacity, projected cost via the real
   `construction_order_v1` formula from [ticket 09](./09-construction-projects-state-model.md),
   projected balance impact from [Treasury](./06-treasury-budget.md)).
2. **Design eligibility rules** (§12.5): confirm each of the six eligibility
   conditions is checkable against real data; confirm "insufficient current
   cash doesn't make a design ineligible if construction pays over time" is
   true of the real cost formula (which appears to be a one-time cost
   based on displacement, not a pay-over-time model — verify this before
   assuming the doc's framing holds).
3. **Ship naming** (§12.6): confirm `namingConvention`/`shipNameReuse`
   (captured as UI-only during the Commissioning Flow effort, per that
   map's ticket 03) are available to read here; decide the generated-name
   fallback and reuse-disabled dedupe logic exactly as the doc specifies
   (this section is concrete and implementable as-is, low risk).
4. **Order command** (§12.7): map `PlaceConstructionOrderCommand`/`Result`
   onto the real `submitConstructionCommand`/`replaceConstructionCommand`/
   `cancelConstructionCommand` family found in the charting-session IPC
   audit, rather than inventing new command names.

## Answer

Verified against the real construction command family
(`apps/desktop/src/main/commands/constructionCommands.ts`: `submitConstructionCommand`
/ `replaceConstructionCommand` / `cancelConstructionCommand`), the reservation
workspace (`apps/desktop/src/main/constructionWorkspace.ts`), the pure design
catalog + cost projection (`packages/campaign-engine/src/construction.ts`), the
IPC contract (`apps/desktop/src/shared/construction-contract.ts`), and the
completion path (`packages/phase-engine/src/month.ts:804-873`).

**Headline: the wizard is a select-design → review → confirm flow backed
entirely by the real `submitConstructionCommand`. Two doc features are cut:
ship naming (§12.6) and the "financial warning on low cash" (§12.5) — the real
engine has no name input anywhere and reserves the full projected cost up
front, so low cash is a hard `INSUFFICIENT_FUNDS` rejection, not a warning.**

### 1. Flow steps (§12.4) — 8 of the 10 steps are real

| Doc step | Real backing |
| --- | --- |
| 1 Select **Order ship** | Real (screen action). |
| 2 Choose an available design | Real — `buildConstructionDesignCatalog` (`construction.ts:105-129`), filtered to the player nation, sorted by `designVersionId`. |
| 3 Review design summary | Real — catalog fields `className`, `shipType` (hull-type label), `year` (design-family month, `0` fallback), `mass` (t), `speed` (kt), `machineryType`, `requiredTechnologyIds` (empty — nothing links techs). |
| 4 Enter ship name / accept fallback | **CUT — no name input exists.** See §3. |
| 5 Review dock requirement | Real — `projectedCapacityUnits` (kt, `construction.ts:59-60,82`) vs the reservation CAPACITY pool. |
| 6 Review total projected cost | Real — `projectedConstructionOrderCosts` (`construction.ts:76-84`), `construction_order_v1` (1 cost unit per 100 t). |
| 7 Review estimated completion time | **CUT** — no months-to-completion is derivable (same finding as ticket 04: `computeConstructionCap` private + `baseResources` compiled `0`). The wizard shows the real project work/treasury commitment instead, with no completion-time claim. |
| 8 Review effect on projected monthly balance | Real, honest copy — the order reserves `projectedCost` treasury + `projectedCapacityUnits` capacity immediately (the workspace's `treasuryReserved`/`capacityReserved`); the projected-balance wording uses the reservation, not a fabricated monthly figure. |
| 9 Confirm order | Real — `submitConstructionCommand` (`constructionCommands.ts:91-200`). |
| 10 Return to Construction with project visible | Real — success returns the workspace; the queued project appears via `buildConstructionProjectQueue` (`construction.ts:175-198`), `projectId` = `constructionProjectIdForCommand(commandId)`. |

### 2. Design eligibility (§12.5) — 5 of 6 conditions are real, one is reversed

Real, checkable conditions (each backed by an engine rejection code):

- **belongs to / available to the player nation** → `DESIGN_NOT_FOR_PLAYER`
  (`constructionCommands.ts:118-126`) — catalog already filters
  `design.nationId === playerSlotId`.
- **constructible in the current campaign state** → `UNKNOWN_DESIGN`
  (`constructionCommands.ts:110-117`) — design must exist in the compiled
  snapshot.
- **at least one player port has sufficient dock capacity** → `INSUFFICIENT_CAPACITY`
  — the reservation CAPACITY pool (`reserveForOrder`,
  `constructionCommands.ts:519-544`), backed by `projectedCapacityUnits` vs
  the real `shipyardCapacity`/port-level proxy (projection.ts:111).
- **its data validates** → trivially true — snapshot designs are already
  compile-validated; `projectedConstructionOrderCosts` always computes for a
  valid design.
- **projected cost can be computed** → real (`construction.ts:76-84`).
- **not an unsupported foreign-intelligence-only design** → **CUT** — no such
  design class exists; the catalog only ever lists the player's own designs.

**Reversed — "insufficient current cash doesn't make a design ineligible if
construction pays over time": FALSE for the real engine.** The real model
**reserves the full projected cost up front** (`reserveForOrder` checks the
TREASURY pool → `INSUFFICIENT_FUNDS`, `constructionCommands.ts:141-150,519-544`).
There is no "placed despite low cash" state — either the treasury can cover the
projected cost and the order is accepted, or it can't and it is rejected. The
doc's pay-over-time framing and its "financial warning" UI are cut; the spec
documents the real reservation policy (matching ticket 09's "real cost-formula
is authoritative" decision). A near-boundary affordability read is still
available in the review (workspace `treasuryReserved` vs the nation's
`treasury`) for honest copy, but it never produces a "placed with warning"
outcome.

### 3. Ship naming (§12.6) — CUT from M2

Verified: **no ship-name input exists anywhere in the real engine.** The
`SubmitConstructionCommandPayload` carries only `{sessionId, expectedRevision,
transportRequestId, designId}` (`construction-contract.ts:37-39`) — no
`shipName`, no `portId`. `ConstructionProject` has no name field
(`state.ts:214-225`), and the completed ship is auto-named
`Ship ${className}` (`month.ts:858-873`). The commissioning-flow
`namingConvention`/`shipNameReuse` preferences remain **UI-captured-only**; no
command or engine path consumes them. Per the map's discipline (default on an
unbacked claim is to cut; never invent historical names in the renderer), M2's
wizard **does not collect a ship name** — projects are identified by their real
design class + project id, and the completed ship's name is documented as the
engine-generated `Ship {className}`. Player-entered ship naming (a `shipName`
field on the command + persistence + completion instantiation) is recorded as a
deferred engine slice, not fabricated as a UI-only name that the engine would
silently ignore. This also means §12.6's reuse-dedupe logic (name matching
against active ships/projects) has no input to operate on — deferred with it.

### 4. Order command (§12.7) — maps onto the real family, not a new command

The doc's `PlaceConstructionOrderCommand`/`Result` map onto the real
`submitConstructionCommand` family; **no new command name or payload**:

- **Place order** → `submitConstructionCommand` (real, `constructionCommands.ts:91`)
  — the doc's `expectedTurn` = real `expectedRevision`; `campaignId` + revision
  live in the real `CommandEnvelope` triple (`sessionId`, `expectedRevision`,
  `transportRequestId`).
- **Change design** → `replaceConstructionCommand` (real, `206`) — the real
  supersede-in-place for an in-flight order.
- **Cancel order** → `cancelConstructionCommand` (real, `366`).
- **`projectId`** → `constructionProjectIdForCommand(commandId)`
  (`construction.ts:148-150`).
- **`campaignRevision`** → real `expectedRevision` / `snapshot.turnNumber`.
- **`warnings`** → **CUT** — no real warnings array exists; outcomes are
  `success` (with the workspace view: reserved treasury/capacity + command
  status) or a hard rejection reason code (surfaced verbatim, matching every
  other desktop surface). `idempotency` (same `transportRequestId` replay,
  `IDEMPOTENCY_CONFLICT` on reuse-with-different-payload) and failure atomicity
  (F2: rejected/replace/cancel persist-failure leaves the session untouched)
  are already real (`constructionCommands.ts:104-108,155-171,380-420`) — the
  spec documents them, doesn't rebuild them.

**Net spec effect.** M2's Ordering a Ship section describes the real
select-design → review (summary, capacity, projected cost, reservation
impact) → confirm flow over `submitConstructionCommand`, with `replace`/`cancel`
for in-flight orders, the real eligibility rejection codes, **no naming step**
(engine auto-names at completion; deferred engine slice recorded), and **no
completion-time or low-cash-warning claims** (both cut with reasons above). The
ticket's `/prototype` note: concrete visual click-through is deferred to the
implementation sprint (presentation detail only), same pattern as ticket 18 —
the interaction model needs no throwaway prototype to be judged.

## Notes for the resolving session

- Reach for `/prototype` here — this is exactly the kind of multi-step
  wizard the prior map's "Starting-fleet-method screen" ticket needed a
  prototype to judge.
