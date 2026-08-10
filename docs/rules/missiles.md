# DESIGN-47: Missiles

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-47`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Missile definitions, target quality, data-link fire, remote contacts, report uncertainty, misidentification, damage, special terminal modes, inventory, firing doctrine, ordering, and persistence MUST use the explicit fields, values, predicates, formulas, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Missile Categories and Sizes

The canonical missile categories are:

- `ASM`;
- `SSM`; and
- `SAM`.

The canonical size classes are:

- `LIGHT`;
- `MEDIUM`; and
- `HEAVY`.

Every missile MUST declare exactly one category and one size class.

## 2. Missile Definition

Every missile model MUST have one immutable `MissileDefinition` containing:

- `missileId`;
- category and size;
- introduction month;
- technology and adoption prerequisites;
- minimum and maximum range;
- cruise and terminal speed;
- guidance and seeker definitions;
- warhead type and explosive-equivalent mass;
- penetration profile;
- eligible launch platforms;
- target-quality requirement;
- data-link requirement or `NONE`;
- terminal-update policy;
- defense-susceptibility profile;
- salvo and reload policy;
- storage and handling requirements;
- production cost and work;
- special terminal-mode identifier or `NONE`;
- content version; and
- content hash.

Missing metadata MUST fail with `INVALID_MISSILE_DEFINITION`.

## 3. Target-Quality Scale

The canonical target qualities and minimum track-quality scores are:

- `AREA_REPORT`: `2_000` basis points;
- `COARSE_TRACK`: `4_000`;
- `FIRE_CONTROL_TRACK`: `7_500`;
- `TERMINALLY_UPDATED_TRACK`: `8_500`;
- `VISUAL_CONFIRMATION`: `9_000` identification confidence plus a current visual position track.

Target quality is a typed classification of one or more knowledge assertions. It MUST NOT expose hidden true target state.

A missile launch requires the model's exact minimum target quality at command validation and firing time.

## 4. Missile Inventory and Mounts

Missile launchers and missile inventory are separate authoritative state.

Every launch MUST reserve and consume exactly one compatible missile per fired round.

A launcher MUST NOT:

- create inventory;
- load an incompatible missile;
- exceed ready-round or magazine capacity;
- reload when its reload policy prohibits tactical reload; or
- use a stored missile whose condition is invalid.

A mounted launcher with zero compatible inventory cannot fire.

## 5. Anti-Ship Firing Doctrine

An anti-ship missile remains held until one exact doctrine authorizes release:

- `FIRE_AT_WILL`;
- `RIPPLE`;
- `HALF_SALVO`;
- `FULL_SALVO`; or
- `COORDINATED_SALVO`.

Each doctrine MUST declare salvo size, target-allocation policy, timing, ammunition conservation, overkill limit, coordination requirements, and cancellation behavior.

`HALF_SALVO` fires `ceiling(availableReadyMissiles / 2)`.

`FULL_SALVO` fires every eligible ready missile reserved by the command.

SAM engagement is automated through `DESIGN-45`; player or AI policy may constrain allocation but MUST NOT bypass its engagement contract.

## 6. Launch Platforms

The canonical launch-platform families are:

- surface ship;
- aircraft;
- missile submarine; and
- coastal battery.

Every launch MUST validate platform compatibility, launcher condition, target quality, range, geometry, fire-control path, inventory, mission, command authority, friendly-fire policy, and weather or environment effects.

## 7. Data-Link Fire Technology

Remote or cooperative missile fire requires discovered and adopted technology `cooperative_missile_targeting`.

The firing platform and source unit MUST have compatible operational data-link systems at or above level `3` under `DESIGN-46`.

A remote launch is eligible only when:

- the firing platform does not hold the required local track;
- another friendly or authorized allied unit holds a qualifying contact;
- the source track may legally be shared;
- sender and receiver data links are compatible;
- a valid direct or relay path exists;
- transferred track quality remains at or above the missile's minimum;
- track age remains within Section 9;
- command authority permits cooperative fire;
- target is not positively identified as friendly; and
- terminal-update requirements can be satisfied or the missile explicitly permits inertial continuation.

Without the technology, remote-contact launch MUST fail with `MISSILE_DATA_LINK_FIRE_TECHNOLOGY_UNAVAILABLE`.

## 8. Remote Track Transfer

The remote track received by the firing unit MUST preserve:

- originating unit and system;
- original observation time;
- estimated position, course, speed, altitude, and uncertainty;
- track quality;
- identification confidence;
- possible deception;
- transfer path and delay;
- jamming state; and
- source assertion identifiers.

The shipped transfer-quality multiplier is the sender-receiver data-link value from `DESIGN-46`.

`receivedTrackQualityBp = floor(sourceTrackQualityBp * dataLinkTransferMultiplierBp / 10_000)`

Transfer MUST NOT increase track quality or identification confidence above the source values.

## 9. Track Age

The shipped maximum track ages at missile launch are:

- `AREA_REPORT`: `30` strategic minutes;
- `COARSE_TRACK`: `10` tactical minutes;
- `FIRE_CONTROL_TRACK`: `60` tactical seconds;
- `TERMINALLY_UPDATED_TRACK`: `15` tactical seconds;
- `VISUAL_CONFIRMATION`: `10` tactical seconds without another update.

A stale track MUST fail with `MISSILE_TARGET_TRACK_STALE`.

Target movement during transfer MUST be represented by uncertainty growth, not hidden truth correction.

## 10. Target Uncertainty

Every missile launch MUST calculate a two-dimensional target-uncertainty radius from the legal source report or track.

The shipped base uncertainty radii are:

- area report: `25_000` metres;
- coarse track: `10_000` metres;
- fire-control track: `2_000` metres;
- terminally updated track: `500` metres;
- visual confirmation: `250` metres.

Track age increases radius by:

`uncertaintyGrowthMetres = ceiling(trackAgeSeconds * declaredTargetSpeedUncertaintyMetresPerSecond)`

Jamming, deception, maneuver uncertainty, and transfer delay add explicit non-negative integer terms.

## 11. Accuracy from Target Quality

The target-quality accuracy multipliers are:

- `AREA_REPORT`: `5_000` basis points;
- `COARSE_TRACK`: `7_500`;
- `FIRE_CONTROL_TRACK`: `10_000`;
- `TERMINALLY_UPDATED_TRACK`: `11_500`;
- `VISUAL_CONFIRMATION`: `11_000`.

The launch solution is:

`launchSolutionBp = floor(baseLaunchSolutionBp * targetQualityMultiplierBp * uncertaintyMultiplierBp * sourceReliabilityMultiplierBp * transferMultiplierBp * jammingMultiplierBp / 10_000^5)`

The exact rational value MUST be rounded once with `FLOOR`.

A remote track uses the same formula as a local track after transfer degradation. It receives no hidden cooperative-fire bonus.

## 12. Uncertainty Accuracy Penalty

The uncertainty multiplier is:

- radius at or below `500` metres: `10_000` basis points;
- above `500` through `2_000`: `9_000`;
- above `2_000` through `5_000`: `7_500`;
- above `5_000` through `10_000`: `5_000`;
- above `10_000` through `25_000`: `2_500`;
- above `25_000`: `1_000`.

A missile whose seeker-acquisition volume is smaller than the uncertainty region MUST either search according to its explicit seeker policy or fail target acquisition. It MUST NOT snap to the true target.

## 13. Misidentification Risk

A missile launch has misidentification risk when identification confidence is below `8_000` basis points or the source report is possibly deceptive.

The shipped base probabilities are:

- confidence below `2_000`: launch prohibited;
- `2_000..3_999`: `3_000` basis points;
- `4_000..5_999`: `1_500`;
- `6_000..7_999`: `500`;
- `8_000..10_000`: `0`.

Possible deception adds `1_000` basis points. A transferred allied track adds `500` unless a common-identification network is operational. Active jamming adds its explicit modifier.

The final probability is clamped to `0..10_000` and checked through stream:

`battle/missile/launch/misidentification`

Manual fire authority MUST NOT waive this check.

## 14. Misidentification Outcome

On a successful misidentification check, the launcher or missile seeker MUST select one legal false target from the source track's explicit confusion set or uncertainty region.

Candidates MUST:

- physically exist within the legal search region;
- be detectable by the seeker;
- satisfy the seeker's target class;
- not use hidden allegiance to exclude themselves unless identification systems provide it; and
- be ordered by target-signature weight and stable identifier.

Possible results include wrong enemy target, neutral target, friendly target, decoy, or no acquisition when eligible.

A misidentification event MUST NOT create a non-existent asset.

## 15. Terminal Updates

A missile with terminal-update capability MAY receive updates only when:

- a compatible source retains a qualifying track;
- the data-link path remains valid;
- missile, source, and receiver channels are operational;
- jamming permits transfer; and
- update timing lies within the missile policy.

Each update MUST preserve track provenance and recompute uncertainty.

Loss of update MUST produce exactly one declared behavior:

- continue inertially;
- activate onboard seeker against the last uncertainty region;
- switch to home-on-jam;
- abort or self-destruct; or
- another explicit model behavior.

## 16. Missile Flight State

Every launched missile MUST create one authoritative `MissileTrack` containing:

- missile-track identifier;
- firing platform and launcher;
- missile model;
- target track or area-report identifier;
- launch minute and substep;
- launch position and heading;
- route and altitude profile;
- speed and fuel state;
- seeker state;
- update state;
- uncertainty region;
- electronic-warfare state;
- defense engagement history;
- terminal-mode state;
- terminal result; and
- track hash.

A missile remains authoritative until hit, miss, interception, decoy capture, dud, self-destruction, fuel exhaustion, or battle end.

## 17. Seeker Acquisition

An onboard seeker may acquire a target only when:

- the target lies within seeker volume;
- signature and aspect pass;
- seeker resistance versus jamming passes;
- decoy and clutter resolution occurs;
- target class is eligible;
- no seeker malfunction prevents acquisition; and
- one explicit keyed acquisition decision succeeds when probabilistic.

Seeker acquisition MUST use legal physical candidates within the search region. It MUST NOT use the intended target's hidden true identity as a shortcut.

## 18. Anti-Ship Missile Warhead Modes

Every ordinary anti-ship missile MUST declare exactly one direct-impact warhead mode:

- `LARGE_EXPLOSIVE`;
- `SEMI_ARMOR_PIERCING`; or
- `COMBINED_BLAST_FRAGMENTATION`.

`LARGE_EXPLOSIVE` emphasizes blast, fire, superstructure, and exposed-system damage.

`SEMI_ARMOR_PIERCING` evaluates armor interaction before internal detonation and emphasizes penetrative structure and internal-system damage.

`COMBINED_BLAST_FRAGMENTATION` emphasizes broad exposed-system and personnel effects with lower penetration than semi-armor piercing.

## 19. Ordinary ASM Damage Pipeline

An ordinary ASM hit MUST create one `MissileDamagePackage` and resolve in this exact order:

1. determine impact position, angle, speed, and target zone;
2. resolve direct armor or structural interaction;
3. resolve warhead fuze and detonation;
4. apply local structure damage;
5. create fire and blast effects;
6. apply superstructure and exposed-system damage;
7. apply sensor, radar, communications, and fire-control damage;
8. apply splinter, crew, and nearby-component damage;
9. update performance and mission capability;
10. resolve secondary aviation-fuel, missile-store, torpedo, or ammunition hazards; and
11. evaluate terminal ship state under `DESIGN-41`.

No stage may be inferred from descriptive text or omitted without an explicit successful empty result.

## 20. Large-Explosive Damage

The shipped `large_explosive_asm_v1` allocation of warhead damage value is:

- local structure damage: `3_000` basis points;
- fire and thermal damage: `2_500`;
- superstructure and exposed systems: `2_000`;
- sensor and electronics damage: `1_500`;
- crew, splinter, and secondary hazard pressure: `1_000`.

The allocation totals exactly `10_000`.

The warhead receives no implicit armor penetration beyond its explicit projectile and fuze definition.

## 21. Semi-Armor-Piercing Damage

The shipped `semi_armor_piercing_asm_v1` allocation is:

- penetration and internal structure: `4_000` basis points;
- local blast and fire: `2_000`;
- internal machinery and systems: `2_000`;
- superstructure and sensors: `1_000`;
- crew and secondary hazards: `1_000`.

The allocation totals exactly `10_000`.

Armor interaction MUST use impact speed, angle, warhead case, fuze delay, armor quality, and zone thickness. A semi-armor-piercing label does not guarantee penetration.

## 22. Structure Damage

Missile structure damage is:

`structureDamage = floor(baseWarheadDamage * structureAllocationBp * impactEnergyMultiplierBp * penetrationOutcomeMultiplierBp * targetZoneMultiplierBp / 10_000^4)`

The exact rational result MUST be rounded once with `FLOOR`.

Structure damage applies through `DESIGN-41` and is capped by remaining structural integrity while preserving uncapped value in the event record.

## 23. Fire Creation

Fire probability is:

`fireProbabilityBp = clamp(0, 10_000, floor(baseFireProbabilityBp * fireAllocationBp * fuelAndMaterialMultiplierBp * damageStateMultiplierBp * firefightingExposureMultiplierBp / 10_000^4))`

The shipped base probabilities are:

- large explosive: `5_000` basis points;
- semi-armor piercing after full or partial penetration: `4_000`;
- semi-armor piercing without penetration: `2_000`;
- combined blast fragmentation: `4_500`.

A successful check creates one or more spatial fire sources under `DESIGN-41`.

## 24. Sensor and Electronics Damage

A missile hit may damage sensors only when the sensor, director, antenna, array, mast, electronics room, power route, cooling route, or communication path is spatially eligible.

The shipped base system-damage probabilities are:

- primary impact zone: `5_000` basis points;
- secondary blast or fragment zone: `2_500`;
- outside declared zone: `0`.

Eligible systems MUST be ordered by stable identifier. Each successful outcome MUST use `DESIGN-46` damage states and persistence.

A missile MUST NOT disable a sensor outside its damage geometry.

## 25. Superstructure Damage

Superstructure damage MUST evaluate:

- bridge and command spaces;
- directors;
- radar and communications;
- exposed weapons;
- aviation facilities;
- boats and deck stores;
- ventilation;
- electrical routes; and
- mast and antenna structure.

The damage package MUST identify exact eligible components and apply `DEGRADED`, `DISABLED`, `DESTROYED`, `BURNED_OUT`, or another component-specific result.

## 26. Secondary Hazards

An ASM damage package MAY create secondary hazards only when spatially and materially eligible:

- missile or guided-weapon magazine reaction;
- aviation-fuel or ordnance reaction;
- torpedo-store reaction;
- gun-ammunition reaction;
- fuel-line rupture;
- electrical fire;
- carrier deck or hangar fire; and
- progressive structural or flotation damage.

Each hazard MUST create a separate causal package and keyed decision when probabilistic.

## 27. Special Missile Torpedoes

A missile carrying a torpedo or underwater terminal payload MUST declare `specialTerminalMode: MISSILE_TORPEDO`.

It MUST NOT use the ordinary ASM direct-impact damage pipeline after payload release.

The resolution order is:

1. missile flight and defenses;
2. release-point validation;
3. payload deployment;
4. torpedo-model creation with full provenance;
5. water-entry and arming validation;
6. torpedo track and seeker resolution; and
7. torpedo hit and damage under `DESIGN-40`.

Failure before valid payload release produces the missile's explicit miss, loss, or dud outcome. The payload MUST NOT teleport to the target.

## 28. Diving Missiles

A diving missile MUST declare `specialTerminalMode: DIVING_MISSILE` and one dedicated `DivingMissileDamagePolicy` containing:

- dive initiation range and altitude;
- terminal angle and speed;
- water entry or steep-deck impact policy;
- target-zone eligibility;
- underwater or plunging penetration formula;
- fuze and detonation behavior;
- flotation and structural allocation;
- miss and breakup behavior; and
- policy version.

Diving missiles MUST NOT use ordinary ASM allocation when their terminal mode succeeds.

The shipped diving-missile damage allocation is:

- underwater or lower-hull structure and flotation: `5_000` basis points;
- machinery or magazine-zone shock: `2_000`;
- progressive flooding: `2_000`;
- fire and other effects: `1_000`.

The allocation totals exactly `10_000`.

## 29. Special-Mode Failure and Fallback

A special missile mode MUST declare whether failure before terminal transition:

- misses;
- detonates using a named ordinary warhead fallback;
- breaks up;
- self-destructs; or
- creates another explicit outcome.

No fallback may be inferred.

After valid torpedo release or diving transition, the missile MUST NOT revert to ordinary ASM damage.

## 30. Defensive Susceptibility

Every missile MUST declare eligibility and susceptibility for:

- CAP interception;
- heavy, medium, and light SAM;
- heavy and light AA where applicable;
- CIWS;
- jamming;
- decoys;
- seeker seduction;
- data-link interruption; and
- hard-kill interception.

Air defense resolves under `DESIGN-45`. Electronic warfare resolves under `DESIGN-46`.

An omitted defense layer is ineligible, not a neutral default.

## 31. Storage Levels

The canonical strategic missile-storage levels are:

- `MINIMUM`;
- `ADEQUATE`; and
- `PLENTIFUL`.

The shipped target stockpiles are:

- minimum: `6` months of projected wartime demand;
- adequate: `12` months;
- plentiful: `24` months.

During the first `18` completed months of war, shortage risk is evaluated monthly when stockpile is below projected remaining demand for the selected level.

Storage targets do not create inventory. Production and purchase require paid work and physical storage capacity.

## 32. Storage Cost

Peacetime stockpile cost MUST include purchase, maintenance, testing, refurbishment, safety, and storage.

The shipped monthly peacetime maintenance rate is `100` basis points of stored missile acquisition value, equal to `1%` per month.

Missiles that exceed their explicit service life require refurbishment, disposal, or quality degradation under their model policy.

## 33. Launch Records

Every missile launch MUST create one immutable `MissileLaunchRecord` containing:

- battle minute and substep;
- firing platform, launcher, and missile model;
- firing doctrine;
- local or remote target source;
- source and received track quality;
- identification confidence;
- track age and uncertainty;
- data-link path;
- accuracy and misidentification calculations;
- inventory reservation and consumption;
- launch command and authority;
- RNG decisions;
- result and missile-track identifier; and
- ruleset, formula, content, and RNG versions.

## 34. Damage Records

Every ordinary or special missile hit MUST create immutable records for:

- impact and terminal mode;
- protection interaction;
- allocation policy;
- structure, fire, sensor, superstructure, crew, and secondary-hazard effects;
- special torpedo or diving-payload provenance;
- component and ship-state transitions;
- RNG decisions;
- formula and ruleset versions; and
- record hash.

## 35. Canonical Ordering

Missile resolution MUST order:

1. tactical sides;
2. firing platforms by identifier;
3. launchers by identifier;
4. launches by minute, substep, and missile-track identifier;
5. target tracks by identifier;
6. data-link updates by source, relay, and recipient;
7. defense engagements by `DESIGN-45` layer order;
8. terminal acquisition candidates by signature and identifier;
9. impacts by target and missile identifier; and
10. damage effects by pipeline and effect ordinal.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect outcomes.

## 36. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_MISSILE_DEFINITION`;
- `MISSILE_TECHNOLOGY_UNAVAILABLE`;
- `MISSILE_INVENTORY_UNAVAILABLE`;
- `MISSILE_PLATFORM_INCOMPATIBLE`;
- `MISSILE_TARGET_QUALITY_INSUFFICIENT`;
- `MISSILE_TARGET_TRACK_STALE`;
- `MISSILE_DATA_LINK_FIRE_TECHNOLOGY_UNAVAILABLE`;
- `MISSILE_DATA_LINK_INCOMPATIBLE`;
- `MISSILE_DATA_LINK_PATH_UNAVAILABLE`;
- `MISSILE_REMOTE_TRACK_DEGRADED_BELOW_MINIMUM`;
- `MISSILE_MISIDENTIFICATION_RISK`;
- `MISSILE_MISIDENTIFIED_TARGET`;
- `MISSILE_SEEKER_ACQUISITION_FAILED`;
- `MISSILE_TERMINAL_UPDATE_LOST`;
- `MISSILE_DEFENSE_LAYER_INELIGIBLE`;
- `MISSILE_ORDINARY_DAMAGE_RESOLVED`;
- `MISSILE_SENSOR_DAMAGE_CREATED`;
- `MISSILE_SUPERSTRUCTURE_DAMAGE_CREATED`;
- `MISSILE_TORPEDO_RELEASE_FAILED`;
- `MISSILE_DIVING_TERMINAL_MODE_FAILED`;
- `MISSILE_SPECIAL_DAMAGE_POLICY_MISSING`;
- `MISSILE_STORAGE_CAPACITY_INSUFFICIENT`; and
- `MISSILE_STATE_INVARIANT_FAILED`.

