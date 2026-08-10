# DESIGN-41: Damage, Fire, And Flooding

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-41`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Hit resolution, component damage, structure, flotation, fire, flooding, secondary hazards, terminal states, scoring, survivors, and rescue MUST use the explicit values, formulas, predicates, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Damage State

Every persistent ship in tactical combat MUST have one authoritative `ShipDamageState` containing:

- `shipId`;
- ordered compartment states;
- ordered component states;
- structural-integrity score;
- flotation-reserve score;
- stability score;
- fire-intensity records;
- flooding-source records;
- progressive-flooding total;
- damage-control resources;
- propulsion and steering state;
- electrical-power state;
- aviation-fuel and ordnance state;
- current performance modifiers;
- terminal-state status;
- abandonment and survivor state;
- ruleset and formula versions; and
- aggregate hash.

Structural integrity, flotation reserve, stability, and compartment integrity MUST use integer scales declared by the compiled design. Fire intensity and flooding rate MUST use non-negative integer canonical units.

A missing or inconsistent state MUST fail with `INVALID_SHIP_DAMAGE_STATE`.

## 2. Damage Categories

The canonical damage categories are:

- `LOCAL_COMPONENT_DAMAGE`;
- `STRUCTURE_DAMAGE`;
- `FLOTATION_DAMAGE`;
- `FIRE_DAMAGE`;
- `PROGRESSIVE_FLOODING`;
- `CRITICAL_EFFECT`; and
- `CREW_AND_COMMAND_DAMAGE`.

Every damaging event MUST produce at least one typed damage package or an explicit `NO_EFFECT` result.

Narrative descriptions MUST NOT mutate damage state.

## 3. Damage Resolution Pipeline

Every shell, torpedo, mine, bomb, missile, collision, grounding, fire, flooding, or secondary-explosion damage event MUST execute these stages in exact order:

1. `DETERMINE_HIT_LOCATION`;
2. `RESOLVE_PROTECTION_INTERACTION`;
3. `APPLY_LOCAL_COMPONENT_DAMAGE`;
4. `APPLY_STRUCTURE_AND_FLOTATION_DAMAGE`;
5. `CREATE_IMMEDIATE_FIRE_OR_FLOODING`;
6. `RESOLVE_SECONDARY_HAZARDS`;
7. `UPDATE_SHIP_PERFORMANCE`;
8. `EVALUATE_TERMINAL_STATE`;
9. `CREATE_DAMAGE_EVENT_RECORD`; and
10. `VALIDATE_POST_DAMAGE_INVARIANTS`.

No stage may be skipped. A stage with no applicable effect MUST emit a successful empty stage result.

Every stage MUST use the committed output of the prior stage.

A stage failure MUST roll back the complete damage transaction and emit `DAMAGE_RESOLUTION_FAILED`.

## 4. Stage 1: Hit Location

Hit location MUST be resolved from:

- authoritative impact position;
- target heading and geometry;
- projectile or hazard trajectory;
- vertical and longitudinal impact coordinates;
- waterline and sea-state position;
- compartment and armor-zone geometry;
- current destroyed or missing structure; and
- hit-location formula version.

The result MUST identify exactly one primary compartment or external zone and MAY identify explicit adjacent zones.

A hit MUST NOT be relocated to an undamaged component for convenience or balance.

## 5. Stage 2: Protection Interaction

Protection interaction MUST use the owning weapon contract:

- gunnery and armor under `DESIGN-39`;
- torpedo effects under `DESIGN-40`;
- mine effects under `DESIGN-35`;
- bomb and missile effects under their owning contracts;
- collision and grounding under tactical movement; and
- fire or flooding propagation under this document.

The result MUST contain the exact energy, penetration, blast, underwater-protection, splinter, shock, or collision operands used.

Display-rounded armor, speed, mass, angle, or damage values MUST NOT be authoritative operands.

## 6. Stage 3: Local Component Damage

Every component intersecting the damage zone MUST receive one explicit eligibility result.

Eligible component outcomes are:

- `UNAFFECTED`;
- `DEGRADED`;
- `JAMMED`;
- `DISABLED`;
- `DESTROYED`;
- `BURNED_OUT`;
- `FLOODED`;
- `ISOLATED`; or
- another component-specific state defined by its owning contract.

Component selection MUST use spatially eligible components ordered by stable component identifier.

Damage MUST NOT affect a component outside the declared blast, splinter, shock, fire, or flooding scope.

## 7. Turret States

Turret state MUST be exactly one of:

- `OPERATIONAL`;
- `JAMMED`;
- `DISABLED`;
- `DESTROYED`; or
- `BURNED_OUT`.

The shipped effects are:

- `JAMMED`: cannot train or fire for the exact repair duration;
- `DISABLED`: cannot fire during the battle unless a typed repair result restores it;
- `DESTROYED`: permanently incapable of firing without a future rebuild;
- `BURNED_OUT`: permanently incapable of firing and creates explicit local fire, ammunition, and structural consequences.

A turret MUST NOT return to `OPERATIONAL` through elapsed time alone.

## 8. Stage 4: Structure and Flotation

Every damage package MUST declare non-negative structural and flotation contributions.

`structuralIntegrityAfter = max(0, structuralIntegrityBefore - structuralDamage)`

`flotationReserveAfter = max(0, flotationReserveBefore - immediateFlotationDamage)`

Damage contributions MUST be capped by remaining values and MUST preserve the uncapped amount in the event record.

Structural integrity and flotation reserve are separate. A ship may lose combat capability while retaining positive flotation.

## 9. Stage 5: Immediate Fire and Flooding

A damaging event MUST evaluate fire and flooding independently.

Fire creation requires an ignition source, combustible material or fuel, oxygen, and a valid affected zone.

Flooding creation requires a hull or piping breach, open route, failed boundary, or explicit internal-water source.

Each created fire or flooding source MUST have its own stable record, location, intensity or rate, cause, start time, containment state, and formula version.

A hit may create neither, one, or both effects.

## 10. Stage 6: Secondary Hazards

The resolver MUST evaluate all spatially eligible secondary hazards in this order:

1. magazine and ammunition reaction;
2. torpedo and mine-store reaction;
3. aviation-fuel and aviation-ordnance reaction;
4. boiler, reactor, fuel-line, and machinery reaction;
5. electrical short and power loss;
6. fire spread;
7. flooding spread and progressive bulkhead failure;
8. steering, bridge, and command disruption; and
9. crew-casualty and abandonment pressure.

Each hazard MUST use a separate keyed decision when probabilistic.

A secondary effect MUST create a new causal damage package rather than altering the original package silently.

## 11. Critical Effects

The canonical critical-effect types are:

- `RUDDER_DAMAGE`;
- `MACHINERY_DAMAGE`;
- `MAGAZINE_EVENT`;
- `FIRE_CONTROL_DAMAGE`;
- `BRIDGE_OR_CONNING_TOWER_DAMAGE`;
- `ELECTRICAL_SYSTEM_DAMAGE`;
- `SEVERE_WATERLINE_DAMAGE`;
- `TORPEDO_OR_MINE_CATASTROPHE`; and
- `AVIATION_FUEL_OR_ORDNANCE_EVENT`.

Each critical effect MUST have an explicit eligibility predicate, severity distribution, state transition, performance effect, repairability, and persistence policy.

A critical effect MUST NOT be selected from descriptive combat text.

## 12. Stage 7: Performance Update

After all immediate and secondary damage packages resolve, performance MUST be recomputed from current state.

At minimum, the update MUST calculate:

- attainable maximum speed;
- acceleration;
- turning performance;
- steering authority;
- stability;
- flotation reserve;
- list and trim;
- weapon availability and rate of fire;
- fire-control capability;
- radar and sensor capability;
- carrier deck and aviation capability;
- communication and command capability;
- pumping and firefighting capacity;
- electrical-power availability;
- crew availability and morale; and
- mission eligibility.

Performance projections MUST be derived from current components and damage sources. They MUST NOT be stored as competing independent authority.

## 13. Flooding State

Every `FloodingSource` MUST contain:

- source identifier;
- compartment;
- breach type;
- current ingress rate;
- sea-pressure multiplier;
- speed-pressure multiplier;
- progressive-failure multiplier;
- containment and isolation state;
- pumping allocation;
- repair allocation;
- start minute and substep;
- last resolution time; and
- source hash.

Flooding resolves once per authoritative tactical minute after movement and damage.

## 14. Serious and Major Flooding

Flooding severity is based on current flooded-water mass as a proportion of the ship's design displacement:

- `MINOR`: below `500` basis points;
- `SERIOUS`: `500..1_499` basis points;
- `MAJOR`: `1_500..2_999` basis points;
- `CRITICAL`: `3_000` basis points or more.

Severity is recalculated after each flooding update.

The terms serious, major, and critical MUST NOT be inferred from narrative reports.

## 15. Flooding Effects on Speed and Stability

The shipped flooding multipliers are:

### Maximum-Speed Multiplier

- minor: `9_500` basis points;
- serious: `8_000`;
- major: `6_000`;
- critical: `3_500`.

### Stability Multiplier

- minor: `9_500`;
- serious: `8_500`;
- major: `7_000`;
- critical: `5_000`.

These multipliers apply after direct machinery and structural effects.

Local asymmetric flooding MAY impose an additional explicit list or trim penalty.

## 16. Flooding-Control Speed Threshold

The canonical serious-flooding control speed is exactly `10` knots, equal to `5_144_440` micrometres per second.

The speed-pressure multiplier is:

- speed `0..10` knots inclusive: `7_500` basis points;
- above `10` through `15` knots: `10_000`;
- above `15` through `20`: `12_500`;
- above `20` through `25`: `15_000`;
- above `25`: `20_000`.

This multiplier applies to active ingress and progressive bulkhead-failure formulas when flooding severity is `SERIOUS`, `MAJOR`, or `CRITICAL`.

A speed exactly `10` knots receives the `7_500` multiplier.

Lower speed improves control but does not guarantee containment.

## 17. High-Speed Flooding Loss Risk

A ship with `MAJOR` or `CRITICAL` flooding operating above `20` knots MUST perform one progressive-loss check per tactical minute.

The shipped base probability is:

- major flooding above 20 through 25 knots: `500` basis points;
- major flooding above 25 knots: `1_500`;
- critical flooding above 20 through 25 knots: `2_000`;
- critical flooding above 25 knots: `5_000`.

The check uses stream `battle/ship/flooding/high_speed_loss`.

A successful check creates one explicit bulkhead failure, machinery-space flooding, structural failure, or terminal-state transition according to spatial eligibility.

## 18. Flooding Control

Net flooding change per tactical minute is:

`netFloodingDelta = max(0, floor(totalIngress * speedPressureBp * progressiveFailureBp / 10_000^2) - effectivePumping - effectiveRepairReduction)`

Pumping and repair capacity require electrical power, available teams, accessible compartments, intact equipment, and command priority.

When pumping exceeds ingress, flooded water may be removed through an explicit dewatering rate. Dewatering MUST NOT repair the breach automatically.

## 19. Fire State

Every `FireSource` MUST contain:

- source identifier;
- compartment or external zone;
- current fire intensity within `1..10_000`;
- fuel and combustible class;
- oxygen and ventilation state;
- spread contacts;
- suppression allocation;
- electrical and pumping dependencies;
- smoke production;
- night-visibility signature;
- start time;
- last resolution time; and
- source hash.

Fire resolves once per tactical minute after new damage and before damage-control completion.

## 20. Fire-Risk Multipliers by Ship Type

The shipped ignition and spread-risk multipliers are:

- ordinary steel surface combatant: `10_000` basis points;
- carrier or light carrier: `15_000`;
- transport: `13_000`;
- AMC: `12_500`;
- AV: `13_000`;
- pre-dreadnought design: `12_000`;
- submarine: type-specific explicit value;
- other ship type: `10_000` unless its definition supplies another explicit value.

A ship qualifying for several categories uses the highest single type multiplier, not their sum or product.

## 21. Fire Damage to Superstructure and Systems

For every fire source, spatially exposed components MUST be evaluated in this order:

1. sensors and radar;
2. communications;
3. fire-control directors;
4. exposed weapon mounts;
5. aviation facilities;
6. boats and deck stores;
7. ventilation and electrical routes;
8. bridge and command spaces; and
9. adjacent internal compartments.

The fire MUST NOT damage a component outside its current spread contacts.

## 22. Fire Rate-of-Fire Penalty

A battery affected by local or supporting-system fire receives:

- fire intensity `1..2_499`: rate-of-fire multiplier `9_500` basis points;
- `2_500..4_999`: `8_500`;
- `5_000..7_499`: `7_000`;
- `7_500..10_000`: `5_000`.

A destroyed or evacuated mount receives `0`.

The multiplier applies through `DESIGN-39` and MUST NOT be duplicated as a second reload penalty.

## 23. Fire and Carrier Operations

Carrier flight operations use the highest relevant flight-deck, hangar, aviation-fuel, or ordnance fire intensity:

- below `1_000`: no fire obstruction;
- `1_000..2_499`: sortie-rate multiplier `7_500` basis points;
- `2_500..4_999`: launch prohibited, recovery permitted at `5_000` multiplier;
- `5_000` or higher: launch and recovery prohibited;
- aviation-fuel or ordnance fire: launch and recovery prohibited regardless of intensity until the hazard is isolated.

Aircraft already airborne follow their own diversion and recovery contracts.

## 24. Fire Night Visibility

At night, a burning ship's detection-signature multiplier is:

- fire intensity below `1_000`: `10_000` basis points;
- `1_000..2_499`: `12_500`;
- `2_500..4_999`: `15_000`;
- `5_000..7_499`: `20_000`;
- `7_500..10_000`: `30_000`.

The modifier affects detection probability and identification confidence only. It MUST NOT reveal exact ship identity automatically.

## 25. Fire Smoke

Smoke production is:

`smokeStrength = floor(fireIntensity * smokeFuelMultiplierBp * ventilationMultiplierBp / 10_000^2)`

Every fire type MUST declare a smoke-fuel multiplier.

Generated smoke MUST become a tactical visibility element with exact position, drift, duration, and density.

Smoke can obscure friend and enemy observation. It MUST NOT be treated as a one-sided modifier.

## 26. Aluminum Superstructure

A design using `ALUMINUM_SUPERSTRUCTURE` MUST apply `aluminum_superstructure_v1`.

The shipped hull-system mass multiplier is exactly `9_000` basis points, equal to `10%` weight saving for the affected superstructure mass only.

`aluminumSuperstructureMass = ceiling(steelEquivalentSuperstructureMass * 9_000 / 10_000)`

The modifier MUST NOT reduce hull plating, armor, machinery, weapons, ammunition, or unrelated structural mass.

The shipped fire-vulnerability effects are:

- ignition probability multiplier: `15_000` basis points;
- fire-spread multiplier: `15_000`;
- structural-strength-loss multiplier while burning: `12_500`;
- firefighting-capacity multiplier in affected zones: `8_500`;
- post-fire permanent-deformation multiplier: `15_000`.

The design feature MUST affect displacement, stability, cost, work, damage, and repair requirements explicitly.

## 27. Damage-Control Resources

Every ship MUST track:

- damage-control teams;
- pumping capacity;
- firefighting capacity;
- emergency electrical power;
- available crew;
- specialists;
- repair materials;
- compartment access; and
- player or AI priorities.

A unit of resource MUST NOT be allocated to two simultaneous tasks.

Allocation MUST occur in canonical priority order or through a legal player command under the selected realism mode.

## 28. Damage-Control Priority

The shipped automatic priority is:

1. magazine, torpedo, aviation-fuel, and reactor hazards;
2. critical flooding threatening flotation;
3. uncontrolled major fire;
4. steering and propulsion required for survival;
5. electrical power;
6. fire-control and communications;
7. weapon restoration;
8. non-critical dewatering; and
9. cosmetic or non-operational repair.

Equal-priority sources MUST be ordered by severity descending and source identifier ascending.

## 29. Terminal States

The canonical terminal and near-terminal states are:

- `OPERATIONAL`;
- `DEGRADED`;
- `MISSION_KILLED`;
- `DEAD_IN_WATER`;
- `ABANDONED`;
- `SINKING`;
- `STABILIZED`;
- `FOUNDERED`;
- `SCUTTLED`;
- `SUNK`; and
- `CAPTURED`.

`FOUNDERED`, `SCUTTLED`, and `SUNK` are terminal physical states.

`MISSION_KILLED`, `DEAD_IN_WATER`, `ABANDONED`, `SINKING`, and `STABILIZED` are non-terminal physical states that may transition further.

## 30. Mission-Killed State

A ship becomes `MISSION_KILLED` when:

- it has positive flotation reserve;
- it is not currently sinking;
- and it cannot perform its battle mission because of propulsion, steering, weapons, aviation, command, sensor, crew, or damage-control loss.

A mission-killed ship may remain afloat and may be towed, abandoned, recovered, captured, scuttled, or later sunk.

Mission kill MUST NOT grant sinking credit by itself.

## 31. Sinking State

A ship becomes `SINKING` when any predicate holds:

- flotation reserve reaches `0` but structural state does not require immediate foundering;
- uncontrolled flooding exceeds pumping and repair capacity by the critical threshold;
- progressive structural failure is active;
- list or trim exceeds the recoverable limit;
- catastrophic underwater or magazine damage creates a delayed-loss state; or
- a typed damage outcome explicitly starts sinking.

Every sinking ship MUST receive a positive integer `sinkingDurationMinutes`.

The shipped duration formula is:

`sinkingDurationMinutes = clamp(10, 360, floor(baseSurvivalMinutes * flotationFactorBp * stabilityFactorBp * damageControlFactorBp / 10_000^3))`

A sinking ship may therefore remain afloat for up to exactly `360` battle minutes, equal to `6` hours of tactical time.

## 32. Immediate Foundering

A ship transitions directly to `FOUNDERED` only when:

- catastrophic structural breakup occurs;
- flotation reserve and stability both reach zero with no recoverable compartment support;
- capsize predicate succeeds;
- magazine or underwater catastrophe explicitly requires immediate loss; or
- sinking duration reaches zero.

Immediate foundering MUST be an explicit result and MUST NOT be inferred because damage is visually severe.

## 33. Stabilization

A sinking ship becomes `STABILIZED` when all predicates hold for exactly `15` consecutive tactical minutes:

- net flooding delta is less than or equal to zero;
- no uncontrolled major or critical fire exists;
- stability is at least `2_500` basis points of design stability;
- flotation reserve is above zero or emergency buoyancy is positive;
- no active catastrophic structural-failure timer exists; and
- at least one command-capable or damage-control-capable crew group remains.

Stabilization stops the sinking timer but does not restore mission capability.

A stabilized ship survives battle only if post-battle tow, port, weather, threat, and repair predicates pass.

## 34. Abandonment

A ship may become `ABANDONED` only through:

- a valid commander order;
- loss of all command authority with an automatic abandonment predicate;
- uncontrollable fire or flooding threatening crew survival;
- sinking state with evacuation time; or
- a typed morale-collapse outcome.

Abandonment MUST create survivor groups, remaining crew, scuttling charge state, custody state, and recovery eligibility.

Abandonment does not change legal ownership or guarantee loss.

## 35. Scuttling, Capture, and Recovery

### Scuttling

Scuttling requires:

- ship is abandoned, captured-imminent, or irrecoverably mission killed;
- the acting side has legal custody and personnel able to place or activate charges;
- no prior terminal physical state; and
- an accepted command or automatic policy.

### Capture

Capture requires:

- ship is abandoned or surrendered;
- enemy force obtains physical custody;
- ship has not sunk, foundered, or been successfully scuttled;
- boarding and security predicates pass; and
- a valid post-battle custody route exists.

### Recovery

Recovery requires:

- friendly custody or successful recapture;
- a viable hull state;
- tow or propulsion capability;
- acceptable enemy threat;
- suitable weather and route;
- port or repair destination; and
- sufficient rescue and recovery resources.

Every outcome MUST apply through a typed state transition.

## 36. Sinking Credit

Sinking credit MUST use `sinking_credit_v1`.

A ship receives confirmed sinking credit only when it enters `FOUNDERED`, `SCUTTLED`, or `SUNK` before battle finalization or when post-battle adjudication confirms inevitable loss.

A `SINKING`, `MISSION_KILLED`, `ABANDONED`, or `STABILIZED` ship does not grant confirmed sinking credit by state alone.

The credited actor is determined by causal damage contribution:

- primary credit: actor contributing the highest damage-value share;
- ties: earliest qualifying decisive-damage event, then actor identifier;
- assisting credit: actors contributing at least `2_000` basis points of total qualifying damage.

Friendly scuttling after enemy-caused irrecoverable damage credits the enemy under the causal formula.

## 37. Victory-Point Timing

Raw battle victory points for ship loss are posted:

- immediately when the ship reaches a confirmed terminal physical state during battle;
- at post-battle adjudication when inevitable loss is confirmed after tactical battle end; or
- not at all when the ship is stabilized, recovered, or captured under a non-loss scoring policy.

Mission-kill or damage points MAY be posted separately by the battle-result contract and MUST NOT duplicate sinking points.

War score is applied later from finalized battle results under `DESIGN-31`.

## 38. Post-Battle Survival Adjudication

Every non-terminal severely damaged ship remaining after battle MUST receive one `PostBattleSurvivalAssessment` containing:

- final damage and terminal state;
- net flooding;
- fire state;
- stability and flotation;
- propulsion and steering;
- damage-control resources;
- weather and sea state;
- enemy threat;
- tow and escort availability;
- distance and route to eligible port;
- recovery probability or deterministic predicate;
- result; and
- assessment hash.

Possible results are:

- `SURVIVED_UNDER_OWN_POWER`;
- `SURVIVED_UNDER_TOW`;
- `STABILIZED_AWAITING_RECOVERY`;
- `ABANDONED_AND_RECOVERED`;
- `CAPTURED`;
- `SCUTTLED`;
- `FOUNDERED_AFTER_BATTLE`; or
- `SUNK_AFTER_BATTLE`.

## 39. Survivor Groups

Crew leaving a ship MUST be represented by one or more `SurvivorGroup` records containing:

- source ship;
- side and nation;
- group size;
- location;
- water and weather exposure;
- injury state;
- flotation-aid state;
- time in water;
- rescue eligibility;
- captor or rescuer identifier or `NONE`;
- final outcome; and
- group hash.

Survivor counts MUST reconcile with crew casualties, people remaining aboard, captured personnel, and rescued personnel.

## 40. Rescue Eligibility

A friendly ship or rescue asset may attempt rescue only when:

- it is operational or degraded but maneuver-capable;
- it is not itself sinking, dead in water, abandoned, or under an immediate critical hazard;
- survivorship location is known with confidence at least `4_000` basis points;
- route and sea state permit approach;
- available rescue capacity is positive;
- active enemy threat is at or below the acceptable threshold;
- mission and command policy permit rescue; and
- the asset is not required to execute an operationally unavoidable survival action.

The shipped acceptable enemy-threat threshold is `2_500` basis points on the tactical local-threat scale `0..10_000`.

When threat exceeds `2_500`, rescue requires an explicit high-risk rescue command.

## 41. Rescue Resolution

The shipped rescue-capacity values per tactical minute are:

- DD or KE: `10` survivors;
- CL or CA: `20`;
- BC, BB, B, CV, or CVL: `30`;
- AMC, AV, or TR: `40`;
- dedicated rescue craft: definition-required;
- aircraft or air-sea rescue: owning air contract.

Effective rescued count is:

`rescuedThisMinute = floor(baseCapacity * seaStateMultiplierBp * visibilityMultiplierBp * threatMultiplierBp * crewMultiplierBp / 10_000^4)`

The result is capped by remaining survivors and available receiving capacity.

## 42. Rescue Battle Score

A completed eligible rescue MAY provide battle score only through `survivor_rescue_score_v1`.

The shipped values are:

- one battle-score point per `50` friendly survivors rescued, rounded down;
- one additional point per `25` enemy survivors rescued, rounded down, reflecting humanitarian and intelligence value;
- high-risk rescue under enemy threat above `2_500`: multiply resulting rescue score by `15_000` basis points and round down;
- maximum rescue score per side per battle: exactly `10` points.

Only survivors delivered into valid custody before battle finalization or confirmed by post-battle adjudication count.

The same survivor MUST NOT be scored twice.

Rescue score is part of the battle-result score. Raw war score remains calculated later under `DESIGN-31`.

## 43. Rescue Consequences

Rescue MUST also update:

- survivor and casualty totals;
- receiving-ship capacity and mission state;
- crew morale;
- prisoners of war for enemy survivors;
- intelligence opportunities;
- political or humanitarian events; and
- post-battle personnel records.

Rescue does not restore the source ship or erase its damage.

## 44. Fire and Flooding Persistence

At battle end, every active fire, flooding source, disabled component, casualty, power loss, list, trim, terminal state, and damage-control allocation MUST transfer to strategic post-battle state.

The strategic resolver MAY aggregate tactical-per-minute records into persistent packages but MUST preserve exact totals, causes, unresolved hazards, and hashes.

Battle end MUST NOT extinguish fire, stop flooding, restore power, repair turrets, or revive casualties.

## 45. Records and Audit

Every damage transaction MUST create one immutable `DamageEventRecord` containing:

- battle minute and substep;
- source, target, and causal weapon or hazard;
- hit location;
- protection interaction;
- component effects;
- structural and flotation effects;
- created fire and flooding sources;
- secondary hazards;
- performance before and after;
- terminal-state transition;
- RNG decisions;
- formula and ruleset versions; and
- record hash.

Sinking, stabilization, abandonment, scuttling, capture, recovery, survivor, rescue, and scoring decisions MUST each create separate linked records.

## 46. Canonical Ordering

Damage resolution MUST order:

1. battle minute and substep;
2. source event priority;
3. target ship identifier;
4. hit or hazard identifier;
5. primary compartment and zone identifier;
6. component identifier;
7. secondary-hazard priority from Section 10;
8. fire and flooding source identifier;
9. damage-control allocation priority; and
10. state-transition and scoring record identifier.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect outcomes.

## 47. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_SHIP_DAMAGE_STATE`;
- `DAMAGE_RESOLUTION_FAILED`;
- `DAMAGE_HIT_LOCATION_INVALID`;
- `DAMAGE_PROTECTION_INTERACTION_INVALID`;
- `DAMAGE_COMPONENT_OUT_OF_SCOPE`;
- `DAMAGE_SECONDARY_HAZARD_CREATED`;
- `FLOODING_SOURCE_CREATED`;
- `FLOODING_HIGH_SPEED_LOSS_CHECK`;
- `FIRE_SOURCE_CREATED`;
- `CARRIER_OPERATIONS_OBSTRUCTED_BY_FIRE`;
- `ALUMINUM_SUPERSTRUCTURE_FIRE_VULNERABILITY`;
- `SHIP_MISSION_KILLED`;
- `SHIP_SINKING`;
- `SHIP_STABILIZED`;
- `SHIP_ABANDONED`;
- `SHIP_SCUTTLED`;
- `SHIP_CAPTURED`;
- `SHIP_RECOVERED`;
- `SHIP_FOUNDERED`;
- `SHIP_SUNK`;
- `SURVIVOR_RESCUE_INELIGIBLE`;
- `SURVIVOR_RESCUE_COMPLETED`;
- `SINKING_CREDIT_NOT_YET_CONFIRMED`; and
- `DAMAGE_STATE_INVARIANT_FAILED`.

