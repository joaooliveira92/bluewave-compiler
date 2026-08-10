# DESIGN-43: Aircraft

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-43`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Aircraft development, proposals, private ventures, inventory, squadron equipment, re-equipment, expansion, basing, damaged aircraft, and mission roles MUST use the explicit contracts, values, predicates, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Canonical Aircraft Types

The canonical aircraft type identifiers are:

- `FIGHTER`;
- `TORPEDO_BOMBER`;
- `DIVE_BOMBER`;
- `MEDIUM_BOMBER`;
- `PATROL_AIRCRAFT`;
- `FLOATPLANE_SCOUT`;
- `AIRSHIP`;
- `LIGHT_JET_FIGHTER`;
- `HEAVY_JET_FIGHTER`;
- `JET_ATTACK_AIRCRAFT`;
- `HELICOPTER`; and
- `SPECIAL_SQUADRON`.

An additional type requires a versioned design revision and a complete aircraft-type definition, mission matrix, basing policy, production policy, AI mapping, and save migration.

## 2. Aircraft Model

Every aircraft model MUST have one immutable `AircraftModelDefinition` containing:

- `aircraftModelId`;
- aircraft type;
- owner or license holder;
- introduction month;
- speed score;
- firepower score;
- maneuverability score;
- toughness score;
- payload capacity;
- range class and range distance;
- ordered eligible role identifiers;
- basing requirement identifier;
- carrier suitability;
- deck and catapult requirements;
- technology prerequisites;
- production work and unit cost;
- maintenance requirement;
- crew requirement;
- content version; and
- content hash.

Scores use integer range `0..100`. Payload, range, cost, and work use canonical integer units.

Missing data MUST fail with `INVALID_AIRCRAFT_MODEL_DEFINITION`.

## 3. Aircraft State

Every nation MUST maintain authoritative state for:

- aircraft inventory by model and condition;
- aircraft under production;
- squadron assignments;
- operational aircraft;
- damaged aircraft;
- aircraft under repair;
- pilot pool;
- squadron experience;
- squadron fatigue;
- basing allocation;
- development projects;
- private-venture proposals; and
- ruleset, formula, content, and RNG versions.

Aircraft quantities MUST be non-negative integers. One aircraft MUST NOT exist in two inventory, squadron, repair, or loss states simultaneously.

## 4. Aircraft Development Request

Aircraft development MUST use `RequestAircraftProposalCommand`.

The player or AI MUST specify:

- exactly one aircraft role;
- exactly two distinct emphasized traits;
- intended basing class;
- requesting nation;
- expected technology-state hash;
- development-policy version; and
- idempotency key.

The canonical emphasized traits are:

- `SPEED`;
- `FIREPOWER`;
- `MANEUVERABILITY`;
- `TOUGHNESS`;
- `PAYLOAD`;
- `RANGE`;
- `RELIABILITY`;
- `CARRIER_SUITABILITY`; and
- `EASE_OF_PRODUCTION`.

The selected traits MUST be compatible with the requested role. Duplicate traits MUST fail with `AIRCRAFT_DEVELOPMENT_TRAITS_NOT_DISTINCT`.

## 5. One Active Proposal at a Time

A nation may have exactly one player-requested aircraft proposal in `REQUESTED`, `DEVELOPING`, or `READY_FOR_REVIEW` status at a time.

A second request MUST fail with `AIRCRAFT_PROPOSAL_ALREADY_ACTIVE`.

Private-venture proposals do not consume this slot, but a nation may have at most `3` unexpired private-venture proposals simultaneously.

## 6. Development Project

Every accepted request MUST create one `AircraftDevelopmentProject` containing:

- `developmentProjectId`;
- requested role;
- two emphasized traits;
- basing class;
- start month;
- required development months;
- completed paid months;
- monthly cost;
- technology input hash;
- national-trait input hash;
- design stream key;
- status;
- final proposal identifier or `NONE`;
- ruleset and formula versions; and
- project hash.

`status` MUST be:

- `REQUESTED`;
- `DEVELOPING`;
- `DELAYED`;
- `READY_FOR_REVIEW`;
- `ACCEPTED`;
- `REJECTED`; or
- `CANCELLED`.

## 7. Development Duration

The shipped policy `aircraft_development_duration_v1` defines:

- base duration: exactly `4` completed paid months;
- permitted ruleset range: `3..6` months inclusive;
- advanced design complexity: `+1` month;
- immature required technology: `+1` month;
- experienced aviation industry: `-1` month;
- minimum final duration: `3` months;
- maximum final duration: `6` months.

`requiredDevelopmentMonths = clamp(3, 6, 4 + complexityModifierMonths + technologyModifierMonths + industryModifierMonths)`

Modifiers MUST be explicit integers. Missing modifier data uses the explicit neutral value `0`.

A month paid below `10_000` basis points of required development cost grants zero development progress.

## 8. Deterministic Proposal Generation

Proposal generation MUST use stream:

`aircraft/development/nation/role/proposal`

The stable key MUST include:

- RNG algorithm version;
- campaign seed;
- nation identifier;
- development project identifier;
- requested role;
- ordered emphasized traits;
- start month;
- technology manifest hash;
- national-trait hash;
- basing class;
- development-policy version; and
- proposal formula version.

The proposal MUST be generated exactly once when the final required paid month completes.

Save load, UI preview, acceptance choice, rejection, and report generation MUST NOT reroll it.

Identical keyed inputs MUST produce the same proposal and model attributes on every supported platform.

## 9. Proposal Attribute Allocation

Every proposal MUST start from the role's explicit baseline attribute vector.

Each emphasized trait receives exactly `+10` score points before bounds and trade-offs.

The shipped trade-off policy deducts a total of `10` score points from non-emphasized attributes through deterministic weighted selection. No attribute may fall below its role minimum or exceed `100`.

Technology, national traits, industry quality, and development events then apply explicit integer modifiers in ascending modifier identifier order.

Every final attribute, input, trade-off, bound, and rounding result MUST be recorded.

## 10. Proposal Review

A completed proposal MUST create one immutable `AircraftProposal` containing:

- proposal identifier;
- source project;
- proposed model definition;
- role and emphasized traits;
- development duration and cost;
- production cost and work;
- estimated performance;
- exact authoritative attributes visible under the model-evaluation policy;
- production and basing requirements;
- expiry month;
- acceptance and rejection status; and
- proposal hash.

The player or AI may accept or reject the proposal. Rejection does not reroll or refund completed development work.

Acceptance creates an immutable aircraft model and production eligibility. It does not create inventory automatically.

## 11. Private Ventures

Private ventures may create proposals only through typed event `private_aircraft_venture_v1`.

Eligibility requires:

- active private aviation industry;
- at least one role permitted by current technology;
- no active national prohibition;
- event cooldown complete;
- fewer than `3` unexpired private proposals; and
- a legal purchasable model can be generated.

The shipped cooldown is exactly `12` completed months per nation.

Eligible roles MUST be ordered by role identifier. The event uses stream:

`event/month/nation/private_aircraft_venture`

A private proposal MUST contain an exact purchase price, production license terms, expiry month, technology requirements, and model hash.

Buying it requires `PurchasePrivateAircraftProposalCommand` and balanced payment. A private proposal MUST NOT enter inventory or service merely because the event occurred.

## 12. Private-Proposal Expiry

The shipped private-proposal lifetime is exactly `12` completed months.

An expired proposal becomes `EXPIRED` and cannot be purchased. The model may reappear only through a future separately keyed event or ordinary national development.

Expiry does not refund private or government expenditure.

## 13. Aircraft Inventory States

Every physical aircraft MUST be counted in exactly one state:

- `UNASSIGNED_OPERATIONAL`;
- `ASSIGNED_OPERATIONAL`;
- `DAMAGED_REPAIRABLE`;
- `DAMAGED_AWAITING_CAPACITY`;
- `UNDER_REPAIR`;
- `RESERVED_FOR_REEQUIPMENT`;
- `WRITTEN_OFF`;
- `CAPTURED`; or
- `LOST`.

`WRITTEN_OFF` and `LOST` do not consume active basing capacity after their removal transaction commits.

## 14. Squadron State

Every squadron MUST have one authoritative `SquadronState` containing:

- `squadronId`;
- owner nation;
- squadron role;
- assigned aircraft model;
- authorized strength;
- operational aircraft count;
- damaged aircraft count;
- replacement aircraft reserved;
- pilot count;
- squadron experience;
- fatigue;
- training state;
- base or carrier identifier;
- re-equipment state;
- expansion state;
- mission availability;
- ruleset version; and
- state hash.

Squadron experience uses integer range `0..100`.

## 15. Auto-Equip Eligibility

Automated squadron equipment MUST use `AutoEquipSquadronCommand` with issuer `SYSTEM_AUTOMATION`.

Auto-equip is eligible only when:

- squadron has no assigned model or an explicit replacement requirement;
- at least one compatible accepted aircraft model exists;
- sufficient unassigned operational inventory exists;
- basing or carrier requirements pass;
- technology and doctrine requirements pass;
- pilot and maintenance support pass;
- no asset automation lock prohibits the action; and
- the selected model satisfies the squadron role.

The system MUST NOT create aircraft, consume damaged aircraft as operational inventory, select an unaccepted proposal, or equip beyond authorized strength.

## 16. Deterministic Auto-Equip Selection

Eligible models MUST be ordered by:

1. descending integer role-fit score;
2. descending model-generation month;
3. ascending production and maintenance burden;
4. ascending aircraft-model identifier.

The first model with sufficient inventory for at least `7_500` basis points of authorized squadron strength MUST be selected.

Auto-equip consumes no randomness.

If no model or sufficient inventory exists, the squadron remains unchanged and emits `SQUADRON_AUTO_EQUIP_UNAVAILABLE`.

## 17. Re-Equipment

Re-equipment requires an accepted `ReequipSquadronCommand` or eligible automated command.

The command MUST reserve:

- the exact replacement-aircraft quantity;
- basing capacity;
- pilot and mechanic training capacity;
- conversion cost; and
- the re-equipment duration.

The shipped duration is exactly `2` completed paid months.

During re-equipment, the squadron is unavailable for normal missions.

On completion, the prior operational aircraft return to unassigned inventory, storage, conversion, transfer, or disposal according to the command's explicit disposition.

## 18. Re-Equipment Experience Penalty

The shipped re-equipment experience penalty is exactly `10` points.

It applies once when the new model becomes authoritative for the squadron.

If the new model belongs to a different propulsion or operational family, apply an additional `5` points:

- piston to jet;
- fixed wing to helicopter;
- land plane to carrier plane;
- floatplane to wheeled aircraft; or
- another explicit family change.

Final experience clamps to `0..100`.

The penalty is persistent crew and squadron experience loss. A separate temporary conversion-readiness multiplier of `8_000` basis points applies for exactly `3` completed months after re-equipment.

## 19. Squadron Expansion

Expansion is measured against authorized strength before the expansion transaction.

The shipped experience penalties are:

- expansion up to and including `2_500` basis points: `-5` points;
- above `2_500` through `5_000`: `-10`;
- above `5_000`: `-20`.

The ratio is:

`expansionRatioBp = floor(addedAuthorizedStrength * 10_000 / max(1, priorAuthorizedStrength))`

Expansion requires aircraft inventory, pilots, basing capacity, maintenance support, and command authorization.

The penalty applies once after expansion commits. Splitting one expansion into several commands within the same month MUST aggregate before selecting the penalty band.

## 20. Basing Capacity

Every operational, assigned, reserved-for-re-equipment, damaged-repairable, damaged-awaiting-capacity, and under-repair aircraft consumes exactly one physical basing-capacity slot.

A written-off, lost, transferred-out, or scrapped aircraft stops consuming capacity only after its removal transaction commits.

Thus damaged aircraft continue to consume physical capacity until repaired, written off, transferred, captured, lost, or removed through another typed effect.

A squadron MUST NOT exceed the host base or carrier's current usable physical capacity.

## 21. Damaged Aircraft Disposition

Every damaged aircraft MUST receive one explicit disposition:

- `REPAIR_LOCALLY`;
- `AWAIT_REPAIR_CAPACITY`;
- `TRANSFER_FOR_REPAIR`;
- `WRITE_OFF`;
- `CANNIBALIZE`;
- `CAPTURED`; or
- `LOST`.

Local repair requires operational repair capacity, parts, personnel, time, and payment.

Cannibalization MUST remove the aircraft from physical inventory and create exact spare-parts inventory. It MUST NOT leave the aircraft occupying a basing slot.

Damage is not cleared by month transition or squadron reassignment.

## 22. Aircraft Mission Roles

The canonical mission-role identifiers are:

- `CAP`;
- `ESCORT`;
- `INTERCEPTION`;
- `TORPEDO_ATTACK`;
- `LEVEL_BOMBING`;
- `DIVE_BOMBING`;
- `SKIP_BOMBING`;
- `GUIDED_WEAPON_ATTACK`;
- `MISSILE_ATTACK`;
- `LONG_RANGE_SCOUTING`;
- `LOCAL_SCOUTING`;
- `STRATEGIC_ASW`;
- `TACTICAL_ASW`;
- `RADAR_EXTENSION`;
- `UTILITY_TRANSPORT`;
- `SEARCH_AND_RESCUE`; and
- `SPECIAL_MISSION`.

Every aircraft model MUST list its exact eligible roles. A role absent from the list is prohibited.

## 23. Fighter Roles

`FIGHTER`, `LIGHT_JET_FIGHTER`, and `HEAVY_JET_FIGHTER` may perform:

- `CAP`;
- `ESCORT`;
- `INTERCEPTION`; and
- another explicit fighter-bomber role when the model definition includes compatible payload and doctrine.

The shipped role restrictions are:

- CAP requires air-to-air armament and available controller or patrol policy;
- escort requires sufficient mission radius for the escorted strike;
- interception requires a valid detected or warned target;
- carrier operation requires carrier suitability and deck compatibility.

## 24. Torpedo-Bomber Roles

`TORPEDO_BOMBER` may perform:

- `TORPEDO_ATTACK`; or
- `LEVEL_BOMBING` with a compatible bomb load.

Torpedo attack additionally requires:

- air-launched torpedo technology and inventory;
- target depth and sea-state eligibility;
- minimum launch run;
- compatible speed and altitude profile;
- trained squadron doctrine; and
- no aircraft or carrier restriction.

A torpedo bomber MUST NOT perform dive bombing unless its model explicitly has that role.

## 25. Dive-Bomber Roles

`DIVE_BOMBER` may perform `DIVE_BOMBING` and eligible `LOCAL_SCOUTING`.

The shipped dive-bombing effects are:

- ship-attack accuracy multiplier: `12_500` basis points relative to level bombing with the same crew and target state;
- armor-penetration multiplier: `8_500` basis points relative to an equal-mass level-dropped bomb;
- deck-impact-angle modifier: weapon and attack-profile defined;
- attack eligibility: weather, cloud ceiling, visibility, altitude, and aircraft condition must pass.

The accuracy bonus MUST NOT change bomb explosive mass. The penetration penalty MUST NOT be inferred for bombs whose explicit profile overrides it.

## 26. Medium-Bomber Roles

`MEDIUM_BOMBER` may perform:

- `LEVEL_BOMBING` by default;
- `SKIP_BOMBING` with adopted `skip_bombing_doctrine`;
- `TORPEDO_ATTACK` with adopted technology, compatible model, inventory, and training;
- `GUIDED_WEAPON_ATTACK` with compatible guided weapon and control technology; or
- `MISSILE_ATTACK` with compatible missile, guidance, basing, and doctrine.

A mission mode unavailable by technology MUST fail with `AIRCRAFT_MISSION_TECHNOLOGY_UNAVAILABLE`.

One sortie MUST select exactly one primary attack role.

## 27. Patrol-Aircraft Roles

`PATROL_AIRCRAFT` may perform:

- `LONG_RANGE_SCOUTING`;
- `STRATEGIC_ASW`;
- `TACTICAL_ASW` when the battle manifest includes it; and
- `SEARCH_AND_RESCUE` when equipment is installed.

The shipped range multiplier for long-range scouting is `12_500` basis points over the model's ordinary patrol-radius calculation.

Strategic ASW requires sensors, depth weapons or homing weapons, crew training, legal reports or patrol zones, and sufficient endurance.

Patrol aircraft do not automatically identify every detected submarine.

## 28. Floatplane Roles and Launch

`FLOATPLANE_SCOUT` may perform:

- `LOCAL_SCOUTING`;
- `TACTICAL_ASW`; and
- `SEARCH_AND_RESCUE` when equipped.

With an operational compatible catapult, launch uses the catapult's exact ship-speed and sea-state limits.

Without a catapult, launch is eligible only when:

- ship's authoritative current speed is exactly `0` knots;
- sea state is at most `3`;
- wind and deck-side handling policy pass;
- aircraft handling equipment is operational;
- no immediate enemy-fire or collision hazard prohibits launch; and
- the ship remains stopped through the complete launch sequence.

The shipped no-catapult launch duration is exactly `5` tactical minutes.

If the ship moves before completion, launch fails, the aircraft remains aboard unless a typed accident result occurs, and no sortie begins.

## 29. Airship Roles

`AIRSHIP` may perform:

- `LONG_RANGE_SCOUTING`;
- `STRATEGIC_ASW` when equipped; and
- `RADAR_EXTENSION` after the relevant technology.

The shipped weather restrictions are:

- wind speed below `15` knots: fully eligible;
- `15` through below `25`: mission effectiveness `7_500` basis points;
- `25` through below `35`: `5_000` and launch requires explicit risk authorization;
- `35` knots or higher: launch prohibited;
- heavy precipitation: effectiveness `5_000`;
- severe storm state: launch prohibited.

Airships MUST use explicit mooring, hangar, crew, weather, and recovery requirements.

## 30. Jet Carrier Eligibility

`LIGHT_JET_FIGHTER`, `HEAVY_JET_FIGHTER`, and `JET_ATTACK_AIRCRAFT` may operate from a carrier only when all predicates pass:

- aircraft model has `carrierSuitable: true`;
- carrier has adopted jet-carrier doctrine;
- flight deck has compatible axial or angled-deck technology;
- catapult or assisted-launch requirement passes;
- arresting-gear requirement passes;
- deck length, width, strength, and heat-resistance limits pass;
- elevator and hangar dimensions pass;
- carrier speed and wind-over-deck requirements pass;
- fuel and maintenance support exist; and
- weather permits launch and recovery.

The shipped minimum carrier technologies are:

- light carrier jet operation: `early_jet_carrier_operations` plus compatible deck and gear;
- heavy jet fighter or jet attack operation: `modern_jet_carrier_operations` plus angled deck, steam or later catapult, and strengthened arresting gear.

A jet model MUST NOT operate from an incompatible carrier merely because inventory is present.

## 31. Helicopter Roles

`HELICOPTER` may perform:

- `TACTICAL_ASW`;
- `STRATEGIC_ASW` when the model and basing policy permit it;
- `RADAR_EXTENSION`;
- `UTILITY_TRANSPORT`;
- `SEARCH_AND_RESCUE`; and
- `SPECIAL_MISSION` when explicitly listed.

Role requirements are:

- ASW: compatible sonar or sensors, weapons, crew training, and endurance;
- radar extension: airborne radar and data-link capability;
- utility: payload and landing access;
- rescue: hoist or recovery equipment and survivor capacity.

Helicopter basing requires a compatible deck spot, hangar or exposed-basing policy, fuel, maintenance support, and rotor-clearance geometry.

## 32. Basing Classes

Every aircraft MUST declare one basing class:

- `LAND_BASED`;
- `CARRIER_BASED`;
- `SEAPLANE_SUPPORTED`;
- `AIRSHIP_BASED`;
- `HELICOPTER_DECK_BASED`; or
- `SPECIAL_EXPLICIT`.

A base, carrier, tender, or ship may host an aircraft only when its infrastructure definition supports that basing class and has available physical capacity.

Generic free basing is prohibited.

## 33. Squadron Mission Eligibility

A squadron is mission-eligible only when:

- assigned model has the requested role;
- operational aircraft are at least `5_000` basis points of authorized strength;
- pilot staffing is at least `7_500` basis points;
- fatigue is below the mission limit;
- squadron is not re-equipping or otherwise unavailable;
- basing and deck state permit the mission;
- fuel, weapons, support, and weather pass;
- range reaches the objective and legal recovery location; and
- command, intelligence, and airspace predicates pass.

Every failure MUST produce an explicit reason code.

## 34. Aircraft Availability

For each squadron:

`availableAircraft = min(operationalAircraft, assignedPilots, basingAvailableAircraft, fuelSupportedAircraft, missionWeaponSupportedAircraft)`

Damaged aircraft do not count as available.

Reserved aircraft cannot be used by another squadron or mission.

Availability calculations MUST use exact integer counts and deterministic priority.

## 35. Inventory Allocation

Aircraft inventory allocation priority is:

1. operational squadrons in active battle or mandatory defense;
2. carrier air groups assigned to active operations;
3. strategic patrol and ASW commitments;
4. replacement of combat losses;
5. squadron re-equipment;
6. squadron expansion;
7. training and reserve inventory.

Equal-priority demands MUST be ordered by squadron and demand identifier.

Allocation consumes no randomness.

## 36. Experience and Fatigue Binding

Squadron experience, pilot-pool quality, fatigue, elite training, loss dilution, mission fatigue, and rescue effects MUST use `DESIGN-28`.

This document MUST NOT create a second experience or fatigue authority.

Re-equipment and expansion effects in Sections 18 and 19 bind to the corresponding `DESIGN-28` values.

## 37. Production and Supply

An accepted aircraft model creates production eligibility only.

Production requires:

- accepted production command;
- paid work;
- industrial capacity;
- required materials and engines;
- technology adoption;
- production line or conversion policy;
- quality-control policy; and
- inventory destination.

Completed aircraft enter `UNASSIGNED_OPERATIONAL` or a typed damaged or acceptance-failure state. They MUST NOT enter a squadron without allocation.

## 38. Records and Audit

Every development request, project month, proposal generation, private venture, purchase, production, inventory transfer, squadron assignment, auto-equip, re-equipment, expansion, damaged-aircraft disposition, basing allocation, and mission assignment MUST create immutable records.

Each record MUST contain:

- actor and command or event;
- input state hashes;
- exact values and formulas;
- reservations and payments;
- RNG decisions where applicable;
- output quantities and state;
- reason codes;
- content, ruleset, formula, and RNG versions; and
- record hash.

## 39. Canonical Ordering

Aircraft resolution MUST order:

1. nations by identifier;
2. development projects by authorization month and project identifier;
3. proposals by creation month and proposal identifier;
4. models by aircraft-model identifier;
5. inventory by model and condition;
6. squadrons by squadron identifier;
7. aircraft demands by Section 35 priority;
8. basing allocations by base and squadron identifier; and
9. missions by mission ordinal and squadron identifier.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect outcomes.

## 40. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_AIRCRAFT_MODEL_DEFINITION`;
- `INVALID_AIRCRAFT_STATE`;
- `AIRCRAFT_DEVELOPMENT_ROLE_INVALID`;
- `AIRCRAFT_DEVELOPMENT_TRAITS_NOT_DISTINCT`;
- `AIRCRAFT_PROPOSAL_ALREADY_ACTIVE`;
- `AIRCRAFT_DEVELOPMENT_PAYMENT_INSUFFICIENT`;
- `AIRCRAFT_PRIVATE_VENTURE_INELIGIBLE`;
- `AIRCRAFT_PRIVATE_PROPOSAL_EXPIRED`;
- `AIRCRAFT_INVENTORY_INSUFFICIENT`;
- `SQUADRON_AUTO_EQUIP_UNAVAILABLE`;
- `SQUADRON_REEQUIPMENT_INELIGIBLE`;
- `SQUADRON_EXPANSION_INELIGIBLE`;
- `AIRCRAFT_BASING_CAPACITY_INSUFFICIENT`;
- `DAMAGED_AIRCRAFT_DISPOSITION_REQUIRED`;
- `AIRCRAFT_MISSION_ROLE_INELIGIBLE`;
- `AIRCRAFT_MISSION_TECHNOLOGY_UNAVAILABLE`;
- `FLOATPLANE_LAUNCH_REQUIRES_STOPPED_SHIP`;
- `AIRSHIP_WEATHER_PROHIBITS_OPERATION`;
- `JET_CARRIER_INCOMPATIBLE`;
- `HELICOPTER_BASING_INCOMPATIBLE`; and
- `AIRCRAFT_STATE_INVARIANT_FAILED`.

