import { buildBattleHistory } from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { InspectBattleHistoryResult } from "../../shared/campaign-command-contract.js";
import { getCampaignSession } from "../campaignSessions.js";

/**
 * `inspectBattleHistory(sessionId) -> { history }` — the player's resolved
 * battles (who, where, outcome, ships lost), derived read-only from the
 * session's stored snapshot by the pure `buildBattleHistory`. Same pattern as
 * `inspectMap`: no mutation, rebuilt fresh on every call.
 */
export async function inspectBattleHistory(
  sessionId: string,
): Promise<BridgeResult<InspectBattleHistoryResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }
  const snapshot = record.state.snapshot;
  return {
    outcome: "success",
    value: {
      revision: Number(snapshot.turnNumber),
      history: buildBattleHistory(snapshot, record.playerSlotId),
    },
    diagnostics: [],
  };
}
