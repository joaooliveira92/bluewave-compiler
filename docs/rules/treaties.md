# DESIGN-30: Treaties

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-30`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Treaty signing, clause application, construction disposal, completed-ship retention, modernization, government compliance, declared displacement, inspection, detection, violation, and settlement MUST use the explicit values, predicates, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Treaty State

Every treaty MUST have one authoritative `TreatyState` containing:

- `treatyId`;
- ordered party nation identifiers;
- signing campaign month;
- effective campaign month;
- expiration campaign month or `NONE`;
- ordered clause identifiers;
- inspection-policy identifier;
- compliance-ledger position;
- violation-state records by party;
- suspension and termination state;
- content, ruleset, and formula versions; and
- aggregate hash.

A treaty requires at least two parties.

## 2. Treaty Status

`status` MUST be exactly one of:

- `NEGOTIATING`;
- `SIGNED_NOT_EFFECTIVE`;
- `ACTIVE`;
- `SUSPENDED`;
- `EXPIRED`;
- `TERMINATED`; or
- `COLLAPSED`.

Only an `ACTIVE` treaty applies ordinary compliance clauses unless a clause explicitly applies during another status.

## 3. Clause Types

The canonical clause types are:

- `NEW_CONSTRUCTION_DISPLACEMENT_LIMIT`;
- `MAIN_CALIBER_LIMIT`;
- `TOTAL_TONNAGE_LIMIT`;
- `CATEGORY_TONNAGE_LIMIT`;
- `CARRIER_CONVERSION_LIMIT`;
- `REPLACEMENT_AGE`;
- `SCRAPPING_REQUIREMENT`;
- `CONSTRUCTION_HOLIDAY`;
- `INSPECTION`; and
- `DECLARED_DISPLACEMENT_RULE`.

Every clause MUST have a stable identifier, typed parameters, effective dates, applicability predicate, validation phases, violation severity, cure policy, and content hash.

Clause prose MUST NOT determine mechanics.

## 4. Canonical Treaty Values

Treaty mass limits MUST use kilograms. Gun-caliber limits MUST use micrometres. Tonnage allocations MUST use kilograms. Dates MUST use integer campaign months.

All comparisons MUST use authoritative unrounded values under `DESIGN-07`.

Declared displacement is a separate value and MUST NOT replace true compiled displacement in design, construction, damage, dockyard, cost, or tactical formulas.

## 5. Treaty Signing Validation

Before signing, the system MUST create a `TreatySigningAssessment` containing:

- all affected completed ships;
- all affected construction, rebuild, and conversion projects;
- true and proposed declared displacement values;
- category totals;
- replacement-age results;
- required disposal actions;
- grace periods;
- inspection schedule;
- government compliance policy; and
- assessment hash.

Signing MUST fail when the treaty text lacks a disposition for an already existing noncompliant asset or project.

## 6. Under-Construction Ship Disposition

Every noncompliant ship under construction at signing MUST receive exactly one clause-defined disposition:

- `CANCEL_IMMEDIATELY`;
- `COMPLETE_THEN_SCRAP`;
- `SCRAP_INCOMPLETE_HULL`;
- `MODIFY_TO_COMPLY`;
- `GRANDFATHER_TO_COMPLETION`;
- `TRANSFER_TO_NON_PARTY`, when an explicit treaty clause permits it; or
- `SUSPEND_PENDING_DECISION` for no more than the clause's exact decision period.

The treaty MUST identify the disposition for each affected project or a deterministic predicate selecting one.

Missing disposition MUST fail signing with `TREATY_PROJECT_DISPOSITION_MISSING`.

### 6.1 Cancel Immediately

`CANCEL_IMMEDIATELY` MUST:

- cancel future work;
- release future capacity;
- settle reservations and contracts;
- preserve completed physical work as an incomplete-hull asset until disposal; and
- create no automatic salvage unless a disposal policy grants it.

### 6.2 Scrap Incomplete Hull

`SCRAP_INCOMPLETE_HULL` MUST create a scrapping project under `DESIGN-23`.

The shipped treaty-scrap salvage multiplier is `5_000` basis points of ordinary salvage credit.

### 6.3 Modify to Comply

`MODIFY_TO_COMPLY` requires:

- a new design draft and compiled design version;
- classification validation;
- treaty validation;
- dock and capacity validation;
- explicit change-order work and cost; and
- completion before the treaty deadline.

The implementation MUST NOT lower displacement, caliber, or quantity fields without recompilation.

### 6.4 Grandfather to Completion

`GRANDFATHER_TO_COMPLETION` is valid only when the clause explicitly grants it and states whether the completed ship counts toward category and total tonnage limits.

## 7. Existing Completed Ships

A completed ship existing at treaty signature remains legal only when one of these explicit dispositions applies:

- `GRANDFATHERED_IN_SERVICE`;
- `RETAIN_UNTIL_REPLACEMENT_AGE`;
- `RETAIN_WITH_MODERNIZATION_LIMITS`;
- `MOVE_TO_RESERVE`;
- `DEMILITARIZE`;
- `CONVERT_TO_ALLOWED_CATEGORY`;
- `SCRAP_BY_DEADLINE`; or
- `TRANSFER_BY_TREATY_TERM`.

The shipped default for a completed ship not violating a disposal clause is `GRANDFATHERED_IN_SERVICE`.

There is no default for a ship explicitly caught by a scrapping, category-tonnage, or replacement-age clause. The treaty MUST supply a disposition.

A completed ship MUST NOT be scrapped, demilitarized, converted, or transferred solely because it exceeds a new-construction limit.

## 8. Disposal Deadlines

Every mandatory disposal disposition MUST specify an exact campaign-month deadline.

At deadline compliance:

- `SCRAP_BY_DEADLINE` requires operational status `SCRAPPING` or `SCRAPPED` according to the clause;
- `DEMILITARIZE` requires every prohibited weapon and system package removed;
- `CONVERT_TO_ALLOWED_CATEGORY` requires the new compiled version and classification committed;
- `TRANSFER_BY_TREATY_TERM` requires atomic title and custody transfer; and
- `MOVE_TO_RESERVE` requires readiness `RESERVE` or `MOTHBALLED`.

Missing deadline MUST fail treaty validation with `TREATY_DISPOSAL_DEADLINE_MISSING`.

## 9. Modernization and Rebuild

Existing ships MAY be modernized only through an accepted rebuild or equipment-installation project under `DESIGN-23`.

Every modernization MUST validate:

- true post-rebuild displacement;
- declared displacement when a declaration clause applies;
- main-caliber limit;
- category and total tonnage;
- carrier-conversion limit;
- replacement-age restrictions;
- rebuild work-package restrictions;
- classification under `DESIGN-22`;
- dock and technology requirements; and
- inspection requirements.

The shipped treaty rebuild limits are:

- true standard displacement increase: no more than `1_000` basis points, equal to `10%`, unless the treaty supplies a narrower value;
- main-gun caliber increase: `0` micrometres;
- number of main-gun barrels: may not increase unless explicitly permitted;
- carrier conversion: prohibited unless a carrier-conversion clause authorizes it;
- category change: prohibited unless the treaty explicitly permits conversion.

A modernization crossing any limit MUST be rejected with `TREATY_REBUILD_PROHIBITED`.

## 10. Government Compliance Policies

Every government type MUST reference one `TreatyCompliancePolicy`.

The shipped policies are:

- `liberal_democracy`: `STRICT`;
- `limited_democracy`: `STRICT`;
- `autocratic`: `DECLARATION_DECEPTION_ELIGIBLE`;
- `fascist`: `DECLARATION_DECEPTION_ELIGIBLE`;
- `communist`: `DECLARATION_DECEPTION_ELIGIBLE`;
- `eastern`: `DECLARATION_DECEPTION_ELIGIBLE`.

`STRICT` prohibits deliberate false declaration of displacement and caliber.

`DECLARATION_DECEPTION_ELIGIBLE` permits displacement deception only when:

- the treaty contains a `DECLARED_DISPLACEMENT_RULE`;
- the treaty or scenario does not prohibit deception;
- government policy authorizes deception;
- an accepted declaration command provides true and declared values; and
- the declared value remains within Section 11.

A scenario override MAY replace the government policy only through an explicit `TreatyComplianceOverride` naming government, scenario, treaty scope, permitted behaviors, effective dates, and content hash.

Missing policy MUST fail with `TREATY_COMPLIANCE_POLICY_MISSING`.

## 11. Declared Displacement

For a government eligible to deceive, declared displacement MAY be lower than true standard displacement by at most exactly `1_000` basis points, equal to `10%`.

The permitted formula is:

`minimumDeclaredDisplacementKg = ceiling(trueStandardDisplacementKg * 9_000 / 10_000)`

The declared value MUST satisfy:

`minimumDeclaredDisplacementKg <= declaredDisplacementKg <= trueStandardDisplacementKg`

A declaration exactly `10%` below true displacement is legal when ceiling rounding is respected.

Over-declaration is permitted only when the treaty clause explicitly allows it. The shipped policy prohibits over-declaration.

A value outside the permitted interval MUST be rejected with `DECLARED_DISPLACEMENT_OUT_OF_RANGE`.

## 12. Main-Caliber Declaration

Declared main caliber MUST equal true compiled maximum main-gun caliber exactly.

The permitted caliber-deception amount is exactly `0` micrometres.

No government, event, scenario, treaty, AI policy, or difficulty profile may permit main-caliber cheating under this contract.

A false caliber statement MUST fail before submission with `MAIN_CALIBER_DECEPTION_PROHIBITED`.

If external false information appears through an intelligence report, it remains a knowledge assertion and MUST NOT become an accepted treaty declaration.

## 13. True and Declared Values

Every treaty-regulated ship MUST have one `TreatyDeclarationRecord` containing:

- ship or project identifier;
- treaty identifier;
- true standard displacement;
- declared displacement;
- true maximum main caliber;
- declared maximum main caliber;
- effective declaration month;
- authorizing government policy;
- deception amount and basis points;
- inspection state;
- detection state;
- declaration command identifier;
- ruleset and formula versions; and
- record hash.

True values remain authoritative for all non-declaration mechanics.

## 14. Category and Total Tonnage

Treaty tonnage calculations MUST declare whether they use true or declared displacement.

The shipped rule is:

- public compliance ledger uses declared displacement when the treaty contains an active declaration clause;
- hidden authoritative compliance analysis stores both true and declared totals;
- design, cost, construction, dock, classification, combat, and physical-state calculations always use true values.

Each ship MUST count in exactly one treaty category under the treaty's category-mapping policy.

## 15. Inspection

Every inspection policy MUST declare:

- inspection authority;
- inspection frequency;
- eligible assets and facilities;
- notice period;
- access requirements;
- measured attributes;
- measurement error;
- deception-detection formula;
- obstruction behavior;
- violation mapping; and
- follow-up schedule.

The shipped routine inspection frequency is once every `12` completed months for active regulated projects and once every `24` months for completed regulated ships.

A treaty MAY specify more frequent exact intervals.

## 16. Detection of Displacement Deception

The shipped `treaty_displacement_detection_v1` probability is:

`detectionProbabilityBp = clamp(0, 10_000, baseInspectionBp + intelligenceBp + declarationGapBp + constructionVisibilityBp + documentEvidenceBp - concealmentBp)`

Shipped components are:

- routine inspection base: `2_000` basis points;
- intrusive inspection base: `5_000`;
- intelligence capability `0..100`: `capability * 25` basis points;
- declaration gap: `floor(deceptionBp * 3)`;
- visible construction or trials: `1_000`;
- captured documents: `3_000`;
- authorized concealment policy: up to `2_000` reduction.

The check MUST use stream:

`treaty/inspection/party/ship/deception_detection`

A declaration with zero deception gap requires no deception-detection check.

## 17. Inspection Obstruction

Obstruction requires an accepted government command or typed event and MUST create one explicit outcome:

- `INSPECTION_DELAYED`;
- `INSPECTION_DENIED`;
- `LIMITED_ACCESS_GRANTED`;
- `INSPECTION_COMPLETED`; or
- `TREATY_WITHDRAWAL_TRIGGERED`.

The shipped immediate effects of denied inspection are:

- violation severity `MAJOR`;
- bilateral tension `+2` with every inspecting party;
- institutional confidence change: government-event defined;
- follow-up deadline: `3` completed months.

Obstruction does not erase evidence or declaration records.

## 18. Compliance Validation Phases

Treaty validation MUST occur at:

1. design approval;
2. construction order;
3. rebuild or conversion approval;
4. treaty signing;
5. monthly `RESOLVE_COMPLIANCE`;
6. ship completion;
7. required disposal deadline;
8. inspection completion; and
9. save-load invariant validation.

Each validation MUST record true and declared operands, comparison operators, applicable clauses, result, and reason codes.

## 19. Violation Severity

Treaty violation severity MUST be exactly one of:

- `TECHNICAL`;
- `MINOR`;
- `MAJOR`;
- `GRAVE`.

The shipped mappings are:

- reporting error cured within one month: `TECHNICAL`;
- small declared-tonnage discrepancy within legal deception bounds but improperly documented: `MINOR`;
- construction, rebuild, tonnage, inspection, or disposal noncompliance: `MAJOR`;
- prohibited caliber deception, repeated major violation, or deliberate uncured excess above legal declaration bounds: `GRAVE`.

Main-caliber deception is always `GRAVE` if external corruption or invalid content somehow introduces it.

## 20. Violation State

Every party-treaty pair MUST have one `TreatyViolationState` containing:

- treaty and party identifiers;
- current severity or `NONE`;
- ordered violation records;
- cure deadline or `NONE`;
- forced-disposal requirements;
- diplomatic-crisis state;
- confidence effects;
- tension effects;
- treaty-collapse pressure;
- status; and
- state hash.

`status` MUST be `COMPLIANT`, `UNDER_REVIEW`, `VIOLATING`, `CURING`, `SANCTIONED`, or `RESOLVED`.

## 21. Detection Consequences

A confirmed deception or violation MUST apply only explicit typed effects from the clause or `treaty_violation_consequences_v1`.

The shipped effects are:

### Minor

- tension `+1` with affected treaty parties;
- cure deadline `6` months;
- institutional confidence `-1` for a player nation when publicly exposed.

### Major

- tension `+2`;
- cure deadline `3` months;
- institutional confidence `-3`;
- mandatory correction, cancellation, or disposal project;
- treaty-collapse pressure `+25` points.

### Grave

- tension `+3`;
- institutional confidence `-5`;
- immediate forced-disposal evaluation;
- treaty-collapse pressure `+50` points;
- diplomatic crisis event `grave_treaty_violation_v1`.

Consequences apply once per violation record, not monthly, unless a persistent-violation policy explicitly adds recurring effects.

## 22. Forced Scrapping

Forced scrapping MUST create a mandatory `ScrapShipCommand` and project under `DESIGN-23`.

The order MUST specify:

- affected ship;
- deadline;
- operational restrictions before disposal;
- salvage multiplier;
- inspection requirements;
- failure consequences; and
- completion proof.

The system MUST NOT silently delete or instantly scrap the ship.

The shipped forced-scrap salvage multiplier is `2_500` basis points of ordinary salvage.

## 23. Treaty Collapse

Treaty-collapse pressure uses `0..100`.

At pressure `100`, the system MUST enqueue `treaty_collapse_crisis_v1`. The treaty does not collapse until the event or an explicit party-withdrawal contract applies typed effect `COLLAPSE_TREATY`.

A major or grave violation MUST NOT silently collapse the treaty.

Collapse MUST explicitly settle:

- construction restrictions;
- tonnage limits;
- disposal orders already in progress;
- inspection rights;
- declarations;
- sanctions;
- diplomatic effects; and
- persistence history.

## 24. Construction Holiday

A construction-holiday clause MUST define:

- prohibited project types;
- affected categories;
- start and end months;
- grandfathered projects;
- permitted repair and rebuild work;
- cancellation or suspension behavior; and
- violation mapping.

A missing disposition for an existing project MUST fail signing.

## 25. Replacement Age

Replacement age MUST be measured in exact completed months from commissioning.

A replacement-age clause MUST state:

- minimum age;
- categories;
- replacement authorization timing;
- early-loss exceptions;
- rebuild age-reset rule; and
- disposal requirements.

The shipped rebuild rule does not reset commissioning age.

## 26. Carrier Conversion

A carrier-conversion clause MUST specify:

- eligible source categories;
- maximum number of conversions;
- true displacement limit;
- aircraft-capacity limit;
- conversion deadline;
- tonnage accounting; and
- inspection requirements.

A conversion without an explicit active clause MUST fail with `TREATY_CARRIER_CONVERSION_PROHIBITED`.

## 27. Compliance Ledger

Every treaty-relevant action and validation MUST append one immutable `TreatyComplianceLedgerEntry` containing:

- entry identifier;
- treaty, party, clause, ship, project, or category identifiers;
- campaign month and phase;
- action or validation type;
- true operands;
- declared operands;
- predicates and operators;
- result;
- violation severity or `NONE`;
- cure and consequence references;
- cause identifier;
- versions; and
- record hash.

The ledger MUST be append-only and included in treaty aggregate hashing.

## 28. Government and AI Behavior

Government and AI treaty behavior MUST use normal commands and legal knowledge.

`STRICT` governments MUST reject deliberate deceptive declaration commands before reservation.

Deception-eligible governments MAY choose legal displacement deception through AI policy, but MUST NOT exceed the exact 10% bound or misdeclare caliber.

Difficulty settings MUST NOT grant hidden treaty legality or modify physical ship values.

## 29. Canonical Ordering

Treaty resolution MUST order:

1. treaties by identifier;
2. clauses by clause ordinal and identifier;
3. parties by identifier;
4. projects and ships by identifier;
5. validations by phase order;
6. inspections by scheduled month and inspection identifier;
7. violations by severity descending and violation identifier; and
8. consequences by declared effect ordinal.

Database insertion order, localized text, UI order, and wall-clock time MUST NOT affect results.

## 30. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_TREATY_STATE`;
- `INVALID_TREATY_CLAUSE`;
- `TREATY_PROJECT_DISPOSITION_MISSING`;
- `TREATY_COMPLETED_SHIP_DISPOSITION_MISSING`;
- `TREATY_DISPOSAL_DEADLINE_MISSING`;
- `TREATY_REBUILD_PROHIBITED`;
- `TREATY_COMPLIANCE_POLICY_MISSING`;
- `DECLARED_DISPLACEMENT_OUT_OF_RANGE`;
- `MAIN_CALIBER_DECEPTION_PROHIBITED`;
- `TREATY_TONNAGE_LIMIT_EXCEEDED`;
- `TREATY_INSPECTION_REQUIRED`;
- `TREATY_INSPECTION_OBSTRUCTED`;
- `TREATY_DECEPTION_DETECTED`;
- `TREATY_VIOLATION_CREATED`;
- `TREATY_CURE_DEADLINE_MISSED`;
- `TREATY_FORCED_SCRAPPING_REQUIRED`;
- `TREATY_CARRIER_CONVERSION_PROHIBITED`;
- `TREATY_COLLAPSE_EVENT_REQUIRED`; and
- `TREATY_STATE_INVARIANT_FAILED`.

