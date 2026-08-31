// packages/combat/src/air-defense/engagement.ts
// D-4 M4 Aviation: Air Defense — Engagement resolution (INC-3)
// AC-11: 9-factor effectiveDefenseBp with bigint floor-once (§19)
// AC-12: Disruption severity levels + stacking + mutually exclusive outcome table (§5, §6)
// AC-13: Ammunition consumption + empty system → zero contribution (§20)
// AC-14: Simplified damage/power state + local control multiplier (§21)
//
// This module is PURE and deterministic. No ambient I/O, no RNG calls,
// no mutation of passed state. Random outcomes use a supplied `randomBp`
// draw parameter in [0, 10_000).

import { BluewaveError, SafeInt } from "@bluewave/contracts";
import type { AirDefenseSystemDefinition, LayerId } from "./air-defense-system-definition.js";
import type { DisruptionSeverityType } from "./air-defense-state.js";
import {
  ENGAGEMENT_FORMULA_DENOMINATOR,
  ENGAGEMENT_FORMULA_SCALE_EXPONENT,
  FORMULA_DENOMINATOR,
  DISRUPTION_SEVERITY_MAP,
  DISRUPTION_SEVERITY_ORDINAL,
} from "./constants.js";
import {
  AIR_DEFENSE_AMMUNITION_UNAVAILABLE,
  INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
} from "./reason-codes.js";

// ============================================================================
// AC-11: Engagement formula — 9-factor product with bigint floor-once
// ============================================================================

/**
 * All 9 multiplier inputs for the §19 engagement formula.
 * Every value is a SafeInt basis point (0..≥0, neutral = 10_000).
 *
 * Factor sources:
 *   baseDefenseBp       — system definition (§3: kill/damage/abort/disruption base)
 *   directorMultiplierBp — §12 director scaling table (5_000 / 10_000 / 18_000 / 25_000 / 31_000)
 *   radarMultiplierBp   — §13/§14 radar availability/saturation (neutral 10_000 unless specified)
 *   crewMultiplierBp    — crew quality (neutral 10_000; no shipped AA-specific table — see ADR)
 *   damageMultiplierBp  — §21 overall component damage effect (derived from AirDamageComponentStatus)
 *   ammunitionMultiplierBp — §20 ammunition availability (0 if empty, 10_000 if full)
 *   targetProfileMultiplierBp — target profile fit (neutral 10_000; no shipped AA table — see ADR)
 *   weatherMultiplierBp — weather effects (neutral 10_000; no shipped AA table — see ADR)
 *   saturationMultiplierBp — §14/§16/§17 saturation effect (neutral 10_000 unless specified)
 */
export interface EngagementFactorInputs {
  readonly baseDefenseBp: SafeInt;
  readonly directorMultiplierBp: SafeInt;
  readonly radarMultiplierBp: SafeInt;
  readonly crewMultiplierBp: SafeInt;
  readonly damageMultiplierBp: SafeInt;
  readonly ammunitionMultiplierBp: SafeInt;
  readonly targetProfileMultiplierBp: SafeInt;
  readonly weatherMultiplierBp: SafeInt;
  readonly saturationMultiplierBp: SafeInt;
}

/** Detailed breakdown of the bigint floor-once computation for traceability. */
export interface EngagementFormulaDetail {
  /** Exact rational numerator as a decimal string (bigint). */
  readonly numerator: string;
  /** Exact denominator (10_000^8) as a decimal string. */
  readonly denominator: string;
  /** Rounding mode: always "floor". */
  readonly mode: string;
  /** Scale exponent (8). */
  readonly scaleExponent: number;
  /** Raw floored value before clamping. */
  readonly rawFlooredBp: number;
}

/** Result of the engagement formula. */
export interface EffectiveDefenseResult {
  /** Final effective defense basis points, clamped to [0, MAX_SAFE_INTEGER]. */
  readonly effectiveDefenseBp: SafeInt;
  /** Factor contributions for traceability. */
  readonly factorContributions: Record<string, SafeInt>;
  /** Rounding detail (bigint intermediate). */
  readonly rounding: EngagementFormulaDetail;
}

