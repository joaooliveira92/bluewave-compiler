# INC-9 — Foreign contract + capability + builder capacity + payment

**State:** RESOLVED (engine slice + monthly payment wiring + schedule-driven work; UI split to INC-9b; §13.3 priority split to INC-9c; work-share/charge decision in INC-9d) · **Frontier:** no · **Blocked by:** INC-5, INC-8
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R20, R21, R22) · **ADR:** ADR-0138 (foreign-construction save state; DESIGN-16 §13.1–13.4)

## What to build

Let a player contract a ship to a foreign yard when their own industry cannot build it, limited by the
**builder's** dock size, consuming the **builder's** capacity, on a contract payment schedule with a
one-month grace — the manual's "contract them to foreign yards … limited by the building nation's dock
size".

## Acceptance criteria

- [x] Ordering abroad creates one immutable `ForeignConstructionContract` (DESIGN-16 §13.1) only when
      the builder satisfies §13.2: compiled displacement/dimensions within the **builder's** dock
      limits, technology or licensed design capability, shipyard capability, available
      `NEW_CONSTRUCTION` capacity, government/treaty permission, component sourcing, and no
      occupation/destruction. A missing contract fails with `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`;
      missing capability fails with `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT` (or an explicit
      delayed/impossible outcome), never a silent downgrade. Capability is revalidated monthly.
      *Mass is checked; the **dimension** predicate reads no data because `CompiledDesignVersion`
      carries no length/beam fields (the domestic path has the same structural limitation) — recorded
      as deferred in the Answer, not silently claimed.*
- [x] Foreign construction consumes the **builder's** capacity, not the ordering nation's; a builder never sells
      the same capacity twice (the admission gate + `foreignBuilderCommittedMassKg`).
- [ ] Reservations compete with the builder's domestic and other foreign work **under the builder's declared
      contract-priority policy** (DESIGN-16 §13.3) — **deferred to**
      `INC-9c-foreign-builder-priority-allocation.issue.md`. INC-9 models only the capacity-consumption and
      no-double-sell guarantee above.
- [x] Payments use balanced ledger postings and the contract schedule; the shipped grace is `1` month,
      after which the project enters `PAYMENT_DEFAULT_DELAYED` until payment or termination; unpaid work
      receives zero progress. **The payment/grace path is now wired into the real monthly pipeline
      (`runForeignContractPhase`, called from the appropriation phase) — see the rework note below.**
- [ ] UI: the build dialog offers foreign builders when no domestic yard fits (or by choice) and shows
      the builder's dock limit. → split to `INC-9b-foreign-builder-surface.issue.md`.
- [x] Tests: unit (each capability predicate; ordering nation's pool untouched, builder's reduced;
      grace/default/zero-progress); boundary (exactly at the builder's dock limit; double-sell
      rejected); persistence (contract round-trip, ledger balances); determinism (foreign-contract
      ordering by builder nation, shipyard, authorization month, contract id). Plus the INC-9 rework
      integration test (real `MonthExecutor` month → `PAYMENT_DEFAULT_DELAYED` → pay → resume).

## Answer (engine slice, reworked to wire payment/grace)

**Rule source correction.** The original front-matter cited "DESIGN-13 §13.1–13.4"; those sections live in
**DESIGN-16** (`docs/rules/bases-and-infrastructure.md` §13.1–§13.4, lines ~376–441). Implemented against
DESIGN-16. §13.5 (technology insight, INC-11) and §13.6–13.7/§14 (war effects, impoundment, delivery
guarantee, INC-10) are left as clean seams: the contract carries every policy identifier (§13.1) and the
monthly seam returns the builder-capability revalidation for the caller to map to a delayed/impossible
outcome.

**Rework note.** The first pass left `resolveForeignPaymentMonth` / `advanceForeignContractMonth` /
`applyForeignPaymentOutcome` reachable only from tests: the payment/grace path was unwired, and
`verifyForeignContractHash` was dead. This rework wires the path and closes the correctness gaps:

- **M1 — monthly wiring.** New `packages/phase-engine/src/foreignContractPhase.ts` (`runForeignContractPhase`)
  is called at the top of `runAppropriationPhase` (the phase already holds the
  `treasury`/`constructions`/`nations` read-write permissions, so no phase-registry change is needed). For
  every project carrying `foreignContractId` it resolves the stored contract, verifies its hash, revalidates
  builder capability through `advanceForeignContractMonth`, settles every due instalment the ordering
  treasury covers (posting the balanced `foreignPaymentLedgerEntries` pair, debiting the ordering nation and
  crediting the builder), and applies `applyForeignPaymentOutcome`. Unpaid work is held at zero by returning
  a per-nation skip set the appropriation funding honours; after the shipped one-month grace the project is
  `DELAYED` with `PAYMENT_DEFAULT_DELAYED`.
