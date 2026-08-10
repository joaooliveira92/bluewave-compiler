# DESIGN-51: UI And Player Interaction

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-51`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. UI projections, decisions, automation, locks, commands, audit records, fog of war, and logs MUST use the explicit contracts, scopes, predicates, ordering, and failure behavior defined here. The UI and automation layer MUST NOT mutate authoritative domain state directly.

## 1. Monthly Player Loop

The monthly player loop MUST present these stages in order:

1. review previous results;
2. resolve mandatory decisions;
3. review budget, compliance, and warnings;
4. manage projects and force plans;
5. issue deployment and mission orders;
6. review diplomacy and strategic objectives;
7. commit the turn;
8. resolve or auto-resolve tactical engagements; and
9. review the end-of-month report.

The interface MAY allow navigation among unlocked stages, but turn commitment MUST fail while any blocking mandatory decision remains unresolved.

## 2. Decision Classes

Every player-facing decision MUST declare one class:

- `MANDATORY`;
- `EXCEPTION_DRIVEN`; or
- `OPTIONAL_ADMINISTRATIVE`.

A decision record MUST contain:

- stable decision identifier;
- class;
- source domain and aggregate;
- eligible options;
- deadline and blocking phase;
- default or automation option, if any;
- visible consequence preview;
- knowledge snapshot hash;
- status; and
- record hash.

The UI MUST NOT infer decision class from color, placement, wording, or notification severity.

## 3. Primary Interfaces

The canonical primary interfaces are:

- strategic map;
- nation dashboard;
- fleet list;
- design editor;
- construction and dockyard;
- research;
- diplomacy;
- intelligence;
- officers and divisions;
- aviation;
- war and objectives;
- reports; and
- tactical order of battle.

Each interface MUST consume read-only projections and issue validated commands. It MUST NOT receive mutable domain aggregates.

## 4. Information Projection

Every player-facing projection MUST contain:

- projection identifier and version;
- source snapshot identifier and hash;
- receiving participant;
- visible fields;
- redacted fields;
- knowledge-assertion references;
- generation time;
- staleness state; and
- projection hash.

A projection MUST be discarded and rebuilt when its source or knowledge hash changes.

## 5. Uncertain and Stale Information

Every uncertain or stale displayed value MUST expose:

- observation date;
- received date when relevant;
- confidence basis points or presentation band;
- source;
- estimate or closed estimate interval;
- staleness warning; and
- possible deception state when legally known.

Hidden values MUST NOT leak through:

- tooltips;
- sorting keys;
- list counts;
- derived totals;
- disabled controls;
- command availability;
- progress bars;
- comparison views;
- logs; or
- accessibility labels.

Player-facing reports and AI-facing projections MUST respect `DESIGN-29`.

## 6. Automation Framework

Every automation policy MUST have one immutable `AutomationPolicyDefinition` containing:

- `automationPolicyId`;
- domain scope;
- eligible aggregate and asset types;
- trigger phase;
- candidate predicate;
- legal command factory identifier;
- deterministic priority and tie-breaking;
- budget and resource limits;
- lock behavior;
- decision-boundary behavior;
- failure and retry behavior;
- explanation schema;
- default enabled state;
- policy version; and
- content hash.

Automation MUST use the same application commands, validation, reservation, payment, conflict, idempotency, and audit contracts as player actions under `DESIGN-11`.

Automation MUST NOT call repositories, reducers, or domain mutation methods directly.

## 7. Canonical Automation Policies

The shipped automation policy identifiers are:

- `automation_repairs_v1`;
- `automation_radar_installation_v1`;
- `automation_officer_assignment_v1`;
- `automation_squadron_reequipment_v1`;
- `automation_ship_naming_v1`;
- `automation_trade_protection_v1`;
- `automation_foreign_stations_v1`;
- `automation_division_replacement_v1`;
- `automation_scrapping_recommendations_v1`;
- `automation_research_reallocation_v1`; and
- `automation_inventory_replenishment_v1`.

No generic catch-all automation policy is permitted.

A missing policy definition MUST fail content validation with `AUTOMATION_POLICY_MISSING`.

## 8. Automation Modes

Every policy instance MUST use exactly one mode:

- `OFF`;
- `RECOMMEND_ONLY`;
- `AUTO_EXECUTE_NON_BLOCKING`; or
- `AUTO_EXECUTE_WITHIN_LIMITS`.

`RECOMMEND_ONLY` creates a recommendation and no command.

`AUTO_EXECUTE_NON_BLOCKING` may issue only commands whose definitions declare `automationNonBlocking: true`.

`AUTO_EXECUTE_WITHIN_LIMITS` may issue commands within the player's explicit policy limits, but MUST stop at a mandatory player-decision boundary.

Automation MUST NOT resolve:

- treaty signing;
- war declaration;
- peace acceptance;
- revolution continuation;
- campaign-terminal decisions;
- politically consequential battle decline; or
- another command marked `playerDecisionRequired: true`,

unless the player previously issued a scoped delegation command that explicitly permits that exact decision class.

## 9. Automation Policy State

Every enabled policy MUST have one `AutomationPolicyState` containing:

- policy identifier and version;
- owner participant;
- mode;
- enabled scope;
- excluded scope;
- monthly currency limit;
- monthly work or inventory limit where applicable;
- priority overrides;
- lock-respect behavior;
- last evaluation phase;
- last generated command identifiers;
- failure counters;
- retry month;
- source command; and
- state hash.

A missing limit is valid only when the policy explicitly declares `UNLIMITED` and the owning domain permits it.

## 10. Auditable Automation Commands

Every automation-generated command MUST contain:

- normal command identifier and payload;
- `issuerType: SYSTEM_AUTOMATION`;
- owner participant;
- automation policy identifier and version;
- triggering snapshot and hash;
- ordered candidate-set hash;
- selected candidate and score breakdown;
- lock-evaluation result;
- budget and resource-limit result;
- validation result;
- reservation and settlement references;
- idempotency key;
- explanation record identifier; and
- command hash.

The command MUST pass normal validation after generation and before execution.

A failed automation command MUST be logged as failed and MUST NOT be rewritten into a different command under the same identifier.

## 11. Automation Explanation

Every recommendation or generated command MUST produce one `AutomationExplanation` containing:

- policy and mode;
- trigger;
- legal candidates considered;
- excluded candidates and primary reasons;
- deterministic scores;
- selected action or no-action result;
- expected costs, work, time, capacity, inventory, and risks;
- visible expected effects;
- lock and limit results;
- underlying knowledge limitations; and
- explanation hash.

The explanation shown to the player MUST use visible knowledge only. Hidden authoritative values may be used only where the policy's domain contract legally permits them, and MUST remain redacted.

## 12. Repair Automation

`automation_repairs_v1` may create `AuthorizeRepairCommand` only when:

- the ship or infrastructure has a typed repair requirement;
- repair is technically and legally eligible;
- dock and repair capacity exist;
- payment can be reserved;
- no conflicting active project exists;
- the target is not automation-locked; and
- the repair does not contain a mandatory player-selected rebuild, conversion, design, or treaty choice.

The shipped priority is:

1. safety-critical flotation and fire;
2. propulsion and steering needed for survival;
3. mission-killed active ships;
4. mandated readiness or foreign-station assets;
5. ordinary operational repairs; and
6. cosmetic or non-operational repairs.

Equal-priority targets use severity descending, then ship identifier ascending.

## 13. Radar Installation Automation

`automation_radar_installation_v1` binds to `DESIGN-46` and may create `AutoInstallRadarCommand` only when compatible produced inventory, technology, design space, capacity, payment, and availability exist.

Its shipped ordering is:

1. active before non-active ships;
2. mandatory mission requirement;
3. true compiled displacement descending;
4. canonical class priority;
5. electronics deficiency descending;
6. ship identifier ascending.

The command MUST create the normal installation project and ship unavailability. Automation MUST NOT perform instant installation.

## 14. Officer-Assignment Automation

`automation_officer_assignment_v1` binds to `DESIGN-27` and uses `vacancy_fill_v1`.

It may create normal officer-assignment commands only for automation-eligible vacancies.

It MUST respect:

- rank and command eligibility;
- officer availability;
- one-command limit;
- player locks;
- government policy;
- legal knowledge;
- command conflicts; and
- deterministic vacancy and candidate ordering.

The player-facing explanation MUST use revealed officer suitability rather than hidden true ability.

## 15. Squadron Re-Equipment Automation

`automation_squadron_reequipment_v1` may create a `ReequipSquadronCommand` only when:

- an accepted compatible model exists;
- sufficient operational inventory exists;
- basing capacity passes;
- pilot and mechanic capacity pass;
- conversion payment and duration are accepted by policy;
- the squadron is not locked;
- no mandatory operation requires current availability; and
- the experience and readiness penalties are exposed.

The shipped minimum role-fit improvement required for automated re-equipment is exactly `1_000` utility points.

Automation MUST NOT consume damaged aircraft as operational replacements.

## 16. Ship-Naming Automation

`automation_ship_naming_v1` may create `AssignShipNameCommand` only when:

- the ship lacks a current valid commissioned name;
- a naming pool exists for nation, type, era, and policy;
- the name is not reserved or already used where uniqueness is required;
- the ship is not naming-locked; and
- the command affects presentation identity only.

Candidate names MUST be selected by ordered naming-pool ordinal and stable name identifier. The shipped policy consumes no randomness.

Automation MUST NOT rename an already validly named ship unless a separate explicit renaming policy is enabled.

## 17. Trade-Protection Automation

`automation_trade_protection_v1` binds to `DESIGN-33`.

It may create mission-assignment commands only when:

- global or regional protection is below the policy target;
- eligible ships exist;
- movement, fuel, support, readiness, mission, and range predicates pass;
- no higher-priority locked operation uses the ship;
- target regions and requirements are legally known; and
- asset locks permit reassignment.

The shipped target is exactly `10_000` basis points of global compliance, then the lowest regional coverage first.

The policy MUST NOT exceed `12_000` regional coverage merely to consume spare ships unless the player configures another explicit target.

## 18. Foreign-Station Automation

`automation_foreign_stations_v1` binds to `DESIGN-25`.

It may create deployment and mission commands only when:

- a non-suspended obligation will become noncompliant at the next snapshot;
- grace periods are considered exactly;
- an eligible active ship exists;
- contribution multipliers, range, support, access, fuel, and route pass;
- movement can complete before compliance resolution;
- the ship is not locked; and
- reassignment does not break a higher-priority mandatory obligation.

The shipped selection minimizes excess qualifying tonnage, then movement cost, then ship identifier.

## 19. Division-Replacement Automation

`automation_division_replacement_v1` binds to `DESIGN-26`.

It may create normal division membership, flagship, or acting-commander commands only when:

- a vacancy or invalid division state exists;
- candidate ships are co-located;
- type compatibility and size limits pass;
- permanent-division and movement locks permit change;
- experience and cohesion penalties are exposed; and
- all affected assets are unlocked.

It MUST NOT silently reorganize a valid division solely to optimize its score.

## 20. Scrapping Recommendations

`automation_scrapping_recommendations_v1` is `RECOMMEND_ONLY` in the shipped ruleset.

It MUST NOT issue `ScrapShipCommand` automatically.

A recommendation may be created when at least one predicate holds:

- treaty disposal is required;
- maintenance burden exceeds the configured value threshold;
- repair cost exceeds the configured replacement threshold;
- the ship is obsolete under an explicit force-plan policy;
- personnel or dockyard pressure exceeds configured limits; or
- the ship is irrecoverably mission killed or unrepaired under a domain assessment.

The recommendation MUST expose salvage, deadline, maintenance removal, treaty, personnel, project, confidence, and force-plan consequences.

The player must issue the scrapping command.

## 21. Research-Reallocation Automation

`automation_research_reallocation_v1` binds to `DESIGN-20`.

It may create field-priority commands only. It MUST NOT select an exact technology.

The policy may act when:

- a field has no eligible technology;
- a strategic objective changes declared research utility;
- a new field becomes eligible;
- the current priority configuration violates the player's limits; or
- a player-configured periodic review month occurs.

The shipped review interval is exactly `6` completed months.

The resulting priority configuration MUST retain at least one and at most five `HIGH` fields and use only `HIGH`, `MEDIUM`, or `LOW` weights.

## 22. Inventory-Replenishment Automation

`automation_inventory_replenishment_v1` may create production or purchase commands for explicitly supported inventory types, including:

- torpedoes;
- missiles;
- aircraft;
- radar sets;
- mines;
- ammunition;
- aircraft ordnance;
- repair components; and
- other registered inventory types.

For every type, the policy MUST define:

- target stock level;
- current usable stock;
- reserved stock;
- projected demand window;
- production or purchase lead time;
- storage capacity;
- expiry or refurbishment risk;
- monthly monetary and industrial limits; and
- deterministic supplier or production-line selection.

The shipped replenishment trigger is stock below `7_500` basis points of target. The target is replenished only to `10_000` basis points unless the player configures another explicit cap.

Automation MUST NOT create inventory without paid production or purchase.

## 23. Asset Automation Lock

An automation lock MUST be represented by one authoritative `AutomationLock` containing:

- `lockId`;
- owner participant;
- target scope;
- target asset, aggregate, policy, command family, or domain identifier;
- lock mode;
- effective and expiration phases;
- creation command;
- override permissions;
- reason text for presentation only; and
- lock hash.

`lockMode` MUST be exactly one of:

- `BLOCK_ALL_AUTOMATION`;
- `BLOCK_POLICY`;
- `BLOCK_COMMAND_FAMILY`;
- `RECOMMEND_ONLY`; or
- `PRESERVE_CURRENT_ASSIGNMENT`.

A lock affects automation only. It does not make an otherwise illegal player command legal.

## 24. Lockable Scopes

The shipped lockable scopes are:

- ship;
- squadron;
- officer;
- permanent division;
- project;
- research field;
- inventory type;
- possession obligation;
- regional mission assignment; and
- named automation policy.

A domain may prohibit locks where mandatory law, treaty, safety, insolvency, terminal survival, or scenario rules require action.

The UI MUST disable the lock control and expose the exact reason when locking is prohibited. It MUST NOT imply that a forbidden lock was created.

## 25. Lock Evaluation

Before generating a command, automation MUST evaluate locks in this order:

1. asset-specific `BLOCK_ALL_AUTOMATION`;
2. policy-specific block;
3. command-family block;
4. preserve-current-assignment;
5. recommend-only override;
6. domain or aggregate lock; and
7. global policy mode.

The most restrictive applicable lock wins.

Lock evaluation consumes no randomness and MUST be recorded in every explanation.

## 26. Mandatory Override

An automation lock MUST NOT block:

- legally mandatory treaty disposal;
- terminal survival or damage-control resolution;
- authoritative battle-result application;
- captured, sunk, or destroyed state transitions;
- mandatory insolvency allocation;
- save migration;
- invariant repair that does not issue a discretionary domain command; or
- another explicitly non-discretionary system effect.

When a mandatory action affects a locked asset, the system MUST preserve the lock record, execute the mandatory typed effect, and notify the player with `AUTOMATION_LOCK_OVERRIDDEN_BY_MANDATORY_RULE`.

## 27. Lock Commands

Locks MUST be created, changed, or removed only through:

- `CreateAutomationLockCommand`;
- `UpdateAutomationLockCommand`; or
- `RemoveAutomationLockCommand`.

Each command MUST validate ownership, scope, permission, target existence, conflicts, expiration, and mandatory-rule exclusions.

A UI-local checkbox state is not an authoritative lock.

## 28. Automation Evaluation Phase

Automation MUST run only during declared strategic phases before command lock.

The shipped evaluation order is:

1. mandatory repairs and safety recommendations;
2. treaty and compliance-driven recommendations;
3. foreign-station and trade-protection assignments;
4. officer and division vacancy handling;
5. squadron re-equipment;
6. radar installation;
7. inventory replenishment;
8. research reallocation;
9. ship naming;
10. scrapping recommendations; and
11. normal command conflict and reservation resolution.

Policies MUST use the same committed source snapshot. Commands generated earlier in the order create reservations visible to later policies.

## 29. Conflicts and Limits

When two automation policies propose conflicting commands:

- mandatory priority wins;
- otherwise the earlier Section 28 policy wins;
- then lower monetary commitment wins;
- then lower capacity commitment wins;
- then stable command identifier wins.

The losing proposal remains in the audit record with `AUTOMATION_COMMAND_CONFLICT` and is not executed.

Monthly policy costs MUST remain within configured limits. Partial execution is permitted only across independent complete commands, never by truncating one command payload illegally.

## 30. Failure and Retry

An automation command failure MUST use the command's normal failure result.

The shipped retry policy is:

- transient capacity or inventory shortage: retry next strategic month;
- insufficient funds: retry next month only when policy permits, otherwise disable until player review;
- lock conflict: no retry until lock changes;
- permanent ineligibility: no retry;
- stale snapshot or optimistic-version conflict: regenerate once against the current pre-lock snapshot;
- second conflict in the same evaluation: stop and record failure.

Automation MUST NOT loop indefinitely.

## 31. Player Review and Undo

Before command lock, the player MAY cancel or replace an automation-generated command when the command's cancellation policy permits it.

Cancellation MUST use a normal cancellation command and settle reservations explicitly.

After command lock or irreversible effect, the UI MUST NOT offer local undo. Correction requires a legal compensating command or loading an earlier save.

## 32. Automation UI

Every automation UI MUST expose:

- policy identifier and version;
- current mode;
- scope and exclusions;
- monthly limits;
- locks;
- latest evaluation time;
- generated and failed commands;
- explanations;
- reservations and projected effects;
- retry state; and
- deterministic ordering.

The UI MUST distinguish recommendations from executable commands and committed results.

## 33. Logs

Human-readable logs MUST be generated from structured domain events and automation records.

Logs MUST NOT be authoritative state and MUST NOT be parsed to reconstruct domain effects.

A log entry MUST preserve a reference to its source event or command and may localize display text without changing identifiers, values, or hashes.

## 34. Canonical Ordering and Hashing

Automation policies MUST be ordered by Section 28 and stable policy identifier.

Candidate assets MUST use each policy's declared deterministic ordering.

Locks MUST be ordered by restrictiveness, scope, and lock identifier.

Recommendations, explanations, and commands MUST be ordered by evaluation phase, policy, priority, target, and identifier.

Database insertion order, UI order, localized names, display filters, and wall-clock time MUST NOT affect automation outcomes.

## 35. Required Reason Codes

The subsystem MUST define at least:

- `AUTOMATION_POLICY_MISSING`;
- `AUTOMATION_MODE_INVALID`;
- `AUTOMATION_SCOPE_INVALID`;
- `AUTOMATION_LIMIT_MISSING`;
- `AUTOMATION_PLAYER_DECISION_REQUIRED`;
- `AUTOMATION_COMMAND_VALIDATION_FAILED`;
- `AUTOMATION_COMMAND_CONFLICT`;
- `AUTOMATION_MONTHLY_LIMIT_EXCEEDED`;
- `AUTOMATION_RETRY_STOPPED`;
- `AUTOMATION_EXPLANATION_MISSING`;
- `AUTOMATION_LOCK_CREATED`;
- `AUTOMATION_LOCK_CONFLICT`;
- `AUTOMATION_LOCK_PROHIBITED`;
- `AUTOMATION_LOCK_OVERRIDDEN_BY_MANDATORY_RULE`;
- `AUTOMATION_ASSET_LOCKED`;
- `AUTOMATION_RECOMMENDATION_CREATED`;
- `AUTOMATION_STALE_PROJECTION`;
- `UI_HIDDEN_INFORMATION_EXPOSED`;
- `UI_PROJECTION_HASH_MISMATCH`; and
- `UI_AUTOMATION_INVARIANT_FAILED`.

## 36. Validation and Acceptance

Automated validation MUST prove that:

1. every player-facing interface consumes read-only projections and issues commands rather than mutating aggregates;
2. every uncertain value exposes observation date, confidence, source, range, and staleness;
3. hidden values do not leak through UI controls, sorting, totals, logs, or accessibility metadata;
4. each of the eleven shipped automation domains has a complete named policy definition;
5. there is no generic catch-all automation fallback;
6. every policy uses exactly one declared mode;
7. recommendations never issue commands;
8. auto-execution stops at mandatory player-decision boundaries without an explicit scoped delegation;
9. every policy state contains scope, exclusions, limits, overrides, evaluations, commands, failures, and source state;
10. every automated action creates a normal application command with `SYSTEM_AUTOMATION`, provenance, candidate hash, explanation, validation, reservation, idempotency, and command hash;
11. automation never mutates repositories or domain state directly;
12. failed commands remain failed and are not rewritten under the same identifier;
13. every recommendation and command has a visible-knowledge-safe explanation;
14. repair automation uses exact safety, project, capacity, cost, lock, and decision predicates;
15. radar automation uses the exact `DESIGN-46` ordering and creates normal unavailability;
16. officer automation uses deterministic vacancy filling and never exposes hidden true ability;
17. squadron re-equipment requires at least 1,000 role-fit improvement and exact inventory, basing, personnel, availability, and penalty predicates;
18. ship naming uses deterministic naming-pool order and does not rename valid ships by default;
19. trade-protection automation targets exactly 10,000 global compliance and does not exceed 12,000 regional coverage by default;
20. foreign-station automation honors exact obligations, suspension, grace, contribution, route, and priority rules;
21. division replacement uses normal commands and never optimizes a valid division silently;
22. scrapping automation is recommendation-only and never issues a scrap command;
23. research automation changes only field priorities, never exact technologies, and reviews every six months under the shipped policy;
24. inventory replenishment starts below 7,500 basis points and targets 10,000 while respecting production, purchase, capacity, expiry, and limits;
25. locks are authoritative records created only through lock commands;
26. every lock has exact scope, mode, dates, permissions, and hash;
27. the most restrictive applicable lock wins deterministically;
28. prohibited locks expose their exact reason and are not created;
29. mandatory non-discretionary rules override locks with an explicit notification and preserve the lock record;
30. automation evaluates in the exact declared domain order against one committed snapshot;
31. later policies see earlier command reservations;
32. conflicts use exact mandatory, policy-order, cost, capacity, and identifier precedence;
33. partial execution occurs only across independent valid commands;
34. retry behavior is bounded and stale-state regeneration occurs at most once;
35. player cancellation before lock uses normal settlement and no local undo exists after irreversible commitment;
36. automation UI distinguishes recommendations, commands, reservations, and committed results;
37. logs derive from structured records and remain non-authoritative; and
38. identical state, policy configuration, locks, knowledge, content, and ruleset produce identical recommendations, commands, explanations, reservations, failures, records, and hashes.
