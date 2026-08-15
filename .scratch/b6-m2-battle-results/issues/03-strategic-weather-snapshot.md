- **Type:** task
- **Status:** resolved
# B-6: Strategic Weather Snapshot — persistence + immutable shape

## Question

B-5 added `StrategicWeatherState` + a no-op `weather_generation` phase. How does
B-6 make it authoritative and persist it on the campaign snapshot?

## Answer

**Locked.**
1. `CampaignSnapshot` gains a `strategicWeather` collection:
   `strategicWeather: StrategicWeatherStateByArea` (ordered map areaId →
   state), generated fresh for the current campaign month by the
   `weather_generation` phase (order 0.5, `rngAllowed: true`, keyed stream
   `campaign/weather/<areaId>/<month>`).
2. The phase uses a **canonical default climate profile** (`climate_profile_v1`)
   in `@bluewave/combat` so it is deterministic even before the CONTENT-track
   supplies region-specific YAML. Missing profile → `WEATHER_PROFILE_INCOMPLETE`.
3. Every area present in `snapshot.world.areas` gets a committed state; states
   are retained as historical rollup? **No** — authoritative snapshot SHALL store
   only the current month's per-area weather (append-only ledgers already cover
   history; a growing weather array would blow save size and isn't required).
4. Battle initialization consumes the attacker/defender **area's** state for the
   battle's `areaId`; battle with missing state fails closed
   (`INVALID_BATTLE_WEATHER_INITIALIZATION`).
5. Snapshot hash changes → goldens MUST be regenerated under ADR-0007 with a
   documented old/new + cause (see ticket 05). `cloneSnapshot`,
   `cross-process-test`, and persistence schema all updated in the same change.

**Consequences for test/golden run:** the "no-battle" golden fixture now also
has weather; only the `battleGenerationHash` key (independent synthetic flow)
and true battle hashes change if a battle occurs. Document each change.