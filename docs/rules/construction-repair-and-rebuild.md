# DESIGN-23: Construction, Repair, And Rebuild

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-23`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Project authorization, batching, progress, acceleration, delay, latent defects, combined dockyard work, rebuild validation, scrapping, salvage, treaty disposal, and persistence MUST use the explicit contracts, values, predicates, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Unified Dockyard Project Types

The canonical project types are:

- `DESIGN_STUDY`;
- `NEW_CONSTRUCTION`;
- `REPAIR`;
- `REBUILD`;
- `CONVERSION`;
- `INFRASTRUCTURE`; and
- `EQUIPMENT_INSTALLATION`.

Every project MUST use one authoritative `DockyardProject` containing:

- `projectId`;
- `projectTypeId`;
- owner nation;
- builder nation and facility;
- target design, ship, or infrastructure identifier;
- ordered work-package identifiers;
- total work;
- completed work;
- paid work;
- remaining work;
- total cost and cost-per-work;
- reserved and occupied capacity;
- status;
- acceleration state;
- delay state;
- authorization and completion dates;
- command and contract references;
- ruleset and formula versions; and
- aggregate hash.

## 2. Project Status

`status` MUST be exactly one of:

- `PLANNED`;
- `AUTHORIZED`;
- `AWAITING_CAPACITY`;
- `ACTIVE`;
- `HALTED`;
- `DELAYED`;
- `ACCELERATED`;
- `COMPLETED`;
- `CANCELLED`; or
- `IMPOUNDED`.

Terminal statuses are `COMPLETED` and `CANCELLED`. `IMPOUNDED` remains non-terminal until an explicit contract outcome resolves custody and title.

Invalid transitions MUST fail with `INVALID_DOCKYARD_PROJECT_TRANSITION`.

## 3. New-Construction Authorization

A new-construction project MUST start only after:

- one immutable approved `CompiledDesignVersion` exists;
- intended and natural classification pass `DESIGN-22`;
- treaty validation passes;
- builder technology and dock limits pass;
- construction capacity can be reserved;
- required oil and material access pass;
- personnel and government authorization pass; and
- an accepted `OrderConstructionCommand` is locked.

Drafts, incomplete studies, rejected designs, and stale compiled versions MUST NOT start construction.

Failure MUST use a specific reason code and create no project or reservation.

## 4. Class Order Batch

One `OrderConstructionCommand` MAY order from `1` through exactly `12` ships of one approved compiled design version.

A batch MUST contain:

- one compiled-design-version identifier;
- one named-class identifier;
- quantity within `1..12`;
- one builder or explicit per-ship builder allocation;
- stable ship identifiers;
- canonical ship-name assignments or naming policy;
- capacity and payment reservations; and
- batch hash.

All ships in the batch MUST reference the same compiled design version at authorization.

A quantity above `12` MUST be rejected with `CONSTRUCTION_BATCH_LIMIT_EXCEEDED`. Additional ships require another command and batch.

## 5. Repeat Orders and Design Studies

Additional ships of an approved compiled design version require no new design study when:

- the exact compiled-design-version identifier and hash are unchanged;
- technology and treaty rules still permit construction;
- builder and dock predicates pass; and
- no design-expiration policy applies.

Any mechanical modification requires a new draft and compiled version. Study requirements then follow `DESIGN-21`, including derived-family similarity discounts.

Changes only to ship name, cosmetic appearance, or non-mechanical presentation data do not require a new study.

A command claiming study exemption for a changed mechanical design MUST fail with `NEW_DESIGN_STUDY_REQUIRED`.

## 6. Work and Payment

All work MUST use work micro-units. All money MUST use currency micro-units.

For each monthly resolution:

`affordableWork = floor(paymentReceived / costPerWorkMicroUnit)`

`capacityLimitedWork = min(requestedWork, allocatedCapacity)`

`calculatedEffectiveWork = applyDeclaredWorkRateModifiers(min(affordableWork, capacityLimitedWork))`

`appliedWork = min(calculatedEffectiveWork, remainingWork)`

`completedWorkAfter = completedWorkBefore + appliedWork`

Progress equals exactly `appliedWork`.

Allocated, promised, reserved, deferred, or arreared money MUST NOT create progress before payment.

A project completes exactly when completed work reaches total work.

## 7. Delayed and Halted Projects

A project in `DELAYED` status for a month MUST receive:

- exactly `0` work;
- exactly `0` ordinary work charge;
- no consumed construction capacity;
- declared preservation or contractual costs only; and
- one explicit delay record and reason code.

A project in `HALTED` status follows the same zero-work rule and pays preservation cost under `DESIGN-13`.

Delayed or halted months MUST NOT count as active completion months when another contract tracks duration.

## 8. Acceleration

Acceleration requires an accepted command and `accelerationAllowed: true` for the project type.

The shipped policy is `construction_acceleration_v1` from `DESIGN-13`:

- remaining-work multiplier: exactly `10_500` basis points;
- monthly work-rate multiplier: exactly `11_000` basis points;
- accelerated capacity-pressure weight: exactly `12_500` basis points;
- delay eligibility threshold: capacity pressure greater than `9_000` basis points;
- maximum seeded delay probability: `5_000` basis points;
- delay duration: exactly `1` month.

The 5% premium applies once to remaining work when acceleration begins:

`acceleratedRemainingWork = ceiling(remainingWorkBeforeAcceleration * 10_500 / 10_000)`

The work-rate increase applies only in paid accelerated months:

`acceleratedCapacity = floor(baseEffectiveCapacity * 11_000 / 10_000)`

Completed work MUST NOT be increased retroactively. Re-enabling acceleration MUST NOT charge the premium twice for the same remaining-work segment.

## 9. Acceleration Capacity-Pressure Delay

Capacity pressure MUST be calculated per construction pool under `DESIGN-13` and `DESIGN-16`.

Eligible accelerated projects MUST be evaluated in ascending project identifier order using stream:

`construction/month/project/acceleration_pressure`

A successful delay check MUST:

- set project status to `DELAYED` for the current month;
- apply zero work and zero ordinary work charge;
- release unused monthly capacity;
- preserve the acceleration premium already applied; and
- record `ACCELERATION_CAPACITY_PRESSURE_DELAY`.

Delay MUST NOT be inferred or applied without a keyed random-decision record.

## 10. Latent Defect Definition

Every latent defect MUST use one immutable `LatentDefectDefinition` containing:

- `defectTypeId`;
- applicable project, hull, machinery, armor, weapon, electronics, and builder predicates;
- probability-weight contribution;
- severity distribution;
- hidden-effect specification;
- discovery predicates;
- repairability classification;
- repair package identifier or `NONE`;
- permanent-effect policy;
- content version; and
- content hash.

`repairabilityClassification` MUST be exactly one of:

- `FULLY_REPAIRABLE`;
- `PARTIALLY_REPAIRABLE`;
- `REPAIRABLE_ONLY_DURING_REBUILD`;
- `UNREPAIRABLE`; or
- `SELF_CORRECTING_AFTER_TRIALS`.

## 11. Defect Probability

The active ruleset MUST define `latent_defect_generation_v1`.

The shipped base probability is exactly `500` basis points per eligible ship, evaluated at each declared defect checkpoint.

The permitted base range is `100..1_500` basis points.

Final probability is:

`finalDefectProbabilityBp = clamp(0, 10_000, roundHalfEven(baseProbabilityBp * builderQualityMultiplierBp * nationalTraitMultiplierBp * designComplexityMultiplierBp * accelerationMultiplierBp * foreignYardMultiplierBp / 10_000^5))`

The shipped multiplier schedules are:

### Builder Quality

- excellent: `5_000`;
- good: `7_500`;
- standard: `10_000`;
- poor: `12_500`;
- undeveloped: `15_000`.

### Design Complexity

Complexity score uses `0..100`:

- `0..24`: `7_500`;
- `25..49`: `10_000`;
- `50..74`: `12_500`;
- `75..100`: `15_000`.

### Acceleration

- never accelerated: `10_000`;
- accelerated for less than 25% of paid work: `11_000`;
- accelerated for 25% through 49%: `12_500`;
- accelerated for at least 50%: `15_000`.

### Foreign Yard

- domestic yard: `10_000`;
- allied foreign yard with standards agreement: `10_000`;
- other foreign yard: `11_000`;
- hostile-transition or disrupted foreign yard: `13_000`.

National trait multipliers come from `DESIGN-12` and apply in ascending trait identifier order.

## 12. Defect Checkpoints and Streams

The shipped defect checkpoints are:

- `25%` paid work;
- `50%` paid work;
- `75%` paid work; and
- completion before trials.

Each checkpoint is evaluated at most once per ship.

The check MUST use stream:

`construction/month/project/latent_defect`

The key MUST include campaign seed, project identifier, ship identifier, checkpoint, defect-generation version, and ordered input hash.

Technology checks and UI activity MUST NOT consume this stream.

When no defect is generated, the checkpoint still emits a decision record.

## 13. Defect Selection and Severity

When a defect check succeeds:

1. build all eligible defect definitions;
2. order them by ascending defect type identifier;
3. select one through exact integer weighted selection;
4. select severity through the defect's explicit integer weights; and
5. create one hidden authoritative `LatentDefectInstance`.

Severity MUST be exactly one of:

- `MINOR`;
- `MODERATE`;
- `MAJOR`; or
- `CRITICAL`.

The shipped general severity weights are:

- `MINOR`: `5_000`;
- `MODERATE`: `3_000`;
- `MAJOR`: `1_500`;
- `CRITICAL`: `500`.

A definition MAY provide another explicit distribution summing exactly `10_000`.

## 14. Hidden Defect State

A `LatentDefectInstance` MUST contain:

- `defectInstanceId`;
- ship and project identifiers;
- defect type and severity;
- creation checkpoint and month;
- hidden mechanical effects;
- current discovery state;
- discovery confidence;
- repairability classification;
- repair state;
- random-decision references;
- formula and ruleset versions; and
- instance hash.

True defect state MUST NOT be exposed to the player or AI until a legal discovery predicate succeeds.

The defect remains authoritative and affects only systems explicitly listed by its definition.

## 15. Defect Discovery

Defects MAY be discovered only through these contexts:

- builder trials;
- commissioning trials;
- normal service checks;
- breakdown investigation;
- repair inspection;
- rebuild inspection; or
- combat manifestation.

Each context MUST have an explicit discovery formula and stream key.

The shipped base discovery probabilities are:

- builder trials: `3_000` basis points;
- commissioning trials: `5_000`;
- each completed service year: `1_000`;
- breakdown investigation: `4_000`;
- repair inspection: `6_000`;
- rebuild inspection: `9_000`;
- combat manifestation: defect-defined, with shipped default `5_000` when the affected system is stressed.

Final probability MAY be modified by trait, crew, officer, inspection, severity, and damage inputs declared by the discovery formula.

A successful discovery MUST create a knowledge assertion and typed defect-discovery event. It MUST NOT repair the defect automatically.

## 16. Defect Repair

Repair eligibility and outcome MUST follow the defect's repairability classification.

- `FULLY_REPAIRABLE`: normal repair package can remove all effects.
- `PARTIALLY_REPAIRABLE`: repair package replaces effects with the explicit reduced effect set.
- `REPAIRABLE_ONLY_DURING_REBUILD`: only a major rebuild work package may remove or reduce it.
- `UNREPAIRABLE`: no repair command may remove it. Scrapping or replacement remains possible.
- `SELF_CORRECTING_AFTER_TRIALS`: the declared paid trials project and predicate may remove it.

Every repair MUST create a work package, cost, capacity requirement, completion effect, and audit record.

A generic repair action MUST NOT erase unknown or ineligible defects.

## 17. Combined Dockyard Project

When repair, rebuild, conversion, installation, or modernization work is authorized for the same ship with overlapping active calendar months, the work MUST be represented by one combined `DockyardProject`.

The combined project MUST contain separate ordered work packages and one shared availability state, dock reservation, schedule, and project identity.

Creating simultaneous independent dockyard projects for the same ship is prohibited with `SHIP_ALREADY_HAS_ACTIVE_DOCKYARD_PROJECT`.

Work added after authorization requires an accepted change-order command and complete revalidation.

## 18. Work Packages

Canonical work-package types are:

- `REPAIR_STRUCTURE`;
- `REPAIR_FLOTATION`;
- `MACHINERY`;
- `ARMOR`;
- `ARMAMENT`;
- `ELECTRONICS`;
- `AVIATION`;
- `CONVERSION`;
- `DEFECT_REPAIR`;
- `TRIALS`; and
- `COMMISSIONING`.

Every package MUST contain:

- `workPackageId`;
- package type;
- exact total, completed, paid, and remaining work;
- cost per work unit;
- capacity pool;
- prerequisites;
- dependencies;
- target systems;
- resulting compiled-design effect or ship-state effect;
- availability effect;
- cancellation behavior; and
- package hash.

## 19. Package Ordering and Parallelism

Dependencies MUST form an acyclic graph.

Packages without dependencies MAY progress in parallel only when sufficient separate capacity and payment exist.

Canonical ordering is:

1. safety-critical structure and flotation;
2. machinery;
3. armor;
4. armament;
5. electronics;
6. aviation;
7. conversion;
8. defect repair;
9. trials;
10. commissioning;
11. ascending work-package identifier.

A dependency cycle MUST fail with `DOCKYARD_WORK_PACKAGE_CYCLE`.

## 20. Repair, Rebuild, and Conversion Availability

A ship under a `MAJOR_REBUILD` or `CONVERSION` package MUST have operational availability `UNAVAILABLE` from project start through successful trials and commissioning.

A ship under repair is:

- `UNAVAILABLE` for critical structure, flotation, machinery, armament, or major electronics work;
- `DEGRADED` only when the repair policy explicitly permits limited operation; or
- `AVAILABLE` only for minor installation work whose contract states no operational interruption.

An unavailable ship MUST NOT move, train, fulfill foreign-station duty, or enter battle generation.

## 21. Rebuild Validation

Rebuild validation MUST use `rebuild_validation_v1`, not new-construction validation.

The rebuild validator MUST check:

- source ship and current compiled version;
- retained hull structure and maximum permitted modification;
- current damage and defects;
- rebuild technology and historical compatibility;
- dock and refit capacity;
- treaty rebuild clauses;
- classification under `DESIGN-22`;
- stability, flotation, topside load, and displacement;
- package dependencies;
- cost and remaining service-life policy; and
- resulting individual-ship configuration.

The shipped retained-hull limits are:

- standard displacement increase no greater than `20%` of current compiled displacement;
- designed speed increase no greater than exactly `3` knots;
- hull length change no greater than `5%`;
- hull beam change no greater than `5%`;
- no pressure-hull, full flight-deck, or broad hull-category conversion without an explicit conversion technology and policy.

A new-construction-legal design may still be rebuild-illegal. Rebuild failure MUST produce an explicit validation report and no state change.

## 22. Rebuild Result

A completed rebuild MUST create exactly one new immutable `CompiledDesignVersion` and one ship-specific transition record.

The ship MUST atomically change from the old to the new compiled version only after:

- every required package completes;
- required payment posts;
- classification passes;
- treaty and dock validation pass;
- trials pass; and
- final invariants pass.

The old compiled version remains persisted for history and replay.

Two ships of the same `NamedClass` MAY reference different compiled versions after individual rebuilds. Named-class membership MUST NOT force mechanical identity.

## 23. Project Cancellation

Cancellation MUST use the command and settlement contract in `DESIGN-11`.

A cancelled project MUST:

- stop future work;
- release future capacity reservations;
- settle paid, committed, refundable, non-refundable, and salvageable values explicitly;
- preserve completed physical work or dispose of it through a typed effect;
- resolve target-ship availability and custody; and
- create a cancellation record.

Cancellation MUST NOT silently restore a pre-project ship state after irreversible work.

## 24. Scrapping Authorization

Scrapping requires an accepted `ScrapShipCommand` or mandatory treaty-disposal command.

Authorization MUST validate:

- ship identity and ownership;
- no unresolved battle participation;
- location and yard access;
- treaty deadline and inspection restrictions;
- project and lien status;
- politically protected status;
- salvage policy; and
- personnel and inventory disposition.

A sunk, captured by another nation, or already scrapped ship cannot be scrapped again.

## 25. Scrapping Effects

When scrapping begins, the ship MUST:

- transition operational status to `SCRAPPING`;
- become unavailable for movement, training, missions, battle generation, and compliance contribution;
- release its permanent-division assignment;
- create inventory, personnel, and ordnance disposition records;
- create one scrapping project; and
- remain a historical asset record.

When scrapping completes, the ship MUST transition to `SCRAPPED` and incur no future ship maintenance from the next monthly maintenance phase.

The ship MUST NOT be deleted from history.

## 26. Salvage Credit

The active ruleset MUST define `ship_scrapping_salvage_v1`.

The shipped base salvage ratios against original completed ship value are:

- age `0..9` completed years: `2_000` basis points;
- age `10..19`: `1_500`;
- age `20..29`: `1_000`;
- age `30` or more: `500`.

Condition multipliers are:

- operational: `10_000`;
- degraded: `8_000`;
- mission killed: `5_000`;
- burned, flooded, or heavily stripped: `2_500`.

`grossSalvageCredit = floor(originalCompletedValue * ageSalvageBp * conditionMultiplierBp / 10_000^2)`

`netSalvageCredit = max(0, grossSalvageCredit - scrappingWorkCost - environmentalOrTreatyCost)`

Credit MUST post only as paid scrapping work completes, proportionally to completed scrapping work. No upfront full credit is permitted.

Treaty or event policy MAY reduce salvage through an explicit multiplier. Missing policy uses exactly `10_000` basis points.

## 27. Scrapping Duration and Work

Scrapping uses repair/refit capacity.

The shipped total scrapping work is:

`scrappingWork = ceiling(originalConstructionWork * 1_000 / 10_000)`

This is exactly `10%` of original construction work.

Minimum scrapping duration is `1` completed month. Maximum ordinary duration is `12` months unless damage or infrastructure policy explicitly increases it.

No salvage is produced in a month with zero paid scrapping work.

## 28. Treaty-Required Scrapping

A treaty disposal clause MUST define:

- affected ship identifiers or eligibility predicate;
- disposal method;
- effective date;
- deadline month;
- inspection schedule;
- allowed operational status before deadline;
- salvage multiplier;
- violation effects; and
- completion proof requirements.

Treaty-required scrapping MUST create a mandatory command or project before the deadline.

The ship MUST be unavailable no later than the deadline's `RESOLVE_COMPLIANCE` phase.

Completion MUST be inspected through a typed `TreatyInspectionRecord` when inspection is required.

Failure to begin, disable, or complete disposal as required MUST create an explicit treaty violation. The system MUST NOT silently scrap the ship or waive the deadline.

## 29. Treaty Inspection

Every inspection MUST record:

- treaty and clause identifiers;
- inspecting parties;
- inspected ship and project;
- scheduled month and phase;
- observed state;
- declared state;
- compliance result;
- deception result when permitted;
- follow-up deadline;
- tension and political effects; and
- record hash.

Inspection uses intelligence and treaty rules. Descriptive reports do not determine compliance.

## 30. Construction and Project Records

Every monthly project resolution MUST produce one immutable `ProjectResolutionRecord` containing:

- project identifier;
- opening status;
- payment due and paid;
- capacity requested, reserved, allocated, and consumed;
- base work;
- modifiers;
- acceleration premium and rate;
- delay decisions;
- applied work;
- package progress;
- defect checks and discovery checks;
- closing status;
- ledger transaction identifiers;
- RNG decision identifiers;
- ruleset and formula versions; and
- record hash.

## 31. Canonical Ordering

Projects MUST be ordered under the capacity policy in `DESIGN-16` and then ascending project identifier.

Ships within a class batch MUST be ordered by batch ordinal and ship identifier.

Defect checkpoints MUST be ordered by progress threshold. Eligible defect types MUST be ordered by identifier.

Work packages MUST follow Section 19.

Database insertion order, UI order, localized names, and wall-clock time MUST NOT affect results.

## 32. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_DOCKYARD_PROJECT`;
- `INVALID_DOCKYARD_PROJECT_TRANSITION`;
- `DESIGN_APPROVAL_REQUIRED`;
- `CONSTRUCTION_BATCH_LIMIT_EXCEEDED`;
- `NEW_DESIGN_STUDY_REQUIRED`;
- `INSUFFICIENT_PROJECT_PAYMENT`;
- `INSUFFICIENT_PROJECT_CAPACITY`;
- `PROJECT_DELAYED_ZERO_WORK`;
- `ACCELERATION_NOT_ALLOWED`;
- `ACCELERATION_CAPACITY_PRESSURE_DELAY`;
- `LATENT_DEFECT_GENERATED`;
- `LATENT_DEFECT_DISCOVERED`;
- `LATENT_DEFECT_NOT_REPAIRABLE`;
- `SHIP_ALREADY_HAS_ACTIVE_DOCKYARD_PROJECT`;
- `DOCKYARD_WORK_PACKAGE_CYCLE`;
- `REBUILD_VALIDATION_FAILED`;
- `REBUILD_CLASSIFICATION_INVALID`;
- `PROJECT_CANCELLATION_WINDOW_CLOSED`;
- `SHIP_SCRAPPING_STARTED`;
- `SHIP_SCRAPPED`;
- `TREATY_SCRAPPING_DEADLINE_MISSED`;
- `TREATY_INSPECTION_FAILED`; and
- `DOCKYARD_STATE_INVARIANT_FAILED`.

