# 02: Shipbuilding workspace shell

**Type:** implementation
**Status:** resolved
**Blocked by:** 01
**Frontier:** no

Source: `.scratch/shippbuilding-ui.md` §"Recommended UX paradigm" / "Proposed screen structure".

## What to build

The new Shipbuilding screen opens from the bottom navigation as a near-full-screen workspace
with a persistent layout: a top command bar (design-level commands only), a left design-map
rail, a central ship workspace, a right inspector, and a persistent bottom engineering status
strip. It is driven by the shared design-workspace layer and renders real compiled design
state — opening it, editing the hull/machinery, and undoing all work end to end. The current
"under construction" placeholder body is replaced.

## Acceptance criteria

- [x] The bottom-navigation Shipbuilding action opens the workspace (near-full-screen modal).
- [x] The layout has the three regions plus a top command bar and a bottom status strip, and
      the ship visualization is visible at all times (it is not a narrow preview column).
- [x] The top bar holds only design-level commands (class name, ship type, year/status,
      undo/redo, compare, overflow clear/reset, save draft, validate, finish); no ordinary
      ship parameters live there.
- [x] The workspace renders real compiled values (at minimum validity, displacement, and cost)
      from the shared layer.
- [x] `pnpm snap` capture of the opened workspace: regions present, console clean, no
      structural churn warning, checked against the source diagram.
