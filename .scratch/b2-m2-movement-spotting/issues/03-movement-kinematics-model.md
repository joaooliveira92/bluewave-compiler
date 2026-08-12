---
Type: task
Status: resolved
Blocked by:
---

# B-2 / 03 — Movement-kinematics model

## Question

What movement kinematics does B-2 implement for DESIGN-38 §20 / §3 steps 5–6?

## Answer

A pure, integer/fixed-point kinematics model over `MovementState`:

- **Position advance**: `position += velocity × dt` where velocity derives from
  heading + currentSpeed (fixed-point; speed in µm/s or scaled knots, position in
  fixed integer coordinate units). Advance per battle substep and per minute.
- **Propulsion**: `currentSpeed` moves toward `orderedSpeed` at a bounded
  acceleration (thrust) / deceleration (brake) per sec — versioned constants.
- **Turning**: `heading` moves toward `orderedHeading` at a bounded turning rate
  (deg/sec), rate-limited; reciprocal-course math reused from `battleTurnAway`.
- **Formation stations**: derive each unit's desired station (bearing+range offset
  from formation lead as a function of ordinal position + formation type,
  e.g. LINE_AHEAD column spacing) and steer toward the station via the same helm
  model. Formation/station constants grounded in research (column distance, etc.).

Collisions/grounding resolution (DESIGN-38 step 7) is a recorded hook only —
deferred; emits empty records. All movement stays integer/fixed-point (DESIGN-07);
`assertFixedPointMovement` guards invariants.
