# INC-9b — Foreign builder selection surface (build dialog + impoundment/treaty display)

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** INC-9
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R20, SB3-R23, SB3-R24) · **ADR:** none new
**Parent:** `INC-9-foreign-contract-capability-payment.issue.md` (engine slice landed)

## What to build

The player surface for foreign construction: the **build dialog** offers foreign builders when no domestic
yard fits the hull (or by player choice), shows each builder's dock-size limit and current
`NEW_CONSTRUCTION` availability, and places the order through the INC-9 engine path
(`placeForeignConstructionOrder`). A **contract panel** shows the payment schedule, the one-month grace,
the `PAYMENT_DEFAULT_DELAYED` reason, impoundment risk (tension-based) and treaty-delivery status. Every
readout displays a compiled/contract value; every control issues a command; no readout invents data.

## Acceptance criteria

- [ ] The build dialog lists candidate builders (domestic and foreign), each with the builder's dock-size
      ceiling and current available `NEW_CONSTRUCTION` capacity, and marks hulls that fit.
- [ ] Selecting a foreign builder previews the `ForeignConstructionContract` terms (quantity, price,
      payment/capacity schedules) and refuses a hull over the builder's dock limit for the same reason the
      engine returns (`FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT`).
- [ ] Ordering places the contract through `placeForeignConstructionOrder` behind the existing
      construction bridge contract; an order with no complete contract surfaces
      `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`.
- [ ] The contract panel shows the payment schedule, the shipped one-month grace, and the
      `PAYMENT_DEFAULT_DELAYED` delay reason while a project is in default, plus impoundment risk and
      treaty-delivery status (consuming INC-10/INC-11 readouts when they land).
- [ ] Display-vs-edit: each control issues a command; no readout invents data.
- [ ] Desktop render test + `pnpm snap` of the dialog and the contract panel (screenshot + `aria.yaml`,
      console clean, no churn warning); the e2e path covers choose foreign builder → order → advance month.

## Notes for implementator

The engine slice (`ForeignConstructionContract`, `placeForeignConstructionOrder`, builder-capability
predicates, `resolveForeignPaymentMonth`/`advanceForeignContractMonth`, reason codes) is already in
`@bluewave/phase-engine` / `@bluewave/ship-design`. One component per file under the construction screen's
`components/`; re-export from the barrel. Follow the renderer conventions in AGENTS.md and keep the
surface consistent with the other construction panels. This is part of WS5.
