# DESIGN-40: Torpedoes

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-40`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Torpedo inventory, compatibility, fire control, automated and manual launch authority, underwater-tube speed limits, hit resolution, flooding, machinery damage, system loss, and tube-hit hazards MUST use the explicit fields, values, predicates, streams, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Torpedo Model

Every torpedo model MUST have one immutable `TorpedoModelDefinition` containing:

- `torpedoModelId`;
- owner or licensing nation identifiers;
- technology prerequisite identifiers;
- production requirement identifier;
- diameter and mass;
- warhead type and explosive-equivalent mass;
- propulsion type;
- ordered speed and range settings;
- minimum arming distance;
- reliability basis points;
- depth-keeping profile;
- guidance capability;
- compatible launcher-family identifiers;
- oxygen-propulsion state;
- tube-hit hazard policy identifier;
- content version; and
- content hash.

A missing or invalid field MUST fail with `INVALID_TORPEDO_MODEL_DEFINITION`.

## 2. Launcher State

Every installed torpedo launcher MUST have one authoritative `TorpedoLauncherState` containing:

- `launcherId`;
- owner platform identifier;
- launcher-family identifier;
- mount position;
- mount type;
- tube count;
- loaded torpedo model per tube or `EMPTY`;
- reserve ammunition by model;
- reload state;
- training and bearing limits;
- underwater-launch capability;
- fire-control connection state;
- damage state;
- flooding-isolation state;
- active fire solution or `NONE`;
- ruleset and formula versions; and
- state hash.

`mountType` MUST be exactly one of:

- `ABOVE_WATER_FIXED`;
- `ABOVE_WATER_TRAINABLE`;
- `UNDERWATER_FIXED`;
- `UNDERWATER_TRAINABLE`; or
- `SUBMARINE_INTERNAL`.

## 3. Ammunition and Inventory

Every launch MUST consume exactly one loaded torpedo per fired tube.

A reload MUST reserve and consume one compatible reserve torpedo and the required reload time.

A launcher MUST NOT create ammunition, substitute an incompatible model, or exceed physical tube and magazine capacity.

When modeled by the active ruleset, new torpedo models require production, inventory delivery, and local supply before installation or reload.

Failure MUST use `TORPEDO_AMMUNITION_UNAVAILABLE` or `TORPEDO_MODEL_INCOMPATIBLE`.

## 4. Platform Compatibility

A torpedo model may be installed only when:

- model diameter fits the launcher;
- model mass does not exceed launcher and handling limits;
- propulsion and safety requirements are supported;
- fire-control system supports the model;
- platform technology and adoption predicates pass;
- inventory is available; and
- treaty or scenario restrictions permit it.

If a newer model exceeds mount mass or handling limits, adoption requires a validated refit under `DESIGN-23`.

A supply or administrative action MUST NOT bypass mechanical compatibility.

## 5. Torpedo Command Authority

The shipped tactical policy is `torpedo_launch_authority_v1`.

### 5.1 Admiral Mode

In `ADMIRAL` mode:

- player manual launch is prohibited;
- player may issue force-level or mission-level torpedo-attack intent where the force-order contract permits it;
- tactical AI selects eligible launchers, targets, timing, settings, and salvo size; and
- every launch still uses a normal authoritative command record.

### 5.2 Rear Admiral Mode

In `REAR_ADMIRAL` mode:

- player manual launch is prohibited;
- player may issue `DivisionTorpedoAttackOrder` to a legally known target contact;
- tactical AI selects individual ships, launchers, firing time, settings, and salvo size; and
- command reach and acknowledgment remain required.

### 5.3 Captain Mode

In `CAPTAIN` mode, the player may issue `ManualTorpedoLaunchCommand` for a player-owned eligible ship and launcher.

The command MUST specify:

- ship and launcher identifiers;
- legally known target contact;
- selected torpedo model;
- selected speed and range setting;
- salvo tube identifiers;
- requested gyro angle or fire-control solution reference;
- intended effective tactical substep; and
- idempotency key.

Captain mode does not bypass eligibility, solution, safety, ammunition, speed, arc, damage, crew, or identification rules.

### 5.4 AI and Automation

AI-controlled ships and player ships without a valid manual launch command use the same `LaunchTorpedoCommand` contract through tactical AI.

The AI MUST NOT mutate launcher state directly or use hidden target truth.

## 6. Launch Eligibility

A launch is eligible only when all predicates pass:

- issuer has authority under Section 5;
- launcher and selected tubes are operational;
- compatible torpedoes are loaded;
- reload and safety interlocks are complete;
- target contact confidence is at least `4_000` basis points;
- target is not identified as friendly;
- target lies within launcher training and bearing limits;
- target range lies within selected setting limits;
- minimum arming distance can be satisfied;
- fire solution quality meets Section 10;
- own-ship speed satisfies launcher limits;
- own maneuver does not violate the fire-control limit;
- sea state permits launch;
- no friendly-fire safety predicate rejects the shot; and
- ammunition reservation succeeds.

Failure MUST consume no torpedo and produce one explicit reason code.

## 7. Underwater-Tube Speed Limit

`UNDERWATER_FIXED` and `UNDERWATER_TRAINABLE` launchers MUST NOT fire when the launching ship's authoritative current through-water speed is strictly greater than exactly `25` knots.

The canonical speed threshold is:

`12_861_100` micrometres per second.

The predicate is:

`currentSpeedMicrometresPerSecond <= 12_861_100`

A speed exactly equal to `25` knots is legal. Any greater speed is illegal.

The check occurs at command validation and again at the exact firing substep.

A ship that accelerates above the threshold after command issuance but before firing MUST fail with `UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED`, consume no torpedo, and leave the command completed with a failed launch outcome.

`SUBMARINE_INTERNAL` tubes use their model-specific submerged and surfaced launch-speed limits and are not governed by this surface-ship underwater-tube threshold unless their definition explicitly references it.

## 8. Above-Water Launcher Limits

Every above-water launcher family MUST declare an exact maximum launch speed.

The shipped default is:

- fixed above-water tube: `30` knots;
- trainable above-water mount: `35` knots.

A launcher definition MAY supply a narrower explicit value.

Missing speed metadata MUST fail with `TORPEDO_LAUNCH_SPEED_LIMIT_MISSING`.

## 9. Fire-Solution Inputs

Torpedo solution quality MUST use:

- target estimated range;
- target relative bearing;
- target estimated speed and course;
- target-contact uncertainty;
- own speed and course;
- own turn rate;
- launcher geometry;
- crew quality;
- torpedo-tactics training;
- sea state;
- visibility and identification;
- fire-control technology;
- launcher damage;
- target maneuver history; and
- selected torpedo setting.

The resolver MUST use knowledge estimates available to the firing side, not hidden true target state.

## 10. Fire-Solution Quality

Solution quality is an integer within `0..10_000` basis points.

The shipped formula is:

`solutionQualityBp = clamp(0, 10_000, floor(baseSolutionBp * rangeMultiplierBp * bearingMultiplierBp * targetMotionMultiplierBp * ownManeuverMultiplierBp * crewMultiplierBp * trainingMultiplierBp * seaStateMultiplierBp * visibilityMultiplierBp * technologyMultiplierBp * damageMultiplierBp / 10_000^10))`

The exact rational result MUST be rounded once with `FLOOR`.

The shipped minimum launch quality is:

- automated single-target launch: `5_000` basis points;
- manual Captain-mode launch: `4_000`;
- area denial or spread fire through an explicit doctrine: `3_000`;
- friendly ships inside the danger sector: minimum `7_500` or launch prohibited by the safety policy.

A player may manually accept lower solution quality only down to the Captain-mode minimum. No mode permits a quality below an explicit doctrine threshold.

## 11. Salvo Size

A salvo MUST specify exact tube identifiers.

The shipped AI salvo policy uses:

- target combat value;
- target size;
- range;
- solution quality;
- remaining ammunition;
- number of friendly launchers;
- overkill estimate;
- mission objective; and
- withdrawal state.

A single command MUST NOT fire more operational tubes than the launcher physically contains.

Manual and AI salvos reserve ammunition atomically before any tube fires.

## 12. Launch Timing and Failure

Each tube in an accepted salvo fires in ascending tube identifier order at its declared firing substep.

If one tube fails mechanically:

- that tube consumes no torpedo unless the failure outcome is `TORPEDO_STUCK_IN_TUBE`;
- later tubes continue only when the salvo policy permits it;
- every result is recorded separately; and
- no random branch changes canonical tube order.

The shipped base launch-failure probability is `100` basis points per tube before model, damage, crew, and reliability modifiers.

## 13. Torpedo Track

Every launched torpedo MUST create one authoritative `TorpedoTrack` containing:

- `torpedoTrackId`;
- launcher, ship, and firing-side identifiers;
- target contact identifier or `NONE` for area fire;
- torpedo model and setting;
- launch minute and substep;
- launch position and heading;
- ordered gyro angle;
- speed;
- maximum run distance;
- arming distance;
- depth setting;
- reliability state;
- guidance state;
- detection state by participant;
- current position;
- terminal result; and
- track hash.

A torpedo remains an authoritative tactical entity until hit, detonation, dud, grounding, exhaustion, destruction, or battle end.

## 14. Hit Resolution

A torpedo hit requires:

- track intersects the target's authoritative collision geometry;
- torpedo has traveled at least its arming distance;
- depth and target draft are compatible;
- no explicit avoidance, decoy, interception, or failure result prevents contact;
- target remains a legal physical object; and
- impact substep ordering is valid.

Contact MUST NOT guarantee detonation.

The detonation resolver MUST evaluate reliability, fuze, impact geometry, depth, target protection, and damage state.

## 15. Detonation Outcomes

The canonical detonation outcomes are:

- `DUD`;
- `PARTIAL_DETONATION`;
- `FULL_DETONATION`;
- `PREMATURE_DETONATION`;
- `MAGAZINE_OR_TUBE_CHAIN_REACTION`; and
- `NO_CONTACT`.

Every outcome MUST be selected through an explicit deterministic predicate or keyed random decision.

The result MUST record all inputs, probability, random decision, and provenance.

## 16. Torpedo Damage Package

A damaging detonation MUST create one `TorpedoDamagePackage` containing:

- target ship and impact zone;
- warhead explosive-equivalent mass;
- detonation depth;
- impact side and longitudinal position;
- underwater-protection resistance;
- hull-breach area;
- immediate flooding;
- progressive-flooding source rate;
- machinery damage;
- nearby turret and system shock damage;
- fire probability;
- crew casualties;
- structural damage;
- flotation loss;
- damage-control accessibility; and
- package hash.

Damage MUST apply atomically through the tactical damage contract.

## 17. Flotation Damage

Immediate flotation loss is:

`immediateFlotationLoss = floor(baseWarheadFlotationDamage * protectionLeakMultiplierBp * impactZoneMultiplierBp * existingDamageMultiplierBp / 10_000^3)`

The shipped protection leak multipliers are:

- no torpedo-defense system: `15_000` basis points;
- weak system: `12_500`;
- standard system: `10_000`;
- strong system: `7_500`;
- advanced system: `5_000`.

The shipped impact-zone multipliers are:

- bow or stern extremity: `7_500`;
- machinery space: `12_500`;
- magazine zone: `12_500`;
- central protected zone: `10_000`;
- already breached zone: `15_000`.

Final flotation loss MUST be a non-negative integer and MUST NOT exceed remaining flotation reserve without transitioning to a sinking or sunk state.

## 18. Progressive Flooding

Every damaging underwater hit MUST create zero or more `FloodingSource` records.

For each source:

`floodingRate = floor(baseBreachRate * seaPressureMultiplierBp * hullDamageMultiplierBp * compartmentMultiplierBp * isolationMultiplierBp / 10_000^4)`

The shipped isolation multipliers are:

- intact isolation: `5_000` basis points;
- degraded isolation: `10_000`;
- failed isolation: `15_000`.

Flooding resolves at each tactical minute until:

- isolated;
- pumped below the source rate;
- repaired;
- the compartment fully floods;
- the ship sinks; or
- battle ends and strategic persistence takes over.

Progressive flooding MUST NOT be represented as one narrative result.

## 19. Machinery Damage

A torpedo hit in or adjacent to machinery spaces MUST evaluate:

- propulsion unit damage;
- shaft damage;
- boiler or reactor damage;
- electrical generation loss;
- steering damage;
- fuel-system rupture; and
- speed and acceleration reduction.

The shipped machinery-hit severity weights are:

- no machinery effect: `1_000`;
- degraded propulsion: `4_000`;
- major propulsion loss: `3_000`;
- dead in water: `1_500`;
- catastrophic machinery loss: `500`.

Weights total exactly `10_000` before impact and protection modifiers.

A non-machinery impact uses an explicit reduced eligibility multiplier of `2_500` basis points.

## 20. Turret and System Loss

Underwater shock may damage a turret, magazine handling system, fire-control connection, radar, sonar, pumps, electrical system, steering, or other nearby system only when the system lies within the impact zone's declared shock radius.

The shipped base system-shock probability is:

- within primary shock radius: `3_000` basis points;
- within secondary shock radius: `1_000`;
- outside declared radius: `0`.

A successful check MUST select from actual nearby systems in ascending stable identifier order through keyed weighted selection.

The resolver MUST NOT destroy a turret or system that is not spatially eligible.

## 21. Underwater-Tube Hit Hazard

A hit on a compartment containing loaded underwater torpedo tubes MUST evaluate `underwater_tube_hit_hazard_v1`.

The base severe-flooding probability is exactly `5_000` basis points.

`severeFloodingProbabilityBp = clamp(0, 10_000, floor(5_000 * loadedTubeMultiplierBp * torpedoPropellantMultiplierBp * isolationMultiplierBp * protectionMultiplierBp / 10_000^4))`

The shipped multipliers are:

### Loaded Tubes

- no loaded torpedo: `2_500` basis points;
- one loaded tube: `10_000`;
- two or more loaded tubes: `12_500`.

### Propulsion

- compressed air or ordinary wet heater: `10_000`;
- oxygen torpedo: `15_000`;
- electric torpedo: `7_500`;
- other: explicit model value required.

### Isolation

- intact compartment isolation: `7_500`;
- degraded: `10_000`;
- failed: `15_000`.

### Protection

- no dedicated protection: `12_500`;
- standard: `10_000`;
- improved: `7_500`.

A severe result MUST create:

- immediate additional flooding equal to `5_000` basis points of remaining flotation reserve, capped by reserve;
- one additional flooding source with rate multiplier `15_000`;
- launcher state `DESTROYED`;
- loaded-torpedo detonation check under Section 22; and
- crew-casualty and nearby-system shock checks.

## 22. Tube and Magazine Chain Reaction

Each loaded torpedo exposed to fire, explosion, or severe tube damage MUST perform one chain-reaction check.

The shipped base probability is:

- ordinary torpedo: `1_500` basis points;
- oxygen torpedo: `3_000`;
- electric torpedo: `1_000`.

Damage-control isolation, flooding, protection, fire intensity, and existing damage modify the probability through explicit integer multipliers.

A chain reaction MUST create a separate explosion damage package and consume the affected torpedoes.

## 23. Oxygen Torpedoes

An oxygen torpedo model MUST explicitly declare:

- speed and range settings;
- wake-visibility modifier;
- reliability;
- production and handling requirements;
- launcher compatibility;
- fire and tube-hit hazard multiplier; and
- damage-control requirements.

The shipped oxygen effects are:

- range multiplier: `15_000` basis points;
- speed multiplier: `11_000`;
- wake-detection multiplier: `7_500`;
- tube-hit severe-flooding multiplier: `15_000`;
- chain-reaction base probability: `3_000` basis points.

Performance gains MUST NOT apply when the selected setting or launcher is incompatible.

## 24. Friendly-Fire Safety

Before launch, the resolver MUST calculate a torpedo danger sector from the legal contact estimate, solution uncertainty, spread, range, and friendly tracks.

A launch is prohibited when a confirmed friendly ship lies inside the danger sector and minimum predicted separation is below the safety policy's exact threshold.

The shipped minimum predicted separation is `1_000` metres.

An unidentified or low-confidence contact in the sector increases the minimum required solution quality under Section 10.

Manual launch authority does not waive friendly-fire safety.

## 25. Target Evasion

A target may evade only through authoritative maneuver, torpedo detection, tactical command, speed, turning ability, damage, and sea-state rules.

Torpedo detection creates a knowledge assertion and does not reveal hidden exact track values beyond the sensor policy.

An evasion order MUST NOT alter torpedo path or hit geometry directly.

## 26. Damage Persistence

All torpedo damage, flooding, machinery state, system loss, ammunition loss, casualties, and launcher damage MUST persist through battle end into campaign state under normal battle-result provenance.

A ship that ends battle with uncontrolled progressive flooding MUST receive a post-battle survival check and recovery requirement.

Battle end MUST NOT clear flooding or restore disabled systems.

## 27. Records and Audit

Every launch, track, detection, evasion, contact, detonation, hit, damage package, flooding source, machinery effect, system shock, tube hazard, and chain reaction MUST create immutable records.

Each record MUST contain:

- battle minute and substep;
- source and target identifiers;
- command source;
- legal contact reference;
- model, launcher, and setting;
- solution inputs and quality;
- speed-limit validation;
- ammunition changes;
- RNG decisions;
- damage and persistence effects;
- formula and ruleset versions; and
- record hash.

## 28. Canonical Ordering

Torpedo resolution MUST order:

1. tactical sides;
2. firing ships by identifier;
3. launchers by identifier;
4. tubes by tube identifier;
5. torpedo tracks by launch minute, substep, and track identifier;
6. contacts by target identifier;
7. damage packages by impact minute, substep, and package identifier;
8. flooding sources by compartment and source identifier; and
9. system effects by stable system identifier.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect outcomes.

## 29. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_TORPEDO_MODEL_DEFINITION`;
- `INVALID_TORPEDO_LAUNCHER_STATE`;
- `TORPEDO_MODEL_INCOMPATIBLE`;
- `TORPEDO_AMMUNITION_UNAVAILABLE`;
- `TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED`;
- `TORPEDO_LAUNCH_AUTHORITY_DENIED`;
- `TORPEDO_TARGET_CONTACT_INSUFFICIENT`;
- `TORPEDO_FIRE_SOLUTION_INSUFFICIENT`;
- `TORPEDO_LAUNCH_ARC_INVALID`;
- `TORPEDO_LAUNCH_SPEED_LIMIT_MISSING`;
- `UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED`;
- `TORPEDO_FRIENDLY_FIRE_RISK_PROHIBITED`;
- `TORPEDO_LAUNCH_FAILURE`;
- `TORPEDO_DUD`;
- `TORPEDO_HIT_RESOLVED`;
- `TORPEDO_PROGRESSIVE_FLOODING_CREATED`;
- `TORPEDO_MACHINERY_DAMAGE_CREATED`;
- `TORPEDO_SYSTEM_SHOCK_DAMAGE_CREATED`;
- `UNDERWATER_TUBE_SEVERE_FLOODING`;
- `TORPEDO_CHAIN_REACTION`; and
- `TORPEDO_STATE_INVARIANT_FAILED`.

