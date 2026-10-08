# P-1 — Gun accuracy vs range: BALANCE TARGET curve (ticket 06)

**Status:** Research note (balance-target derivation) — P-1 ticket 06
(`.scratch/p1-battles-that-matter/issues/06-gunnery-fidelity.md`).
**Intended reader:** implementator of ticket 06 / ADR-0048.
**Rule:** all integers below are **BALANCE TARGET** (non-normative), authored
into `gunnery_range_v1` (range curve) and `gunnery_salvo_batch_v1` (gun count).
Design-space normative text is `docs/rules/gunnery.md` (DESIGN-39) §3.

## 1. Why

In `resolveBattleAuto` every ship fires ONE main battery with
`neutralAccuracyFactors(4_000)` (40 % per minute) and a fixed 10 km range
estimate, and `resolveOneBattery` takes ONE keyed hit draw per salvo. A fixture
swap from 10 guns/30 kn to 4 guns/14 kn produced byte-identical damage reports
across 5 seeds (ticket 06 evidence). Two design variables that MUST matter —
range and gun count — were inert.

## 2. Historical anchors (hit rates for heavy guns)

| Engagement | Range | Per-round heavy-gun hit rate | Source |
| --- | --- | --- | --- |
| Lissa 1866 | ~0.2–1 km (ramming/boarding melee) | gunfire aimed but largely ineffective; anchoring only (`low`) | standard accounts |
| Yalu 1894 | ~1.5–3 km | Japanese fleet's accuracy was ~1/3 of Tsushima's (Navy Historical Society of Australia) | NHSA, "The Battle of Tsushima, 1905" |
| Tsushima 1905 | ~4.6–7.3 km (5 000–8 000 yd; ranges to ~12 000 yd observed) | **~19.6 %** of 12-in rounds: ~1 275 fired, ~250 hits | USNI Proceedings Apr 1906 ("With the Baltic Fleet at Tsushima") and Oct 1906 ("Inherent Tactical Qualities...") |
| Jutland 1916 | ~11–16 km | heavy-calibre hits per round ~2–4 % (RN ~2.7 %, HSF ~3.3 % published aggregates; USNI 1921 "Results and Effects" records 69 + 73 heavy hits and emphasizes small numbers at long range in smoke) | USNI Proceedings Sep 1921; Tarrant, *Jutland: The German Perspective* |

Two clean anchors bracket the curve: **~20 % per round at ~5–8 km** (Tsushima)
and **~3 % per round at ~11–16 km** (Jutland).

## 3. Curve family

Hit probability on a fixed target decays roughly as **1/R**: lateral dispersion,
range-keeping error and the size of the range band all grow approximately
linearly with range, so the probability that a round falls "in the box" scales
like 1/(linear dispersion)² · (target width) — but fire control correlates
successive rounds along one axis, and real-world aggregates (Tsushima → Jutland)
decay slower than 1/R². We fit the one-parameter family

    perRoundHitProbability(R) = A / (R_yd − R_0),  R_yd in yards

which is the "falloff" shape used by the wargaming gunnery literature, with the
join constants chosen to reproduce the legacy band table. NOTE: this is a calibration to that table, not a fit to the anchors; the anchors only loosely bracket it (q is ~2x low vs Tsushima, consistent with Jutland). The shipped denominator is `10_000 + 7(R_yd − 2_000)` (see below), not a pole at 2 000 yd:

- `R_0 = 2_000 yd` — the curve branch starts at 2 000 yd (closer ranges evaluate
  at 2 000 yd; below ~3.1 km the per-minute probability saturates at the cap);
- `A` fixed so `H(5 km) ≈ 29 %` per round, which after the 30 % battle discount
  yields the Tsushima-scale per-minute per-gun figure at 5 km.

## 4. Shipped integers (`gunnery_range_v1`)

    R_yd = max(2_000, floor(rangeUm / 914_400))
    H_bp = floor(10^8 / (10_000 + 7 × (R_yd − 2_000)))        [per-round ×10 000]
    q_bp = clamp(60, 1_500, round(3_000 × H_bp / 10_000))     [per-minute per-gun]
    rangeMultiplierBp = round(q_bp × 10_000 / 4_000) = round(q_bp × 2.5)

