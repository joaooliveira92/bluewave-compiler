## DESIGN-03: Campaign Configuration

**Canonical status:** Normative design specification  
**Stable document ID:** `DESIGN-03`  
**Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Every configurable behavior in this document has a concrete shipped value or a mandatory validated ruleset field. Runtime inference and fallback behavior are prohibited.

## 1. Supported Start Scenarios

The canonical content pack MUST define exactly these supported historical start scenario identifiers:

- `scen_1880`;
- `scen_1900`;
- `scen_1920`;
- `scen_1935`; and
- `scen_1960`.

Each scenario definition MUST contain:

- `scenarioId`;
- `startYear`;
- `startMonth`;
- `endYear`;
- `endMonth`;
- `scenarioContentHash`;
- `participationManifestId`;
- `continuityManifestId`;
- `supportedFleetSizeSettingIds`;
- `supportedResearchSpeedSettingIds`;
- `supportedTechnologyVariationSettingIds`;
- `supportedHistoricalBudgetOptionIds`;
- `supportedLegacyFleetModeIds`;
- `supportedTacticalRealismModeIds`; and
- `supportedDifficultyProfileIds`.

The canonical shipped scenarios MUST start in January of their identifier year. Therefore:

- `scen_1880` starts at January 1880;
- `scen_1900` starts at January 1900;
- `scen_1920` starts at January 1920;
- `scen_1935` starts at January 1935; and
- `scen_1960` starts at January 1960.

A missing scenario or a scenario whose identifier, year, or month does not match this contract MUST fail content validation with `INVALID_SCENARIO_DEFINITION`.

## 2. Simulation Timeline

The strategic turn duration is exactly one calendar month.

The first strategic turn begins at the scenario's declared `startYear` and `startMonth`. Month advancement MUST use integer calendar-month arithmetic.

The canonical simulation end is the completion of December 1970. A campaign that reaches this boundary MUST:

1. complete every phase of the December 1970 turn;
2. produce `MonthClosingSnapshot` for December 1970;
3. execute terminal evaluation;
4. execute final career evaluation; and
5. reject advancement to January 1971 with `SIMULATION_END_REACHED`.

An earlier explicit terminal condition defined by `DESIGN-02` MAY end the campaign before December 1970.

## 3. Required Campaign Configuration

Campaign compilation MUST receive one immutable `CampaignConfiguration` containing:

- `scenarioId`;
- `playerSlotId`;
- `continuityModeId`;
- `fleetSizeSettingId`;
- `researchSpeedSettingId`;
- `technologyVariationSettingId`;
- `historicalBudgetOptionId`;
- `legacyFleetModeId`;
- `tacticalRealismModeId`;
- `difficultyProfileId`;
- `campaignSeed`; and
- `configurationSchemaVersion`.

All fields are mandatory. When a scenario does not support an optional gameplay feature, the corresponding field MUST use an explicit `disabled` or `not_applicable` identifier declared by that feature's contract. `null`, omission, empty strings, and inferred defaults are prohibited.

`campaignSeed` MUST be an unsigned 128-bit integer serialized as exactly 32 lowercase hexadecimal characters. Values outside that format MUST fail with `INVALID_CAMPAIGN_SEED`.

The complete configuration MUST be validated before campaign RNG streams are derived. Invalid configuration MUST fail with `INVALID_CAMPAIGN_CONFIGURATION` and MUST NOT create an active campaign.

## 4. Fleet-Size Settings

### 4.1 Canonical Settings

The active ruleset MUST define exactly these canonical fleet-size setting identifiers and shipped multiplier values:

- `small`: `7_500` basis points;
- `standard`: `10_000` basis points;
- `large`: `12_500` basis points; and
- `very_large`: `15_000` basis points.

One basis point equals one ten-thousandth of the unscaled value. `10_000` basis points equals a multiplier of `1.0000`.

The allowed closed range for every fleet-size multiplier is `5_000..20_000` basis points. Values outside this range MUST fail ruleset validation with `FLEET_SIZE_MULTIPLIER_OUT_OF_RANGE`.

