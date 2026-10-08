import { buildPlayerProjection } from "@bluewave/campaign-engine";
import type { CampaignSessionRecord } from "../campaignSessions.js";

/**
 * The derived construction economy — treasury, monthly appropriation (real
 * basis-point formula) and shipyard capacity (the nation's port levels' sum)
 * — read once from the engine's own player projection. Kept apart from the
 * workspace lifecycle so both the reservation sync and the screen projection
 * share one authoritative derivation.
 */
export function constructionEconomy(record: CampaignSessionRecord): {
  readonly treasury: number;
  readonly monthlyAppropriation: number;
  readonly shipyardCapacity: number;
} {
  const projection = buildPlayerProjection(record.state, record.playerSlotId, record.month);
  if (projection) return projection.economy;
  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  return {
    treasury: nation ? Number(nation.treasury) : 0,
    monthlyAppropriation: 0,
    shipyardCapacity: 0,
  };
}
