import { buildPrioritiesProjection, type InspectPrioritiesResult } from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import { getCampaignSession } from "../campaignSessions.js";

/**
 * `inspectPriorities(sessionId) -> { priorities }` (game-onboarding INC-10,
 * spec §14). Rebuilds the read-only priorities projection fresh from the
 * session's stored `CampaignState` — pure, deterministic, never mutates
 * authoritative state. Warnings section of the pre-turn review IS this
 * projection (spec §14); the engine remains the authority, the renderer
 * never recomputes priorities itself.
 */
export async function inspectPriorities(
  sessionId: string,
): Promise<BridgeResult<InspectPrioritiesResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const priorities = buildPrioritiesProjection(record.state.snapshot, record.playerSlotId);
  return { outcome: "success", value: { priorities }, diagnostics: [] };
}
