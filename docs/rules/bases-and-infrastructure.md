# DESIGN-16: Bases And Infrastructure

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-16`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Infrastructure capacity, dock eligibility, expansion, construction allocation, support, and foreign construction MUST use the explicit fields, values, predicates, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Infrastructure Types

The canonical infrastructure type identifiers are:

- `PORT_CAPACITY`;
- `SUPPLY_CAPACITY`;
- `REPAIR_CAPACITY`;
- `REFIT_CAPACITY`;
- `DOCK_SIZE`;
- `SHIPYARD_CONSTRUCTION_CAPACITY`;
- `AIRBASE_CAPACITY`;
- `COASTAL_DEFENSE`;
- `MINE_SUPPORT`; and
- `MISSILE_BATTERY`.

Each installation MUST have one immutable definition and one authoritative state record.

## 2. Infrastructure Definition

Every `InfrastructureDefinition` MUST contain:

- `infrastructureDefinitionId`;
- `infrastructureTypeId`;
- canonical unit;
- base capacity;
- minimum and maximum capacity;
- technology prerequisites;
- possession prerequisites;
- construction project type;
- expansion policy identifier;
- damage policy identifier;
- repair policy identifier;
- operating-cost policy identifier;
- content version; and
- content hash.

Missing or invalid metadata MUST fail with `INVALID_INFRASTRUCTURE_DEFINITION`.

## 3. Infrastructure State

Every materialized installation MUST have one `InfrastructureState` containing:

- `infrastructureId`;
- definition identifier;
- possession identifier;
- area identifier;
- legal owner;
- military controller;
- operating condition;
- nominal capacity;
- damaged capacity;
- reserved capacity;
- occupied capacity;
- available capacity;
- active project identifiers;
- last state-change identifier;
- state version; and
- aggregate hash.

`operatingCondition` MUST be one of:

- `OPERATIONAL`;
- `DEGRADED`;
- `DAMAGED`;
- `DISABLED`;
- `DESTROYED`; or
- `UNDER_CONSTRUCTION`.

For every capacity pool:

`availableCapacity = max(0, nominalCapacity - damagedCapacity - reservedCapacity - occupiedCapacity)`

All terms MUST use the same canonical unit. A negative capacity or inconsistent identity MUST fail with `INFRASTRUCTURE_CAPACITY_INVARIANT_FAILED`.

## 4. Dock Size

### 4.1 Canonical Representation

Dock size MUST be stored as maximum supported ship displacement in kilograms.

One metric tonne equals exactly `1_000` kilograms under `DESIGN-07`.

Every dock MUST declare:

- `maximumNewConstructionMassKg`;
- `maximumMajorRepairMassKg`;
- `maximumRebuildMassKg`;
- `maximumConversionMassKg`;
- ship-dimension predicate identifier;
- emergency-repair policy identifier; and
- dock policy version.

A missing limit MUST fail with `DOCK_LIMIT_MISSING`. The implementation MUST NOT copy another limit implicitly.

### 4.2 New Construction Eligibility

Domestic new construction is eligible only when:

- the builder is controlled by the ordering nation;
- the selected dock and shipyard are operational;
- compiled design displacement is less than or equal to `maximumNewConstructionMassKg`;
- ship dimensions pass the dock-dimension predicate;
- required technology and builder capability are present; and
- construction capacity can be reserved.

A design exceeding the mass or dimension limit MUST be rejected with `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`.

A nation MAY order the ship from a foreign builder only through Section 13.

### 4.3 Major Repair Eligibility

A repair is `MAJOR` when its project definition or damage package is classified `MAJOR_REPAIR`.

It is eligible only when ship displacement is less than or equal to `maximumMajorRepairMassKg` and the dimension predicate passes.

An ineligible major repair MUST fail with `SHIP_EXCEEDS_MAJOR_REPAIR_DOCK_LIMIT`.

Emergency stabilization MAY occur without full major-repair eligibility only when `emergency-repair policy` explicitly lists the permitted work packages. Emergency work MUST NOT restore more capability than the policy permits.

### 4.4 Rebuild and Conversion Eligibility

A rebuild or conversion is eligible only when both the pre-project ship and proposed compiled design version satisfy:

- `maximumRebuildMassKg` or `maximumConversionMassKg`, as applicable;
- ship-dimension predicates;
- technology;
- repair/refit capacity;
- treaty restrictions; and
- builder capability.

A project that would become too large after rebuild MUST be rejected before authorization with `REBUILD_EXCEEDS_DOCK_LIMIT`.

## 5. Dock Expansion

### 5.1 Required Expansion Policy

The active ruleset MUST define `dock_expansion_v1` containing:

- `baseDurationMonths`;
- era-step schedule;
- duration-modifier definitions;
- cost formula identifier;
- construction-capacity requirement;
- interruption policy;
- maximum dock size by era;
- rounding modes; and
- formula version.

The shipped `baseDurationMonths` is exactly `12` completed strategic months.

The permitted ruleset range is `9..18` months inclusive. A selected value MUST be explicit and versioned.

### 5.2 Era Step Schedule

Each completed expansion increases every dock mass limit covered by the project by the era's exact step:

- 1880 through 1899: `1_000` metric tonnes, equal to `1_000_000` kilograms;
- 1900 through 1919: `1_250` metric tonnes, equal to `1_250_000` kilograms;
- 1920 through 1939: `1_500` metric tonnes, equal to `1_500_000` kilograms;
- 1940 through 1959: `1_750` metric tonnes, equal to `1_750_000` kilograms;
- 1960 through 1970: `2_000` metric tonnes, equal to `2_000_000` kilograms.

The applicable era is determined by the campaign month in which the expansion project is authorized. Later calendar advancement does not change the project's stored step.

The permitted step range is `1_000_000..2_000_000` kilograms inclusive.

### 5.3 Duration Modifiers

The final project duration MUST equal:

`finalDurationMonths = clamp(6, 24, ceiling(baseDurationMonths * durationMultiplierBp / 10_000))`

The shipped neutral multiplier is `10_000` basis points.

Every modifier MUST declare source, activation predicate, stacking group, duration, and integer basis points. Missing metadata MUST fail with `INVALID_DOCK_EXPANSION_MODIFIER`.

A dock expansion completes only after both:

- elapsed active project months reach `finalDurationMonths`; and
- paid completed work reaches total work.

Elapsed time alone MUST NOT complete the project.

### 5.4 Expansion Interruption

Occupation, destruction, unpaid work, or loss of required capacity MAY halt or delay the project only through explicit project-state transitions.

A halted month contributes zero active elapsed months and zero work.

A destroyed dock project MUST follow its declared repair, salvage, or cancellation policy. The implementation MUST NOT finish an expansion on a destroyed installation.

## 6. Private Industrial Dock Expansion

Private industrial development MAY create a dock-expansion opportunity only through typed seeded event `private_dock_expansion_opportunity_v1`.

The event definition MUST contain:

- eligible nations and possessions;
- minimum industrial capability;
- minimum current dock utilization of `7_500` basis points over the trailing 12 months;
- minimum treasury liquidity predicate;
- event cooldown of `60` months;
- maximum one active private dock-expansion event per nation;
- event weight;
- stream family `event/month/nation/private_dock_expansion`;
- stable-key contract;
- player or AI choices;
- cost-sharing effects; and
- project creation effect.

Eligible nations MUST be processed in ascending nation identifier order. Possessions MUST be processed in ascending possession identifier order.

A successful event creates a normal dock-expansion project using Section 5. It MUST NOT increase dock size immediately.

A possession without explicit event eligibility MUST never receive inferred private development.

## 7. Shipyard Construction Capacity

### 7.1 Capacity Unit

Shipyard construction capacity MUST use work micro-units per month.

Every shipyard MUST maintain separate pools for:

- `NEW_CONSTRUCTION`;
- `REPAIR`;
- `REFIT_REBUILD`; and
- `INFRASTRUCTURE`, when defined.

One pool MUST NOT borrow from another unless a versioned conversion policy explicitly permits transfer before command lock.

### 7.2 Capacity State

For each pool, the system MUST track:

- nominal monthly capacity;
- damaged capacity;
- reserved capacity;
- occupied capacity;
- available capacity;
- transferred-in capacity;
- transferred-out capacity; and
- capacity state hash.

The canonical equation is:

`availableCapacity = max(0, nominalCapacity - damagedCapacity + transferredInCapacity - transferredOutCapacity - reservedCapacity - occupiedCapacity)`

All transfers MUST balance between source and destination pools.

### 7.3 Active Construction Limit

Total work credited to active projects in one pool and month MUST NOT exceed the pool's post-damage, post-transfer capacity.

Projects MUST reserve monthly capacity before command lock. During project resolution, occupied capacity equals actual work applied.

Unused reservation MUST be released after resolution. It MUST NOT become work or carry forward unless a project contract explicitly creates a future reservation.

Exceeding capacity MUST fail with `SHIPYARD_CAPACITY_EXCEEDED`.

## 8. Capacity Consumption by Project Type

The shipped project-to-pool mapping is:

- surface new construction: `NEW_CONSTRUCTION`;
- submarine new construction: `NEW_CONSTRUCTION`;
- repair: `REPAIR`;
- rebuild: `REFIT_REBUILD`;
- conversion: `REFIT_REBUILD`;
- equipment installation requiring dock work: `REFIT_REBUILD`;
- dock expansion and shipyard expansion: `INFRASTRUCTURE` when present, otherwise a declared external infrastructure pool.

Submarine construction consumes capacity exactly like other new construction according to paid effective work. It MUST NOT use a hidden or zero-cost pool.

A project with missing pool mapping MUST fail with `PROJECT_CAPACITY_POOL_UNDEFINED`.

## 9. AMC and Small-Corvette Exemptions

The shipped ruleset defines:

- `AMC` new construction capacity exemption: `0` basis points;
- designated small-corvette exemption: `0` basis points.

Therefore, both consume full normal construction capacity in the shipped canonical ruleset.

A future ruleset MAY define a non-zero exemption only through `ConstructionCapacityExemptionDefinition` containing:

- eligible ship type;
- eligibility predicate;
- maximum qualifying displacement;
- exempt capacity basis points within `0..10_000`;
- monthly aggregate exemption cap;
- separate external capacity source identifier;
- stacking rule; and
- version.

The exempt amount MUST be backed by the declared external capacity source. Exemption MUST NOT create capacity from nothing.

For any qualifying project:

`normalPoolConsumption = ceiling(appliedWork * (10_000 - exemptCapacityBp) / 10_000)`

`externalPoolConsumption = appliedWork - normalPoolConsumption`

Missing exemption data means exactly `0` basis points, because the shipped value is explicit. Ship name, class description, or UI category MUST NOT infer exemption.

## 10. Capacity Allocation

Within each capacity pool, accepted projects MUST be ordered by:

1. legally mandatory work;
2. safety-critical repair;
3. existing locked project priority;
4. explicit player or AI project priority;
5. ascending project authorization month;
6. ascending project identifier.

Capacity allocation MUST consume no randomness.

For each project:

`allocatedCapacity = min(requestedCapacity, remainingPoolCapacity)`

A project receives zero work for capacity not allocated.

Acceleration pressure and delays follow `DESIGN-13` and MUST NOT permit total work above physical capacity.

## 11. Area Support

Ships consume port and supply load using explicit type, displacement, readiness, mission, and damage formulas.

The active ruleset MUST define:

- `portLoadFormulaId`;
- `supplyLoadFormulaId`;
- `supportAllocationPriorityId`;
- `unsupportedMaintenancePenaltyId`;
- `unsupportedCrewPenaltyId`; and
- `temporaryBattlePresencePolicyId`.

Support allocation MUST be deterministic. The shipped priority is:

1. ships under critical repair;
2. active battle-ready ships;
3. active foreign-station ships;
4. working-up ships;
5. reserve ships;
6. mothballed ships;
7. transient ships.

Equal-priority ships MUST be ordered by ascending ship identifier.

Temporary post-movement presence MAY exceed support capacity through battle resolution. Compliance and penalties MUST be evaluated at `MonthClosingSnapshot` using final surviving locations.

Unsupported penalties MUST be explicit fixed-point values. Missing values MUST fail with `AREA_SUPPORT_PENALTY_MISSING`.

## 12. Airbases

An established airbase begins with capacity for exactly `20` aircraft.

Each completed expansion increases capacity by exactly `20` aircraft.

The active ruleset MUST define maximum capacity by technology tier and possession infrastructure. The final maximum is the lower of the two limits.

An expansion exceeding the current maximum MUST be rejected with `AIRBASE_MAXIMUM_CAPACITY_REACHED`.

Damaged aircraft count against physical capacity until repaired, transferred, written off, or removed by a typed effect.

## 13. Foreign Construction Contract

### 13.1 Required Contract

Every foreign construction order MUST create one immutable `ForeignConstructionContract` containing:

- `contractId`;
- ordering nation identifier;
- builder nation identifier;
- builder shipyard identifier;
- compiled design version identifier;
- quantity;
- total work per unit;
- total price and currency unit;
- payment schedule;
- capacity reservation schedule;
- authorization month;
- planned keel month;
- planned delivery month;
- builder capability snapshot hash;
- technology-transfer policy identifier;
- war-delay policy identifier;
- impoundment policy identifier;
- delivery-guarantee clause identifier or `NONE`;
- occupation and destruction policy identifier;
- cancellation and refund policy identifier;
- governing treaty identifiers;
- ruleset and formula versions; and
- contract hash.

Foreign construction without a complete accepted contract MUST fail with `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`.

### 13.2 Builder Capability

Before acceptance and before keel laying, the builder MUST satisfy:

- compiled design displacement and dimensions within builder dock limits;
- required technology or licensed design capability;
- required shipyard construction capability;
- available `NEW_CONSTRUCTION` capacity;
- government and treaty permission;
- ability to source required components; and
- no physical occupation or destruction preventing work.

Capability MUST be revalidated monthly for volatile conditions.

Missing capability MUST reject acceptance or produce an explicit delayed or impossible outcome under the contract. It MUST NOT downgrade the design silently.

### 13.3 Capacity Reservation

Foreign construction consumes the builder's physical construction capacity, not the ordering nation's capacity.

Reservations MUST compete with domestic and other foreign projects under the builder's declared contract-priority policy.

The shipped priority places accepted existing foreign contracts after legally mandatory domestic work and before new discretionary domestic projects.

A builder MUST NOT sell the same capacity twice.

### 13.4 Payment

Payments MUST use balanced ledger postings and the schedule stored in the contract.

Unpaid installments follow the contract's explicit grace, delay, cancellation, and refund rules. Unpaid work receives zero progress.

The shipped payment grace period is `1` month. After that month, the project enters `PAYMENT_DEFAULT_DELAYED` until payment or contract termination.

### 13.5 Technology Insight

Foreign construction MAY transfer research insight only when the contract references `foreign_construction_insight_v1` and the ordering nation lacks the relevant discovered technology.

The shipped policy grants:

- design-study insight: `500` research micro-points per eligible major technology family at contract acceptance;
- construction-observation insight: `1_000` research micro-points per eligible family at 50% paid work;
- delivery insight: `1_500` research micro-points per eligible family at delivery;
- maximum total insight per technology family and contract: `3_000` research micro-points.

Insight MUST NOT:

- grant a technology directly;
- bypass prerequisites;
- move availability dates;
- duplicate a milestone already awarded; or
- exceed the technology's remaining research requirement.

Technology families eligible for insight MUST be explicitly listed by the compiled design and policy.

### 13.6 War Effects

At war entry involving the ordering nation, builder nation, or builder's controller, the contract MUST evaluate `foreign_contract_war_policy_v1`.

Outcomes MUST be exactly one of:

- `CONTINUE`;
- `DELAY`;
- `SUSPEND`;
- `IMPOUND`;
- `CANCEL_WITH_SETTLEMENT`; or
- `PHYSICALLY_IMPOSSIBLE`.

The shipped rules are:

- allied co-belligerents: `CONTINUE` unless physical conditions fail;
- neutral builder and ordering nation at war with a third party: `CONTINUE` unless an explicit neutrality, embargo, or treaty predicate requires `DELAY` or `SUSPEND`;
- builder and ordering nation become enemies: `IMPOUND` unless a valid delivery guarantee prohibits discretionary impoundment;
- builder shipyard occupied, disabled, or destroyed: `PHYSICALLY_IMPOSSIBLE` when work cannot continue or delivery cannot occur;
- explicit embargo: `SUSPEND` or `CANCEL_WITH_SETTLEMENT` according to the embargo effect.

Every outcome MUST define payment, work, capacity, ownership of incomplete hulls, refund, and delivery effects.

### 13.7 Impoundment

Impoundment transfers custody of the incomplete or completed asset to the builder or controlling authority under the contract policy. It does not silently transfer legal title unless the typed outcome declares that transfer.

An impoundment MUST record:

- authorizing war or event predicate;
- asset custody;
- legal title;
- paid and unpaid amounts;
- compensation or forfeiture;
- project status;
- future delivery eligibility; and
- causal record.

Discretionary impoundment without a policy result MUST fail with `FOREIGN_CONTRACT_IMPOUNDMENT_NOT_AUTHORIZED`.

## 14. Delivery Guarantee

A delivery guarantee is valid only when an active treaty clause or contract clause defines:

- guarantor parties;
- protected contract identifiers or class;
- effective and expiration dates;
- compliance predicate;
- compensation policy;
- dispute effects; and
- clause version.

When valid, it prohibits `IMPOUND` based solely on discretionary political choice, neutrality preference, or war with the ordering nation.

It MUST NOT override physical impossibility caused by:

- builder shipyard occupation;
- builder shipyard destruction;
- dock or route destruction;
- completed ship destruction;
- unavailable required components with no legal substitute;
- inaccessible delivery route when no alternate route exists;
- force majeure explicitly listed by the guarantee; or
- loss of builder state continuity without a supporting successor obligation.

When a protected contract becomes physically impossible, the result MUST be `PHYSICALLY_IMPOSSIBLE`, not `IMPOUND`.

The guarantee's compensation and settlement rules still apply when declared.

## 15. Delivery

Delivery requires:

- project completion;
- full required payment or an explicit financed-delivery clause;
- trials and acceptance predicates;
- legal delivery route;
- recipient port eligibility;
- no physical destruction;
- no unresolved authorized impoundment; and
- available recipient crew or declared caretaker status.

On delivery, legal title, asset custody, location, design artifact, defects, inventory, and ledger state MUST transfer atomically.

A failed delivery predicate MUST produce an explicit delayed or impossible outcome. The ship MUST NOT appear in both nations' fleets.

## 16. Damage, Occupation, and Destruction

Infrastructure damage MUST reduce `damagedCapacity` explicitly.

Occupation changes military control under `DESIGN-15`; it does not automatically repair, destroy, or transfer legal ownership of infrastructure.

A controller MAY use infrastructure only when the possession and infrastructure access policies permit it.

Destroyed infrastructure has zero available capacity until reconstructed through an explicit project.

Active projects at an occupied or destroyed site MUST receive one explicit outcome:

- `CONTINUE_UNDER_CONTROLLER`;
- `SUSPEND`;
- `IMPOUND`;
- `TRANSFER_BY_TYPED_EFFECT`;
- `CANCEL`;
- `SALVAGE`; or
- `PHYSICALLY_IMPOSSIBLE`.

## 17. Canonical Ordering and Hashing

Infrastructure MUST be ordered by:

1. area identifier;
2. possession identifier;
3. infrastructure type ordinal;
4. infrastructure identifier.

Capacity reservations MUST be ordered by pool priority, project priority, authorization month, and project identifier.

Foreign contracts MUST be ordered by builder nation, builder shipyard, authorization month, and contract identifier.

Database insertion order, UI order, localized names, and wall-clock timing MUST NOT alter capacity allocation or hashes.

## 18. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_INFRASTRUCTURE_DEFINITION`;
- `INFRASTRUCTURE_CAPACITY_INVARIANT_FAILED`;
- `DOCK_LIMIT_MISSING`;
- `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`;
- `SHIP_EXCEEDS_MAJOR_REPAIR_DOCK_LIMIT`;
- `REBUILD_EXCEEDS_DOCK_LIMIT`;
- `INVALID_DOCK_EXPANSION_MODIFIER`;
- `SHIPYARD_CAPACITY_EXCEEDED`;
- `PROJECT_CAPACITY_POOL_UNDEFINED`;
- `AREA_SUPPORT_PENALTY_MISSING`;
- `AIRBASE_MAXIMUM_CAPACITY_REACHED`;
- `FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED`;
- `FOREIGN_BUILDER_CAPABILITY_INSUFFICIENT`;
- `FOREIGN_BUILDER_CAPACITY_UNAVAILABLE`;
- `FOREIGN_CONTRACT_PAYMENT_DEFAULT`;
- `FOREIGN_CONTRACT_IMPOUNDMENT_NOT_AUTHORIZED`;
- `DELIVERY_GUARANTEE_ACTIVE`;
- `FOREIGN_CONTRACT_PHYSICALLY_IMPOSSIBLE`;
- `FOREIGN_CONTRACT_DELIVERY_DELAYED`; and
- `INFRASTRUCTURE_STATE_INVARIANT_FAILED`.

