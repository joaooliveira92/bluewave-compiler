import { buildPlayerProjection } from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { InspectCampaignResult } from "../../shared/campaign-command-contract.js";
import { getCampaignSession } from "../campaignSessions.js";

/**
 * `inspectCampaign(sessionId) -> { projection }` (ticket 08/12). Rebuilds
 * the `PlayerProjection` fresh from the session's stored `CampaignState`
 * every call, rather than caching one at compile time — so later tickets
 * (`commitMonth` et al.) only need to update the session's stored state and
 * this stays correct without any extra wiring.
 */
export async function inspectCampaign(
  sessionId: string,
): Promise<BridgeResult<InspectCampaignResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const projection = buildPlayerProjection(record.state, record.playerSlotId, record.month);
  if (!projection) {
    return {
      outcome: "error",
      reason: "PROJECTION_FAILED",
      diagnostics: [`Could not build a projection for nation ${record.playerSlotId}`],
    };
  }

  return { outcome: "success", value: { projection }, diagnostics: [] };
}
