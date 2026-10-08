import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CANONICAL_SCENARIO_IDS,
  type CampaignSnapshot,
  type CampaignState,
} from "@bluewave/campaign";
import { createEnvelope } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { readSessionMetadata, writeSessionMetadata } from "../campaignSessionMetadata.js";
import {
  clearCampaignSessionsForTest,
  getCampaignSession,
  registerCampaignSession,
} from "../campaignSessions.js";
import { compileProductionCampaign } from "../compiler.js";
import { clearPendingWorkspacesForTest, pendingEnvelopesForExecution } from "../pendingCommands.js";
import { toSaveableState } from "../saveHelpers.js";
import { commitMonth } from "./commitMonth.js";
import { inspectDivisionScreen, submitDivisionCommand } from "./divisionCommands.js";
import { closeCampaign, copyCampaign, saveCampaign } from "./sessionCommands.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTION_PACK = resolve(__dirname, "../../../../..", "content", "production", "1880");

describe("session commands (save / close / copy)", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(resolve(tmpdir(), "bw-desktop-session-"));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    clearCampaignSessionsForTest();
    clearPendingWorkspacesForTest();
  });

  function register(sessionId: string): { saveDir: string; state: CampaignState } {
    const collector = new DiagnosticCollector();
    const output = compileProductionCampaign(
      PRODUCTION_PACK,
      new AbortController().signal,
      collector,
    );
    if (!output) throw new Error("production pack failed to compile");
    const snapshot: CampaignSnapshot = structuredClone(output.state.snapshot);
    const state = toSaveableState({
      snapshot,
      envelope: createEnvelope("campaign-snapshot", snapshot.compatibilityVersion, snapshot),
      rawHash: "",
    });
    const saveDir = resolve(root, sessionId);
    new SaveStore().save(state, saveDir);
    writeSessionMetadata(saveDir, {
      schemaVersion: "session_meta_v1",
      scenarioId: CANONICAL_SCENARIO_IDS[0]!,
      playerSlotId: "uk",
      campaignSeed: "a".repeat(32),
    });
    registerCampaignSession({
      sessionId,
      saveDir,
      playerSlotId: "uk",
      campaignSeed: "a".repeat(32),
      month: { month: 1, year: 1880 },
      state,
    });
    return { saveDir, state };
  }

  const savesIn = (dir: string) => new SaveStore().list(dir).length;

  describe("saveCampaign", () => {
    it("fails honestly for an unknown session", async () => {
      expect(await saveCampaign("nope")).toMatchObject({
        outcome: "error",
        reason: "SESSION_NOT_FOUND",
      });
    });

    it("is a no-op when the package already holds the current turn — safe to click repeatedly", async () => {
      const { saveDir } = register("s1");
      expect(savesIn(saveDir)).toBe(1);
      for (let i = 0; i < 3; i++) {
        expect(await saveCampaign("s1")).toMatchObject({
          outcome: "success",
          value: { revision: 0 },
        });
      }
      expect(savesIn(saveDir)).toBe(1);
    });

    it("re-writes the package when it is missing", async () => {
      const { saveDir } = register("s2");
      rmSync(saveDir, { recursive: true, force: true });
      expect(existsSync(saveDir)).toBe(false);
      expect(await saveCampaign("s2")).toMatchObject({
        outcome: "success",
        value: { revision: 0 },
      });
      expect(savesIn(saveDir)).toBe(1);
    });

    it("reports the new revision after a month is committed, without duplicating the save", async () => {
      const { saveDir } = register("s3");
      const committed = await commitMonth({
        sessionId: "s3",
        expectedRevision: 0,
        transportRequestId: "c1",
      });
      expect(committed.outcome).toBe("success");
      const before = savesIn(saveDir);
      expect(await saveCampaign("s3")).toMatchObject({
        outcome: "success",
        value: { revision: 1 },
      });
      expect(savesIn(saveDir)).toBe(before);
    });
  });

  describe("closeCampaign", () => {
    it("removes the session and drops its queued, uncommitted commands", async () => {
      register("c1");
      // Queue a real command so there is something to discard.
      const view = await inspectDivisionScreen("c1");
      if (view.outcome !== "success") throw new Error("inspect failed");
      const queued = await submitDivisionCommand({
        sessionId: "c1",
        expectedRevision: 0,
        transportRequestId: "r1",
        command: {
          type: "CreateDivision",
          flagshipShipId: view.value.unassignedShips[0]!.shipId,
          role: "CORE",
          formation: "LINE_AHEAD",
        },
      });
      expect(queued.outcome).toBe("success");
      const snapshot = getCampaignSession("c1")!.state.snapshot;
      expect(pendingEnvelopesForExecution("c1", snapshot)).toHaveLength(1);

      expect(await closeCampaign("c1")).toMatchObject({
        outcome: "success",
        value: { closed: true },
      });
      expect(getCampaignSession("c1")).toBeUndefined();
      expect(pendingEnvelopesForExecution("c1", snapshot)).toEqual([]);
    });

    it("answers SESSION_NOT_FOUND the second time (the shell treats that as already closed)", async () => {
      register("c2");
      await closeCampaign("c2");
      expect(await closeCampaign("c2")).toMatchObject({
        outcome: "error",
        reason: "SESSION_NOT_FOUND",
      });
    });
  });

  describe("copyCampaign", () => {
    it("writes a loadable copy with the session sidecar, leaving the original untouched", async () => {
      const { saveDir, state } = register("k1");
      const copyDir = resolve(root, "the-copy");
      const result = await copyCampaign("k1", { chooseCopyDirectory: async () => copyDir });
      expect(result).toMatchObject({
        outcome: "success",
        value: { revision: 0, location: copyDir },
      });

      expect(savesIn(copyDir)).toBe(1);
      expect(readSessionMetadata(copyDir)).toMatchObject({ playerSlotId: "uk" });
      const loaded = new SaveStore().load(copyDir, new DiagnosticCollector());
      expect(loaded).not.toBeNull();
      expect(Number(loaded!.snapshot.turnNumber)).toBe(Number(state.snapshot.turnNumber));
      expect(savesIn(saveDir)).toBe(1);
      expect(getCampaignSession("k1")?.saveDir).toBe(saveDir);
    });

    it("does nothing when the player cancels the dialog", async () => {
      register("k2");
      const result = await copyCampaign("k2", { chooseCopyDirectory: async () => null });
      expect(result).toMatchObject({ outcome: "rejected", reason: "SAVE_LOCATION_CANCELLED" });
    });

    it("refuses to copy a campaign onto itself", async () => {
      const { saveDir } = register("k3");
      const result = await copyCampaign("k3", { chooseCopyDirectory: async () => saveDir });
      expect(result).toMatchObject({ outcome: "rejected", reason: "COPY_TARGET_IS_SOURCE" });
      expect(savesIn(saveDir)).toBe(1);
    });

    it("fails honestly for an unknown session without asking the player anything", async () => {
      let asked = false;
      const result = await copyCampaign("nope", {
        chooseCopyDirectory: async () => {
          asked = true;
          return null;
        },
      });
      expect(result).toMatchObject({ outcome: "error", reason: "SESSION_NOT_FOUND" });
      expect(asked).toBe(false);
    });
  });
});
