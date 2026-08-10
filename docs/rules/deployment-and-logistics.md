# DESIGN-25: Deployment And Logistics

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-25`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Deployment, division co-location, support, foreign-station obligations, range, blockade restrictions, fuel eligibility, movement outcomes, and battle presence MUST use the explicit values, predicates, phase bindings, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Strategic Location

Every commissioned ship MUST have exactly one authoritative `StrategicLocation` at every stable strategic snapshot.

`StrategicLocation` MUST be exactly one of:

- `AT_AREA` with one `areaId`;
- `IN_CANAL_TRANSIT` with one canal-transit record;
- `INTERNED_AT_PORT` with one port identifier; or
- `CAPTURED_IN_CUSTODY` with one controlling nation and one area or port.

A ship MUST NOT:

- appear in two area-presence lists;
- have an area and canal-transit location simultaneously;
- contribute operational presence to two areas;
- be stored at a planned destination before traversal completes; or
- derive location from UI animation or report text.

A location violation MUST fail with `SHIP_STRATEGIC_LOCATION_NOT_UNIQUE`.

## 2. Deployment State

Every commissioned ship MUST have one authoritative `DeploymentState` containing:

- `shipId`;
- strategic location;
- permanent-division identifier or `NONE`;
- movement-force identifier or `NONE`;
- operational mission;
- range class;
- fuel type;
- fuel status;
- support status;
- foreign-station eligibility;
- battle-presence record identifier or `NONE`;
- active planned-path identifier or `NONE`;
- ruleset version; and
- state hash.

The deployment aggregate MUST be consistent with `DESIGN-14`, `DESIGN-24`, and `DESIGN-26`.

## 3. Division Co-location

Every permanent division MUST be co-located at each stable strategic snapshot.

Co-location means every assigned commissioned ship has the same authoritative strategic area or the same explicit transit record.

A division with ships in different areas is invalid unless a locked `SplitDivisionCommand` has completed before movement and created separate valid divisions.

Mixed-location division state MUST fail with `DIVISION_LOCATION_CONFLICT`.

## 4. Division Movement

A permanent division MUST move as one strategic force when any assigned ship receives a division movement order.

A division movement command MUST include all assigned operational ships unless a split command completed before command lock.

Before movement, the resolver MUST validate every member for:

- current co-location;
- route legality;
- range;
- fuel;
- readiness;
- damage;
- blockade restriction;
- canal and access rights;
- mission compatibility; and
- movement availability.

If any mandatory member fails, the entire division movement MUST be rejected with `DIVISION_MOVEMENT_INELIGIBLE`. No member traverses an edge and no movement fuel is charged.

Partial division movement is prohibited.

## 5. Split Division Command

A mixed-capability division may move separately only after an accepted `SplitDivisionCommand` completes before `LOCK_ALL_COMMANDS`.

The command MUST define:

- source division;
- ordered ships assigned to each resulting division;
- flagship assignments;
- commander assignments or vacancies;
- resulting roles and formations;
- location proof;
- experience redistribution policy; and
- stable resulting division identifiers.

Every resulting division MUST satisfy `DESIGN-26`.

A split MUST occur at one shared location. A split command cannot repair an already illegal mixed-location state.

## 6. Support Capacity

Area support MUST derive only from controlled or legally accessible bases and infrastructure.

The active ruleset MUST define:

- `portLoadFormulaId`;
- `supplyLoadFormulaId`;
- `supportAllocationPriorityId`;
- `temporaryOverloadPolicyId`;
- `unsupportedMaintenancePenaltyId`;
- `unsupportedCrewPenaltyId`; and
- `supportFormulaVersion`.

Each ship's port and supply load MUST use ship type, actual displacement, readiness, mission, damage, and condition.

Missing formulas MUST fail with `AREA_SUPPORT_CONTRACT_MISSING`.

## 7. Support Allocation

The shipped deterministic support priority is:

1. critical repair and safety ships;
2. active battle-ready fleet ships;
3. active foreign-station ships;
4. trade-protection ships;
5. working-up ships;
6. reserve ships;
7. mothballed ships;
8. transient ships.

Equal-priority ships MUST be ordered by ascending ship identifier.

Support allocation consumes no randomness.

A ship receives `SUPPORTED`, `PARTIALLY_SUPPORTED`, or `UNSUPPORTED` status with explicit allocated port and supply quantities.

## 8. Temporary Overload

Temporary support overload is permitted after movement through battle resolution.

Overload MUST NOT create extra support capacity. It defers compliance and penalty application until `RESOLVE_COMPLIANCE` and `MonthClosingSnapshot`.

At compliance, support MUST be reallocated using Section 7 based on final surviving locations.

Unsupported maintenance, readiness, crew, and supply penalties MUST then apply through explicit formulas. A warning alone MUST NOT apply penalties.

## 9. Range Classes

The canonical range classes are:

- `SHORT`;
- `NORMAL`;
- `LONG`; and
- `EXTREME`.

Each compiled design MUST declare exactly one range class.

Range-class assignments MUST come from the ship-design range formula and MUST NOT be inferred from ship type or display text.

## 10. Area Foreign-Station Obligation

Each possession MUST declare a non-negative `foreignStationObligationKg` or an explicit formula that produces kilograms of required qualifying tonnage.

For each strategic area:

`areaRequiredTonnageKg = sum(activePossessionObligationKg)`

Possession obligations MUST be ordered by ascending possession identifier.

The requirement is evaluated during `RESOLVE_COMPLIANCE` using final `MonthClosingSnapshot` locations and possession state.

An obligation with a missing amount or formula MUST fail with `FOREIGN_STATION_OBLIGATION_MISSING`.

## 11. Global Naval-Power Minimum

A nation with active trait `global_naval_power` MUST maintain a global qualifying foreign-station total of at least exactly `1_000` basis points, equal to `10%`, of global eligible tonnage.

`globalMinimumRequiredKg = ceiling(globalEligibleTonnageKg * 1_000 / 10_000)`

`finalGlobalRequiredKg = max(sumAreaRequiredTonnageKg, globalMinimumRequiredKg)`

The shipped value is exactly `1_000` basis points. The permitted ruleset range is `1_000..2_000` basis points inclusive.

A nation without this trait has no separate percentage floor unless another explicit policy supplies one.

## 12. Eligible Foreign-Station Tonnage

A ship contributes only when all predicates pass:

- readiness is `ACTIVE`;
- mission is `FOREIGN_STATION`;
- damage state is `OPERATIONAL` or `DEGRADED`;
- dockyard state is `NONE` or eligible minor maintenance;
- location is `AT_AREA` in the evaluated area;
- ship is not working up, mobilizing, unavailable, interned, captured, sunk, scuttled, or foundered;
- fuel and supply permit continued service;
- range class permits the station; and
- ship type is eligible under the foreign-station policy.

A ship contributes to exactly one area and one global total.

## 13. Foreign-Station Tonnage Multipliers

The shipped contribution multipliers are:

- standard eligible ship: `10_000` basis points;
- colonial-service ship: exactly `15_000` basis points;
- cramped accommodation: `5_000` basis points;
- short range: `5_000` basis points;
- cramped and short range together: multiplicative, resulting in `2_500` basis points;
- degraded damage state: `7_500` basis points;
- partial support: `7_500` basis points;
- unsupported: `0` basis points.

For every eligible ship:

`qualifyingTonnageKg = floor(actualDisplacementKg * productOfApplicableMultiplierBp / 10_000^multiplierCount)`

`colonial-service`, accommodation, range, damage, and support multipliers MUST apply in that order. Rounding occurs once after the final multiplier.

Colonial-service status requires an explicit design feature or service certification. Geographic presence alone does not grant the `15_000` multiplier.

## 14. Area and Global Compliance

For each area:

`areaComplianceBp = min(10_000, floor(areaQualifyingTonnageKg * 10_000 / max(1, areaRequiredTonnageKg)))`

An area with zero requirement is fully compliant at `10_000` basis points.

Global compliance uses the same formula against `finalGlobalRequiredKg`.

A nation is fully compliant only when every non-suspended area reaches `10_000` basis points and the global minimum reaches `10_000` basis points.

Partial compliance values MUST be reported exactly.

## 15. Newly Acquired Possession Grace Period

A newly legally acquired possession receives exactly `6` completed months of foreign-station grace.

The permitted ruleset range is `3..12` months.

The acquisition month is grace month `0`. The first obligation applies at the compliance phase after six completed months have elapsed.

Military occupation without legal ownership does not start a new-acquisition grace period.

Reacquisition of a previously owned possession receives exactly `3` completed months of grace.

## 16. Wartime Blockade Suspension

A possession's foreign-station obligation is suspended only when all predicates hold:

- the legal owner is at war;
- the possession or its required access route is covered by an `ESTABLISHED` hostile blockade;
- no legal unblocked route allows qualifying deployment;
- the possession is not the nation's current home-area obligation; and
- suspension policy `foreign_station_blockade_suspension_v1` applies.

`ATTEMPTED`, `CONTESTED`, `WEAKENED`, or reported blockade states do not suspend the obligation.

Suspension begins in the compliance phase using the current `BlockadeSnapshot` and ends at the first compliance phase where any required predicate fails.

A suspended obligation contributes zero required tonnage and produces no noncompliance penalty.

## 17. Foreign-Station Noncompliance

The shipped policy applies after grace and suspension:

- area compliance `7_500..9_999`: warning only for the first consecutive month, then institutional confidence `-1` per month;
- area compliance `5_000..7_499`: institutional confidence `-1` and political-capital `-1` per month;
- area compliance below `5_000`: institutional confidence `-2` and political-capital `-1` per month;
- global-minimum failure for a global naval power: additional institutional confidence `-1` per month;
- maximum total foreign-station confidence loss per month: `3` points.

Penalties require typed political effects and causal records.

## 18. Short-Range Movement

A `SHORT` range ship MUST NOT perform normal strategic movement outside its home area except through the adjacent-home-area exception.

The exception permits exactly one route edge when all predicates hold:

- the source is the ship's declared home area;
- the destination is directly adjacent through one legal route edge;
- the destination contains a controlled or treaty-accessible port;
- the movement mission is `FLEET`, `TRAINING`, `TRANSIT`, or `REPAIR_TRANSFER`;
- sufficient fuel and support exist;
- the path contains exactly one edge; and
- the movement ends in that destination for the month.

A short-range ship already in an allowed adjacent area may return directly to its home area under the same one-edge rule.

Chained adjacent exceptions, canal transit beyond the adjacent destination, and multi-month leapfrogging through non-home areas are prohibited unless an explicit transport or towing contract applies.

Failure MUST use `SHORT_RANGE_MOVEMENT_RESTRICTED`.

## 19. Blockade Movement Restriction

An established hostile blockade of a nation's relevant home or build area blocks normal outward movement from that area.

The restriction applies when:

- the nation is the blockaded participant;
- the source area belongs to the blockade theater;
- blockade state is `ESTABLISHED` in the current pre-movement state;
- the movement would leave the restricted area; and
- no permitted exception applies.

The shipped permitted exceptions are:

- accepted `RaiderBreakoutCommand`;
- movement caused by a resolved battle withdrawal or pursuit outcome;
- release ordered by an accepted peace settlement;
- evacuation through a typed scenario event; or
- another explicit blockade-breakout contract.

Normal fleet, foreign-station, trade-protection, training, and transit commands do not bypass the blockade.

Failure MUST use `BLOCKADE_MOVEMENT_PROHIBITED`.

## 20. Raider Breakout

A raider breakout requires:

- active war;
- established blockade;
- eligible raider mission;
- ship not short range;
- sufficient fuel;
- legal route edge;
- breakout battle or deterministic breakout-resolution availability; and
- accepted `RaiderBreakoutCommand`.

The command creates an operational opportunity, not guaranteed movement.

Successful breakout movement is applied only by the resolved battle or breakout outcome. Failure leaves the ship in the source area.

## 21. Fuel Types

The canonical strategic fuel families are:

- `COAL`;
- `OIL`;
- `MIXED_COAL_OIL`;
- `NUCLEAR`; and
- `OTHER_EXPLICIT`.

Every compiled design MUST declare one fuel family and explicit consumption formulas.

`MIXED_COAL_OIL` MUST declare the minimum required fraction of each fuel for the attempted operation.

## 22. Fuel Status

Every ship MUST have one fuel status:

- `AVAILABLE`;
- `RESTRICTED`;
- `SHORTAGE`; or
- `EXHAUSTED`.

Status MUST derive from exact available fuel, edge requirement, mission requirement, and local supply.

A national stockpile does not create local availability without a legal supply route under `DESIGN-15`.

## 23. Movement Fuel Check

Before each edge:

`requiredFuel = calculateEdgeFuel(shipOrForce, edge, mission, condition)`

Movement succeeds only when every mandatory fuel quantity is available.

If available fuel is below requirement:

- no ship traverses the edge;
- no movement fuel is charged;
- battle presence remains at the source; and
- result is `INSUFFICIENT_FUEL`.

A force containing several ships fails atomically when any mandatory member lacks fuel.

## 24. Fuel and Battle Eligibility

Battle eligibility requires sufficient fuel for:

- mission entry;
- expected battle operation;
- minimum post-battle recovery reserve; and
- any mandatory return or withdrawal policy.

The shipped minimum recovery reserve is exactly `1_500` basis points, equal to `15%`, of usable fuel capacity.

A ship below the full requirement MUST be excluded with `FUEL_BATTLE_INELIGIBLE` unless the mission contract explicitly permits a fuel-limited defensive battle.

A fuel-limited defensive battle MUST record the exact speed, endurance, withdrawal, and supply penalties.

## 25. Oil Shortage

Oil shortage affects `OIL` ships and the oil-dependent portion of `MIXED_COAL_OIL` ships.

A ship may move and enter battle only when local oil supply satisfies Sections 23 and 24.

National states `SHORTAGE` or `CRITICAL` do not automatically cancel every operation. Allocation follows `DESIGN-15`; operations whose exact demand is funded and locally supplied remain eligible.

Unfunded operations are cancelled or excluded explicitly.

## 26. Coal Ships

A `COAL` ship is not affected by oil-access, oil-stockpile, oil-import-route, or oil-shortage predicates.

Coal ships remain subject to:

- coal supply availability;
- port and local supply;
- range;
- blockade;
- breakdown;
- readiness;
- damage;
- mission; and
- movement restrictions.

A coal ship MUST NOT receive an oil-shortage penalty through a shared generic fuel modifier.

`MIXED_COAL_OIL` ships are not coal-exempt unless their attempted operation's explicit fuel mix requires zero oil.

## 27. Movement Resolution Output

Every resolved movement command MUST produce one immutable `MovementResolutionRecord` containing:

- movement command identifier;
- force and ordered ship identifiers;
- source area;
- attempted route edge;
- traversed route edge or `NONE`;
- final location;
- battle-presence scope;
- range eligibility result;
- blockade eligibility result;
- fuel requirement, allocation, consumption, and result;
- breakdown result;
- interdiction result;
- primary and diagnostic failure reasons;
- pre- and post-state hashes;
- RNG decision references; and
- ruleset and formula versions.

When movement fails, `traversedRouteEdge` MUST be `NONE` and final location MUST equal source location unless an explicit battle or interdiction outcome applies another location.

## 28. Battle Presence

Battle presence MUST derive only from committed movement outcomes under `DESIGN-14` and `DESIGN-10`.

A successfully moved force has presence in the destination area.

A force that fails before departure has presence only in the source area.

A planned path, intended destination, movement animation, or intelligence report MUST NOT create battle presence.

## 29. Canonical Ordering

Deployment and logistics resolution MUST order:

1. movement commands by canonical command order;
2. divisions and forces by ascending stable identifier;
3. ships within a force by division position and ship identifier;
4. possession obligations by possession identifier;
5. support allocation by Section 7;
6. fuel demands by strategic priority and demand identifier; and
7. compliance effects by area and nation identifier.

Database insertion order, UI order, localized names, and wall-clock time MUST NOT affect results.

## 30. Required Reason Codes

The subsystem MUST define at least:

- `SHIP_STRATEGIC_LOCATION_NOT_UNIQUE`;
- `DIVISION_LOCATION_CONFLICT`;
- `DIVISION_MOVEMENT_INELIGIBLE`;
- `DIVISION_SPLIT_REQUIRED`;
- `AREA_SUPPORT_CONTRACT_MISSING`;
- `AREA_SUPPORT_OVERLOADED`;
- `FOREIGN_STATION_OBLIGATION_MISSING`;
- `FOREIGN_STATION_SHIP_INELIGIBLE`;
- `FOREIGN_STATION_NONCOMPLIANT`;
- `FOREIGN_STATION_OBLIGATION_SUSPENDED`;
- `SHORT_RANGE_MOVEMENT_RESTRICTED`;
- `BLOCKADE_MOVEMENT_PROHIBITED`;
- `RAIDER_BREAKOUT_INELIGIBLE`;
- `INSUFFICIENT_FUEL`;
- `FUEL_BATTLE_INELIGIBLE`;
- `LOCAL_FUEL_SUPPLY_UNAVAILABLE`;
- `COAL_SUPPLY_UNAVAILABLE`; and
- `DEPLOYMENT_LOGISTICS_INVARIANT_FAILED`.

## 31. Validation and Acceptance

Automated validation MUST prove that:

1. every commissioned ship has exactly one strategic location;
2. no ship contributes presence to two areas;
3. every permanent division is co-located at stable snapshots;
4. division movement includes every mandatory member and fails atomically when one is ineligible;
5. legal division splitting completes before movement and creates valid divisions;
6. area support comes only from controlled or accessible bases;
7. overload uses deterministic support priority and defers penalties until compliance;
8. every possession obligation has an exact value or formula;
9. global naval powers use exactly `1_000` basis points of eligible tonnage as the shipped minimum;
10. only active foreign-station ships satisfying all eligibility predicates contribute;
11. colonial-service ships contribute exactly `15_000` basis points;
12. cramped and short-range multipliers are each `5_000` and combine multiplicatively to `2_500`;
13. degraded and partially supported ships use exactly `7_500` basis points and unsupported ships contribute zero;
14. area and global compliance use exact integer formulas;
15. newly acquired possessions receive exactly six months of grace and reacquired possessions receive three;
16. only established blockade with no legal route suspends an eligible possession obligation;
17. attempted or contested blockade does not suspend obligations;
18. monthly foreign-station confidence loss is capped at three points;
19. short-range ships remain in the home area except for the exact one-edge adjacent-home exception;
20. chained short-range exceptions are prohibited;
21. established blockade blocks normal outward movement from relevant home and build areas;
22. only declared breakout, battle, peace, or scenario exceptions bypass blockade movement restriction;
23. raider breakout creates an opportunity and does not guarantee movement;
24. movement fuel is checked before each edge and insufficient fuel causes no traversal or charge;
25. battle eligibility reserves exactly 15% recovery fuel in the shipped policy;
26. oil shortage affects oil demand only after explicit allocation and local-supply checks;
27. coal ships receive no oil-shortage penalty;
28. mixed-fuel ships are exempt only when the attempted operation requires zero oil;
29. every movement result contains edge, location, presence, fuel, breakdown, interdiction, and reason data;
30. battle presence derives only from committed movement; and
31. identical state, commands, content, ruleset, and seeds produce identical deployment, support, compliance, movement, fuel, battle-presence, political, ledger, and hash results.
