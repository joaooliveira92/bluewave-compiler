# Spec: Division ship reordering (DESIGN-26 §8/§12)

Slug: `division-ship-reorder`
Status: approved by owner ("build fleet reorder feature"); ready for slicing (to-tickets).
Source: owner request to use the new `SortableList` component for "fleet reorder",
grounded against DESIGN-26 (`docs/domain/divisions-and-formations.md`).

## Problem

A permanent division's stored `shipOrder` is authoritative and its **first ship is
the flagship** (DESIGN-26 §8). DESIGN-26 §12 defines the reorganization penalty
"reorder ships without flagship change: cohesion `-3`", and §29.11 requires that
"every membership, commander, flagship, **reorder**, split, and merge penalty uses
the exact declared values". The engine already ships the constant
`DIVISION_PENALTIES.reorderWithoutFlagship` (`packages/campaign/src/division.ts:206`)
but **no reorder command, validation, or UI exists** — reordering a division's ships
is unimplemented.

DESIGN-26 §27 also forbids player-ordered division *cards*: "Permanent divisions MUST
be ordered by nation and ascending division identifier." So "reordering divisions" is
canonically out of scope; the legitimate, spec-grounded reorder is of the ships
**within** a division, over its authoritative `shipOrder`, with the flagship pinned
first.

## Decision

Recorded as **ADR-0086**:

- Reordering is of a division's ships (its `shipOrder`), not of division cards.
- The flagship (`shipOrder[0]`) is pinned: a reorder that changes the lead ship is a
  flagship change and MUST use `ChangeDivisionFlagshipCommand` (DESIGN-26 §8).
- The reorder penalty is exactly `DIVISION_PENALTIES.reorderWithoutFlagship`
  (`experience 0`, `cohesion -3`) — one application per applied command.
- An unchanged order is rejected (never charged) with
  `DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE`.

## Requirements

### Engine command (E)

- **E-1** `@bluewave/commands` MUST define `ReorderDivisionShipsCommand`
  (`type: "ReorderDivisionShips"`, `nationId`, `divisionId`, `shipOrder: string[]`)
  and add it to the `CommandBody` union and the public type exports.
- **E-2** `validatePayloadRules` MUST dispatch `ReorderDivisionShips` to a new
  `validateReorderDivisionShips`, which rejects (each with the stable code below):
  - division not found → `DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE`;
  - `shipOrder` not an array, wrong length, duplicates, or not a permutation of the
    current members → `DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE`;
  - `shipOrder[0]` not the current flagship → `DIVISION_FLAGSHIP_INVALID`;
  - order equal to the current order → `DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE`.
- **E-3** `CommandLifecycle.process` MUST return a success result carrying
  `{ nationId, divisionId }` for the new type (same shape as the other division
  commands).
- **E-4** `@bluewave/campaign`'s `applyDivisionCommand` MUST support an
  `{ type: "reorder"; shipOrder: string[] }` operation that sets `shipOrder` verbatim,
  leaves `flagshipShipId` unchanged, applies exactly the `reorderWithoutFlagship`
  penalty, refreshes `lastReorganizationMonth` and `aggregateHash`, and returns
  `reorgReason: "REORDER"`. `DivisionReorgReason` MUST gain `"REORDER"`.
- **E-5** `@bluewave/phase-engine` MUST route the new body through
  `applyDivisionCommandMonth` and `commandPhases.ts`'s division dispatch. Because
  commands are authorized against the month-start snapshot but applied in order, it
  MUST re-validate the reorder against the division *being applied* (permutation +
  flagship-first); a stale order (e.g. after an add/remove the same month) MUST be
  rejected with `DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE` and leave the snapshot
  unchanged.
- **E-6** `buildDivisionScreenView` MUST expose the reorder penalty under
  `DivisionScreenView.penalties.reorder`.

### Desktop bridge (B)

- **B-1** `shared/division-contract.ts` MUST add the wire body
  `{ type: "ReorderDivisionShips"; divisionId; shipOrder: string[] }`.
- **B-2** `campaignCommandSchemas.ts` MUST add the corresponding
  `DivisionCommandBodySchema` member (shape only; legality stays in the engine).
- **B-3** `main/commands/divisionCommands.ts` MUST add a planner descriptor mapping
  the wire command to the engine body with an idempotency discriminator over
  `divisionId` and the joined `shipOrder`.
- **B-4** `division-organization-state.ts` MUST carry `penalties.reorder` in the
  state (initial + projection) and a `COMMAND_LABELS` entry
  (`"Reorder ships"`).

### Renderer (R)

- **R-1** `DivisionCard` MUST render the division's ships so the flagship is a pinned,
  non-draggable lead row and the remaining ships are reorderable via the shared
  `SortableList` (`components/motion/sortable-list.tsx`): drag handle, keyboard
  reordering (Up/Down/Home/End), and the component's position announcements.
- **R-2** The card MUST hold a local draft order; reordering marks it dirty and shows
  an explicit **Apply order** action stating the cost
  (`costText(state.penalties.reorder)`). Applying sends one
  `ReorderDivisionShips` command whose `shipOrder` is `[flagshipShipId, ...draftRest]`.
- **R-3** The existing per-ship actions (Make flagship, Remove) MUST keep working; a
  ship reordered in the draft remains removable and promotable, and after a
  projection refresh the draft re-syncs to the authoritative order.
- **R-4** The fleet-organization view MUST surface the engine's queued notice and keep
  its current honest "applied when you advance the month" model.

### Verification (V)

- **V-1** Change
  `packages/campaign/test/division.test.ts`,
  `packages/commands/test/*`,
  `packages/phase-engine/test/*`,
  `apps/desktop/src/main/commands/divisionCommands.test.ts` and the fleet
  organization tests to cover the new command (engine apply + penalty, validation
  rejects, bridge mapping, UI apply flow).
- **V-2** Determinism: reordering twice to the same order yields identical snapshots
  and hashes; a rejected order changes nothing.
- **V-3** `pnpm --filter @bluewave/desktop typecheck`, `lint`, and the focused test
  packages MUST pass; a UI capture (`pnpm snap`) of the fleet organization screen is
  required since the player-visible card changes.

## Acceptance criteria

- **AC-1** A player can drag or keyboard-reorder the non-flagship ships of a division
  and apply it; the flagship never moves via reorder.
- **AC-2** Applying a valid reorder queues a real engine command; the division's
  cohesion drops by exactly `3` when the month is committed, experience unchanged.
- **AC-3** A reorder that would move the flagship, duplicate/lose a ship, or change
  nothing is rejected by the engine with the exact codes in E-2 and changes no state.
- **AC-4** Division cards remain ordered by id (DESIGN-26 §27) — reordering does not
  reorder the cards.
- **AC-5** All checks in V-3 pass; the snapshot shows the reorder affordance.

## Definition of done

- Requirements E-1..E-6, B-1..B-4, R-1..R-4 and V-1..V-3 implemented.
- ADR-0086 written and linked; `.ai/specs/README.md` pointer added.
- Validation gate green (clean build, typecheck, lint, focused tests, snapshot).
