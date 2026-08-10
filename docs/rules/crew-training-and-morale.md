# DESIGN-28: Crew, Training, And Morale

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-28`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Crew quality, readiness, special training, morale, fatigue, aircrew experience, maintenance costs, and combat effects MUST use the explicit values, formulas, phase bindings, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Crew Performance State

Every commissioned ship MUST have one authoritative `CrewPerformanceState` containing:

- `shipId`;
- national education baseline;
- long-term crew-quality score;
- readiness modifier;
- ordered special-training proficiency records;
- division-cohesion modifier;
- officer modifier;
- battle-morale score;
- fatigue score;
- supply modifier;
- damage modifier;
- effective crew-performance modifier;
- ruleset and formula versions; and
- aggregate hash.

Crew quality, morale, and fatigue use integer range `0..100` inclusive.

Performance multipliers use integer basis points.

## 2. Crew Performance Layers

Effective crew performance MUST be calculated in this order:

1. national education and training baseline;
2. ship crew long-term quality;
3. readiness modifier;
4. special-training modifiers;
5. division cohesion;
6. officer effects;
7. battle morale;
8. fatigue;
9. supply; and
10. damage.

The exact rational result MUST be retained through all multiplicative modifiers and rounded once with `FLOOR` at the final formula boundary.

No layer may bypass another layer or overwrite its authoritative source value.

## 3. Special-Training Subjects

The canonical subjects are:

- `GUNNERY`;
- `NIGHT_FIGHTING`;
- `TORPEDO_TACTICS`; and
- `DAMAGE_CONTROL`.

A nation may fund at most exactly `2` active subjects simultaneously.

A ship may receive benefits only from subjects that:

- are nationally active;
- are fully or partially paid for the current month;
- are applicable to the ship and its equipment;
- have positive proficiency; and
- are not suspended by a typed policy effect.

A third active subject MUST be rejected with `SPECIAL_TRAINING_SUBJECT_LIMIT_EXCEEDED`.

## 4. Special-Training State

Every nation and subject pair MUST have one `SpecialTrainingState` containing:

- `nationId`;
- subject identifier;
- status;
- consecutive fully paid months;
- proficiency basis points;
- monthly required cost;
- monthly paid amount;
- payment ratio basis points;
- decay state;
- activation and suspension causes;
- ruleset version; and
- record hash.

`status` MUST be one of:

- `INACTIVE`;
- `TRAINING`;
- `PROFICIENT`;
- `SUSPENDED`; or
- `DECAYING`.

## 5. Proficiency Accumulation

Full proficiency requires exactly `12` consecutive months paid at `10_000` basis points of required cost.

Each fully paid month grants exactly `834` proficiency basis points for months `1..11`.

The twelfth consecutive fully paid month sets proficiency exactly to `10_000` basis points.

A month paid below full cost breaks the consecutive-month sequence.

Payment from `7_500..9_999` basis points:

- preserves current proficiency;
- grants no new proficiency;
- sets status `SUSPENDED`; and
- resets consecutive fully paid months to `0`.

Payment below `7_500` basis points:

- grants no proficiency;
- resets consecutive fully paid months to `0`;
- applies decay under Section 6; and
- sets status `DECAYING`.

Benefits scale linearly by current proficiency and payment ratio.

## 6. Proficiency Decay

The shipped decay policy is `special_training_decay_v1`:

- paid below `7_500` basis points: proficiency decreases by exactly `1_000` basis points per month;
- subject deliberately deactivated: proficiency decreases by `1_500` basis points per month;
- wartime national training suspension by typed event: proficiency decreases by `500` basis points per month;
- proficiency minimum: `0`;
- reactivation from positive proficiency still requires a new 12-month consecutive sequence to return to full proficiency.

Decay applies once during `RESOLVE_PERSONNEL_AND_READINESS`.

## 7. Training Cost Basis

Every subject's monthly required cost MUST be calculated from the active maintenance requirement of eligible participating ships before the subject's own surcharge.

`trainingCostBase = sum(eligibleShipActiveMaintenanceRequirement)`

`subjectTrainingCost = ceiling(trainingCostBase * subjectMaintenanceSurchargeBp / 10_000)`

The surcharge is an additional cost. It does not replace ordinary maintenance.

A ship whose ordinary maintenance is unpaid receives no special-training benefit for that month, even when the national subject surcharge is paid.

## 8. Gunnery Training

The shipped `gunnery_training_v1` values are:

- full-proficiency gunnery accuracy multiplier: exactly `11_000` basis points;
- permitted accuracy range: `10_500..11_500`;
- active-maintenance surcharge: exactly `3_000` basis points, equal to `30%`;
- permitted surcharge range: `2_500..3_500`;
- applies to: surface and anti-air gunnery accuracy formulas;
- does not apply to torpedoes, missiles, mines, or bombing accuracy.

The effective benefit is:

`gunneryAccuracyBonusBp = floor(1_000 * proficiencyBp * paymentRatioBp / 10_000^2)`

`finalGunneryTrainingMultiplierBp = 10_000 + gunneryAccuracyBonusBp`

At full proficiency and full payment, the multiplier is exactly `11_000`.

The subject MUST NOT modify gun penetration, shell damage, ammunition capacity, or base rate of fire unless another explicit technology or trait does so.

## 9. Night-Fighting Training

The shipped `night_fighting_training_v1` values are:

- full-proficiency night spotting-range multiplier: exactly `11_500` basis points;
- full-proficiency night contact-retention multiplier: exactly `11_000` basis points;
- full-proficiency night gunnery accuracy multiplier: exactly `11_000` basis points;
- full-proficiency night torpedo-solution-quality multiplier: exactly `10_750` basis points;
- active-maintenance surcharge: exactly `2_000` basis points, equal to `20%`;
- permitted surcharge range: `1_500..2_500`.

Benefits apply only when the battle visibility state is `NIGHT`, `TWILIGHT_NIGHT`, or another explicit low-light state mapped by the weather contract.

Each bonus above `10_000` scales by proficiency and payment ratio using the same formula as Section 8.

The subject MUST NOT improve daylight spotting or daylight accuracy.

## 10. Torpedo-Tactics Training

The shipped `torpedo_tactics_training_v1` values are:

- torpedo attack-commitment utility multiplier: exactly `11_500` basis points;
- torpedo fire-solution-quality multiplier: exactly `11_000` basis points;
- torpedo launch-discipline multiplier: exactly `11_000` basis points;
- torpedo salvo-coordination multiplier: exactly `10_750` basis points;
- active-maintenance surcharge: exactly `2_000` basis points, equal to `20%`;
- permitted surcharge range: `1_500..2_500`.

Benefits apply only to ships with usable torpedo armament and compatible tactical doctrine.

`attack-commitment utility` affects AI or automated attack preference only. It MUST NOT bypass command legality, range, identification, ammunition, firing arcs, safety, or manual player constraints.

Fire-solution and coordination bonuses above `10_000` scale by proficiency and payment ratio.

The subject MUST NOT directly change torpedo warhead damage, speed, range, or detonation probability.

## 11. Damage-Control Training

The shipped `damage_control_training_v1` values are:

- firefighting-capacity multiplier: exactly `11_500` basis points;
- flooding-control-capacity multiplier: exactly `11_500` basis points;
- progressive-fire growth multiplier: exactly `9_000` basis points;
- progressive-flooding growth multiplier: exactly `9_000` basis points;
- damage-control-team fatigue multiplier: exactly `9_000` basis points;
- active-maintenance surcharge: exactly `2_000` basis points, equal to `20%`;
- permitted surcharge range: `1_500..2_500`.

Positive capacity bonuses and reductions below `10_000` MUST scale linearly by proficiency and payment ratio.

At full proficiency and full payment:

- firefighting and flooding-control capacities improve by exactly `15%`;
- progressive fire and flooding growth are reduced by exactly `10%`; and
- damage-control fatigue accumulation is reduced by exactly `10%`.

Training MUST NOT repair existing damage instantly, prevent all fires or floods, or bypass unavailable teams, pumps, electrical power, or crew casualties.

## 12. Multiple Active Subjects

When two active subjects affect the same formula, modifiers MUST be applied in ascending subject identifier order and rounded once at the final owning formula boundary.

Gunnery and night-fighting accuracy bonuses are multiplicative during eligible night gunnery.

No subject may be counted twice through national, ship, division, or tactical projections.

## 13. Japan Training-Cost Modifier

The canonical Japan modifier is `japan_special_training_cost_v1`.

When the active scenario nation instance belongs to `slot_empire_of_japan`, every special-training subject surcharge is multiplied by exactly `8_000` basis points, equal to a `20%` cost reduction.

`adjustedSubjectTrainingCost = ceiling(subjectTrainingCost * 8_000 / 10_000)`

The modifier affects cost only. It MUST NOT change proficiency speed, maximum proficiency, or combat benefit.

## 14. Crew Quality

Ship long-term crew quality uses integer range `0..100`.

The shipped category bands are:

- `0..19`: untrained;
- `20..39`: poor;
- `40..59`: regular;
- `60..79`: experienced;
- `80..94`: veteran;
- `95..100`: elite.

Crew quality changes only through training, service, battle experience, casualties, replacements, demobilization, or typed events.

A presentation category MUST NOT replace the numeric score.

## 15. Battle Morale

Morale MUST be represented separately at:

- fleet level;
- tactical force level; and
- ship level when the tactical contract requires it.

Every morale score uses `0..100`.

Initial tactical force morale is:

`forceMorale = clamp(0, 100, 50 + nationalModifier + commanderModifier + averageShipMoraleModifier + objectiveModifier)`

Initial ship morale is:

`shipMorale = clamp(0, 100, 50 + crewQualityModifier + readinessModifier + officerModifier + supplyModifier)`

All modifiers MUST be explicit integer points.

## 16. Morale Effects

The shipped strategic morale effects are:

- fully paid month with full support: `+1`, maximum once per 3 completed months;
- unpaid minimum maintenance: `-3`;
- major defeat: `-5`;
- decisive defeat: `-8`;
- major victory: `+3`;
- decisive victory: `+5`;
- war exhaustion `60..79`: `-2`;
- war exhaustion `80..100`: `-5`;
- critical shortage: `-5`;
- unsupported active ship: `-3`.

Only the highest battle-result effect applies per ship per battle.

Morale changes require typed records and clamp once to `0..100`.

## 17. Rally Order

`RallyCommand` may be issued only when:

- the commanding officer is authorized;
- command communication succeeds;
- force morale is below `70`;
- no rally succeeded for the force in the previous `30` tactical minutes; and
- the force is not in terminal withdrawal or destroyed state.

A successful rally grants:

- force morale `+10` points;
- ship morale `+5` to connected ships;
- duration: exactly `15` tactical minutes for aggression and cohesion bonus;
- temporary formation-cohesion multiplier: `11_000` basis points.

Rally does not restore damage, ammunition, fuel, crew casualties, or exhausted command resources.

## 18. Disengage Order

`DisengageCommand` sets:

- offensive target-acquisition utility multiplier to `5_000` basis points;
- withdrawal-route utility multiplier to `15_000` basis points;
- torpedo attack-commitment utility multiplier to `5_000` basis points;
- formation preservation priority to `12_500` basis points; and
- force morale immediate effect to `-2` points.

The order remains active until cancelled, superseded, successful withdrawal, or battle end.

Disengage MUST NOT guarantee escape or disable defensive fire.

## 19. Fatigue

Crew fatigue uses integer range `0..100`.

The shipped tactical fatigue rates per `10` resolved battle minutes are:

- normal steaming: `+1`;
- maximum power: additional `+2`;
- sustained gunnery: additional `+2`;
- active damage control: additional `+3`;
- torpedo attack maneuver: additional `+2`;
- under air attack: additional `+2`.

Rates stack and are applied at each completed 10-minute boundary.

Fatigue recovery outside battle is `-10` points per fully supplied strategic month. Training and exercise months recover only `-5`.

## 20. Aircrew State

Every squadron MUST have one `AircrewState` containing:

- squadron identifier;
- squadron experience score;
- pilot-pool quality reference;
- fatigue score;
- current training tier;
- re-equipment penalty;
- expansion dilution penalty;
- casualty and replacement history;
- mission history;
- rescue-adjusted survival records;
- ruleset version; and
- state hash.

Squadron experience and pilot-pool quality are separate authoritative values.

## 21. Squadron Experience

Squadron experience uses `0..100`.

The shipped changes are:

- completed training month: `+3`;
- completed combat mission: `+1`;
- successful combat mission: additional `+1`;
- re-equipment to a new aircraft model: `-10`;
- expansion by up to `25%` authorized strength: `-5`;
- expansion above `25%` through `50%`: `-10`;
- expansion above `50%`: `-20`;
- replacement of each `10%` of authorized pilots after losses: `-3`, applied by exact loss ratio bands.

Experience clamps once to `0..100`.

## 22. Aircrew Mission Fatigue

The shipped fatigue added per completed mission is:

- CAP: `+5`;
- reconnaissance: `+5`;
- escort: `+8`;
- patrol ASW: `+8`;
- level bombing: `+12`;
- dive bombing: `+15`;
- torpedo attack: `+18`;
- guided-weapon or missile attack: `+12`;
- special squadron mission: mission-defined, with no implicit default.

Attack missions therefore create greater fatigue than CAP and reconnaissance.

Aircrew fatigue recovery is `-10` per fully supplied non-combat day represented by the tactical or air-operations contract, capped at zero.

## 23. Elite Aircrew Training

Elite training requires:

- training tier `ELITE`;
- paid monthly elite-training cost;
- squadron experience at least `80`;
- pilot-pool quality at least `70`;
- no expansion above `10%` during the training month; and
- active training infrastructure.

The shipped elite-training effects are:

- air-combat effectiveness multiplier: `11_000` basis points;
- strike-coordination multiplier: `11_000`;
- operational-loss multiplier: `9_000`;
- monthly training-cost multiplier: `15_000` basis points of standard squadron training cost.

During war, elite status is suspended when:

- monthly replacement rate exceeds `20%` of authorized pilots;
- elite-training payment is below `10_000` basis points; or
- squadron fatigue exceeds `80` at month closing.

Suspension removes elite multipliers until all predicates pass for `3` consecutive completed months.

## 24. Air-Sea Rescue

Air-sea rescue modifies survival only when:

- rescue-capable assets are available;
- location and weather permit rescue;
- enemy threat is below the mission's rescue threshold;
- search time exists; and
- fuel and capacity are available.

The shipped base pilot survival probability after ditching is `4_000` basis points.

Eligible air-sea rescue adds exactly `2_500` basis points.

Advanced rescue technology adds another `1_500` basis points.

Final probability is clamped to `0..10_000`.

Rescue MUST use a keyed air-operations decision and create survivor records.

## 25. Records and Explanation

Every monthly special-training resolution MUST create one `SpecialTrainingResolutionRecord` containing:

- nation and subject;
- eligible ships;
- cost base;
- surcharge basis points;
- national cost modifier;
- required and paid cost;
- payment ratio;
- proficiency before and after;
- consecutive-month state;
- decay;
- active benefit values;
- ledger transactions;
- formula versions; and
- record hash.

Every battle and air-operation result MUST record applied crew, morale, fatigue, training, and aircrew modifiers.

## 26. Canonical Ordering

Resolution MUST order:

1. nations by identifier;
2. subjects by canonical subject identifier;
3. ships by identifier;
4. morale effects by phase and cause identifier;
5. squadrons by identifier;
6. air missions by mission ordinal; and
7. rescue checks by casualty identifier.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect results.

## 27. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_CREW_PERFORMANCE_STATE`;
- `SPECIAL_TRAINING_SUBJECT_LIMIT_EXCEEDED`;
- `SPECIAL_TRAINING_PAYMENT_INSUFFICIENT`;
- `SPECIAL_TRAINING_PROFICIENCY_DECAYED`;
- `SPECIAL_TRAINING_NOT_APPLICABLE`;
- `GUNNERY_TRAINING_ACTIVE`;
- `NIGHT_FIGHTING_TRAINING_ACTIVE`;
- `TORPEDO_TACTICS_TRAINING_ACTIVE`;
- `DAMAGE_CONTROL_TRAINING_ACTIVE`;
- `RALLY_INELIGIBLE`;
- `RALLY_COOLDOWN_ACTIVE`;
- `DISENGAGE_ORDER_ACTIVE`;
- `AIRCREW_ELITE_STATUS_SUSPENDED`;
- `AIR_SEA_RESCUE_INELIGIBLE`; and
- `CREW_TRAINING_MORALE_INVARIANT_FAILED`.

