# ADR-0036: Contract the PhaseRegistry into the Real Execution Path

## Status

Accepted 2026-08-16

## Context

`engine-state-hardening` ticket 05 ("Contract the PhaseRegistry into the one
real execution path") found two divergent engines:

- `PhaseEngine` (`packages/phase-engine/src/engine.ts`) — a phase-loop facade
  whose `executeTurn` returned a **no-op** for every real phase (only
  opening/closing validation ran). It was never used in production; only in
  tests.
- `MonthExecutor.execute` — the monolithic engine that actually runs every
  phase, but **freely allocated randomness and touched snapshot resources
  without ever consulting the registry**.

The registry's declared `readPermissions`/`writePermissions`/`rngAllowed` were
therefore never honored at runtime; they were asserted only in unit tests of
`PhaseRegistry.hasAccess`.

This ADR records the three-part resolution: (1) retire the no-op facade so
there is a single execution authority; (2) reconcile the registry's declared
permissions to the phases' real behavior; (3) enforce the registry contract at
runtime via a `PhaseGuard`.

## Decision

### 1. Retire the no-op `PhaseEngine` facade

`PhaseEngine` and its facade-only types (`PhaseContext`, `PhaseResult`,
`TurnResult`, `NoOpEvidence`) are deleted. `MonthExecutor` is the single
phase-execution authority. Its opening/closing validation logic already lived
in `MonthExecutor`; the facade duplicated it. Tests that exercised the facade's
no-op evidence behavior are removed; the behavioral opening/closing validation
tests are re-based on `MonthExecutor`, and the phase-ordering assertions now
read `PhaseRegistry.all` directly.

### 2. Reconcile the registry to the phases' real resource footprint

The registry's `readPermissions`/`writePermissions` were aspirational and
under-declared. To make the contract enforceable without changing behavior, the
declared permissions were aligned to what each phase actually does (the
authoritative footprint). Changes to `packages/phase-engine/src/registry.ts`:

- `weather_generation`: `writePermissions [] → ["strategicWeather"]` (it
  commits per-area StrategicWeatherState).
- `ai_planning`: `writePermissions [] → ["research","treasury","constructions"]`
  (it applies `SetResearchPriority` and `budget_project`).
- `command_collection`: `writePermissions [] → ["treasury","constructions",
  "research","wars","politics","fleets"]` (it applies player commands).
- `appropriation`: `readPermissions ["treasury","budget"] → ["treasury",
  "constructions"]`; `writePermissions ["treasury"] → ["treasury",
  "constructions"]` ("budget" resource expressed as "constructions").
- `resolve_research`: `read/write ["research"] → ["research","treasury"]` (it
  spends the research budget from treasury).
- `battle_generation`: read adds `"nations"`; write `["wars"] → ["wars",
  "nations"]` (ship `inBattleId` reservations).
- `battle_resolution`: read adds `"nations","strategicWeather"`; write adds
  `"nations"` (per-ship damage/loss + reservation clearing).

No permissions were *narrowed*; the policy is a superset of the pre-change
declaration for every changed phase, so no previously-allowed behavior is
denied and computation is unchanged.

### 3. Enforce the registry contract at runtime (fails closed)

A new `PhaseGuard` (`packages/phase-engine/src/phase-guard.ts`) is the runtime
enforcement authority:

- `PHASE_FOOTPRINTS` is the authoritative, per-phase declaration of the
  resources a phase reads/writes and whether it uses RNG.
- `PhaseGuard.assert(phaseId, footprint)` checks `footprint ⊆
  (readPermissions, writePermissions, rngAllowed)` for the phase's registry
  definition, using `PhaseRegistry.hasAccess`. Any overstep yields a
  `PHASE_ACCESS_DENIED` diagnostic.
- `MonthExecutor` runs every phase through the guard at the top of each phase
  block. If a phase oversteps, it **fails closed**: the phase body does not
  run, a stable `PHASE_ACCESS_DENIED` diagnostic is recorded, and the turn
  returns `success: false` with the snapshot un-advanced past that phase.
- An optional `MonthExecutorEngineOptions.phaseOverrides` lets a caller
  substitute a phase definition (used by tests to exercise fail-closed for a
  specific phase). RNG policy is enforced structurally too: only
  `rngAllowed` phases are ever handed a `RandomEngine`/`randomLedger`.

Because every footprint sits within its phase's declared permissions, a
well-formed run is **never** denied: no phase is skipped and all computations,
ledgers, and final snapshots are byte-identical to the pre-change behavior
(goldens unchanged beyond the independent ADR-0035 event-timestamp fix).

## Consequences

- Single phase-execution path: `MonthExecutor`. The registry's contract is
  real, enforced at runtime, and covered by runtime tests (not only
  `hasAccess` unit tests).
- A phase that touches a resource it lacks permission for, or uses randomness
  when none is allowed, fails closed with a `PHASE_ACCESS_DENIED` diagnostic.
- Normal runs are byte-identical; `golden/hashes.json` is unchanged by this
  ADR (only ADR-0035's `eventLedgerHash` changed).
- Runtime enforcement tests: `PhaseGuard` unit tests + `MonthExecutor`
  fail-closed tests (denied write, well-formed run never denied, mutation not
  applied).

## Related requirements

Ticket `.scratch/engine-state-hardening/issues/05-contract-phase-registry.md`;
ENGINEERING-CONTRACT (determinism, fail-closed, diagnostics); ADR-0007
(determinism/goldens).

## Related ADRs

ADR-0007, ADR-0034, ADR-0035.