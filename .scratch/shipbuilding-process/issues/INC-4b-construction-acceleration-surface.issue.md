# INC-4b — Construction acceleration player surface

**State:** done · **Frontier:** no · **Blocked by:** INC-4
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R8, R32) · **ADR:** none new
**Parent:** `INC-4-accelerate-capacity-pressure-delay.issue.md` (engine slice landed)

## What to build

The Construction screen's accelerate control consumes the engine slice: a toggle per row that issues
`SetAcceleration`, discloses the **+5 % cost premium** and the **capacity-pressure delay risk**, and
badges accelerated rows. Halted rows already show the half-mothball carrying cost (INC-3b).

## Acceptance criteria

- [x] An accelerate toggle per construction row issues the `SetAcceleration` command through the
      bridge. — `ProjectsCard` steering controls → `useConstructionScreen.setAcceleration` →
      `setAccelerationCommand` (queued envelope, applied on the next `commitMonth`).
- [x] The control discloses the +5 % remaining-work premium and the delay risk before enabling.
      — the control's `title`/accessible description.
- [x] Accelerated rows are badged. — the status badge shows `accelerated`.
- [x] Desktop render test + `pnpm snap` of the toggle, disclosure and badge (screenshot + `aria.yaml`,
      console clean, no churn warning). — `ProjectsCard.test.tsx`; `pnpm snap` of the Construction
      screen (clean console).

## Notes for implementator

Part of WS5. The command body and engine behaviour already exist (`SetAcceleration`,
`constructionAcceleration.ts`). Keep the disclosure a compiled/presentational value, never authored
state.

