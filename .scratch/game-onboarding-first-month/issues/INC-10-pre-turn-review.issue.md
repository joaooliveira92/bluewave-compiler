# INC-10 — Pre-turn review + Advance Month flow

**What to build:** The pre-turn review dialog ahead of the existing
`commitMonth` advance, per [the assembled spec](../spec.md) §14.

- Review fields, all from real state: current date (`record.month` /
  `PlayerProjection.month`); next date (`advanceMonth(+1)`); available funds
  (`economy.treasury`); projected surplus/deficit (`monthlyAppropriation −
  maintenanceCost − constructionSpend − researchSpend`, the two INC-1
  economy fields); active construction project count (real `status !==
  "COMPLETED"` predicate); expected completions (derived from the
  construction projection); current research spending (INC-1
  `researchSpend`); unresolved warnings (INC-2's priorities projection);
  save status (the shell's `saving`/`saveMessage` pair).
- Actions: **Cancel** and **Advance to [Month Year]** → the existing
  `commitMonth` (unchanged; document, don't rebuild).
- Blockers surfaced as real `BridgeResult` codes (`REVISION_MISMATCH`,
  `SESSION_NOT_FOUND`, `SIMULATION_END_REACHED`, `UNKNOWN_PLAYER_SLOT`, plus
  the phase-0 `opening_validation` invariants). Warnings = the INC-2 priority
  projection (no warning-level engine signal exists to read directly).
- Double-submit protection: the renderer `committing` flag + `expectedRevision`
  → `REVISION_MISMATCH` (documented; the same-`requestId` result-replay gap
  is recorded, not built). No mid-resolution cancellation (Advance disabled
  during the synchronous commit).

**Blocked by:** INC-1, INC-2, INC-14

**Status:** ready-for-agent

- [ ] Review dialog shows every listed field from real state (no fabricated
      figures); warnings section IS the INC-2 priority projection
- [ ] Advance routes to the existing `commitMonth`; blockers surface the real
      reason codes
- [ ] No mid-resolution cancellation; the `committing` flag + revision guard
      cover double-submit (documented gap, not built)
- [ ] Component tests cover the field derivations + the dialog actions
- [ ] Goldens 10/10 unchanged; two-process determinism byte-identical
