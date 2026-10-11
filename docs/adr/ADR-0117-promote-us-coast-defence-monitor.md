# ADR-0117: Promote the US coast-defence monitor and model smoothbore ordnance

## Status

Accepted (2026-10-11). Follows ADR-0111 and ADR-0116.

## Context

ADR-0116 made slow, belted, heavy-gun coast-defence ships classifiable as
capital (B) in the 1880 scenario. The United States candidate, the Civil-War
monitor *Canonicus* (in service 1880), is the best-grounded of the ADR-0114 set:
its 381 mm (15-in) Dahlgren smoothbore's bore, 43,000 lb gun mass, 330 lb proof
projectile and 50/35/60 lb black-powder charges are read from the 1866 US Navy
*Ordnance Instructions* (`docs/research/ship-building-1880-coast-defence-armament.md`
§2.5). The USA capital starter was a British doctrine clone (`starter_b_usa_1880`,
cloned from `alexandra_1877`), and the USA profile mapped the 15-in smoothbore
onto the rifled-RML family `gun_rml_16in_80ton` — exactly the smoothbore-onto-
rifled substitution ADR-0114 forbade.

## Decision

1. **A dedicated smoothbore family.** Add `gun_sb_15in_dahlgren` (family +
   matching `components.yaml` component, `MAIN_GUN`) and re-point the USA
   profile's `us_dahlgren_15in` overlay at it. It is a smoothbore: its rate of
   fire is deliberately far below a rifle of comparable bore and it never
   inherits rifled-RML ballistics. A test pins both facts.
2. **Promote the canonical design.** `canonicus_1879` gains `starterFor: B` and
   becomes the USA capital starter; the cloned `starter_b_usa_1880` is deleted
   (one authoritative representation). It is classified
   `HISTORICAL_RECONSTRUCTION` in the shared map and added to
   `HISTORICAL_B_STARTERS`.
3. **Correct only what makes it truthful.** Dimensions, 127 mm side / 254 mm
   turret wrought iron, 8 kn and 145 t coal follow
   `ship-building-1880-ships-by-nation.md` §6.5. The design threat is a 6-in
   class (`qf_6in`), not the 10-in line-of-battle threat: a coast-defence
   monitor's 5-in belt genuinely cannot defeat a 10-in RML, so the armour is
   reported honestly rather than thickened to pass the gate.

## Alternatives considered

- **Keep the smoothbore on the rifled RML family.** Rejected (ADR-0114): a false
  mechanism.
- **Thicken the belt to 6 in to pass the 10-in protection gate.** Rejected: it
  falsifies the ship's armour.
- **A new `CD` ship type.** Deferred (ADR-0116); the ruleset decision admits the
  ship without a gameplay-facing type.

## Consequences

- The USA now begins with a canonical coast-defence monitor; the 15-in Dahlgren
  is a real smoothbore family.
- Reference designs sit outside `pack.json`, so the compiled pack hash is
  unchanged; `shipBuildingContentHash` changes (a non-fatal replay-divergence
  warning per ADR-0113 §4).
- **Still deferred (recorded, not dropped).** The remaining ADR-0114 candidates
  need ordnance the shared catalogue does not yet model and are not promoted:
  netherlands *Matador* (283 mm Krupp), portugal *Vasco da Gama* (263 mm Krupp —
  an exact match to `gun_bl_263mm_rkl20` but needs a CASEMATE mount — plus
  149/67 mm Krupp), brazil *Sete de Setembro* (Whitworth 9-in/229 mm 300-pdr
  RML), japan *Fusō* (235/173 mm Krupp), spain *Numancia*/*Vitoria* (254 mm
  Armstrong 300-pdr), qing *Wei Yuen* (160/121 mm Armstrong; belt 0 — cannot be
  a B), austria_hungary *Kaiser Max* (209 mm G L/20 C.68). Each needs one or more
  well-sourced families (`docs/research/ship-building-1880-coast-defence-armament.md`
  labels which are author-ready and which stay ESTIMATE); *Wei Yuen* and US
  *Trenton* (belt 0, unarmoured) can never be B.
