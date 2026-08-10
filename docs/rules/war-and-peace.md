# DESIGN-31: War And Peace

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-31`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. War identity, concurrent participation, side membership, war score, peace eligibility, negotiation, claims, settlement, separate peace, and revolutionary defeat MUST use the explicit values, predicates, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. War Identity

Every war MUST have one immutable `warId` and one authoritative `WarState` containing:

- `warId`;
- war type;
- start campaign month and phase;
- ordered belligerent-side records;
- ordered participant-membership records;
- ordered war-goal records;
- side war-score records;
- national-contribution records;
- blockade relationships;
- ordered peace-track records;
- completed duration months;
- exhaustion references;
- status;
- ruleset and formula versions; and
- aggregate hash.

`warId` MUST remain stable until the war ends. Participant entry, participant exit, alliance changes, separate peace, government change, and side-strength changes MUST NOT replace the war identity.

## 2. War Status

`status` MUST be exactly one of:

- `DECLARED_NOT_ACTIVE`;
- `ACTIVE`;
- `CEASEFIRE`;
- `SETTLEMENT_PENDING`;
- `ENDED`; or
- `INVALIDATED_BY_MIGRATION`.

Only `ACTIVE` wars generate ordinary battle, blockade, merchant-warfare, occupation, and war-exhaustion effects.

## 3. Belligerent Sides

Every war MUST contain at least two `WarSide` records.

Each side MUST contain:

- `warSideId`;
- `warId`;
- stable side ordinal;
- display key;
- ordered participant identifiers;
- coalition war goals;
- side war score;
- side claim pool;
- negotiation policy; and
- side hash.

A participant MUST belong to exactly one side in one war at one time.

The same nation MAY belong to different sides in different wars.

## 4. War Participant Membership

Every nation participating in a war MUST have one `WarParticipantMembership` containing:

- `warParticipantId`;
- `warId`;
- `nationId`;
- `warSideId`;
- entry campaign month and phase;
- exit campaign month and phase or `NONE`;
- entry-cause type and identifier;
- alliance context identifier or `NONE`;
- guarantee context identifier or `NONE`;
- war-goal identifiers;
- national contribution;
- separate-peace eligibility;
- occupation and claim references;
- membership status; and
- record hash.

`membershipStatus` MUST be `PENDING_ENTRY`, `ACTIVE`, `CEASEFIRE`, `EXITED`, or `CAPITULATED`.

Alliance context records why the participant entered or aligned. Alliance membership MUST NOT replace war membership.

## 5. Multiple Concurrent Wars

A nation may participate in at most exactly `3` active wars at one time in the shipped ruleset.

The permitted ruleset range is `1..5`.

Entry into an additional war requires:

- active-war count below the configured maximum;
- a distinct explicit war identity;
- an accepted war-entry command, event, guarantee, alliance call, surprise operation, or scenario effect;
- valid side assignment;
- no same-context allied-and-at-war contradiction;
- explicit objectives or entry rationale; and
- successful access, mobilization, and government validation.

Exceeding the limit MUST fail with `MAXIMUM_CONCURRENT_WARS_REACHED`.

## 6. War Identity Non-Merger

Two wars MUST remain separate unless an explicit `MergeWarsCommand` or typed scenario event is authorized by a canonical merge policy.

Shared participants, shared enemies, alliance entry, simultaneous battles, common geography, or overlapping goals MUST NOT merge war identities automatically.

The shipped ruleset defines no general war-merger policy. Therefore, ordinary runtime war merging is prohibited.

A future merge policy MUST declare:

- source war identifiers;
- target war identifier;
- side mapping;
- participant mapping;
- war-score conversion;
- contribution conversion;
- blockade and occupation mapping;
- peace-track disposition;
- exhaustion disposition;
- claim-pool conversion;
- effective phase; and
- replay migration tests.

An implicit merger MUST fail with `WAR_IDENTITY_MERGER_NOT_AUTHORIZED`.

## 7. Participant Entry

Participant entry MUST use typed effect `JOIN_WAR`.

The effect MUST specify:

- target war;
- joining nation;
- target side;
- entry cause;
- alliance and guarantee context;
- initial war goals;
- surprise state;
- access changes;
- mobilization effects; and
- effective phase.

Entry MUST apply atomically.

A nation already active in the war MUST NOT join twice.

## 8. War Score Scale

Each side's war score MUST be an integer within `-100..100` inclusive from that side's perspective.

For a two-sided war, side scores MUST be exact opposites.

For a war with more than two sides, each side MUST maintain one score against every opposing side through `OpposedWarScore`, while the displayed coalition score is a derived weighted projection.

National contribution MUST remain separate and MUST NOT directly overwrite side score.

## 9. War-Score Sources

War score MAY change only through typed `WarScoreEffect` records from:

- battle outcomes;
- strategic objective outcomes;
- blockade;
- merchant warfare;
- occupation;
- amphibious operations;
- strategic events;
- capitulation; or
- accepted settlement staging.

Every effect MUST contain source, signed score delta, affected side pair, phase, formula, reason code, and pre- and post-score values.

Direct score mutation MUST fail with `UNLEDGERED_WAR_SCORE_MUTATION`.

## 10. Shipped War-Score Values

The shipped result values are:

### Battles

- minor victory: `+2`;
- major victory: `+5`;
- decisive victory: `+10`;
- minor defeat: `-2`;
- major defeat: `-5`;
- decisive defeat: `-10`.

### Objectives

- minor war objective completed: `+3`;
- major war objective completed: `+7`;
- critical war objective completed: `+12`;
- objective lost: exact negative of its completion value.

### Blockade

- established blockade: `+2` per completed month for the blockading side;
- contested blockade: `+1` per completed month;
- broken blockade: no recurring score after break.

### Merchant Warfare

- every `1_000` basis points of opening merchant capacity lost in one month: `+1` to the inflicting side, capped at `+5` per target nation per month.

### Occupation

- occupation of a minor possession: `+3`;
- major possession: `+7`;
- capital or scenario-critical possession: `+15`;
- loss or liberation reverses the current occupation score through a separate effect.

Scenario events MAY supply explicit values. Missing values MUST fail rather than infer from prose.

## 11. National Contribution

Every active participant MUST have non-negative `nationalContributionPoints`.

The shipped contribution points are:

- enemy combat-value loss inflicted: one point per `1_000` canonical combat-value units;
- own war objective completed: objective claim value;
- successful blockade month: `10` points;
- merchant loss inflicted: one point per `1_000` merchant-capacity units;
- possession occupied: its canonical peace claim value;
- allied logistics or operational support: explicit operation-defined points;
- accepted diplomatic contribution: event-defined points.

Contribution points allocate coalition claims but MUST NOT automatically increase side war score unless a separate war-score effect exists.

Negative contribution is prohibited. Penalties affect claim priority through explicit modifiers.

## 12. Peace Track

Every opposing side pair MUST have one `PeaceTrack` containing:

- side identifiers;
- score advantage;
- completed war duration;
- exhaustion values;
- blockade state;
- occupation state;
- strategic-objective state;
- government willingness;
- negotiation cooldown;
- peace eligibility;
- maximum demand value;
- maximum concession value;
- active offer identifiers; and
- track hash.

Peace eligibility MUST be recalculated during `RESOLVE_PEACE_NEGOTIATIONS`.

## 13. Peace Eligibility

Peace eligibility is determined by `peace_eligibility_v1`.

A side may make a normal peace offer when at least one condition holds:

- absolute score advantage is at least `20`;
- either side's highest national war exhaustion is at least `60`;
- war duration is at least `24` completed months;
- an established blockade persisted for at least `6` completed months;
- a critical war objective is completed;
- a typed peace event authorizes negotiation; or
- all active participants on both sides accept a mutual negotiation command.

A side with score advantage below `20` MAY still negotiate through another listed condition.

### Score-Advantage Bands

The shipped demand bands are:

- advantage `0..19`: negotiated or white-peace band, maximum net demand `10` claim points;
- `20..39`: favorable band, maximum net demand `25`;
- `40..59`: strong band, maximum net demand `50`;
- `60..79`: dominant band, maximum net demand `75`;
- `80..100`: overwhelming band, maximum net demand `100`.

This is the concrete meaning of a large score advantage increasing peace eligibility and demand capacity.

## 14. Peace Offer

Every peace proposal MUST be an explicit immutable `PeaceOffer` containing:

- `peaceOfferId`;
- target war and side pair;
- proposing participant and authority;
- receiving participants;
- creation and expiration months;
- offered term identifiers;
- total demand and concession values;
- net demand value;
- claimant-allocation records;
- acceptance-threshold calculation;
- political consequence preview;
- validation result;
- status;
- command and event references; and
- offer hash.

`status` MUST be `DRAFT`, `VALIDATED`, `PRESENTED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `WITHDRAWN`, or `SUPERSEDED`.

