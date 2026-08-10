# DESIGN-38: Tactical Combat

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-38`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Tactical time, command quantization, realism-mode authority, targeting permissions, command reach, battle turn away, confusion, withdrawal, battle end, and auto-resolution MUST use the explicit values, predicates, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Authoritative Tactical Time

Tactical combat resolves in discrete authoritative turns of exactly `60_000` tactical milliseconds, equal to one battle minute.

Each battle turn MUST contain exactly `60` authoritative substeps of `1_000` tactical milliseconds.

The active ruleset MUST define:

- `tacticalTurnMilliseconds` with shipped value `60_000`;
- `tacticalSubstepMilliseconds` with shipped value `1_000`;
- `substepsPerTurn` with shipped value `60`;
- `tacticalTimePolicyId` with shipped value `tactical_time_v1`; and
- tactical-time formula version.

`tacticalTurnMilliseconds % tacticalSubstepMilliseconds` MUST equal `0`.

A missing or invalid value MUST fail with `INVALID_TACTICAL_TIME_CONTRACT`.

## 2. Tactical Clock

Every battle MUST have one authoritative `TacticalClock` containing:

- `battleId`;
- current battle-minute index;
- current substep index;
- elapsed tactical milliseconds;
- battle start campaign time;
- maximum battle minutes;
- pause state;
- command cutoff state;
- tactical-time policy version; and
- clock hash.

The first unresolved battle minute is index `0`. Substeps execute from `0` through `59` inclusive.

Wall-clock time, frame rate, renderer performance, pause duration, operating-system scheduling, and animation speed MUST NOT alter tactical time or outcomes.

## 3. Tactical Turn Pipeline

Every battle minute MUST resolve in this exact order:

1. lock commands eligible for the minute;
2. transmit and acknowledge command messages;
3. resolve command-state transitions;
4. update contact and knowledge state;
5. resolve movement intent;
6. resolve propulsion, acceleration, turning, and formation control;
7. resolve collisions and grounding hazards;
8. resolve sensor and spotting updates;
9. resolve gun, torpedo, missile, mine, submarine, and air actions by their declared substep schedules;
10. apply damage, fire, flooding, casualties, and morale effects;
11. resolve damage control;
12. resolve withdrawal, pursuit, and exit predicates;
13. evaluate battle-end predicates;
14. canonicalize state and event order; and
15. compute minute-state and ledger hashes.

A phase with no eligible work MUST emit a successful empty record.

## 4. Rendering and Interpolation

Rendering MAY interpolate position, heading, animation, effects, camera, and UI values between committed authoritative substeps.

Rendering MUST read immutable projections. It MUST NOT write interpolation values into:

- authoritative position;
- heading;
- speed;
- damage;
- contact state;
- command state;
- ammunition;
- RNG keys;
- event ordering; or
- canonical hashes.

A dropped, duplicated, or delayed render frame MUST leave every authoritative hash unchanged.

## 5. Command Quantization

Player, AI, and automation inputs MUST be quantized to an authoritative command-effective boundary.

The canonical rule is:

`effectiveSubstep = ceiling(inputTimestampTacticalMilliseconds / 1_000)`

A command received exactly on a substep boundary is eligible for that substep only when it arrived before the command cutoff. Otherwise it becomes eligible for the next substep.

The shipped command cutoff is exactly `100` tactical milliseconds before the next substep boundary.

A command arriving after the final cutoff of a battle minute is assigned to substep `0` of the next battle minute.

Input timestamps MUST use the battle's authoritative clock, not wall-clock time.

## 6. Command Record

Every tactical command MUST create one `TacticalCommandRecord` containing:

- command identifier and type;
- issuer participant and command source;
- target force, division, ship, contact, area, or objective;
- input timestamp;
- quantized effective minute and substep;
- intended parameters;
- command-authority result;
- communication path;
- transmission delay;
- acknowledgment result;
- command status;
- failure reason;
- execution result;
- ruleset and formula versions; and
- command hash.

Commands MUST follow `DESIGN-11` lifecycle and MUST NOT mutate state directly.

## 7. Command States

The canonical tactical command states are:

- `INTENDED`;
- `ISSUED`;
- `TRANSMITTED`;
- `ACKNOWLEDGED`;
- `EXECUTING`;
- `COMPLETED`;
- `FAILED`; and
- `CANCELLED`.

A command MUST NOT enter `EXECUTING` before acknowledgment unless its command definition explicitly permits local autonomous execution.

Invalid transitions MUST fail with `INVALID_TACTICAL_COMMAND_TRANSITION`.

## 8. Core Tactical State

Every battle MUST contain authoritative state for:

- battle map and navigable geometry;
- tactical sides and forces;
- tactical divisions;
- persistent and temporary ships;
- aircraft and squadrons;
- submarines;
- contacts and knowledge assertions;
- mission objectives;
- weather, sea state, daylight, and visibility;
- smoke;
- mine hazards;
- issued orders and command messages;
- morale and fatigue;
- damage, fire, flooding, ammunition, fuel, and inventory;
- exit zones and withdrawal state; and
- append-only battle event ledger.

Every persistent tactical asset MUST preserve campaign provenance from `DESIGN-37`.

## 9. Tactical Realism Modes

The canonical realism modes are:

- `ADMIRAL`;
- `REAR_ADMIRAL`; and
- `CAPTAIN`.

The selected mode is immutable after battle initialization.

Realism mode changes command authority and information presentation only. It MUST NOT modify:

- raw ship statistics;
- AI ship statistics;
- damage formulas;
- hit probabilities after lawful orders are resolved;
- mission objectives;
- battle-result classification;
- raw war-score effects; or
- campaign battle rewards.

## 10. Lead Division

Each player-controlled tactical force MUST have exactly one `leadDivisionId` unless it has no surviving controllable division.

The lead division:

- anchors player command authority in `ADMIRAL` mode;
- provides the primary flagship communication source;
- may be changed only through `ChangeLeadDivisionCommand`;
- must be friendly, surviving, command-capable, and connected; and
- does not transfer ownership of other divisions.

## 11. Admiral Mode

In `ADMIRAL` mode, the player may issue commands only to:

- the lead division;
- force-level mission objectives;
- force-level `RALLY`;
- force-level `DISENGAGE`;
- `CHANGE_LEAD_DIVISION`;
- `BATTLE_TURN_AWAY` when eligible; and
- bounded coordination requests to subordinate or allied divisions.

The player MUST NOT issue:

- direct ship commands outside the lead division;
- direct target assignments to ships or divisions;
- manual gun targeting;
- manual torpedo firing;
- manual ammunition selection;
- direct helm commands to subordinate ships; or
- direct allied commands beyond the allied command contract.

The lead division and subordinate AI select targets through their own command and fire-control rules.

## 12. Rear Admiral Mode

In `REAR_ADMIRAL` mode, the player may command any friendly player-owned division within command reach.

Permitted commands include:

- division course and speed;
- formation;
- mission role;
- division target priority;
- division target assignment to a legally known contact;
- rally and disengage;
- flotilla attack;
- change lead division; and
- battle turn away.

The player MUST NOT issue:

- direct individual-ship helm orders, except a permitted flagship maneuver command;
- individual gun-mount targeting;
- manual gun firing;
- manual torpedo firing; or
- direct allied tactical commands without explicit transferred authority.

## 13. Captain Mode

In `CAPTAIN` mode, the player may command any friendly player-owned division regardless of ordinary flagship command reach, provided the division remains legally controllable and not under an explicit communication blackout.

The player may additionally issue:

- individual friendly ship course and speed;
- individual ship target assignment;
- individual weapon-group target assignment;
- manual torpedo launch commands;
- ammunition-selection commands;
- damage-control priority commands; and
- individual withdrawal commands.

Captain mode MUST still respect:

- contact knowledge and identification;
- weapon range and arcs;
- reload and ammunition;
- fire-control capability;
- torpedo safety and firing solution;
- command ownership;
- damage and crew availability;
- communication blackout; and
- command quantization.

Captain mode does not grant command over allied forces by default.

## 14. Command Reach

Command reach MUST use `tactical_command_reach_v1`.

A division is within ordinary command reach when at least one valid communication path exists through:

- visual flag signaling;
- signal lamp;
- radio;
- relay ship; or
- explicit data link.

Every path MUST declare:

- maximum range;
- visibility requirement;
- line-of-sight requirement;
- technology requirement;
- transmission delay;
- interception or failure probability;
- flagship and relay condition; and
- command types supported.

The shipped base maximum ranges are:

- flag signals: `8` nautical miles in daylight clear visibility;
- signal lamp: `12` nautical miles with line of sight;
- early radio: `100` nautical miles;
- mature radio: `500` nautical miles;
- modern data link: battle-wide when relay connectivity exists.

Weather, smoke, darkness, jamming, flagship damage, commander ability, division experience, and formation modify path success through explicit formulas.

## 15. Command Transmission Delay

The shipped base transmission delays are:

- local lead-division command: `0` tactical minutes;
- flag signal: `2` minutes;
- signal lamp: `1` minute;
- early radio: `2` minutes;
- mature radio: `1` minute;
- modern data link: `0` minutes;
- allied mission-objective request: additional `2` minutes;
- relay path: additional `1` minute per relay hop.

The final delay is an integer count of battle minutes and MUST be recorded when the command is issued.

## 16. Communication Failure

A command may fail transmission only through an explicit keyed check.

The shipped formula is:

`failureProbabilityBp = clamp(0, 10_000, basePathFailureBp + visibilityPenaltyBp + smokePenaltyBp + jammingPenaltyBp + flagshipDamagePenaltyBp + confusionPenaltyBp - commanderBonusBp - divisionExperienceBonusBp)`

The check MUST use stream `battle/command/path/transmission` keyed by battle, command, path, and transmission attempt.

A failed transmission leaves the command `FAILED` and applies no maneuver or targeting effect.

## 17. Realism and War Score

Raw war score MUST derive only from battle and mission outcomes under `DESIGN-31`.

The same authoritative `BattleResult` MUST yield the same raw war-score effect in all realism modes.

Realism mode MUST NOT multiply, add, cap, normalize, or reclassify raw war score.

## 18. Realism Career-Evaluation Modifier

Any realism effect applies only through the `tactical_realism` dimension or modifier under `DESIGN-56`.

The shipped final career-evaluation multipliers are:

- `ADMIRAL`: `11_000` basis points;
- `REAR_ADMIRAL`: `10_000`;
- `CAPTAIN`: `9_500`.

The multiplier applies only to the tactical-command contribution declared by `DESIGN-56`, not to raw battle score, objectives, confidence, economy, or war score.

The active ruleset MUST provide the exact multiplier and dimension binding. Missing fields MUST fail with `TACTICAL_REALISM_EVALUATION_CONTRACT_MISSING`.

## 19. Contact-Constrained Targeting

Every target order MUST reference a legally known `ContactTrack`, not hidden true identity.

A contact track MUST contain estimated identity, position, course, speed, confidence, observation time, source, and uncertainty.

The player MUST NOT target an unobserved true asset through UI selection, keyboard cycling, minimap, automation, or command payload.

A target-order leak MUST fail with `TACTICAL_FOG_OF_WAR_VIOLATION`.

## 20. Movement State

Every ship MUST track:

- fixed-point position coordinates;
- heading;
- ordered speed;
- current speed;
- acceleration;
- turning rate;
- collision radius;
- propulsion state;
- machinery reliability;
- fuel state;
- formation station; and
- grounding and collision state.

All authoritative movement uses integer or fixed-point arithmetic under `DESIGN-07`.

## 21. Full-Speed Stress

A ship operates at full-speed stress when ordered speed is at least `9_500` basis points of current attainable maximum speed.

At each completed `10` tactical minutes under full-speed stress, evaluate eligible stress checks.

The shipped base probabilities are:

- fouled grates for coal-fired ships: `500` basis points;
- exhausted stokers for coal-fired ships: `750`;
- machinery breakdown: `250`;
- vibration penalty when speed exceeds exactly `25` knots: `1_000`.

Coal and vertical-triple-expansion machinery multipliers are explicit:

- coal fuel: `12_500` basis points to grate and stoker checks;
- VTE machinery: `15_000` to machinery breakdown and vibration checks.

Checks use stream `battle/ship/propulsion/full_speed_stress`.

## 22. Force Orders

The canonical force orders are:

- `FLOTILLA_ATTACK`;
- `RALLY`;
- `DISENGAGE`;
- `CHANGE_LEAD_DIVISION`; and
- `BATTLE_TURN_AWAY`.

Every force order requires a complete command definition, authority, eligibility, communication, acknowledgment, execution, cancellation, and result contract.

## 23. Battle Turn Away Technology

`BATTLE_TURN_AWAY` requires discovered and adopted doctrine technology `battle_turn_away_maneuver`.

The technology applicability is `DOCTRINE_REQUIRES_TRAINING`.

The shipped adoption requirement is exactly `6` completed paid training months for eligible capital and cruiser divisions.

A division without completed adoption MUST reject the order with `BATTLE_TURN_AWAY_TECHNOLOGY_UNAVAILABLE`.

## 24. Battle Turn Away Eligibility

The force order is eligible only when:

- at least one friendly player-owned division is executing `LINE_AHEAD` or compatible battle-line formation;
- the lead division or force commander is command-capable;
- every participating division has acknowledged the order or is permitted to execute autonomously;
- minimum current division cohesion is `40`;
- no participating division is in terminal withdrawal, collision, grounding, or immobilized state;
- sufficient maneuver room exists;
- no participating ship has turning capability below its safety minimum; and
- the order is legal under the selected realism mode.

In `ADMIRAL` mode, it is a force-level order. In `REAR_ADMIRAL` and `CAPTAIN`, it may target one or more eligible divisions.

## 25. Battle Turn Away Maneuver

For each participating division, the maneuver MUST:

1. lock the current ordered ship sequence;
2. calculate a reciprocal course exactly `180` degrees from the formation course;
3. select turn direction `PORT` or `STARBOARD` from the command;
4. order the current rear ship to initiate first;
5. initiate each following ship after the prior ship clears its protected turning point;
6. assign the reversed ship order as the new canonical tactical order after all ships complete the turn;
7. preserve the same ship membership;
8. recalculate formation stations; and
9. emit one maneuver-completion record.

The pre-maneuver order `[A, B, C, D]` becomes `[D, C, B, A]` after successful completion.

The maneuver MUST NOT teleport, rotate, reorder, or reposition ships instantaneously.

## 26. Battle Turn Away Timing

The shipped nominal initiation interval is exactly `1` tactical minute between ships before modifiers.

The final interval is:

`initiationIntervalMinutes = clamp(1, 4, ceiling(1 * formationDifficultyBp * damageMultiplierBp * confusionMultiplierBp / 10_000^3))`

The maneuver completes when every surviving participating ship reaches within:

- `5` degrees of reciprocal course;
- `1_000` basis points of ordered formation speed; and
- one declared formation-station tolerance.

A ship that becomes immobilized exits formation under an explicit failure outcome.

## 27. Battle Turn Away Confusion

The maneuver MUST perform one command-confusion check per participating division after acknowledgment and before the first ship initiates.

The shipped base probability is exactly `1_500` basis points.

`confusionProbabilityBp = clamp(0, 10_000, 1_500 + signalDelayPenaltyBp + flagshipDamagePenaltyBp + smokeVisibilityPenaltyBp + mixedDivisionPenaltyBp + fatiguePenaltyBp - commanderAbilityBonusBp - divisionExperienceBonusBp - divisionCohesionBonusBp)`

Shipped component values are:

- each full minute of transmission delay above `1`: `+500`;
- flagship degraded: `+1_000`;
- flagship mission killed but signaling remains: `+2_500`;
- heavy smoke or visibility below `2` nautical miles: `+1_500`;
- mixed-type division: `+500`;
- average ship fatigue `60..79`: `+500`;
- fatigue `80..100`: `+1_000`;
- commander revealed or authoritative ability above `60`: `-25` basis points per ability point above `60`, capped at `-1_000`;
- division experience: `-10` basis points per point, capped at `-1_000`;
- division cohesion: `-10` per point, capped at `-1_000`.

The check uses stream `battle/command/division/battle_turn_away_confusion`.

## 28. Confusion Outcomes

On confusion, select exactly one outcome using these shipped weights:

- `EXECUTION_DELAYED`: `5_000`;
- `WRONG_TURN_DIRECTION_CORRECTED`: `2_000`;
- `FORMATION_INTERVAL_DOUBLED`: `2_000`;
- `ONE_SHIP_FAILS_TO_ACKNOWLEDGE`: `750`;
- `MANEUVER_ABORTED`: `250`.

Weights total exactly `10_000`.

Effects are:

- delayed: add exactly `2` tactical minutes before initiation;
- wrong direction corrected: lead initiating ship begins wrong direction for one minute, then corrects, with collision checks active;
- interval doubled: final initiation interval multiplied by `20_000` basis points;
- one ship fails acknowledgment: select the eligible ship by keyed choice; it maintains previous order until a follow-up command;
- aborted: no ship intentionally begins the maneuver and the command fails.

Confusion MUST NOT directly cause damage. Damage can result only from subsequent movement, collision, grounding, or enemy action.

## 29. Battle Turn Away Cancellation

The order may be cancelled before the first ship initiates.

After initiation, ordinary cancellation is prohibited. A new emergency maneuver command may supersede it only through an explicit policy and must preserve ships' current physical state.

Cancellation MUST NOT restore pre-maneuver positions.

## 30. Exit Zones

Every battle scenario MUST define exact exit-zone geometry and eligible side or mission use.

A ship crossing a visual map boundary outside an eligible exit zone remains in the battle state and must receive a correction, grounding, off-map interception, or scenario-defined response.

An exit-zone crossing creates an exit attempt, not guaranteed escape.

## 31. Withdrawal Success

A withdrawal succeeds only when all predicates pass:

- ship or force enters an eligible exit zone;
- a valid disengage or mission withdrawal order is active, unless involuntary retreat applies;
- no enemy maintains contact confidence at or above `6_000` basis points within pursuit range;
- withdrawing force speed and damage permit continued movement;
- no blocking enemy force controls the exit approach;
- mission objectives permit departure or failure consequences are accepted; and
- the withdrawal persistence duration completes.

The shipped persistence duration is exactly `5` tactical minutes after entering the exit zone.

Pursuit contact reset during this duration restarts the timer.

## 32. Battle End

Battle end is evaluated in this order:

1. scenario-specific terminal condition;
2. no viable combatants on one side;
3. objective completion with declared immediate-end effect;
4. one side completes withdrawal;
5. mutual disengagement;
6. time limit.

Every scenario MUST define a positive integer maximum battle duration. The shipped default is `360` battle minutes.

A battle ending by time limit MUST still resolve all current minute effects before finalization.

## 33. Auto-Resolution

Auto-resolution MUST be available for every accepted battle manifest.

A scenario MUST NOT require player tactical command for campaign continuity.

A tutorial or validation scenario MAY require tactical play outside normal campaign continuity, but its manifest must still be auto-resolvable for testing.

Auto-resolution MUST consume the same:

- manifest;
- campaign asset state;
- battle seed;
- weather;
- objectives;
- realism-independent ship and force statistics;
- ruleset and formula versions; and
- campaign consequence contracts.

## 34. Auto-Resolution Validation

The auto-resolver MUST be statistically validated against tactical simulation using fixed scenario suites.

For each validation suite and major result metric, the shipped acceptance threshold is:

- absolute mean relative error no greater than `10%`;
- loss-rate difference no greater than `10` percentage points;
- mission-success-rate difference no greater than `10` percentage points; and
- no systematic side bias greater than `5` percentage points over at least `1_000` paired seeded runs.

Validation reports MUST pin scenario, ruleset, formula, AI-policy, and RNG versions.

Failure blocks a packaged smoke-test release claim for the affected mission type.

## 35. Battle Event Ledger

Every tactical state change MUST append one immutable battle-event record containing:

- battle identifier;
- minute and substep;
- event type;
- cause identifier;
- actor and target identifiers;
- pre- and post-state hashes;
- RNG decision identifiers;
- visibility; and
- event hash.

Events MUST be canonically ordered by minute, substep, event priority, actor identifier, target identifier, and event identifier.

## 36. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_TACTICAL_TIME_CONTRACT`;
- `INVALID_TACTICAL_CLOCK`;
- `TACTICAL_COMMAND_AFTER_CUTOFF`;
- `INVALID_TACTICAL_COMMAND_TRANSITION`;
- `TACTICAL_COMMAND_AUTHORITY_DENIED`;
- `TACTICAL_COMMAND_OUT_OF_REACH`;
- `TACTICAL_COMMAND_TRANSMISSION_FAILED`;
- `TACTICAL_REALISM_COMMAND_PROHIBITED`;
- `TACTICAL_REALISM_EVALUATION_CONTRACT_MISSING`;
- `TACTICAL_FOG_OF_WAR_VIOLATION`;
- `BATTLE_TURN_AWAY_TECHNOLOGY_UNAVAILABLE`;
- `BATTLE_TURN_AWAY_INELIGIBLE`;
- `BATTLE_TURN_AWAY_CONFUSION`;
- `BATTLE_TURN_AWAY_ABORTED`;
- `BATTLE_WITHDRAWAL_INCOMPLETE`;
- `BATTLE_EXIT_ZONE_INELIGIBLE`;
- `AUTO_RESOLUTION_UNAVAILABLE`;
- `AUTO_RESOLUTION_VALIDATION_FAILED`; and
- `TACTICAL_STATE_INVARIANT_FAILED`.

