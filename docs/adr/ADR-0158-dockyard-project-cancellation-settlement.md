# ADR-0158: Cancelling a dockyard project — the settlement policy and the rebuild release

## Status

Accepted (2026-10-14). Amends DESIGN-23 section 23.

## Context

DESIGN-23 section 23 requires a cancelled dockyard project to stop future work,
release future capacity, **settle paid / committed / refundable / non-refundable /
salvageable values explicitly**, preserve or dispose of completed physical work,
resolve the target ship's availability and custody, and leave a cancellation
record — and forbids **silently restoring** a pre-project ship state after
irreversible work. DESIGN-11 supplies the command/settlement contract (the
canonical equation and the `CommandSettlementRecord`).

Before this ADR the engine had no project cancellation at all: `StartRebuild`
(ADR-0078) could start a `REBUILD`, but nothing could cancel one. The only
cancellation in the tree is the **desktop transport** `cancelConstructionCommand`,
which cancels an in-flight queued order and fully refunds it — a different
action, and not a DESIGN-23 section 23 settlement. ADR-0078 recorded
cancellation settlement as deferred (slice 28c) rather than guessed.

## Decision

### 1. A real engine command, applied by the engine

`CancelConstructionProject` (body `{ type, nationId, projectId }`) is issued as a
normal command envelope and applied in the `command_collection` phase by
`applyCancelConstructionProject`. The engine — not the desktop — is the sole
mutator of authoritative state. Issue-time validation refuses an unknown nation,
a project that is not the nation's, a terminal project, and a foreign-contract
project (whose cancellation is a DESIGN-16 contract outcome); a refusal changes
nothing.

### 2. The settlement is explicit, and creates no value

Funding is **pay-as-you-go**: work is charged to the treasury as it is completed
and no future instalment is reserved. Cancelling therefore releases the whole
future commitment and refunds nothing; the work already done and paid is
forfeited. The shipped policy is:

| field               | value                                | why                                                        |
| ------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `consumedWork`      | the project's `paidWork`             | work irreversibly done and paid                            |
| `refundedAmount`    | `0`                                  | nothing was reserved to refund                             |
| `lostAmount`        | the project's `paidWork`             | the expenditure the nation forfeits by stopping            |
| `salvageableAmount` | `0` (explicit)                       | partial-hull salvage belongs to the unimplemented §26 scrapping subsystem, so no fabricated credit |
| `reason`            | `CANCELLATION_WORK_CONSUMED`         | stable settlement reason                                   |

No new balance constant is introduced, and no canonical value is fabricated.

These are **project-work figures**, not DESIGN-11 section 15's reserved-resource
settlement triple: with pay-as-you-go there is no `reservedAmount`, so the
`consumedAmount + releasedAmount + lostAmount == reservedAmount` identity does
not apply and no ledger posting is made — `lostAmount` here is the historical
expenditure the nation forfeits, recorded for auditability. The figures are
non-negative and no money is created or destroyed.

### 3. The ship is released, never silently restored

Cancelling a `REBUILD` releases its target ship from **this project's**
unavailability (only when `availabilityProjectId` matches the project), so an
unrelated availability is never cleared. The ship keeps its **old compiled design
version**: a rebuild applies the new design only at completion (ADR-0078 section
22), so cancellation changes no design and no ship is ever spawned. The release is
deterministic and reflected in authoritative state (the project is terminal and
the ship is no longer `UNAVAILABLE` for it); the `ConstructionProjectCancelled`
event fixes the settlement and reason, while the ship's released state is read
from the snapshot rather than repeated on the event.

### 4. The cancellation record is an append-only event

The settlement and the transition are recorded as a
`ConstructionProjectCancelled` domain event (`@bluewave/events`), the analogue of
`ShipRebuilt`: it carries project, nation, project type, and the four explicit
settlement amounts plus the reason. It is deterministic (campaign-month
timestamp) and needs no snapshot schema change.

### 5. Player surface

The Construction screen's "Under construction" card gains a **Cancel project**
control for each steerable, non-foreign project; it queues the engine command
through the shared `submitPlayerCommand` seam (the same path as halt/resume) so
the command applies on the next `commitMonth`. The control states the
non-refundable settlement and the ship release.

## Consequences

- DESIGN-23 section 23 is satisfied end to end for `NEW_CONSTRUCTION` and
  `REBUILD` projects; `rebuildProjectProblems` treats a `CANCELLED` rebuild like
  a completed one (no ship is held). The engine also accepts cancelling an
  `INFRASTRUCTURE` (dock-expansion) project — it just stops, and the dock limits
  only ever rise on completion — while the Construction screen offers the control
  for the steerable ship-building states.
- Salvage value on a cancelled partial hull stays **deferred** to the §26
  scrapping subsystem, recorded explicitly as `0` rather than invented.
- Cancellation of a foreign-contract project remains a DESIGN-16 contract
  outcome; this command refuses it with `FOREIGN_CONTRACT_FUNDED_BY_SCHEDULE`.
- DESIGN-23's header and `docs/adr/AMENDMENTS.md` record the amendment (ADR-0095).

## Alternatives considered

- **Refund the unspent fraction of the design's total cost.** Rejected: nothing
  is reserved up front (pay-as-you-go), so there is no reservation to refund; a
  refund would create money.
- **Author a `ship_scrapping_salvage_v1` credit for partial work.** Deferred, not
  fabricated: §26 salvage is scoped to a completed ship being scrapped (age and
  condition inputs a partial project does not have). Recorded as `0`.
- **Keep the ship `UNAVAILABLE` after cancellation to avoid "restoring".**
  Rejected: the ship's authoritative design was never changed mid-rebuild, so
  releasing it is not a restore of changed state; keeping it stuck unavailable
  would strand a ship with no remaining project. The release is explicit and
  recorded.