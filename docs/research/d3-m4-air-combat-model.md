# Research — D-3 M4 Air-Combat Resolution Model

> **Sprint:** D-3 / M4 (`@bluewave/combat`, CAP and strikes, `.scratch/d3-m4-cap-strikes`).
> **Purpose:** ground the air-to-air combat resolution formula — fighter vs fighter, CAP interception, escort engagement, bomber defense — within the existing integer-basis-point deterministic RNG engine pattern (gunnery DESIGN-39, torpedoes DESIGN-40).
> **Era:** 1880-1970 (scen_1880 primary), aviation era starts ~1915 for practical air-combat relevance.
> **Sources consulted:** historical board/computer wargame air-combat models, existing Bluewave combat formula patterns (`packages/combat/src/gunnery/`, `packages/combat/src/torpedoes/`), DESIGN-43 aircraft score system, DESIGN-44 carrier operations.

## 1. Question

What air-combat resolution formula(s) fit the Bluewave engine pattern for:

- CAP interception of incoming strikes (CAP fighters vs escort fighters vs bombers)
- Escort engagement (escort fighters screen bombers from CAP)
- Pure fighter-vs-fighter dogfight

DESIGN-43 defines four aircraft performance scores (speed, firepower, maneuverability, toughness; each 0-100 integer) and mission role eligibility, but provides **no air-combat formula**. The formula must:

- Use integer basis-point arithmetic (10_000 bp = 1.0x multiplier)
- Use keyed deterministic RNG streams (domain-separated, `@bluewave/random`)
- Floor-once rounding (no mid-product truncation)
- Produce either a basis-point kill probability per pass or a loss exchange ratio
- Work at the **squadron/formation level**, not per-aircraft dogfighting

## 2. Sources

### 2.1 Existing Bluewave combat formula patterns (verified, primary)

| File | Pattern | Relevance |
|---|---|---|
| `packages/combat/src/gunnery/accuracy.ts` | 17-factor basis-point product, bigint intermediate, floor-once, keyed RNG draw 0..9_999 vs finalAccuracyBp | The canonical pattern for any probability-based formula |
| `packages/combat/src/gunnery/constants.ts` | `BASIS_POINTS_PER_UNIT = 10_000`, factor manifest keys, `*_v1` policy, `SHIPPED_*_CONTRACT` + validate | Contract pattern to follow |
| `packages/combat/src/gunnery/resolve.ts` | `resolveOneBattery` — iterative per-unit resolution, consumes RNG per engagement event | Iteration pattern to follow |
| `packages/combat/src/gunnery/event.ts` | Immutable event record with `createEnvelope` hash, `gunneryEventId` pattern, `gunneryEventOrder` | Records pattern to follow |
| `packages/combat/src/torpedoes/hit-resolution.ts` | Multi-predicate resolution (section 14): each predicate evaluated sequentially, first-failure reject | Alternative: multi-stage engagement resolution |
| `packages/combat/src/torpedoes/constants.ts` | `NEUTRAL_TORPEDO_SOLUTION_MULTIPLIER_BP = 10_000`, band tables, BALANCE TARGET markers | Constant authored-value pattern |
| `packages/combat/src/torpedoes/launch-failure.ts` | `failureChanceBp = clamp(0, 10_000, baseBp + sum-of modifiers)` then per-tube draw < failureChanceBp | Closest pattern for a probability-per-pass formula |
| `packages/random/src/engine.ts` | `RandomEngine.stream(domainId)` -> `drawUniform(stream, min, max)` | Stream naming convention |

### 2.2 Historical wargame air-combat models (secondary, cross-game synthesis)

