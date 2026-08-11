import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  canonicalSerialize,
  sha256Hex,
  createEnvelope,
  verifyEnvelope,
} from "@bluewave/deterministic";
import { DiagnosticCollector, type DiagnosticCode } from "@bluewave/diagnostics";
import { SafeInt } from "@bluewave/contracts";
import type { CampaignState, CampaignSnapshot } from "@bluewave/campaign";
import { SaveStore, CORRUPT_SAVE_CODE, MISSING_SAVE_CODE } from "../src/store.js";
import {
  CompatibilityChecker,
  CURRENT_COMPATIBILITY_VERSION,
  COMPATIBILITY_MISMATCH_CODE,
} from "../src/compatibility.js";
import { RecoveryManager, cleanup } from "../src/recovery.js";

function createFixtureState(): CampaignState {
  const snapshot: CampaignSnapshot = {
    version: "1.0.0",
    turnNumber: SafeInt.ONE,
    campaignId: "test-campaign-001",
    slots: [{ nationId: "nation-a", type: "playable" }],
    world: {
      areas: [{ id: "area-1", name: "Test Area", type: "sea" }],
      routes: [],
      ports: [],
    },
    nations: new Map(),
    wars: { wars: [], battles: [] },
    politics: { relations: [], shells: {} },
    intelligence: { shells: {} },
    rulesetVersion: "1.0.0",
    compatibilityVersion: CURRENT_COMPATIBILITY_VERSION,
  };

  const envelope = createEnvelope("campaign-snapshot", CURRENT_COMPATIBILITY_VERSION, snapshot);
  const rawHash = sha256Hex(canonicalSerialize({ snapshot, envelope }));

  return { snapshot, envelope, rawHash };
}

describe("SaveStore", () => {
  let tmpDir: string;
  let store: SaveStore;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "persistence-test-"));
    store = new SaveStore();
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("saves and loads a campaign state", () => {
    const state = createFixtureState();
    const saveResult = store.save(state, tmpDir);

    expect(saveResult.hash).toBe(state.rawHash);
    expect(saveResult.savePath).toContain(tmpDir);
    expect(saveResult.metadata).toBeDefined();
    expect(saveResult.metadata.turnNumber).toBe(1);
    expect(saveResult.metadata.campaignId).toBe("test-campaign-001");

    const diagnostics = new DiagnosticCollector();
    const loaded = store.load(tmpDir, diagnostics);

    expect(loaded).not.toBeNull();
    expect(loaded!["snapshot"]["campaignId"]).toBe("test-campaign-001");
    expect(loaded!["snapshot"]["turnNumber"]).toBe(1);
    expect(loaded!["rawHash"]).toBe(state.rawHash);
    expect(diagnostics.hasErrors).toBe(false);

    expect(loaded!["envelope"]["bodyHash"]).toBe(state.envelope.bodyHash);
  });

  it("verifies hash matches between save and load", () => {
    const state = createFixtureState();
    const saveResult = store.save(state, tmpDir);

    const diagnostics = new DiagnosticCollector();
    const loaded = store.load(tmpDir, diagnostics);

    expect(loaded).not.toBeNull();

    const { rawHash: _rh, ...loadedForHash } = loaded!;
    expect(sha256Hex(canonicalSerialize(loadedForHash))).toBe(loaded!["rawHash"]);
    expect(saveResult.hash).toBe(loaded!["rawHash"]);
  });

  it("lists available saves with metadata", () => {
    const state = createFixtureState();
    store.save(state, tmpDir);

    const saves = store.list(tmpDir);
    expect(saves).toHaveLength(1);
    expect(saves[0]!.campaignId).toBe("test-campaign-001");
    expect(saves[0]!.turnNumber).toBe(1);
  });

  it("rejects corrupt saves on load", () => {
    const state = createFixtureState();
    store.save(state, tmpDir);

    const pointer = JSON.parse(readFileSync(join(tmpDir, "pointer.json"), "utf8")) as {
      activeSaveId: string;
    };
    const campaignPath = join(tmpDir, pointer["activeSaveId"], "campaign.json");
    writeFileSync(campaignPath, '{"corrupt": true}', "utf8");

    const diagnostics = new DiagnosticCollector();
    const loaded = store.load(tmpDir, diagnostics);

    expect(loaded).toBeNull();
    expect(diagnostics.hasErrors).toBe(true);
  });

  it("rejects saves with incompatible version", () => {
    const snapshot: CampaignSnapshot = {
      version: "1.0.0",
      turnNumber: SafeInt.ONE,
      campaignId: "test-campaign-002",
      slots: [],
      world: { areas: [], routes: [], ports: [] },
      nations: new Map(),
      wars: { wars: [], battles: [] },
      politics: { relations: [], shells: {} },
      intelligence: { shells: {} },
      rulesetVersion: "1.0.0",
      compatibilityVersion: "0.0.0",
    };

    const envelope = createEnvelope("campaign-snapshot", "0.0.0", snapshot);
    const rawHash = sha256Hex(canonicalSerialize({ snapshot, envelope }));
    const badState: CampaignState = { snapshot, envelope, rawHash };

    store.save(badState, tmpDir);

    const diagnostics = new DiagnosticCollector();
    const loaded = store.load(tmpDir, diagnostics);

    expect(loaded).toBeNull();
    expect(diagnostics.hasErrors).toBe(true);

    const errorCodes = diagnostics.errors.map((d) => d.code as string);
    expect(errorCodes).toContain(COMPATIBILITY_MISMATCH_CODE);
  });

  it("handles cancellation via AbortSignal during save", () => {
    const state = createFixtureState();
    const controller = new AbortController();
    controller.abort();

    expect(() => {
      store.save(state, tmpDir, controller.signal);
    }).toThrow("AbortError");
  });

  it("handles cancellation via AbortSignal during load", () => {
    const state = createFixtureState();
    store.save(state, tmpDir);

    const controller = new AbortController();
    controller.abort();

    const diagnostics = new DiagnosticCollector();
    const loaded = store.load(tmpDir, diagnostics, controller.signal);

    expect(loaded).toBeNull();
    expect(diagnostics.hasErrors).toBe(true);
  });

  it("maintains pointer integrity after multiple saves", () => {
    const state = createFixtureState();
    store.save(state, tmpDir);

    const pointer1 = JSON.parse(readFileSync(join(tmpDir, "pointer.json"), "utf8")) as {
      activeSaveId: string;
      previousSaveId?: string;
    };
    const firstSaveId = pointer1["activeSaveId"];

    store.save(state, tmpDir);

    const pointer2 = JSON.parse(readFileSync(join(tmpDir, "pointer.json"), "utf8")) as {
      activeSaveId: string;
      previousSaveId?: string;
    };
    expect(pointer2["activeSaveId"]).not.toBe(firstSaveId);
    expect(pointer2["previousSaveId"]).toBe(firstSaveId);
  });

  it("cleans up temp files after successful save", () => {
    const state = createFixtureState();
    store.save(state, tmpDir);

    const tmpFiles = require("node:fs")
      .readdirSync(tmpDir)
      .filter((f: string) => f.startsWith(".tmp_"));
    expect(tmpFiles).toHaveLength(0);
  });
});

