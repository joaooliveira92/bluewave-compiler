# DESIGN-55: Release Scope And Implementation Order

> **Canonical status:** Normative delivery and release specification.
> **Stable document ID:** `DESIGN-55`
> **Release status:** This document defines the milestone *order* and release gates, not a claim that every listed subsystem ships. The shipped scope today is the single-era 1880 campaign; M3/M4 modules are not yet all reachable from a campaign and M5 is not started. Live per-milestone status is `docs/PROGRESS.md`; the content release gate (a pack MUST NOT expose unreachable content — §12) runs against the production pack in the test suite (`packages/ship-design/test/nationCompleteness.test.ts`).
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Milestone completion, feature readiness, scenario support, era coverage, acceptance evidence, packaging, and release claims MUST use the explicit contracts, states, predicates, and failure behavior defined here. Presence of content in a pack does not imply runtime or scenario support.

## 1. Delivery Milestones

The canonical implementation milestones are:

1. `M1_STRATEGIC_CAMPAIGN_KERNEL`;
2. `M2_SURFACE_TACTICAL_CORE`;
3. `M3_ADVANCED_SURFACE_WARFARE`;
4. `M4_AVIATION`; and
5. `M5_ELECTRONICS_AND_MISSILE_ERA`.

A milestone identifier is stable. Renaming its display label MUST NOT change acceptance or dependency identity.

## 2. Milestone 1: Strategic Campaign Kernel

`M1_STRATEGIC_CAMPAIGN_KERNEL` contains:

- campaign compiler;
- nations and world;
- economy;
- research;
- ship design and construction;
- deployment;
- diplomacy;
- war and peace;
- monthly phase pipeline;
- save, load, replay, and hashes; and
- deterministic auto-resolution.

Milestone 1 is complete only when every listed capability has status `ACCEPTED` under Section 9.

## 3. Milestone 2: Surface Tactical Core

`M2_SURFACE_TACTICAL_CORE` contains:

- tactical movement;
- spotting and contact state;
- tactical divisions and formations;
- gunnery;
- basic armor and damage;
- tactical weather; and
- battle results.

Milestone 2 depends on accepted Milestone 1 campaign, battle-generation, persistence, and auto-resolution boundaries.

## 4. Milestone 3: Advanced Surface Warfare

`M3_ADVANCED_SURFACE_WARFARE` contains:

- torpedoes;
- mines;
- submarines;
- coastal defenses;
- smoke; and
- detailed damage control.

Milestone 3 depends on accepted Milestones 1 and 2.

## 5. Milestone 4: Aviation

`M4_AVIATION` contains:

- aircraft development;
- squadrons;
- airbases;
- carriers;
- CAP;
- strikes; and
- anti-aircraft defense.

Milestone 4 depends on accepted Milestones 1 and 2. Any aviation capability relying on torpedoes, mines, submarines, smoke, or detailed damage control also depends on the corresponding accepted Milestone 3 capability.

## 6. Milestone 5: Electronics and Missile Era

`M5_ELECTRONICS_AND_MISSILE_ERA` contains:

- radar;
- fighter direction;
- data links;
- electronic warfare;
- guided weapons;
- SAM;
- CIWS;
- jets; and
- helicopters.

Milestone 5 depends on all earlier accepted milestones and on complete cross-domain integration among electronics, missiles, aviation, air defense, damage, intelligence, logistics, production, and persistence.

## 7. Capability Registry

Every milestone capability MUST have one immutable `ReleaseCapabilityDefinition` containing:

- `capabilityId`;
- owning milestone identifier;
- implementation package or subsystem identifiers;
- governing design-contract identifiers;
- prerequisite capability identifiers;
- supported content-feature identifiers;
- required test-suite identifiers;
- required packaged-smoke-test identifiers;
- required deterministic replay fixtures;
- required migration fixtures;
- acceptance owner role;
- content, schema, ruleset, formula, AI-policy, and RNG version requirements; and
- definition hash.

A capability absent from this registry is not releasable and MUST fail validation with `RELEASE_CAPABILITY_UNREGISTERED`.

## 8. Capability Readiness State

Every registered capability MUST have exactly one `CapabilityReadinessState`:

- `CONTENT_ONLY`;
- `IMPLEMENTED_UNVERIFIED`;
- `VERIFICATION_FAILED`;
- `VERIFIED_NOT_INTEGRATED`;
- `INTEGRATED_NOT_ACCEPTED`;
- `ACCEPTED`; or
- `WITHDRAWN`.

