# INC-3c — Status-aware construction readout

**State:** resolved · **Frontier:** no · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R31) · **ADR:** none new (a projection refinement, easy to reverse)
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

- [x] A held/foreign row's readout reflects the funding path the appropriation phase actually runs
      (`preservationCostUnits` for `HALTED`, the contract schedule for a foreign project), or says the
      schedule is unavailable — never a misleading instalment/launch.
- [x] Tests pin each status; golden/determinism unchanged.

## Notes for implementator

Extend `constructionProjectReadout`/`constructionProjectQueueWithReadouts` (phase-engine) rather than
the UI; the renderer stays presentational. Fan out any new figures from the same engine values.

## Answer

The readout is now status- and funding-path-aware. `constructionProjectReadout` gained a
`scheduleBasis: "YARD_CAPACITY" | "FOREIGN_CONTRACT" | "UNAVAILABLE"` and a
`scheduleUnavailableReason: string | null`, and `constructionProjectQueueWithReadouts` resolves the
project's foreign contract and its paid months from the nation so a foreign row's figures come from
the contract.

- **Held rows** (`HALTED`, `DELAYED`, `AWAITING_CAPACITY`, `IMPOUNDED`, `CANCELLED`) and revision holds
  (`holdUntilMonth` in the future) report `scheduleBasis: "UNAVAILABLE"` with the reason, zero
  instalment/months and a null launch — the engine's zero-work/zero-charge months, never a
  fabricated instalment or a "complete". `preservationCostUnits` still rides the `HALTED` row as
  `haltedCarryingCostUnits`.
- **Foreign rows** derive the instalment (the next unpaid contract instalment), remaining months
  (unpaid instalments) and launch (`plannedDeliveryMonth`) from the `ForeignConstructionContract`
  schedule, never the design's yard capacity. The contract schedule outranks the held-status gate:
  a delayed foreign row still honestly shows the money still owed (DESIGN-16 §13.4). A foreign order
  whose contract the snapshot cannot resolve reports `FOREIGN_CONTRACT_MISSING`, never a yard-capacity
  fallback.
- **Completed projects** report complete regardless of status/funding path.
- **Surface:** `ProjectReadout` renders a held row as `Schedule: not building (<reason>)` plus total
  cost and carrying cost, instead of an instalment/launch; the string avoids duplicating an exact
  status-badge word (the e2e `getByText("halted", { exact: true })` stays unambiguous).

**Code-review fixes folded in:** the shared `ConstructionScheduleBasis` /
`ConstructionScheduleUnavailableReason` types live in `@bluewave/campaign-engine` and are imported
(not redeclared) by `@bluewave/phase-engine`; the reason is a typed union, so the renderer's label map
is a total `Partial<Record<…>>` whose fallback is the raw engine code, not a fabricated label; an
unresolved foreign contract and a `CANCELLED` row are both handled by the UNAVAILABLE branch; the
`MONTH_RE` year/month capture groups are correct (single regex reused by `addMonths`).

**Tests** — `packages/phase-engine/test/construction-readout.test.ts` pins each held status, the
revision hold, the hold-elapsed case, a completed project, the foreign contract schedule, the
foreign-preferred-over-held decision, and the queue's contract lookup; `ProjectReadout.test.tsx`
pins the held/delayed/foreign/complete renders. Golden hashes (10/10) and cross-process determinism
are unchanged (the readout is a projection; no snapshot field moved).

**Commands:** `pnpm --filter @bluewave/phase-engine exec vp test run` → 514 passed; desktop
construction suite → 244 passed; `pnpm typecheck` → clean; `vp lint`/`vp fmt --check` → clean;
`pnpm check:golden` → 10/10; `pnpm check:determinism` → byte-identical; `pnpm snap` (halted row) →
`not building (halted)` in the aria tree, console clean, `idle mutations/s: structural=0`; e2e
`construction-steering` + `construction-batch` → 2 passed.
