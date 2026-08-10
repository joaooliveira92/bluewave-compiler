# DESIGN-29: Intelligence And Knowledge

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-29`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Intelligence capability, knowledge assertions, enemy construction information, report error, delivery delay, deception, research insight, technology acquisition, war warning, battle avoidance, ASW support, detection incidents, and AI fog of war MUST use the explicit fields, values, predicates, streams, ordering, and failure behavior defined here. Runtime inference and hidden-truth fallback behavior are prohibited.

## 1. Truth and Knowledge Separation

Authoritative world state and participant knowledge MUST be separate.

A knowledge record:

- MUST NOT overwrite authoritative truth;
- MUST NOT become true because confidence reaches `10_000` basis points;
- MUST retain its source, observation date, receipt date, uncertainty, and deception state;
- MAY be contradicted by a later assertion without deleting history; and
- MUST be scoped to exactly one receiving participant.

Every player-facing and AI-facing assertion about hidden state MUST originate from a valid knowledge record, public fact, or explicit difficulty-assistance grant.

Unauthorized truth access MUST fail instrumentation with `FOG_OF_WAR_VIOLATION`.

## 2. Intelligence Program

Every observing nation MAY maintain exactly one `IntelligenceProgram` for each other active observed nation.

Each program MUST contain:

- `observerNationId`;
- `observedNationId`;
- monthly allocation;
- monthly paid amount;
- capability score;
- infiltration score;
- analysis score;
- counterintelligence pressure;
- current capability tier;
- consecutive paid months;
- ordered source identifiers;
- active operation identifiers;
- last resolution month;
- ruleset and formula versions; and
- state hash.

Self-observation programs are prohibited.

A duplicate observer-observed pair MUST fail with `DUPLICATE_INTELLIGENCE_PROGRAM`.

## 3. Intelligence Capability

Capability, infiltration, analysis, and counterintelligence pressure use integer range `0..100`.

The shipped monthly capability policy is:

- payment below `5_000` basis points of required allocation: capability `-2`;
- payment from `5_000..7_499`: capability unchanged;
- payment from `7_500..9_999`: capability `+1`;
- full payment at `10_000`: capability `+2`;
- active war against the observed nation: additional `+1` analysis point per month;
- successful source operation: operation-defined gain;
- detected network compromise: event-defined loss.

Capability is clamped once to `0..100`.

The shipped capability tiers are:

- `0..19`: `MINIMAL`;
- `20..39`: `LIMITED`;
- `40..59`: `ESTABLISHED`;
- `60..79`: `STRONG`;
- `80..100`: `PENETRATING`.

The UI MUST display current capability score, tier, paid ratio, and visible progress toward the next tier.

## 4. Knowledge Assertion

Every `KnowledgeAssertion` MUST contain:

- `assertionId`;
- recipient participant identifier;
- subject type and stable subject identifier;
- attribute identifier;
- assertion value type;
- exact estimated value or closed estimate interval;
- confidence basis points within `0..10_000`;
- source type and source identifier;
- observed campaign time;
- received campaign time;
- expiration campaign time or `NONE`;
- decay policy identifier;
- deception state;
- superseded assertion identifiers;
- visibility classification;
- formula and ruleset versions; and
- assertion hash.

`deceptionState` MUST be one of:

- `NOT_SUSPECTED`;
- `POSSIBLY_DECEPTIVE`;
- `CONFIRMED_FALSE`;
- `CONFIRMED_TRUE`; or
- `UNKNOWN`.

An assertion with an interval MUST satisfy minimum less than or equal to maximum.

## 5. Assertion Confidence

The shipped confidence categories are:

- `0..1_999`: `VERY_LOW`;
- `2_000..3_999`: `LOW`;
- `4_000..5_999`: `MODERATE`;
- `6_000..7_999`: `HIGH`;
- `8_000..9_999`: `VERY_HIGH`;
- `10_000`: `CONFIRMED`.

Confidence labels are presentation-only.

Confidence MUST NOT exceed the maximum permitted by source type:

- rumor: `3_000`;
- press or public statement: `5_000`;
- diplomatic report: `6_000`;
- agent report: `8_000`;
- direct visual observation: `9_000`;
- captured document validated by analysis: `9_500`;
- authoritative public inspection or own-force observation: `10_000`.

A source-specific contract MAY lower but MUST NOT silently raise these caps.

## 6. Assertion Merge

Assertions about the same subject and attribute MUST remain separate source records.

A derived `KnowledgeProjection` MAY merge them using `knowledge_projection_v1`:

1. discard expired assertions;
2. exclude `CONFIRMED_FALSE` assertions;
3. order by confidence descending, received date descending, and assertion identifier ascending;
4. choose the highest-confidence assertion as the primary estimate;
5. widen the estimate interval when a contradictory assertion has confidence within `1_000` basis points of the primary;
6. mark possible deception when a contradictory official assertion exists; and
7. emit projection inputs and hash.

The projection MUST NOT mutate source assertions.

## 7. Knowledge Decay

Unless a source-specific policy states otherwise, confidence decays monthly after the assertion's freshness period:

- static identity attributes: no decay;
- design attributes of a completed ship: `-100` basis points per 12 months;
- construction status: `-500` per month after a `3`-month freshness period;
- position: expires after the report's declared validity window;
- force strength: `-500` per month;
- war-plan warning: expires after its declared operation window;
- technology estimate: `-250` per 6 months.

Confidence cannot fall below `0`.

Expired assertions remain in history but MUST NOT drive current projections.

## 8. Enemy Construction Contact

Every foreign construction contact MUST have one `EnemyConstructionKnowledgeState` scoped to the observing nation.

Initial construction observation reveals exactly these attributes when the applicable predicate passes:

- estimated ship type;
- estimated displacement interval; and
- construction location when the source legally observed it.

Initial observation does not reveal weapons, speed, armor, electronics, range, defects, exact completion date, or true design identifier.

## 9. Initial Construction Revelation

The shipped initial-observation policy is:

- type estimate confidence: `4_000` basis points;
- displacement estimate confidence: `3_500`;
- displacement interval error: plus or minus `20%` of true standard displacement;
- construction-status confidence: `4_000`;
- location confidence: source-defined, maximum `8_000`.

The displacement interval is:

`minimum = floor(trueDisplacementKg * 8_000 / 10_000)`

`maximum = ceiling(trueDisplacementKg * 12_000 / 10_000)`

Error endpoints MAY be shifted through a keyed deception or observation decision, but width MUST remain exactly `40%` of true displacement before canonical clamping.

The policy applies only when construction observation succeeds through intelligence, diplomacy, treaty inspection, press reporting, or direct observation.

A nation does not receive this information automatically for every enemy project.

## 10. Completed Enemy Ship Revelation

A completed enemy ship may reveal these baseline attributes when the completion or service observation predicate passes:

- estimated type;
- estimated displacement interval;
- estimated primary weapon count;
- estimated primary weapon caliber interval;
- estimated designed speed interval.

The shipped baseline estimates are:

### Type

- confidence: `6_000` basis points;
- misidentification probability: `1_500` basis points among eligible adjacent classifications.

### Displacement

- confidence: `5_000`;
- interval: plus or minus `15%` of true standard displacement.

### Weapon Count

- confidence: `4_500`;
- error: integer `-2..2` barrels, clamped to `0` or above.

### Weapon Caliber

- confidence: `4_500`;
- error: plus or minus exactly `25_400` micrometres, equal to `1` inch.

### Speed

- confidence: `4_500`;
- error: plus or minus exactly `2` knots.

All errors MUST use keyed decisions from `intelligence/observation/ship` and produce audit records.

Direct observation, combat observation, treaty inspection, captured plans, or agent penetration MAY improve these values through explicit source policies.

## 11. Additional Ship Attributes

The following attributes require a specific intelligence or observation source and are not part of baseline revelation:

- armor layout and thickness;
- secondary and anti-air batteries;
- torpedo details;
- missile details;
- radar and electronic warfare;
- aircraft capacity and air-group composition;
- machinery type;
- range;
- fuel type;
- damage-control capability;
- defects;
- readiness;
- crew quality;
- exact deployment; and
- current ammunition or fuel state.

Each attribute source MUST declare error, confidence, freshness, and deception behavior.

## 12. Official Figures and Deception

An official figure MUST be stored as a knowledge assertion with source type `OFFICIAL_STATEMENT`. It MUST NOT overwrite true design or ship state.

The shipped official-figure policy permits false values only when the observed nation has an explicit deception policy or treaty-cheating capability.

Permitted false declarations are:

- displacement: within `-1_000..1_000` basis points of true value when treaty rules permit displacement deception;
- speed: within plus or minus `2` knots;
- weapon count: within `-2..2` barrels;
- completion date: within plus or minus `6` months.

Main-gun caliber deception is prohibited when the treaty contract prohibits it.

A false official figure MUST use a keyed decision, be stored as an assertion, and retain the true value only in authoritative hidden state.

Detection MUST create a contradiction record and may trigger Section 26.

## 13. Strategic Report

Every `StrategicReport` MUST contain:

- `reportId`;
- sender and recipient identifiers;
- source type and source identifier;
- subject scope;
- observed time;
- sent time;
- scheduled received time;
- actual received time;
- position estimate and error record or `NONE`;
- strength estimate and error record or `NONE`;
- identification estimate and error record or `NONE`;
- deception state;
- confidence;
- generated knowledge assertions;
- expiration policy;
- ruleset version; and
- report hash.

A report is knowledge, not authoritative world state.

## 14. Position Error

The shipped position-error policy uses area-hop distance:

- direct visual or radar contact: `0` area hops;
- high-quality reconnaissance: `0..1` hops;
- normal reconnaissance: `0..2` hops;
- agent or port report after departure: `0..3` hops;
- rumor: `0..4` hops.

An erroneous area MUST be reachable from the true area within the allowed hop count and selected from canonical ascending area identifiers by keyed weighted choice.

A report MUST NOT place a force in an impossible non-existent area.

## 15. Strength Error

Reported force strength MUST use an interval or estimated total.

The shipped multiplicative error bands are:

- very high confidence: `9_000..11_000` basis points;
- high: `8_000..12_000`;
- moderate: `7_000..13_000`;
- low: `5_000..15_000`;
- very low: `3_000..17_000`.

The multiplier is applied to the report's declared strength metric and rounded toward zero.

Strength reports MUST declare whether they estimate ship count, displacement, combat strength, aircraft count, or another metric.

## 16. Identification Error

Identification error MUST select only from an explicit confusion set.

The shipped ship-type confusion sets include:

- `DD` with `KE` or `CL`;
- `CL` with `CA` or `DD`;
- `CA` with `CL`, `BC`, or `AMC`;
- `BC` with `CA` or `BB`;
- `BB` with `BC` or `B`;
- `CV` with `CVL` or `AV`;
- `CVL` with `CV` or `AV`;
- `AMC` with `CA`, `CL`, or `TR`.

`SS`, `MTB`, and `TR` require type-specific confusion policies.

A report MUST NOT identify a contact as a type outside its confusion set.

## 17. Delivery Delay

Report delivery delay MUST be an integer number of strategic days or tactical minutes under the owning context.

The shipped strategic delays are:

- radio or data link: `0` days;
- diplomatic cable: `1..3` days;
- air reconnaissance debrief: `0..2` days;
- surface scout report: `0..5` days;
- submarine report: `1..7` days;
- agent report: `7..30` days;
- rumor or press: `3..30` days.

Delay is selected through a keyed decision in the source report stream.

A report MUST become available only at `actualReceivedTime`. UI and AI planning MUST NOT access it earlier.

## 18. Report Error Ordering

Strategic report generation MUST resolve in this order:

1. determine legal source observation;
2. capture true source-time input hash;
3. determine position error;
4. determine strength error;
5. determine identification error;
6. apply source deception;
7. determine delivery delay;
8. create report;
9. deliver at the scheduled receive time; and
10. create or update knowledge assertions.

Later truth changes MUST NOT rewrite the report's original source-time content.

## 19. Report Non-Authority

A report MUST NOT directly:

- move a force;
- change true force strength;
- change ship identity;
- change deployment;
- create or remove a battle opportunity;
- change technology state;
- alter diplomacy; or
- overwrite an authoritative aggregate.

Commands and AI plans may respond to reports through normal validated contracts.

A report mutation of truth MUST fail with `REPORT_OVERWROTE_AUTHORITATIVE_STATE`.

## 20. Research Insight

An intelligence operation may create `ResearchInsight` only through an explicit insight effect.

The shipped insight values are:

- technical rumor: `250` research micro-points;
- agent technical report: `1_000`;
- captured component analysis: `2_500`;
- captured plans: `5_000`;
- foreign-construction milestone: governed by `DESIGN-16`.

Insight MUST identify a technology or research field, source, expiration policy, and maximum applicability.

Insight MUST NOT bypass prerequisites, availability, scenario restrictions, or mutual exclusion.

## 21. Technology Acquisition

Direct technology acquisition is allowed only through typed effect `ACQUIRE_TECHNOLOGY` from:

- treaty-authorized technology transfer;
- purchased technology sale;
- validated captured complete design package;
- canonical event; or
- explicit intelligence operation with `technologyAcquisitionAllowed: true`.

Eligibility requires:

- all mandatory prerequisites discovered;
- final campaign availability reached unless the source contract explicitly grants an availability exception;
- no scenario prohibition;
- acquisition source authenticity validated; and
- adoption requirements created.

The shipped intelligence-only acquisition probability for a validated complete design package is `2_500` basis points. Partial documents provide research insight only.

Acquisition MUST create a discovery record and the normal adoption, production, installation, or refit requirements under `DESIGN-20`.

## 22. Enemy-Ship Information

Intelligence may improve enemy-ship information through explicit operations:

- construction surveillance;
- port observation;
- trials observation;
- agent access;
- treaty inspection;
- combat observation;
- captured documents; or
- signals intelligence.

Every operation MUST declare eligible attributes, confidence gain, error reduction, freshness, failure, detection, and deception behavior.

An operation MUST NOT reveal attributes outside its contract.

## 23. War-Plan Warning

A `WarPlanWarning` MUST contain:

- observing and target nations;
- suspected target or theater;
- earliest and latest estimated action month;
- confidence basis points;
- source;
- received month;
- expiration month;
- possible deception;
- warning policy version; and
- record hash.

The shipped warning thresholds are:

- confidence below `4_000`: no authoritative warning action;
- `4_000..5_999`: advisory warning;
- `6_000..7_999`: permits defensive preparation commands;
- `8_000..10_000`: permits high-alert policy and surprise-defense modifiers.

A warning MUST NOT start war, mobilize automatically, or reveal exact enemy commands.

## 24. Battle Avoidance

Intelligence improves battle avoidance only through `battle_avoidance_intelligence_v1`.

When a force has a current enemy-presence assertion for its area or intended route:

- confidence `0..3_999`: no modifier;
- `4_000..5_999`: avoidance utility `+1_000` basis points;
- `6_000..7_999`: `+2_500`;
- `8_000..10_000`: `+4_000`.

The modifier affects AI or automated movement and battle-acceptance utility only. It MUST NOT guarantee avoidance, cancel unavoidable battles, change enemy truth, or bypass orders.

The player receives the same warning information and retains command choice under applicable rules.

## 25. Wartime ASW Intelligence

Wartime ASW intelligence uses `asw_intelligence_v1` and applies only against an active enemy submarine campaign.

The shipped modifiers by intelligence capability are:

- capability `0..19`: `10_000` basis points;
- `20..39`: `10_500`;
- `40..59`: `11_000`;
- `60..79`: `11_500`;
- `80..100`: `12_000`.

The multiplier applies to strategic submarine-contact generation and convoy-route warning, not direct tactical weapon damage.

Current source coverage and report freshness are required. A capability score without relevant sources provides the neutral `10_000` multiplier.

## 26. Detection and Diplomatic Incidents

Every covert intelligence operation MUST declare:

- base detection probability;
- observer capability modifier;
- target counterintelligence modifier;
- operation-risk modifier;
- wartime or peacetime modifier;
- discovery evidence level;
- incident type and severity mapping;
- tension effects; and
- stream family.

The shipped detection stream is:

`intelligence/month/observer/target/operation_detection`

The shipped incident mapping is:

- evidence below `4_000` confidence: no public incident;
- `4_000..5_999`: severity `1`, tension `+1`;
- `6_000..7_999`: severity `2`, tension `+1`;
- `8_000..9_499`: severity `3`, tension `+2`;
- `9_500..10_000`: severity `4`, tension `+3`.

In active war, detection creates an intelligence event record but routine bilateral tension change is `0` unless neutral rights or third-party relations are affected.

Every tension change MUST use `DESIGN-17` typed effects and tension ledger.

## 27. Counterintelligence

Counterintelligence MUST be represented per nation and may:

- reduce hostile operation success;
- increase operation detection probability;
- produce deceptive assertions;
- identify compromised sources;
- create diplomatic evidence; and
- force source suspension.

It MUST NOT reveal the complete hostile intelligence program automatically.

Every effect requires an explicit policy, keyed decision when random, and knowledge record.

## 28. AI Fog of War

AI strategic planning MUST consume only:

- its own knowledge assertions;
- public facts;
- legally shared allied intelligence;
- received reports whose delivery time has arrived; and
- explicit difficulty-assistance grants.

AI MUST NOT read hidden enemy true state through selectors, aggregate totals, pathfinding, battle evaluation, sorting, or debug data.

An `InformationAssistanceGrant` MUST contain:

- difficulty profile;
- exact permitted attributes;
- error and confidence behavior;
- scope;
- duration;
- explanation and UI disclosure; and
- version.

A grant MUST NOT be represented as unrestricted truth access.

## 29. Allied Intelligence Sharing

Allied sharing requires an explicit access or treaty policy.

Shared assertions MUST retain original source, observer, confidence, dates, and deception state.

The shipped sharing penalty is `-500` confidence basis points per transfer, with a maximum of one transfer penalty regardless of later internal redistribution within the recipient nation.

Sharing MUST NOT convert an estimate into confirmed truth.

## 30. Canonical Ordering

Intelligence resolution MUST order:

1. observer nations by identifier;
2. observed nations by identifier;
3. programs by observer-observed pair;
4. operations by priority and operation identifier;
5. reports by observed time and report identifier;
6. assertions by subject, attribute, and assertion identifier;
7. detection checks by operation identifier; and
8. diplomatic effects by incident identifier.

Database insertion order, localized strings, UI order, and wall-clock processing MUST NOT affect results.

## 31. Required Reason Codes

The subsystem MUST define at least:

- `DUPLICATE_INTELLIGENCE_PROGRAM`;
- `INVALID_KNOWLEDGE_ASSERTION`;
- `KNOWLEDGE_ASSERTION_EXPIRED`;
- `FOG_OF_WAR_VIOLATION`;
- `ENEMY_CONSTRUCTION_NOT_OBSERVED`;
- `ENEMY_SHIP_ATTRIBUTE_NOT_REVEALED`;
- `OFFICIAL_FIGURE_DECEPTION_DETECTED`;
- `STRATEGIC_REPORT_NOT_YET_RECEIVED`;
- `REPORT_OVERWROTE_AUTHORITATIVE_STATE`;
- `RESEARCH_INSIGHT_INELIGIBLE`;
- `TECHNOLOGY_ACQUISITION_INELIGIBLE`;
- `WAR_PLAN_WARNING_INSUFFICIENT_CONFIDENCE`;
- `BATTLE_AVOIDANCE_INFORMATION_STALE`;
- `ASW_INTELLIGENCE_SOURCE_MISSING`;
- `INTELLIGENCE_OPERATION_DETECTED`;
- `DIPLOMATIC_INTELLIGENCE_INCIDENT_CREATED`; and
- `INTELLIGENCE_STATE_INVARIANT_FAILED`.

## 32. Validation and Acceptance

Automated validation MUST prove that:

1. truth and knowledge remain separate authoritative concepts;
2. every observed-nation program is unique per observer;
3. capability uses exact payment bands, gains, losses, and tiers;
4. every assertion has subject, attribute, value or interval, confidence, source, dates, decay, deception, and recipient;
5. confidence respects exact source caps;
6. projections merge assertions without mutating them;
7. initial enemy construction knowledge reveals only observed type, displacement interval, status, and location;
8. initial displacement interval is exactly plus or minus 20%;
9. completed-ship baseline estimates use exact type, displacement, weapon-count, caliber, and speed confidence and error values;
10. additional attributes require explicit sources;
11. official figures remain assertions and may be false only under explicit deception policy;
12. false declarations remain within exact permitted bounds;
13. reports record position, strength, identification, deception, and delivery delay explicitly;
14. position errors remain within exact source hop limits;
15. strength error uses exact confidence bands;
16. identification errors use explicit confusion sets;
17. reports are inaccessible before actual receipt time;
18. reports never mutate authoritative truth;
19. research insight uses exact source values and never bypasses prerequisites;
20. direct technology acquisition requires explicit permitted sources, eligibility, discovery, and adoption records;
21. war-plan warnings use exact 4,000, 6,000, and 8,000 confidence thresholds;
22. battle avoidance uses exact 1,000, 2,500, and 4,000 utility modifiers;
23. wartime ASW uses exact 10,000 through 12,000 capability multipliers and requires relevant sources;
24. operation detection uses exact evidence, severity, and tension mapping;
25. all tension effects use the diplomacy ledger;
26. AI consumes only legal knowledge and explicit bounded assistance;
27. allied sharing preserves provenance and applies exactly 500 confidence-point loss;
28. no UI, report, AI plan, sorting key, or automation leaks hidden truth; and
29. identical truth, knowledge, commands, content, ruleset, reports, and seeds produce identical assertions, estimates, operations, incidents, AI inputs, records, and hashes.
