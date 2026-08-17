# Scope Boundary

- **Type:** grilling
- **Status:** resolved

## Question

What is the exact scope boundary of the B-5 sprint within DESIGN-42?
Which sections are in scope (weather/visibility), which are deferred (smoke/M3),
and which are out of scope permanently?

## Answer

**In scope** — DESIGN-42 §§1–6, §24–30 (weather and visibility):
- §1 Strategic Weather State
- §2 Battle Weather Initialization
- §3 Weather Components
- §4 Tactical Weather Progression
- §5 Visibility Distance
- §6 Weather Effects (modifier-only; actual formula registrations owned by consuming subsystems)
- §24 Glare
- §25 Fog and Mist
- §26 Precipitation
- §27 Night and Twilight
- §28 Weather and Combat Records (weather portion only)
- §29 Canonical Ordering (weather portion only)
- §30 Required Reason Codes (weather subset: `WEATHER_PROFILE_INCOMPLETE`, `INVALID_BATTLE_WEATHER_INITIALIZATION`, `WEATHER_VISIBILITY_FORMULA_MISSING`, `WEATHER_SMOKE_STATE_INVARIANT_FAILED`)

**Deferred to M3 (C-5):** §§7–23 (entire smoke subsystem: clouds, drift, decay, line intersection, funnel smoke, smokescreens, smoke floats, generators)

**Out of scope permanently:** Phase-engine wiring (B-6), player UI, production-pack YAML climate profiles (CONTENT-track), weather effects on torpedoes/submarines/air (owned by those subsystems)