| Game | Year | Designer/Publisher | Air-Combat Model | Source |
|---|---|---|---|---|
| Flattop | 1977 | Battleline/AH | Fighter air-to-air factors (1-8), altitude/surprise modifiers, CRT ratio table. CAP intercepts strike before it reaches target. Escort reduces CAP effect on bombers. | BoardGameGeek; rulebook scans |
| Victory in the Pacific | 1977 | Richard Hamblen/AH | Single "airstrike factor" per air unit, CRT ratio table for combats; land-based air factors fixed per area | Wikipedia; Palmer (1980) The Best of Board Wargaming |
| Carrier | 1990 | Jon Southard/Victory Games | Solitaire: air combat tables per fighter type, CAP intercept table, detection/engagement sequence, AAA separate. Fighter factors for combat value. | Wikipedia; The General Vol.27 No.2 |
| Carriers at War | 1992 | SSG (Australia) | Squadron-level resolution: CAP intercept at range, escort engages CAP, bombers attacked. Aircraft quality + experience + numerical advantage -> CRT. Per 30-min pulse. | Game manual/analysis; MobyGames |
| Uncommon Valor / War in the Pacific | 2002/2004 | 2by3 Games / Matrix | Each aircraft has maneuver, durability, firepower, speed. Air combat resolved per squadron/pass. CAP at variable range, escort vs CAP first, then bombers. Experience heavily weighted. | Game manual; developer forum posts |

### 2.3 Academic / analytical sources (secondary)

- **Dunnigan, J.F. (1983). How to Make War. Quill.** — "fighter effectiveness = f(speed x maneuverability x firepower / pilot qualifier)" with numerical advantage modifier.
- **Epstein, J.M. (1985). The Calculus of Conventional War. Brookings.** — Lanchester-type air combat models: salvo equations for exchange ratios.

### 2.4 DESIGN documents (verified, primary)

- `docs/rules/aircraft.md` — DESIGN-43: scores 0-100 (speed, firepower, maneuverability, toughness), section 22 mission roles (CAP, ESCORT, INTERCEPTION), section 23 fighter eligibility predicates. Verified (read in full, 768 lines).
- `packages/combat/src/gunnery/constants.ts` — `BASIS_POINTS_PER_UNIT = 10_000` convention. Direct code read.

## 3. Findings

### 3.1 Common pattern across all surveyed wargames

Every surveyed wargame uses the **detection -> engagement -> outcome** sequence. Three archetypes:

| Level | Example games | What it models | Cost |
|---|---|---|---|
| **Strategic CRT** (Combat Results Table) | VITP, War at Sea | Air factor vs air factor on ratio table. One roll per unit. | Fastest; loses all per-type differentiation. |
| **Squadron-quality plus ratio** | Carrier, Carriers at War | Combat value from aircraft type + numerical ratio modifies CRT column. CAP intercepts before strike. | Good balance; four DESIGN-43 scores usable directly. |
| **Per-aircraft dogfight** | Uncommon Valor, Achtung Spitfire | Each flight resolved individually, multiple passes per minute, experience + quality + position. | Many RNG draws per minute; overkill for Bluewave. |

**Recommendation: Squadron-quality plus ratio** — one RNG draw per engagement per minute, maps directly to DESIGN-43 scores.

### 3.2 The core exchange model

From synthesis of Carrier (1990), Carriers at War (1992), and Uncommon Valor (2002):

1. **Combine aircraft scores into single combat index:**
   ```
   combatIndex = (speed + firepower + maneuverability) / 3
   ```
   Toughness is a **survival modifier** for the defending side, not an attack contributor. Matches the wargame convention that durable aircraft (Il-2, B-17) are harder to shoot down.

2. **Quality ratio:**
   ```
   qualityRatioBp = floor(attackerCombatIndex * 10_000 / max(1, defenderCombatIndex))
   ```
   Clamped to [0, 10_000].

3. **Numerical advantage:**
   ```
   numericalAdvantageBp = clamp(500, 10_000, floor(attackerCount * 10_000 / max(1, defenderCount)))
   ```
   500 bp floor prevents a single defender from being perfectly immune.

4. **Altitude/surprise modifiers:**
   ```
   altitudeAdvantageBp = 10_000 (neutral) / 12_500 (attacker above) / 8_500 (defender above)
   surpriseBp = 12_500 (first pass of CAP vs unaware strike) / 10_000 (subsequent passes)
   ```

5. **Composite kill probability per pass:**
   ```
   killProbabilityBp = floor(qualityRatioBp * numericalAdvantageBp * altitudeAdvantageBp * surpriseBp / 10_000^4)
   ```
   (4 factors in the simple formula; the final shipped formula uses 6 factors per section 4.1.)

