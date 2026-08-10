# DESIGN-04: Canonical Playable Slots

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-04`
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Every scenario-participation and identity mapping required by this document MUST be explicit canonical content. Runtime inference, substitution, and fallback behavior are prohibited.

## 1. Canonical Playable Slot Registry

The canonical content pack MUST define exactly the following ten playable slots in this exact canonical order:

1. `slot_united_kingdom` - United Kingdom
2. `slot_german_empire` - German Empire
3. `slot_united_states` - United States
4. `slot_empire_of_japan` - Empire of Japan
5. `slot_french_republic` - French Republic
6. `slot_kingdom_of_italy` - Kingdom of Italy
7. `slot_russian_empire` - Russian Empire
8. `slot_austro_hungarian_empire` - Austro-Hungarian Empire
9. `slot_kingdom_of_spain` - Kingdom of Spain
10. `slot_qing_dynasty` - Qing Dynasty

The stable identifiers in this registry are permanent campaign-selection identities. Display names MAY be localized, but localized text MUST NOT control identity, participation, succession, persistence, or simulation behavior.

The registry MUST contain exactly ten records. A missing, duplicate, additional, or reordered canonical record MUST fail content validation with `INVALID_PLAYABLE_SLOT_REGISTRY`.

## 2. Playable Slot Contract

Each `PlayableSlotDefinition` MUST contain:

- `playableSlotId`;
- `canonicalOrder` as an integer from `1` through `10` inclusive;
- `canonicalDisplayNameKey`;
- `countryIdentityId`;
- `participantClass` with the value `PLAYABLE_SLOT`;
- `firstSupportedScenarioId`;
- `scenarioParticipationRecordIds`;
- `contentVersion`; and
- `contentHash`.

`playableSlotId`, `canonicalOrder`, `countryIdentityId`, and `participantClass` MUST be immutable across content revisions and campaign saves.

A playable slot is distinct from every scenario-specific polity, government, regime, nation instance, and war participant associated with it.

A playable slot MUST NOT contain authoritative fields for:

- current government;
- current political regime;
- current territory;
- current diplomatic relations;
- current budget;
- current fleet;
- current technology;
- current war membership; or
- current scenario-specific state form.

Those fields belong to the appropriate scenario nation instance or domain aggregate.

## 3. Participant Classes

Every scenario identity record MUST declare exactly one `participantClass`:

- `PLAYABLE_SLOT_INSTANCE`; or
- `AI_ONLY_POWER`.

A `PLAYABLE_SLOT_INSTANCE` MUST reference exactly one canonical `playableSlotId`.

An `AI_ONLY_POWER` MUST use `playableSlotId: NONE` and MUST NOT be selected as the player nation.

No identity may declare both participant classes. No scenario nation instance may reference more than one playable slot.

An AI-only power MUST NOT:

- replace a playable slot;
- inherit a playable slot identifier;
- satisfy a missing playable-slot participation record;
- become player-selectable through name matching;
- inherit the player's naval institution identity; or
- be treated as a playable continuation without an explicit canonical playable-slot continuation definition.

A participant-class violation MUST fail with `INVALID_PARTICIPANT_CLASS`.

## 4. Scenario Participation Manifest

Every supported scenario MUST contain one immutable `ScenarioParticipationManifest` with:

- `scenarioId`;
- exactly ten `PlayableSlotParticipationRecord` entries;
- exactly twelve `AiPowerParticipationRecord` entries;
- exactly twenty-two `ScenarioIdentityRecord` entries;
- `manifestVersion`;
- `contentHash`; and
- `canonicalRecordOrderHash`.

The counts are exact. Inactive and conditionally active playable slots still count toward the ten playable-slot records and twenty-two scenario identity records.

Every identity record MUST be referenced by exactly one participation record in the same manifest. Every participation record MUST reference exactly one identity record. Duplicate and orphan records are prohibited.

The manifest MUST be validated before campaign configuration is presented as startable.

A count mismatch MUST fail with `SCENARIO_PARTICIPATION_COUNT_MISMATCH`.

A duplicate, missing, orphaned, or cross-scenario reference MUST fail with `INVALID_SCENARIO_PARTICIPATION_MANIFEST`.

## 5. Playable Slot Participation Record

Each `PlayableSlotParticipationRecord` MUST contain:

- `scenarioId`;
- `playableSlotId`;
- `continuityModeId`;
- `participationStatus`;
- `scenarioIdentityRecordId`;
- `scenarioNationInstanceId` or `NONE`;
- `continuationDefinitionId` or `NONE`;
- `selectionReasonCode`;
- `recordVersion`; and
- `contentHash`.

`participationStatus` MUST be exactly one of:

- `ACTIVE`;
- `INACTIVE`; or
- `CONDITIONAL_ACTIVE`.

The permitted field combinations are:

### 5.1 Active

An `ACTIVE` record MUST contain:

- a valid `scenarioIdentityRecordId`;
- a valid `scenarioNationInstanceId`;
- `continuationDefinitionId: NONE`; and
- `selectionReasonCode: SLOT_ACTIVE`.

### 5.2 Inactive

An `INACTIVE` record MUST contain:

- a valid explicit inactive `scenarioIdentityRecordId`;
- `scenarioNationInstanceId: NONE` unless canonical inactive-state content requires a non-playable identity instance;
- `continuationDefinitionId: NONE`; and
- `selectionReasonCode: SLOT_INACTIVE`.

An inactive slot MUST remain in the manifest and registry. It MUST NOT be deleted, omitted, replaced, or converted to an AI-only record.

### 5.3 Conditional Active

A `CONDITIONAL_ACTIVE` record MUST contain:

- a valid `scenarioIdentityRecordId`;
- a valid declared `scenarioNationInstanceId`;
- exactly one valid `continuationDefinitionId`;
- a `continuityModeId` other than `historical`; and
- `selectionReasonCode: SLOT_ENABLED_BY_CONTINUITY`.

`CONDITIONAL_ACTIVE` is prohibited under `historical` mode.

An invalid field combination MUST fail with `INVALID_PLAYABLE_SLOT_PARTICIPATION_RECORD`.

## 6. Campaign Start Eligibility

A playable slot is eligible to start a campaign only when the unique participation record matching the selected `scenarioId`, `playableSlotId`, and `continuityModeId` resolves to:

- `ACTIVE`; or
- `CONDITIONAL_ACTIVE` with a valid continuation definition.

An `INACTIVE` slot MUST fail campaign validation with `PLAYABLE_SLOT_INACTIVE`.

A `CONDITIONAL_ACTIVE` slot with a missing, invalid, or incompatible continuation definition MUST fail with `INVALID_CONTINUITY_SLOT_ACTIVATION`.

Participation resolution MUST:

1. locate exactly one matching record;
2. validate the record and all referenced content hashes;
3. validate participant class and playable-slot identity;
4. validate continuity-mode compatibility;
5. validate the referenced scenario nation instance;
6. emit an immutable compiled participation result; and
7. consume no randomness.

Missing or duplicate matching records MUST fail with `PLAYABLE_SLOT_PARTICIPATION_NOT_UNIQUE`.

The UI MAY display why a slot is unavailable, but it MUST NOT offer a start command for an ineligible slot.

## 7. Austro-Hungarian Playable Slot

The Austro-Hungarian playable slot identifier is permanently `slot_austro_hungarian_empire`.

The canonical participation matrix for this slot is:

### 7.1 Historical Mode

- `scen_1880`: `ACTIVE`;
- `scen_1900`: `ACTIVE`;
- `scen_1920`: `INACTIVE`;
- `scen_1935`: `INACTIVE`;
- `scen_1960`: `INACTIVE`.

### 7.2 Alternate Continuity Mode

Under `alternate_continuity_v1`:

- `scen_1880`: `ACTIVE` using the scenario's declared Austro-Hungarian nation instance;
- `scen_1900`: `ACTIVE` using the scenario's declared Austro-Hungarian nation instance;
- `scen_1920`: `CONDITIONAL_ACTIVE` using the explicit continuation definition `continuation_ah_1920_v1`;
- `scen_1935`: `CONDITIONAL_ACTIVE` using the explicit continuation definition `continuation_ah_1935_v1`; and
- `scen_1960`: `INACTIVE`.

The two required alternate-continuity definitions MUST:

- preserve `playableSlotId: slot_austro_hungarian_empire`;
- reference an explicit `PLAYABLE_SLOT_INSTANCE`;
- define the represented polity, government, territory, diplomacy, economy, objectives, fleet, and institutional continuity;
- pass the continuity contract in `DESIGN-02`; and
- remain distinct from every Ottoman or Turkish AI-only identity.

If either required continuation definition is absent or invalid, the corresponding slot MUST remain unavailable and validation MUST fail with `MISSING_AUSTRO_HUNGARIAN_CONTINUATION`.

No other continuity mode may activate this slot in `scen_1920` or `scen_1935` unless a future canonical design revision explicitly adds that mode and updates this matrix.

## 8. Ottoman and Turkish AI-Only Identities

Ottoman Empire and Turkey scenario identities MUST declare `participantClass: AI_ONLY_POWER`.

Their canonical stable identity identifiers MUST be distinct from:

- `slot_austro_hungarian_empire`;
- the Austro-Hungarian `countryIdentityId`;
- all Austro-Hungarian scenario identity records;
- all Austro-Hungarian scenario nation instances; and
- `continuation_ah_1920_v1` and `continuation_ah_1935_v1`.

An Ottoman or Turkish nation instance MUST NOT:

- occupy the Austro-Hungarian playable-slot record;
- satisfy an Austro-Hungarian continuation definition;
- inherit the Austro-Hungarian naval institution;
- be selected when the Austro-Hungarian slot is selected;
- be used as a fallback when Austro-Hungarian continuation content is missing; or
- change participant class at runtime.

Any such substitution MUST fail with `OTTOMAN_TURKISH_SLOT_SUBSTITUTION_PROHIBITED`.

Ottoman or Turkish powers MAY coexist and interact with an active alternate Austro-Hungarian continuation as separate AI-controlled nations when explicit scenario content defines both identities.

## 9. Qing Playable Slot

The Qing playable slot identifier is permanently `slot_qing_dynasty`.

Each supported scenario and continuity-mode combination MUST contain one explicit `QingSlotPolityMapping` with:

- `scenarioId`;
- `continuityModeId`;
- `playableSlotId`, which MUST equal `slot_qing_dynasty`;
- `participationStatus`;
- `representedCountryIdentityId`;
- `politicalRegimeId` or `NONE`;
- `scenarioIdentityRecordId`;
- `scenarioNationInstanceId` or `NONE`;
- `continuationDefinitionId` or `NONE`;
- `mappingReasonCode`;
- `mappingVersion`; and
- `contentHash`.

The mapping MUST be explicit even when the represented polity retains the Qing name and regime.

For later starts, an approved successor continuity is valid only when:

- the matching mapping record names the successor country identity and nation instance;
- the mapped nation instance declares `participantClass: PLAYABLE_SLOT_INSTANCE`;
- the mapped nation instance declares `playableSlotId: slot_qing_dynasty`;
- a required continuation definition exists and passes `DESIGN-02`;
- the selected continuity mode permits the mapping; and
- every political, territorial, diplomatic, economic, objective, fleet, and institutional transition is explicit canonical content.

The runtime MUST NOT infer a successor from:

- country or regime names;
- historical chronology;
- territorial ownership;
- capital location;
- government type;
- culture;
- language;
- diplomatic alignment;
- predecessor or successor labels not referenced by the mapping; or
- AI-only identity records.

A missing mapping MUST fail with `MISSING_QING_SLOT_POLITY_MAPPING`.

An ambiguous or multiply matching mapping MUST fail with `AMBIGUOUS_QING_SLOT_POLITY_MAPPING`.

An invalid successor MUST fail with `INVALID_QING_SUCCESSOR_CONTINUITY`.

No fallback polity may be selected after any of these failures.

## 10. Scenario Identity Record

Each `ScenarioIdentityRecord` MUST contain:

- `scenarioIdentityRecordId`;
- `scenarioId`;
- `participantClass`;
- `playableSlotId` or `NONE`;
- `countryIdentityId`;
- `scenarioNationInstanceId` or `NONE`;
- `participationStatus`;
- `representedPolityNameKey`;
- `recordVersion`; and
- `contentHash`.

For a playable slot, exactly one scenario identity record MUST exist per slot in each scenario manifest, including when inactive.

An inactive playable-slot identity record MUST retain:

- its canonical `playableSlotId`;
- its `countryIdentityId`;
- `participantClass: PLAYABLE_SLOT_INSTANCE`;
- `participationStatus: INACTIVE`; and
- a stable scenario identity record identifier.

Inactive records MUST NOT receive operational nation state, issue commands, join wars, own current assets, or act as AI powers unless they are activated through a valid continuity contract.

## 11. Nation Identity Layers

Identity layers MUST remain separate and use stable identifiers.

### 11.1 `country_identity`

Represents long-term cultural and geopolitical identity. It MUST NOT contain mutable scenario state.

### 11.2 `political_regime`

Represents government, ideology, legal structure, and era-specific policies. A regime MAY change without changing the playable slot or country identity when an explicit transition permits it.

### 11.3 `scenario_nation_instance`

Represents the concrete nation state in one scenario. It owns or references scenario-specific government, territory, economy, diplomacy, fleet, technology, and political state.

### 11.4 `playable_slot`

Represents the permanent player-selection identity. It survives valid polity and regime transitions under `DESIGN-02`.

### 11.5 `war_participant`

Represents one nation's membership in one specific war and side. A scenario nation instance MAY have multiple war-participant records across distinct wars. A war-participant record MUST NOT replace any other identity layer.

No identifier from one layer may be used as an identifier for another layer.

An invalid cross-layer identifier assignment MUST fail with `IDENTITY_LAYER_VIOLATION`.

## 12. Canonical Ordering and Hashing

Within each scenario manifest:

1. playable-slot records MUST be ordered by `canonicalOrder` from `1` through `10`;
2. AI-only power records MUST be ordered by ascending stable `countryIdentityId`;
3. scenario identity records MUST list playable-slot instances first in canonical slot order and AI-only powers second in ascending stable identifier order; and
4. all manifest hashes MUST be calculated after this ordering is applied.

Database insertion order, localized name, display sorting, and filesystem order MUST NOT affect canonical ordering or hashes.

Repeated compilation of identical content MUST produce an identical `canonicalRecordOrderHash` and manifest hash.

## 13. Validation and Acceptance

Automated validation MUST prove that:

1. the playable-slot registry contains exactly the ten declared stable identifiers;
2. every supported scenario contains exactly ten playable-slot records;
3. every supported scenario contains exactly twelve AI-only power records;
4. every supported scenario contains exactly twenty-two scenario identity records;
5. each scenario identity is referenced exactly once by a participation record;
6. inactive playable slots remain explicit `PLAYABLE_SLOT_INSTANCE` records;
7. only `ACTIVE` and valid `CONDITIONAL_ACTIVE` slots may start campaigns;
8. participation resolution consumes no randomness;
9. the Austro-Hungarian slot is active in historical `scen_1880` and `scen_1900`;
10. the Austro-Hungarian slot is inactive in historical `scen_1920`, `scen_1935`, and `scen_1960`;
11. only `alternate_continuity_v1` activates the Austro-Hungarian slot in `scen_1920` and `scen_1935`;
12. `continuation_ah_1920_v1` and `continuation_ah_1935_v1` preserve the Austro-Hungarian playable-slot identity;
13. Ottoman and Turkish identities remain AI-only and never substitute for the Austro-Hungarian slot;
14. every Qing scenario and continuity-mode combination has exactly one explicit polity mapping;
15. no Qing successor is inferred from runtime state or descriptive identity data;
16. AI-only powers cannot become player-selectable;
17. no identity-layer identifier is reused for another layer;
18. participant counts, identities, and canonical ordering survive save and load unchanged; and
19. identical content produces identical participation-manifest hashes on every supported operating system.
