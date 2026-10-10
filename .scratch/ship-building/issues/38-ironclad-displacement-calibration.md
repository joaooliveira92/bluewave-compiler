# 38: Ironclad displacement calibration against historical figures

**Type:** calibration
**Status:** open
**Blocked by:** none
**Frontier:** no

Source: the January-1880 reference-design pass. The new ironclads compile valid but several sit below their historical
displacement under the current weight model, e.g. Kaiser 7.5 kt vs 8.8 kt, Mesudiye 7.1 kt vs 8.9 kt, Redoutable 8.3 kt vs
9.2 kt, Principe Amedeo 5.2 kt vs 5.8 kt (Devastation 9.0 vs 9.4 and Dreadnought 10.7 vs 10.9 are close). This affects the
underlying weight model, not just the January 1880 dataset.

## Acceptance criteria

- Determine where the gap comes from WITHOUT per-design correction factors: structural-weight scaling (`hullCoeffMilliKg`
  and exponent), armour-area estimation, armour backing and fastenings, machinery auxiliaries, coal/stores assumptions,
  reserve displacement, fittings and miscellaneous equipment, and the normal-vs-full-load displacement definition.
- Add a regression test over the historical reference set with an explicit error band (start at absolute predicted
  displacement error <= 10 %; tighten only once all reference sources are confirmed to use the same displacement basis).
- Record the displacement basis (normal vs full load) for each reference ship, since the sources differ.
- Do not distort sourced belt/deck/gun values to hit a number; fix the model or record the residual.

## Comments

- 2026-10-10 created from the January-1880 reference-design review.
