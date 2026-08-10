# DESIGN-33: Trade, Raiding, And Merchant Shipping

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-33`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Merchant capacity, trade protection, escort eligibility, raiding, interception, endurance, blockade interaction, scuttling, internment, Q-ships, losses, replacement, and political effects MUST use the explicit values, predicates, phase bindings, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Merchant State

Every active nation MUST have one authoritative `MerchantState` containing:

- `nationId`;
- opening merchant capacity;
- current merchant capacity;
- monthly import requirement;
- convoy capacity;
- cumulative merchant losses;
- monthly replacement capacity;
- trade-disruption score;
- food-import dependency;
- fuel-import dependency;
- regional trade-allocation records;
- trade-protection compliance state;
- active raider records;
- content, ruleset, and formula versions; and
- aggregate hash.

Merchant capacity, import requirement, convoy capacity, losses, and replacement use integer merchant-capacity units.

Trade disruption uses integer range `0..100`.

A missing or invalid state MUST fail with `INVALID_MERCHANT_STATE`.

## 2. Merchant Capacity

Merchant capacity represents the nation's available ocean-going commercial shipping.

Current merchant capacity MUST satisfy:

`currentMerchantCapacity = max(0, openingMerchantCapacity + cumulativeReplacements + explicitTransfers - cumulativeLosses - permanentConversions)`

Merchant capacity MUST NOT become negative.

Merchant shipping is authoritative strategic state and MUST NOT be inferred from visible convoy scenarios.

## 3. Monthly Import Requirement

Each nation MUST have explicit monthly import requirements for:

- food;
- oil;
- strategic materials; and
- other scenario-defined imports.

For each import category:

`requiredMerchantCapacity = ceiling(importRequirement * merchantCapacityPerImportUnit)`

The content pack MUST define every conversion factor. Missing conversion data MUST fail with `IMPORT_CAPACITY_CONVERSION_MISSING`.

## 4. Trade-Protection Requirement

The global monthly trade-protection requirement is:

`globalRequirement = ceiling((economicRequirement + fleetSizeRequirement + submarineThreatRequirement) * wartimeRequirementMultiplierBp / 10_000)`

The shipped components are:

- `economicRequirement`: `500` escort-equivalent units per `10_000` merchant-capacity units, rounded up;
- `fleetSizeRequirement`: `250` units per `100_000_000` kilograms of active and reserve naval displacement, rounded up;
- `submarineThreatRequirement`: `100` units per known or legally estimated enemy submarine operational-strength point;
- peacetime multiplier: `5_000` basis points;
- wartime multiplier: `10_000` basis points.

Every component MUST be explicit and non-negative.

## 5. Global and Regional Protection

Global compliance and regional operational coverage are separate.

Global compliance is:

`globalComplianceBp = min(15_000, floor(globalAssignedProtection * 10_000 / max(1, globalRequirement)))`

Regional coverage is:

`regionalCoverageBp = min(15_000, floor(regionalAssignedProtection * 10_000 / max(1, regionalRequirement)))`

Global compliance prevents or applies political consequences. Regional coverage controls merchant losses, submarine suppression, and raider interception.

Protection assigned to one region MUST NOT count in another region unless a route policy explicitly shares it.

## 6. Eligible Trade Missions

The canonical trade mission identifiers are:

- `ASW_ESCORT`;
- `CONVOY_ESCORT`;
- `HEAVY_ESCORT`;
- `RAIDER_INTERCEPTION`;
- `TRADE_PROTECTION_PATROL`;
- `COMMERCE_RAIDING`;
- `Q_SHIP_PATROL`; and
- `CONVOY_COMMAND`.

A mission assignment MUST use a validated command and pass ship type, readiness, damage, fuel, range, location, technology, crew, mission, and support predicates.

## 7. DD Mission Eligibility

A `DD` may perform:

- `ASW_ESCORT`;
- `CONVOY_ESCORT`;
- `RAIDER_INTERCEPTION` when its range permits;
- `TRADE_PROTECTION_PATROL`; and
- `CONVOY_COMMAND` when an eligible commander and communications capability exist.

Eligibility requires:

- readiness `ACTIVE`;
- damage `OPERATIONAL` or `DEGRADED`;
- mission-compatible ASW or escort equipment;
- sufficient range and fuel;
- support availability; and
- no working-up, dockyard, internment, or unresolved-battle restriction.

## 8. KE Mission Eligibility

A `KE` may perform:

- `ASW_ESCORT`;
- `CONVOY_ESCORT`;
- `TRADE_PROTECTION_PATROL`; and
- `Q_SHIP_PATROL` only when the ship separately qualifies as an AMC conversion, which is prohibited in the shipped ruleset.

A KE MUST NOT perform `COMMERCE_RAIDING`.

## 9. Cruiser Mission Eligibility

`CL`, `CA`, and `BC` ships may perform:

- `RAIDER_INTERCEPTION`;
- `HEAVY_ESCORT`;
- `TRADE_PROTECTION_PATROL`; and
- `COMMERCE_RAIDING` when Section 15 passes.

`BB` and `B` may perform `HEAVY_ESCORT` only through an explicit convoy or strategic-operation contract. They receive no ordinary trade-protection assignment by default.

## 10. AMC Mission Eligibility

An `AMC` may perform:

- `TRADE_PROTECTION_PATROL`;
- `HEAVY_ESCORT`;
- `COMMERCE_RAIDING`;
- `RAIDER_INTERCEPTION`; and
- `Q_SHIP_PATROL` when Section 25 passes.

AMC mission eligibility still requires readiness, damage, fuel, range, support, crew, and equipment predicates.

## 11. ASW and Escort Strength

The shipped mission base values are:

- DD ASW escort: `100` protection units;
- KE ASW escort: `80`;
- DD convoy escort: `80`;
- KE convoy escort: `70`;
- CL heavy escort: `100`;
- CA heavy escort: `125`;
- BC heavy escort: `150`;
- AMC trade protection: `60`;
- CL raider interception: `100`;
- CA raider interception: `125`;
- BC raider interception: `150`.

Effective protection is:

`effectiveProtection = floor(baseMissionValue * crewMultiplierBp * readinessMultiplierBp * damageMultiplierBp * equipmentMultiplierBp * supportMultiplierBp / 10_000^5)`

The exact rational result MUST be rounded once with `FLOOR`.

## 12. Crew and Condition Multipliers

The shipped multipliers are:

### Crew Quality

- `0..19`: `5_000` basis points;
- `20..39`: `7_500`;
- `40..59`: `10_000`;
- `60..79`: `11_000`;
- `80..94`: `12_000`;
- `95..100`: `12_500`.

### Readiness

- readiness score `0..39`: `5_000`;
- `40..59`: `7_500`;
- `60..79`: `10_000`;
- `80..100`: `11_000`.

### Damage

- operational: `10_000`;
- degraded: `6_000`;
- every other damage state: `0`.

### Support

- supported: `10_000`;
- partially supported: `7_500`;
- unsupported: `0`.

Equipment multipliers MUST be supplied by the ASW, escort, sensor, and communication definitions.

## 13. Excess and Insufficient Coverage

Regional coverage affects submarine suppression:

- below `5_000` basis points: suppression multiplier `5_000`;
- `5_000..9_999`: `7_500`;
- `10_000..11_999`: `10_000`;
- `12_000..14_999`: `11_500`;
- `15_000`: `12_500`.

Merchant-loss exposure multiplier is the inverse shipped schedule:

- below `5_000`: `15_000`;
- `5_000..9_999`: `12_500`;
- `10_000..11_999`: `10_000`;
- `12_000..14_999`: `8_500`;
- `15_000`: `7_500`.

Coverage above `15_000` receives no additional benefit.

## 14. Global Compliance Consequences

The shipped monthly global-compliance effects are:

- `10_000` basis points or higher: no political penalty;
- `7_500..9_999`: warning for the first consecutive month, then institutional confidence `-1` per month;
- `5_000..7_499`: confidence `-1` and political capital `-1` per month;
- below `5_000`: confidence `-2` and political capital `-1` per month.

The maximum trade-protection confidence loss is `2` points per month.

Every consequence requires a typed political effect and causal record.

## 15. Raider Eligibility

A ship may perform `COMMERCE_RAIDING` only when all predicates pass:

- ship type is `CL`, `CA`, `BC`, or `AMC`, or another future explicitly eligible type;
- range class is `NORMAL`, `LONG`, or `EXTREME`;
- range class is not `SHORT`;
- readiness is `ACTIVE`;
- damage state is `OPERATIONAL` or `DEGRADED`;
- machinery reliability is at least `40` on the `0..100` scale;
- fuel and supply support the planned endurance;
- ship is not working up, in dockyard state, interned, captured, or reserved for another unresolved operation;
- legal raiding area and route exist; and
- an accepted `AssignRaiderCommand` is locked.

A short-range ship MUST be rejected with `SHORT_RANGE_RAIDER_PROHIBITED`.

## 16. Raider Base Effectiveness

The shipped base raiding values are:

- AMC: `100`;
- CL: `125`;
- CA: `150`;
- BC: `175`.

Effective raiding strength is:

`effectiveRaidingStrength = floor(baseRaidingValue * rangeMultiplierBp * speedMultiplierBp * crewMultiplierBp * damageMultiplierBp * fuelMultiplierBp * machineryMultiplierBp * blockadeTargetMultiplierBp / 10_000^7)`

The exact rational result MUST be rounded once with `FLOOR`.

## 17. Raider Range Multiplier

The shipped range multipliers are:

- `NORMAL`: `10_000` basis points;
- `LONG`: `12_500`;
- `EXTREME`: `15_000`;
- `SHORT`: `0`.

Range improves endurance and mission effectiveness only through this explicit multiplier and Section 20.

## 18. Raider Speed Multiplier

The shipped designed-speed schedule is:

- below `18` knots: `7_500` basis points;
- `18` through below `22`: `10_000`;
- `22` through below `26`: `11_000`;
- `26` through below `30`: `12_000`;
- `30` knots or higher: `13_000`.

Speed uses the current operational maximum after authoritative damage, fuel, and machinery effects, not rounded display speed.

## 19. Raider Machinery and Fuel Multipliers

Machinery reliability uses `0..100`:

- `0..39`: ineligible;
- `40..59`: `7_500` basis points;
- `60..79`: `10_000`;
- `80..94`: `11_000`;
- `95..100`: `12_000`.

Fuel support is:

- full planned endurance supplied: `10_000`;
- at least `75%`: `7_500`;
- at least `50%`: `5_000`;
- below `50%`: mission ineligible.

Fuel and machinery modifiers affect both effectiveness and endurance.

## 20. Raider Endurance

The shipped base endurance by range is:

- `NORMAL`: `2` completed strategic months;
- `LONG`: `4` months;
- `EXTREME`: `6` months.

Final endurance is:

`enduranceMonths = max(1, floor(baseEnduranceMonths * fuelMultiplierBp * machineryMultiplierBp / 10_000^2))`

At endurance expiration, the raider MUST receive a return, resupply, internment, or explicit continuation decision. It MUST NOT remain indefinitely without supply.

## 21. Raider Interception

Every active raider MUST undergo one interception evaluation per month in each region of operation.

The check uses stream:

`trade_warfare/month/war/area/raider_interception`

The shipped interception probability is:

`interceptionProbabilityBp = clamp(0, 10_000, 1_000 + regionalInterceptionCoverageBp / 4 + intelligenceModifierBp + damageModifierBp + fuelModifierBp - speedEvasionBp - rangeEvasionBp)`

Shipped components are:

- base: `1_000` basis points;
- intelligence modifier: `0..2_000` from current knowledge;
- degraded damage modifier: `+1_500`;
- fuel below `75%` planned requirement: `+1_000`;
- speed evasion: `0` below 22 knots, `500` at 22 through below 26, `1_000` at 26 through below 30, `1_500` at 30 or higher;
- long-range evasion: `500`;
- extreme-range evasion: `1_000`.

A successful interception creates an explicit battle opportunity. It does not apply damage directly.

## 22. Raider Damage, Scuttling, and Internment

After an interception battle or operational event, a raider MUST receive one explicit outcome.

### Scuttling Eligibility

Scuttling is eligible when:

- ship is `MISSION_KILLED`, `DEAD_IN_WATER`, `ABANDONED`, or `SINKING` but not already sunk;
- capture probability is at least `5_000` basis points;
- no friendly recovery force can arrive within the event window; and
- commander or automatic damage policy authorizes scuttling.

Scuttling uses a typed outcome and changes damage state to `SCUTTLED`.

### Internment Eligibility

Internment is required when:

- the raider enters a neutral port;
- it cannot legally depart within exactly `24` strategic hours under the neutral-access policy;
- the neutral nation is not a co-belligerent; and
- no treaty grants continued belligerent operation.

Internment removes operational availability for the remainder of the war unless an explicit diplomatic settlement releases the ship.

Damage alone MUST NOT scuttle or intern a ship without the full applicable predicate.

## 23. Target Blockade Interaction

Raider economic effect against a target nation is multiplied by the target's national blockade coverage from `DESIGN-32`:

- coverage below `5_000` basis points: `10_000` raider-effect basis points;
- `5_000..7_499`: `7_500`;
- `7_500..9_999`: `2_500`;
- `10_000`: `0`.

Thus an effectively fully blockaded enemy with `10_000` coverage provides zero additional raider economic effect.

The raider may still create military, intelligence, interception, or political events when eligible.

## 24. Merchant Loss Resolution

Regional merchant losses MUST use:

`merchantLosses = floor(enemyRaidingPressure * merchantExposureBp * regionalLossMultiplierBp * blockadeAvailabilityBp / 10_000^3)`

Losses MUST NOT exceed current merchant capacity assigned to the region.

Every loss MUST create:

- capacity reduction;
- cargo-loss record;
- food or fuel import consequence when applicable;
- war-score and contribution effects;
- replacement demand; and
- report and knowledge records.

## 25. Q-Ship Technology

Q-ship operations require discovered and adopted technology `q_ship_operations`.

The technology applicability type is `DOCTRINE_REQUIRES_TRAINING`.

The shipped adoption requirements are:

- doctrine training: exactly `6` completed paid months;
- equipment package availability;
- trained decoy crew;
- concealed armament inspection; and
- one active Q-ship policy per assigned AMC.

Without adopted technology and completed requirements, `Q_SHIP_PATROL` MUST be rejected with `Q_SHIP_TECHNOLOGY_UNAVAILABLE`.

## 26. Eligible Q-Ship AMC

An AMC is eligible for Q-ship patrol only when:

- aircraft capacity is below `4`;
- maximum gun caliber is no greater than `152_400` micrometres, equal to `6` inches;
- concealed-armament package is installed and operational;
- no qualifying armor is installed;
- designed or operational speed is below `15_433_320` micrometres per second, equal to `30` knots;
- crew quality is at least `50`;
- readiness is `ACTIVE`;
- damage is `OPERATIONAL` or `DEGRADED`;
- mission is `Q_SHIP_PATROL`; and
- ammunition, fuel, and support are available.

## 27. Q-Ship Surprise

Each eligible Q-ship encounter with a submarine performs one surprise check using stream:

`trade_warfare/battle/q_ship/submarine_surprise`

The shipped base surprise probability is exactly `4_000` basis points.

Final probability is:

`surpriseProbabilityBp = clamp(0, 10_000, 4_000 + crewModifierBp + concealmentModifierBp + intelligenceModifierBp - submarineExperienceModifierBp - priorDisclosureModifierBp)`

Shipped components are:

- crew quality `50..69`: `0`;
- `70..84`: `+750`;
- `85..100`: `+1_500`;
- advanced concealment package: `+1_000`;
- current submarine-warning intelligence: `0..1_000`;
- experienced submarine commander or flotilla: `0..1_500` reduction;
- Q-ship identity previously disclosed in the same war: `-3_000`.

## 28. Q-Ship Surprise Outcome

On success:

- the submarine begins the encounter identified to the Q-ship;
- the Q-ship receives one surprise-fire opportunity before normal submarine disengagement resolution;
- Q-ship first-salvo accuracy multiplier is `12_500` basis points;
- submarine initial evasion multiplier is `7_500` basis points for the first tactical minute; and
- the Q-ship's identity becomes disclosed to surviving enemy observers after it opens fire.

On failure, combat proceeds under normal identification and initiative rules.

Surprise MUST NOT guarantee a submarine hit, kill, or inability to retaliate.

## 29. Q-Ship Strategic Limits

The shipped Q-ship limits are:

- maximum active Q-ships: `5%` of active AMC count, rounded up, with a minimum allowance of `1` when at least one AMC exists;
- maximum one Q-ship surprise attempt against the same submarine asset in one encounter;
- disclosed Q-ships receive no undisclosed-identity bonus until the next war; and
- Q-ship losses count as AMC and merchant-support losses under their owning formulas.

## 30. Merchant Replacement

The shipped monthly merchant replacement is:

`replacementCapacity = floor(baseIndustrialMerchantReplacement * wartimeMultiplierBp * resourceMultiplierBp / 10_000^2)`

The shipped wartime multiplier is `7_500` basis points.

Replacement requires paid expenditure and available industrial capacity.

Replacement capacity MUST NOT exceed cumulative merchant losses unless a typed expansion project explicitly increases the pre-war merchant fleet.

## 31. Convoy Capacity

Convoy capacity is an integer strategic capacity distinct from merchant capacity.

It is limited by:

- merchant hulls assigned;
- escort command and communication capability;
- port throughput;
- route availability;
- escort protection; and
- fuel and supply.

A convoy mission MUST NOT allocate more merchant capacity than available convoy capacity.

## 32. Records and Reports

Every monthly trade-warfare resolution MUST produce one immutable `TradeWarfareResolutionRecord` containing:

- war and nation identifiers;
- global and regional requirements;
- assigned eligible ships and mission values;
- crew, readiness, damage, equipment, and support modifiers;
- global compliance and regional coverage;
- submarine suppression;
- raider effectiveness and endurance;
- interception decisions;
- Q-ship decisions;
- merchant losses and replacements;
- blockade interaction;
- war-score, contribution, political, food, and fuel effects;
- RNG decisions;
- ruleset and formula versions; and
- record hash.

Player and AI reports MUST respect intelligence and report delay.

## 33. Canonical Ordering

Trade-warfare resolution MUST order:

1. wars by identifier;
2. target nations by identifier;
3. regions by identifier;
4. protection assignments by mission priority and ship identifier;
5. raiders by ship identifier;
6. interception candidates by interceptor and raider identifier;
7. Q-ship encounters by Q-ship and submarine identifier;
8. merchant-loss categories by category identifier; and
9. effects by declared effect ordinal.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect outcomes.

## 34. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_MERCHANT_STATE`;
- `IMPORT_CAPACITY_CONVERSION_MISSING`;
- `TRADE_PROTECTION_MISSION_INELIGIBLE`;
- `TRADE_PROTECTION_NONCOMPLIANT`;
- `SHORT_RANGE_RAIDER_PROHIBITED`;
- `RAIDER_MACHINERY_UNRELIABLE`;
- `RAIDER_FUEL_INSUFFICIENT`;
- `RAIDER_INTERCEPTED`;
- `RAIDER_SCUTTLED`;
- `RAIDER_INTERNED`;
- `RAIDER_EFFECT_SUPPRESSED_BY_BLOCKADE`;
- `MERCHANT_CAPACITY_INSUFFICIENT`;
- `Q_SHIP_TECHNOLOGY_UNAVAILABLE`;
- `Q_SHIP_AMC_INELIGIBLE`;
- `Q_SHIP_SURPRISE_SUCCEEDED`;
- `Q_SHIP_SURPRISE_FAILED`;
- `Q_SHIP_LIMIT_EXCEEDED`; and
- `TRADE_WARFARE_INVARIANT_FAILED`.

