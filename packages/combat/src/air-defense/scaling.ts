// packages/combat/src/air-defense/scaling.ts
// D-4 M4 Aviation: Air Defense — Director scaling + radar saturation + CIWS
// redundancy resolution (INC-4).
//
// AC-8  (§11/§12): director assignment order + scaling table values
// AC-9  (§13/§14): radar-directed medium-AA saturation diminishing returns
// AC-10 (§15/§16): CIWS redundancy schedule
//
// This module is PURE and deterministic. No ambient I/O, no RNG, no mutation
// of passed state. All inputs are explicit parameters.

import { BluewaveError, SafeInt } from "@bluewave/contracts";
import {
  DIRECTOR_SCALING_TABLE,
  radarMediumAaMarginalMultiplierBp,
  ciwsMarginalMultiplierBp,
} from "./constants.js";
import { INVALID_AIR_DEFENSE_SYSTEM_DEFINITION } from "./reason-codes.js";
import type { LayerId } from "./air-defense-system-definition.js";

// ---- §12 Shipped director normal-scaling cap ----
// The permitted normal-scaling schedule runs to index 4 (31_000 bp). Directors
// beyond this cap provide NO additional §12 directed-fire value and instead map
// to the cap value; their §11 reason code (AA_DIRECTOR_NORMAL_SCALING_CAP_REACHED)
// is emitted by the INC-5 reason-code layer. This increment exposes the cap as a
// named constant for that caller.
export const DIRECTOR_NORMAL_SCALING_CAP =
  DIRECTOR_SCALING_TABLE[DIRECTOR_SCALING_TABLE.length - 1]?.[0] ?? 4;

/**
 * AC-8: Returns the §12 aggregate directed-fire scaling value (bp) for a given
 * operational director count assigned to one defended ship.
 *
 * Canonical values (§12, shipped):
 *   index 0 → 5_000; index 1 → 10_000; index 2 → 18_000; index 3 → 25_000; index 4 → 31_000.
 *
 * Index 0 means no director is assigned (the base value a ship with a non-
 * functioning or absent director receives). Directors above the shipped cap (4)
 * provide NO additional aggregate directed-fire value under the shipped policy —
 * they contribute only to channel availability/redundancy/replacement and are
 * surfaced by the §11/§28 reason-code layer in INC-5.
 *
 * @param directorCount - 0-based count of operational directors assigned to the ship.
 * @returns Scaling multiplier in bp.
 */
export function directorScalingBp(directorCount: number): SafeInt {
  if (!SafeInt.isSafeInt(directorCount) || directorCount < 0) {
    throw new BluewaveError("directorScalingBp: directorCount must be a non-negative integer", {
      code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
      directorCount,
    });
  }
  const capped = Math.min(directorCount, DIRECTOR_NORMAL_SCALING_CAP);
  const entry = DIRECTOR_SCALING_TABLE[capped];
  if (entry === undefined) {
    // Defensive: cap lookup should always resolve (index 4 exists).
    return SafeInt(31_000);
  }
  return SafeInt(entry[1]);
}

// ---- §11 Director assignment order ----
// Directors MUST be assigned before firing by the canonical §11 priority:
//   1. defense layer priority (HEAVY_AA first);
//   2. threat score descending;
//   3. time to impact ascending;
//   4. target identifier ascending; and
//   5. director identifier ascending.
//
// The layer priority follows the canonical resolution order
// (HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS, §1).

const LAYER_PRIORITY: ReadonlyMap<LayerId, number> = new Map<LayerId, number>([
  ["HEAVY_AA", 0],
  ["MEDIUM_AA", 1],
  ["LIGHT_AA", 2],
  ["CIWS_TERMINAL_DEFENSE", 3],
]);

/** A candidate director assignment to be ordered per §11. */
export interface DirectorAssignmentCandidate {
  readonly layer: LayerId;
  /** Threat score of the assigned target (higher = more dangerous). */
  readonly threatScoreBp: number;
  /** Time to impact in milliseconds (lower = sooner). */
  readonly timeToImpactMs: number;
  readonly targetId: string;
  readonly directorId: string;
}

/**
 * AC-8 (§11): Orders director assignment candidates by the canonical §11 priority:
 *   1. defense layer priority (HEAVY_AA first);
 *   2. threat score descending;
 *   3. time to impact ascending;
 *   4. target identifier ascending; and
 *   5. director identifier ascending.
 *
 * Deterministic, locale-free (codepoint string comparison). Returns a new array;
 * does not mutate the input.
 */
export function orderDirectorAssignments(
  candidates: ReadonlyArray<DirectorAssignmentCandidate>,
): ReadonlyArray<DirectorAssignmentCandidate> {
  return [...candidates].sort((a, b) => {
    const layerDiff = (LAYER_PRIORITY.get(a.layer) ?? 99) - (LAYER_PRIORITY.get(b.layer) ?? 99);
    if (layerDiff !== 0) return layerDiff;
    if (a.threatScoreBp !== b.threatScoreBp) return b.threatScoreBp - a.threatScoreBp; // descending
    if (a.timeToImpactMs !== b.timeToImpactMs) return a.timeToImpactMs - b.timeToImpactMs; // ascending
    const targetDiff = a.targetId < b.targetId ? -1 : a.targetId > b.targetId ? 1 : 0;
    if (targetDiff !== 0) return targetDiff;
    return a.directorId < b.directorId ? -1 : a.directorId > b.directorId ? 1 : 0;
  });
}

// ---- §13/§14 Radar-directed medium-AA groups ----

