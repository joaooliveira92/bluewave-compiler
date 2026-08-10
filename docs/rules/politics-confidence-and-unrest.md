# DESIGN-18: Politics, Confidence, And Unrest

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-18`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Political state, confidence, political capital, unrest, exhaustion, mandates, and revolution MUST use the explicit values, predicates, formulas, phase bindings, ordering, and failure behavior defined here. Runtime inference from prose is prohibited.

## 1. Political State

Every active nation MUST have one authoritative `PoliticalState` containing:

- `nationId`;
- `institutionalConfidence`;
- `politicalCapital`;
- `domesticUnrest`;
- ordered war-exhaustion records;
- ordered colonial-unrest records;
- `governmentConfidence`;
- ordered active mandate identifiers;
- `revolutionPressure`;
- `revolutionCooldownUntilMonth` or `NONE`;
- political ledger position;
- ruleset version; and
- aggregate hash.

Unless an owning contract states otherwise, bounded political scores use integer range `0..100` inclusive.

A missing or invalid state MUST fail with `INVALID_POLITICAL_STATE`.

## 2. Political Ledger

Every political state change MUST append one immutable `PoliticalEffectRecord` containing:

- effect identifier;
- nation identifier;
- campaign month and phase;
- affected field;
- pre-effect value;
- signed delta or replacement value;
- unclamped result;
- post-effect value;
- cause type and cause identifier;
- formula identifier and version;
- reason code;
- visibility policy; and
- record hash.

Effects MUST be applied in canonical phase order and then ascending stable cause identifier.

Direct unrecorded mutation MUST fail with `UNLEDGERED_POLITICAL_MUTATION`.

## 3. Institutional Confidence

### 3.1 Meaning and Compatibility

`institutionalConfidence` is the sole authoritative dismissal variable representing trust in the continuing naval administration.

The legacy term `prestige` MUST map to `institutionalConfidence` for migration and presentation only. A second authoritative prestige value is prohibited.

Institutional confidence MUST remain within `0..100` inclusive.

### 3.2 Dismissal-Risk Threshold

A closing value at or below exactly `16` creates `DISMISSAL_RISK`.

Values `17..100` do not create dismissal risk.

Crossing the threshold MUST NOT dismiss the administration immediately. Dismissal MUST be evaluated only during `EVALUATE_TERMINAL_CONDITIONS` under `DESIGN-02`.

### 3.3 Dismissal Predicate

The shipped predicate `naval_administration_dismissal_v1` is true when all conditions hold:

- institutional confidence is at or below `16`;
- the current phase is `EVALUATE_TERMINAL_CONDITIONS`;
- no canonical event or supported continuity transition has already restored confidence above `16` before this phase; and
- a deterministic dismissal check succeeds.

The shipped dismissal probability is:

- confidence `13..16`: `2_500` basis points;
- confidence `9..12`: `5_000` basis points;
- confidence `5..8`: `7_500` basis points;
- confidence `0..4`: `10_000` basis points.

The check MUST use stream `politics/month/nation/dismissal` keyed by campaign month, nation, predicate version, and confidence value.

A failed check leaves the campaign active and records `DISMISSAL_RISK_SURVIVED`. At most one dismissal check may occur per nation per month.

### 3.4 Confidence Effects

The shipped confidence effect policy is:

- `DECISIVE_VICTORY`: `+3`;
- `MAJOR_VICTORY`: `+2`;
- `MINOR_VICTORY`: `+1`;
- `MINOR_DEFEAT`: `-1`;
- `MAJOR_DEFEAT`: `-3`;
- `DECISIVE_DEFEAT`: `-5`;
- balanced monthly finances with all obligations paid: `+1`, at most once per 12 completed months;
- insolvency consequence: defined by `DESIGN-13`;
- mandate success: mandate-defined, default `+2` only when explicitly referenced;
- mandate failure: mandate-defined, no implicit default;
- foreign-station full compliance for 12 consecutive months: `+1`;
- foreign-station noncompliance: `-1` per noncompliant month after grace periods;
- preparedness success or failure: objective or event-defined;
- event choice: exact typed effect in the event definition.

Battle-result classifications MUST come from the battle contract. Narrative labels MUST NOT determine confidence.

### 3.5 Proportional Loss Formula

When a contract requires confidence loss proportional to loss magnitude, it MUST use `proportional_confidence_loss_v1`:

`lossRatioBp = floor(relevantLossValue * 10_000 / max(1, relevantBaselineValue))`

The shipped loss is:

- `0..499` basis points: `0` confidence;
- `500..1_499`: `1`;
- `1_500..2_999`: `2`;
- `3_000..4_999`: `3`;
- `5_000..7_499`: `5`;
- `7_500..10_000`: `8`.

The owning event MUST declare `relevantLossValue` and `relevantBaselineValue`. Missing operands MUST fail with `PROPORTIONAL_CONFIDENCE_INPUT_MISSING`.

## 4. Political Capital

Political capital is an integer spendable resource within `0..100` inclusive.

Spending political capital MUST use a validated command, reserve the exact amount, and append a political-ledger record.

Political-capital spending MUST NOT directly change institutional confidence. Any confidence effect requires a separate explicit typed effect.

Insufficient capital MUST reject the command with `INSUFFICIENT_POLITICAL_CAPITAL`.

## 5. Canonical Political-Capital Actions

### 5.1 Reject Mandate

- command: `RejectMandateCommand`;
- shipped base cost: `10` political-capital points;
- permitted ruleset range: `5..25`;
- eligibility: mandate explicitly permits refusal and is not locked by an irreversible phase;
- result: mandate receives `REFUSED` disposition;
- confidence, budget, and government consequences: mandate-defined typed effects only.

### 5.2 Negotiate Mandate

- command: `NegotiateMandateCommand`;
- shipped base cost: `5` points;
- permitted range: `2..15`;
- maximum negotiation attempts per mandate: `1`;
- success resolution: deterministic option selection from the mandate's explicit negotiation options;
- randomness: prohibited unless the mandate defines a keyed political decision.

Negotiation MUST NOT invent a deadline, requirement, reward, or penalty.

### 5.3 Protect Project

- command: `ProtectProjectCommand`;
- shipped cost: `8` points;
- protection duration: `12` completed months;
- effect: project is ineligible for discretionary political cancellation or reclamation during protection;
- exclusions: treaty illegality, physical impossibility, insolvency, owner cancellation, and mandatory legal termination remain valid.

Protection MUST NOT provide money, capacity, work, or technology.

### 5.4 Accelerate Approval

- command: `AccelerateApprovalCommand`;
- shipped cost: `6` points;
- effect: reduces the remaining political approval duration by exactly `1` completed month;
- minimum remaining duration after reduction: `0` months;
- maximum uses per approval: `2`;
- physical project work and construction duration are unchanged.

### 5.5 Reduce Political Penalty

- command: `MitigatePoliticalPenaltyCommand`;
- shipped cost: `1` political-capital point per prevented penalty point;
- maximum prevention: `50%` of the original positive penalty magnitude, rounded down;
- minimum unmitigated penalty: `1` point when the original penalty is positive;
- eligibility: the penalty definition explicitly permits mitigation.

The command MUST identify the pending penalty record. It MUST NOT reverse an already committed penalty.

## 6. Domestic Unrest

Domestic unrest is a nation-level integer within `0..100` inclusive.

It MUST be resolved during `RESOLVE_POLITICAL_END_OF_MONTH_EFFECTS` using:

`monthlyDomesticUnrestDelta = militarySpendingDelta + warDurationDelta + blockadeDelta + shortageDelta + defeatDelta + accommodationDelta + taxationDelta + sumEventDelta`

The shipped modifiers are:

- paid military expenditure below `1_000` basis points of base resources: `0`;
- `1_000..1_499`: `+1`;
- `1_500..1_999`: `+2`;
- `2_000` or more: `+3`;
- peace month: war-duration delta `0`;
- active war months `1..6`: `0`;
- `7..12`: `+1`;
- `13..24`: `+2`;
- `25` or more: `+3`;
- contested blockade: `+1`;
- established blockade: `+3`;
- shortage: `+2`;
- critical shortage: `+5`;
- minor defeat: `+1`;
- major defeat: `+3`;
- decisive defeat: `+5`;
- explicit accommodation or taxation effects: event or policy-defined.

Only the highest defeat delta and highest shortage delta apply per month. Event deltas stack in ascending event identifier order.

Final unrest MUST be clamped once to `0..100`.

## 7. Domestic-Unrest Consequences

The shipped thresholds are:

- unrest `40`: budget-pressure event eligibility;
- unrest `60`: strike event eligibility;
- unrest `80`: nationwide-crisis event eligibility;
- unrest `90`: revolution contributes maximum unrest pressure.

Crossing or remaining above a threshold enqueues its typed event only when cooldown passes.

Shipped cooldowns are:

- budget pressure: `6` months;
- strike: `6` months;
- nationwide crisis: `12` months.

Unrest values MUST NOT directly alter treasury, budget, production, or government without a typed effect.

## 8. War Exhaustion

### 8.1 Separate War-Scoped State

War exhaustion is separate from domestic unrest and MUST be stored per nation and active war.

Every `WarExhaustionState` MUST contain:

- `warId`;
- `nationId`;
- exhaustion score within `0..100`;
- war-entry month;
- opening adjustment applied flag;
- duration contribution;
- defeat contribution;
- blockade contribution;
- casualty contribution;
- shortage contribution;
- event contribution;
- last resolution month; and
- record hash.

A nation in multiple wars MUST have separate exhaustion records.

### 8.2 War-Entry Adjustment

At war entry, apply exactly one government-specific adjustment:

- `liberal_democracy`: `-2`;
- `limited_democracy`: `-1`;
- `autocratic`: `0`;
- `fascist`: `-2`;
- `communist`: `-1`;
- `eastern`: `0`.

The result is clamped to `0..100`. This adjustment may reduce or stabilize exhaustion but cannot make it negative.

### 8.3 Monthly Increase

Beginning after the first completed war month:

`monthlyWarExhaustionDelta = durationDelta + defeatDelta + blockadeDelta + casualtyDelta + shortageDelta + sumEventDelta`

The shipped values are:

#### Duration

- completed war months `1..6`: `0`;
- `7..12`: `1`;
- `13..24`: `2`;
- `25..36`: `3`;
- `37` or more: `4`.

#### Defeat

- no defeat or victory: `0`;
- minor defeat: `1`;
- major defeat: `3`;
- decisive defeat: `5`.

Only the highest defeat level for the nation in that war applies per month.

#### Blockade

- none or attempted: `0`;
- contested: `1`;
- established: `3`;
- established with critical shortage: `5` total blockade contribution.

#### Casualties

Use monthly military casualty ratio against mobilized personnel:

- below `100` basis points: `0`;
- `100..249`: `1`;
- `250..499`: `2`;
- `500..999`: `4`;
- `1_000` or more: `6`.

#### Shortage

- no shortage: `0`;
- shortage: `2`;
- critical shortage: `5`.

Final exhaustion MUST be clamped once to `0..100`.

### 8.4 Peace Recovery

When a nation exits a war, the final exhaustion value moves to a non-active recovery record.

During each peace month, recovery is exactly `-3` points until zero. Event effects MAY modify recovery explicitly.

## 9. Colonial Unrest

Colonial unrest MUST be stored per possession within `0..100`.

Monthly delta is:

- foreign-station protection below `7_500` basis points of requirement: `+2`;
- zero qualifying protection: `+4` instead of `+2`;
- foreign occupation: `+5`;
- contested control: `+3`;
- decolonization pressure `60..79`: `+2`;
- pressure `80..100`: `+4`;
- explicit event delta;
- compliant protection and pressure below `40`: recovery `-1`.

Only one protection delta and one pressure delta apply per month.

Colonial unrest MUST feed only explicit autonomy, independence, income, occupation, and event formulas.

## 10. Political Mandates

Every mandate MUST have one authoritative `PoliticalMandate` containing:

- `mandateId`;
- issuing authority identifier;
- target nation;
- requirement type and typed parameters;
- issue month;
- deadline month;
- compliance predicate identifier;
- evaluation phase;
- reward effects;
- failure effects;
- refusal eligibility;
- refusal cost;
- negotiation options;
- protection eligibility;
- expiration behavior;
- status;
- content version; and
- record hash.

`status` MUST be one of:

- `ISSUED`;
- `ACTIVE`;
- `NEGOTIATED`;
- `COMPLIED`;
- `FAILED`;
- `REFUSED`;
- `EXPIRED`; or
- `CANCELLED_BY_TYPED_EFFECT`.

A mandate MUST NOT derive mechanics from descriptive text.

## 11. Revolution Pressure

Revolution pressure is an integer within `0..100` and is separate from unrest and war exhaustion.

During political end-of-month resolution:

`revolutionPressureDelta = domesticUnrestContribution + warExhaustionContribution + governmentContribution + blockadeContribution + defeatContribution + insolvencyContribution + eventContribution`

The shipped contributions are:

### 11.1 Domestic Unrest

- unrest `0..59`: `0`;
- `60..69`: `2`;
- `70..79`: `4`;
- `80..89`: `7`;
- `90..100`: `10`.

### 11.2 Highest Active War Exhaustion

- exhaustion `0..59`: `0`;
- `60..69`: `1`;
- `70..79`: `3`;
- `80..89`: `5`;
- `90..100`: `8`.

### 11.3 Government

- `liberal_democracy`: `-4`;
- `limited_democracy`: `-2`;
- `autocratic`: `1`;
- `fascist`: `1`;
- `communist`: `-1`;
- `eastern`: `0`.

This concrete negative modifier makes revolution less likely in liberal democracies.

### 11.4 Other Factors

- established blockade: `3`;
- decisive defeat this month: `5`;
- persistent insolvency: `4`;
- no active qualifying pressure and domestic unrest below `40`: recovery `-3`;
- typed events: explicit signed deltas.

Final pressure MUST be clamped once to `0..100`.

## 12. Revolution Eligibility

A revolution evaluation is eligible only when all predicates hold:

- revolution pressure is at least `70`;
- domestic unrest is at least `60`;
- no revolution evaluation occurred in the previous `12` completed months;
- government and scenario permit revolution;
- no canonical transition already scheduled for the same phase;
- a valid revolution outcome table exists; and
- the current phase is `RESOLVE_POLITICAL_END_OF_MONTH_EFFECTS`.

At pressure `70..84`, monthly revolution probability is `1_500` basis points.

At pressure `85..94`, probability is `4_000` basis points.

At pressure `95..100`, probability is `8_000` basis points.

Government probability multipliers are:

- `liberal_democracy`: `5_000` basis points;
- `limited_democracy`: `7_500`;
- `autocratic`: `12_500`;
- `fascist`: `11_000`;
- `communist`: `8_000`;
- `eastern`: `10_000`.

`finalProbabilityBp = min(10_000, floor(baseProbabilityBp * governmentMultiplierBp / 10_000))`

The check MUST use stream `politics/month/nation/revolution`.

Failure records `REVOLUTION_CHECK_FAILED` and starts the `12`-month cooldown. Success creates a typed revolution event.

## 13. Revolution Resolution

A successful check MUST select exactly one outcome from an explicit versioned `RevolutionOutcomeTable`.

Every outcome MUST declare:

- outcome identifier and integer weight;
- government-transition effect;
- war-participation disposition per active war;
- peace-negotiation or harsh-terms effect;
- possession and control effects;
- mandate and objective effects;
- institutional-confidence effect;
- officer-eligibility policy;
- successor-state definition or `NONE`;
- continuity-definition identifier or `NONE`;
- terminal-continuation behavior; and
- causal event effects.

Outcome selection MUST use the same revolution stream with a distinct keyed decision and ascending outcome identifier order.

The resolver MUST NOT invent a government, peace term, war exit, territorial transfer, or successor state.

## 14. Revolution Effects

A revolution MAY perform only effects declared by its selected outcome.

### 14.1 Government Change

Government and regime changes MUST apply atomically and reevaluate traits, mandates, officer eligibility, treaty policies, and mobilization.

### 14.2 War Participation

For each active war, the outcome MUST choose exactly one:

- `REMAIN`;
- `SEEK_SEPARATE_PEACE`;
- `EXIT_BY_TYPED_SETTLEMENT`;
- `CHANGE_SIDE`, only when a canonical war contract explicitly permits it.

Omission MUST fail with `REVOLUTION_WAR_DISPOSITION_MISSING`.

### 14.3 Harsh Peace Terms

A revolution MAY enqueue a peace negotiation with `revolutionary_defeat` context. It MUST NOT mutate settlement terms directly.

### 14.4 Successor States

A successor state may be created only from explicit canonical identity and continuity content.

The successor definition MUST identify nation identity, scenario nation instance, territory, government, economy, diplomacy, objectives, fleet disposition, officers, and playable-slot relationship.

Runtime derivation from names, territory, ideology, or history is prohibited.

## 15. Revolution and Campaign Continuity

Revolution is non-terminal by itself.

After revolution effects apply, the continuity evaluator in `DESIGN-02` MUST run.

If exactly one supported continuation exists, the campaign MUST continue under that definition.

If no supported continuation exists and the outcome declares termination when unsupported, terminal evaluation MAY produce `NO_SUPPORTED_CONTINUATION` only during `EVALUATE_TERMINAL_CONDITIONS`.

The revolution phase MUST NOT terminate the campaign directly.

## 16. Government Confidence

Government confidence is separate from institutional confidence and uses integer range `0..100`.

It represents the current regime's confidence in its broader governing position. It MAY affect mandate frequency, budget policy, cabinet stability, and revolution formulas only through explicit policies.

Government confidence MUST NOT substitute for institutional confidence in dismissal checks.

## 17. Canonical Ordering

During political resolution:

1. war-exhaustion records MUST be ordered by war identifier;
2. colonial-unrest records by possession identifier;
3. mandates by deadline and mandate identifier;
4. event effects by declared effect ordinal;
5. political-capital commands by canonical command order;
6. revolution predicates after unrest and exhaustion updates; and
7. terminal dismissal only in the later terminal-evaluation phase.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect outcomes.

## 18. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_POLITICAL_STATE`;
- `UNLEDGERED_POLITICAL_MUTATION`;
- `DISMISSAL_RISK`;
- `DISMISSAL_RISK_SURVIVED`;
- `NAVAL_ADMINISTRATION_DISMISSED`;
- `PROPORTIONAL_CONFIDENCE_INPUT_MISSING`;
- `INSUFFICIENT_POLITICAL_CAPITAL`;
- `POLITICAL_ACTION_INELIGIBLE`;
- `MANDATE_REFUSAL_NOT_ALLOWED`;
- `MANDATE_NEGOTIATION_ALREADY_USED`;
- `PROJECT_PROTECTION_INELIGIBLE`;
- `APPROVAL_ACCELERATION_LIMIT_REACHED`;
- `POLITICAL_PENALTY_NOT_MITIGABLE`;
- `REVOLUTION_INELIGIBLE`;
- `REVOLUTION_CHECK_FAILED`;
- `REVOLUTION_TRIGGERED`;
- `REVOLUTION_OUTCOME_TABLE_MISSING`;
- `REVOLUTION_WAR_DISPOSITION_MISSING`;
- `REVOLUTION_SUCCESSOR_UNDEFINED`; and
- `POLITICAL_STATE_INVARIANT_FAILED`.

