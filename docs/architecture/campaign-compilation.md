# DESIGN-09: Campaign Compilation

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-09`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Campaign compilation MUST be deterministic, reproducible, and fail-closed. Every required value MUST be supplied by canonical content, campaign configuration, or a validated ruleset field. Runtime inference and fallback behavior are prohibited.

## 1. Compiler Responsibility

The campaign compiler transforms validated canonical inputs into the first authoritative campaign state.

Compilation MUST:

- consume no runtime simulation RNG stream;
- produce identical canonical output and hashes from identical inputs;
- reject missing or incompatible high-authority input;
- repair only data explicitly classified as repairable generated data;
- record every generated, normalized, varied, or repaired artifact;
- complete all start-readiness gates before campaign activation; and
- persist the first stable campaign save atomically.

A compiled campaign MUST NOT become playable until compilation, preflight validation, reproducibility verification, and first-save verification all report `PASS`.

## 2. Compiler Inputs

Compilation MUST receive one immutable `CampaignCompilationRequest` containing:

- `contentPackId` and `contentPackHash`;
- `rulesetId`, `rulesetVersion`, and `rulesetHash`;
- `formulaVersionManifestHash`;
- `rngAlgorithmVersion`;
- `aiPolicyVersion`;
- `scenarioId` and `scenarioContentHash`;
- `playerSlotId`;
- `continuityModeId`;
- complete `CampaignConfiguration` from `DESIGN-03`;
- `structuralSeed`;
- `campaignSeed`;
- `compilerImplementationId`;
- `compilerVersion`; and
- `compilationSchemaVersion`.

`structuralSeed` and `campaignSeed` MUST each be unsigned 128-bit integers serialized as exactly 32 lowercase hexadecimal characters.

The structural seed MAY be used only for authoritative setup generation and setup variation. The campaign seed MUST initialize the campaign's domain-separated random-key space. Neither seed may be replaced, truncated, combined through addition, or parsed through floating point.

Missing or invalid input MUST fail with `INVALID_CAMPAIGN_COMPILATION_REQUEST`.

## 3. Canonical Compiler Pipeline

The compiler MUST execute the following stages in exactly this order:

1. `LOAD_AND_HASH_CONTENT`;
2. `VALIDATE_SCENARIO_PARTICIPATION`;
3. `MATERIALIZE_SCENARIO_NATION_INSTANCES`;
4. `MATERIALIZE_REGIMES_AND_TRAITS`;
5. `MATERIALIZE_WORLD_OWNERSHIP_AND_INFRASTRUCTURE`;
6. `MATERIALIZE_DIPLOMACY_AND_TREATIES`;
7. `MATERIALIZE_TECHNOLOGIES_AND_VARIATION`;
8. `MATERIALIZE_ECONOMIES_AND_BUDGETS`;
9. `MATERIALIZE_HISTORICAL_OR_GENERATED_FLEETS`;
10. `MATERIALIZE_CONSTRUCTION_AND_REBUILDS`;
11. `MATERIALIZE_OFFICERS_CREWS_DIVISIONS_AND_DEPLOYMENT`;
12. `MATERIALIZE_AIRCRAFT_SUBMARINES_AND_INVENTORIES`;
13. `MATERIALIZE_POLITICAL_STATE_AND_OBJECTIVES`;
14. `VALIDATE_ALL_AGGREGATES`;
15. `APPLY_PERMITTED_GENERATED_DATA_REPAIRS`;
16. `REVALIDATE_ALL_AGGREGATES`;
17. `CANONICALIZE_ORDERING_AND_IDENTIFIERS`;
18. `PRODUCE_INITIAL_SNAPSHOT`;
19. `EXECUTE_PREFLIGHT_CHECKS`;
20. `COMPUTE_REPRODUCIBILITY_HASHES`;
21. `VERIFY_REPEATED_COMPILATION`;
22. `PERSIST_FIRST_STABLE_SAVE`; and
23. `ACTIVATE_CAMPAIGN`.

Every stage MUST emit a `CompilationStageRecord` containing:

- stage identifier and ordinal;
- input hashes;
- output hashes;
- generated artifact identifiers;
- validation and repair records;
- setup random-decision identifiers;
- result code; and
- compiler, content, ruleset, formula, and RNG versions.

A stage with no eligible work MUST emit a successful empty record. A failed stage MUST stop compilation before the next stage.

## 4. Content and Identity Validation

The compiler MUST validate all content hashes and referential integrity before materialization.

Scenario participation MUST conform to `DESIGN-04`. The compiler MUST NOT:

- create a missing nation identity;
- substitute an AI-only power for a playable slot;
- infer a successor polity;
- infer ownership from names or geography;
- infer missing technology prerequisites;
- infer diplomatic participants; or
- infer required historical fleet designs.

Failure MUST emit a specific content or identity reason code and terminate compilation.

## 5. Generated Content and Provenance

Every materialized artifact MUST declare exactly one provenance label:

- `CANONICAL_CONTENT`;
- `MANUAL_EXPLICIT`;
- `DESIGN_DECISION`;
- `GENERATED_CANONICAL`;
- `SCENARIO_OVERRIDE`;
- `RULESET_CONSTANT`; or
- `DEPRECATED`.

Procedural generation is permitted only when the owning content contract declares generation authoritative and identifies:

- generator implementation and version;
- input schema;
- setup stream family;
- stable random-key contract;
- validation policy;
- repair policy; and
- output schema.

Generated authoritative artifacts MUST be persisted or content-addressed by the first stable save.

## 6. Legacy Fleet Modes

The canonical legacy-fleet modes are:

- `automatic_canonical_generation`;
- `manual_legacy_construction_1900`; and
- `historical_explicit_fleet`, when the selected scenario provides complete canonical fleet content.

The shipped scenario support matrix is:

- `scen_1880`: `automatic_canonical_generation` or `historical_explicit_fleet` when complete content exists;
- `scen_1900`: `automatic_canonical_generation`, `manual_legacy_construction_1900`, or `historical_explicit_fleet` when complete content exists;
- `scen_1920`: `automatic_canonical_generation` or `historical_explicit_fleet` when complete content exists;
- `scen_1935`: `automatic_canonical_generation` or `historical_explicit_fleet` when complete content exists;
- `scen_1960`: `automatic_canonical_generation` or `historical_explicit_fleet` when complete content exists.

`manual_legacy_construction_1900` MUST be rejected for every scenario other than `scen_1900` with `LEGACY_MODE_SCENARIO_INCOMPATIBLE`.

## 7. Legacy Fleet Generation Requirements

A generated legacy fleet MUST pass all of these gates:

- budget sustainability;
- minimum operational capability;
- foreign-station obligations;
- treaty legality;
- dock-size legality;
- construction-capacity legality;
- scenario technology legality;
- national force-doctrine constraints;
- maintenance affordability;
- playable first-turn liquidity;
- deployment legality;
- division legality; and
- personnel sufficiency.

The active ruleset MUST define the policy and threshold fields for every gate. Missing fields MUST fail with `INCOMPLETE_LEGACY_FLEET_GENERATION_CONTRACT`.

Generated fleets MUST include explicit authoritative records for:

- age cohorts;
- design families;
- compiled design versions;
- named classes;
- individual ships;
- historical refits;
- readiness states;
- permanent divisions;
- officers and crews;
- deployment;
- inventories; and
- active projects.

A generated fleet that cannot pass all gates after permitted repair MUST be rejected with `LEGACY_FLEET_GENERATION_FAILED`.

## 8. Manual 1900 Legacy Construction

### 8.1 Eligibility

Manual legacy construction is permitted only when:

- `scenarioId` equals `scen_1900`;
- `legacyFleetModeId` equals `manual_legacy_construction_1900`;
- the active ruleset includes `manualLegacy1900PolicyId` with shipped value `manual_legacy_1900_v1`; and
- every required field in Section 8.2 is present and valid.

### 8.2 Required Ruleset Fields

The active ruleset MUST define:

- `manualLegacy1900PolicyId`;
- `legacyUnderConstructionProgressBp`;
- `legacyUnderConstructionProgressMinBp`;
- `legacyUnderConstructionProgressMaxBp`;
- `legacyCompletedWorkSetupChargeBp`;
- `legacyCompletedWorkSetupChargeMinBp`;
- `legacyCompletedWorkSetupChargeMaxBp`;
- `legacyHistoricalWorkSubsidyPolicyId`;
- `legacyRemainingWorkPaymentPolicyId`;
- `legacyAllocationRoundingMode`;
- `legacyChargeRoundingMode`; and
- `legacyAccountingFormulaVersion`.

The shipped canonical values are:

- `legacyUnderConstructionProgressBp`: `5_000`;
- `legacyUnderConstructionProgressMinBp`: `4_000`;
- `legacyUnderConstructionProgressMaxBp`: `6_000`;
- `legacyCompletedWorkSetupChargeBp`: `500`;
- `legacyCompletedWorkSetupChargeMinBp`: `0`;
- `legacyCompletedWorkSetupChargeMaxBp`: `1_000`;
- `legacyHistoricalWorkSubsidyPolicyId`: `legacy_historical_work_subsidy_v1`;
- `legacyRemainingWorkPaymentPolicyId`: `normal_project_payment_v1`;
- `legacyAllocationRoundingMode`: `FLOOR`; and
- `legacyChargeRoundingMode`: `AGAINST_PAYER`.

All bounds are inclusive. The selected progress value MUST remain within `4_000..6_000` basis points. The selected setup-charge value MUST remain within `0..1_000` basis points.

The shipped ruleset selects exactly `5_000` basis points of progress and exactly `500` basis points of setup charge. The compiler MUST NOT choose another value inside the bounds unless a different validated ruleset version explicitly supplies that value.

A missing or out-of-range field MUST fail ruleset validation with `INVALID_MANUAL_LEGACY_1900_CONTRACT`.

### 8.3 Starting Allocation

The manual starting allocation MUST be divided exclusively between:

- completed commissioned ships; and
- ships already under construction.

Every allocated ship MUST belong to exactly one category. Unallocated ships, duplicate allocation, and a third implicit category are prohibited.

The allocation MUST satisfy the selected scenario, nation, technology, treaty, dock, budget, personnel, and fleet-readiness constraints.

The allocation value MUST use canonical currency micro-units. Proportional allocation and remainder assignment MUST follow `DESIGN-07`.

### 8.4 Under-Construction Progress

Every manually allocated under-construction ship MUST begin with the exact selected progress multiplier.

For each project:

`historicalWork = floor(totalWork * legacyUnderConstructionProgressBp / 10_000)`

`remainingWork = totalWork - historicalWork`

The compiler MUST then set:

- `completedWork = historicalWork`;
- `paidWork = historicalWork`;
- `remainingWork` as calculated above;
- project status to `ACTIVE` or `AWAITING_CAPACITY` according to current validated capacity; and
- project progress provenance to `GENERATED_CANONICAL` or `MANUAL_EXPLICIT`, as applicable.

`totalWork` MUST be a positive integer. `historicalWork` MUST remain below `totalWork`; therefore an under-construction project MUST have at least one work micro-unit remaining.

If floor rounding would produce `historicalWork = totalWork`, the allocation MUST be rejected with `LEGACY_PROJECT_ALREADY_COMPLETE` rather than reclassified silently.

The progress multiplier MUST apply to work, not calendar duration, displayed percentage, money, or ship value.

### 8.5 Full Ship Value

`fullShipValue` MUST equal the canonical completed cost of the compiled design version under the selected builder, nation, ruleset, and scenario context before legacy subsidy treatment.

It MUST include every cost component required for normal construction of that ship and MUST exclude future maintenance, future repair, and future modernization.

The compiler MUST record the formula identifier, formula version, ordered cost inputs, unrounded rational result, rounding mode, and final currency micro-unit value.

### 8.6 Historical Work Value

For an under-construction ship:

`historicalWorkValue = floor(fullShipValue * historicalWork / totalWork)`

For a completed commissioned ship:

`historicalWork = totalWork`

`historicalWorkValue = fullShipValue`

The value calculation MUST use wide integer intermediates and the exact work ratio. It MUST NOT multiply the displayed progress percentage by ship value.

### 8.7 Setup Charge

The setup charge applies only to historical work already completed before campaign start.

For each ship:

`setupCharge = ceiling(historicalWorkValue * legacyCompletedWorkSetupChargeBp / 10_000)`

The charge MUST use `AGAINST_PAYER` under `DESIGN-07`. If `historicalWorkValue` is zero, `setupCharge` MUST equal zero.

For the shipped canonical ruleset, the player pays exactly `500` basis points, equal to `5%`, of historical completed-work value, subject only to integer ceiling in currency micro-units.

The setup charge MUST be posted once during campaign compilation. It MUST NOT be charged again during the first monthly turn, save load, replay, or project continuation.

### 8.8 Historical Subsidy

The historical subsidy MUST equal:

`historicalSubsidy = historicalWorkValue - setupCharge`

The subsidy MUST be non-negative.

The subsidy represents the portion of historical completed work not charged to the campaign's starting treasury. It MUST:

- be recorded as an explicit balanced compiler ledger posting;
- use ledger category `LEGACY_HISTORICAL_WORK_SUBSIDY`;
- identify the subsidizing source account declared by `legacy_historical_work_subsidy_v1`;
- increase no future payable balance;
- create no loan, arrear, deferred charge, negative reserve, or contingent liability; and
- never be reclaimed except through a future explicit typed event unrelated to the original construction liability.

The compiler MUST NOT store subsidized historical work as future debt.

### 8.9 Remaining Liability

For a completed commissioned ship:

`remainingLiability = 0`

For an under-construction ship:

`remainingLiability = fullShipValue - historicalWorkValue`

`remainingLiability` MUST be non-negative and MUST be paid through normal project payments as future work is completed.

The setup charge MUST NOT reduce `remainingLiability`, because it pays for historical work rather than unfinished work.

Future monthly payment and progress MUST use `normal_project_payment_v1`. Construction receives progress only for paid future work.

The compiler MUST NOT reserve the full remaining liability from starting treasury unless a separate explicit reservation contract requires it. It MUST record the liability and the normal future payment schedule inputs.

### 8.10 Accounting Identity

For every manually allocated ship, these identities MUST hold exactly in currency micro-units:

`historicalWorkValue = setupCharge + historicalSubsidy`

`fullShipValue = historicalWorkValue + remainingLiability`

Therefore:

`fullShipValue = setupCharge + historicalSubsidy + remainingLiability`

Any remainder or imbalance MUST fail compilation with `LEGACY_ACCOUNTING_IDENTITY_FAILED`.

### 8.11 Treasury and Liquidity

All setup charges MUST be posted against starting treasury during compilation in canonical allocation order.

Ships MUST be ordered by:

1. ascending player allocation ordinal;
2. ascending design-family identifier;
3. ascending ship identifier.

If starting treasury cannot pay all setup charges while preserving mandatory first-turn liquidity, the manual allocation MUST be rejected with `INSUFFICIENT_LEGACY_SETUP_LIQUIDITY`.

The compiler MUST NOT:

- make treasury negative;
- convert unpaid setup charges into debt;
- reduce setup-charge rates;
- increase subsidies;
- remove ships silently; or
- alter ship progress to force affordability.

The player or generating policy must submit a different valid allocation.

### 8.12 Required Per-Ship Record

The compiler MUST create one immutable `LegacyShipAccountingRecord` per allocated ship containing:

- `recordId`;
- `shipId`;
- `compiledDesignVersionId`;
- `allocationCategory`;
- `totalWork`;
- `historicalWork`;
- `legacyProgressBp`;
- `fullShipValue`;
- `historicalWorkValue`;
- `setupChargeBp`;
- `setupCharge`;
- `historicalSubsidy`;
- `remainingLiability`;
- `setupChargeLedgerTransactionId`;
- `subsidyLedgerTransactionId`;
- `futurePaymentPolicyId`;
- formula identifiers and versions;
- content and ruleset hashes;
- provenance label; and
- record hash.

Completed ships MUST use:

- `allocationCategory: COMPLETED_COMMISSIONED`;
- `legacyProgressBp: 10_000`;
- `remainingLiability: 0`.

Under-construction ships MUST use:

- `allocationCategory: UNDER_CONSTRUCTION`;
- the selected ruleset progress value;
- a positive `remainingLiability` unless the exact canonical cost formula produces zero, which MUST be rejected as invalid content.

A missing record MUST fail compilation with `MISSING_LEGACY_SHIP_ACCOUNTING_RECORD`.

## 9. Economy and Ledger Materialization

Initial economy materialization MUST create balanced opening ledger state for every nation.

Compiler-created financial transactions MUST identify:

- source and destination accounts;
- category;
- exact integer amount;
- formula and rounding mode;
- causal compilation-stage record; and
- transaction hash.

No opening balance, subsidy, setup charge, project liability, or reserve may exist only as descriptive metadata.

An unbalanced initial ledger MUST fail with `INITIAL_LEDGER_UNBALANCED`.

## 10. Validation, Normalization, and Repair

Validation detects invalid state and MUST NOT mutate it.

Normalization MAY change only canonical ordering, equivalent identifier representation, and formatting with no gameplay effect.

Repair MAY change only generated or cached data whose owning policy explicitly marks the defect repairable. Every repair MUST record:

- defect identifier;
- repair policy and version;
- pre-repair value and hash;
- post-repair value and hash;
- reason code; and
- affected artifact identifiers.

Missing canonical nations, possessions, participation, technologies, ownership, scenario continuity, required designs, or ledger sources are not repairable.

## 11. Initial Snapshot

The compiler MUST produce one immutable initial `MonthOpeningSnapshot` containing:

- the complete authoritative campaign configuration;
- campaign identity and continuity state;
- world and nation aggregates;
- fleet, project, officer, crew, division, and deployment state;
- research and technology manifest;
- political, diplomatic, war, intelligence, and objective state;
- inventories and infrastructure;
- opening financial ledgers;
- setup RNG manifest;
- compilation-stage ledger position;
- content and ruleset pins; and
- canonical aggregate and snapshot hashes.

No runtime month may begin from an uncommitted compiler working state.

## 12. Preflight and Start Readiness

Preflight MUST execute every start-readiness gate required by `DESIGN-01` and the relevant domain contracts.

At minimum, preflight MUST prove:

- content validation;
- complete scenario participation;
- aggregate invariants;
- balanced economy;
- legal fleets and projects;
- valid technology and research state;
- legal deployment and obligations;
- successful first-month dry-run resolution;
- successful accepted-battle auto-resolution dry run;
- successful save/load replay;
- identical repeated-compilation hashes; and
- no unresolved high-authority repair.

A dry run MUST execute against an isolated copy and MUST NOT advance or mutate the candidate initial snapshot.

Any failed or skipped gate MUST fail compilation with `START_READINESS_FAILED`.

## 13. Reproducibility Hashes

The compiler MUST compute:

- content-pack hash;
- ruleset hash;
- scenario hash;
- campaign-configuration hash;
- setup random-decision manifest hash;
- technology manifest hash;
- legacy fleet manifest hash;
- legacy ship accounting manifest hash;
- opening ledger hash;
- aggregate hashes;
- compilation-stage ledger hash; and
- initial snapshot hash.

Repeated compilation verification MUST run the complete compiler a second time from the immutable request and require equality of every listed hash.

A mismatch MUST fail with `CAMPAIGN_COMPILATION_REPRODUCIBILITY_MISMATCH`.

## 14. First Stable Save

The first stable save MUST be written atomically:

1. write a candidate save;
2. validate every pinned dependency and hash;
3. reload the candidate in isolation;
4. verify the initial snapshot hash;
5. verify setup and accounting manifests;
6. commit the active save pointer; and
7. mark the campaign `ACTIVE`.

Failure before pointer commitment MUST leave no active campaign and emit `INITIAL_SAVE_COMMIT_FAILED`.

## 15. Validation and Acceptance

Automated validation MUST prove that:

1. all twenty-three compiler stages execute in the declared order;
2. missing high-authority content fails compilation without substitution;
3. setup generation uses only declared setup streams;
4. identical inputs produce identical generated identifiers, artifacts, and hashes;
5. manual legacy construction is available only for `scen_1900`;
6. manual allocation contains only completed commissioned and under-construction ships;
7. the shipped under-construction progress is exactly `5_000` basis points;
8. permitted progress values remain within `4_000..6_000` basis points;
9. the shipped historical-work setup charge is exactly `500` basis points;
10. permitted setup-charge values remain within `0..1_000` basis points;
11. progress applies to project work rather than displayed time or value percentage;
12. setup charge uses ceiling rounding against the payer;
13. setup charge is posted exactly once;
14. historical subsidy equals historical work value minus setup charge;
15. historical subsidy creates no future debt, arrear, reserve, or liability;
16. remaining liability equals full ship value minus historical work value;
17. completed ships have zero remaining liability;
18. under-construction ships retain unfinished work and positive remaining liability;
19. the three-part accounting identity balances exactly for every ship;
20. initial ledgers balance exactly;
21. unaffordable manual allocations fail without mutation or automatic adjustment;
22. every allocated ship has one immutable accounting record;
23. future unfinished work uses normal project payment rules;
24. preflight dry runs do not mutate the initial snapshot;
25. repeated full compilation produces identical manifest and snapshot hashes; and
26. campaign activation occurs only after the first stable save reloads and validates successfully.