## 35. Validation and Acceptance

Automated validation MUST prove that:

1. merchant capacity, import requirement, convoy capacity, losses, replacement, disruption, food dependency, and fuel dependency are explicit state;
2. global requirement uses exact economy, fleet-size, submarine-threat, and war multipliers;
3. global compliance and regional coverage remain separate;
4. DD, KE, cruiser, AMC, BB, and B mission eligibility follows the exact declared mission matrix;
5. every mission has an explicit base protection value;
6. crew, readiness, damage, equipment, and support modifiers use exact integer formulas;
7. excess and insufficient coverage use exact suppression and loss multipliers;
8. global political penalties use exact thresholds and a two-point monthly confidence cap;
9. short-range ships cannot raid;
10. raiding is limited to explicit types, missions, readiness, damage, machinery, fuel, range, and route predicates;
11. range multipliers are exactly 10,000, 12,500, 15,000, and zero for short range;
12. speed uses the exact five-band schedule;
13. machinery and fuel use exact eligibility and multiplier bands;
14. endurance is exactly 2, 4, or 6 base months by range and ends with an explicit decision;
15. every active raider receives one keyed monthly interception evaluation per region;
16. successful interception creates a battle opportunity and does not apply direct damage;
17. scuttling and internment require every declared predicate and typed outcomes;
18. a fully blockaded target at 10,000 coverage receives zero additional raider economic effect;
19. merchant losses use explicit pressure, exposure, coverage, and blockade formulas;
20. Q-ship patrol requires adopted `q_ship_operations`, six paid doctrine months, equipment, crew, and inspection;
21. only eligible AMCs may perform Q-ship patrol;
22. Q-ship surprise uses exactly 4,000 base probability and the declared modifiers;
23. successful surprise grants exactly 12,500 first-salvo accuracy and 7,500 submarine first-minute evasion;
24. surprise never guarantees a hit or kill;
25. Q-ship limits and disclosure rules use exact values;
26. merchant replacement requires paid expenditure and industrial capacity;
27. monthly records contain complete protection, raiding, interception, Q-ship, loss, replacement, blockade, political, RNG, and hash data; and
28. identical state, commands, content, ruleset, reports, and seeds produce identical protection, raiding, interception, Q-ship, loss, replacement, ledger, and hash results.
