# INC-1 — Extract shared controlled deck + master selector (Fleet Dispatch parity)

**Type:** implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes
**Requirements:** NAM-2, NAM-7; AC-3, AC-4, AC-6, AC-15; BW-ARC-001, BW-TST-002

## What to build

Lift the **controlled draggable deck primitive**, the **index-wrapping helper**, the
**wheel-decoding helper**, and the **listbox master-pane composition** out of the
nation-selection folder into shared renderer presentation modules. Refactor
`FleetDispatchBoard` to be a thin configuration of the shared pieces, so Fleet
Dispatch behaves exactly as before while the pieces become reusable.

Deliverable: Fleet Dispatch still works and passes its tests, and the deck /
master-selector / index-wheel logic is shared and unit-tested.

## Acceptance

- [ ] Shared controlled deck primitive exposes controlled `topIndex`, `onCardActivate`, and `onChange`, and stays focus/`role`-agnostic; unit tests cover each.
- [ ] `normalizeIndex` and the wheel decoder (32px threshold, 360ms cooldown, `deltaMode` ×16/×100) are shared and unit-tested: wrap at both ends, sub-threshold no-op, cooldown blocks a second move, movement resumes after.
- [ ] Shared master selector provides `role="listbox"`, named options, `aria-activedescendant`, arrow wrap, Enter-confirms, tap-selects-index, and focus-on-mount — parameterised by heading, aria-label/instructions, card renderer, and focus/commit callbacks.
- [ ] `FleetDispatchBoard` consumes the shared pieces; its rendered DOM/semantics (listbox "Playable nations", named options, tap-selects) and its existing tests stay green.
- [ ] No new `as unknown` casts; one component per file; the directory's public surface is its barrel.
