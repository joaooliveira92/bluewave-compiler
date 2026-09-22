# ADR-0042: D-4 Air Defense — Layer Resolution & Eligibility + Engagement Decisions (INC-2/INC-3/INC-4)

## Status

Accepted (2026-09-22; INC-3 decisions 7–10 added 2026-09-22; INC-4 decisions 11–13 added
2026-09-22)

## Context

D-4 (Air Defense, DESIGN-45) INC-2 implements layer resolution (HEAVY_AA → MEDIUM_AA →
LIGHT_AA → CIWS_TERMINAL_DEFENSE, §1), the incoming-attack model (§4), and the
heavy/medium/light/CIWS eligibility predicates (§7, §8, §9, §18) as a pure deterministic
module in `@bluewave/combat/src/air-defense/`. INC-3 implements the engagement formula
(§19), disruption (§6), ammunition (§20), and damage/power (§21). Several decisions made
across INC-2/INC-3 need a recorded rationale to constrain future scope (INC-3..6), preserve
determinism, and avoid silent re-interpretation of canonical content.

## Decisions

### 1. Heavy-AA protected radius unit resolution

DESIGN-45 §7 states the permitted protected radius is `3..8` nautical miles and the
shipped value is exactly `5`. INC-1 shipped a provisional `PROTECTED_RADIUS = 5_000`
with the unit (m vs nm) explicitly deferred to INC-2. Resolved: the authoritative shipped
value is exactly **5 nautical miles = 9_260 m** (`5 × 1_852`), encoded as
`NAUTICAL_MILE_M = 1_852`, `HEAVY_AA_PROTECTED_RADIUS_NM = 5`,
`HEAVY_AA_PROTECTED_RADIUS_M = 9_260`. The provisional `PROTECTED_RADIUS` constant had no
consumers and no pinned test; it is removed. The radius boundary is inclusive (a protected
ship at exactly 9_260 m is engageable; beyond it, `HEAVY_AA_PROTECTED_RADIUS_EXCEEDED`).

### 2. `arcDegreesMax` system-definition field (arc predicate)

Spec §1.1 item 4 lists "range/altitude/speed/arc/director/radar/ammunition/power"
predicates for heavy AA. The INC-1 `AirDefenseSystemDefinition` carried no arc field, so
INC-2 adds `arcDegreesMax: SafeInt` (0..360, default 360 = full coverage) to the
definition, validated fail-closed, and included in `computeAirDefenseStateHash`. The arc
predicate is `attack.bearingDegrees <= arcDegreesMax`. This is an additive, backward-
compatible schema change: all INC-1 construction fixtures use the 360 default. Because the
state-hash body changed, the INC-1 air-defense state hash is superseded; the air-defense
state hashes are **provisional** (the module is not wired into any persisted engine state —
that is INC-6), so no golden/authoritative hash changes. The model-version bump
(`air_defense_v1`) is deferred to INC-6 persistence wiring, per ENGINEERING-CONTRACT
§Persistance/Compatibility.

### 3. `INVALID_AIR_DEFENSE_ATTACK` boundary code (documented superset)

DESIGN-45 §28 requires "at least" 20 shipped reason codes — a minimum set, not a closed
one. `AirDefenseAttack` validation failures use a 21st code `INVALID_AIR_DEFENSE_ATTACK`
(defined in `reasonCodes.ts`), which is not among the §28 codes. This is canonical-legal
because §28 is a minimum. Consequence for INC-5: the `reason-codes-rollup.test.ts`
set-equality guard must assert **presence** of the 20 §28 codes and treat
`INVALID_AIR_DEFENSE_ATTACK` (and the two INC-1 `INVALID_AIR_DEFENSE_*` codes already in
§28) as a documented boundary-code superset, not an exact-20 equality.

### 4. `ANTI_RADIATION_WEAPON` → GUIDED light-AA profile

DESIGN-45 §9 ships a 1-minute window for "aircraft-delivered guided weapon" and does not
explicitly name `ANTI_RADIATION_WEAPON`; §18 line 316 covers "guided or missile attack
aircraft" pre-release. INC-2 maps `ANTI_RADIATION_WEAPON` onto the GUIDED light-AA profile
(60_000 ms window) by that inference. The behavior is gated by `systemMayEngageAttack`
(the system must explicitly list the attack type), so no shipped behavior can change
silently.

### 5. §18 eligibility matrix encoding for the four AA layers

`LAYER_ATTACK_ELIGIBILITY_MATRIX` encodes DESIGN-45 §18 restricted to the four AA layers
(CAP + SAM deferred to the E-track). Encoding decisions:

- **HEAVY_AA** engages level bombing, rockets, guided/missile aircraft pre-release, and
  light ASM (explicitly capable per §18 line 313). Dive/skip/torpedo are deliberately
  absent (§18 line 315 sends them to medium AA/light AA/CIWS).
