# ADR-0138: Persisted foreign-construction save state (optional, hash-neutral)

## Status

Accepted (2026-10-12).

## Context

`INC-9` adds the foreign-construction engine slice for `DESIGN-16` section 13:
an immutable `ForeignConstructionContract` (section 13.1), the builder
capability gate (section 13.2), builder-capacity consumption (section 13.3) and
the payment schedule with its one-month grace (section 13.4). The monthly step
(`runForeignContractPhase`) reads and writes that state, so it has to survive the
save/load boundary.

The state model is hash-sensitive: every snapshot field participates in the
canonical state hash (`ADR-0113`), and the reference golden run must stay
byte-identical. A new field that is always materialised would re-pin every hash;
a field carried only in memory would not survive a reload.

## Decision

1. **Optional, plain-value fields.** `NationState` gains
   `foreignContracts?: ForeignConstructionContract[]` and
   `foreignContractPayments?: ForeignContractPaymentRecord[]`; the existing
   `ConstructionProject` gains `foreignContractId?`, `foreignBuilderNationId?`
   and `delayReasonCode?`. All are `?`, so an existing save stays valid and the
   canonical hash is unchanged when a nation has no foreign work.
2. **Campaign owns the shape.** The contract, its schedule entries and the
   payment record are plain values declared in `@bluewave/campaign`; campaign
   state keeps no dependency on `@bluewave/ship-design`, mirroring the authored
   dock record (`ADR-0135`). The phase engine computes the contract hash once, at
   order time, through `@bluewave/deterministic`.
3. **Absent until first used.** `foreignContracts` appears on the first foreign
   order; `foreignContractPayments` appears only once an instalment is actually
   paid. A run with no foreign contracts is therefore a strict no-op and keeps
   its golden hashes.
4. **Field-exhaustive clone coverage.** `snapshotClone` gains an explicit
   `ForeignContractPaymentRecord` entry alongside the existing
   `ForeignConstructionContract` and construction-project entries, so a future
   field addition fails the compile-time audit (`snapshot-clone.test.ts`).
5. **Hash guard on consume.** The stored contract carries a `contractHash` over
   every other field; the monthly step verifies it before consuming the contract
   and refuses a mismatch with `FOREIGN_CONTRACT_HASH_MISMATCH`, so a tampered
   save neither pays nor works.

## Consequences

- The foreign contract, its paid instalments and the project's foreign/delay
  fields round-trip through save/load with an unchanged hash
  (`packages/persistence/test/foreign-contract-roundtrip.test.ts`).
- Saves written before `INC-9` remain compatible; the reference golden run is
  unchanged because no foreign state is materialised in it.
- `delayReasonCode` is a reason carried on the existing `DELAYED` status, not a
  new status: `PAYMENT_DEFAULT_DELAYED` and `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT`
  are stable reason codes (`ADR-0129`).

## Alternatives considered

- **Always materialise the arrays.** Rejected: it re-pins every existing save
  hash for state that is empty in almost every snapshot.
- **Recompute the contract from the project at load time.** Rejected: the
  contract is immutable, hash-bound and carries policy identifiers, so it must be
  stored, not re-derived.
