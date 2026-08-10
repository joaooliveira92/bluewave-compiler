# DESIGN-19: Strategic Objectives

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-19`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Objective assignment, priority influence, AI planning, compliance, scoring, and final evaluation MUST use the explicit fields, values, predicates, phase bindings, ordering, and failure behavior defined here. Runtime inference from descriptive text is prohibited.

## 1. Objective Types

The canonical objective type identifiers are:

- `MAINTAIN_FLEET_PARITY`;
- `PROTECT_POSSESSIONS`;
- `DEFEND_TRADE`;
- `EXPAND_REGIONAL_INFLUENCE`;
- `SECURE_OIL_ACCESS`;
- `AVOID_WAR_WITH_POWER`;
- `CONTAIN_RIVAL`;
- `MODERNIZE_FORCE_CATEGORY`;
- `MEET_TREATY_OBLIGATIONS`; and
- `RECOVER_OR_RETAIN_TERRITORY`.

A ruleset MAY add another objective type only through a versioned design revision and complete `ObjectiveTypeDefinition`.

Display names and narrative descriptions MUST NOT determine objective mechanics.

## 2. Objective Type Definition

Every objective type MUST have one immutable `ObjectiveTypeDefinition` containing:

- `objectiveTypeId`;
- target schema identifier;
- parameter schema identifier;
- assignment-eligibility predicate identifier;
- progress formula identifier;
- success predicate identifier;
- failure predicate identifier;
- expiry policy identifier;
- AI utility mapping identifier;
- career-evaluation mapping identifier;
- visibility policy identifier;
- political reward and penalty schemas;
- permitted priority range;
- permitted duration range;
- owning design-contract identifier;
- content version; and
- content hash.

A missing predicate, formula, mapping, or schema MUST fail with `INVALID_OBJECTIVE_TYPE_DEFINITION`.

## 3. Strategic Objective State

Every assigned objective MUST create one authoritative `StrategicObjective` containing:

- `objectiveId`;
- `objectiveTypeId`;
- `ownerNationId`;
- `issuingAuthorityId`;
- typed target identifiers;
- typed parameters;
- `basePriority`;
- `currentPriority`;
- `startCampaignMonth`;
- `deadlineCampaignMonth` or `NONE`;
- `evaluationPhaseId`;
- `status`;
- current progress value;
- progress scale;
- success predicate identifier and version;
- failure predicate identifier and version;
- political reward effects;
- political penalty effects;
- visibility state;
- player-influence state;
- AI utility contribution;
- final-evaluation contribution policy;
- assignment cause identifier;
- content and ruleset versions; and
- record hash.

`status` MUST be exactly one of:

- `PROPOSED`;
- `ACTIVE`;
- `SUCCEEDED`;
- `FAILED`;
- `CANCELLED_WITHOUT_SCORE`;
- `REPLACED`;
- `EXPIRED`; or
- `SUSPENDED`.

Terminal objective statuses are immutable except through a save migration that preserves meaning.

## 4. Priority Scale

Objective priority MUST be an integer within `1..5` inclusive:

- `1`: marginal;
- `2`: secondary;
- `3`: important;
- `4`: major;
- `5`: critical.

Labels are presentation-only. Mechanics use the integer.

The active ruleset MUST provide these shipped priority weights:

- priority `1`: `500` basis points;
- priority `2`: `1_000` basis points;
- priority `3`: `2_000` basis points;
- priority `4`: `3_000` basis points;
- priority `5`: `3_500` basis points.

These weights are used only within objective-guided AI utility and objective-dimension career evaluation. They MUST NOT be interpreted as automatic budget percentages.

A value outside `1..5` MUST fail with `OBJECTIVE_PRIORITY_OUT_OF_RANGE`.

## 5. Government Assignment Authority

Only the active national government, an authority explicitly delegated by that government, or a canonical scenario event MAY assign a national objective.

Every authority MUST have one `ObjectiveIssuingAuthorityDefinition` containing:

- `issuingAuthorityId`;
- eligible government types and regimes;
- permitted objective types;
- assignment phase;
- concurrent-objective limit;
- priority limits;
- deadline limits;
- replacement and cancellation permissions;
- player-influence permissions; and
- policy version.

The shipped concurrent active-objective limit is exactly `5` per nation.

The shipped limits are:

- maximum `2` active objectives at priority `5`;
- maximum `3` active objectives at priority `4` or above;
- maximum `5` total active objectives.

No objective may be assigned when these limits would be exceeded. Assignment MUST fail with `OBJECTIVE_CAPACITY_EXCEEDED`.

The player MUST NOT create an objective directly.

## 6. Objective Assignment

Government objective assignment MUST occur only during:

- campaign compilation;
- `APPLY_SCHEDULED_NATIONAL_EVENTS`;
- an accepted typed government event;
- an accepted continuity transition; or
- `RESOLVE_POLITICAL_AND_BUDGET_CHANGES` when a mandate explicitly creates an objective.

Every assignment MUST:

1. identify the issuing authority;
2. validate objective-type eligibility;
3. validate target existence and visibility requirements;
4. validate priority and deadline;
5. validate concurrent-objective limits;
6. create one immutable assignment record;
7. create the authoritative objective in `ACTIVE` state; and
8. emit a causal and political-ledger record.

Objective assignment MUST consume no randomness unless the assigning event explicitly performs deterministic weighted selection through the politics event stream.

Missing required data MUST fail with `OBJECTIVE_ASSIGNMENT_INCOMPLETE`.

## 7. Government Objective-Selection Policy

An AI-controlled or system-controlled government selecting among eligible objectives MUST use `government_objective_selection_v1`.

Each candidate MUST receive an integer selection score:

`selectionScore = strategicNeedScore + governmentPreferenceScore + objectiveCompatibilityScore + threatScore + continuityScore + eventScore`

Each component MUST be within `-10_000..10_000`.

Candidates MUST be ordered by:

1. descending selection score;
2. descending proposed priority;
3. ascending objective type identifier;
4. ascending target identifier.

The first candidate that fits all capacity limits MUST be selected. Selection consumes no randomness unless the assigning event definition explicitly requires a keyed draw.

The policy MUST use only legal government knowledge and declared information assistance.

## 8. Player Influence

The player may influence an objective only through:

- an accepted political-capital command; or
- an explicit typed event choice.

Player influence MUST NOT change objective type, target, deadline, success predicate, failure predicate, reward, or penalty unless the objective or event explicitly provides that option.

Direct UI mutation of objective priority is prohibited.

## 9. Priority Influence with Political Capital

### 9.1 Command

Priority influence MUST use `InfluenceObjectivePriorityCommand`.

The command MUST identify:

- objective identifier;
- requested direction `INCREASE` or `DECREASE`;
- requested change of exactly one priority level;
- political-capital amount;
- expected current priority;
- government authorization context; and
- idempotency key.

### 9.2 Costs

The shipped political-capital costs are:

- increase priority `1 -> 2`: `2` points;
- `2 -> 3`: `3` points;
- `3 -> 4`: `5` points;
- `4 -> 5`: `8` points;
- decrease priority `5 -> 4`: `4` points;
- `4 -> 3`: `3` points;
- `3 -> 2`: `2` points;
- `2 -> 1`: `1` point.

Only one level may change per accepted command.

A player may modify the same objective at most once per `12` completed months through political capital.

### 9.3 Eligibility

Influence is eligible only when:

- objective status is `ACTIVE`;
- issuing authority permits priority influence;
- requested priority remains within `1..5`;
- no objective-capacity limit would be violated;
- objective is not within the final `3` months before its deadline;
- no government lock or event lock applies; and
- sufficient political capital is reserved.

An ineligible command MUST fail with `OBJECTIVE_PRIORITY_INFLUENCE_INELIGIBLE`.

### 9.4 Effects

An accepted command MUST:

- consume the exact political-capital cost;
- change `currentPriority` by exactly one;
- preserve `basePriority`;
- record the influence month and direction;
- update AI and final-evaluation weights from the next applicable evaluation phase; and
- produce a causal record.

Spending political capital MUST NOT directly change institutional confidence.

## 10. Event-Based Influence

An event choice may alter objective priority only through typed effect `ADJUST_OBJECTIVE_PRIORITY`.

The effect MUST specify:

- objective identifier or deterministic targeting predicate;
- signed integer delta;
- minimum and maximum resulting priority;
- duration `PERMANENT` or exact months;
- restoration behavior for temporary changes;
- cause identifier; and
- political effects.

The runtime MUST NOT infer priority effects from hawkish, dovish, patriotic, cautious, or other descriptive labels.

If an event affects several eligible objectives, targets MUST be ordered by descending current priority and ascending objective identifier unless the event declares another deterministic order.

## 11. Objective Progress

Objective progress MUST be recalculated at its declared evaluation phase from authoritative state and legal observations required by the objective contract.

Every progress calculation MUST produce an `ObjectiveProgressRecord` containing:

- objective identifier;
- evaluation month and phase;
- input state and knowledge hashes;
- progress formula and version;
- ordered inputs;
- unrounded result;
- rounding mode;
- final progress;
- success predicate result;
- failure predicate result;
- status transition or `NONE`; and
- record hash.

Progress MUST NOT be incremented from report text or UI state.

When both success and failure predicates are true in one evaluation, the objective type's explicit precedence rule applies. Missing precedence MUST fail with `OBJECTIVE_TERMINAL_PRECEDENCE_MISSING`.

## 12. Canonical Objective Mechanics

### 12.1 Maintain Fleet Parity

Parameters MUST identify rival nation, eligible force categories, comparison metric, target ratio, and evaluation window.

The shipped target ratio is `9_000` basis points of known or authoritative eligible rival strength, according to the objective visibility policy.

Success requires the ratio to remain at or above target for `12` consecutive closing snapshots before deadline.

Failure occurs at deadline when the condition has not been sustained.

### 12.2 Protect Possessions

Parameters MUST list protected possessions and permitted loss duration.

The shipped rule permits no more than `3` consecutive completed months of foreign military control for each protected possession.

Success occurs at deadline when every listed possession is legally owned and not foreign occupied.

Failure occurs immediately when legal ownership is transferred away unless the objective explicitly permits recovery before deadline.

### 12.3 Defend Trade

Parameters MUST define merchant-loss ceiling, trade-protection compliance target, and rolling window.

The shipped targets are:

- trade-protection compliance at least `10_000` basis points;
- merchant losses no greater than `500` basis points of opening merchant capacity over a rolling `12` months.

### 12.4 Expand Regional Influence

Parameters MUST identify region, influence metric, required increase, and deadline.

The shipped required increase is `20` influence points on the region's `0..100` scale.

Influence MUST arise only through typed diplomatic, territorial, basing, treaty, or event effects.

### 12.5 Secure Oil Access

Success requires at least one explicit oil-access source and, for wartime objectives, either controlled production or a valid wartime import route.

The objective MUST declare whether peacetime international market access is sufficient. The shipped default is:

- peacetime objective: market access is sufficient from January 1920;
- wartime objective: market access alone is insufficient.

### 12.6 Avoid War with Named Power

Parameters MUST identify exactly one named power and deadline.

Success occurs when the deadline closes without the owner and target having been opposing participants in any active war during the objective interval.

Failure occurs immediately upon opposing war participation.

### 12.7 Contain Rival

Parameters MUST identify rival, region, permitted rival-influence increase, and optional force-ratio minimum.

The shipped permitted rival-influence increase is `10` points. The shipped force-ratio minimum, when enabled, is `8_000` basis points.

### 12.8 Modernize Force Category

Parameters MUST identify ship category, qualifying technology or design threshold, and target qualifying-tonnage ratio.

The shipped target is `6_000` basis points, equal to `60%`, of active and reserve tonnage in the category.

Mothballed, sunk, captured, and under-construction ships do not qualify unless the objective explicitly includes them.

### 12.9 Meet Treaty Obligations

Parameters MUST identify treaty and compliance period.

The shipped success requirement is `12` consecutive compliant closing snapshots or continuous compliance through an earlier treaty expiration.

A material violation defined by the treaty causes immediate failure unless the objective explicitly permits cure.

### 12.10 Recover or Retain Territory

Parameters MUST identify possessions and required final legal ownership or military control.

The objective MUST declare separately whether success uses:

- legal ownership;
- military control;
- both; or
- recovery by a deadline followed by a retention period.

The shipped retention period is `6` completed months.

Ownership and control MUST remain separate under `DESIGN-15`.

## 13. Rewards and Penalties

Objective success and failure MUST apply only the typed political, economic, diplomatic, or evaluation effects stored in the objective.

The shipped default effect bundle, used only when explicitly referenced, is:

- priority `1`: success confidence `+1`, failure confidence `0`;
- priority `2`: success `+1`, failure `-1`;
- priority `3`: success `+2`, failure `-2`;
- priority `4`: success `+3`, failure `-3`;
- priority `5`: success `+5`, failure `-5`.

No default budget, tension, territory, technology, or political-capital effect is implied.

Effects MUST apply atomically and create ledger and causal records.

## 14. Objective Guidance for AI Plans

### 14.1 Utility Contribution

Every active objective MUST contribute to AI planning through `objective_ai_utility_v1`.

For each candidate AI plan goal:

`objectiveUtility = floor(alignmentScore * priorityWeightBp / 10_000)`

`alignmentScore` MUST be an integer within `-10_000..10_000` supplied by the objective type's AI mapping.

Positive values support the goal. Negative values oppose it. Zero means no effect.

### 14.2 Ordering and Aggregation

Objective contributions MUST be evaluated by:

1. descending current priority;
2. ascending objective identifier;
3. ascending candidate goal identifier.

Contributions sum exactly using integer arithmetic. Objective utility MUST NOT bypass command legality, treasury, capacity, technology, treaty, access, knowledge, or risk rules.

### 14.3 Knowledge Boundaries

AI objective evaluation MUST use the AI nation's legal knowledge for enemy and uncertain state unless an explicit difficulty profile grants declared information assistance.

The final career evaluator MAY use authoritative truth according to Section 15. AI planning MUST NOT.

### 14.4 Explanation

Every authoritative AI plan MUST record objective contribution identifiers and scores in its explanation trace.

An AI plan affected by an objective without an explanation trace MUST fail test instrumentation with `AI_OBJECTIVE_GUIDANCE_UNEXPLAINED`.

## 15. Final Career Evaluation

### 15.1 Objective Dimension

Strategic objectives contribute only to the `strategic_objectives` dimension of `DESIGN-56`.

Each objective MUST produce one `ObjectiveEvaluationContribution` containing:

- objective identifier;
- terminal status;
- final priority;
- priority weight;
- completion ratio within `0..10_000` basis points;
- timeliness modifier;
- difficulty modifier;
- raw signed contribution;
- bounded contribution;
- explanation trace; and
- record hash.

### 15.2 Completion Ratio

The shipped completion ratios are:

- `SUCCEEDED`: `10_000` basis points;
- `FAILED`: `0`;
- `CANCELLED_WITHOUT_SCORE`: excluded;
- `REPLACED`: contribution ends at replacement and follows replacement policy;
- `EXPIRED`: `0` unless the expiry policy supplies a partial ratio;
- `SUSPENDED` at campaign end: progress formula result;
- `ACTIVE` at campaign end: progress formula result.

Partial progress MUST come from the objective's versioned progress formula and remain within `0..10_000`.

### 15.3 Signed Contribution

The shipped raw formula is:

`successTerm = floor(priorityWeightBp * completionRatioBp / 10_000)`

`failureTerm = priorityWeightBp - successTerm`

`rawContribution = successTerm - failureTerm`

Thus full success contributes positive priority weight and complete failure contributes negative priority weight.

Timeliness and difficulty modifiers, when used, MUST be explicit values from `DESIGN-56`. This document supplies no hidden multiplier.

### 15.4 Aggregation

Applicable objective contributions MUST be summed and normalized by the sum of their priority weights.

If there are no applicable objectives, the objective dimension MUST use the `inapplicableBehavior` declared by `DESIGN-56`.

The evaluator MUST NOT:

- score descriptive objective text;
- add undeclared objectives;
- use AI utility as career score;
- count cancelled-without-score objectives;
- double count replacement chains; or
- infer weights from display order.

## 16. Replacement and Cancellation

An objective may be replaced or cancelled only through a typed government event, continuity transition, or explicit objective command authorized by the issuer.

A replacement MUST identify:

- old objective;
- new objective;
- old-objective scoring disposition;
- transferred or reset progress;
- priority disposition;
- deadline disposition;
- reward and penalty disposition; and
- causal transition identifier.

The old objective transitions to `REPLACED`. It MUST remain in history.

Cancellation MUST declare `CANCELLED_WITHOUT_SCORE` or another explicit terminal disposition. Silent deletion is prohibited.

## 17. Visibility

Objective visibility MUST be exactly one of:

- `PUBLIC_TO_PLAYER`;
- `PARTIALLY_REVEALED`;
- `HIDDEN_UNTIL_TRIGGER`;
- `AI_ONLY_NON_PLAYER`; or
- `REVEALED_AFTER_COMPLETION`.

A player-nation objective that can impose a player-facing penalty MUST be at least `PARTIALLY_REVEALED` and MUST disclose the requirement category, deadline, and possible penalty magnitude before the deadline.

Hidden parameters MUST follow the knowledge contract and MUST NOT leak through UI sorting, totals, or unavailable commands.

## 18. Canonical Ordering and Hashing

Objectives MUST be ordered by:

1. owner nation identifier;
2. descending current priority;
3. ascending start month;
4. ascending objective identifier.

Progress records MUST be ordered by evaluation month, phase, and objective identifier.

Player-influence records MUST be ordered by canonical command order.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect results or hashes.

## 19. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_OBJECTIVE_TYPE_DEFINITION`;
- `OBJECTIVE_PRIORITY_OUT_OF_RANGE`;
- `OBJECTIVE_CAPACITY_EXCEEDED`;
- `OBJECTIVE_ASSIGNMENT_INCOMPLETE`;
- `OBJECTIVE_ASSIGNMENT_INELIGIBLE`;
- `OBJECTIVE_TARGET_INVALID`;
- `OBJECTIVE_PRIORITY_INFLUENCE_INELIGIBLE`;
- `OBJECTIVE_INFLUENCE_COOLDOWN_ACTIVE`;
- `INSUFFICIENT_POLITICAL_CAPITAL`;
- `OBJECTIVE_TERMINAL_PRECEDENCE_MISSING`;
- `OBJECTIVE_SUCCEEDED`;
- `OBJECTIVE_FAILED`;
- `OBJECTIVE_REPLACED`;
- `OBJECTIVE_CANCELLED_WITHOUT_SCORE`;
- `AI_OBJECTIVE_GUIDANCE_UNEXPLAINED`;
- `OBJECTIVE_EVALUATION_CONTRACT_INVALID`; and
- `OBJECTIVE_STATE_INVARIANT_FAILED`.

