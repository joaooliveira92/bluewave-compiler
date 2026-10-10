# INC-1 — Silence base-ui HoverCard `act()` warnings in DrawingBoard tests

**Type:** task
**Status:** open
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
