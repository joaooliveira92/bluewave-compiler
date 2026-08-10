# DESIGN-14: World Geography

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-14`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Geographic identity, adjacency, movement, canal access, and choke-point restrictions MUST use explicit canonical records and versioned predicates. Runtime geographic inference and fallback behavior are prohibited.

## 1. World Entity Types

The canonical world entity types are:

- `AREA`;
- `SEA_ZONE`;
- `POSSESSION`;
- `PORT`;
- `HOME_AREA_ASSIGNMENT`;
- `BUILD_AREA_ASSIGNMENT`;
- `CANAL`;
- `CHOKE_POINT`;
- `ROUTE_EDGE`; and
- `CLIMATE_PROFILE`.

Every entity MUST have a stable identifier unique within its entity type, a content version, and a content hash.

Localized names are presentation-only and MUST NOT control adjacency, access, movement, battle generation, ownership, climate, or route legality.

## 2. Area Definition

Every strategic area MUST have one immutable `AreaDefinition` containing:

- `areaId`;
- `areaType`;
- `displayNameKey`;
- `climateProfileId`;
- `strategicPositionId`;
- ordered `routeEdgeIds`;
- ordered `possessionIds`;
- ordered `eligibleBattleTemplateIds`;
- `mineWarfareEnabled`;
- `operationalReportScopeId`;
- `canonicalOrder`;
- `contentVersion`; and
- `contentHash`.

`areaType` MUST be exactly one of:

- `SEA`;
- `COASTAL`;
- `OCEANIC`;
- `ENCLOSED_SEA`; or
- `TRANSIT_ONLY`.

`strategicPositionId` MUST reference a canonical strategic-position definition. Free-text strategic classifications are prohibited.

An area definition MUST NOT store mutable ownership, force presence, mine pressure, or operational reports.

A missing or invalid field MUST fail content validation with `INVALID_AREA_DEFINITION`.

## 3. Area State

Every materialized area MUST have one authoritative `AreaState` containing:

- `areaId`;
- current weather-state reference;
- ordered force-presence identifiers;
- mine-pressure records by belligerent;
- operational-report ledger position;
- temporary access and hazard modifiers;
- current battle-presence projection version;
- authoritative state version; and
- aggregate hash.

`AreaState.areaId` MUST reference exactly one `AreaDefinition`.

Adjacency, climate identity, associated possessions, and eligible battle templates MUST be read from canonical definitions. Mutable state MUST NOT duplicate those definitions.

## 4. Adjacency and Route Edges

Area adjacency exists only through explicit `RouteEdgeDefinition` records.

Every route edge MUST contain:

- `routeEdgeId`;
- `fromAreaId`;
- `toAreaId`;
- `directionality`;
- `edgeType`;
- `baseMovementCostEdges`;
- `canalId` or `NONE`;
- `chokePointId` or `NONE`;
- `accessPredicateId`;
- `physicalConditionPredicateId`;
- `rangeClassRequirement`;
- `mineRiskProfileId`;
- `interdictionProfileId`;
- `canonicalOrder`;
- `contentVersion`; and
- `contentHash`.

`directionality` MUST be `BIDIRECTIONAL` or `DIRECTED`.

`edgeType` MUST be one of:

- `OPEN_SEA`;
- `COASTAL_PASSAGE`;
- `CANAL_TRANSIT`;
- `CHOKE_POINT_TRANSIT`; or
- `SCENARIO_SPECIAL`.

The shipped value of `baseMovementCostEdges` is exactly `1` for every normal edge. Values MUST be integers within `1..3` inclusive.

For a bidirectional connection, canonical content MAY use one bidirectional record or two directed records. The representation MUST be explicit and MUST produce identical route legality in both directions when declared bidirectional.

Geometric proximity, shared possessions, localized names, map coordinates, and visual contact MUST NOT imply adjacency.

A duplicate edge identifier, missing endpoint, self-edge without an explicit scenario-special authorization, or invalid predicate reference MUST fail with `INVALID_ROUTE_EDGE_DEFINITION`.

## 5. Climate

Every area MUST reference exactly one `ClimateProfileDefinition`.

A climate profile MUST define, for every calendar month:

- sea-state distribution;
- wind distribution;
- precipitation distribution;
- fog or mist distribution;
- daylight profile;
- glare eligibility;
- visibility distribution; and
- persistent-weather transition policy.

All distributions MUST use integer weights and deterministic keyed random selection. Missing monthly climate data MUST fail with `INCOMPLETE_CLIMATE_PROFILE`.

Climate profile changes require an explicit scenario override or typed event. Runtime inference from latitude, coordinates, area name, or neighboring areas is prohibited.

## 6. Strategic Position

Every `StrategicPositionDefinition` MUST declare integer or boolean modifiers for only the systems it affects, including:

- battle-opportunity weighting;
- trade-route relevance;
- blockade-theater membership;
- invasion relevance;
- reconnaissance priority;
- AI deployment utility; and
- event eligibility.

A strategic position MUST NOT directly change ship tactical statistics.

The shipped neutral modifier is `10_000` basis points. Every non-neutral modifier MUST be explicit, versioned, and constrained to `0..30_000` basis points inclusive.

## 7. Associated Possessions and Ports

Each possession MUST reference exactly one strategic area. Each port MUST reference exactly one possession and one strategic area.

`AreaDefinition.possessionIds` MUST equal the canonical set of possessions whose `areaId` references that area. The compiler MUST validate both directions.

Ownership and military control belong to possession state and MUST NOT be inferred from area association.

An inconsistent association MUST fail with `AREA_POSSESSION_ASSOCIATION_MISMATCH`.

## 8. Eligible Battle Templates

Every area MUST list all battle-template identifiers that are geographically permitted there.

Battle generation MAY use a listed template only when its mission, war, era, force, weather, and operational predicates also pass.

A template absent from the area's list MUST be ineligible with `BATTLE_TEMPLATE_NOT_ALLOWED_IN_AREA`.

The runtime MUST NOT choose a template from another area because of similarity, adjacency, or missing content.

## 9. Mine Pressure by Belligerent

Mine pressure MUST be represented by one `AreaMinePressureRecord` per area and laying belligerent when pressure is non-zero.

Each record MUST contain:

- `areaId`;
- `layingParticipantId`;
- ordered target belligerent identifiers;
- `strength` as an integer within `1..1_000_000`;
- `freshnessBp` within `0..10_000`;
- source-composition references;
- detection-confidence basis points within `0..10_000`;
- `lastResolvedCampaignMonth`;
- `lastSweptCampaignMonth` or `NONE`;
- formula and ruleset versions; and
- record hash.

Zero pressure MUST be represented by absence of a record, not by duplicate zero-valued records.

Mine pressure MUST be scoped by laying participant and targets. It MUST NOT be stored as one undifferentiated area scalar.

## 10. Operational Reports

Operational reports are knowledge records, not true area state.

Every `AreaOperationalReport` MUST contain:

- `reportId`;
- `areaId`;
- `recipientParticipantId`;
- `reportTypeId`;
- observed and received campaign times;
- source identifier;
- confidence basis points;
- estimated contact, strength, hazard, or activity data;
- possible deception marker;
- expiration policy;
- knowledge-assertion references; and
- report hash.

Reports MUST NOT overwrite true force presence, mine pressure, ownership, control, route state, or weather.

AI and player projections MUST read only reports and knowledge legally available to their participant.

## 11. Planned Paths

A moving force's long route MUST be stored as one `PlannedStrategicPath` containing:

- `pathId`;
- `forceId`;
- `originAreaId`;
- ordered `routeEdgeIds`;
- ordered `areaIds`;
- `nextEdgeIndex`;
- `createdAtSnapshotId`;
- `validatedThroughEdgeIndex`;
- `pathPolicyVersion`;
- path hash; and
- status.

`status` MUST be one of:

- `PLANNED`;
- `ACTIVE`;
- `COMPLETED`;
- `BLOCKED`;
- `CANCELLED`; or
- `SUPERSEDED`.

The first area MUST equal `originAreaId`. For every edge index, the edge endpoints and direction MUST connect the corresponding consecutive areas.

`nextEdgeIndex` MUST identify the first unresolved edge. It begins at `0` and increases only after successful complete traversal of an edge.

Editing an active path MUST use a superseding movement command. Direct mutation is prohibited.

## 12. Normal Strategic Movement

The normal monthly movement allowance is exactly one eligible route edge.

The active ruleset MUST provide:

- `normalStrategicMovementEdgesPerMonth` with shipped value `1`;
- `maximumStrategicMovementEdgesPerMonth` with shipped value `3`;
- `movementAllowancePolicyId` with shipped value `movement_allowance_v1`; and
- explicit bonus-edge modifier definitions.

Without an active explicit bonus-edge modifier, a force MUST traverse zero or one edge in a month.

A bonus modifier MUST contain:

- stable modifier identifier;
- activation predicate;
- integer `bonusEdges` within `1..2`;
- stacking group;
- duration;
- source identifier; and
- ruleset version.

The final allowance MUST equal:

`min(3, 1 + sumEligibleStackingBonusEdges)`

Negative conditions MAY prevent movement but MUST NOT produce a negative allowance.

This contract binds to the detailed resolution order in `DESIGN-10`.

## 13. Monthly Path Advancement

During strategic movement, the resolver MUST process a force as follows:

1. load its active path and current area;
2. identify the edge at `nextEdgeIndex`;
3. validate edge continuity and direction;
4. validate current diplomacy, war, access, canal, choke-point, blockade, range, fuel, readiness, and mission predicates;
5. resolve fuel, breakdown, and interdiction under `DESIGN-10`;
6. commit complete traversal or no traversal;
7. set current area to the destination after successful traversal;
8. increment `nextEdgeIndex` by exactly `1`;
9. repeat only while allowance remains; and
10. mark the path `COMPLETED` when all edges resolve.

A force MUST NOT occupy an intermediate point on a route edge in authoritative strategic state.

When an edge becomes illegal, the path becomes `BLOCKED`, the force remains in the last legally reached area, and the result MUST identify the failed edge and reason code.

The resolver MUST revalidate every edge at the time it is attempted. Prior path validation does not guarantee future access.

## 14. Exclusive Strategic Location

Every commissioned ship MUST have exactly one authoritative strategic location at every stable strategic snapshot.

The location MUST be represented by exactly one of:

- `AT_AREA` with one `areaId`;
- `IN_CANAL_TRANSIT` with one `CanalTransitRecord`; or
- another explicitly declared single-location state owned by a future canonical contract.

A ship MUST NOT simultaneously have two locations, appear in two force-presence lists, or contribute operational presence to two areas.

A permanent division MUST be co-located unless a locked split command has created separate divisions before movement.

A location violation MUST fail with `SHIP_STRATEGIC_LOCATION_NOT_UNIQUE`.

## 15. Operational Battle Presence

Battle presence MUST be derived only from committed movement results.

For a ship or force that completes an edge, its battle presence for later monthly battle generation is the destination area unless an explicit interdiction result created a source-area opportunity before traversal.

A ship that fails before departure has presence only in the source area.

A ship in canal transit has battle presence only in battle scopes explicitly permitted by the canal-transit contract. It MUST NOT appear in both canal endpoints.

Every `PostMovementSnapshot` MUST contain one `BattlePresenceRecord` per eligible force with:

- force identifier;
- area or transit scope;
- source movement-result identifier;
- arrival status;
- mission eligibility;
- fuel and readiness status;
- exceptions; and
- record hash.

Battle presence MUST NOT be inferred from planned destination, UI animation, pre-movement location, or route geometry.

## 16. Canal Definitions

Every canal MUST have one immutable `CanalDefinition` containing:

- `canalId`;
- `displayNameKey`;
- ordered endpoint area identifiers;
- ordered transit route-edge identifiers;
- `canonicalOpeningMonth`;
- `openingEventId` or `NONE`;
- `defaultOperatingCondition`;
- `defaultAccessPolicyId`;
- `transitDurationMonths`;
- `maximumConcurrentTransitUnits` or `UNLIMITED`;
- `lockedRouteResolutionPolicyId`;
- content version; and
- content hash.

The shipped `transitDurationMonths` is exactly `0` for normal strategic transit, meaning canal entry and exit occur as one complete route-edge traversal in the movement phase.

A scenario MAY define a positive integer duration only through an explicit override, in which case `IN_CANAL_TRANSIT` is required.

## 17. Canal State

Every materialized canal MUST have one authoritative `CanalState` containing:

- `canalId`;
- `legalOwnerNationId` or `NONE`;
- `militaryControllerNationId` or `NONE`;
- `operatingCondition`;
- `accessPolicyId`;
- `minedState`;
- `blockedState`;
- temporary access restrictions;
- active transit records;
- last state-change event identifier;
- state version; and
- aggregate hash.

`operatingCondition` MUST be one of:

- `OPERATIONAL`;
- `DAMAGED`;
- `CLOSED`;
- `UNDER_CONSTRUCTION`; or
- `DESTROYED`.

`minedState` MUST be `CLEAR`, `CONTESTED`, or `MINED`.

`blockedState` MUST be `UNBLOCKED` or `BLOCKED`.

Legal ownership and military control MUST remain separate.

## 18. Suez Canal

The canonical identifier is `canal_suez`.

Its canonical opening month precedes every supported Bluewave scenario. Therefore, every supported scenario MUST materialize Suez with default condition `OPERATIONAL` unless that scenario contains an explicit `CanalScenarioOverride`.

An override MUST contain:

- `scenarioId`;
- `canalId`;
- initial operating condition;
- initial controller and owner;
- access policy;
- mined and blocked states;
- causal canonical event or scenario-state identifier;
- effective month; and
- content hash.

No override may be inferred from war, ownership, or historical knowledge unless a typed event or scenario record explicitly supplies it.

A missing Suez definition or incomplete override MUST fail with `INVALID_SUEZ_SCENARIO_STATE`.

## 19. Panama Canal

The canonical identifier is `canal_panama`.

The canonical scheduled opening month is August 1914, represented by campaign month index for `1914-08` under `DESIGN-07`.

For scenarios starting before August 1914, Panama MUST materialize as `UNDER_CONSTRUCTION` and inaccessible unless an explicit scenario override supplies another state.

At the scheduled global-event phase of August 1914, event `panama_opening_1914_08_v1` MUST evaluate.

The event opens the canal only when all predicates are true:

- canal condition is `UNDER_CONSTRUCTION` or `DAMAGED` with completion permitted;
- construction-completion state is valid;
- canal is not `DESTROYED`;
- no scenario override suppresses or delays opening; and
- required endpoint route edges exist.

On success, the event sets condition to `OPERATIONAL` and records the state transition.

If opening is suppressed or delayed, the responsible override or typed event MUST provide the next evaluation month or explicit terminal condition. The runtime MUST NOT choose a replacement date.

For `scen_1920`, `scen_1935`, and `scen_1960`, Panama MUST start `OPERATIONAL` unless an explicit scenario override states otherwise.

Missing opening event or predicate data MUST fail with `INVALID_PANAMA_OPENING_CONTRACT`.

## 20. Canal Transit Eligibility

Before canal entry, the resolver MUST evaluate these denial predicates in order:

1. `CANAL_NOT_OPERATIONAL` when operating condition is not `OPERATIONAL`;
2. `CANAL_PHYSICALLY_BLOCKED` when blocked state is `BLOCKED`;
3. `CANAL_MINED_TRANSIT_DENIED` when mined state and access policy prohibit transit;
4. `CANAL_WAR_WITH_CONTROLLER` when traveler and military controller are opposing participants in an active war;
5. `CANAL_TENSION_ACCESS_DENIED` when bilateral tension with the military controller is greater than or equal to `7`;
6. `CANAL_POLICY_ACCESS_DENIED` when the active access policy rejects the traveler;
7. `CANAL_TEMPORARY_RESTRICTION` when an explicit temporary restriction rejects the traveler;
8. `CANAL_CAPACITY_UNAVAILABLE` when declared concurrent capacity is exhausted; and
9. `CANAL_FORCE_INELIGIBLE` when force size, ship dimensions, damage, mission, or range violates an explicit canal predicate.

The first true predicate is the primary denial reason. All comparisons use current authoritative post-diplomacy state.

If `militaryControllerNationId` is `NONE`, war and tension checks against the controller do not apply, but policy, physical, mined, temporary, and force restrictions still apply.

The tension threshold is exactly `7`, inclusive. Tension `6` does not trigger this denial; tension `7` does.

## 21. Canal Access Policy

Every `CanalAccessPolicy` MUST declare explicit predicates for:

- owner access;
- controller access;
- allied access;
- neutral access;
- belligerent access;
- treaty-granted access;
- guaranteed transit;
- restricted ship classes;
- restricted mission types; and
- mined or blocked transit.

A descriptive policy name MUST NOT determine access.

A treaty MAY override discretionary policy denial only when its typed clause explicitly grants transit. It MUST NOT override physical closure, destruction, blockage, incompatible ship dimensions, or occupation that makes transit impossible.

## 22. Canal Transit Records and Locked Routes

When `transitDurationMonths` equals `0`, successful transit commits the full edge in the current movement resolution and no persistent transit record is created.

When positive transit duration is active, each entering force MUST receive one `CanalTransitRecord` containing:

- `transitId`;
- `canalId`;
- `forceId`;
- ordered ship identifiers;
- entry area;
- exit area;
- entry campaign month and phase;
- scheduled exit campaign month;
- locked access-policy version;
- locked controller identifier;
- locked route-edge identifiers;
- locked-route resolution policy identifier;
- entry-state hash;
- status; and
- record hash.

`status` MUST be:

- `ENTERED`;
- `IN_TRANSIT`;
- `EXITED`;
- `INTERNED`;
- `DIVERTED`;
- `BLOCKED_IN_TRANSIT`; or
- `DESTROYED`.

The shipped `locked_route_resolution_v1` policy is:

- a force that legally entered retains permission to complete transit despite later tension increase, access-policy revocation, alliance change, or war declaration;
- physical destruction, newly effective blockage, occupation of transit infrastructure, or an explicit typed interdiction event MAY stop completion;
- stopped transit MUST resolve to one explicit status and location scope;
- the force MUST never be returned to an endpoint or interned without a typed outcome; and
- no new ship may join the locked transit after entry.

Changes after entry MUST NOT retroactively make the entry illegal.

## 23. Choke Points

Every choke point MUST have a `ChokePointDefinition` containing:

- `chokePointId`;
- ordered route-edge identifiers;
- `restrictionPredicateId`;
- `restrictionPriority`;
- ordered denial reason codes;
- content version; and
- content hash.

A choke-point restriction is evaluated before route-edge traversal and after canal checks when both apply.

Runtime inference from geography or battle state is prohibited.

## 24. Baltic to Northern Europe Route

The canonical choke-point identifier is `choke_baltic_northern_europe`.

Restriction against Germany's enemies is active only when all predicates are true:

- Germany exists as an active scenario nation instance;
- Germany is a participant in an active war;
- the traveler is an opposing participant in that same war;
- Germany has discovered and adopted technology capability `active_mine_warfare`;
- Germany or an allied participant controls at least one canonical control node declared by the choke-point definition;
- mine pressure attributable to Germany or that allied controller in the choke scope is at least `100_000` strength units;
- the route is not explicitly opened by an applicable treaty, occupation result, clearance event, or scenario override; and
- the active restriction policy is `baltic_northern_europe_restriction_v1`.

When active, normal strategic traversal MUST fail with `BALTIC_ROUTE_RESTRICTED_BY_MINES`.

The shipped mine-pressure activation threshold is exactly `100_000` on the canonical `1..1_000_000` pressure scale. The permitted ruleset range is `50_000..200_000` inclusive.

The restriction does not delete the route edge. It changes its current eligibility result.

## 25. Canonical Ordering and Hashing

World definitions MUST be canonically ordered by:

1. entity type ordinal;
2. declared canonical order;
3. ascending stable identifier.

Mutable area records MUST be ordered by `areaId`. Mine-pressure records MUST then be ordered by laying participant identifier. Reports MUST be ordered by recipient and report identifier.

Database insertion order, filesystem order, localized names, renderer order, and map coordinates MUST NOT affect canonical hashes.

## 26. Required Reason Codes

The geography subsystem MUST define at least:

- `INVALID_AREA_DEFINITION`;
- `INVALID_ROUTE_EDGE_DEFINITION`;
- `INCOMPLETE_CLIMATE_PROFILE`;
- `AREA_POSSESSION_ASSOCIATION_MISMATCH`;
- `BATTLE_TEMPLATE_NOT_ALLOWED_IN_AREA`;
- `SHIP_STRATEGIC_LOCATION_NOT_UNIQUE`;
- `PLANNED_PATH_INVALID`;
- `ROUTE_EDGE_NO_LONGER_LEGAL`;
- `CANAL_NOT_OPERATIONAL`;
- `CANAL_PHYSICALLY_BLOCKED`;
- `CANAL_MINED_TRANSIT_DENIED`;
- `CANAL_WAR_WITH_CONTROLLER`;
- `CANAL_TENSION_ACCESS_DENIED`;
- `CANAL_POLICY_ACCESS_DENIED`;
- `CANAL_TEMPORARY_RESTRICTION`;
- `CANAL_CAPACITY_UNAVAILABLE`;
- `CANAL_FORCE_INELIGIBLE`;
- `INVALID_SUEZ_SCENARIO_STATE`;
- `INVALID_PANAMA_OPENING_CONTRACT`; and
- `BALTIC_ROUTE_RESTRICTED_BY_MINES`.

## 27. Validation and Acceptance

Automated validation MUST prove that:

1. every area has a valid identifier, climate profile, strategic position, route list, possession list, battle-template list, and report scope;
2. adjacency exists only through explicit route edges;
3. every route edge has valid endpoints, direction, cost, predicates, and canonical order;
4. area and possession references are bidirectionally consistent;
5. mine pressure is scoped by area and laying belligerent;
6. operational reports never overwrite true state;
7. every planned path is a continuous ordered edge sequence;
8. normal movement traverses at most one edge per month without an explicit bonus;
9. the final movement allowance never exceeds three edges;
10. every attempted edge is revalidated against current state;
11. blocked movement leaves the force at the last legal area;
12. every commissioned ship has exactly one strategic location;
13. battle presence derives only from committed movement outcomes;
14. Suez starts operational in every supported scenario unless an explicit valid override exists;
15. Panama opens through the August 1914 event contract and not through runtime date inference;
16. later scenarios start Panama operational unless explicitly overridden;
17. canal denial uses the exact declared predicate priority;
18. war with the controller denies transit;
19. tension `7` denies normal transit and tension `6` does not;
20. physical closure or blockage denies transit regardless of policy permission;
21. zero-duration canal transit completes as one edge;
22. positive-duration transit has one exclusive transit location record;
23. locked transit preserves legal entry permission against later diplomatic changes;
24. locked transit still responds to explicit physical impossibility;
25. the Baltic restriction requires every declared war, enemy, technology, control, mine-pressure, and policy predicate;
26. the shipped Baltic mine threshold is exactly `100_000`;
27. identical content and state produce identical route, access, movement, presence, and world hashes; and
28. save and load preserve paths, locations, canal transits, mine pressure, and geography hashes exactly.
