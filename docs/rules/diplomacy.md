# DESIGN-17: Diplomacy

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-17`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Diplomatic relations, tension, alliances, incidents, access, event choices, and war risk MUST use the explicit fields, values, predicates, phase bindings, ordering, and failure behavior defined here. Runtime inference from descriptive text is prohibited.

## 1. Diplomatic Pair Registry

Every unordered pair of distinct active powers MUST have exactly one authoritative `DiplomaticPairState`.

For `N` active powers, the required pair count is:

`N * (N - 1) / 2`

Pairs MUST use canonical identifiers:

- `nationLowId`: lexicographically lower stable nation identifier;
- `nationHighId`: lexicographically higher stable nation identifier; and
- `diplomaticPairId`: deterministic content-addressed identifier derived from both identifiers.

Self-relations are prohibited.

A missing, duplicate, reversed duplicate, or orphan pair MUST fail with `INVALID_DIPLOMATIC_PAIR_REGISTRY`.

## 2. Diplomatic Pair State

Each `DiplomaticPairState` MUST contain:

- `diplomaticPairId`;
- `nationLowId`;
- `nationHighId`;
- shared bilateral tension;
- alliance identifier or `NONE`;
- ordered active-war relationship identifiers;
- ordered guarantee identifiers;
- ordered access-right identifiers;
- technology-trade state;
- ordered bilateral claim identifiers;
- ordered incident identifiers;
- ordered cooldown records;
- ordered treaty identifiers;
- relation-state version; and
- aggregate hash.

Shared bilateral fields MUST be stored once per pair. They MUST NOT be duplicated as conflicting A-to-B and B-to-A values.

## 3. Directed Attitude

Each diplomatic pair MUST contain exactly two `DirectedAttitudeState` records:

- nation low toward nation high; and
- nation high toward nation low.

Each record MUST contain:

- source nation;
- target nation;
- attitude score within `-100..100`;
- trust score within `0..100`;
- threat score within `0..100`;
- grievance score within `0..100`;
- affinity modifier within `-100..100`;
- ordered visible and hidden attitude modifiers;
- last evaluation month;
- formula version; and
- record hash.

Directed attitude affects AI policy only through named integer utility formulas. It MUST NOT replace shared tension, alliance, war, treaty, or access state.

## 4. Tension Scale

### 4.1 Canonical Scale

Bilateral tension MUST be an integer within `0..10` inclusive.

The canonical meanings are:

- `0`: exceptionally cooperative;
- `1`: cooperative;
- `2`: cordial;
- `3`: normal;
- `4`: guarded;
- `5`: strained;
- `6`: severe tension;
- `7`: crisis;
- `8`: acute crisis;
- `9`: near-war;
- `10`: maximum crisis.

These labels are presentation guidance only. Mechanics use the integer value and explicit predicates.

Campaign compilation MUST supply one canonical starting tension for every active pair. Missing starting tension MUST fail with `STARTING_TENSION_MISSING`.

### 4.2 Tension Mutation

Tension MAY change only through typed effect `ADJUST_BILATERAL_TENSION`.

Each effect MUST contain:

- `tensionChangeId`;
- `diplomaticPairId`;
- signed integer delta;
- cause type and cause identifier;
- effective campaign month and phase;
- source participant or `SYSTEM`;
- visibility policy;
- pre-change tension;
- unclamped result;
- post-change tension;
- reason code;
- content, formula, and ruleset versions; and
- record hash.

The canonical formula is:

`postChangeTension = clamp(0, 10, preChangeTension + delta)`

Clamping occurs once after one typed effect. Multiple effects in one phase MUST be applied in canonical effect order and recorded separately.

Direct writes to tension are prohibited and MUST fail with `UNLEDGERED_TENSION_MUTATION`.

## 5. Tension Ledger

Every tension effect MUST append one immutable `TensionLedgerEntry`.

Entries MUST be ordered by:

1. campaign month;
2. strategic phase ordinal;
3. cause priority;
4. stable cause identifier;
5. tension-change identifier.

The shipped cause priority is:

1. treaty effect;
2. war or peace effect;
3. alliance effect;
4. diplomatic event;
5. incident;
6. access decision;
7. recurring monthly decay or escalation;
8. scenario-special effect.

Every entry MUST identify the exact cause. A generic reason such as `DIPLOMACY_CHANGED` is prohibited.

The tension ledger MUST be included in pair-state hashing and save/replay verification.

## 6. Canal Access Binding

Normal canal transit controlled by the other nation MUST be denied when shared bilateral tension is greater than or equal to exactly `7`.

The predicate is:

`tension >= 7`

Tension `6` does not trigger this denial. Tension `7` does.

The check MUST use the current post-diplomacy tension during strategic movement and the canal controller's authoritative identity.

War with the controller, physical closure, blockage, mining, access policy, treaty rights, and locked transit are separate predicates governed by `DESIGN-14`.

A failure under this tension predicate MUST use `CANAL_TENSION_ACCESS_DENIED`.

## 7. War-Risk State

### 7.1 Purpose

Tension contributes to war risk but MUST NOT start a war by itself.

Every diplomatic pair not already at war MUST have one derived `WarRiskAssessment` recalculated during `RESOLVE_DIPLOMACY`.

### 7.2 Tension Contribution

The shipped tension contribution to war-risk score is:

- tension `0..3`: `0` points;
- tension `4`: `5` points;
- tension `5`: `10` points;
- tension `6`: `20` points;
- tension `7`: `35` points;
- tension `8`: `50` points;
- tension `9`: `70` points;
- tension `10`: `90` points.

The score uses integer range `0..100`.

### 7.3 Full War-Risk Formula

The active ruleset MUST define `war_risk_v1` containing:

- tension contribution schedule;
- incident contribution formula;
- alliance contribution formula;
- government contribution formula;
- strategic-objective contribution formula;
- mobilization contribution formula;
- active-crisis contribution formula;
- explicit event contribution formula;
- clamp range;
- escalation-event thresholds;
- formula version; and
- phase binding.

The shipped formula is:

`warRiskScore = clamp(0, 100, tensionPoints + incidentPoints + alliancePoints + governmentPoints + objectivePoints + mobilizationPoints + crisisPoints + eventPoints)`

Missing fields MUST fail with `INVALID_WAR_RISK_CONTRACT`.

### 7.4 Escalation Thresholds

The shipped thresholds are:

- `40`: diplomatic warning eligibility;
- `60`: crisis event eligibility;
- `80`: war ultimatum event eligibility;
- `100`: mandatory evaluation of an explicit war-trigger event.

Crossing a threshold enqueues the declared typed event only when its cooldown and eligibility predicates pass.

No score or tension value directly creates war. War begins only through typed effect `START_WAR` emitted by an accepted event, scenario rule, treaty obligation, surprise operation, or other explicit war-entry contract.

A direct war start from tension alone MUST fail with `WAR_START_REQUIRES_EXPLICIT_TRIGGER`.

## 8. Incidents

Every diplomatic incident MUST have one `DiplomaticIncidentRecord` containing:

- `incidentId`;
- incident type;
- involved nations;
- discovery and visibility state;
- severity within `1..5`;
- tension effect identifiers;
- war-risk contribution;
- expiration or decay policy;
- event and decision references;
- cause identifier; and
- record hash.

The shipped war-risk contribution by severity is:

- severity `1`: `2` points;
- severity `2`: `5` points;
- severity `3`: `10` points;
- severity `4`: `20` points;
- severity `5`: `30` points.

Incident text MUST NOT create effects. All effects MUST be typed.

## 9. Alliance State

Every alliance MUST have one immutable identity and mutable `AllianceState` containing:

- `allianceId`;
- ordered member nation identifiers;
- effective month;
- expiration month or `NONE`;
- alliance type;
- mutual-defense scope;
- expected-support policy identifier;
- technology-trade policy identifier;
- operational-support policy identifier;
- rival-reaction policy identifier;
- peacetime revocation policy identifier;
- wartime lock policy identifier;
- separate-peace policy identifier;
- active shared-war identifiers;
- status;
- treaty source identifier; and
- aggregate hash.

`status` MUST be one of:

- `PROPOSED`;
- `ACTIVE`;
- `SUSPENDED`;
- `REVOKED`;
- `EXPIRED`; or
- `DISSOLVED`.

An alliance requires at least two members.

## 10. Alliance Formation

Alliance formation MUST use an accepted treaty or alliance command and typed effect `CREATE_ALLIANCE`.

Eligibility MUST validate:

- governments are compatible under the active policy;
- members are not opposing participants in an active war;
- no treaty prohibits the alliance;
- required tension, attitude, and trust predicates pass;
- every member has authority to enter; and
- alliance terms are complete.

The shipped eligibility thresholds are:

- bilateral tension no greater than `4`;
- directed trust at least `50` in both directions;
- directed attitude at least `0` in both directions.

A scenario or typed event MAY override these thresholds only through explicit values.

## 11. Alliance Tension Effects

When a bilateral alliance becomes `ACTIVE`, it MUST apply exactly one tension delta of `-2` to each newly allied pair, clamped to `0..10` and recorded in the tension ledger.

During each January `RESOLVE_DIPLOMACY` phase, an alliance pair with no unresolved qualifying breach MUST apply recurring tension delta `-1`, with a floor of `0`.

A pair MUST NOT receive more than one recurring alliance reduction per calendar year.

Alliance suspension or revocation does not restore prior tension automatically.

## 12. Expected Support in War

Alliance expected support MUST be represented by integer `supportCommitmentBp` within `0..10_000` for each member toward each other member.

The shipped base commitment is `7_500` basis points.

The final support expectation is:

`finalSupportCommitmentBp = clamp(0, 10_000, 7_500 + treatyModifierBp + trustModifierBp + governmentModifierBp + objectiveModifierBp + priorSupportModifierBp)`

The value guides AI planning and political expectations. It does not automatically add a nation to war.

War entry requires an explicit alliance-call decision and typed `JOIN_WAR` effect.

Declining an eligible call MUST apply effects from the alliance-call event, which MUST explicitly define tension, trust, confidence, alliance-status, and objective consequences.

## 13. Technology Trade

An active alliance modifies technology-sale eligibility and price only through `alliance_technology_trade_v1`.

The shipped effects are:

- alliance eligibility bonus: `2_000` basis points to sale-eligibility score;
- price multiplier: `8_500` basis points, equal to a `15%` discount;
- minimum final price multiplier: `7_500` basis points;
- maximum insight transfer unchanged unless the technology contract explicitly provides a bonus.

Alliance does not guarantee a sale. Technology prerequisites, government permission, secrecy, export controls, payment, availability, and technology-specific restrictions must still pass.

The alliance MUST NOT grant technology directly.

## 14. Allied Operational Support

Alliance permits allied operational support only when all predicates pass:

- both nations are members of the active alliance;
- both are on the same side of the relevant active war or the mission is permitted in peace;
- the supporting nation accepts or its AI policy authorizes support;
- access rights exist for the required area, port, canal, airbase, or supply network;
- force, fuel, range, supply, treaty, and mission predicates pass;
- command and information limits are preserved; and
- support is selected through the owning operation or battle-generation contract.

Alliance alone does not create basing rights. Missing access MUST fail with `ALLIED_OPERATIONAL_ACCESS_MISSING`.

Allied forces remain controlled by their own AI and command structure unless an explicit command-transfer contract applies.

## 15. Rival Reaction to Alliances

Alliance formation MAY increase tension with rivals only through `alliance_rival_reaction_v1`.

A third nation is an affected rival only when it has an active rival relation or strategic objective against at least one new alliance member.

The shipped reaction delta is:

- rival of one member: `+1` tension with that member;
- rival of two or more members: `+1` tension with each relevant member, not more than `+2` total tension changes for the third nation from one alliance-formation event;
- non-rival: `0`.

Each delta MUST be a separate tension-ledger entry with the alliance as cause.

No runtime inference from geographic proximity, historical rivalry, or display text is permitted.

## 16. Alliance Revocation in Peace

An active alliance MAY be revoked only during `RESOLVE_DIPLOMACY` when no wartime lock applies.

The shipped `alliance_revocation_v1` eligibility predicates are:

- no pair of affected members remains on the same side of any active war;
- expiration date has passed, or a qualifying breach exists, or bilateral tension is at least `7`, or trust in either direction is below `25`;
- no treaty clause prohibits revocation;
- a revocation command or typed event is accepted; and
- required notice period is complete.

The shipped notice period is `3` completed months, except a qualifying material breach permits immediate revocation.

Revocation MUST use typed effect `REVOKE_ALLIANCE` and explicitly settle guarantees, access rights, shared plans, technology offers, and outstanding calls.

Failure of the predicates MUST reject revocation with `ALLIANCE_REVOCATION_INELIGIBLE`.

## 17. Wartime Alliance Lock

An alliance MUST NOT be revoked, expire, or dissolve while at least two of its affected members remain participants on the same side of the same active war.

During this lock:

- revocation commands MUST fail with `ALLIANCE_LOCKED_BY_SHARED_WAR`;
- expiration MUST be deferred;
- ordinary relation failure MUST be recorded but not applied as revocation;
- access and support remain governed by their contracts; and
- separate peace remains available under Section 18.

The lock ends immediately after no affected member pair remains co-belligerent in an active war.

Deferred expiration or revocation eligibility MUST be reevaluated in the next `RESOLVE_DIPLOMACY` phase.

## 18. Separate Peace

An allied war participant MAY seek separate peace only through the war-participant and negotiation contracts.

An accepted separate peace MUST:

- remove that participant from the specific war;
- preserve other war identities;
- recalculate sides, access, blockade, occupation, support, and alliance wartime locks;
- apply explicit alliance trust and tension consequences;
- avoid creating an allied-and-at-war contradiction; and
- leave the alliance active, suspended, or eligible for later revocation according to explicit settlement effects.

Separate peace MUST NOT automatically revoke the alliance unless the settlement includes typed effect `REVOKE_ALLIANCE` and wartime lock no longer applies.

## 19. Guarantees and Access Rights

Every guarantee and access right MUST have a stable record with:

- grantor;
- beneficiary;
- scope;
- effective and expiration months;
- activation predicate;
- revocation predicate;
- wartime behavior;
- treaty source;
- status; and
- record hash.

Access scopes MUST identify specific permissions such as:

- port access;
- basing;
- repair;
- supply;
- canal transit;
- airbase use;
- overflight;
- intelligence sharing; or
- operational support.

Generic `allied access` is not a valid mechanical permission.

## 20. Diplomatic Event Contract

Every diplomatic event MUST contain:

- `eventId`;
- scope;
- eligibility predicate;
- trigger phase;
- schedule or weight;
- cooldown;
- choices;
- AI-choice policy;
- typed effects;
- visibility;
- follow-ups;
- expiration;
- RNG stream when weighted; and
- content version and hash.

Event prose MUST NOT define mechanics.

Each choice MUST list every effect explicitly. An omitted effect is exactly no effect.

## 21. Standard Hawkish and Dovish Choice Profiles

Event authors MAY reference these standard profiles but MUST still materialize their typed effects in the event definition.

### 21.1 Hawkish Minor

- institutional confidence: `+1` point;
- naval appropriation rate: `+25` basis points;
- bilateral tension: `+1`;
- political capital: `0`;
- government approval requirement: event-defined.

### 21.2 Hawkish Major

- institutional confidence: `+2` points;
- naval appropriation rate: `+50` basis points;
- bilateral tension: `+2`;
- political capital: `-1` point;
- government approval requirement: event-defined.

### 21.3 Dovish Minor

- bilateral tension: `-1`;
- institutional confidence: `-1` point;
- naval appropriation rate: `0`;
- political capital: `+1` point.

### 21.4 Dovish Major

- bilateral tension: `-2`;
- institutional confidence: `-2` points;
- naval appropriation rate: `-25` basis points;
- political capital: `+2` points.

These are concrete reusable effect bundles, not implicit meanings of the words `hawkish` or `dovish`.

An event that uses different values MUST supply them explicitly. The runtime MUST NOT select a profile based on choice labels or prose.

## 22. Budget and Confidence Effect Application

Naval appropriation-rate changes MUST use typed economic effects and remain within the government's declared minimum and maximum rate.

Institutional-confidence changes MUST use typed political effects and remain within `0..100`.

Tension changes MUST use Section 4 and create ledger entries.

When one event choice contains several effects, they MUST apply atomically in the event's declared order. Failure of any effect MUST roll back all effects and emit `DIPLOMATIC_EVENT_APPLICATION_FAILED`.

## 23. War Entry

War entry MAY be caused only by an explicit typed effect from:

- a declared war command authorized by government rules;
- a crisis or ultimatum event;
- an alliance-call decision;
- a treaty-guarantee obligation;
- a surprise-operation contract;
- a scenario event; or
- another canonical war-entry contract.

The war-entry evaluator MUST consider declared inputs for:

- tension;
- incidents;
- alliances;
- government;
- strategic objectives;
- events;
- mobilization;
- guarantees; and
- surprise opportunities.

Tension and war-risk scores affect event eligibility and AI utility only. They MUST NOT mutate war state directly.

## 24. Cooldowns

Every recurring diplomatic event, alliance action, incident class, guarantee action, and access action MUST declare an integer cooldown in completed months.

A cooldown record MUST contain:

- scope identifier;
- action or event type;
- start month;
- duration months;
- next eligible month; and
- source record.

A missing cooldown is valid only when the definition explicitly states `0` months.

## 25. Canonical Ordering and Hashing

During `RESOLVE_DIPLOMACY`:

1. pairs MUST be ordered by `diplomaticPairId`;
2. commands by canonical command order;
3. treaty and alliance effects by stable identifier;
4. incidents by severity descending and incident identifier ascending;
5. event effects by declared effect ordinal; and
6. tension ledger entries by Section 5.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect results.

## 26. Required Reason Codes

The diplomacy subsystem MUST define at least:

- `INVALID_DIPLOMATIC_PAIR_REGISTRY`;
- `STARTING_TENSION_MISSING`;
- `UNLEDGERED_TENSION_MUTATION`;
- `CANAL_TENSION_ACCESS_DENIED`;
- `INVALID_WAR_RISK_CONTRACT`;
- `WAR_START_REQUIRES_EXPLICIT_TRIGGER`;
- `ALLIANCE_FORMATION_INELIGIBLE`;
- `ALLIANCE_GOVERNMENT_INCOMPATIBLE`;
- `ALLIED_OPERATIONAL_ACCESS_MISSING`;
- `ALLIANCE_REVOCATION_INELIGIBLE`;
- `ALLIANCE_LOCKED_BY_SHARED_WAR`;
- `SEPARATE_PEACE_INELIGIBLE`;
- `DIPLOMATIC_EVENT_APPLICATION_FAILED`;
- `ACCESS_RIGHT_REQUIRED`;
- `TECHNOLOGY_SALE_INELIGIBLE`; and
- `DIPLOMATIC_STATE_INVARIANT_FAILED`.

## 27. Validation and Acceptance

Automated validation MUST prove that:

1. every unordered active-power pair has exactly one diplomatic pair state;
2. every pair has exactly two directed-attitude records;
3. tension remains an integer within `0..10`;
4. all tension changes use typed effects and immutable ledger entries;
5. tension `7` blocks normal canal access and tension `6` does not;
6. war-risk tension points match the exact declared schedule;
7. tension or war-risk alone never starts war;
8. incident severity contributes exactly 2, 5, 10, 20, or 30 points;
9. alliances form only through explicit accepted contracts and eligibility predicates;
10. alliance formation applies exactly `-2` tension once;
11. qualifying active alliances apply at most one annual `-1` tension effect;
12. base expected support is exactly `7_500` basis points;
13. alliance technology price uses exactly `8_500` basis points and never grants technology;
14. allied operational support requires explicit access;
15. rival reaction applies only to explicitly declared rivals and uses the exact `+1` effects and cap;
16. peacetime revocation uses the declared tension, trust, breach, notice, treaty, and command predicates;
17. shared active war prevents alliance revocation and expiration;
18. separate peace removes only the relevant war participant and reevaluates the wartime lock;
19. alliance is not automatically revoked by separate peace;
20. every access right has a specific mechanical scope;
21. every diplomatic event choice contains explicit typed effects;
22. standard hawkish and dovish profiles use the exact declared confidence, budget, tension, and political-capital values;
23. labels and prose never select event mechanics;
24. multi-effect event choices apply atomically;
25. war entry requires an explicit typed trigger;
26. cooldowns use exact integer months;
27. AI diplomacy uses legal knowledge rather than hidden truth; and
28. identical state, commands, events, content, ruleset, and seeds produce identical relation, tension, alliance, war-risk, event, ledger, and hash results.
