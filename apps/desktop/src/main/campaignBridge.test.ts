import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { describe, expect, it, beforeEach, afterEach } from "vite-plus/test";
import { CAMPAIGN_COMMAND_NAMES } from "../shared/campaign-command-contract.js";
import { dispatchCampaignCommand } from "./campaignBridge.js";
import { clearCampaignSessionsForTest, registerCampaignSession } from "./campaignSessions.js";
import { compileProductionCampaign } from "./compiler.js";
import { toSaveableState } from "./saveHelpers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

const IMPLEMENTED_COMMANDS = new Set([
  // Tactical Sandbox (ADR-0057): routed, but debug-gated inside the handler.
  "generateBattle",
  "resolveBattle",
  "resolveTacticalBattle",
  "replayBattleBoundary",
  "listNewGameOptions",
  "compileCampaign",
  "inspectCampaign",
  "inspectOpeningBriefing",
  "inspectMap",
  "inspectBattleHistory",
  "inspectPriorities",
  "commitMonth",
  "inspectConstructionScreen",
  "submitConstructionCommand",
  "replaceConstructionCommand",
  "cancelConstructionCommand",
  "inspectFleetScreen",
  "inspectResearchScreen",
  "setResearchPriorityCommand",
  "inspectDiplomacyScreen",
  "inspectDivisionScreen",
  "copyCampaign",
  "saveCampaign",
  "closeCampaign",
  "submitDivisionCommand",
  "inspectBudgetScreen",
  "submitMovementCommand",
  "replaceMovementCommand",
  "cancelMovementCommand",
  "submitBudgetAllocation",
  "submitDiplomacyCommand",
  "readUiState",
  "writeUiState",
  "loadCampaign",
  "listCampaigns",
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
    for (const command of outOfScope) {
      const result = await dispatchCampaignCommand(command, undefined);
      expect(result.outcome).toBe("error");
      if (result.outcome !== "error") continue;
      expect(result.reason).toBe("NOT_IMPLEMENTED");
    }
  });

  it("rejects malformed Tactical Sandbox payloads before touching the engine", async () => {
    for (const [command, payload] of [
      ["generateBattle", { sessionId: "s" }],
      ["generateBattle", { sessionId: "s", warId: "w", strengthScale: 0 }],
      ["resolveBattle", { sessionId: "s" }],
      [
        "resolveTacticalBattle",
        { sessionId: "s", battleId: "b", turnCount: 0, scriptedOrders: [] },
      ],
      ["replayBattleBoundary", {}],
    ] as const) {
      const result = await dispatchCampaignCommand(command, payload);
      expect(result).toMatchObject({ outcome: "error", reason: "INVALID_PAYLOAD" });
    }
  });

  it("answers valid Tactical Sandbox commands with DEBUG_ONLY outside a debug build (R4)", async () => {
    for (const [command, payload] of [
      ["generateBattle", { sessionId: "s", warId: "w" }],
      ["resolveBattle", { sessionId: "s", battleId: "b" }],
      [
        "resolveTacticalBattle",
        { sessionId: "s", battleId: "b", turnCount: 1, scriptedOrders: [] },
      ],
      ["replayBattleBoundary", { sessionId: "s", battleId: "b" }],
    ] as const) {
      const result = await dispatchCampaignCommand(command, payload);
      expect(result).toMatchObject({ outcome: "rejected", reason: "DEBUG_ONLY" });
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

  it("rejects a non-string inspectBattleHistory payload", async () => {
    const result = await dispatchCampaignCommand("inspectBattleHistory", { sessionId: 123 });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("INVALID_PAYLOAD");
  });

  it("returns SESSION_NOT_FOUND for an unknown inspectBattleHistory session id", async () => {
    const result = await dispatchCampaignCommand("inspectBattleHistory", "no-such-session");
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

  it("rejects a non-string readUiState payload", async () => {
    const result = await dispatchCampaignCommand("readUiState", { sessionId: 123 });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("INVALID_PAYLOAD");
  });

  it("returns SESSION_NOT_FOUND for readUiState without a session", async () => {
    const result = await dispatchCampaignCommand("readUiState", "no-such-session");
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("rejects structurally invalid writeUiState payloads before touching the handler", async () => {
    const longFingerprint = "f".repeat(257);
    const oversizedArray = Array.from({ length: 65 }, (_, i) => `fp-${i}`);
    for (const payload of [
      { sessionId: "s" }, // missing dismissedFingerprints
      { sessionId: "s", dismissedFingerprints: "high" }, // not an array
      { sessionId: "s", dismissedFingerprints: [123] }, // non-string fingerprint
      { sessionId: "s", dismissedFingerprints: [longFingerprint] }, // fingerprint > 256 chars
      { sessionId: "s", dismissedFingerprints: oversizedArray }, // array > 64 entries
      {
        sessionId: "s",
        dismissedFingerprints: [],
        firstMonthInspection: { status: "in_progress" }, // missing lastCompletedStep
      },
      {
        sessionId: "s",
        dismissedFingerprints: [],
        firstMonthInspection: { status: "paused", lastCompletedStep: 0 }, // unknown status
      },
      {
        sessionId: "s",
        dismissedFingerprints: [],
        firstMonthInspection: { status: "completed", lastCompletedStep: 7 }, // > 6 steps
      },
      {
        sessionId: "s",
        dismissedFingerprints: [],
        firstMonthInspection: { status: "completed", lastCompletedStep: -1 }, // negative
      },
    ]) {
      const result = await dispatchCampaignCommand("writeUiState", payload);
      expect(result.outcome).toBe("error");
      if (result.outcome !== "error") return;
      expect(result.reason).toBe("INVALID_PAYLOAD");
    }
  });

  it("returns SESSION_NOT_FOUND for a well-formed writeUiState against an unknown session", async () => {
    const result = await dispatchCampaignCommand("writeUiState", {
      sessionId: "no-such-session",
      dismissedFingerprints: ["fp-1"],
      firstMonthInspection: { status: "in_progress", lastCompletedStep: 1 },
    });
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  describe("ui-state dispatch happy paths", () => {
    let saveRoot: string;
    let sessionId: string;
    let saveDir: string;

    beforeEach(() => {
      sessionId = "session-dispatch";
      saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-bridge-ui-state-"));
      saveDir = resolve(saveRoot, "save");
      const signal = new AbortController().signal;
      const collector = new DiagnosticCollector();
      const output = compileProductionCampaign(PRODUCTION_PACK, signal, collector);
      if (!output) throw new Error("production pack failed to compile");
      const state = toSaveableState(output.state);
      new SaveStore().save(state, saveDir);
      registerCampaignSession({
        sessionId,
        saveDir,
        playerSlotId: "uk",
        campaignSeed: "a".repeat(32),
        month: { month: 1, year: 1880 },
        state,
      });
    });

    afterEach(() => {
      rmSync(saveRoot, { recursive: true, force: true });
      clearCampaignSessionsForTest();
    });

    it("writeUiState round-trips through the dispatch boundary", async () => {
      const write = await dispatchCampaignCommand("writeUiState", {
        sessionId,
        dismissedFingerprints: ["fp-1"],
        firstMonthInspection: { status: "in_progress", lastCompletedStep: 2 },
      });
      expect(write.outcome).toBe("success");
      if (write.outcome !== "success") return;

      const read = await dispatchCampaignCommand("readUiState", sessionId);
      expect(read.outcome).toBe("success");
      if (read.outcome !== "success") return;
      expect(read.value).toEqual(write.value);
    });
  });
});
