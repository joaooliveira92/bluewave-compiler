# 37: Lightweight propulsion model for 1880 torpedo craft

**Type:** decision + implementation
**Status:** open
**Blocked by:** none
**Frontier:** yes

Source: the January-1880 reference-design pass (`docs/research/ship-building-1880-ships-by-nation.md`). The only propulsion
plant available in 1880 is `compound_cylindrical` (195 kg/kW), so a ~28 t first-class torpedo boat (e.g. HMS TB2, 460 ihp,
20 kn) cannot be modelled: the plant alone weighs ~58 t at its 300 kW minimum, more than the whole boat. Every 1880 torpedo
boat in the research (UK TB2/Lightning, French N°27, German Ulan, Austro-Hungarian III/IV) is therefore absent from the
reference set. This is a modelling gap, not a missing content entry.

## Acceptance criteria

- At least one propulsion configuration appropriate for ~25–80 t torpedo craft (a locomotive-boiler/compound set),
  introduced no later than 1880-01 and available in the January 1880 campaign.
- Validate the complete machinery mass (engines + boilers + water + auxiliaries), not merely engine mass, against the
  hull's displacement budget.
- The new plant must not be exploitable by larger classes (a `maxKw`/mass penalty that makes it unattractive above
  torpedo-craft size), and must not let a battleship buy cheap power.
- Add one historically grounded torpedo-boat reference design (e.g. HMS TB2 class, 1879) that is valid at 1880-01.
- The design classifies as DD (or the intended small-combatant class) with no BLOCKING/CRITICAL finding and no negative
  mass margin.
- Source the plant's mass and fuel curve to a primary/near-primary source (White 1894 machinery table is the lead; its
  "single large locomotive boiler, first-class torpedo boat 1890-93" row is 43–49 kg/kW) or record the estimate.

## Comments

- 2026-10-10 created from the January-1880 reference-design review.