- **M2 — payment clears the hold.** `applyForeignPaymentOutcome` now takes the caller's resume target, clears
  `delayReasonCode` and transitions `DELAYED → constructionResumeTarget` (`ACTIVE`) on a paid/terminated
  outcome. The `ForeignPaymentMonthOutcome` carries `unpaidInstallments` so the caller settles deterministically
  oldest-first.
- **M3 — contract-hash guard.** The monthly step calls `verifyForeignContractHash` on every stored contract it
  consumes; a mismatch fails with the new stable `FOREIGN_CONTRACT_HASH_MISMATCH` and neither pays nor works.
- **M4 — `ResumeConstruction` cannot bypass a default.** `applyResumeConstruction` refuses a project for which
  `isForeignPaymentDefaultProject` is true with the new stable `FOREIGN_PAYMENT_DEFAULT_RESUME_BLOCKED` and no
  state change.
- **Med1 — unresolved builder capacity fails closed.** `placeForeignConstructionOrder` now refuses an order
  whose builder dock is resolvable but whose construction balance (hence free capacity) is not, with
  `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT` (`CAPACITY` field), instead of silently reserving `0` kg.
- **`applyBudgetProject` guard (defends the M1 invariant).** A direct domestic budget on a foreign-contract
  project is refused with `FOREIGN_CONTRACT_FUNDED_BY_SCHEDULE`; foreign work is driven by the contract
  schedule (the appropriation step), so a command budget could otherwise create progress without payment.
- **Foreign projects start `ACTIVE`.** An accepted contract has passed the §13.2 gate, so the order is live
  and the legal `ACTIVE → DELAYED` edge is available; previously a never-funded order stayed `PLANNED`, which
  has no `DELAYED` edge and could never enter the default.

**Second adversarial rework (2026-10-12).** A second review found the following, all fixed with tests:

- **MAJOR-1 — capability delay was unwound in the same month.** The monthly step ran before `delayedAtStart`
  was computed, and the auto-resume excluded only `PAYMENT_DEFAULT_DELAYED`, so a builder-capability failure
  flipped `DELAYED → ACTIVE` immediately while leaving a stale `delayReasonCode`. `runForeignContractPhase`
  now returns `ForeignContractPhaseResult { zeroWork, capabilityDelayed }`; the appropriation auto-resume
  excludes `capabilityDelayed` exactly like `delayedByPressure`, a reason is written only when the project
  actually moves to `DELAYED`, and the auto-resume clears a stale reason on any project it resumes. The live
  test holds the month in `DELAYED` (deleting the exclusion returns `ACTIVE`).
- **MAJOR-2 — the M1 unpaid test was vacuous.** It used `baseResources = 0` (cap `0`), so `completedWork === 0`
  held regardless of the skip set. The test now gives the ordering nation a non-zero cap (`120_000`), asserts
  zero work and no payment ledger line, and pairs it with an identical paid month that progresses. Deleting
  the skip filter makes the unpaid month fund `100` work and fails the test.
- **MEDIUM-3 — `workShareBp` unused / double-charge.** Resolved in `INC-9d`: work is schedule-driven, the
  paid instalments' `workShareBp` unlock work via `foreignUnlockedWork`, and foreign projects are never
  charged ordinary appropriation on the same work.
- **MEDIUM-4 — ADR-0138** records the optional, hash-neutral foreign save state and is registered in
  `docs/adr/README.md` and `AMENDMENTS.md` (Scope/process).
- **MEDIUM-5 — free-work window.** `isCompleteForeignConstructionContract` now refuses a schedule whose
  earliest instalment is due after the authorization month; the always-skip set also makes a not-yet-due
  foreign project zero-progress.
- **MINOR-6 — resume guard keyed on `isForeignPaymentDefaultProject` (status `DELAYED`).** It now keys on the
  persisted `delayReasonCode === PAYMENT_DEFAULT_DELAYED`, so a `DELAYED → HALTED` cannot bypass it.
- **MINOR-8 — `applyForeignPaymentOutcome` wrote a reason on an illegal transition.** It now returns the
  project unchanged unless the transition actually moved it to `DELAYED`.
- **NIT — self-contract / missing builder.** `placeForeignConstructionOrder` refuses
  `builderNationId === nationId` or a builder not present in the snapshot with the new stable
  `FOREIGN_BUILDER_NATION_INVALID`, so a payment cannot create or destroy money.
