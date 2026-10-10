# DESIGN-39: Gunnery

> **Canonical status:** Normative design specification.
> **Stable document ID:** `DESIGN-39`
> **Amended by:** ADR-0048, ADR-0072.
> **Requirement language:** `MUST`, `MUST NOT`, `SHOULD`, and `MAY` are normative. Accuracy, rate of fire, gun quality, autoloaders, dual-purpose mounts, armor effectiveness, penetration, splinter protection, target allocation, ordering, and persistence MUST use the explicit values, formulas, predicates, and failure behavior defined here. Runtime inference and silent fallback behavior are prohibited.

## 1. Gunnery State

Every operational battery MUST have one authoritative `GunneryState` containing:

- `batteryId`;
- owner ship or installation identifier;
- gun and mount definition identifiers;
- current target contact identifier or `NONE`;
- acquisition progress basis points;
- range estimate and uncertainty;
- fire-control solution quality;
- ammunition state by ammunition type;
- current fire mode;
- reload progress;
- straddle state;
- damage state;
- AA eligibility state;
- last salvo minute and substep;
- ruleset and formula versions; and
- state hash.

A battery MUST NOT target hidden authoritative assets directly. Targeting MUST reference a legal contact under `DESIGN-29` and `DESIGN-38`.

## 2. Fire Modes

The canonical fire modes are:

- `CEASE_FIRE`;
- `RANGING`;
- `NORMAL`;
- `RAPID`;
- `AA_TRACKING`;
- `AA_BARRAGE`; and
- `LOCAL_CONTROL`.

Each mode MUST define ammunition use, reload behavior, accuracy behavior, target eligibility, fire-control requirements, and cancellation behavior.

`RAPID` mode is eligible only after a valid straddle or another explicit fire-control predicate.

## 3. Accuracy Resolution

For every firing solution:

`finalAccuracyBp = clamp(0, 10_000, floor(baseAccuracyBp * fireControlMultiplierBp * crewMultiplierBp * officerMultiplierBp * trainingMultiplierBp * rangeMultiplierBp * visibilityMultiplierBp * radarMultiplierBp * ownManeuverMultiplierBp * targetManeuverMultiplierBp * previousSalvoMultiplierBp * seaStateMultiplierBp * smokeMultiplierBp * damageMultiplierBp * multipleAttackerMultiplierBp * glareMultiplierBp * targetEvasionMultiplierBp / 10_000^16))`

The exact rational value MUST be retained through all multipliers and rounded once with `FLOOR`.

Every multiplier MUST be explicit and versioned. Missing values MUST fail with `GUNNERY_ACCURACY_FACTOR_MISSING`.

A hit check MUST compare one integer draw from `0..9_999` against `finalAccuracyBp`, succeeding exactly when `draw < finalAccuracyBp`.

## 4. Rate-of-Fire Resolution

Rate of fire MUST be represented as reload work per shot, not binary floating-point rounds per minute.

Each battery MUST declare `baseReloadMilliseconds` as a positive integer.

The effective reload duration is:

`effectiveReloadMilliseconds = ceiling(baseReloadMilliseconds * 10_000^modifierCount / productOfRateMultipliersBp)`

Rate multipliers MUST apply in this order:

1. gun-quality rate multiplier;
2. mount multiplier;
3. autoloader multiplier;
4. crew multiplier;
5. technology multiplier;
6. turn-state multiplier;
7. sea-state multiplier;
8. smoke-interference multiplier;
9. damage multiplier;
10. range or fire-control-cycle multiplier; and
11. ammunition-state multiplier.

Reload progress MUST advance by exact tactical milliseconds. A battery fires only when reload progress reaches its effective duration and all firing predicates pass.

## 5. Gun Quality

Gun quality is an integer from `-3` through `+2` inclusive.

The shipped multipliers are:

- quality `-3`: range `8_500`, penetration `8_500`, applicable rate of fire `8_500` basis points;
- `-2`: `9_000`, `9_000`, `9_000`;
- `-1`: `9_500`, `9_500`, `9_500`;
- `0`: `10_000`, `10_000`, `10_000`;
- `+1`: `10_500`, `10_500`, `10_500`;
- `+2`: `11_000`, `11_000`, `11_000`.

A gun or mount definition MAY declare that quality does not affect rate of fire. Range and penetration effects remain mandatory unless explicitly prohibited by the technology contract.

## 6. Autoloader Eligibility

An autoloader may be installed only when:

- the required autoloader technology is discovered and adopted;
- gun caliber and mount type appear in the technology's eligibility set;
- the mount provides required volume, power, ammunition handling, and crew access;
- the design passes displacement, stability, flotation, and topside-load validation;
- ammunition type is compatible; and
- no damage disables the autoloader.

