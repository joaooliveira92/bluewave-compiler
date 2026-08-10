# DESIGN-01: Game Vision

**Canonical status:** Normative design specification  
**Stable document ID:** `DESIGN-01`  
**Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Descriptive wording does not create mechanics beyond the explicit contracts in this document.

## 1. Product Definition

Bluewave is an offline, deterministic, single-player naval strategy and tactical combat simulation covering the period from 1880 through December 1970.

A campaign:

- advances in one-month strategic turns;
- MAY span multiple technological eras supported by its selected start scenario;
- continues until an explicit terminal condition is reached;
- MUST support deterministic auto-resolution for every tactical engagement required for campaign continuity; and
- MUST NOT require the player to fight a tactical battle to continue the campaign.

The term `long-form` means that the campaign model supports at least 120 strategic turns after any supported start date, except when an explicit terminal condition ends the campaign earlier. It does not specify real-world playtime.

## 2. Player Role

The player represents the continuing senior leadership of the selected nation's naval institution. The player does not represent one immortal or fixed historical individual.

Individual officers are separate simulated entities. Retirement, promotion, death, dismissal, or replacement of an individual officer does not by itself change the player's institutional identity.

For this document, a `major power` is a canonical playable slot that is explicitly marked `active` or enabled by the selected named continuity mode in the selected scenario. Historical reputation, fleet size, economic size, or descriptive text MUST NOT be used to infer playability.

Player identity, succession, and campaign-continuity behavior MUST conform to `DESIGN-02`.

## 3. Campaign Scope

The authoritative campaign model MUST include the following system domains:

- naval policy;
- fleet design;
- procurement;
- research and technology adoption;
- deployment and logistics;
- diplomacy;
- war and peace;
- institutional confidence and naval politics;
- tactical command; and
- final career evaluation.

A system domain MAY be inactive when the selected date, scenario, technology state, or explicit ruleset condition makes it inapplicable. Inactivity MUST be explained by a machine-readable eligibility result or reason code. An implementing agent MUST NOT invent substitute behavior for an unavailable system.

Delivery order and scenario-support claims MUST conform to `DESIGN-55`. A scenario MUST NOT be declared fully supported until every system required by that scenario's expected era passes its acceptance gates.

## 4. Authority Boundary

The player controls the naval institution only through validated commands and explicit decision contracts.

The player MAY influence national policy through mechanisms explicitly defined by canonical design contracts, including:

- political-capital expenditure;
- responses to political mandates;
- diplomatic event choices;
- treaty and peace recommendations or decisions assigned to the naval administration;
- strategic-objective prioritization where explicitly permitted; and
- naval budget, procurement, deployment, and readiness commands within granted authority.

The player MUST NOT directly mutate:

- government type;
- national economic resources;
- diplomatic relations;
- war membership;
- legal territorial ownership;
- military control of territory;
- political mandates;
- institutional confidence; or
- strategic objectives.

Changes to those states MUST result from validated commands, typed events, scheduled transitions, or explicit resolution rules. Player and AI actions MUST use the command model defined by `DESIGN-11` wherever a command contract exists.

## 5. Player Fantasy

The supported player experience consists of:

- shaping a nation's navy across supported technological eras;
- designing ships and force structures under economic, industrial, political, treaty, logistical, and technological constraints;
- preparing for wars whose timing and diplomatic context are not under direct player control;
- commanding or auto-resolving selected tactical engagements; and
- preserving institutional confidence while producing a capable legacy fleet.

A `capable legacy fleet` is not a separate score or hidden condition. Its contribution is calculated only through the versioned final-career-evaluation contract defined by `DESIGN-56`.

## 6. Core Design Principles

### 6.1 Decision Causality and Consequence Trace

Every authoritative state change MUST produce or reference a `CausalRecord` with these required fields:

- `causalRecordId`;
- `campaignId`;
- `phaseId`;
- `effectiveAt`;
- `causeType`;
- `causeId`;
- `actorId` or the literal `SYSTEM`;
- `targetAggregateIds`;
- `inputStateHash`;
- `rulesetId` and `rulesetVersion`;
- `formulaId` and `formulaVersion`, when a formula is used;
- `randomDecisionRecordIds`, using an empty list when no randomness is used;
- `postStateHash`;
- `reasonCode`; and
- `visibilityClass`.

`causeType` MUST be one of:

- `COMMAND`;
- `TYPED_EVENT`;
- `SCHEDULED_RULE`;
- `DERIVED_RESOLUTION`;
- `RANDOM_DECISION`;
- `MIGRATION`; or
- `REPAIR`.

Every changed authoritative field MUST be attributable to exactly one applied causal record at the mutation boundary. A single causal record MAY change multiple fields atomically. If several causes contribute to one resolution, the applied record MUST identify the immediate cause and contain ordered references to all contributing records.

Causal records MUST be append-only after the containing stable snapshot is committed. They MUST be included in command/event ledger hashing.

For information the player is legally permitted to know, the UI MUST expose an explanation containing:

- the affected value or state;
- the immediate cause;
- all non-hidden modifiers;
- the formula identifier and version;
- the unrounded result;
- the rounding mode;
- the final applied result; and
- links to preceding visible causes.

Hidden or uncertain information MUST be replaced by a fog-of-war-safe explanation. Redaction MUST NOT alter authoritative records.

A mutation without a valid causal record MUST fail validation with `UNTRACEABLE_STATE_MUTATION`.

### 6.2 Historical Asymmetry and Relative Evaluation

Scenario nations MAY begin with unequal economic, industrial, geographic, technological, political, and naval conditions. The compiler MUST preserve canonical scenario asymmetry and MUST NOT normalize starting state solely to equalize player difficulty.

Campaign evaluation MUST use an immutable `EvaluationBaselineSnapshot` produced at successful campaign compilation. The snapshot MUST include every normalized input required by `DESIGN-56`, the selected scenario, playable slot, continuity mode, difficulty profile, content hash, and ruleset hash.

Each evaluation dimension MUST declare in the active ruleset:

- `dimensionId`;
- `weightBasisPoints`;
- `normalizationMode`;
- `lowerBound`;
- `upperBound`;
- `roundingMode`;
- `inapplicableBehavior`; and
- `explanationFormulaId`.

The sum of applicable `weightBasisPoints` MUST equal exactly `10_000`. If a dimension is inapplicable and its behavior is `REDISTRIBUTE_PROPORTIONALLY`, redistribution MUST use largest-remainder allocation, with ties resolved by ascending `dimensionId`. If its behavior is `ZERO_CONTRIBUTION`, its weight remains allocated and contributes zero. No other inapplicable behavior is permitted.

Missing baseline inputs, invalid bounds, or a final applicable weight sum other than `10_000` MUST fail evaluation with `INVALID_EVALUATION_CONTRACT`. Runtime inference or equal-weight fallback is prohibited.

### 6.3 Determinism, Seeds, and Random Decisions

Authoritative randomness MUST use named, domain-separated streams. A single global consumptive random stream is prohibited.

Every authoritative random decision MUST be derived from this canonical key tuple, encoded in the listed order:

1. `rngAlgorithmVersion`;
2. `campaignSeed`;
3. `streamFamily`;
4. `scopeStableId`;
5. `campaignMonth` or `battleMinute`;
6. `phaseId`;
7. `decisionTypeId`; and
8. `decisionOrdinal`.

The tuple MUST be serialized using the canonical binary encoding defined by the determinism contract. String concatenation without length-prefix encoding is prohibited.

`decisionOrdinal` MUST start at zero for each unique tuple prefix through `decisionTypeId` and advance only for authoritative decisions of that type. UI navigation, logging, rendering, previews, reports, cancelled pre-lock commands, and validation failures MUST NOT advance an authoritative ordinal.

Every random outcome MUST emit a `RandomDecisionRecord` containing the complete key tuple, input-state hash, sampled integer, mapping formula, result, and reason code.

Given identical content hashes, ruleset versions, initial authoritative state, commands, decisions, and seeds, the simulation MUST produce byte-identical canonical snapshots and identical authoritative hashes on every supported operating system.

Any unsupported RNG algorithm version, absent stream family, duplicate random-decision key, or ordinal gap MUST fail with `INVALID_RNG_CONTRACT`.

### 6.4 Player and AI Command Parity

Every state-changing player or AI action MUST use a versioned command contract. Command parity is mandatory when both actor classes can request the same domain action.

Each command type MUST declare `allowedIssuers` as a non-empty set containing one or more of:

- `PLAYER`;
- `AI`; or
- `SYSTEM_AUTOMATION`.