Narrative dialogue MUST NOT create or alter settlement terms.

## 15. Peace Offer Acceptance

The receiving side's acceptance threshold MUST use `peace_acceptance_v1`:

`acceptanceScore = scorePressure + exhaustionPressure + blockadePressure + occupationPressure + objectivePressure + governmentModifier + allianceModifier + eventModifier - netDemandValue`

The shipped components are:

- score pressure: absolute adverse score advantage;
- exhaustion pressure: highest national exhaustion divided by `2`, rounded down;
- established blockade: `+15`;
- contested blockade: `+5`;
- occupied capital or critical possession: `+20` each, capped at `40`;
- failed critical objective: `+10`;
- government modifier: explicit within `-20..20`;
- alliance modifier: explicit within `-20..20`;
- event modifier: explicit within `-30..30`.

Acceptance is eligible when `acceptanceScore >= 50`.

AI acceptance uses legal knowledge and the same formula. The player chooses through an explicit decision when authorized.

## 16. Player Peace Choices

A player-facing peace decision MUST offer only validated options.

The player may:

- accept;
- reject;
- counteroffer;
- spend political capital on one listed negotiation option; or
- delegate to government policy.

The shipped political-capital options are:

- increase maximum acceptable net demand by `5` claim points: cost `5` political capital;
- protect one priority claim from ally displacement: cost `4`;
- reduce rejection confidence penalty by `1`: cost `1`;
- request a three-month negotiation extension: cost `2`.

