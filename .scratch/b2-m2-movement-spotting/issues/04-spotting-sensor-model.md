---
Type: task
Status: resolved
Blocked by:
---

# B-2 / 04 — Spotting / sensor model

## Question

How does B-2 model detection and spotting (DESIGN-38 §3 step 8)?

## Answer

A deterministic detection model resolved in `resolve_sensors_spotting`:

- **Baseline visibility**: clear daylight, fixed reference visibility; weather/
  smoke/visibility modifiers are deferred (B-5) and enter only via a neutral
  baseline constant so later sprints can multiply without changing B-2 semantics.
- **Sensor/detection ranges**: per canonical sensor type (visual lookout, and a
  placeholder for future radar/EW at M5), a versioned base detection range in
  meters/nmi. M5 sensor types are registered but inert in B-2.
- **Line of sight**: flat open sea → clear sight whenever range ≤ visual horizon;
  no terrain/obstruction model this sprint (battle maps are open water), with a
  pure predicate so later geometry can plug in.
- **Detection resolution**: a unit is detected when within another's detection
  range and LOS holds. Detection is deterministic; any random element (e.g.
  uncertainty scatter) resolves only through keyed streams
  (`battle/ship/sensors/...`), never ambient RNG.
- Detection yields contact tracks consumed by the contact-lifecycle ticket; every
  detection records reason + source for the battle-event ledger.

Position inputs come from the movement model (INC-1). Fog-of-war is preserved:
only produced contacts, never hidden true identity, feed targeting.