If both player and AI can perform the same semantic action, they MUST use the same command schema, validation rules, reservation rules, lock phase, resolution phase, result schema, and reason-code set. Separate schemas for presentation convenience are prohibited.

An issuer-specific command is permitted only when its command definition contains:

- a stable `issuerRestrictionReasonCode`;
- the owning design-contract reference;
- an explicit eligibility predicate; and
- acceptance tests proving that the restriction does not bypass domain legality.

AI policy MAY choose different commands from those chosen by a player, but AI MUST NOT bypass validation, resource reservation, fog of war, treaty rules, capacity rules, or command locking.

A state-changing action without a command contract or typed resolution contract MUST fail with `UNCONTRACTED_ACTION`.

### 6.5 Knowledge and Fog of War

Every player-facing or AI-facing assertion about non-owned or hidden state MUST originate from a `KnowledgeAssertion`, an explicit public fact, or a declared difficulty-assistance grant.

A `KnowledgeAssertion` MUST contain:

- subject and attribute stable identifiers;
- estimated value or closed estimate interval;
- confidence in integer basis points from `0` through `10_000` inclusive;
- source type and source identifier;
- observed time;
- received time;
- expiration time or the literal `NONE`;
- deception status; and
- visibility owner.

No projection, tooltip, report, sorting key, filter count, warning, AI score, or automation policy may read hidden authoritative truth unless its contract explicitly lists that field as permitted information assistance.

When a value is uncertain, the UI MUST display the estimate interval, confidence, observation date, and source. It MUST NOT display the hidden exact value through rounding, totals, ordering, color, animation, or availability state.

AI planning MUST consume the AI participant's own knowledge projection. Unauthorized access to authoritative truth MUST fail test instrumentation with `FOG_OF_WAR_VIOLATION`.

### 6.6 Canonical Content, State, and Projections

Every persisted field MUST be classified in schema metadata as exactly one of:

- `CANONICAL_CONTENT`;
- `AUTHORITATIVE_STATE`;
- `LEDGER`;
- `CACHED_PROJECTION`; or
- `PRESENTATION_METADATA`.

Procedural projections MUST NOT be stored as canonical content or authoritative state. A cached projection is permitted only when it declares:

- `projectionTypeId`;
- `derivationFormulaId` and version;
- ordered authoritative input identifiers;
- `inputHash`;
- `outputHash`; and
- invalidation rules.

On load, a cached projection with a mismatched input hash, formula version, or output hash MUST be discarded and rebuilt. Its mismatch MUST NOT invalidate otherwise sound authoritative state.

Every derived value MUST be a pure deterministic function of its declared authoritative inputs, pinned content, and pinned ruleset version. Derivation MUST NOT read wall-clock time, locale, filesystem order, database row order without canonical sorting, rendering state, or an undeclared random source.

A derived value that cannot be reproduced MUST fail validation with `NON_REPRODUCIBLE_DERIVATION`.

### 6.7 Save, Load, and Future-Outcome Preservation

Stable strategic saves MUST be permitted only at `MonthOpeningSnapshot` and `MonthClosingSnapshot`. Tactical saves, when enabled, MUST occur only at an authoritative tactical-minute boundary after that minute has been fully canonicalized.

A save MUST persist or content-address:

- authoritative state;
- command and event ledger position;
- RNG algorithm version and deterministic derivation position;
- content, scenario, ruleset, formula, and AI-policy identifiers and hashes;
- compiled design artifacts;
- current phase cursor; and
- all hashes required by the persistence contract.

Loading MUST validate pinned dependencies and hashes before exposing the campaign as playable. Derived projections MUST be rebuilt or validated after authoritative state validation.

The required replay test is:

1. load a stable snapshot;
2. apply an ordered command and decision sequence;
3. resolve through the next stable snapshot;
4. record canonical snapshot, ledger, and RNG-manifest hashes;
5. reload the original snapshot;
6. apply the identical sequence; and
7. require equality of all three hashes and all command results.

Hash inequality or command-result inequality MUST fail with `DETERMINISM_REPLAY_MISMATCH`. Silent migration, substituted content, substituted rulesets, or best-effort loading is prohibited.

### 6.8 Tactical Continuity and Auto-Resolution

Every battle manifest accepted by battle generation MUST be consumable by both the tactical resolver and the deterministic auto-resolver.

