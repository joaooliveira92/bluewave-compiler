# DESIGN-37: Battle Generation

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-37`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Mission opportunities, side selection, force requirements, asset eligibility, division preservation, optional selection, allied support, generated elements, composition repair, battle acceptance, command authority, intelligence presentation, and manifest hashing MUST use the explicit contracts, values, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Battle-Generation Inputs

Battle generation MUST use only committed authoritative state available after `RESOLVE_PRE_BATTLE_OPERATIONAL_EFFECTS`:

- active war state;
- committed `PostMovementSnapshot`;
- pre-battle operational-effect records;
- mission-opportunity records;
- area and route force presence;
- ship readiness, damage, fuel, supply, and mission state;
- permanent divisions and commanders;
- weather and sea state;
- coastal defenses;
- mine-pressure and swept-state records;
- submarine operational assets;
- aircraft and squadron availability;
- trade, convoy, blockade, raider, and invasion context;
- operational objectives;
- prior current-month battle reservations;
- current content, ruleset, formula, AI-policy, and RNG versions; and
- participant knowledge projections used only for presentation and AI decisions.

Battle generation MUST NOT read planned movement as completed presence or use pre-battle asset state after a current-month battle has changed it.

## 2. Canonical Mission Registry

The shipped canonical mission types are exactly:

1. `FLEET_BATTLE`;
2. `CRUISER_BATTLE`;
3. `COASTAL_RAID`;
4. `CONVOY_ATTACK`;
5. `CONVOY_DEFENSE`;
6. `INVASION`;
7. `RAIDER_INTERCEPTION`;
8. `BLOCKADE_BREAKOUT`; and
9. `CARRIER_ACTION`.

The shipped ruleset defines no generic extension or fallback mission type.

A future mission type requires a versioned design revision and complete `BattleMissionDefinition` containing:

- stable mission identifier;
- mission priority;
- opportunity predicate;
- side-selection policy;
- force-requirement policy;
- mandatory and optional roles;
- asset-eligibility policy;
- generated-element policies;
- repair policy;
- acceptance class;
- decline-consequence policy;
- auto-resolution policy;
- tactical initialization policy;
- result policy;
- test vectors; and
- save compatibility rules.

An unregistered mission MUST fail with `BATTLE_MISSION_TYPE_UNREGISTERED`.

## 3. Mission Priorities

The shipped mission priorities, lower number first, are:

1. `INVASION`;
2. `BLOCKADE_BREAKOUT`;
3. `CONVOY_DEFENSE`;
4. `CONVOY_ATTACK`;
5. `RAIDER_INTERCEPTION`;
6. `COASTAL_RAID`;
7. `CARRIER_ACTION`;
8. `FLEET_BATTLE`;
9. `CRUISER_BATTLE`.

Priorities MUST be unique. Missing or duplicate priorities MUST fail with `BATTLE_MISSION_PRIORITY_INVALID`.

## 4. Battle-Generation Pipeline

Generation MUST execute these stages in exact order:

1. `DETERMINE_MISSION_OPPORTUNITIES`;
2. `DETERMINE_PARTICIPATING_SIDES`;
3. `CREATE_FORCE_REQUIREMENTS`;
4. `GATHER_ELIGIBLE_ASSETS`;
5. `PRESERVE_PERMANENT_DIVISIONS`;
6. `ASSIGN_MANDATORY_ROLES`;
7. `SELECT_OPTIONAL_ASSETS`;
8. `ADD_ALLIED_SUPPORT`;
9. `INSTANTIATE_GENERATED_ELEMENTS`;
10. `VALIDATE_REACHABILITY_AND_LEGALITY`;
11. `REPAIR_GENERATED_COMPOSITION`;
12. `REJECT_IRREPARABLE_ENGAGEMENTS`;
13. `CANONICALIZE_BATTLE_MANIFEST`;
14. `ASSIGN_BATTLE_SEED`; and
15. `CREATE_INTELLIGENCE_LIMITED_PRESENTATION`.

Every stage MUST emit one `BattleGenerationStageRecord` containing:

- opportunity and prospective battle identifiers;
- stage identifier and ordinal;
- input hashes;
- ordered candidates;
- predicate results;
- selections and exclusions;
- random-decision references;
- repairs;
- result code;
- output hash; and
- ruleset and formula versions.

A stage with no eligible work MUST emit a successful empty record. A failed stage MUST stop processing that opportunity.

## 5. Mission Opportunity

Every opportunity MUST create one immutable `BattleMissionOpportunity` containing:

- `opportunityId`;
- `warId`;
- `areaId` or route scope;
- mission type;
- mission priority;
- creating command, event, operation, or strategy record;
- attacker candidate side;
- defender candidate side;
- objective identifiers;
- earliest and latest resolution phases;
- opportunity eligibility predicate and version;
- acceptance class;
- decline-consequence policy;
- status;
- input-state hash; and
- opportunity hash.

`status` MUST be `CANDIDATE`, `ELIGIBLE`, `REJECTED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, or `SUPERSEDED`.