- **NIT — clone coverage.** `snapshotClone` now has an explicit `ForeignContractPaymentRecord` entry (with a
  compile-time `_Assert`), so a future field is audited.

**`PAYMENT_DEFAULT_DELAYED` decision (recorded, no ADR).** `PAYMENT_DEFAULT_DELAYED` is **not** a DESIGN-23
§2 status, so the union in `constructionStatus.ts` was **not** widened. It is the existing `DELAYED` status
plus a stable reason code, persisted on the project's optional `delayReasonCode` field.
`resolveForeignPaymentMonth` returns `status: "DELAYED"` with that reason; `applyForeignPaymentOutcome`
applies it only when the transition is legal. `economyPhases` (a) emits the reason on the delay event and
(b) **excludes** a `PAYMENT_DEFAULT_DELAYED` project from the ordinary one-month auto-resume, so the default
holds until payment or termination. No ADR needed: no canonical status list is amended.

**Payment policy decision (recorded).** The engine auto-settles any due instalment the ordering treasury
covers, oldest first. Work is **schedule-driven** (`INC-9d`): a paid instalment unlocks its `workShareBp`
share of the project's total work via `foreignUnlockedWork`, and a foreign project is always skipped by
ordinary appropriation, so the ordering nation pays the instalment and **no ordinary construction charge** on
the same work. Before the first instalment is due — or while one is unpaid — unlocked work is `0` ("unpaid work
receives zero progress", DESIGN-16 §13.4), and the order-time completeness gate requires the earliest
instalment due at or before the authorization month (MEDIUM-5). See
`INC-9d-foreign-work-share-and-charge.issue.md`.

**Med2 (§13.3 priority) — explicit deferral.** The double-sell protection is modelled
(`foreignBuilderCommittedMassKg` + the admission gate). The *declared contract-priority ordering* ("accepted
existing foreign contracts after legally mandatory domestic work and before new discretionary domestic
projects", DESIGN-16 §13.3) is **not** modelled: there is no authored builder priority policy to order
competing reservations against, and inventing one would be unstated policy. Deferred to
`INC-9c-foreign-builder-priority-allocation.issue.md`.

**Files changed/created (through the second rework)**
- `packages/campaign/src/state.ts` — `ForeignContractPaymentRecord`; `NationState.foreignContractPayments?`;
  project `foreignContractId?`/`foreignBuilderNationId?`/`delayReasonCode?` (all optional, hash-neutral).
- `packages/campaign/src/index.ts` — export `ForeignContractPaymentRecord`.
- `packages/ship-design/src/foreignConstruction.ts` — `FOREIGN_BUILDER_NATION_INVALID` (NIT order guard).
- `packages/phase-engine/src/foreignConstruction.ts` — `applyForeignPaymentOutcome` (resume/clear; MINOR-8
  reason only on a real move); `foreignUnlockedWork` (MEDIUM-3); MEDIUM-5 completeness gate;
  self-contract/missing-builder guards; `FOREIGN_CONTRACT_HASH_MISMATCH`; `FOREIGN_PAYMENT_DEFAULT_RESUME_BLOCKED`;
  `FOREIGN_CONTRACT_FUNDED_BY_SCHEDULE`; Med1 capacity failure; foreign project starts `ACTIVE`.
- `packages/phase-engine/src/foreignContractPhase.ts` — `runForeignContractPhase` returning
  `ForeignContractPhaseResult { zeroWork, capabilityDelayed }` (MAJOR-1); schedule-driven work and the
  always-skip set (MEDIUM-3); `FOREIGN_BUILDER_CONDITIONS_SATISFIED`.
- `packages/phase-engine/src/economyPhases.ts` — call the monthly step; exclude `capabilityDelayed` from the
  auto-resume (MAJOR-1); clear a stale reason on resume; thread the zero-work skip set through `fundable` and
  `applyLeftoverFunding`.
- `packages/phase-engine/src/commands.ts` — M4/MINOR-6 resume guard (keyed on `delayReasonCode`);
  `applyBudgetProject` foreign guard.
- `packages/phase-engine/src/snapshotClone.ts` — explicit `ForeignContractPaymentRecord` entry + `_Assert`
  (NIT) and payment-record clone coverage.
- `packages/phase-engine/src/index.ts` — export the new codes, `foreignUnlockedWork`, `ForeignContractPhaseResult`.
- `packages/phase-engine/test/foreign-construction.test.ts` — 35 tests, incl. M1 real-`MonthExecutor`
  integration, MAJOR-1 capability-hold + recovery, MAJOR-2 falsifiable unpaid month, M2 default→pay→resume,
  M3 tampered-contract, M4/MINOR-6 resume-blocked, MINOR-8 illegal transition, MEDIUM-3 work-share,
  MEDIUM-5 free-window, NIT self-contract, Med1 missing-balance, `applyBudgetProject` guard.
- `packages/phase-engine/test/snapshotClone.test.ts`, `.../snapshot-clone.test.ts` — clone-coverage fixtures.
- `packages/persistence/test/foreign-contract-roundtrip.test.ts` — contract + project + payment-record
  round-trip with an unchanged hash.
- Docs/process: new `docs/adr/ADR-0138-foreign-construction-save-state.md`, regenerated
  `docs/adr/README.md`, registered in `docs/adr/AMENDMENTS.md` and `scripts/adr-index.cjs`; new
  `INC-9d-foreign-work-share-and-charge.issue.md`.

**Reason codes.** `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`, `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT`
(field-tagged: `DOCK`/`TECHNOLOGY`/`SHIPYARD`/`CAPACITY`/`GOVERNMENT`/`COMPONENTS`/`PHYSICAL`),
`FOREIGN_BUILDER_NATION_INVALID`, `PAYMENT_DEFAULT_DELAYED`, `FOREIGN_CONTRACT_HASH_MISMATCH`,
`FOREIGN_PAYMENT_DEFAULT_RESUME_BLOCKED`, `FOREIGN_CONTRACT_FUNDED_BY_SCHEDULE`.

**Commands + results (second rework)**
- `pnpm --filter @bluewave/{ship-design,campaign} exec tsc -b` — pass.
- `pnpm --filter @bluewave/phase-engine exec tsc --noEmit` — pass.
- `pnpm --filter @bluewave/phase-engine exec vp test run` — 39 files / 417 tests pass (35 in
  `foreign-construction.test.ts`).
- `pnpm --filter @bluewave/persistence exec vp test run` — 13 files / 75 tests pass.
- `pnpm --filter @bluewave/{campaign,phase-engine,ship-design,persistence} exec vp lint .` — 0 warnings / 0 errors.
- `pnpm exec vp fmt --check <changed files>` — clean.
- `node scripts/verify-no-unknown-casts.mjs` — no new assertions. `pnpm lint:effect` — 0 errors.
- `pnpm check:golden` — 10/10 hashes match. `pnpm check:determinism` — two runs byte-identical.
  **No golden or determinism movement** (the step is a strict no-op when no project carries a
  `foreignContractId`).
- `node scripts/docs-check.cjs` — ok (137 ADRs). `node scripts/verify-tracker-consistency.mjs` — 0 errors.

**Deferred.** §13.3 builder contract-priority allocation → `INC-9c-foreign-builder-priority-allocation.issue.md`
(AC-2's priority clause is now explicitly unticked and deferred). UI (foreign-builder selection +
impoundment/treaty display) → `INC-9b`. War effects/impoundment (§13.6–13.7, §14) → INC-10. Technology
insight (§13.5) → INC-11. Schedule-driven work details (the remaining per-month metering question) →
`INC-9d-foreign-work-share-and-charge.issue.md`. The contract's capacity-reservation schedule is the shipped
single entry at the authorization month (derived by the engine); genuine per-month schedules are supported by
the type but not authored yet. Residual command-path/monthly-step MINOR findings from the fourth-pass review
(non-payment resume clearing the delay reason, holder-vs-ordering mismatch, missing builder nation, zero/duplicate
instalments, `ReviseProject`/`SetAcceleration` foreign guards, non-playable-nation guard) →
`INC-9e-foreign-project-command-guards.issue.md`. DESIGN-16 §18 reason-code reconciliation (the required
`FOREIGN_BUILDER_CAPACITY_UNAVAILABLE` and `FOREIGN_CONTRACT_PAYMENT_DEFAULT` names) →
`INC-9f-design16-section18-reason-codes.issue.md`. The builder dock **dimension** predicate is not enforced
because `CompiledDesignVersion` carries no length/beam fields (shared with the domestic order path) — deferred.

## Notes for implementator

Contract + war-policy machinery in the phase engine, on the batch order path from INC-8. The ordering
nation's capacity is never touched. War effects (INC-10) and tech insight (INC-11) build on this. The monthly
step lives in `foreignContractPhase.ts` and is invoked from the appropriation phase (INC-9c owns the §13.3
priority extension).
