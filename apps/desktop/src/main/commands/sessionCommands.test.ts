import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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
import { compileProductionCampaignFromArtifact } from "../compiler.js";
import { clearPendingWorkspacesForTest, pendingEnvelopesForExecution } from "../pendingCommands.js";
import { toSaveableState } from "../saveHelpers.js";
import { commitMonth } from "./commitMonth.js";
import { inspectDivisionScreen, submitDivisionCommand } from "./divisionCommands.js";
import {
  clearConstructionWorkspacesForTest,
  getConstructionWorkspace,
  hasConstructionWorkspace,
} from "../constructionWorkspace.js";
import { assessCopyTarget, closeCampaign, copyCampaign, saveCampaign } from "./sessionCommands.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED_ARTIFACT = resolve(__dirname, "../../../../..", "content", "generated", "1880");

describe("session commands (save / close / copy)", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(resolve(tmpdir(), "bw-desktop-session-"));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    clearCampaignSessionsForTest();
    clearPendingWorkspacesForTest();
    clearConstructionWorkspacesForTest();
  });

  function register(sessionId: string): { saveDir: string; state: CampaignState } {
    const collector = new DiagnosticCollector();
    const output = compileProductionCampaignFromArtifact(
      GENERATED_ARTIFACT,
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

    it("notices a package that differs from the live state within the SAME turn, and fixes it once", async () => {
      const { saveDir, state } = register("s4");
      // Same turn, different content: the package was altered after the session opened.
      const altered = structuredClone(state.snapshot);
      const uk = altered.nations.get("uk")!;
      altered.nations.set("uk", {
        ...uk,
        treasury: (Number(uk.treasury) + 1) as typeof uk.treasury,
      });
      new SaveStore().save(
        toSaveableState({
          snapshot: altered,
          envelope: createEnvelope("campaign-snapshot", altered.compatibilityVersion, altered),
          rawHash: "",
        }),
        saveDir,
      );
      expect(savesIn(saveDir)).toBe(2);

      expect(await saveCampaign("s4")).toMatchObject({
        outcome: "success",
        value: { revision: 0 },
      });
      expect(savesIn(saveDir)).toBe(3);
      // Now the package matches the live state again: further clicks write nothing.
      await saveCampaign("s4");
      expect(savesIn(saveDir)).toBe(3);
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

    it("also drops the session's construction workspace (it used to leak)", async () => {
      register("c3");
      getConstructionWorkspace(getCampaignSession("c3")!);
      expect(hasConstructionWorkspace("c3")).toBe(true);
      await closeCampaign("c3");
      expect(hasConstructionWorkspace("c3")).toBe(false);
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

    describe("target safety", () => {
      const ask = (target: string) => ({ chooseCopyDirectory: async () => target });

      it("refuses another spelling of the source folder (trailing slash, ./, symlink)", async () => {
        const { saveDir } = register("t1");
        for (const spelled of [`${saveDir}/`, `${saveDir}/../t1`, `${saveDir}/.`]) {
          expect(await copyCampaign("t1", ask(spelled))).toMatchObject({
            outcome: "rejected",
            reason: "COPY_TARGET_IS_SOURCE",
          });
        }
        const link = resolve(root, "link-to-t1");
        symlinkSync(saveDir, link);
        expect(await copyCampaign("t1", ask(link))).toMatchObject({
          outcome: "rejected",
          reason: "COPY_TARGET_IS_SOURCE",
        });
        expect(savesIn(saveDir)).toBe(1);
      });

      it("refuses a target inside the source, or a folder that contains the source", async () => {
        const { saveDir } = register("t2");
        expect(await copyCampaign("t2", ask(resolve(saveDir, "nested")))).toMatchObject({
          outcome: "rejected",
          reason: "COPY_TARGET_INSIDE_SOURCE",
        });
        expect(await copyCampaign("t2", ask(root))).toMatchObject({
          outcome: "rejected",
          reason: "COPY_TARGET_CONTAINS_SOURCE",
        });
        expect(existsSync(resolve(saveDir, "nested"))).toBe(false);
      });

      it("never merges into another campaign's package or overwrites its session file", async () => {
        register("t3");
        const other = register("t3-other");
        const before = readSessionMetadata(other.saveDir);
        const result = await copyCampaign("t3", ask(other.saveDir));
        expect(result).toMatchObject({ outcome: "rejected", reason: "COPY_TARGET_NOT_EMPTY" });
        expect(savesIn(other.saveDir)).toBe(1);
        expect(readSessionMetadata(other.saveDir)).toEqual(before);
      });

      it("accepts an existing EMPTY folder, and refuses a file", async () => {
        register("t4");
        const empty = resolve(root, "empty");
        mkdirSync(empty);
        expect(await copyCampaign("t4", ask(empty))).toMatchObject({ outcome: "success" });
        expect(savesIn(empty)).toBe(1);

        const file = resolve(root, "a-file");
        writeFileSync(file, "x");
        expect(await copyCampaign("t4", ask(file))).toMatchObject({
          outcome: "rejected",
          reason: "COPY_TARGET_NOT_A_DIRECTORY",
        });
      });

      it("refuses, before asking anything, when the campaign has no session file to carry over", async () => {
        const { saveDir } = register("t5");
        rmSync(resolve(saveDir, "session.json"));
        let asked = false;
        const result = await copyCampaign("t5", {
          chooseCopyDirectory: async () => {
            asked = true;
            return resolve(root, "x");
          },
        });
        expect(result).toMatchObject({ outcome: "error", reason: "SESSION_METADATA_MISSING" });
        expect(asked).toBe(false);
        expect(existsSync(resolve(root, "x"))).toBe(false);
      });

      it("assessCopyTarget accepts a brand-new sibling folder", () => {
        const { saveDir } = register("t6");
        expect(assessCopyTarget(saveDir, resolve(root, "brand-new"))).toBeNull();
      });
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
