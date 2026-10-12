# INC-9d — Foreign work-share and charge (schedule-driven work)

**State:** resolved · **Frontier:** no · **Blocked by:** INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R22) · **ADR:** ADR-0138
**Parent:** `INC-9-foreign-contract-capability-payment.issue.md`

## Decision (MEDIUM-3, resolved in the INC-9 rework)

A foreign contract's work is funded **solely by its payment schedule**. The
instalments are the charge, and a paid instalment unlocks its `workShareBp` share
of the project's total work; a foreign project is never funded by ordinary
appropriation and therefore never incurs an ordinary construction charge on the
same work. This is the reading most faithful to DESIGN-16 §13.4 ("Unpaid work
receives zero progress"): the schedule is the payment, and progress tracks
payments rather than running in parallel with them.

Before this, a due paid instalment let the ordering nation pay the instalment
**and** an ordinary appropriation charge on the same work (double-charge), while
`workShareBp` was carried but unused.

### Shipped rules

- `foreignUnlockedWork(totalWork, contract, paidDueMonths)` — sum the
  `workShareBp` of every paid instalment, clamp to `10_000` bp, floor over the
  project's `totalWork`. Cumulative and idempotent, so a retried month cannot
  double-unlock.
- The monthly step (`runForeignContractPhase`) applies the unlocked work only
  while the builder is capable, always adds the project to the appropriation
  zero-work skip set, and never posts an `APPROPRIATION` charge for it.
- Before any instalment is due (or while one is unpaid), unlocked work is `0`,
  so there is no free-work window before the first payment. The order-time
  completeness gate additionally requires the earliest instalment due at or
  before the authorization month (MEDIUM-5).

### Tests

- `foreignUnlockedWork` unit: unpaid → `0`, one of two instalments → half, both →
  all, an over-100% schedule → clamped to total work.
- Integration: a paid month unlocks exactly the paid `workShareBp` share and
  posts no `APPROPRIATION` line; an unpaid month with a non-zero construction
  cap still progresses `0` (falsifiable by deleting the skip filter).

## Remaining deferrals

- The contract's capacity-reservation schedule is still the shipped single entry
  at the authorization month; genuine per-month reservation schedules are
  supported by the type but not authored (INC-9c owns priority ordering).
- An instalment that unlocks work is applied at settlement in the same month; a
  per-month work-rate spread of an unlocked share is not modelled (the shipped
  schedule authorises work, the appropriation no longer meters it). If a future
  ticket wants the unlocked work metered over later months, it lands here.

## References

- `packages/phase-engine/src/foreignConstruction.ts` — `foreignUnlockedWork`.
- `packages/phase-engine/src/foreignContractPhase.ts` — schedule-driven work and
  the always-skip set.
- `packages/phase-engine/test/foreign-construction.test.ts` — the tests above.
