# Strategic Weather Generation

- **Type:** grilling
- **Status:** resolved

## Question

How is strategic weather generated? What does `StrategicWeatherState` contain?
When in the monthly pipeline does it run? What is the keyed RNG stream?

## Answer

`StrategicWeatherState` contains per DESIGN-42 §1: areaId, campaign month,
climate-profile identifier, season, persistent-weather state, sea state (0..9),
wind direction/speed (integer µm/s), precipitation type/intensity, fog/mist
state, cloud cover (0..10_000 bp), daylight profile, glare eligibility,
base visibility distance (µm), generated-at phase, version IDs, state hash.

Generated during new `weather_generation` phase (order after `opening_validation`,
before `command_collection`) from canonical area climate profile, calendar month,
and prior persistent state. Keyed RNG stream: `campaign/weather/<areaId>/<month>`.
Missing climate profile → `WEATHER_PROFILE_INCOMPLETE`.

The `StrategicWeatherState` is stored ephemerally on the `CampaignState` (not
persisted to snapshots — regenerated on load from replayable seed + climate).