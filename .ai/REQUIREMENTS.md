# Bluewave Requirement Traceability Index

This file is an initial index. During bootstrap, derive additional stable IDs from `SOURCE-DESIGN-v1.0.md` without changing its meaning or copying large sections.

## Initial requirements

- **BW-ARC-001**: Domain and authoritative simulation logic remain independent of presentation and platform adapters.
- **BW-ARC-002**: UI state is never authoritative simulation state.
- **BW-CMP-001**: Missing required canonical input causes campaign compilation failure.
- **BW-CMP-002**: Compiler output ordering and identifiers are canonicalized reproducibly.
- **BW-CMD-001**: Commands do not mutate authoritative state directly.
- **BW-CMD-002**: Commands pass through validation, reservation, locking, and explicit resolution outcomes.
- **BW-DET-001**: Authoritative outcomes use integer or fixed-point arithmetic.
- **BW-DET-002**: A single global consumptive RNG stream is prohibited.
- **BW-DET-003**: Identical authoritative inputs produce identical hashes across supported operating systems.
- **BW-DET-004**: Random decisions use stable domain-separated keys and produce audit records.
- **BW-PER-001**: Save files pin content, formula, AI, RNG, and format compatibility versions.
- **BW-PER-002**: Saves are committed atomically and retain a recovery state.
- **BW-PER-003**: Save/load preserves deterministic future outcomes.
- **BW-RUL-001**: Localized text never controls simulation mechanics.
- **BW-RUL-002**: Authored normal events and content do not execute arbitrary scripts.
- **BW-STA-001**: Canonical, derived, cached, ledger, and ephemeral authority categories remain distinct.
- **BW-STA-002**: Every completed strategic month ends in a validated canonical snapshot.
- **BW-TST-001**: Repeated campaign compilation is reproducible.
- **BW-TST-002**: UI navigation and reporting do not consume authoritative randomness.
- **BW-TST-003**: Replay reproduces authoritative results.

## Traceability record format

For every implementation requirement, record:

```text
Requirement ID:
Canonical section:
Normative summary:
Status: planned | partial | implemented | verified | deferred
Packages or symbols:
Tests:
ADR references:
Validation evidence:
Deferred milestone:
Approved interpretation notes:
```

A requirement is not `verified` merely because code exists. Verification requires named automated evidence or a documented manual gate where automation is impossible.
