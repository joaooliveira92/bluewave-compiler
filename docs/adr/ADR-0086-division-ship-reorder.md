# ADR-0086: Division ship reordering — flagship pinned, DESIGN-26 §12 penalty

## Status

Accepted 2026-10-09. Implements the DESIGN-26 §12 "reorder ships without flagship change"
penalty and the §29.11 reorder-penalty validation. Adds a `ReorderDivisionShips` command.

## Context

A permanent division's stored `shipOrder` is authoritative and its first ship is the
flagship (DESIGN-26 §8, §27). Section 12 declares the reorganization penalty "reorder
ships without flagship change: cohesion `-3`" and section 29.11 requires validating the
reorder penalty with that exact value, but the engine shipped the constant
`DIVISION_PENALTIES.reorderWithoutFlagship` unused: there was no command, no validation
and no UI. The owner asked to use the new `SortableList` component for "fleet reorder".

Two readings were possible: reordering the division *cards*, or reordering the ships
*within* a division. DESIGN-26 §27 settles it — "Permanent divisions MUST be ordered by
nation and ascending division identifier" — so cards are a deterministic view order and
MUST NOT be player-ordered. The legitimate reorder is over a division's `shipOrder`.

## Decisions

1. **Scope.** `ReorderDivisionShips` permutes a division's `shipOrder`. It never reorders
   division cards, which stay id-ordered (DESIGN-26 §27).
2. **Flagship pinned.** `shipOrder[0]` MUST equal the current `flagshipShipId`. Moving a
   different ship to the lead is a flagship change and MUST use
   `ChangeDivisionFlagshipCommand` (DESIGN-26 §8), rejected otherwise with
   `DIVISION_FLAGSHIP_INVALID`.
3. **Penalty.** Applying a reorder charges exactly `DIVISION_PENALTIES.reorderWithoutFlagship`
   (`experience 0`, `cohesion -3`), applied once per committed command and re-hashing the
   division. `DivisionReorgReason` gains `REORDER`.
4. **Validation.** `validateReorderDivisionShips` rejects a missing division, a non-array,
   a wrong-length list, duplicates, a non-permutation, a moved flagship, or an unchanged
   order — the last with `DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE` so a no-op is never
   charged. A rejected reorder mutates nothing.
5. **Wire / bridge.** The renderer sends the full `shipOrder`; `nationId` stays off the wire
   and is filled from the session, matching every other division command. The command is
   idempotent on `divisionId` + the joined `shipOrder`.
6. **UI.** The flagship renders as a pinned, non-draggable lead row; the remaining ships use
   the shared `SortableList` (drag handle, keyboard reordering, position announcements).
   Reordering is a local draft with an explicit **Apply order** action stating the cost;
   the engine remains the only writer and applies it when the month is committed. The
   button reports "queued" only after the engine accepts the command (a rejected or
   failed submit returns to "Apply order").
7. **Apply-time re-validation.** Player commands are authorized against the month-start
   snapshot but applied in order, so a sibling command queued the same month may have
   changed the division by the time the reorder applies. The engine therefore re-checks
   that `shipOrder` is still a permutation of the division being applied, flagship first;
   a stale order is rejected (`DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE`) and leaves the
   snapshot unchanged, so a reorder can never drop an added ship, resurrect a removed
   one, or desync the flagship.

## Consequences

- The unused `reorderWithoutFlagship` constant is now the authoritative penalty, satisfying
  DESIGN-26 §29.11.
- Determinism is preserved: the operation is a pure function of the snapshot and the
  supplied order; equal state and order produce equal snapshots and hashes.
- Design studies' Draft-apply + engine-applies-next-month convention (ADR-0071) is reused.
