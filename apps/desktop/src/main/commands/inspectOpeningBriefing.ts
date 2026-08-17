import { buildOpeningBriefingProjection } from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { InspectOpeningBriefingResult } from "../../shared/campaign-command-contract.js";
import { getCampaignSession } from "../campaignSessions.js";

/**
 * `inspectOpeningBriefing(sessionId) -> InspectOpeningBriefingResult`
 * (game-onboarding INC-8, spec §8): the Opening Strategic Briefing's slice of
 * the compiled snapshot, shown once after world generation and before the
 * Overview dashboard. Purely read-only — derives everything from the session's
 * compiled `CampaignState` via `buildOpeningBriefingProjection` (same
 * convention as `inspectDiplomacyScreen`), never mutating state.
 *
 * Session lookup (`SESSION_NOT_FOUND`) and player-slot resolution
 * (`UNKNOWN_PLAYER_SLOT`) follow the established inspect-command pattern.
 */
export async function inspectOpeningBriefing(
  sessionId: string,
): Promise<BridgeResult<InspectOpeningBriefingResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const projection = buildOpeningBriefingProjection(
    record.state,
    record.playerSlotId,
    record.month,
  );
  if (!projection) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${record.playerSlotId} in session ${sessionId}`],
    };
  }

  return { outcome: "success", value: { projection }, diagnostics: [] };
}
