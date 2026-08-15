import { buildFleetScreenView } from "@bluewave/campaign-engine";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type { FleetScreenProjection } from "../../shared/fleet-contract.js";
import { getCampaignSession } from "../campaignSessions.js";

/**
 * `inspectFleetScreen(sessionId) -> FleetScreenProjection` (desktop-mvp
 * ticket 15). Read-only for MVP per ticket 10's resolved design: the query
 * derives the player nation's real divisions, ships, and ports from the
 * session's stored `CampaignState` every call (via
 * `@bluewave/campaign-engine`'s pure `buildFleetScreenView`, the same
 * immutable-snapshot pattern `inspectConstructionScreen` uses) and reports
 * an empty `movementCommands` list — no movement order can exist yet.
 *
 * `submitMovementCommand`/`replaceMovementCommand`/`cancelMovementCommand`
 * stay unimplemented stubs resolved by `campaignBridge.ts`'s default
 * NOT_IMPLEMENTED case (same treatment as ticket 09's deferred battle
 * commands), so the movement controls this screen renders always surface a
 * clear "not available yet" outcome instead of silently failing.
 */
export async function inspectFleetScreen(
  sessionId: string,
): Promise<BridgeResult<FleetScreenProjection>> {
  const record = getCampaignSession(sessionId);
  if (!record) {
    return {
      outcome: "error",
      reason: "SESSION_NOT_FOUND",
      diagnostics: [`No active campaign session ${sessionId}`],
    };
  }

  const nation = record.state.snapshot.nations.get(record.playerSlotId);
  if (!nation) {
    return {
      outcome: "error",
      reason: "UNKNOWN_PLAYER_SLOT",
      diagnostics: [`No nation ${record.playerSlotId} in session ${sessionId}`],
    };
  }

  const view = buildFleetScreenView(record.state.snapshot, record.playerSlotId);

  const projection: FleetScreenProjection = {
    revision: Number(record.state.snapshot.turnNumber),
    month: record.month,
    playerNationId: record.playerSlotId,
    divisions: view.divisions,
    areas: view.areas,
    areaEdges: view.areaEdges,
    ports: view.ports,
    movementCommands: [],
  };

  return { outcome: "success", value: projection, diagnostics: [] };
}