## 28. Validation and Acceptance

Automated validation MUST prove that:

1. every ship has complete crew-performance state and ordered performance layers;
2. at most two special-training subjects are active;
3. full proficiency requires exactly twelve consecutive fully paid months;
4. months one through eleven grant 834 basis points and month twelve sets exactly 10,000;
5. partial payment suspends progress and low payment applies exact decay;
6. benefits require paid ordinary maintenance and paid subject training;
7. gunnery training grants exactly 11,000 accuracy and charges exactly 3,000 maintenance basis points at full proficiency;
8. night training grants exactly 11,500 spotting, 11,000 contact, 11,000 night accuracy, 10,750 torpedo solution, and 2,000 maintenance basis points;
9. torpedo training grants exactly 11,500 attack utility, 11,000 solution, 11,000 discipline, 10,750 coordination, and 2,000 maintenance basis points;
10. damage-control training grants exactly 11,500 firefighting and flooding capacity, 9,000 growth and fatigue multipliers, and 2,000 maintenance basis points;
11. all partial benefits scale with proficiency and payment ratio;
12. Japan applies exactly 8,000 basis points to training cost only;
13. crew quality, morale, and fatigue remain separate bounded values;
14. rally uses exact eligibility, cooldown, duration, morale, and cohesion effects;
15. disengage uses exact offensive, withdrawal, torpedo, formation, and morale values;
16. fatigue accrues at exact ten-minute rates;
17. squadron experience remains distinct from pilot-pool quality;
18. re-equipment, expansion, and pilot replacement apply exact experience penalties;
19. attack missions create the exact higher fatigue values declared here;
20. elite training requires explicit quality, experience, payment, infrastructure, and wartime sustainment predicates;
21. air-sea rescue uses exact 4,000 base, 2,500 rescue, and 1,500 advanced-technology basis points;
22. all effects create complete records and visible explanations where permitted; and
23. identical state, commands, content, ruleset, and seeds produce identical training, morale, fatigue, aircrew, rescue, ledger, RNG, and hash results.