/**
 * AC-11: Computes effectiveDefenseBp using the §19 9-factor product with
 * bigint floor-once rounding.
 *
 * Formula: floor(baseDefenseBp × director × radar × crew × damage ×
 *   ammunition × targetProfile × weather × saturation / 10_000^8)
 *
 * The exact rational result is rounded ONCE with FLOOR. No intermediate
 * rounding. BigInt is used because the numerator can reach ~10^40, far
 * above Number.MAX_SAFE_INTEGER (~9.0×10^15).
 *
 * @param inputs — 9 SafeInt basis-point factors (§19).
 * @returns EffectiveDefenseResult with floored bp and traceability detail.
 */
export function computeEffectiveDefenseBp(inputs: EngagementFactorInputs): EffectiveDefenseResult {
  // Validate all inputs are non-negative safe integers
  const factorKeys: Array<keyof EngagementFactorInputs> = [
    "baseDefenseBp",
    "directorMultiplierBp",
    "radarMultiplierBp",
    "crewMultiplierBp",
    "damageMultiplierBp",
    "ammunitionMultiplierBp",
    "targetProfileMultiplierBp",
    "weatherMultiplierBp",
    "saturationMultiplierBp",
  ];

  for (const key of factorKeys) {
    const val = inputs[key];
    if (!SafeInt.isSafeInt(val) || val < 0) {
      throw new BluewaveError(
        `computeEffectiveDefenseBp: ${key} must be a non-negative safe integer`,
        { code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION, factorKey: key, value: val },
      );
    }
  }

  // ---- BigInt numerator: multiply all 9 factors ----
  // Bound analysis: worst case 9 factors each ≤ 10_000 → numerator ≤ 10_000^9 = 10^36.
  // 10^36 < BigInt safe range. BigInt intermediate is REQUIRED (ENGINEERING-CONTRACT §5).
  let numerator: bigint = BigInt(inputs.baseDefenseBp);
  numerator *= BigInt(inputs.directorMultiplierBp);
  numerator *= BigInt(inputs.radarMultiplierBp);
  numerator *= BigInt(inputs.crewMultiplierBp);
  numerator *= BigInt(inputs.damageMultiplierBp);
  numerator *= BigInt(inputs.ammunitionMultiplierBp);
  numerator *= BigInt(inputs.targetProfileMultiplierBp);
  numerator *= BigInt(inputs.weatherMultiplierBp);
  numerator *= BigInt(inputs.saturationMultiplierBp);

  // ---- BigInt integer division floors for non-negative values ----
  const rawFloored: bigint = numerator / ENGAGEMENT_FORMULA_DENOMINATOR;
  const rawFlooredBp: number = Number(rawFloored);

  // Clamp to safe range (should always be ≤ 10_000 for reasonable inputs)
  const effectiveDefenseBp = SafeInt(Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, rawFlooredBp)));

  return {
    effectiveDefenseBp,
    factorContributions: { ...inputs },
    rounding: {
      mode: "floor",
      numerator: numerator.toString(),
      denominator: ENGAGEMENT_FORMULA_DENOMINATOR.toString(),
      scaleExponent: ENGAGEMENT_FORMULA_SCALE_EXPONENT,
      rawFlooredBp,
    },
  };
}

/**
 * Neutral factor set: all 8 multiplier factors = 10_000 (identity).
 * Returns effectiveDefenseBp = baseDefenseBp when all factors are neutral.
 */
export function neutralEngagementFactors(baseDefenseBp: SafeInt): EngagementFactorInputs {
  const neutral = SafeInt(10_000);
  return {
    baseDefenseBp,
    directorMultiplierBp: neutral,
    radarMultiplierBp: neutral,
    crewMultiplierBp: neutral,
    damageMultiplierBp: neutral,
    ammunitionMultiplierBp: neutral,
    targetProfileMultiplierBp: neutral,
    weatherMultiplierBp: neutral,
    saturationMultiplierBp: neutral,
  };
}

// ============================================================================
// AC-12: Disruption model — severity levels, stacking, outcome table
// ============================================================================

/** Disruption severity-to-multiplier mapping per §6 lines 118-123. */
export interface DisruptionSeverityMultipliers {
  readonly accuracyMultiplierBp: number;
  readonly cohesionMultiplierBp: number;
}