### 4.2 Required Ruleset Fields

Each fleet-size setting MUST contain:

- `settingId`;
- `navalAppropriationMultiplierBp`;
- `sustainableFleetSizeMultiplierBp`;
- `aiForceTargetMultiplierBp`;
- `generatedLegacyFleetScaleMultiplierBp`;
- `roundingMode`; and
- `rulesetVersion`.

For the canonical shipped ruleset, all four multiplier fields MUST equal the setting value declared in Section 4.1.

`roundingMode` MUST be `FLOOR` for appropriation, sustainable fleet size, AI force targets, and legacy-fleet scale unless the owning formula explicitly requires indivisible-unit allocation under Section 4.4.

A missing field MUST fail ruleset validation with `MISSING_FLEET_SIZE_MULTIPLIER`. Implementations MUST NOT substitute `10_000`, copy another field, or infer a multiplier from the setting name.

### 4.3 Permitted Effects

Fleet-size settings MAY modify only:

- national naval appropriations;
- sustainable fleet-size targets;
- AI force-structure quantity targets; and
- generated legacy-fleet scale.

Fleet-size settings MUST NOT modify individual-ship tactical or mechanical statistics, including:

- displacement;
- dimensions;
- speed;
- acceleration;
- turning performance;
- range;
- fuel efficiency;
- armor thickness or quality;
- weapon caliber, damage, penetration, accuracy, or rate of fire;
- ammunition capacity;
- sensor effectiveness;
- aircraft capacity or aircraft performance;
- crew quality;
- damage resistance;
- construction quality; or
- technology effects.

Fleet size MAY change the number, composition, cost envelope, and maintenance burden of generated or AI-planned forces. It MUST NOT change a compiled design version to satisfy a quantity target.

Any attempt to read a fleet-size multiplier from an individual-ship tactical formula MUST fail static contract validation with `FLEET_SIZE_TACTICAL_STAT_VIOLATION`.

### 4.4 Arithmetic and Allocation

Scaled integer values MUST be calculated as:

`scaledValue = floor(unscaledValue * multiplierBp / 10_000)`

Multiplication MUST use an integer type wide enough to avoid overflow before division.

When scaling an indivisible unit count:

1. calculate each unrounded rational allocation;
2. assign the floor of each allocation;
3. distribute remaining whole units by descending fractional remainder; and
4. resolve equal remainders by ascending stable entity identifier.

The final allocated total MUST equal the separately scaled aggregate total.

### 4.5 Application Phases

The multipliers MUST be applied at these phases:

- `navalAppropriationMultiplierBp`: when the authoritative monthly naval appropriation is calculated;
- `sustainableFleetSizeMultiplierBp`: when fleet sustainability projections and warnings are derived;
- `aiForceTargetMultiplierBp`: when AI force-structure quantity targets are created or recomputed; and
- `generatedLegacyFleetScaleMultiplierBp`: during campaign compilation before legacy-fleet generation begins.

The legacy-fleet multiplier MUST be materialized into compiler inputs. It MUST NOT be reapplied to an already generated legacy fleet.

## 5. Research-Speed Settings

The active ruleset MUST define exactly these canonical research-speed settings:

- `slow`: `7_500` basis points;
- `standard`: `10_000` basis points;
- `fast`: `12_500` basis points; and
- `very_fast`: `15_000` basis points.

The multiplier applies only to paid monthly research progress after spending and national modifiers and before progress is assigned to eligible technology fields.

Research progress MUST be calculated as:

`scaledResearchProgress = floor(basePaidResearchProgress * researchSpeedMultiplierBp / 10_000)`

Research-speed settings MUST NOT modify:

- technology prerequisites;
- canonical or varied availability dates;
- technology effects;
- adoption requirements;
- production requirements;
- technology selection weights; or
- research spending limits.

Missing or out-of-range values outside `5_000..20_000` basis points MUST fail with `INVALID_RESEARCH_SPEED_MULTIPLIER`.

## 6. Technology Variation

### 6.1 Canonical Settings

The only canonical technology-variation setting identifiers are:

