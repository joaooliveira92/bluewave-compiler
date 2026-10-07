import type { CampaignSnapshot } from "@bluewave/campaign";

/**
 * The player's battle history, derived from the resolved battles recorded on the
 * snapshot (`wars.battles[]`). Read-only and deterministic.
 *
 * Honest limits of the stored data (docs/research/rtw3-losses-ledger-engine-surface.md):
 * a sunk ship is removed from its fleet and only its id is kept, so ship names and
 * classes are not recoverable; a battle carries no date. This view therefore reports
 * what is real (who fought, where, who won, how many ships were lost) and nothing more.
 *
 * Flat plain objects only — it crosses the Electron IPC boundary as JSON.
 */

export type BattleOutcomeForPlayer = "won" | "lost" | "undecided" | "not-involved";

export interface BattleHistoryEntry {
  /** 1-based position in the order battles resolved (battles only ever append). */
  readonly sequence: number;
  readonly battleId: string;
  readonly areaId: string;
  readonly areaName: string;
  readonly attackerId: string;
  readonly attackerName: string;
  readonly defenderId: string;
  readonly defenderName: string;
  readonly involvesPlayer: boolean;
  readonly outcomeForPlayer: BattleOutcomeForPlayer;
  /** Ships the player lost (0 for battles the player was not in). */
  readonly playerLossCount: number;
  /** Ships the opposing side(s) lost; for third-party battles, the total of both sides. */
  readonly enemyLossCount: number;
  /** Ids of every ship sunk in the battle, attacker's first (ids only — see header). */
  readonly lostShipIds: readonly string[];
}

export interface BattleHistoryView {
  readonly battles: readonly BattleHistoryEntry[];
}

export function buildBattleHistory(
  snapshot: CampaignSnapshot,
  playerNationId: string,
): BattleHistoryView {
  const nationName = (id: string): string => snapshot.nations.get(id)?.name ?? id;
  const areaName = (id: string): string =>
    snapshot.world.areas.find((area) => area.id === id)?.name ?? id;

  const battles: BattleHistoryEntry[] = [];
  for (const battle of snapshot.wars.battles) {
    const result = battle.result;
    if (battle.phase !== "resolved" || result === undefined) continue;

    const playerAttacks = battle.attackerId === playerNationId;
    const playerDefends = battle.defenderId === playerNationId;
    const involvesPlayer = playerAttacks || playerDefends;

    let outcomeForPlayer: BattleOutcomeForPlayer = "not-involved";
    if (involvesPlayer) {
      if (result.winnerId === null || result.loserId === null) outcomeForPlayer = "undecided";
      else outcomeForPlayer = result.winnerId === playerNationId ? "won" : "lost";
    }

    const attackerLosses = result.attackerLosses.length;
    const defenderLosses = result.defenderLosses.length;
    const playerLossCount = playerAttacks ? attackerLosses : playerDefends ? defenderLosses : 0;
    const enemyLossCount = playerAttacks
      ? defenderLosses
      : playerDefends
        ? attackerLosses
        : attackerLosses + defenderLosses;

    battles.push({
      sequence: battles.length + 1,
      battleId: battle.id,
      areaId: battle.areaId,
      areaName: areaName(battle.areaId),
      attackerId: battle.attackerId,
      attackerName: nationName(battle.attackerId),
      defenderId: battle.defenderId,
      defenderName: nationName(battle.defenderId),
      involvesPlayer,
      outcomeForPlayer,
      playerLossCount,
      enemyLossCount,
      lostShipIds: [...result.attackerLosses, ...result.defenderLosses],
    });
  }
  return { battles };
}
