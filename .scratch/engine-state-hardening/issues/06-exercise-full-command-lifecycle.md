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
**Status:** open
**Frontier:** yes

- [ ] A real command type resolves through the full lifecycle against the running snapshot (not only the process success/reject path).
- [ ] Resource reservation is reserved before effects apply and settled (consumed/released/refunded) on completion or rejection.
- [ ] The lock / irreversible-phase boundary is honored; a command cancelled after its irreversible phase follows the designed policy.
- [ ] The command's status-transition, settlement, and audit records are produced and their hash-chaining verified.
- [ ] Existing commands that cannot or need not use the full machine remain behaviorally unchanged (documented as intentionally narrower).
- [ ] A replay re-executing the turn reproduces the same lifecycle outcomes and hashes.
- [ ] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.