## 20. Validation and Acceptance

Automated validation MUST prove that:

1. every objective type has complete target, progress, success, failure, AI, evaluation, visibility, reward, and penalty contracts;
2. government or an explicitly delegated authority is the only objective assigner;
3. the player cannot create objectives directly;
4. at most five objectives are active, at most two have priority five, and at most three have priority four or higher;
5. priority remains within `1..5` and uses exactly 500, 1,000, 2,000, 3,000, and 3,500 basis-point weights;
6. government objective selection uses deterministic scores and tie-breaking;
7. political-capital influence changes exactly one priority level;
8. influence costs match the exact declared increasing and decreasing schedule;
9. one objective may be influenced by capital at most once per 12 months;
10. influence is prohibited during the final three months before deadline;
11. political-capital spending does not directly change institutional confidence;
12. event choices alter priorities only through typed effects;
13. objective progress comes only from versioned formulas and authoritative inputs;
14. simultaneous success and failure use explicit precedence;
15. each canonical objective type uses the exact shipped thresholds and durations declared in Section 12;
16. objective rewards and penalties use typed effects;
17. AI objective utility uses alignment score multiplied by current priority weight;
18. AI guidance cannot bypass legality, resources, treaties, knowledge, or risk;
19. every AI plan records objective contribution explanations;
20. final evaluation uses only the `strategic_objectives` dimension;
21. full success contributes positive priority weight and full failure contributes negative priority weight;
22. cancelled-without-score objectives are excluded;
23. replacement chains cannot double count;
24. objective prose, display order, and AI utility are not career score inputs;
25. replacement and cancellation preserve objective history;
26. penalized player objectives disclose category, deadline, and penalty magnitude;
27. objective ordering and hashes are deterministic; and
28. identical state, commands, events, content, ruleset, and seeds produce identical assignment, influence, progress, AI, evaluation, ledger, and hash results.
