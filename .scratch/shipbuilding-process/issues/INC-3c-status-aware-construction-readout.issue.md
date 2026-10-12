# INC-3c — Status-aware construction readout

**State:** deferred · **Frontier:** no · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R31) · **ADR:** none yet
**Origin:** the INC-3b code review (MEDIUM-2, 2026-10-12).

## The finding

`constructionProjectReadout` derives the monthly instalment, remaining months and launch month from
the design's construction-plan capacity **regardless of project status**. For an `ACTIVE` project those
figures match the funding the appropriation phase actually runs, but for a held project they misstate
it: a `HALTED` row shows e.g. "Instalment 40/mo · Months left 1 · Launch 1880-03" while the engine
gives it `0` work and charges only the preservation cost; `DELAYED`/`AWAITING_CAPACITY`/`IMPOUNDED`
and `holdUntilMonth` rows are the same. A foreign-contract project is funded by its contract
instalment schedule, not yard capacity, so its "Instalment" is not the contract instalment.

The figures are compiled (not authored in the UI), so INC-3b's AC is met; this is a product-semantics
gap, not a correctness bug in the readout projection.

## What to build

A status-aware readout: suppress or explicitly label the schedule for `HALTED`/`DELAYED`/
`AWAITING_CAPACITY`/`IMPOUNDED`/on-hold rows (the carrying cost / delay replaces the instalment), and
derive a foreign row's instalment and launch from its `ForeignConstructionContract` schedule rather
than the design's yard capacity. Keep every figure compiled; no UI-authored values.

## Acceptance criteria

- [ ] A held/foreign row's readout reflects the funding path the appropriation phase actually runs
      (`preservationCostUnits` for `HALTED`, the contract schedule for a foreign project), or says the
      schedule is unavailable — never a misleading instalment/launch.
- [ ] Tests pin each status; golden/determinism unchanged.

## Notes for implementator

Extend `constructionProjectReadout`/`constructionProjectQueueWithReadouts` (phase-engine) rather than
the UI; the renderer stays presentational. Fan out any new figures from the same engine values.