6. **Resolution:**
   One keyed draw per engaging formation per minute:
   ```
   draw < killProbabilityBp -> defensive side suffers losses
   losses = floor(killProbabilityBp * defenderCount / 10_000)  // min 1 on kill
   ```
   Defender returns fire if both sides are fighters (simultaneous exchange). Bombers do NOT return fire.

### 3.3 Engagement order (CAP vs strike)

All surveyed games resolve in this strict order:

1. **CAP vs ESCORT** — CAP engages escort fighters first.
2. **CAP (remaining) vs STRIKE (bombers)** — CAP that surives/disengages now attaks bombers.
3. **trike attacks target** — surviving bombers proceed to bombing/torpedo run.
4. **Escort return engagement** — optional, deferred in many games.

Sources: Carrier (1990) rulebook; Carriers at War manual; Uncommon Valor developer notes.

**CAP allocation berween escorts and bombers:**
```
capToEscortBp = clamp(0, 10_000, floor(escortCount * 10_000 / max(1, escrtCount + capCount)))
capToBombersBp = 10_000 - capToEscortBp
```
If escorts are strong relative to CAP, most CAP is occupied. If CAP is strong, bombers face the full force. Matches istorical pattern: Midway (weak CAP -> few escorts needed) vs Marianas "Turkey Shoot" (strong CAP).

### 3.4 CAP interception timing

CAP intercepts strikes **efore** they reach the target during transit:

- CAP patrols active at start of each tactical minute (D-2 carrier operations)
- Incoming strike detected by B-2 spottng
- Interception resolves next tactical minte after detection (CAP reaction: 5 min per DESIGN-44 section 14)
- Engagement consumes 1-3 minutes

Interception time:
```
timeToInterceptMinutes = ceil(distanceM / max(1, interceptSpeedMps * 60))
interceptSpeedMps = max(0, capSpeedMps - strikeSpeedMps * cos(interceptAngle))
```

Speed score -> m/s mapping:
```
speedMps = round(speedScore * 2.5) + 20
```

| Speed score | Era example | Speed (m/s) |
|---|---|---|
| 20 | WWI fighter (~100 mph) | 45 m/s |
| 50 | Early WWII (~300 mph) | 134 m/s |
| 80 | Late WWII (~450 mph) | 200 m/s |
| 100 | Jet fighter (~600 mph) | 270 m/s |

BALANCE TARGET: linear interpolation, not per-model grounded.

### 3.5 CAP reduction of strike effectiveness

Two-axis reduction:

**Level 1: Attrition.** CAP kills a fraction of bombers before they reach target. Per the exchange formula (CAP as attacker, bombers as defender - no return fire).

**Level 2: Disruption.** Survivors have reduced bombing accuracy:
```
disruptionBp = max(5_000, 10_000 - floor(capEngagingAircraft * 1_000 / max(1, strikeAircraft)))
```
Strong CAP relative to strike -> disruption approahes 5_000 bp (50% effectiveness). Wea CAP -> minimal efect. This multiplier apples to the base bombing accuracy formula.

### 3.6 Toughness in the model

Toughness (0-100) is defense-only:

1. **Squadron disable threshold:**
   ```
   squadronDisableThreshold = floor(toughness * maxAircraft / 100)
   ```
2. **Survival bonus:**
   ```
   defenderSurvivalBp = floor(toughness * 1_000 / 100) + 9_000  // range 9_000-10_000
   ```