An opportunity MUST NOT reserve assets or consume a battle seed before acceptance.

## 6. Opportunity Predicates by Mission

### 6.1 Fleet Battle

Requires:

- opposing active-war sides;
- positive eligible surface or carrier strength for both sides in the same operational area;
- at least one side with a fleet or decisive-contact mission;
- no mission-specific prohibition; and
- minimum eligible combat strength of `300` points per side.

### 6.2 Cruiser Battle

Requires:

- opposing active-war sides;
- at least one eligible `CL`, `CA`, or `BC` group per side;
- no eligible capital-core requirement for the mission;
- contact or patrol opportunity; and
- minimum eligible cruiser strength of `150` points per side.

### 6.3 Coastal Raid

Requires:

- valid hostile coastal target;
- eligible raiding or bombardment force;
- target defenses or objective;
- legal route and withdrawal path; and
- coastal-raid mission command or event.

### 6.4 Convoy Attack and Defense

Require:

- active convoy or merchant route;
- eligible attacker opportunity;
- convoy manifest;
- defense opportunity where protection assets exist; and
- trade-warfare context from `DESIGN-33`.

Attack and defense are represented by one battle when they refer to the same convoy and time window.

### 6.5 Invasion

Requires a launched valid `AmphibiousBattleManifest` under `DESIGN-36`. Battle generation MUST NOT independently invent invasion transports, target, route, or occupation effects.

### 6.6 Raider Interception

Requires a successful interception opportunity under `DESIGN-33`, one eligible raider, and at least one eligible interceptor group.

### 6.7 Blockade Breakout

Requires an established hostile blockade, accepted breakout command, eligible blockaded force, legal breakout route, and blockade context from `DESIGN-32`.

### 6.8 Carrier Action

Requires at least one eligible carrier-capable force and one opposing target force or objective within operational aircraft range. Carrier battle creation MUST include current weather, airbase, squadron, fuel, and deck-operability state.

## 7. Opportunity Ordering and Limits

Opportunities MUST be ordered by:

1. ascending `warId`;
2. ascending `areaId` or route identifier;
3. ascending mission priority;
4. ascending `opportunityId`.

The shipped limits are:

- maximum accepted battles per area per month: `1`;
- maximum accepted battles per war-area pair per month: `1`;
- maximum accepted invasion battle per invasion plan: `1`;
- maximum accepted interception battle per raider per month: `1`.

A limit-exceeding opportunity MUST be rejected with `BATTLE_MONTHLY_LIMIT_REACHED`.

## 8. Participating Sides

Every generated battle MUST contain exactly two tactical sides:

- `ATTACKER`; and
- `DEFENDER`.

Each tactical side MUST map to one or more participants belonging to one war side.

Participants from opposing war sides MUST NOT appear on the same tactical side.

A neutral force MAY appear only through a scenario or incident contract and MUST receive an explicit side or non-combatant status.

Side determination consumes no randomness.

## 9. Force Requirement Contract

