import type { CompiledDesignVersion as EngineCompiledDesignVersion } from "@bluewave/campaign";
import type { BridgeResult } from "../../../shared/bridge-contract.js";
import type { ConstructionCommandOutcome } from "../../../shared/construction-contract.js";
import type { CampaignSessionRecord } from "../../campaignSessions.js";

/**
 * Design validation shared by submit and replace: `designId` must exist in the
 * compiled snapshot and belong to the player's nation. Extracted so replace can
 * run EXACTLY the same checks as submit, and run them BEFORE mutating (F2).
 */
export type DesignValidation =
  | { readonly ok: true; readonly design: EngineCompiledDesignVersion }
  | { readonly ok: false; readonly result: BridgeResult<ConstructionCommandOutcome> };

export function validateDesignForPlayer(
  record: CampaignSessionRecord,
  designId: string,
): DesignValidation {
  const design = record.state.snapshot.designs.get(designId);
  if (!design) {
    return {
      ok: false,
      result: {
        outcome: "rejected",
        reason: "UNKNOWN_DESIGN",
        diagnostics: [`No design ${designId} in the compiled snapshot`],
      },
    };
  }
  if (design.nationId !== record.playerSlotId) {
    return {
      ok: false,
      result: {
        outcome: "rejected",
        reason: "DESIGN_NOT_FOR_PLAYER",
        diagnostics: [
          `Design ${designId} belongs to ${design.nationId}, not player slot ${record.playerSlotId}`,
        ],
      },
    };
  }
  return { ok: true, design };
}
