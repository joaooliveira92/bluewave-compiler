# 06 — Exercise the full command lifecycle on the month pipeline

**What to build:** the command package models a rich lifecycle state machine
(SUBMITTED → VALIDATED → AUTHORIZED → RESERVED → ACCEPTED → LOCKED → RESOLVING →
COMPLETED / PARTIALLY / REJECTED / CANCELLED / SUPERSEDED), with reservation
records, settlement branches, supersession, and reversible/irreversible phase
boundaries. The month pipeline, however, consumes only the success/reject
outcome of command processing and applies effects through a fixed per-command
switch, so most of that machine is scaffolding rather than executing against the
snapshot.

This ticket drives at least one real command type end-to-end through the full
lifecycle — validation, authorization, resource reservation, lock at the
irreversible phase, resolution, and settlement onto a ledger (with the terminal
status and settlement branch recorded) — so the modeled machine is proven
against the actual snapshot and its records/hash-chaining are exercised.

**Blocked by:** None — can start immediately.

**Type:** implementation
**Status:** resolved
**Frontier:** yes

- [x] A real command type resolves through the full lifecycle against the running snapshot (not only the process success/reject path).
- [x] Resource reservation is reserved before effects apply and settled (consumed/released/refunded) on completion or rejection.
- [x] The lock / irreversible-phase boundary is honored; a command cancelled after its irreversible phase follows the designed policy.
- [x] The command's status-transition, settlement, and audit records are produced and their hash-chaining verified.
- [x] Existing commands that cannot or need not use the full machine remain behaviorally unchanged (documented as intentionally narrower).
- [x] A replay re-executing the turn reproduces the same lifecycle outcomes and hashes.
- [x] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.

## Resolution

Implemented on `dev` (this issue). New `packages/phase-engine/src/commandLifecycle.ts`
drives the real `budget_project` command end-to-end through the full
`CommandRecord` lifecycle machine against a *running snapshot*, closing the gap
where the pipeline consumed only the success/reject outcome of `process()`:

- `BUDGET_PROJECT_COMMAND_DEFINITION` registers a real `CommandTypeDefinition`
  (with a complete `settlementPolicy` covering every canonical branch) in a
  module-level `CommandRegistry`.
- `BudgetProjectLifecycle.complete` walks SUBMITTED → VALIDATED → AUTHORIZED →
  RESERVED → ACCEPTED → LOCKED → RESOLVING → COMPLETED: `CommandLifecycle`
  validation + authorization, treasury `ReservationManager` reservation **before**
  any effect, lock at the irreversible boundary (`appropriation`), real effects
  via the shared `applyBudgetProject` against the snapshot, and settlement onto
  the `FinancialLedger` (`completion` branch; reserved == consumed). It produces
  a terminal `CommandResult` with pre/post resolution state hashes and appends
  hash-chained `AuditChain` records.
- Determinism follows the repo contract (mirroring the desktop construction
  workspace): transitions recompute only the deterministic `commandHash`
  (never the wall-clock-stamping `transitionRecord()`), the transition ledger is
  a timestamp-free hash chain (`previousHash` → `recordHash`), and
  `AuditChain`/`createSettlementRecord`/`ReservationManager` are deterministic.
  A replay re-executing the same command reproduces identical result/settlement/
  audit hashes, transitions, and final snapshot hash.
- `canCancel` honors the `UNTIL_IRREVERSIBLE_PHASE` cancellation policy: allowed
  before the irreversible phase, refused (`IRREVERSIBLE_EFFECT_ALREADY_APPLIED`)
  at/after it.
- The default month pipeline is deliberately **unchanged** (goldens
  byte-identical) — the full machine is an opt-in path proven against the actual
  snapshot; existing commands that do not use it remain behaviorally unchanged.

Tests: `packages/phase-engine/test/command-lifecycle.test.ts` (8 tests) —
full lifecycle + real effects, reservation-before-effects/settled-on-completion,
irreversible-boundary cancellation, hash-chained transition ledger, replay
determinism, unauthorized-rejection and insufficient-treasury fail-closed with no
effects, and a guard that the default `MonthExecutor` path is unchanged.

Validation (`@bluewave/phase-engine`): `tsc --noEmit` 0, `vp lint .` 0, all 143
phase-engine tests green. Full-repo `check` blocked at baseline by an unrelated
content-generation import in `content-schema` (see ticket 03 Resolution).