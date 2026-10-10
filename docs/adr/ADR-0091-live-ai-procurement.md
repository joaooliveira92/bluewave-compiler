# ADR-0091: Live AI naval procurement lifecycle

## Status

Accepted 2026-10-10. Completes the national runtime integration begun in ADR-0090.

## Context

The procurement **decision** (fleet assessment, deficits, candidate generation, national scoring) and the
authoritative **order policy** (`placeConstructionOrder`) existed and were tested, but nothing drove them from the
campaign loop: an AI nation never submitted a design, waited for its study, or placed an order. The missing piece
was phase-engine orchestration from `ai_planning` through design-study approval to order placement — without
duplicating any compilation, classification, access, AMC-limit, budget, dock or order-eligibility rule.

## Decision

1. **A new phase `ai_procurement` (order 1.6, after `ai_planning`)** runs for every AI nation with a
   `NationNavalProfile`. It uses the same state-transition boundary the player uses: it builds a `SubmitDesign`
   command, validates it through `CommandLifecycle`, applies it via `applySubmitDesign` (which opens a design study),
   waits for the existing appropriation phase to fund and approve the study, then calls `placeConstructionOrder`. It
   never writes designs, studies or projects directly.
2. **A persisted `ProcurementIntent` per attempt** (`NationState.procurementIntents`, optional, backward compatible)
   with stable ids and the states `PLANNED | STUDY_SUBMITTED | STUDY_IN_PROGRESS | APPROVED | ORDER_PLACED |
   REJECTED | CANCELLED | EXPIRED`. It records the decision id, nation, role, candidate/submitted design ids, study
   id, construction project id, attempt number, months, budget ceiling, decision seed and a structured reason.
   Correlation is by stable id, never by class name or display text.
3. **Deterministic orchestration.** The decision seed is
   `${campaignSeed}:procurement:${nationId}:${turnNumber}:${role}:${attempt}`; the submitted draft is captured
   immutably in the study's `sourceDraft`, so an in-progress candidate is never regenerated. The expected-snapshot
   hash for each submission is computed from the live snapshot at that moment.
4. **Revalidation and idempotency.** `planProcurementDecision` revalidates (compiles, checks national access, dock
   fit, affordability, legality) before submission; the approved path re-checks the design exists, is owned and
   remains legal, and that the deficit still exists; ordering always calls `placeConstructionOrder`. The command
   idempotency key includes the decision id, and one active intent per role group
   (`capital | cruiser | light | colonial`) prevents near-identical duplicate studies. Processing an intent twice
   does not create a second study or project.
5. **Changed circumstances** are explicit and non-throwing: deficit satisfied elsewhere → `CANCELLED`
   (`deficit_satisfied`); design/study missing after reload → `EXPIRED`; design no longer legal → `CANCELLED`;
   order rejected by budget/dock/AMC/access → `APPROVED` with a `deferred:<reason>`; approved for 12 months unbuilt →
   `EXPIRED` (`unaffordable_timeout`); a rejected submission retries with a new attempt seed, bounded to 3. A
   nation with no legal, affordable option returns a structured decline and submits nothing.
6. **Budget safety.** No construction funds are reserved at study submission (studies are paid by the existing
   appropriation rule). The planning ceiling is `treasury × (1 − RESERVE_BP)` (`RESERVE_BP = 2000`); actual price,
   dock eligibility and availability are resolved again inside `placeConstructionOrder`.
7. **Observability.** Bounded `addInfo` diagnostics: `AI_PROCUREMENT_PLANNED` (via submission/deferral codes),
   `AI_DESIGN_STUDY_SUBMITTED/APPROVED/REJECTED`, `AI_CONSTRUCTION_ORDER_PLACED`, `AI_PROCUREMENT_DEFERRED`,
   `AI_PROCUREMENT_CANCELLED`, `AI_PROCUREMENT_EXPIRED`. No catalogs or unbounded candidate sets are logged.
8. **Non-fatal by construction.** Each nation's procurement is wrapped so an unexpected error is recorded as a
   deferral and the month continues; the cross-process fixture has no profiles, so its hashes are unchanged.

## Alternatives considered

- *Write approved designs/projects directly into the snapshot.* Rejected: it would duplicate and could bypass the
  authoritative eligibility, AMC-limit and order rules.
- *Order in one month by skipping the study.* Rejected: it would diverge from the player workflow and weaken the
  study gate.
- *A per-nation adaptive procurement AI.* Deferred: the decision module already adapts to fleet state and budget;
  richer obligation modelling is a later pass.

## Consequences

- AI nations with a profile now run the full study→order lifecycle. The `ai_procurement` phase adds one registry
  entry, one phase footprint and a `designs` phase resource; the phase registry/order tests were updated.
- `ConstructionProject` and `NationState` gain optional fields; old saves load unchanged (no load-time defaults).
- Tested by a lifecycle suite (deficit→study, no order before approval, study duration, approval→order, no
  duplicate study, deficit-satisfied cancellation, structured decline, determinism) and a live sweep of 2 nations ×
  3 seeds × 3 budgets × 36 months with zero unhandled exceptions and deterministic replay.
