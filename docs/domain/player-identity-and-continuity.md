## DESIGN-02: Player Identity And Campaign Continuity

**Canonical status:** Normative design specification  
**Stable document ID:** `DESIGN-02`  
**Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Runtime inference and fallback behavior are prohibited unless explicitly defined by this document or a referenced canonical contract.

## 1. Player Role

The player represents the continuing senior leadership of the selected playable slot's national naval institution.

The player's institutional identity:

- MUST persist across retirement, promotion, death, dismissal, or replacement of individual officers;
- MUST persist across officer generations;
- MUST persist across government and constitutional changes unless an explicit terminal condition succeeds;
- MUST remain bound to the campaign's immutable `playableSlotId`; and
- MUST NOT be reassigned to another playable slot, AI-only power, or unrelated successor state.

Individual officers MUST remain separate authoritative simulated entities. No officer identifier may serve as the player's persistent campaign identity.

The legacy term `prestige`, wherever retained for migration or presentation compatibility, MUST map exclusively to `institutionalConfidence`. It MUST NOT represent an individual officer's reputation and MUST NOT create a second authoritative confidence value.

## 2. Continuity Identity Contract

Campaign compilation MUST create an immutable `PlayerInstitutionIdentity` containing:

- `campaignId`;
- `playableSlotId`;
- `initialScenarioNationInstanceId`;
- `currentScenarioNationInstanceId`;
- `navalInstitutionId`;
- `continuityModeId`;
- `continuityRevision`;
- `status`;
- `createdAtCampaignMonth`; and
- `lastTransitionRecordId` or `NONE`.

`status` MUST be one of:

- `ACTIVE`;
- `TRANSITION_PENDING`;
- `TERMINATED`; or
- `RETIRED`.

`playableSlotId`, `navalInstitutionId`, and `continuityModeId` MUST remain immutable after campaign compilation.

`currentScenarioNationInstanceId` MAY change only through an accepted `ContinuityTransition`. `continuityRevision` MUST begin at `0` and increase by exactly `1` for every applied transition.

A missing, duplicated, or invalid continuity identity MUST fail validation with `INVALID_PLAYER_CONTINUITY_IDENTITY`.

## 3. Continuity-Capable Events

Only the following event classes MAY initiate a continuity evaluation:

- `REVOLUTION`;
- `MILITARY_DEFEAT`;
- `REGIME_CHANGE`;
- `CONSTITUTIONAL_CHANGE`;
- `NATIONAL_SUCCESSION`;
- `STATE_DISSOLUTION`;
- `SCENARIO_TRANSITION`; or
- `CANONICAL_EVENT`, when its definition explicitly declares `requiresContinuityEvaluation: true`.

An event in this list MUST NOT alter campaign identity or terminate the campaign directly. It MUST create a `ContinuityEvaluationRequest` and enter `TRANSITION_PENDING` before any continuity-dependent state is changed.

Each request MUST contain:

- `requestId`;
- `triggerEventId`;
- `triggerEventClass`;
- `effectiveCampaignMonth`;
- `sourceScenarioNationInstanceId`;
- `playableSlotId`;
- `continuityModeId`;
- `preTransitionStateHash`; and
- `candidateContinuationIds` in ascending stable-identifier order.

Creating a continuity request outside the trigger event's declared resolution phase MUST fail with `INVALID_CONTINUITY_PHASE`.

## 4. Supported Continuation Contract

A campaign has a supported continuation only when exactly one eligible `ContinuationDefinition` is selected by the deterministic procedure in this section.

Every `ContinuationDefinition` MUST be canonical scenario or continuity-mode content and MUST contain:

- `continuationId`;
- `sourceScenarioNationInstanceId`;
- `targetScenarioNationInstanceId`;
- `playableSlotId`;
- `allowedContinuityModeIds`;
- `eligibleTriggerEventClasses`;
- `eligibilityPredicateId`;
- `priority` as an integer from `0` through `1000` inclusive;
- `effectBundleId`;
- `officerEligibilityPolicyId`;
- `objectiveTransitionPolicyId`;
- `diplomacyTransitionPolicyId`;
- `territorialTransitionPolicyId`;
- `budgetTransitionPolicyId`;
- `confidenceTransitionPolicyId`; and
- `terminalWhenIneligible`.

