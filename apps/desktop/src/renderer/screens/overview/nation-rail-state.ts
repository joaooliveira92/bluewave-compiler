import type { DiplomacyScreenProjection } from "../../../shared/diplomacy-contract.js";
import type { DeferredFeature } from "../../components/shared/DeferredFeaturesPanel.js";
import { warScoreSplit } from "../diplomacy/diplomacy-presentation.js";

/** The relation of a nation to the player, as the rail states it in words. */
export type NationRailRelation = "self" | "peace" | "pact" | "alliance" | "war" | "trade";

export interface NationRailRow {
  readonly nationId: string;
  readonly name: string;
  readonly isPlayer: boolean;
  readonly relation: NationRailRelation;
  /** Words only: the relation is never carried by colour alone. */
  readonly relationLabel: string;
  readonly blockade: boolean;
  /** Present only while the player is in an active war against this nation. */
  readonly warScore: { readonly yours: number; readonly enemy: number } | null;
  readonly tension: number | null;
  readonly since: string | null;
}

const BASE_LABEL: Readonly<Record<NationRailRelation, string>> = {
  self: "You",
  peace: "Peace",
  pact: "Non-aggression pact",
  alliance: "Alliance",
  war: "War",
  trade: "Trade agreement",
};

/**
 * Pure view-model for the nation rail, derived from the Diplomacy & War
 * projection (the same `inspectDiplomacyScreen` view the Diplomacy screen
 * reads). The player is pinned first; the rest follow by name.
 */
export function buildNationRail(
  projection: DiplomacyScreenProjection,
  playerName: string,
): readonly NationRailRow[] {
  const player = projection.playerNationId;
  const rows: NationRailRow[] = [
    {
      nationId: player,
      name: playerName,
      isPlayer: true,
      relation: "self",
      relationLabel: BASE_LABEL.self,
      blockade: false,
      warScore: null,
      tension: null,
      since: null,
    },
  ];
  const others = [...projection.knownNations].sort((a, b) => a.name.localeCompare(b.name));
  for (const nation of others) {
    const row = projection.relations.find((r) => r.partnerNationId === nation.nationId);
    const blockade = projection.blockades.some(
      (b) =>
        (b.blockaderId === player && b.blockadedNationId === nation.nationId) ||
        (b.blockaderId === nation.nationId && b.blockadedNationId === player),
    );
    let relation: NationRailRelation = "peace";
    if (row?.relation === "at_war") relation = "war";
    else if (row?.relation === "allied") relation = "alliance";
    else if (row?.nap === true) relation = "pact";
    else if (row?.relation === "trade_agreement") relation = "trade";
    const war =
      relation === "war"
        ? projection.wars.find((w) => {
            if (w.status !== "ACTIVE") return false;
            const opposing =
              w.playerSide === "attacker" ? w.defenderSideMembers : w.attackerSideMembers;
            return opposing.includes(nation.nationId);
          })
        : undefined;
    const split = war === undefined ? null : warScoreSplit(war);
    rows.push({
      nationId: nation.nationId,
      name: nation.name,
      isPlayer: false,
      relation,
      relationLabel: blockade ? `${BASE_LABEL[relation]}, blockade` : BASE_LABEL[relation],
      blockade,
      warScore: split === null ? null : { yours: split.yours, enemy: split.enemy },
      tension: row?.tension ?? null,
      since: row?.since ?? null,
    });
  }
  return rows;
}

/** Right-rail items the engine cannot supply (it has an empty `IntelligenceState`; ticket 07). */
export const DEFERRED_NATION_RAIL_ITEMS: readonly DeferredFeature[] = [
  { id: "intel-level", name: "Intel level", reason: "The engine has no intelligence state yet." },
  { id: "intel-reports", name: "Intel reports", reason: "There are no intelligence reports yet." },
  { id: "almanac", name: "Almanac", reason: "Static reference content is a later ticket." },
];
