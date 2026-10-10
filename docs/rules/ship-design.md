# DESIGN-21: Ship Design

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-21`
> **Amended by:** ADR-0063, ADR-0066, ADR-0070, ADR-0076, ADR-0085, ADR-0093.
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Design derivation, similarity, study discounts, displacement tolerance, stability, flotation, compilation, and rejection MUST use the explicit fields, values, formulas, ordering, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Design Layers

The authoritative ship-design layers are:

- `DesignDraft`: mutable player or AI work that is not an authoritative mechanical ship design;
- `DesignStudy`: a time-and-cost project evaluating one canonical draft revision;
- `CompiledDesignVersion`: an immutable validated mechanical design;
- `DesignFamily`: an immutable lineage identity with versioned parent relationships;
- `NamedClass`: naming and historical grouping that references one or more compiled versions;
- `IndividualShip`: one physical asset referencing exactly one current compiled version; and
- `RefitConfiguration`: a ship-specific active modification state referencing a validated refit result.

A mutable draft MUST NOT be used for construction, treaty compliance, classification, combat, cost posting, or project work.

## 2. Design Draft

Every `DesignDraft` MUST contain:

- `designDraftId`;
- owning nation identifier;
- intended ship type;
- parent design-family identifier or `NONE`;
- parent compiled-design identifier or `NONE`;
- displacement target;
- speed target;
- range class;
- fuel type;
- machinery specification;
- armor specification;
- armament specification;
- torpedo specification;
- missile specification;
- fire-control specification;
- radar and electronics specification;
- aviation-facility specification;
- topside-load specification;
- accommodation standard;
- special features;
- mechanical layout and firing positions;
- cosmetic data references;
- draft revision;
- creator class;
- created-from-snapshot hash; and
- draft hash.

Draft revisions MUST increase by exactly `1`. Editing a draft MUST NOT modify an existing compiled design.

## 3. Design Study

Every design submitted for approval MUST create or reference one `DesignStudy` containing:

- `designStudyId`;
- design draft and revision;
- owning nation;
- intended builder context;
- baseline compiled design or `NONE`;
- design-family identifier or proposed new family;
- similarity-assessment identifier;
- base study work;
- base study cost;
- discount basis points;
- final study work;
- final study cost;
- status;
- start and completion months;
- ruleset and formula versions; and
- project hash.

Study work and cost MUST use integer canonical units. A study receiving no paid work receives no progress.

## 4. Compiled Design Version

Every successful compilation MUST create one immutable `CompiledDesignVersion` containing:

- `compiledDesignVersionId`;
- source draft identifier and revision;
- design-family identifier;
- intended and natural classification;
- normalized mechanical attributes;
- technology manifest references;
- displacement and mass ledger;
- capacity ledger;
- machinery and speed results;
- fuel and range results;
- armor results;
- armament and ammunition results;
- aviation results;
- electronics and topside-load results;
- crew and support requirements;
- stability and flotation results;
- treaty results;
- dock and builder restrictions;
- cost and construction work;
- warning and penalty records;
- content, ruleset, formula, and compiler versions; and
- compiled design hash.

A compiled version MUST never be edited. Any mechanical change requires a new draft, study where required, and compiled version.

## 5. Design Family

Every `DesignFamily` MUST contain:

- `designFamilyId`;
- owning nation;
- root compiled-design identifier;
- ordered member compiled-design identifiers;
- family creation month;
- family type scope;
- lineage policy version; and
- family hash.

A compiled design may belong to exactly one design family.

A design based on an existing family is a `derived candidate` until the similarity assessment succeeds. Failure of similarity creates a new family when compilation otherwise succeeds.

## 6. Canonical Units

Authoritative design calculations MUST use `DESIGN-07` units:

- mass and displacement: kilograms;
- speed: micrometres per second;
- armor thickness: micrometres;
- distance and range: micrometres or an explicit range class;
- currency: budget micro-units;
- work: work micro-units;
- probability and multipliers: basis points; and
- angles: canonical angular units.

For similarity thresholds only:

- one metric tonne equals exactly `1_000` kilograms;
- `1_000` metric tonnes equals exactly `1_000_000` kilograms;
- one knot equals exactly `514_444` micrometres per second;
- one inch equals exactly `25_400` micrometres;
- one-half inch equals exactly `12_700` micrometres.

Display-unit rounding MUST NOT affect validation.

## 7. Design Compilation Pipeline

Compilation MUST execute these stages in order:

1. `NORMALIZE_UNITS`;
2. `VALIDATE_TECHNOLOGY`;
3. `COMPUTE_HULL_CAPACITY`;
4. `COMPUTE_MACHINERY_AND_SPEED`;
5. `COMPUTE_FUEL_AND_RANGE`;
6. `COMPUTE_ARMOR_WEIGHT_AND_PROTECTION`;
7. `COMPUTE_WEAPONS_AND_AMMUNITION`;
8. `COMPUTE_AVIATION_CAPACITY`;
9. `COMPUTE_ELECTRONICS_AND_TOPSIDE_LOAD`;
10. `COMPUTE_CREW_AND_SUPPORT_REQUIREMENTS`;
11. `COMPUTE_DISPLACEMENT_AND_MARGINS`;
12. `COMPUTE_STABILITY_AND_FLOTATION`;
13. `ASSESS_DERIVED_DESIGN_SIMILARITY`;
14. `VALIDATE_INTENDED_CLASSIFICATION`;
15. `APPLY_TREATY_RULES`;
16. `APPLY_DOCK_AND_CONSTRUCTION_RESTRICTIONS`;
17. `COMPUTE_COST`;
18. `COMPUTE_CONSTRUCTION_WORK`;
19. `VALIDATE_COMPILED_DESIGN_INVARIANTS`; and
20. `PRODUCE_IMMUTABLE_COMPILED_DESIGN`.

Every stage MUST emit a deterministic record with inputs, formulas, rounding, output, warnings, reason codes, and hashes.

A failed stage MUST stop compilation and MUST NOT create a compiled design version.

## 8. Derived-Design Baseline

A derived candidate MUST identify exactly one baseline `CompiledDesignVersion` in the same design family.

The baseline MUST:

- belong to the same nation or be licensed through an explicit design-rights contract;
- be a valid immutable compiled design;
- share the same broad hull category;
- not be superseded by a lineage repair; and
- be visible and legally usable by the designing nation.

The broad hull categories are:

- `SURFACE_COMBATANT`;
- `CARRIER`;
- `SUBMARINE`;
- `AUXILIARY`; and
- `SMALL_CRAFT`.

A category change always breaks similarity.

## 9. Similarity Assessment

Every derived candidate MUST create one immutable `DesignSimilarityAssessment` containing:

- assessment identifier;
- candidate draft and revision;
- baseline compiled design;
- displacement threshold and delta;
- main-gun comparison;
- secondary-gun comparison;
- speed threshold and delta;
- vertical-armor threshold and maximum delta;
- horizontal-armor threshold and maximum delta;
- hull-category result;
- special-feature compatibility results;
- final similarity result;
- failed criterion identifiers;
- study-discount result;
- ruleset and formula versions; and
- assessment hash.

Similarity succeeds only when every mandatory criterion in Sections 10 through 16 succeeds.

## 10. Displacement Similarity

Let:

- `baselineDisplacementKg` be the baseline compiled standard displacement;
- `candidateDisplacementKg` be the candidate compiled standard displacement; and
- `displacementIncreaseKg = candidateDisplacementKg - baselineDisplacementKg`.

The maximum permitted positive increase is:

`maximumIncreaseKg = max(floor(baselineDisplacementKg * 1_000 / 10_000), 1_000_000)`

This is exactly the greater of `10%` of baseline displacement or `1_000` metric tonnes.

Similarity fails when:

`displacementIncreaseKg > maximumIncreaseKg`

An increase exactly equal to the threshold remains similar.

A displacement decrease does not fail this criterion, but a decrease greater than `20%` breaks similarity under the hull-form criterion:

`candidateDisplacementKg < floor(baselineDisplacementKg * 8_000 / 10_000)`

The threshold calculation uses `FLOOR`.

## 11. Main-Gun Similarity

A `main battery` consists of all mounts assigned the baseline or candidate design's primary surface-fire role.

Main-gun similarity succeeds only when all conditions hold:

- main-gun caliber change is no greater than exactly `25_400` micrometres, equal to `1` inch;
- turret count change is within `-1..1` inclusive;
- barrels per turret change is within `-1..1` inclusive;
- total main-gun barrel count changes by no more than `25%` of baseline count, rounded down, with a minimum allowance of `2` barrels;
- mount type remains within the same technology family;
- no transition occurs between surface gun, missile-only, aviation-only, or submarine primary armament roles; and
- primary firing-layout topology remains compatible under `main_battery_layout_similarity_v1`.

A caliber change exactly equal to one inch remains similar.

A ruleset MAY narrow these allowances but MUST NOT widen caliber change above `50_800` micrometres or turret-count change beyond `2` without a design revision.

Failure MUST use `DERIVED_DESIGN_MAIN_BATTERY_CHANGED`.

## 12. Secondary-Gun Similarity

A major secondary-gun change occurs when any condition is true:

- maximum secondary caliber changes by more than exactly `12_700` micrometres, equal to one-half inch;
- total secondary barrel count changes by more than `33%` of baseline count, rounded down, with a minimum allowance of `4` barrels;
- secondary-battery weight changes by more than `25%` of baseline secondary-battery weight;
- the battery changes between single-purpose and dual-purpose technology families;
- a new secondary caliber group above `152_400` micrometres, equal to `6` inches, is added or removed; or
- the secondary battery's primary mechanical role changes between surface, anti-air, and dual-purpose.

If the baseline has zero secondary guns, adding more than `4` secondary barrels or any caliber above `127_000` micrometres, equal to `5` inches, is a major change.

Any major change breaks similarity with `DERIVED_DESIGN_SECONDARY_BATTERY_CHANGED`.

## 13. Speed Similarity

Let `speedDelta` be the absolute difference between candidate and baseline designed maximum speed.

The maximum permitted delta is exactly one knot:

`maximumSpeedDelta = 514_444` micrometres per second.

Similarity fails when:

`speedDelta > 514_444`

A delta exactly equal to one knot remains similar.

The comparison uses compiled designed speed before damage, crew, weather, or operational modifiers.

## 14. Vertical-Armor Similarity

Vertical armor zones are:

- main belt;
- upper belt;
- turret face;
- turret side;
- barbette;
- conning tower; and
- other explicitly vertical protection zones.

For every zone present in either design, compare canonical thickness at the zone's primary protection band.

The maximum permitted absolute change per zone is exactly one inch:

`maximumVerticalArmorDelta = 25_400` micrometres.

Similarity fails when any zone's absolute change exceeds this value.

Adding or removing a qualifying vertical armor zone counts from or to zero and therefore breaks similarity when thickness exceeds one inch.

A delta exactly equal to one inch remains similar.

## 15. Horizontal-Armor Similarity

Horizontal armor zones are:

- main deck;
- upper deck;
- lower deck;
- armored flight deck;
- magazine deck; and
- other explicitly horizontal protection zones.

The maximum permitted absolute change per zone is exactly one-half inch:

`maximumHorizontalArmorDelta = 12_700` micrometres.

Similarity fails when any zone's absolute change exceeds this value.

Adding or removing a qualifying horizontal armor zone counts from or to zero.

A delta exactly equal to one-half inch remains similar.

## 16. Additional Similarity Criteria

Similarity also fails when any condition is true:

- broad hull category changes;
- propulsion fuel changes between coal, mixed firing, oil, nuclear, or another canonical fuel family;
- hull-form identifier changes to a mechanically incompatible family;
- flight-deck role is added or removed;
- submarine pressure-hull type changes;
- primary aviation capacity changes from zero to more than `12` aircraft or from positive capacity to zero;
- missile-era primary combat role is added or removed;
- treaty category changes because of a mechanical design change; or
- a special feature explicitly declares `breaksDesignFamilySimilarity: true`.

Cosmetic changes MUST NOT affect similarity.

## 17. Similarity Result and New Families

When every criterion succeeds:

- `isDerivedDesign` MUST be `true`;
- the candidate remains in the baseline design family; and
- the study discount in Section 18 applies.

When any criterion fails:

- `isDerivedDesign` MUST be `false`;
- failed criteria MUST be recorded;
- no derived-design study discount applies; and
- if compilation succeeds, the design MUST create a new design family.

Similarity failure MUST NOT reject an otherwise legal design. It changes lineage and study cost.

## 18. Derived-Design Study Discount

The active ruleset MUST define `derived_design_study_discount_v1` with:

- base discount basis points;
- permitted range;
- minimum final study work;
- minimum final study cost;
- stacking policy;
- rounding; and
- formula version.

The shipped base discount is exactly `2_500` basis points, equal to `25%`.

The permitted range is `1_500..3_500` basis points inclusive.

The discount applies only when the final similarity result is true.

`finalStudyWork = ceiling(baseStudyWork * (10_000 - discountBp) / 10_000)`

`finalStudyCost = ceiling(baseStudyCost * (10_000 - discountBp) / 10_000)`

Both use `CEILING` so the discount cannot reduce payment or work below the exact discounted requirement.

The minimum final study work and cost are each exactly `1` canonical micro-unit.

Derived-design discount is `NON_STACKING` with any duplicate family discount. Other explicit national or event study modifiers apply after this discount in ascending modifier identifier order.

A missing discount field MUST fail with `DERIVED_DESIGN_DISCOUNT_CONTRACT_MISSING`.

## 19. Displacement Capacity

Every compiled design MUST calculate:

- `designDisplacementLimitKg`;
- `calculatedDisplacementKg`;
- `displacementMarginKg`;
- `overweightKg`;
- `overweightBp`;
- and displacement status.

The formulas are:

`displacementMarginKg = designDisplacementLimitKg - calculatedDisplacementKg`

`overweightKg = max(0, calculatedDisplacementKg - designDisplacementLimitKg)`

`overweightBp = floor(overweightKg * 10_000 / designDisplacementLimitKg)`

`designDisplacementLimitKg` MUST be positive.

## 20. Overweight Tolerance

The active ruleset MUST define `overweight_design_tolerance_v1`.

The shipped values are:

- warning threshold: `1` basis point;
- accepted overweight maximum: exactly `200` basis points, equal to `2%`;
- permitted ruleset range: `100..300` basis points inclusive;
- rejection threshold: any value greater than the selected accepted maximum;
- no penalty at `0` basis points;
- formula version and rounding: integer `FLOOR` for overweight basis points.

A design with `overweightBp` from `1` through `200` inclusive is accepted with penalties.

A design with `overweightBp > 200` is rejected in the shipped ruleset with `DESIGN_OVERWEIGHT_EXCEEDS_TOLERANCE`.

A design exactly at `200` basis points remains legal.

Treaty, classification, dock, and construction checks use actual calculated displacement, not the lower design limit.

## 21. Stability and Flotation Baselines

Every design MUST compute integer scores:

- `stabilityScore` within `0..10_000`;
- `flotationReserveScore` within `0..10_000`;
- `topsideMarginScore` within `0..10_000`; and
- `damageControlAccessScore` within `0..10_000`.

The active ruleset MUST define minimum legal values by ship type.

The shipped general minimums are:

- stability: `5_000`;
- flotation reserve: `5_000`;
- topside margin: `2_500`;
- damage-control access: `2_500`.

A ship-type definition MAY require higher explicit minimums. Missing minima MUST fail with `DESIGN_SAFETY_MINIMUM_MISSING`.

## 22. Overweight Penalties

For accepted overweight designs, apply `overweight_penalties_v1`:

`stabilityPenalty = overweightBp * 12`

`flotationPenalty = overweightBp * 10`

`topsideMarginPenalty = overweightBp * 8`

`damageControlAccessPenalty = overweightBp * 4`

All penalties are score points.

Post-penalty scores are:

`finalStabilityScore = max(0, baseStabilityScore - stabilityPenalty)`

`finalFlotationReserveScore = max(0, baseFlotationReserveScore - flotationPenalty)`

`finalTopsideMarginScore = max(0, baseTopsideMarginScore - topsideMarginPenalty)`

`finalDamageControlAccessScore = max(0, baseDamageControlAccessScore - damageControlAccessPenalty)`

At the shipped maximum of `200` basis points, penalties are:

- stability: `2_400` points;
- flotation: `2_000`;
- topside margin: `1_600`;
- damage-control access: `800`.

If any final score falls below the applicable legal minimum, the design MUST be rejected with `OVERWEIGHT_SAFETY_MINIMUM_FAILED` even when overweight remains within `200` basis points.

## 23. Overweight Operational Effects

A legal overweight design MUST persist explicit mechanical modifiers:

- turning-performance multiplier: `10_000 - overweightBp * 5` basis points;
- acceleration multiplier: `10_000 - overweightBp * 4` basis points;
- flooding-control multiplier: `10_000 - overweightBp * 6` basis points;
- foundering-risk multiplier: `10_000 + overweightBp * 10` basis points;
- fuel-consumption multiplier: `10_000 + overweightBp * 3` basis points.

Final positive-performance multipliers MUST be clamped to `7_500..10_000`. Risk and consumption multipliers MUST be clamped to `10_000..15_000`.

These modifiers MUST be stored in the compiled design's penalty record and used by the owning tactical and logistics formulas.

The UI MUST display the overweight amount, percentage, each score penalty, each operational modifier, and every affected legal margin.

## 24. Overweight Cost and Work

Calculated displacement already contributes to normal material cost and project work.

The overweight penalty policy MUST NOT add a second generic cost or work surcharge unless a future ruleset explicitly defines one.

The shipped additional overweight surcharge is `0` basis points.

## 25. Legal Rejection Conditions

A design MUST be rejected when any condition is true:

- overweight exceeds the selected tolerance;
- post-penalty stability is below minimum;
- post-penalty flotation reserve is below minimum;
- post-penalty topside margin is below minimum;
- post-penalty damage-control access is below minimum;
- intended classification is illegal;
- treaty validation fails;
- dock or builder limits fail;
- required technology is unavailable;
- capacity or layout invariants fail; or
- a mandatory compilation stage fails.

Rejected designs MUST retain a validation report but MUST NOT create a compiled design version.

## 26. Aesthetic Data

Superstructure drawings, visual decoration, paint, insignia, cosmetic arrangement, and non-mechanical model detail are presentation-only unless mapped to a declared mechanical component.

Cosmetic data MUST NOT affect:

- similarity;
- displacement;
- stability;
- flotation;
- cost;
- work;
- classification;
- treaty compliance;
- targeting;
- damage; or
- AI design evaluation.

## 27. Canonical Ordering and Hashing

Design components MUST be ordered by:

1. mechanical system category;
2. location and mount ordinal;
3. component identifier.

Armor zones MUST use the canonical zone order from Sections 14 and 15.

Similarity criteria MUST be evaluated in section order. Failed criteria MUST be recorded in that order.

Database insertion order, UI order, localized names, and drawing order MUST NOT affect compilation or hashes.

## 28. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_DESIGN_DRAFT`;
- `DESIGN_STUDY_REQUIRED`;
- `DESIGN_COMPILATION_FAILED`;
- `DERIVED_DESIGN_BASELINE_INVALID`;
- `DERIVED_DESIGN_DISPLACEMENT_CHANGED`;
- `DERIVED_DESIGN_MAIN_BATTERY_CHANGED`;
- `DERIVED_DESIGN_SECONDARY_BATTERY_CHANGED`;
- `DERIVED_DESIGN_SPEED_CHANGED`;
- `DERIVED_DESIGN_VERTICAL_ARMOR_CHANGED`;
- `DERIVED_DESIGN_HORIZONTAL_ARMOR_CHANGED`;
- `DERIVED_DESIGN_HULL_CATEGORY_CHANGED`;
- `DERIVED_DESIGN_SPECIAL_FEATURE_CHANGED`;
- `DERIVED_DESIGN_DISCOUNT_CONTRACT_MISSING`;
- `DESIGN_OVERWEIGHT_ACCEPTED_WITH_PENALTIES`;
- `DESIGN_OVERWEIGHT_EXCEEDS_TOLERANCE`;
- `OVERWEIGHT_SAFETY_MINIMUM_FAILED`;
- `DESIGN_SAFETY_MINIMUM_MISSING`;
- `DESIGN_TECHNOLOGY_UNAVAILABLE`;
- `DESIGN_TREATY_PROHIBITED`;
- `DESIGN_DOCK_LIMIT_EXCEEDED`; and
- `COMPILED_DESIGN_INVARIANT_FAILED`.

