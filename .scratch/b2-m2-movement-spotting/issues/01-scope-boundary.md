---
Type: task
Status: resolved
Blocked by:
---

# B-2 / 01 — Scope boundary

## Question

What is precisely in and out of scope for B-2 (DESIGN-38 movement/spotting/contact subset)?

## Answer

B-2 delivers the **movement / spotting / contact-state** subset of DESIGN-38 as a
deterministic, pure simulation engine in `@bluewave/combat` over the B-1
`TacticalBattleState` scaffolding:

- movement kinematics (position advance, propulsion, turning, formation stations);
- sensor/detection model + spotting resolution;
- contact-track lifecycle + knowledge state + fog-of-war enforcement;
- a `TacticalClock`-driven minute-advance simulation combining them;
- the movement/spotting/contact versioned constants, `SHIPPED_*_CONTRACT` guards,
  and reason codes, with research-grounded formation/movement constants.

Out (deferred to named sprints): gunnery (B-3), armor/damage (B-4), weather
modifiers (B-5 — baseline clear daylight only this sprint), smoke (M3), ECM/radar
(M5), collisions/grounding resolution (engineering hook only), phase-pipeline
wiring replacing `BattleResolver` (B-6), player battle UI.
