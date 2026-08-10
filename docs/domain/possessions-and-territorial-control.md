# DESIGN-15: Possessions And Territorial Control

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-15`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Legal ownership, military control, occupation, income, access, colonial decline, decolonization, and oil behavior MUST use the explicit state, predicates, fields, values, and phase bindings defined here. Runtime inference and fallback behavior are prohibited.

## 1. Possession Definition

Every possession MUST have one immutable `PossessionDefinition` containing:

- `possessionId`;
- `countryIdentityProvenanceId`;
- `displayNameKey`;
- `areaId`;
- geographic coordinates in canonical fixed-point units;
- ordered port identifiers;
- `baseEconomicValue` in currency micro-units;
- `basePeaceSettlementValue` in integer claim points;
- base infrastructure identifiers;
- air-infrastructure identifiers;
- coastal-defense identifiers;
- oil-resource definition identifier or `NONE`;
- colonial-status definition;
- decolonization-eligibility metadata;
- content version; and
- content hash.

Definitions MUST NOT contain mutable owner, controller, occupier, unrest, damage, development, claims, or current oil-production state.

Missing or invalid definition data MUST fail content validation with `INVALID_POSSESSION_DEFINITION`.

## 2. Possession State

Every materialized possession MUST have one authoritative `PossessionState` containing:

- `possessionId`;
- `legalOwnerNationId`;
- `militaryControllerNationId` or `NONE`;
- `occupierNationId` or `NONE`;
- `controlStatus`;
- economic-value state;
- peace-settlement-value state;
- base-infrastructure state;
- air-infrastructure state;
- coastal-defense state;
- oil-resource state;
- local-unrest score;
- autonomy status;
- ordered claim identifiers;
- occupation-start month or `NONE`;
- last ownership-transition identifier or `NONE`;
- last control-transition identifier or `NONE`;
- state version; and
- aggregate hash.

`controlStatus` MUST be exactly one of:

- `OWNER_CONTROLLED`;
- `FOREIGN_OCCUPIED`;
- `CONTESTED`;
- `UNCONTROLLED`; or
- `AUTONOMOUS_TRANSITION`.

`legalOwnerNationId` MUST always reference exactly one active or supported nation identity. Legal ownership MUST NOT be `NONE` unless an explicit future canonical contract adds stateless territory.

`militaryControllerNationId` and `occupierNationId` MAY be `NONE`, but when `controlStatus` is `FOREIGN_OCCUPIED`, both MUST reference the same foreign nation.

Invalid combinations MUST fail with `INVALID_POSSESSION_STATE`.

## 3. Ownership, Control, and Occupation Separation

Legal ownership, military control, and occupation are separate authoritative fields.

- Legal ownership determines sovereign title.
- Military control determines which nation currently administers and physically controls the possession for military purposes.
- Occupier identifies the foreign belligerent holding territory owned by another nation.

A change to one field MUST NOT silently change another field.

Every state transition MUST use typed effects and produce separate before-and-after values for ownership, control, and occupier.

A possession MUST NOT have more than one legal owner or more than one military controller at a stable snapshot.

## 4. Invasion Resolution

### 4.1 Successful Invasion

A successful invasion MUST apply typed effect `ESTABLISH_MILITARY_CONTROL` during `RESOLVE_AMPHIBIOUS_OPERATIONS` after the invasion battle or deterministic abstraction resolves.

Unless the invasion operation explicitly carries a validated annexation rule, a successful invasion MUST:

- preserve `legalOwnerNationId`;
- set `militaryControllerNationId` to the successful invading nation;
- set `occupierNationId` to the successful invading nation when it differs from the legal owner;
- set `controlStatus` to `FOREIGN_OCCUPIED`;
- record the occupation-start month;
- update access and supply under their declared control-basis policies;
- create occupation and claim records; and
- emit `MILITARY_CONTROL_ESTABLISHED`.

A marginal, failed, cancelled, or ineligible invasion MUST NOT change ownership or control.

The invasion result contract MUST explicitly classify success as `INVASION_SUCCESS`. Descriptive battle text MUST NOT transfer control.

### 4.2 Contested Control

A scenario or battle outcome MAY produce `CONTESTED` only through typed effect `SET_CONTESTED_CONTROL`.

The effect MUST specify:

- controlling claimants;
- operational access policy;
- income policy;
- supply policy;
- duration or reevaluation phase; and
- resolution predicate.

Contested control MUST NOT be inferred from nearby forces or unresolved reports.

## 5. Legal Ownership Transfer

Legal ownership MAY change only through one of:

- an accepted peace-settlement term `TRANSFER_LEGAL_OWNERSHIP`;
- a typed canonical event with the same effect;
- an explicit annexation rule referenced by a resolved operation; or
- a supported continuity transition under `DESIGN-02`.

Every legal-ownership transfer MUST contain:

- `transferId`;
- `possessionId`;
- source legal owner;
- target legal owner;
- effect type;
- authorizing treaty, event, operation, or continuity identifier;
- effective phase;
- control disposition;
- occupier disposition;
- claim disposition;
- economic and obligation transition policies;
- pre-transfer state hash;
- post-transfer state hash; and
- result code.

Ownership transfer MUST apply atomically with every declared related effect.

Military occupation alone, elapsed occupation time, local force superiority, income collection, or map display MUST NOT transfer legal ownership.

An unauthorized ownership mutation MUST fail with `LEGAL_OWNERSHIP_TRANSFER_NOT_AUTHORIZED`.

## 6. Explicit Annexation Rules

An annexation rule MUST be canonical, versioned content containing:

- `annexationRuleId`;
- eligible operation or event types;
- eligible governments;
- target eligibility predicate;
- required control duration in completed months;
- peace-state requirement;
- claim requirement;
- political-capital cost;
- diplomatic and unrest effects;
- ownership effect;
- control effect;
- failure conditions; and
- ruleset version.

The shipped canonical ruleset defines no general wartime annexation rule. Therefore, occupation in war does not transfer legal ownership before peace unless scenario or event content names a specific annexation rule.

A missing referenced rule MUST fail with `ANNEXATION_RULE_MISSING`.

## 7. Effect Basis Contract

Every possession-derived effect MUST declare one `TerritorialEffectBasis`:

- `LEGAL_OWNER`;
- `MILITARY_CONTROLLER`;
- `LEGAL_OWNER_IF_CONTROLLER`;
- `SPLIT_OWNER_CONTROLLER`; or
- `EXPLICIT_FORMULA`.

Every effect definition MUST contain:

- `effectTypeId`;
- `basis`;
- eligibility predicate identifier;
- split basis points when applicable;
- occupation modifier;
- contested-control behavior;
- no-controller behavior;
- rounding mode;
- evaluation phase; and
- formula version.

Missing basis metadata MUST fail content validation with `TERRITORIAL_EFFECT_BASIS_MISSING`.

The runtime MUST NOT infer effect basis from ownership, control, historical convention, UI labels, or event prose.

## 8. Canonical Possession Effect Bases

The shipped policies are:

### 8.1 Income

- policy: `possession_income_basis_v1`;
- basis: `LEGAL_OWNER_IF_CONTROLLER`;
- owner-controlled income multiplier: `10_000` basis points;
- foreign-occupied legal-owner income multiplier: `0` basis points;
- foreign-occupier extraction multiplier: `5_000` basis points;
- contested-control income multiplier: `2_500` basis points, paid to the legal owner;
- uncontrolled income multiplier: `0` basis points.

When foreign occupied, the legal owner receives no possession income. The occupier MAY receive extraction income equal to `5_000` basis points of current possession income before unrest and blockade modifiers.

### 8.2 Strategic Basing and Port Access

- policy: `strategic_basing_basis_v1`;
- basis: `MILITARY_CONTROLLER`;
- legal owner without control receives no normal military basing access;
- allied and treaty access remain subject to explicit access contracts;
- contested control grants no normal construction or major-repair access.

### 8.3 Foreign-Station Obligation

- policy: `foreign_station_basis_v1`;
- basis: `LEGAL_OWNER`;
- foreign occupation suspension: full suspension after `1` completed occupied month;
- reacquisition grace period: `3` completed months;
- newly acquired possession grace period: `6` completed months.

The legal owner retains the obligation during the occupation month. Beginning with the next monthly compliance phase, the obligation is suspended while foreign occupation persists.

### 8.4 Oil Access

- policy: `oil_access_basis_v1`;
- basis: `MILITARY_CONTROLLER` for physical production and local supply;
- legal ownership alone grants no usable production while foreign occupied;
- treaty and international market access are evaluated separately.

### 8.5 Invasion Eligibility

- policy: `invasion_target_basis_v1`;
- a possession is an eligible enemy target when its legal owner or military controller is an opposing participant and all amphibious predicates pass;
- friendly legal ownership with enemy occupation remains eligible as a liberation target.

### 8.6 Diplomatic Friction

- policy: `territorial_friction_basis_v1`;
- legal ownership, control, occupation, and claims are evaluated separately through typed diplomatic modifiers;
- no direct tension value is inferred from possession state.

### 8.7 Peace Claim Value

- policy: `peace_claim_basis_v1`;
- base claim value follows legal ownership and canonical possession value;
- military occupation grants the occupier a claim-priority multiplier of `12_500` basis points;
- occupation does not itself grant ownership.

## 9. Possession Income

Current gross possession income MUST be calculated during `POST_MONTHLY_REVENUE` as:

`developedIncome = floor(baseEconomicValue * developmentMultiplierBp / 10_000)`

`decolonizedIncome = floor(developedIncome * colonialIncomeMultiplierBp / 10_000)`

`unrestAdjustedIncome = floor(decolonizedIncome * unrestIncomeMultiplierBp / 10_000)`

`controlAdjustedIncome = floor(unrestAdjustedIncome * controlIncomeMultiplierBp / 10_000)`

`finalPossessionIncome = floor(controlAdjustedIncome * eventIncomeMultiplierBp / 10_000)`

All multipliers MUST be explicit integers. Final income MUST be non-negative.

Income postings MUST identify the possession, beneficiary, basis policy, inputs, multipliers, rounding, and final amount.

## 10. Colonial Status

Every possession MUST declare one colonial status:

- `CORE_TERRITORY`;
- `INTEGRATED_TERRITORY`;
- `COLONY`;
- `PROTECTORATE`;
- `MANDATE_TERRITORY`;
- `AUTONOMOUS_TERRITORY`; or
- `INDEPENDENCE_TRANSITION`.

Only `COLONY`, `PROTECTORATE`, and `MANDATE_TERRITORY` use the canonical colonial-income decline curve unless an explicit scenario override includes another status.

Core and integrated territories use `colonialIncomeMultiplierBp: 10_000` unless a typed event explicitly changes their income.

## 11. Canonical Colonial-Income Decline Curve

### 11.1 Evaluation Phase

Colonial-income decline MUST be evaluated once per calendar year during January `OPEN_MONTH`, after annual base-resource growth and before January revenue.

### 11.2 Shipped Curve

The shipped policy `decolonization_income_curve_v1` defines these base multipliers by calendar year:

- through 1919: `10_000` basis points;
- 1920 through 1929: `9_500`;
- 1930 through 1939: `9_000`;
- 1940 through 1944: `8_500`;
- 1945 through 1949: `7_500`;
- 1950 through 1954: `6_500`;
- 1955 through 1959: `5_500`;
- 1960 through 1964: `4_500`;
- 1965 through 1970: `3_500`.

Intervals are inclusive. The multiplier changes on January 1 of the first year in each interval.

The curve affects colonial income only. It does not directly change legal ownership, control, base economic value, development, unrest, or peace-settlement value.

A ruleset revision MAY supply another curve, but it MUST contain a complete, non-overlapping interval for every year from 1880 through 1970. Missing or overlapping intervals MUST fail with `INVALID_DECOLONIZATION_INCOME_CURVE`.

## 12. Colonial-Income Modifiers

The final colonial-income multiplier MUST be:

`finalColonialIncomeMultiplierBp = clamp(0, 15_000, baseCurveBp + governmentModifierBp + developmentModifierBp + unrestModifierBp + occupationModifierBp + sumEventModifierBp)`

The shipped modifiers are:

### 12.1 Government

- `liberal_democracy`: `-500` basis points from 1945 onward, otherwise `0`;
- `limited_democracy`: `-250` from 1945 onward, otherwise `0`;
- `autocratic`: `0`;
- `fascist`: `0`;
- `communist`: `-750` from 1945 onward, otherwise `0`;
- `eastern`: `0`.

### 12.2 Local Development

Development score uses integer range `0..100`:

- `0..24`: `-1_000` basis points;
- `25..49`: `-500`;
- `50..74`: `0`;
- `75..89`: `500`;
- `90..100`: `1_000`.

### 12.3 Local Unrest

Local unrest uses integer range `0..100`:

- `0..19`: `0` basis points;
- `20..39`: `-500`;
- `40..59`: `-1_500`;
- `60..79`: `-3_000`;
- `80..100`: `-5_000`.

### 12.4 Occupation

- owner controlled: `0` basis points;
- foreign occupied: control-income behavior from Section 8.1 applies after colonial decline;
- contested: control-income behavior from Section 8.1 applies;
- uncontrolled: final income is `0`.

### 12.5 Events

Event modifiers MUST be explicit signed basis-point values with start month, end month, stacking group, and source identifier. They MUST be ordered by ascending event identifier.

The curve and modifiers MUST NOT consume randomness.

## 13. Decolonization Pressure

Decolonization pressure is a separate political value from colonial-income multiplier.

Every eligible possession MUST have `decolonizationPressure` within `0..100`.

During January political resolution, apply:

`annualPressureDelta = eraDelta + governmentDelta + developmentDelta + unrestDelta + occupationDelta + eventDelta`

The shipped values are:

### 13.1 Era Delta

- through 1919: `0`;
- 1920 through 1939: `1`;
- 1940 through 1944: `2`;
- 1945 through 1949: `5`;
- 1950 through 1959: `7`;
- 1960 through 1970: `9`.

### 13.2 Government Delta

- `liberal_democracy`: `3`;
- `limited_democracy`: `2`;
- `autocratic`: `0`;
- `fascist`: `-1`;
- `communist`: `2`;
- `eastern`: `0`.

### 13.3 Development Delta

- development `0..24`: `2`;
- `25..49`: `1`;
- `50..74`: `0`;
- `75..100`: `-1`.

### 13.4 Unrest Delta

- unrest `0..19`: `0`;
- `20..39`: `1`;
- `40..59`: `3`;
- `60..79`: `5`;
- `80..100`: `8`.

### 13.5 Occupation Delta

- owner controlled: `0`;
- foreign occupied: `5`;
- contested: `3`;
- uncontrolled: `4`.

Final pressure MUST be clamped once to `0..100`.

At pressure `60`, enqueue autonomy-review event if no review occurred in the previous `24` months.

At pressure `80`, enqueue independence-review event if no review occurred in the previous `12` months.

Pressure alone MUST NOT change ownership or create independence. Autonomy and independence require explicit typed political processes.

## 14. Autonomy and Independence

An autonomy or independence process MUST have one authoritative project or political-process record containing:

- target possession;
- initiating event or command;
- eligibility predicate;
- preparation duration;
- political requirements;
- control requirements;
- war restrictions;
- transition effects;
- successor identity definition when independence is possible;
- failure and cancellation behavior; and
- process version.

The shipped minimum preparation durations are:

- autonomy: `12` completed months;
- independence: `24` completed months.

Independence MUST use explicit nation-identity and scenario-continuation content. Runtime creation of a successor nation is prohibited.

## 15. Oil Concepts

The following concepts are separate and MUST NOT be represented by one boolean:

- `OilAccess`: authority to obtain oil for procurement or national supply;
- `OilStockpile`: nationally held quantity available over time;
- `LocalOilSupply`: oil physically available to forces in one area or base network;
- `OilProduction`: monthly output from controlled resources;
- `InternationalOilMarketAccess`: peacetime purchasing eligibility; and
- `WartimeOilImportRoute`: an open wartime route capable of delivering purchased oil.

Each concept MUST have a separate authoritative field or aggregate.

## 16. Oil Resource State

Every oil-bearing possession MUST have one `OilResourceState` containing:

- `possessionId`;
- `resourceStatus`;
- monthly production capacity;
- discovery state;
- discovery event identifier or `NONE`;
- legal owner;
- military controller;
- local storage capacity;
- current local stockpile;
- extraction-damage multiplier;
- blockade exposure; and
- state hash.

`resourceStatus` MUST be:

- `UNDISCOVERED`;
- `DISCOVERED_UNDEVELOPED`;
- `DEVELOPING`;
- `PRODUCING`;
- `DAMAGED`; or
- `EXHAUSTED`.

Only military-controlled producing resources contribute physical production under `oil_access_basis_v1`.

## 17. Pre-1920 Oil Rules

The pre-1920 regime applies through December 1919.

### 17.1 Oil-Fueled New Construction

Before January 1920, design approval or construction order for an oil-fueled ship requires `OilAccess` from at least one of:

- domestic producing oil possession under military control;
- controlled foreign possession with producing oil;
- explicit active oil-supply treaty;
- explicit long-term foreign oil contract; or
- scenario-defined guaranteed oil source.

International market availability alone does not satisfy pre-1920 access.

A missing source MUST reject the command with `OIL_ACCESS_REQUIRED_FOR_CONSTRUCTION`.

The access check occurs at design approval and again at construction order. Loss of access after construction begins does not cancel the project automatically, but future material and policy effects require explicit project rules.

### 17.2 Captured and Foreign-Built Oil Ships

A captured or foreign-built oil-fueled ship MAY be commissioned or operated before 1920 only when fuel supply is available.

Operational fuel supply exists when:

- the nation has positive national oil stockpile and a valid supply route to the ship's area; or
- the ship's current area has positive `LocalOilSupply` accessible to that nation.

Without supply, the ship MUST enter `FUEL_RESTRICTED` state and MUST NOT:

- make normal strategic movement;
- generate normal battle eligibility;
- operate as active foreign-station tonnage; or
- conduct training or exercises requiring fuel.

It MAY remain in port, undergo repair, be scrapped, or receive fuel through an explicit supply action.

Coal-fired ships are unaffected by oil shortage.

## 18. From January 1920

The post-1920 regime begins in January 1920.

### 18.1 Peacetime International Market Access

During peace, every active nation receives `InternationalOilMarketAccess: AVAILABLE` unless an explicit sanction, embargo, scenario rule, or event sets it to `DENIED`.

Peacetime market access permits oil-fueled ship construction and national stockpile purchases. It does not create free oil, local supply, or wartime delivery.

Purchases require paid expenditure, available merchant import capacity, and storage capacity.

### 18.2 Wartime Import Access

At war, peacetime market access alone is insufficient. Imported oil requires at least one valid `WartimeOilImportRoute`.

A route is valid only when:

- source market or allied supplier is accessible;
- destination port is controlled and operational;
- route edges are legal;
- merchant import capacity is positive;
- no complete blockade covers the route;
- interdiction has not reduced delivery to zero; and
- payment is made.

A nation without domestic or controlled production and without a valid import route receives zero new oil supply for that month.

## 19. Oil Stockpile

Every nation using oil MUST have one `OilStockpileState` containing:

- current quantity in oil micro-units;
- maximum capacity;
- monthly production received;
- monthly imports received;
- monthly consumption;
- losses;
- reserved quantity;
- months-of-demand projection; and
- state hash.

Stockpile MUST remain within `0..maximumCapacity`.

Monthly oil allocation priority is:

1. critical naval operations;
2. active battle and movement commitments;
3. minimum active-fleet readiness;
4. local base and aviation requirements;
5. training;
6. discretionary exercises; and
7. stockpile replenishment exports.

Equal-priority allocations use ascending stable demand identifier.

## 20. Oil Shortage and Blockade Vulnerability

The active ruleset MUST define `oil_shortage_v1` with shipped thresholds:

- secure stockpile: at least `6` months of projected demand;
- watch state: below `6` months;
- shortage state: below `3` months;
- critical shortage: below `1` month;
- blockade import reduction when blockade is contested: `5_000` basis points;
- blockade import reduction when blockade is established: `10_000` basis points;
- no-domestic-production vulnerability multiplier: `12_500` basis points on shortage political effects.

Months of demand MUST be calculated in basis points of one month:

`monthsOfDemandBp = floor(currentStockpile * 10_000 / max(1, trailing3MonthAverageDemand))`

State thresholds are:

- `SECURE`: `monthsOfDemandBp >= 60_000`;
- `WATCH`: `30_000 <= monthsOfDemandBp < 60_000`;
- `SHORTAGE`: `10_000 <= monthsOfDemandBp < 30_000`;
- `CRITICAL`: `monthsOfDemandBp < 10_000`.

An established blockade reduces eligible imported delivery to zero. A contested blockade multiplies delivery by `5_000` basis points.

Shortage effects on movement, battle eligibility, readiness, unrest, and confidence MUST use explicit owning formulas. The shortage state itself MUST NOT invent penalties.

## 21. Local Oil Supply

`LocalOilSupply` MUST be calculated per area from:

- controlled producing resources connected to the area;
- delivered stockpile allocation;
- controlled storage facilities;
- allied or treaty supply access;
- route legality;
- infrastructure damage; and
- interdiction results.

A positive national stockpile does not guarantee local supply when no valid supply route exists.

A ship consumes local supply in its current area. It MUST NOT consume oil from an inaccessible remote stockpile.

## 22. Pre-1920 Oil Discoveries

Before January 1920, an undiscovered oil resource may become discovered only through a seeded typed event.

Every discovery event definition MUST contain:

- `eventId`;
- eligible possession identifiers;
- earliest and latest eligible months;
- geological eligibility predicate;
- government and development modifiers;
- event weight;
- mutual-exclusion group;
- setup or runtime stream family;
- stable key contract;
- discovery effect; and
- content version.

Runtime discovery checks MUST use stream `event/month/possession/oil_discovery` and process eligible possessions in ascending possession identifier order.

A successful event MUST set resource status to `DISCOVERED_UNDEVELOPED`. Production requires a separate development project.

The runtime MUST NOT generate an oil discovery for a possession lacking explicit eligible event content.

The `none`, `some`, and `considerable` technology-variation settings MUST NOT alter oil-discovery event timing unless the event definition explicitly opts into campaign setup variation.

## 23. Claims and Peace Value

Every territorial claim MUST contain:

- claimant nation;
- possession;
- claim type;
- strength within `0..100`;
- source;
- start and expiration month;
- visibility;
- peace priority modifier; and
- record hash.

Occupation MAY create an occupation claim but MUST NOT erase preexisting legal claims.

Peace value, occupation priority, strategic objectives, and claims MUST remain separate inputs to settlement formulas.

## 24. Canonical Ordering and Hashing

Possessions MUST be ordered by ascending `possessionId`.

For each possession:

- claims MUST be ordered by claimant and claim identifier;
- ports and infrastructure MUST be ordered by stable identifier;
- event modifiers MUST be ordered by event identifier; and
- oil transactions MUST be ordered by priority and demand identifier.

Database insertion order, localized names, UI ordering, and report ordering MUST NOT affect authoritative results or hashes.

## 25. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_POSSESSION_DEFINITION`;
- `INVALID_POSSESSION_STATE`;
- `MILITARY_CONTROL_ESTABLISHED`;
- `LEGAL_OWNERSHIP_TRANSFER_NOT_AUTHORIZED`;
- `ANNEXATION_RULE_MISSING`;
- `TERRITORIAL_EFFECT_BASIS_MISSING`;
- `INVALID_DECOLONIZATION_INCOME_CURVE`;
- `AUTONOMY_PROCESS_INELIGIBLE`;
- `INDEPENDENCE_PROCESS_INELIGIBLE`;
- `OIL_ACCESS_REQUIRED_FOR_CONSTRUCTION`;
- `OIL_SUPPLY_UNAVAILABLE`;
- `WARTIME_OIL_IMPORT_ROUTE_INVALID`;
- `OIL_STOCKPILE_INSUFFICIENT`;
- `LOCAL_OIL_SUPPLY_UNAVAILABLE`;
- `OIL_DISCOVERY_EVENT_NOT_DEFINED`; and
- `TERRITORIAL_STATE_INVARIANT_FAILED`.