- **MEDIUM_AA** engages level, dive, skip, torpedo, rocket, and guided pre-release.
  `LIGHT_ASM` is deliberately excluded: §18 line 313 lists light-ASM layers as
  CAP/MEDIUM_SAM/LIGHT_SAM/HEAVY_AA/LIGHT_AA/CIWS only, and §18 line 318 forbids a layer
  absent from the explicit eligibility set.
- **LIGHT_AA** additionally lists `MEDIUM_ASM`/`HEAVY_ASM` because §9 requires an
  explicit system listing for them (the matrix authorizes the layer; the system must list
  the type).
- **CIWS_TERMINAL_DEFENSE** covers the conventional + guided classes plus compatible
  terminal defense of medium ASM and explicitly capable heavy ASM.

`SPECIAL_EXPLICIT_ATTACK` is never in a matrix; it may only be engaged through an explicit
system `profileEligibility` listing. The effective gate is
`layerAllowsAttackType(layer, type) && system.profileEligibility.has(type)` — the matrix
authorizes the layer class; the system definition authorizes the specific weapon.

### 6. INC-2 eligibility scope boundary

INC-2 is eligibility/layer-gating only. Attack survival ("a surviving attack proceeds to
the next eligible layer", §1 line 20), post-release medium-AA modeling, and all engagement
outcomes (kill/damage/abort/disruption) are INC-3. CIWS nearby-ship protection (§25) is
deferred. `BattleResolver`/`StrengthCalculator` remain unmodified.

### 7. Disruption stacking: one integer bp factor, rounded once at the stacking boundary

DESIGN-45 §6 line 125: different defense layers "multiply in canonical layer order and
round once at final attack resolution". INC-3 interprets this as: per-layer disruption is
reduced to the single highest-severity representative; the per-metric multipliers are
multiplied across layers as a bigint product and floored ONCE at the stacking boundary,
producing ONE integer bp factor per metric (accuracy, cohesion) in [0, 10_000]. That factor
is then consumed by the final attack-resolution formula as a single factor in ITS single
final floor — there is no second rounding in the air-defense module. The invented clamp
(proposed in an early review) is rejected: an out-of-[0, 10_000] floored factor is an
invariant violation and fails closed with `AIR_DEFENSE_INVARIANT_FAILED`. A duplicate layer
representative is likewise rejected fail-closed.

### 8. `resolveEngagement`: ammunition and damage factors are state-authoritative

The pure per-engagement entry point (`engagement.ts`, INC-3) derives the ammunition factor
(§20: empty contributes zero) AND the damage factor (`effectiveDamageMultiplierBp(state.
damageBp, state.powerBp)`, §21: DESTROYED/unpowered contributes zero) from the authoritative
`AirDefenseState`, overriding any caller-supplied value — a canonical invariant that must
not be bypassable by the caller. The remaining six multiplier factors (director, radar,
crew, targetProfile, weather, saturation) are caller-supplied; INC-4 computes
director/radar/saturation.

### 9. Magazine seeding at state construction

`createAirDefenseState` seeds `ammunitionByType` from each system's `magazineCapacity`
(§20 "magazine or ready-service capacity"; §29.21 "magazines are explicit and
authoritative"), so every engagement drains an explicit reserve by default (§20 line 334:
"Every engagement MUST reserve and consume exact ammunition"). `consumeAmmunition` fails
closed on an insufficient explicit reserve. The absent-entry "present supply" behavior in
the ammunition module is a documented opt-in for direct-constructed states only.

### 10. Engagement factor bound

`computeEffectiveDefenseBp` enforced every factor ≤ `MAX_ENGAGEMENT_FACTOR_BP = 31_000`
(the shipped §12 director maximum) at the boundary, so the documented numerator bound
(≤ 31_000 × 10_000^8 ≈ 3.1e37) holds by construction and `Number(rawFloored)` can never
lose precision; a defensive `rawFloored > Number.MAX_SAFE_INTEGER` throw is also included.
**Superseded by decision 13** for the SATURATION-class slots only (INC-4).

### 11. §19 slot mapping for the six caller-supplied multipliers

In the INC-3 `computeEffectiveDefenseBp` nine-factor product
`base × director × radar × crew × damage × ammunition × targetProfile × weather ×
saturation / 10_000^8`, the three multipliers INC-4 computes are canonically bound as:
`directorBp` ← `computeDirectorFactorBp(operationalDirectorCount)` (§12), `radarBp` ←
`computeRadarFactorBp(radarDirectedGroupCount)` (§14), and `saturationBp` ←
`computeCiwsSaturationFactorBp(contributingCiwsSystemCount)` (§16). crew/damage/ammunition
remain INC-3 computed from the authoritative state (decision 8); targetProfile and weather
are neutral-or-later concerns (INC-5/6). The engine call site that composes these into
`resolveEngagement` is wired in INC-6.

### 12. "Threat score descending" (§11.2) is realized by the §17 comparator

DESIGN-45 defines no threat-score formula; the only canonical threat ordering in the
document is §17 Simultaneous Threats. INC-4 therefore implements "threat score descending"
(`"higher = assigned first"`) as a deterministic comparator `compareThreatPriority` over
`AirDefenseAttack` fields, keyed in order: (1) released threats before pre-release (§17.1),
(2) closer to impact first (§17 line "closest to impact", §17.6 — smaller `timeToImpactMs`),
(3) threats against the defended ship before protected nearby ships (§17.3-4 —
`targetId === defenderId`), (4) expected-damage proxy descending (§17.5 — larger
`formationSize`; the attack's declared deterministic fields, no RNG), (5) target identifier
ascending (§17.7). No additional threat-score formula is invented; the comparator IS the
resolved threat score. In `compareCandidates` a deterministic codepoint residue (systemId,
then attackId) guarantees a TOTAL order so input array order can never leak into results
(§27 line 453).

### 13. Zero-count consumer-side neutrals + two-class factor bound (superseding decision 10)

§14/§16 define diminishing-return schedules only for group/system counts ≥ 1. A defended
ship with NO radar-directed medium-AA group or NO contributing CIWS system retains the
consumer-side NEUTRAL factor **10_000** for that slot (`RADAR_NEUTRAL_FACTOR_BP` /
`CIWS_NEUTRAL_FACTOR_BP`) — the same neutral as an absent multiplier in the engagement
formula, not a §14/§16 value. INC-4 also repairs decision 10 into a TWO-CLASS bound: the
NORMAL-class slots (base, director, crew, damage, ammunition, targetProfile, weather) stay
enforced ≤ `MAX_ENGAGEMENT_FACTOR_BP = 31_000`; the SATURATION-class slots (radar §14,
saturation §16) carry the UNDIVIDED marginal sums over the ship's actual radar-directed
group / contributing CIWS system count (each marginal ≤ 10_000; 4 groups/systems →
40_000 = the exact rational aggregated count kept in the numerator, > 31_000) and are
admitted up to `Number.MAX_SAFE_INTEGER` WITHOUT the 31_000 limit — their structural bound
(sum over the caller-fed actual aggregates; each marginal ≤ 10_000) lives at the caller
(INC-5/6). Rationale: a §14 effective-group count of 4.0 (40_000 bp) is a legitimate §19
factor and must not be rejected by a cap sized to the largest single shipped value.
Consequence: with both SATURATION slots at legal-boundary values the floored result can
reach ~2.2e31 (> `Number.MAX_SAFE_INTEGER`), so the defensive throw IS reachable by
pathological-but-legal aggregate inputs and fires fail-closed; realistic ship-scale inputs
(floored ≤ ~1.5e6) never trip it.

## Consequences

- The `arcDegreesMax` field becomes part of the shipped `AirDefenseSystemDefinition`
  schema and the state hash; INC-5's contract rollup (`air_defense_v1`) must include it.
- INC-5's reason-codes guard is presence-of-20, not exact-20.
- INC-5's `air_defense_v1` contract must also include the INC-3 fields
  (`roundsPerEngagement`, `magazineCapacity`, `localControlSupported`), the engagement/
  disruption/ammunition/damage shapes, the INC-4 director/radar/CIWS scaling shapes
  (`DIRECTOR_SCALING_TABLE`, `RADAR_SATURATION_TABLE`, `CIWS_REDUNDANCY_TABLE` +
  `assignAADirectors`/`computeDirectorFactorBp`/`computeRadarFactorBp`/
  `computeCiwsSaturationFactorBp`), the two-class factor-bound policy (decision 13), and the
  formalized `draw`/`consumedRounds` result semantics (decisions 8-9).
- INC-5/6 must feed the SATURATION-class slots only the actual aggregate sums (per decision
  13); the §19 boundary itself admits any non-negative safe integer for those slots.
- No golden-hash or authoritative content change (module unwired; INC-6 wiring will not
  alter hashes while strictly a no-op when no AA context is present).
- Future SAM-layer integration (E-track) will extend the matrix with
  HEAVY_SAM/MEDIUM_SAM/LIGHT_SAM rows.

## Related

- ADR-0007 (golden hash regeneration process)
- ADR-0020/0021/0022 (B-3/B-4/B-5 scope/integration boundaries)
- ADR-0031/0033/0039/0040 (C-track scope/integration boundaries)
- ADR-0041 (D-2 carrier operations scope/integration boundary)