Only `ACCEPTED` satisfies scenario and milestone requirements.

`CONTENT_ONLY` means canonical definitions or assets exist, but the mechanics are unavailable for supported runtime use.

`IMPLEMENTED_UNVERIFIED`, `VERIFIED_NOT_INTEGRATED`, and `INTEGRATED_NOT_ACCEPTED` MUST NOT be presented as fully supported.

## 9. Capability Acceptance Contract

A capability may transition to `ACCEPTED` only when all predicates hold:

- every governing design contract is resolved with no blocking open issue;
- implementation exists at all required architecture boundaries;
- required unit, integration, boundary, property, determinism, replay, and migration tests pass;
- required tactical or strategic auto-resolution path passes;
- required packaged smoke tests pass against the distributable build;
- save and replay compatibility tests pass;
- content schemas and references validate;
- no required dependency is below `ACCEPTED`;
- no release-blocking defect remains open;
- acceptance evidence is complete and hashed; and
- the acceptance authority records an approval result.

A capability lacking any predicate MUST remain below `ACCEPTED`.

## 10. Acceptance Evidence

Every accepted capability MUST have one immutable `CapabilityAcceptanceEvidence` containing:

- capability identifier and definition hash;
- accepted implementation commit or build identifier;
- governing design-contract hashes;
- test-suite versions and result hashes;
- packaged-smoke-test build and result hashes;
- replay and determinism fixture hashes;
- migration result hashes;
- supported platform matrix;
- known non-blocking limitations;
- acceptance timestamp for audit only;
- accepting authority;
- outcome; and
- evidence hash.

A timestamp MUST NOT affect simulation status or deterministic hashes outside the audit record.

## 11. Canonical Era Bands

Scenario era coverage MUST use these identifiers:

- `EARLY`: January 1880 through December 1899;
- `PRE_WAR`: January 1900 through December 1919;
- `INTERWAR`: January 1920 through December 1939;
- `MID_CENTURY`: January 1940 through December 1959; and
- `LATE`: January 1960 through December 1970.

A scenario MUST declare every era band it can reach through its supported start date, maximum campaign duration, technology progression, events, continuities, and migrations.

The expected era is not inferred only from the scenario start date.

## 12. Content Feature Classification

Every canonical content feature MUST declare exactly one release classification:

- `SUPPORTED_MECHANICAL`;
- `CONTENT_ONLY_LOCKED`;
- `PRESENTATION_ONLY`;
- `MIGRATION_ONLY`; or
- `DEPRECATED`.

`SUPPORTED_MECHANICAL` requires at least one accepted capability that implements it.

`CONTENT_ONLY_LOCKED` MAY exist in the canonical pack before its runtime system is accepted, but it MUST be unreachable in a fully supported scenario.

`PRESENTATION_ONLY` MUST NOT affect authoritative mechanics.

`MIGRATION_ONLY` exists only to preserve historical save compatibility.

## 13. Later-Era Content Gate

Later-era content MAY be packaged before its tactical or strategic subsystem is accepted only when all conditions hold:

- the content is classified `CONTENT_ONLY_LOCKED`;
- it cannot be discovered, purchased, produced, installed, assigned, spawned, selected, granted, or activated by any supported scenario path;
- AI candidate generation excludes it;
- event and objective predicates exclude it;
- scenario compilation rejects direct references to it for a supported scenario;
- save migration does not activate it without an accepted migration capability;
- UI labels it as unavailable or unsupported when exposed in content browsers; and
- content validation records the capability identifiers required to unlock it.

A content item that can enter authoritative runtime state is not content-only.

## 14. Unsupported Content Isolation

The build MUST prove unsupported-content isolation through automated traversal of:

- technology unlock graphs;
- production and inventory definitions;
- design-component eligibility;
- event and objective effects;
- scenario starting state;
- private ventures and foreign purchases;
- AI selection pools;
- battle-generation temporary assets;
- continuity and successor-state definitions;
- migrations; and
- developer or debug defaults included in the distributable package.

Any reachable `CONTENT_ONLY_LOCKED` feature MUST fail release validation with `UNSUPPORTED_CONTENT_REACHABLE`.

## 15. Scenario Support Manifest

Every scenario MUST contain one immutable `ScenarioSupportManifest` with:

