# DESIGN-45: Air Defense

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-45`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Air-defense layers, engagement timing, target eligibility, disruption, director scaling, radar-directed group saturation, CIWS redundancy, CAP, ammunition, damage, ordering, and persistence MUST use the explicit fields, formulas, predicates, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Defense Layers

The canonical defense layers, resolved in this exact order, are:

1. `CAP`;
2. `HEAVY_SAM`;
3. `MEDIUM_SAM`;
4. `LIGHT_SAM`;
5. `HEAVY_AA`;
6. `MEDIUM_AA`;
7. `LIGHT_AA`;
8. `CIWS_TERMINAL_DEFENSE`.

A layer with no eligible system MUST emit a successful empty result. A surviving attack proceeds to the next eligible layer.

One physical weapon, director, radar channel, ammunition unit, or CAP aircraft MUST NOT be allocated to two simultaneous engagements unless its definition explicitly provides multiple independent channels.

## 2. Air-Defense State

Every defended ship, formation, or area MUST have one authoritative `AirDefenseState` containing:

- defender identifier and scope;
- ordered defense-system identifiers;
- CAP state reference;
- director and radar-channel state;
- crew quality and fatigue;
- damage and power state;
- ammunition by type;
- current target allocations;
- engagement-channel reservations;
- disruption records;
- ruleset and formula versions; and
- aggregate hash.

A missing or inconsistent state MUST fail with `INVALID_AIR_DEFENSE_STATE`.

## 3. Air-Defense System Definition

Every defense system MUST have one immutable `AirDefenseSystemDefinition` containing:

- system identifier;
- defense layer;
- weapon category;
- launcher or mount count;
- barrels or ready rounds per mount;
- compatible ammunition;
- minimum and maximum range;
- minimum and maximum altitude;
- target-speed limit;
- attack-profile eligibility;
- fire-control requirement;
- radar requirement or `NONE`;
- engagement channels;
- base kill, damage, abort, and disruption values;
- rate and ammunition policy;
- saturation group;
- content version; and
- content hash.

Missing metadata MUST fail with `INVALID_AIR_DEFENSE_SYSTEM_DEFINITION`.

## 4. Attack Types

The canonical incoming attack types are:

- `AIRCRAFT_LEVEL_BOMBING`;
- `AIRCRAFT_DIVE_BOMBING`;
- `AIRCRAFT_SKIP_BOMBING`;
- `AIRCRAFT_TORPEDO_ATTACK`;
- `AIRCRAFT_ROCKET_ATTACK`;
- `AIRCRAFT_GUIDED_WEAPON_ATTACK`;
- `HEAVY_ASM`;
- `MEDIUM_ASM`;
- `LIGHT_ASM`;
- `ANTI_RADIATION_WEAPON`; and
- `SPECIAL_EXPLICIT_ATTACK`.

Every attack MUST declare release range, release altitude, speed profile, terminal profile, formation size, cohesion, defensive susceptibility, and target identifier.

## 5. Engagement Outcomes

Every defense-layer engagement MUST produce exactly one primary outcome:

- `KILL`;
- `DAMAGE`;
- `ABORT`;
- `DISRUPTION`; or
- `NO_EFFECT`.

`KILL` removes the attacking aircraft or weapon before later layers where timing permits.

`DAMAGE` applies a persistent damage state but does not imply abort unless the attacker's damage policy says so.

`ABORT` prevents weapon release or causes a released weapon to lose its attack, according to engagement timing.

`DISRUPTION` is separate from physical damage and uses Section 6.

## 6. Disruption

Every disruption result MUST create one `AirAttackDisruptionRecord` containing:

- attacking formation or weapon identifier;
- source defense layer and system;
- disruption points;
- attack-accuracy multiplier;
- formation-cohesion multiplier;
- release-timing modifier;
- start and expiration phase;
- stacking group; and
- record hash.

The shipped disruption levels are:

- `LIGHT`: accuracy `9_000`, cohesion `9_500` basis points;
- `MODERATE`: accuracy `7_500`, cohesion `8_500`;
- `SEVERE`: accuracy `5_000`, cohesion `6_500`;
- `MISSION_ABORT`: attack does not proceed.

For several disruption records, only the highest severity from one defense layer applies. Different defense layers multiply in canonical layer order and round once at final attack resolution.

## 7. Heavy AA Eligibility

`HEAVY_AA` may engage an aircraft formation when:

- the formation is attacking the defended ship; or
- it is attacking a nearby protected ship within exactly `5` nautical miles of the heavy-AA ship; and
- the target lies within the system's range, altitude, speed, arc, director, radar, ammunition, and power limits; and
- the firing ship is not sunk, abandoned, or unable to operate the system.

The permitted protected radius is `3..8` nautical miles. The shipped value is exactly `5`.

A heavy-AA system MUST NOT engage an unrelated formation outside its protected radius merely because both are in the same battle.

## 8. Medium AA Eligibility and Timing

`MEDIUM_AA` may engage only an attack profile explicitly marked `mediumAaEligible`.

For aircraft-delivered attacks, medium AA receives one pre-release engagement window when the attacker enters the system's range before weapon release.

The engagement resolves at the earliest authoritative tactical substep satisfying:

- target within range and altitude envelope;
- target remains pre-release;
- fire-control solution at least `4_000` basis points;
- system has a free channel and ammunition; and
- no earlier layer killed or aborted the attacker.

If the attacker releases before these predicates pass, medium AA loses its pre-release opportunity but MAY receive a separate post-release opportunity only when the system definition explicitly supports the released weapon type.

## 9. Light AA Eligibility and Timing

`LIGHT_AA` engagement windows are based on incoming speed and attack profile.

The shipped base windows before impact or closest approach are:

- level bombing: `2` tactical minutes;
- dive bombing: `1` minute;
- skip bombing: `1` minute;
- torpedo attack: `2` minutes;
- rocket attack: `1` minute;
- aircraft-delivered guided weapon: `1` minute against the aircraft before release when in range;
- light ASM: system-specific terminal window, minimum one authoritative substep;
- medium or heavy ASM: ineligible unless the light-AA system explicitly lists it.

Speed modifies the window:

- below `200` knots: `10_000` basis points;
- `200` through below `350`: `7_500`;
- `350` through below `500`: `5_000`;
- `500` knots or higher: `2_500`.

`effectiveWindowMilliseconds = max(1_000, floor(baseWindowMilliseconds * speedWindowMultiplierBp / 10_000))`

## 10. Guaranteed Light-AA Disruption Opportunity

Every eligible light-AA system receives at least one disruption check against each attack that enters its valid terminal envelope, even when:

- the computed firing window is shorter than one tactical minute;
- no full damage or kill firing cycle completes; or
- the attack reaches release before a second firing opportunity.

The minimum opportunity is exactly one authoritative tactical substep.

This guarantee provides only a `DISRUPTION` check. It does not guarantee ammunition availability, a hit, physical damage, abort, or survival.

The check is prohibited when the system is destroyed, unpowered, out of ammunition, out of arc, target-ineligible, or has no legal contact.

## 11. AA Director Assignment

An AA director may control exactly one engagement channel unless its definition explicitly supplies more channels.

Directors MUST be assigned before firing by:

1. defense layer priority;
2. threat score descending;
3. time to impact ascending;
4. target identifier ascending; and
5. director identifier ascending.

One director MUST NOT provide its full modifier to two simultaneous groups.

## 12. AA Director Scaling

The shipped `aa_director_scaling_v1` effectiveness multipliers by operational director count assigned to one defended ship are:

- `0`: `5_000` basis points;
- `1`: `10_000`;
- `2`: `18_000` aggregate directed-fire value;
- `3`: `25_000` aggregate directed-fire value;
- `4`: `31_000` aggregate directed-fire value.

Directors `1` through `4` use the normal scaling schedule above.

Additional directors after the fourth contribute only to channel availability, redundancy, replacement of damaged directors, or another explicit policy. They do not increase aggregate directed-fire value under the shipped policy.

The permitted normal-scaling cap is `2..6`. The shipped cap is exactly `4`.

## 13. Radar-Directed Medium-AA Groups

A `radar-directed medium-AA group` is one independently targetable medium-AA group with:

- operational radar fire control;
- an assigned radar channel;
- an operational director;
- compatible ammunition;
- power; and
- a distinct engagement channel.

Groups lacking any predicate are counted as ordinary medium AA rather than radar-directed groups.

## 14. Medium-AA Diminishing Returns

The shipped `radar_medium_aa_saturation_v1` marginal effectiveness multipliers are:

- groups `1..4`: `10_000` basis points each;
- groups `5..6`: `5_000` each;
- groups `7..8`: `2_500` each;
- groups `9` and above: `500` each.

Effective group count is:

`effectiveRadarMediumAaGroups = sum(marginalGroupMultiplierBp) / 10_000`

The division is retained as an exact rational value until the owning engagement formula rounds.

Thus:

- the first four groups provide full marginal value;
- groups five through eight have diminishing returns; and
- groups above eight are operationally redundant except for a `500` basis-point residual contribution and replacement capacity.

No group may exceed an available radar, director, ammunition, or power channel.

## 15. CIWS System Definition

A CIWS system is one independent terminal-defense mount or launcher with its own engagement channel and compatible sensor or local-control path.

Multiple barrels belonging to one mount count as one CIWS system unless the definition declares independent channels.

A damaged, unpowered, empty, jammed, or out-of-arc CIWS system contributes zero.

## 16. CIWS Redundancy

The shipped `ciws_redundancy_v1` marginal effectiveness multipliers per defended ship are:

- systems `1..4`: `10_000` basis points each;
- systems `5..6`: `5_000` each;
- systems `7..8`: `1_500` each;
- systems `9` and above: `500` each.

The first four systems provide full normal value. This is the concrete shipped optimum for an ordinary independently targetable threat set.

Systems five and six provide reduced value. Systems above six are strongly redundant.

Additional systems may still provide:

- extra arcs;
- replacement after damage;
- simultaneous-threat channels;
- ammunition depth; and
- residual marginal effectiveness under the schedule.

The schedule MUST NOT be interpreted as a hard construction cap.

## 17. Simultaneous Threats

A defense system can engage no more simultaneous threats than its available channels.

Threat assignment MUST order:

1. weapons already released and closest to impact;
2. aircraft before release when abort remains possible;
3. threats against the defended ship;
4. threats against protected nearby ships;
5. expected damage descending;
6. time to impact ascending; and
7. target identifier ascending.

Excess threats remain unengaged by that system for the current opportunity.

## 18. Attack-Layer Matching

The shipped eligibility matrix is:

- heavy ASM: `CAP`, `HEAVY_SAM`, `MEDIUM_SAM`, and explicitly capable `CIWS_TERMINAL_DEFENSE`;
- medium ASM: `CAP`, `HEAVY_SAM`, `MEDIUM_SAM`, `LIGHT_SAM`, and compatible terminal defense;
- light ASM: `CAP`, `MEDIUM_SAM`, `LIGHT_SAM`, `HEAVY_AA` when explicitly capable, `LIGHT_AA` when explicitly capable, and CIWS;
- level bombing and rockets: CAP and applicable SAM and AA layers;
- dive, skip, and torpedo bombing: CAP, applicable SAM, medium AA before release, light AA, and CIWS where target profile permits;
- guided or missile attack aircraft: aircraft may be engaged before release and released weapons afterward according to weapon class.

A defense layer absent from the attack's explicit eligibility set MUST NOT engage it.

## 19. Engagement Resolution

For each eligible system-target pair:

`effectiveDefenseBp = floor(baseDefenseBp * directorMultiplierBp * radarMultiplierBp * crewMultiplierBp * damageMultiplierBp * ammunitionMultiplierBp * targetProfileMultiplierBp * weatherMultiplierBp * saturationMultiplierBp / 10_000^8)`

The exact rational result MUST be rounded once with `FLOOR`.

Kill, damage, abort, and disruption checks MUST use separate domain decisions or an explicit mutually exclusive outcome table.

The same engagement MUST NOT count one random draw as both physical kill and disruption unless its outcome table explicitly combines them.

## 20. Ammunition and Fire Limits

Every engagement MUST reserve and consume exact ammunition.

Each defense system MUST declare:

- rounds or missiles per engagement;
- sustained-fire limit;
- burst-fire limit;
- reload or cooling time;
- jam and misfire policy;
- magazine or ready-service capacity; and
- resupply restriction.

An empty system contributes zero. A defensive opportunity does not create ammunition.

## 21. Damage and Power

Damage MUST independently affect:

- weapon mount or launcher;
- director;
- radar or local sensor;
- electrical power;
- data or communication path;
- ammunition feed;
- stabilization; and
- engagement channels.

An intact gun with a destroyed director may use local control only when its definition provides an exact local-control multiplier.

The shipped local-control multiplier is `5_000` basis points.

## 22. CAP State

Every defended force MAY have one authoritative `CAPState` containing:

- airborne CAP aircraft;
- ready CAP aircraft;
- refueling CAP aircraft;
- alert level;
- endurance state;
- fighter-direction capability;
- radar-warning state;
- assigned protection scope;
- fatigue;
- ammunition and fuel; and
- state hash.

The same aircraft MUST NOT be airborne, ready, and refueling simultaneously.

## 23. CAP Interception

CAP interception eligibility requires:

- legal warning or detection;
- available CAP aircraft;
- sufficient fuel, ammunition, endurance, and altitude performance;
- target within interception reach;
- fighter direction or autonomous interception policy;
- weather eligibility; and
- no duplicate reservation.

Radar and fighter direction affect contact time, vector quality, number of interceptors, and attack geometry through explicit formulas.

## 24. CAP Exhaustion

Each completed interception consumes exact fuel, ammunition, and fatigue.

The shipped exhaustion thresholds are:

- fatigue below `60`: no exhaustion penalty;
- `60..79`: interception-effectiveness multiplier `8_500` basis points;
- `80..89`: `6_500`;
- `90..100`: `4_000`.

An aircraft with insufficient fuel or ammunition moves to returning or unavailable state.

Repeated attacks therefore reduce CAP only through exact inventory, endurance, fatigue, damage, and recovery state.

## 25. Nearby-Ship Protection

A system may protect a nearby ship only when:

- the protected ship lies inside the system's explicit protected radius;
- line of sight or radar track exists where required;
- no blocking geometry or friendly-fire rule rejects engagement;
- target allocation assigns a channel; and
- command and communication policy permit cooperative defense.

Nearby protection does not duplicate the protected ship's own defensive engagement. Every system fires and consumes resources once.

## 26. Records and Audit

Every detection, threat assignment, director assignment, CAP interception, SAM engagement, AA engagement, light-AA disruption opportunity, CIWS engagement, ammunition use, jam, kill, damage, abort, and disruption MUST create an immutable `AirDefenseEngagementRecord` containing:

- battle minute and substep;
- defended and attacking asset identifiers;
- attack type and profile;
- defense layer and system;
- director, radar, crew, damage, power, and ammunition state;
- timing and channel allocation;
- scaling and saturation values;
- probability and random decisions;
- outcome and persistence effects;
- formula and ruleset versions; and
- record hash.

## 27. Canonical Ordering

Air defense MUST resolve by:

1. incoming attack arrival time;
2. defense-layer order from Section 1;
3. defended ship identifier;
4. threat priority from Section 17;
5. defense-system identifier;
6. director and radar-channel identifier;
7. engagement identifier; and
8. outcome effect ordinal.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect results.

## 28. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_AIR_DEFENSE_STATE`;
- `INVALID_AIR_DEFENSE_SYSTEM_DEFINITION`;
- `AIR_DEFENSE_TARGET_INELIGIBLE`;
- `AIR_DEFENSE_CHANNEL_UNAVAILABLE`;
- `AIR_DEFENSE_DIRECTOR_UNAVAILABLE`;
- `AIR_DEFENSE_RADAR_UNAVAILABLE`;
- `AIR_DEFENSE_AMMUNITION_UNAVAILABLE`;
- `HEAVY_AA_PROTECTED_RADIUS_EXCEEDED`;
- `MEDIUM_AA_PRE_RELEASE_WINDOW_MISSED`;
- `LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED`;
- `AA_DIRECTOR_NORMAL_SCALING_CAP_REACHED`;
- `RADAR_MEDIUM_AA_DIMINISHING_RETURNS_ACTIVE`;
- `RADAR_MEDIUM_AA_REDUNDANT_GROUP_ACTIVE`;
- `CIWS_DIMINISHING_RETURNS_ACTIVE`;
- `CIWS_STRONG_REDUNDANCY_ACTIVE`;
- `CAP_INTERCEPTION_INELIGIBLE`;
- `CAP_EXHAUSTED`;
- `AIR_ATTACK_DISRUPTED`;
- `AIR_ATTACK_ABORTED`; and
- `AIR_DEFENSE_INVARIANT_FAILED`.

