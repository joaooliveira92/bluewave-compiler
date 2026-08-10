# DESIGN-20: Research And Technology

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-20`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Research spending, modifiers, allocation, reallocation, technology progress, discovery, adoption, production, and refit requirements MUST use the explicit fields, formulas, ordering, phase bindings, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Technology Fields

The canonical research-field identifiers are:

- `HULL_CONSTRUCTION`;
- `MACHINERY`;
- `SHIP_DESIGN`;
- `GUNNERY`;
- `FIRE_CONTROL`;
- `TORPEDOES`;
- `SUBMARINES`;
- `MINES_AND_ASW`;
- `AVIATION`;
- `CARRIER_OPERATIONS`;
- `RADAR_AND_ELECTRONICS`;
- `MISSILES`;
- `AMPHIBIOUS_OPERATIONS`;
- `INFRASTRUCTURE`; and
- `DAMAGE_CONTROL`.

The canonical registry MUST contain exactly these fifteen fields in this order. A missing, duplicate, or additional field requires a versioned design revision.

## 2. Technology Definition

Every technology MUST have one immutable `TechnologyDefinition` containing:

- `technologyId`;
- `researchFieldId`;
- ordered prerequisite technology identifiers;
- `prerequisiteDelayMonths`;
- canonical historical availability month;
- earliest and latest permitted availability months;
- variation eligibility metadata under `DESIGN-03`;
- research cost in research micro-points;
- ordered effect definitions;
- applicability type;
- adoption policy identifier;
- AI value formula identifier;
- scenario restrictions;
- discovery weight;
- mutual-exclusion group or `NONE`;
- content version; and
- content hash.

Research cost MUST be a positive integer. Discovery weight MUST be an integer within `1..1_000_000`.

Missing or invalid metadata MUST fail with `INVALID_TECHNOLOGY_DEFINITION`.

## 3. Technology Applicability

`applicabilityType` MUST be exactly one of:

- `IMMEDIATE_KNOWLEDGE`;
- `DOCTRINE_REQUIRES_TRAINING`;
- `EQUIPMENT_REQUIRES_PRODUCTION`;
- `MINOR_INSTALLATION`;
- `MAJOR_REFIT`;
- `NEW_CONSTRUCTION_ONLY`; or
- `NEW_AMMUNITION_PRODUCTION`.

Each applicability type MUST reference a complete adoption policy. Discovery alone applies only effects explicitly classified as immediate knowledge.

## 4. Research State

Every nation MUST have one authoritative `ResearchState` containing:

- `nationId`;
- paid monthly research expenditure;
- effective paid research resources;
- one field-priority record per canonical field;
- one field-progress account per canonical field;
- ordered technology-progress records;
- ordered discovered technology identifiers;
- ordered adoption-project identifiers;
- ordered production-requirement identifiers;
- ordered intelligence-insight records;
- research-resolution ledger position;
- content, ruleset, formula, and RNG versions; and
- aggregate hash.

A field or technology progress value MUST remain within `0..cost` inclusive.

A discovered technology MUST have progress exactly equal to its research cost.

## 5. Field Priorities

Each field MUST have exactly one priority:

- `HIGH` with weight `4`;
- `MEDIUM` with weight `2`; or
- `LOW` with weight `1`.

Weights are exact positive integers. The player and AI set field priorities, not the exact next technology.

At least one field MUST be `HIGH`. No more than five fields may be `HIGH`.

Priority changes MUST use a validated command and become effective at the next `RESOLVE_RESEARCH` phase after command lock.

A command naming a specific technology as the next discovery MUST be rejected with `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`.

## 6. Research Resolution Phase

Research MUST resolve exactly once per strategic month during `RESOLVE_RESEARCH` in `DESIGN-10`.

The canonical eight-stage pipeline is:

1. `CALCULATE_PAID_RESEARCH_RESOURCES`;
2. `APPLY_NATIONAL_AND_EDUCATION_MODIFIERS`;
3. `ALLOCATE_BY_FIELD_PRIORITY`;
4. `REALLOCATE_EXHAUSTED_FIELD_PROGRESS`;
5. `ADVANCE_ELIGIBLE_TECHNOLOGIES`;
6. `RESOLVE_DETERMINISTIC_DISCOVERY_SELECTION`;
7. `APPLY_DISCOVERY`;
8. `CREATE_ADOPTION_PRODUCTION_OR_REFIT_REQUIREMENTS`.

No stage may be skipped. A stage with no eligible work MUST emit a successful empty stage record.

Every stage MUST emit one `ResearchStageRecord` containing input hashes, ordered inputs, formulas, rounding, allocated amounts, remainders, outputs, reason codes, and output hash.

## 7. Stage 1: Paid Research Resources

Research resources MUST be derived only from actual paid research expenditure under `DESIGN-13`.

Let:

- `paidResearchExpenditure` be the balanced ledger amount paid this month;
- `effectiveResearchSpend` be the amount after the 10% full-efficiency and 10% to 12% diminishing-return rule in `DESIGN-13`; and
- `researchResourceConversionBp` be the explicit ruleset conversion multiplier.

The shipped conversion multiplier is exactly `10_000` basis points.

`basePaidResearchResources = floor(effectiveResearchSpend * researchResourceConversionBp / 10_000)`

Allocated, reserved, budgeted, deferred, unpaid, or arreared expenditure MUST contribute zero research resources.

If paid expenditure is zero, every later stage receives zero new monthly resources, but existing progress and adoption projects remain unchanged.

## 8. Stage 2: National and Education Modifiers

The active ruleset MUST define `research_resource_modifiers_v1`.

Modifiers MUST be applied in this exact order:

1. campaign research-speed multiplier from `DESIGN-03`;
2. national education modifier;
3. `poor_education` trait modifier from `DESIGN-12`;
4. `technology_leader` trait modifier from `DESIGN-12`;
5. government modifier;
6. event and temporary modifiers in ascending stable identifier order; and
7. final floor rounding.

The implementation MUST retain an exact rational numerator and denominator through all multiplier steps and round once at the end.

The shipped neutral modifier is `10_000` basis points.

`effectivePaidResearchResources = floor(basePaidResearchResources * productOfAllModifierBp / 10_000^modifierCount)`

No modifier may change prerequisites, availability, cost, effects, or applicability unless its owning contract explicitly defines that separate effect.

## 9. Stage 3: Allocate by Field Priority

### 9.1 Eligible Fields

A field is allocation-eligible when it contains at least one technology that:

- is not discovered;
- has all prerequisites discovered;
- has reached final campaign availability month;
- passes scenario restrictions;
- is not blocked by an unresolved mutual-exclusion result; and
- can accept positive progress.

Fields without an eligible technology are exhausted for this month's initial allocation.

### 9.2 Allocation Formula

Let `eligibleWeightTotal` be the sum of priority weights for eligible fields.

When `eligibleWeightTotal` is positive:

`exactFieldShare = effectivePaidResearchResources * fieldPriorityWeight / eligibleWeightTotal`

Each field initially receives the floor of its exact share. Remaining research micro-points MUST be distributed by:

1. descending fractional remainder;
2. descending priority weight; and
3. ascending research-field identifier.

The distributed total MUST equal effective paid research resources exactly.

When no field is eligible, all resources proceed to Stage 4 as unallocated remainder.

## 10. Stage 4: Reallocate Exhausted-Field Progress

### 10.1 Exhaustion During Resolution

A field becomes exhausted when all technologies eligible for progress in that field are completed or otherwise unable to accept additional progress during the current resolution.

Unused progress from an exhausted field MUST be reallocated and MUST NOT disappear.

### 10.2 Reallocation Procedure

Reallocation MUST occur in deterministic rounds:

1. calculate each field's unused amount;
2. sum unused amounts into `reallocationPool`;
3. remove exhausted fields from eligibility;
4. redistribute the pool among remaining eligible fields using Section 9.2;
5. advance technologies under Stage 5 capacity rules;
6. repeat until the pool is zero or no field remains eligible.

The maximum number of rounds is exactly `15`, equal to the number of canonical fields.

If no field remains eligible, the remaining pool MUST become `unspentResearchOverflow` for this month and MUST NOT carry forward.

The overflow MUST be reported with `NO_ELIGIBLE_RESEARCH_FIELD`.

## 11. Stage 5: Advance Eligible Technologies

### 11.1 One Active Candidate per Field

Each field MUST have at most one active technology candidate receiving ordinary research progress at a time.

The active candidate is chosen under Stage 6 before applying new progress when no candidate is already active.

An active candidate remains active until it is discovered, becomes invalid through an explicit ruleset transition, or is superseded through a typed migration. The player cannot replace it directly.

### 11.2 Progress Application

For each field in ascending field identifier order:

`remainingCost = technologyResearchCost - technologyProgressBefore`

`appliedProgress = min(fieldAllocation, remainingCost)`

`technologyProgressAfter = technologyProgressBefore + appliedProgress`

`unusedFieldProgress = fieldAllocation - appliedProgress`

Progress MUST use research micro-points and integer arithmetic.

A technology is discovery-ready exactly when progress equals cost.

Progress MUST NOT exceed cost.

### 11.3 Intelligence Insight

Intelligence insight MUST reference a technology or research field and contain an exact research micro-point value.

Technology-specific insight applies before ordinary monthly progress to that technology and is capped by remaining cost.

Field insight joins that month's field allocation before candidate progress.

Insight MUST NOT bypass prerequisites, availability, scenario restrictions, or mutual exclusivity.

Unused technology-specific insight remains stored until the technology becomes eligible unless its explicit expiration policy says otherwise.

## 12. Stage 6: Deterministic Discovery Selection

### 12.1 Candidate Set

When a field has no active candidate, the resolver MUST build a candidate set of all technologies satisfying Stage 9.1.

Candidates MUST be ordered by ascending `technologyId`.

### 12.2 Selection Weight

Each candidate's integer weight is:

`finalDiscoveryWeight = max(1, floor(baseDiscoveryWeight * historicalTimingModifierBp * nationalAffinityModifierBp * AIOrPlayerPolicyModifierBp * insightModifierBp / 10_000^4))`

The shipped historical timing modifiers are:

- more than 60 months before canonical historical availability: ineligible;
- 25 to 60 months before: `5_000` basis points;
- 1 to 24 months before: `8_000`;
- canonical month through 60 months after: `10_000`;
- more than 60 months after: `12_500`.

Final campaign availability from the immutable technology manifest remains a hard eligibility boundary. The historical modifier does not permit selection before that boundary.

### 12.3 Keyed Selection

Selection MUST use stream `research/month/nation/field` keyed by:

- RNG algorithm version;
- campaign seed;
- campaign month;
- nation identifier;
- field identifier;
- ordered candidate-set hash;
- discovery-selection formula version; and
- decision type `select_active_technology`.

Weighted selection MUST use exact integer cumulative weights in candidate order.

A single candidate is selected without consuming a random draw but MUST still emit a deterministic selection record.

No candidate means the field remains exhausted and emits `NO_ELIGIBLE_TECHNOLOGY`.

UI navigation, reports, previews, and AI planning MUST NOT consume this stream.

## 13. Stage 7: Apply Discovery

A discovery MUST occur immediately when technology progress reaches cost.

The resolver MUST:

1. verify prerequisites again;
2. verify final availability and scenario restrictions;
3. mark the technology discovered;
4. set discovery month and phase;
5. preserve final progress equal to cost;
6. apply only `IMMEDIATE_KNOWLEDGE` effects;
7. resolve mutual-exclusion consequences;
8. emit a `TechnologyDiscoveryRecord`;
9. create a causal record; and
10. release the field's active-candidate slot.

A technology MUST NOT be discovered twice.

Discovery MUST NOT automatically apply equipment, doctrine, installation, refit, production, or new-construction effects.

Failure of any validation MUST roll back discovery and emit `TECHNOLOGY_DISCOVERY_VALIDATION_FAILED`.

## 14. Multiple Discoveries in One Month

A field MAY discover more than one technology in one month only when reallocated progress remains after completing the current technology.

After each discovery:

1. rebuild the eligible candidate set;
2. select the next active technology under Stage 6;
3. apply remaining progress; and
4. continue until progress is exhausted or no candidate remains.

The maximum discoveries per field per month is exactly `8`.

Reaching the maximum leaves unused progress for Stage 4 reallocation and emits `FIELD_MONTHLY_DISCOVERY_LIMIT_REACHED`.

## 15. Stage 8: Adoption and Requirement Creation

For every discovery, the resolver MUST execute the policy matching its applicability type.

### 15.1 Immediate Knowledge

`IMMEDIATE_KNOWLEDGE` effects become active in the discovery transaction. No project is created.

### 15.2 Doctrine Requires Training

Create one `DoctrineAdoptionRequirement` containing:

- technology identifier;
- eligible organizations;
- training duration;
- paid training cost;
- readiness effects;
- completion predicate; and
- adoption version.

The shipped default training duration is `6` completed paid months. A technology MAY declare another explicit value within `1..24` months.

### 15.3 Equipment Requires Production

Create one or more `EquipmentProductionRequirement` records containing equipment type, quantity formula, production work, unit cost, inventory destination, prerequisites, and adoption version.

No unit receives the equipment before inventory exists and an installation or assignment rule succeeds.

### 15.4 Minor Installation

Create an installation eligibility and inventory requirement. Installation MUST use a project or monthly installation command and may make the asset unavailable for the owning contract's exact duration.

The shipped default duration is `1` strategic month.

### 15.5 Major Refit

Create a `MajorRefitRequirement` referencing permitted ship classes, work packages, dock requirements, cost, design recompilation, and resulting design-version rules.

Discovery does not schedule or complete refits automatically.

### 15.6 New Construction Only

Mark the technology available to designs whose approval occurs after discovery and adoption predicates pass.

Existing compiled designs and ships remain unchanged unless another refit or administrative rule explicitly permits adoption.

### 15.7 New Ammunition Production

Create an ammunition-production requirement with inventory type, production work, cost, compatibility, and distribution rules.

Existing compatible weapons may use the ammunition only after inventory is produced and supplied.

## 16. Prerequisites

The technology graph MUST be acyclic.

A technology is prerequisite-eligible only when every mandatory prerequisite is discovered and any declared prerequisite delay has elapsed.

The compiler MUST validate the graph in canonical topological order with ascending technology identifier tie-breaking.

A cycle MUST fail with `TECHNOLOGY_PREREQUISITE_CYCLE`.

A missing prerequisite MUST fail with `TECHNOLOGY_PREREQUISITE_MISSING`.

## 17. Technology Variation Binding

Technology variation MUST be materialized once during campaign compilation under `DESIGN-03`.

Runtime research MUST read:

- final availability month;
- final varied effect values;
- variation eligibility;
- prerequisite-preserving manifest; and
- manifest hash.

Runtime research MUST NOT reroll dates or effects.

A varied technology MUST NOT become eligible before its prerequisite chain permits it.

A manifest mismatch MUST fail load or research resolution with `TECHNOLOGY_MANIFEST_MISMATCH`.

## 18. Mutual Exclusion

A mutual-exclusion group MUST define exactly one policy:

- `FIRST_DISCOVERED_LOCKS_OTHERS`;
- `FIRST_ADOPTED_LOCKS_OTHERS`;
- `BRANCH_CHOICE_EVENT`; or
- `NON_EXCLUSIVE_LABEL`.

When exclusion applies, blocked technologies MUST receive explicit status `BLOCKED_BY_MUTUAL_EXCLUSION` and reference the causing technology or choice.

Progress already accumulated on a newly blocked technology MUST be preserved in history but MUST NOT be reallocated retroactively.

## 19. AI Research Behavior

AI research uses the same field priorities, progress, candidate eligibility, discovery selection, and adoption contracts as the player.

AI policy MAY change field priorities through normal commands.

AI value affects:

- priority-setting utility;
- adoption scheduling;
- equipment-production planning; and
- refit planning.

It MUST NOT alter research cost, discovery weight outside an explicit policy modifier, prerequisites, availability, or technology effects.

AI research MUST use legal knowledge and MUST NOT inspect undiscovered technology outcomes beyond canonical metadata permitted to all participants.

## 20. Research Records and Explanation

Every monthly resolution MUST produce one immutable `ResearchResolutionRecord` containing:

- nation and month;
- paid and effective research resources;
- modifier breakdown;
- field priorities and weights;
- initial allocations;
- reallocation rounds;
- active candidates;
- progress before and after;
- insights applied;
- selection records;
- discoveries;
- adoption and production requirements;
- unused overflow;
- RNG decision identifiers;
- ruleset and formula versions; and
- record hash.

Player-facing reports MUST expose all legally visible inputs, modifiers, allocation, progress, discoveries, and requirements. Hidden candidate identities MUST remain protected when the game design marks them hidden.

## 21. Canonical Ordering

Research resolution MUST use:

1. field order from Section 1;
2. ascending technology identifiers;
3. ascending insight identifiers;
4. ascending modifier identifiers after fixed national modifier order;
5. reallocation remainder, weight, and field identifier tie-breaking; and
6. discovery records in actual resolution order.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect outcomes.

## 22. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_TECHNOLOGY_DEFINITION`;
- `INVALID_RESEARCH_STATE`;
- `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`;
- `RESEARCH_PRIORITY_CONSTRAINT_VIOLATED`;
- `NO_ELIGIBLE_RESEARCH_FIELD`;
- `NO_ELIGIBLE_TECHNOLOGY`;
- `TECHNOLOGY_NOT_YET_AVAILABLE`;
- `TECHNOLOGY_PREREQUISITE_MISSING`;
- `TECHNOLOGY_PREREQUISITE_UNSATISFIED`;
- `TECHNOLOGY_PREREQUISITE_CYCLE`;
- `TECHNOLOGY_DISCOVERY_VALIDATION_FAILED`;
- `TECHNOLOGY_ALREADY_DISCOVERED`;
- `FIELD_MONTHLY_DISCOVERY_LIMIT_REACHED`;
- `TECHNOLOGY_MANIFEST_MISMATCH`;
- `ADOPTION_POLICY_MISSING`;
- `RESEARCH_REQUIREMENT_CREATION_FAILED`; and
- `RESEARCH_STATE_INVARIANT_FAILED`.