- `scenarioId` and scenario hash;
- support-status value;
- supported start and end campaign months;
- reachable era bands;
- maximum supported campaign duration;
- allowed continuities and successor paths;
- complete required-capability identifiers;
- complete required-content-feature identifiers;
- required strategic and tactical mission types;
- required auto-resolution capabilities;
- required save, replay, and migration capabilities;
- excluded or locked content identifiers;
- acceptance-evidence references;
- known limitations;
- manifest version; and
- manifest hash.

A scenario without this manifest MUST be `UNSUPPORTED`.

## 16. Scenario Support States

Scenario support status MUST be exactly one of:

- `UNSUPPORTED`;
- `CONTENT_PREVIEW`;
- `PARTIAL_SUPPORT`;
- `FULLY_SUPPORTED`; or
- `WITHDRAWN`.

Only `FULLY_SUPPORTED` authorizes an unqualified support claim.

`CONTENT_PREVIEW` permits content browsing but no supported campaign promise.

`PARTIAL_SUPPORT` requires an explicit closed supported scope and visible limitations. It MUST NOT be labeled fully supported.

## 17. Full Scenario Support Predicate

A scenario may transition to `FULLY_SUPPORTED` only when all predicates hold:

- every required capability in its support manifest is `ACCEPTED`;
- every required content feature is `SUPPORTED_MECHANICAL`;
- every reachable era band has complete required strategic and tactical coverage;
- every reachable mission or battle type is deterministically auto-resolvable;
- unsupported content is unreachable under Section 14;
- campaign compilation, monthly progression, battles, save/load, replay, migration, and terminal evaluation pass;
- required packaged smoke tests pass against the shipping artifact;
- all declared supported platforms pass;
- acceptance evidence exists and matches the scenario and dependency hashes; and
- no release-blocking defect is open.

The predicate is conjunctive. Passing most required systems is insufficient.

## 18. Scenario Capability Closure

Before a support claim, the build MUST compute the transitive closure of scenario requirements.

The closure begins from:

- starting state;
- reachable technology and content;
- strategic objectives;
- events;
- government and trait capabilities;
- war, treaty, and diplomacy paths;
- reachable mission types;
- battle-generation elements;
- continuities and successors;
- maximum campaign duration;
- save and migration routes; and
- terminal evaluation.

For every reachable feature, the closure MUST include its direct and transitive release capabilities.

A missing capability MUST fail with `SCENARIO_CAPABILITY_CLOSURE_INCOMPLETE`.

## 19. Era Coverage Matrix

The release process MUST materialize a `ScenarioEraCoverageMatrix` containing one entry per scenario, reachable era, and required system family.

Each entry MUST contain:

- scenario identifier;
- era identifier;
- system-family identifier;
- required capability identifiers;
- lowest readiness state;
- acceptance-evidence hashes;
- test coverage identifiers;
- packaged-smoke-test result;
- status; and
- entry hash.

An entry is `PASS` only when every required capability is `ACCEPTED` and every required test and packaged smoke test passes.

One failing entry prevents `FULLY_SUPPORTED` status.

## 20. Strategic and Tactical Coverage

Full scenario support requires accepted coverage for every applicable system family, including:

- campaign compilation and phase progression;
- economy, research, design, construction, and logistics;
- diplomacy, politics, objectives, war, peace, and treaties;
- intelligence and fog of war;
- battle generation;
- movement, spotting, command, weather, and damage;
- gunnery and every reachable weapon family;
- submarines, mines, coastal defenses, and smoke when reachable;
- aircraft, carriers, strikes, CAP, and AA when reachable;
- radar, data links, EW, missiles, SAM, CIWS, jets, and helicopters when reachable;
- auto-resolution;
- persistence, replay, migration, UI projections, and automation; and
- terminal and career evaluation.

A system family that is unreachable by the scenario does not block support, but its unreachability MUST be proved by content and scenario validation.

## 21. Auto-Resolution Requirement

Every battle or operation reachable by a `FULLY_SUPPORTED` scenario MUST have a validated deterministic auto-resolution path.

The path MUST accept the same manifest and campaign inputs as tactical play and produce campaign-compatible results and provenance.

A scenario-required player-only tactical path is prohibited for full support.

Missing auto-resolution MUST fail with `SCENARIO_AUTO_RESOLUTION_COVERAGE_MISSING`.

## 22. Packaged Smoke Tests

Every fully supported scenario MUST pass packaged smoke tests using the distributable application, packaged content, production persistence layer, and shipping configuration.

