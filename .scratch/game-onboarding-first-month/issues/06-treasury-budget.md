**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §9 (Treasury and Budget Management) of [01-diagnosis.md](../01-diagnosis.md).

The real domain model has aggregate `treasury`/`income`/`expenses`/
`maintenanceCost` fields (`SafeInt`, `packages/campaign/src/state.ts:200-205`)
— no `MoneyAmount` type, and `expenses` is not decomposed into
construction/research/other categories the way the doc's §9.1 Income/
Expenditure table assumes.

Decide:

1. **Treasury projection shape** (§9.1): can construction/research spend be
   *derived* separately (e.g. from the real construction cost formula and
   research budget fields) even though `expenses` itself is aggregate? If
   not fully derivable, cut the doc's "Other expenses" balancing-row concern
   is already correctly flagged by the doc itself (§9.1 — don't invent a
   category the engine doesn't expose) — apply the same rule to any other
   line item that can't be derived.
2. **Budget controls** (§9.2): confirm research and construction allocation
   are genuinely independently adjustable in the real engine, fleet
   maintenance is calculated-only, and government allocation is
   externally-determined-only.
3. **Input model** (§9.3): adopt `SafeInt` (the real type) in place of the
   doc's proposed `MoneyAmount` — confirm `SafeInt`'s actual constraints
   match (integer, non-negative, safe-integer) or note discrepancies.
4. **Drafting behavior, validation, projection** (§9.4–§9.6): confirm a
   side-effect-free "projection" command is feasible given the real IPC
   contract (single `execute(command, payload)` channel, not per-method) —
   decide whether this needs a new command in `CAMPAIGN_COMMAND_NAMES` or
   reuses an existing inspect-style command.

## Answer

Grounded against real code, then confirmed via a `/grilling` round (three
questions, one round, all confirmed as recommended). The central finding:
**nothing on Treasury is player-adjustable in Milestone 2** — research's
total budget (`ResearchState.researchBudget`,
`packages/campaign/src/state.ts:43`) and government naval appropriation
(`navalAppropriationRateBp`, `packages/campaign/src/compiler.ts:442`) are
both fixed at compile time and mutated by no command; construction has no
scalar "allocation" field at all, only per-project authorize/cancel
(`submitConstructionCommand` et al., owned by
[Construction projects state model](./09-construction-projects-state-model.md))
plus an automatic month-end work-allocation pass
(`packages/phase-engine/src/month.ts:522-587`). Research's *field*
allocation (how the fixed budget splits across fields) is real and
player-adjustable, but that's [Research allocation](./07-research-allocation.md)'s
screen, not Treasury's.

1. **Treasury projection shape (§9.1)** — kept as a **read-only** display:
   income (naval appropriation), expenditure (fleet maintenance — real,
   calculated, `month.ts:653-694`; construction spend — derived by summing
   active projects' this-month work allocation; research spend — the real
   `researchBudget` field), result (surplus/deficit, available funds,
   projected month-end funds). No "Other expenses" balancing row needed —
   these three categories cover it.
2. **Budget controls, drafting, validation, projection (§9.2, §9.4–§9.6) —
   cut entirely.** No `ReviseNavalBudgetCommand`, no `ProjectBudgetCommand`,
   no draft/apply/reset UI, no validation rules — there is nothing real to
   submit or validate. Confirmed fleet maintenance is calculated-only and
   government allocation is externally-determined-only, matching the doc;
   "research/construction allocation" as *editable Treasury controls* is cut
   as doc invention with no backing command.
3. **Backing command** — no new Treasury-specific command.
   `PlayerProjection.economy` (`packages/campaign-engine/src/projection.ts`)
   gets two new derived fields (`constructionSpend`, `researchSpend`) added
   alongside the surplus/deficit fields ticket 02 already specified there —
   same pattern, still served via the existing `inspectCampaign` command.
   `maintenanceCost` is already real and direct on `NationState`.
4. **Input model (§9.3)** — adopt `SafeInt`
   (`packages/contracts/src/index.ts:7-15`) in place of `MoneyAmount`.
   `SafeInt` enforces integer + safe-integer-range, **not** non-negativity —
   but since Treasury now has no player-facing money inputs (per point 2),
   that discrepancy is moot: surplus/deficit legitimately goes negative, and
   nothing else on a read-only screen needs the constraint.
