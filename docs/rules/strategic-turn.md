# DESIGN-10: Strategic Monthly Turn Pipeline

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-10`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Phase order, snapshot boundaries, movement, battle eligibility, battle participation, and end-of-month AI administration are fully specified here. Runtime inference and fallback behavior are prohibited.

## 1. Strategic Turn Boundary

One strategic turn represents exactly one calendar month.

A turn MUST begin from a validated `MonthOpeningSnapshot` and MUST end with one committed `MonthClosingSnapshot` or one explicit terminal failure record. A partially resolved month MUST NOT become the active campaign state.

The month-resolution coordinator MUST execute phases in the exact order defined in Section 3. Parallel execution is permitted only within a phase when the phase contract declares independent partitions and deterministic merge ordering.

Every phase MUST emit a `PhaseResolutionRecord` containing:

- `campaignId`;
- `campaignMonth`;
- `phaseId`;
- `phaseOrdinal`;
- `inputSnapshotHash`;
- ordered command, event, and decision identifiers;
- ordered output record identifiers;
- `outputStateHash`;
- `rngManifestPositionBefore`;
- `rngManifestPositionAfter`;
- `resultCode`; and
- `formulaAndPolicyVersions`.

A phase MUST NOT execute when the campaign phase cursor does not equal that phase's ordinal. A mismatch MUST fail with `INVALID_STRATEGIC_PHASE_CURSOR`.

## 2. Stable Snapshots

The mandatory stable snapshots are:

1. `MonthOpeningSnapshot`;
2. `CommandLockSnapshot`;
3. `PostMovementSnapshot`;
4. `BattleEligibilitySnapshot`;
5. `PostBattleSnapshot`;
6. `BlockadeSnapshot`; and
7. `MonthClosingSnapshot`.

Each stable snapshot MUST contain:

- `snapshotId`;
- `campaignId`;
- `campaignMonth`;
- `snapshotType`;
- `phaseCursor`;
- aggregate references and hashes;
- command/event ledger position;
- RNG manifest position;
- content-pack hash;
- ruleset hash;
- formula-version manifest hash;
- AI-policy version;
- invariant-validation result; and
- canonical snapshot hash.

A stable snapshot MUST be immutable after commitment. Missing snapshots, duplicate snapshot types in one month, or an invalid snapshot order MUST fail with `INVALID_MONTHLY_SNAPSHOT_SEQUENCE`.

## 3. Authoritative Phase Order

The canonical phase identifiers and ordinals are:

1. `VALIDATE_PREVIOUS_SNAPSHOT`
2. `OPEN_MONTH`
3. `APPLY_SCHEDULED_GLOBAL_EVENTS`
4. `APPLY_SCHEDULED_NATIONAL_EVENTS`
5. `PRESENT_MANDATORY_PLAYER_DECISIONS`
6. `GENERATE_AI_STRATEGIC_PLANS`
7. `COLLECT_PLAYER_COMMANDS`
8. `VALIDATE_AND_RESERVE_COMMANDS`
9. `LOCK_ALL_COMMANDS`
10. `RESOLVE_DIPLOMACY`
11. `RESOLVE_POLITICAL_AND_BUDGET_CHANGES`
12. `POST_MONTHLY_REVENUE`
13. `PAY_MANDATORY_OBLIGATIONS`
14. `RESOLVE_INSOLVENCY_ALLOCATION`
15. `RESOLVE_PROJECTS`
16. `RESOLVE_RESEARCH`
17. `RESOLVE_PERSONNEL_AND_READINESS`
18. `RESOLVE_STRATEGIC_MOVEMENT`
19. `RESOLVE_PRE_BATTLE_OPERATIONAL_EFFECTS`
20. `GENERATE_TACTICAL_ENGAGEMENTS`
21. `RESOLVE_BATTLES`
22. `APPLY_BATTLE_CONSEQUENCES`
23. `RESOLVE_AMPHIBIOUS_OPERATIONS`
24. `RESOLVE_BLOCKADE`
25. `RESOLVE_TRADE_WARFARE`
26. `RESOLVE_SUPPLY_AND_FUEL`
27. `RESOLVE_POLITICAL_END_OF_MONTH_EFFECTS`
28. `RESOLVE_PEACE_NEGOTIATIONS`
29. `RESOLVE_COMPLIANCE`
30. `END_OF_MONTH_AI_ADMINISTRATION`
31. `EVALUATE_TERMINAL_CONDITIONS`
32. `GENERATE_REPORTS`
33. `CANONICALIZE_STATE`
34. `COMPUTE_HASHES`
35. `PERSIST_AUTOSAVE`
36. `CLOSE_MONTH`

No phase may be skipped. A phase with no eligible work MUST emit a successful empty `PhaseResolutionRecord`.

## 4. Validate Previous Snapshot

The coordinator MUST validate:

- the previous snapshot hash;
- aggregate hashes;
- command/event ledger hash;
- RNG manifest hash;
- content and ruleset compatibility;
- aggregate invariants;
- campaign month;
- phase cursor; and
- unresolved battle and project constraints.

Failure MUST stop the turn before state mutation and emit `PREVIOUS_SNAPSHOT_VALIDATION_FAILED`.

## 5. Open Month

This phase MUST:

- advance the campaign calendar by exactly one month from the previous closing snapshot;
- update elapsed war months;
- update officer and crew service months;
- update project elapsed months;
- update training elapsed months; and
- activate effects scheduled for the new month and a later phase.

Elapsed counters MUST increase by exactly `1` when their entity was active for the complete preceding month. Partial-month strategic counters are prohibited.

## 6. Scheduled Events and Mandatory Decisions

Global events MUST resolve before national events. Within each category, eligible events MUST be ordered by:

1. ascending scheduled date;
2. ascending event priority;
3. ascending stable event identifier; and
4. ascending scope identifier.

Mandatory decisions MUST be resolved or explicitly deferred by a canonical decision contract before command collection can close. An unresolved non-deferrable decision MUST fail command lock with `MANDATORY_DECISION_UNRESOLVED`.

## 7. AI Planning and Command Collection

AI strategic planning MUST read only the AI participant's legal knowledge projection at `MonthOpeningSnapshot`, plus visible outcomes of scheduled events and decisions resolved before planning.

Player and AI commands MUST use the command contracts in `DESIGN-11`.

Command validation and reservation MUST complete before lock. Accepted commands MUST identify reserved treasury, capacity, inventory, personnel, and asset exclusivity. Rejected commands reserve nothing.

At `LOCK_ALL_COMMANDS`:

- accepted player and AI commands become immutable;
- canonical command order MUST be fixed;
- late commands MUST be rejected with `COMMAND_WINDOW_CLOSED`; and
- `CommandLockSnapshot` MUST be produced.

## 8. Diplomacy, Politics, Revenue, and Obligations

Diplomacy MUST resolve before pre-spending political and budget changes. Monthly revenue MUST post after those changes and before mandatory obligations.

All financial state changes MUST use balanced ledger postings. Payment priority and arrears behavior MUST be defined by the economy contract. Treasury MUST NOT silently become negative.

Projects and research receive progress only from paid authoritative expenditure.

## 9. Projects, Research, Personnel, and Readiness

Projects MUST resolve before research. Research MUST resolve before personnel and readiness.

This ordering is authoritative because project completion can create research or equipment capability in the same month, and research completion can create adoption requirements before personnel and readiness resolution.

Every subsystem MUST use the state committed by the immediately preceding phase. It MUST NOT read a projection from a later phase.

## 10. Strategic Movement

### 10.1 Movement Input Boundary

Strategic movement MUST use authoritative state after `RESOLVE_PERSONNEL_AND_READINESS` and after diplomacy has resolved for the current month.

The input MUST include:

- locked movement commands;
- current diplomatic relations;
- war participation;
- access rights;
- canal state and permissions;
- route-edge state;
- current locations;
- readiness and damage;
- fuel type, fuel availability, and fuel requirement;
- blockade restrictions;
- range restrictions;
- division membership; and
- movement ruleset version.

### 10.2 Required Movement Ruleset Fields

The active ruleset MUST define:

- `normalStrategicMovementEdgesPerMonth` with shipped value `1`;
- `maximumStrategicMovementEdgesPerMonth` with shipped value `3`;
- `movementAllowancePolicyId` with shipped value `movement_allowance_v1`;
- `fuelConsumptionFormulaId`;
- `breakdownEligibilityPredicateId`;
- `breakdownProbabilityFormulaId`;
- `interdictionEligibilityPredicateId`;
- `interdictionResolutionFormulaId`;
- `movementFailurePriorityId` with shipped value `movement_failure_priority_v1`; and
- `movementFormulaVersion`.

`normalStrategicMovementEdgesPerMonth` MUST equal an integer within `0..3`. `maximumStrategicMovementEdgesPerMonth` MUST equal an integer within `1..3` and MUST be greater than or equal to the normal allowance.

A missing or invalid field MUST fail ruleset validation with `INVALID_STRATEGIC_MOVEMENT_CONTRACT`.

### 10.3 Movement Allowance

Every moving force begins with the normal allowance of exactly `1` eligible route edge per month.

Additional movement is permitted only when an explicit movement modifier grants integer bonus edges. Modifiers MUST name their source and stacking rule. The final allowance MUST be:

`min(maximumStrategicMovementEdgesPerMonth, normalStrategicMovementEdgesPerMonth + sumStackingBonusEdges)`

Negative modifiers MAY reduce the allowance to `0` but MUST NOT produce a negative value.

The shipped ruleset defines no general bonus-edge modifier. Therefore, without an explicit canonical modifier, every force resolves at most one edge.

### 10.4 Route Validation

A planned path MUST be an ordered list of adjacent route-edge identifiers beginning at the force's current area.

Before traversing each edge, the resolver MUST validate against the current month's post-diplomacy state:

- edge existence and adjacency;
- directionality;
- physical operating condition;
- access rights;
- war restrictions;
- bilateral tension restrictions;
- canal permissions;
- choke-point predicates;
- blockade restrictions;
- ship and force range restrictions;
- mission restrictions;
- division co-location; and
- destination legality.

Validation MUST occur again before every additional edge granted by a modifier. Permission validated for one edge MUST NOT authorize later edges.

A failed edge remains untraversed. The force MUST remain at the last legally reached area.

### 10.5 Per-Edge Resolution Order

For each permitted edge, the resolver MUST execute:

1. validate edge legality;
2. calculate and reserve required fuel;
3. evaluate pre-departure breakdown eligibility;
4. resolve pre-departure breakdown when eligible;
5. evaluate interdiction eligibility;
6. resolve interdiction when eligible;
7. commit fuel expenditure;
8. commit traversal to the destination area;
9. record battle-presence state; and
10. continue only when movement allowance remains and the force is still eligible.

The shipped `movement_failure_priority_v1` order is:

1. `INVALID_ROUTE`;
2. `ACCESS_DENIED`;
3. `BLOCKADE_MOVEMENT_PROHIBITED`;
4. `RANGE_RESTRICTION`;
5. `INSUFFICIENT_FUEL`;
6. `BREAKDOWN_CANCELLED_MOVEMENT`;
7. `INTERDICTION_HALTED_MOVEMENT`; and
8. `DESTINATION_NO_LONGER_VALID`.

When multiple failure predicates are true before an edge, the first reason in this list MUST be the primary result. Additional reasons MAY be recorded as diagnostics.

### 10.6 Fuel

Fuel requirement MUST be calculated per edge before departure. Fuel MUST be reserved only for the edge being attempted.

If available fuel is below the exact required amount, the edge MUST NOT be traversed and no movement fuel may be charged. The result code MUST be `INSUFFICIENT_FUEL`.

If movement succeeds, the exact reserved fuel MUST be consumed. If breakdown or interdiction stops movement before departure, fuel treatment MUST be declared by the corresponding formula result as one of:

- `NO_FUEL_CONSUMED`;
- `PORTION_CONSUMED` with an explicit integer amount; or
- `FULL_EDGE_FUEL_CONSUMED`.

Implicit fuel loss is prohibited.

### 10.7 Breakdown

Breakdown checks MUST use the domain-separated stream `movement/month/force/breakdown` and a keyed decision for the campaign month, force identifier, and attempted edge.

A breakdown result MUST specify:

- affected assets;
- whether departure is cancelled;
- movement speed or allowance effects;
- readiness or damage effects;
- repair requirement; and
- fuel treatment.

A breakdown MUST NOT move an asset to an intermediate unstored location. The asset remains at the source or completes the full edge according to the explicit result.

### 10.8 Interdiction

Interdiction checks MUST use the domain-separated stream `movement/month/edge/interdiction`.

An interdiction result MUST specify exactly one outcome:

- `NO_EFFECT`;
- `MOVEMENT_HALTED_AT_SOURCE`;
- `MOVEMENT_COMPLETED_WITH_EFFECT`;
- `BATTLE_OPPORTUNITY_CREATED`; or
- `ASSET_LOSS_OR_DAMAGE_APPLIED`.

Interdiction MUST NOT create an unresolved tactical battle outside the battle-generation phase. A battle opportunity is recorded for later eligibility evaluation.

### 10.9 Divisions and Multi-Ship Forces

A permanent division MUST move as one force unless a locked command explicitly splits it before movement.

If any mandatory member is ineligible for the attempted edge, the complete force movement MUST fail with `DIVISION_MOVEMENT_INELIGIBLE`. Partial division movement is prohibited.

After movement, every commissioned ship MUST occupy exactly one strategic area.

### 10.10 PostMovementSnapshot

After all movement commands resolve, the system MUST produce one `PostMovementSnapshot` containing:

- final location of every commissioned ship and strategic force;
- traversed-edge records;
- remaining planned paths;
- fuel results;
- breakdown results;
- interdiction results;
- battle-presence state;
- movement command outcomes;
- movement RNG decision references; and
- canonical aggregate and snapshot hashes.

Movement commands MUST be resolved in ascending canonical command order. Independent force partitions MAY execute in parallel, but results MUST merge by ascending force identifier.

A missing final location, duplicate location, illegal traversed edge, or inconsistent division location MUST fail with `POST_MOVEMENT_INVARIANT_FAILED`.

## 11. Pre-Battle Operational Effects

This phase MUST resolve mine preparation, reconnaissance, intelligence updates, surprise state, and current air and submarine availability.

Its outputs MUST be immutable inputs to battle generation. Battle generation MUST NOT rerun pre-battle effects.

## 12. Tactical Engagement Generation

### 12.1 Battle Opportunity Inputs

Battle generation MUST use only:

- the committed `PostMovementSnapshot`;
- pre-battle operational-effect records;
- active wars and participant sides;
- mission opportunities;
- current asset readiness and battle presence;
- current knowledge assertions for presentation;
- weather and environment state;
- battle-generation ruleset fields; and
- prior battle reservations for the current month.

### 12.2 Required Battle-Generation Ruleset Fields

The active ruleset MUST define:

- `battleOpportunityPolicyId`;
- `battleEligibilityPredicateId` per mission type;
- `forceRequirementPolicyId` per mission type;
- `forceSelectionPolicyId` with shipped value `constraint_selection_v1`;
- `optionalAssetWeightFormulaId`;
- `battleRepairPolicyId`;
- `battleOrderingPolicyId` with shipped value `battle_order_v1`;
- `maximumBattlesPerAreaPerMonth` with shipped value `1`;
- `maximumBattlesPerWarAreaPairPerMonth` with shipped value `1`; and
- `battleGenerationFormulaVersion`.

Both maximum fields MUST be integers within `0..8` inclusive. Missing fields MUST fail with `INVALID_BATTLE_GENERATION_CONTRACT`.

### 12.3 Opportunity Ordering

Eligible battle opportunities MUST be ordered by `battle_order_v1`:

1. ascending war identifier;
2. ascending area identifier;
3. ascending mission-type priority;
4. ascending opportunity identifier.

Mission-type priority MUST be declared by the active ruleset as a unique integer for every supported mission type. Duplicate priorities MUST fail validation.

### 12.4 Battle Eligibility

An opportunity is eligible only when all of these predicates are true:

- an active war and opposing sides exist;
- the mission type is enabled for the area and era;
- required geographic and operational conditions exist;
- each side has enough reachable eligible assets to satisfy mandatory force requirements;
- required assets are not sunk, captured, working up, unavailable, or already reserved for an unresolved battle;
- fuel, range, supply, and mission restrictions are satisfied;
- the manifest can be auto-resolved; and
- area and war-area monthly battle limits are not exceeded.

Failure of any predicate MUST reject the opportunity with a machine-readable reason code. Rejected opportunities MUST NOT reserve assets or consume a battle seed.

### 12.5 Constraint-Based Force Selection

For each eligible opportunity, force selection MUST execute in this order:

1. gather all legally eligible assets;
2. group assets by side and required role;
3. preserve complete permanent divisions when every member is eligible;
4. assign mandatory roles;
5. validate minimum and maximum force requirements;
6. select optional assets by deterministic weighted selection;
7. add allied support when permitted;
8. instantiate declared temporary coastal, submarine, mine, and air elements;
9. validate reachability, command, supply, and mission legality;
10. apply only repairs listed by `battleRepairPolicyId`;
11. reject the opportunity if still invalid;
12. canonicalize the manifest; and
13. derive the battle seed after manifest acceptance.

Mandatory-role candidates MUST be ordered by:

1. descending eligibility score from the declared integer formula;
2. descending readiness;
3. ascending stable asset identifier.

Optional weighted selection MUST use the stream `battle_generation/month/war/area` and keyed draws. Candidate enumeration MUST be ordered by ascending stable asset identifier.

A repair policy MAY remove an optional asset, split an eligible tactical projection from a permanent division while preserving provenance, or fill an optional role. It MUST NOT waive treaty, location, war-side, fuel, range, readiness, or unresolved-battle constraints.

### 12.6 Asset Reservation

An accepted battle manifest MUST reserve every participating persistent asset before the next opportunity is evaluated.

The reservation MUST contain:

- `battleId`;
- `assetId`;
- `reservationStartPhase`;
- `reservationReleaseCondition`;
- `participationOrdinal`; and
- `sourceManifestHash`.

The shipped ruleset sets `maximumBattleParticipationsPerShipPerMonth` to exactly `1`.

A ruleset MAY set this field to `2` only for a named mission-specific exception whose eligibility predicate, fatigue cost, ammunition continuity, damage continuity, and ordering are all explicit. Values outside `1..2` are prohibited.

The shipped canonical ruleset defines no exception. Therefore, a ship that is reserved for or has resolved one battle in the current month MUST be ineligible for every later battle that month.

### 12.7 BattleEligibilitySnapshot

After all opportunities are accepted or rejected, the system MUST produce one `BattleEligibilitySnapshot` containing:

- ordered opportunity records;
- accepted battle manifests;
- rejected opportunity records and reason codes;
- all persistent-asset reservations;
- force-selection decision records;
- battle seeds for accepted manifests;
- intelligence-limited player estimates;
- auto-resolution availability proof; and
- canonical aggregate and snapshot hashes.

No accepted manifest may be altered after this snapshot. A required change MUST reject and regenerate the manifest before snapshot commitment.

Duplicate asset reservation, invalid force composition, missing auto-resolution proof, or a seed assigned to a rejected opportunity MUST fail with `BATTLE_ELIGIBILITY_INVARIANT_FAILED`.

## 13. Battle Resolution

### 13.1 Player Resolution Choice

For every accepted battle involving the player nation, the player MUST receive exactly one resolution choice:

- `TACTICAL_PLAY`; or
- `AUTO_RESOLVE`.

The default used when the player explicitly delegates the choice is `AUTO_RESOLVE`. Application exit, timeout, or missing input MUST leave the campaign at the unresolved battle decision boundary and MUST NOT silently select an option.

Battles not involving the player MUST use `AUTO_RESOLVE`.

A scenario MUST NOT require tactical play for campaign continuity.

### 13.2 Canonical Battle Input

Both resolvers MUST consume the accepted immutable battle manifest, battle seed, ruleset version, participating assets, weather, objectives, temporary elements, and pre-battle state.

Tactical play additionally consumes the ordered tactical command log. Auto-resolution consumes the declared deterministic auto-resolution policy.

### 13.3 Battle Ordering

Accepted battles MUST resolve in the exact order stored in `BattleEligibilitySnapshot`.

A later battle MUST read all committed authoritative consequences from earlier battles. It MUST NOT read an earlier pre-battle asset state.

### 13.4 Immediate Result Application

At battle completion, the resolver MUST produce an immutable `BattleResult` and apply asset-level consequences atomically before the next battle begins.

Immediate asset consequences include:

- damage state;
- sinking, capture, scuttling, abandonment, or survival state;
- ammunition and inventory expenditure;
- fuel expenditure;
- crew casualties, fatigue, morale, and experience;
- officer casualties, status, and experience;
- aircraft and squadron losses;
- submarine, mine, and temporary-element consumption;
- mission availability; and
- battle-participation count.

Strategic aggregate consequences that require cross-battle totals, including final monthly war contribution, political effects, and reports, MUST be emitted as pending consequence records and finalized in `APPLY_BATTLE_CONSEQUENCES`.

Application MUST be all-or-nothing. Failure MUST roll back battle-result application and emit `BATTLE_RESULT_APPLICATION_FAILED`.

### 13.5 Repeat Participation

Before each battle begins, every persistent participating asset MUST be revalidated against the immediately preceding committed battle state.

A ship MUST be rejected from a second battle when:

- its participation count reached the ruleset maximum;
- it is sunk, captured, scuttled, abandoned, or otherwise unavailable;
- current damage violates mission requirements;
- remaining ammunition, aircraft, fuel, or crew state violates requirements; or
- its explicit mission exception is no longer eligible.

Because the shipped canonical maximum is `1`, every second-battle attempt MUST fail with `SHIP_ALREADY_PARTICIPATED_THIS_MONTH`.

Temporary generated assets MUST declare their own participation limit. They MUST NOT bypass persistent-asset limits by remapping the same campaign asset to a new temporary identifier.

### 13.6 PostBattleSnapshot

After every accepted battle is resolved and immediate asset results are applied, the system MUST produce one `PostBattleSnapshot` containing:

- ordered battle results;
- final participating-asset states;
- battle-participation counts;
- pending strategic consequence records;
- released or completed battle reservations;
- unresolved battle count, which MUST equal `0`;
- battle ledger hash;
- RNG manifest position; and
- canonical aggregate and snapshot hashes.

A non-zero unresolved battle count MUST fail with `POST_BATTLE_UNRESOLVED_ENGAGEMENT`.

## 14. Battle Consequences, Amphibious Operations, and Blockade

`APPLY_BATTLE_CONSEQUENCES` MUST finalize damage, losses, crew and officer outcomes, war contribution, political effects, and reports from the ordered pending consequence records.

Amphibious operations MUST resolve after battle consequences and before blockade.

Blockade MUST use the committed `PostBattleSnapshot` plus amphibious results. It MUST produce one `BlockadeSnapshot`.

No blockade formula may read the pre-battle force state for the current month.

## 15. Trade, Supply, Politics, Peace, and Compliance

Trade warfare MUST resolve after blockade. Supply and fuel MUST resolve after trade warfare. Political end-of-month effects MUST resolve after supply. Peace negotiations MUST resolve after political effects. Compliance MUST resolve after accepted peace settlements.

Accepted peace terms MUST apply atomically before compliance evaluation.

## 16. End-of-Month AI Administration

### 16.1 Scope

This phase MAY perform only:

- eligible command-vacancy filling;
- authoritative AI plan maintenance; and
- generation of non-authoritative recommendations.

It MUST NOT resolve movement, spending, procurement, diplomacy, combat, research, construction, treaty changes, or other actions assigned to earlier phases.

### 16.2 Command-Vacancy Eligibility

A command vacancy is eligible for automatic filling only when:

- the command position exists and is active;
- the position is vacant at the start of this phase;
- the owning nation has an enabled officer-automation policy;
- at least one legally eligible officer exists;
- no locked player assignment or asset automation lock prohibits filling;
- the position is not scheduled for removal before the next month; and
- assignment does not violate rank, government, service, availability, or command-conflict rules.

The active ruleset MUST define:

- `vacancyFillPolicyId` with shipped value `vacancy_fill_v1`;
- `vacancyPriorityFormulaId`;
- `officerCandidateScoreFormulaId`;
- `planUpdatePolicyId` with shipped value `plan_update_v1`; and
- `recommendationPolicyId` with shipped value `recommendation_v1`.

Missing fields MUST fail with `INVALID_AI_ADMINISTRATION_CONTRACT`.

### 16.3 Vacancy Ordering and Selection

Eligible vacancies MUST be ordered by:

1. descending command-level priority;
2. descending operational urgency;
3. ascending position identifier.

Eligible officer candidates MUST be ordered by:

1. descending integer candidate score;
2. descending rank seniority;
3. descending revealed administrative suitability available to that AI;
4. ascending officer identifier.

The first candidate MUST be selected. Vacancy filling MUST consume no randomness.

Every assignment MUST use the normal officer-assignment command contract with issuer `SYSTEM_AUTOMATION`, pass full validation, and produce an audit record.

If no candidate passes validation, the vacancy remains open and the phase emits `NO_ELIGIBLE_OFFICER_FOR_VACANCY`.

### 16.4 Plan Updates

An authoritative AI plan MUST contain:

- `planId`;
- `nationId`;
- `planTypeId`;
- `createdAtSnapshotId`;
- `lastUpdatedAtSnapshotId`;
- legal knowledge input hash;
- objective input identifiers;
- budget forecast hash;
- force-state projection hash;
- planning-policy version;
- ordered plan goals;
- status; and
- explanation trace.

Plan updates MUST use state available after compliance. They MUST use only the AI nation's legal knowledge and declared information assistance.

A plan update MAY create, revise, suspend, complete, or cancel plan goals. It MUST NOT issue gameplay commands for the closing month. Commands derived from updated plans MAY be generated only in a future `GENERATE_AI_STRATEGIC_PLANS` phase.

Plans are authoritative AI state because they affect future command generation. They MUST be persisted and hashed.

### 16.5 Recommendations

Recommendations are non-authoritative presentation projections.

A recommendation MUST contain:

- `recommendationId`;
- `recipientId`;
- `recommendationTypeId`;
- legal knowledge input hash;
- policy version;
- explanation trace;
- referenced asset identifiers;
- expiration snapshot type; and
- confidence basis points within `0..10_000`.

Recommendations MUST NOT:

- reserve resources;
- issue commands;
- mutate authoritative state;
- consume authoritative RNG;
- alter AI plans;
- affect hashes other than an optional non-authoritative cache hash; or
- survive beyond their declared expiration without deterministic regeneration.

A recommendation cache MUST be discardable and reproducible from the same authoritative state and policy version.

## 17. Terminal Evaluation and Reports

Terminal conditions MUST be evaluated only after end-of-month AI administration and according to `DESIGN-02`.

Reports MUST be generated from authoritative records after terminal evaluation. Reports MUST respect fog of war and MUST NOT become authoritative state.

## 18. Canonicalization, Hashing, Autosave, and Close

Canonicalization MUST:

- normalize deterministic ordering;
- rebuild required projections;
- validate aggregate and cross-aggregate invariants; and
- reject unrecoverable invalid state.

Hash computation MUST produce:

- aggregate hashes;
- canonical snapshot hash;
- command/event ledger hash; and
- RNG manifest hash.

Autosave MUST write the candidate `MonthClosingSnapshot`, validate it, compute and verify hashes, atomically commit the active pointer, and retain the previous recovery save.

Only after successful autosave may `CLOSE_MONTH` make the closing snapshot the next opening snapshot.

Autosave failure MUST leave the previous active snapshot unchanged and emit `MONTH_AUTOSAVE_FAILED`.

## 19. Validation and Acceptance

Automated validation MUST prove that:

1. all thirty-six phases execute in the declared order;
2. empty phases emit successful phase records rather than being skipped;
3. stable snapshots occur exactly at their declared boundaries;
4. normal strategic movement traverses at most one edge per month;
5. movement allowance never exceeds three edges;
6. every edge is revalidated against current post-diplomacy state;
7. movement resolves legality, fuel, breakdown, and interdiction in the declared order;
8. division movement is atomic unless a locked split command exists;
9. `PostMovementSnapshot` contains one final location per commissioned ship;
10. battle generation reads the committed post-movement and pre-battle states;
11. battle opportunities use deterministic ordering and explicit eligibility predicates;
12. mandatory and optional force selection follow the declared constraint sequence;
13. rejected opportunities reserve no assets and consume no battle seed;
14. accepted manifestations prove auto-resolution availability;
15. the shipped ruleset permits exactly one battle participation per ship per month;
16. battle results apply atomically before the next battle begins;
17. later battles read earlier committed damage, loss, fuel, ammunition, crew, and officer results;
18. `PostBattleSnapshot` contains zero unresolved engagements;
19. blockade uses post-battle state;
20. eligible vacancies are filled deterministically without randomness;
21. vacancy assignments use standard command validation and audit records;
22. AI plan updates use legal knowledge and cannot issue commands for the closing month;
23. recommendations are non-authoritative, consume no RNG, and reserve no resources;
24. terminal evaluation occurs after AI administration;
25. canonicalization and invariant validation occur before hashing;
26. failed autosave does not advance the active campaign pointer; and
27. repeated resolution from identical opening state, commands, decisions, and seeds produces identical snapshots, ledgers, RNG manifests, and closing hashes.