Every mission MUST reference one `BattleForceRequirementPolicy` containing:

- mandatory roles by tactical side;
- role minimum and maximum counts;
- minimum and maximum combat strength;
- permitted ship and asset types;
- permanent-division preservation rule;
- allied-support limit;
- generated-element limits;
- commander requirements;
- mission-objective assignments;
- scenario force limits;
- auto-resolution requirements; and
- policy version.

Missing force requirements MUST fail with `BATTLE_FORCE_REQUIREMENT_MISSING`.

## 10. Shipped Mandatory Roles

### Fleet Battle

Each side requires:

- one `CORE` division;
- one `SCREEN` division when any eligible screen exists;
- one command element; and
- total effective strength at least `300`.

### Cruiser Battle

Each side requires:

- one `CORE`, `SCOUT`, or `INDEPENDENT` cruiser division;
- total effective strength at least `150`.

### Coastal Raid

Attacker requires one raiding or bombardment group. Defender requires coastal defense or one eligible defending group when present.

### Convoy Attack and Defense

Attacker requires one raider, submarine, air-strike, or surface-attack element. Defender requires convoy and merchant elements; escorts are mandatory only when assigned and eligible.

### Invasion

Uses the exact manifest requirements from `DESIGN-36`.

### Raider Interception

Attacker or interceptor side requires one interception group. Opposing side requires the raider asset.

### Blockade Breakout

Blockaded side requires the breakout force. Blockading side requires at least one positive-strength eligible blockade force.

### Carrier Action

At least one side requires one carrier core. Every carrier side requires an air element and screen when eligible screens exist.

## 11. Asset Eligibility

A persistent asset is eligible only when:

- it belongs to a participating nation and correct war side;
- committed battle presence matches the opportunity area or route;
- readiness, damage, dockyard, fuel, supply, ammunition, crew, and mission predicates pass;
- it is not working up, mobilizing, mothballed, unavailable, interned, captured by another nation, sunk, scuttled, or foundered;
- it is not reserved for another unresolved battle;
- its current monthly participation count is below the ruleset limit;
- range and reachability pass;
- treaty and political restrictions pass;
- its command relationship is valid or explicitly vacant; and
- its projection can be auto-resolved.

Working-up ships MUST fail with `SHIP_WORKING_UP_BATTLE_INELIGIBLE`.

A ship in another unresolved battle MUST fail with `SHIP_ALREADY_RESERVED_FOR_BATTLE`.

Fuel or range failure MUST use `FUEL_BATTLE_INELIGIBLE` or `BATTLE_RANGE_INELIGIBLE`.

## 12. Eligible-Asset Ordering

Eligible assets MUST be ordered by:

1. tactical side;
2. owner nation identifier;
3. complete permanent division before unattached asset;
4. division identifier;
5. division position;
6. asset identifier.

Eligibility gathering consumes no randomness.

Every excluded asset MUST receive one primary reason from the mission's explicit failure priority.

## 13. Permanent Division Preservation

A permanent division MUST be preserved as one tactical division when every member:

- is eligible;
- is present in the battle scope;
- belongs to the same tactical side;
- fits one mandatory or optional role;
- is not reserved elsewhere; and
- remains within scenario limits.

When all predicates pass, splitting or dropping members is prohibited.

When one or more members are ineligible, projection follows `DESIGN-26` and records every removal or split reason.

Permanent campaign membership MUST NOT be mutated by battle generation.

## 14. Mandatory Role Assignment

Mandatory roles MUST be assigned before optional assets.

For each role, candidates MUST be ordered by:

1. descending integer role-eligibility score;
2. descending effective combat strength;
3. descending readiness score;
4. descending commander suitability available to the selecting participant;
5. ascending division or asset identifier.

The first valid candidate MUST be assigned.

Role assignment consumes no randomness.

Failure to fill a mandatory role rejects the opportunity with `BATTLE_MANDATORY_ROLE_UNFILLED`.

## 15. Optional-Asset Selection

