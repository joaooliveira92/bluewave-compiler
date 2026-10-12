# INC-4 — Accelerate + capacity-pressure delay

**State:** RESOLVED (engine slice; UI surface split to INC-4b) · **Frontier:** yes · **Blocked by:** INC-2, INC-3
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R8, R9, R10, R32) · **ADR:** none new (uses the DESIGN-23 §8 shipped policy)

## What to build

Move construction acceleration from a forecast-only hint into the phase engine, and realise the
manual's "a limited number of ships … risks delaying others" as the deterministic capacity-pressure
delay. A player can accelerate a selected ship (10 % faster, +5 % cost) and see it badged.

## Acceptance criteria

- [ ] A `SetAcceleration` command toggles `ACCELERATED`. On enable, remaining work is multiplied once by
      exactly `10_500` bp (the +5 % premium); in each paid accelerated month effective capacity is
      multiplied by exactly `11_000` bp (10 % faster). Completed work is never retroactively increased
      and re-enabling never charges the premium twice for the same segment.
- [ ] The forecast's `accelerationTimeBp`/`accelerationCostBp` and the engine's `10_500`/`11_000`
      agree in observable effect (a test pins 10 % / 5 %).
- [ ] Acceleration raises a project's capacity-pressure weight by exactly `12_500` bp; above a pressure
      of `9_000` bp an eligible accelerated project can be delayed with a keyed decision on
      `construction/month/project/acceleration_pressure`, probability ≤ `5_000` bp, for exactly one
      month, setting `DELAYED` with reason `ACCELERATION_CAPACITY_PRESSURE_DELAY`; every delay has a
      random-decision record.
- [ ] There is **no** fixed N-ship acceleration cap: many accelerated ships raise pressure and can
      delay others; no count-based rejection exists.
- [ ] UI: an accelerate toggle discloses the +5 % cost and the delay risk; accelerated rows are badged.
- [ ] Determinism: same seed → same delay decisions and hash across two processes; boundary (exactly
      `9_000` bp does not delay; `5_000` bp cap).

## Notes for implementator

The one-time premium and monthly rate live in the phase engine; the existing seeded stream family is
reused with a keyed random-decision record. Eligible projects evaluated in ascending project id order.
No delay is ever inferred or invisible.