- `BATTLE_DISCOUNT_BP = 3_000` (0.30): per-round hit probability → per-minute,
  per-gun basis (multi-ship, multi-battery tactical chaos; two-ship duels are
  better than the raw per-round figure).
- `RANGE_Q_CAP_BP = 1_500` (15 %/min/gun at ≤ ~3.1 km), `RANGE_Q_FLOOR_BP = 60`
  (0.6 %/min/gun at ≥ ~65.2 km).
- The `7` slope and the `10_000` offset in the H denominator are the fit levers:
  they reproduce the fallback band table (below) exactly, which is the table's
  own check.

### 4.1 Fallback band table (reproduced exactly by the closed form)

| Range | q_bp (per min/gun) | `rangeMultiplierBp` | H per round |
| --- | --- | --- | --- |
| ≤ 3 km | 1 500 (cap) | 3 750 | ≥ 52.7 % |
| 5 km | 875 | 2 188 | 29.2 % |
| 8 km | 524 | 1 310 | 17.5 % |
| 12 km | 341 | 853 | 11.4 % |
| 16 km | 253 | 633 | 8.4 % |
| 20 km | 201 | 503 | 6.7 % |
| 25 km | 160 | 400 | 5.3 % |
| 40 km | 99 | 248 | 3.3 % |

Round-half-up (`Math.round`) on q is required to reproduce the 25 km band edge
(3000×533/10 000 = 159.9 → **160**); `floor` would give 159. The §3 multiplier
chain `floor(4_000 × multiplier / 10_000)` reproduces q exactly at every band
edge AND for every integer q (proof in `rangeCurve.ts` comments).

### 4.2 Gun count (`gunnery_salvo_batch_v1`)

One keyed draw per battery per minute is retained (DESIGN-39 §3 hit check: one
integer draw 0..9 999 vs `finalAccuracyBp`). The draw's probability is the
binomial-equivalent batch of `salvoCount` independent rounds:

    salvoBatchAccuracyBp(q, N) = 10_000 − ceil((10_000 − q)^N / 10_000^(N−1))

exact integer (bigint); `N=0 → 0`, `N=1 → q`, monotone in q and N, converging to
10 000. **Integer form is authoritative** — a naive float evaluation can differ
±1–2 bp (e.g. q=875, N=4: 3_066 integer; the float 10_000×(1−0.9125⁴) is
3_066.85 and some published examples print 3_067).

## 5. Integration (ticket 06)

- The engine computes the true post-movement range each minute
  (`rangeBetweenUm`, floored integer µm, max-normalized hypotenuse) and passes
  `shipPositions` into `resolveGunnery`; the §3 `range` factor slot is filled
  with `rangeMultiplierBp(rangeToLegalContact)`; `rangeEstimateUm` is written
  back into the next `GunneryState`.
- Direct-callers that pass no positions keep their authored factor unchanged
  (backwards-compatible).
- Evidence tests: 12 seeds × 120 minutes — 4-gun 5 km ≈ 3 066 bp vs 4-gun
  15 km ≈ 1 040 bp (closer ⇒ more hits, ~3×); 1-gun vs 8-gun at 5 km ≈ 875 vs
  5 193 bp (more guns ⇒ more hits, ~6×); battle-level: 10-gun vs 4-gun and
  30 kn vs 14 kn now produce different damage reports/hashes for every seed.

## 6. Rejected alternatives

- **Per-gun keyed draws** (one draw per round in the salvo): changes the
  one-draw shape, event record, and stream structure for zero added fidelity —
  the batch probability is distribution-equivalent for a single decision.
- **1/R² physics curve**: decays far faster than the two historical anchors
  jointly support (Tsushima→Jutland ratio is ~4–6× over a 2–3× range increase,
  not the ~9× of 1/R²).
- **Range bands only** (the fallback table as a lookup): equivalent outcomes,
  but a monotone integer closed form is cheaper, smooth between bands, and
  versioned as one formula.