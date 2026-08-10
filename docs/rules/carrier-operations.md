# DESIGN-44: Carrier Operations

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-44`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Carrier capacity, spot value, jet compatibility, deck cycles, strike timing, deck contention, maneuver, weather suspension, and operational hazards MUST use the explicit values, predicates, formulas, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Carrier State

Every carrier MUST have one authoritative `CarrierOperationsState` containing:

- `shipId`;
- current compiled-design identifier;
- natural classification;
- physical aircraft capacity units;
- occupied capacity units;
- current spot value;
- deck-cycle state;
- deck-configuration identifier;
- catapult definitions and condition;
- lift definitions and condition;
- flight-deck condition;
- hangar condition;
- aviation-fuel state;
- ordnance inventory;
- assigned air-group and squadron identifiers;
- spotted, fueled, armed, airborne, returning, and damaged aircraft counts;
- active launch and recovery reservations;
- weather-operability state;
- ruleset and formula versions; and
- state hash.

All aircraft and capacity quantities MUST use non-negative integers. One aircraft MUST NOT occupy two carrier-operation states simultaneously.

## 2. Carrier Classification Capacity

Carrier classification binds to `DESIGN-22`:

- `CVL` requires physical aircraft capacity from exactly `4` through `34` aircraft inclusive;
- `CV` requires physical aircraft capacity strictly greater than `34` aircraft; and
- capacity below `4` does not qualify as `CVL` or `CV`.

Capacity `34` is CVL. Capacity `35` is CV.

Carrier classification MUST use immutable compiled physical capacity, not assigned aircraft count, temporary damage, rounded UI values, or current inventory.

## 3. Capacity Units

Carrier capacity MUST use integer `carrierCapacityUnits`.

The shipped scale is exactly `2` capacity units per ordinary aircraft slot.

Aircraft capacity consumption is:

- ordinary piston aircraft: `2` units, equal to `1.0` slot;
- light jet fighter: `3` units, equal to `1.5` slots;
- heavy jet fighter: `3` units when operated by a compatible large jet carrier, otherwise ineligible;
- jet attack aircraft: `3` units when compatible, otherwise ineligible;
- helicopter: `2` units unless its model explicitly declares another integer value;
- other aircraft: model-defined positive integer units.

`physicalCarrierCapacityUnits = compiledAircraftCapacity * 2`

An assignment is legal only when:

`occupiedCarrierCapacityUnits + assignedAircraftCapacityUnits <= physicalCarrierCapacityUnits`

No fractional arithmetic is used at runtime.

## 4. Deterministic Capacity Assignment

Aircraft assignments MUST be processed in this order:

1. mandatory CAP reservation;
2. aircraft already permanently assigned to the carrier;
3. returning aircraft requiring recovery;
4. operation-specific strike aircraft;
5. search aircraft;
6. replacement aircraft;
7. temporary ferry aircraft; and
8. ascending squadron and aircraft-model identifiers.

Each aircraft consumes its complete integer capacity-unit value. Capacity MUST NOT be rounded only after summing fractional slots.

A capacity failure MUST use `CARRIER_CAPACITY_EXCEEDED` and MUST NOT partially assign an indivisible aircraft.

## 5. Oversized Air Groups

A carrier with compiled physical capacity above `100` aircraft uses `oversized_carrier_air_group_v1`.

The shipped effects apply to capacity above `100` only:

- deck-cycle efficiency multiplier: `9_000` basis points;
- sortie-generation multiplier: `9_000`;
- aviation-maintenance cost multiplier: `12_500`;
- air-group coordination multiplier: `9_500`; and
- fire-control and damage-control congestion multiplier: `11_000` on adverse aviation-hazard probability.

A carrier at exactly `100` aircraft receives no oversized penalty. A carrier at `101` or more receives the complete policy.

The permitted trigger range is `90..120` aircraft, but the selected ruleset value MUST be explicit.

## 6. Base Spot Value

`spotValue` is the maximum number of aircraft that may be simultaneously prepared on deck for one launch cycle.

The shipped base spot value is exactly one half of compiled physical aircraft capacity, rounded down:

`baseSpotValue = floor(compiledAircraftCapacity / 2)`

A carrier with capacity `4` has base spot value `2`. Capacity `35` has base spot value `17`.

Spot value uses aircraft counts after capacity compatibility has been validated. It is separate from hangar capacity and total assigned air-group size.

## 7. Spot-Value Modifiers

The final spot value is:

`finalSpotValue = floor(baseSpotValue * catapultMultiplierBp * speedMultiplierBp * deckConfigurationMultiplierBp * damageMultiplierBp * technologyMultiplierBp * oversizedMultiplierBp / 10_000^6)`

The result MUST be clamped to `0..compiledAircraftCapacity`.

The exact rational result MUST be retained through all multipliers and rounded once with `FLOOR`.

### 7.1 Catapult Multiplier

- no operational catapult: `10_000` basis points;
- one compatible operational catapult: `11_000`;
- two or more compatible operational catapults: `12_000`;
- catapults do not benefit aircraft whose launch policy cannot use them.

### 7.2 Carrier-Speed Multiplier

Speed uses authoritative current attainable maximum speed:

- below `20` knots: `6_000` basis points;
- `20` through below `24`: `8_000`;
- `24` through below `28`: `10_000`;
- `28` knots or higher: `11_000`.

A carrier below exactly `24` knots therefore has reduced spot value. A carrier at exactly `24` knots receives the neutral `10_000` multiplier.

### 7.3 Deck Configuration

- straight deck: `10_000` basis points;
- deck-edge lift configuration: `11_000`;
- angled deck: `12_000`;
- damaged or obstructed configuration: damage policy applies separately.

### 7.4 Flight-Deck Damage

- operational: `10_000` basis points;
- degraded: `7_500`;
- heavily damaged: `3_500`;
- launch-inoperable: `0`.

### 7.5 Technology

- basic carrier operations: `10_000` basis points;
- improved deck handling: `11_000`;
- modern deck handling: `12_000`.

Only the highest adopted eligible capability applies.

## 8. Jet Carrier Capability

Every carrier MUST declare one jet capability:

- `NONE`;
- `LIGHT_JET_CAPABLE`;
- `HEAVY_JET_CAPABLE`; or
- `MODERN_JET_CAPABLE`.

Jet capability requires all physical, technological, and doctrine predicates. Displacement alone is insufficient.

## 9. Light-Jet Eligibility

A carrier may operate light jets only when all predicates hold:

- true standard displacement is at least exactly `40_000_000` kilograms, equal to `40,000` metric tonnes; or
- true standard displacement is at least exactly `30_000_000` kilograms and at least one compatible operational steam-or-later catapult exists;
- technology `early_jet_carrier_operations` is discovered and adopted;
- deck length, width, strength, heat resistance, lift dimensions, hangar dimensions, arresting gear, and fuel support pass;
- aircraft model has `carrierSuitable: true`; and
- weather and wind-over-deck requirements pass.

Equality at `40,000` or `30,000` tonnes is legal.

A smaller carrier is ineligible unless an explicit future carrier-technology contract defines another complete physical threshold.

## 10. Heavy-Jet Eligibility

Heavy jet fighters and jet attack aircraft require `HEAVY_JET_CAPABLE` or `MODERN_JET_CAPABLE` carrier state.

The shipped heavy-jet predicates are:

- true standard displacement at least `40_000_000` kilograms;
- adopted technology `modern_jet_carrier_operations`;
- operational steam-or-later catapult;
- strengthened arresting gear;
- jet-compatible lifts and hangar;
- adequate deck strength and heat resistance;
- aircraft-specific deck and wind-over-deck limits; and
- angled flight deck.

The angled-deck requirement is mandatory for heavy jets under the shipped policy.

A heavy jet MUST NOT operate from a light-jet-only carrier.

## 11. Deck-Cycle States

The canonical deck-cycle states are:

- `UNREADY`;
- `READYING`;
- `SPOTTING`;
- `SPOTTED`;
- `LAUNCHING`;
- `FORMING`;
- `AIRBORNE`;
- `RETURNING`;
- `HOLDING`;
- `LANDING`;
- `REFUELING`;
- `REARMING`; and
- `STRUCK_DOWN`.

Every transition MUST be explicit, timestamped, and validated. Invalid transitions MUST fail with `INVALID_CARRIER_DECK_CYCLE_TRANSITION`.

## 12. Deck Contention

CAP, search, strike preparation, launch, recovery, refueling, rearming, and striking down aircraft share the flight deck.

The shipped simultaneous-operation policy is:

- straight deck: one operation class at a time;
- angled deck: one launch or spotting operation and one recovery operation may overlap when deck damage, weather, and traffic predicates pass;
- emergency recovery may preempt spotting and launch;
- fueled and armed aircraft on deck may prevent recovery when clear-deck capacity is insufficient; and
- one aircraft or deck position MUST NOT be reserved twice.

Operation priority is:

1. emergency recovery;
2. ordinary recovery for aircraft below reserve fuel;
3. alert CAP launch;
4. active strike launch;
5. search launch;
6. ordinary CAP launch;
7. spotting;
8. refueling and rearming; and
9. strike-down.

Equal-priority operations use ascending operation identifier.

## 13. Strike State

Every strike MUST have one authoritative `CarrierStrikeState` containing:

- `strikeId`;
- origin carrier or carriers;
- target report and confidence;
- ordered aircraft and squadron allocations;
- escort allocation;
- loadout and ordnance reservations;
- coordination mode;
- readiness-start time;
- planned and actual launch time;
- fuel and reserve requirements;
- spot-value requirement;
- formation state;
- mission state;
- recovery plan;
- ruleset version; and
- strike hash.

Targeting MUST use legal knowledge and reports, not hidden true target state.

## 14. Strike Preparation Time

The shipped base preparation times are:

- ordinary uncoordinated strike: exactly `20` tactical minutes;
- ordinary coordinated strike: exactly `30` tactical minutes;
- alert CAP: exactly `5` tactical minutes;
- search launch: exactly `10` tactical minutes;
- emergency re-strike with aircraft already fueled and armed: exactly `10` tactical minutes.

These durations include spotting and launch preparation but not post-launch formation time unless stated otherwise.

The permitted ordinary strike range is `20..30` minutes. The selected duration follows coordination mode and MUST be explicit.

## 15. Strike-Time Modifiers

The final preparation duration is:

`finalPreparationMinutes = clamp(5, 90, ceiling(basePreparationMinutes * deckCrewMultiplierBp * catapultTimeMultiplierBp * deckConfigurationTimeMultiplierBp * damageTimeMultiplierBp * weatherTimeMultiplierBp * oversizedTimeMultiplierBp / 10_000^6))`

Time multipliers below `10_000` improve speed. Values above `10_000` delay preparation.

The shipped values are:

- improved deck crew: `9_000` basis points;
- modern deck crew: `8_000`;
- compatible catapult support: `9_000`;
- angled deck: `9_000`;
- degraded flight deck: `12_500`;
- heavy precipitation: `15_000`;
- oversized carrier: `11_000`.

Only explicit applicable modifiers are included.

## 16. Coordinated Strike Effects

A coordinated strike requires the `30`-minute base duration and all participating squadrons to complete formation.

The shipped effects are:

- escort-cohesion multiplier: `12_000` basis points;
- strike-cohesion multiplier: `12_000`;
- mutual-defense multiplier: `11_000`;
- navigation and target-arrival dispersion multiplier: `8_500`, where lower is better;
- operational-loss multiplier: `9_000`; and
- formation time after launch: exactly `10` tactical minutes.

An uncoordinated strike uses neutral `10_000` multipliers and formation time `5` minutes.

Coordination MUST NOT improve weapon penetration or explosive damage.

## 17. Spot-Value Launch Limit

A strike may launch only when the number of aircraft assigned to the current launch cycle is less than or equal to current final spot value.

The predicate is:

`launchCycleAircraftCount <= finalSpotValue`

Equality is legal.

A larger strike MUST be split into separate launch cycles or rejected with `CARRIER_STRIKE_EXCEEDS_SPOT_VALUE`.

Multiple cycles MUST preserve exact squadron, escort, fuel, timing, and coordination records. Aircraft in later cycles are not airborne until their own launch completes.

## 18. Launch Rate

The shipped base launch rates are:

- no catapult, piston aircraft: `2` aircraft per tactical minute;
- one compatible catapult: `3`;
- two or more compatible catapults: `4`;
- one steam-or-later catapult with light jets: `2` jets per minute;
- two or more steam-or-later catapults: `3` jets per minute;
- heavy jets: aircraft-model and carrier-policy value, shipped default `2` per minute.

Launch duration is:

`launchDurationMinutes = ceiling(launchCycleAircraftCount / effectiveLaunchRatePerMinute)`

A damaged catapult or deck reduces rate through an explicit integer multiplier.

## 19. Automatic Carrier Maneuver

During mandatory launch or recovery, the carrier MUST automatically maintain the required wind-over-deck vector and minimum safe speed when physically possible.

The carrier-operations controller MUST create one authoritative maneuver command containing:

- required course interval;
- required speed interval;
- wind vector;
- deck-operation identifier;
- start and end times;
- collision and formation constraints; and
- failure behavior.

Conflicting player or AI maneuver commands MUST be rejected or superseded with `CARRIER_MANEUVER_LOCKED_BY_DECK_OPERATION`.

This applies in every realism mode.

## 20. Wind-Over-Deck Requirements

Every aircraft model and deck operation MUST declare minimum and maximum wind-over-deck values.

The shipped minimums are:

- piston launch: `20` knots;
- piston recovery: `18` knots;
- light-jet launch: `25` knots;
- light-jet recovery: `22` knots;
- heavy-jet launch: `30` knots;
- heavy-jet recovery: `25` knots;
- helicopter launch and recovery: model-defined, shipped default `0` minimum when deck motion permits.

Ambient wind and carrier motion combine through authoritative vector arithmetic.

If the requirement cannot be met, the operation is delayed or suspended explicitly.

## 21. Fueled and Armed Deck Hazard

Every aircraft on deck MUST have explicit fuel and ordnance state.

The carrier's aviation-hazard exposure is:

`hazardExposure = fueledAircraft * fueledAircraftWeight + armedAircraft * armedAircraftWeight + torpedoLoadedAircraft * torpedoWeight + guidedWeaponLoadedAircraft * guidedWeaponWeight`

The shipped integer weights are:

- fueled aircraft: `10`;
- armed aircraft: `10`;
- torpedo-loaded aircraft: additional `15`;
- guided-weapon or missile-loaded aircraft: additional `20`;
- aviation-fuel transfer active: additional fixed exposure `100`;
- ordnance handling active: additional fixed exposure `100`.

Hazard checks occur only after an eligible hit, fire spread, crash, fuel leak, ordnance accident, or explicit deck incident.

## 22. Aviation Fire and Explosion Risk

The shipped base conditional probabilities are:

- fueled-aircraft ignition after eligible deck damage: `2_000` basis points;
- armed-aircraft ordnance reaction: `1_500`;
- torpedo warhead reaction: `2_500`;
- missile or guided-weapon reaction: `2_000`;
- hangar aviation-fuel propagation: `2_500`;
- active fueling propagation: `5_000`.

Final probability is:

`finalHazardProbabilityBp = clamp(0, 10_000, floor(baseProbabilityBp * exposureMultiplierBp * damageMultiplierBp * firefightingMultiplierBp * deckConfigurationMultiplierBp / 10_000^4))`

Every successful reaction creates a separate causal damage package under `DESIGN-41`.

## 23. Night Recovery Eligibility

Night recovery is eligible only when:

- carrier and squadron have adopted `night_carrier_operations`;
- operational deck lighting and approach aids exist;
- contact and identification are valid;
- wind-over-deck and deck state pass;
- weather is not suspended under Section 25;
- carrier command accepts night recovery; and
- aircraft has sufficient fuel or emergency priority.

Without adopted night-operations capability, ordinary night recovery is prohibited. Emergency recovery remains possible with the exact emergency multiplier below.

## 24. Night Recovery Loss Risk

Each recovering aircraft MUST perform one operational-loss check.

The shipped base loss probabilities are:

- daylight recovery: `250` basis points;
- twilight recovery: `750`;
- trained night recovery: `2_500`;
- untrained emergency night recovery: `7_500`.

Final probability applies pilot experience, squadron experience, fatigue, aircraft damage, deck damage, weather, wind, carrier motion, approach aids, and traffic through explicit integer multipliers.

A failure MUST produce exactly one result:

- bolter or wave-off;
- recoverable deck accident;
- aircraft lost overboard;
- collision with parked aircraft;
- severe deck crash; or
- pilot and aircraft loss.

Every result preserves aircraft, pilot, carrier, and damage provenance.

## 25. Weather Suspension

Carrier operations MUST use `carrier_weather_operability_v1`.

The shipped suspension predicates are:

- sea state `8` or `9`: all fixed-wing launch and recovery suspended;
- sea state `7`: heavy-jet operations suspended; other fixed-wing operations use `5_000` rate multiplier;
- wind over deck outside aircraft limits: affected operation suspended;
- heavy precipitation: jet operation rate `5_000`, piston operation rate `7_500`;
- extreme precipitation: all fixed-wing launch suspended and recovery allowed only as emergency;
- visibility below `2` nautical miles: ordinary visual recovery suspended unless compatible instrument-landing technology exists;
- flight-deck fire intensity at or above `5_000`: launch and recovery suspended under `DESIGN-41`; and
- lightning or scenario-special hazards: explicit policy required.

A suspended operation MUST preserve aircraft and reservations, advance no deck-cycle work, and emit `CARRIER_OPERATIONS_SUSPENDED_BY_WEATHER`.

## 26. Recovery Priority

Recovery order is:

1. aircraft below emergency fuel reserve;
2. damaged aircraft;
3. aircraft carrying hazardous unreleased ordnance;
4. CAP required for immediate relaunch;
5. returning strike aircraft;
6. search aircraft;
7. normal CAP; and
8. ascending aircraft identifier.

A carrier MUST reserve deck and capacity before recovery. Diversion occurs only through an explicit alternate carrier, land base, ditching, or loss outcome.

## 27. Ordnance State

Aircraft ordnance MUST be reserved and tracked by exact inventory type and quantity.

Unused weapons from a stood-down or cancelled strike return to carrier storage only when:

- the aircraft remains aboard;
- jettison has not occurred;
- weapon and handling state remain safe;
- storage capacity exists; and
- a typed return-to-storage transaction completes.

Airborne weapons jettisoned for recovery, fuel, or safety are permanently removed from inventory.

No cancellation or recovery action may create ordnance.

## 28. Deck and Hangar Damage

Flight-deck, catapult, lift, hangar, fuel, and ordnance damage MUST independently affect:

- spot value;
- launch rate;
- recovery rate;
- aircraft movement between hangar and deck;
- refueling and rearming;
- fire and explosion risk;
- capacity access;
- repair requirements; and
- jet compatibility.

A damaged lift may trap aircraft in the hangar. Trapped aircraft continue to consume physical capacity but are unavailable for deck operations.

## 29. Carrier Operation Records

Every assignment, spot calculation, deck-cycle transition, preparation, launch, formation, recovery, diversion, weather suspension, maneuver lock, hazard check, crash, ordnance return, and inventory change MUST create an immutable `CarrierOperationRecord` containing:

- battle minute and substep or strategic phase;
- carrier, squadron, and aircraft identifiers;
- capacity-unit calculations;
- spot-value inputs and result;
- jet-capability predicates;
- deck state and contention result;
- timing and rate calculations;
- weather and wind inputs;
- hazard exposure and decisions;
- inventory transactions;
- formula, content, ruleset, and RNG versions; and
- record hash.

## 30. Canonical Ordering

Carrier operations MUST order:

1. carriers by identifier;
2. emergency recovery before other operations;
3. operation classes by Section 12 priority;
4. strikes by planned launch time and strike identifier;
5. squadrons by identifier;
6. aircraft by model and aircraft identifier;
7. catapults and lifts by equipment identifier;
8. hazard checks by causal event and aircraft identifier; and
9. inventory transactions by item and transaction identifier.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect outcomes.

## 31. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_CARRIER_OPERATIONS_STATE`;
- `CARRIER_CAPACITY_EXCEEDED`;
- `CARRIER_AIRCRAFT_CAPACITY_INCOMPATIBLE`;
- `CARRIER_OVERSIZED_AIR_GROUP_PENALTY_ACTIVE`;
- `CARRIER_SPOT_VALUE_ZERO`;
- `CARRIER_STRIKE_EXCEEDS_SPOT_VALUE`;
- `JET_CARRIER_DISPLACEMENT_INSUFFICIENT`;
- `JET_CARRIER_CATAPULT_REQUIRED`;
- `HEAVY_JET_CARRIER_INELIGIBLE`;
- `HEAVY_JET_ANGLED_DECK_REQUIRED`;
- `INVALID_CARRIER_DECK_CYCLE_TRANSITION`;
- `CARRIER_DECK_CONTENTION`;
- `CARRIER_MANEUVER_LOCKED_BY_DECK_OPERATION`;
- `CARRIER_WIND_OVER_DECK_INSUFFICIENT`;
- `CARRIER_OPERATIONS_SUSPENDED_BY_WEATHER`;
- `CARRIER_NIGHT_RECOVERY_INELIGIBLE`;
- `CARRIER_RECOVERY_OPERATIONAL_LOSS`;
- `CARRIER_AVIATION_FIRE_HAZARD`;
- `CARRIER_AVIATION_ORDNANCE_HAZARD`;
- `CARRIER_ORDNANCE_INVENTORY_INSUFFICIENT`; and
- `CARRIER_OPERATIONS_INVARIANT_FAILED`.

