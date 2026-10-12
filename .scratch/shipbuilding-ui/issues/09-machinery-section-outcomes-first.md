# 09: Machinery section — outcomes first

**Type:** implementation
**Status:** open
**Blocked by:** 03
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Machinery".

## What to build

Organise the Machinery section around outcomes rather than a flat parameter list: performance
targets (target speed, operational range, cruising speed) and propulsion configuration (engine
type, boilers, fuel type, shaft count, machinery arrangement) on one side, and calculated
results (horsepower required, machinery weight, fuel capacity, cost, reliability, acceleration)
on the other. The player must not get circular controls where both versions of a value appear
editable while one silently overrides the other.

## Acceptance criteria

- [ ] Performance targets and propulsion configuration are editable inputs; calculated results
      are shown as outputs.
- [ ] Entering a target speed or a power configuration is supported by an explicit model, with
      no pair of fields that are both editable while one silently overrides the other.
- [ ] Editing any input updates the compiled results immediately.
- [ ] Existing machinery inputs are relocated with no functional regression.