describe("CompatibilityChecker", () => {
  it("accepts matching version", () => {
    const diagnostics = new DiagnosticCollector();
    const result = CompatibilityChecker.check(CURRENT_COMPATIBILITY_VERSION, diagnostics);
    expect(result).toBe(true);
    expect(diagnostics.hasErrors).toBe(false);
  });

  it("rejects mismatched version", () => {
    const diagnostics = new DiagnosticCollector();
    const result = CompatibilityChecker.check("0.0.0", diagnostics);
    expect(result).toBe(false);
    expect(diagnostics.hasErrors).toBe(true);
  });
});

describe("RecoveryManager", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "recovery-test-"));
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("reverts pointer to previous save", () => {
    const store = new SaveStore();
    const state = createFixtureState();

    store.save(state, tmpDir);
    const firstSaveId = store.getActiveSaveId(tmpDir);

    store.save(state, tmpDir);
    const secondSaveId = store.getActiveSaveId(tmpDir);

    expect(firstSaveId).not.toBe(secondSaveId);

    const recovered = RecoveryManager.revert(tmpDir, firstSaveId!);
    expect(recovered).toBe(true);

    const currentId = store.getActiveSaveId(tmpDir);
    expect(currentId).toBe(firstSaveId);
  });
});

describe("cleanup", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "cleanup-test-"));
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("removes temp directory", () => {
    const testDir = join(tmpDir, "temp-dir");
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, "test.txt"), "hello", "utf8");

    expect(existsSync(testDir)).toBe(true);
    cleanup(testDir);
    expect(existsSync(testDir)).toBe(false);
  });

  it("handles nonexistent paths gracefully", () => {
    const nonexistent = join(tmpDir, "does-not-exist");
    expect(() => cleanup(nonexistent)).not.toThrow();
  });
});