## 37. Validation and Acceptance

Automated validation MUST prove that:

1. each authoritative battle turn is exactly 60,000 tactical milliseconds;
2. the shipped substep is exactly 1,000 milliseconds and each minute has exactly 60 substeps;
3. wall-clock time, frame rate, pause, and rendering cannot change authoritative outcomes;
4. commands quantize with the exact ceiling formula and 100-millisecond cutoff;
5. all tactical commands use canonical records and lifecycle transitions;
6. rendering interpolation never writes to authoritative state;
7. realism mode remains immutable during battle;
8. Admiral mode controls the lead division and force orders but prohibits manual targeting;
9. Rear Admiral mode controls reachable divisions and permits division target orders but prohibits manual torpedo fire;
10. Captain mode controls player-owned divisions and ships and permits ship targeting and manual torpedo fire while respecting all legality rules;
11. allied forces remain outside direct player control without transferred authority;
12. command reach uses exact path, range, delay, technology, visibility, and damage contracts;
13. communication failures use a keyed decision and produce explicit command failure;
14. realism mode never changes raw war score or battle-result classification;
15. career-evaluation multipliers are exactly 11,000, 10,000, and 9,500 basis points for Admiral, Rear Admiral, and Captain;
16. targeting uses legal contact tracks and never hidden true assets;
17. authoritative movement uses fixed-point values;
18. full-speed stress begins at exactly 9,500 basis points of attainable speed and checks every 10 minutes;
19. vibration eligibility begins strictly above 25 knots;
20. battle turn away requires adopted technology and exactly six paid doctrine months;
21. battle turn away requires exact formation, command, cohesion, maneuver-room, and ship-availability predicates;
22. successful battle turn away reverses course by exactly 180 degrees and reverses ship order physically over time;
23. nominal initiation interval is exactly one minute;
24. confusion uses exactly 1,500 base probability and declared deterministic modifiers;
25. confusion outcomes use weights totaling 10,000 and exact effects;
26. confusion does not directly inflict damage;
27. cancellation is allowed only before first maneuver initiation;
28. visual boundary crossing alone never guarantees escape;
29. withdrawal requires an eligible exit zone, order, contact, pursuit, speed, mission, and five-minute persistence predicates;
30. battle end uses the exact precedence order and completes current-minute effects;
31. every accepted campaign battle is auto-resolvable;
32. auto-resolution uses identical campaign inputs and realism-independent mechanics;
33. statistical validation uses at least 1,000 paired runs and exact 10%, 10-point, and 5-point thresholds;
34. battle events use canonical minute and substep ordering; and
35. identical manifest, commands, state, ruleset, AI policy, and seeds produce identical tactical events, results, ledgers, and hashes.
