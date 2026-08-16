import { buildWorldMapView } from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { InspectMapResult } from "../../shared/campaign-command-contract.js";
import { getCampaignSession } from "../campaignSessions.js";

/**
 * `inspectMap(sessionId) -> { world }` — full-world projection for the F1
 * strategic map. Read-only, rebuilt fresh from the session's stored
 * `CampaignState` every call via `@bluewave/campaign-engine`'s pure
 * `buildWorldMapView` (same immutable-snapshot pattern as `inspectCampaign`
 * and `inspectFleetScreen`), so the map colours the whole world from
 * authoritative campaign data rather than a static fixture.
 */
export async function inspectMap(sessionId: string): Promise<BridgeResult<InspectMapResult>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const world = buildWorldMapView(record.state.snapshot);

  return {
    outcome: "success",
    value: {
      revision: Number(record.state.snapshot.turnNumber),
      month: record.month,
      world,
    },
    diagnostics: [],
  };
}