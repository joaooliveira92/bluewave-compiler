# DESIGN-12: Nations And Governments

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-12`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Every government and trait effect MUST use the concrete identifiers, fixed-point values, predicates, phase bindings, stacking rules, and failure behavior defined here. Runtime inference and descriptive-mechanics parsing are prohibited.

## 1. Nation State

Every active nation MUST have one authoritative `NationState` containing:

- `nationId`;
- `countryIdentityId`;
- `scenarioNationInstanceId`;
- `playableSlotId` or `NONE`;
- `politicalRegimeId`;
- `governmentTypeId`;
- active trait instances;
- strategic objective identifiers;
- base resources;
- naval appropriation rate;
- treasury and ledger references;
- industrial capability state;
- possession identifiers;
- oil-access and supply state;
- technology-state reference;
- fleet-state reference;
- officer and manpower references;
- diplomatic-relation references;
- war-participant references;
- political-state reference;
- intelligence-state reference;
- content and ruleset versions; and
- aggregate hash.

A nation MUST reference exactly one current government type and political regime. Identity layers MUST conform to `DESIGN-04`.

Missing required state MUST fail with `INVALID_NATION_STATE`.

## 2. Government Types

The canonical government type identifiers are:

- `liberal_democracy`;
- `limited_democracy`;
- `autocratic`;
- `fascist`;
- `communist`; and
- `eastern`.

Each `GovernmentTypeDefinition` MUST declare versioned policies for:

- political tolerance;
- treaty compliance;
- revolution eligibility and susceptibility;
- alliance compatibility;
- budget behavior;
- political mandates;
- colonial policy;
- officer policy;
- wartime mobilization; and
- conditional-trait compatibility.

A government type MUST NOT create numerical effects from its display text. Every effect MUST reference a named policy or formula.

Missing policies MUST fail content validation with `INCOMPLETE_GOVERNMENT_TYPE_DEFINITION`.

## 3. Trait Definition Contract

Every trait MUST have one versioned `TraitDefinition` containing:

- `traitId`;
- `traitCategory`;
- `ownerType`;
- `scope`;
- `activationPredicateId`;
- `deactivationPredicateId` or `NONE`;
- `startPhaseId`;
- `endPhaseId` or `NONE`;
- `durationMonths` or `PERMANENT`;
- `stackingGroupId`;
- `stackingMode`;
- `maximumStacks`;
- `applicableScenarioIds`;
- `compatibleGovernmentTypeIds`;
- ordered effect definitions;
- explanation keys;
- content version; and
- content hash.

`traitCategory` MUST be one of:

- `industrial_capability`;
- `strategic_obligation`;
- `education_and_personnel`;
- `research_affinity`;
- `political_behavior`;
- `ai_personality`;
- `tactical_doctrine`;
- `ship_quality`; or
- `conditional_wartime_policy`.

`ownerType` MUST be exactly one of:

- `COUNTRY_IDENTITY`;
- `POLITICAL_REGIME`; or
- `TEMPORARY_NATION_STATE`.

`stackingMode` MUST be exactly one of:

- `NON_STACKING`;
- `ADDITIVE_BASIS_POINTS`;
- `MULTIPLICATIVE_BASIS_POINTS`;
- `HIGHEST_MAGNITUDE`; or
- `EXCLUSIVE`.

All canonical traits in Section 5 use `NON_STACKING` with `maximumStacks: 1` unless explicitly stated otherwise. Duplicate instances MUST NOT multiply an effect.

Missing activation, scope, ownership, duration, or stacking metadata MUST fail with `INVALID_TRAIT_DEFINITION`.

## 4. Trait Evaluation

Trait activation MUST be evaluated at:

1. campaign compilation;
2. an accepted government or regime transition;
3. a typed event that adds or removes a trait;
4. war entry or exit when the trait has wartime conditions;
5. the owning trait's declared monthly phase; and
6. save-load invariant rebuilding.

Traits MUST be evaluated in ascending `traitId` order. Effects in one trait MUST execute in their declared order.

When multiple traits affect one value:

1. apply exclusive replacements;
2. sum additive basis-point modifiers;
3. apply multiplicative basis-point modifiers in ascending `traitId` order;
4. apply declared bounds; and
5. apply the formula's declared rounding once.

All authoritative arithmetic MUST conform to `DESIGN-07`.

## 5. Canonical Trait Mechanics

### 5.1 Efficient Shipbuilding

- `traitId`: `efficient_shipbuilding`;
- category: `industrial_capability`;
- scope: domestic new-construction work-rate calculation;
- work-rate multiplier: exactly `11_000` basis points;
- permitted ruleset range: `10_500..11_500` basis points inclusive;
- shipped value: `11_000`;
- rounding: `FLOOR`;
- phase: monthly project resolution;
- stacking: `NON_STACKING`.

For each eligible project:

`effectiveWorkCapacity = floor(baseWorkCapacity * 11_000 / 10_000)`

Eligibility requires:

- project type `new_construction`;
- builder nation has the active trait;
- builder is domestic to the owning nation; and
- project is active and paid for the month.

The trait MUST NOT reduce `totalWork`, project cost, historical work, remaining liability, or elapsed time directly. Completion is determined only when accumulated work reaches total work.

A ruleset MAY select another value within the permitted range, but the selected value MUST be explicit and versioned. Missing value MUST fail with `MISSING_EFFICIENT_SHIPBUILDING_MULTIPLIER`.

### 5.2 Undeveloped Shipbuilding

- `traitId`: `undeveloped_shipbuilding`;
- category: `industrial_capability`;
- work-rate multiplier: exactly `9_000` basis points;
- permitted range: `8_500..9_500` basis points inclusive;
- shipped value: `9_000`;
- latent-defect probability multiplier: exactly `12_500` basis points;
- permitted defect range: `11_000..15_000` basis points inclusive;
- rounding: `FLOOR` for work and `HALF_EVEN` for probability multiplication;
- stacking: `NON_STACKING`.

For eligible domestic new construction:

`effectiveWorkCapacity = floor(baseWorkCapacity * 9_000 / 10_000)`

For an eligible latent-defect check:

`modifiedDefectProbabilityBp = min(10_000, roundHalfEven(baseDefectProbabilityBp * 12_500 / 10_000))`

The trait modifies defect probability only. It MUST NOT change defect severity or repairability unless another explicit effect does so.

### 5.3 Global Naval Power

- `traitId`: `global_naval_power`;
- category: `strategic_obligation`;
- global foreign-station minimum: exactly `1_000` basis points of eligible tonnage;
- permitted range: `1_000..2_000` basis points inclusive;
- shipped value: `1_000`;
- stacking: `NON_STACKING`.

At monthly compliance resolution:

`globalRequiredTonnageKg = ceiling(globalEligibleTonnageKg * globalForeignStationMinimumBp / 10_000)`

This global minimum is added as a floor after area-specific possession obligations are calculated. The nation's final global requirement MUST equal the greater of:

- the sum required by area-specific obligations; or
- `globalRequiredTonnageKg`.

Qualifying tonnage, area allocation, colonial-service weighting, cramped penalties, short-range penalties, wartime suspension, and grace periods MUST be defined by the deployment contract.

#### Cramped Accommodation

New construction is subject to the prohibition when:

- the builder nation has `global_naval_power` active;
- the design is submitted after trait activation;
- intended ship type is not `SS`, `MTB`, `TR`, or another ruleset-declared exempt type; and
- the design is intended for commissioned naval service.

An applicable design with `accommodationStandardId: cramped` MUST be rejected at design approval with `CRAMPED_ACCOMMODATION_PROHIBITED`.

Existing ships, captured ships, foreign ships obtained after completion, and projects already locked before trait activation are not retroactively invalidated.

#### Rival Budget Parity Reaction

The government reaction is mandatory to evaluate, not guaranteed to trigger.

At political end-of-month resolution, the evaluator MUST compare the player's or AI nation's trailing 12-month paid naval expenditure against every active rival identified by strategic objectives or rivalry state.

Parity pressure exists when a rival's trailing expenditure is at least `9_500` basis points of the nation's expenditure and the rival's expenditure is greater than the nation's expenditure.

The shipped thresholds are:

- evaluation window: `12` completed months;
- parity threshold: `9_500` basis points;
- event cooldown: `12` months;
- minimum bilateral tension: `4` on the canonical tension scale.

When all predicates pass, enqueue typed political event `global_power_rival_budget_parity_v1`. The event definition, not trait prose, declares budget, confidence, mandate, and tension effects.

### 5.4 Cautious

- `traitId`: `cautious`;
- categories: `ai_personality` and `political_behavior`;
- offensive operational-risk utility multiplier: `8_500` basis points;
- withdrawal utility multiplier: `12_000` basis points;
- major-defeat confidence-loss multiplier for the player nation: `12_500` basis points;
- major-defeat political-capital-loss multiplier: `12_500` basis points;
- stacking: `NON_STACKING`.

A `major defeat` exists only when the battle or war result emits `MAJOR_DEFEAT` under its owning result contract.

For AI decisions, the trait MUST modify declared integer utility terms only. It MUST NOT alter combat statistics, enemy information, legality, or random outcomes.

For player-nation political consequences:

`modifiedLoss = ceiling(baseLoss * 12_500 / 10_000)`

Loss magnitudes are non-negative integers and are applied as negative state deltas. The trait MUST NOT create a penalty when the base loss is zero.

### 5.5 Poor Education

- `traitId`: `poor_education`;
- category: `education_and_personnel`;
- newly generated crew-quality modifier: `-10` score points;
- newly generated pilot-pool-quality modifier: `-10` score points;
- monthly research-efficiency multiplier: `9_000` basis points;
- permitted research range: `8_500..9_500`;
- stacking: `NON_STACKING`.

Crew and pilot modifiers apply when a new crew cohort, replacement cohort, or pilot cohort is materialized. Resulting quality MUST be clamped once to the owning contract's canonical range.

Existing individual experience is not retroactively reduced on trait activation.

Research progress is calculated as:

`modifiedResearchProgress = floor(progressAfterPaidSpendingAndBeforeFieldAllocation * 9_000 / 10_000)`

The trait MUST NOT alter prerequisites, availability dates, technology effects, adoption costs, or spending limits.

### 5.6 Surprise Attack

- `traitId`: `surprise_attack`;
- category: `conditional_wartime_policy`;
- base first-entry eligibility probability: exactly `8_000` basis points;
- permitted range: `7_000..9_000` basis points inclusive;
- shipped value: `8_000`;
- uses per campaign: exactly `1`;
- eligibility window: first `2` strategic months after the nation's entry into a war;
- stacking: `NON_STACKING`.

Eligibility requires all predicates to be true:

- nation has the active trait;
- nation is entering the specific war for the first time;
- the opportunity occurs during war-entry month or the immediately following month;
- no prior surprise opportunity for that nation has resolved in the campaign;
- an explicit legal target and operation opportunity exist;
- no authoritative intelligence state marks the target as fully warned;
- scenario and government compatibility permit the policy; and
- the opportunity predicate returns true.

The final probability MUST be:

`clamp(0, 10_000, baseProbabilityBp + dateModifierBp + intelligenceModifierBp + opportunityModifierBp + rulesetModifierBp)`

All modifiers MUST be explicit ruleset fields or typed opportunity values. The check MUST use the domain-separated stream `war_entry/nation/surprise_attack`.

When an eligible check resolves, successful or unsuccessful, the campaign use is consumed. A second check MUST fail with `SURPRISE_ATTACK_ALREADY_USED`.

### 5.7 Inconsistent Naval Policy

- `traitId`: `inconsistent_naval_policy`;
- category: `political_behavior`;
- procurement-mandate opportunity-weight multiplier: `15_000` basis points;
- mandate-severity weight multiplier: `12_500` basis points;
- minimum cooldown between trait-generated mandates: `6` months;
- maximum trait-generated mandates per rolling 12 months: `2`;
- stacking: `NON_STACKING`.

The trait modifies only the eligible typed-event weights for procurement mandates. It MUST NOT create a mandate outside the scheduled national-event phase.

After weighting, deterministic event selection MUST use the politics event stream and canonical event ordering. If no mandate is eligible, no event is generated.

Severity MUST be selected only among levels explicitly supported by the chosen mandate definition.

### 5.8 Attention to Detail

- `traitId`: `attention_to_detail`;
- category: `ship_quality`;
- latent-defect probability multiplier: `7_500` basis points;
- latent-defect severity-weight multiplier: `8_000` basis points for severity levels above `MINOR`;
- stacking: `NON_STACKING`.

Probability calculation:

`modifiedDefectProbabilityBp = roundHalfEven(baseDefectProbabilityBp * 7_500 / 10_000)`

For defect severity selection, weights for `MODERATE`, `MAJOR`, and `CRITICAL` MUST be multiplied by `8_000` basis points. `MINOR` weight remains unchanged. Weights MUST then be normalized by deterministic largest-remainder allocation.

The trait MUST NOT guarantee defect absence.

### 5.9 Technology Leader

- `traitId`: `technology_leader`;
- category: `research_affinity`;
- monthly research-efficiency multiplier: `11_000` basis points;
- AI technical-competitiveness utility multiplier: `12_500` basis points;
- intelligence-derived technology-insight multiplier: `11_000` basis points;
- stacking: `NON_STACKING`.

Research progress:

`modifiedResearchProgress = floor(progressAfterPaidSpendingAndNationalEducation * 11_000 / 10_000)`

The AI multiplier applies only to declared research-priority and adoption utility terms.

The trait MUST NOT:

- grant a technology;
- bypass a prerequisite;
- move availability dates;
- change technology effects;
- create unpaid research progress; or
- guarantee discovery.

Any attempt to discover a technology without satisfied prerequisites MUST fail with `TECHNOLOGY_PREREQUISITE_UNSATISFIED`.

### 5.10 Hidden Faults

- `traitId`: `hidden_faults`;
- category: `ship_quality`;
- latent-defect probability multiplier: `15_000` basis points;
- severity-weight multiplier: `12_500` basis points for `MAJOR` and `CRITICAL`;
- stacking: `NON_STACKING`.

Probability calculation:

`modifiedDefectProbabilityBp = min(10_000, roundHalfEven(baseDefectProbabilityBp * 15_000 / 10_000))`

Severity weights for `MAJOR` and `CRITICAL` MUST be multiplied by `12_500` basis points before deterministic normalization. Other severity weights remain unchanged.

Generated defects remain hidden authoritative state and follow the construction defect contract for discovery and repair.

### 5.11 Kamikaze

- `traitId`: `kamikaze`;
- category: `conditional_wartime_policy`;
- owner type: `TEMPORARY_NATION_STATE`;
- stacking: `NON_STACKING`;
- evaluation phase: political end-of-month effects and pre-battle air availability.

The policy is active only when all predicates are true:

- government type is `fascist`, `autocratic`, or `eastern`;
- required technology `kamikaze_operations` is discovered and adopted;
- nation is in an active war;
- nation is in `LOSING_WAR` state for that war;
- war has lasted at least `6` completed months;
- side war score is at most `-20` under the canonical war-score scale;
- operational aircraft and eligible pilots exist;
- a typed activation decision or AI policy has activated the temporary state; and
- scenario date is January 1944 or later.

The shipped effects are:

- designated kamikaze strike hit-probability multiplier: `13_000` basis points;
- designated kamikaze strike damage multiplier: `12_000` basis points;
- designated kamikaze strike aircraft-loss probability: `10_000` basis points;
- ordinary offensive strike allocation utility multiplier: `11_500` basis points;
- CAP allocation utility multiplier: `7_500` basis points;
- defensive interception reserve multiplier: `8_000` basis points;
- pilot-pool expenditure multiplier for designated missions: `10_000` basis points.

A designated kamikaze aircraft that launches MUST be recorded as lost after its attack resolution regardless of hit outcome. Recovery is prohibited.

The policy MUST NOT apply to non-designated missions, grant technology, create aircraft or pilots, bypass weather or range restrictions, or alter enemy defense statistics.

When any activation predicate becomes false, no new kamikaze mission may launch. Already airborne missions resolve under the policy version captured at launch.

## 6. Trait Interaction Rules

### 6.1 Shipbuilding Traits

`efficient_shipbuilding` and `undeveloped_shipbuilding` belong to exclusive stacking group `shipbuilding_development`.

A nation MUST NOT have both active simultaneously. Content or transition producing both MUST fail with `CONFLICTING_SHIPBUILDING_TRAITS`.

### 6.2 Defect Modifiers

`undeveloped_shipbuilding`, `attention_to_detail`, and `hidden_faults` modify one base defect probability in ascending `traitId` order using their declared multipliers.

The final probability MUST be clamped once to `0..10_000` basis points after all multipliers.

`attention_to_detail` and `hidden_faults` MAY coexist. Their opposed effects do not cancel symbolically; both multipliers MUST be applied in canonical order.

### 6.3 Research Modifiers

Research modifiers MUST execute in this order:

1. paid spending base;
2. campaign research-speed setting;
3. `poor_education`;
4. `technology_leader`;
5. event and temporary modifiers in ascending stable identifier order;
6. final floor rounding; and
7. field allocation.

Each intermediate multiplication MUST retain an exact rational numerator and denominator. Rounding MUST occur once after the final multiplier unless the owning research formula explicitly requires an earlier integer boundary.

### 6.4 AI Modifiers

AI-personality and policy traits may modify only named integer utility terms. They MUST NOT alter command legality, resource availability, fog of war, authoritative combat values, or selection tie-breaking.

## 7. Government and Regime Transitions

A government or regime transition MUST:

1. apply through a typed event or continuity transition;
2. preserve nation and playable-slot identity where required;
3. replace the government and regime identifiers atomically;
4. reevaluate government-owned and conditional traits;
5. add or remove traits only through explicit transition effects;
6. preserve trait history;
7. revalidate active mandates, officer eligibility, treaties, and policies; and
8. emit a causal record and post-transition aggregate hash.

Trait deactivation MUST NOT reverse already completed authoritative effects unless the transition explicitly defines a compensating effect.

## 8. Persistence and Explanation

Every active `TraitInstance` MUST contain:

- `traitInstanceId`;
- `traitId` and definition version;
- owner identifier and owner type;
- activation date and phase;
- activation cause identifier;
- expiration date or `PERMANENT`;
- active effect identifiers;
- stack count;
- source content hash;
- ruleset hash; and
- instance hash.

Player-facing explanations MUST identify all visible trait modifiers, base values, basis-point multipliers, ordering, rounding, and final results. Hidden information MUST remain redacted under the intelligence contract.

## 9. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_NATION_STATE`;
- `INCOMPLETE_GOVERNMENT_TYPE_DEFINITION`;
- `INVALID_TRAIT_DEFINITION`;
- `TRAIT_ACTIVATION_PREDICATE_FAILED`;
- `TRAIT_GOVERNMENT_INCOMPATIBLE`;
- `TRAIT_SCENARIO_INCOMPATIBLE`;
- `CONFLICTING_SHIPBUILDING_TRAITS`;
- `MISSING_EFFICIENT_SHIPBUILDING_MULTIPLIER`;
- `CRAMPED_ACCOMMODATION_PROHIBITED`;
- `SURPRISE_ATTACK_ALREADY_USED`;
- `SURPRISE_ATTACK_OPPORTUNITY_INELIGIBLE`;
- `TECHNOLOGY_PREREQUISITE_UNSATISFIED`;
- `KAMIKAZE_POLICY_INELIGIBLE`; and
- `TRAIT_EFFECT_CONTRACT_MISSING`.