### 3.7 Basis-point constants table
| Constant | Shipped value | Range | Source |
|---|---|---|---|
| `AIR_COMBAT_BASIS_PER_UNIT` | 10_000 | fixed | Gunnery/torpedo precedent |
| `AIR_COMBAT_QUALITY_MIN_BP` | 0 | [0, 10_000] | Design |
| `AIR_COMBAT_QUALITY_MAX_BP` | 10_000 | [0, 10_000] | Design |
| `AIR_COMBAT_NUMERICAL_MIN_BP` | 500 | [500, 10_000] | Design; 500 bp floor |
| `AIR_COMBAT_NEUTRAL_MULTIPLIER_BP` | 10_000 | fixed | Gunnery precedent |
| `AIR_COMBAT_ALTITUDE_NEUTRAL_BP` | 10_000 | fixed | Neutral = no advantage |
| `AIR_COMBAT_ALTITUDE_ADVANTAGE_BP` | 12_500 | bp | Carrier game: theoretical bonus |
| `AIR_COMBAT_ALTITUDE_DISADVANTAGE_BP` | 8_500 | bp | Carrier game: at disadvantage |
| `AIR_COMBAT_SURPRISE_FIRST_PASS_BP` | 12_500 | bp | Uncommon Valor: first-pass bonus |
| `AIR_COMBAT_SURPRISE_SUBSEQUENT_BP` | 10_000 | bp | Neutral after first pass |
| `AIR_COMBAT_DISRUPTION_MIN_BP` | 5_000 | [5_000, 10_000] | Design: minimum 50% ceiling |
| `AIR_COMBAT_ENGAGEMENT_SUBSTEP` | 1 | tactical substep | Before gunnery (substep 2) |
| `AIR_COMBAT_SPEED_MPS_FACTOR` | 2.5 | linear slope | Speed score -> m/s |
| `AIR_COMBAT_SPEED_MPS_BASE` | 20 | m/s | Speed score -> m/s intercept |
| `AIR_COMBAT_ROUNDING` | "floor" | fixed | Gunnery precedent |
| `AIR_COMBAT_DESTROYED_DAMAGE_RATIO_BP` | 5_000 | [0, 10_000] | 50% destroyed / 50% damaged |
| `AIR_COMBAT_RULESET_VERSION` | `"air_combat_ruleset_v1"` | string | New version |
| `AIR_COMBAT_FORMULA_VERSION` | `"air_combat_formula_v1"` | string | New version |

### 3.8 RNG stream key naming

Following gunnery (`gunnery/accuracy/hit:{battleId}:{batteryId}:{minute}:{substep}`):

| Stream purpose | Key pattern |
|---|---|
| Air-to-air exchange (CAP vs fighter) | `air-combat/exchange:{battleId}:{minute}:{substep}:{attackerSquadronId}:{defenderSquadronId}` |
| Air-to-air exchange (CAP vs bomber) | `air-combat/exchange:{battleId}:{minute}:{substep}:{attackerSquadronId}:{defenderSquadronId}` |
| CAP interception detection | `air-combat/detection:{battleId}:{minute}:{capSquadronId}:{strikeId}` |

### 3.9 Loss recording

After each pass:
1. **Immediate loss**: aircraft destroyed -> removed from squadron operational count.
2. **Attrited**: aircraft damaged but returnable -> added to damaged count.
3. **Disrupted**: survived but disrupted for attack resolution.

Ratio: `AIR_COMBAT_DESTROYED_DAMAGE_RATIO_BP = 5_000` (50% destroyed, 50% damaged).

## 4. Recommendations

### 4.1 Recommended formula: squadron-quality exchange with 6 factors

```
AIR_COMBAT_EXCHANGE_FACTOR_KEYS = [
  "quality",           // attackerCombatIndex / defenderCombatIndex (quality ratio bp)
  "numericalAdvantage", // attackerCount / defenderCount (numerical advantage bp)
  "altitude",          // 10_000 neutral, 12_500 attacker height adv, 8_500 defender height adv
  "surprise",          // 12_500 first pass, 10_000 subsequent
  "defenderSurvival",  // f(toughness) -> 9_000 - 10_000 bp survival bonus
  "escort",            // 10_000 no escort present; lower = escort reduces CAP effect on bombers
] as const;
```