Each option may be used at most once per negotiation round.

Player choice MUST NOT directly alter war score or fabricate settlement value.

## 17. Political Consequences of Peace Choice

Every offer MUST declare consequence records for acceptance, rejection, and counteroffer.

The shipped defaults, used only when explicitly referenced, are:

- accept white peace at score disadvantage or parity: confidence `0`;
- accept favorable peace: confidence `+2`;
- accept dominant peace: confidence `+4`;
- reject offer while exhaustion is at least `80`: confidence `-2` and domestic unrest `+2`;
- reject offer while capital is occupied: confidence `-3`;
- reject favorable enemy concession without a critical unmet objective: confidence `-1`;
- accepted harsh defeat: confidence `-5`, before revolutionary modifiers.

No political effect is inferred from choice text.

## 18. Settlement Terms

The canonical settlement term types are:

- `ADJUST_BASE_RESOURCES`;
- `TRANSFER_POSSESSION_OWNERSHIP`;
- `RECOGNIZE_OCCUPATION`;
- `TRANSFER_SHIP`;
- `REPARATIONS`;
- `SHIPBUILDING_RESTRICTION`;
- `CREATE_TREATY_OBLIGATION`;
- `END_OR_MODIFY_WAR_PARTICIPATION`;
- `RELEASE_OCCUPATION`;
- `DEMILITARIZE_POSSESSION`; and
- `EXPLICIT_SCENARIO_TERM`.

Every term MUST contain typed parameters, claim value, eligibility, validation, application order, rollback behavior, and result schema.

## 19. Term Claim Values

Claim values use non-negative integer points.

The shipped conversion policies are:

- base-resource adjustment: `1` claim point per `1_000_000` currency micro-units;
- possession transfer: canonical possession peace value;
- occupation recognition: `75%` of possession peace value, rounded up;
- ship transfer: `1` point per `1_000` tonnes of true displacement plus `1` point per `10` combat-value units, rounded up;
- reparations: `1` point per `1_000_000` total currency micro-units;
- shipbuilding restriction: policy-defined `5..30` points by severity and duration;
- treaty obligation: clause-defined value;
- demilitarization: possession or force policy-defined value.

A term with missing valuation MUST fail with `SETTLEMENT_TERM_VALUE_MISSING`.

## 20. Resource Adjustment

`ADJUST_BASE_RESOURCES` MUST specify a signed currency micro-unit delta and beneficiary or payer.

The resulting base resources MUST remain non-negative.

The effect is permanent and applies atomically under `DESIGN-13`.

A claim-value conversion MUST NOT be interpreted as the settlement amount. The exact term contains both.

## 21. Possession Transfer and Occupation Recognition

`TRANSFER_POSSESSION_OWNERSHIP` changes legal ownership under `DESIGN-15`.

It MUST explicitly declare military-control and occupier dispositions.

`RECOGNIZE_OCCUPATION` may:

- preserve legal ownership and acknowledge temporary control;
- convert occupation into legal ownership only when the term explicitly includes ownership transfer; or
- impose a timed administration or plebiscite process.

