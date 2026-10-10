# DESIGN-24: Fleet Management

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-24`
> **Amended by:** ADR-0062.
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Readiness, mission, dockyard, damage, availability, maintenance, training, reactivation, fleet exercises, and warnings MUST use the explicit states, values, predicates, phase bindings, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Ship State Dimensions

Every commissioned ship MUST have exactly one value in each independent state dimension:

- readiness state;
- operational mission;
- dockyard state;
- damage state; and
- strategic location state under `DESIGN-14`.

One dimension MUST NOT overwrite or encode another dimension.

A ship state combination MUST pass the compatibility rules in this document before a stable snapshot is committed.

## 2. Readiness States

The canonical readiness states are:

- `ACTIVE`;
- `RESERVE`;
- `MOTHBALLED`;
- `MOBILIZING`;
- `WORKING_UP`; and
- `UNAVAILABLE`.

Every state transition MUST use a validated command, dockyard-project effect, battle result, or typed event.

Direct state mutation MUST fail with `UNAUTHORIZED_READINESS_STATE_CHANGE`.

## 3. Operational Missions

The canonical operational missions are:

- `FLEET`;
- `FOREIGN_STATION`;
- `TRADE_PROTECTION`;
- `RAIDER`;
- `TRAINING`;
- `TRANSIT`;
- `MINE_WARFARE`; and
- `AMPHIBIOUS_SUPPORT`.

A ship may have exactly one operational mission at a stable strategic snapshot.

A mission assignment MUST validate readiness, damage, dockyard, fuel, range, location, technology, treaty, personnel, and command eligibility.

## 4. Dockyard States

The canonical dockyard states are:

- `NONE`;
- `MAINTENANCE`;
- `REPAIR`;
- `REBUILD`; and
- `CONVERSION`.

A ship may have exactly one dockyard state.

`REPAIR`, `REBUILD`, and `CONVERSION` MUST reference exactly one active combined dockyard project under `DESIGN-23`.

A ship with no referenced project MUST NOT remain in those states.

## 5. Damage States

The canonical damage states are:

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

A ship in a terminal physical state MUST NOT receive readiness, mission, movement, training, exercise, repair, or combat commands unless an explicit wreck, salvage, or historical-record contract permits a non-operational action.

## 6. Fleet-Management State

Every commissioned ship MUST have one authoritative `FleetManagementState` containing:

- `shipId`;
- readiness state;
- operational mission;
- dockyard state;
- damage state;
- readiness score;
- crew-proficiency score;
- maintenance multiplier;
- mobilization progress;
- working-up progress;
- exercise participation record identifiers;
- active project identifier or `NONE`;
- state-transition ledger position;
- ruleset version; and
- state hash.

Readiness and crew-proficiency scores use integer range `0..100` inclusive.

## 7. State Compatibility

The following combinations are mandatory:

- `MOTHBALLED` requires mission `NONE` at runtime representation or a presentation-only inactive mission marker;
- `MOBILIZING` prohibits `RAIDER`, `MINE_WARFARE`, and `AMPHIBIOUS_SUPPORT`;
- `WORKING_UP` requires mission `TRAINING`;
- `UNAVAILABLE` prohibits every operational mission except a project-scoped maintenance marker;
- dockyard `REBUILD` or `CONVERSION` requires readiness `UNAVAILABLE`;
- damage `MISSION_KILLED`, `DEAD_IN_WATER`, `ABANDONED`, or `SINKING` requires readiness `UNAVAILABLE` outside tactical resolution;
- damage `STABILIZED` permits only repair, tow, transit-by-tow, or declared recovery actions;
- damage `CAPTURED` transfers command eligibility to the controlling nation only through a typed capture effect; and
- terminal damage states prohibit operational availability.

An invalid combination MUST fail with `FLEET_STATE_COMBINATION_INVALID`.

## 8. Active State

The shipped `active_readiness_v1` policy defines:

- maintenance multiplier: exactly `10_000` basis points;
- routine readiness recovery: `+4` points per fully paid month;
- routine crew-proficiency gain: `+1` point per fully paid month;
- maximum routine readiness: `100`;
- maximum routine crew proficiency: `100`;
- battle-generation availability: permitted when all other predicates pass;
- movement availability: permitted;
- exercise availability: permitted; and
- mobilization requirement: none.

A month with active maintenance paid below `10_000` basis points of requirement receives no routine readiness or proficiency gain and follows under-maintenance penalties from `DESIGN-13`.

## 9. Reserve State

The shipped `reserve_readiness_v1` policy defines:

- maintenance multiplier: exactly `5_000` basis points of active maintenance;
- permitted ruleset range: `4_000..6_000`;
- monthly readiness drift: `-1` point;
- monthly crew-proficiency drift: `-1` point;
- minimum readiness floor while funded: `40`;
- immediate battle-generation availability: prohibited;
- normal movement: prohibited;
- exercise participation: prohibited until mobilization completes;
- mobilization duration: exactly `2` completed paid months; and
- mobilization maintenance multiplier: `10_000` basis points.

Entering reserve requires an accepted readiness command and no incompatible mission or project.

A reserve ship may begin mobilization only when personnel, fuel, maintenance funding, location, and damage predicates pass.

## 10. Mothballed State

The shipped `mothballed_readiness_v1` policy defines:

- maintenance multiplier: exactly `2_500` basis points of active maintenance;
- permitted ruleset range: `1_500..3_500`;
- monthly readiness drift: `-2` points;
- monthly crew-proficiency drift: `-2` points;
- readiness floor while funded: `10`;
- battle-generation availability: prohibited;
- movement availability: prohibited;
- mission eligibility: prohibited;
- routine training: prohibited;
- reactivation duration: exactly `6` completed paid months;
- permitted duration range: `4..9` months;
- reactivation maintenance multiplier: `10_000` basis points; and
- reactivation repair inspection: mandatory.

A mothballed ship MUST retain a caretaker crew and preservation cost. It is not crewless or maintenance-free.

Reactivation inspection MAY create explicit repair or defect-discovery requirements. Missing repair capacity delays reactivation and provides zero reactivation progress for that month.

## 11. Mobilizing State

`MOBILIZING` is the transition state from reserve or mothballed toward active service.

Every `MobilizationProject` MUST contain:

- ship identifier;
- source readiness state;
- required months;
- completed paid months;
- personnel requirement;
- maintenance requirement;
- repair and inspection requirements;
- training requirement;
- interruption behavior; and
- project hash.

For reserve source, required months are exactly `2`.

For mothballed source, required months are exactly `6`.

A mobilizing ship:

- is unavailable for normal battle generation;
- may not undertake an operational mission;
- may perform mandatory trials during the final month;
- pays active maintenance; and
- receives zero mobilization progress in any month with unpaid required maintenance or unresolved critical repair.

On successful completion, the ship enters `WORKING_UP`, not `ACTIVE`.

## 12. Working-Up State

The shipped `working_up_v1` policy defines:

- minimum duration: exactly `3` completed paid months;
- permitted ruleset range: `2..6` months;
- maintenance multiplier: exactly `12_500` basis points of active maintenance;
- monthly crew-proficiency gain: `+5` points;
- monthly readiness gain: `+6` points;
- normal battle-generation availability: prohibited;
- movement: limited to training movement explicitly permitted by the training-area policy;
- operational mission: `TRAINING`; and
- completion thresholds: readiness at least `70` and crew proficiency at least `50`.

After the minimum duration, a ship enters `ACTIVE` only when both thresholds pass and no damage, personnel, supply, or project restriction remains.

Battle generation MUST reject a working-up ship with `SHIP_WORKING_UP_BATTLE_INELIGIBLE`.

Emergency wartime activation MAY end working up early only through `EmergencyActivateShipCommand`. The shipped consequences are:

- readiness remains at current value;
- crew proficiency remains at current value;
- battle-readiness multiplier: `8_000` basis points for the next `3` months;
- institutional-confidence penalty if the ship is lost during that period: additional `-1` point; and
- explicit audit and warning records.

## 13. Unavailable State

A ship is `UNAVAILABLE` when any authoritative condition prohibits normal operation, including:

- major repair;
- rebuild;
- conversion;
- critical damage;
- impoundment;
- internment;
- scrapping;
- unresolved commissioning failure; or
- another explicit unavailability predicate.

An unavailable ship:

- cannot move normally;
- cannot train;
- cannot exercise;
- cannot fulfill foreign-station or trade-protection obligations;
- cannot enter normal battle generation; and
- cannot receive an operational mission.

Availability is restored only by the owning project's or condition's typed completion effect.

## 14. Repair and Rebuild Availability

Availability MUST derive from project state and work packages under `DESIGN-23`.

The shipped rules are:

- `REBUILD` or `CONVERSION`: always `UNAVAILABLE` from project start through trials and commissioning;
- critical structure, flotation, machinery, armament, or major-electronics repair: `UNAVAILABLE`;
- minor maintenance or minor installation: may remain `ACTIVE` only when its package explicitly declares `operationalInterruptionMonths: 0`;
- `DELAYED` or `HALTED` major project: ship remains `UNAVAILABLE`;
- completed project: availability reevaluated after final invariants and trials; and
- cancelled irreversible project: availability follows the explicit cancellation settlement, never automatic restoration.

A project-state mismatch MUST fail with `PROJECT_AVAILABILITY_MISMATCH`.

## 15. Readiness-State Transitions

The shipped permitted transitions are:

- `ACTIVE -> RESERVE`;
- `ACTIVE -> MOTHBALLED` through a `2`-month deactivation project;
- `ACTIVE -> WORKING_UP` only through retraining policy;
- `ACTIVE -> UNAVAILABLE`;
- `RESERVE -> MOBILIZING`;
- `RESERVE -> MOTHBALLED` through a `1`-month preservation project;
- `RESERVE -> UNAVAILABLE`;
- `MOTHBALLED -> MOBILIZING`;
- `MOTHBALLED -> UNAVAILABLE`;
- `MOBILIZING -> WORKING_UP`;
- `MOBILIZING -> UNAVAILABLE`;
- `WORKING_UP -> ACTIVE`;
- `WORKING_UP -> UNAVAILABLE`; and
- `UNAVAILABLE -> ACTIVE`, `RESERVE`, `MOTHBALLED`, `MOBILIZING`, or `WORKING_UP` only through the owning recovery policy.

All transitions require explicit records. An omitted transition is prohibited.

## 16. Maintenance Calculation

For each ship:

`statusAdjustedMaintenance = ceiling(baseActiveMaintenance * readinessMaintenanceMultiplierBp / 10_000)`

Other declared mission, war, damage, location, and support multipliers apply after the readiness multiplier in ascending policy identifier order.

Maintenance MUST use balanced ledger postings.

A ship receives status benefits only when its required maintenance is fully paid unless the status policy explicitly defines partial funding behavior.

## 17. Fleet Exercise Eligibility

A nation may complete at most one standard fleet exercise per calendar year.

The annual limit resets on January 1 and is counted by exercise completion year.

An exercise requires an accepted `ScheduleFleetExerciseCommand` and all predicates:

- no standard exercise completed in the current calendar year;
- exercise month is not earlier than the command's authorization month;
- participating ships are controlled by the nation;
- every participating ship is `ACTIVE`;
- no ship is in a dockyard project, unresolved battle, transit, or incompatible mission;
- every ship has readiness at least `60`;
- every ship has fuel and supply for the exercise;
- exercise area and diplomatic access are legal;
- the nation can reserve the full exercise cost; and
- no treaty or event prohibits the exercise.

A standard exercise MUST include at least `4` eligible ships.

A command failing the annual limit MUST use `ANNUAL_FLEET_EXERCISE_ALREADY_COMPLETED`.

## 18. Fleet Exercise Duration and Cost

The shipped standard fleet exercise duration is exactly `1` strategic month.

Every participating ship pays exactly `20_000` basis points of its normal active monthly maintenance, equal to twice active maintenance, for the exercise month.

`exerciseShipCost = ceiling(baseActiveMaintenance * 20_000 / 10_000)`

Mission, war, damage, location, and support surcharges remain applicable when their owning contracts declare them.

If the full exercise cost is not paid, the exercise is cancelled before execution, participating ships receive no exercise experience, and reservations settle under `DESIGN-11`.

## 19. Fleet Exercise Size

Exercise size is based on participating eligible displacement:

- `SMALL`: below `25_000_000` kilograms;
- `STANDARD`: `25_000_000..99_999_999` kilograms;
- `LARGE`: `100_000_000` kilograms or more.

A `LARGE` exercise must also include at least `8` ships and at least `3` permanent divisions. If these count predicates fail, the exercise is `STANDARD` regardless of displacement.

Exercise size MUST use actual compiled displacement and committed participants.

## 20. Fleet Exercise Experience

The shipped `fleet_exercise_training_v1` effects are:

### Small

- ship crew proficiency: `+2` points;
- participating division experience: `+1` point.

### Standard

- ship crew proficiency: `+4` points;
- participating division experience: `+3` points.

### Large

- ship crew proficiency: `+6` points;
- participating division experience: `+5` points.

A ship or division receives the effect at most once from one exercise.

Final scores clamp once to `0..100`.

A division qualifies only when at least `50%` of its assigned ships, rounded up, participate for the completed exercise month.

Exercise experience is awarded only at successful exercise completion.

## 21. Fleet Exercise Tension

Only `LARGE` exercises create routine tension evaluation.

The active ruleset MUST define `large_exercise_tension_v1` with shipped values:

- base detection probability: `7_500` basis points;
- tension delta on detection: `+1`;
- additional tension delta when held in an area adjacent to a rival home area: `+1`;
- maximum tension increase per affected rival and exercise: `+2`;
- affected rival predicate: active rival relation or explicit containment objective;
- stream: `diplomacy/month/nation/fleet_exercise`;
- cooldown: `6` months per exercising nation and affected rival pair.

Eligible rivals MUST be ordered by ascending nation identifier. Each check MUST use a keyed decision.

A small or standard exercise has zero routine tension effect unless an explicit event defines one.

Every tension change MUST use the diplomacy tension ledger in `DESIGN-17`.

## 22. Fleet Exercise Political Effects

The shipped political policy is:

- successful small exercise: no institutional-confidence effect;
- successful standard exercise: `+1` institutional confidence only when no standard or large exercise produced a confidence gain in the previous `12` completed months;
- successful large exercise: `+1` institutional confidence under the same cooldown;
- cancelled exercise before execution: no confidence effect;
- exercise abandoned after execution begins because of insolvency or preventable supply failure: `-1` institutional confidence;
- exercise accident or incident effects: typed event-defined only.

Exercise prose MUST NOT create political effects.

## 23. Wartime Exercises

During active war, a standard fleet exercise is prohibited unless all participating ships are outside an active battle theater and the `wartime_training_authorization_v1` policy permits it.

The shipped wartime policy permits only `SMALL` exercises, gives the normal small experience effects, and creates no annual standard-exercise completion credit.

A wartime training division remains unavailable for battle that month.

## 24. Exercise Command and Result

Every exercise MUST create one `FleetExerciseRecord` containing:

- exercise identifier;
- nation and area;
- scheduled month;
- ordered participating ships and divisions;
- size classification;
- cost reservation and payment;
- eligibility results;
- fuel and supply consumption;
- experience effects;
- tension decisions and effects;
- political effects;
- incidents;
- completion result;
- ruleset and formula versions; and
- record hash.

Participants MUST be ordered by division identifier, division position, and ship identifier.

## 25. Maintenance Warning

A maintenance warning is a derived projection and MUST NOT be authoritative state.

It MUST be derived from:

- readiness state;
- operational mission;
- dockyard state;
- damage state;
- paid maintenance ratio;
- strategic location;
- port and supply support;
- infrastructure overload;
- fuel and personnel state;
- active project state; and
- current policy versions.

A `MaintenanceWarningProjection` MUST contain:

- ship identifier;
- severity;
- visible causes;
- projected readiness, proficiency, morale, or maintenance effects;
- source snapshot hash;
- formula versions;
- expiration snapshot; and
- projection hash.

The projection MUST be discarded and rebuilt when any input hash changes.

A warning MUST NOT mutate readiness, schedule repairs, reserve funds, or issue commands.

## 26. Warning Severity

The shipped warning severities are:

- `INFO`: no current penalty, future risk exists;
- `WARNING`: one active penalty or maintenance payment below `10_000` basis points of requirement;
- `CRITICAL`: readiness below `30`, zero required maintenance payment, unsupported critical damage, or project-state inconsistency.

When several predicates apply, the highest severity is displayed and all visible causes are retained.

## 27. Canonical Ordering

Fleet-management resolution MUST order:

1. ships by ascending ship identifier;
2. state-transition commands by canonical command order;
3. mobilization and working-up projects by project identifier;
4. exercises by scheduled month and exercise identifier;
5. exercise participants by Section 24; and
6. warnings by severity descending and ship identifier ascending.

Database insertion order, localized names, UI sorting, and wall-clock time MUST NOT affect authoritative results.

## 28. Required Reason Codes

The subsystem MUST define at least:

- `FLEET_STATE_COMBINATION_INVALID`;
- `UNAUTHORIZED_READINESS_STATE_CHANGE`;
- `READINESS_TRANSITION_INELIGIBLE`;
- `SHIP_RESERVE_BATTLE_INELIGIBLE`;
- `SHIP_MOTHBALLED_BATTLE_INELIGIBLE`;
- `SHIP_MOBILIZING_BATTLE_INELIGIBLE`;
- `SHIP_WORKING_UP_BATTLE_INELIGIBLE`;
- `SHIP_UNAVAILABLE`;
- `PROJECT_AVAILABILITY_MISMATCH`;
- `MOBILIZATION_PAYMENT_MISSING`;
- `WORKING_UP_REQUIREMENTS_NOT_MET`;
- `ANNUAL_FLEET_EXERCISE_ALREADY_COMPLETED`;
- `FLEET_EXERCISE_INELIGIBLE`;
- `FLEET_EXERCISE_PAYMENT_FAILED`;
- `FLEET_EXERCISE_COMPLETED`;
- `WARTIME_FLEET_EXERCISE_PROHIBITED`;
- `MAINTENANCE_WARNING_STALE`; and
- `FLEET_MANAGEMENT_INVARIANT_FAILED`.

## 29. Validation and Acceptance

Automated validation MUST prove that:

1. every commissioned ship has one readiness, mission, dockyard, and damage state;
2. invalid state combinations fail before snapshot commitment;
3. active maintenance uses exactly `10_000` basis points and grants `+4` readiness and `+1` proficiency when fully paid;
4. reserve maintenance uses exactly `5_000` basis points, drifts by `-1`, and requires two paid mobilization months;
5. mothballed maintenance uses exactly `2_500` basis points, drifts by `-2`, and requires six paid reactivation months;
6. mobilizing ships cannot enter normal battle generation;
7. working up lasts at least three paid months, uses `12_500` maintenance, grants `+5` proficiency and `+6` readiness, and requires 70 readiness and 50 proficiency;
8. working-up ships cannot enter normal battle generation;
9. emergency activation preserves current scores and applies the exact 8,000-point three-month penalty;
10. unavailable ships cannot move, train, exercise, fulfill duties, or enter battle generation;
11. rebuild and conversion always make ships unavailable through trials and commissioning;
12. delayed and halted major projects do not restore availability;
13. transitions use only the explicit state graph;
14. maintenance uses integer multipliers and balanced ledger postings;
15. one standard fleet exercise may complete per calendar year;
16. standard exercises require at least four active eligible ships;
17. each participant pays exactly twice active maintenance;
18. unpaid exercises produce no experience;
19. exercise sizes use the exact displacement and count thresholds;
20. small, standard, and large exercises grant exactly 2/1, 4/3, and 6/5 ship/division experience;
21. a division requires at least half its ships, rounded up, to qualify;
22. only large exercises receive routine tension checks;
23. large-exercise tension uses 7,500 detection basis points, +1 base, +1 adjacency, and +2 cap;
24. every tension effect uses the diplomacy ledger;
25. confidence effects use the exact 12-month cooldown and abandonment penalty;
26. wartime policy permits only declared small training and keeps training divisions battle-ineligible;
27. maintenance warnings are derived, discardable, and non-authoritative;
28. warnings never issue commands or reserve resources; and
29. identical state, commands, content, ruleset, and seeds produce identical readiness, maintenance, training, exercise, tension, political, warning, ledger, and hash results.
