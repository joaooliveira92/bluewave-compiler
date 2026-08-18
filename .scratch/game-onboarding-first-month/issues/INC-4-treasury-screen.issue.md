# INC-4 — Treasury read-only projection screen

**What to build:** The Treasury screen, per [the assembled spec](../spec.md)
§9 — a **read-only** projection surface wired into the nav-shell's Treasury
route (INC-14's stub slot).

- Income (government naval allocation), expenditure (fleet maintenance real +
  construction spend + research spend from INC-1's economy fields), and
  result (projected surplus/deficit, available funds, projected month-end
  funds). No "Other expenses" balancing row.
- All figures from the real `inspectCampaign` projection / economy fields —
  nothing computed in the renderer.
- **No budget controls, no draft/apply/reset, no `ReviseNavalBudgetCommand`**
  — nothing on this screen submits a command (spec §9.2/§9.4–§9.6 cut).
- `SafeInt` numbers; surplus/deficit may legitimately go negative.

**Blocked by:** INC-1 (economy fields), INC-14 (nav shell Treasury route)

**Status:** ready-for-agent

- [ ] Treasury route renders the real income/expenditure/result figures with
      honest copy (no budget controls of any kind)
- [ ] Every displayed number comes from the projection — no renderer-side
      derivations, no fabricated categories
- [ ] No Treasury-specific command is added; no editable input exists
- [ ] Component tests cover each row against a fixture projection
- [ ] Goldens 10/10 unchanged
