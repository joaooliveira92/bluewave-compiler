import type { BridgeResult } from "../shared/bridge-contract.js";

/**
 * The `campaign:execute` command registry. Every command documented across
 * the desktop-mvp map (tickets 07-10) is listed here, even though none are
 * implemented yet (ticket 11's job is the scaffold, not the commands
 * themselves) — this is where tickets 12-16 (`.scratch/desktop-mvp/issues/`)
 * each fill in their slice.
 */
const KNOWN_COMMANDS = new Set([
  "listNewGameOptions",
  "compileCampaign",
  "inspectCampaign",
  "closeCampaign",
  "saveCampaign",
  "commitMonth",
  "generateBattle",
  "resolveBattle",
  "resolveTacticalBattle",
  "replayBattleBoundary",
  "loadCampaign",
  "verifyCampaign",
  "replayCampaign",
  "recoverCampaign",
  "inspectConstructionScreen",
  "submitConstructionCommand",
  "replaceConstructionCommand",
  "cancelConstructionCommand",
  "inspectFleetScreen",
  "submitMovementCommand",
  "replaceMovementCommand",
  "cancelMovementCommand",
]);

export async function dispatchCampaignCommand(
  command: string,
  _payload: unknown,
): Promise<BridgeResult<unknown>> {
  if (!KNOWN_COMMANDS.has(command)) {
    return {
      outcome: "error",
      reason: "UNKNOWN_COMMAND",
      diagnostics: [`No such campaign command: ${command}`],
    };
  }
  return {
    outcome: "error",
    reason: "NOT_IMPLEMENTED",
    diagnostics: [`${command} is not implemented yet (desktop-mvp ticket 11 scaffold).`],
  };
}
