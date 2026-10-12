# INC-9 — Foreign contract + capability + builder capacity + payment

**State:** READY_FOR_AGENT · **Frontier:** no · **Blocked by:** INC-5, INC-8
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R20, R21, R22) · **ADR:** none new (DESIGN-13 §13.1–13.4 shipped)

## What to build

Let a player contract a ship to a foreign yard when their own industry cannot build it, limited by the
**builder's** dock size, consuming the **builder's** capacity, on a contract payment schedule with a
one-month grace — the manual's "contract them to foreign yards … limited by the building nation's dock
size".

## Acceptance criteria

- [ ] Ordering abroad creates one immutable `ForeignConstructionContract` (DESIGN-13 §13.1) only when
      the builder satisfies §13.2: compiled displacement/dimensions within the **builder's** dock
      limits, technology or licensed design capability, shipyard capability, available
      `NEW_CONSTRUCTION` capacity, government/treaty permission, component sourcing, and no
      occupation/destruction. A missing contract fails with `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`;
      missing capability fails with `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT` (or an explicit
      delayed/impossible outcome), never a silent downgrade. Capability is revalidated monthly.
- [ ] Foreign construction consumes the **builder's** capacity, not the ordering nation's; reservations
      compete with the builder's domestic and other foreign work under the builder's priority, and a
      builder never sells the same capacity twice.
- [ ] Payments use balanced ledger postings and the contract schedule; the shipped grace is `1` month,
      after which the project enters `PAYMENT_DEFAULT_DELAYED` until payment or termination; unpaid work
      receives zero progress.
- [ ] UI: the build dialog offers foreign builders when no domestic yard fits (or by choice) and shows
      the builder's dock limit.
- [ ] Tests: unit (each capability predicate; ordering nation's pool untouched, builder's reduced;
      grace/default/zero-progress); boundary (exactly at the builder's dock limit; double-sell
      rejected); persistence (contract round-trip, ledger balances); determinism (foreign-contract
      ordering by builder nation, shipyard, authorization month, contract id).

## Notes for implementator

Contract + war-policy machinery in the phase engine, on the batch order path from INC-8. The ordering
nation's capacity is never touched. War effects (INC-10) and tech insight (INC-11) build on this.
