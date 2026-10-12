# INC-5c — Authored per-nation dock record + order-time dock-ceiling enforcement

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R15) · **ADR:** none (content + binding of an existing rule)

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