Optional assets MUST use `optional_asset_selection_v1`.

Each candidate's weight is:

`selectionWeight = max(1, floor(baseMissionWeight * readinessMultiplierBp * missionFitMultiplierBp * commanderMultiplierBp * objectiveMultiplierBp * fatigueMultiplierBp / 10_000^5))`

All inputs MUST be explicit integers.

Candidates MUST be enumerated by ascending stable identifier.

Selection MUST use stream:

`battle_generation/month/war/area/mission/optional_asset`

The key MUST include the ordered candidate-set hash and optional-role identifier.

Selection stops when the role maximum, force-strength maximum, scenario limit, or asset-reservation limit is reached.

## 16. Allied Support Eligibility

An allied or non-player friendly participant may contribute only when:

- it belongs to the same war side;
- an active alliance, treaty, war-participant, or operation contract permits support;
- legal operational access exists;
- support mission, range, fuel, supply, readiness, and damage predicates pass;
- its own government and AI policy authorize participation;
- its knowledge projection supports the decision; and
- the mission has remaining allied-support capacity.

Alliance alone does not create access or participation.

## 17. Allied Support Limits

The shipped maximum allied contribution is `5_000` basis points, equal to `50%`, of persistent eligible combat strength on either tactical side, measured after mandatory home-nation roles and before generated elements.

`maximumAlliedStrength = floor(homeNationPersistentStrength * 5_000 / 10_000)`

When the tactical side has no home-nation persistent strength because the mission is explicitly allied-led, one declared lead ally becomes the home participant for this formula.

Allied candidates MUST be selected by:

1. treaty or operation commitment priority;
2. mission fit descending;
3. effective strength descending;
4. nation identifier ascending;
5. asset identifier ascending.

Allied support selection consumes no randomness unless the allied AI policy explicitly chooses among equal-utility legal commitments through its own keyed stream.

## 18. Allied Information Boundary

Player-facing estimates of allied assets MUST use shared knowledge permitted by alliance, treaty, signals, or operation contracts.

The player MUST NOT receive allied hidden:

- true damage details;
- exact ammunition;
- exact fuel;
- hidden defects;
- hidden officer ability;
- unrevealed orders;
- AI utility scores; or
- knowledge assertions not shared by policy.

The battle manifest contains authoritative allied truth for resolution but the player projection MUST redact it.

## 19. Allied Command Boundary

Allied persistent forces remain under their owning nation's AI and command structure.

The player's operational authority over allied forces is limited to one of:

- no authority;
- mission-objective request;
- coordination signal;
- bounded support-area request; or
- explicit temporary command transfer authorized by treaty and command contracts.

The shipped default is `MISSION_OBJECTIVE_REQUEST`.

The player MUST NOT issue direct helm, fire-control, target, formation, ammunition, withdrawal, or damage-control commands to allied units under the default.

Allied AI MUST use its own legal knowledge and normal tactical command contracts.

## 20. Allied Withdrawal and Result Application

Allied AI may withdraw according to its own mission, morale, damage, fuel, political, and command policies.

The player cannot veto a legal allied withdrawal without an explicit transferred-command contract.

Allied damage, loss, ammunition, fuel, crew, officer, experience, and political results MUST apply to the owning participant through campaign provenance.

## 21. Coastal Elements

Coastal defenses may be instantiated only from authoritative target-area infrastructure and defense state.

Each generated tactical element MUST reference:

- source infrastructure identifier;
- current damage and ammunition state;
- owner and controller;
- weapon and sensor definitions;
- tactical projection policy;
- campaign consequence policy; and
- provenance hash.

Battle generation MUST NOT invent coastal defenses to satisfy mission requirements.

## 22. Submarine Elements

Submarine tactical elements MUST be allocated from eligible strategic assets under `DESIGN-34`.

Allocation MUST reserve exact units or pool quantity and preserve provenance.

A submarine asset in another unresolved battle is ineligible.

## 23. Mine Elements

Mine hazards MUST originate from authoritative post-sweeping mine-pressure records under `DESIGN-35`.

