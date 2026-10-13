# INC-9c — Foreign builder contract-priority allocation (§13.3)

**State:** done · **Frontier:** no · **Blocked by:** INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R21) · **ADR:** none new (DESIGN-16 §13.3)
**Parent:** `INC-9-foreign-contract-capability-payment.issue.md` (engine slice + monthly wiring landed; §13.3 priority deferred)

## What to build

Model the **builder's declared contract-priority policy** for `NEW_CONSTRUCTION` capacity (DESIGN-16 §13.3): when a
builder's concurrency cap is contended, accepted existing foreign contracts rank after legally mandatory domestic
work and before new discretionary domestic projects. Today INC-9 enforces only the two-part guarantee that a
builder consumes the builder's capacity and never sells it twice (`foreignBuilderCommittedMassKg` +
`placeForeignConstructionOrder` admission); it does not order competing reservations by priority.

## Acceptance criteria

- [x] A versioned builder priority policy id (e.g. `foreign_contract_priority_v1`) and its shipped ordering
      constants are defined, with the three named ranks: legally mandatory domestic work, accepted existing foreign
      contracts, new discretionary domestic projects.
- [x] Reservation admission and retention allocate the builder's free `NEW_CONSTRUCTION` capacity in that rank
      order, deterministically (builder nation, shipyard, authorization month, contract id as the tie-break), with
      no double-sell.
- [x] A new discretionary domestic project that would over-subscribe a builder already holding accepted foreign
      contracts is deferred/handled explicitly (not silently admitted or dropped), with a stable reason code.
- [x] Tests: unit (rank ordering; a foreign contract outranks a new discretionary domestic project; mandatory
      domestic outranks a foreign contract); boundary (exactly on the cap); determinism (order independent of
      insertion/DB order); persistence if any new state field is added (optional and hash-neutral).
- [x] `pnpm check:golden` and `pnpm check:determinism` unchanged for runs with no foreign contracts.

## Answer (2026-10-12)

- `foreign_contract_priority_v1` + the three ranks live in `newConstructionCapacity.ts`, with the pure
  `allocateBuilderCapacity` (rank → deterministic tie-break → id) and `foreignContractClaims` (only LIVE contracts:
  a terminal ordering project releases the builder's capacity). `foreignContractsCommittedMassKg` delegates to the
  claims; `foreignBuilderCommittedMassKg` (monthly retention) now delegates too, so a lingering terminal contract
  never inflates committed mass.
- `constructionOrderEligibility` builds the foreign claims + the new `DISCRETIONARY_DOMESTIC` claim and calls
  `allocateBuilderCapacity` against the capacity left after already-admitted domestic work; a rejected new claim is
  refused with `FOREIGN_CONTRACT_PRIORITY_DEFERRED` **only when foreign work is the binding constraint**, else the
  existing `INSUFFICIENT_PROJECT_CAPACITY`. Byte-identical with no foreign contracts (golden/determinism unchanged).
- Deferred (recorded): classifying a domestic project as `MANDATORY_DOMESTIC` has no shipped predicate (no legally
  mandatory domestic work exists in EARLY content); the rank is an authored allocator input.
- Tests: `test/foreign-contract-priority.test.ts` (10).

## Notes for implementator

`foreignBuilderCommittedMassKg` and the INC-9 admission gate are the seams; do not re-derive dock/cap arithmetic.
Do not invent a priority that DESIGN-16 does not state: the three ranks above are the shipped policy. If the
domestic allocation sites (`runAppropriationPhase`, `placeConstructionOrder`, `placeConstructionBatch`) need a
shared rank helper, put it in `newConstructionCapacity.ts` (pure) and keep `foreignContractPhase.ts` the monthly
consumer.
