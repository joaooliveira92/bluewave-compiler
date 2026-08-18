# INC-8 — Construction ordering wizard

**What to build:** The select-design → review → confirm ship-ordering wizard
on the Construction screen, per [the assembled spec](../spec.md) §12.

- Real flow over `submitConstructionCommand` / `replaceConstructionCommand` /
  `cancelConstructionCommand` (existing commands; **no new command name or
  payload**).
- Steps: choose available design (real catalog filtered to the player
  nation) → review design summary (`className`, `shipType`, `year`, `mass`,
  `speed`, `machineryType`) → review dock requirement (`projectedCapacityUnits`)
  → review total projected cost (`projectedConstructionOrderCosts`,
  `construction_order_v1`) → review reservation impact (workspace
  `treasuryReserved`/`capacityReserved`, honest copy — never a fabricated
  monthly figure) → confirm → project visible in the queue.
- **No ship-naming step** (no `shipName` input exists; completed ships are
  engine-named `Ship {className}`); **no completion-time estimate**
  (underivable); eligibility = the real rejection codes surfaced verbatim
  (`UNKNOWN_DESIGN`, `DESIGN_NOT_FOR_PLAYER`, `INSUFFICIENT_FUNDS`,
  `INSUFFICIENT_CAPACITY`) — low cash is a hard `INSUFFICIENT_FUNDS`
  rejection, never a "placed with warning" outcome.
- Replace/cancel for in-flight orders surface through the same workspace.
- **Autosave after a successful construction-order command** (spec §17:
  genuinely-new trigger).
- Visual click-through details (wizard layout) are judged during this
  ticket — presentation only.

**Blocked by:** INC-14 (nav shell), INC-1 (projected-balance copy)

**Status:** ready-for-agent

- [ ] Wizard flows select → review → confirm over the real commands and
      catalog (no new command, no invented fields)
- [ ] No ship-naming step, no completion-time claim, no low-cash-warning
      outcome
- [ ] Eligibility rejections surface the real reason codes verbatim
- [ ] Replace/cancel for in-flight orders work through the real workspace
- [ ] Autosave fires after a successful construction order
- [ ] Component/engine tests cover the wizard path + rejections
- [ ] Goldens 10/10 unchanged
