# Milestone B-5: M2 Tactical Weather & Visibility (Surface Tactical Core)

## Objective

A deterministic, engine-only **tactical weather** engine stage (`resolveWeather`)
in `@bluewave/combat` that, given climate profiles and battle context, resolves
DESIGN-42 **weather/visibility** (§§1–6, §24–30), emitting immutable
`WeatherEventRecord`s through `BattleLedger` + `canonicalEventOrder`, with strict
no-op behavior that leaves B-2/B-3/B-4 hashes unchanged and goldens 9/9.

Also adds a `weather_generation` monthly phase (order after `opening_validation`)
generating per-area `StrategicWeatherState`. Smoke (§§7–23) deferred to M3.

## Canonical requirements

DESIGN-42 §§1–6, §24–30 (weather/visibility subset); DESIGN-38 (minute-advance,
`BattleLedger`, `canonicalEventOrder`, reason-code catalog); DESIGN-07 (integer
arithmetic); DESIGN-55 §3 (M2 scope), §4 (smoke deferred to M3).

## Starting state

Verified baseline (2026-08-14): B-4-IMPL DONE (PASS). `@bluewave/combat` has
minute-advance engine with `resolveGunnery` and `resolveDamage`. Combat suite
green; goldens 9/9; cross-process determinism proven.

## In scope

- `StrategicWeatherState` + per-area monthly generation during new `weather_generation`
  phase (order after `opening_validation`), keyed RNG `campaign/weather/<areaId>/<month>`.
- `BattleWeatherInitialization` from strategic weather + battle context.
- 12 tactical weather components (sea state, wind, precipitation, fog, cloud cover,
  daylight, glare, visibility).
- Tactical progression at 30-min intervals via climate transition tables.
- Visibility distance: exact integer formula with one FLOOR.
- Glare: directional angular bands.
- Fog/mist: density→visibility band multipliers.
- Precipitation: intensity→visibility band multipliers.
- Night/twilight: 5 canonical states.
- `WeatherEventRecord` + canonical ordering via `BattleLedger`.

## Out of scope (deferred)

- Smoke §§7–23 (M3/C-5)
- Weather effects on torpedoes, submarines, air (owning subsystems)
- Phase-engine wiring (B-6)
- Production climate profile YAML (CONTENT-track)

## Acceptance criteria

17 ACs total (AC-1..AC-17) — see `.scratch/b5-m2-weather-visibility/spec.md` §1.1.

## Slices

6 incremental slices (INC-1..INC-6) — see spec §1.2. Frontier order: INC-1 →
INC-2 → INC-3 → INC-4 → INC-5 → INC-6.
