import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { clearCampaignSessionsForTest, registerCampaignSession } from "../campaignSessions.js";
import { compileProductionCampaign } from "../compiler.js";
import { inspectCampaign } from "./inspectCampaign.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

describe("inspectCampaign", () => {
  afterEach(() => {
    clearCampaignSessionsForTest();
  });

  it("returns SESSION_NOT_FOUND for an unregistered session", async () => {
    const result = await inspectCampaign("no-such-session");
    expect(result.outcome).toBe("error");
    if (result.outcome !== "error") return;
    expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("returns real, non-placeholder treasury/fleet/technologies/ports/strategic areas for the compiled campaign", async () => {
    const signal = new AbortController().signal;
    const collector = new DiagnosticCollector();
    const output = compileProductionCampaign(PRODUCTION_PACK, signal, collector);
    expect(collector.hasErrors).toBe(false);
    expect(output).toBeDefined();
    if (!output) return;

    const ukNation = output.state.snapshot.nations.get("uk")!;
    registerCampaignSession({
      sessionId: "session-uk",
      saveDir: "/tmp/unused-in-this-test",
      playerSlotId: "uk",
      campaignSeed: "a".repeat(32),
      month: { month: 1, year: 1880 },
      state: output.state,
    });

    const result = await inspectCampaign("session-uk");
    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") return;

    const { projection } = result.value;

    // Cross-checked directly against the independently compiled snapshot,
    // not hardcoded expected numbers — proves the projection reflects real
    // compiled data rather than placeholders.
    expect(projection.campaignIdentity).toBe(output.state.snapshot.campaignId);
    expect(projection.economy.treasury).toBe(Number(ukNation.treasury));
    expect(projection.month).toEqual({ month: 1, year: 1880 });

    const expectedFleetCount = ukNation.fleets.length;
    expect(projection.fleet).toHaveLength(expectedFleetCount);
    expect(expectedFleetCount).toBeGreaterThan(0);
    const totalShips = projection.fleet.reduce(
      (sum, fleet) => sum + fleet.divisions.reduce((s, d) => s + d.ships.length, 0),
      0,
    );
    const expectedShipCount = ukNation.fleets.reduce((sum, f) => sum + f.ships.length, 0);
    expect(totalShips).toBe(expectedShipCount);

    const expectedPorts = output.state.snapshot.world.ports.filter((p) => p.nationId === "uk");
    expect(projection.ports).toHaveLength(expectedPorts.length);
    expect(expectedPorts.length).toBeGreaterThan(0);

    expect(projection.knownTechnologyIds).toEqual(
      [...ukNation.research.discoveredTechs].sort((a, b) => a.localeCompare(b)),
    );

    const expectedStrategicAreas = output.state.snapshot.world.areas.filter(
      (a) => a.controller === "uk",
    );
    expect(projection.strategicAreas).toHaveLength(expectedStrategicAreas.length);
    expect(expectedStrategicAreas.length).toBeGreaterThan(0);
  });
});