/**
 * Returns the shipped disruption multipliers for a given severity level (§6).
 * MISSION_ABORT returns { accuracyMultiplierBp: 0, cohesionMultiplierBp: 0 }
 * because the attack does not proceed.
 */
export function disruptionSeverityMultipliers(
  severity: DisruptionSeverityType,
): DisruptionSeverityMultipliers {
  const entry = DISRUPTION_SEVERITY_MAP[severity];
  if (entry === undefined) {
    throw new BluewaveError(`disruptionSeverityMultipliers: unknown severity "${severity}"`, {
      code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
      severity,
    });
  }
  return { ...entry };
}

/**
 * Maps a disruption basis-point value to a severity level (§6).
 * Thresholds derived from the shipped disruption bp values:
 *   ≥ 15_000 → MISSION_ABORT (disruptionBp exceeds base + stacking)
 *   ≥ 8_000 → SEVERE
 *   ≥ 3_000 → MODERATE
 *   > 0 → LIGHT
 *   0 → no disruption
 *
 * NOTE: These thresholds are a documented deterministic mapping.
 * The shipped disruption bp values for LIGHT/MODERATE/SEVERE are 3/8/15
 * from BASE_DEFENSE_VALUES (§3). A disruption check that passes yields a
 * disruption record; the severity is determined by comparing the disruption
 * bp against these thresholds.
 */
export function determineDisruptionSeverity(disruptionBp: number): DisruptionSeverityType | null {
  if (disruptionBp <= 0) return null;
  if (disruptionBp >= 15_000) return "MISSION_ABORT";
  if (disruptionBp >= 8_000) return "SEVERE";
  if (disruptionBp >= 3_000) return "MODERATE";
  return "LIGHT";
}

/**
 * AC-12 stacking rule (§6 line 125): "For several disruption records,
 * only the highest severity from one defense layer applies."
 *
 * Returns the highest-severity record from a set of records in a single layer.
 * If multiple records share the highest severity, the first encountered is returned.
 */
export function highestSeverityInLayer<
  T extends { severity: DisruptionSeverityType; layer: LayerId },
>(records: ReadonlyArray<T>, layer: LayerId): T | null {
  let best: T | null = null;
  let bestOrdinal = -1;
  for (const rec of records) {
    if (rec.layer !== layer) continue;
    const ordinal = DISRUPTION_SEVERITY_ORDINAL[rec.severity] ?? 0;
    if (ordinal > bestOrdinal) {
      bestOrdinal = ordinal;
      best = rec;
    }
  }
  return best;
}

/**
 * AC-12 cross-layer stacking (§6 line 125): "Different defense layers
 * multiply in canonical layer order and round once at final attack resolution."
 *
 * Combines disruption multipliers from different layers multiplicatively.
 * Returns the combined accuracy and cohesion multipliers after applying
 * all layers' best severities in canonical order.
 */
export interface CombinedDisruptionMultipliers {
  readonly accuracyMultiplierBp: SafeInt;
  readonly cohesionMultiplierBp: SafeInt;
}

/**
 * Combines disruption effects from multiple layers.
 * Each layer contributes its highest-severity multiplier. Layers compose
 * multiplicatively; the final product is floored once with bigint.
 *
 * @param layerSeverities — map of layer → highest severity in that layer (or null).
 * @returns Combined accuracy and cohesion multipliers in bp.
 */
export function combineCrossLayerDisruption(
  layerSeverities: ReadonlyMap<LayerId, DisruptionSeverityType | null>,
): CombinedDisruptionMultipliers {
  // Start with neutral (10_000 bp = 1.0)
  let accuracyProduct = 10_000n;
  let cohesionProduct = 10_000n;

  let disruptedLayerCount = 0;
  for (const [, severity] of layerSeverities) {
    if (severity === null) continue;
    const mults = DISRUPTION_SEVERITY_MAP[severity];
    if (mults === undefined) continue;
    accuracyProduct *= BigInt(mults.accuracyMultiplierBp);
    cohesionProduct *= BigInt(mults.cohesionMultiplierBp);
    disruptedLayerCount++;
  }

  if (disruptedLayerCount === 0) {
    return {
      accuracyMultiplierBp: SafeInt(10_000),
      cohesionMultiplierBp: SafeInt(10_000),
    };
  }

  const denominator = BigInt(FORMULA_DENOMINATOR) ** BigInt(disruptedLayerCount);

  // bigint division floors for non-negative values
  const accuracyFloored = Number(accuracyProduct / denominator);
  const cohesionFloored = Number(cohesionProduct / denominator);

  return {
    accuracyMultiplierBp: SafeInt(Math.max(0, accuracyFloored)),
    cohesionMultiplierBp: SafeInt(Math.max(0, cohesionFloored)),
  };
}