The auto-resolver MUST accept the same canonical battle manifest, participating campaign assets, battle seed, ruleset version, weather state, intelligence-constrained pre-battle choices, and mission objectives used to initialize tactical combat.

Auto-resolution MUST produce:

- asset damage and loss states;
- ammunition and inventory expenditure;
- crew and officer outcomes;
- mission-objective outcomes;
- war-score contributions;
- political and confidence consequences;
- survivor and capture outcomes where applicable;
- battle event ledger entries; and
- a deterministic result hash.

Selecting tactical play or auto-resolution MAY produce different outcomes because the command sequence differs. Selecting auto-resolution MUST NOT omit any campaign-applicable result category.

If the auto-resolver cannot resolve an accepted manifest, battle generation MUST reject the manifest before player presentation with `AUTO_RESOLUTION_UNAVAILABLE`. No campaign path may require tactical play.

### 6.9 Start-Readiness Gates

Campaign creation MUST remain in `COMPILING` state until every mandatory start-readiness gate passes.

The mandatory gates are:

1. content-pack schema and referential validation;
2. complete scenario participation records;
3. complete canonical input availability;
4. successful deterministic campaign compilation;
5. aggregate invariant validation;
6. balanced initial financial ledgers;
7. valid initial research and technology state;
8. valid deployment, infrastructure, and obligation state;
9. successful first-month resolution from opening to closing snapshot;
10. successful accepted-battle auto-resolution validation;
11. successful save/load replay verification; and
12. repeated compilation producing identical initial snapshot hashes.

Each gate MUST emit `PASS` or `FAIL`, a stable gate identifier, input hashes, output hashes where applicable, and machine-readable diagnostics.

All twelve gates MUST report `PASS`. A warning, skipped gate, unavailable gate, partial result, or repaired high-authority input counts as `FAIL`.

Gate failure MUST reject campaign creation with `START_READINESS_FAILED` and the ordered list of failed gate identifiers. The compiler MUST NOT create an active campaign save, consume runtime campaign RNG, or invent missing canonical content after failure.

## 7. Campaign Success Contract

Campaign success MUST be determined exclusively by the versioned final-career-evaluation contract in `DESIGN-56`.

The evaluation input MUST include:

- the compiled starting-position snapshot;
- assigned strategic objectives and their outcomes;
- institutional-confidence history;
- long-term naval performance dimensions declared by `DESIGN-56`; and
- any explicitly declared tactical-realism modifier.

The active ruleset MUST provide:

- an identifier for the final-evaluation formula;
- the weight or contribution rule for every evaluation dimension;
- normalization rules relative to starting position;
- rounding modes;
- minimum and maximum contribution bounds;
- rating boundaries; and
- behavior for inapplicable dimensions.

Missing evaluation fields MUST fail ruleset validation. Implementations MUST NOT use fallback weights, equal weighting, descriptive inference, or hidden scoring dimensions.

Two evaluations using identical authoritative inputs and the same ruleset version MUST produce the same result and explanation trace.

## 8. Normative Bindings

This document binds its requirements to the following canonical contracts:

- player identity and continuity: `DESIGN-02`;
- campaign configuration and supported timeline: `DESIGN-03`;
- playable-slot and scenario eligibility: `DESIGN-04`;
- determinism and random streams: the canonical determinism specification;
- command authority and lifecycle: `DESIGN-11`;
- UI information boundaries: `DESIGN-51`;
- persistence and replay: `DESIGN-52`;
- implementation order and support claims: `DESIGN-55`; and
- final career evaluation: `DESIGN-56`.

If a referenced contract is absent, inconsistent, or fails validation, the implementing agent MUST report a specification defect during build-time validation. Runtime invention of behavior is prohibited.

## 9. Acceptance Criteria

`DESIGN-01` is satisfied only when automated validation demonstrates that:

1. campaign selection accepts only explicit active or continuity-enabled playable slots;
2. player and AI state-changing actions produce validated commands or typed resolution records;
3. every authoritative mutation has a stable cause identifier;
4. UI and AI projections respect knowledge boundaries;
5. every required battle has a deterministic auto-resolution path;
6. save and reload preserve repeated future outcomes;
7. campaign creation fails when a start-readiness gate fails;
8. final evaluation uses only the versioned `DESIGN-56` contract;
9. missing evaluation constants fail validation; and
10. descriptive terms in this document are not parsed or interpreted as runtime mechanics.
