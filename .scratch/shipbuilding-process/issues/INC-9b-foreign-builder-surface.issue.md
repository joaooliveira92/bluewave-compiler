# INC-9b — Foreign builder selection surface (build dialog + impoundment/treaty display)

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R20, SB3-R23, SB3-R24) · **ADR:** none new
**Parent:** `INC-9-foreign-contract-capability-payment.issue.md` (engine slice landed)

> **Re-scoped (2026-10-13):** the surface was built on the **Construction screen's build dialog** (where the domestic
> batch dialog from INC-8b already lives), not on a separate screen. The earlier deferral ("being replaced by a new
> shipbuilding screen") was superseded: the Construction screen still hosts `BatchBuildDialog` and the design-workspace
> `RebuildPanel`, so the foreign-order surface belongs there. The engine path (INC-9/INC-17) and the war/impoundment
> slice (INC-10) were already complete; only the read-only preview and the UI were missing.

## What to build

The player surface for foreign construction: the **build dialog** offers foreign builders when no domestic yard fits
the hull (or by player choice), shows each builder's dock-size limit and current `NEW_CONSTRUCTION` availability, and
places the order through the INC-9 engine path (`placeForeignConstructionOrder`). A **contract panel** shows the
payment schedule, the one-month grace, the `PAYMENT_DEFAULT_DELAYED` reason, impoundment risk (tension-based) and
treaty-delivery status. Every readout displays a compiled/contract value; every control issues a command; no readout
invents data.

## Acceptance criteria

- [x] The build dialog lists candidate builders (domestic and foreign), each with the builder's dock-size ceiling and
      current available `NEW_CONSTRUCTION` capacity, and marks hulls that fit. — the `Builder` selector offers the
      nation's own yards plus every candidate from the engine's `previewForeignConstruction`; each option is marked
      `(unavailable)` when the §13.2 capability verdict fails. The `ForeignContractPanel` shows the dock ceiling, free
      capacity and fit.
- [x] Selecting a foreign builder previews the `ForeignConstructionContract` terms (quantity, price, payment/capacity
      schedules) and refuses a hull over the builder's dock limit for the same reason the engine returns
      (`FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT`). — the panel renders the engine's derived price, keel/delivery months
      and six-instalment payment schedule; an incapable builder shows `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT` (or
      `FOREIGN_BUILDER_CAPACITY_UNAVAILABLE`) and disables the order.
- [x] Ordering places the contract through `placeForeignConstructionOrder` behind the existing construction bridge
      contract; an order with no complete contract surfaces `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`. — the dialog
      confirms through `placeForeignConstructionCommand` (the INC-9/INC-17 command path, which derives terms
      server-side); an unknown quantity is refused with `FOREIGN_CONSTRUCTION_QUANTITY_INVALID`.
- [x] The contract panel shows the payment schedule, the shipped one-month grace, and the `PAYMENT_DEFAULT_DELAYED`
      delay reason while a project is in default, plus impoundment risk and treaty-delivery status (consuming
      INC-10/INC-11 readouts when they land). — the panel shows the schedule + the grace note; the construction readout
      now carries `delayReasonCode`, so a foreign row in default prints "payment default" instead of a generic
      "delayed" (`ProjectReadout`). Impoundment risk is the tension-scaled `impoundmentProbabilityBp`; the delivery
      guarantee is reported `none` (INC-10 recorded that no treaty/clause source exists yet, so it is never fabricated).
- [x] Display-vs-edit: each control issues a command; no readout invents data. — the preview command mutates nothing;
      the order queues an engine envelope; the panel authors no figure.
- [x] Desktop render test + `pnpm snap` of the dialog and the contract panel (screenshot + `aria.yaml`, console clean,
      no churn warning); the e2e path covers choose foreign builder → order → advance month. — `BatchBuildDialog.test.tsx`
      (foreign cases), `ForeignContractPanel.test.tsx`, `e2e/construction-foreign.spec.ts` (passing), and a `pnpm snap`
      of the dialog with `Builder = French Republic` (dock ceiling 12,000,000 kg, free capacity 15,940,000 kg, fits yes,
      impoundment 0.0 %, guarantee none, `1 × 102 = 102` total, reserves 9,500,000 kg in 1880-01, one month of grace;
      console `structural=0`, no warning).

## Implementation

- **Engine read-only preview** (`packages/phase-engine/src/foreignBuilderPreview.ts`,
  `previewForeignConstruction`): resolves every candidate builder's dock ceiling, free `NEW_CONSTRUCTION` capacity,
  §13.2 capability verdict, field-tagged failures, tension-scaled impoundment risk and delivery-guarantee status, plus
  the contract terms for a chosen builder. It reuses the exact derivation the order path uses
  (`resolveOrderTargets`, `builderDockRecord`, `nationalConstructionCapacity`, `foreignBuilderCommittedMassKg`,
  `resolveForeignBuilderCapability`, `deriveForeignContractTerms`), so the dialog and the command agree. Pure,
  deterministic, no mutation. Exported from `@bluewave/phase-engine`.
- **Bridge command** `previewForeignConstructionCommand` (shared contract + `campaign-command-contract` overload +
  `campaignCommandSchemas` + `campaignBridge` + `commands/constructionCommands.ts`): read-only, SESSION_NOT_FOUND-safe,
  returns the engine's own refusal reason.
- **Renderer**: `useConstructionScreen` gains `previewForeign`/`placeForeignOrder`; `BatchBuildDialog` gains the
  builder selector and routes confirm to the domestic or foreign command; the new `ForeignContractPanel` component
  renders the terms/risk/guarantee. `ProjectReadout` prints the payment-default reason from the readout's new
  `delayReasonCode`.
- **Tests**: `packages/phase-engine/test/foreign-builder-preview.test.ts` (5), `campaignBridge.test.ts` foreign
  describe (4), `BatchBuildDialog.test.tsx` foreign describe (3), `ForeignContractPanel.test.tsx` (3),
  `e2e/construction-foreign.spec.ts` (1).

## Notes for implementator

The engine slice (`ForeignConstructionContract`, `placeForeignConstructionOrder`, builder-capability predicates,
`resolveForeignPaymentMonth`/`advanceForeignContractMonth`, reason codes) was already in `@bluewave/phase-engine` /
`@bluewave/ship-design`. One component per file under the construction screen's `components/`; re-exported from the
barrel. Follows the renderer conventions in AGENTS.md and stays consistent with the other construction panels. Part of
WS5.
