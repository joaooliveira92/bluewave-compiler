# DESIGN-35: Mine Warfare

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-35`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Mine pressure, laying, sweeping, dual-purpose equipment, strikes, route risk, defensive standoff, battle hazards, reporting, decay, post-war persistence, ownership changes, and friendly-fire risk MUST use the explicit values, predicates, streams, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Mine-Pressure State

Mine pressure MUST be represented by one authoritative `AreaMinePressureRecord` per area, laying participant, mine type, and target-set identity when pressure is positive.

Each record MUST contain:

- `minePressureId`;
- `areaId`;
- `layingParticipantId`;
- ordered target belligerent identifiers;
- `mineTypeId`;
- pressure strength within `1..1_000_000`;
- freshness basis points within `0..10_000`;
- ordered source-composition records;
- authoritative mine count or abstracted equivalent;
- detection-confidence records by observing participant;
- creation campaign month;
- last reinforced campaign month;
- last decay campaign month;
- last swept campaign month or `NONE`;
- current legal owner of source facilities or `NONE`;
- current military controller of source facilities or `NONE`;
- ruleset and formula versions; and
- record hash.

Zero pressure MUST be represented by absence of an active pressure record, while historical records remain append-only.

Mine pressure MUST NOT be stored as one undifferentiated area value.

## 2. Mine Types

The canonical mine types are:

- `CONTACT`;
- `MAGNETIC`;
- `ACOUSTIC`;
- `CONTROLLED_DEFENSIVE`;
- `SUBMARINE_LAID`; and
- `SCENARIO_SPECIAL`.

Every `MineTypeDefinition` MUST contain:

- mine type identifier;
- technology prerequisites;
- eligible laying sources;
- base laying value;
- strike profile;
- target eligibility;
- sweeping resistance;
- decay policy;
- friendly-fire policy;
- battle-generation policy;
- report signature policy;
- content version; and
- content hash.

Missing metadata MUST fail with `INVALID_MINE_TYPE_DEFINITION`.

## 3. Mine Sources

The canonical mine sources are:

- controlled naval bases;
- eligible coastal artillery or controlled-mine installations;
- mine-capable surface ships;
- minelaying submarines;
- scenario minefields; and
- typed event minefields.

Every laying action MUST reference one source, exact mine inventory or generated canonical scenario allocation, target belligerents, area, laying month, and laying policy.

A source without required technology, inventory, access, control, or mission MUST fail with `MINE_LAYING_SOURCE_INELIGIBLE`.

## 4. Mine-Laying Value

For each eligible laying source:

`effectiveLayingValue = floor(baseLayingValue * technologyMultiplierBp * crewMultiplierBp * readinessMultiplierBp * damageMultiplierBp * supplyMultiplierBp * missionMultiplierBp / 10_000^6)`

The exact rational result MUST be retained through all multipliers and rounded once with `FLOOR`.

The shipped generic multipliers are:

- full technology capability: `10_000` basis points;
- partial early capability when explicitly permitted: `7_500`;
- crew quality `0..39`: `7_500`;
- `40..59`: `10_000`;
- `60..79`: `11_000`;
- `80..100`: `12_000`;
- readiness below `40`: ineligible;
- readiness `40..59`: `7_500`;
- `60..79`: `10_000`;
- `80..100`: `11_000`;
- degraded damage: `5_000`;
- unsupported or fuel-ineligible source: `0`.

Mine inventory consumption MUST equal the laying action's exact declared quantity.

## 5. Mine-Pressure Increase

Monthly pressure added is:

`addedPressure = min(1_000_000 - currentPressure, effectiveLayingValue)`

A record reaching `1_000_000` cannot receive additional pressure until decay or sweeping lowers it.

Reinforcement MUST update source composition and freshness through a weighted integer calculation, not reset all pressure to full freshness.

## 6. Minesweeping Eligibility

A ship generates sweeping value only when all predicates pass:

- ship type is `DD`, `KE`, `CL`, `AMC`, `TR` converted as a minesweeper, or another explicitly eligible type;
- mine-sweeping equipment is installed, operational, and compatible with the mine type;
- mission is `MINE_WARFARE` or `TRADE_PROTECTION` with sweeping authorization;
- readiness is `ACTIVE`;
- damage is `OPERATIONAL` or `DEGRADED`;
- ship is located in the swept area or an explicitly connected approach;
- fuel, supply, crew, and ammunition or sweep inventory pass;
- ship is not working up, mobilizing, unavailable, interned, captured, or in a major dockyard project; and
- a validated sweeping command or operational plan is active.

An ineligible ship contributes zero and records `MINESWEEPING_SHIP_INELIGIBLE`.

## 7. Sweeping Base Values

The shipped base sweeping values are:

- dedicated fleet minesweeper: `150` sweeping units;
- dedicated coastal minesweeper: `100`;
- DD with mine-sweeping equipment: `80`;
- KE with mine-sweeping equipment: `100`;
- CL with mine-sweeping equipment: `60`;
- AMC with mine-sweeping equipment: `50`;
- converted TR minesweeper: `120`.

Every equipment definition MUST identify exactly one base value or an explicit replacement formula.

A ship name or class description MUST NOT grant sweeping value.

## 8. Dual ASW and Mine Equipment

Equipment configured for simultaneous ASW and mine sweeping MUST use `dual_asw_mine_equipment_v1`.

The shipped capability multipliers are:

- dedicated ASW mode: ASW `10_000`, sweeping `0` basis points;
- dedicated sweeping mode: ASW `0`, sweeping `10_000`;
- balanced dual mode: ASW `7_500`, sweeping `7_500`;
- ASW-priority dual mode: ASW `9_000`, sweeping `5_000`;
- sweeping-priority dual mode: ASW `5_000`, sweeping `9_000`.

Mode MUST be selected by a locked mission or equipment command before resolution.

A ship MUST NOT receive full ASW and full sweeping value simultaneously.

Missing mode MUST default to the explicit shipped `balanced dual mode` only when the installed equipment is declared dual-purpose. Other missing configurations MUST fail with `DUAL_EQUIPMENT_MODE_MISSING`.

## 9. Effective Sweeping Value

For each eligible ship:

`effectiveSweepingValue = floor(baseSweepingValue * equipmentModeMultiplierBp * technologyMultiplierBp * crewMultiplierBp * readinessMultiplierBp * damageMultiplierBp * supportMultiplierBp / 10_000^6)`

The shipped mine-type resistance multipliers applied after aggregation are:

- contact mines: `10_000` basis points;
- magnetic mines: `7_500` without magnetic-sweep capability, otherwise `10_000`;
- acoustic mines: `7_500` without acoustic-sweep capability, otherwise `10_000`;
- controlled defensive mines: `5_000` unless control infrastructure is captured or disabled;
- submarine-laid mines: `9_000`;
- scenario-special mines: definition-required.

Missing resistance data MUST fail with `MINE_SWEEP_RESISTANCE_MISSING`.

## 10. Regional Sweeping Aggregation

Regional sweeping value MUST equal the sum of effective eligible-ship values in ascending ship identifier order.

For each mine-pressure record:

`typeAdjustedSweeping = floor(regionalSweepingValue * mineTypeResistanceMultiplierBp / 10_000)`

`sweptPressure = min(currentPressure, typeAdjustedSweeping)`

`pressureAfterSweeping = currentPressure - sweptPressure`

Sweeping MUST NOT reduce pressure below zero.

One sweeping allocation MUST NOT apply its full value to multiple mine-pressure records. Allocation MUST follow:

1. controlled defensive mines threatening the sweeping side;
2. highest current strike risk;
3. highest pressure;
4. mine type identifier;
5. mine-pressure identifier.

Unused sweeping value passes to the next record.

## 11. Battle-Mine Generation

The probability that a mine hazard is generated for an eligible battle is:

`battleMineProbabilityBp = min(10_000, floor(pressureAfterSweeping * freshnessBp * battleTemplateMultiplierBp * targetExposureMultiplierBp / 1_000_000 / 10_000 / 10_000))`

The active ruleset MUST provide all multipliers.

The shipped template multipliers are:

- coastal battle: `12_500` basis points;
- amphibious battle: `15_000`;
- choke-point battle: `15_000`;
- open-sea battle: `5_000`;
- port-approach battle: `12_500`.

Sweeping occurs before this probability is calculated. Therefore, swept pressure directly reduces battle-mine generation.

The check MUST use stream `mine_warfare/battle/area/hazard_generation`.

## 12. Mine-Warfare Resolution Order

The canonical order is:

1. pre-battle intelligence and mine reports;
2. pre-battle sweeping allocation;
3. pre-battle controlled-mine preparation;
4. battle-mine hazard generation;
5. battle mine-strike resolution;
6. monthly operational mine laying;
7. strategic route mine-strike checks;
8. post-operation sweeping;
9. mine decay;
10. knowledge and report updates; and
11. persistence and hash validation.

A phase with no eligible work MUST still emit an empty successful record.

## 13. Strategic Route Risk

For every route edge covered by mine pressure, route risk is:

`routeRiskBp = min(10_000, floor(currentPressure * freshnessBp * routeExposureMultiplierBp * targetSusceptibilityMultiplierBp / 1_000_000 / 10_000 / 10_000))`

The shipped route-exposure multipliers are:

- open sea edge: `5_000` basis points;
- coastal passage: `10_000`;
- canal approach: `15_000`;
- choke point: `15_000`;
- port approach: `12_500`.

Risk MUST be evaluated before traversal. A route-risk check does not automatically deny movement unless a command or AI policy chooses another route.

## 14. Mine-Strike Eligibility

A ship is eligible for a mine-strike check when:

- it enters or operates in an area or route covered by hostile or unknown mine pressure;
- its target class is eligible for that mine type;
- pressure and freshness are positive;
- no exact cleared-lane contract fully protects the movement;
- the ship has not already received the same minefield checkpoint check for that traversal; and
- the current phase authorizes mine strikes.

Friendly mines may also be eligible under Section 25.

## 15. Mine-Strike Outcome

A successful mine-strike check MUST select exactly one explicit outcome:

- `DUD_OR_NO_DAMAGE`;
- `MINOR_DAMAGE`;
- `MAJOR_DAMAGE`;
- `MISSION_KILL`;
- `SINKING`;
- `SUNK`; or
- `IMMOBILIZED_FOR_TOW`.

The shipped base severity weights are:

- dud or no damage: `1_500`;
- minor damage: `3_500`;
- major damage: `2_500`;
- mission kill: `1_500`;
- sinking: `750`;
- sunk: `250`.

Weights total exactly `10_000`.

Mine type, ship protection, displacement, speed, damage control, sea state, and prior damage MAY modify weights through explicit formulas.

The outcome MUST use a distinct keyed decision and apply through normal damage provenance.

## 16. Defensive Standoff

Mine pressure creates defensive standoff only through `mine_defensive_standoff_v1`.

The shipped standoff levels are:

- pressure below `100_000`: none;
- `100_000..249_999`: standoff level `1`;
- `250_000..499_999`: level `2`;
- `500_000..749_999`: level `3`;
- `750_000..1_000_000`: level `4`.

The effects are:

- level 1: hostile amphibious and coastal-operation utility `9_000` basis points;
- level 2: `7_500`;
- level 3: `5_000`;
- level 4: `2_500`.

Standoff modifies AI and operation eligibility or cost only through explicit amphibious, blockade, and coastal-operation contracts. It MUST NOT automatically cancel an accepted operation.

## 17. Battle Hazards

A generated battle minefield MUST create one `BattleMineHazard` containing:

- battle and area identifiers;
- source mine-pressure records;
- mine type;
- laying and target participants;
- pressure used;
- freshness;
- tactical mine density;
- known or suspected lanes;
- eligible target classes;
- hazard-generation decision;
- tactical strike policy; and
- hazard hash.

Tactical mine strikes MUST use battle-local movement and hazard exposure. A ship MUST NOT be struck merely because the battle area contains mines.

## 18. Damage and Loss Application

Mine damage MUST update:

- hull and flotation damage;
- machinery and propulsion;
- fire and flooding;
- mission availability;
- crew casualties and morale;
- towing status;
- operational mission;
- post-battle strategic state; and
- repair requirements.

A mine loss MUST preserve ship identity and provenance and use normal `FOUNDERED`, `SCUTTLED`, or `SUNK` transitions.

## 19. Mine Report

Every observed or suspected mine event MUST create a `MineIncidentReport` containing:

- recipient participant;
- area or route;
- observed time and received time;
- affected ship or force;
- reported cause;
- estimated mine type or `UNKNOWN`;
- estimated laying participant or `UNKNOWN`;
- confidence;
- position error;
- delivery delay;
- possible deception;
- generated knowledge assertions; and
- report hash.

Reports MUST NOT overwrite true mine pressure, mine type, cause, or laying participant.

## 20. Mine and Torpedo Misidentification

When a damaging underwater explosion is not directly identified, the report classifier MUST use `underwater_explosion_identification_v1`.

The shipped base report weights are:

- report as `MINE_STRIKE`: `6_000`;
- report as `TORPEDO_ATTACK`: `3_000`;
- report as `UNDERWATER_EXPLOSION_UNKNOWN`: `1_000`.

Modifiers include:

- known hostile mine pressure: mine weight `+2_000`;
- observed torpedo track: torpedo weight `+5_000`;
- no submarine contact: torpedo weight `-1_000`, minimum `0`;
- port or choke-point location: mine weight `+1_000`;
- multiple simultaneous explosions: event-defined.

Weights MUST be normalized and selected through stream `mine_warfare/report/underwater_explosion`.

A false torpedo report MUST remain knowledge state and MUST NOT create a real submarine asset or attack.

## 21. Mine Decay Policies

Mine decay MUST occur once per month after operational mining and sweeping.

The shipped monthly pressure-retention multipliers are:

- contact mines: `9_750` basis points;
- magnetic mines: `9_500`;
- acoustic mines: `9_250`;
- controlled defensive mines with operational control infrastructure: `9_900`;
- controlled defensive mines without operational control infrastructure: `9_000`;
- submarine-laid mines: `9_500`;
- scenario-special mines: explicit definition required.

`pressureAfterDecay = floor(pressureAfterSweeping * retentionMultiplierBp / 10_000)`

`decayedPressure = pressureAfterSweeping - pressureAfterDecay`

Freshness retention uses the same multiplier unless the mine-type definition provides a narrower explicit value.

A scenario-special minefield without decay metadata MUST fail with `MINE_DECAY_POLICY_MISSING`.

## 22. Post-War Persistence

War termination MUST NOT remove mine pressure automatically.

After a war ends:

- target belligerent sets MUST be preserved in historical records;
- minefields remain active hazards to their configured targets and to misidentified friendly or neutral traffic under applicable policies;
- decay continues monthly;
- clearance missions remain available;
- new laying requires a separate legal policy; and
- diplomatic or navigation events may create explicit clearance obligations.

A peace settlement MAY alter target sets, access lanes, disclosure, or clearance obligations only through typed terms.

## 23. Ownership and Control Changes

Legal ownership or military control change of an area, possession, base, or coastal installation MUST NOT delete or neutralize mine pressure automatically.

A transition MUST explicitly declare one disposition per affected mine-pressure record:

- `PRESERVE_ACTIVE`;
- `TRANSFER_CONTROLLED_MINE_AUTHORITY`;
- `DEACTIVATE_CONTROLLED_MINES`;
- `DISCLOSE_SAFE_LANES`;
- `ASSIGN_CLEARANCE_OBLIGATION`; or
- `DESTROY_CONTROL_INFRASTRUCTURE_WITH_DECLARED_EFFECT`.

Uncontrolled contact, magnetic, acoustic, and submarine-laid mines normally remain active until decay or clearance.

A missing disposition for controlled defensive mines MUST fail with `CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`.

## 24. Mine Knowledge

Every participant MUST have separate knowledge assertions for:

- suspected area or route;
- estimated pressure interval;
- mine type;
- suspected laying participant;
- known cleared lanes;
- freshness estimate; and
- last observed or swept date.

True mine pressure MUST not be exposed unless a source policy permits it.

Sweeping improves knowledge only through explicit sweep-observation records.

## 25. Friendly-Fire Risk

Friendly or allied ships MUST undergo a friendly-mine strike check when all predicates hold:

- the area contains mine pressure laid by the same side or an ally;
- the moving ship lacks confirmed current safe-lane knowledge;
- mine target discrimination does not guarantee exclusion;
- route or tactical movement intersects the hazard scope;
- pressure and freshness are positive; and
- no cease-fire or control action has deactivated the mines.

The shipped friendly-risk multiplier against hostile strike risk is:

- complete current safe-lane knowledge: `0` basis points;
- high confidence `8_000..9_999`: `1_000`;
- moderate confidence `4_000..7_999`: `2_500`;
- low confidence `1..3_999`: `5_000`;
- no knowledge: `7_500`.

`friendlyStrikeProbabilityBp = floor(hostileStrikeProbabilityBp * friendlyRiskMultiplierBp / 10_000)`

The check MUST use stream `mine_warfare/month/area/friendly_strike`.

## 26. Friendly-Fire Outcome

A friendly-mine strike uses the normal mine-severity and damage contracts.

Every outcome MUST create:

- damage or loss provenance;
- mine-pressure source reference;
- command and route context;
- knowledge-failure analysis;
- morale and political effects;
- investigation record; and
- corrected knowledge assertions when evidence permits.

Friendly minefields MUST NOT be treated as automatically safe.

## 27. Mine-Clearance Completion

A mine-pressure record is cleared when pressure reaches `0` after sweeping or decay.

Clearance MUST:

- close the active pressure record;
- preserve historical source and action records;
- update visible knowledge according to source and reporting rules;
- remove battle and route risk for that record from subsequent phases; and
- emit `MINEFIELD_CLEARED`.

Clearance of one laying participant's minefield MUST NOT clear another participant's record.

## 28. Records and Audit

Every monthly resolution MUST create one immutable `MineWarfareResolutionRecord` containing:

- area and war contexts;
- opening pressure records;
- laying sources and values;
- sweeping ships, modes, and values;
- dual-equipment reductions;
- allocated sweeping;
- pressure removed;
- battle and route probabilities;
- strike decisions and outcomes;
- standoff levels;
- decay;
- post-war and ownership dispositions;
- reports and knowledge changes;
- friendly-fire checks;
- inventory, war-score, political, and damage effects;
- RNG decisions;
- ruleset and formula versions; and
- record hash.

## 29. Canonical Ordering

Mine-warfare resolution MUST order:

1. wars by identifier;
2. areas by identifier;
3. mine-pressure records by laying participant, mine type, and record identifier;
4. laying sources by source identifier;
5. sweeping ships by ship identifier;
6. sweep allocation by Section 10;
7. route and battle checks by target identifier;
8. friendly-fire checks by ship identifier; and
9. effects by declared effect ordinal.

Database insertion order, localized strings, UI order, and wall-clock time MUST NOT affect outcomes.

## 30. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_MINE_TYPE_DEFINITION`;
- `INVALID_MINE_PRESSURE_STATE`;
- `MINE_LAYING_SOURCE_INELIGIBLE`;
- `MINE_INVENTORY_INSUFFICIENT`;
- `MINESWEEPING_SHIP_INELIGIBLE`;
- `DUAL_EQUIPMENT_MODE_MISSING`;
- `MINE_SWEEP_RESISTANCE_MISSING`;
- `MINE_PRESSURE_REDUCED`;
- `MINE_BATTLE_HAZARD_GENERATED`;
- `MINE_ROUTE_RISK_CREATED`;
- `MINE_STRIKE_OCCURRED`;
- `MINE_DEFENSIVE_STANDOFF_ACTIVE`;
- `MINE_REPORT_CAUSE_UNCERTAIN`;
- `MINE_DECAY_POLICY_MISSING`;
- `CONTROLLED_MINE_TRANSFER_DISPOSITION_MISSING`;
- `FRIENDLY_MINE_STRIKE_OCCURRED`;
- `MINEFIELD_CLEARED`; and
- `MINE_WARFARE_INVARIANT_FAILED`.

