**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §5 (Navigation Architecture) of [01-diagnosis.md](../01-diagnosis.md).

Decide the campaign shell's navigation structure for Milestone 2:

1. **Strategic sections** (§5.1): confirm the six sections (Overview, Fleet,
   Construction, Research, Treasury, Foreign Relations) match what's
   feasible given the domain audit already done during charting (Treasury
   in particular has no dedicated IPC command yet — see the map's Notes).
   Decide whether all six ship together or whether Treasury's absence of a
   backing command changes sequencing (it shouldn't block *navigation*
   design, only the Treasury ticket's implementation, but confirm).
2. **Campaign header contents** (§5.1): date, nation, funds, projected
   surplus/deficit, alert count, save state, Advance Month action — confirm
   each is derivable from real state (cross-reference
   [Campaign lifecycle/revision](./01-campaign-lifecycle-time-revision.md)
   for date/revision, and the Treasury domain facts in the map's Notes for
   funds/surplus).
3. **Route ownership boundary** (§5.2): confirm the existing renderer/domain
   split in `apps/desktop` already matches "renderer owns navigation,
   campaign application layer owns state" — this is likely already true
   architecturally; the decision is whether any doc wording needs
   correcting against actual code organization.
4. **Deep-link destinations** (§5.3): the `StrategicDestination` union type
   is renderer-only navigation, not persisted — confirm scope of "focus"
   fields (e.g. `focusTechnologyId`) against what other tickets ([Priorities](./04-immediate-priorities-engine.md),
   [Treasury](./06-treasury-budget.md), etc.) actually produce as navigable
   targets; trim any destination shapes that don't correspond to a real UI
   target once those tickets exist. It's fine to accept this section
   provisionally and flag a follow-up note if a later ticket invalidates one
   of the six destinations.

## Answer

Grounded against real code in `apps/desktop/src/renderer/shell/` (a working
campaign shell already exists — this ticket reconciles the doc against it,
not designs from scratch).

1. **Sequencing** — all six sections ship together in the nav shell. The
   registry (`campaign-screen-registry.tsx`) already has real routes for
   Overview, Construction, Fleet, Research, and Diplomacy. Treasury gets a
   sixth registry slot (sidebar entry + route) that renders a stub ("not yet
   available") until the Treasury ticket lands and wires it to real state —
   same conditional-registration pattern already used for debug-only
   screens. Treasury's missing IPC command blocks *that ticket's*
   implementation only, never nav-shell design.
2. **Header fields** — real vs. gap, confirmed against `site-header-state.ts`
   and `PlayerProjection` (`packages/campaign-engine/src/projection.ts`):
   - date ✅ real (`month.year`/`month.month`)
   - funds ✅ real (`economy.treasury`)
   - Advance Month ✅ real, already wired (`commitMonth` via `SiteHeader`'s
     `onAdvanceMonth`)
   - nation ❌ not on `PlayerProjection` — `NationState.name`
     (`packages/campaign/src/state.ts:197`) exists in the engine but isn't
     projected. **Decision: spec this as a small `PlayerProjection` addition
     in this ticket** (project `nation.name` alongside the existing
     `economy`/`month` fields) — header plumbing, not Treasury screen logic.
   - projected surplus/deficit ❌ same gap and same decision: add to the
     projection now, sourced from `NationState.income`/`expenses`/
     `maintenanceCost` (the same raw fields the map's Treasury notes already
     confirm are real, just not yet surfaced at the header layer).
   - alert count ❌ genuinely blocked — no priority/warning-card system
     exists anywhere in the engine (map-level fact). **Decision: spec the
     header alert slot as forward-wired, populated once
     [Immediate priorities engine](./04-immediate-priorities-engine.md)
     lands, not built in this ticket.**
   - save state ⚠️ partial — `saving`/`saveMessage` in
     `campaign-shell-state.ts` are transient save-in-progress/toast state,
     not a persisted "unsaved changes" dirty flag. **Decision: spec header
     save-state display as the existing saving/last-saved-message pair; a
     dirty-flag concept is out of scope for this ticket** (nothing in the
     domain audit suggests one exists or is needed yet).
3. **Route ownership** — confirmed matching as-is, no doc rewrite beyond
   citing real files instead of restating abstract wording:
   `campaign-shell-state.ts` is a pure reducer over navigation/UI state (no
   campaign-data mutation); `CampaignScreenOutlet` passes only `sessionId`
   into screens; all campaign mutations route through
   `CampaignCommandClient.execute(...)`, never a direct renderer state
   write.
4. **Deep-link destinations** — accepted provisionally per the ticket's own
   escape hatch, with one concrete correction: the existing shipped screen
   is labeled "Diplomacy & War" (id `diplomacy`), not "Foreign Relations" —
   the doc conforms to the real, working screen, not vice versa (consistent
   with the map's general discipline on doc vs. code conflicts). **Decision:
   rename the `StrategicDestination` union's `"foreign-relations"` literal
   to `"diplomacy"`; leave every `focus*` field (`focusTechnologyId`,
   `focusProjectId`, `focusShipId`, `focusNationId`, treasury's `focus`)
   unvalidated for now** — their real targets are produced by
   [Immediate priorities engine](./04-immediate-priorities-engine.md),
   [Treasury/budget](./06-treasury-budget.md),
   [Research allocation](./07-research-allocation.md), and
   [Fleet inspection](./08-fleet-inspection.md), none of which have run yet.
   Flag as a standing follow-up: re-check this union once those tickets
   resolve, trimming any field with no real navigable target.
