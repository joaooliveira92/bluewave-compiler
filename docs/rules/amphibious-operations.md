# DESIGN-36: Amphibious Operations

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-36`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Invasion planning, range, staging, transport, escort, naval superiority, preparation, launch, battle resolution, occupation, ownership, and blitzkrieg invasion MUST use the explicit values, predicates, streams, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Invasion Plan

Every proposed invasion MUST have one authoritative `InvasionPlan` containing:

- `invasionPlanId`;
- owner nation;
- target possession;
- target port or landing zone;
- staging port;
- ordered transport identifiers;
- ordered escort identifiers;
- bombardment-support identifiers;
- air-support identifiers;
- preparation progress basis points;
- required preparation work;
- completed preparation work;
- required transport capacity;
- assigned transport capacity;
- required escort strength;
- assigned escort strength;
- supply-endurance days;
- intelligence-confidence basis points;
- earliest and latest launch months;
- active blockade references;
- planned route;
- operation type;
- status;
- ruleset and formula versions; and
- plan hash.

`status` MUST be exactly one of:

- `DRAFT`;
- `PREPARING`;
- `READY`;
- `DELAYED`;
- `LAUNCHED`;
- `RESOLVING`;
- `SUCCEEDED`;
- `FAILED`;
- `CANCELLED`; or
- `EXPIRED`.

## 2. Operation Types

The canonical operation types are:

- `STANDARD_INVASION`;
- `RAID`;
- `LIBERATION`;
- `BLITZKRIEG_INVASION`; and
- `SCENARIO_SPECIAL`.

Every type MUST define transport, escort, preparation, range, supply, battle, occupation, and political policies.

A missing policy MUST fail with `INVALID_AMPHIBIOUS_OPERATION_TYPE`.

## 3. Eligibility Evaluation

An invasion may become `READY` only when all predicates pass:

- an active war or explicit scenario authorization exists;
- target is legally eligible;
- target lies within final invasion range;
- staging port is valid;
- planned route is legal;
- assigned transport capacity meets or exceeds requirement;
- assigned escort strength meets or exceeds requirement;
- required local naval superiority is present;
- preparation progress equals `10_000` basis points;
- supply endurance meets the operation minimum;
- blockade permits launch;
- mine and route risk remain within operation limits;
- intelligence confidence meets the operation minimum;
- participating assets are available and not double-reserved; and
- government authorization is valid.

Failure of any predicate MUST produce a machine-readable reason and MUST NOT consume a launch random decision.

## 4. Target Eligibility

A target possession is eligible only when:

- it exists in canonical content;
- its legal owner or military controller is an opposing participant, or the operation is an authorized liberation;
- it has an explicit landing zone or eligible target port;
- scenario and treaty rules permit invasion;
- it is not already controlled by the invading nation;
- no unresolved invasion already targets it; and
- the operation can produce a valid control disposition under `DESIGN-15`.

Target text, adjacency, historical plausibility, or AI preference MUST NOT create eligibility.

## 5. Valid Staging Port

A staging port is valid only when:

- the invading nation controls it or possesses explicit allied access;
- port condition is `OPERATIONAL` or `DEGRADED` with sufficient usable capacity;
- available port load supports all transports, escorts, and supply ships;
- local supply is sufficient;
- required amphibious infrastructure and technology exist;
- no established hostile blockade closes departure;
- the port is connected to the target by a legal maritime route; and
- no occupation, mine, treaty, or access rule prohibits use.

The shipped minimum usable port-capacity ratio is `7_500` basis points of operation demand.

Below this value, staging MUST fail with `AMPHIBIOUS_STAGING_PORT_CAPACITY_INSUFFICIENT`.

## 6. Invasion Distance

Invasion distance MUST be measured between the selected staging port and target port or landing zone along the shortest currently legal maritime route.

Each route edge MUST declare an exact nautical-mile distance. The route distance is the integer sum of those edges.

The calculation MUST include canal and choke-point legality, current diplomacy, blockade, mine closure, and route condition.

Straight-line map distance, UI coordinates, and visual proximity MUST NOT be used.

## 7. Base Invasion Range

The shipped base national invasion range is exactly `1_500` nautical miles.

The active ruleset MUST define `amphibious_invasion_range_v1` with:

- base range in nautical miles;
- technology multiplier;
- national-trait multiplier;
- first-war-year multiplier;
- blockade multiplier;
- logistics multiplier;
- minimum and maximum final range;
- rounding mode; and
- formula version.

The permitted base range is `1_000..2_000` nautical miles. The selected shipped value is `1_500`.

## 8. Technology Range Multipliers

The shipped amphibious-technology multipliers are:

- no amphibious technology: `7_500` basis points;
- `basic_amphibious_operations`: `10_000`;
- `advanced_amphibious_operations`: `12_500`;
- `modern_amphibious_logistics`: `15_000`.

The highest discovered and adopted eligible capability applies. Multipliers do not stack.

A nation without basic technology may plan only `RAID` or scenario-authorized operations unless its range and operation policy explicitly permit otherwise.

## 9. Trait Range Multipliers

The shipped trait effects are:

- `global_naval_power`: `12_000` basis points;
- eligible active `surprise_attack` during the first war year: `12_500` basis points;
- both traits together: multiplicative.

The surprise-attack range effect applies only:

- during the first `12` completed months after the nation's entry into that war;
- before the campaign's single surprise-attack use is consumed;
- to an operation explicitly marked as part of that surprise opportunity; and
- while every `DESIGN-12` surprise predicate remains true.

## 10. Blockade and Logistics Range Modifiers

The shipped blockade multipliers are:

- no relevant blockade: `10_000` basis points;
- contested blockade affecting staging or route: `8_500`;
- weakened blockade: `7_500`;
- established hostile blockade of staging port: `0`.

The shipped logistics multipliers are:

- full supply and merchant capacity: `10_000`;
- `7_500..9_999` basis points of required supply: `8_500`;
- `5_000..7_499`: `6_000`;
- below `5_000`: `0`.

A zero multiplier makes the operation launch-ineligible.

## 11. Final Invasion Range

The final range is:

`finalRangeNm = floor(baseRangeNm * technologyMultiplierBp * traitMultiplierBp * surpriseMultiplierBp * blockadeMultiplierBp * logisticsMultiplierBp / 10_000^5)`

The result MUST be clamped to `500..4_000` nautical miles.

The exact rational result MUST be retained through all multipliers and rounded once with `FLOOR`.

The target is within range exactly when:

`routeDistanceNm <= finalRangeNm`

Equality is legal.

## 12. Transport Requirement

Every target MUST declare troop, equipment, and supply landing requirements.

The shipped transport formula is:

`requiredTransportCapacity = troopRequirement + equipmentRequirement + ceiling(supplyRequirementFor30Days)`

A standard invasion requires exactly `30` days of landing and initial sustainment supply.

A raid requires `7` days. A blitzkrieg invasion requires `45` days.

Assigned transport capacity MUST be at least the exact requirement. Partial capacity does not permit launch.

Transport assets MUST be commissioned, available, co-located at staging, fueled, supplied, and unreserved.

## 13. Escort Requirement

Transports MUST have escorts from staging departure through landing-resolution completion.

The shipped minimum escort requirement is:

`requiredEscortStrength = max(100, ceiling(assignedTransportCapacity / 100))`

Escort strength uses the amphibious-escort mission values:

- DD: `100`;
- KE: `80`;
- CL: `125`;
- CA: `150`;
- BC: `175`;
- BB: `200`;
- CVL: `150`;
- CV: `200`.

Effective escort strength applies readiness, damage, crew, fuel, supply, air-cover, and mission multipliers.

A transport force without sufficient escort MUST fail with `AMPHIBIOUS_ESCORT_INSUFFICIENT`.

## 14. Local Naval Superiority

Naval superiority MUST be evaluated using committed post-battle eligible strength in the target area and route approaches.

`navalSuperiorityRatioBp = floor(friendlyEligibleStrength * 10_000 / max(1, enemyEligibleStrength))`

The shipped minimum for launch is exactly `11_000` basis points.

The permitted ruleset range is `10_000..15_000`.

Friendly strength includes assigned escort, bombardment, carrier support, mine-clearing support, and eligible allied support.

Enemy strength includes eligible defending surface, carrier, submarine, mine, coastal-defense, and air threats through their explicit weights.

The same asset MUST NOT be counted twice.

## 15. Preparation

The shipped preparation requirements are:

- raid: `3` completed paid months;
- standard invasion: `6` completed paid months;
- liberation: `4` completed paid months;
- blitzkrieg invasion: `3` completed paid months;
- scenario special: explicit policy required.

Each fully paid eligible month grants:

`preparationProgressBp = floor(10_000 / requiredPreparationMonths)`

The final required month sets progress exactly to `10_000`.

A partially paid month below `10_000` basis points grants no progress and does not erase prior progress.

Preparation is preserved during ordinary delay but decays under Section 16.

## 16. Preparation Decay

Preparation decays when the operation is delayed after its latest planned launch month:

- first delayed month: no decay;
- second and third consecutive delayed months: `-500` basis points per month;
- fourth and later months: `-1_000` per month;
- staging-port loss or target change: reset to `0`;
- transport replacement above `25%`: `-1_500`;
- escort replacement above `50%`: `-1_000`.

Progress clamps to `0..10_000`.

A failed launch check alone does not erase preparation.

## 17. Launch Probability

A ready operation MUST perform exactly one launch-reliability check in its launch month unless the final probability is `10_000`.

The shipped formula is:

`launchProbabilityBp = clamp(0, 10_000, 5_000 + navalSuperiorityModifierBp + technologyModifierBp + intelligenceModifierBp + weatherModifierBp + supplyModifierBp + surpriseModifierBp - mineRiskPenaltyBp - blockadePenaltyBp)`

### Naval Superiority Modifier

- ratio below `11_000`: ineligible;
- `11_000..12_499`: `0`;
- `12_500..14_999`: `+1_000`;
- `15_000..19_999`: `+2_000`;
- `20_000` or higher: `+3_000`.

### Technology Modifier

- no capability: `-1_500` where launch is otherwise permitted;
- basic: `0`;
- advanced: `+1_000`;
- modern: `+2_000`.

### Intelligence Modifier

- confidence below `4_000`: `-1_000`;
- `4_000..5_999`: `0`;
- `6_000..7_999`: `+500`;
- `8_000..10_000`: `+1_000`.

Every remaining modifier MUST be explicit in the weather, supply, surprise, mine, or blockade policy.

The check MUST use stream `amphibious/month/war/operation/launch`.

## 18. Launch Failure

A failed launch check MUST:

- preserve current preparation after applying only Section 16 decay;
- set status `DELAYED`;
- delay the operation by exactly `1` month;
- release battle-local reservations while preserving the plan;
- consume paid launch-month staging and readiness costs;
- apply zero invasion battle or territorial effects; and
- create one explicit failure outcome.

The shipped political cost is:

- first failed launch: institutional confidence `0`;
- second consecutive failed launch: `-1`;
- third and later consecutive failures: `-2` per failure.

A success resets consecutive launch failures to `0`.

## 19. Transport Escort Continuity

Transport escort MUST be revalidated at:

- staging departure;
- each route edge;
- interception battle creation;
- post-battle continuation; and
- landing approach.

If escort strength falls below `7_500` basis points of the required value before the landing approach, the operation MUST halt, retreat, divert, or continue only through an explicit emergency decision.

Automatic unescorted continuation is prohibited.

## 20. Invasion Battle Manifest

A launched operation MUST create one immutable `AmphibiousBattleManifest` containing:

- operation and war identifiers;
- target possession and landing zone;
- transports and carried capacity;
- escort, bombardment, mine, air, submarine, and coastal forces;
- defender forces and defenses;
- weather, sea state, mine pressure, and supply state;
- intelligence state;
- mission objectives;
- battle seed;
- auto-resolution proof;
- campaign-asset provenance; and
- manifest hash.

The operation MUST be auto-resolvable.

## 21. Amphibious Battle Outcome

The battle resolver MUST produce one outcome:

- `DECISIVE_ATTACKER_VICTORY`;
- `MAJOR_ATTACKER_VICTORY`;
- `MARGINAL_ATTACKER_VICTORY`;
- `STALEMATE`;
- `MARGINAL_ATTACKER_DEFEAT`;
- `MAJOR_ATTACKER_DEFEAT`; or
- `DECISIVE_ATTACKER_DEFEAT`.

Landing success occurs only for:

- `DECISIVE_ATTACKER_VICTORY`; or
- `MAJOR_ATTACKER_VICTORY`.

A marginal attacker victory does not establish military control in the shipped ruleset. It creates a beachhead-withdrawal or follow-up event according to the battle result.

This is the concrete replacement for “more than marginal victory succeeds.”

## 22. Transport Losses

The shipped transport-capacity loss bands are:

- decisive attacker victory: `0..500` basis points;
- major attacker victory: `500..1_500`;
- marginal attacker victory: `1_000..2_500`;
- stalemate: `2_000..4_000`;
- marginal attacker defeat: `3_000..5_000`;
- major attacker defeat: `5_000..7_500`;
- decisive attacker defeat: `7_500..10_000`.

The exact loss within a band MUST use a keyed integer decision from `amphibious/battle/operation/transport_loss` and be applied to committed transport capacity.

Loss MUST preserve ship and merchant provenance.

## 23. Confidence and War-Score Effects

The shipped operation effects are:

- decisive attacker victory: confidence `+4`, attacker war score `+12`;
- major attacker victory: confidence `+3`, war score `+7`;
- marginal attacker victory: confidence `+1`, war score `+2`;
- stalemate: confidence `-1`, war score `0`;
- marginal attacker defeat: confidence `-2`, war score `-3`;
- major attacker defeat: confidence `-4`, war score `-7`;
- decisive attacker defeat: confidence `-6`, war score `-12`.

Possession occupation score under `DESIGN-31` applies separately after successful control transfer and MUST NOT be double-counted in these operation-result values.

## 24. Successful Occupation

A successful invasion MUST apply typed effect `ESTABLISH_MILITARY_CONTROL` during `RESOLVE_AMPHIBIOUS_OPERATIONS`.

The effect MUST:

- preserve the existing `legalOwnerNationId`;
- set `militaryControllerNationId` to the invading nation;
- set `occupierNationId` to the invading nation when it differs from legal owner;
- set control status `FOREIGN_OCCUPIED`;
- record occupation start month;
- update access, supply, basing, income, and claims through `DESIGN-15` policies;
- preserve all legal ownership history; and
- emit a post-operation state hash.

Legal ownership changes only when the operation references a valid explicit annexation rule or a later peace, event, or continuity effect applies.

The shipped amphibious policies reference no general immediate annexation rule. Therefore, ordinary successful invasion never changes legal ownership.

## 25. Failed Occupation

A non-success result MUST NOT alter legal ownership or military control.

Temporary landed forces, damaged defenses, prisoners, abandoned equipment, and local unrest MUST be represented through typed effects without changing possession control unless a future staged-beachhead contract explicitly permits it.

## 26. Supply After Landing

A successful invasion MUST create one `OccupationSupplyRequirement` containing:

- target possession;
- occupying nation;
- minimum monthly supply;
- valid routes;
- port and beach capacity;
- required escort;
- duration;
- shortage effects; and
- failure policy.

The shipped initial requirement lasts `6` completed months.

Failure to supply does not automatically restore control. It creates explicit readiness, attrition, unrest, counterattack, evacuation, or surrender events.

## 27. Blitzkrieg Invasion Availability

`BLITZKRIEG_INVASION` is unavailable before January 1935.

The date predicate is:

`campaignMonth >= 1935-01`

The operation additionally requires:

- government type `fascist` or `autocratic`;
- adopted technology `blitzkrieg_amphibious_operations`;
- active war;
- operation launch within the first `6` completed months after the nation's entry into that war;
- target possession identified by an explicit strategic objective or war plan;
- preparation exactly `10_000` basis points;
- naval-superiority ratio at least `12_500` basis points;
- air-superiority ratio at least `12_500` basis points;
- surprise or operational-security confidence at least `6_000` basis points;
- no established hostile blockade of the staging port; and
- a validated explicit `PlanBlitzkriegInvasionCommand`.

A scenario MAY disable the operation through an explicit boolean `blitzkriegInvasionEnabled: false`. Missing field MUST fail scenario validation.

## 28. Blitzkrieg Effects

The shipped blitzkrieg policy defines:

- preparation duration: `3` paid months;
- supply endurance requirement: `45` days;
- launch-probability modifier: `+1_000` basis points;
- attacker landing-combat multiplier for the first resolution: `12_500` basis points;
- defender mobilization multiplier for the first resolution: `7_500` basis points;
- transport-loss multiplier: `12_500` basis points;
- failure confidence loss: additional `-2` points;
- one blitzkrieg invasion attempt per nation per war.

The increased transport-loss multiplier applies to the exact loss selected in Section 22 and clamps to remaining transport capacity.

## 29. Blitzkrieg Resolution and Territory

Blitzkrieg operation uses the normal launch, manifest, battle, transport-loss, confidence, war-score, occupation, and supply contracts.

It MUST NOT transfer possession at planning, launch, or surprise resolution.

Military control changes only after a qualifying major or decisive attacker victory.

Legal ownership remains unchanged unless an explicit annexation or later settlement effect applies.

A failed or cancelled blitzkrieg attempt consumes the per-war attempt only after the launch decision is resolved. Planning cancellation before launch does not consume it.

## 30. Mine and Blockade Effects

An established blockade of staging port makes launch ineligible.

A contested or weakened blockade applies Section 10 range reduction and explicit launch penalties.

Mine defensive standoff from `DESIGN-35` modifies operation utility and launch reliability:

- standoff level 1: launch penalty `-500` basis points;
- level 2: `-1_000`;
- level 3: `-2_000`;
- level 4: `-3_500`.

Mine clearance and route-risk checks MUST resolve before launch.

## 31. Intelligence

The shipped minimum intelligence confidence is:

- raid: `4_000` basis points;
- standard invasion: `5_000`;
- liberation: `5_000`;
- blitzkrieg invasion: `6_000`.

Intelligence controls estimates and launch modifiers. It MUST NOT substitute for true eligibility in authoritative validation.

The player and AI must use their legal knowledge to choose targets and plans.

## 32. Cancellation

Cancellation MUST use `CancelInvasionPlanCommand` and `DESIGN-11` settlement policy.

Before launch, cancellation MUST:

- release asset and capacity reservations;
- settle preparation costs;
- preserve or discard intelligence according to its own policy;
- apply political effects only when explicitly declared; and
- set status `CANCELLED`.

After launch, ordinary cancellation is prohibited. Withdrawal, diversion, surrender, or abort must use operation-resolution commands.

## 33. Records and Reports

Every operation MUST produce one immutable `AmphibiousOperationRecord` containing:

- plan and operation identifiers;
- all eligibility results;
- route and range calculation;
- technology, trait, blockade, logistics, mine, and intelligence modifiers;
- transport, escort, naval, air, and supply values;
- preparation progression and decay;
- launch probability and decision;
- battle manifest and result;
- transport losses;
- confidence and war-score effects;
- ownership, control, occupation, and supply effects;
- blitzkrieg predicates and effects when applicable;
- RNG decisions;
- ruleset and formula versions; and
- record hash.

Player and AI reports MUST respect intelligence and report-delay contracts.

## 34. Canonical Ordering

Resolution MUST order:

1. wars by identifier;
2. invasion plans by planned launch month and plan identifier;
3. paths by route-edge identifier;
4. transports by identifier;
5. escorts by division and ship identifier;
6. support assets by role and identifier;
7. launch checks by operation identifier;
8. battle results by manifest order; and
9. effects by declared effect ordinal.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect outcomes.

## 35. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_INVASION_PLAN`;
- `INVASION_TARGET_INELIGIBLE`;
- `INVASION_TARGET_OUT_OF_RANGE`;
- `AMPHIBIOUS_STAGING_PORT_INVALID`;
- `AMPHIBIOUS_STAGING_PORT_CAPACITY_INSUFFICIENT`;
- `AMPHIBIOUS_TRANSPORT_CAPACITY_INSUFFICIENT`;
- `AMPHIBIOUS_ESCORT_INSUFFICIENT`;
- `AMPHIBIOUS_NAVAL_SUPERIORITY_INSUFFICIENT`;
- `AMPHIBIOUS_PREPARATION_INCOMPLETE`;
- `AMPHIBIOUS_SUPPLY_INSUFFICIENT`;
- `AMPHIBIOUS_BLOCKADE_PROHIBITS_LAUNCH`;
- `AMPHIBIOUS_LAUNCH_FAILED`;
- `AMPHIBIOUS_OPERATION_DELAYED`;
- `AMPHIBIOUS_BATTLE_MANIFEST_INVALID`;
- `AMPHIBIOUS_INVASION_SUCCEEDED`;
- `AMPHIBIOUS_INVASION_FAILED`;
- `AMPHIBIOUS_OCCUPATION_SUPPLY_FAILED`;
- `BLITZKRIEG_INVASION_DATE_INELIGIBLE`;
- `BLITZKRIEG_INVASION_GOVERNMENT_INELIGIBLE`;
- `BLITZKRIEG_INVASION_ALREADY_ATTEMPTED`;
- `BLITZKRIEG_INVASION_SCENARIO_DISABLED`; and
- `AMPHIBIOUS_STATE_INVARIANT_FAILED`.

