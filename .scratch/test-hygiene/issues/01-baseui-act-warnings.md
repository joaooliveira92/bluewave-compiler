# INC-1 — Silence base-ui HoverCard `act()` warnings in DrawingBoard tests

**Type:** task
**Status:** resolved
**Blocked by:** none
**Frontier:** yes

## Scope

React logs `An update to PreviewCardRootComponent/PreviewCardTrigger/PreviewCardInteractions/
PreviewCardPortal/PreviewCardPositioner inside a test was not wrapped in act(...)` whenever a
DrawingBoard test renders the section strip (drawing-board `sections.aggregate.test.tsx`,
`DrawingBoard.panels.test.tsx`) or the standalone `HullPlanPanel`.

The noise is large (hundreds of lines per run) and pre-dates the hull-plan unit-test work; it makes
genuine test failures hard to spot. It comes from base-ui's HoverCard state transitions (open/close
delays `SECTION_OPEN_DELAY`/`SECTION_CLOSE_DELAY` in `SectionLabels.tsx`) and floating-ui's rAF-based
positioning, which run after the synchronous `fireEvent` the tests use.

## Evidence

Reproduce with:

```
pnpm --filter @bluewave/desktop exec vp test run \
  src/renderer/screens/construction/drawing-board/panels/hull-plan/sections.aggregate.test.tsx
```

## Possible directions

- Fake timers (`vi.useFakeTimers`) advanced inside `act` for the hover-card tests only, flushing the
  open/close delays deterministically.
- Wrap the affected interactions in `await act(async () => {})` and assert via `findBy*` so the
  floating-ui update is flushed.
- If neither is clean, gate base-ui's positioning under test or assert-and-swallow the specific
  warning with a documented reason (last resort).

Do not silence all console errors globally; the goal is a clean stderr, not a muted one.

## Answer

Fixed with the first direction: `sections.aggregate.test.tsx` now runs under fake
timers (`setTimeout`, `requestAnimationFrame`) for the duration of the file.
`tabTo` and the direct focus/close interactions advance the base-ui open/close
delay inside `act`, and an `afterEach` drains any straggler timers inside `act`
before unmount. `findBy*`/`expect.poll`/`waitFor` were replaced with synchronous
assertions once the flush makes the state deterministic.

Result: the file's stderr is clean — `grep -c "not wrapped in act"` drops from
109 to 0 — with all 15 tests still passing:

```
pnpm --filter @bluewave/desktop exec vp test run \
  src/renderer/screens/construction/drawing-board/panels/hull-plan/sections.aggregate.test.tsx
```

No global console silencing was added.