## 31. Validation and Acceptance

Automated validation MUST prove that:

1. every treaty has parties, dates, clauses, inspection, ledger, and violation state;
2. every noncompliant construction project receives exactly one explicit signing disposition;
3. missing project disposition blocks treaty signing;
4. cancelled and scrapped incomplete hulls use explicit project and salvage settlement;
5. modify-to-comply creates a new compiled design and work order;
6. completed ships remain only under an explicit retention or disposal disposition;
7. new-construction limits alone do not scrap existing ships;
8. every disposal action has an exact deadline and compliance state;
9. modernization uses rebuild validation and exact 10% displacement, zero-caliber-increase, barrel, conversion, and category rules;
10. liberal and limited democracies use strict compliance in the shipped policy;
11. other canonical governments are displacement-deception eligible only under explicit treaty and government authorization;
12. a scenario override is explicit, scoped, dated, and hashed;
13. declared displacement is no lower than exactly 90% of true displacement;
14. equality at the 10% understatement bound is legal with ceiling rounding;
15. over-declaration is prohibited in the shipped policy;
16. declared main caliber always equals true main caliber;
17. no contract permits main-caliber cheating;
18. true and declared values remain separate and true values govern physical mechanics;
19. category and total tonnage declare which value they use;
20. inspections use explicit frequency, scope, error, detection, and obstruction behavior;
21. declaration-gap detection uses exact keyed integer formulas;
22. obstruction creates explicit major violation and follow-up effects;
23. validation occurs at all nine declared boundaries;
24. violations use exact technical, minor, major, and grave severity mapping;
25. confirmed violations apply exact tension, confidence, cure, disposal, and collapse-pressure effects;
26. forced scrapping creates a project and uses exactly 2,500 salvage basis points;
27. treaty pressure at 100 enqueues a crisis and does not silently collapse the treaty;
28. construction holidays, replacement ages, and carrier conversions have complete explicit contracts;
29. every action and validation appends an immutable compliance-ledger entry; and
30. identical state, commands, content, treaty, ruleset, inspections, and seeds produce identical validation, detection, violation, consequence, ledger, and hash results.
