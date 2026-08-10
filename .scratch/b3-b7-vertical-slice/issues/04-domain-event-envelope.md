# 04 — Domain event envelope

**What to build:** Versioned domain-event envelope and structured explanation trees. Important calculations return structured explanation trees using stable semantic terms. Localized text is presentation-only. Domain events are emitted by the command lifecycle and phase execution as immutable append-only records.

**Blocked by:** 01

**Status:** resolved

- [x] `DomainEventEnvelope` type with versioning
- [x] Structured `ExplanationTree` type using stable semantic terms (not localized strings)
- [x] `EventLedger` for append-only event recording
- [x] Tests: event structure, explanation tree format, envelope verification
- [x] ADR for domain event model

## Answer

Implemented `packages/events` with `DomainEventEnvelope`, `DomainEventBody` (5 event types: NationBudgetChanged, ConstructionProgressed, ResearchProgressed, BattleInitiated, BattleResolved), `ExplanationTree`, `ExplanationBuilder`, `EventLedger`. 9 tests pass.