A battery without an operational autoloader receives no autoloader modifier.

## 7. Autoloader Rate of Fire

The shipped autoloader policy `autoloader_v1` defines:

- normal-fire rate multiplier: exactly `11_000` basis points;
- permitted normal range: `10_500..11_500`;
- rapid-fire rate multiplier after straddling: exactly `13_000` basis points;
- permitted rapid range: `12_000..14_000`;
- rapid-fire eligibility: valid current straddle and fire-control solution at least `6_000` basis points;
- multiplier application: replaces the normal autoloader multiplier rather than stacking with it.

At normal fire, reload duration is therefore divided by `1.10` through the integer formula in Section 4.

At eligible rapid fire, reload duration is divided by `1.30`.

The rapid multiplier ends immediately when:

- target contact is lost;
- target changes;
- fire-control solution falls below `6_000`;
- battery changes out of `RAPID` mode;
- autoloader becomes damaged; or
- ammunition feed is interrupted.

## 8. Autoloader Weight

The shipped autoloader mount-weight multiplier is exactly `12_500` basis points, equal to `25%` additional mount-system mass.

`autoloadingMountMassKg = ceiling(nonAutoloadingEquivalentMountMassKg * 12_500 / 10_000)`

The mass includes mount machinery and integrated ammunition handling specified by the mount definition. Ammunition inventory mass remains calculated separately and MUST NOT be multiplied twice.

The permitted ruleset range is `11_500..13_500` basis points.

The increased mass MUST affect design displacement, stability, flotation, topside load, cost, construction work, and rebuild eligibility.

## 9. Autoloader AA Performance

An autoloading battery receives improved AA performance only when:

- the gun and mount are AA-capable;
- fire-control system can generate an AA solution;
- elevation and training rates satisfy the target profile;
- compatible AA ammunition is available; and
- the autoloader is operational.

The shipped AA modifiers are:

- sustained AA rate-of-fire multiplier: `11_500` basis points;
- short AA burst multiplier for the first `2` tactical minutes of continuous engagement: `13_000`;
- ammunition-feed jam probability multiplier during the short burst: `12_500`;
- AA tracking accuracy: unchanged at `10_000` unless another technology modifies it.

Improved AA performance MUST NOT apply to a surface-only gun or mount.

## 10. Autoloader Failure

When an autoloading battery fires in `RAPID`, `AA_TRACKING`, or `AA_BARRAGE` mode, it MUST perform a feed-failure check at each completed `10` shots.

The shipped base probability is `250` basis points.

`feedFailureProbabilityBp = clamp(0, 10_000, floor(250 * damageMultiplierBp * burstMultiplierBp * crewMultiplierBp / 10_000^3))`

A failure creates one explicit result:

- `MINOR_JAM`: battery unavailable for `1` tactical minute;
- `MAJOR_JAM`: unavailable for `5` tactical minutes;
- `FEED_DAMAGE`: autoloader disabled until repair.

Outcome weights are `7_500`, `2_000`, and `500` respectively.

## 11. Dual-Purpose Gun Definition

A dual-purpose gun system consists of a compatible gun, mount, ammunition-handling system, fire-control system, and crew establishment capable of surface and AA engagement.

A gun barrel alone MUST NOT confer dual-purpose capability.

Every dual-purpose definition MUST declare:

- eligible calibers;
- mount elevation and training limits;
- AA and surface fire-control requirements;
- compatible ammunition;
- surface reload behavior;
- AA reload behavior;
- weight multiplier;
- role-switch delay;
- simultaneous-engagement policy; and
- ruleset version.

Missing data MUST fail with `DUAL_PURPOSE_GUN_CONTRACT_MISSING`.

## 12. Dual-Purpose Weight

The shipped dual-purpose system-weight multiplier is exactly `12_500` basis points, equal to `25%` additional mass over the mechanically equivalent surface-only gun-and-mount system.

`dualPurposeSystemMassKg = ceiling(surfaceOnlyEquivalentSystemMassKg * 12_500 / 10_000)`

The permitted range is `11_500..13_500` basis points.

The system mass includes the mount, elevation machinery, training machinery, power, handling equipment, and integrated fire-control hardware declared by the definition. Ammunition inventory remains separate.

The increased mass MUST affect displacement, stability, flotation, topside load, cost, work, and rebuild validation.

## 13. Dual-Purpose Surface Role

In surface role, a dual-purpose battery uses:

