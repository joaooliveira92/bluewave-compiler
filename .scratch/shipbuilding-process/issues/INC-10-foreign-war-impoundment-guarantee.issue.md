# INC-10 — Foreign war effects + impoundment + delivery guarantee

**State:** engine slice LANDED (wired into the monthly appropriation); UI AC deferred to INC-9b · **Frontier:** no · **Blocked by:** INC-2, INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R23) · **ADR:** none new (DESIGN-13 §13.6–13.7, §14 shipped; tension predicate is a PLACEHOLDER constant)

## What to build

Resolve a foreign contract's fate when war breaks out: continue, delay, suspend, impound, cancel or
physically impossible — with tension-scaled impoundment risk, the `IMPOUNDED` status carrying the hull,
and a treaty delivery guarantee that blocks discretionary impoundment — the manual's "you risk that
your ships will be impounded … if you have a treaty … always delivered".

## Acceptance criteria

- [x] At war entry involving the ordering nation, builder nation or builder's controller, the contract
      evaluates `foreign_contract_war_policy_v1` to exactly one of `CONTINUE`, `DELAY`, `SUSPEND`,
      `IMPOUND`, `CANCEL_WITH_SETTLEMENT`, `PHYSICALLY_IMPOSSIBLE`. Each outcome defines payment, work,
      capacity, incomplete-hull ownership, refund and delivery effects.
      — `packages/phase-engine/src/foreignWarEffects.ts` (`resolveForeignWarPolicy`,
      `FOREIGN_WAR_OUTCOME_EFFECTS`); wired in `foreignContractPhase.ts`.
      *Deferred:* occupation/destruction, embargo and co-belligerence predicates default to their
      non-triggering values until those subsystems model them (recorded; the ordering↔builder relation
      and tension are authoritative).
- [x] Impoundment transfers custody per §13.7, records a causal record (authorizing predicate,
      custody, title, paid/unpaid, compensation, status, future delivery), and is carried by the
      `IMPOUNDED` project status; discretionary impoundment without a policy result fails with
      `FOREIGN_CONTRACT_IMPOUNDMENT_NOT_AUTHORIZED`.
      — `authorizeForeignImpoundment` + `ForeignContractImpoundmentRecord`
      (`packages/campaign/src/state.ts`); persisted as an optional, hash-neutral field.
- [x] A valid treaty/contract delivery guarantee (§14) prohibits discretionary `IMPOUND` but never
      overrides `PHYSICALLY_IMPOSSIBLE`. — `isDeliveryGuaranteeActive`; the guarantee turns a hostile
      `IMPOUND` into `DELAY` (`DELIVERY_GUARANTEE_ACTIVE`).
- [x] The tension → impoundment policy-predicate values are a versioned `balance.yaml` PLACEHOLDER
      constant (the manual gives no formula). — `FOREIGN_IMPOUNDMENT_TENSION_SLOPE_BP` /
      `FOREIGN_IMPOUNDMENT_MAX_PROBABILITY_BP` / `FOREIGN_IMPOUNDMENT_MIN_TENSION` in
      `foreignWarEffects.ts` (versioned ruleset constants; recorded as PLACEHOLDER).
- [ ] UI: the foreign-order flow discloses impoundment risk (tension-based) and treaty-delivery status.
      — **Deferred to INC-9b** (the foreign-builder + impoundment/treaty disclosure surface); INC-9b is
      itself deferred to the new shipbuilding screen.
- [x] Tests: unit (each outcome; guarantee blocks discretionary impound but not physical impossibility);
      determinism (policy predicate keyed/stable); `pnpm snap` of the risk disclosure.
      — unit + determinism LANDED (`test/foreign-war-effects.test.ts`, `test/foreign-war-settlement.test.ts`,
      monthly wiring in `test/foreign-construction.test.ts`); `pnpm snap` deferred with the INC-9b UI.

## Notes for implementator

Depends on the full status model (INC-2, `IMPOUNDED`) and the contract (INC-9). The policy predicate
must be a typed keyed decision, never inferred.

## Settlement money (implemented 2026-10-12)

`FOREIGN_WAR_OUTCOME_EFFECTS` declares each outcome's refund effect; `foreignContractPhase.ts` now posts
the money for the outcomes whose `refund !== "NONE"` (CANCEL_WITH_SETTLEMENT, PHYSICALLY_IMPOSSIBLE,
IMPOUND), completing the code-review MEDIUM.

**Decision (`foreign_contract_settlement_v1`, recorded here — no ADR number taken to avoid colliding with
the concurrent ADR-0139/0140/0141 work):**

- **Direction/magnitude.** For a refund effect the BUILDER returns to the ORDERING nation the cumulative
  **paid** amount on the abandoned/impounded contract (builder OUTFLOW / ordering INFLOW), as one balanced
  posting pair. `unpaid` amounts are never returned.
- **Zero-paid forfeiture.** If nothing was paid, the outcome is a pure forfeiture and no money moves.
- **Affordability.** The compensation is clamped to the builder's available treasury, so the ledger never
  records a balance the obligation phase would later floor. The impoundment causal record stores the
  declared entitlement (`paidAmountUnits` / `compensationOrForfeiture`); the ledger stores the actual
  transfer, and an unaffordable shortfall is forfeited. Recorded rather than adding a persisted
  `settledAmountUnits` field.
- **Idempotency.** The money is posted only when the outcome's effect actually applies (the impoundment
  takes custody, or the refund outcome reaches its state); an `IMPOUNDED`/`CANCELLED` contract is terminal
  and is skipped on later months, so a settlement is posted exactly once.

Tests: `test/foreign-war-settlement.test.ts` (pure postings for each outcome, balanced ledger legs, the
monthly paid-impound transfer, and the one-month-only idempotency). `check:golden`/determinism unchanged
(no foreign contract in the reference run); no new persisted field.


