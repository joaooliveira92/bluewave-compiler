import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { CampaignConfiguration } from "@bluewave/campaign-engine";
import { compileCampaign, type CompileCampaignDeps } from "./compileCampaign.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");
const GENERATED_ARTIFACT = resolve(REPO_ROOT, "content", "generated", "1880");

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

describe("compileCampaign", () => {
  let saveRoot: string;

  beforeEach(() => {
    saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-compile-"));
  });

  afterEach(() => {
    rmSync(saveRoot, { recursive: true, force: true });
  });

  function deps(overrides: Partial<CompileCampaignDeps> = {}): CompileCampaignDeps {
    return {
      artifactDir: GENERATED_ARTIFACT,
      chooseSaveDirectory: async () => resolve(saveRoot, "save"),
      generateSessionId: () => "session-fixed",
      ...overrides,
    };
  }

  it("compiles the real production pack, saves it, and returns a session id", async () => {
    const result = await compileCampaign(baseConfiguration(), deps());
    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") return;
    expect(result.value.sessionId).toBe("session-fixed");
  });

  it("round-trips nations/designs/designFamilies through SaveStore.load intact (Map-serialization fix)", async () => {
    const saveDir = resolve(saveRoot, "save");
    const result = await compileCampaign(baseConfiguration(), deps());
    expect(result.outcome).toBe("success");

    const store = new SaveStore();
    const diagnostics = new DiagnosticCollector();
    const loaded = store.load(saveDir, diagnostics);

    expect(diagnostics.hasErrors).toBe(false);
    expect(loaded).not.toBeNull();
    if (!loaded) return;

    expect(loaded.snapshot.nations).toBeInstanceOf(Map);
    expect(loaded.snapshot.nations.size).toBe(14);
    expect(loaded.snapshot.nations.get("uk")?.name).toBe("United Kingdom");

    expect(loaded.snapshot.designs).toBeInstanceOf(Map);
    expect(loaded.snapshot.designs.size).toBeGreaterThan(0);

    expect(loaded.snapshot.designFamilies).toBeInstanceOf(Map);
    expect(loaded.snapshot.designFamilies.size).toBeGreaterThan(0);

    // Nested Map (research.activeCandidates) also round-trips.
    expect(loaded.snapshot.nations.get("uk")?.research.activeCandidates).toBeInstanceOf(Map);
  });

  it("rejects a configuration that fails DESIGN-03 validation before compiling anything", async () => {
    const chooseSaveDirectory = vi.fn(async () => resolve(saveRoot, "save"));
    const result = await compileCampaign(
      baseConfiguration({ campaignSeed: "not-hex" }),
      deps({ chooseSaveDirectory }),
    );
    expect(result.outcome).toBe("rejected");
    if (result.outcome !== "rejected") return;
    expect(result.reason).toBe("INVALID_CAMPAIGN_CONFIGURATION");
    expect(chooseSaveDirectory).not.toHaveBeenCalled();
  });

  it("rejects Spain — a zero-design/zero-construction nation — as a player slot", async () => {
    const chooseSaveDirectory = vi.fn(async () => resolve(saveRoot, "save"));
    const result = await compileCampaign(
      baseConfiguration({ playerSlotId: "spain" }),
      deps({ chooseSaveDirectory }),
    );
    expect(result.outcome).toBe("rejected");
    if (result.outcome !== "rejected") return;
    expect(result.reason).toBe("PLAYER_SLOT_NOT_SUPPORTED");
    expect(chooseSaveDirectory).not.toHaveBeenCalled();
  });

  it("rejects an unknown player slot", async () => {
    const result = await compileCampaign(baseConfiguration({ playerSlotId: "atlantis" }), deps());
    expect(result.outcome).toBe("rejected");
    if (result.outcome !== "rejected") return;
    expect(result.reason).toBe("UNKNOWN_PLAYER_SLOT");
  });

  it("rejects without writing a save when the user cancels the save-location dialog", async () => {
    const result = await compileCampaign(
      baseConfiguration(),
      deps({ chooseSaveDirectory: async () => null }),
    );
    expect(result.outcome).toBe("rejected");
    if (result.outcome !== "rejected") return;
    expect(result.reason).toBe("SAVE_LOCATION_CANCELLED");
  });
});