## 41. Validation and Acceptance

Automated validation MUST prove that:

1. every aircraft type and model has complete attributes, roles, basing, technology, production, maintenance, and crew data;
2. every development request specifies exactly one role and two distinct compatible traits;
3. a nation has at most one active player-requested proposal;
4. development duration uses an exact shipped base of four paid months and remains within three through six months;
5. unpaid months grant zero development progress;
6. proposal generation uses the exact stable keyed stream and cannot reroll;
7. each emphasized trait receives exactly ten score points before explicit trade-offs and bounds;
8. identical development inputs produce identical proposal values and hashes;
9. private ventures occur only through the typed event, use a 12-month cooldown, and create purchasable rather than free models;
10. private proposals expire after exactly 12 completed months;
11. physical aircraft occupy exactly one inventory state;
12. auto-equip uses normal commands and only accepted compatible models with sufficient operational inventory and basing;
13. auto-equip consumes no randomness and creates no aircraft;
14. re-equipment lasts exactly two paid months and makes the squadron unavailable;
15. re-equipment applies exactly ten experience points plus five for a family change and a three-month 8,000 readiness multiplier;
16. expansion uses exact 2,500 and 5,000 basis-point bands with penalties of 5, 10, and 20 points;
17. same-month expansion commands aggregate before penalty selection;
18. damaged aircraft consume one basing slot until repaired or explicitly removed;
19. damaged state never clears automatically;
20. every removal, repair, transfer, write-off, and cannibalization uses a typed disposition;
21. fighters use exact CAP, escort, and interception predicates;
22. torpedo bombers use torpedo or level-bombing roles and require exact torpedo prerequisites;
23. dive bombers use exactly 12,500 ship-attack accuracy and 8,500 penetration multipliers under the shipped profile;
24. medium bombers unlock level, skip, torpedo, guided-weapon, and missile missions only through explicit technology and equipment;
25. patrol aircraft provide scouting and ASW only through exact range, sensor, weapon, training, and endurance predicates;
26. floatplanes without catapults require ship speed exactly zero, sea state at most three, and a five-minute launch sequence;
27. airships use exact wind and precipitation eligibility and effectiveness bands;
28. jets require carrier suitability, doctrine, deck, catapult, arresting gear, dimensions, speed, support, and weather;
29. helicopters use only explicitly equipped ASW, radar, utility, rescue, and special roles;
30. every aircraft has one explicit basing class and consumes physical capacity;
31. squadron mission eligibility uses exact operational-aircraft, pilot, fatigue, basing, supply, weather, range, command, and intelligence predicates;
32. inventory allocation uses deterministic priority and cannot double-allocate aircraft;
33. experience and fatigue remain bound to `DESIGN-28` rather than duplicated; and
34. identical state, commands, content, ruleset, weather, knowledge, and seeds produce identical development, proposals, inventory, squadrons, basing, missions, records, and hashes.