## 19. Validation and Acceptance

Automated validation MUST prove that:

1. institutional confidence is the only dismissal variable;
2. legacy prestige does not create separate authority;
3. confidence `16` creates dismissal risk and `17` does not;
4. dismissal checks occur only during terminal evaluation;
5. the shipped dismissal probabilities are exactly 2,500, 5,000, 7,500, and 10,000 basis points for the declared bands;
6. at most one dismissal check occurs per month;
7. confidence changes use explicit typed effects and declared battle-result classes;
8. proportional loss uses the exact declared bands and operands;
9. political capital remains within `0..100`;
10. spending political capital never directly lowers institutional confidence;
11. mandate rejection costs 10, negotiation 5, project protection 8, and approval acceleration 6 points in the shipped ruleset;
12. project protection lasts 12 months and does not supply resources;
13. approval acceleration reduces political approval by exactly one month per use with a maximum of two uses;
14. mitigation prevents at most 50% of an eligible penalty;
15. domestic unrest uses the exact military-spending, war-duration, blockade, shortage, and defeat bands;
16. war exhaustion is stored separately for every active war;
17. war-entry adjustments use the exact government values;
18. monthly war exhaustion uses the exact duration, defeat, blockade, casualty, and shortage bands;
19. peace recovery is exactly three points per month;
20. colonial unrest remains possession-scoped;
21. every mandate contains authority, requirement, deadline, compliance, reward, failure, refusal, negotiation, and expiration data;
22. revolution pressure uses the exact unrest, exhaustion, government, blockade, defeat, insolvency, and recovery values;
23. liberal democracy applies both the `-4` pressure modifier and `5_000` probability multiplier;
24. revolution requires pressure at least 70 and unrest at least 60;
25. revolution probabilities use exactly 1,500, 4,000, and 8,000 basis points before government modification;
26. revolution checks use the declared stream and 12-month cooldown;
27. outcomes come only from explicit weighted tables;
28. every active war receives an explicit revolution disposition;
29. harsh peace uses negotiation rather than direct mutation;
30. successor states require complete canonical identity and continuity content;
31. revolution never terminates the campaign directly;
32. supported continuation preserves the campaign under `DESIGN-02`; and
33. identical state, commands, events, content, ruleset, and seeds produce identical political, confidence, capital, unrest, exhaustion, mandate, revolution, ledger, and hash results.
