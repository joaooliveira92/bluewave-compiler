# DESIGN-34: Submarines

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-34`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Strategic representation, tactical allocation, range efficiency, ASW vulnerability, sea-state effects, policy, losses, and friendly-fire risk MUST use the explicit values, predicates, streams, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Strategic Representation

Every submarine capability MUST use exactly one strategic representation declared by the active ruleset:

- `PERSISTENT_UNIT`; or
- `TYPED_FLOTILLA_POOL`.

The shipped representation is `PERSISTENT_UNIT` for `missile` submarines and `TYPED_FLOTILLA_POOL` for `coastal`, `medium_range`, `long_range`, and `minelaying` submarines.

Every strategic asset MUST contain:

- stable asset identifier;
- owner nation;
- submarine type;
- quantity, equal to `1` for persistent units;
- readiness;
- reliability;
- current strategic area;
- home-base identifier;
- fuel and supply state;
- mission policy;
- damage or loss state;
- monthly battle-participation count;
- ruleset version; and
- aggregate hash.

A missing or mixed representation MUST fail with `INVALID_SUBMARINE_REPRESENTATION`.

## 2. Tactical Allocation

Tactical submarine instances MUST be allocated from eligible strategic assets through an accepted battle manifest.

Each tactical instance MUST preserve provenance to exactly one persistent unit or a positive integer quantity from exactly one flotilla pool.

Allocation MUST reserve the corresponding strategic asset until battle resolution.

One persistent unit or one flotilla-pool quantity MUST NOT appear in more than one unresolved battle.

Duplicate allocation MUST fail with `SUBMARINE_ASSET_DOUBLE_ALLOCATED`.

## 3. Tactical Loss Application

Every tactical submarine loss MUST reduce its associated strategic asset atomically:

- persistent unit loss sets the unit to `SUNK`, `CAPTURED`, `SCUTTLED`, or another explicit terminal state;
- flotilla-pool loss subtracts the exact lost quantity;
- damage, ammunition, readiness, crew, and experience results return through provenance; and
- pool quantity MUST NOT become negative.

A tactical result without valid provenance MUST fail with `SUBMARINE_PROVENANCE_INVALID`.

## 4. Submarine Types

The canonical submarine types are:

- `COASTAL`;
- `MEDIUM_RANGE`;
- `LONG_RANGE`;
- `MINELAYING`; and
- `MISSILE`.

Every type MUST have an explicit definition containing range class, remote-efficiency profile, ASW-vulnerability profile, mission eligibility, base-support requirement, tactical projection, and technology prerequisites.

## 5. Submarine Policies

The canonical policies are:

- `FLEET_SUPPORT`;
- `PRIZE_RULES`; and
- `UNRESTRICTED`.

The shipped target-allocation weights are:

### Fleet Support

- warship attack: `8_000` basis points;
- merchant attack: `2_000`;
- neutral incident multiplier: `5_000`.

### Prize Rules

- warship attack: `5_000`;
- merchant attack: `5_000`;
- neutral incident multiplier: `10_000`.

### Unrestricted

- warship attack: `2_500`;
- merchant attack: `7_500`;
- neutral incident multiplier: `20_000`.

Weights MUST sum to exactly `10_000` for each policy.

Policy changes require an accepted command and become effective at the next trade-warfare resolution.

## 6. Operational Missions

The canonical submarine missions are:

- `FLEET_INTERDICTION`;
- `MERCHANT_RAIDING`;
- `MINE_LAYING`;
- `RECONNAISSANCE`;
- `TACTICAL_BATTLE_SUPPORT`;
- `RETURNING_SHIP_INTERCEPTION`; and
- `MISSILE_PATROL`.

Mission eligibility MUST validate type, technology, range, base support, readiness, damage, reliability, fuel, policy, area, and war state.

## 7. Reliability

Reliability uses integer range `0..100`.

The shipped operational multiplier is:

- `0..19`: `4_000` basis points;
- `20..39`: `6_000`;
- `40..59`: `8_000`;
- `60..79`: `10_000`;
- `80..94`: `11_000`;
- `95..100`: `12_000`.

A reliability score below `20` prohibits offensive deployment and permits only repair transfer, training, or emergency defense.

## 8. Base Proximity Bands

Base proximity is measured as the shortest legal route-edge distance from the submarine's current area to an accessible submarine-support base:

- `LOCAL`: `0..1` edges;
- `REGIONAL`: `2..3` edges;
- `REMOTE`: `4..6` edges;
- `EXTREME_REMOTE`: `7` or more edges, or no legal support route.

Route distance MUST use authoritative current diplomacy, access, canal, choke-point, and blockade state.

## 9. Type Remote-Efficiency Multipliers

The shipped remote-efficiency multipliers are:

| Type         |  Local | Regional | Remote | Extreme remote |
| ------------ | -----: | -------: | -----: | -------------: |
| Coastal      | 10,000 |    7,500 |  2,500 |              0 |
| Medium range | 10,000 |   10,000 |  7,500 |          5,000 |
| Long range   | 10,000 |   11,000 | 12,500 |         10,000 |
| Minelaying   | 10,000 |   10,000 |  8,000 |          5,000 |
| Missile      | 10,000 |   10,000 | 10,000 |          9,000 |

The long-range submarine's concrete remote advantage is therefore:

- `12_500` basis points in `REMOTE`; and
- `10_000` basis points in `EXTREME_REMOTE`.

These multipliers apply to strategic mission effectiveness after reliability and before enemy protection.

A coastal submarine with multiplier `0` is mission-ineligible in that band.

## 10. Long-Range ASW Vulnerability

Long-range submarines use ASW vulnerability multiplier:

- `LOCAL`: `10_500` basis points;
- `REGIONAL`: `10_750`;
- `REMOTE`: `11_000`;
- `EXTREME_REMOTE`: `11_500`.

This multiplier applies only to enemy ASW detection and attack-effectiveness formulas when the submarine is on an operational mission.

It MUST NOT modify submarine hit points, construction cost, tactical weapon damage, or friendly detection.

The permitted ruleset range is `10_000..12_500` basis points. Missing values MUST fail with `LONG_RANGE_ASW_VULNERABILITY_MISSING`.

## 11. Strategic Mission Effectiveness

For every eligible submarine asset:

`effectiveMissionStrength = floor(baseMissionStrength * typeRemoteEfficiencyBp * reliabilityMultiplierBp * baseSupportMultiplierBp * policyMultiplierBp * intelligenceMultiplierBp * enemyProtectionMultiplierBp * blockadeMultiplierBp / 10_000^7)`

The exact rational result MUST be retained through all multipliers and rounded once with `FLOOR`.

Every multiplier MUST be explicit and versioned.

## 12. Coastal Submarines

Coastal submarines receive full local efficiency only in `LOCAL` proximity.

During war, they may make normal strategic movement only:

- within the home area;
- across one adjacent legal edge to an area containing an accessible support base; or
- through a typed emergency redeployment event.

They MUST NOT chain adjacent exceptions or conduct remote raiding.

Failure MUST use `COASTAL_SUBMARINE_RANGE_RESTRICTED`.

## 13. Sea-State Scale

Tactical sea state MUST be an integer within `0..9` inclusive.

The shipped categories are:

- `0..1`: `CALM`;
- `2..5`: `OPTIMAL`;
- `6..7`: `HEAVY`;
- `8..9`: `SEVERE`.

The exact optimum band is sea state `2` through `5` inclusive.

## 14. Sea-State Detection Multipliers

Enemy ASW detection against submarines uses these shipped multipliers:

- sea state `0`: `13_000` basis points;
- sea state `1`: `11_500`;
- sea state `2`: `10_000`;
- sea state `3`: `9_500`;
- sea state `4`: `9_500`;
- sea state `5`: `10_000`;
- sea state `6`: `10_500`;
- sea state `7`: `11_000`;
- sea state `8`: `11_500`;
- sea state `9`: `12_500`.

Calm water increases visual, wake, periscope, and surface-contact detection risk.

Heavy and severe water increase active operational noise and handling risk. Sensor-specific contracts MAY apply additional explicit modifiers.

## 15. Sea-State Observation Multipliers

Submarine observation and target-identification use:

- sea state `0`: `11_000` basis points;
- `1`: `10_500`;
- `2`: `10_000`;
- `3`: `10_000`;
- `4`: `10_000`;
- `5`: `9_500`;
- `6`: `8_000`;
- `7`: `6_500`;
- `8`: `5_000`;
- `9`: `3_500`.

Sea state `6..9` therefore impairs observation explicitly.

## 16. Sea-State Attack Multipliers

Submarine torpedo fire-solution quality and attack execution use:

- sea state `0`: `10_000` basis points;
- `1`: `10_000`;
- `2`: `10_500`;
- `3`: `11_000`;
- `4`: `11_000`;
- `5`: `10_500`;
- `6`: `8_500`;
- `7`: `7_000`;
- `8`: `5_000`;
- `9`: `2_500`.

The highest shipped attack multiplier is `11_000` at sea states `3` and `4`.

Sea-state attack modifiers MUST NOT alter torpedo warhead damage, nominal speed, or nominal range.

## 17. Sea-State Surface and Snorkel Operations

At sea state `8` or `9`:

- deck-gun attack is prohibited;
- surface battery charging is prohibited unless an explicit technology permits it;
- snorkeling uses machinery-reliability multiplier `7_500` basis points;
- periscope observation uses Section 15; and
- surfaced transit speed multiplier is `7_500` basis points.

At sea state `0` or `1`, surfaced operation receives an additional detection multiplier of `12_500` basis points after Section 14.

## 18. Heavy-Ship-to-Destroyer Balance

Enemy ASW screening balance is:

`screenRatioBp = floor(eligibleDestroyerAndEscortStrength * 10_000 / max(1, eligibleHeavyShipStrength))`

The shipped submarine opportunity multiplier is:

- ratio below `2_500`: `15_000` basis points;
- `2_500..4_999`: `12_500`;
- `5_000..7_499`: `10_000`;
- `7_500..9_999`: `8_500`;
- `10_000` or higher: `7_500`.

Heavy ships are `BB`, `BC`, `B`, `CV`, `CVL`, and `CA`. Escorts are eligible `DD`, `KE`, and ASW-capable `CL`.

## 19. Merchant and Warship Attacks

Strategic attack opportunity selection MUST use policy weights, target availability, intelligence, regional protection, and mission strength.

The stream is:

`submarine/month/war/area/attack_opportunity`

A successful opportunity creates one typed merchant-loss resolution, warship battle opportunity, or post-battle interception. It MUST NOT apply a warship loss directly without the owning battle or attack resolver.

## 20. Mine Laying

Only `MINELAYING` submarines or explicitly capable other types may execute `MINE_LAYING`.

The mission requires mine inventory, technology, legal route, target area, readiness, reliability at least `40`, and fuel.

Successful laying creates an `AreaMinePressureRecord` under `DESIGN-14` and consumes exact inventory.

## 21. Post-Battle Returning-Ship Attack

A returning-ship interception may occur only when:

- an enemy battle ended in the submarine's operational area;
- the submarine was not allocated to another unresolved battle;
- mission policy permits interception;
- fuel, ammunition, reliability, and readiness pass;
- target route and timing overlap; and
- the post-battle opportunity predicate succeeds.

The target uses its committed post-battle damage, speed, escort, and fuel state.

The check MUST use a distinct keyed decision and create a battle-local attack manifest.

## 22. ASW Resolution

ASW detection and attack MUST apply:

- enemy ASW strength;
- trade-protection regional coverage;
- ASW intelligence under `DESIGN-29`;
- submarine type vulnerability;
- sea state;
- submarine reliability;
- mission exposure;
- base proximity;
- crew and technology; and
- current damage.

Every component MUST be explicit in the resolution record.

A vulnerability multiplier MUST NOT guarantee detection or loss.

## 23. Friendly-Fire Identification Risk

Friendly submarine contacts MAY create mistaken-identification incidents only through `submarine_friendly_identification_v1`.

The shipped base misidentification probability is `500` basis points.

Final probability is:

`misidentificationProbabilityBp = clamp(0, 10_000, 500 + visibilityModifierBp + communicationModifierBp + doctrineModifierBp + fatigueModifierBp - identificationQualityBp)`

The check requires:

- friendly surface or air anti-submarine force and friendly submarine share an operating area;
- the submarine is not positively tracked as friendly;
- an ASW contact is generated; and
- rules of engagement permit attack on unidentified contacts.

The same knowledge, report, confidence, and identification rules apply to player and AI forces.

## 24. Friendly-Fire Outcomes

A successful misidentification check creates exactly one outcome:

- `ATTACK_ABORTED_BEFORE_FIRE`;
- `WARNING_ATTACK`;
- `FRIENDLY_SUBMARINE_DAMAGED`;
- `FRIENDLY_SUBMARINE_SUNK`; or
- `IDENTIFICATION_RESOLVED`.

Outcome weights MUST be explicit and use a separate keyed decision.

Every damaging outcome MUST return through normal tactical provenance and create political, morale, command, and investigation records.

Friendly-fire risk MUST NOT delete assets without a typed result.

## 25. Records and Reports

Every monthly submarine resolution MUST create one immutable `SubmarineOperationsRecord` containing:

- war, nation, and area;
- strategic assets and tactical allocations;
- policies and missions;
- type and proximity modifiers;
- reliability, support, intelligence, protection, blockade, and screening modifiers;
- sea-state detection, observation, and attack modifiers;
- opportunity, interception, mine, ASW, and friendly-fire decisions;
- losses and provenance;
- merchant, war-score, political, inventory, and report effects;
- ruleset and formula versions; and
- record hash.

Player and AI reports MUST respect `DESIGN-29`.

## 26. Canonical Ordering

Resolution MUST order:

1. wars by identifier;
2. areas by identifier;
3. submarine assets by identifier;
4. missions by mission priority;
5. targets by target identifier;
6. tactical allocations by battle identifier;
7. ASW contacts by contact identifier; and
8. friendly-fire checks by contact and submarine identifier.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect outcomes.

## 27. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_SUBMARINE_REPRESENTATION`;
- `SUBMARINE_ASSET_DOUBLE_ALLOCATED`;
- `SUBMARINE_PROVENANCE_INVALID`;
- `SUBMARINE_MISSION_INELIGIBLE`;
- `COASTAL_SUBMARINE_RANGE_RESTRICTED`;
- `LONG_RANGE_ASW_VULNERABILITY_MISSING`;
- `SUBMARINE_RELIABILITY_INSUFFICIENT`;
- `SUBMARINE_FUEL_INSUFFICIENT`;
- `SUBMARINE_ATTACK_OPPORTUNITY_CREATED`;
- `SUBMARINE_MINE_INVENTORY_INSUFFICIENT`;
- `SUBMARINE_ASW_CONTACT_RESOLVED`;
- `SUBMARINE_FRIENDLY_FIRE_INCIDENT`;
- `SUBMARINE_SEA_STATE_OPERATION_PROHIBITED`; and
- `SUBMARINE_STATE_INVARIANT_FAILED`.

