//packages/combat/src/battleResolution/engagement.ts
// P-1 ticket 11 / ADR-0072: speed advantage as range control.
//
// The pre-ticket-11 resolver let every ship steer straight at the nearest enemy
// at full designed speed, so speed conferred no tactical advantage and a slower
// fleet beaten 30 kn to 14 kn still won (ADR-0053 sweep: 14 kn won 30/30).
// ADR-0072 models the missing decision: the side with the greater maximum
// designed speed is the RANGE CONTROLLER. On its own initiative it holds a
// standoff engagement band instead of charging (see `engagementHeading`), and it
// fires from a steady course, while the slower, contesting side must close and
// manoeuvre to hold the range, degrading its own fire control.
//
// The degradation is expressed as a bounded multiplier on the contesting side's
// existing DESIGN-39 §3 `ownManeuver` factor, so no new accuracy factor key and
// no GUNNERY_RULESET_VERSION bump is required. Equal maximum speeds (including an
// absent/empty side) are deliberately neutral: `resolveRangeController` returns
// null, the contest penalty is NOT applied, and steering stays ADR-0046 pursuit —
// so equal-speed matchups and the P-1 torpedo doctrine (whose lead/intercept
// courses assume the ADR-0046 closing geometry) are unchanged.
import { directionBp } from "../movement/kinematics.js";
import { rangeBetweenUm } from "../gunnery/rangeCurve.js";
import type { TacticalShipUnit } from "../tactical/unit.js";
import { BATTLE_ENGAGEMENT_BAND_UM, BATTLE_ENGAGEMENT_RANGE_UM } from "./constants.js";

export type EngagementSide = "ATTACKER" | "DEFENDER";

export interface RangeControllerDecision {
  /** The side that controls the range, or null when maximum speeds are equal. */
  controller: EngagementSide | null;
  attackerMaxDesignedSpeedUms: number;
  defenderMaxDesignedSpeedUms: number;
}

/**
 * The side with the greater maximum live designed speed controls the range.
 * Ties (including an empty/absent side) are neutral: `controller` is null and
 * neither side is penalised nor steers differently.
 */
export function resolveRangeController(
  units: readonly TacticalShipUnit[],
): RangeControllerDecision {
  const maxOf = (side: EngagementSide): number => {
    let m = 0;
    for (const u of units) {
      if (u.sideId === side) m = Math.max(m, u.designedSpeedUms as number);
    }
    return m;
  };
  const attackerMax = maxOf("ATTACKER");
  const defenderMax = maxOf("DEFENDER");
  const controller: EngagementSide | null =
    attackerMax > defenderMax ? "ATTACKER" : defenderMax > attackerMax ? "DEFENDER" : null;
  return {
    controller,
    attackerMaxDesignedSpeedUms: attackerMax,
    defenderMaxDesignedSpeedUms: defenderMax,
  };
}

/** Fold any integer degree value into [0, 359]. */
export function foldHeading(degrees: number): number {
  return (((degrees % 360) + 360) % 360) | 0;
}

export type EngagementManoeuvre = "CLOSE" | "HOLD" | "OPEN";

/**
 * Branch of the standoff law for the range controller, from the current range to
 * the nearest enemy:
 *  - range > centre + band: CLOSE at the enemy;
 *  - range < centre - band: OPEN directly away (never pass through);
 *  - otherwise: HOLD the band (continue closing gently while inside it).
 */
export function engagementManoeuvre(
  rangeUm: number,
  centerUm: number = BATTLE_ENGAGEMENT_RANGE_UM,
  bandUm: number = BATTLE_ENGAGEMENT_BAND_UM,
): EngagementManoeuvre {
  if (rangeUm > centerUm + bandUm) return "CLOSE";
  if (rangeUm < centerUm - bandUm) return "OPEN";
  return "HOLD";
}

export interface EngagementHeadingInput {
  rangeUm: number;
  bearingToEnemy: number;
  centerUm?: number;
  bandUm?: number;
}

/**
 * Ordered heading of the range controller under the standoff law. The law is
 * deliberately reflection-symmetric (CLOSE mirrors to CLOSE, OPEN to OPEN under
 * the centre reflection), so it introduces no attacker/defender bias of its own.
 */
export function engagementHeading(input: EngagementHeadingInput): number {
  const { rangeUm, bearingToEnemy } = input;
  return engagementManoeuvre(rangeUm, input.centerUm, input.bandUm) === "OPEN"
    ? foldHeading(bearingToEnemy + 180)
    : foldHeading(bearingToEnemy);
}

/** Integer heading (0..359, movement convention) whose unit vector best aligns
 *  with (dx, dy). Kept here so peer modules share one authored direction-table
 *  search (no duplicated table, no floating trigonometry). */
export function headingToward(dx: number, dy: number): number {
  let best = 0;
  let bestDot = Number.NEGATIVE_INFINITY;
  for (let h = 0; h < 360; h++) {
    const { cosBp, sinBp } = directionBp(h);
    const dot = dx * cosBp + dy * sinBp;
    if (dot > bestDot) {
      bestDot = dot;
      best = h;
    }
  }
  return best;
}

export { rangeBetweenUm };
