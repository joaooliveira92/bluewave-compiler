# ADR-0129: Dockyard-project status model and save-compatibility bump

## Status

Accepted (2026-10-12).

## Context

DESIGN-23 §2 already names the dockyard-project status set (`PLANNED`,
`AUTHORIZED`, `AWAITING_CAPACITY`, `ACTIVE`, `HALTED`, `DELAYED`, `ACCELERATED`,
`COMPLETED`, `CANCELLED`, `IMPOUNDED`) and states that terminal statuses are
`COMPLETED` and `CANCELLED`, that `IMPOUNDED` stays non-terminal, and that an
invalid transition must fail with `INVALID_DOCKYARD_PROJECT_TRANSITION`. The
implementation only carried the narrow union `PLANNED | AUTHORIZED | ACTIVE |
COMPLETED`, set at three loose write sites in the phase engine with no shared
transition guard. SB-3 (`INC-2`) is the shared enabler for the halt/delay,
acceleration and foreign-impoundment work, so the status vocabulary and its
transitions must exist and be enforced in one place first.

There is no released save format yet. ADR-0113 fixes the first-release policy
(reject on strict version equality) and the migration seam, and records that the
registry stays empty until a format exists to migrate from.

## Decision

### 1. One status type, one transition table

`@bluewave/campaign` owns `ConstructionProjectStatus` (exactly the ten
DESIGN-23 §2 states) and `CONSTRUCTION_PROJECT_TRANSITIONS`, the legal
from→to table. `canTransitionConstructionProject`, `assert…` (throwing a
`ConstructionProjectTransitionError` carrying `INVALID_DOCKYARD_PROJECT_TRANSITION`)
and `transitionConstructionProject` are the only status-change paths. A move to
the same status is a no-op, not a transition. `COMPLETED` and `CANCELLED` have
no outgoing transition; `IMPOUNDED` can return to `ACTIVE` or reach a terminal
status.

The table is a deterministic interpretation of DESIGN-23 §2 plus the flows the
engine already performs. It retains `PLANNED → ACTIVE` (a queued project funded
before an explicit authorization step still activates; the authorization gate
arrives with the batch order, `INC-8`).

**Normative transition table** (the exact `CONSTRUCTION_PROJECT_TRANSITIONS`
value; a status not listed as a target is illegal and fails with
`INVALID_DOCKYARD_PROJECT_TRANSITION`):

| From | Legal targets |
| --- | --- |
| `PLANNED` | `AUTHORIZED`, `AWAITING_CAPACITY`, `ACTIVE`, `COMPLETED`, `CANCELLED` |
| `AUTHORIZED` | `AWAITING_CAPACITY`, `ACTIVE`, `HALTED`, `DELAYED`, `COMPLETED`, `CANCELLED` |
| `AWAITING_CAPACITY` | `ACTIVE`, `HALTED`, `DELAYED`, `COMPLETED`, `CANCELLED` |
| `ACTIVE` | `AWAITING_CAPACITY`, `HALTED`, `DELAYED`, `ACCELERATED`, `COMPLETED`, `CANCELLED`, `IMPOUNDED` |
| `HALTED` | `AWAITING_CAPACITY`, `ACTIVE`, `DELAYED`, `COMPLETED`, `CANCELLED`, `IMPOUNDED` |
| `DELAYED` | `AWAITING_CAPACITY`, `ACTIVE`, `HALTED`, `COMPLETED`, `CANCELLED`, `IMPOUNDED` |
| `ACCELERATED` | `AWAITING_CAPACITY`, `ACTIVE`, `HALTED`, `DELAYED`, `COMPLETED`, `CANCELLED`, `IMPOUNDED` |
| `IMPOUNDED` | `ACTIVE`, `COMPLETED`, `CANCELLED` |
| `COMPLETED` | (none — terminal) |
| `CANCELLED` | (none — terminal) |

**Interim allowance (to be tightened by `INC-8`).** `PLANNED → ACTIVE` and
`PLANNED → COMPLETED` exist only because the engine currently skips the
authorization step. When `INC-8` lands the `PLANNED → AUTHORIZED → ACTIVE` gate,
those two edges MUST be removed from the table and from this ADR; a direct
`PLANNED → ACTIVE` or `PLANNED → COMPLETED` will then fail with
`INVALID_DOCKYARD_PROJECT_TRANSITION`.

### 2. Existing status writes go through the table

The funding path (`constructionFunding.ts`, `economyPhases.ts`) and the
completion path (`constructionPhase.ts`) set status through
`transitionConstructionProject`, so no engine site can invent a state the model
does not allow. No new commands are added in this increment.

### 3. Save-compatibility bump, documented rejection

The status vocabulary widens the persisted snapshot surface. The compatibility
version is bumped `1.1.0 → 1.2.0`. Because no released save exists (ADR-0113)
and the old statuses are a strict subset of the new set, no migration engine
ships; a pre-change save is **rejected** with the stable
`PERSISTENCE_COMPATIBILITY_MISMATCH` diagnostic (ADR-0113 §5 documented
rejection). The migration seam of ADR-0113 §6 is unchanged and stays empty.

## Consequences

- Halt, delay, acceleration and impoundment have an authoritative home and a
  single guarded way in, so a replay reproduces the same status history.
- A pre-1.2.0 save is refused with a readable diagnostic rather than silently
  continued.
- No ADR-0113 per-version fixture is owed for 1.1.0: it was never released.

## Alternatives considered

- **Keep the narrow union and add parallel boolean flags.** Rejected: DESIGN-23
  §2 names one status field, and parallel flags drift.
- **Build a 1.1.0 → 1.2.0 migration.** Rejected for now: no released save
  exists, and the old statuses are already valid in the new set, so the
  migration would be a no-op pass-through while adding an engine surface
  (ADR-0113 §6 keeps the registry empty until a format exists to migrate from).