## 28. Validation and Acceptance

Automated validation MUST prove that:

1. every submarine asset uses exactly one declared strategic representation;
2. tactical instances preserve one-to-one or exact pool-quantity provenance;
3. one asset cannot enter two unresolved battles;
4. tactical losses reduce the exact source unit or pool;
5. every submarine policy uses exact target weights summing to 10,000;
6. every type has explicit range, remote, vulnerability, mission, support, and technology policies;
7. base-proximity bands use exact route-edge distances;
8. long-range remote efficiency is exactly 12,500 in remote and 10,000 in extreme-remote areas;
9. long-range ASW vulnerability uses exactly 10,500, 10,750, 11,000, and 11,500 basis points by proximity;
10. coastal submarines cannot conduct unsupported remote movement or raiding;
11. tactical sea state remains an integer from 0 through 9;
12. the exact optimum band is sea state 2 through 5;
13. calm sea states use exact elevated detection multipliers;
14. heavy and severe conditions use exact impaired observation and attack multipliers;
15. sea-state effects do not alter torpedo nominal damage, speed, or range;
16. heavy-ship screening balance uses exact ratio bands;
17. strategic attack opportunities use the declared keyed stream and typed outputs;
18. mine laying consumes inventory and creates explicit mine pressure;
19. post-battle attacks use committed damaged returning-ship state;
20. ASW outcomes include every declared modifier and do not guarantee detection from vulnerability alone;
21. friendly-fire checks use legal knowledge and exact identification predicates;
22. friendly-fire damage or loss requires a typed provenance-preserving result;
23. monthly records contain complete policies, modifiers, decisions, losses, effects, versions, and hashes; and
24. identical state, commands, content, ruleset, reports, weather, and seeds produce identical missions, attacks, ASW, friendly-fire, losses, records, and hashes.
