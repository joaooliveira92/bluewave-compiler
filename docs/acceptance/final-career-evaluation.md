# DESIGN-56: Final Career Evaluation

> **Canonical status:** Normative acceptance and evaluation specification.
> **Stable document ID:** `DESIGN-56`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Career scoring, normalization, difficulty adjustment, tactical-realism adjustment, relative rating, final-report contents, provenance, ordering, and reproducibility MUST use the explicit dimensions, values, formulas, and failure behavior defined here. Narrative text MUST NOT create or alter score.

## 1. Evaluation Trigger

Final career evaluation MUST execute exactly once for each supported campaign conclusion after:

- the terminal campaign snapshot is committed;
- all pending battle and strategic results are applied;
- war, peace, treaty, objective, project, financial, political, personnel, and ship records are closed for evaluation;
- the continuity and terminal-condition contracts complete; and
- every required ledger and snapshot hash validates.

A provisional report MAY be generated during play, but it MUST be labeled `PROVISIONAL` and MUST NOT become the final authoritative result.

## 2. Evaluation State

Every final evaluation MUST create one immutable `CareerEvaluation` containing:

- `careerEvaluationId`;
- campaign and playable-slot identifiers;
- evaluated nation instance;
- campaign starting and terminal snapshot identifiers and hashes;
- evaluation formula version;
- ordered dimension results;
- starting-difficulty adjustment;
- tactical-realism adjustment;
- raw, adjusted, and normalized scores;
- relative career rating;
- comparison-cohort identifier;
- final objective evaluation reference;
- report identifier;
- explanation and provenance records;
- content, ruleset, formula, and AI-policy versions; and
- aggregate hash.

Evaluation MUST consume no randomness.

## 3. Canonical Score Scale

Every scored dimension MUST produce an integer score within `-10_000..10_000` basis points.

The unadjusted career score also uses `-10_000..10_000`.

Presentation MAY display this as `-100..100`, but authoritative calculations MUST use basis points.

A dimension result outside the range MUST fail with `CAREER_DIMENSION_SCORE_OUT_OF_RANGE`.

## 4. Evaluation Dimensions and Weights

The shipped evaluation dimensions and weights are:

- `institutional_confidence_history`: `1_000` basis points;
- `strategic_objectives`: `1_500`;
- `wars_and_peace`: `1_000`;
- `fleet_readiness`: `750`;
- `budget_discipline`: `750`;
- `technology_position`: `750`;
- `merchant_protection`: `500`;
- `territorial_outcomes`: `750`;
- `officer_and_crew_development`: `750`;
- `fleet_modernization`: `750`;
- `legacy_fleet_quality`: `500`;
- `starting_national_difficulty`: adjustment under Section 18, not a weighted performance dimension; and
- `tactical_realism`: multiplier under Section 19, not a weighted performance dimension.

The eleven weighted performance dimensions total exactly `9_000` basis points. The remaining adjustment capacity is reserved for starting difficulty and tactical realism and MUST NOT be silently redistributed.

## 5. Applicability and Weight Normalization

Every dimension MUST declare `APPLICABLE` or `INAPPLICABLE`.

A dimension is inapplicable only when its contract explicitly proves that no relevant state, obligation, opportunity, or comparison exists. Poor performance MUST NOT be marked inapplicable.

For applicable dimensions:

`normalizedWeightBp = floor(baseWeightBp * 10_000 / sumApplicableBaseWeightsBp)`

Largest-remainder allocation MUST distribute any remaining weight points by:

1. fractional remainder descending;
2. base weight descending; and
3. dimension identifier ascending.

Final normalized weights MUST total exactly `10_000`.

If every dimension is inapplicable, evaluation MUST fail with `CAREER_EVALUATION_NO_APPLICABLE_DIMENSIONS`.

## 6. Weighted Career Score

The unadjusted weighted score is:

`unadjustedCareerScoreBp = roundHalfEven(sum(dimensionScoreBp * normalizedWeightBp) / 10_000)`

The result MUST be clamped to `-10_000..10_000`.

Every contribution MUST retain its unrounded numerator, applied weight, rounding mode, and final signed value.

## 7. Institutional-Confidence History

This dimension MUST use the complete monthly institutional-confidence history, not only the final value.

The shipped inputs are:

- time-weighted average confidence: `5_000` contribution weight;
- months at or below dismissal-risk threshold `16`: `2_000` penalty weight;
- confidence trend from first 12-month average to final 12-month average: `1_500` weight;
- dismissal-risk checks survived: `500` penalty weight per check, capped at `1_000`;
- administration dismissed: dimension score exactly `-10_000`; and
- confidence recovered from `16` or below to at least `40` for six consecutive months: `500` bonus weight.

The shipped formula, when dismissal did not occur, MUST map the time-weighted average from `0..100` to `-10_000..10_000`, then apply the declared penalties and bonuses before clamping.

## 8. Strategic Objectives

This dimension MUST use the objective contribution contract in `DESIGN-19`.

Each applicable objective contributes:

- final status;
- final priority;
- priority weight;
- completion ratio;
- timeliness modifier when explicitly defined;
- difficulty modifier when explicitly defined; and
- signed contribution.

Full success contributes positive priority weight. Complete failure contributes negative priority weight. Cancelled-without-score objectives are excluded. Replacement chains MUST NOT double count.

The normalized objective-dimension score is:

`objectiveScoreBp = roundHalfEven(sum(rawObjectiveContribution) * 10_000 / max(1, sumApplicableObjectivePriorityWeights))`

The result clamps to `-10_000..10_000`.

## 9. Wars and Peace

Each completed or active terminal war MUST produce one `WarCareerContribution` containing:

- war identifier;
- entry cause and stated objectives;
- national contribution share;
- achieved and failed war goals;
- side war-score result;
- possessions gained and lost through settlement;
- reparations and restrictions;
- separate-peace or capitulation result;
- war exhaustion at exit or terminal snapshot;
- peace-term value relative to score and objectives; and
- contribution score.

The shipped contribution weights are:

- war-goal achievement: `4_000`;
- peace outcome proportionality: `2_000`;
- national contribution: `1_500`;
- avoidance of unnecessary losses and exhaustion: `1_500`;
- treaty and alliance obligation fulfillment: `1_000`.

Wars MUST be weighted by their declared strategic importance within `1..5`. Starting or prolonging wars does not produce a score by itself.

## 10. Fleet Readiness

Fleet readiness MUST use monthly eligible-fleet snapshots.

The shipped inputs are:

- average active-fleet readiness: `4_000` weight;
- mission-capable proportion: `2_000`;
- foreign-station and mandatory operational compliance: `1_500`;
- share unavailable from preventable maintenance or personnel failure: `1_500` penalty weight;
- mobilization and working-up completion quality: `1_000`.

Ships unavailable because of accepted mandatory rebuilds, battle damage under funded repair, or treaty disposal MUST be classified by explicit exclusion or expected-unavailability policy rather than as preventable failure.

## 11. Budget Discipline

Budget discipline MUST use balanced ledger state throughout the campaign.

The shipped inputs are:

- paid obligations ratio: `3_000` weight;
- months without deficit or arrears: `2_000`;
- emergency appropriation and insolvency frequency: `2_000` penalty weight;
- project cancellation and delay caused by avoidable nonpayment: `1_500` penalty weight;
- reserve and contingency policy compliance: `1_000`; and
- budget manipulation or invalid ledger state: dimension failure.

The dimension MUST NOT reward unspent resources by itself. Resources are valuable only through explicit reserve, contingency, objective, or terminal-value policies.

## 12. Technology Position

Technology position MUST compare the evaluated nation against its canonical peer cohort at the terminal month and against its own starting position.

The shipped inputs are:

- peer-percentile technology breadth: `3_000` weight;
- peer-percentile critical naval technology depth: `3_000`;
- improvement from starting percentile: `2_000`;
- adoption completion for discovered technology: `1_000`; and
- obsolete unsupported technology burden: `1_000` penalty weight.

Peer comparison MUST use only accepted and reachable technologies for the scenario era. Content-only locked technology is excluded.

## 13. Merchant Protection

Merchant protection MUST use `DESIGN-33` records.

The shipped inputs are:

- average global trade-protection compliance: `3_000` weight;
- regional coverage against actual threat: `2_000`;
- merchant losses relative to opening capacity and threat: `3_000` penalty weight;
- food and fuel import continuity: `1_000`; and
- convoy and replacement recovery: `1_000`.

