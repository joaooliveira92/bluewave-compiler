# INC-9e — Foreign-project command-path guards and monthly-step hardening

**State:** done · **Frontier:** no · **Blocked by:** INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R22) · **ADR:** none new (DESIGN-16 §13.4)
**Parent:** `INC-9-foreign-contract-capability-payment.issue.md` (engine slice + monthly wiring landed; these are the
fourth-pass review's MINOR findings, recorded so they are not dropped)

## What to build

Close the residual MINOR findings from the INC-9 adversarial review. None is reachable until the player/command
surface for foreign orders lands (`INC-9b`), so they should be closed **before** or alongside `INC-9b`.

- **MINOR-1** — a successful **non-payment** resume must clear `delayReasonCode`. `applyResumeConstruction` currently
  blocks only `PAYMENT_DEFAULT_DELAYED`, so resuming a *capability*-delayed project yields `ACTIVE` while still
  carrying `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT`, violating the "reason only on a delayed month" invariant.
  Mirror `withoutDelayReason` on the successful resume, keeping the payment-default early return intact.
- **MINOR-2** — the monthly step trusts the holder nation's id equals `contract.orderingNationId`; a valid contract
  relocated into another nation's array (array order is not hashed) would debit one nation and ledger another. Skip
  with a stable diagnostic when they differ.
- **MINOR-3** — a missing builder nation in the month path debits the ordering treasury and posts an `INFLOW` entry
  without crediting anyone (money destroyed). Skip the instalment with a stable diagnostic.
- **MINOR-4** — a zero-amount due instalment can never settle (`continue` on `amountUnits <= 0`), leaving a permanent
  `PAYMENT_DEFAULT_DELAYED`; and duplicate `dueMonth`s collapse the `paidDueMonths` key so a partial budget can
  underpay while unlocking full work. Auto-satisfy a 0-amount instalment and reject duplicate due months in the
  completeness gate.
- **MINOR-5** — `ReviseProject` and `SetAcceleration` have no foreign guard (contrast `applyBudgetProject`'s
  `FOREIGN_CONTRACT_FUNDED_BY_SCHEDULE`). A revision or the acceleration premium raises `totalWork`, so
  `foreignUnlockedWork` unlocks a larger absolute share for already-paid instalments — free progress without payment.
  Refuse both for a foreign-contract project with a stable reason.
- **MINOR-6** — `runForeignContractPhase` iterates every nation; every other economy phase skips `!isPlayable && !isAI`.
  Apply the same guard (or document why foreign settlement must run for all ordering nations) so a non-participating
  nation cannot be debited into a negative treasury.
- **NITs** — avoid computing `advanceForeignContractMonth` twice per project per month; skip terminal foreign
  projects; state plainly that `currencyUnit` is carried but settlement always debits treasury units.

## Acceptance criteria

- [x] Each MINOR above is fixed with a unit/integration test that fails without the fix.
      — `packages/phase-engine/test/foreign-construction.test.ts` (`INC-9e foreign-project command guards and monthly
      hardening`); the shared `monthInput` closure addresses the NIT.
- [x] No new `as unknown`; optional-only state; `snapshotClone.ts` coverage complete. — no new state field.
- [x] `pnpm check:golden` and `pnpm check:determinism` unchanged for runs with no foreign contracts.

## Notes for implementator

These are guards, not new mechanics. Follow the existing reason-code conventions in
`packages/phase-engine/src/foreignConstruction.ts` / `foreignContractPhase.ts`. The order-path guards already exist
(`placeForeignConstructionOrder`); this ticket closes the **consume/command** path.

