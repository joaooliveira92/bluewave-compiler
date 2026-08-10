# DESIGN-11: Command Model

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-11`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Every state-changing participant action MUST use a versioned command or typed resolution contract. Runtime inference and command-specific fallback behavior are prohibited.

## 1. Scope

This contract governs commands issued by:

- the player;
- AI participants;
- system automation; and
- deterministic administrative policies.

A command represents a request to perform a domain action. A command MUST NOT mutate authoritative state directly. State changes occur only when a versioned command handler resolves an accepted command through an aggregate transaction.

Typed scheduled events and mandatory phase resolutions are not commands unless they act on behalf of a participant. Automated participant actions MUST use commands.

## 2. Issuer Classes

Every command MUST declare exactly one `issuerClass`:

- `PLAYER`;
- `AI`; or
- `SYSTEM_AUTOMATION`.

Every command type MUST declare a non-empty `allowedIssuerClasses` set.

If the player and AI can request the same semantic action, both MUST use the same:

- command type identifier;
- payload schema;
- precondition schema;
- authorization rules;
- validation rules;
- reservation rules;
- lock phase;
- irreversible phase;
- resolution phase;
- cancellation policy;
- settlement policy;
- result schema; and
- reason-code namespace.

Presentation-specific request objects MAY differ, but they MUST compile into the same canonical domain command before validation.

An issuer-specific command is permitted only when its `CommandTypeDefinition` declares:

- `issuerRestrictionReasonCode`;
- the canonical design contract authorizing the restriction;
- an explicit issuer eligibility predicate; and
- acceptance tests proving that the restriction does not bypass domain legality.

AI and system automation MUST NOT bypass fog of war, authorization, validation, reservation, treaty, capacity, budget, asset-lock, command-lock, or aggregate-invariant rules.

Violation MUST fail with `COMMAND_ISSUER_PARITY_VIOLATION`.

## 3. Command Type Definition

Every command type MUST have one immutable, versioned `CommandTypeDefinition` containing:

- `commandTypeId`;
- `commandSchemaVersion`;
- `allowedIssuerClasses`;
- `targetAggregateType`;
- `submissionPhaseId`;
- `authorizationPolicyId`;
- `validationPolicyId`;
- `reservationPolicyId`;
- `lockPhaseId`;
- `irreversiblePhaseId`;
- `resolutionPhaseId`;
- `cancellationPolicyId`;
- `settlementPolicyId`;
- `resultSchemaId`;
- `reasonCodeNamespace`;
- `idempotencyScope`;
- `owningDesignContractId`;
- `handlerImplementationId`;
- `handlerVersion`;
- `testVectorIds`; and
- `contentHash`.

`lockPhaseId` and `irreversiblePhaseId` MUST identify exact authoritative phase boundaries. Terms such as `before processing`, `once started`, or `when committed` are prohibited unless mapped to those fields.

A missing or invalid definition MUST fail startup validation with `INVALID_COMMAND_TYPE_DEFINITION`.

## 4. Command Record

Every submitted command MUST create one append-only `CommandRecord` containing:

- `commandId`;
- `commandTypeId`;
- `commandSchemaVersion`;
- `campaignId`;
- `campaignMonth`;
- `issuerClass`;
- `issuerParticipantId`;
- `targetAggregateType`;
- `targetAggregateId`;
- `submissionPhaseId`;
- `submissionOrdinal`;
- `idempotencyKey`;
- canonical payload;
- declared preconditions;
- `status`;
- authorization record or `NONE`;
- validation record or `NONE`;
- reservation record identifiers;
- cancellation request identifier or `NONE`;
- resolution record or `NONE`;
- settlement record or `NONE`;
- result record or `NONE`;
- `createdFromSnapshotHash`;
- `lastTransitionAtPhaseId`;
- `causalRecordId`; and
- command hash.

`commandId` MUST be unique within the campaign. `idempotencyKey` MUST be unique within the command type's declared idempotency scope.

A duplicate idempotency key MUST return the existing command result and MUST NOT submit or resolve a second command.

## 5. Command Lifecycle

The only command statuses are:

- `SUBMITTED`;
- `VALIDATED`;
- `AUTHORIZED`;
- `RESERVED`;
- `ACCEPTED`;
- `LOCKED`;
- `RESOLVING`;
- `COMPLETED`;
- `PARTIALLY_COMPLETED`;
- `REJECTED`;
- `CANCELLED`; and
- `SUPERSEDED`.

The permitted transitions are:

- `SUBMITTED -> VALIDATED`;
- `SUBMITTED -> REJECTED`;
- `SUBMITTED -> CANCELLED`;
- `VALIDATED -> AUTHORIZED`;
- `VALIDATED -> REJECTED`;
- `VALIDATED -> CANCELLED`;
- `AUTHORIZED -> RESERVED`;
- `AUTHORIZED -> ACCEPTED` when the reservation policy is `NONE`;
- `AUTHORIZED -> REJECTED`;
- `AUTHORIZED -> CANCELLED`;
- `RESERVED -> ACCEPTED`;
- `RESERVED -> REJECTED`;
- `RESERVED -> CANCELLED`;
- `ACCEPTED -> LOCKED`;
- `ACCEPTED -> CANCELLED`;
- `ACCEPTED -> SUPERSEDED`;
- `LOCKED -> RESOLVING`;
- `LOCKED -> SUPERSEDED` only when the command definition explicitly permits locked supersession before its irreversible phase;
- `RESOLVING -> COMPLETED`;
- `RESOLVING -> PARTIALLY_COMPLETED`;
- `RESOLVING -> REJECTED` only when no authoritative effect has been applied;
- `RESOLVING -> CANCELLED` only when cancellation was accepted before the irreversible phase and the handler has applied no prohibited effect; and
- `RESOLVING -> SUPERSEDED` only through an explicit resolution policy.

`COMPLETED`, `PARTIALLY_COMPLETED`, `REJECTED`, `CANCELLED`, and `SUPERSEDED` are terminal statuses.

Every transition MUST produce a `CommandStatusTransitionRecord`. Invalid transitions MUST fail with `INVALID_COMMAND_STATUS_TRANSITION`.

## 6. Submission and Canonicalization

A command MUST be submitted only during its declared submission phase.

Before validation, the command gateway MUST:

1. validate the payload schema;
2. convert presentation units into canonical units;
3. normalize unordered sets into ascending stable-identifier order;
4. reject unknown fields unless the schema explicitly permits versioned extensions;
5. calculate the canonical payload hash; and
6. assign the command's deterministic submission ordinal.

Commands in one phase MUST be canonically ordered by:

1. ascending submission phase ordinal;
2. ascending issuer participant identifier;
3. ascending submission ordinal; and
4. ascending command identifier.

Localized strings, database insertion order, UI component order, and wall-clock timestamps MUST NOT determine authoritative command order.

## 7. Validation

Validation MUST be pure and MUST NOT mutate authoritative state, reserve resources, consume authoritative RNG, or advance command execution.

Validation MUST read the snapshot declared by the strategic or tactical phase contract.

A `CommandValidationRecord` MUST contain:

- command identifier;
- validation policy identifier and version;
- input snapshot hash;
- ordered predicate results;
- canonical payload hash;
- validation result;
- primary reason code;
- ordered diagnostic reason codes; and
- validation record hash.

When multiple validation predicates fail, the primary reason MUST be selected by the command type's explicit `validationFailurePriority`. Equal priority MUST resolve by ascending reason code.

A failed validation MUST transition the command to `REJECTED` and reserve nothing.

Revalidation MUST occur at resolution when the command definition identifies volatile preconditions.

## 8. Authorization

Authorization MUST occur after structural and domain validation and before reservation.

Authorization MUST verify:

- issuer class and participant identity;
- ownership or delegated control;
- political authorization;
- command reach when applicable;
- automation locks;
- role and realism-mode permissions; and
- any domain-specific authority predicate.

Authorization denial MUST reject the command with a machine-readable reason code and MUST NOT reserve resources.

## 9. Reservation

A command requiring exclusive assets, treasury, capacity, inventory, personnel, or another scarce resource MUST reserve them before acceptance.

Each `CommandReservationRecord` MUST contain:

- `reservationId`;
- `commandId`;
- `resourceTypeId`;
- `resourceId` or account identifier;
- exact reserved integer quantity;
- canonical unit;
- reservation start phase;
- reservation release condition;
- reservation consumption policy;
- reservation priority; and
- reservation hash.

Reservation MUST be atomic across all required resources. If any required reservation fails, no reservation for the command may remain.

Competing reservations MUST resolve in canonical command order unless the owning domain declares another deterministic priority policy.

Reserved resources MUST remain authoritative and visible to later command validation. A resource MUST NOT be double-reserved beyond its available quantity.

Failure MUST use `RESERVATION_FAILED` plus a domain-specific reason such as `INSUFFICIENT_FUNDS` or `INSUFFICIENT_CAPACITY`.

## 10. Acceptance and Lock

A command becomes `ACCEPTED` only after validation, authorization, and all required reservations succeed.

At the command type's exact `lockPhaseId`:

- every accepted command transitions to `LOCKED`;
- payload and preconditions become immutable;
- new cancellation requests are evaluated under Section 13;
- canonical resolution order is fixed; and
- the command is included in the command-lock snapshot hash.

A command submitted after its submission window MUST be rejected with `COMMAND_WINDOW_CLOSED`.

Mutation of a locked command MUST fail with `LOCKED_COMMAND_IMMUTABLE`.

## 11. Resolution and State Mutation

A command MUST NOT hold a mutable reference to an authoritative aggregate.

The command handler MUST receive:

- the immutable command record;
- the declared authoritative input snapshot;
- a versioned domain service interface;
- a transaction-scoped aggregate working copy;
- declared RNG access when permitted; and
- the command type definition.

Resolution MUST execute in one aggregate transaction or a declared multi-aggregate transaction coordinator.

The handler MUST:

1. transition the command to `RESOLVING`;
2. revalidate volatile preconditions;
3. calculate the proposed state transition;
4. validate aggregate and cross-aggregate invariants;
5. calculate settlement and reservation consumption;
6. commit all permitted changes atomically;
7. emit domain events, ledger postings, random-decision records, and a causal record; and
8. produce one explicit command result.

The command object itself MUST NOT call aggregate mutation methods outside the transaction coordinator.

Direct mutation by a command DTO, UI handler, AI planner, preload bridge, renderer, or IPC handler MUST fail architecture validation with `DIRECT_COMMAND_STATE_MUTATION_PROHIBITED`.

## 12. Resolution-Time Impossibility

A locked command that was valid when accepted MAY become impossible before or during resolution only because a declared volatile precondition changed.

Every volatile precondition MUST declare:

- a stable predicate identifier;
- the phase at which it is rechecked;
- the failure reason code;
- whether partial completion remains legal;
- the settlement policy branch; and
- required player-facing explanation fields.

When a command becomes impossible, the handler MUST produce a `CommandImpossibilityOutcome` containing:

- `commandId`;
- failed predicate identifiers;
- primary and diagnostic reason codes;
- input snapshot hash;
- effects already applied;
- reserved-resource disposition;
- refund and lost-cost calculation;
- resulting terminal status; and
- explanation trace.

If no authoritative effect has been applied, the terminal status MUST be `REJECTED`.

If declared divisible effects were applied and the command permits partial completion, the status MUST be `PARTIALLY_COMPLETED`.

If the command does not permit partial completion, all transaction effects MUST roll back and the command MUST be `REJECTED`.

A command MUST NOT remain `LOCKED` or `RESOLVING` after its resolution phase closes.

The implementation MUST NOT silently drop, retry, reinterpret, or convert an impossible command into another command.

## 13. Cancellation

Cancellation MUST use a `CancelCommandCommand` with its own stable identifier, issuer, authorization, validation, result, and audit records.

Every command type MUST declare exactly one cancellation policy:

- `NOT_CANCELLABLE`;
- `UNTIL_LOCK`;
- `UNTIL_IRREVERSIBLE_PHASE`; or
- `CUSTOM_EXPLICIT`.

The shipped default is `UNTIL_LOCK`. A command type MUST explicitly select another policy to override it.

Cancellation is accepted only when:

- the requesting participant is authorized;
- the target command is not terminal;
- the request arrives before the exact boundary permitted by the policy;
- no prohibited irreversible effect has occurred; and
- no superseding command already owns the target resources.

For `UNTIL_LOCK`, cancellation is permitted only while the target status is `SUBMITTED`, `VALIDATED`, `AUTHORIZED`, `RESERVED`, or `ACCEPTED`.

For `UNTIL_IRREVERSIBLE_PHASE`, cancellation MAY also be accepted while `LOCKED` or `RESOLVING`, but only before the command's declared `irreversiblePhaseId` and only through the handler's explicit cancellation branch.

Cancellation after the permitted boundary MUST be rejected with `CANCELLATION_WINDOW_CLOSED` and MUST NOT alter the target command.

An accepted cancellation MUST:

- transition the target command to `CANCELLED`;
- apply the declared settlement policy;
- release or consume every reservation explicitly;
- emit a command result and causal record; and
- leave no orphan reservation.

## 14. Irreversible Phase

Every command type MUST declare one exact `irreversiblePhaseId`.

A command reaches irreversibility when the phase cursor enters that phase or when the handler commits a declared irreversible effect marker, whichever the command definition names.

Permitted irreversible effect markers include:

- external contract commitment;
- consumed construction work;
- delivered inventory;
- completed movement edge;
- revealed diplomatic action;
- fired weapon or expended ordnance;
- applied battle damage;
- transferred ownership; or
- committed balanced ledger posting that the owning contract marks non-reversible.

The command definition MUST list every marker relevant to that command. An undeclared marker MUST NOT close cancellation.

## 15. Settlement, Refunds, and Lost Costs

Every command type MUST reference one complete `CommandSettlementPolicy`.

The policy MUST contain branches for:

- validation rejection;
- authorization rejection;
- reservation failure;
- pre-lock cancellation;
- post-lock pre-irreversible cancellation when permitted;
- resolution-time impossibility before effects;
- partial completion;
- completion;
- supersession; and
- internal resolution failure.

Each branch MUST define, for every reserved resource:

- `refundBasisPoints` within `0..10_000`;
- fixed non-refundable integer amount;
- consumed amount formula identifier;
- released amount formula identifier;
- recipient account or resource pool;
- ledger posting category;
- rounding mode; and
- explanation reason code.

The canonical settlement equation is:

`releasedAmount = floor(max(0, reservedAmount - consumedAmount - fixedNonRefundableAmount) * refundBasisPoints / 10_000)`

`lostAmount = reservedAmount - consumedAmount - releasedAmount`

All values MUST use canonical integer units. `consumedAmount`, `releasedAmount`, and `lostAmount` MUST be non-negative and MUST sum exactly to `reservedAmount`.

The shipped defaults are:

- validation rejection: `refundBasisPoints = 10_000` and no consumed or lost amount;
- authorization rejection: `10_000` and no consumed or lost amount;
- reservation failure: all successfully staged reservations roll back in full;
- pre-lock cancellation: `10_000` unless the command type declares a concrete non-refundable setup cost;
- internal resolution failure before commit: `10_000`;
- completion: refund only the exact unused reservation remainder; and
- all other branches: no default is permitted and the command type MUST provide explicit values.

A missing settlement branch or unbalanced settlement MUST fail content validation with `INCOMPLETE_COMMAND_SETTLEMENT_POLICY`.

Financial refunds and losses MUST use balanced ledger postings. Silent resource deletion or creation is prohibited.

## 16. Partial Completion

A command MAY end as `PARTIALLY_COMPLETED` only when its definition declares `partialCompletionAllowed: true` and identifies divisible effect units.

The result MUST contain:

- requested quantity;
- completed quantity;
- uncompleted quantity;
- canonical unit;
- applied effect records;
- unapplied effect reason codes;
- consumed reservations;
- released reservations;
- lost costs; and
- final aggregate hashes.

Completed plus uncompleted quantity MUST equal requested quantity exactly.

Indivisible commands MUST roll back completely when full completion is impossible.

## 17. Supersession

Supersession requires a new accepted command whose type explicitly declares that it may supersede the prior command type.

A supersession policy MUST define:

- target eligibility predicate;
- allowed target statuses;
- reservation transfer behavior;
- settlement behavior;
- command ordering;
- lock-boundary behavior; and
- audit linkage.

The prior command MUST transition to `SUPERSEDED`. It MUST reference the superseding command. The new command MUST reference the superseded command.

Silent replacement of one command by another is prohibited.

## 18. Automated Actions

Every state-changing automated participant action MUST submit a normal command with `issuerClass: SYSTEM_AUTOMATION`.

Automation includes:

- officer assignment;
- repairs;
- equipment installation;
- squadron re-equipment;
- ship naming when names are authoritative;
- trade-protection allocation;
- foreign-station allocation;
- division replacement;
- inventory replenishment;
- research reallocation; and
- any other policy that changes authoritative participant state.

Automated commands MUST use the same schema, validation, authorization, reservation, lock, resolution, settlement, result, and reason codes as an equivalent player or AI command.

Automation MUST respect asset automation locks. A locked asset MUST reject an automated command with `ASSET_LOCKED_AGAINST_AUTOMATION`.

Non-authoritative recommendations MUST NOT submit commands, reserve resources, consume authoritative RNG, or mutate state.

## 19. Command Results

Every terminal command MUST produce one immutable `CommandResult` containing:

- `commandId`;
- terminal status;
- primary reason code;
- ordered diagnostic reason codes;
- applied effect record identifiers;
- reservation settlement identifiers;
- refund amount by resource;
- consumed amount by resource;
- lost amount by resource;
- domain event identifiers;
- random-decision record identifiers;
- pre-resolution state hash;
- post-resolution state hash or unchanged input hash;
- explanation trace; and
- result hash.

A successful result MUST use `COMMAND_COMPLETED` or a domain-specific success code.

Every non-successful result MUST use a machine-readable reason code. Human-readable text MUST be generated from reason codes and structured parameters and MUST NOT determine mechanics.

## 20. Required Core Reason Codes

The command subsystem MUST define at least:

- `COMMAND_COMPLETED`;
- `COMMAND_PARTIALLY_COMPLETED`;
- `COMMAND_CANCELLED`;
- `COMMAND_SUPERSEDED`;
- `COMMAND_WINDOW_CLOSED`;
- `INVALID_COMMAND_PAYLOAD`;
- `INVALID_COMMAND_STATUS_TRANSITION`;
- `COMMAND_ISSUER_NOT_ALLOWED`;
- `COMMAND_ISSUER_PARITY_VIOLATION`;
- `POLITICAL_AUTHORIZATION_DENIED`;
- `INSUFFICIENT_FUNDS`;
- `INSUFFICIENT_CAPACITY`;
- `INSUFFICIENT_INVENTORY`;
- `TECHNOLOGY_UNAVAILABLE`;
- `TREATY_PROHIBITED`;
- `INVALID_ROUTE`;
- `CANAL_ACCESS_DENIED`;
- `SHIP_NOT_OPERATIONAL`;
- `TARGET_NO_LONGER_VALID`;
- `PROJECT_ALREADY_COMPLETED`;
- `DIVISION_LOCATION_CONFLICT`;
- `ASSET_LOCKED_AGAINST_AUTOMATION`;
- `RESERVATION_FAILED`;
- `CANCELLATION_NOT_ALLOWED`;
- `CANCELLATION_WINDOW_CLOSED`;
- `IRREVERSIBLE_EFFECT_ALREADY_APPLIED`;
- `VOLATILE_PRECONDITION_FAILED`;
- `DIRECT_COMMAND_STATE_MUTATION_PROHIBITED`;
- `INCOMPLETE_COMMAND_SETTLEMENT_POLICY`; and
- `COMMAND_RESOLUTION_INTERNAL_FAILURE`.

Domain contracts MAY add reason codes but MUST NOT redefine the meaning of these codes.

## 21. Audit and Causality

Every command submission, status transition, validation, authorization, reservation, cancellation, resolution, settlement, and result MUST be recorded in append-only audit records.

The command audit chain MUST include:

- previous audit record hash;
- current record hash;
- campaign and command identifiers;
- phase identifier;
- actor identifier;
- input and output hashes;
- policy and handler versions; and
- reason codes.

Every applied authoritative effect MUST reference the resolving command and its causal record.

Rejected commands MUST remain auditable but MUST NOT appear as applied state causes.

Command and audit records MUST be included in the command/event ledger hash.

## 22. Failure Atomicity

An unexpected handler failure MUST:

- roll back all uncommitted aggregate changes;
- roll back or settle staged ledger postings according to the internal-failure branch;
- retain the immutable command and failure audit records;
- release reservations according to the explicit settlement policy;
- produce `COMMAND_RESOLUTION_INTERNAL_FAILURE`; and
- leave authoritative state at the last committed transaction boundary.

The implementation MUST NOT retry automatically unless the command definition declares an idempotent retry policy with a fixed maximum attempt count and deterministic retry phase. The shipped default maximum retry count is `0`.

## 23. Persistence and Replay

Command definitions, handler versions, policy versions, command records, reservations, results, and audit positions required by a save MUST be pinned or content-addressed.

Replay MUST apply commands in canonical order and require identical:

- status transitions;
- validation and authorization outcomes;
- reservations;
- random decisions;
- settlements;
- domain events;
- command results; and
- authoritative hashes.

A mismatch MUST fail with `COMMAND_REPLAY_MISMATCH`.

## 24. Validation and Acceptance

Automated validation MUST prove that:

1. equivalent player and AI actions use the same command definition;
2. issuer-specific commands have explicit predicates, reasons, and design authorization;
3. command DTOs, UI, IPC, AI planners, and automation cannot mutate authoritative state directly;
4. every command follows a permitted lifecycle transition;
5. validation is pure and consumes no authoritative RNG;
6. reservation is atomic and prevents double allocation;
7. accepted commands lock at the exact declared phase;
8. locked commands are immutable;
9. volatile preconditions are explicitly revalidated;
10. resolution-time impossibility always produces a terminal result and settlement;
11. cancellation uses a command and exact phase boundaries;
12. cancellation after lock fails under the shipped default policy;
13. commands permitting later cancellation declare an irreversible phase and effect markers;
14. every settlement branch defines refunds, consumption, losses, rounding, and ledger treatment;
15. settlement values sum exactly to the reserved amount;
16. partial completion occurs only for declared divisible effects;
17. automated state changes use normal command contracts and audit records;
18. automation respects asset locks and legal knowledge;
19. non-authoritative recommendations issue no commands and reserve no resources;
20. every terminal command has one immutable result with a reason code;
21. every applied state change references a command causal record;
22. unexpected failures roll back to the prior transaction boundary;
23. the shipped retry count is zero;
24. duplicate idempotency keys cannot duplicate effects; and
25. identical snapshots, commands, policies, handlers, and seeds reproduce identical results and hashes.
