# DESIGN-32: Blockade

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-32`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Blockade theater identity, eligibility, strength, establishment, persistence, maintenance, effects, and the Russia to Northern Europe special case MUST use the explicit values, predicates, snapshots, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Blockade States

The canonical blockade states are:

- `NONE`;
- `ATTEMPTED`;
- `CONTESTED`;
- `ESTABLISHING`;
- `ESTABLISHED`;
- `WEAKENED`; and
- `BROKEN`.

Every blockade relationship MUST have one authoritative `BlockadeState` containing:

- `blockadeId`;
- `warId`;
- `blockadingSideId`;
- `blockadedNationId`;
- `blockadeTheaterId`;
- current state;
- establishment-progress months;
- blockading effective strength;
- defending effective strength;
- strength ratio basis points;
- theater-coverage basis points;
- current effect multiplier;
- ordered eligible-asset identifiers;
- last evaluation month;
- source `PostBattleSnapshot` identifier and hash;
- ruleset and formula versions; and
- aggregate hash.

A blockade is scoped to exactly one war, target nation, blockading side, and theater.

## 2. Blockade Theater

Every `BlockadeTheaterDefinition` MUST contain:

- `blockadeTheaterId`;
- target nation or target-identity predicate;
- ordered covered home-area identifiers;
- ordered covered build-area identifiers;
- ordered qualifying enemy-presence area identifiers;
- ordered economic access-route identifiers;
- eligible blockading mission identifiers;
- eligible defending mission identifiers;
- route-special-case policy identifier or `NONE`;
- coverage formula identifier;
- content version; and
- content hash.

Theater membership MUST come from explicit canonical content. Area names, map proximity, force location labels, and historical assumptions MUST NOT create a blockade theater.

## 3. Evaluation Phase and Snapshot

Blockade MUST resolve during `RESOLVE_BLOCKADE` after battles and amphibious operations.

Every evaluation MUST use the committed current-month `PostBattleSnapshot` plus committed amphibious-operation results.

The evaluator MUST NOT use:

- `MonthOpeningSnapshot` force strength;
- pre-battle ship state;
- planned movement;
- unresolved battle manifests;
- intelligence estimates in place of true authoritative state; or
- ships sunk, captured, disabled, or displaced by earlier current-month results.

A stale or missing snapshot MUST fail with `BLOCKADE_POST_BATTLE_SNAPSHOT_REQUIRED`.

## 4. Eligible Blockading Assets

A persistent ship contributes blockading strength only when all predicates pass:

- it belongs to the blockading side in the target war;
- it is located in a qualifying theater area after battle resolution;
- readiness is `ACTIVE`;
- damage state is `OPERATIONAL` or `DEGRADED`;
- dockyard state is `NONE` or eligible minor maintenance;
- mission is `FLEET`, `BLOCKADE`, `TRADE_PROTECTION`, or another explicitly eligible mission;
- fuel and supply satisfy sustained-operations requirements;
- it is not working up, mobilizing, unavailable, interned, captured, scuttled, foundered, or sunk; and
- its ship type has a non-zero blockade weight.

A ship contributes to at most one blockade theater against the same target nation in one month.

## 5. Eligible Defending Assets

A persistent ship contributes defending strength only when all predicates pass:

- it belongs to the blockaded nation or an allied defending participant explicitly assigned to the theater;
- it is located in the target home area, build area, or declared defensive approach area;
- readiness is `ACTIVE` or `RESERVE` with immediate defensive eligibility;
- damage state is `OPERATIONAL` or `DEGRADED`;
- it is not unavailable, interned, captured, scuttled, foundered, or sunk;
- fuel and supply permit local defensive operations; and
- its ship type has a non-zero defensive blockade weight.

Ships prevented from outward movement may still contribute local defense when otherwise eligible.

## 6. Canonical Ship-Type Weights

The active ruleset MUST define one `BlockadeShipTypeWeight` for every canonical ship type in `DESIGN-22`.

The shipped offensive blockade weights are:

- `BB`: `15_000` basis points;
- `BC`: `14_000`;
- `B`: `12_000`;
- `CV`: `15_000`;
- `CVL`: `11_000`;
- `CA`: `10_000`;
- `CL`: `7_500`;
- `DD`: `4_000`;
- `KE`: `3_000`;
- `AMC`: `5_000`;
- `AV`: `3_000`;
- `SS`: `2_500`;
- `TR`: `0`;
- `MTB`: `1_500`.

The shipped defensive weights are:

- `BB`: `15_000` basis points;
- `BC`: `13_000`;
- `B`: `13_000`;
- `CV`: `12_000`;
- `CVL`: `10_000`;
- `CA`: `10_000`;
- `CL`: `8_000`;
- `DD`: `5_000`;
- `KE`: `4_000`;
- `AMC`: `2_500`;
- `AV`: `3_000`;
- `SS`: `4_000`;
- `TR`: `0`;
- `MTB`: `3_000`.

A missing weight MUST fail with `BLOCKADE_SHIP_TYPE_WEIGHT_MISSING`. Zero is valid only when explicitly supplied.

## 7. Base Ship Strength

Each ship's base blockade-strength value is:

`baseShipStrength = floor(canonicalCombatValue * shipTypeWeightBp / 10_000)`

`canonicalCombatValue` MUST be the versioned operational naval-strength value from the ship's current compiled design and current authoritative state.

The value MUST NOT use declared treaty displacement, intelligence estimates, UI ratings, or historical labels.

## 8. Nation Modifiers

Every nation MUST have an explicit `blockadeNationModifierBp` in scenario or nation content.

The shipped canonical values include:

- United Kingdom: exactly `12_000` basis points, equal to `1.20`;
- Russia: exactly `7_000` basis points, equal to `0.70`;
- every other nation without a named canonical modifier: exactly `10_000` basis points.

The permitted ruleset range is `5_000..15_000` basis points inclusive.

The modifier applies to both offensive and defensive blockade strength unless the nation definition explicitly contains separate values.

A named nation's missing value MUST fail with `BLOCKADE_NATION_MODIFIER_MISSING`. The neutral `10_000` value is valid only because it is explicitly defined for unnamed cases.

## 9. Damage Modifier

The shipped damage multipliers are:

- `OPERATIONAL`: `10_000` basis points;
- `DEGRADED`: `6_000`;
- every other damage state: `0`.

A degraded ship therefore contributes exactly `60%` of otherwise effective strength.

Damage modifiers use current post-battle state.

## 10. Supply Modifier

The shipped supply multipliers are:

- fully supported and supplied: `10_000` basis points;
- partially supported: `7_500`;
- fuel restricted but locally operational: `5_000`;
- unsupported or fuel exhausted: `0`.

A positive national stockpile does not produce support without a valid local route under `DESIGN-25`.

## 11. Readiness Modifier

The shipped readiness multipliers are:

- `ACTIVE`: `10_000` basis points;
- `RESERVE` with local defensive eligibility: `5_000`, defense only;
- `MOBILIZING`: `0`;
- `WORKING_UP`: `0`;
- `MOTHBALLED`: `0`;
- `UNAVAILABLE`: `0`.

Reserve ships MUST NOT contribute offensive blockade strength.

## 12. Mission Modifier

The shipped offensive mission multipliers are:

- `BLOCKADE`: `12_500` basis points;
- `FLEET`: `10_000`;
- `TRADE_PROTECTION`: `7_500`;
- `RAIDER`: `5_000`;
- `TRANSIT`: `0`;
- `TRAINING`: `0`;
- `FOREIGN_STATION`: `5_000` when the theater matches its station area;
- `MINE_WARFARE`: `7_500`;
- `AMPHIBIOUS_SUPPORT`: `7_500`.

The shipped defensive mission multipliers are:

- local `FLEET` defense: `10_000`;
- `TRADE_PROTECTION`: `7_500`;
- `MINE_WARFARE`: `10_000`;
- `TRANSIT`, `TRAINING`, and incompatible missions: `0`;
- other eligible local defense mission: `7_500`.

## 13. Effective Ship Strength

For every eligible ship:

`effectiveShipStrength = floor(baseShipStrength * nationModifierBp * damageModifierBp * supplyModifierBp * readinessModifierBp * missionModifierBp / 10_000^5)`

The exact rational result MUST be retained through all multipliers and rounded once with `FLOOR`.

Modifiers MUST apply in the order shown.

## 14. Theater Strength

For each blockade theater:

`blockadingEffectiveStrength = sum(blockading effective ship strength)`

`defendingEffectiveStrength = sum(defending effective ship strength)`

Ships MUST be ordered by ascending ship identifier before summation.

When defending strength is zero:

- ratio is `20_000` basis points when blockading strength is positive;
- ratio is `0` when both strengths are zero.

Otherwise:

`strengthRatioBp = floor(blockadingEffectiveStrength * 10_000 / defendingEffectiveStrength)`

The displayed ratio may be rounded, but authoritative establishment uses this integer value.

## 15. Theater Coverage

A blockade theater MAY contain several required access routes or home/build approaches.

The shipped coverage formula is:

`theaterCoverageBp = floor(coveredRequiredRouteWeight * 10_000 / totalRequiredRouteWeight)`

Every required route MUST have an explicit positive integer weight.

A route is covered only when the blockading side has at least one eligible ship with positive effective strength in that route's qualifying area after battle resolution.

The shipped minimum coverage for establishment is exactly `7_500` basis points.

The permitted ruleset range is `5_000..10_000`.

## 16. Establishment Threshold

The shipped establishment threshold is exactly `11_000` basis points, equal to `110%` of defending effective strength.

Establishment eligibility requires all predicates:

- war is active;
- blockade relationship is legal for the side pair;
- blockading effective strength is positive;
- `strengthRatioBp >= 11_000`;
- `theaterCoverageBp >= 7_500`;
- no current-month battle result forced the blockading force out of the theater;
- supply and fuel sustainment predicates pass; and
- establishment persistence under Section 17 passes.

A ratio exactly equal to `11_000` is sufficient.

The permitted threshold range is `10_500..12_500`, but the selected value MUST be explicit.

## 17. Establishment Persistence

A blockade MUST satisfy establishment eligibility for exactly `2` consecutive monthly `RESOLVE_BLOCKADE` phases before becoming `ESTABLISHED`.

The permitted ruleset range is `1..3` months.

On the first qualifying month:

- state becomes `ESTABLISHING`;
- establishment-progress months becomes `1`;
- partial effects follow Section 20.

On the second consecutive qualifying month:

- state becomes `ESTABLISHED`;
- progress becomes `2`.

A non-qualifying month before establishment resets progress to `0` and sets state to `ATTEMPTED` or `CONTESTED` according to current ratio.

## 18. Blockade Maintenance and Hysteresis

Once established, the shipped maintenance threshold is exactly `9_000` basis points and minimum coverage is `6_000` basis points.

An established blockade remains `ESTABLISHED` when both:

- `strengthRatioBp >= 9_000`; and
- `theaterCoverageBp >= 6_000`.

When either fails for one month, state becomes `WEAKENED`.

A weakened blockade returns to `ESTABLISHED` after one month meeting the establishment threshold and coverage.

A weakened blockade becomes `BROKEN` after exactly `2` consecutive months below the maintenance threshold or coverage floor.

This hysteresis prevents monthly oscillation.

## 19. Contested and Attempted States

The shipped state mapping before establishment is:

- ratio below `5_000` or zero coverage: `ATTEMPTED`;
- ratio `5_000..10_999` with positive coverage: `CONTESTED`;
- ratio at least `11_000` and coverage at least `7_500`: `ESTABLISHING` until persistence completes.

A broken blockade may return to `ATTEMPTED`, `CONTESTED`, or `ESTABLISHING` through the same predicates.

## 20. Effect Multipliers

The shipped blockade-effect multipliers are:

- `NONE`: `0` basis points;
- `ATTEMPTED`: `0`;
- `CONTESTED`: `5_000`;
- `ESTABLISHING`: `5_000`;
- `ESTABLISHED`: `10_000`;
- `WEAKENED`: `5_000`;
- `BROKEN`: `0`.

Every blockade consequence MUST multiply its full established effect by this value.

## 21. Blockade Effects

At full established effect, the shipped monthly consequences are:

- blockading side war score: `+2`;
- blockaded nation domestic unrest: `+3`;
- blockaded nation war exhaustion: `+3`;
- imported oil delivery multiplier: `0` basis points through covered theaters;
- merchant import-capacity multiplier: `2_500` basis points;
- outward normal movement from covered home/build areas: prohibited under `DESIGN-25`;
- raider breakout eligibility: enabled;
- additional raider and submarine merchant-target availability multiplier: `5_000` basis points;
- shortage-pressure event weight multiplier: `15_000` basis points.

At partial effect, fixed point consequences use `HALF_UP`; multipliers interpolate from neutral `10_000` toward the full value.

A blockade MUST NOT affect an economic access route outside its theater definition.

## 22. Multiple Theaters

A nation with several home areas or economic access routes MUST have one blockade state per defined theater.

National blockade coverage is:

`nationalCoverageBp = floor(sum(theaterEconomicWeight * theaterEffectMultiplierBp) / sum(theaterEconomicWeight))`

Every theater MUST have a positive integer economic weight.

National economic and political effects use the weighted national coverage unless an owning contract declares theater-specific application.

The same blockading ship MUST NOT contribute full strength to two simultaneous theaters. Allocation requires an explicit mission or command before evaluation.

## 23. Russia Northern Europe Special Case

The canonical Russia blockade theater is `blockade_russia_northern_europe_v1`.

It permits Russia to be blockaded from the Northern Europe theater only when all predicates hold:

- target nation maps to the canonical Russian playable-slot or scenario successor continuity;
- war is active between the blockading side and Russia;
- route edge or choke-point policy `baltic_northern_europe_restriction_v1` is active under `DESIGN-14`;
- Germany or another explicitly designated controlling belligerent controls a required choke-point node;
- active mine-warfare capability exists;
- qualifying hostile mine pressure is at least exactly `100_000` strength units;
- Russia lacks an unblocked alternative economic access route with weight sufficient to prevent theater coverage; and
- blockading forces satisfy ordinary strength, coverage, and persistence rules.

The special case does not create blockade automatically. It makes Northern Europe a qualifying theater route when the route predicate is active.

If the route restriction ends, the special theater loses that route's coverage at the same monthly blockade evaluation.

Russia's nation modifier remains exactly `7_000` basis points. The special route rule does not apply an additional hidden multiplier.

## 24. Blockade Commands and Missions

An attempted blockade requires an accepted mission or operational-plan command assigning eligible forces to a theater.

The command MUST identify:

- war;
- blockading side;
- target nation;
- theater;
- ordered assigned forces;
- start month;
- sustainment plan;
- access and route predicates; and
- command hash.

Presence without an assigned eligible mission MUST NOT receive the `BLOCKADE` mission multiplier, but may contribute under another eligible mission's lower multiplier.

## 25. Reports and Fog of War

Authoritative blockade strength uses true state. Player and AI reports MUST use legal knowledge.

A `BlockadeAssessmentReport` MUST contain:

- reporting participant;
- theater;
- estimated friendly and enemy strength intervals;
- estimated ratio;
- confidence;
- observation date;
- source;
- known coverage;
- displayed state estimate;
- deception and delay; and
- report hash.

Reports MUST NOT overwrite authoritative blockade state.

AI planning MUST use its own assessment, not hidden true enemy strength.

## 26. Blockade Resolution Record

Every monthly evaluation MUST produce one immutable `BlockadeResolutionRecord` containing:

- blockade and theater identifiers;
- source `PostBattleSnapshot`;
- ordered eligible and excluded assets with reasons;
- base and effective ship strengths;
- nation, damage, supply, readiness, and mission modifiers;
- blockading and defending totals;
- ratio and coverage;
- persistence before and after;
- state before and after;
- effect multiplier;
- applied war, political, economic, movement, trade, and oil effects;
- formula and ruleset versions; and
- record hash.

## 27. Canonical Ordering

Blockade resolution MUST order:

1. wars by identifier;
2. target nations by identifier;
3. theaters by identifier;
4. assigned forces by identifier;
5. ships by identifier;
6. routes by route identifier;
7. effects by declared effect ordinal; and
8. records by blockade identifier.

Database insertion order, localized names, UI order, and wall-clock time MUST NOT affect outcomes.

## 28. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_BLOCKADE_STATE`;
- `INVALID_BLOCKADE_THEATER`;
- `BLOCKADE_POST_BATTLE_SNAPSHOT_REQUIRED`;
- `BLOCKADE_SHIP_INELIGIBLE`;
- `BLOCKADE_SHIP_TYPE_WEIGHT_MISSING`;
- `BLOCKADE_NATION_MODIFIER_MISSING`;
- `BLOCKADE_COVERAGE_INSUFFICIENT`;
- `BLOCKADE_STRENGTH_INSUFFICIENT`;
- `BLOCKADE_ESTABLISHMENT_PROGRESS_STARTED`;
- `BLOCKADE_ESTABLISHED`;
- `BLOCKADE_WEAKENED`;
- `BLOCKADE_BROKEN`;
- `BLOCKADE_ROUTE_NOT_QUALIFYING`;
- `RUSSIA_NORTHERN_EUROPE_BLOCKADE_INELIGIBLE`;
- `BLOCKADE_FORCE_DOUBLE_ALLOCATED`; and
- `BLOCKADE_STATE_INVARIANT_FAILED`.