- `none`;
- `some`; and
- `considerable`.

The active ruleset MUST contain one `TechnologyVariationProfile` for each identifier.

Each profile MUST contain:

- `settingId`;
- `earliestDateShiftMonths`;
- `latestDateShiftMonths`;
- `effectivenessVariationMinBp`;
- `effectivenessVariationMaxBp`;
- `dateDistributionId`;
- `effectivenessDistributionId`;
- `technologyEligibilityPredicateId`;
- `variationFormulaVersion`; and
- `streamFamily`.

The shipped canonical values are:

#### `none`

- `earliestDateShiftMonths`: `0`;
- `latestDateShiftMonths`: `0`;
- `effectivenessVariationMinBp`: `10_000`;
- `effectivenessVariationMaxBp`: `10_000`;
- `dateDistributionId`: `constant_zero_v1`;
- `effectivenessDistributionId`: `constant_10000_v1`.

#### `some`

- `earliestDateShiftMonths`: `-24`;
- `latestDateShiftMonths`: `24`;
- `effectivenessVariationMinBp`: `9_500`;
- `effectivenessVariationMaxBp`: `10_500`;
- `dateDistributionId`: `symmetric_triangular_integer_v1`;
- `effectivenessDistributionId`: `symmetric_triangular_integer_v1`.

#### `considerable`

- `earliestDateShiftMonths`: `-72`;
- `latestDateShiftMonths`: `72`;
- `effectivenessVariationMinBp`: `9_000`;
- `effectivenessVariationMaxBp`: `11_000`;
- `dateDistributionId`: `symmetric_triangular_integer_v1`;
- `effectivenessDistributionId`: `symmetric_triangular_integer_v1`.

Bounds are inclusive. A negative date shift makes a technology eligible earlier. A positive date shift makes it eligible later.

The absolute date-shift bounds MUST NOT exceed `72` months. Effectiveness bounds MUST remain within `8_000..12_000` basis points. Invalid bounds MUST fail with `INVALID_TECHNOLOGY_VARIATION_PROFILE`.

### 6.2 Technology Eligibility

Each technology definition MUST declare:

- `variationEligible`: boolean;
- `dateVariationEligible`: boolean;
- `effectivenessVariationEligible`: boolean;
- `earliestPermittedAvailabilityMonth`;
- `latestPermittedAvailabilityMonth`;
- `variableEffectIds`; and
- `prerequisiteTechnologyIds`.

If `variationEligible` is `false`, both date and effectiveness variation MUST be zero regardless of the selected setting.

Only effects listed in `variableEffectIds` may receive effectiveness variation. Identifiers, prerequisites, effect types, adoption types, and technology graph edges MUST remain unchanged.

A technology with missing eligibility metadata MUST be treated as ineligible and MUST emit the compiler diagnostic `TECHNOLOGY_VARIATION_METADATA_MISSING`. It MUST NOT receive inferred variation.

### 6.3 Deterministic Materialization

Technology variation MUST be materialized exactly once during campaign compilation using the stream family `setup/technology_variation`.

For each technology, random decisions MUST use a canonical key containing:

1. `rngAlgorithmVersion`;
2. `campaignSeed`;
3. the literal stream family `setup/technology_variation`;
4. `technologyId`;
5. `technologyVariationSettingId`;
6. `variationFormulaVersion`; and
7. `decisionTypeId`.

`decisionTypeId` MUST be `availability_shift` or `effectiveness_multiplier`.

Technologies MUST be processed in ascending `technologyId` order. Keyed draws MUST remain independent of iteration count and MUST NOT consume runtime research RNG.

### 6.4 Integer Triangular Distribution

For `symmetric_triangular_integer_v1`, the result MUST be generated by:

1. drawing independent uniform integers `a` and `b` over the inclusive interval `[minimum, maximum]` from distinct keyed subdraws;
2. calculating `sum = a + b`;
3. applying integer division by `2`; and
4. rounding a half-integer result toward zero.

For symmetric bounds, this produces a nominal value of `0` months for date shift and `10_000` basis points for effectiveness.