## 37. Validation and Acceptance

Automated validation MUST prove that:

1. every missile has complete category, size, technology, range, speed, guidance, warhead, platform, target-quality, defense, reload, storage, and special-mode data;
2. target qualities use exact 2,000, 4,000, 7,500, 8,500, and 9,000 thresholds;
3. missile inventory and launcher presence remain separate;
4. every launch consumes exact compatible inventory;
5. anti-ship firing doctrine uses only the five explicit release modes;
6. remote fire requires adopted `cooperative_missile_targeting` and compatible operational level-3-or-higher data links;
7. remote fire requires exact legal source, sharing, path, quality, age, command, identity, and update predicates;
8. transferred tracks preserve source, uncertainty, confidence, deception, delay, and jamming;
9. track transfer never increases quality or confidence;
10. target-quality track ages use the exact declared limits;
11. uncertainty radii use exact 25,000, 10,000, 2,000, 500, and 250 metre values;
12. accuracy uses exact target-quality and uncertainty multipliers with one final floor rounding;
13. missiles never snap from an uncertain report to hidden true target position;
14. misidentification uses exact confidence bands, deception, allied-transfer, jamming, and keyed checks;
15. manual fire cannot waive misidentification risk;
16. false targets come only from physically legal confusion or uncertainty candidates;
17. data-link updates preserve provenance and have explicit loss behavior;
18. every missile becomes an authoritative track after launch;
19. seekers use only physical candidates within their legal search volume;
20. ordinary ASM damage uses the exact eleven-stage pipeline;
21. large-explosive allocation is exactly 3,000 structure, 2,500 fire, 2,000 superstructure, 1,500 sensors, and 1,000 other effects;
22. semi-armor-piercing allocation is exactly 4,000 penetration, 2,000 blast, 2,000 internal systems, 1,000 sensors, and 1,000 other effects;
23. semi-armor-piercing labels never guarantee penetration;
24. structure damage, fire, sensor damage, and superstructure damage use exact spatially eligible formulas and records;
25. secondary hazards create separate causal damage packages;
26. missile torpedoes transition into fully provenanced torpedo tracks and use `DESIGN-40` damage;
27. diving missiles use a complete dedicated terminal and damage contract;
28. special modes never silently fall back or revert after valid transition;
29. defense susceptibility explicitly binds to `DESIGN-45` and `DESIGN-46`;
30. storage levels target exactly 6, 12, and 24 months and evaluate first-war-18-month shortage risk;
31. peacetime storage maintenance is exactly 100 basis points of acquisition value monthly;
32. every launch, update, defense, acquisition, impact, special transition, damage, inventory, RNG, and version result is recorded; and
33. identical state, commands, content, ruleset, knowledge, EW state, and seeds produce identical launches, tracks, targets, defense outcomes, damage, records, and hashes.
