# DESIGN-46: Radar, Electronics, And Electronic Warfare

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-46`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Radar detection, track identity, blind fire, installation, inventory, automation, reliability, damage, gunfire shock, data links, and electronic warfare MUST use the explicit values, predicates, formulas, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Electronics Types

The canonical ship-electronics types are:

- `SEARCH_RADAR`;
- `FIRE_CONTROL_RADAR`;
- `FIGHTER_DIRECTION`;
- `DATA_LINK`;
- `ELECTRONIC_SUPPORT_MEASURES`;
- `JAMMING`;
- `DECOYS`; and
- `RADAR_WARNING`.

Every installed system MUST reference one immutable definition and one authoritative equipment-state record.

## 2. Electronics Definition

Every `ElectronicsSystemDefinition` MUST contain:

- `electronicsSystemId`;
- electronics type;
- technology level within `0..5`;
- technology prerequisites;
- eligible platform classes;
- mass, space, power, cooling, crew, cost, and work requirements;
- production requirement;
- installation policy;
- operating modes;
- detection, tracking, identification, fire-control, sharing, jamming, decoy, or warning formulas as applicable;
- base reliability basis points;
- damage and shock susceptibility;
- repair policy;
- content version; and
- content hash.

Missing metadata MUST fail with `INVALID_ELECTRONICS_SYSTEM_DEFINITION`.

## 3. Ship Electronics State

Every installed system MUST have one `ShipElectronicsState` containing:

- installation identifier;
- ship and system identifiers;
- current operating mode;
- power and cooling state;
- reliability basis points;
- crew availability;
- damage state;
- malfunction state;
- calibration state;
- emission state;
- assigned channels and contacts;
- ammunition or decoy inventory where applicable;
- last malfunction, damage, repair, and installation records;
- ruleset and formula versions; and
- state hash.

`damageState` MUST be `OPERATIONAL`, `DEGRADED`, `DISABLED`, or `DESTROYED`.

## 4. Radar Levels

Radar technology levels are integers `0..5`:

- `0`: no radar capability;
- `1`: early search or fire-control radar;
- `2`: improved general fleet radar;
- `3`: mature fire-control and blind-fire capability;
- `4`: advanced integrated radar;
- `5`: modern digital or phased-array capability.

A display name MUST NOT determine level or mechanics.

## 5. Search-Radar Detection

Search radar may generate a contact when all predicates hold:

- target lies within radar horizon and system range;
- target radar-cross-section profile is eligible;
- radar is powered, operational, crewed, calibrated, and emitting;
- required line-of-propagation and sea-clutter predicates pass;
- jamming and electronic-support state are resolved;
- target is not already represented by a higher-quality exact track; and
- a detection check succeeds.

The shipped detection formula is:

`detectionProbabilityBp = clamp(0, 10_000, floor(baseDetectionBp * radarLevelMultiplierBp * targetSignatureMultiplierBp * rangeMultiplierBp * weatherMultiplierBp * seaClutterMultiplierBp * reliabilityMultiplierBp * crewMultiplierBp * jammingMultiplierBp / 10_000^8))`

The check MUST use stream `battle/radar/search/detection`.

## 6. Poor-Visibility Search Effect

Optical visibility does not cap radar detection range. Instead, poor visibility changes radar and optical paths separately.

The shipped radar weather multipliers are:

- clear or ordinary visibility: `10_000` basis points;
- fog or mist: `10_000`;
- darkness: `10_000`;
- light precipitation: `9_500`;
- moderate precipitation: `8_500`;
- heavy precipitation: `7_000`;
- extreme precipitation: `5_000`.

Thus search radar retains detection capability in fog, mist, darkness, and other poor optical visibility, while precipitation may reduce performance explicitly.

Radar MUST NOT automatically identify a detected contact.

## 7. Radar Track State

Every radar contact MUST create or update one `RadarTrack` containing:

- track identifier;
- receiving participant;
- source system and ship;
- estimated bearing, range, altitude, course, and speed;
- uncertainty bounds;
- track-quality basis points;
- identification-confidence basis points;
- tentative type or `UNKNOWN`;
- observation and update times;
- jamming and deception state;
- shared-source references; and
- track hash.

Track quality and identification confidence are separate values within `0..10_000`.

## 8. Radar Identification Limits

The shipped maximum identification confidence from radar alone is:

- radar level 1: `3_000` basis points;
- level 2: `4_000`;
- level 3: `5_000`;
- level 4: `6_000`;
- level 5: `7_500`.

Visual identification may reach `10_000` under its owning contract.

Radar-only tracks MUST remain less identified than a confirmed visual track. Radar alone MUST NOT reveal exact ship identity, exact design, damage, ammunition, fuel, or hidden equipment.

A radar assertion exceeding its level cap MUST fail with `RADAR_IDENTIFICATION_CONFIDENCE_EXCEEDED`.

## 9. Fire-Control Radar

Fire-control radar may support gunnery only when:

- the radar and connected director are operational;
- the battery is connected and compatible;
- target radar track quality is sufficient;
- range and bearing lie within system limits;
- jamming and clutter do not invalidate the solution;
- power, crew, and calibration pass; and
- the target order is legal.

The shipped gunnery accuracy multipliers are:

- level 1: `10_500` basis points;
- level 2: `11_000`;
- level 3: `11_500`;
- level 4: `12_000`;
- level 5: `12_500`.

These multipliers apply through `DESIGN-39` and do not bypass range, ammunition, arcs, damage, or command authority.

## 10. Blind Fire

Blind fire is permitted only when all predicates hold:

- fire-control radar level is at least exactly `3`;
- fire-control radar is operational and connected to the firing battery;
- target has a radar track with quality at least `7_500` basis points;
- target identification confidence is at least `4_000` basis points;
- track age is no greater than exactly `30` tactical seconds;
- radar range and bearing uncertainty remain within the fire-control system's declared limits;
- jamming state permits a valid solution;
- target is not positively identified as friendly;
- weapon range and firing arcs pass; and
- fire mode explicitly permits radar-only engagement.

A level-2 or lower system MUST fail with `BLIND_FIRE_RADAR_LEVEL_INSUFFICIENT`.

Blind-fire accuracy receives an additional multiplier of `8_500` basis points after the level-specific fire-control multiplier.

Blind fire MUST use the radar track estimate rather than hidden true target position.

## 11. Visual and Radar Track Fusion

Track fusion MUST preserve source provenance.

When compatible visual and radar tracks refer to the same contact:

- position and motion quality MAY improve through `track_fusion_v1`;
- identification confidence MUST not exceed the strongest legally supported source plus explicit fusion gain;
- the shipped fusion gain is at most `1_000` basis points;
- contradictory tracks widen uncertainty and may reduce confidence; and
- fusion MUST NOT convert an estimate into true hidden state.

## 12. Installation Levels and Design Space

Every ship may install radar levels `1` or `2` when:

- the technology is adopted;
- the ship has an eligible installation location;
- power, cooling, mast, stability, and crew minima pass;
- inventory exists; and
- installation work and cost are paid.

Levels `3` through `5` additionally require explicit reserved electronics space in the compiled design or a validated refit package.

The shipped minimum reserved-space requirements are:

- level 3: `100` electronics-space units;
- level 4: `200`;
- level 5: `350`.

Levels `1` and `2` require `50` units, but existing eligible ships lacking reserved space may use a minor-installation allowance when stability and mast limits pass.

A higher-level installation without sufficient space MUST fail with `RADAR_DESIGN_SPACE_INSUFFICIENT`.

## 13. Radar Inventory

Radar sets MUST be produced as physical inventory.

Every inventory record MUST contain:

- system definition identifier;
- quantity by condition;
- production batch;
- owner nation;
- storage location;
- reservation state;
- installation destination or `NONE`;
- content version; and
- inventory hash.

Installation reserves and consumes exactly one compatible set. Discovery or adoption does not create inventory.

## 14. Automatic Installation

Automatic installation MUST use `AutoInstallRadarCommand` with issuer `SYSTEM_AUTOMATION`.

Eligibility requires:

- compatible radar inventory;
- ship technology and design-space eligibility;
- readiness and dockyard eligibility;
- installation capacity, work, and payment;
- no automation lock;
- no higher-priority mandatory installation; and
- an explicit installation policy.

Automation MUST use normal reservation, command, validation, project, inventory, and audit contracts. It MUST NOT mutate the ship directly.

## 15. Automatic Installation Priority

Eligible ships MUST be ordered by:

1. readiness `ACTIVE` before other readiness states;
2. mandatory mission requirement;
3. descending true compiled standard displacement;
4. descending natural-classification priority: `CV`, `CVL`, `BB`, `BC`, `B`, `CA`, `CL`, `DD`, `KE`, `AMC`, `AV`, `SS`, `TR`, `MTB`;
5. descending current electronics deficiency score;
6. ascending ship identifier.

The first ship with a compatible set and complete installation eligibility is selected.

This is the concrete contract for prioritizing larger active ships.

Automation consumes no randomness.

## 16. Manual Installation

Manual installation MUST use `InstallRadarCommand` and create one installation project.

The shipped manual-installation duration is exactly `1` strategic month for levels `1` and `2` when the minor-installation allowance applies.

Levels `3` through `5`, or any installation requiring structural, mast, power, cooling, or space changes, MUST use the exact refit duration produced by the project compiler and may exceed one month.

From project start until successful completion, the ship readiness state MUST be `UNAVAILABLE` for the complete strategic month and it MUST NOT:

- move normally;
- train;
- fulfill foreign-station duty;
- enter ordinary battle generation; or
- receive another overlapping dockyard project.

A level-1 or level-2 manual installation completed during the month becomes operational only after the month-closing project transition.

## 17. Automatic Installation Availability

Automatic installation uses the same availability rule as manual installation.

There is no instant or zero-unavailability automated installation.

A minor level-1 or level-2 automated installation makes the ship unavailable for exactly the installation month. Larger installations follow their project duration.

## 18. Reliability Scale

Every electronics system MUST have reliability within `0..10_000` basis points.

The shipped base reliability by radar level is:

- level 1: `7_500` basis points;
- level 2: `8_500`;
- level 3: `9_000`;
- level 4: `9_500`;
- level 5: `9_750`.

Reliability is further modified by technology age, maintenance, crew, damage, power quality, weather, and shock through explicit integer multipliers.

## 19. Radar Malfunction Check

An operating radar MUST perform one malfunction check:

- at battle initialization;
- every `30` completed tactical minutes while continuously operating;
- after an eligible damaging hit;
- after an eligible own-gunfire shock event; and
- after an explicit power interruption.

The shipped formula is:

`malfunctionProbabilityBp = clamp(0, 10_000, 10_000 - floor(baseReliabilityBp * maintenanceMultiplierBp * crewMultiplierBp * damageMultiplierBp * powerMultiplierBp * weatherMultiplierBp / 10_000^5))`

The check uses stream `battle/electronics/system/malfunction`.

A reliability value does not guarantee operation without the explicit check.

## 20. Malfunction Outcomes

A successful malfunction check MUST select one outcome:

- `TRANSIENT_DROPOUT`;
- `CALIBRATION_LOSS`;
- `INTERMITTENT_TRACKING`;
- `DISABLED_UNTIL_REPAIR`; or
- `PERMANENT_DAMAGE`.

The shipped weights are:

- transient dropout: `4_000`;
- calibration loss: `3_000`;
- intermittent tracking: `2_000`;
- disabled until repair: `750`;
- permanent damage: `250`.

Weights total exactly `10_000`.

The results are:

- transient dropout: unavailable for `1` tactical minute;
- calibration loss: accuracy and track-quality multiplier `7_500` until a `5`-minute calibration task completes;
- intermittent tracking: one detection or update opportunity skipped in every two, selected by keyed record;
- disabled until repair: no operation for the remainder of battle unless a typed repair succeeds;
- permanent damage: system state `DESTROYED` or `DISABLED` according to the damage package.

## 21. Own-Gunfire Shock

A radar is eligible for own-gunfire shock when:

- an own-ship gun of at least the definition's shock-threshold caliber fires;
- the radar lies within the declared blast or vibration zone;
- the radar is operating or mechanically exposed; and
- no isolation policy removes eligibility.

The shipped shock thresholds and probability multipliers are:

- radar level 1: guns at least `152_400` micrometres, shock multiplier `15_000`;
- level 2: guns at least `203_200` micrometres, multiplier `12_500`;
- level 3: guns at least `254_000` micrometres, multiplier `10_000`;
- level 4: guns at least `304_800` micrometres, multiplier `7_500`;
- level 5: guns at least `304_800` micrometres, multiplier `5_000`.

The shock multiplier applies to the malfunction probability generated by the event.

Gunfire MUST NOT disable radar without this spatial and caliber eligibility.

## 22. Damage Effects

Damage may independently affect:

- antenna or array;
- transmitter;
- receiver;
- director connection;
- power supply;
- cooling;
- processing unit;
- display or operator station;
- data-link connection; and
- mast or mounting structure.

A system is operational only when all mandatory subcomponents remain functional.

Damage MUST persist after battle and require explicit repair or replacement.

## 23. Repair

Tactical repair is permitted only for outcomes and subcomponents marked field-repairable.

A tactical repair task MUST declare:

- required electronics specialists;
- electrical power;
- access;
- repair duration;
- spare components;
- interruption behavior; and
- success predicate.

The shipped minimum tactical repair duration is `10` minutes.

Strategic replacement consumes inventory and dockyard or maintenance capacity.

## 24. Fighter Direction

Fighter-direction systems may improve CAP only when:

- tracking radar or shared data link provides a qualifying air track;
- fighter-direction equipment is operational;
- CAP aircraft and controllers are available;
- communication path exists;
- track age and quality pass; and
- jamming does not invalidate the vector.

The shipped CAP vector-quality multiplier by fighter-direction level is:

- level 1: `10_500` basis points;
- level 2: `11_000`;
- level 3: `11_500`;
- level 4: `12_000`;
- level 5: `12_500`.

It MUST NOT create CAP aircraft, fuel, ammunition, or endurance.

## 25. Data-Link Sharing

A data link may share target information only when:

- sender has a valid track;
- sender and receiver have compatible data-link levels;
- receiver is within link range or connected through a valid relay;
- emission, jamming, power, and antenna states permit transfer;
- track quality meets the receiving use threshold; and
- command or alliance policy permits sharing.

The shipped minimum track qualities are:

- situational display: `3_000` basis points;
- target-priority order: `5_000`;
- radar-supported engagement: `7_500`;
- blind-fire use: `7_500` plus Section 10 predicates.

Shared tracks retain source, age, confidence, uncertainty, jamming, and deception provenance.

## 26. Data-Link Levels

The shipped data-link values are:

- level 1: range `50` nautical miles, track-quality transfer multiplier `8_500` basis points;
- level 2: `100` nautical miles, `9_000`;
- level 3: `250` nautical miles, `9_500`;
- level 4: `500` nautical miles, `10_000`;
- level 5: battle-network range with valid relays, `10_000`.

A transfer MUST NOT improve track quality above the sender's current value.

## 27. Electronic Support Measures

Electronic-support measures MAY detect emissions only when:

- source is emitting;
- ESM system is operational and within sensitivity and range limits;
- frequency compatibility passes;
- propagation and jamming state permit detection; and
- a keyed detection check succeeds.

An ESM contact initially reveals bearing, emission class, source family estimate, confidence, and observation time. It does not reveal exact identity automatically.

## 28. Jamming

Every jammer MUST declare:

- target sensor or link families;
- jamming strength;
- effective range;
- beam or area pattern;
- channels;
- power and cooling requirements;
- own-emission signature;
- burn-through formula; and
- damage and reliability state.

The shipped compact opposed modifier is:

`jammingMultiplierBp = clamp(2_500, 10_000, 10_000 - floor(max(0, jammerStrength - seekerOrSensorResistance) * 75))`

The detailed model MAY add channels and geometry, but the compact model MUST preserve the same named effects rather than omit them.

## 29. Emission Control

Every radar, jammer, and data-link system MUST have one emission state:

- `SILENT`;
- `INTERMITTENT`;
- `ACTIVE`; or
- `EMERGENCY`.

Emission state controls detection opportunities, update frequency, power use, reliability checks, ESM exposure, and jamming eligibility.

A silent radar produces no new active detections but may retain and decay prior tracks.

## 30. Decoys and Radar Warning

A decoy deployment requires compatible inventory, launcher, target threat, timing, and command authority.

Radar-warning systems may create attack warnings only when an eligible hostile emission or illuminated state is detected.

Neither system guarantees defeat of a seeker or attack.

Every decoy and warning event MUST preserve source, contact, confidence, inventory, and decision records.

## 31. Compact Electronic-Warfare Model

When detailed EW is disabled, the engine MUST still resolve:

- sensor quality;
- emission state;
- jamming strength;
- decoy capacity;
- seeker resistance;
- data-link resilience;
- ESM detection; and
- radar warning.

Each effect MUST use explicit opposed integer modifiers and produce audit records.

Disabling detailed EW MUST NOT turn jamming, decoys, ESM, or link resilience into no effect.

## 32. Records and Audit

Every detection, track update, identification change, fire-control assignment, blind-fire shot, installation, inventory transfer, malfunction, gunfire-shock check, damage, repair, data-link transfer, ESM detection, jamming result, emission change, decoy use, and warning MUST create an immutable `ElectronicsEventRecord` containing:

- battle minute and substep or strategic phase;
- actor, system, target, and contact identifiers;
- authoritative inputs;
- knowledge inputs;
- formulas and multipliers;
- inventory and project transactions;
- random decisions;
- result and persistence effects;
- ruleset, content, formula, and RNG versions; and
- event hash.

## 33. Canonical Ordering

Electronics resolution MUST order:

1. emissions by source identifier;
2. ESM and warning detections;
3. search-radar detections;
4. track fusion and identification;
5. data-link sharing;
6. fighter direction and fire-control assignments;
7. jamming and burn-through;
8. weapon-support queries;
9. malfunctions and damage; and
10. repair and calibration tasks.

Within a stage, systems and contacts MUST be ordered by stable identifier.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect outcomes.

## 34. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_ELECTRONICS_SYSTEM_DEFINITION`;
- `INVALID_SHIP_ELECTRONICS_STATE`;
- `RADAR_DETECTION_INELIGIBLE`;
- `RADAR_IDENTIFICATION_CONFIDENCE_EXCEEDED`;
- `FIRE_CONTROL_RADAR_INELIGIBLE`;
- `BLIND_FIRE_RADAR_LEVEL_INSUFFICIENT`;
- `BLIND_FIRE_TRACK_QUALITY_INSUFFICIENT`;
- `RADAR_TECHNOLOGY_UNAVAILABLE`;
- `RADAR_DESIGN_SPACE_INSUFFICIENT`;
- `RADAR_INVENTORY_UNAVAILABLE`;
- `RADAR_INSTALLATION_INELIGIBLE`;
- `RADAR_INSTALLATION_SHIP_UNAVAILABLE`;
- `RADAR_MALFUNCTION_OCCURRED`;
- `RADAR_DISABLED_BY_DAMAGE`;
- `RADAR_OWN_GUNFIRE_SHOCK`;
- `ELECTRONICS_REPAIR_INELIGIBLE`;
- `DATA_LINK_TRACK_QUALITY_INSUFFICIENT`;
- `DATA_LINK_INCOMPATIBLE`;
- `ELECTRONIC_SUPPORT_DETECTION_CREATED`;
- `JAMMING_TARGET_INELIGIBLE`;
- `DECOY_INVENTORY_UNAVAILABLE`;
- `RADAR_WARNING_CREATED`; and
- `ELECTRONICS_STATE_INVARIANT_FAILED`.

