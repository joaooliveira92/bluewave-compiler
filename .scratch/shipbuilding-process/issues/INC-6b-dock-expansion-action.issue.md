# INC-6b — Dock-expansion action

**State:** done · **Frontier:** no · **Blocked by:** INC-6
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R16) · **ADR:** none new
**Parent:** `INC-6-dock-expansion-and-private-expansion.issue.md` (engine slice landed)

## What to build

The Construction screen offers a dock-expansion action: start a 12-month expansion project at the
next era step, with the duration and the era step disclosed as compiled values.

## Acceptance criteria

- [x] A dock-expansion action on the construction screen issues the expansion (through a command or
      the existing bridge) and shows the 12-month duration and the next era step.
- [x] Desktop render test + `pnpm snap` (screenshot + `aria.yaml`, console clean, no churn warning).

## Notes for implementator

Part of WS5. The engine exposes `authorizeDockExpansion` from `@bluewave/phase-engine`; the screen
consumes it. Keep the duration/step display-only.
