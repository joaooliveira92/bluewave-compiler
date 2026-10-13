# 05: Plants, armour materials, ammunition, sensors and fittings through the read path (P1)

**Type:** implementation
**Status:** open
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

- [ ] All remaining non-gun, non-torpedo part families compile through the new path for
      all 91 reference designs. Together with tickets 03 and 04, this covers all 823
      placements; ticket 08 checks the aggregate.
- [ ] Fit-validation fixtures from ticket 06 are extended to these families (plant power
      parameter, armour-region acceptance, ammunition nested in a mount).
- [ ] Displacement, the ledger, machinery, speed and range, protection, stability, cost
      and construction match the legacy path exactly for every design. The spot-checks
      here are the per-family suites; ticket 08 provides the full comparison.
- [ ] Armour-material availability and efficiency come from the part, not a balance-table
      key, and give the same values as today.
- [ ] Production content and every golden are unchanged.
