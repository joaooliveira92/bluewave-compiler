# 05: Plants, armour materials, ammunition, sensors and fittings through the read path (P1)

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no
**Requirements:** SPM-R1 (families), SPM-R13, SPM-R14, SPM-R19, SPM-R20 (remaining rows, in memory only) · Stories 10, 11, 30

## What to build

The remaining part families compile through the read path. This ticket runs in
parallel with ticket 04 (torpedo launchers), which owns the 28 tube placements. The
adapter translates:

- propulsion plants → **parametric** parts, with installed power as a parameter;
- armour materials (taken out of the balance tables) → parts with dates, technology and
  efficiency, accepted by armour-region slots;
- ammunition, sensors and fittings → parts.

Draft machinery and armour regions become loadout entries. The existing compile stages
(arrangement, topside, arcs, magazines, fire control, weights, stability, cost,
construction) consume the resolved entries with unchanged meaning.

## Acceptance criteria

- [x] All remaining non-gun, non-torpedo part families compile through the new path for
      all 91 reference designs. Together with tickets 03 and 04, this covers all 823
      placements; ticket 08 checks the aggregate.
- [ ] Fit-validation fixtures from ticket 06 are extended to these families (plant power
      parameter, armour-region acceptance, ammunition nested in a mount).
      *(Transferred to ticket 06, as ticket 04's launcher fixtures were: the fit stage does
      not exist yet. The inputs do; see Comments.)*
- [x] Displacement, the ledger, machinery, speed and range, protection, stability, cost
      and construction match the legacy path exactly for every design. The spot-checks
      here are the per-family suites; ticket 08 provides the full comparison.
- [x] Armour-material availability and efficiency come from the part, not a balance-table
      key, and give the same values as today.
- [x] Production content and every golden are unchanged.

## Comments

- 2026-10-14: Implemented in ship-design. The new adapters are `fittingPartAdapter.ts`,
  `plantPartAdapter.ts`, `armourPartAdapter.ts` and `ammunitionPartAdapter.ts`, plus the
  shared formula reader `legacyComponentQuantities.ts`. Tests are in
  `test/remainingFamiliesReadPath.test.ts` (54). The durable rule is ADR-0154 §15.
  - **Fittings and sensors.** The nine non-weapon components become parts that keep their
    component ids. The interface comes from a closed category map (§8.1), with the
    `funnel`/`ventilation` tag deciding `SPECIAL_EQUIPMENT`. All 565 placements are one
    entry each in a `<zone>.<interface>` slot. 230 + 28 + 565 = 823.
  - **Quantities.** Mass, cost, crew, volume and footprint are read from the legacy
    formulas by basis (ADR-0154 §15). The quarters' `blocks` becomes `mountCount`. For all
    565 placements, every value the compile stages read equals the legacy resolved
    placement. The guns' crew, volume and footprint are now `PER_CONTAINED_UNIT` on the
    mount, and the launchers' are `PER_PART_UNIT`. All 230 gun and 28 tube placements
    match the legacy resolved values. Tickets 03–04's suites still pass.
  - **Plants** are parametric parts (`installedKw`, `minKw`–`maxKw`, step 1) with no
    quantity components. They read back to the exact legacy plant records. Each
    machinery plan becomes one `<zone>.propulsion_plant` entry with `params.installedKw`.
  - **Armour materials** come out of `balance.yaml` as 8 parts. Each region is an
    `armour.<region>` entry with its plate `shape`. Material options and availability
    findings from the parts equal today's across the boundary months. Compound is
    obsolete from 1889-01 in both representations.
  - **Whole designs.** For all 91 designs, the machinery and armour rebuilt from entries
    equal the draft. `compileDesign` with plants and the armour balance taken from parts
    gives the same hash. Every design's full loadout (guns, tubes, fittings, plant and
    armour) decodes through `LoadoutSchema` on its platform.
  - **Ammunition.** The six patterns become national `ammunition` parts. Each reads back
    to exactly the resolver's `AmmunitionPattern`. `compatibleGunFamilies` stays adapter-side.
  - **Diagnostics.** Read failures are coded and kept, never dropped. Examples:
    `PART_READ_PATH_NONLINEAR_QUANTITY`, `…_PARAMETER_DEPENDENT_QUANTITY`,
    `…_INVALID_QUANTITY`, `…_FORMULA_ERROR`, `…_NO_INTERFACE`, `…_MULTIPLE_PARAMETERS`,
    `…_INVALID_SPEC`, `…_INVALID_LIFECYCLE`, `…_INVALID_COUNT`,
    `…_NO_MATERIAL_AVAILABILITY`, `…_UNSUPPORTED_MAX_THICKNESS` and
    `…_INVALID_ARMOUR_SHAPE`. None occurs in production content.
- **Transferred to ticket 06 (fit fixtures).** The fit stage does not exist yet. The
  inputs do: the plant's `installedKw` parameter and the entry's `params.installedKw`,
  and the `armour.<region>` slots. For "ammunition nested in a mount", the ammunition
  parts exist, but today's gun mount parts declare only a `guns` slot, and the gun
  entries nest no ammunition. The resolver still selects ammunition by the legacy rule
  (`armamentAmmunitionFor`). The fixture must hand-build the mount's `ammunition` slot.
- **Found, handed to tickets 08 and 11.** Ticket 03's gun entries do not carry the
  placement's `rounds` (ammunition stowage per gun, read by the weapons stage) or its
  `magazineRef`. A `feedsFrom` slot id cannot name one magazine when a zone has two.
  Ticket 08's candidate pipeline and ticket 11's codemod need a representation for
  both. The same applies to the adapter-side facts in ADR-0154 §15.
- **Risk.** Gun and launcher crew, volume and footprint are read from the base
  component. A test pins that no national override touches a quantity formula today.