The minimum shipped suite MUST include:

- scenario compilation;
- new campaign creation;
- at least `24` deterministically resolved strategic months;
- at least one battle opportunity and auto-resolution for every reachable mission family;
- save, process restart, load, and continuation;
- replay verification through at least one strategic and one tactical checkpoint;
- one migration fixture when the release changes persisted schemas;
- unsupported-content reachability validation; and
- final snapshot and ledger-hash verification.

A unit-test-only result is insufficient for the packaged smoke-test predicate.

## 23. Milestone Completion

A milestone is complete only when:

- every capability owned by the milestone is `ACCEPTED`;
- all declared milestone integration suites pass;
- all milestone packaged smoke tests pass;
- dependencies remain accepted;
- acceptance evidence is complete; and
- milestone status is signed `COMPLETED`.

A milestone MAY be reported as `IN_PROGRESS` or `FEATURE_PREVIEW` before completion, but MUST NOT be reported as complete.

## 24. Release Support Claims

Every release artifact MUST contain one `ReleaseSupportManifest` containing:

- release identifier and build hash;
- supported platforms;
- completed milestones;
- accepted capabilities;
- fully supported scenarios;
- partial and preview scenarios with limitations;
- content-only locked features;
- withdrawn capabilities or scenarios;
- acceptance-evidence index hash; and
- manifest hash.

The UI, release notes, installer metadata, and automated support checks MUST derive support claims from this manifest.

Manual marketing text MUST NOT broaden the hashed support scope.

## 25. Runtime Support Enforcement

At campaign creation, the runtime MUST compare the selected scenario, content, ruleset, feature toggles, and platform against the release support manifest.

For a `FULLY_SUPPORTED` campaign:

- unsupported features MUST remain locked;
- content and dependency hashes MUST match;
- developer overrides MUST be disabled;
- required capabilities MUST be accepted; and
- the campaign save MUST record the support-manifest hash.

A deliberate unsupported or preview campaign MAY start only through an explicit user-facing opt-in that states the unsupported scope. It MUST NOT be labeled fully supported and MUST use separate telemetry and support classification.

## 26. Support Withdrawal

A capability or scenario may be changed from accepted or fully supported to `WITHDRAWN` only through an explicit release-support amendment containing:

- withdrawn identifier;
- reason;
- affected versions and platforms;
- effective release;
- save and migration impact;
- workaround or recovery policy;
- updated support-manifest hash; and
- approval record.

Withdrawal MUST NOT silently rewrite an installed prior release manifest.

## 27. Content Validation

The canonical content pack MUST validate:

- every content feature's release classification;
- capability references;
- era eligibility;
- scenario reachability;
- technology and event graph reachability;
- AI and battle-generation exclusion where locked;
- migration behavior;
- presentation labelling; and
- content hashes.

A canonical pack may therefore contain future content without making it supported or reachable.

## 28. Determinism and Version Pinning

Acceptance and support status MUST pin:

- content-pack hashes;
- scenario hashes;
- ruleset and formula manifests;
- AI-policy manifest;
- RNG algorithm and decision-contract versions;
- implementation build or commit;
- persistence schema; and
- acceptance evidence.

A changed dependency invalidates prior acceptance for the changed release unless compatibility evidence explicitly covers it.

## 29. Release Validation Report

Every release candidate MUST produce one immutable `ReleaseValidationReport` containing:

- release identifier and build hash;
- milestone status;
- capability readiness states;
- scenario support statuses;
- era coverage matrix;
- capability closures;
- content-only reachability results;
- test, replay, migration, and packaged-smoke outcomes;
- platform matrix;
- blocking defects;
- acceptance evidence references;
- final decision;
- reason codes; and
- report hash.

`finalDecision` MUST be `PASS`, `FAIL`, or `PASS_WITH_EXPLICIT_PARTIAL_SUPPORT`.

`PASS_WITH_EXPLICIT_PARTIAL_SUPPORT` MUST NOT mark a partial scenario fully supported.

## 30. Canonical Ordering

Release validation MUST order:

1. milestones by canonical ordinal;
2. capabilities by milestone and capability identifier;
3. scenarios by scenario identifier;
4. era bands by Section 11 order;
5. system families by stable identifier;
6. test evidence by suite and fixture identifier;
7. platforms by platform identifier;
8. defects by severity descending and defect identifier; and
9. acceptance records by identifier.

