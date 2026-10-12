# INC-17 — Foreign-order command must derive contract terms server-side

**State:** deferred · **Frontier:** no · **Blocked by:** INC-9b (owns the builder-flow + terms derivation)
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R20) · **ADR:** none yet
**Origin:** the shipbuilding-sprint code review (spec axis, HIGH).

## The finding

The reachability wiring for `placeForeignConstructionOrder` added an `OrderForeignConstruction` command and a
desktop IPC `placeForeignConstructionCommand` whose wire payload carries `terms` and `capability` as opaque
values (`Schema.Unknown`). `applyOrderForeignConstruction` defaults `capability` to the all-true
`FOREIGN_BUILDER_CONDITIONS_SATISFIED`, and `buildForeignConstructionContract` copies `totalPriceUnits`,
`totalWorkPerUnit` and the payment schedule verbatim from `terms`. The engine recomputes only the DOCK and
CAPACITY predicates. A compromised/untrusted renderer could therefore fabricate a cheap price, a favourable
schedule, or every capability boolean.

`placeForeignConstructionOrder`'s own contract is a pure function that takes caller-resolved terms (INC-9's
posture); the defect is that the **command/IPC boundary trusts the renderer** for values the engine should
derive from authoritative content (`@bluewave/ship-design` naval profiles, the compiled design's projected
cost, the builder's capability). No production renderer control exists yet (INC-9b), so the path is currently
reachable only from tests/e2e.

## What to build (when INC-9b lands)

- A pure, content-grounded terms builder (price from `projectedConstructionOrderCosts` + the builder's
  declared price policy; schedule from a versioned instalment policy; capability booleans resolved from the
  builder's technology/licence/treaty/component state), owned by the engine or desktop main.
- The IPC payload should carry only what the player chooses (design, builder, quantity, maybe delivery
  month); the server derives `terms` and `capability`.
- If any client-supplied field must remain, validate it against the derived value and reject a mismatch with a
  stable reason (never silently accept a fabricated contract).

## Acceptance criteria

- [ ] `terms`/`capability` are derived server-side from authoritative content, not accepted from the renderer.
- [ ] A fabricated `totalPriceUnits`/schedule/capability payload is rejected (test).
- [ ] Golden/determinism unchanged (no foreign contract in the reference run).

## Decision (orchestrator, 2026-10-12)

The derivation is owned by the **engine** (it already holds `content` + `snapshot`). The pure policy
`placeForeignConstructionOrder(snapshot, {…terms, capability}, content)` is left **unchanged** (INC-9
posture; caller-resolved), so its tests are untouched. Only the command boundary changes:

- **Command body carries player choices only** (`packages/commands/src/envelope.ts`):
  `{ type, nationId, designVersionId, builderNationId, quantity, plannedDeliveryMonth? }`. `terms` and
  `capability` are removed.
- **Desktop wire schema** (`campaignCommandSchemas.ts`) keeps only those fields and decodes with
  `onExcessProperty: "error"`, so a renderer payload carrying `terms`/`capability` is rejected at the IPC
  boundary (`INVALID_PAYLOAD`). A dedicated strict decoder is used only for this command.
- **Engine** (`applyOrderForeignConstruction`): derives `terms` via `deriveForeignContractTerms` and
  `capability` via `resolveForeignBuilderCapability` (new pure helpers in
  `packages/phase-engine/src/foreignTerms.ts`). If a command body still carries `terms`/`capability`
  (runtime excess), it is refused with the new stable code
  `FOREIGN_CONTRACT_TERMS_NOT_ACCEPTED` — nothing is written.
- **Terms** (BALANCE TARGET where the manual gives no formula):
  - `projected = projectedConstructionOrderCosts(design, builderCostMultiplierBp)` where the multiplier is
    the **builder's** resolved `resolveNationalConstruction` cost modifier (the builder builds the hull),
    resolved through `resolveBuilderConstructionSupply`, which fails closed (no throw) when the builder
    cannot obtain its armament/armour.
    `totalWorkPerUnit = projected.projectedCost`; `totalPriceUnits = totalWorkPerUnit × quantity` so
    payment, the capacity reservation and the project's stored work all agree.
  - schedule per versioned policy `foreign_instalment_policy_v1`: `FOREIGN_INSTALMENT_COUNT = 6` equal
    monthly instalments starting at the authorization month; work shares sum exactly `10_000`; amounts sum
    exactly `totalPriceUnits` (largest-remainder split, integer-only).
  - `authorizationMonth` = the campaign month; `plannedKeelMonth` = authorization month;
    `plannedDeliveryMonth` = the player's choice when it is a valid `YYYY-MM` at or after the last due
    month, else authorization + (`FOREIGN_INSTALMENT_COUNT` − 1) months.
  - `builderShipyardId` = `yard:<builderNationId>` (a stable national yard id; the campaign models one
    national yard per nation). Duplicate-free by construction.
  - **Deferral:** a foreign contract still produces a single dockyard project; delivering `quantity`
    distinct hulls (and the naming/reservation split that implies) is owned by INC-9b (foreign builder
    flow surface).
- **Capability** (grounded, fail-closed):
  - `shipyardCapabilitySatisfied` = the builder's dock record resolves (materialised or profile).
  - `requiredTechnologySatisfied` = the design's ship type is not in the builder profile's
    `hardCapabilities.restrictedShipTypes` (and the profile resolves).
  - `componentSourcingSatisfied` = the builder profile resolves a construction environment.
  - `governmentPermissionSatisfied` = the ordering↔builder relation is not `at_war`.
  - `physicallyCapable` = the ordering↔builder relation is not `at_war` (occupation not modelled — a
    recorded deferral carried by INC-10's war-effects owner).
- **Quantity**: integer `1..12`; outside the range the engine refuses with
  `FOREIGN_CONSTRUCTION_QUANTITY_INVALID`.
- **Golden/determinism**: no foreign contract exists in the reference run, so goldens are unchanged; no new
  persisted fields (the contract fields already persist).
