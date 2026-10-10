# DESIGN-26: Divisions And Formations

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-26`
> **Amended by:** ADR-0065, ADR-0086.
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Permanent divisions, tactical projections, membership, compatibility, flagships, commanders, experience, training, roles, formations, and provenance MUST use the explicit values, predicates, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Division Types

The canonical division types are:

- `PERMANENT_DIVISION`; and
- `TACTICAL_DIVISION`.

A permanent division is authoritative campaign organization.

A tactical division is an immutable battle-local projection. It MUST NOT replace, mutate, or become the authoritative permanent division.

## 2. Permanent Division State

Every permanent division MUST have one authoritative `PermanentDivision` containing:

- `divisionId`;
- owner nation identifier;
- ordered ship identifiers;
- `flagshipShipId`;
- `commanderOfficerId` or `VACANT`;
- division role;
- preferred formation;
- experience score;
- cohesion score;
- current strategic area or transit record;
- training state;
- activation state;
- creation and last-reorganization months;
- provenance and audit references;
- ruleset version; and
- aggregate hash.

A ship MUST belong to at most one permanent division.

## 3. Permanent Division Size

A permanent division MUST contain from `1` through `5` commissioned ships inclusive.

A destroyer division MAY contain exactly `1..6` ships when every member naturally classifies as `DD`.

No other division may contain more than `5` ships.

A zero-member division MUST be dissolved in the same transaction that removes its final ship.

A size violation MUST fail with `DIVISION_SIZE_LIMIT_EXCEEDED`.

## 4. Canonical Ship-Type Compatibility

The shipped compatibility policy `division_type_compatibility_v1` is:

- identical ship types may group together;
- `BB` and `B` may mix;
- `CA` may join a `BC` division only under Section 5;
- every other mixed-type combination is prohibited.

A division's canonical type is:

- the shared type when all ships match;
- `CAPITAL_BATTLE_LINE` for a `BB` and `B` mix; or
- `BATTLECRUISER_GROUP` for an eligible `BC` and `CA` mix.

Display role, ship name, historical class, displacement similarity, or mission text MUST NOT permit another mixture.

Failure MUST use `DIVISION_SHIP_TYPE_INCOMPATIBLE`.

## 5. CA in BC Division

A `CA` may join a `BC` division only when all predicates hold:

- the division contains at least one `BC`;
- `BC` ships remain a strict majority after assignment;
- no more than `2` CA ships are assigned;
- each CA designed speed is greater than or equal to the slowest BC designed speed minus exactly `1` knot;
- each CA range class is equal to or greater than the division's mission-required range;
- each CA has readiness within `10` points of the division's highest-readiness BC;
- the active ruleset enables policy `ca_in_bc_division_v1`; and
- the intended division role is `CORE`, `SUPPORT`, or `INDEPENDENT`.

A CA may not join a BC division assigned `SCOUT`, `SCREEN`, or `PATROL`.

The shipped ruleset enables this policy.

## 6. Division Co-location

Every permanent division MUST be co-located at every stable strategic snapshot.

Every assigned ship MUST share exactly one strategic area or exactly one shared transit record.

A ship movement command targeting one division member MUST target the complete division unless a `SplitDivisionCommand` completes before movement lock.

A mixed-location division MUST fail with `DIVISION_LOCATION_CONFLICT`.

## 7. Membership Commands

Membership changes MUST use validated commands:

- `CreateDivisionCommand`;
- `AddShipToDivisionCommand`;
- `RemoveShipFromDivisionCommand`;
- `TransferShipBetweenDivisionsCommand`;
- `SplitDivisionCommand`;
- `MergeDivisionsCommand`; or
- `DissolveDivisionCommand`.

Each command MUST validate:

- ownership;
- commissioned and operational status;
- co-location;
- type compatibility;
- size limits;
- unresolved battle and movement locks;
- training lock;
- flagship consequence;
- commander consequence; and
- experience consequence.

Membership changes MUST be atomic.

## 8. Flagship

The first ship in canonical division order MUST be the flagship.

Canonical order is the explicit `shipOrder` stored in the division. It is not alphabetical, database, or UI order.

On division creation, the command MUST declare the order. The first ship becomes `flagshipShipId`.

A flagship change requires `ChangeDivisionFlagshipCommand` or an automatic typed effect caused by loss, capture, or unavailability.

Automatic replacement selects the first eligible surviving ship in current canonical order.

The flagship MUST be an assigned division member and must not be sunk, captured by another nation, scuttled, foundered, abandoned, or under an unavailable major project.

## 9. Commander

A permanent division MUST contain one `commanderOfficerId` or `VACANT`.

Commander eligibility follows `DESIGN-27`, government policy, rank, ship type, availability, and command-conflict rules.

A vacant division remains valid but receives the exact command penalty in Section 16.

Assignment and removal MUST use officer commands and audit records.

One officer MUST NOT command two permanent divisions simultaneously.

## 10. Experience and Cohesion

Division experience and cohesion are separate integer scores within `0..100` inclusive.

- experience represents persistent organizational practice;
- cohesion represents current ability to maneuver and fight together.

A new division begins with:

- experience: `20`;
- cohesion: `30`.

A division created from a deterministic split may receive inherited values under Section 12.

## 11. Routine Experience Change

During monthly personnel and readiness resolution:

- fully funded active division with unchanged organization: experience `+1` every `3` completed months;
- fully funded training month: uses Section 18 instead of routine gain;
- reserve division: experience `-1` every `6` completed months;
- mothballed or inactive division: experience `-1` every `3` completed months;
- unsupported or unpaid active division: no gain and cohesion `-2` that month.

Experience and cohesion clamp once to `0..100`.

## 12. Reorganization Penalties

Membership and command changes apply these shipped immediate penalties:

- add one ship: experience `-5`, cohesion `-10`;
- remove one non-flagship ship: experience `-3`, cohesion `-5`;
- transfer one ship between divisions: apply removal penalty to source and addition penalty to target;
- commander change: experience `-5`, cohesion `-10`;
- flagship change: experience `-5`, cohesion `-10`;
- commander and flagship change in one transaction: combined experience `-8`, cohesion `-15`, not the sum of both;
- reorder ships without flagship change: cohesion `-3`;
- change at least `50%` of membership in one month: additional experience `-10`, cohesion `-15`;
- change division canonical type: additional experience `-10`, cohesion `-20`.

A split distributes source experience and cohesion as follows:

- resulting division retaining the original flagship: `75%` of source scores, rounded down;
- every other resulting division: `50%`, rounded down;
- no resulting division may begin above the source score.

A merge starts with the lower experience and lower cohesion of the source divisions, then applies `-5` experience and `-10` cohesion.

## 13. Division Roles

The canonical roles are:

- `INDEPENDENT`;
- `CORE`;
- `SUPPORT`;
- `SCOUT`;
- `SCREEN`;
- `PATROL`.

Every permanent and tactical division MUST have exactly one role.

Role assignment MUST pass explicit ship-type, mission, formation, technology, and commander predicates.

## 14. Role Eligibility

The shipped role policy is:

- `CORE`: `BB`, `B`, `BC`, `CA`, `CV`, or `CVL` groups;
- `SUPPORT`: `CA`, `CL`, `DD`, `KE`, `AV`, or eligible mixed BC/CA groups;
- `SCOUT`: eligible `CA`, `CL`, or DD divisions satisfying Section 15;
- `SCREEN`: `DD`, `CL`, or `KE` divisions;
- `PATROL`: `CL`, `DD`, `KE`, `AMC`, `AV`, or mission-specific eligible units;
- `INDEPENDENT`: any legal division whose mission permits independent operation.

`BB` and `B` ships MUST NOT receive role `SCOUT`.

An illegal role MUST fail with `DIVISION_ROLE_INELIGIBLE`.

## 15. Destroyer Scout Threshold

A DD division may use role `SCOUT` only when every assigned ship has actual compiled standard displacement strictly greater than `1_500_000` kilograms, equal to more than `1_500` metric tonnes.

A ship exactly at `1_500` tonnes is ineligible.

All ships must also have:

- readiness at least `60`;
- designed speed at least `15_433_320` micrometres per second, equal to `30` knots;
- working search or scouting capability; and
- range sufficient for the mission.

The shipped displacement threshold is exactly `1_500` tonnes. The permitted ruleset range is `1_250..2_000` tonnes, but the selected value MUST be explicit.

## 16. Division Mechanical Effects

The shipped `division_effects_v1` formulas are:

- signaling modifier: `8_000 + experience * 20` basis points;
- contact-retention modifier: `8_000 + experience * 15 + cohesion * 5`;
- fire-distribution modifier: `8_000 + experience * 10 + cohesion * 10`;
- formation-cohesion modifier: `7_500 + cohesion * 25`;
- spotting modifier: `9_000 + experience * 5 + cohesion * 5`;
- effective-crew-performance modifier: `9_000 + experience * 5 + cohesion * 5`.

All final modifiers clamp to `7_500..12_500` basis points.

A vacant commander applies an additional `9_000` basis-point multiplier to signaling, contact retention, and formation cohesion.

These modifiers MUST NOT bypass ship damage, visibility, technology, command reach, or crew rules.

## 17. Formations

The canonical formations are:

- `LINE_AHEAD`;
- `LINE_ABREAST`;
- `SEARCH_LINE`; and
- `SCREEN`.

The shipped formation legality is:

- `LINE_AHEAD`: every division;
- `LINE_ABREAST`: every surface division with at most `5` ships; six-ship DD divisions are ineligible;
- `SEARCH_LINE`: only `SCOUT` or `PATROL` roles with search capability;
- `SCREEN`: only `SCREEN` role or a mission-specific escort projection.

Technology MAY add a formation only through an explicit formation definition and design revision.

## 18. Division Training

A division may enter training only through `ScheduleDivisionTrainingCommand`.

Peacetime training effects for one completed paid month are:

- experience `+3`;
- cohesion `+5`;
- participating ship crew proficiency `+2`.

Wartime training effects are:

- experience `+5`;
- cohesion `+7`;
- participating ship crew proficiency `+3`.

Wartime training is permitted only when the division is outside an active battle theater, fully supplied, and not required by a locked operation.

A training division MUST be unavailable for battle generation for the complete strategic month. This applies even if battle opportunity arises after training was ordered.

Training maintenance and cost follow the owning fleet-management policy.

## 19. Tactical Division

Every accepted battle manifest MUST create battle-local `TacticalDivision` records.

Each record MUST contain:

- `tacticalDivisionId`;
- `battleId`;
- side identifier;
- role;
- formation;
- ordered tactical-unit identifiers;
- tactical flagship identifier;
- tactical commander identifier or `VACANT`;
- source permanent-division identifiers;
- projection-adjustment records;
- campaign-asset provenance records;
- temporary-asset provenance records;
- initial experience and cohesion;
- ruleset version; and
- record hash.

A tactical division exists only for one battle and MUST NOT mutate permanent membership directly.

## 20. Projection from Permanent Divisions

Battle generation MUST preserve a complete permanent division as one tactical division when every assigned ship:

- is battle eligible;
- is present in the battle area;
- is on the correct side;
- satisfies the mission role;
- is not reserved for another unresolved battle; and
- fits scenario force limits.

When these predicates pass, alteration is prohibited except for tactical formation choice.

## 21. Permitted Tactical Adjustments

A permanent division MAY be adjusted only for these explicit reasons:

- `SHIP_UNAVAILABLE`;
- `SHIP_DAMAGED_BELOW_MISSION_REQUIREMENT`;
- `SHIP_OUT_OF_AREA`;
- `SHIP_ALREADY_RESERVED`;
- `MISSION_ROLE_INCOMPATIBLE`;
- `SCENARIO_FORCE_LIMIT`;
- `MANDATORY_ROLE_FILL`;
- `ALLIED_COMMAND_SEPARATION`; or
- `TEMPORARY_GENERATED_ASSET_ASSIGNMENT`.

Permitted adjustment operations are:

- remove an ineligible ship;
- split eligible subsets while preserving original order;
- merge compatible remnants only when the battle-generation repair policy permits it;
- assign a temporary commander when the campaign commander is absent;
- change battle-local role or formation; and
- add declared temporary generated assets.

The projection MUST NOT alter campaign division membership, flagship, commander, experience, or cohesion.

## 22. Tactical Projection Ordering

Projection MUST execute in this order:

1. load permanent divisions by ascending division identifier;
2. preserve complete eligible divisions;
3. remove ineligible ships with reason records;
4. split remaining ships into maximum legal contiguous subsets by original ship order;
5. fill mandatory roles;
6. merge remnants only under explicit repair policy;
7. append temporary generated assets; and
8. canonicalize tactical division identifiers.

A tactical subset uses the first eligible ship in preserved campaign order as tactical flagship.

## 23. Campaign Asset Provenance

Every persistent tactical ship, aircraft unit, submarine unit, commander, and division projection MUST map to a campaign asset through `CampaignAssetProvenance` containing:

- battle asset identifier;
- campaign asset identifier;
- campaign aggregate type;
- source permanent-division identifier or `NONE`;
- source compiled-design identifier and hash;
- pre-battle state hash;
- projection reason;
- persistence disposition; and
- provenance hash.

One campaign asset MUST NOT map to more than one tactical persistent asset in the same battle.

Battle results MUST return through this provenance mapping.

Missing or duplicate provenance MUST fail with `TACTICAL_PROVENANCE_INVALID`.

## 24. Temporary Generated Assets

A temporary tactical asset MUST have `TemporaryAssetProvenance` containing:

- temporary asset identifier;
- generator and version;
- battle manifest identifier;
- canonical source type;
- creation reason;
- battle seed reference;
- persistence disposition;
- campaign consequence policy; and
- provenance hash.

Temporary assets MUST NOT impersonate persistent campaign assets.

Their losses or survival affect campaign state only through the declared consequence policy.

## 25. Tactical Experience and Battle Results

A tactical division begins with the source permanent division's experience and cohesion after battle-local command and damage modifiers.

A tactical split does not divide or reduce permanent experience before battle.

After battle, persistent experience effects MUST be calculated once per source permanent division from:

- battle participation;
- command success;
- formation cohesion;
- losses;
- commander outcome; and
- explicit battle events.

Multiple tactical projections from one source division MUST aggregate before one persistent result is applied.

## 26. Battle-Local Commander

When the permanent commander is eligible and present, the tactical division MUST use that commander.

When unavailable, battle generation MAY assign a temporary eligible commander from participating assets or use `VACANT`.

Temporary assignment MUST be recorded and MUST NOT change permanent command after battle unless a separate campaign command applies.

## 27. Canonical Ordering and Hashing

Permanent divisions MUST be ordered by nation and ascending division identifier.

Ships MUST use stored canonical division order.

Tactical divisions MUST be ordered by side, role priority, source division identifier, and tactical division identifier.

Provenance records MUST be ordered by battle asset identifier.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect results.

## 28. Required Reason Codes

The subsystem MUST define at least:

- `DIVISION_SIZE_LIMIT_EXCEEDED`;
- `DIVISION_SHIP_TYPE_INCOMPATIBLE`;
- `CA_BC_DIVISION_MIX_INELIGIBLE`;
- `DIVISION_LOCATION_CONFLICT`;
- `DIVISION_MEMBERSHIP_CHANGE_INELIGIBLE`;
- `DIVISION_FLAGSHIP_INVALID`;
- `DIVISION_COMMANDER_INVALID`;
- `DIVISION_ROLE_INELIGIBLE`;
- `DIVISION_FORMATION_INELIGIBLE`;
- `DD_SCOUT_DISPLACEMENT_INELIGIBLE`;
- `DIVISION_TRAINING_INELIGIBLE`;
- `TRAINING_DIVISION_BATTLE_INELIGIBLE`;
- `TACTICAL_PROJECTION_ADJUSTED`;
- `TACTICAL_PROJECTION_IRREPARABLE`;
- `TACTICAL_PROVENANCE_INVALID`;
- `TEMPORARY_ASSET_PROVENANCE_INVALID`; and
- `DIVISION_STATE_INVARIANT_FAILED`.

## 29. Validation and Acceptance

Automated validation MUST prove that:

1. every permanent division contains one through five ships, or one through six when all are DD;
2. every ship belongs to at most one permanent division;
3. only identical types, BB/B, and eligible BC/CA combinations may mix;
4. BC remains a strict majority and no more than two CA ships join a BC division;
5. every permanent division is co-located at stable snapshots;
6. membership changes are atomic and use validated commands;
7. the first ship in stored canonical order is the flagship;
8. automatic flagship replacement selects the first eligible surviving ship;
9. each division has one commander or explicit vacancy;
10. new divisions begin at 20 experience and 30 cohesion;
11. every membership, commander, flagship, reorder, split, and merge penalty uses the exact declared values;
12. BB and B cannot scout;
13. DD scouts require every ship to exceed exactly 1,500 tonnes, reach 30 knots, readiness 60, and have scouting capability;
14. division effects use the exact signaling, contact, fire-distribution, cohesion, spotting, and crew formulas;
15. formation legality uses the exact declared predicates;
16. peacetime training grants 3 experience, 5 cohesion, and 2 crew proficiency;
17. wartime training grants 5, 7, and 3 respectively;
18. a training division is unavailable for battle for the complete month;
19. complete eligible permanent divisions are preserved in tactical projection;
20. adjustments occur only for listed reason codes;
21. tactical adjustment never mutates permanent membership or command;
22. tactical splits preserve campaign ship order;
23. every persistent tactical asset maps to exactly one campaign asset;
24. no campaign asset appears twice in one battle;
25. temporary assets use separate provenance and declared consequence policies;
26. battle results aggregate once per source permanent division; and
27. identical campaign state, battle manifest, ruleset, and seed produce identical tactical divisions, provenance, experience results, and hashes.
