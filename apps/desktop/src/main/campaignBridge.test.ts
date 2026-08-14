import { describe, expect, it } from "vite-plus/test";
import { CAMPAIGN_COMMAND_NAMES } from "../shared/campaign-command-contract.js";
import { dispatchCampaignCommand } from "./campaignBridge.js";

const IMPLEMENTED_COMMANDS = new Set([
  "listNewGameOptions",
  "compileCampaign",
  "inspectCampaign",
  "commitMonth",
]);

describe("dispatchCampaignCommand", () => {
  it("rejects an unknown command name", async () => {
    const result = await dispatchCampaignCommand("notARealCommand", undefined);
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("UNKNOWN_COMMAND");
  });

  it("still returns NOT_IMPLEMENTED for every command outside ticket 12's scope", async () => {
    const outOfScope = CAMPAIGN_COMMAND_NAMES.filter((name) => !IMPLEMENTED_COMMANDS.has(name));
    expect(outOfScope.length).toBeGreaterThan(0);
    for (const command of outOfScope) {
      const result = await dispatchCampaignCommand(command, undefined);
      expect(result.outcome).toBe("error");
      if (result.outcome !== "error") continue;
      expect(result.reason).toBe("NOT_IMPLEMENTED");
    }
  });

  it("routes listNewGameOptions to the real handler against production content", async () => {
    const result = await dispatchCampaignCommand("listNewGameOptions", undefined);
    expect(result.outcome).toBe("success");
  });

  it("rejects a structurally invalid compileCampaign payload before touching the compiler", async () => {
    const result = await dispatchCampaignCommand("compileCampaign", { garbage: true });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("INVALID_PAYLOAD");
  });

  it("rejects a non-string inspectCampaign payload", async () => {
    const result = await dispatchCampaignCommand("inspectCampaign", { sessionId: 123 });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("INVALID_PAYLOAD");
  });

  it("returns SESSION_NOT_FOUND for a well-formed but unknown inspectCampaign session id", async () => {
    const result = await dispatchCampaignCommand("inspectCampaign", "no-such-session");
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("rejects a structurally invalid commitMonth payload", async () => {
    const result = await dispatchCampaignCommand("commitMonth", { sessionId: "s" });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("INVALID_PAYLOAD");
  });

  it("returns SESSION_NOT_FOUND for a well-formed but unknown commitMonth session id", async () => {
    const result = await dispatchCampaignCommand("commitMonth", {
      sessionId: "no-such-session",
      expectedRevision: 0,
      transportRequestId: "req-1",
    });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });
});
