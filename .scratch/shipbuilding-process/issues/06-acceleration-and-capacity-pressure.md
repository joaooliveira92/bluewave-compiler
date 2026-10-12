# 06: Acceleration and capacity pressure

**Type:** grilling
**Status:** resolved
**Blocked by:** 02

## Question

Decide the engine-side construction-acceleration model so it matches the manual, reconciled with
DESIGN-23 §8–9 and the code.

Manual (printed p31): you can accelerate a limited number of ships to build 10% faster at a 5%
cost increase; many ships in accelerated construction risk delaying other ships. DESIGN-23 §8–9
already specifies `construction_acceleration_v1` (remaining-work ×10_500 bp, monthly work-rate
×11_000 bp, capacity-pressure weight ×12_500 bp, delay threshold >9_000 bp, max seeded delay
probability 5_000 bp, delay one month) and the capacity-pressure delay stream. The engine today
implements acceleration only at forecast/cost level (`packages/ship-design/src/cost.ts`,
`construction.ts`, `yardChoice.ts`).

Decide: the limit on how many ships may be accelerated and how it is determined; how the 10%/5%
is applied over time; how the capacity-pressure delay is seeded deterministically; the
player-facing acceleration control; and what must change from the current forecast-only behaviour.

## Answer

Resolved 2026-10-12 (autonomous; grounded in `docs/research/manual-building-ships-rules.md` p31,
DESIGN-23 §8–9, and the code).

- **The manual's numbers are already the shipped policy.** DESIGN-23 §8 `construction_acceleration_v1`
  reproduces "10% faster, +5% cost": remaining work ×`10_500` bp once when acceleration begins (the 5%
  premium), monthly work-rate ×`11_000` bp in paid accelerated months (10% faster). No constant change.
- **"A limited number of ships" is capacity pressure, not a count cap.** The manual gives no count, so
  the deterministic realisation is DESIGN-23 §9: acceleration raises a project's capacity-pressure weight
  (×`12_500` bp); when a pool's pressure exceeds `9_000` bp an eligible project can be delayed, seeded per
  `construction/month/project/acceleration_pressure`, at most `5_000` bp, for one month. That is the
  manual's "many ships in accelerated construction risks causing delays in the construction of other
  ships". Reject a literal "N ships" cap: no source, and it would duplicate the deterministic model.
- **Engine-side implementation.** Move acceleration from forecast-only (`cost.ts`, `construction.ts`,
  `yardChoice.ts`) into the phase engine: a `SetAcceleration` command, per-month accelerated work-rate,
  the one-time premium, and the §9 delay stream setting `DELAYED` with zero work/charge and the
  `ACCELERATION_CAPACITY_PRESSURE_DELAY` reason.
- **Player control** is the acceleration toggle surfaced by "Player-facing building-ships flow".
- **Out:** a fixed acceleration ship count; retroactive premium re-charge (forbidden by §8).

Hand-off: one implementation slice — engine acceleration + capacity-pressure delay + command + tests.