// ---- §5 Mutually exclusive outcome table (AC-12) ----

/** Primary engagement outcome per §5 lines 86-104. */
export type EngagementOutcome = "KILL" | "DAMAGE" | "ABORT" | "DISRUPTION" | "NO_EFFECT";

/**
 * Effective defense bp values for each outcome type.
 * These are the computed effectiveDefenseBp values for each base outcome
 * (kill, damage, abort, disruption), each multiplied by the full 9-factor
 * formula. The outcome is determined by a single draw in [0, 10_000).
 */
export interface EngagementOutcomeThresholds {
  /** Effective kill probability in bp (from baseKillBp × 9 factors). */
  readonly killBp: number;
  /** Effective damage probability in bp. */
  readonly damageBp: number;
  /** Effective abort probability in bp. */
  readonly abortBp: number;
  /** Effective disruption probability in bp. */
  readonly disruptionBp: number;
}

/**
 * AC-12: Mutually exclusive outcome table per §5/§19.
 *
 * A single draw in [0, 10_000) maps to exactly one outcome:
 *   [0, killBp) → KILL
 *   [killBp, killBp + damageBp) → DAMAGE
 *   [killBp + damageBp, killBp + damageBp + abortBp) → ABORT
 *   [killBp + damageBp + abortBp, killBp + damageBp + abortBp + disruptionBp) → DISRUPTION
 *   [sum, 10_000) → NO_EFFECT
 *
 * §19 lines 328-330: "The same engagement MUST NOT count one random draw as
 * both physical kill and disruption unless its outcome table explicitly combines
 * them." This table ensures exactly one outcome per draw.
 *
 * @param thresholds — effective bp for each outcome type.
 * @param randomBp — a single draw in [0, 10_000). Must be a non-negative integer.
 * @returns Exactly one EngagementOutcome.
 */
export function resolveEngagementOutcome(
  thresholds: EngagementOutcomeThresholds,
  randomBp: number,
): EngagementOutcome {
  if (!Number.isInteger(randomBp) || randomBp < 0 || randomBp >= FORMULA_DENOMINATOR) {
    throw new BluewaveError(
      `resolveEngagementOutcome: randomBp must be an integer in [0, ${FORMULA_DENOMINATOR})`,
      { code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION, randomBp },
    );
  }

  const cumulative =
    thresholds.killBp + thresholds.damageBp + thresholds.abortBp + thresholds.disruptionBp;

  // Total probability must not exceed 10_000 (100%)
  if (cumulative > FORMULA_DENOMINATOR) {
    throw new BluewaveError(
      "resolveEngagementOutcome: cumulative outcome thresholds exceed 10_000 bp",
      { code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION, cumulative, thresholds },
    );
  }

  let cursor = 0;

  cursor += thresholds.killBp;
  if (randomBp < cursor) return "KILL";

  cursor += thresholds.damageBp;
  if (randomBp < cursor) return "DAMAGE";

  cursor += thresholds.abortBp;
  if (randomBp < cursor) return "ABORT";

  cursor += thresholds.disruptionBp;
  if (randomBp < cursor) return "DISRUPTION";

  return "NO_EFFECT";
}

// ============================================================================
// AC-13: Ammunition consumption
// ============================================================================

/**
 * Computes the ammunition multiplier (§20).
 * An empty system contributes zero: ammunitionMultiplierBp = 0 when rounds ≤ 0.
 * A full/available system contributes neutral 10_000 bp.
 *
 * §20 line 346: "An empty system contributes zero. A defensive opportunity
 * does not create ammunition."
 */