Generation MUST use the declared hazard probability, stream, target eligibility, and tactical exposure policy.

No minefield may be created from report text or scenario flavor alone.

## 24. Air Elements

Air elements MUST originate from eligible squadrons, carrier groups, land bases, temporary scenario assets, or explicit operation manifests.

Each element MUST preserve:

- source squadron or generator provenance;
- aircraft type and exact quantity;
- pilot and squadron experience;
- fatigue;
- fuel and ordnance;
- base or carrier state;
- weather and range legality;
- mission assignment; and
- campaign consequence policy.

One aircraft or squadron quantity MUST NOT appear in two simultaneous battles.

## 25. Temporary Generated Assets

A temporary generated asset is permitted only when the mission definition declares it and supplies:

- generator identifier and version;
- canonical source type;
- quantity formula;
- technology and era predicates;
- battle-seed key;
- tactical definition;
- persistence disposition;
- campaign consequence policy;
- maximum quantity; and
- provenance contract.

Temporary assets MUST NOT impersonate persistent campaign assets.

## 26. Reachability and Legality Validation

After composition, the generator MUST revalidate:

- current location and tactical reachability;
- route and range;
- fuel and supply;
- war side and diplomatic access;
- mission eligibility;
- command eligibility;
- permanent-division constraints;
- battle-participation limits;
- treaty restrictions;
- scenario limits;
- weather and sea-state restrictions;
- mine and blockade restrictions;
- carrier deck and airbase operability;
- auto-resolution capability; and
- provenance uniqueness.

Any invalid persistent mandatory asset makes the opportunity irreparable unless the mission's repair policy permits a specific replacement.

## 27. Composition Repair

The shipped repair policy `battle_composition_repair_v1` permits only:

- removing an optional ineligible asset;
- replacing an optional asset with the next legal candidate;
- splitting a permanent division only because one or more members are ineligible, while preserving source order and provenance;
- merging compatible tactical remnants when `DESIGN-26` permits it;
- assigning a temporary eligible commander or explicit vacancy;
- reducing optional generated-element quantity; and
- changing optional tactical formation.

Repair MUST NOT:

- waive location, side, fuel, range, readiness, damage, treaty, or participation rules;
- add a missing persistent asset;
- fabricate technology, inventory, support, access, or command authority;
- change a mandatory mission objective;
- move an asset; or
- exceed force or scenario limits.

## 28. Repair Ordering and Limit

Repairs MUST occur in this order:

1. remove invalid optional assets;
2. replace optional roles;
3. split eligible permanent remnants;
4. fill optional command vacancies;
5. reduce generated elements;
6. change optional formation; and
7. rerun complete validation.

At most exactly `3` repair passes are permitted.

The permitted ruleset range is `1..5` passes.

If validation still fails, the engagement MUST be rejected with `BATTLE_COMPOSITION_IRREPARABLE`.

Repair consumes no randomness except a new keyed optional-selection decision whose candidate-set hash changed because of a permitted repair.

## 29. Engagement Rejection

A rejected engagement MUST:

- reserve no assets;
- release provisional reservations;
- consume no battle seed;
- create no tactical state;
- apply no battle-decline consequence;
- retain opportunity and rejection records; and
- identify primary and diagnostic reason codes.

Failure to generate a legal battle is not a player decline.

## 30. Battle Manifest

Every accepted engagement MUST create one immutable `BattleManifest` containing:

- `battleId`;
- opportunity identifier;
- war, area, mission, attacker, and defender identifiers;
- acceptance class;
- mission objectives;
- ordered tactical-side records;
- ordered persistent and temporary assets;
- permanent and tactical division mappings;
- commanders and command boundaries;
- coastal, submarine, mine, and air elements;
- weather, sea state, visibility, time, and environment;
- fuel, ammunition, inventory, readiness, damage, crew, and officer source hashes;
- reservations;
- auto-resolution proof;
- provenance records;
- battle seed;
- ruleset, formula, AI-policy, RNG, and content versions; and
- manifest hash.