A definition is eligible only when:

1. its `sourceScenarioNationInstanceId` equals the current nation instance;
2. its `playableSlotId` equals the campaign's immutable playable slot;
3. the active continuity mode appears in `allowedContinuityModeIds`;
4. the trigger class appears in `eligibleTriggerEventClasses`;
5. its named eligibility predicate evaluates to `true`; and
6. its target nation instance exists and is valid in canonical content.

Eligible definitions MUST be ordered by:

1. descending `priority`;
2. ascending `continuationId`.

The first definition in that order MUST be selected. Equal priority is resolved exclusively by ascending `continuationId`.

If no definition is eligible:

- the evaluator MUST emit `NO_SUPPORTED_CONTINUATION`;
- campaign termination eligibility MUST be evaluated under Section 8; and
- the implementation MUST NOT infer a successor from names, governments, territory, culture, historical knowledge, or AI-only nation records.

If a selected definition would change `playableSlotId`, validation MUST fail with `PLAYABLE_SLOT_CONTINUITY_VIOLATION`.

## 5. Continuity Transition

A supported transition MUST be applied atomically through a `ContinuityTransition` containing:

- `transitionId`;
- `requestId`;
- `continuationId`;
- `sourceScenarioNationInstanceId`;
- `targetScenarioNationInstanceId`;
- `effectBundleId`;
- ordered effect records;
- `preTransitionStateHash`;
- `postTransitionStateHash`;
- `continuityRevisionBefore`;
- `continuityRevisionAfter`; and
- `resultCode`.

`continuityRevisionAfter` MUST equal `continuityRevisionBefore + 1`.

The transition MUST either apply all declared effects and commit one post-transition snapshot or apply none. Partial transitions are prohibited.

A successful transition MUST:

- set `currentScenarioNationInstanceId` to the target instance;
- increment `continuityRevision` by exactly `1`;
- restore player identity status to `ACTIVE`;
- retain the immutable playable-slot and naval-institution identifiers;
- emit a complete causal and audit record; and
- run aggregate invariants before the resulting snapshot is committed.

Failure of any effect or invariant MUST roll back the full transition and emit `CONTINUITY_TRANSITION_FAILED`.

## 6. Permitted Transition Effects

A continuity transition MAY alter only the state categories explicitly listed in its selected effect bundle. The permitted categories are:

- government type;
- political mandates;
- national traits;
- diplomatic relations;
- legal possession ownership;
- military possession control;
- naval budget and appropriation state;
- strategic objectives;
- officer eligibility;
- institutional confidence; and
- the current scenario nation instance.

Each category MUST use the rules below.

### 6.1 Government Type

Government changes MUST reference a canonical `governmentTypeId` and `politicalRegimeId`. Free-text or inferred government substitution is prohibited.

### 6.2 Political Mandates

Each active mandate MUST receive exactly one declared disposition:

- `PRESERVE`;
- `CANCEL_WITHOUT_PENALTY`;
- `CANCEL_WITH_DECLARED_EFFECT`;
- `REPLACE`; or
- `REEVALUATE_ELIGIBILITY`.

A replacement MUST identify the new mandate definition. An omitted disposition MUST fail with `INCOMPLETE_MANDATE_TRANSITION`.

### 6.3 National Traits

Trait changes MUST be expressed as ordered `ADD`, `REMOVE`, or `PRESERVE` operations over stable trait identifiers. Trait stacking and activation MUST be revalidated after all operations are applied.

### 6.4 Diplomatic Relations

Diplomatic effects MUST be typed relation operations. The transition MUST NOT create a state in which the target nation instance is allied with and at war against the same participant in the same relation context.

War exit, war entry, alliance retention, guarantees, access rights, tension, and treaty participation MUST each have an explicit disposition. Omitted relation fields MUST be preserved, not reset.

### 6.5 Possessions