## 29. Validation and Acceptance

Automated validation MUST prove that:

1. defense layers resolve in the exact declared order;
2. every system has complete range, altitude, speed, profile, fire-control, radar, channel, outcome, rate, ammunition, and saturation data;
3. every engagement produces exactly one primary outcome;
4. disruption remains separate from physical damage and uses exact severity multipliers;
5. heavy AA protects its own ship and nearby ships only within exactly five nautical miles in the shipped policy;
6. medium AA receives one exact pre-release opportunity only when all predicates pass;
7. light-AA windows use exact attack-profile durations and speed bands;
8. every eligible light-AA system receives at least one disruption check of one authoritative substep;
9. the guaranteed light-AA opportunity does not guarantee ammunition, hit, damage, or abort;
10. directors are allocated to exact channels and cannot control two groups without explicit multi-channel capability;
11. directors one through four use exact aggregate values 10,000, 18,000, 25,000, and 31,000;
12. directors above four provide no additional aggregate directed-fire value under the shipped policy;
13. radar-directed medium-AA groups one through four use 10,000 marginal basis points;
14. groups five and six use 5,000, seven and eight 2,500, and groups above eight 500;
15. CIWS systems one through four use 10,000 marginal basis points;
16. CIWS systems five and six use 5,000 and systems above six use exact strong-redundancy values;
17. four CIWS systems are the complete normal-value set but not a construction cap;
18. attack-layer matching uses the explicit matrix and no undeclared layer engages;
19. simultaneous threats cannot exceed available channels;
20. effective defense uses exact integer multiplication and one final floor rounding;
21. ammunition, burst, cooling, reload, jams, and magazines are explicit and authoritative;
22. damage to weapon, director, radar, power, communication, feed, and stabilization is applied independently;
23. local control uses exactly 5,000 basis points when supported;
24. CAP aircraft remain in exactly one state and interception checks exact warning, reach, fuel, ammunition, endurance, direction, weather, and reservation predicates;
25. CAP fatigue uses exact 8,500, 6,500, and 4,000 effectiveness multipliers;
26. nearby protection consumes each system and channel exactly once;
27. every engagement creates complete timing, allocation, scaling, decision, outcome, version, and hash records; and
28. identical state, commands, content, ruleset, weather, contacts, and seeds produce identical threat assignment, CAP, SAM, AA, CIWS, disruption, losses, records, and hashes.