The manifest MUST be immutable after `BattleEligibilitySnapshot` commitment.

## 31. Manifest Canonicalization

The manifest MUST order:

1. tactical sides as attacker then defender;
2. nations by identifier within side;
3. tactical divisions by role priority, source division identifier, and tactical division identifier;
4. persistent assets by campaign asset identifier;
5. temporary assets by generator and temporary identifier;
6. commanders by command hierarchy and officer identifier;
7. coastal, submarine, mine, and air elements by type and identifier;
8. mission objectives by identifier; and
9. provenance records by battle asset identifier.

Canonicalization MUST occur before battle seed derivation.

## 32. Battle Seed

The battle seed MUST be derived only after manifest acceptance and canonicalization.

The canonical key is:

- RNG algorithm version;
- campaign seed;
- stream family `battle/battle_id/root`;
- campaign month;
- war identifier;
- area identifier;
- mission type;
- opportunity identifier;
- canonical manifest hash; and
- battle-generation formula version.

Rejected opportunities MUST NOT receive a battle seed.

The same accepted manifest MUST derive the same seed on every supported platform.

## 33. Intelligence-Limited Presentation

After seed assignment, the system MUST create one `BattleEstimateProjection` per receiving participant.

Each projection MUST contain only legally known or estimated:

- mission and objective;
- friendly committed assets permitted by command and alliance policy;
- enemy type and strength intervals;
- estimated coastal, mine, submarine, and air threats;
- weather and visibility knowledge;
- confidence, source, observation date, and delivery delay;
- known allied command limitations;
- acceptance class and visible decline consequences; and
- projection hash.

The projection MUST NOT expose hidden manifest truth through exact counts, ordering, UI availability, totals, or tooltips.

## 34. Battle Acceptance Classes

Every eligible player-involved battle MUST declare exactly one acceptance class:

- `OPTIONAL`;
- `POLITICALLY_EXPECTED`; or
- `OPERATIONALLY_UNAVOIDABLE`.

The class comes from the mission opportunity and obligation contract. It MUST NOT be selected from generic battle size, player decline history, or UI text.

AI-only battles are auto-resolved and do not require a player acceptance decision.

## 35. Optional Battle

The shipped optional-battle policy is:

- player may accept tactical play;
- player may accept auto-resolution;
- player may decline before manifest lock;
- decline applies no direct war-score, confidence, or objective effect;
- the opportunity expires; and
- committed player assets remain in strategic state without battle effects.

A mission definition MAY attach an explicit non-political opportunity cost, but it MUST be typed and visible before decline.

## 36. Politically Expected Battle

A battle is `POLITICALLY_EXPECTED` only when at least one explicit obligation applies:

- active strategic objective requires engagement;
- political mandate requires defense or action;
- convoy, coastal, foreign-station, blockade, or invasion obligation is active;
- government event declares engagement expected; or
- an alliance or treaty commitment explicitly requires participation.

The shipped first-decline consequences are:

- institutional confidence `-2`;
- war score `-2`;
- objective progress penalty `-1_000` basis points for each directly linked active objective.

Additional decline within the same rolling `12` completed months applies:

- confidence `-3`;
- war score `-3`;
- linked-objective progress `-2_000` basis points.

Consequences apply per declined obligation, capped per declined battle at:

- confidence loss `3`;
- war-score loss `3`; and
- objective-progress loss `2_000` basis points per linked objective.

The rolling count is scoped by obligation identifier, not every battle in the campaign.

## 37. Operationally Unavoidable Battle

A battle is `OPERATIONALLY_UNAVOIDABLE` only when an explicit predicate proves that the player force cannot legally avoid contact, including:

- invasion transports are intercepted after launch;
- blockade breakout contact occurs;
- convoy defense contact occurs with assigned escorts;
- port, canal, or trapped-area contact has no legal withdrawal route;
- battle result from an earlier phase forces continuation; or
- scenario event explicitly creates unavoidable contact.

