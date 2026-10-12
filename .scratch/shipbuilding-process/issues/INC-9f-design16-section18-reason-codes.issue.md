# INC-9f — DESIGN-16 §18 required foreign reason codes

**State:** open · **Frontier:** yes · **Blocked by:** INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R20, SB3-R22) · **ADR:** possible naming decision (see below)
**Parent:** `INC-9-foreign-contract-capability-payment.issue.md`

## What to build

DESIGN-16 §18 (`docs/rules/bases-and-infrastructure.md:584-607`) is a **MUST** list of reason codes. INC-9
implemented the mechanics but shipped two of the required names differently; reconcile them.

- **`FOREIGN_BUILDER_CAPACITY_UNAVAILABLE`** is required by §18 but INC-9 collapses a capacity-predicate failure
  into `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT` (`packages/ship-design/src/foreignConstruction.ts`,
  `FOREIGN_BUILDER_CAPABILITY_FIELDS` `CAPACITY`). Emit the §18 code for the capacity failure specifically (the
  other capability predicates keep `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT`).
- **`FOREIGN_CONTRACT_PAYMENT_DEFAULT`** is required by §18, while DESIGN-16 §13.4 and the sprint spec SB3-R22 use
  the phrase `PAYMENT_DEFAULT_DELAYED`; INC-9 shipped `PAYMENT_DEFAULT_DELAYED`. This is a genuine
  canonical-contract ambiguity: define a deterministic resolution (e.g. `FOREIGN_CONTRACT_PAYMENT_DEFAULT` as the
  canonical reason code with `PAYMENT_DEFAULT_DELAYED` as a documented alias, or the reverse), record it as a
  decision (ADR if it is a rule-shape change), and use exactly one code in state/events.

The other §18 foreign codes (`FOREIGN_CONTRACT_IMPOUNDMENT_NOT_AUTHORIZED`, `DELIVERY_GUARANTEE_ACTIVE`,
`FOREIGN_CONTRACT_PHYSICALLY_IMPOSSIBLE`, `FOREIGN_CONTRACT_DELIVERY_DELAYED`) belong to INC-10; add them there,
not here.

## Acceptance criteria

- [ ] `FOREIGN_BUILDER_CAPACITY_UNAVAILABLE` is emitted for a capacity-predicate failure; tests updated.
- [ ] The payment-default reason is reconciled with §18 under one documented decision, with tests.
- [ ] No other §18 code is left undefined once INC-10 lands (coordinate; do not duplicate).
- [ ] `pnpm check:golden` and `pnpm check:determinism` unchanged for runs with no foreign contracts.

## Notes for implementator

Naming/reason-code reconciliation, not new mechanics. If the §18 name and the §13.4 name must both exist, make
one an explicit alias constant and document which is canonical in the ADR/decision record. Do not silently pick
one (that is what the standards review flagged).
