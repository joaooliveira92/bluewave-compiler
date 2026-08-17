import { describe, expect, it } from "vite-plus/test";
import { CAMPAIGN_COMMAND_NAMES } from "../shared/campaign-command-contract.js";
import { dispatchCampaignCommand } from "./campaignBridge.js";

const IMPLEMENTED_COMMANDS = new Set([
  "listNewGameOptions",
  "compileCampaign",
  "inspectCampaign",
  "inspectOpeningBriefing",
  "inspectMap",
  "commitMonth",
  "inspectConstructionScreen",
  "submitConstructionCommand",
  "replaceConstructionCommand",
  "cancelConstructionCommand",
  "inspectFleetScreen",
  "inspectResearchScreen",
  "setResearchPriorityCommand",
  "inspectDiplomacyScreen",
  "submitDiplomacyCommand",
  "loadCampaign",
  "verifyCampaign",
  "replayCampaign",
  "recoverCampaign",
]);

describe("dispatchCampaignCommand", () => {
  it("rejects an unknown command name", async () => {
    const result = await dispatchCampaignCommand("notARealCommand", undefined);
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("UNKNOWN_COMMAND");
  });

  it("still returns NOT_IMPLEMENTED for every command outside the implemented set", async () => {
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

  it("rejects a non-string inspectMap payload", async () => {
    const result = await dispatchCampaignCommand("inspectMap", { sessionId: 123 });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("INVALID_PAYLOAD");
  });

  it("returns SESSION_NOT_FOUND for a well-formed but unknown inspectMap session id", async () => {
    const result = await dispatchCampaignCommand("inspectMap", "no-such-session");
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

  it("rejects structurally invalid construction payloads before touching the handlers", async () => {
    for (const command of [
      "submitConstructionCommand",
      "replaceConstructionCommand",
      "cancelConstructionCommand",
    ] as const) {
      const result = await dispatchCampaignCommand(command, { sessionId: "s" });
      expect(result.outcome).toBe("error");
      if (result.outcome !== "error") return;
      expect(result.reason).toBe("INVALID_PAYLOAD");
    }
  });

  it("returns SESSION_NOT_FOUND for well-formed construction payloads against an unknown session", async () => {
    const submit = await dispatchCampaignCommand("submitConstructionCommand", {
      sessionId: "no-such-session",
      designId: "des_gbr_inflexible",
      expectedRevision: 0,
      transportRequestId: "req-1",
    });
    expect(submit.outcome).toBe("error");
    if (submit.outcome !== "error") return;
    expect(submit.reason).toBe("SESSION_NOT_FOUND");

    const replace = await dispatchCampaignCommand("replaceConstructionCommand", {
      sessionId: "no-such-session",
      commandId: "cmd-x",
      designId: "des_gbr_inflexible",
      expectedRevision: 0,
      transportRequestId: "req-1",
    });
    expect(replace.outcome).toBe("error");
    if (replace.outcome !== "error") return;
    expect(replace.reason).toBe("SESSION_NOT_FOUND");

    const cancel = await dispatchCampaignCommand("cancelConstructionCommand", {
      sessionId: "no-such-session",
      commandId: "cmd-x",
      expectedRevision: 0,
      transportRequestId: "req-1",
    });
    expect(cancel.outcome).toBe("error");
    if (cancel.outcome !== "error") return;
    expect(cancel.reason).toBe("SESSION_NOT_FOUND");
  });

  it("returns SESSION_NOT_FOUND for inspectConstructionScreen without a session", async () => {
    const result = await dispatchCampaignCommand("inspectConstructionScreen", "no-such-session");
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("rejects a structurally invalid setResearchPriorityCommand payload before touching the handler", async () => {
    for (const payload of [
      { sessionId: "s" },
      {
        sessionId: "s",
        expectedRevision: 0,
        transportRequestId: "r",
        fieldPriorities: { GUNNERY: 1.5 },
      },
      { sessionId: "s", expectedRevision: 0, transportRequestId: "r", fieldPriorities: "high" },
    ]) {
      const result = await dispatchCampaignCommand("setResearchPriorityCommand", payload);
      expect(result.outcome).toBe("error");
      if (result.outcome !== "error") return;
      expect(result.reason).toBe("INVALID_PAYLOAD");
    }
  });

  it("returns SESSION_NOT_FOUND for a well-formed setResearchPriorityCommand against an unknown session", async () => {
    const result = await dispatchCampaignCommand("setResearchPriorityCommand", {
      sessionId: "no-such-session",
      expectedRevision: 0,
      transportRequestId: "req-1",
      fieldPriorities: { GUNNERY: 4 },
    });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("rejects a structurally invalid submitDiplomacyCommand payload before touching the handler", async () => {
    for (const payload of [
      { sessionId: "s" },
      {
        sessionId: "s",
        expectedRevision: 0,
        transportRequestId: "r",
        command: { type: "DeclareWar" }, // missing targetNationId
      },
      {
        sessionId: "s",
        expectedRevision: 0,
        transportRequestId: "r",
        command: { type: "NotACommand", targetNationId: "fra" },
      },
      {
        sessionId: "s",
        expectedRevision: 0,
        transportRequestId: "r",
        command: { type: "DeclareBlockade", targetNationId: "fra" }, // missing areaId
      },
    ]) {
      const result = await dispatchCampaignCommand("submitDiplomacyCommand", payload);
      expect(result.outcome).toBe("error");
      if (result.outcome !== "error") return;
      expect(result.reason).toBe("INVALID_PAYLOAD");
    }
  });

  it("returns SESSION_NOT_FOUND for a well-formed submitDiplomacyCommand against an unknown session", async () => {
    const result = await dispatchCampaignCommand("submitDiplomacyCommand", {
      sessionId: "no-such-session",
      expectedRevision: 0,
      transportRequestId: "req-1",
      command: { type: "DeclareWar", targetNationId: "france" },
    });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("returns SESSION_NOT_FOUND for inspectDiplomacyScreen without a session", async () => {
    const result = await dispatchCampaignCommand("inspectDiplomacyScreen", "no-such-session");
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("returns SESSION_NOT_FOUND for inspectResearchScreen without a session", async () => {
    const result = await dispatchCampaignCommand("inspectResearchScreen", "no-such-session");
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("rejects a non-string inspectOpeningBriefing payload", async () => {
    const result = await dispatchCampaignCommand("inspectOpeningBriefing", {
      sessionId: 123,
    });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("INVALID_PAYLOAD");
  });

  it("returns SESSION_NOT_FOUND for inspectOpeningBriefing without a session", async () => {
    const result = await dispatchCampaignCommand("inspectOpeningBriefing", "no-such-session");
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });
});