The player may choose tactical play or auto-resolution but MUST NOT decline the battle.

A decline command MUST fail with `BATTLE_DECLINE_NOT_ALLOWED`.

## 38. Decline Command

Declining MUST use `DeclineBattleCommand` containing:

- battle opportunity identifier;
- expected acceptance class;
- visible obligation identifiers;
- expected consequence preview hash;
- issuer;
- phase;
- idempotency key; and
- reason choice for reporting.

The command MUST revalidate acceptance class and consequences before applying.

Application MUST atomically:

- mark opportunity `DECLINED`;
- release provisional reservations;
- create typed war-score, confidence, and objective effects when applicable;
- append a battle-decision ledger record; and
- prevent later battle generation from the same opportunity.

## 39. Mission-Specific Decline Policies

The shipped mission classifications are:

- `FLEET_BATTLE`: `OPTIONAL` unless a linked objective, mandate, or trapped-force predicate elevates it;
- `CRUISER_BATTLE`: `OPTIONAL` unless a linked obligation elevates it;
- `COASTAL_RAID`: `OPTIONAL` for the raider, `POLITICALLY_EXPECTED` for a defender with an active protection obligation;
- `CONVOY_ATTACK`: `OPTIONAL` for attacker;
- `CONVOY_DEFENSE`: `POLITICALLY_EXPECTED` for assigned escorts and `OPERATIONALLY_UNAVOIDABLE` after contact;
- `INVASION`: `OPERATIONALLY_UNAVOIDABLE` after launch;
- `RAIDER_INTERCEPTION`: `OPTIONAL` unless a linked protection obligation elevates it;
- `BLOCKADE_BREAKOUT`: `OPERATIONALLY_UNAVOIDABLE` after breakout launch; and
- `CARRIER_ACTION`: `OPTIONAL` unless an operation or objective elevates it.

Any elevation MUST record the exact predicate and obligation.

## 40. Acceptance Choice and Resolution Mode

For an accepted player battle, the player must choose:

- `TACTICAL_PLAY`; or
- `AUTO_RESOLVE`.

Both modes consume the same immutable manifest and campaign inputs.

A missing choice holds the campaign at the decision boundary. It MUST NOT silently decline or auto-resolve.

The player may explicitly delegate future eligible choices to an automation policy. Delegation is itself a command and audit record.

## 41. Reservations

Each accepted manifest MUST reserve every participating persistent asset.

The shipped maximum battle participation per persistent ship per month is exactly `1`.

A future mission exception may permit `2` only through an explicit policy defining mission, damage continuity, ammunition continuity, fuel continuity, fatigue, ordering, and eligibility.

The shipped ruleset defines no exception.

Duplicate reservation MUST fail with `BATTLE_ASSET_RESERVATION_CONFLICT`.

## 42. Auto-Resolution Proof

Before manifest acceptance, the generator MUST prove that the auto-resolver supports:

- mission type;
- every persistent and temporary asset type;
- coastal, submarine, mine, and air elements;
- weather and environment;
- objectives;
- withdrawal and surrender;
- damage and losses;
- campaign consequences; and
- provenance return.

Missing support MUST reject the opportunity with `AUTO_RESOLUTION_UNAVAILABLE`.

No battle may require tactical play for campaign continuity.

## 43. Records and Audit

Every monthly generation pass MUST produce one immutable `BattleGenerationRecord` containing:

- all opportunities;
- accepted, rejected, declined, expired, and superseded results;
- complete stage records;
- eligible and excluded assets;
- permanent-division projections;
- mandatory and optional selections;
- allied support decisions;
- generated elements;
- repairs;
- reservations;
- manifests and seeds;
- participant estimate projections;
- acceptance and decline records;
- political, war-score, and objective effects;
- RNG decisions;
- ruleset and formula versions; and
- record hash.

## 44. Required Reason Codes

The subsystem MUST define at least:

