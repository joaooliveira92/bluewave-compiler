# ADR-0009: Research Resolution Phase Identifier

## Status

Accepted

## Context

DESIGN-10 §3 declares the canonical phase identifier `RESOLVE_RESEARCH` for
monthly research resolution. The B10b brief (`.ai/briefs/b10b-research-design.md`,
Package placement) states: "Phase registry is updated to include
`RESOLVE_RESEARCH` as the canonical phase id (aliased from `research_progress`)."

The existing implementation of the research phase predates B10b and uses the
working identifier `resolve_research` throughout:

- `PhaseRegistry.PHASES` id (`packages/phase-engine/src/registry.ts`);
- the `MonthExecutor` phase block (`resolveResearchPhase`, `month.ts`);
- financial ledger `phaseId` strings (`month.ts` RESEARCH_EXPENDITURE posting);
- random-decision ledger `phase` strings and `reasonCode` staging;
- event `stage` fields; and
- the integration test assertions (`integration.test.ts` rng-phase set).

These phase identifiers are serialized into the hashed financial and
random-decision ledgers and therefore feed the deterministic golden reference
(`golden/hashes.json`). Renaming the phase id would change the authoritative
ledger hashes.

## Decision

For B10b, keep the working phase identifier `resolve_research` in the phase
registry, month executor, ledgers, and tests. Do not rename it to
`RESOLVE_RESEARCH` in this milestone.

Rationale:

- The B10b acceptance criteria (17 items) do not test the phase identifier
  string; they test research behavior (spend, allocation, discovery, keyed
  stream, determinism). Renaming is not required for any acceptance criterion.
- Renaming changes the serialized ledger `phaseId`/`phase` values and the
  golden hashes, which is an authoritative artifact change requiring a
  documented migration. It is not warranted solely to satisfy a naming
  convention when the governing acceptance contract is behavior-based.
- The working id is already internally consistent across registry, executor,
  ledgers, and tests, so save/load and replay compatibility are preserved.

`RESOLVE_RESEARCH` remains the canonical DESIGN-10 identifier. A future
compatibility pass may introduce an alias (`RESOLVE_RESEARCH` canonical,
`resolve_research`/`research_progress` legacy) as part of a broader phase-id
alignment and will follow the golden-hash update process in ADR-0007. That
alignment is out of scope for B10b.

This decision is recorded because it constrains persistence compatibility and
the golden-hash baseline; it is not a silent design choice.

## Consequences

- Golden hashes remain stable for B10b; no regeneration is required.
- Save/load and replay compatibility are preserved.
- The phase registry id and DESIGN-10 canonical id differ for `RESOLVE_RESEARCH`;
  this is documented here and tracked for a future alignment pass.

## Related requirements

- BW-DET-003 (identical inputs produce identical hashes).
- DESIGN-10 §3 (canonical phase order).
- ADR-0007 (golden-hash update process).

## Related ADRs

- ADR-0007: Cross-Process and Cross-Platform Determinism Test Strategy.