## 30. Validation and Acceptance

Automated validation MUST prove that:

1. every torpedo model has complete technology, production, physical, performance, reliability, compatibility, and hazard data;
2. every launcher tracks mount, tubes, ammunition, reload, geometry, underwater capability, fire control, damage, isolation, and solution state;
3. launches reserve and consume exact compatible ammunition;
4. incompatible heavier torpedoes require a refit;
5. Admiral mode prohibits manual launch and permits only valid force or mission intent;
6. Rear Admiral mode prohibits manual launch and permits division attack orders;
7. Captain mode permits manual launch through the exact command contract;
8. AI and player launches use the same authoritative command and legality rules;
9. every launch validates authority, tubes, ammunition, contact, range, arc, arming, solution, speed, maneuver, sea state, and safety;
10. surface-ship underwater tubes may fire at exactly 25 knots and cannot fire above 25 knots;
11. the underwater-tube threshold is checked at validation and firing substep;
12. above-water launchers use explicit speed limits;
13. fire solutions use legal estimated target state and all declared inputs;
14. solution quality uses exact integer multiplication and one final floor rounding;
15. manual launch cannot go below 4,000 solution basis points;
16. salvo tube order and ammunition reservation are deterministic;
17. every launched torpedo becomes an authoritative track;
18. contact requires geometry, arming, depth, target, and ordering predicates;
19. contact does not guarantee detonation;
20. damaging hits create complete flotation, flooding, machinery, system, casualty, structural, and damage-control state;
21. torpedo-defense multipliers and impact-zone multipliers use exact shipped values;
22. progressive flooding persists and resolves through explicit sources;
23. machinery outcomes use weights totaling 10,000;
24. turret and system shock affects only spatially eligible systems;
25. underwater-tube hit hazard uses exactly 5,000 base severe-flooding basis points and declared loaded-tube, propulsion, isolation, and protection multipliers;
26. severe underwater-tube flooding creates exact immediate flooding, progressive source, launcher destruction, and detonation checks;
27. oxygen torpedoes use exact 15,000 range, 11,000 speed, 7,500 wake, 15,000 hazard, and 3,000 chain-reaction values;
28. friendly-fire safety uses the exact 1,000-metre threshold and cannot be waived manually;
29. all damage and flooding persist into campaign state; and
30. identical tactical state, commands, contacts, content, ruleset, and seeds produce identical launches, tracks, hits, flooding, machinery, system, chain-reaction, records, and hashes.
