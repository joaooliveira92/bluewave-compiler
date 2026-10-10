# DESIGN-22: Ship Classification

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-22`
> **Amended by:** ADR-0037, ADR-0067, ADR-0088.
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Classification types, thresholds, precedence, boundaries, warnings, rebuild reclassification, administrative reclassification, and caching MUST use the explicit values, predicates, versions, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Canonical Ship-Type Registry

The canonical registry contains exactly these fourteen ship types in this precedence order:

1. `CV`;
2. `CVL`;
3. `AV`;
4. `SS`;
5. `MTB`;
6. `TR`;
7. `BB`;
8. `BC`;
9. `B`;
10. `CA`;
11. `CL`;
12. `DD`;
13. `KE`;
14. `AMC`.

The registry order is the shipped natural-classification precedence. A type earlier in the list wins when a design legally satisfies more than one natural classifier and no narrower explicit precedence rule applies.

Additional ruleset-defined ship types are prohibited in the shipped canonical ruleset. A future type requires:

- a stable type identifier;
- a versioned design revision;
- intended-class validator;
- natural-classifier predicate;
- precedence ordinal unique within the registry;
- boundary definitions;
- treaty mapping;
- AI role mapping;
- battle-role mapping;
- maintenance mapping;
- acceptance tests; and
- save migration policy.

An undeclared type MUST fail with `SHIP_TYPE_UNREGISTERED`.

## 2. Canonical Measurement Basis

Classification MUST use the immutable current `CompiledDesignVersion` and canonical units from `DESIGN-07`:

- displacement: standard displacement in kilograms;
- speed: designed maximum speed in micrometres per second;
- armor: canonical thickness in micrometres;
- gun caliber: bore diameter in micrometres;
- aircraft capacity: integer physical aircraft slots after canonical capacity rounding;
- turret count: integer main-battery turret count; and
- torpedo presence: at least one operationally usable installed tube and compatible ammunition provision.

For classification constants:

- one metric tonne equals `1_000` kilograms;
- one knot equals `514_444` micrometres per second;
- one inch equals `25_400` micrometres.

Display values, declared treaty displacement, rounded knots, localized labels, and damaged operational speed MUST NOT be used.

## 3. Classification Definition

Every type MUST have one immutable `ShipClassificationDefinition` containing:

- `shipTypeId`;
- classification version;
- precedence ordinal;
- intended-class validator identifier;
- natural-classifier predicate identifier;
- displacement boundaries and operators;
- speed boundaries and operators;
- armor boundaries and operators;
- armament boundaries and operators;
- aviation boundaries and operators;
- technology predicates;
- conversion predicates;
- era-threshold policy identifier;
- mismatch policy;
- reason-code namespace;
- test-vector identifiers; and
- content hash.

Every numeric boundary MUST declare one operator from `<`, `<=`, `==`, `>=`, or `>`.

Missing metadata MUST fail with `INVALID_CLASSIFICATION_DEFINITION`.

## 4. Classification Result

Every compiled design MUST produce one `ShipClassificationResult` containing:

- compiled-design identifier and hash;
- classification version;
- intended type;
- intended-type validation result;
- natural type;
- all matching natural types in precedence order;
- applied technology and era predicates;
- boundary operands and operators;
- mismatch result;
- warning or rejection reason codes;
- formula and ruleset versions; and
- result hash.

Classification MUST consume no randomness.

## 5. Intended and Natural Classification

The designer MUST declare one intended type from the registry.

The intended validator MUST determine whether the compiled design satisfies every mandatory rule for that type.

The natural classifier MUST independently evaluate every registered type against the same compiled design.

The shipped mismatch policy is:

- intended validator fails: reject with `INTENDED_CLASSIFICATION_ILLEGAL`;
- intended validator passes and natural type equals intended type: accept;
- intended validator passes but natural type differs: reject with `NATURAL_CLASSIFICATION_MISMATCH`;
- multiple natural matches: resolve by this document's explicit precedence;
- no natural match: reject with `NO_NATURAL_CLASSIFICATION_MATCH`.

Warnings do not legalize an invalid intended class.

## 6. Era Bands

Era-dependent thresholds use the design-approval campaign month:

- `EARLY`: January 1880 through December 1899;
- `PRE_WAR`: January 1900 through December 1919;
- `INTERWAR`: January 1920 through December 1939;
- `MID_CENTURY`: January 1940 through December 1959;
- `LATE`: January 1960 through December 1970.

A design retains the era band captured by its compiled version unless Section 23 applies an explicit administrative reclassification policy.

## 7. Qualifying Armor

For `DD`, `KE`, and `AMC` classification, qualifying armor means any installed belt, deck, turret, barbette, conning-tower, or armored-box protection equal to or greater than exactly `50_800` micrometres, equal to `2` inches.

Splinter protection below `50_800` micrometres is non-qualifying for this predicate.

## 8. DD Classification

A design is `DD` only when all conditions hold:

- displacement is greater than `0` and strictly below the active DD maximum;
- speed is strictly greater than `9_774_436` micrometres per second, equal to `19` knots;
- at least one usable torpedo tube is installed;
- no qualifying armor under Section 7 is installed;
- aircraft capacity is `0`;
- design is not a submarine, transport, carrier, aviation support ship, or motor torpedo boat; and
- technology predicates permit the displacement band.

The shipped DD maximum displacement schedule is:

- `EARLY`: strictly below `2_000_000` kilograms;
- `PRE_WAR`: strictly below `2_500_000` kilograms;
- `INTERWAR`: strictly below `3_000_000` kilograms;
- `MID_CENTURY`: strictly below `3_500_000` kilograms;
- `LATE`: less than or equal to `3_800_000` kilograms.

The late maximum is exactly `3_800` metric tonnes.

Era access alone does not increase the maximum. The design nation MUST also possess the era's explicit destroyer-hull technology capability. Without it, the most recent previously unlocked maximum applies.

Equality at `2_000`, `2_500`, `3_000`, or `3_500` metric tonnes fails those strict bands. Equality at `3_800` metric tonnes is legal only in `LATE` with the required capability.

## 9. CL Classification

A design is `CL` only when all conditions hold:

- displacement is greater than or equal to `2_000_000` kilograms;
- displacement is strictly below `8_000_000` kilograms;
- speed is strictly greater than `8_231_104` micrometres per second, equal to `16` knots;
- maximum main-gun caliber is less than or equal to `152_400` micrometres, equal to `6` inches;
- aircraft capacity is below `4`;
- design is not naturally `DD`, `KE`, `AMC`, `AV`, `CVL`, `CV`, `SS`, `TR`, or `MTB`; and
- cruiser technology predicates pass.

The following explicit exceptions are permitted:

- `protected_cruiser_exception` (ruleset constant version `1`, ADR-0067): permits absence of belt armor, and additionally raises the CL main-gun bound from `152_400` to `203_200` micrometres (8 inches) when the design has no main belt (thickness `0`), an armour deck (`DECK_MAIN` or `DECK_SLOPE` thickness above `0`), and every main-gun mount above 6 inches is a single mount (one barrel). Twin or larger mounts above 6 inches, any main belt, or a gun above 8 inches fails CL. It does not change displacement or speed boundaries and does not change the strict CA `> 6` inch bound. In the EARLY band it needs no technology gate; the later capability `protected_cruiser_design` gates it in other bands;
- `missile_cruiser_exception`: available only with capability `guided_missile_cruiser`; permits main surface guns below the normal role requirement and missile primary armament, but maximum installed gun caliber remains `152_400` micrometres.

A main caliber exactly `6` inches is legal. A caliber above `6` inches is not CL, except under `protected_cruiser_exception` (exactly `8` inches is legal there, `8` inches plus one micrometre is not).

## 10. B Classification

A design is `B` only when all conditions hold:

- displacement is greater than or equal to `5_000_000` kilograms;
- main belt is greater than or equal to `152_400` micrometres, equal to `6` inches;
- maximum main-gun caliber is strictly greater than `152_400` micrometres;
- designed speed is strictly below `10_288_880` micrometres per second, equal to `20` knots;
- main-battery turret count is `1` or `2`;
- aircraft capacity is below `4`; and
- design does not satisfy `BB` or `BC`.

Speed exactly `20` knots is not B. Belt exactly `6` inches is legal. Main guns exactly `6` inches are not legal.

## 11. CA Classification

A design is `CA` only when all conditions hold:

- displacement is strictly greater than `4_000_000` kilograms;
- speed is strictly greater than `9_774_436` micrometres per second, equal to `19` knots;
- main belt is strictly greater than `50_800` micrometres and less than or equal to `304_800` micrometres, equal to more than `2` and no more than `12` inches;
- maximum main-gun caliber is strictly greater than `152_400` micrometres and less than or equal to `279_400` micrometres, equal to more than `6` and no more than `11` inches;
- aircraft capacity is below `4`; and
- design does not satisfy `BC` or `BB`.

A six-inch main gun classifies under CL when its other predicates pass. An eleven-inch gun is legal for CA. A gun above eleven inches is not CA.

## 12. BC Classification

A design is `BC` only when all common conditions and at least one armament condition hold.

Common conditions:

- displacement is strictly greater than `8_000_000` kilograms;
- main belt is strictly greater than `50_800` micrometres;
- aircraft capacity is below `4`;
- qualifying era speed threshold is met; and
- design does not satisfy the BB precedence rule in Section 13.

Armament condition A:

- maximum main-gun caliber is strictly greater than `254_000` micrometres, equal to `10` inches.

Armament condition B:

- main-battery turret count is at least `3`; and
- maximum main-gun caliber is greater than `152_400` micrometres.

The shipped BC minimum speed schedule is:

- `EARLY`: greater than or equal to `10_288_880` micrometres per second, equal to `20` knots;
- `PRE_WAR`: at least `11_317_768`, equal to `22` knots;
- `INTERWAR`: at least `12_346_656`, equal to `24` knots;
- `MID_CENTURY`: at least `14_404_432`, equal to `28` knots;
- `LATE`: at least `15_433_320`, equal to `30` knots.

Each threshold requires the matching explicit high-speed capital-ship capability. Without it, the last unlocked threshold applies.

## 13. BB Classification

A design is `BB` only when all conditions hold:

- displacement is strictly greater than `8_000_000` kilograms;
- main-battery turret count is at least `3`;
- main belt is strictly greater than `152_400` micrometres, equal to more than `6` inches;
- maximum main-gun caliber is strictly greater than `254_000` micrometres, equal to more than `10` inches;
- aircraft capacity is below `4`; and
- either designed speed is below the active BC threshold or armor index is at least `7_500` basis points under `capital_ship_armor_index_v1`.

When a design satisfies both BC and BB predicates, BB wins when armor index is at least `7_500`; otherwise BC wins.

The armor index MUST use explicit belt, deck, turret, barbette, and protected-length inputs and integer arithmetic. Missing inputs MUST fail classification.

## 14. KE Classification

A design is `KE` only when all conditions hold:

- displacement is strictly below `2_500_000` kilograms;
- main belt is less than or equal to `50_800` micrometres, equal to `2` inches;
- maximum gun caliber is less than or equal to `152_400` micrometres, equal to `6` inches;
- no torpedo tube is installed;
- aircraft capacity is `0`;
- design is not `MTB`, `SS`, `TR`, or `AMC`; and
- escort or corvette role capability is present.

Belt exactly `2` inches and gun caliber exactly `6` inches are legal. Displacement exactly `2_500` metric tonnes is not KE.

## 15. AMC Classification

A design is `AMC` only when all conditions hold:

- displacement is strictly greater than `1_700_000` kilograms;
- qualifying armor under Section 7 is absent;
- maximum gun caliber is less than or equal to `152_400` micrometres;
- merchant-hull capability is present;
- aircraft capacity is below `4`;
- design is not a purpose-built `TR`; and
- AMC authorization predicates pass.

The shipped fleet limits are:

- total active AMC count: no more than `20%` of active commissioned cruiser count, rounded down, with a minimum allowance of `2`;
- fast AMC count: no more than `25%` of active AMC count, rounded down, with a minimum allowance of `1`;
- fast AMC definition: designed speed greater than or equal to `11_317_768` micrometres per second, equal to `22` knots.

These are fleet authorization limits, not natural mechanical classification predicates. A mechanically valid AMC design may compile but its construction order MUST be rejected when the applicable limit is exceeded.

## 16. CV Classification

A design is `CV` only when:

- physical aircraft capacity is greater than `34`;
- full-length flight-deck capability is present;
- fixed-wing launch and recovery capability is present;
- carrier technology defines a maximum displacement not lower than the design's actual displacement;
- design is not an aviation-support-only vessel; and
- carrier classification predicates pass.

Capacity `35` is CV. Capacity `34` is not CV.

The design's displacement maximum MUST come from an explicit carrier-technology capability. Missing maximum MUST fail with `CARRIER_DISPLACEMENT_LIMIT_MISSING`.

## 17. CVL Classification

A design is `CVL` only when:

- aircraft capacity is within `4..34` inclusive;
- flight-deck or other fixed-wing carrier-operation capability is present;
- displacement is less than or equal to `16_000_000` kilograms;
- design is not aviation-support-only; and
- carrier technology predicates pass.

A displacement above `16_000` metric tonnes is legal only when all predicates of `valid_light_carrier_conversion_v1` pass:

- source hull is an existing commissioned or in-construction non-carrier hull;
- conversion is explicitly authorized by technology and treaty;
- displacement does not exceed `20_000_000` kilograms;
- aircraft capacity remains `4..34`;
- conversion project and provenance are recorded; and
- resulting design passes stability, flotation, dock, and rebuild validation.

A purpose-built CVL above `16_000` metric tonnes is prohibited.

## 18. AV Classification

A design is `AV` only when:

- aircraft-support subtype is explicitly one of `SEAPLANE_TENDER`, `HELICOPTER_SUPPORT`, `PATROL_AVIATION_SUPPORT`, or `AMPHIBIOUS_AVIATION_SUPPORT`;
- aviation-support capacity is at least `2` supported aircraft;
- the vessel lacks full carrier fixed-wing launch-and-recovery capability; and
- the subtype's era capability is available.

Subtype availability is:

- `SEAPLANE_TENDER`: from `PRE_WAR` with capability `seaplane_tender_operations`;
- `PATROL_AVIATION_SUPPORT`: from `INTERWAR` with capability `patrol_aviation_support`;
- `HELICOPTER_SUPPORT`: from `MID_CENTURY` with capability `helicopter_support_operations`;
- `AMPHIBIOUS_AVIATION_SUPPORT`: from `MID_CENTURY` with capability `amphibious_aviation_support`.

An AV with full qualifying carrier capability is naturally CVL or CV according to capacity.

## 19. SS, TR, and MTB Classification

### 19.1 SS

A design is `SS` only when:

- pressure-hull capability is present;
- submerged-operation capability is present;
- submarine propulsion capability is present;
- design is not a surface-ship hull; and
- submarine technology predicates pass.

### 19.2 TR

A design is `TR` only when:

- primary role is troop, cargo, landing, or merchant transport;
- cargo or troop capacity is positive;
- purpose-built combatant role is absent;
- qualifying armor is absent except explicit landing-ship protection; and
- transport predicates pass.

### 19.3 MTB

A design is `MTB` only when:

- displacement is less than or equal to `200_000` kilograms;
- speed is at least `15_433_320` micrometres per second, equal to `30` knots;
- at least one usable torpedo tube is installed;
- qualifying armor is absent;
- oceanic range capability is absent; and
- motor-torpedo-boat technology is available.

## 20. Natural Classification Precedence

The general registry precedence in Section 1 applies, with these explicit pair rules:

1. `CV` beats every other type when its predicates pass.
2. `CVL` beats AV and surface combatants.
3. `AV` beats TR when aviation support is the declared and mechanically dominant role.
4. `SS`, `MTB`, and `TR` beat surface-combatant classes when their structural predicates pass.
5. `BB` versus `BC` uses Section 13 armor-index precedence.
6. `BC` beats `B`, `CA`, and `CL`.
7. `B` beats `CA` and `CL` when B predicates pass.
8. `CA` beats `CL`.
9. `DD` beats `KE` only when torpedoes and all DD predicates pass.
10. `KE` beats AMC unless merchant-hull and AMC-role predicates pass.

Every precedence decision MUST be recorded.

## 21. Boundary Rule Summary

All authoritative boundaries are exact:

- `below`: `<`;
- `above`: `>`;
- `at least`: `>=`;
- `no more than`: `<=`;
- `from X through Y`: `>= X` and `<= Y`.

No tolerance, display rounding, or epsilon applies.

## 22. Rebuild Reclassification

Every completed rebuild, conversion, or mechanically significant refit MUST create a new `CompiledDesignVersion` and invoke full intended and natural classification before project completion is committed.

The rebuilt ship MUST reference the new classification result atomically with the new compiled version.

If the intended type becomes illegal or mismatches the natural type under the selected rebuild contract, rebuild completion MUST fail with `REBUILD_CLASSIFICATION_INVALID` and remain uncommitted.

Individual ships of the same named class MAY have different classifications only when they reference different compiled design versions and the named-class contract permits administrative split classification.

## 23. Administrative Era Reclassification

Era change alone MUST NOT reclassify a ship unless an explicit `AdministrativeReclassificationPolicy` applies.

The shipped canonical policy is `administrative_reclassification_v1` and has no automatic era-only rules. Therefore, calendar advancement by itself does not change classification.

A future rule MUST declare:

- policy identifier and version;
- eligible source and target types;
- exact effective month;
- technology predicate;
- mechanical or administrative predicate;
- whether compiled design changes;
- treaty and maintenance effects;
- notification behavior; and
- migration and replay tests.

Administrative reclassification without mechanical design change MUST create a versioned classification record but MUST NOT alter the compiled mechanical design hash.

## 24. Classification Cache

A cached classification is permitted only as `CACHED_PROJECTION`.

Every `ClassificationCacheEntry` MUST contain:

- ship or design identifier;
- current compiled-design-version identifier;
- compiled-design hash;
- classification-definition version;
- ruleset hash;
- classification-result identifier;
- result hash;
- cache creation snapshot; and
- cache hash.

The cache is valid only when all pinned identifiers and hashes equal current values.

On load, rebuild, conversion, migration, ruleset validation, or compiled-version change, a mismatch MUST discard and deterministically rebuild the cache.

A stale cache MUST NOT reject load when authoritative design state is valid. Using stale cached classification as authority MUST fail with `STALE_CLASSIFICATION_CACHE_USED`.

## 25. Persistence and Audit

The authoritative classification result for every compiled design MUST be persisted or content-addressed.

Every classification and reclassification MUST produce an audit record containing:

- cause;
- old and new classification when applicable;
- predicates;
- boundaries;
- precedence result;
- versions;
- input and output hashes; and
- reason codes.

## 26. Required Reason Codes

The subsystem MUST define at least:

- `SHIP_TYPE_UNREGISTERED`;
- `INVALID_CLASSIFICATION_DEFINITION`;
- `INTENDED_CLASSIFICATION_ILLEGAL`;
- `NATURAL_CLASSIFICATION_MISMATCH`;
- `NO_NATURAL_CLASSIFICATION_MATCH`;
- `DD_DISPLACEMENT_LIMIT_EXCEEDED`;
- `DD_TORPEDO_REQUIRED`;
- `DD_QUALIFYING_ARMOR_PROHIBITED`;
- `CL_MAIN_CALIBER_EXCEEDED`;
- `CA_BOUNDARY_FAILED`;
- `CAPITAL_SHIP_ARMOR_INDEX_MISSING`;
- `AMC_FLEET_LIMIT_EXCEEDED`;
- `CARRIER_DISPLACEMENT_LIMIT_MISSING`;
- `CVL_PURPOSE_BUILT_DISPLACEMENT_EXCEEDED`;
- `AV_SUBTYPE_INVALID`;
- `REBUILD_CLASSIFICATION_INVALID`;
- `ADMINISTRATIVE_RECLASSIFICATION_NOT_AUTHORIZED`;
- `STALE_CLASSIFICATION_CACHE_USED`; and
- `CLASSIFICATION_INVARIANT_FAILED`.

## 27. Validation and Acceptance

Automated validation MUST prove that:

1. the shipped registry contains exactly fourteen types and no extension fallback;
2. every type has a unique precedence ordinal and complete predicate metadata;
3. classification uses canonical unrounded compiled values;
4. DD speed is strictly above 19 knots and requires torpedoes;
5. qualifying armor begins exactly at 2 inches;
6. DD maximums are exactly 2,000, 2,500, 3,000, 3,500, and 3,800 metric tonnes under the declared eras and technologies;
7. the late DD maximum is exactly 3,800 metric tonnes inclusive;
8. CL uses `>= 2,000`, `< 8,000`, speed `> 16`, and gun caliber `<= 6` inches (or `<= 8` inches single-mounted under the protected-cruiser exception);
9. B uses displacement `>= 5,000`, belt `>= 6`, guns `> 6`, speed `< 20`, and at most two turrets;
10. CA uses displacement `> 4,000`, speed `> 19`, belt `> 2` and `<= 12`, and guns `> 6` and `<= 11` inches;
11. BC uses explicit armament alternatives and exact era speed thresholds;
12. BB uses more than 8,000 tonnes, at least three turrets, belt over 6 inches, and guns over 10 inches;
13. BB versus BC uses the exact 7,500-point armor-index rule;
14. KE uses `< 2,500`, belt `<= 2`, gun `<= 6`, and no torpedoes;
15. AMC uses `> 1,700`, no qualifying armor, gun `<= 6`, merchant hull, and explicit fleet limits;
16. CV begins at aircraft capacity 35 and CVL spans 4 through 34 inclusive;
17. purpose-built CVL displacement is at most 16,000 metric tonnes;
18. conversion CVL may reach 20,000 metric tonnes only under the explicit conversion policy;
19. AV requires an explicit subtype and era capability;
20. SS, TR, and MTB have complete concrete predicates;
21. every overlap resolves through declared precedence;
22. intended and natural mismatch is rejected under the shipped policy;
23. rebuilds always create a new compiled version and rerun classification;
24. calendar advancement alone causes no reclassification in the shipped policy;
25. authorized administrative reclassification does not alter mechanical design hash unless design changed;
26. cache validity is pinned to compiled design, classification version, and ruleset hashes;
27. stale cache is discarded and rebuilt rather than used as authority; and
28. identical compiled design, content, ruleset, and classification version produce identical results and hashes.