## 33. Validation and Acceptance

Automated validation MUST prove that:

1. construction begins only from an approved immutable compiled design;
2. one batch contains from one through exactly twelve ships of one compiled version;
3. additional unchanged ships need no new study;
4. every mechanical change invokes the design-study policy;
5. progress equals only paid effective work;
6. delayed and halted projects receive zero work and zero ordinary work charge;
7. acceleration applies exactly `10_500` basis points to remaining work once;
8. accelerated monthly rate uses exactly `11_000` basis points;
9. acceleration pressure uses exact weighting, threshold, stream, probability, and one-month delay;
10. every delay is explicit and auditable;
11. latent-defect base probability is exactly `500` basis points in the shipped ruleset;
12. builder quality, traits, complexity, acceleration, and foreign-yard multipliers execute in exact order;
13. defect checks occur at exactly 25%, 50%, 75%, and completion, once each;
14. defects use a stable keyed stream and hidden authoritative records;
15. severity weights total exactly 10,000;
16. discovery occurs only through trials, service, investigation, repair, rebuild, or combat formulas;
17. discovered defects do not repair automatically;
18. repairability follows each defect's explicit classification;
19. overlapping dockyard work for one ship uses one combined project;
20. repair, machinery, armor, armament, electronics, aviation, conversion, defect, trials, and commissioning remain separate packages;
21. package dependencies are acyclic;
22. ships under major rebuild or conversion remain unavailable through trials and commissioning;
23. rebuild validation uses exact retained-hull limits and differs from new construction;
24. rebuild completion creates one new immutable compiled design version;
25. individual ships in one named class may retain different compiled versions;
26. cancellation settles physical work, reservations, refunds, losses, availability, and custody explicitly;
27. scrapping immediately removes operational availability and later removes maintenance;
28. salvage uses exact age, condition, work-cost, and proportional-payment formulas;
29. scrapping work is exactly 10% of original construction work;
30. treaty-required disposal follows exact deadlines, status restrictions, inspections, and violation rules;
31. ships and old compiled versions remain in history; and
32. identical state, commands, content, ruleset, contracts, and seeds produce identical project, defect, rebuild, scrapping, ledger, RNG, and hash results.
