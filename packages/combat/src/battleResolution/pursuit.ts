//packages/combat/src/battleResolution/pursuit.ts
// P-1 / ADR-0046: minimal auto-resolution manoeuvre — every viable ship steers
// toward the nearest viable enemy legal contact each minute (ties: ascending asset
// id) at full designed speed; with no contact it holds its course. Without this the
// projected lines passed through each other once and steamed off the map, so close
// actions (and the torpedo window) never recurred. Heading selection is an integer
// search over the movement direction table (no floating trigonometry), so it is
// byte-stable across processes and platforms. Tactical AI proper is Track P-6.
import { directionBp } from "../movement/kinematics.js";
import type { TacticalBattleState } from "../tactical/state.js";
import type { TacticalShipUnit } from "../tactical/unit.js";
import type { DamageContext } from "./damage.js";

/** Integer heading (0..359, movement convention) whose unit vector best aligns with (dx, dy). */
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

export function pursuitOrders(input: {
  battleId: string;
  battleState: TacticalBattleState;
  damage: DamageContext;
  units: readonly TacticalShipUnit[];
  baseOrders: Readonly<Record<string, { orderedHeading: number; orderedSpeedBp: number }>>;
}): Record<string, { orderedHeading: number; orderedSpeedBp: number }> {
  const { battleId, battleState, damage, units, baseOrders } = input;
  const movement = battleState.movementStates ?? {};
  const contactPos = new Map(
    (battleState.contacts ?? []).map((c) => [c.contactId, c.position] as const),
  );
  const viable = (id: string): boolean =>
    (damage.targets[id]?.state.terminalStatus ?? "NORMAL") === "NORMAL";
  const out: Record<string, { orderedHeading: number; orderedSpeedBp: number }> = {};
  for (const u of units) {
    const base = baseOrders[u.assetId];
    const own = movement[u.assetId];
    if (!base || !own) continue;
    let best: { dx: number; dy: number; d2: number; id: string } | null = null;
    for (const e of units) {
      if (e.sideId === u.sideId || !viable(e.assetId)) continue;
      const pos = contactPos.get(`${battleId}:${e.assetId}`);
      if (!pos) continue;
      const dx = pos[0] - own.position[0];
      const dy = pos[1] - own.position[1];
      const d2 = dx * dx + dy * dy;
      if (!best || d2 < best.d2 || (d2 === best.d2 && e.assetId < best.id)) {
        best = { dx, dy, d2, id: e.assetId };
      }
    }
    out[u.assetId] = {
      orderedHeading: best ? headingToward(best.dx, best.dy) : own.heading,
      orderedSpeedBp: base.orderedSpeedBp,
    };
  }
  return out;
}