Database insertion order, filesystem enumeration, UI order, localized names, and wall-clock time MUST NOT affect readiness, support status, reports, or hashes.

## 31. Required Reason Codes

The subsystem MUST define at least:

- `RELEASE_CAPABILITY_UNREGISTERED`;
- `RELEASE_CAPABILITY_DEPENDENCY_NOT_ACCEPTED`;
- `RELEASE_CAPABILITY_ACCEPTANCE_EVIDENCE_MISSING`;
- `RELEASE_CAPABILITY_TEST_FAILED`;
- `RELEASE_CAPABILITY_PACKAGED_SMOKE_FAILED`;
- `RELEASE_CAPABILITY_WITHDRAWN`;
- `CONTENT_RELEASE_CLASSIFICATION_MISSING`;
- `UNSUPPORTED_CONTENT_REACHABLE`;
- `SCENARIO_SUPPORT_MANIFEST_MISSING`;
- `SCENARIO_CAPABILITY_CLOSURE_INCOMPLETE`;
- `SCENARIO_ERA_COVERAGE_INCOMPLETE`;
- `SCENARIO_AUTO_RESOLUTION_COVERAGE_MISSING`;
- `SCENARIO_PACKAGED_SMOKE_FAILED`;
- `SCENARIO_NOT_FULLY_SUPPORTED`;
- `MILESTONE_CAPABILITY_INCOMPLETE`;
- `MILESTONE_INTEGRATION_FAILED`;
- `RELEASE_SUPPORT_MANIFEST_MISMATCH`;
- `RELEASE_SUPPORT_SCOPE_EXCEEDED`;
- `RELEASE_PLATFORM_UNSUPPORTED`;
- `RELEASE_VALIDATION_FAILED`; and
- `RELEASE_SCOPE_INVARIANT_FAILED`.

## 32. Validation and Acceptance

Automated validation MUST prove that:

1. the release plan contains exactly five canonical milestones in declared order;
2. every milestone capability is registered with contracts, dependencies, tests, smoke tests, replay, migrations, and acceptance ownership;
3. only capability state `ACCEPTED` satisfies a milestone or scenario requirement;
4. acceptance requires contracts, implementation, unit, integration, boundary, property, determinism, replay, migration, auto-resolution, packaged smoke, and evidence predicates;
5. acceptance evidence pins exact implementation, contracts, tests, build, platforms, and hashes;
6. scenario era bands use exact 1880 through 1970 boundaries;
7. reachable era calculation includes start date, duration, technology, events, continuities, and migrations;
8. every content feature has exactly one release classification;
9. content-only locked features cannot enter authoritative runtime state;
10. unsupported-content isolation traverses technology, production, design, events, objectives, scenarios, private ventures, AI, battle generation, continuities, migrations, and packaged defaults;
11. reachable unsupported content fails release validation;
12. every scenario contains a complete scenario support manifest;
13. only `FULLY_SUPPORTED` permits an unqualified scenario-support claim;
14. full support requires every transitive capability to be accepted;
15. full support requires every required content feature to be supported mechanically;
16. every reachable era and system-family entry passes the era coverage matrix;
17. one failing matrix entry blocks full support;
18. unreachable system families do not block support only when unreachability is proved;
19. every reachable battle and operation has deterministic auto-resolution;
20. packaged smoke tests use the distributable application and shipping content, persistence, and configuration;
21. the minimum packaged suite compiles the scenario, runs 24 months, resolves reachable battles, restarts through save/load, verifies replay, validates migration when required, checks locked content, and compares hashes;
22. unit tests alone cannot satisfy packaged smoke acceptance;
23. a milestone completes only when every owned capability and integration suite is accepted and signed complete;
24. release claims derive only from the hashed release support manifest;
25. marketing and UI cannot broaden support beyond the manifest;
26. runtime campaign creation enforces scenario, content, ruleset, platform, feature, and capability support;
27. unsupported or preview campaigns require explicit opt-in and remain separately classified;
28. support withdrawal requires an explicit versioned amendment and does not rewrite prior manifests;
29. future canonical content may be packaged while remaining content-only, locked, isolated, and unsupported;
30. acceptance and support pin all simulation and persistence dependencies;
31. every release candidate emits a complete immutable validation report; and
32. identical release inputs, build, content, tests, evidence, and platform matrix produce identical readiness states, support manifests, reports, and hashes.
