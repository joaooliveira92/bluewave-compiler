# DESIGN-27: Officers And Personnel

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-27`
> **Amended by:** ADR-0065.
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Officer identity, ability knowledge, promotion, trait change, vacancies, removal, academy output, recurring costs, and personnel sufficiency MUST use the explicit states, values, predicates, streams, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Officer State

Every officer MUST have one authoritative `OfficerState` containing:

- `officerId`;
- owner nation;
- birth year and age cohort;
- service-entry month;
- current rank;
- ordered rank-history records;
- ordered command-history records;
- true ability;
- revealed-ability estimate;
- revealed-ability confidence;
- ordered trait identifiers;
- battle-experience points;
- months in current rank;
- current command identifier or `NONE`;
- status;
- promotion-eligibility state;
- knowledge-record references;
- content, ruleset, and formula versions; and
- aggregate hash.

True ability is authoritative hidden state. Revealed estimate and confidence are knowledge state and MUST NOT overwrite true ability.

## 2. Ranks

The canonical ranks in ascending seniority are:

1. `COMMANDER`;
2. `CAPTAIN`;
3. `REAR_ADMIRAL`;
4. `ADMIRAL`.

Promotion may advance exactly one rank per promotion result. Skipping ranks is prohibited unless a scenario event explicitly defines an emergency promotion contract.

## 3. Ability Scale

The canonical true-ability categories and numeric scores are:

- `INCOMPETENT`: `20`;
- `BELOW_AVERAGE`: `40`;
- `AVERAGE`: `60`;
- `ABOVE_AVERAGE`: `80`;
- `BRILLIANT`: `100`.

The category is authoritative. The numeric score is the canonical mechanical value.

True ability MUST NOT change after officer creation unless a typed injury, rehabilitation, or canonical personnel event explicitly changes it.

## 4. Initial Ability Knowledge

At officer creation, the player receives one `OfficerAbilityKnowledge` record containing:

- estimated ability score;
- confidence basis points;
- estimate interval minimum and maximum;
- observation month;
- source;
- knowledge version; and
- record hash.

The shipped initial confidence is exactly `2_500` basis points.

The initial estimate error band is exactly `30` score points around true ability, clamped to `0..100`.

The initial displayed estimate is generated once using stream:

`setup/officer/nation/ability_estimate`

The keyed error is an integer within `-30..30` inclusive with symmetric triangular distribution under `DESIGN-03` integer rules.

The player MUST NOT receive true ability, exact error, or hidden category through UI totals, sorting, automation, tooltips, or reports.

## 5. Ability Revelation

### 5.1 Confidence Growth

Ability confidence increases through service and battle evidence.

The shipped monthly and event gains are:

- each `12` completed service months: `+750` basis points;
- each completed month in active command: additional `+250` basis points;
- minor battle participation: `+500`;
- major battle participation: `+1_000`;
- decisive battle participation: `+1_500`;
- command investigation or formal review: `+2_000`;
- academy instructor or staff role: `+250` per 12 completed months.

At most one service gain and one active-command gain apply per 12-month service interval.

Confidence MUST remain within `0..10_000`.

### 5.2 Estimate Convergence

After confidence changes, estimate interval radius is:

`radius = ceiling((10_000 - confidenceBp) * 30 / 10_000)`

The interval is:

- minimum: `max(0, trueAbilityScore - radius)`;
- maximum: `min(100, trueAbilityScore + radius)`.

The displayed estimate is the previous estimate clamped into the new interval, unless a new evidence event explicitly recalculates it through the officer-knowledge stream.

At confidence `10_000`, radius is `0`, estimate equals true ability, and category is fully revealed.

### 5.3 Persistent Uncertainty

Estimates remain uncertain whenever confidence is below `10_000`.

Routine service alone is capped at `8_500` basis points. Reaching full revelation requires at least one major battle, decisive battle, formal review, or another explicit high-quality evidence source.

An officer may therefore retire or die with an uncertain estimate.

## 6. Officer Traits

The canonical officer traits are:

- `speed_enthusiast`;
- `rof_enthusiast`;
- `gunnery_expert`;
- `torpedo_expert`;
- `disciplinarian`;
- `music_lover`;
- `sportsman`;
- `lucky`;
- `aggressive`;
- `timid`;
- `well_connected`;
- `wily`;
- `poor_admin`;
- `poor_shiphandler`;
- `loose_cannon`;
- `good_administrator`; and
- `no_connections`.

Every trait MUST have a versioned effect definition. Trait text MUST NOT determine mechanics.

Mutually exclusive pairs are:

- `aggressive` and `timid`;
- `poor_admin` and `good_administrator`;
- `well_connected` and `no_connections`.

An invalid combination MUST fail with `OFFICER_TRAIT_CONFLICT`.

## 7. Command Eligibility

The shipped command eligibility is:

### Commander

May command:

- `CL` division;
- `DD` division;
- `KE` division; and
- eligible training or patrol divisions composed only of those types.

### Captain

May command:

- `CA`;
- `B`;
- `BB`;
- `BC`;
- `CV`;
- `CVL`;
- `CL`;
- `DD`; and
- eligible mixed divisions under `DESIGN-26`.

### Rear Admiral

May command:

- `CL` or heavier surface division;
- `CVL` or `CV` division;
- multi-division tactical force when command technology permits.

### Admiral

May command any eligible fleet, force, or division command authorized by the scenario and command model.

Destroyers do not require individual ship-command records. Their permanent division commander provides authoritative command.

One officer MUST NOT hold more than one active permanent command unless an explicit temporary acting-command contract applies.

## 8. Promotion Eligibility

Promotion eligibility MUST be evaluated during `RESOLVE_PERSONNEL_AND_READINESS` and during end-of-month officer administration.

The shipped standard service requirement is exactly `60` completed months in current rank.

Eligibility also requires:

- officer status `ACTIVE`;
- no unresolved disciplinary case;
- no command prohibition;
- minimum revealed estimate confidence of `4_000` basis points;
- minimum service evaluation score for the target rank;
- available establishment position or an explicit brevet policy; and
- age below the target rank's mandatory retirement age.

The shipped minimum service evaluation scores are:

- Commander to Captain: `50`;
- Captain to Rear Admiral: `60`;
- Rear Admiral to Admiral: `70`.

An officer becomes `STANDARD_ELIGIBLE` after all predicates pass.

## 9. Automatic Promotion

Automatic promotion is controlled by `automatic_promotion_v1`.

At end-of-month administration, eligible officers MUST be processed by:

1. target rank seniority descending;
2. service evaluation score descending;
3. months in rank descending;
4. current command priority descending;
5. officer identifier ascending.

Promotion occurs when an authorized establishment vacancy exists.

Automatic promotion consumes no randomness except the trait-transition check in Section 12.

If no vacancy exists, the officer remains eligible and receives no penalty.

## 10. Manual Promotion

A standard eligible officer may be promoted through `PromoteOfficerCommand` with zero political-capital cost when an establishment vacancy exists.

A manual promotion before `60` months is an early promotion and MUST use Section 11.

Manual promotion MUST NOT bypass rank, age, disciplinary, establishment, or target-rank evaluation requirements except where the early-promotion policy explicitly modifies months and score.

## 11. Early Manual Promotion

The shipped `early_promotion_v1` policy permits promotion from `48` through `59` completed months in rank.

Eligibility requires:

- revealed estimate confidence at least `6_000` basis points;
- service evaluation score at least `10` points above the standard target-rank minimum;
- no disciplinary case;
- an establishment vacancy;
- government authorization; and
- officer not promoted early within the previous `120` completed months.

The shipped cost is exactly `8` political-capital points.

If political capital is insufficient, the command MAY reference explicit alternative policy `early_promotion_confidence_cost_v1`, which costs exactly `2` institutional-confidence points. This alternative MUST be explicitly selected in the command and authorized by government policy.

Political capital and confidence costs MUST NOT both apply.

Promotion before `48` months is prohibited in the shipped ruleset with `EARLY_PROMOTION_TOO_SOON`.

## 12. Promotion Trait Outcomes

Every successful promotion MUST evaluate `promotion_trait_transition_v1` exactly once.

The check uses stream:

`officer/month/nation/promotion_trait`

The shipped probability of any trait transition is `2_500` basis points.

When a transition occurs, select one eligible outcome from explicit integer weights:

- add one positive command trait: `3_500`;
- remove one negative command trait: `2_500`;
- add one negative administrative trait: `1_500`;
- replace one connection trait: `1_000`;
- no mechanical trait change but record character development: `1_500`.

Weights total exactly `10_000`.

Eligible outcomes MUST respect trait conflicts, scenario restrictions, current rank, and explicit trait definitions.

A promotion MUST NOT invent an unregistered trait.

The outcome is authoritative and auditable. The player sees only information permitted by the trait visibility policy.

## 13. Promotion Result

A successful promotion MUST atomically:

- update current rank by exactly one level;
- append rank history;
- reset months in rank to `0`;
- apply the declared political cost;
- apply one promotion trait outcome record;
- reevaluate command eligibility;
- preserve officer identity and command history; and
- emit a causal and personnel-ledger record.

If the current command becomes illegal after promotion or government transition, command disposition MUST be explicit.

## 14. Command Vacancies

Every command vacancy MUST have one `CommandVacancy` containing:

- vacancy identifier;
- owner nation;
- command-position identifier;
- required and permitted ranks;
- ship or division eligibility;
- location and availability requirements;
- priority;
- urgency;
- creation cause;
- automation eligibility;
- player lock state; and
- record hash.

A vacancy is filled only by a normal officer-assignment command under `DESIGN-11`.

## 15. Deterministic Administrative Filling

System automation MUST use `vacancy_fill_v1` from `DESIGN-10`.

Vacancies MUST be ordered by:

1. command-level priority descending;
2. operational urgency descending;
3. vacancy identifier ascending.

Candidates MUST be ordered by:

1. eligibility pass;
2. service evaluation score descending;
3. rank seniority descending;
4. revealed administrative suitability descending;
5. months in rank descending;
6. officer identifier ascending.

The first candidate is selected. No randomness is consumed.

Automation MUST respect player locks, government policy, officer availability, command conflicts, legal knowledge, and authorization.

When no candidate exists, the vacancy remains and emits `NO_ELIGIBLE_OFFICER_FOR_VACANCY`.

## 16. Officer Removal

Removal requires `RemoveOfficerFromCommandCommand` and an explicit settlement policy.

The shipped base costs are:

- ordinary officer: `4` political-capital points;
- `well_connected` officer: `8` points;
- officer with `no_connections`: `2` points;
- officer subject to a proven disciplinary removal: `0` points.

Government policy MAY authorize institutional-confidence payment instead:

- ordinary officer: `1` confidence point;
- well-connected officer: `2` points;
- no-connections officer: `1` point.

Only one resource type may be charged.

Removal changes command assignment, not officer identity, rank, or service history.

## 17. Officer Status

Officer status MUST be one of:

- `ACTIVE`;
- `UNASSIGNED`;
- `ON_LEAVE`;
- `WOUNDED`;
- `INTERNED`;
- `DISMISSED`;
- `RETIRED`;
- `MISSING`; or
- `DECEASED`.

Only `ACTIVE` and `UNASSIGNED` officers may receive normal commands, subject to availability.

Terminal personal statuses are `RETIRED` and `DECEASED`.

## 18. Naval Academy Establishment

A nation may establish a naval academy only when:

- technology `naval_academy_establishment` is discovered and adopted;
- no active academy already exists unless an expansion policy permits it;
- government authorization is granted;
- infrastructure site and personnel predicates pass;
- establishment cost and capacity are reserved; and
- an accepted `EstablishNavalAcademyCommand` creates the project.

The shipped establishment project requires:

- duration: exactly `24` completed paid months;
- total establishment cost: `24_000_000` currency micro-units;
- project work: `24_000_000` work micro-units;
- infrastructure capacity: `1_000_000` work micro-units per month;
- commissioning month after project completion: `1` additional month.

A missing technology or project MUST fail with `NAVAL_ACADEMY_REQUIREMENTS_NOT_MET`.

## 19. Naval Academy State

Every academy MUST have one `NavalAcademyState` containing:

- academy identifier;
- nation and location;
- status;
- establishment project identifier;
- training tier;
- monthly operating cost;
- officer-candidate throughput;
- quality modifier;
- instructor assignments;
- damage and occupation state;
- last output month;
- ruleset version; and
- aggregate hash.

`status` MUST be `PLANNED`, `UNDER_CONSTRUCTION`, `COMMISSIONING`, `ACTIVE`, `SUSPENDED`, `DAMAGED`, or `DESTROYED`.

## 20. Naval Academy Output

The shipped active academy policy `naval_academy_output_v1` provides:

- baseline new-officer output without academy: `2` officers per year;
- academy additional output: `+2` officers per year;
- total with one active academy: `4` officers per year before national modifiers;
- output months: June and December, `2` officers each;
- quality adjustment: `+10` points to generated true-ability score before category mapping;
- generated score clamp: `0..100`;
- minimum one instructor of rank Captain or above; and
- instructor vacancy output multiplier: `5_000` basis points.

The academy does not reveal officer true ability.

New officer true-ability generation uses the normal setup or officer-generation stream with the explicit academy quality adjustment.

The academy MUST NOT guarantee an above-average officer.

## 21. Academy Recurring Cost

The shipped monthly operating cost is exactly `1_000_000` currency micro-units.

The permitted ruleset range is `750_000..1_500_000`.

Full payment produces full output and quality.

When payment is:

- at least `7_500` but below `10_000` basis points of required cost: output quantity multiplier `7_500`, quality adjustment `+5`;
- at least `5_000` but below `7_500`: output multiplier `5_000`, quality adjustment `0`;
- below `5_000`: academy status becomes `SUSPENDED`, output is `0`, quality adjustment is `0`.

Fractional annual output uses deterministic largest-remainder allocation across June and December.

Unpaid operating cost does not create arrears unless government policy explicitly marks it mandatory.

## 22. Academy Expansion

The shipped academy may be expanded once after technology `advanced_naval_academy`.

Expansion requires `12` completed paid months and costs `12_000_000` currency and work micro-units.

After expansion:

- additional output becomes `+4` officers per year instead of `+2`;
- total baseline output becomes `6` per year;
- quality adjustment becomes `+15` instead of `+10`;
- monthly operating cost becomes `1_500_000` currency micro-units.

No second expansion is permitted in the shipped ruleset.

## 23. Personnel Pools

Every nation MUST track separate authoritative pools:

- naval manpower;
- trained manpower;
- specialists;
- reservists;
- pilot pool; and
- officer establishment positions by rank.

One person-equivalent MUST NOT exist in two active pools simultaneously.

Transfers between pools require explicit training, mobilization, demobilization, casualty, retirement, or reassignment effects.

## 24. Ship Personnel Requirement

Every compiled design MUST declare:

- required naval manpower;
- required trained manpower;
- required specialists by category;
- required officers by command structure; and
- aviation personnel where applicable.

A newly completed ship cannot enter `WORKING_UP` until at least:

- `10_000` basis points of required officers are assigned;
- `9_000` basis points of required trained manpower are assigned;
- `9_000` basis points of required specialists are assigned; and
- `8_000` basis points of total required naval manpower are assigned.

A ship below these thresholds remains `UNAVAILABLE_PERSONNEL_SHORTAGE`.

Full `ACTIVE` status requires `10_000` basis points in every required category.

## 25. Personnel Knowledge and Privacy

Officer true ability and hidden traits are authoritative secrets.

Player and AI access MUST use knowledge assertions and their own visibility policies.

Personnel screens, sorting, automation, candidate scoring shown to the player, logs, and reports MUST use revealed estimates rather than true ability.

Authoritative administrative automation MAY use true legal eligibility but MUST use revealed suitability for discretionary ranking unless an explicit government policy grants a formal-review result.

A hidden-information leak MUST fail instrumentation with `OFFICER_HIDDEN_ABILITY_EXPOSED`.

## 26. Canonical Ordering

Personnel resolution MUST order:

1. officers by nation and officer identifier;
2. promotion vacancies by target rank descending and vacancy identifier;
3. automatic-promotion candidates by Section 9;
4. command vacancies and candidates by Section 15;
5. academy outputs by academy and output month;
6. personnel-pool transfers by priority and stable transfer identifier; and
7. knowledge records by officer and observation month.

Database insertion order, localized names, UI ordering, and wall-clock time MUST NOT affect results.

## 27. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_OFFICER_STATE`;
- `OFFICER_TRAIT_CONFLICT`;
- `OFFICER_COMMAND_INELIGIBLE`;
- `OFFICER_ALREADY_COMMANDING`;
- `OFFICER_PROMOTION_INELIGIBLE`;
- `EARLY_PROMOTION_TOO_SOON`;
- `INSUFFICIENT_POLITICAL_CAPITAL`;
- `PROMOTION_ESTABLISHMENT_VACANCY_REQUIRED`;
- `PROMOTION_TRAIT_OUTCOME_INVALID`;
- `NO_ELIGIBLE_OFFICER_FOR_VACANCY`;
- `OFFICER_REMOVAL_INELIGIBLE`;
- `NAVAL_ACADEMY_REQUIREMENTS_NOT_MET`;
- `NAVAL_ACADEMY_SUSPENDED_UNPAID`;
- `NAVAL_ACADEMY_EXPANSION_LIMIT_REACHED`;
- `SHIP_PERSONNEL_REQUIREMENT_NOT_MET`;
- `OFFICER_HIDDEN_ABILITY_EXPOSED`; and
- `PERSONNEL_STATE_INVARIANT_FAILED`.

