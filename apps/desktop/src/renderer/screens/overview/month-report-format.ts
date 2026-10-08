import type { MonthBattleSummary, MonthSummary } from "../../lib/month-summary.js";

/** "+20", "−56" (a real minus sign), "0" — so a loss reads as a loss at a glance. */
export function signed(value: number): string {
  if (value === 0) return "0";
  const body = Math.abs(value).toLocaleString("en-US");
  return value > 0 ? `+${body}` : `−${body}`;
}

const ships = (count: number): string => (count === 1 ? "1 ship" : `${count} ships`);

/**
 * One sentence per battle: who won where, and what it cost each side. An undecided battle is a
 * draw, never a win for anyone.
 */
export function describeBattle(
  battle: MonthBattleSummary,
  nation: (id: string) => string,
  area: (id: string) => string,
): string {
  const attacker = nation(battle.attackerId);
  const defender = nation(battle.defenderId);
  const place = area(battle.areaId);
  const cost = `${attacker} lost ${ships(battle.attackerLosses)}, ${defender} lost ${ships(battle.defenderLosses)}`;
  if (battle.winnerId === null) {
    return `${attacker} and ${defender} fought to a draw in ${place}. ${cost}.`;
  }
  const winner = battle.winnerId === battle.attackerId ? attacker : defender;
  const loser = battle.winnerId === battle.attackerId ? defender : attacker;
  return `${winner} defeated ${loser} in ${place}. ${cost}.`;
}

/** "2 construction updates · 1 technology discovered", omitting anything that did not happen. */
export function progressLine(summary: MonthSummary): string | null {
  const parts: string[] = [];
  if (summary.constructionUpdates > 0) {
    parts.push(
      `${summary.constructionUpdates} construction ${summary.constructionUpdates === 1 ? "update" : "updates"}`,
    );
  }
  if (summary.researchUpdates > 0) {
    parts.push(
      `${summary.researchUpdates} research ${summary.researchUpdates === 1 ? "update" : "updates"}`,
    );
  }
  if (summary.technologiesDiscovered > 0) {
    parts.push(
      `${summary.technologiesDiscovered} ${summary.technologiesDiscovered === 1 ? "technology" : "technologies"} discovered`,
    );
  }
  return parts.length === 0 ? null : parts.join(" · ");
}
