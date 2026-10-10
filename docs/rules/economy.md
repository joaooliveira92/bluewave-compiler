# DESIGN-13: Economy And Accounting

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-13`
> **Amended by:** ADR-0060.
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. All authoritative monetary values MUST use integer currency micro-units under `DESIGN-07`. Every posting, priority, arrear, growth, surplus, research, construction, acceleration, and wartime-cost rule MUST use the explicit fields and formulas defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Economic State

Every active nation MUST have one authoritative `EconomicState` containing:

- `nationId`;
- `baseResources`;
- `navalAppropriationRateBp`;
- `monthlyNavalAppropriation`;
- `treasuryBalance`;
- ordered committed-obligation identifiers;
- ordered arrear identifiers;
- possession-income state;
- ordered wartime modifier identifiers;
- annual-growth state;
- financial-ledger reference;
- research-spending state;
- insolvency state;
- surplus state;
- ruleset version; and
- aggregate hash.

All monetary fields MUST use currency micro-units. Rates and multipliers MUST use integer basis points.

`treasuryBalance` MUST remain within `0..9_000_000_000_000_000` currency micro-units inclusive at every committed transaction boundary.

A missing or invalid economic state MUST fail with `INVALID_ECONOMIC_STATE`.

## 2. Financial Ledger

Every authoritative monetary change MUST be represented by one balanced `LedgerTransaction` containing:

- `transactionId`;
- `campaignMonth`;
- `phaseId`;
- `nationId`;
- `categoryId`;
- ordered debit and credit postings;
- formula identifier and version;
- rounding mode;
- command, event, project, treaty, or resolution cause identifier;
- pre-transaction ledger hash;
- post-transaction ledger hash; and
- transaction hash.

Postings within one transaction MUST sum to exactly zero currency micro-units.

The ledger MUST support these canonical categories:

- `OPENING_TREASURY`;
- `NAVAL_APPROPRIATION`;
- `POSSESSION_INCOME`;
- `EVENT_INCOME`;
- `REPARATIONS_INCOME`;
- `CONSTRUCTION_EXPENDITURE`;
- `REBUILD_EXPENDITURE`;
- `REPAIR_EXPENDITURE`;
- `MAINTENANCE_EXPENDITURE`;
- `RESEARCH_EXPENDITURE`;
- `INTELLIGENCE_EXPENDITURE`;
- `TRAINING_EXPENDITURE`;
- `INFRASTRUCTURE_EXPENDITURE`;
- `AIRCRAFT_PROCUREMENT`;
- `MISSILE_PROCUREMENT`;
- `TREATY_LOSS`;
- `SCRAPPING_LOSS`;
- `ARREAR_CREATED`;
- `ARREAR_PAYMENT`;
- `POLITICAL_RECLAMATION`;
- `ACCELERATION_PREMIUM`;
- `PROJECT_PRESERVATION_COST`; and
- `WARTIME_OPERATING_COST`.

Opening and closing treasury values MUST be derived from ledger postings and MUST NOT be stored as competing authority.

An unbalanced posting MUST fail atomically with `UNBALANCED_FINANCIAL_POSTING`.

## 3. Monthly Naval Appropriation

Monthly naval appropriation MUST be calculated during `POST_MONTHLY_REVENUE` after pre-spending political and budget changes.

The active ruleset MUST define:

- `annualToMonthlyAppropriationFormulaId`;
- `appropriationRoundingMode` with shipped value `FLOOR`;
- `minimumNavalAppropriationRateBp`;
- `maximumNavalAppropriationRateBp`; and
- `appropriationFormulaVersion`.

The canonical formula is:

`annualNavalAppropriation = floor(baseResources * navalAppropriationRateBp / 10_000)`

`monthlyNavalAppropriation = floor(annualNavalAppropriation / 12)`

Campaign fleet-size scaling from `DESIGN-03` MUST be applied at the owning appropriation formula's declared step and exactly once.

## 4. Annual Base-Resource Growth

### 4.1 Canonical Growth Contract

Annual base-resource growth is evaluated exactly once per calendar year during `OPEN_MONTH` for January, before January revenue is posted.

The active ruleset MUST define one `AnnualGrowthPolicy` containing:

- `annualGrowthPolicyId` with shipped value `annual_growth_v1`;
- `baseAnnualGrowthBp`;
- `minimumFinalAnnualGrowthBp`;
- `maximumFinalAnnualGrowthBp`;
- scenario modifier field;
- government modifier field;
- war modifier field;
- ordered event modifier references;
- ruleset modifier field;
- `annualGrowthRoundingMode`;
- `growthFormulaVersion`; and
- `growthApplicationPhaseId`.

The shipped values are:

- `baseAnnualGrowthBp`: `400`;
- permitted base range: `300..500` basis points inclusive;
- `minimumFinalAnnualGrowthBp`: `-2_000`;
- `maximumFinalAnnualGrowthBp`: `1_000`;
- `annualGrowthRoundingMode`: `FLOOR` for positive growth and `CEILING` for negative growth toward greater loss magnitude;
- `growthApplicationPhaseId`: `OPEN_MONTH_JANUARY`.

A ruleset MAY choose another base value within `300..500`, but the selected value MUST be explicit and versioned. The shipped canonical nominal is exactly `400` basis points, equal to `4%`.

Missing or out-of-range fields MUST fail with `INVALID_ANNUAL_GROWTH_POLICY`.

### 4.2 Growth Formula

The final growth rate MUST equal:

`finalGrowthBp = clamp(minimumFinalAnnualGrowthBp, maximumFinalAnnualGrowthBp, baseAnnualGrowthBp + scenarioModifierBp + governmentModifierBp + warModifierBp + sumEventModifierBp + rulesetModifierBp)`

Event modifiers MUST be ordered by ascending stable event identifier. No randomness is consumed by the growth formula unless a scenario event has already materialized a concrete modifier.

For non-negative `finalGrowthBp`:

`growthDelta = floor(baseResourcesBeforeGrowth * finalGrowthBp / 10_000)`

For negative `finalGrowthBp`:

`growthDelta = -ceiling(baseResourcesBeforeGrowth * abs(finalGrowthBp) / 10_000)`

`baseResourcesAfterGrowth = max(0, baseResourcesBeforeGrowth + growthDelta)`

Growth MUST be applied once. Save load, replay, report generation, and projection rebuilding MUST NOT reapply it.

### 4.3 Scenario, Government, War, and Event Modifiers

Every modifier MUST contain:

- stable modifier identifier;
- signed integer basis points;
- activation predicate;
- start and end month;
- stacking group;
- source identifier; and
- version.

The shipped neutral value for each modifier class is `0` basis points.

War modifiers MUST be scoped to the nation's active war state. Multiple war modifiers use `HIGHEST_LOSS_MAGNITUDE`, not additive stacking, unless a canonical ruleset revision explicitly changes the stacking mode.

### 4.4 Permanent Resource Changes

War and peace settlements MAY permanently change base resources only through a typed atomic effect `ADJUST_BASE_RESOURCES`.

The effect MUST specify either:

- a signed currency micro-unit delta; or
- a signed basis-point multiplier and explicit rounding mode.

The effect MUST update the base-resource principal before the next annual growth calculation. It MUST NOT be represented as a temporary annual growth modifier when declared permanent.

A resulting negative base-resource value MUST fail settlement validation with `BASE_RESOURCES_BELOW_ZERO`.

## 5. Payment Obligations

Every payable commitment MUST create one `PaymentObligation` containing:

- `obligationId`;
- `nationId`;
- `obligationTypeId`;
- `priorityTier`;
- `dueCampaignMonth`;
- exact amount due;
- minimum payable amount;
- `partialPaymentAllowed`;
- `deferralAllowed`;
- `arrearEligible`;
- `arrearPolicyId` or `NONE`;
- target project, contract, asset, or account identifier;
- failure-effect policy identifier;
- settlement ordering key; and
- obligation hash.

An obligation MUST NOT be paid before its due phase unless its contract explicitly authorizes prepayment.

## 6. Payment Priority

The canonical priority tiers are:

1. `LEGAL_MANDATORY`;
2. `MINIMUM_ACTIVE_FLEET_MAINTENANCE`;
3. `CRITICAL_REPAIR_AND_SAFETY`;
4. `EXISTING_CONSTRUCTION_COMMITMENT`;
5. `REQUIRED_FOREIGN_CONTRACT`;
6. `RESEARCH_AND_INTELLIGENCE_MINIMUM`;
7. `TRAINING`;
8. `NEW_DISCRETIONARY_PROJECT`.

Lower numeric tier resolves first.

Within one tier, obligations MUST be ordered by:

1. ascending due campaign month;
2. descending contractual seniority;
3. ascending obligation identifier.

Payment allocation MUST consume no randomness.

A domain MAY assign a subtype to one of these tiers but MUST NOT create an unnumbered priority between tiers without a versioned revision of this contract.

## 7. Insolvency Allocation

### 7.1 Insolvency Definition

A nation is insolvent for the month when treasury available for obligations is less than the sum of amounts due after monthly revenue posts.

Treasury MUST NOT become negative. The payment allocator MUST cap total outgoing treasury postings at the exact available treasury balance.

### 7.2 Allocation Procedure

The allocator MUST:

1. gather all due obligations;
2. order them under Section 6;
3. attempt full payment in order;
4. when full payment is impossible, apply the obligation's declared partial-payment rule;
5. create arrears for unpaid arrear-eligible amounts;
6. create an explicit default outcome for unpaid non-arrear-eligible amounts;
7. apply declared insolvency consequences; and
8. produce one `InsolvencyResolutionRecord`.

If `partialPaymentAllowed` is false, an obligation receives either full payment or zero.

If partial payment is allowed:

`paidAmount = min(amountDue, treasuryRemaining)`

`unpaidAmount = amountDue - paidAmount`

The paid amount MUST be non-negative and MUST NOT exceed amount due.

### 7.3 Arrears

Every unpaid arrear-eligible amount MUST create or increase one explicit `ArrearRecord` containing:

- `arrearId`;
- source obligation identifier;
- original due month;
- principal outstanding;
- accrued penalty outstanding;
- penalty formula identifier;
- next review month;
- priority tier;
- status; and
- record hash.

`status` MUST be `OUTSTANDING`, `PARTIALLY_PAID`, `PAID`, `FORGIVEN_BY_TYPED_EFFECT`, or `DEFAULTED`.

The shipped arrear penalty is `0` basis points unless the owning contract explicitly declares another value. Missing penalty data MUST NOT create inferred interest.

Arrears remain obligations in the next month at their original priority tier and sort before newly due obligations in that tier.

### 7.4 Construction and Paid Work

Construction progress MUST be based only on paid effective work.

For each project:

`affordableWork = floor(projectPaymentReceived / costPerWorkMicroUnit)`

`appliedWork = min(affordableWork, remainingWork, capacityLimitedWork)`

A project receiving zero payment MUST receive zero construction work.

Allocated, budgeted, reserved, promised, arreared, or deferred money MUST NOT create work progress until paid through a balanced ledger transaction.

### 7.5 Insolvency Consequences

The active ruleset MUST define `insolvencyConsequences_v1` with these shipped values:

- monthly institutional-confidence loss when any tier 1 through 4 obligation remains unpaid: `2` points;
- monthly fleet-morale loss when minimum active-fleet maintenance is underpaid: `3` points;
- readiness loss for each under-maintained active ship: `5` points;
- project-progress effect: unpaid work receives exactly `0` progress;
- consecutive-month intervention threshold: `3` months;
- rolling 12-month intervention threshold: `4` insolvent months;
- intervention event identifier: `persistent_insolvency_intervention_v1`.

Institutional confidence, morale, and readiness MUST use their owning bounded scales and clamp once after all monthly effects.

Consequences apply once per month. Multiple unpaid obligations of the same consequence class MUST NOT multiply the shipped fixed penalty unless a domain contract explicitly declares per-obligation stacking.

### 7.6 Persistent Insolvency

Persistent insolvency exists when either:

- the nation is insolvent for `3` consecutive completed months; or
- the nation is insolvent in `4` months within the trailing `12` completed months.

At political end-of-month resolution, persistent insolvency MUST enqueue event `persistent_insolvency_intervention_v1` unless the same event is active or was resolved within the previous `6` months.

The event, not the insolvency detector, declares political choices and further effects.

Missing event content MUST fail with `PERSISTENT_INSOLVENCY_EVENT_MISSING`.

## 8. Treasury Carryover

The full non-negative closing treasury balance MUST become the next month's opening treasury balance.

No routine monthly decay, reset, cap, or confiscation applies.

Carryover MUST satisfy:

`nextOpeningTreasury = previousClosingTreasury + explicitBetweenSnapshotTransactions`

In the normal case with no between-snapshot transaction:

`nextOpeningTreasury = previousClosingTreasury`

Any difference without a balanced explicit transaction MUST fail with `TREASURY_CARRYOVER_MISMATCH`.

## 9. Excessive Surplus and Political Reclamation

### 9.1 Surplus Ratio

At political end-of-month resolution, calculate:

`surplusRatioBp = floor(closingTreasury * 10_000 / max(1, trailing12MonthPaidNavalAppropriation))`

`trailing12MonthPaidNavalAppropriation` is the sum of paid naval-appropriation income over the latest 12 completed months, or all completed months when fewer than 12 exist.

### 9.2 Canonical Thresholds

The shipped surplus policy `surplus_reclamation_v1` defines:

- warning threshold: `5_000` basis points;
- event eligibility threshold: `7_500` basis points;
- immediate review threshold: `10_000` basis points;
- minimum consecutive months at or above event threshold: `3`;
- event cooldown: `12` months;
- reclamation event identifier: `political_surplus_reclamation_v1`.

A warning has no authoritative effect.

When surplus ratio remains at or above `7_500` basis points for `3` consecutive closing snapshots, the system MUST enqueue the reclamation event unless cooldown applies.

At `10_000` basis points or higher, the event is eligible immediately without the three-month wait.

### 9.3 Reclamation

Treasury confiscation or reclamation MUST occur only through:

- an accepted choice in typed event `political_surplus_reclamation_v1`;
- another explicit typed event; or
- a versioned ruleset policy that creates the same typed ledger effect.

Every reclamation MUST specify:

- exact amount or formula;
- source treasury account;
- destination account;
- rounding mode;
- political effects;
- causal event or policy identifier; and
- balanced ledger postings.

The surplus detector MUST NOT alter treasury directly.

An unexplained treasury reduction MUST fail with `INVISIBLE_TREASURY_CONFISCATION`.

## 10. Research Spending

### 10.1 Allocation Cap

Monthly research allocation MUST be an integer amount no greater than exactly `1_200` basis points, equal to `12%`, of that month's paid naval appropriation.

`maximumResearchAllocation = floor(paidMonthlyNavalAppropriation * 1_200 / 10_000)`

An allocation above the cap MUST be rejected with `RESEARCH_ALLOCATION_EXCEEDS_CAP`.

The cap applies to total research spending across all fields.

### 10.2 Diminishing Effectiveness

The first `1_000` basis points, equal to `10%`, of paid monthly naval appropriation allocated and paid to research has full marginal effectiveness.

The portion above `1_000` and at or below `1_200` basis points has exactly `5_000` basis points, equal to `50%`, marginal effectiveness.

Let:

`fullEfficiencyLimit = floor(paidMonthlyNavalAppropriation * 1_000 / 10_000)`

`paidResearch = min(allocatedResearch, actualResearchPayment)`

`fullEfficiencyPaid = min(paidResearch, fullEfficiencyLimit)`

`diminishedPaid = max(0, paidResearch - fullEfficiencyPaid)`

`effectiveResearchSpend = fullEfficiencyPaid + floor(diminishedPaid * 5_000 / 10_000)`

Only `effectiveResearchSpend` enters the research-progress formula.

The shipped permitted range for diminished marginal effectiveness is `3_000..7_500` basis points inclusive. The selected canonical value is exactly `5_000`.

### 10.3 Paid Expenditure Only

Research progress MUST be based on actual paid research expenditure, not allocation, reservation, budget intent, or arrears.

If `actualResearchPayment` is zero, effective research spend and research progress MUST both be zero.

Unpaid research allocation MUST NOT become research arrears unless a separate canonical minimum-research obligation explicitly marks it arrear-eligible.

Research-speed, education, technology-leader, and field-priority modifiers apply after effective paid spending according to their owning contracts.

## 11. Construction Work Accounting

### 11.1 Paid Work

Every project MUST define:

- total work;
- completed work;
- paid work;
- remaining work;
- cost per work micro-unit;
- monthly capacity;
- status;
- acceleration state; and
- preservation-cost policy.

New completed work in a month MUST equal paid effective work after capacity and remaining-work limits.

No project may receive work for an unpaid amount.

### 11.2 Halted Projects

A project with status `HALTED` MUST receive exactly `0` construction work and incur no ordinary construction-work charge.

A halted project MUST incur monthly preservation cost under `halted_project_preservation_v1`:

`preservationCost = ceiling(mothballedMaintenanceEquivalent * 5_000 / 10_000)`

The shipped multiplier is exactly `5_000` basis points, equal to one half.

The permitted range is `2_500..7_500` basis points inclusive.

If the owning project type has no mothballed-maintenance equivalent, the active ruleset MUST supply an explicit integer `canonicalPreservationCost` for that project type. Missing both values MUST fail with `PROJECT_PRESERVATION_COST_MISSING`.

Unpaid preservation cost creates arrears only when the project contract marks it arrear-eligible. It MUST NOT create work progress.

### 11.3 Accelerated Projects

Acceleration is permitted only for active projects whose type declares `accelerationAllowed: true`.

The active ruleset MUST define `construction_acceleration_v1` with:

- `accelerationTotalWorkMultiplierBp`;
- `accelerationWorkRateMultiplierBp`;
- `accelerationCapacityPressureWeightBp`;
- `accelerationDelayThresholdBp`;
- `accelerationDelayProbabilityFormulaId`;
- `accelerationStreamFamily`;
- rounding modes; and
- formula version.

The shipped values are:

- total-work multiplier: `10_500` basis points;
- permitted range: `10_250..11_000`;
- work-rate multiplier: `11_000` basis points;
- permitted range: `10_500..11_500`;
- capacity-pressure weight: `12_500` basis points;
- delay threshold: `9_000` basis points of available construction capacity;
- stream family: `construction/month/project/acceleration_pressure`;
- work rounding: `FLOOR`;
- added total-work rounding: `CEILING`.

#### 11.3.1 Acceleration Premium

When acceleration is accepted, total remaining work is replaced exactly once:

`acceleratedRemainingWork = ceiling(remainingWorkBeforeAcceleration * 10_500 / 10_000)`

`accelerationPremiumWork = acceleratedRemainingWork - remainingWorkBeforeAcceleration`

Completed work MUST NOT be multiplied retroactively. Ending and re-enabling acceleration MUST NOT apply the premium more than once to the same remaining-work segment. The project MUST persist an `accelerationPremiumAppliedAtWorkPosition` marker.

The `500` basis-point premium equals exactly `5%` additional remaining work-equivalent value.

#### 11.3.2 Work-Rate Increase

For each paid accelerated month:

`acceleratedCapacity = floor(baseEffectiveCapacity * 11_000 / 10_000)`

The shipped rate multiplier is exactly `11_000` basis points. This changes monthly effective work capacity by `10%`; it does not promise a fixed calendar completion improvement because payment, delays, capacity, and remaining work may differ.

Actual applied work remains limited by paid affordable work, accelerated capacity, and remaining work.

#### 11.3.3 Capacity Pressure

For each construction pool:

`weightedDemand = normalDemand + floor(acceleratedDemand * 12_500 / 10_000)`

`capacityPressureBp = floor(weightedDemand * 10_000 / max(1, availableCapacity))`

Acceleration delay eligibility begins when `capacityPressureBp > 9_000`.

The excess pressure is:

`excessPressureBp = min(10_000, capacityPressureBp - 9_000)`

The shipped delay probability is:

`delayProbabilityBp = floor(excessPressureBp * 5_000 / 10_000)`

The maximum delay probability from this formula is `5_000` basis points.

Eligible accelerated projects MUST be checked in ascending project identifier order using keyed decisions from `construction/month/project/acceleration_pressure`.

A delay result MUST specify exactly one month of delayed status, zero work for that month, zero work charge for that month, and continued preservation or maintenance cost as declared by the project contract.

Acceleration pressure MUST NOT delay a project invisibly. Every delay requires a random-decision record and reason `ACCELERATION_CAPACITY_PRESSURE_DELAY`.

## 12. Wartime Costs

The active ruleset MUST define explicit wartime multipliers or fixed costs for:

- active-fleet maintenance;
- mobilized personnel;
- fuel;
- ammunition;
- repairs;
- operations; and
- wartime logistics.

The shipped default active-fleet maintenance multiplier during war is `12_500` basis points. The permitted range is `10_000..20_000`.

Every other missing wartime cost field MUST fail ruleset validation with `WARTIME_COST_CONTRACT_MISSING`. A value of zero is valid only when explicitly supplied.

Reports MUST expose base amounts, modifiers, rounding, and final paid and unpaid values.

## 13. Canonical Ordering

Within a financial phase:

1. transactions MUST be ordered by phase ordinal;
2. obligations MUST use Section 6 priority;
3. projects MUST be ordered by ascending project identifier within equal priority;
4. ledger postings MUST be ordered by ascending account identifier; and
5. event effects MUST be ordered by ascending event identifier unless their contract declares another deterministic order.

Database insertion order, UI order, wall-clock submission time, and localized names MUST NOT affect financial results.

## 14. Required Reason Codes

The economy subsystem MUST define at least:

- `INVALID_ECONOMIC_STATE`;
- `UNBALANCED_FINANCIAL_POSTING`;
- `INVALID_ANNUAL_GROWTH_POLICY`;
- `BASE_RESOURCES_BELOW_ZERO`;
- `INSUFFICIENT_FUNDS`;
- `PAYMENT_DEFERRED`;
- `ARREAR_CREATED`;
- `PAYMENT_DEFAULTED`;
- `PERSISTENT_INSOLVENCY_EVENT_MISSING`;
- `TREASURY_CARRYOVER_MISMATCH`;
- `INVISIBLE_TREASURY_CONFISCATION`;
- `RESEARCH_ALLOCATION_EXCEEDS_CAP`;
- `PROJECT_PRESERVATION_COST_MISSING`;
- `ACCELERATION_NOT_ALLOWED`;
- `ACCELERATION_PREMIUM_ALREADY_APPLIED`;
- `ACCELERATION_CAPACITY_PRESSURE_DELAY`;
- `WARTIME_COST_CONTRACT_MISSING`; and
- `ECONOMIC_INVARIANT_FAILED`.

## 15. Validation and Acceptance

Automated validation MUST prove that:

1. every monetary mutation uses balanced integer ledger postings;
2. treasury never commits below zero;
3. annual growth runs exactly once in January before revenue;
4. the shipped annual base growth is exactly `400` basis points;
5. alternate base growth values remain within `300..500` basis points;
6. final growth remains within `-2_000..1_000` basis points;
7. scenario, government, war, event, and ruleset modifiers are explicit and deterministically ordered;
8. permanent war and peace resource changes alter principal through typed effects;
9. obligations resolve through the exact eight-tier priority order;
10. equal-priority obligations use deterministic ordering;
11. unpaid eligible amounts create explicit arrear records;
12. arrears receive no interest unless an explicit value is supplied;
13. construction work equals paid affordable work constrained by capacity and remaining work;
14. unpaid construction receives zero progress;
15. insolvency penalties apply once per consequence class per month;
16. persistent insolvency means three consecutive or four rolling-12 insolvent months;
17. treasury carries over in full unless an explicit balanced transaction changes it;
18. surplus warnings do not mutate treasury;
19. surplus event eligibility begins at `7_500` basis points for three months or immediately at `10_000`;
20. every reclamation uses a typed effect and balanced ledger posting;
21. research allocation cannot exceed `1_200` basis points of paid appropriation;
22. the first `1_000` basis points has full effectiveness;
23. research spending from `1_000..1_200` basis points has `5_000` basis-point marginal effectiveness;
24. research progress uses actual paid spending only;
25. halted projects perform zero work;
26. halted preservation cost uses exactly `5_000` basis points of mothballed maintenance when that basis exists;
27. accelerated remaining work receives one exact `10_500` basis-point multiplier;
28. accelerated monthly capacity uses exactly `11_000` basis points;
29. acceleration pressure uses the declared weighted-demand, threshold, probability, stream, and one-month delay rules;
30. acceleration delays are auditable and never invisible;
31. missing wartime multipliers fail validation rather than defaulting silently;
32. reports expose base, modifier, rounding, paid, unpaid, arrear, and final values; and
33. identical opening state, commands, events, ruleset, and seeds produce identical ledgers, arrears, projects, research, and closing hashes.