Occupation alone MUST NOT imply ownership transfer.

## 22. Ship Transfer

A ship-transfer term MUST identify exact ships and validate:

- current legal owner;
- physical survival and custody;
- no conflicting treaty disposal;
- recipient technology and infrastructure compatibility;
- crew and inventory disposition;
- defects and damage persistence;
- design-artifact transfer;
- classification; and
- delivery location.

Transfer MUST atomically update title, custody, nation ownership, location, design access, defects, inventory, and ledger or claim records.

A ship MUST NOT exist in both fleets.

## 23. Reparations

A reparations term MUST contain:

- payer and recipient;
- total amount;
- payment frequency;
- installment amount;
- first and final payment months;
- priority tier;
- arrear policy;
- default consequences; and
- term hash.

The shipped maximum duration is `120` completed months.

Reparations MUST use balanced ledger postings. Unpaid amounts become arrears only under the term's explicit policy.

## 24. Shipbuilding Restrictions and Treaty Obligations

A shipbuilding restriction MUST compile into explicit treaty clauses under `DESIGN-30`.

It MUST declare:

- affected categories;
- displacement and caliber limits;
- construction holidays;
- rebuild restrictions;
- disposal requirements;
- inspections;
- effective and expiration months; and
- violation consequences.

A generic `limit navy` term is invalid.

Treaty obligations MUST create a complete treaty or join an existing compatible treaty through typed effects.

## 25. Settlement Validation

Before acceptance, the complete settlement MUST validate:

- total net demand does not exceed the peace track's maximum;
- every term is eligible and valued;
- no possession or ship is transferred twice;
- legal owner and controller dispositions are consistent;
- resource values remain non-negative;
- reparations schedules are valid;
- restrictions compile into valid treaty clauses;
- war-participant exits preserve valid side structure;
- alliance-war contradictions do not remain;
- successor-state content exists where required;
- claim allocations do not exceed participant claim shares; and
- all cross-domain invariants pass.

Failure MUST reject the complete settlement with `SETTLEMENT_VALIDATION_FAILED`.

## 26. Atomic Settlement Application

Accepted settlement terms MUST apply in this order:

1. freeze war operations and create settlement transaction;
2. validate final pre-state hashes;
3. resolve participant exits and ceasefire state;
4. transfer legal possession ownership and control;
5. transfer ships;
6. apply base-resource changes;
7. create reparations obligations;
8. create restrictions and treaty obligations;
9. release or recognize occupation;
10. recalculate claims, alliances, access, blockade, objectives, and exhaustion;
11. validate all aggregates;
12. commit one post-settlement snapshot; and
13. end or continue the war as declared.

Failure of any step MUST roll back every settlement effect and emit `SETTLEMENT_APPLICATION_FAILED`.

## 27. Coalition Claim Pools

Each winning or advantaged side MUST have one side claim pool equal to the maximum net demand value permitted by Section 13 or another explicit event.

Participant allocation uses `coalition_claim_allocation_v1`.

For each participant:

`rawClaimWeight = contributionPoints + objectiveClaimPoints + negotiatedPriorityPoints`

The shipped negotiated priority range is `0..25` points per participant.

Participants with zero total weight receive zero initial claim share.

## 28. Claim Allocation

Claim points MUST be allocated proportionally by exact largest-remainder allocation:

1. calculate each participant's rational share of the side claim pool;
2. assign the floor;
3. rank by fractional remainder descending;
4. tie-break by contribution points descending;
5. then objective claim points descending;
6. then participant identifier ascending; and
7. distribute remaining points.

The final allocated sum MUST equal the side claim pool exactly.

Allies MUST NOT receive claims based only on member count or display order.

## 29. Objective and Negotiated Priority

Objective claim points come only from explicit national or war objectives tied to settlement terms.

Negotiated priority may be changed only through:

- a validated coalition negotiation command;
- political-capital option under Section 16;
- treaty or alliance priority rule; or
- typed event.

Priority changes MUST NOT alter contribution history.

## 30. Unused Claim Value

After all accepted terms are assigned, each participant may have unused allocated claim points.

The shipped conversion is:

`baseResourceGain = unusedClaimPoints * 250_000` currency micro-units.

This equals `250_000` currency micro-units per unused claim point and is smaller than the ordinary valuation of `1_000_000` micro-units per claim point.

The maximum convertable unused value is exactly `25` claim points per participant.