A nation with no merchant exposure, import dependency, convoy obligation, or reachable trade-warfare threat MAY mark this dimension inapplicable through an explicit proof record.

## 14. Territorial Outcomes

Territorial outcomes MUST evaluate legal ownership and military control separately.

The shipped inputs are:

- protection of starting strategic possessions: `3_500` weight;
- achievement of territorial objectives: `2_500`;
- peace-confirmed gains: `2_000`;
- unresolved occupation exposure at campaign end: `1_000` penalty weight; and
- possession losses contrary to objectives or mandates: `1_000` penalty weight.

Territory gained without a corresponding objective, claim, settlement, or strategic value MUST NOT receive an inferred bonus.

## 15. Officer and Crew Development

The dimension MUST use officer, division, crew, squadron, academy, casualty, and training records.

The shipped inputs are:

- officer-establishment quality relative to starting state: `2_000` weight;
- lawful development and promotion outcomes: `1_500`;
- division experience and cohesion improvement: `1_500`;
- ship crew-quality improvement: `2_000`;
- squadron and pilot development: `1_000` when applicable;
- academy and personnel-pool sustainability: `1_000`; and
- avoidable command-vacancy or personnel-shortage burden: `1_000` penalty weight.

Hidden officer true ability MUST NOT be exposed in the final player report unless fully revealed. Authoritative scoring MAY use true ability only when the evaluation policy explicitly measures national personnel outcomes rather than player knowledge, and the report MUST explain the visible proxy.

## 16. Fleet Modernization

Fleet modernization MUST measure change from the starting fleet and objective requirements.

The shipped inputs are:

- modern qualifying tonnage ratio by required category: `3_000` weight;
- replacement of obsolete or noncompliant assets: `2_000`;
- adoption of relevant radar, fire control, aviation, missile, ASW, and damage-control capabilities: `2_000`;
- completed rebuilds and conversions with positive objective or capability value: `1_500`; and
- modernization backlog against explicit plans and mandates: `1_500` penalty weight.

New construction receives no bonus merely for increasing fleet size.

## 17. Legacy Fleet Quality

Legacy fleet quality evaluates the surviving fleet's long-term value at the terminal snapshot.

The shipped inputs are:

- age-adjusted combat and mission capability: `3_000` weight;
- readiness and material condition: `2_000`;
- design-family sustainability and logistic commonality: `1_500`;
- remaining service life: `1_500`;
- treaty legality and modernization headroom: `1_000`; and
- unresolved defects, obsolete burdens, and unsupported equipment: `1_000` penalty weight.

Lost ships are evaluated in war, readiness, financial, and historical-report contexts and MUST NOT also reduce legacy-fleet quality except through the absence of surviving capability.

## 18. Starting National Difficulty

Starting national difficulty MUST use one immutable `StartingDifficultyAssessment` compiled at campaign creation.

It MUST contain normalized inputs for:

- economic resources;
- industrial and dock capacity;
- starting fleet strength and age;
- technology position;
- geographic and possession obligations;
- likely adversary strength;
- government and political constraints;
- merchant and import dependency;
- officer and personnel position; and
- scenario-specific challenges.

The shipped difficulty adjustment is an additive value within `-1_500..1_500` basis points:

- very easy starting position: `-1_500`;
- easy: `-750`;
- balanced: `0`;
- hard: `+750`;
- very hard: `+1_500`.

Difficulty MUST be fixed at campaign creation and pinned in the initial snapshot. Later poor performance MUST NOT retroactively increase difficulty.

`difficultyAdjustedScoreBp = clamp(-10_000, 10_000, unadjustedCareerScoreBp + startingDifficultyAdjustmentBp)`

## 19. Tactical Realism Modifier

Tactical realism MUST use the exact battle realism policy from `DESIGN-38`:

- `ADMIRAL`: `11_000` basis points;
- `REAR_ADMIRAL`: `10_000`;
- `CAPTAIN`: `9_500`.

The modifier applies only to the `tactical_command_contribution`, not the complete career score.

The shipped tactical-command contribution has maximum absolute magnitude `1_000` basis points and is calculated from player-involved battle command outcomes, objective compliance, avoidable losses, and command-quality records.

`tacticalRealismAdjustedContributionBp = roundHalfEven(tacticalCommandContributionBp * realismMultiplierBp / 10_000)`

