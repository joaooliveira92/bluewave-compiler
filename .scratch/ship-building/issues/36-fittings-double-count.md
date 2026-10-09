# 36: Hull weight and fitting components may count the same weight twice

**Type:** decision + calibration
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Source: research pass for ticket 30 (`docs/research/ship-building-content-sourcing.md` section 2.2). White's *Manual of Naval
Architecture* (1894) pp. 409-410 defines "weight of hull" as 38 % of displacement: 18 % structure plus 20 % fittings, and the fittings
include magazine fittings, crew quarters, pumping, ventilation and electric lighting. `hullCoeffMilliKg` is fitted to that 38 %, while
`components.yaml` also carries magazine, quarters, pump, ventilation and dynamo components with their own masses.

Decision needed (changes every design's weight, so it needs a calibration pass, not a one-line edit):
1. Refit the hull coefficient to the 18 % structure share and keep the fitting components (more explicit, every fitting visible on the
   board); or
2. keep the 38 % hull and give those components no mass (volume, power and crew only).

Either way: re-check every reference design's displacement against its historical value, the goldens that include designed ships, and
the `placeholders.test.ts` count for reference-designs.yaml ("Fittings and equipment weights" marker).

## Comments

- 2026-10-09 resolved (ADR-0083): option 2. The 38 % hull fit stays; magazines, quarters, pumps and ventilation weigh 0 (volume,
  crew, power, capacity kept). `dynamo_small` keeps its mass. reference-designs.yaml marker replaced (ratchet 1 -> 0).