## 48. Validation and Acceptance

Automated validation MUST prove that:

1. every damage event executes all ten pipeline stages in exact order;
2. empty stages emit successful records rather than being skipped;
3. a stage failure rolls back the complete damage transaction;
4. hit location uses authoritative geometry and never chooses a convenient component;
5. protection interaction uses canonical unrounded values;
6. component damage applies only to spatially eligible components;
7. turret states and their restoration behavior are explicit;
8. structure and flotation remain separate bounded values;
9. fire and flooding are evaluated independently and create separate sources;
10. secondary hazards follow the exact priority order and create causal packages;
11. performance is recomputed from current component and damage state;
12. flooding severity uses exact 500, 1,500, and 3,000 basis-point thresholds;
13. flooding speed and stability use exact severity multipliers;
14. serious or worse flooding uses exactly 10 knots as the safe-control threshold;
15. speed at exactly 10 knots receives the 7,500 ingress multiplier;
16. major and critical flooding above 20 knots triggers exact per-minute loss probabilities;
17. pumping, repair, access, crew, and power determine net flooding explicitly;
18. ship-type fire risk uses exact carrier, transport, AMC, AV, pre-dreadnought, and standard multipliers;
19. fire damages only spatially exposed superstructure and systems;
20. fire reduces rate of fire through exact four-band multipliers;
21. carrier operations use exact fire-intensity thresholds and restrictions;
22. night detection uses exact fire-signature multipliers;
23. smoke becomes a two-sided tactical visibility element;
24. aluminum superstructure saves exactly 10% of affected superstructure mass and no unrelated mass;
25. aluminum uses exact 15,000 ignition, 15,000 spread, 12,500 strength-loss, 8,500 firefighting, and 15,000 deformation multipliers;
26. damage-control resources cannot be allocated twice and use exact priorities;
27. mission-killed ships may remain afloat and grant no confirmed sinking credit;
28. sinking duration is explicit and may extend to exactly 360 minutes;
29. stabilization requires all declared predicates for exactly 15 consecutive minutes;
30. abandoned ships change neither ownership nor loss status automatically;
31. scuttling, capture, and recovery require complete explicit predicates;
32. confirmed sinking credit occurs only for terminal physical loss or adjudicated inevitable loss;
33. victory points post at exact terminal or adjudication boundaries without double counting;
34. every severe non-terminal ship receives post-battle survival adjudication;
35. survivor totals reconcile exactly with casualties and custody;
36. rescue requires eligible assets, known location, capacity, route, weather, mission, and acceptable threat;
37. ordinary rescue threat must be at or below exactly 2,500 basis points;
38. rescue capacity uses exact ship-type values and integer modifiers;
39. rescue score uses exact 50-friendly, 25-enemy, 15,000 high-risk, and 10-point cap rules;
40. no survivor is rescued or scored twice;
41. active fire, flooding, damage, terminal state, and casualties persist after battle; and
42. identical tactical state, commands, content, ruleset, weather, and seeds produce identical damage, hazards, terminal states, survivors, rescue, scoring, records, and hashes.