- normal surface accuracy and penetration formulas;
- surface ammunition characteristics;
- the mount's surface reload multiplier;
- ordinary target-allocation rules; and
- no implicit AA accuracy bonus.

The shipped surface role multiplier is `10_000` basis points unless the mount definition explicitly provides another value.

## 14. Dual-Purpose AA Role

In AA role, a dual-purpose battery uses:

- AA target and tracking predicates;
- AA-compatible ammunition;
- AA fire-control solution;
- elevation and training-rate limits;
- target-altitude and angular-rate eligibility;
- AA accuracy and burst formulas; and
- ammunition conservation policy.

The shipped eligible AA effectiveness multiplier is `11_000` basis points relative to a same-caliber AA-capable non-dual-purpose reference system.

A surface-only reference without AA capability has zero AA effectiveness and is not a valid comparison baseline.

## 15. Dual-Purpose Role Switching

The shipped role-switch delay is exactly `1` tactical minute.

During switching:

- no salvo may fire;
- reload progress is preserved;
- fire-control solution for the previous role decays under its normal rule;
- new-role acquisition begins after the switch completes; and
- ammunition selection follows the command contract.

The shipped policy prohibits simultaneous surface and AA engagement by one mount. Separate mounts in the same battery MAY engage different roles only when the battery definition explicitly supports mount-level control.

## 16. Armor Zones

The canonical armor zones include:

- main belt;
- upper belt;
- main deck;
- upper deck;
- lower deck;
- turret face;
- turret side;
- turret roof;
- barbette;
- conning tower;
- armored flight deck;
- magazine protection; and
- other explicit mechanically mapped zones.

Each zone MUST store canonical thickness, armor quality, slope, coverage, and manufacturing policy.

## 17. Armor Thickness Limits

The maximum legal main-belt thickness is exactly `508_000` micrometres, equal to `20` inches.

The maximum legal turret-face thickness is exactly `660_400` micrometres, equal to `26` inches.

The same `26`-inch maximum applies to barbette and conning-tower vertical armor unless a narrower explicit zone definition applies.

Every other armor zone MUST provide an explicit maximum. Missing maxima MUST fail with `ARMOR_ZONE_MAXIMUM_MISSING`.

A value above a maximum MUST be rejected during design or rebuild validation with `ARMOR_THICKNESS_LIMIT_EXCEEDED`.

Equality at the maximum is legal.

## 18. Thick-Armor Manufacturing Threshold

The thick-armor threshold is exactly `304_800` micrometres, equal to `12` inches.

Armor at or below `12` inches receives its full nominal thickness before armor-quality and impact-angle effects.

Armor above `12` inches receives reduced marginal effectiveness under `thick_armor_manufacturing_v1`.

## 19. Thick-Armor Effective Thickness

For canonical ordinary face-hardened or homogeneous armor without a technology-specific override:

`baseThickness = min(actualThickness, 304_800)`

`excessThickness = max(0, actualThickness - 304_800)`

`effectiveExcessThickness = floor(excessThickness * 7_500 / 10_000)`

`manufacturingEffectiveThickness = baseThickness + effectiveExcessThickness`

The shipped excess-thickness effectiveness is exactly `7_500` basis points, equal to `75%` marginal effectiveness above `12` inches.

The permitted ruleset range is `6_000..9_000` basis points.

Examples:

- `12` inches actual gives `12` inches manufacturing-effective thickness;
- `16` inches actual gives `15` inches manufacturing-effective thickness;
- `20` inches actual gives `18` inches manufacturing-effective thickness.

All authoritative calculations use micrometres. Example inch values are exact explanatory conversions.

## 20. Armor Technology and Quality

After the manufacturing rule:

`qualityAdjustedThickness = floor(manufacturingEffectiveThickness * armorQualityMultiplierBp / 10_000)`

The active armor technology MUST supply one explicit quality multiplier and armor-family identifier.

An armor family MAY define another excess-thickness policy only when it explicitly replaces `thick_armor_manufacturing_v1` and provides complete tests and versioning.

Technology MUST NOT allow actual thickness above the zone maximum unless a future design revision changes that maximum.

## 21. Impact Geometry

Impact-angle and obliquity effects MUST apply after manufacturing and quality adjustment.

Every penetration check MUST record:

- shell and gun definitions;
- impact velocity;
- impact zone;
- actual thickness;
- manufacturing-effective thickness;
- armor quality;
- armor slope;
- shell impact angle;
- normalized obliquity;
- obliquity formula;
- final effective resistance;
- shell penetration capability;
- penetration margin; and
- outcome.

Rounded UI values MUST NOT be used.

## 22. Splinter Protection Threshold