export function computeAmmunitionMultiplierBp(roundsRemaining: number): SafeInt {
  if (!Number.isInteger(roundsRemaining) || roundsRemaining < 0) {
    throw new BluewaveError(
      "computeAmmunitionMultiplierBp: roundsRemaining must be a non-negative integer",
      { code: AIR_DEFENSE_AMMUNITION_UNAVAILABLE, roundsRemaining },
    );
  }
  return SafeInt(roundsRemaining > 0 ? 10_000 : 0);
}

/**
 * Result of ammunition consumption.
 */
export interface AmmunitionConsumptionResult {
  /** New ammunition state after consumption. */
  readonly newAmmunitionByType: ReadonlyMap<string, SafeInt>;
  /** Whether the system had sufficient ammunition. */
  readonly sufficient: boolean;
  /** Rounds consumed (0 if insufficient). */
  readonly roundsConsumed: SafeInt;
}

/**
 * AC-13: Reserves and consumes exact ammunition per engagement (§20).
 *
 * §20 lines 332-346: "Every engagement MUST reserve and consume exact
 * ammunition." Each system declares rounds per engagement. The function
 * decrements from ready/magazine capacity.
 *
 * This function is IMMUTABLE — it returns a new map, never mutating the input.
 *
 * @param ammunitionByType — current ammunition state (systemId → rounds).
 * @param systemId — the engaging system.
 * @param roundsPerEngagement — exact rounds to consume.
 * @returns New ammunition state + consumption details.
 */
export function consumeAmmunition(
  ammunitionByType: ReadonlyMap<string, SafeInt>,
  systemId: string,
  roundsPerEngagement: SafeInt,
): AmmunitionConsumptionResult {
  if (!SafeInt.isSafeInt(roundsPerEngagement) || roundsPerEngagement < 0) {
    throw new BluewaveError(
      "consumeAmmunition: roundsPerEngagement must be a non-negative safe integer",
      { code: AIR_DEFENSE_AMMUNITION_UNAVAILABLE, roundsPerEngagement },
    );
  }

  const currentRounds = ammunitionByType.get(systemId);
  const available = currentRounds !== undefined ? Number(currentRounds) : 0;

  if (available < Number(roundsPerEngagement)) {
    // Insufficient ammunition — do not consume, return new map unchanged
    return {
      newAmmunitionByType: ammunitionByType,
      sufficient: false,
      roundsConsumed: SafeInt(0),
    };
  }

  // Decrement exact rounds
  const newRounds = SafeInt(available - Number(roundsPerEngagement));
  const newMap = new Map(ammunitionByType);
  newMap.set(systemId, newRounds);

  return {
    newAmmunitionByType: newMap,
    sufficient: true,
    roundsConsumed: roundsPerEngagement,
  };
}

// ============================================================================
// AC-14: Simplified damage/power state + local control multiplier
// ============================================================================

/**
 * AC-14: Simplified component damage state per §21.
 * Damage MUST independently affect 8 channels:
 *   weapon mount/launcher, director, radar/local sensor, electrical power,
 *   data/communication path, ammunition feed, stabilization, engagement channels.
 *
 * Each channel is independently tracked as operational (true) or destroyed (false).
 */
export interface AirDamageComponentStatus {
  /** Weapon mount or launcher operational. */
  readonly weaponMount: boolean;
  /** Fire-control director operational. */
  readonly director: boolean;
  /** Radar or local sensor operational. */
  readonly radar: boolean;
  /** Electrical power operational. */
  readonly electricalPower: boolean;
  /** Data or communication path operational. */
  readonly dataCommPath: boolean;
  /** Ammunition feed operational. */
  readonly ammunitionFeed: boolean;
  /** Stabilization operational. */
  readonly stabilization: boolean;
  /** Engagement channels operational. */
  readonly engagementChannels: boolean;
}

/** All channels operational (fully functional system). */
export const ALL_CHANNELS_OPERATIONAL: AirDamageComponentStatus = {
  weaponMount: true,
  director: true,
  radar: true,
  electricalPower: true,
  dataCommPath: true,
  ammunitionFeed: true,
  stabilization: true,
  engagementChannels: true,
};

