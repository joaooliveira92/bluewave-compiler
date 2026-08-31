// packages/combat/src/air-defense/light-aa-disruption.ts
// D-4 M4 Aviation: Air Defense — AC-7 guaranteed light-AA disruption opportunity (§10).
//
// Every eligible light-AA system receives at least one disruption check of one
// authoritative substep against each attack that enters its valid terminal
// envelope. The guaranteed opportunity does NOT guarantee ammunition, hit,
// damage, or abort (§10, §29.9).
//
// This module is PURE and deterministic. No ambient I/O, no RNG calls.
// Random outcomes use a supplied `randomBp` draw parameter in [0, 10_000).

import { SafeInt } from "@bluewave/contracts";
import type { AirDefenseSystemDefinition } from "./air-defense-system-definition.js";
import type { AirDefenseAttack } from "./air-defense-attack.js";
import type { AirDefenseState, DisruptionSeverityType } from "./air-defense-state.js";
import type { AirDefenseContext } from "./layer-resolution.js";
import {
  computeEffectiveDefenseBp,
  neutralEngagementFactors,
  resolveEngagementOutcome,
  determineDisruptionSeverity,
} from "./engagement.js";
import { FORMULA_DENOMINATOR } from "./constants.js";
import { LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED } from "./reason-codes.js";

/** Result of a guaranteed light-AA disruption opportunity check. */
export interface LightAADisruptionResult {
  /** The system that received the opportunity. */
  readonly systemId: string;
  /** Whether the system was eligible for the guaranteed disruption check. */
  readonly eligible: boolean;
  /** Reason code: LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED when eligible. */
  readonly reasonCode: string;
  /** Effective disruption basis points (0 when ineligible). */
  readonly disruptionBp: SafeInt;
  /** Disruption severity determined from the draw (null when no disruption). */
  readonly severity: DisruptionSeverityType | null;
  /** The random draw value used. */
  readonly randomDrawBp: number;
  /** The engagement outcome from the draw. */
  readonly outcome: "DISRUPTION" | "NO_EFFECT";
}

/** Prohibition reasons a system cannot receive the guaranteed disruption check. */
type ProhibitionReason =
  | "DESTROYED"
  | "UNPOWERED"
  | "NO_AMMUNITION"
  | "OUT_OF_ARC"
  | "TARGET_INELIGIBLE"
  | "NO_CHANNEL";

/**
 * §10: checks whether a light-AA system is prohibited from receiving the
 * guaranteed disruption check.
 *
 * Prohibited when the system is destroyed, unpowered, out of ammunition,
 * out of arc, target-ineligible, or has no legal contact.
 */
function checkProhibition(
  system: AirDefenseSystemDefinition,
  state: AirDefenseState,
  attack: AirDefenseAttack,
  context: AirDefenseContext,
): ProhibitionReason | null {
  // Destroyed: system has zero mounts
  if (Number(system.mountCount) <= 0) return "DESTROYED";

  // Unpowered: power is zero or below
  if (Number(state.powerBp) <= 0) return "UNPOWERED";

  // Out of ammunition: tracked ammo entry with zero rounds
  const ammo = state.ammunitionByType.get(system.systemId);
  if (ammo !== undefined && Number(ammo) <= 0) return "NO_AMMUNITION";

  // Out of arc / range check
  const range = Number(context.attackerRangeM);
  if (range < Number(system.rangeMinM) || range > Number(system.rangeMaxM)) return "OUT_OF_ARC";

  // Altitude check
  const altitude = Number(context.attackerAltitudeM);
  if (altitude < Number(system.altitudeMinM) || altitude > Number(system.altitudeMaxM))
    return "OUT_OF_ARC";

  // Target-ineligible: system must accept the target type
  if (!system.profileEligibility.has(context.targetType)) return "TARGET_INELIGIBLE";

  // No channel available
  if (system.engagementChannels.size === 0) return "NO_CHANNEL";

  return null;
}

/**
 * AC-7 (§10): Guaranteed light-AA disruption opportunity.
 *
 * Grants exactly one disruption check to every eligible light-AA system
 * against each attack entering its valid terminal envelope. The check
 * uses the §19 engagement formula with disruption-only base value and
 * a single random draw.
 *
 * @param system — the light-AA system definition.
 * @param state — current air-defense state.
 * @param attack — the incoming attack descriptor.
 * @param context — battlefield context.
 * @param randomBp — a single draw in [0, 10_000).
 * @returns LightAADisruptionResult with opportunity outcome.
 */
export function evaluateLightAADisruptionOpportunity(
  system: AirDefenseSystemDefinition,
  state: AirDefenseState,
  attack: AirDefenseAttack,
  context: AirDefenseContext,
  randomBp: number,
): LightAADisruptionResult {
  // Validate randomBp
  if (!Number.isInteger(randomBp) || randomBp < 0 || randomBp >= FORMULA_DENOMINATOR) {
    return {
      systemId: system.systemId,
      eligible: false,
      reasonCode: "",
      disruptionBp: SafeInt(0),
      severity: null,
      randomDrawBp: randomBp,
      outcome: "NO_EFFECT",
    };
  }

  // §10 prohibition check
  const prohibition = checkProhibition(system, state, attack, context);
  if (prohibition !== null) {
    return {
      systemId: system.systemId,
      eligible: false,
      reasonCode: "",
      disruptionBp: SafeInt(0),
      severity: null,
      randomDrawBp: randomBp,
      outcome: "NO_EFFECT",
    };
  }

  // System is eligible: compute disruption bp using §19 formula
  // Use disruption base value with neutral factors (all multipliers = 10_000)
  // except ammunition which is checked but passes (above prohibition check passed).
  const baseDisruptionBp = SafeInt(system.baseDisruptionBp);
  const factors = neutralEngagementFactors(baseDisruptionBp);
  const result = computeEffectiveDefenseBp(factors);
  const disruptionBp = result.effectiveDefenseBp;

  // §5 outcome table: DISRUPTION outcome when draw < disruptionBp
  const outcome = resolveEngagementOutcome(
    {
      killBp: 0,
      damageBp: 0,
      abortBp: 0,
      disruptionBp: disruptionBp,
    },
    randomBp,
  );

  const severity = determineDisruptionSeverity(outcome === "DISRUPTION" ? disruptionBp : 0);

  return {
    systemId: system.systemId,
    eligible: true,
    reasonCode: LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED,
    disruptionBp: outcome === "DISRUPTION" ? disruptionBp : SafeInt(0),
    severity,
    randomDrawBp: randomBp,
    outcome: outcome === "DISRUPTION" ? "DISRUPTION" : "NO_EFFECT",
  };
}