## 35. Validation and Acceptance

Automated validation MUST prove that:

1. every electronics system has complete technology, physical, production, installation, operating, formula, reliability, damage, and repair metadata;
2. search radar detects only through exact range, signature, propagation, clutter, reliability, crew, jamming, and keyed decision predicates;
3. fog, mist, and darkness use neutral radar weather multipliers while precipitation uses exact reductions;
4. radar detection does not automatically identify a contact;
5. radar-only identification is capped exactly at 3,000, 4,000, 5,000, 6,000, or 7,500 basis points by level;
6. radar-only tracks remain less identified than confirmed visual tracks;
7. fire-control radar uses exact 10,500 through 12,500 gunnery multipliers;
8. blind fire requires level 3 or higher, 7,500 track quality, 4,000 identification, at most 30-second track age, valid uncertainty, jamming, target, range, arc, and fire-mode predicates;
9. blind fire uses the track estimate and exact 8,500 additional accuracy multiplier;
10. track fusion retains provenance and adds at most 1,000 identification-confidence basis points;
11. every ship may install levels 1 and 2 only when technology, location, power, cooling, mast, stability, crew, inventory, work, and cost pass;
12. levels 3 through 5 require exact 100, 200, and 350 electronics-space units;
13. radar discovery and adoption create no inventory;
14. every installation consumes exactly one produced set;
15. automatic installation uses normal commands, reservations, projects, inventory, and audit records;
16. automatic installation prioritizes active ships, mission requirements, descending true displacement, exact class order, deficiency, and identifier;
17. automation consumes no randomness;
18. minor level-1 or level-2 installation lasts exactly one strategic month;
19. manual and automatic installation make the ship unavailable for the complete installation period;
20. higher installations use compiled refit duration and are not forced into one month;
21. radar reliability uses exact level values from 7,500 through 9,750 basis points;
22. malfunction checks occur at initialization, every 30 minutes, after eligible damage, own gunfire shock, and power interruption;
23. malfunction outcomes use weights totaling exactly 10,000 and exact durations and effects;
24. own-gunfire shock uses exact level-specific caliber thresholds and probability multipliers and requires spatial eligibility;
25. damage independently affects antenna, transmitter, receiver, director, power, cooling, processing, operator, link, and mounting state;
26. damage persists until explicit repair or replacement;
27. fighter direction modifies CAP only through exact legal tracks, communications, aircraft, and vector-quality values;
28. data-link sharing uses exact compatibility, range, relay, emission, jamming, track-quality, and policy predicates;
29. shared tracks retain source, age, uncertainty, confidence, jamming, and deception;
30. ESM, jamming, emissions, decoys, and radar warning use explicit contracts and do not guarantee outcomes;
31. compact EW preserves every named opposed effect rather than omitting it;
32. every electronics action creates complete immutable records; and
33. identical state, commands, content, ruleset, weather, knowledge, and seeds produce identical detections, tracks, installations, malfunctions, damage, sharing, EW effects, records, and hashes.