## 23. Validation and Acceptance

Automated validation MUST prove that:

1. the registry contains exactly fifteen canonical fields in declared order;
2. every technology has complete identifiers, field, prerequisites, availability, variation, cost, effects, applicability, AI, and scenario metadata;
3. priorities use exact weights `4`, `2`, and `1`;
4. at least one and at most five fields are high priority;
5. the player and AI cannot select an exact next technology;
6. research resolves exactly once per month through all eight stages;
7. only paid effective expenditure creates research resources;
8. national modifiers execute in exact declared order and round once;
9. initial field allocation preserves the exact total through largest-remainder allocation;
10. exhausted-field progress is reallocated deterministically for at most fifteen rounds;
11. unreallocatable overflow does not carry forward;
12. every field has at most one active technology candidate;
13. progress never exceeds technology cost;
14. insights do not bypass prerequisites, availability, or scenario restrictions;
15. candidate sets are canonical and weighted selection uses the declared keyed stream;
16. a one-candidate selection emits a record without a random draw;
17. discovery revalidates prerequisites and availability atomically;
18. discovery applies only immediate-knowledge effects directly;
19. a field may discover at most eight technologies per month;
20. every non-immediate applicability type creates its exact requirement record;
21. doctrine training defaults to six paid months and minor installation defaults to one month;
22. the prerequisite graph is acyclic and deterministically ordered;
23. runtime research never rerolls the immutable technology manifest;
24. mutual exclusion produces explicit blocked states;
25. AI uses the same research and adoption contracts as the player;
26. every monthly result contains complete allocation, progress, selection, discovery, requirement, RNG, and version records; and
27. identical state, commands, content, ruleset, manifest, and seeds produce identical allocations, progress, discoveries, requirements, records, and hashes.