Armor protects against a qualifying splinter exactly when zone thickness is greater than or equal to `50_800` micrometres, equal to `2` inches, and the splinter's energy is within the zone's splinter-protection rating.

Armor below `2` inches does not receive the canonical qualifying-splinter immunity.

Equality at `2` inches is sufficient.

This rule does not guarantee protection against:

- direct shell impact;
- heavy shell fragments above the qualifying energy limit;
- blast transmitted through openings;
- unprotected boundaries;
- plunging fragments striking another zone; or
- spall generated from the protected plate itself.

## 23. Splinter Resolution

Every splinter event MUST contain:

- source shell or explosion;
- splinter energy class;
- impact zone;
- armor thickness and quality;
- protected-area coverage;
- opening and boundary checks;
- personnel and equipment exposure; and
- result.

The shipped splinter energy classes are:

- `LIGHT`;
- `MEDIUM`;
- `HEAVY`; and
- `EXTREME`.

The canonical `2`-inch threshold fully protects covered zones against `LIGHT` and `MEDIUM` qualifying splinters. `HEAVY` and `EXTREME` use their explicit penetration or spall formulas.

## 24. Armor-Penetration Outcomes

The canonical outcomes are:

- `NO_EFFECT`;
- `SPLINTER_EFFECT`;
- `PARTIAL_PENETRATION`;
- `FULL_PENETRATION`;
- `PASS_THROUGH`;
- `DUD`; and
- `CRITICAL_PENETRATION`.

Outcome eligibility MUST use penetration margin, shell fuzing, impact velocity, armor interaction, internal path, target structure, and hit location.

An outcome MUST be selected by an explicit deterministic predicate or keyed random decision. Narrative text MUST NOT select it.

## 25. Straddle State

A valid straddle exists when one salvo's canonical fall-of-shot pattern places at least one resolved shot short and one resolved shot long of the same target along the current range axis, with fire-control confidence at least `5_000` basis points.

A straddle record MUST contain target contact, salvo, range solution, observation source, minute, validity duration, and confidence.

The shipped validity duration is `5` tactical minutes.

Target change, loss of observation, course change above `30` degrees, or range change above `2_000` basis points invalidates the straddle unless fire-control technology explicitly preserves it.

## 26. Target Allocation

Automated target allocation MUST use integer utility terms for:

- threat;
- suitability;
- range;
- identification confidence;
- current engagement;
- overkill;
- objective relevance;
- ammunition conservation; and
- manual-order compatibility.

The shipped formula is:

`targetUtility = threat + suitability + range + identification + engagement + objective - overkill - ammunitionConservationPenalty`

Every component MUST lie within `-10_000..10_000`.

Candidates MUST be ordered by:

1. utility descending;
2. identification confidence descending;
3. range ascending;
4. contact identifier ascending.

Selection consumes no randomness unless a tactical AI policy explicitly chooses among equal legal utility through a keyed decision.

## 27. Manual Target Orders

Manual orders constrain target allocation only when permitted by the realism mode and command authority under `DESIGN-38`.

A manual target order MUST NOT:

- target an unidentified hidden asset;
- bypass range, firing arc, ammunition, reload, fire-control, visibility, damage, or crew rules;
- compel an allied battery without command authority;
- bypass overkill safety rules when friendly-fire risk becomes illegal; or
- alter the target's true state.

Invalid orders MUST fail with a specific reason code.

## 28. Ammunition State

Every battery MUST track exact ammunition count by type.

A salvo MUST reserve and consume ammunition atomically.

When required ammunition is unavailable, the battery MUST select another permitted ammunition type through its command or AI policy or fail with `GUNNERY_AMMUNITION_UNAVAILABLE`.

Autoloaders and dual-purpose systems MUST NOT create ammunition.

## 29. Damage Effects

Battery and mount damage MUST explicitly affect:

- operable barrel count;
- reload duration;
- training and elevation;
- fire-control connectivity;
- ammunition-feed state;
- autoloader availability;
- dual-purpose role eligibility;
- dispersion; and
- local-control capability.

A damaged autoloader MUST fall back to the mount's declared manual or conventional reload policy or become unavailable. No fallback may be inferred.

## 30. Gunnery Event Record

Every salvo, AA burst, penetration, splinter event, jam, role switch, and target change MUST create an immutable `GunneryEventRecord` containing:

- battle minute and substep;
- battery, shooter, and target contact identifiers;
- command source;
- fire mode;
- ammunition;
- accuracy and rate factors;
- random decisions;
- impact and armor inputs;
- outcome;
- damage event references;
- formula and ruleset versions; and
- event hash.