## 10. Validation and Acceptance

Automated validation MUST prove that:

1. every government type has all required policy references;
2. every trait declares scope, owner, activation, duration, stacking, scenarios, effects, and versions;
3. efficient shipbuilding uses exactly `11_000` basis points in the shipped ruleset;
4. undeveloped shipbuilding uses `9_000` work-rate and `12_500` defect-probability basis points;
5. shipbuilding speed changes effective work and never total work or cost;
6. global naval power enforces a `1_000` basis-point eligible-tonnage floor;
7. cramped accommodation is rejected only for explicitly applicable new construction;
8. rival-budget pressure uses a 12-month window, `9_500` parity threshold, tension `4`, and 12-month cooldown;
9. cautious AI modifies only declared utility terms;
10. cautious political losses use a `12_500` basis-point multiplier only after a `MAJOR_DEFEAT` result;
11. poor education applies `-10` to new crew and pilot cohorts and `9_000` to research efficiency;
12. surprise attack uses `8_000` basis points, a two-month window, and one resolved check per campaign;
13. inconsistent naval policy uses `15_000` mandate weight, `12_500` severity weight, six-month cooldown, and two-event rolling cap;
14. attention to detail uses `7_500` defect probability and `8_000` elevated-severity weights;
15. technology leader uses `11_000` research efficiency without granting or bypassing technology;
16. hidden faults uses `15_000` defect probability and `12_500` major/critical severity weights;
17. kamikaze activation requires every declared government, technology, war, date, score, duration, asset, and decision predicate;
18. launched designated kamikaze aircraft are always lost;
19. trait conflicts fail rather than resolve by insertion order;
20. combined modifiers use deterministic order and declared rounding;
21. government transitions reevaluate traits atomically;
22. trait effects survive save and load with identical versions and hashes; and
23. identical state, ruleset, commands, and seeds produce identical trait activation and effect results.