## 32. Validation and Acceptance

Automated validation MUST prove that:

1. every carrier has complete capacity, spot, deck, catapult, lift, damage, ordnance, air-group, weather, and inventory state;
2. CVL capacity is exactly 4 through 34 and CV begins at 35;
3. ordinary aircraft consume exactly two capacity units and eligible jets three;
4. capacity is checked per aircraft using integer units without aggregate fractional rounding;
5. carriers above 100 aircraft use exact 9,000 efficiency, 12,500 maintenance, 9,500 coordination, and 11,000 hazard multipliers;
6. a carrier at exactly 100 receives no oversized penalty;
7. base spot value is exactly floor of half compiled capacity;
8. catapult, speed, deck, damage, technology, and oversized modifiers execute exactly once and round once;
9. speed below 24 knots reduces spot value and exactly 24 knots does not;
10. light jets require exactly 40,000 tonnes or 30,000 tonnes with a compatible steam-or-later catapult plus all physical and technology predicates;
11. heavy jets require exactly 40,000 tonnes, modern technology, catapult, arresting gear, compatible dimensions, and angled deck;
12. displacement alone never grants jet capability;
13. deck cycles use only explicit states and transitions;
14. straight decks permit one operation class at a time and angled decks permit only the declared overlap;
15. operation contention uses exact deterministic priority;
16. ordinary uncoordinated strikes use exactly 20 minutes and coordinated strikes 30;
17. alert CAP uses five minutes, search ten, and emergency re-strike ten;
18. coordinated strikes use exact cohesion, defense, dispersion, loss, and formation-time values;
19. a launch cycle may equal but never exceed current spot value;
20. oversized strikes split into explicit cycles or fail;
21. launch duration uses exact integer rates and ceiling rounding;
22. mandatory deck operations create authoritative carrier maneuver commands and reject conflicting orders;
23. wind-over-deck uses exact piston, jet, heavy-jet, and helicopter thresholds;
24. fueled and armed deck aircraft use exact integer exposure weights;
25. conditional aviation hazards use exact base probabilities and separate causal damage packages;
26. night recovery requires exact technology, deck, weather, command, and fuel predicates;
27. operational-loss bases are exactly 250, 750, 2,500, and 7,500 basis points;
28. weather suspension uses exact sea-state, precipitation, visibility, fire, and wind predicates;
29. suspended operations advance no deck-cycle work;
30. recovery uses exact emergency, damage, ordnance, CAP, strike, search, and identifier priority;
31. unused aboard weapons return through typed inventory transactions and jettisoned airborne weapons are lost;
32. damaged and trapped aircraft continue to consume physical capacity; and
33. identical state, commands, content, ruleset, weather, knowledge, and seeds produce identical capacity, spot, cycles, strikes, recovery, hazards, inventory, records, and hashes.
