# 06 — Auto-resolution gunnery fidelity (range + gun count)

**Spec:** ../spec.md (follow-up found while proving AC-5; ADR-0046 consequences)

**Blocked by:** none

**Status:** DONE (2026-10-07, ADR-0048)

**Frontier:** no

## Problem (evidence)

`resolveOneBattery` (`packages/combat/src/gunnery/resolve.ts`) takes ONE keyed hit draw per
salvo; `projectBattle` gives every ship one main battery with `neutralAccuracyFactors(4_000)`
and a fixed 10 km range estimate. Result: a 40 % per-minute hit chance at any range, and gun
count only changes ammunition use. Swapping a fixture from 10 guns/30 kn to 4 guns/14 kn
produced byte-identical damage reports across 5 seeds.

## What to build

- Research note: hit rates for 1880–1945 heavy guns vs range (e.g. Lissa 1866, Yalu 1894,
  Tsushima 1905, Jutland 1916) → per-gun accuracy-vs-range BALANCE TARGET table.
- Range-dependent accuracy factor from the true legal contact range each minute.
- Gun-count sensitivity (one draw per gun/mount or a binomial-equivalent keyed draw).
- Tests: more guns / closer range ⇒ statistically more hits (seeded sweep); determinism.