## 19. Validation and Acceptance

Automated validation MUST prove that:

1. every infrastructure record declares type, unit, capacity, limits, project, damage, repair, and cost policies;
2. available capacity always equals the declared capacity equation;
3. new construction cannot exceed domestic dock mass or dimension limits;
4. major repair and rebuild use their separate dock limits;
5. dock expansion uses exactly 12 months in the shipped ruleset;
6. alternate duration values remain within 9 through 18 months;
7. expansion steps are exactly 1,000, 1,250, 1,500, 1,750, and 2,000 metric tonnes for the declared eras;
8. a project's step is locked at authorization;
9. elapsed time alone cannot complete unpaid expansion work;
10. private expansion occurs only through the explicit seeded event;
11. private expansion creates a normal project rather than immediate capacity;
12. new construction, repair, refit/rebuild, and infrastructure pools remain separate;
13. submarine construction consumes normal new-construction capacity;
14. the shipped AMC and small-corvette exemptions are exactly zero;
15. any future exemption is backed by explicit external capacity;
16. reserved, occupied, damaged, transferred, and available capacity remain separately tracked;
17. total monthly work never exceeds physical capacity;
18. airbases begin at 20 aircraft and expand by 20;
19. every foreign order has a complete formal contract;
20. foreign construction uses builder capability and builder capacity;
21. builder capacity cannot be double sold;
22. unpaid foreign work receives zero progress;
23. insight awards use exactly 500, 1,000, and 1,500 research micro-points and never grant technology;
24. war outcomes resolve to one declared contract state;
25. delivery guarantees block discretionary impoundment;
26. delivery guarantees do not override occupation, destruction, or other declared physical impossibility;
27. physically impossible protected contracts use settlement rather than silent disappearance;
28. delivery transfers title, custody, location, artifact, defects, inventory, and ledger state atomically;
29. occupation and destruction produce explicit project outcomes; and
30. identical state, commands, contracts, ruleset, events, and seeds produce identical infrastructure, capacity, contract, ledger, event, and hash results.
