import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CampaignSnapshot, CampaignState } from "@bluewave/campaign";
import { createEnvelope } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { clearCampaignSessionsForTest, registerCampaignSession } from "../campaignSessions.js";
import { compileProductionCampaign } from "../compiler.js";
import { clearPendingWorkspacesForTest } from "../pendingCommands.js";
import { toSaveableState } from "../saveHelpers.js";
import { commitMonth } from "./commitMonth.js";
import { inspectBudgetScreen, submitBudgetAllocation } from "./budgetCommands.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTION_PACK = resolve(__dirname, "../../../../..", "content", "production", "1880");
/**
 * Budget allocation (ADR-0060) against the real production pack: the engine's own
 * validator decides at issue time and only `commitMonth` mutates the nation.
 */
describe("budget allocation", () => {
  let saveRoot: string;

  beforeEach(() => {
    saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-budget-"));
  });
  afterEach(() => {
    rmSync(saveRoot, { recursive: true, force: true });
    clearCampaignSessionsForTest();
    clearPendingWorkspacesForTest();
  });

  function registerSession(sessionId: string): CampaignState {
    const collector = new DiagnosticCollector();
    const output = compileProductionCampaign(
      PRODUCTION_PACK,
      new AbortController().signal,
      collector,
    );
    expect(collector.hasErrors).toBe(false);
    if (!output) throw new Error("production pack failed to compile");
    const snapshot: CampaignSnapshot = structuredClone(output.state.snapshot);
    const state: CampaignState = {
      snapshot,
      envelope: createEnvelope("campaign-snapshot", snapshot.compatibilityVersion, snapshot),
      rawHash: "",
    };
    const saveable = toSaveableState(state);
    const saveDir = resolve(saveRoot, sessionId);
    new SaveStore().save(saveable, saveDir);
    registerCampaignSession({
      sessionId,
      saveDir,
      playerSlotId: "uk",
      campaignSeed: "a".repeat(32),
      month: { month: 1, year: 1880 },
      state: saveable,
    });
    return saveable;
  }

  const pay = (rate: number, research: number, over: { expectedRevision?: number } = {}) => ({
    sessionId: "b",
    expectedRevision: over.expectedRevision ?? 0,
    transportRequestId: `req-${rate}-${research}`,
    appropriationRateBp: rate,
    researchBudget: research,
  });

  it("projects the player's current allocation with the engine's bounds", async () => {
    registerSession("b");
    const result = await inspectBudgetScreen("b");
    if (result.outcome !== "success") throw new Error(result.reason);
    expect(result.value.appropriationRateBp).toBeGreaterThan(0);
    expect(result.value.bounds).toEqual({
      appropriationRateMinBp: 500,
      appropriationRateMaxBp: 5000,
      researchBudgetMin: 0,
      researchBudgetMax: 1000,
    });
  });

  it("rejects an out-of-range allocation with the engine's code and queues nothing", async () => {
    registerSession("b");
    const result = await submitBudgetAllocation(pay(9000, 10));
    expect(result).toMatchObject({ outcome: "rejected", reason: "INVALID_COMMAND_PAYLOAD" });
  });

  it("queues a valid allocation and the engine applies it when the month is committed", async () => {
    registerSession("b");
    const queued = await submitBudgetAllocation(pay(3000, 150));
    expect(queued).toMatchObject({
      outcome: "success",
      value: { bodyType: "SetBudgetAllocation", appliedOnNextTurn: true },
    });
    const committed = await commitMonth({
      sessionId: "b",
      expectedRevision: 0,
      transportRequestId: "commit-0",
    });
    expect(committed.outcome).toBe("success");
    const after = await inspectBudgetScreen("b");
    if (after.outcome !== "success") throw new Error(after.reason);
    expect(after.value.appropriationRateBp).toBe(3000);
    expect(after.value.researchBudget).toBe(150);
  });
});