Legal ownership and military control MUST remain separate. Every affected possession MUST declare independently:

- legal-owner disposition;
- military-controller disposition; and
- occupier disposition.

No possession may be transferred from descriptive event text. Transfers MUST use typed effects and pass territorial invariants.

### 6.6 Budget

Budget changes MUST use balanced financial postings and a named budget-transition policy. A transition MUST NOT silently set treasury below zero.

The policy MUST declare the disposition of:

- treasury;
- current appropriation rate;
- arrears;
- reserved funds;
- active project commitments;
- reparations; and
- mandatory obligations.

Omitted budget fields MUST be preserved.

### 6.7 Strategic Objectives

Each objective MUST receive exactly one declared disposition:

- `PRESERVE`;
- `SUCCEED`;
- `FAIL_WITH_DECLARED_EFFECT`;
- `CANCEL_WITHOUT_SCORE`;
- `REPLACE`; or
- `REEVALUATE_ELIGIBILITY`.

A replacement MUST identify the new objective definition. Objective history MUST remain append-only.

### 6.8 Officer Eligibility

Officer eligibility MUST be recalculated by the selected `officerEligibilityPolicyId`. Ineligible officers MUST receive one explicit outcome:

- `RETAIN_CURRENT_COMMAND`;
- `REMOVE_FROM_COMMAND`;
- `RETIRE`;
- `INTERN`;
- `DISMISS`; or
- `TRANSFER_TO_SUCCESSOR_SERVICE`.

Officer identity and history MUST be preserved. No officer may be silently deleted.

### 6.9 Institutional Confidence

Institutional-confidence changes MUST use a named formula or a concrete signed integer delta. Confidence MUST remain within the canonical closed interval `0..100`.

The transition MUST apply all confidence deltas in declared order, sum them using integer arithmetic, and clamp once after the final delta to `0..100`.

The transition itself MUST NOT dismiss the naval administration. Dismissal eligibility MUST be evaluated only during the terminal-evaluation phase.

## 7. Non-Terminal Major Outcomes

The following outcomes are non-terminal by themselves:

- loss of a war;
- loss of one or more possessions;
- revolution;
- temporary or persistent fiscal insolvency;
- loss, capture, internment, or operational destruction of the entire commissioned fleet;
- government change;
- constitutional change;
- regime change;
- treaty-imposed naval restriction;
- active-project cancellation;
- loss of every current naval base; and
- institutional confidence reaching `16` or lower before terminal evaluation.

A non-terminal major outcome MUST:

1. apply its own typed domain effects;
2. create a continuity evaluation when it belongs to a continuity-capable event class;
3. continue to the next authoritative phase when no terminal predicate succeeds; and
4. remain recorded in the campaign ledger and final career report.

The implementation MUST NOT terminate a campaign solely because an outcome appears in this section.

An outcome in this section MAY contribute to a terminal condition only through an explicit terminal predicate evaluated under Section 8.

Fiscal insolvency is non-terminal regardless of duration unless a canonical event or terminal predicate explicitly produces dismissal, unsupported national collapse, or another defined terminal result.

Fleet destruction is non-terminal even when no commissioned ships remain. The campaign MUST continue with all legally available construction, procurement, diplomatic, political, and recovery actions.

Loss of all possessions is non-terminal unless it also satisfies an explicit unsupported-continuation or scenario-terminal predicate.

## 8. Terminal Conditions

Campaign termination MUST occur only during the authoritative terminal-evaluation phase, except voluntary retirement, which MUST create a terminal-evaluation command for that phase.

The only permitted terminal reason codes are:

- `NAVAL_ADMINISTRATION_DISMISSED`;
- `NO_SUPPORTED_CONTINUATION`;
- `SCENARIO_TERMINAL_DEFEAT`;
- `SIMULATION_END_REACHED`;
- `PLAYER_VOLUNTARY_RETIREMENT`; or
- `CANONICAL_SCENARIO_ENDPOINT`.

Terminal predicates MUST be evaluated in the following order:

1. `NAVAL_ADMINISTRATION_DISMISSED`;
2. `NO_SUPPORTED_CONTINUATION`;
3. `SCENARIO_TERMINAL_DEFEAT`;
4. `CANONICAL_SCENARIO_ENDPOINT`;
5. `SIMULATION_END_REACHED`;
6. `PLAYER_VOLUNTARY_RETIREMENT`.

The first true predicate in this order MUST determine the primary terminal reason. Every additional true predicate MUST be recorded as a secondary terminal reason in the same evaluation record.

### 8.1 Naval Administration Dismissal

Institutional confidence at or below `16` creates dismissal eligibility but does not guarantee dismissal.

The active ruleset MUST provide a versioned `dismissalPredicateId`. The predicate MUST use only declared authoritative inputs and MUST return a boolean without consuming randomness unless its contract explicitly declares a domain-separated random decision.

A missing predicate MUST fail ruleset validation. The implementation MUST NOT substitute `institutionalConfidence <= 16` as automatic dismissal unless that exact predicate is supplied by the active ruleset.

### 8.2 No Supported Continuation

This predicate is true only when:

- a continuity evaluation was required;
- no eligible continuation definition exists;
- the triggering definition or scenario contract declares termination when unsupported; and
- the continuity evaluator emitted `NO_SUPPORTED_CONTINUATION`.

### 8.3 Scenario Terminal Defeat

A scenario terminal defeat MUST reference a canonical, versioned predicate identified by the selected scenario. Descriptive defeat text MUST NOT terminate a campaign.

### 8.4 Simulation End

`SIMULATION_END_REACHED` is true after completion of the December 1970 strategic month and its final evaluation. The campaign MUST NOT advance to January 1971.

### 8.5 Voluntary Retirement

Voluntary retirement requires an accepted `RetireCampaignCommand`. The command MUST be explicit, player-issued, and locked before terminal evaluation. UI closure, save deletion, inactivity, or application exit MUST NOT count as retirement.

### 8.6 Canonical Scenario Endpoint

A canonical scenario endpoint MUST identify a versioned endpoint predicate and terminal result. An endpoint without a predicate MUST fail scenario validation.

## 9. Terminal Record and Finalization

A terminal campaign MUST produce one immutable `CampaignTerminalRecord` containing:

- `terminalRecordId`;
- `campaignId`;
- `evaluatedAtCampaignMonth`;
- `primaryReasonCode`;
- ordered `secondaryReasonCodes`;
- `predicateIds` and versions;
- `inputStateHash`;
- `finalEvaluationId`;
- `finalSnapshotHash`;
- `continuityRevision`; and
- `causalRecordId`.

After the terminal record is committed:

- `PlayerInstitutionIdentity.status` MUST be `TERMINATED` or `RETIRED`;
- no new simulation command may be accepted;
- reports, replay, export, and read-only inspection MAY remain available; and
- the terminal record MUST NOT be replaced or deleted by normal gameplay operations.

A second terminal record for the same campaign MUST fail with `DUPLICATE_CAMPAIGN_TERMINATION`.

## 10. Validation and Acceptance

Automated validation MUST prove that:

1. government change alone does not terminate a campaign;
2. every continuity-capable event enters `TRANSITION_PENDING` before continuity effects are applied;
3. successor selection uses only canonical continuation definitions;
4. selection is deterministic by descending priority and ascending stable identifier;
5. playable-slot identity never changes during continuation;
6. every permitted state category uses an explicit transition policy;
7. ownership and military control remain separate;
8. mandate, objective, budget, diplomacy, officer, and confidence transitions reject missing required dispositions;
9. every listed non-terminal major outcome continues when no terminal predicate succeeds;
10. fleet destruction and insolvency do not terminate a campaign by themselves;
11. terminal predicates run only in the terminal-evaluation phase;
12. simultaneous terminal predicates use the mandated precedence order;
13. December 1970 completes final evaluation and cannot advance to January 1971;
14. voluntary retirement requires an accepted command;
15. continuity transitions are atomic and rollback completely on failure; and
16. identical transition inputs produce identical selected continuations, effect records, and post-transition hashes.
