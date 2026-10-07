# ADR-0048: P-1 — Auto-Resolution Gunnery Fidelity (True Range + Gun-Count Sensitivity)

## Status

Accepted (2026-10-07)

## Context

P-1 ticket 06. `resolveOneBattery` took one keyed hit draw per salvo, and
`projectBattle` gave every ship a neutral `range` factor and a fixed 10 km range
estimate. A 40 % per-minute hit chance held at any range, and gun count only
changed ammunition use: swapping a 10-gun/30 kn fixture for a 4-gun/14 kn one
produced byte-identical damage reports across five seeds (ADR-0046 consequence).

## Decision

1. **True range.** `advanceMinute` builds post-movement `shipPositions` once and
   passes them to `resolveGunnery`. For a battery with a legal contact track and
   a known shooter position, the floored shooter→track distance (integer µm)
   replaces the authored range estimate, is written to the next `GunneryState`
   even when the battery does not fire, and sets the DESIGN-39 §3 `range` factor
   via `rangeMultiplierBp`. Without positions the battery behaves exactly as
   before, so direct-call tests are unaffected.
2. **Range curve (balance target).** `rangeCurve.ts` uses a hyperbolic
   `q(R) = a/(R − R0)` falloff, capped at 1 500 bp and floored at 60 bp, fitted
   to reproduce the eight band edges (3…40 km → 1500…99 bp). Anchors are
   Tsushima 1905 (~19.6 % per round at 4.6–7.3 km) and Jutland 1916 (~2–4 % at
   11–16 km); see `docs/research/p1-gun-accuracy-vs-range.md`. The integers are
   BALANCE TARGETs, not normative physics.
3. **Gun count.** The single keyed draw is kept (stream identity, ledger shape,
   one HIT → one impact path unchanged). Its probability becomes the exact
   integer binomial-equivalent `1 − (1 − q)^N` for `salvoCount = N`
   (`salvoBatch.ts`, bigint, one final ceiling). The record keeps the per-round
   §3 value in `accuracy`; `randomDecisions[0].finalAccuracyBp` carries the batch
   value.

## Consequences

- Minute and result hashes of every battle with batteries and positions change;
  affected pins were re-baselined (`auto-resolve`, `ac6-damage-control-gate`).
  Battles without batteries are unchanged (strict no-op).
- More guns and closer range now produce statistically more hits (seeded sweeps
  in `gunnery-fidelity.test.ts`).
- Integer batch values can differ by 1–2 bp from float evaluation; the integer
  form is authoritative.
- A hit still resolves one impact per salvo, not one per gun; per-gun impacts
  are deferred.