## 29. Validation and Acceptance

Automated validation MUST prove that:

1. mutable drafts never act as compiled mechanical authority;
2. compiled versions are immutable;
3. every derived candidate references exactly one valid baseline;
4. broad hull-category change breaks similarity;
5. maximum displacement increase is exactly the greater of `10%` or `1_000` metric tonnes;
6. equality at the displacement threshold remains similar;
7. displacement reduction greater than `20%` breaks hull-form similarity;
8. main-gun caliber may change by at most exactly one inch;
9. turret count and barrels-per-turret change by at most one;
10. total main barrels use the exact `25%` and minimum-two allowance;
11. secondary major change uses exact half-inch, `33%`, `25%`, six-inch, and zero-baseline rules;
12. speed may change by at most exactly one knot;
13. vertical armor may change by at most exactly one inch per zone;
14. horizontal armor may change by at most exactly one-half inch per zone;
15. threshold equality remains similar for speed and armor;
16. cosmetic changes never affect similarity;
17. similarity failure creates a new family rather than rejecting an otherwise legal design;
18. the shipped study discount is exactly `2_500` basis points;
19. study work and cost use ceiling rounding after discount;
20. actual calculated displacement is used for treaty, classification, dock, and construction checks;
21. the shipped overweight tolerance is exactly `200` basis points;
22. overweight from `1..200` basis points is accepted only with explicit penalties;
23. overweight above `200` basis points is rejected;
24. equality at `200` basis points remains legal when safety minima pass;
25. overweight penalties use exact multipliers `12`, `10`, `8`, and `4` score points per basis point;
26. accepted overweight designs persist exact turning, acceleration, flooding, foundering, and fuel modifiers;
27. any post-penalty score below its legal minimum rejects the design;
28. the shipped extra overweight cost surcharge is zero;
29. validation failures produce reports without compiled design authority; and
30. identical draft, baseline, content, ruleset, formulas, and technology manifest produce identical similarity, penalty, compilation, and hash results.