## 31. Canonical Ordering

Gunnery resolution MUST order:

1. tactical sides;
2. shooting ships by identifier;
3. batteries by battery identifier;
4. mounts by mount ordinal;
5. target contacts by contact identifier;
6. shots by salvo and barrel ordinal;
7. impact events by target, zone, and shot identifier; and
8. damage effects by declared effect ordinal.

Database insertion order, UI order, localized names, rendering order, and wall-clock time MUST NOT affect outcomes.

## 32. Required Reason Codes

The subsystem MUST define at least:

- `INVALID_GUNNERY_STATE`;
- `GUNNERY_ACCURACY_FACTOR_MISSING`;
- `GUNNERY_RATE_FACTOR_MISSING`;
- `GUN_QUALITY_OUT_OF_RANGE`;
- `AUTOLOADER_TECHNOLOGY_UNAVAILABLE`;
- `AUTOLOADER_MOUNT_INELIGIBLE`;
- `AUTOLOADER_FEED_JAMMED`;
- `DUAL_PURPOSE_GUN_CONTRACT_MISSING`;
- `DUAL_PURPOSE_ROLE_SWITCHING`;
- `DUAL_PURPOSE_AA_INELIGIBLE`;
- `ARMOR_ZONE_MAXIMUM_MISSING`;
- `ARMOR_THICKNESS_LIMIT_EXCEEDED`;
- `ARMOR_MANUFACTURING_POLICY_MISSING`;
- `SPLINTER_PROTECTION_NOT_QUALIFIED`;
- `GUNNERY_TARGET_ILLEGAL`;
- `GUNNERY_AMMUNITION_UNAVAILABLE`;
- `GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT`;
- `GUNNERY_STRADDLE_INVALID`; and
- `GUNNERY_STATE_INVARIANT_FAILED`.

## 33. Validation and Acceptance

Automated validation MUST prove that:

1. every battery has complete target, acquisition, range, solution, ammunition, fire-mode, reload, straddle, AA, and damage state;
2. accuracy uses all declared factors, exact integer arithmetic, and one final floor rounding;
3. reload uses integer tactical milliseconds and ceiling rounding;
4. gun quality remains within -3 through +2 and uses exact shipped multipliers;
5. autoloaders require technology, compatible mount, power, handling, access, ammunition, and valid design margins;
6. normal autoloader rate is exactly `11_000` basis points;
7. rapid post-straddle autoloader rate is exactly `13_000` basis points and replaces normal autoloader rate;
8. autoloader system mass is exactly `12_500` basis points of the equivalent mount mass;
9. autoloader AA burst and sustained rates use exact `13_000` and `11_500` multipliers only for AA-capable systems;
10. autoloader feed checks occur every ten shots with exact probability and outcome weights;
11. dual-purpose capability requires the complete gun, mount, handling, fire-control, and ammunition contract;
12. dual-purpose system mass is exactly `12_500` basis points of the surface-only equivalent;
13. dual-purpose surface and AA roles use separate exact predicates and formulas;
14. role switching takes exactly one tactical minute and one mount cannot serve both roles simultaneously under the shipped policy;
15. belt armor cannot exceed exactly 20 inches;
16. turret-face, barbette, and conning-tower armor cannot exceed exactly 26 inches;
17. equality at armor maxima remains legal;
18. armor through 12 inches receives full nominal manufacturing thickness;
19. armor above 12 inches receives exactly `7_500` basis points of marginal thickness effectiveness;
20. 16 inches produces exactly 15 inches and 20 inches exactly 18 inches of manufacturing-effective thickness;
21. armor quality and impact geometry apply after the manufacturing rule;
22. armor at exactly 2 inches qualifies for covered light and medium splinter protection;
23. armor below 2 inches does not receive canonical qualifying-splinter immunity;
24. splinter protection does not imply immunity to direct hits, heavy fragments, openings, or spall;
25. every penetration outcome uses explicit predicates or keyed decisions;
26. a straddle requires short and long shots around the same target and has exact validity and invalidation rules;
27. target allocation uses deterministic integer utility and tie-breaking;
28. manual targeting respects realism, authority, knowledge, range, arcs, ammunition, reload, visibility, and damage;
29. ammunition is reserved and consumed exactly;
30. damage explicitly controls barrel, reload, training, elevation, fire-control, feed, autoloader, and dual-purpose state;
31. every gunnery event records factors, decisions, impacts, outcomes, versions, and hashes; and
32. identical tactical state, commands, content, ruleset, contacts, and seeds produce identical salvos, hits, penetrations, jams, damage records, ledgers, and hashes.