### 6.5 Availability Constraints

The initially varied availability month MUST equal:

`canonicalAvailabilityMonth + selectedDateShiftMonths`

The result MUST then be clamped to the technology's declared inclusive earliest and latest permitted availability months.

After clamping, a technology MUST NOT become available earlier than any mandatory prerequisite. Prerequisites MUST be processed in canonical topological order. For every prerequisite, the dependent technology's varied availability month MUST be at least:

`prerequisiteVariedAvailabilityMonth + prerequisiteDelayMonths`

`prerequisiteDelayMonths` MUST be a non-negative integer declared by the technology definition. A missing value defaults to the concrete canonical value `0` months.

A prerequisite cycle MUST fail compilation with `TECHNOLOGY_PREREQUISITE_CYCLE`.

### 6.6 Effectiveness Variation

For each eligible variable effect:

`variedEffectValue = roundTowardZero(canonicalEffectValue * effectivenessMultiplierBp / 10_000)`

Signed values MUST round toward zero. Unsigned values MUST use floor, which is equivalent for non-negative values.

Technology definitions MAY declare narrower per-effect minimum and maximum multipliers. The effective interval is the intersection of the technology interval and the selected setting interval. An empty intersection MUST fail with `INVALID_EFFECT_VARIATION_BOUNDS`.

Variation MUST NOT change an effect's unit, sign, semantic type, or activation predicate.

### 6.7 Immutable Technology Manifest

Campaign compilation MUST produce an immutable `CampaignTechnologyManifest` containing, for every technology:

- `technologyId`;
- canonical availability month;
- selected date shift;
- final availability month;
- canonical effect values;
- effectiveness multiplier;
- final varied effect values;
- eligibility flags;
- variation decision record identifiers;
- content hash;
- ruleset hash; and
- formula version.

The manifest MUST be hashed and stored or content-addressed by the first stable campaign save.

Runtime research MUST read the immutable final availability and effect values from this manifest. It MUST NOT repeat, revise, or reroll technology variation.

A changed or mismatched manifest after campaign creation MUST fail load validation with `TECHNOLOGY_MANIFEST_MISMATCH`.

## 7. Historical Continuity Modes

### 7.1 Canonical Modes

The only canonical continuity mode identifiers are:

- `historical`; and
- `alternate_continuity_v1`.

Every scenario MUST define a `ScenarioParticipationRecord` for each canonical playable slot under each supported continuity mode.

Each record MUST contain:

- `scenarioId`;
- `playableSlotId`;
- `continuityModeId`;
- `participationStatus`;
- `scenarioNationInstanceId` or `NONE`;
- `continuationDefinitionId` or `NONE`;
- `reasonCode`; and
- `contentHash`.

`participationStatus` MUST be one of:

- `ACTIVE`;
- `INACTIVE`; or
- `CONDITIONAL_ACTIVE`.

### 7.2 Historical Mode

Under `historical`:

- political and territorial state MUST come exclusively from canonical historical scenario content;
- a slot marked `INACTIVE` MUST remain unavailable for campaign creation;
- `CONDITIONAL_ACTIVE` is prohibited;
- alternate continuation definitions MUST NOT be evaluated;
- an inactive slot MUST fail campaign validation with `PLAYABLE_SLOT_INACTIVE_HISTORICAL`; and
- the compiler MUST NOT replace an inactive playable slot with another polity.

Historical continuity does not authorize runtime historical inference. Every government, possession, nation instance, and participation record MUST be explicit canonical content.

### 7.3 Alternate Continuity Mode

Under `alternate_continuity_v1`:

- an `ACTIVE` slot remains active under its declared scenario nation instance;
- an `INACTIVE` slot remains inactive unless an explicit matching participation record marks it `CONDITIONAL_ACTIVE`;
- every `CONDITIONAL_ACTIVE` record MUST reference exactly one valid `continuationDefinitionId`;
- the continuation definition MUST preserve the same `playableSlotId`;
- the target scenario nation instance MUST be explicitly declared; and
- all political, territorial, diplomatic, economic, objective, and identity effects MUST be supplied by the referenced continuation content.

