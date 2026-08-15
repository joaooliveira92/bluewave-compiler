# Integration Boundary

- **Type:** grilling
- **Status:** resolved

## Question

Where does tactical weather run in the minute-advance simulation? Does it
require a new phase-engine phase? How does it interact with spotting and gunnery?

## Answer

Weather runs as a pure **engine-stage** (`resolveWeather`) inside the B-2
minute-advance simulation, executing **before** spotting (step after battle
initialization, before B-2 spotting step 5). It produces `WeatherEventRecord`s
via the existing `BattleLedger`+`canonicalEventOrder`.

A new **strategic** phase `weather_generation` is added to the monthly phase
pipeline (order after `opening_validation`, before `command_collection`) to
generate `StrategicWeatherState` per area. This is the only strategic-phase
addition; all tactical weather runs inside the minute-advance engine.

**No** `BattleResolver`/`StrengthCalculator` changes. **No** snapshot schema
change (weather state is ephemeral tactical state, not campaign-persisted).
Goldens unchanged.

Weather modifies spotting and gunnery through the existing neutral-10_000
multiplier slots (visibility factor in B-2 spotting, weather factor in B-3
accuracy). B-5 ships real weather data in those slots; consuming subsystems
swap from 10_000 constants to real weather multiplier lookups.