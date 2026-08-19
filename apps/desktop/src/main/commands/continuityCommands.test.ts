import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import type { CampaignConfiguration } from "@bluewave/campaign-engine";
import { compileProductionCampaign } from "../compiler.js";
import { clearCampaignSessionsForTest, getCampaignSession } from "../campaignSessions.js";
import { clearConstructionWorkspacesForTest } from "../constructionWorkspace.js";
import { toSaveableState } from "../saveHelpers.js";
import { commitMonth } from "./commitMonth.js";
import { compileCampaign, type CompileCampaignDeps } from "./compileCampaign.js";
import { submitConstructionCommand } from "./constructionCommands.js";
import {
  listCampaigns,
  loadCampaign,
  recoverCampaign,
  replayCampaign,
  verifyCampaign,
  type ContinuityDeps,
} from "./continuityCommands.js";
import { inspectCampaign } from "./inspectCampaign.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

/**
 * Desktop-mvp ticket 16 acceptance tests. Every test drives the real
 * production pack through the full vertical slice — the actual commands,
 * not stubs: compile -> save -> commit a month -> "close and reopen the
 * app" (main-process in-memory state cleared, the disk package untouched)
 * -> load / verify / replay / recover against the package on disk.
 */

function baseConfiguration(overrides: Partial<CampaignConfiguration> = {}): CampaignConfiguration {
  return {
    scenarioId: "scen_1880",
    playerSlotId: "uk",
    continuityModeId: "historical",
    fleetSizeSettingId: "standard",
    researchSpeedSettingId: "standard",
    technologyVariationSettingId: "none",
    historicalBudgetOptionId: "standard",
    legacyFleetModeId: "historical",
    tacticalRealismModeId: "standard",
    difficultyProfileId: "easy",
    campaignSeed: "a".repeat(32),
    configurationSchemaVersion: "campaign_configuration_v1",
    ...overrides,
  } as CampaignConfiguration;
}