## 31. Validation and Acceptance

Automated validation MUST prove that:

1. mine pressure remains scoped by area, laying participant, mine type, and target set;
2. every mine type has complete laying, strike, target, resistance, decay, friendly-fire, battle, and report policies;
3. laying consumes explicit inventory and uses exact integer multipliers;
4. every sweeping ship passes exact type, equipment, mission, readiness, damage, area, supply, and command predicates;
5. shipped base sweeping values are exactly 150, 100, 80, 100, 60, 50, and 120 for the declared configurations;
6. dual-purpose equipment uses exact 10,000/0, 0/10,000, 7,500/7,500, 9,000/5,000, and 5,000/9,000 modes;
7. one dual-purpose system never grants full ASW and sweeping simultaneously;
8. sweeping allocation cannot be duplicated across pressure records;
9. sweeping reduces exact pressure and therefore exact battle-mine probability;
10. battle hazard generation uses exact template multipliers and the declared stream;
11. route risk uses exact edge-type multipliers;
12. mine strikes use explicit eligibility, keyed probability, severity weights totaling 10,000, and provenance;
13. defensive standoff uses exact 100,000, 250,000, 500,000, and 750,000 pressure thresholds;
14. battle hazards require local tactical exposure rather than area presence alone;
15. reports preserve uncertainty and may misidentify a mine as a torpedo only through the explicit classifier;
16. a false torpedo report never creates a true submarine attack;
17. every mine type decays monthly through its exact retention multiplier;
18. post-war minefields persist until clearance or decay;
19. ownership and control changes do not remove mines automatically;
20. controlled mines receive an explicit transition disposition;
21. mine truth and participant knowledge remain separate;
22. friendly-fire risk uses exact knowledge-dependent multipliers and a keyed check;
23. friendly mine damage uses normal provenance and investigation records;
24. clearing one pressure record does not clear another source's minefield; and
25. identical state, commands, content, ruleset, weather, reports, and seeds produce identical pressure, sweeping, hazards, strikes, decay, reports, friendly-fire, records, and hashes.
