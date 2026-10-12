# INC-5 — National dock ceiling

**State:** RESOLVED (engine + domain core; UI readout split to INC-5b) · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R15) · **ADR:** none new (DESIGN-16 §4 shipped)

## What to build

Give each nation a dock record with mass ceilings and a dimension predicate, and reject a domestic new
construction whose displacement exceeds the ceiling — the manual's "you cannot build ships larger than
your current dock size". This is the first half of the manual's dock mechanic (expansion follows in
INC-6, the capacity cap in INC-7).

## Acceptance criteria

- [ ] A nation dock record carries `maximumNewConstructionMassKg`, `maximumMajorRepairMassKg`,
      `maximumRebuildMassKg`, `maximumConversionMassKg` and a ship-dimension predicate; a missing limit
      fails rather than being copied from another.
- [ ] Domestic new construction is eligible only when compiled displacement `≤` the new-construction
      ceiling, the dimension predicate passes, the dock/shipyard are operational, technology/capability
      are present, and capacity can be reserved; otherwise it fails with
      `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`.
- [ ] The existing per-yard length/beam/displacement/crane fit (SB-1) is unchanged and composes with the
      national ceiling; both must pass.
- [ ] The Construction screen shows the nation's dock size (max build displacement) as a compiled value.
- [ ] Tests: unit (at/over the mass limit; dimension predicate); boundary (exactly at the limit);
      persistence (dock limits round-trip); `pnpm snap` of the readout.

## Notes for implementator

Nation-level dock record in the `@bluewave/ship-design`/campaign model, composed with the per-yard
`Yard` model. The manual gives no numbers for a 1880 nation's dock — carry the ceiling as a versioned
`balance.yaml` value with provenance.

## Answer

Engine + domain core landed; the Construction readout is split to **INC-5b** (UI needs a captured screen).

- `@bluewave/ship-design` gains `dock.ts` (DESIGN-16 §4): `DockRecord` with the four mass ceilings, a
  ship-dimension predicate, `DOCK_LIMIT_MISSING` (a missing limit fails, never copied) and
  `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`; `dockRecordFromCeiling` projects the nation's authored
  `maxPracticalDisplacementKg` onto the record; `newConstructionDockEligibility` composes with the per-yard fit.
- The order path (`constructionOrderEligibility`) now refuses a domestic order whose compiled displacement
  exceeds the nation's ceiling with `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`; the per-yard `YardDemand` fit is unchanged.
- Tests: `dock.test.ts` (unit + boundary at the ceiling, missing limit, dimension predicate) and a
  `construction-order` order-path rejection test.
- Deferred: the Construction screen readout + `pnpm snap` → **INC-5b** (recorded, not dropped).

Commands: `@bluewave/ship-design` `vp test run test/dock.test.ts` (6 passed) + `tsc -b`; `@bluewave/phase-engine`
`vp test run` (315 passed) + `tsc --noEmit`.