## 29. Validation and Acceptance

Automated validation MUST prove that:

1. every blockade is scoped to one war, target, side, and explicit theater;
2. blockade evaluation uses the committed current-month `PostBattleSnapshot`;
3. sunk, captured, displaced, unavailable, unsupported, and ineligible ships contribute zero;
4. every canonical ship type has explicit offensive and defensive weights;
5. United Kingdom uses exactly `12_000` basis points and Russia exactly `7_000`;
6. unnamed nations use the explicit neutral `10_000` value;
7. damage, supply, readiness, and mission use the exact declared multipliers;
8. effective strength retains exact rational multiplication and rounds once;
9. theater ratio uses exact integer authoritative strength;
10. establishment requires exactly `11_000` basis points of strength and `7_500` coverage;
11. equality at `11_000` is sufficient;
12. establishment requires exactly two consecutive qualifying months;
13. established maintenance uses exactly `9_000` strength ratio and `6_000` coverage;
14. weakened blockade breaks after two consecutive failing months;
15. attempted, contested, establishing, established, weakened, and broken states use exact mappings;
16. partial effects use exactly `5_000` basis points and full effects `10_000`;
17. established blockade applies exact war-score, unrest, exhaustion, oil, merchant, movement, raider, and shortage-pressure effects;
18. multiple theaters use weighted national coverage and prohibit ship double allocation;
19. Russia's Northern Europe theater requires active war, canonical route restriction, control, mine capability, mine pressure of at least `100_000`, no sufficient alternate route, and ordinary establishment rules;
20. the Russia special case does not establish blockade automatically or apply a hidden modifier;
21. blockade missions require explicit commands;
22. player and AI reports respect fog of war; and
23. identical post-battle state, commands, content, ruleset, and seeds produce identical eligibility, strength, coverage, persistence, effects, records, and hashes.