/** Result of determining the effective radar-directed medium-AA group scaling. */
export interface RadarSaturationResult {
  /** Raw radar-directed medium-AA group count (>= 0). */
  readonly groupCount: number;
  /** Marginal effectiveness multiplier (bp) of the LAST group (n-th). */
  readonly marginalLastBp: number;
  /** Fractional effective group count per §14 (exact rational retained). */
  readonly effectiveGroupCountRational: number;
  /** Sum of all marginal multipliers (bp) — raw pre-division value. */
  readonly sumMarginalBp: number;
  /** True when groups 5..6 are active (first diminishing step). */
  readonly diminishingStepActive: boolean;
  /** True when groups 7..8 are active (second diminishing step). */
  readonly heavyDiminishingStepActive: boolean;
  /** True when groups 9+ are active (strong redundancy residual). */
  readonly redundantGroupActive: boolean;
}

/**
 * AC-9 (§14): Evaluates the radar-directed medium-AA saturation schedule.
 *
 * Marginal effectiveness multipliers (§14, shipped):
 *   groups 1..4 → 10_000; groups 5..6 → 5_000; groups 7..8 → 2_500; groups 9+ → 500.
 *
 * Effective group count (§14):
 *   effectiveRadarMediumAaGroups = sum(marginalGroupMultiplierBp(n) for n=1..count) / 10_000
 * The division is retained as an exact rational value until the owning formula rounds.
 *
 * @param groupCount - 0-based count of radar-directed medium-AA groups (>= 0).
 */
export function evaluateRadarSaturation(groupCount: number): RadarSaturationResult {
  if (!SafeInt.isSafeInt(groupCount) || groupCount < 0) {
    throw new BluewaveError("evaluateRadarSaturation: groupCount must be a non-negative integer", {
      code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
      groupCount,
    });
  }

  let sum = 0;
  for (let i = 1; i <= groupCount; i++) {
    sum += radarMediumAaMarginalMultiplierBp(i);
  }

  const marginalLast = radarMediumAaMarginalMultiplierBp(groupCount);
  return {
    groupCount,
    marginalLastBp: marginalLast,
    effectiveGroupCountRational: sum / 10_000,
    sumMarginalBp: sum,
    diminishingStepActive: groupCount >= 5 && groupCount <= 6,
    heavyDiminishingStepActive: groupCount >= 7 && groupCount <= 8,
    redundantGroupActive: groupCount >= 9,
  };
}

// ---- §15/§16 CIWS redundancy ----

/** Result of evaluating the CIWS redundancy schedule. */
export interface CiwsRedundancyResult {
  /** Number of CIWS systems on the defended ship (>= 0). */
  readonly systemCount: number;
  /** Marginal effectiveness multiplier (bp) of the LAST system. */
  readonly marginalLastBp: number;
  /** Fractional effective system count (retained rational). */
  readonly effectiveSystemCountRational: number;
  /** Sum of all marginal multipliers (bp). */
  readonly sumMarginalBp: number;
  /** True when systems 5..6 are active (reduced value). */
  readonly diminishingStepActive: boolean;
  /** True when systems 7..8 are active (heavy reduction). */
  readonly heavyReductionStepActive: boolean;
  /** True when systems 9+ are active (strong redundancy residual). */
  readonly strongRedundancyActive: boolean;
}

/**
 * AC-10 (§16): Evaluates the CIWS redundancy schedule.
 *
 * Marginal effectiveness multipliers (§16, shipped):
 *   systems 1..4 → 10_000; systems 5..6 → 5_000; systems 7..8 → 1_500; systems 9+ → 500.
 *
 * The first four systems provide full normal value. The schedule is NOT a hard
 * construction cap (§16): additional CIWS always provides SOME defensive value
 * (the residual 500 bp). This is an aggregate-value schedule, not a ban on
 * building redundant CIWS.
 *
 * @param systemCount - 0-based count of CIWS systems on the defended ship (>= 0).
 */
export function evaluateCiwsRedundancy(systemCount: number): CiwsRedundancyResult {
  if (!SafeInt.isSafeInt(systemCount) || systemCount < 0) {
    throw new BluewaveError("evaluateCiwsRedundancy: systemCount must be a non-negative integer", {
      code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION,
      systemCount,
    });
  }

  let sum = 0;
  for (let i = 1; i <= systemCount; i++) {
    sum += ciwsMarginalMultiplierBp(i);
  }

  const marginalLast = ciwsMarginalMultiplierBp(systemCount);
  return {
    systemCount,
    marginalLastBp: marginalLast,
    effectiveSystemCountRational: sum / 10_000,
    sumMarginalBp: sum,
    diminishingStepActive: systemCount >= 5 && systemCount <= 6,
    heavyReductionStepActive: systemCount >= 7 && systemCount <= 8,
    strongRedundancyActive: systemCount >= 9,
  };
}

// ---- Auxiliary table lookups (re-exported for testability) ----

/** Direct lookup of the §12 scaling value for a director count (0..cap). */
export function directorScalingTableValue(directorCount: number): number {
  const entry = DIRECTOR_SCALING_TABLE[Math.min(directorCount, DIRECTOR_SCALING_TABLE.length - 1)];
  return entry?.[1] ?? 31_000;
}

/** Direct lookup of the §14 marginal multiplier for a group count (1-based). */
export function radarSaturationTableValue(groupCount: number): number {
  return radarMediumAaMarginalMultiplierBp(groupCount);
}

/** Direct lookup of the §16 marginal multiplier for a system count (1-based). */
export function ciwsRedundancyTableValue(systemCount: number): number {
  return ciwsMarginalMultiplierBp(systemCount);
}
