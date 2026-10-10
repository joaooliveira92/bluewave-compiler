# INC-3 — Fleet-organization UI: reorder ships with `SortableList`

**Type:** implementation
**Status:** resolved
**Blocked by:** 02
**Frontier:** yes
**Requirements:** R-1, R-2, R-3, R-4; AC-1, AC-5

## Scope

`DivisionCard.tsx`: flagship pinned as a non-draggable lead row; the remaining
ships reorderable via `components/motion/sortable-list.tsx`. Local draft order,
dirty state, **Apply order** action stating the cost, sending one
`ReorderDivisionShips` command. Keep Make-flagship / Remove working.

## Acceptance

- Drag + keyboard reordering works; the flagship cannot be moved by reorder.
- Apply queues one command; the existing queued-notice model is preserved.
- Existing `FleetOrganizationView.test.tsx` / `division-organization-state.test.ts`
  extended; new interaction covered. `pnpm snap` capture of the fleet organization
  screen (aria + console clean) recorded.
- `pnpm --filter @bluewave/desktop typecheck`, `lint`, and focused tests pass.