The difference between adjusted and unadjusted tactical contribution is then added to the difficulty-adjusted career score and clamped to `-10_000..10_000`.

Realism mode MUST NOT alter raw battle score or war score.

## 20. Final Score Formula

The authoritative final score is:

`finalCareerScoreBp = clamp(-10_000, 10_000, difficultyAdjustedScoreBp + tacticalRealismAdjustedContributionBp - tacticalCommandContributionBp)`

Every intermediate value, adjustment, clamp, and rounding result MUST be recorded.

The final score MUST NOT use final institutional confidence as a replacement for the multidimensional formula.

## 21. Starting-Position Comparison

Every performance dimension MUST declare whether it uses:

- absolute terminal state;
- change from starting state;
- peer-relative state;
- objective-relative state;
- time-weighted history; or
- an explicit combination.

The evaluation MUST preserve starting and terminal operands and explain the comparison method.

Success does not require the world's largest navy. Fleet size MUST affect scoring only through explicit objectives, readiness, capability, modernization, war, financial, territorial, or legacy formulas.

## 22. Relative Career Rating

The relative career rating MUST be derived from final score and a pinned canonical comparison cohort.

The shipped rating bands are:

- `DISASTROUS`: `-10_000..-6_001`;
- `FAILED`: `-6_000..-3_001`;
- `POOR`: `-3_000..-1_001`;
- `MIXED`: `-1_000..999`;
- `SUCCESSFUL`: `1_000..3_999`;
- `DISTINGUISHED`: `4_000..6_999`;
- `EXCEPTIONAL`: `7_000..8_999`;
- `LEGENDARY`: `9_000..10_000`.

The comparison cohort MUST identify scenario, nation or difficulty class, start era, duration band, ruleset, formula version, and support-manifest hash.

If no validated cohort exists, the score band remains authoritative and percentile comparison MUST display `UNAVAILABLE` rather than invent a percentile.

## 23. Final Report

Every final evaluation MUST create one immutable `FinalCareerReport` containing:

- campaign identity and evaluated nation;
- start and end dates;
- terminal reason and continuity outcome;
- final score and relative rating;
- dimension scores, weights, contributions, and explanations;
- starting-difficulty and tactical-realism adjustments;
- campaign timeline;
- major decisions;
- fleet evolution;
- wars and peace settlements;
- territorial changes;
- technology milestones;
- financial record;
- political record;
- officer and crew legacy;
- surviving, captured, transferred, scrapped, and lost ships;
- final objective evaluation;
- comparison cohort and percentile when available;
- known limitations and inapplicable dimensions;
- source-ledger and snapshot references;
- formula, content, ruleset, and support versions; and
- report hash.

The report is a projection of authoritative evaluation records. It MUST NOT become an alternative score authority.

## 24. Campaign Timeline

The campaign timeline MUST be generated from structured causal events and snapshots.

Required event classes are:

- campaign start and continuity transitions;
- government changes;
- objective issue, success, failure, refusal, replacement, and expiration;
- war entry, major battle, separate peace, settlement, and war end;
- treaty signing, violation, collapse, and disposal;
- possession ownership and control changes;
- major ship completion, rebuild, transfer, capture, scrapping, and loss;
- technology milestone and major adoption;
- financial crisis, insolvency, and recovery;
- dismissal-risk and revolution events; and
- campaign conclusion.

Timeline ordering MUST use campaign month, strategic phase, tactical time when applicable, event priority, and stable event identifier.

## 25. Major Decisions

A decision is reportable as major only when its command or decision definition contains `careerReportImportance` within `1..5` and the final applied importance is at least `3`.

The report MUST include:

- decision identifier;
- visible context at decision time;
- selected option;
- visible anticipated consequences;
- actual typed effects;
- affected objectives and dimensions; and
- source event and command references.

The report MUST NOT infer major decisions from UI navigation, drafts, cancelled commands, or descriptive logs.

## 26. Fleet Evolution

Fleet evolution MUST show snapshot-based changes in:

- commissioned count and tonnage by type;
- active, reserve, mothballed, unavailable, and working-up status;
- modern qualifying tonnage;
- average readiness and crew quality;
- design families and major classes;
- carrier, aviation, submarine, missile, electronics, ASW, and support capabilities when applicable;
- construction, rebuild, repair, transfer, capture, and disposal; and
- maintenance and personnel burden.

