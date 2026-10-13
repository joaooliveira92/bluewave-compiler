# ADR-0035: Engine Event Timestamps — Deterministic ISO-8601 Contract

## Status

Accepted 2026-08-16

## Context

Commit `7b60154` ("feat(events): validate envelopes and harden ledger
invariants") made `EventLedger.append` validate every `DomainEventEnvelope`
through a strict Zod schema whose `timestamp` field requires an ISO-8601
datetime (`z.string().datetime({ offset: true })`). The `MonthExecutor`
(`packages/phase-engine/src/month.ts`) had not been updated to match: it emitted
event `timestamp` values of the form `turn-<n>` (for `NationBudgetChanged`,
`ConstructionProgressed`, `ResearchProgressed`) and `<campaignMonth>` (for
`TechnologyDiscovered`). Because every append ran through `parseDomainEventEnvelope`,
**73 of 127 `@bluewave/phase-engine` tests threw "Invalid datetime"** — a
pre-existing red gate that blocked any engine-state-hardening work (including
ticket 05).

This ADR records the canonical, deterministic resolution and its golden impact,
per ENGINEERING-CONTRACT "canonical artifact changes require old and new hashes,
authoritative cause, version impact, and migration assessment."

## Decision

`MonthExecutor` domain events now carry a **deterministic ISO-8601 timestamp
derived from the campaign month**: `"<campaignMonth>-01T00:00:00.000Z"`.

- `campaignMonth` is already derived deterministically from the snapshot's
  compiled `startYear`/`startMonth` + `turnNumber` via `campaignMonthId`
  (integer calendar arithmetic only — never wall-clock/env/locale;
  ADR-0025). Pre-pending `-01T00:00:00.000Z` yields a valid
  `z.string().datetime({ offset: true })` value with the `Z` (UTC) offset.
- Each turn maps to a distinct month, so the timestamp remains
  turn-distinct and stable across processes — the same determinism guarantee
  the previous `turn-<n>` scheme provided, now expressed in the schema-valid
  form the events package requires.
- No separate `turn-<n>` field is lost: turn number remains recorded in the
  authoritative snapshot surface (`snapshot.turnNumber`) and in event
  sequencing (`sequenceNumber`); the timestamp is a presentation/ordering
  contract, not an authoritative gameplay input.

## Authoritative impact

- **Canonical artifact:** the serialized `DomainEventEnvelope.timestamp`
  produced by `MonthExecutor`.
- **Authoritative cause:** reconciling the engine event producer with the
  already-shipped event envelope validation contract (commit `7b60154`). The
  prior `turn-<n>`/`YYYY-MM` values were invalid per that contract and crashed
  every append; the decision restores a valid, deterministic value without
  altering any economic/war/research/battle computation.
- **Old vs new hashes (golden `golden/hashes.json`):**
  - `eventLedgerHash`: `b6a626ba…387df9f` (old) → `26af2cf3…20ee5` (new).
  - All other golden hashes (`contentArtifactHash`, `initialSnapshotHash`,
    `closingSnapshotHash`, `commandLedgerHash`, `financialLedgerHash`,
    `randomDecisionLedgerHash`, `replayVerificationHash`,
    `battleGenerationHash`) are **unchanged**.
- **Version impact:** none. The event `version` stays `"0.1.0"`; no schema
  field was added/removed — only a value made valid. No migration is required
  for existing saves (persistence re-validates envelopes on load; previously
  produced `turn-<n>` timestamps were never persisted because appends crashed).
- **Migration assessment:** none required; the change is forward-only and does
  not alter the snapshot shape or any formula.

## Consequences

- `@bluewave/phase-engine` and `@bluewave/cross-process-test` (golden) suites
  are green again; the engine-state-hardening tickets can proceed.
- Domain event timestamps are now schema-valid, deterministic ISO-8601 (UTC),
  turn-distinct, and cross-process stable.
- A separate, pre-existing `@bluewave/content-schema` test failure (missing
  generated `content/research/nations/1880/index.ts`, removed in commit
  `2b3d925`) is unrelated to this decision and tracked separately; it does not
  block the engine-state-hardening effort.

## Related requirements

ENGINEERING-CONTRACT "persistence and compatibility" (canonical artifact
changes), ADR-0003 (serializer/hash), ADR-0007 (determinism/goldens),
ADR-0025 (strategic weather snapshot / campaign month), commit `7b60154`
(events validation).

## Related ADRs

ADR-0003, ADR-0007, ADR-0025, ADR-0034.