## 36. Validation and Acceptance

Automated validation MUST prove that:

1. every invasion plan contains complete target, staging, preparation, transport, escort, support, supply, intelligence, route, window, and status data;
2. every eligibility predicate is explicit and failure consumes no launch RNG;
3. staging requires control or access, operational capacity, supply, infrastructure, legal route, and no established departure blockade;
4. route distance uses exact legal maritime edges rather than straight-line distance;
5. shipped base range is exactly 1,500 nautical miles;
6. technology range multipliers are exactly 7,500, 10,000, 12,500, and 15,000;
7. global naval power applies exactly 12,000 basis points;
8. surprise attack applies exactly 12,500 basis points only in the first 12 war months and while eligible;
9. blockade and logistics use exact range multipliers;
10. final range rounds once and equality at the boundary is legal;
11. standard, raid, and blitzkrieg transport supply requirements are exactly 30, 7, and 45 days;
12. transports require continuous escort and exact minimum escort strength;
13. naval superiority requires exactly 11,000 basis points for ordinary launch;
14. preparation durations are exactly 3, 6, 4, and 3 months by operation type;
15. failed launch preserves preparation, delays one month, and applies exact consecutive-failure political costs;
16. launch probability uses exact naval-superiority, technology, intelligence, weather, supply, surprise, mine, and blockade inputs;
17. every launched operation has a deterministic auto-resolvable battle manifest;
18. only major and decisive attacker victories establish military control;
19. marginal victory does not establish control;
20. transport losses use exact outcome bands and keyed selection;
21. confidence and war-score effects use exact declared values;
22. successful invasion changes military control and preserves legal ownership;
23. ordinary successful invasion has no implicit annexation rule;
24. failed invasion changes neither ownership nor control;
25. occupation supply lasts six initial months and failure uses typed effects;
26. blitzkrieg invasion is unavailable before January 1935;
27. blitzkrieg requires exact government, technology, first-six-month, objective, preparation, naval, air, intelligence, blockade, scenario, and command predicates;
28. blitzkrieg uses exact preparation, supply, launch, combat, mobilization, transport-loss, confidence, and attempt-limit effects;
29. blitzkrieg planning and launch never transfer possession;
30. military control changes only after qualifying battle resolution;
31. mine standoff uses exact launch penalties;
32. cancellation before launch settles reservations and costs explicitly;
33. after launch, withdrawal and abort use operation-resolution commands; and
34. identical state, commands, content, ruleset, weather, intelligence, and seeds produce identical eligibility, range, preparation, launch, battle, occupation, political, ledger, and hash results.
