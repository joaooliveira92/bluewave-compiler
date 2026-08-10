# DESIGN-42: Weather, Visibility, And Smoke

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-42`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Weather, visibility, glare, smoke clouds, funnel smoke, smokescreens, smoke floats, smoke generators, drift, decay, line-of-fire effects, ammunition, cooldowns, ordering, and persistence MUST use the explicit fields, values, formulas, predicates, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Strategic Weather State

Every strategic area MUST have one authoritative `StrategicWeatherState` containing:

- `areaId`;
- campaign month;
- climate-profile identifier;
- season identifier;
- persistent-weather-state identifier;
- sea state;
- wind direction and speed;
- precipitation type and intensity;
- fog or mist state;
- cloud-cover basis points;
- daylight profile;
- glare eligibility;
- base visibility distance;
- generated-at phase;
- ruleset, climate, formula, and RNG versions; and
- weather-state hash.

Strategic weather MUST be generated during the declared monthly weather phase from canonical area climate, calendar month, and prior persistent state.

A missing climate or transition policy MUST fail with `WEATHER_PROFILE_INCOMPLETE`.

## 2. Battle Weather Initialization

Every battle MUST create one immutable `BattleWeatherInitialization` from:

- the area's committed strategic weather state;
- battle date and start time;
- battle location within the area;
- mission template;
- declared local-variation policy;
- battle seed; and
- weather policy version.

Battles in the same area and overlapping tactical time MUST use the same strategic weather source state.

Local variation MAY differ only through a versioned keyed decision. UI navigation, reload, tactical-play choice, and auto-resolution choice MUST NOT reroll weather.

## 3. Weather Components

The canonical tactical weather components are:

- sea state, integer `0..9`;
- wind direction in canonical angular units;
- wind speed in micrometres per second;
- precipitation type;
- precipitation intensity within `0..10_000` basis points;
- fog or mist density within `0..10_000`;
- cloud cover within `0..10_000`;
- time of day;
- solar bearing and elevation;
- glare intensity within `0..10_000`;
- base visibility distance in micrometres; and
- local smoke fields.

Every component MUST use canonical units under `DESIGN-07`.

## 4. Tactical Weather Progression

Weather progression MUST use integer tactical time and `tactical_weather_progression_v1`.

The shipped reevaluation interval is exactly `30` tactical minutes.

At each interval, the engine MAY transition precipitation, fog, cloud cover, wind, and visibility only through the climate profile's declared transition table and keyed stream:

`battle/weather/interval`

Sea state may change by at most exactly `1` level per interval. Wind direction may change by at most one declared climate transition band.

A transition MUST create a weather-event record and MUST NOT rewrite earlier battle weather.

## 5. Visibility Distance

The visibility distance between observer and target MUST be:

`effectiveVisibility = floor(baseVisibility * precipitationMultiplierBp * fogMultiplierBp * daylightMultiplierBp * glareMultiplierBp * smokeMultiplierBp / 10_000^5)`

The exact rational result MUST be rounded once with `FLOOR`.

Every multiplier MUST be explicit and directional where applicable.

A target beyond effective visibility MUST NOT be visually detected through ordinary optical observation.

Radar, sonar, radio, intelligence, and firing illumination use their own contracts.

## 6. Weather Effects

Weather MAY affect only named formulas for:

- gunnery accuracy, observation, and fall-of-shot;
- torpedo observation and attack;
- submarine detection, observation, and attack;
- air launch, recovery, navigation, and attack;
- attainable ship speed and maneuver safety;
- formation cohesion;
- damage-control and foundering risk;
- spotting, classification, and identification; and
- smoke drift and decay.

A weather component without an explicit owning-formula reference has no mechanical effect.

## 7. Smoke Cloud

Every smoke source MUST create one or more deterministic spatial `SmokeCloud` records containing:

- `smokeCloudId`;
- source type and source identifier;
- owner participant or `NONE`;
- creation minute and substep;
- canonical polygon or volume representation;
- centroid position;
- density within `1..10_000` basis points;
- vertical extent;
- wind-drift vector;
- expansion rate;
- density-decay rate;
- fuel or smoke composition;
- visibility and fire-control effects;
- active status;
- ruleset and formula versions; and
- cloud hash.

A cloud MUST remain spatial. A global area-wide smoke modifier is prohibited unless a scenario hazard explicitly defines it.

## 8. Smoke Drift and Decay

Every tactical minute, each smoke cloud MUST resolve:

1. translate by the authoritative wind vector;
2. apply source-ship wake displacement when still generating;
3. expand under its declared geometry policy;
4. reduce density by its decay formula;
5. merge with overlapping compatible clouds; and
6. remove the cloud when density reaches `0`.

The shipped density retention multiplier is:

- wind below `5` knots: `9_500` basis points per minute;
- `5` through below `15` knots: `9_000`;
- `15` through below `25` knots: `8_000`;
- `25` knots or higher: `6_500`.

Precipitation MAY add an explicit density-decay modifier. Missing precipitation metadata means neutral `10_000`.

## 9. Smoke Line Intersection

A shot, visual observation, optical fire-control ray, or illumination ray is affected only when its authoritative line segment intersects one or more smoke-cloud geometries.

For every intersected cloud:

`pathDensityContribution = floor(cloudDensityBp * pathLengthInsideCloud / max(1, cloudReferencePathLength))`

Contributions are summed and clamped to `0..10_000` basis points.

The shipped optical multiplier is:

`smokeOpticalMultiplierBp = max(1_000, 10_000 - floor(totalPathDensityBp * 8_000 / 10_000))`

All participants use the same cloud geometry. Friendly ownership does not exempt a shot or observation.

## 10. Fire Through Smoke

Every gunfire solution whose shooter-to-target line intersects smoke MUST apply the smoke multiplier from Section 9 through `DESIGN-39`.

The modifier applies to:

- player fire;
- AI fire;
- allied fire;
- enemy fire;
- coastal batteries; and
- eligible AA optical fire.

Radar-directed fire MAY use a different explicit smoke multiplier, but MUST NOT ignore smoke unless the radar and fire-control policy explicitly permits it.

Manual targeting and Captain mode MUST NOT bypass smoke effects.

## 11. Funnel Smoke

Every operating propulsion plant MUST declare a funnel-smoke profile.

The shipped smoke-generation multipliers by fuel are:

- coal: `15_000` basis points;
- mixed coal and oil: `12_500`;
- oil: `7_500`;
- nuclear: `0`;
- other fuel: explicit value required.

Power-setting multipliers are:

- below `5_000` basis points of attainable power: `5_000`;
- `5_000..7_499`: `10_000`;
- `7_500..9_499`: `12_500`;
- `9_500..10_000`: `15_000`.

`funnelSmokeDensityBp = min(10_000, floor(baseFunnelSmokeBp * fuelMultiplierBp * powerMultiplierBp * machineryConditionMultiplierBp / 10_000^3))`

Funnel smoke creates normal spatial clouds and affects every intersecting observation or fire line.

## 12. Smokescreen Eligibility

A ship may use `GenerateSmokescreenCommand` only when all predicates pass:

- natural classification is `DD` or `CL`;
- smoke-generation equipment is installed and operational;
- smoke consumable or generator fuel is available;
- readiness is `ACTIVE`;
- damage state is `OPERATIONAL` or `DEGRADED`;
- ship is not sinking, dead in water, abandoned, or under an incompatible dockyard state;
- authoritative current speed is at least `5` knots;
- no smokescreen cooldown is active;
- command authority and communication pass; and
- tactical mission does not explicitly prohibit smoke generation.

An ineligible command MUST fail with `SMOKESCREEN_SHIP_INELIGIBLE` and consume no charge or fuel.

## 13. Smokescreen Generation Duration

The shipped smokescreen-generation duration is exactly `5` tactical minutes.

The permitted ruleset range is `3..7` minutes, but the selected value MUST be explicit and versioned.

During each generation minute, the ship creates one connected smoke segment following its authoritative movement path.

Generation ends early only when:

- the ship becomes ineligible;
- equipment is disabled;
- consumable or fuel is exhausted;
- the command is cancelled before its irreversible creation boundary; or
- the ship sinks or leaves the battle.

An early end preserves smoke already generated.

## 14. Smokescreen Cooldown

After generation starts, the source equipment enters cooldown for exactly `20` tactical minutes.

The cooldown begins at the first generated smoke substep, not after the fifth minute.

A second generation command from the same equipment is eligible only when:

`currentTacticalTime >= firstGenerationTime + 20 minutes`

Equality at the boundary is legal.

The permitted ruleset range is `15..30` minutes.

Damage, cancellation, or early termination does not shorten the cooldown.

Failure MUST use `SMOKESCREEN_COOLDOWN_ACTIVE`.

## 15. Smokescreen Density and Width

The shipped generated-segment values are:

- initial density: `9_000` basis points;
- reference width: `500` metres;
- vertical extent: `100` metres;
- segment lifetime: determined by Section 8 decay;
- wake-source displacement: authoritative ship movement during generation.

Equipment technology MAY modify density, width, or decay through explicit integer multipliers.

A smokescreen command MUST NOT create an instantaneous solid wall disconnected from the ship's movement.

## 16. Smokescreen Tactical Effects

A smokescreen MAY:

- reduce optical spotting and identification;
- reduce optical gunnery accuracy;
- interrupt fall-of-shot observation;
- obscure torpedo tracks or launch origin when their observation ray intersects smoke;
- obscure friendly units;
- complicate formation and collision avoidance; and
- mask withdrawal or repositioning.

It MUST NOT:

- change authoritative ship positions;
- make ships invulnerable;
- block radar or sonar without an explicit technology policy;
- change weapon damage;
- distinguish friendly from enemy fire; or
- guarantee disengagement.

## 17. Smoke-Float Technology

The early smoke-float capability requires discovered and adopted technology `smoke_float_operations`.

A light cruiser may carry smoke floats only when:

- natural classification is `CL`;
- the compiled design includes smoke-float storage and deployment equipment;
- magazine and topside-load limits pass;
- the ship has completed doctrine adoption; and
- inventory is loaded before battle.

The shipped doctrine-adoption requirement is exactly `3` completed paid training months.

## 18. Smoke-Float Capacity

The shipped light-cruiser smoke-float capacity is exactly `4` floats.

The permitted ruleset range is `3..5` floats inclusive. The selected capacity MUST be stored in the compiled design and battle manifest.

A technology or design may choose another explicit value within that range. Missing capacity MUST fail with `SMOKE_FLOAT_CAPACITY_MISSING`.

Each deployment consumes exactly one float. A float cannot be reloaded during battle.

## 19. Smoke-Float Deployment

`DeploySmokeFloatCommand` requires:

- eligible CL under Section 17;
- at least one loaded float;
- deployment equipment operational;
- speed no greater than exactly `25` knots;
- command authority;
- no deployment already occurring that substep; and
- legal tactical position.

The float is deployed at the ship's authoritative stern position and becomes one stationary source that then drifts with wind.

The shipped float emission duration is exactly `5` tactical minutes.

The float's initial emitted density is `8_500` basis points and reference width is `400` metres.

Each float has its own source and cloud records.

## 20. Smoke-Generator Technology

The later technology `shipboard_smoke_generator` supersedes smoke floats for newly compiled compatible CL designs and eligible refits.

It requires:

- discovered and adopted technology;
- compatible generator installation;
- generator fuel tank and piping;
- power and damage-control connections;
- design or refit validation; and
- doctrine adoption.

The shipped doctrine-adoption requirement is `3` completed paid months.

## 21. Generator Replacement Policy

A ship with an operational smoke generator MUST NOT also use smoke floats unless a specific design definition declares separate independent systems. The shipped ruleset declares no dual-system exception.

Installing a generator through new construction or refit changes the smoke equipment mode from `FLOATS` to `GENERATOR`.

Remaining smoke-float inventory is removed from ship inventory through an explicit transfer, disposal, or storage record.

Technology discovery alone does not retrofit existing ships.

## 22. Smoke-Generator Capacity

The shipped smoke generator provides:

- generation duration: exactly `5` tactical minutes per activation;
- cooldown: exactly `20` tactical minutes from first emission;
- activation charges per battle: `3`;
- initial density: `9_000` basis points;
- reference width: `500` metres;
- fuel consumption: exactly `1` smoke-generator charge per activation.

A generator activation follows Sections 12 through 16.

A damaged generator or empty charge inventory provides no smoke.

## 23. Smoke Source Precedence

A ship may have funnel smoke and one deliberate smoke source active simultaneously.

It MUST NOT activate smoke floats and a generator simultaneously under the shipped policy.

Overlapping compatible clouds merge spatially under Section 8. Their source records remain distinct for audit and inventory.

## 24. Glare

Glare MUST be directional and calculated from observer bearing, target bearing, solar bearing, solar elevation, cloud cover, and visibility.

The shipped glare bands are:

- angular separation from sun below `10` degrees: optical spotting and fire-control multiplier `5_000` basis points;
- `10` through below `20` degrees: `7_500`;
- `20` through below `30` degrees: `9_000`;
- `30` degrees or more: `10_000`.

Cloud cover above `7_500` basis points disables ordinary glare unless a weather policy explicitly preserves it.

The observer looking toward the sun receives the penalty. The reverse observation does not automatically receive it.

## 25. Fog and Mist

The shipped fog visibility multipliers are:

- density `0..999`: `10_000` basis points;
- `1_000..2_499`: `8_500`;
- `2_500..4_999`: `6_000`;
- `5_000..7_499`: `3_500`;
- `7_500..10_000`: `1_500`.

Fog affects optical observation and line-of-sight signaling. Radar and other sensors use their own explicit weather effects.

## 26. Precipitation

The shipped optical visibility multipliers are:

- none: `10_000` basis points;
- light rain or snow: `9_000`;
- moderate: `7_500`;
- heavy: `5_000`;
- extreme: `2_500`.

Precipitation intensity and type also affect air operations, radar, sea state, and smoke only through their owning contracts.

## 27. Night and Twilight

Time of day MUST be derived from battle date, location, tactical time, and canonical daylight profile.

The canonical states are:

- `DAY`;
- `TWILIGHT_DAY`;
- `TWILIGHT_NIGHT`;
- `NIGHT`; and
- `DAWN_DUSK_TRANSITION`.

Every state MUST supply explicit optical visibility, identification, gunnery, air-operation, and illumination policies.

Burning ships apply fire-signature modifiers from `DESIGN-41` after time-of-day visibility.

## 28. Weather and Combat Records

Every weather transition, smoke creation, smoke merge, drift, decay, float deployment, generator activation, funnel-smoke emission, glare calculation, and visibility result MUST create an immutable record containing:

- battle minute and substep;
- source and affected participants;
- canonical inputs;
- formulas and multipliers;
- command and inventory references;
- RNG decisions, when applicable;
- pre- and post-state hashes;
- ruleset and formula versions; and
- record hash.

## 29. Canonical Ordering

Resolution MUST order:

1. weather transitions by battle minute and weather-component priority;
2. smoke sources by source type and source identifier;
3. smoke clouds by creation time and cloud identifier;
4. drift and decay before new line-intersection queries for the same minute;
5. commands by canonical tactical-command order;
6. float and generator inventory by equipment identifier;
7. observation rays by observer and target contact identifier; and
8. fire rays by shooter, battery, salvo, and target identifier.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect outcomes.

## 30. Required Reason Codes

The subsystem MUST define at least:

- `WEATHER_PROFILE_INCOMPLETE`;
- `INVALID_BATTLE_WEATHER_INITIALIZATION`;
- `INVALID_SMOKE_CLOUD`;
- `SMOKE_LINE_INTERSECTION_FAILED`;
- `SMOKESCREEN_SHIP_INELIGIBLE`;
- `SMOKESCREEN_EQUIPMENT_UNAVAILABLE`;
- `SMOKESCREEN_CONSUMABLE_UNAVAILABLE`;
- `SMOKESCREEN_COOLDOWN_ACTIVE`;
- `SMOKESCREEN_GENERATION_INTERRUPTED`;
- `SMOKE_FLOAT_TECHNOLOGY_UNAVAILABLE`;
- `SMOKE_FLOAT_CAPACITY_MISSING`;
- `SMOKE_FLOAT_INVENTORY_EMPTY`;
- `SMOKE_FLOAT_DEPLOYMENT_SPEED_EXCEEDED`;
- `SMOKE_GENERATOR_TECHNOLOGY_UNAVAILABLE`;
- `SMOKE_GENERATOR_CHARGES_EMPTY`;
- `SMOKE_EQUIPMENT_MODE_CONFLICT`;
- `WEATHER_VISIBILITY_FORMULA_MISSING`; and
- `WEATHER_SMOKE_STATE_INVARIANT_FAILED`.

## 31. Validation and Acceptance

Automated validation MUST prove that:

1. every strategic area has canonical climate, persistent weather, sea state, wind, precipitation, fog, daylight, glare, and visibility state;
2. battles initialize from committed strategic weather and do not reroll because of UI or resolution mode;
3. tactical weather transitions occur only every 30 minutes through explicit tables and keyed decisions;
4. authoritative visibility uses exact integer multipliers and one final floor rounding;
5. smoke remains deterministic spatial geometry with source, density, age, drift, expansion, and decay;
6. wind moves and disperses smoke through exact retention multipliers;
7. observation and fire are affected only when their authoritative line intersects smoke;
8. the same smoke geometry affects friendly, allied, and enemy optical fire;
9. manual targeting and Captain mode do not bypass smoke;
10. funnel smoke uses exact fuel and power multipliers and creates spatial clouds;
11. only eligible DD and CL ships with operational equipment, consumable, readiness, speed, and authority may generate smokescreens;
12. shipped smokescreen generation lasts exactly five tactical minutes;
13. cooldown lasts exactly 20 tactical minutes from the first emission;
14. early interruption preserves generated smoke and does not shorten cooldown;
15. generated segments use exactly 9,000 density, 500-metre width, and 100-metre vertical extent;
16. smokescreens do not provide invulnerability, guaranteed withdrawal, or friendly-fire exemption;
17. smoke floats require adopted technology, compatible CL design, storage, deployment equipment, inventory, and three paid doctrine months;
18. shipped CL smoke-float capacity is exactly four, within the permitted three-through-five range;
19. every float consumes one inventory unit and emits for exactly five minutes;
20. float deployment is prohibited above exactly 25 knots;
21. later smoke-generator technology changes equipment only through new construction or refit;
22. technology discovery alone does not retrofit existing ships;
23. the shipped policy forbids simultaneous floats and generator use;
24. generators provide exactly five minutes, 20-minute cooldown, and three charges per battle;
25. glare uses exact directional angular bands;
26. fog and precipitation use exact visibility bands;
27. burning-ship visibility effects apply after time-of-day weather;
28. all weather and smoke actions create complete deterministic records; and
29. identical battle state, commands, content, ruleset, weather source, and seeds produce identical weather, visibility, smoke, inventory, observation, fire effects, records, and hashes.
