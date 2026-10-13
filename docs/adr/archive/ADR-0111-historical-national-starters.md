# ADR-0111: Promote canonical historical ships to national capital starters

## Status

Accepted (2026-10-11). Amends ADR-0108 and ADR-0110.

## Context

ADR-0108/ADR-0110 gave the eleven nations beyond uk/france/germany six
`DOCTRINE_TEMPLATE` opening starters each. For italy, russia and ottoman_empire
the capital (B) starter was byte-identical to the UK `alexandra_1877` draft apart
from `nationId`, so those three nations began with a British ship under a local
name.

The ship-building tree already carried canonical `HISTORICAL_RECONSTRUCTION`
references for exactly those nations — `principe_amedeo_1874`, `petr_velikiy_1876`
and `mesudiye_1875` — but only as regression fixtures, never offered as starters.
Sourcing new ships would have duplicated data the repository already held.

## Decision

1. **Promote the existing canonical design.** Each of the three historical
   designs gains `starterFor: B` and becomes the nation's capital starter; the
   cloned `starter_b_*` doctrine template is deleted. There is one authoritative
   representation per ship, not a divergent starter copy.
2. **Classify it honestly.** The classification map (now
   `packages/ship-design/test/helpers/referenceClassifications.ts`, shared by the
   completeness gate and the promotion test) marks each as
   `HISTORICAL_RECONSTRUCTION`.
3. **Correct only what makes the promotion truthful.** `ottoman_empire` now
   imports `gun_rml_7in_7ton` (Armstrong) for Mesudiye's documented 178 mm
   secondary; `russia`'s Petr Velikiy uses the domestic Obukhov 12-in
   (`gun_rml_12in_25ton`) named in its profile, replacing an out-of-capability
   British 12-in catalogue proxy. No nation's domestic ceiling was raised.
4. **Leave unrepresentable candidates unchanged** rather than substitute a
   distinct weapon (see Consequences).

## Alternatives considered

- **Author new historical designs for every candidate.** Rejected: the shared
  catalogue lacks the ordnance those ships carried, and mapping a numerically
  close but distinct family would be a false substitution.
- **Keep a starter copy separate from the historical reference.** Rejected: two
  definitions drift; the repository has no reference mechanism, so the smallest
  coherent change is to make the canonical design the starter.
- **Raise the importing nations' `maxGunCaliberUm`.** Rejected: the foreign guns
  are imports; the profile already carries an import mechanism, and the single
  `maxGunCaliberUm` field must not be inflated to admit them.

## Consequences

- italy, russia and ottoman_empire now begin with nationally distinct capital
  ships; uk/france/germany content is untouched.
- Reference designs sit outside `pack.json`, so the compiled pack content hash
  and existing saves are unaffected; the ship-building environment is loaded
  separately (`docs/agents/repo-map.md`).
- **Deferred (recorded, not dropped).** These candidates stay
  `DOCTRINE_TEMPLATE` because the catalogue lacks the required family:
  Netherlands *Matador* (283 mm Krupp), Portugal *Vasco da Gama* (149/67 mm
  Krupp secondary), Brazil *Sete de Setembro* (Whitworth 300-pdr RML), Japan
  *Fusō* (235/173 mm Krupp), Spain *Numancia*/*Vitoria* (Armstrong 300-pdr RML,
  distinct from the catalogue 10-in 18-ton; 320 mm Hontoria), Qing *Wei Yuen*
  (121 mm Armstrong BLR), USA *Canonicus*/*Trenton* (Dahlgren smoothbores / 8-in
  MLR — mapping a smoothbore onto rifled RML ballistics is prohibited), and
  Austria-Hungary *Kaiser Max* (209 mm G L/20 C.68). A future pass adds these
  families and can separate the domestic production ceiling from the largest
  obtainable imported equipment.