/**
 * AC-14: Computes the director multiplier with local-control fallback (§21).
 *
 * §21 lines 361-363: "An intact gun with a destroyed director may use local
 * control only when its definition provides an exact local-control multiplier.
 * The shipped local-control multiplier is 5_000 basis points."
 *
 * Logic:
 *   - Director operational → use normalDirectorMultiplierBp (from §12 table)
 *   - Director destroyed + system has localControlMultiplierBp → use local control (5_000 bp)
 *   - Director destroyed + no localControlMultiplierBp → 0 (director loss blocks path)
 *
 * @param componentStatus — component damage state.
 * @param systemDefinition — system definition (for localControlMultiplierBp).
 * @param normalDirectorMultiplierBp — normal director scaling value (from §12 table).
 * @returns Director multiplier in bp.
 */
export function computeDirectorMultiplierBp(
  componentStatus: AirDamageComponentStatus,
  systemDefinition: AirDefenseSystemDefinition,
  normalDirectorMultiplierBp: SafeInt,
): SafeInt {
  if (componentStatus.director) {
    // Director operational: use normal scaling
    return normalDirectorMultiplierBp;
  }

  // Director destroyed: check for local control
  if (systemDefinition.localControlMultiplierBp !== undefined) {
    // Local control available: use the shipped multiplier (5_000 bp)
    return systemDefinition.localControlMultiplierBp;
  }

  // No local control defined: director loss blocks engagement path
  return SafeInt(0);
}

/**
 * AC-14: Computes the overall damage multiplier from component status (§21).
 *
 * §21 specifies 8 independent damage channels. The overall damageMultiplierBp
 * aggregates the component states. This simplified implementation counts
 * operational channels and computes a proportional multiplier.
 *
 * Simplified model: each channel contributes 1/8 of 10_000 bp (1_250 bp).
 * All channels operational → 10_000 bp (neutral).
 * Each destroyed channel reduces by 1_250 bp.
 * Minimum is 0 bp (all channels destroyed).
 *
 * NOTE: DESIGN-45 does not ship a specific formula for combining the 8 damage
 * channels into a single multiplier. This simplified proportional model is
 * documented here and may be refined when the canonical combination formula
 * is specified in a future design increment.
 *
 * @param componentStatus — component damage state.
 * @returns Damage multiplier in bp [0, 10_000].
 */
export function computeDamageMultiplierBp(componentStatus: AirDamageComponentStatus): SafeInt {
  const channels: readonly boolean[] = [
    componentStatus.weaponMount,
    componentStatus.director,
    componentStatus.radar,
    componentStatus.electricalPower,
    componentStatus.dataCommPath,
    componentStatus.ammunitionFeed,
    componentStatus.stabilization,
    componentStatus.engagementChannels,
  ];
  const operationalCount = channels.filter(Boolean).length;
  // floor(operationalCount × 10_000 / 8)
  const scaled = Math.floor((operationalCount * 10_000) / channels.length);
  return SafeInt(Math.max(0, Math.min(10_000, scaled)));
}

/**
 * Convenience: applies the full damage-aware director multiplier computation
 * and returns both the director multiplier and the overall damage multiplier
 * for use in the engagement formula.
 */
export interface DamageAwareMultipliers {
  /** Director multiplier with local-control fallback. */
  readonly directorMultiplierBp: SafeInt;
  /** Overall damage multiplier from component status. */
  readonly damageMultiplierBp: SafeInt;
}

/**
 * Computes both director and damage multipliers from component status.
 * This is the recommended entry point for wiring AC-14 into AC-11.
 *
 * @param componentStatus — component damage state.
 * @param systemDefinition — system definition (for localControlMultiplierBp).
 * @param normalDirectorMultiplierBp — normal director scaling (from §12 table).
 */
export function computeDamageAwareMultipliers(
  componentStatus: AirDamageComponentStatus,
  systemDefinition: AirDefenseSystemDefinition,
  normalDirectorMultiplierBp: SafeInt,
): DamageAwareMultipliers {
  return {
    directorMultiplierBp: computeDirectorMultiplierBp(
      componentStatus,
      systemDefinition,
      normalDirectorMultiplierBp,
    ),
    damageMultiplierBp: computeDamageMultiplierBp(componentStatus),
  };
}
