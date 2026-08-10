# 04 — Domain event envelope

**What to build:** Versioned domain-event envelope and structured explanation trees. Important calculations return structured explanation trees using stable semantic terms. Localized text is presentation-only. Domain events are emitted by the command lifecycle and phase execution as immutable append-only records.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `DomainEventEnvelope` type with versioning
- [ ] Structured `ExplanationTree` type using stable semantic terms (not localized strings)
- [ ] `EventLedger` for append-only event recording
- [ ] Tests: event structure, explanation tree format, envelope verification
- [ ] ADR for domain event model