## 28. Validation and Acceptance

Automated validation MUST prove that:

1. every officer has stable identity, rank, command history, true ability, knowledge, traits, experience, status, and eligibility state;
2. true ability remains hidden until confidence reaches 10,000;
3. initial confidence is exactly 2,500 basis points and initial error lies within -30 through +30;
4. service and battle evidence use the exact declared confidence gains;
5. routine service confidence is capped at 8,500;
6. confidence maps to the exact shrinking interval formula;
7. estimates may remain uncertain through retirement or death;
8. command eligibility follows exact rank and ship-type rules;
9. standard promotion requires exactly 60 completed months in rank;
10. promotion advances exactly one rank;
11. automatic promotion uses deterministic vacancy and candidate ordering;
12. standard manual promotion costs zero political capital when fully eligible;
13. early promotion is permitted only from 48 through 59 months;
14. early promotion costs exactly eight political-capital points or explicitly selected two confidence points, never both;
15. promotion before 48 months is rejected;
16. promotion trait transition uses exactly 2,500 basis points and weights totaling 10,000;
17. unregistered or conflicting traits cannot be produced;
18. administrative vacancy filling consumes no randomness and uses normal commands;
19. officer removal uses exact connection-based costs;
20. academy establishment requires technology, a 24-month project, cost, work, and one-month commissioning;
21. a baseline academy increases annual officer output from two to four;
22. academy quality adjustment is exactly +10 and does not reveal true ability;
23. academy recurring cost is exactly 1,000,000 currency micro-units per month;
24. partial payment uses exact output and quality bands;
25. academy expansion uses 12 months, 12,000,000 cost and work, six officers per year, +15 quality, and 1,500,000 monthly cost;
26. personnel pools remain separate and balanced;
27. working-up and active ships satisfy the exact personnel thresholds;
28. UI and discretionary automation do not use hidden true ability; and
29. identical state, commands, content, ruleset, and seeds produce identical estimates, promotions, traits, vacancy assignments, academy output, personnel allocations, records, and hashes.