- `BATTLE_MISSION_TYPE_UNREGISTERED`;
- `BATTLE_MISSION_PRIORITY_INVALID`;
- `BATTLE_OPPORTUNITY_INELIGIBLE`;
- `BATTLE_MONTHLY_LIMIT_REACHED`;
- `BATTLE_FORCE_REQUIREMENT_MISSING`;
- `BATTLE_SIDE_INVALID`;
- `SHIP_WORKING_UP_BATTLE_INELIGIBLE`;
- `SHIP_ALREADY_RESERVED_FOR_BATTLE`;
- `FUEL_BATTLE_INELIGIBLE`;
- `BATTLE_RANGE_INELIGIBLE`;
- `BATTLE_MANDATORY_ROLE_UNFILLED`;
- `ALLIED_SUPPORT_INELIGIBLE`;
- `ALLIED_OPERATIONAL_ACCESS_MISSING`;
- `BATTLE_GENERATED_ELEMENT_INELIGIBLE`;
- `BATTLE_REACHABILITY_FAILED`;
- `BATTLE_COMPOSITION_IRREPARABLE`;
- `BATTLE_MANIFEST_INVALID`;
- `BATTLE_ASSET_RESERVATION_CONFLICT`;
- `AUTO_RESOLUTION_UNAVAILABLE`;
- `BATTLE_DECLINE_NOT_ALLOWED`;
- `BATTLE_DECLINED_OPTIONAL`;
- `BATTLE_DECLINED_WITH_CONSEQUENCES`;
- `BATTLE_ESTIMATE_FOG_OF_WAR_VIOLATION`; and
- `BATTLE_GENERATION_INVARIANT_FAILED`.

## 45. Validation and Acceptance

Automated validation MUST prove that:

1. the shipped registry contains exactly nine mission types and no generic variant fallback;
2. every mission type has complete opportunity, side, force, role, asset, element, repair, acceptance, decline, auto-resolution, and result policies;
3. mission priorities are exact and unique;
4. all fifteen generation stages execute in exact order;
5. each stage emits a successful empty or populated record;
6. opportunities are separate from accepted battles and consume no battle seed before acceptance;
7. exact mission predicates create opportunities;
8. monthly area, war-area, invasion, and raider limits are enforced;
9. every battle has exactly two tactical sides mapped to valid war sides;
10. mandatory force requirements use exact mission contracts;
11. working-up, unavailable, reserved, fuel-ineligible, range-ineligible, and over-participation assets are excluded;
12. eligible assets use deterministic ordering;
13. complete eligible permanent divisions are preserved;
14. mandatory roles use deterministic score and tie-breaking without randomness;
15. optional assets use the exact keyed candidate-set selection contract;
16. allied support requires war-side membership, authority, access, eligibility, policy approval, and legal knowledge;
17. allied persistent strength is capped at exactly 5,000 basis points under the shipped policy;
18. allied information remains redacted and allied units remain under their own AI and command structure;
19. the player receives only mission-objective requests over allies by default;
20. coastal, submarine, mine, air, and temporary elements preserve explicit provenance;
21. one persistent asset cannot appear twice in one battle or unresolved battle set;
22. reachability and legality are revalidated after composition;
23. repair uses only the exact permitted operations and at most three passes;
24. irreparable engagements are rejected without reservations, seed, tactical state, or decline consequences;
25. manifests use exact canonical ordering before seed derivation;
26. rejected opportunities receive no battle seed;
27. participant estimates respect knowledge, confidence, source, and delay;
28. every player battle has exactly one acceptance class;
29. optional decline has no default war-score, confidence, or objective consequence;
30. politically expected decline uses exact first and repeated consequences, caps, and obligation-scoped count;
31. operationally unavoidable battles cannot be declined;
32. mission classifications and elevations use exact predicates;
33. missing player choice holds at the battle decision boundary;
34. accepted assets are reserved and may participate once per month in the shipped ruleset;
35. every accepted battle proves complete auto-resolution support; and
36. identical state, commands, content, ruleset, knowledge, AI policy, and seeds produce identical opportunities, sides, forces, repairs, manifests, estimates, decisions, records, and hashes.
