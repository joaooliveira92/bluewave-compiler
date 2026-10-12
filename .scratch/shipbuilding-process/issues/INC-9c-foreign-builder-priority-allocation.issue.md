# INC-9c — Foreign builder contract-priority allocation (§13.3)

**State:** open · **Frontier:** yes · **Blocked by:** INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R21) · **ADR:** none new (DESIGN-16 §13.3)
**Parent:** `INC-9-foreign-contract-capability-payment.issue.md` (engine slice + monthly wiring landed; §13.3 priority deferred)

## What to build

Model the **builder's declared contract-priority policy** for `NEW_CONSTRUCTION` capacity (DESIGN-16 §13.3): when a
builder's concurrency cap is contended, accepted existing foreign contracts rank after legally mandatory domestic
work and before new discretionary domestic projects. Today INC-9 enforces only the two-part guarantee that a
builder consumes the builder's capacity and never sells it twice (`foreignBuilderCommittedMassKg` +
`placeForeignConstructionOrder` admission); it does not order competing reservations by priority.

## Acceptance criteria

- [ ] A versioned builder priority policy id (e.g. `foreign_contract_priority_v1`) and its shipped ordering
      constants are defined, with the three named ranks: legally mandatory domestic work, accepted existing foreign
      contracts, new discretionary domestic projects.
- [ ] Reservation admission and retention allocate the builder's free `NEW_CONSTRUCTION` capacity in that rank
      order, deterministically (builder nation, shipyard, authorization month, contract id as the tie-break), with
      no double-sell.
- [ ] A new discretionary domestic project that would over-subscribe a builder already holding accepted foreign
      contracts is deferred/handled explicitly (not silently admitted or dropped), with a stable reason code.
- [ ] Tests: unit (rank ordering; a foreign contract outranks a new discretionary domestic project; mandatory
      domestic outranks a foreign contract); boundary (exactly on the cap); determinism (order independent of
      insertion/DB order); persistence if any new state field is added (optional and hash-neutral).
- [ ] `pnpm check:golden` and `pnpm check:determinism` unchanged for runs with no foreign contracts.

## Notes for implementator

`foreignBuilderCommittedMassKg` and the INC-9 admission gate are the seams; do not re-derive dock/cap arithmetic.
Do not invent a priority that DESIGN-16 does not state: the three ranks above are the shipped policy. If the
domestic allocation sites (`runAppropriationPhase`, `placeConstructionOrder`, `placeConstructionBatch`) need a
shared rank helper, put it in `newConstructionCapacity.ts` (pure) and keep `foreignContractPhase.ts` the monthly
consumer.