All totals MUST reconcile with authoritative ship and project histories.

## 27. Wars and Territorial Changes

For every war, the report MUST include:

- entry and exit context;
- sides and alliance context;
- objectives;
- major battles and results;
- national contribution;
- war score and exhaustion history;
- blockade, merchant, submarine, mine, aviation, and amphibious effects where applicable;
- peace terms;
- possession ownership and control changes; and
- war-career contribution.

Territorial reporting MUST distinguish legal ownership, military control, occupation, settlement, and temporary administration.

## 28. Technology and Financial Record

Technology milestones MUST be selected from explicit importance fields and include discovery, acquisition, adoption, production, installation, and operational use.

The financial record MUST include:

- resources and budget at start and end;
- paid obligations;
- deficits and arrears;
- emergency appropriations;
- insolvency periods;
- construction and modernization expenditure;
- research expenditure;
- maintenance burden;
- reparations; and
- budget-discipline contribution.

The report MUST NOT imply that discovery equals adoption or inventory.

## 29. Political and Officer Legacy

The political record MUST include:

- institutional-confidence history;
- government confidence when applicable;
- political-capital use;
- unrest and war exhaustion;
- mandates;
- revolution and continuation outcomes;
- treaty and diplomatic crises; and
- dismissal or survival results.

Officer legacy MUST include only legally visible information:

- ranks and commands;
- revealed ability estimates and confidence;
- visible traits;
- promotions, removals, retirement, death, and decisive events;
- officer-development contribution; and
- notable command outcomes.

Hidden true ability and unrevealed traits MUST remain hidden.

## 30. Ship Legacy

The report MUST classify every historically relevant ship as:

- `SURVIVING_ACTIVE`;
- `SURVIVING_RESERVE`;
- `SURVIVING_MOTHBALLED`;
- `SURVIVING_UNAVAILABLE`;
- `TRANSFERRED`;
- `CAPTURED`;
- `SCRAPPED`;
- `SCUTTLED`;
- `FOUNDERED`;
- `SUNK`; or
- another explicit historical disposition.

A ship MUST appear in exactly one terminal report disposition.

For lost ships, the report MUST preserve sinking-credit timing, cause, battle, casualties, and recovery or survivor results where visible.

## 31. Final Objective Evaluation

The final report MUST reproduce every applicable objective's authoritative evaluation contribution, including:

- identifier and type;
- issuing authority;
- target and visible parameters;
- final priority;
- status;
- completion ratio;
- contribution;
- reward or penalty effects;
- replacement-chain disposition; and
- explanation.

Objective prose MUST NOT be rescored by the report generator.

## 32. Report Provenance

Every report section and scored statement MUST reference one or more:

- source snapshot hashes;
- ledger ranges;
- command or event identifiers;
- objective or war records;
- ship, officer, squadron, project, or possession identifiers;
- evaluation-contribution records; and
- formula versions.

A report statement without provenance MUST be omitted or labeled `UNVERIFIED_PRESENTATION_NOTE` and MUST NOT affect score.

## 33. Fog of War and Final Reports

The final report MUST preserve player knowledge boundaries for hidden enemy and officer information unless the campaign conclusion contract explicitly authorizes historical revelation.

Authoritative scoring MAY use true state where the dimension contract requires objective outcome measurement, but the report MUST present only legally visible detail and may show an unexplained aggregate contribution when necessary.

The report MUST NOT retroactively reveal hidden defects, intelligence sources, enemy orders, officer true ability, or unrevealed technology without an explicit revelation policy.

## 34. Reproducibility

Given identical:

- starting and terminal snapshots;
- command, event, battle, transaction, and causal ledgers;
- objective, war, treaty, personnel, ship, and financial histories;
- content, ruleset, formula, and support versions; and
- comparison-cohort data,

the evaluator MUST produce identical dimension results, weights, adjustments, final score, rating, report content, ordering, and hashes on every supported platform.

Evaluation MUST consume no RNG stream and MUST not depend on wall-clock time, localized text, UI choices, or filesystem ordering.

## 35. Canonical Ordering

Evaluation MUST order:

1. dimensions by Section 4 order;
2. objectives by owner, priority descending, and objective identifier;
3. wars by start month and war identifier;
4. monthly histories by campaign month;
5. ships by historical disposition and ship identifier;
6. officers by final rank descending and officer identifier;
7. timeline events by Section 24;
8. report sections by Section 23; and
9. provenance references by source type and identifier.

