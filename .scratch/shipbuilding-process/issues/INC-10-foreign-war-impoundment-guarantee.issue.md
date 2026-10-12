# INC-10 — Foreign war effects + impoundment + delivery guarantee

**State:** READY_FOR_AGENT · **Frontier:** no · **Blocked by:** INC-2, INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R23) · **ADR:** none new (DESIGN-13 §13.6–13.7, §14 shipped; tension predicate is a PLACEHOLDER constant)

## What to build

Resolve a foreign contract's fate when war breaks out: continue, delay, suspend, impound, cancel or
physically impossible — with tension-scaled impoundment risk, the `IMPOUNDED` status carrying the hull,
and a treaty delivery guarantee that blocks discretionary impoundment — the manual's "you risk that
your ships will be impounded … if you have a treaty … always delivered".

## Acceptance criteria

- [ ] At war entry involving the ordering nation, builder nation or builder's controller, the contract
      evaluates `foreign_contract_war_policy_v1` to exactly one of `CONTINUE`, `DELAY`, `SUSPEND`,
      `IMPOUND`, `CANCEL_WITH_SETTLEMENT`, `PHYSICALLY_IMPOSSIBLE`. Each outcome defines payment, work,
      capacity, incomplete-hull ownership, refund and delivery effects.
- [ ] Impoundment transfers custody per §13.7, records a causal record (authorizing predicate,
      custody, title, paid/unpaid, compensation, status, future delivery), and is carried by the
      `IMPOUNDED` project status; discretionary impoundment without a policy result fails with
      `FOREIGN_CONTRACT_IMPOUNDMENT_NOT_AUTHORIZED`.
- [ ] A valid treaty/contract delivery guarantee (§14) prohibits discretionary `IMPOUND` but never
      overrides `PHYSICALLY_IMPOSSIBLE`.
- [ ] The tension → impoundment policy-predicate values are a versioned `balance.yaml` PLACEHOLDER
      constant (the manual gives no formula).
- [ ] UI: the foreign-order flow discloses impoundment risk (tension-based) and treaty-delivery status.
- [ ] Tests: unit (each outcome; guarantee blocks discretionary impound but not physical impossibility);
      determinism (policy predicate keyed/stable); `pnpm snap` of the risk disclosure.

## Notes for implementator

Depends on the full status model (INC-2, `IMPOUNDED`) and the contract (INC-9). The policy predicate
must be a typed keyed decision, never inferred.