Six factors (versus gunnery's 16), matching the simpler domain.

**Formula (exact integer bp arithmetic, floor once at end):**
```
numerator: bigint = baseKillProbabilityBp (10_000) x PI factorBp_i
finalKillProbabilityBp = clamp(0, 10_000, floor(numerator / 10_000^6))
losses = floor(finalKillProbabilityBp * defenderCount / 10_000)  // min 1 on "kill"
```

### 4.2 Score mapping from DESIGN-43

| Score | Role | Mapping |
|---|---|---|
| `speed` (0-100) | Part of combatIndex | `comboIndex = floor((speed + firepower + maneuverability) / 3)` |
| `firepower` (0-100) | Part of combatIndex | Same composite |
| `maneuverability` (0-100) | Part of combatIndex | Weighted equally |
| `toughness` (0-100) | Survival bonus (defense only) | `defenderSurvivalBp = 9_000 + floor(toughness * 1_000 / 100)` -> range 9_000-10_000 |

Example: score-30 fighter (early-war average) has combatIndex=30, survivalBp=9_300. Score-80 fighter has combatIndex=80, survivalBp=9_800.

### 4.3 RNG stream naming
```
`air-combat/exchange:{battleId}:{minute}:{substep}:{attackerSquadronId}:{defenderSquadronId}`
```
- `AIR_COMBAT_ENGAGEMENT_SUBSTEP = 1` (runs before gunnery's substep 2)

### 4.4 CAP reduction of strike effectiveness

Two-axis:
1. **Attrition**: CAP kills bombers before target. Formula per 4.1 with bombers as defender (no return fire).
2. **Disruption**:
   ```
   disruptionBp = max(5_000, 10_000 - floor(capEngagingAircraft * 1_000 / max(1, strikeAircraft)))
   ```
   Example: CAP 12 vs strike 24 -> disruptionBp = 9_500 -> 5% accuracy reduction.

### 4.5 Contract integration
1. `air_combat_v1` policy (following `torpedo_v1`, `gunnery_v1`)
2. `SHIPPED_AIR_COMBAT_CONTRACT` with constants from section 3.7
3. `validateAirCombatContract` guard (fail-closed on drift)
4. Factor manifest `AIR_COMBAT_EXCHANGE_FACTOR_KEYS` (6 factors)
5. `AIR_COMBAT_RULESET_VERSION = "air_combat_ruleset_v1"`
6. `AIR_COMBAT_FORMULA_VERSION = "air_combat_formula_v1"`

### 4.6 BALANCE TARGETS

| Constant | Reason |
|---|---|
| `AIR_COMBAT_SPEED_MPS_FACTOR` (2.5) | Speed->m/s is linear interpolation, not per-model data |
| `AIR_COMBAT_DESTROYED_DAMAGE_RATIO_BP` (5_000) | 50/50 split authored; no exact source |
| `AIR_COMBAT_DISRUPTION_MIN_BP` (5_000) | Ceiling; from Carrier (1990) disruption table |
| `AIR_COMBAT_ALTITUDE_ADVANTAGE_BP` (12_500) | Advantae magnitude from Carrier |
| `AIR_COMBAT_SURPRISE_FIRST_PASS_BP` (12_500) | Surprise magnitude from Uncommon Valor ||

## 5. Deferred

| Item | Reason | Owner |
|---|---|---|
| Experience/fatigue modifiers | DESIGN-28 not integrated yet | D-3 follow-up |
| Per-aircraft dogfight micro | Out of scope per D-3 map.md | Deferred |
| AA / air defense | D-4 sprint | D-4 |
| Fuel endurance / wind / egress | No endurance model in D-1 | Future M4 |
| Multiple CAP passes per minute | One pass per minute in current model | Future M4 micro-update |

## 6. Source traceability

| Claim | Source | Verification |
|---|---|---|
| Gunnery accuracy pattern | `packages/combat/src/gunnery/accuracy.ts` lines 63-106 | Direct code read |
| RNG stream naming | `gunnery/accuracy.ts` lines 115-122; `engine.ts` lines 32-35 | Direct code read |
| DESIGN-43 scores 0-100 | `docs/rules/aircraft.md` section 2 | Direct read |
| CAP requires air-to-air armament | `docs/rules/aircraft.md` section 23 | Direct read |
| CAP reaction time 5 min | DESIGN-44 section 14 | D-2 research |
| Squadron-quality + ratio model | Carrier (1990), Carriers at War (1992), Uncommon Valor (2002) | Cross-game pattern |
| Engagement order CAP->Escort->Bomber | Carrier (1990) rulebook; Uncommon Valor | Secondary |
| Numerical advantage in air combat | VITP, Carrier, Flattop, Carriers at War, Uncommon Valor | Cross-game |
| Toughness as survival-only | D-1 research; Il-2/B-17 in all WWII games | Design principles |
| Disruption effect of CAP | Carrier (1990) disruption table | Secondary |