Database insertion order, UI order, localized names, and wall-clock time MUST NOT affect results.

## 36. Required Reason Codes

The subsystem MUST define at least:

- `CAREER_EVALUATION_PRECONDITION_FAILED`;
- `CAREER_DIMENSION_DEFINITION_MISSING`;
- `CAREER_DIMENSION_SCORE_OUT_OF_RANGE`;
- `CAREER_EVALUATION_NO_APPLICABLE_DIMENSIONS`;
- `CAREER_WEIGHT_NORMALIZATION_FAILED`;
- `CAREER_OBJECTIVE_CONTRIBUTION_INVALID`;
- `CAREER_WAR_CONTRIBUTION_INVALID`;
- `CAREER_STARTING_DIFFICULTY_MISSING`;
- `CAREER_TACTICAL_REALISM_CONTRACT_MISSING`;
- `CAREER_COMPARISON_COHORT_UNAVAILABLE`;
- `CAREER_FINAL_REPORT_INCOMPLETE`;
- `CAREER_REPORT_PROVENANCE_MISSING`;
- `CAREER_REPORT_HIDDEN_INFORMATION_EXPOSED`;
- `CAREER_SHIP_DISPOSITION_DUPLICATED`;
- `CAREER_EVALUATION_HASH_MISMATCH`; and
- `CAREER_EVALUATION_INVARIANT_FAILED`.

## 37. Validation and Acceptance

Automated validation MUST prove that:

1. final evaluation runs only after a committed terminal snapshot and complete result application;
2. every final evaluation contains snapshots, dimensions, difficulty, realism, scores, rating, cohort, objective evaluation, report, versions, and hashes;
3. evaluation consumes no randomness;
4. every dimension score remains within -10,000 through 10,000 basis points;
5. the eleven performance dimensions use exact shipped base weights totaling 9,000;
6. difficulty and realism are adjustments rather than silently weighted dimensions;
7. inapplicability requires an explicit proof and cannot hide poor performance;
8. normalized applicable weights total exactly 10,000 through largest-remainder allocation;
9. career score uses exact weighted arithmetic and half-even rounding;
10. institutional confidence uses full history, dismissal-risk exposure, trend, recovery, and dismissal rather than final value alone;
11. strategic objectives use `DESIGN-19` contributions and cannot double-count replacement chains;
12. wars and peace use exact objectives, score, contribution, proportionality, exhaustion, and obligation inputs;
13. fleet readiness distinguishes preventable from expected unavailability;
14. budget discipline does not reward idle unspent resources without an explicit policy;
15. technology position uses only accepted reachable era technology and an explicit peer cohort;
16. merchant protection may be inapplicable only with explicit proof of no exposure or obligation;
17. territorial outcomes separate ownership, control, occupation, settlement, and strategic value;
18. officer and crew evaluation preserves hidden-information rules;
19. modernization does not reward fleet growth by itself;
20. legacy-fleet quality does not double-penalize lost ships;
21. starting difficulty is fixed at campaign creation and uses only the exact five adjustment values;
22. tactical realism uses exact 11,000, 10,000, and 9,500 multipliers only on tactical-command contribution;
23. realism never changes raw battle score or war score;
24. final score follows the exact declared formula and clamp;
25. success is measured against starting position, objectives, peers, history, and explicit terminal state rather than fleet size alone;
26. rating bands use exact declared boundaries;
27. missing cohort data produces unavailable percentile rather than an invented comparison;
28. final report contains every required section and remains a projection rather than score authority;
29. timeline events come only from structured causal state and use canonical ordering;
30. major decisions require explicit importance of at least three;
31. fleet-evolution totals reconcile with ship and project history;
32. war and territorial reporting distinguishes contribution, score, ownership, control, and settlement;
33. technology reporting distinguishes discovery, adoption, production, installation, and use;
34. political and officer reporting preserves legal knowledge;
35. every relevant ship appears in exactly one terminal disposition;
36. final objective reporting reproduces authoritative contributions without rescoring prose;
37. every scored report statement has provenance;
38. hidden state remains protected unless an explicit conclusion policy reveals it; and
39. identical evaluation inputs and versions produce identical scores, ratings, reports, records, and hashes.
