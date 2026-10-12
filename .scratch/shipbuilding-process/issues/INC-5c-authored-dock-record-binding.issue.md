# INC-5c — Authored per-nation dock record + order-time dock-ceiling enforcement

**State:** RESOLVED · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R15) · **ADR:** ADR-0135 (authored national dock record)

## What to build

Bind INC-5's `DockRecord`/`newConstructionDockEligibility` model (`@bluewave/ship-design` `dock.ts`) into the
construction-order path, so a domestic order over the nation's dock ceiling fails with
`SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`.

## Why it is deferred (not dropped)

INC-5 first wired the ceiling from the national profile's industrial `maxPracticalDisplacementKg`, but that is a
**production-capacity** figure, not a dock limit: at 1880 it is 10,000 t for the UK while the reference design
`des_gbr_inflexible` is 10,886 t (a real Royal Navy ship, built domestically). The wiring therefore refused a
legitimate order and was reverted.

## Acceptance criteria

- [ ] Each nation authors a `dock` record (`maximumNewConstructionMassKg`, `maximumMajorRepairMassKg`,
      `maximumRebuildMassKg`, `maximumConversionMassKg`, dimension predicate) distinct from
      `maxPracticalDisplacementKg`, with provenance (no invented values).
- [ ] `constructionOrderEligibility` rejects a domestic order over the authored ceiling with
      `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`; foreign orders route through the foreign-yard contract (SB3-R20).
- [ ] A test proves a real domestic reference design still orders while a too-large one is refused.
- [ ] The dock record round-trips through save/load (INC-5's persistence AC, carried here because the record
      enters campaign state with this ticket).

## Notes for implementator

The domain model and eligibility function are done and tested (`packages/ship-design/src/dock.ts`,
`packages/ship-design/test/dock.test.ts`). This ticket is the content + binding only.

## Answer

The per-nation dock record is authored and bound into the order path (ADR-0135).

- `NationNavalProfile` + the content schema gain a `dock` block (four explicit mass limits, optional
  dimension predicate, provenance). Authored in all 14 naval profiles, grounded in
  `docs/research/1880-national-dock-capacity.md` (largest hull each nation fields, rounded up to the
  next 1,000 t; the scenario starter is the binding hull for seven nations).
- `dockRecordFromCeiling` (implicit copy across limits) is **removed**; `dockRecordFromDefinition`
  reads each limit explicitly and `dockRecordFor(profile)` projects the authored block (DESIGN-16 §4.1
  "MUST NOT copy another limit implicitly").
- `constructionOrderEligibility` refuses a domestic order over the dock with
  `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT` (and `DOCK_LIMIT_MISSING` for an incomplete dock); the per-yard
  fit is unchanged.
- Persistence: `NationState` gains an optional `dock` (plain numbers); it overrides the content dock
  when present. Round-trip pinned in `packages/persistence/test/nation-dock-roundtrip.test.ts`.
- `validateNationCompleteness` fails an opening design over its nation's dock
  (`NATION_STARTER_EXCEEDS_DOCK`).
- Tests: `packages/phase-engine/test/order-dock.test.ts` proves a real UK reference hull (12,679 t)
  orders and an oversized hull (13,000,001 kg) is refused; `dock.test.ts` pins the no-copy rule.

Commands: `@bluewave/ship-design` `vp test run` (dock/nationProfile/nationCompleteness/historicalStarters
160 passed); `@bluewave/phase-engine` `vp test run test/order-dock.test.ts test/construction-order.test.ts
test/ship-type-enforcement.test.ts` (42 passed); `@bluewave/persistence` `vp test run
test/nation-dock-roundtrip.test.ts` (1 passed); all `tsc --noEmit` clean.