A conditional slot without a valid continuation definition MUST fail with `MISSING_ALTERNATE_CONTINUITY_DEFINITION`.

The compiler MUST NOT procedurally derive a successor from names, geography, ownership, government, culture, historical similarity, or database adjacency.

### 7.4 Playable Slot Protection

A canonical playable slot MUST never be overwritten, renamed, or replaced by an AI-only power.

Every nation identity definition MUST declare `participantClass` as exactly one of:

- `PLAYABLE_SLOT_INSTANCE`; or
- `AI_ONLY_POWER`.

A `ScenarioParticipationRecord` for a canonical playable slot MUST reference only a nation instance whose `participantClass` is `PLAYABLE_SLOT_INSTANCE` and whose declared `playableSlotId` matches the record.

Any attempt to assign an `AI_ONLY_POWER` to a playable slot MUST fail with `AI_POWER_PLAYABLE_SLOT_SUBSTITUTION`.

An AI-only power MAY coexist with, succeed, oppose, occupy, or diplomatically interact with a playable-slot nation only through explicit canonical contracts. It MUST NOT inherit the player's institutional identity.

### 7.5 Deterministic Participation Resolution

Participation resolution MUST use this procedure:

1. load the unique record matching `scenarioId`, `playableSlotId`, and `continuityModeId`;
2. validate its content hash and referenced identities;
3. reject `INACTIVE`;
4. accept `ACTIVE` only when `scenarioNationInstanceId` is valid;
5. accept `CONDITIONAL_ACTIVE` only under `alternate_continuity_v1` with a valid continuation definition; and
6. emit the selected scenario nation instance and participation record identifiers into the compiled campaign manifest.

Missing or duplicate matching records MUST fail with `INVALID_SCENARIO_PARTICIPATION_RECORD`.

Participation resolution MUST NOT consume randomness.

## 8. Configuration Immutability

After the first stable campaign save is committed, these fields MUST remain immutable:

- `scenarioId`;
- `playerSlotId`;
- `continuityModeId`;
- `fleetSizeSettingId`;
- `researchSpeedSettingId`;
- `technologyVariationSettingId`;
- `historicalBudgetOptionId`;
- `legacyFleetModeId`;
- `tacticalRealismModeId`;
- `difficultyProfileId`;
- `campaignSeed`; and
- `configurationSchemaVersion`.

A supported save migration MAY transform representation but MUST preserve gameplay meaning. A migration that changes any selected setting's effective value MUST create a new explicit ruleset migration and resulting compatibility record. Silent changes are prohibited.

## 9. Validation and Acceptance

Automated validation MUST prove that:

1. all five canonical scenarios exist and begin in January of their declared year;
2. the campaign cannot advance beyond December 1970;
3. every campaign configuration field is explicit and valid;
4. all four fleet-size multiplier fields exist for every canonical setting;
5. canonical fleet-size settings ship with `7_500`, `10_000`, `12_500`, and `15_000` basis-point values;
6. fleet size changes only appropriations, sustainability targets, AI force quantities, and generated legacy-fleet scale;
7. individual-ship tactical and mechanical statistics remain unchanged across fleet-size settings for the same compiled design;
8. integer scaling and largest-remainder allocation are deterministic;
9. research-speed settings affect only paid research progress;
10. `none` produces zero date shift and an effectiveness multiplier of exactly `10_000` basis points;
11. `some` stays within `-24..24` months and `9_500..10_500` basis points;
12. `considerable` stays within `-72..72` months and `9_000..11_000` basis points;
13. technology prerequisite order remains valid after variation;
14. technology variation consumes only `setup/technology_variation` keyed decisions;
15. repeated compilation with identical inputs produces an identical technology manifest hash;
16. runtime research cannot reroll or modify the technology manifest;
17. historical mode rejects inactive playable slots without substitution;
18. alternate continuity activates only explicitly declared conditional slots;
19. AI-only powers cannot replace canonical playable slots;
20. participation resolution is deterministic and consumes no randomness; and
21. post-creation configuration mutation is rejected.