describe("campaign continuance commands (save, load, verify, replay, recover)", () => {
  let saveRoot: string;
  let nextSessionOrdinal: number;

  beforeEach(() => {
    saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-continuity-"));
    nextSessionOrdinal = 0;
  });

  afterEach(() => {
    rmSync(saveRoot, { recursive: true, force: true });
    clearCampaignSessionsForTest();
    clearConstructionWorkspacesForTest();
  });

  function randomTransportRequestId(): string {
    return `req-${nextSessionOrdinal++}-${Math.random().toString(36).slice(2)}`;
  }

  function compileDeps(saveDir: string): CompileCampaignDeps {
    return {
      contentDir: PRODUCTION_PACK,
      chooseSaveDirectory: async () => saveDir,
      generateSessionId: () => `compile-${nextSessionOrdinal++}`,
    };
  }

  function continuityDeps(saveDir: string): ContinuityDeps {
    return {
      choosePackageDirectory: async () => saveDir,
      generateSessionId: () => `loaded-${nextSessionOrdinal++}`,
    };
  }

  /** Compile the real production pack through the real `compileCampaign`
   * command (writes the SaveStore package + session.json sidecar). */
  async function compileAndSave(saveDir: string): Promise<string> {
    const result = await compileCampaign(baseConfiguration(), compileDeps(saveDir));
    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") throw new Error("fixture compile failed");
    return result.value.sessionId;
  }

  async function advanceOneMonth(sessionId: string, expectedRevision: number): Promise<void> {
    const result = await commitMonth({
      sessionId,
      expectedRevision,
      transportRequestId: randomTransportRequestId(),
    });
    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") throw new Error("fixture commitMonth failed");
  }

  /** Simulates closing and reopening the app: in-memory session/workspace
   *  state is wiped; the package on disk is untouched. */
  function restartApp(): void {
    clearCampaignSessionsForTest();
    clearConstructionWorkspacesForTest();
  }

  /**
   * Deliberately corrupt a save's `campaign.json`. The tamper targets a
   * hash-covered scalar (`campaignId`) because `SaveStore`'s own integrity
   * envelope hashes with `canonicalSerialize`, which collapses runtime
   * Maps to `{}` — values inside Map-backed fields like `nations`
   * (`treasury` etc.) are NOT covered by the package hash today (flagged to
   * the orchestrator in this ticket's report; ticket 05's replay helper
   * *does* cover them, so the replay tests below additionally tamper a
   * treasury to prove replay catches what load can't).
   */
  function corruptActiveSave(saveDir: string): void {
    const pointer = JSON.parse(readFileSync(join(saveDir, "pointer.json"), "utf8")) as {
      activeSaveId: string;
    };
    const campaignPath = join(saveDir, pointer.activeSaveId, "campaign.json");
    const parsed = JSON.parse(readFileSync(campaignPath, "utf8")) as {
      snapshot?: { campaignId?: string; nations?: Record<string, { treasury?: number }> };
    };
    if (typeof parsed.snapshot?.campaignId !== "string") {
      throw new Error("fixture: expected a campaignId string in the storable snapshot");
    }
    parsed.snapshot.campaignId = `${parsed.snapshot.campaignId}-tampered`;
    writeFileSync(campaignPath, JSON.stringify(parsed));
  }

  /** Corrupts a value inside a Map-backed field (a treasury) — today only
   *  replay's Map-aware subset-hash catches this, SaveStore's load does not. */
  function corruptNationTreasury(saveDir: string): void {
    const pointer = JSON.parse(readFileSync(join(saveDir, "pointer.json"), "utf8")) as {
      activeSaveId: string;
    };
    const campaignPath = join(saveDir, pointer.activeSaveId, "campaign.json");
    const parsed = JSON.parse(readFileSync(campaignPath, "utf8")) as {
      snapshot?: { nations?: Record<string, { treasury?: number }> };
    };
    const uk = parsed.snapshot?.nations?.["uk"];
    if (uk === undefined || typeof uk.treasury !== "number") {
      throw new Error("fixture: expected a numeric uk treasury in the storable snapshot");
    }
    uk.treasury = uk.treasury + 1;
    writeFileSync(campaignPath, JSON.stringify(parsed));
  }

  // -------------------------------------------------------------------------
  // Acceptance 1: load restores real state after closing and reopening
  // -------------------------------------------------------------------------

  it("closing and reopening the app, then loading the saved package, restores real state (not a fresh/empty campaign)", async () => {
    const saveDir = resolve(saveRoot, "save-a");
    const compileSessionId = await compileAndSave(saveDir);

    const compiled = getCampaignSession(compileSessionId)!;
    const initialTreasury = Number(compiled.state.snapshot.nations.get("uk")!.treasury);

    // Advance one strategic month so the saved package is no longer in its
    // initial state — this is the "real state" a restart must restore.
    await advanceOneMonth(compileSessionId, 0);

    // Close and reopen the app.
    restartApp();

    const load = await loadCampaign(continuityDeps(saveDir));
    expect(load.outcome).toBe("success");
    if (load.outcome !== "success") return;
    expect(load.value.packagePath).toBe(saveDir);
    expect(load.value.activeRevision).toBe(1);
    expect(load.value.campaignIdentity.length).toBeGreaterThan(0);

    // Opening the restored session shows real post-commit state — a changed
    // treasury, the advanced month, a real fleet — not a fresh campaign.
    const open = await inspectCampaign(load.value.sessionId);
    expect(open.outcome).toBe("success");
    if (open.outcome !== "success") return;
    const projection = open.value.projection;
    expect(projection.month).toEqual({ month: 2, year: 1880 });
    expect(projection.revision).toBe(1);
    expect(projection.economy.treasury).not.toBe(initialTreasury);
    expect(projection.economy.treasury).toBe(
      Number(getCampaignSession(load.value.sessionId)!.state.snapshot.nations.get("uk")!.treasury),
    );
    expect(projection.fleet.length).toBeGreaterThan(0);

    // And the restored session is genuinely continuable: the next month
    // commits against the restored revision/seed.
    await advanceOneMonth(load.value.sessionId, 1);
    const after = getCampaignSession(load.value.sessionId)!;
    expect(Number(after.state.snapshot.turnNumber)).toBe(2);
    expect(after.month).toEqual({ month: 3, year: 1880 });
  });

  // -------------------------------------------------------------------------
  // Acceptance 2: verify reports a real pass/fail against hash/envelope
  // -------------------------------------------------------------------------

  it("verify reports a real pass on a good package and a real fail on a corrupted one", async () => {
    const saveDir = resolve(saveRoot, "save-b");
    await compileAndSave(saveDir);

    const good = await verifyCampaign(continuityDeps(saveDir));
    expect(good.outcome).toBe("success");
    if (good.outcome !== "success") return;
    expect(good.value.valid).toBe(true);
    expect(good.value.issues).toEqual([]);
    expect(good.value.activeRevision).toBe(0);
    expect(good.value.campaignIdentity.length).toBeGreaterThan(0);

    corruptActiveSave(saveDir);

    const bad = await verifyCampaign(continuityDeps(saveDir));
    expect(bad.outcome).toBe("success");
    if (bad.outcome !== "success") return;
    expect(bad.value.valid).toBe(false);
    expect(bad.value.issues.length).toBeGreaterThan(0);
    // Still identifiable via the package's own metadata.json even though the
    // state envelope failed.
    expect(bad.value.campaignIdentity.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Acceptance 3: replay reconstructs the command history deterministically
  // -------------------------------------------------------------------------

  it("replay reconstructs the executed months and confirms a matching deterministic hash", async () => {
    const saveDir = resolve(saveRoot, "save-c");
    const compileSessionId = await compileAndSave(saveDir);
    await advanceOneMonth(compileSessionId, 0);
    await advanceOneMonth(compileSessionId, 1);

    restartApp();

    const replay = await replayCampaign(continuityDeps(saveDir));
    expect(replay.outcome).toBe("success");
    if (replay.outcome !== "success") return;
    expect(replay.value.matched).toBe(true);
    expect(replay.value.revisions).toHaveLength(2);
    for (const revision of replay.value.revisions) {
      expect(revision.matched).toBe(true);
      expect(revision.expectedHash).toBe(revision.actualHash);
      expect(revision.expectedHash.length).toBeGreaterThan(0);
    }
  });

  it("replay reports a mismatch (not a confident pass) when the persisted history was tampered with", async () => {
    const saveDir = resolve(saveRoot, "save-d");
    const compileSessionId = await compileAndSave(saveDir);
    await advanceOneMonth(compileSessionId, 0);

    restartApp();

    // Replay's Map-aware subset hash catches a treasury tamper that
    // `SaveStore.load`'s own envelope can't see (Maps collapse to `{}`
    // under canonicalSerialize) — replay reports a mismatch all the same.
    corruptNationTreasury(saveDir);

    const replay = await replayCampaign(continuityDeps(saveDir));
    expect(replay.outcome).toBe("success");
    if (replay.outcome !== "success") return;
    expect(replay.value.matched).toBe(false);
    expect(replay.value.revisions.some((r) => !r.matched)).toBe(true);
  });

  it("a never-advanced campaign replays trivially with zero revisions", async () => {
    const saveDir = resolve(saveRoot, "save-e");
    await compileAndSave(saveDir);

    restartApp();

    const replay = await replayCampaign(continuityDeps(saveDir));
    expect(replay.outcome).toBe("success");
    if (replay.outcome !== "success") return;
    expect(replay.value.matched).toBe(true);
    expect(replay.value.revisions).toEqual([]);
  });

  it("replay picks the truly-newest save per revision even when same-revision saves share a timestamp (F6)", async () => {
    const saveDir = resolve(saveRoot, "save-f6");
    const compileSessionId = await compileAndSave(saveDir);

    // An extra same-revision save: queue a construction order after compile —
    // both are revision 0, so the NEWER one must be the pre-month snapshot
    // for the month that follows. Replaying against the compile save would
    // report a false mismatch, because the order's queued project would be
    // missing from the replayed closing state.
    const submit = await submitConstructionCommand({
      sessionId: compileSessionId,
      designId: "des_gbr_inflexible",
      expectedRevision: 0,
      transportRequestId: "req-f6-submit",
    });
    expect(submit.outcome).toBe("success");
    if (submit.outcome !== "success") return;

    // Force both revision-0 saves onto the same millisecond so the pick
    // rests solely on the deterministic ordering (timestamp -> save chain ->
    // saveId), never on the OS directory listing order.
    const sharedTimestamp = "1970-01-01T00:00:00.000Z";
    const turnZeroSaves = new SaveStore().list(saveDir).filter((m) => m.turnNumber === 0);
    expect(turnZeroSaves.length).toBe(2);
    for (const meta of turnZeroSaves) {
      const metaPath = join(saveDir, meta.saveId, "metadata.json");
      const parsed = JSON.parse(readFileSync(metaPath, "utf8")) as { timestamp: string };
      parsed.timestamp = sharedTimestamp;
      writeFileSync(metaPath, JSON.stringify(parsed, null, 2), "utf8");
    }

    await advanceOneMonth(compileSessionId, 0);

    restartApp();

    const replay = await replayCampaign(continuityDeps(saveDir));
    expect(replay.outcome).toBe("success");
    if (replay.outcome !== "success") return;
    expect(replay.value.matched).toBe(true);
    expect(replay.value.revisions).toHaveLength(1);
    expect(replay.value.revisions[0]!.matched).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Acceptance 4: recover runs against a deliberately corrupted save
  // -------------------------------------------------------------------------

  it("recover reverts a deliberately corrupted active save to its predecessor and reports the real outcome", async () => {
    const saveDir = resolve(saveRoot, "save-f");
    const compileSessionId = await compileAndSave(saveDir);
    await advanceOneMonth(compileSessionId, 0);

    restartApp();

    corruptActiveSave(saveDir);

    // Loading the corrupt package honestly fails before recovery.
    const failed = await loadCampaign(continuityDeps(saveDir));
    expect(failed.outcome).toBe("error");
    if (failed.outcome === "error") expect(failed.reason).toBe("LOAD_FAILED");

    const rec = await recoverCampaign(continuityDeps(saveDir));
    expect(rec.outcome).toBe("success");
    if (rec.outcome !== "success") return;
    expect(rec.value.recovered).toBe(true);
    expect(rec.value.activeRevision).toBe(0);
    expect(rec.value.notes.length).toBeGreaterThan(0);

    // The reverted package loads cleanly and restores the pre-corruption
    // (initial) state.
    const loaded = await loadCampaign(continuityDeps(saveDir));
    expect(loaded.outcome).toBe("success");
    if (loaded.outcome !== "success") return;
    expect(loaded.value.activeRevision).toBe(0);

    const open = await inspectCampaign(loaded.value.sessionId);
    expect(open.outcome).toBe("success");
    if (open.outcome !== "success") return;
    expect(open.value.projection.month).toEqual({ month: 1, year: 1880 });
  });

  it("recover leaves a healthy package untouched (no needless revert)", async () => {
    const saveDir = resolve(saveRoot, "save-g");
    await compileAndSave(saveDir);

    const rec = await recoverCampaign(continuityDeps(saveDir));
    expect(rec.outcome).toBe("success");
    if (rec.outcome !== "success") return;
    expect(rec.value.recovered).toBe(false);
    expect(rec.value.activeRevision).toBe(0);
    expect(rec.value.notes.some((n) => n.includes("no recovery"))).toBe(true);

    // The untouched package still loads at its full state.
    const load = await loadCampaign(continuityDeps(saveDir));
    expect(load.outcome).toBe("success");
    if (load.outcome !== "success") return;
    expect(load.value.activeRevision).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Edge cases: cancellation and missing sidecar metadata
  // -------------------------------------------------------------------------

  it("every command reports PACKAGE_SELECTION_CANCELLED when the dialog is cancelled", async () => {
    const cancelledDeps: ContinuityDeps = {
      choosePackageDirectory: async () => null,
      generateSessionId: () => "never",
    };
    for (const run of [
      () => loadCampaign(cancelledDeps),
      () => verifyCampaign(cancelledDeps),
      () => replayCampaign(cancelledDeps),
      () => recoverCampaign(cancelledDeps),
    ]) {
      const result = await run();
      expect(result.outcome).toBe("rejected");
      if (result.outcome === "rejected") expect(result.reason).toBe("PACKAGE_SELECTION_CANCELLED");
    }
  });

  it("rejects a package with no session.json sidecar (cannot restore a real session)", async () => {
    // A valid SaveStore package WITHOUT the sidecar — how packages existed
    // before the continuance work. load/replay refuse because the player
    // slot / seed / scenario cannot be reconstructed.
    const saveDir = resolve(saveRoot, "save-h");
    const collector = new DiagnosticCollector();
    const output = compileProductionCampaign(
      PRODUCTION_PACK,
      new AbortController().signal,
      collector,
    );
    expect(collector.hasErrors).toBe(false);
    if (!output) throw new Error("production pack failed to compile");
    new SaveStore().save(toSaveableState(output.state), saveDir);

    const load = await loadCampaign(continuityDeps(saveDir));
    expect(load.outcome).toBe("error");
    if (load.outcome === "error") expect(load.reason).toBe("SESSION_METADATA_MISSING");

    const replay = await replayCampaign(continuityDeps(saveDir));
    expect(replay.outcome).toBe("error");
    if (replay.outcome === "error") expect(replay.reason).toBe("SESSION_METADATA_MISSING");
  });
});

describe("listCampaigns (campaign-list screen backing query)", () => {
  let saveRoot: string;
  let nextSessionOrdinal: number;

  beforeEach(() => {
    saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-listcampaigns-"));
    nextSessionOrdinal = 0;
  });

  afterEach(() => {
    rmSync(saveRoot, { recursive: true, force: true });
    clearCampaignSessionsForTest();
    clearConstructionWorkspacesForTest();
  });

  function compileDeps(saveDir: string) {
    return {
      contentDir: PRODUCTION_PACK,
      chooseSaveDirectory: async () => saveDir,
      generateSessionId: () => `list-${nextSessionOrdinal++}`,
    };
  }

  it("lists real saves with the additive campaign-list fields", async () => {
    const saveDir = resolve(saveRoot, "save-a");
    const result = await compileCampaign(baseConfiguration(), compileDeps(saveDir));
    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") throw new Error("fixture compile failed");

    const list = await listCampaigns({ choosePackageDirectory: async () => saveDir });
    expect(list.outcome).toBe("success");
    if (list.outcome !== "success") return;
    expect(list.value.length).toBeGreaterThanOrEqual(1);
    const record = list.value[0];
    expect(record).toBeDefined();
    if (record === undefined) return;
    // The save-time population of the INC-13 additive fields (no fabrication).
    expect(record.campaignName).toBeTypeOf("string");
    expect(record.nationId).toBeTypeOf("string");
    expect(record.campaignDate).toEqual(
      expect.objectContaining({ year: expect.any(Number), month: expect.any(Number) }),
    );
    expect(record.compatibilityVersion).toBeTypeOf("string");
  });

  it("returns an empty list for a directory with no valid saves (corrupt/incompatible skipped)", async () => {
    const saveDir = resolve(saveRoot, "empty");
    mkdirSync(saveDir, { recursive: true });

    const list = await listCampaigns({ choosePackageDirectory: async () => saveDir });
    expect(list.outcome).toBe("success");
    if (list.outcome !== "success") return;
    expect(list.value).toEqual([]);
  });

  it("returns a cancelled rejection when the user cancels the directory dialog", async () => {
    const list = await listCampaigns({ choosePackageDirectory: async () => null });
    expect(list.outcome).toBe("rejected");
    if (list.outcome !== "rejected") return;
    expect(list.reason).toBe("PACKAGE_SELECTION_CANCELLED");
  });
});
