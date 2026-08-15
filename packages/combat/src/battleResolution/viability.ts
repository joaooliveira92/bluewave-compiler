//packages/combat/src/battleResolution/viability.ts
// B-6 INC-2: side-viability predicate + §32 battle-end decision for the
// auto-resolver (DESIGN-38 §32 precedence; AC-6/AC-7).
//
// A side is ELIMINATED (`no_viable_combatants`) when ALL of its combatants are
// non-viable: terminal (SINKING/FOUNDERED) or hull-structure exhausted
// (structuralIntegrity <= 0 AND flotationReserve <= 0) — DESIGN-41 terminal
// seam semantics. The battle-end reason follows BATTLE_END_PRECEDENCE via
// `evaluateBattleEnd`; the ONLY precedence slots reachable from this slice are
// `no_viable_combatants` and `time_limit` (scenario-terminal / objective /
// withdrawal / mutual-disengagement predicates are not implemented yet and
// report false — the engine stage owning them lands later; they are never
// invented here).
//
// Deterministic tie-break (recorded in ADR-0026): when BOTH sides become
// non-viable in the same minute, the battle ends with reason
// `no_viable_combatants` and NO winner (`winnerId`/`loserId` null) — a plain
// derivable tie, no human judgment required.
import { BluewaveError } from "@bluewave/contracts";
import { evaluateBattleEnd } from "../battleEnd.js";
import { type ShipDamageState } from "../damage/state.js";
import { BATTLE_VIABILITY_EVALUATION_FAILED } from "./reasonCodes.js";

export type BattleSide = "ATTACKER" | "DEFENDER";

/** One ship's viability surface (projected unit + its damage state). */
export interface ShipViability {
  assetId: string;
  sideId: BattleSide;
  damageState: ShipDamageState;
}

/** A ship is non-viable when terminally damaged or structure+flotation are
 *  fully exhausted (hull gone). */
export function isShipNonViable(ship: ShipViability): boolean {
  const s = ship.damageState;
  if (s.terminalStatus !== "NORMAL") return true;
  return s.structuralIntegrity <= 0 && s.flotationReserve <= 0;
}

/** Whether the given side is eliminated (all its ships non-viable).
 *  An empty side fails closed — the projector never emits one. */
export function sideEliminated(ships: readonly ShipViability[], sideId: BattleSide): boolean {
  const sideShips = ships.filter((s) => s.sideId === sideId);
  if (sideShips.length === 0) {
    throw new BluewaveError(BATTLE_VIABILITY_EVALUATION_FAILED, {
      code: BATTLE_VIABILITY_EVALUATION_FAILED,
      sideId,
      reason: "side has no ships to evaluate — the projection must not produce an empty side",
    });
  }
  return sideShips.every((s) => isShipNonViable(s));
}

export interface AutoResolutionEndDecision {
  ended: boolean;
  /** Exact §32 reason id when ended. */
  reason?: string;
  /** The eliminated side ("ATTACKER" | "DEFENDER"); null on the tie rule. */
  eliminatedSide?: BattleSide | null;
}

/**
 * Decide battle end after one fully-resolved minute (terminating-minute effects
 * INCLUDED — the caller has already applied the minute's gunnery+damage).
 */
export function decideBattleEnd(
  ships: readonly ShipViability[],
  elapsedMinutes: number,
  maxMinutes: number,
): AutoResolutionEndDecision {
  const attackerEliminated = sideEliminated(ships, "ATTACKER");
  const defenderEliminated = sideEliminated(ships, "DEFENDER");

  // Deterministic tie: both non-viable in the same minute (ADR-0026).
  if (attackerEliminated && defenderEliminated) {
    return { ended: true, reason: "no_viable_combatants", eliminatedSide: null };
  }
  const eliminated = attackerEliminated
    ? ("ATTACKER" as BattleSide)
    : defenderEliminated
      ? ("DEFENDER" as BattleSide)
      : null;

  const evaluation = evaluateBattleEnd({
    scenarioTerminal: false,
    sideEliminated: eliminated ?? undefined,
    objectiveImmediateEnd: false,
    mutualDisengagement: false,
    elapsedMinutes,
    maxMinutes,
    currentMinuteEffectsResolved: true,
  });

  if (evaluation.ended) {
    return { ended: true, reason: evaluation.reason, eliminatedSide: eliminated };
  }
  return { ended: false };
}