Points above `25` expire with no gain unless a scenario settlement policy explicitly provides another disposition.

Conversion MUST use typed `ADJUST_BASE_RESOURCES`, balanced settlement records, and no randomness.

## 31. Separate Peace Eligibility

An individual participant may seek separate peace when all predicates hold:

- participant has been active in the war for at least `6` completed months;
- no alliance wartime lock prohibits unilateral negotiation, or the alliance contract explicitly permits separate peace;
- participant exhaustion is at least `60`, participant contribution share is below `2_500` basis points, government or revolution policy authorizes it, or a typed event permits it;
- participant is not the sole remaining member of its side unless the offer ends the entire war;
- occupation and claim dispositions can be made valid; and
- a complete separate-peace offer exists.

The shipped negotiation cooldown is `6` completed months after a rejected separate-peace offer.

## 32. Separate Peace Application

An accepted separate peace MUST:

- remove only the specified participant from the specified war;
- preserve the war identity for remaining participants;
- set the participant exit month and cause;
- settle that participant's war goals and claims;
- recalculate side membership and war scores;
- recalculate access rights;
- recalculate blockade relationships;
- resolve or preserve occupation explicitly;
- update alliance wartime locks;
- apply diplomatic and political consequences; and
- validate that no nation is allied with and at war against the same nation in the same relation context.

The alliance itself is not automatically revoked. Diplomacy applies `DESIGN-17`.

An invalid post-exit side or relation state MUST roll back the separate peace with `SEPARATE_PEACE_STATE_INVALID`.

## 33. War End

A war ends when:

- an accepted settlement explicitly ends it;
- every participant on one side has exited or capitulated and a terminal settlement resolves remaining claims;
- a scenario event ends it; or
- a supported revolutionary outcome and settlement end it.

War score alone MUST NOT end a war.

At war end, the system MUST finalize:

- participant exit dates;
- war score;
- national contributions;
- claims;
- occupations;
- blockade relationships;
- exhaustion recovery records;
- objective outcomes;
- reparations and treaties;
- political effects; and
- immutable war history.

## 34. Revolutionary Defeat Eligibility

A revolutionary defeat peace context exists only when all predicates hold:

- a successful revolution outcome under `DESIGN-18` explicitly selects `SEEK_SEPARATE_PEACE` or `EXIT_BY_TYPED_SETTLEMENT`;
- the revolutionary nation has adverse war score of at least `40` points, or an occupied capital, or war exhaustion at least `80`;
- the outcome references policy `revolutionary_defeat_peace_v1`;
- a valid peace track and settlement authority exist; and
- required successor or continuation state is canonical.

Revolution alone MUST NOT create harsh terms.

## 35. Revolutionary Harsh-Term Capacity

Under `revolutionary_defeat_peace_v1`, the opposing side's maximum net demand increases by:

- adverse score `40..59`: `+10` claim points;
- `60..79`: `+20`;
- `80..100`: `+30`;
- occupied capital: additional `+15`;
- war exhaustion `80..100`: additional `+10`.

The total revolutionary harsh-term bonus is capped at exactly `40` claim points.

The final net demand remains capped at `100` claim points unless a scenario-specific terminal-defeat contract explicitly permits more.

## 36. Revolutionary Settlement

A revolutionary settlement MUST use the normal `PeaceOffer`, term validation, claim allocation, and atomic application contracts.

It MAY contain only validated terms from Section 18 and explicit successor-state terms.

It MUST NOT:

- transfer ownership without a term;
- remove war participation without a term;
- alter government outside the resolved revolution effect;
- invent a successor state;
- confiscate resources without an exact term;
- create reparations without a schedule; or
- bypass claim valuation and atomic validation.

A failed revolutionary settlement leaves the war and revolution result at the last committed state and emits `REVOLUTIONARY_SETTLEMENT_FAILED`.

## 37. Successor States

A peace settlement that creates or recognizes a successor state MUST reference complete canonical identity and continuity content defining:

- country identity;
- scenario nation instance;
- playable-slot relationship;
- government;
- territory;
- military control;
- economy;
- diplomacy;
- war participation;
- fleet and ship ownership;
- officers and personnel;
- objectives;
- treaties; and
- continuity behavior.

Runtime generation of a successor from names, ideology, possessions, or history is prohibited.

## 38. Records and Audit

Every war-relevant mutation MUST append an immutable record to the war ledger.

The ledger MUST include:

- war creation;
- side and participant membership;
- entry and exit;
- score effects;
- contribution effects;
- peace eligibility;
- offers and choices;
- claim allocation;
- settlement validation;
- settlement application;
- separate peace;
- revolutionary context; and
- war end.

Each record MUST contain cause, phase, versions, input and output hashes, and reason codes.

## 39. Canonical Ordering

War and peace resolution MUST order:

1. wars by `warId`;
2. sides by side ordinal;
3. participants by identifier;
4. score effects by phase and cause identifier;
5. peace tracks by opposing side identifiers;
6. offers by creation month and offer identifier;
7. terms by application ordinal and term identifier;
8. claimants by Section 28; and
9. settlement records by transaction order.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect outcomes.

## 40. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_WAR_STATE`;
- `INVALID_WAR_SIDE`;
- `INVALID_WAR_PARTICIPANT_MEMBERSHIP`;
- `MAXIMUM_CONCURRENT_WARS_REACHED`;
- `WAR_IDENTITY_MERGER_NOT_AUTHORIZED`;
- `WAR_PARTICIPANT_ALREADY_ACTIVE`;
- `UNLEDGERED_WAR_SCORE_MUTATION`;
- `PEACE_NEGOTIATION_INELIGIBLE`;
- `PEACE_OFFER_INVALID`;
- `PEACE_OFFER_REJECTED`;
- `SETTLEMENT_TERM_VALUE_MISSING`;
- `SETTLEMENT_VALIDATION_FAILED`;
- `SETTLEMENT_APPLICATION_FAILED`;
- `COALITION_CLAIM_ALLOCATION_FAILED`;
- `SEPARATE_PEACE_INELIGIBLE`;
- `SEPARATE_PEACE_STATE_INVALID`;
- `REVOLUTIONARY_DEFEAT_CONTEXT_INELIGIBLE`;
- `REVOLUTIONARY_SETTLEMENT_FAILED`;
- `SUCCESSOR_STATE_CONTENT_MISSING`; and
- `WAR_AND_PEACE_INVARIANT_FAILED`.

## 41. Validation and Acceptance

Automated validation MUST prove that:

1. every war has stable identity, sides, participants, goals, score, contribution, blockade, peace, duration, and exhaustion state;
2. participant membership records exact war, side, alliance, guarantee, entry, exit, and objective context;
3. a nation participates in at most three active wars in the shipped ruleset;
4. wars do not merge because of shared participants, enemies, alliances, geography, or goals;
5. the shipped ruleset has no general runtime war merger;
6. each participant belongs to exactly one side per war;
7. war score remains within -100 through 100 and uses typed effects;
8. national contribution remains separate from side score;
9. battle, objective, blockade, merchant, and occupation scores use the exact shipped values;
10. peace eligibility uses exact score, exhaustion, duration, blockade, objective, event, and mutual-command predicates;
11. score bands provide exact 10, 25, 50, 75, and 100 net-demand caps;
12. every peace offer is an explicit negotiation object with validated terms and consequences;
13. acceptance uses the exact score, exhaustion, blockade, occupation, objective, government, alliance, event, and demand formula;
14. the acceptance threshold is exactly 50;
15. player political-capital options use exact costs and effects;
16. political consequences are typed and not inferred from dialogue;
17. settlement supports every canonical term type through complete typed parameters;
18. claim values use exact conversion policies;
19. possession transfer separates legal ownership, control, and occupation;
20. ship transfer is atomic and cannot duplicate a ship;
21. reparations use exact schedules and balanced postings;
22. restrictions compile into complete treaty clauses;
23. complete settlement validation occurs before application;
24. all settlement terms apply atomically in the exact declared order;
25. coalition claims use contribution, objectives, and negotiated priority;
26. largest-remainder allocation preserves the exact claim pool;
27. unused claims convert at exactly 250,000 currency micro-units per point, capped at 25 points;
28. separate peace removes only the specified participant and preserves the war identity;
29. separate peace recalculates sides, access, blockade, occupation, alliance locks, and political effects;
30. war score alone never ends a war;
31. revolutionary harsh terms require explicit revolution, adverse-war, exhaustion or occupation, peace-track, and policy predicates;
32. revolutionary harsh-term bonuses use exact 10, 20, 30, 15, and 10 point values with a 40-point cap;
33. revolutionary settlements use normal offer, valuation, validation, claim, and atomic settlement contracts;
34. successor states require complete canonical content; and
35. identical state, commands, events, content, ruleset, offers, and seeds produce identical war, score, contribution, peace, claim, settlement, ledger, and hash results.