## 26. Validation and Acceptance

Automated validation MUST prove that:

1. legal ownership, military control, and occupation remain separate fields;
2. successful invasion changes military control and preserves legal ownership unless an explicit annexation rule applies;
3. failed or marginal invasion does not alter ownership or control;
4. legal ownership changes only through peace, typed event, explicit annexation, or continuity transition;
5. the shipped ruleset contains no general wartime annexation fallback;
6. every possession effect declares a territorial basis;
7. income uses the shipped owner, occupation, contested, and uncontrolled multipliers;
8. strategic basing follows military control;
9. foreign-station obligation follows legal ownership with the declared suspension and grace periods;
10. oil production and local supply follow military control;
11. every colonial year from 1880 through 1970 maps to exactly one income-curve interval;
12. the shipped colonial-income multipliers match the declared curve;
13. government, development, unrest, occupation, and event modifiers apply in deterministic order;
14. decolonization pressure uses the exact era, government, development, unrest, and occupation deltas;
15. pressure thresholds enqueue review events but never transfer ownership directly;
16. autonomy requires 12 completed months and independence requires 24;
17. oil access, stockpile, local supply, production, market access, and import route remain distinct;
18. before January 1920, oil-fueled new construction requires an explicit oil source;
19. captured and foreign-built oil ships before 1920 require stockpile and route or local supply to operate;
20. from January 1920, peacetime market access is available unless explicitly denied;
21. peacetime market access does not create free oil or wartime delivery;
22. wartime imports require a valid route, payment, capacity, and non-total blockade;
23. contested blockade reduces imports to `5_000` basis points and established blockade reduces them to zero;
24. oil-shortage thresholds use exactly 6, 3, and 1 months of demand;
25. local supply requires a valid physical or delivered source;
26. pre-1920 oil discoveries occur only through explicit seeded events;
27. undiscovered resources require separate development before production;
28. occupation claims do not become ownership automatically;
29. all territorial and oil mutations produce typed causal records; and
30. identical state, content, ruleset, commands, events, and seeds produce identical possession, income, control, decolonization, oil, ledger, and hash results.
