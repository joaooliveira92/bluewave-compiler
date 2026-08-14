import { z } from "zod";
import type { BridgeResult } from "../shared/bridge-contract.js";
import { CAMPAIGN_COMMAND_NAMES } from "../shared/campaign-command-contract.js";

/**
 * The `campaign:execute` command registry. Every command documented across
 * the desktop-mvp map (tickets 07-10) is listed here, even though none are
 * implemented yet (ticket 11's job is the scaffold, not the commands
 * themselves) — this is where tickets 12-16 (`.scratch/desktop-mvp/issues/`)
 * each fill in their slice. Command name is Zod-validated at this IPC
 * boundary (ENGINEERING-CONTRACT "Electron boundary"); per-command payload
 * schemas land with each command's real implementation, since there's no
 * real payload processing yet to validate against.
 */
const CommandNameSchema = z.enum(CAMPAIGN_COMMAND_NAMES);

export async function dispatchCampaignCommand(
  command: string,
  _payload: unknown,
): Promise<BridgeResult<unknown>> {
  const parsedCommand = CommandNameSchema.safeParse(command);
  if (!parsedCommand.success) {
    return {
      outcome: "error",
      reason: "UNKNOWN_COMMAND",
      diagnostics: [`No such campaign command: ${command}`],
    };
  }
  return {
    outcome: "error",
    reason: "NOT_IMPLEMENTED",
    diagnostics: [`${parsedCommand.data} is not implemented yet (desktop-mvp ticket 11 scaffold).`],
  };
}
