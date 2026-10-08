import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CampaignState } from "@bluewave/campaign";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { SaveStore } from "@bluewave/persistence";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { dispatchCampaignCommand } from "../campaignBridge.js";
import {
  clearCampaignSessionsForTest,
  getCampaignSession,
  registerCampaignSession,
} from "../campaignSessions.js";
import { clearPendingWorkspacesForTest } from "../pendingCommands.js";
import { compileProductionCampaign } from "../compiler.js";
import { toSaveableState } from "../saveHelpers.js";
import { commitMonth } from "./commitMonth.js";
import { inspectFleetScreen } from "./fleetCommands.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../../..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

/**
 * Desktop-mvp ticket 15 acceptance tests: `inspectFleetScreen` against the
 * real production pack (uk has authored fleets + ports and a compiled
 * fleet/ship spread). Movement commands stay bridge-level NOT_IMPLEMENTED
 * stubs — proven by dispatching them and asserting the session is untouched.
 */

describe("fleet commands", () => {
  let saveRoot: string;

  beforeEach(() => {
    saveRoot = mkdtempSync(resolve(tmpdir(), "bw-desktop-fleet-"));
  });

  afterEach(() => {
    rmSync(saveRoot, { recursive: true, force: true });
    clearCampaignSessionsForTest();
    clearPendingWorkspacesForTest();
  });

  /** Compile the production pack once per fixture and register a session for
   * `playerSlotId` (cost pattern mirrors constructionCommands.test.ts). */
  function registerProductionSession(
    sessionId: string,
    saveDir: string,
    playerSlotId: string,
  ): CampaignState {
    const signal = new AbortController().signal;
    const collector = new DiagnosticCollector();
    const output = compileProductionCampaign(PRODUCTION_PACK, signal, collector);
    expect(collector.hasErrors).toBe(false);
    if (!output) throw new Error("production pack failed to compile");

    const state = toSaveableState(output.state);
    new SaveStore().save(state, saveDir);
    registerCampaignSession({
      sessionId,
      saveDir,
      playerSlotId,
      campaignSeed: "a".repeat(32),
      month: { month: 1, year: 1880 },
      state,
    });
    return state;
  }

  it("returns SESSION_NOT_FOUND for an unregistered session", async () => {
    const result = await inspectFleetScreen("no-such-session");
    expect(result.outcome).toBe("error");
    if (result.outcome === "error") expect(result.reason).toBe("SESSION_NOT_FOUND");
  });

  it("shows the player nation's real divisions, ships, and ports for the open campaign", async () => {
    const saveDir = resolve(saveRoot, "save-uk");
    const state = registerProductionSession("session-uk", saveDir, "uk");

    const result = await inspectFleetScreen("session-uk");
    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") return;

    const projection = result.value;
    expect(projection.revision).toBe(0);
    expect(projection.month).toEqual({ month: 1, year: 1880 });
    expect(projection.playerNationId).toBe("uk");

    // Real compiled fleet data: one division per compiled `FleetState`, each
    // carrying its real ships — cross-checked against the independently
    // compiled snapshot, not hardcoded.
    const uk = state.snapshot.nations.get("uk")!;
    expect(projection.divisions).toHaveLength(uk.fleets.length);
    expect(uk.fleets.length).toBeGreaterThan(0);

    const homeFleet = uk.fleets.find((f) => f.id === "fleet_gbr_home");
    expect(homeFleet).toBeDefined();
    const homeView = projection.divisions.find((d) => d.divisionId === "fleet_gbr_home");
    expect(homeView).toBeDefined();
    expect(homeView!.fleetName).toBe(homeFleet!.name); // "Home Fleet"
    expect(homeView!.areaId).toBe(homeFleet!.locationAreaId);
    expect(homeView!.ships).toHaveLength(homeFleet!.ships.length);

    // Real compiled ship names/designs, with status derived from the real
    // isUnderConstruction flag (HMS Inflexible is under construction in the
    // production pack; HMS Dreadnought/Alexandra are commissioned).
    // designId is the compiled ship's designVersionId verbatim — HMS Inflexible
    // is linked to its real compiled design (des_gbr_inflexible).
    const inflexible = homeView!.ships.find((s) => s.name === "HMS Inflexible");
    expect(inflexible).toBeDefined();
    const compiledInflexible = homeFleet!.ships.find((s) => s.id === "gbr_inflexible")!;
    expect(compiledInflexible.designVersionId).toBe("des_gbr_inflexible");
    expect(inflexible!.designId).toBe(compiledInflexible.designVersionId);
    expect(inflexible!.status).toBe("under_construction");
    const dreadnought = homeView!.ships.find((s) => s.name === "HMS Dreadnought");
    expect(dreadnought).toBeDefined();
    expect(dreadnought!.status).toBe("commissioned");

    // No movement command can exist yet — honest empty list.
    expect(projection.movementCommands).toEqual([]);

    // Real world areas + the compiled routes as directed area edges.
    expect(projection.areas).toHaveLength(state.snapshot.world.areas.length);
    expect(projection.areas.length).toBeGreaterThan(0);
    expect(projection.areaEdges).toHaveLength(state.snapshot.world.routes.length);
    expect(projection.areaEdges.length).toBeGreaterThan(0);

    // Real player ports with capacity = authored level.
    const ukPorts = state.snapshot.world.ports.filter((p) => p.nationId === "uk");
    expect(projection.ports).toHaveLength(ukPorts.length);
    expect(ukPorts.length).toBeGreaterThan(0);
    const portsmouth = projection.ports.find((p) => p.id === "gbr_portsmouth");
    expect(portsmouth).toBeDefined();
    expect(portsmouth!.name).toBe("Portsmouth");
    expect(portsmouth!.areaId).toBe("eng_home_coast");
    expect(portsmouth!.capacity).toBe(
      Number(ukPorts.find((p) => p.id === "gbr_portsmouth")!.level),
    );
  });

  it("excludes non-player nations' fleets and ports from the projection", async () => {
    const saveDir = resolve(saveRoot, "save-france");
    const state = registerProductionSession("france-session", saveDir, "france");

    const result = await inspectFleetScreen("france-session");
    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") return;

    const projection = result.value;
    expect(projection.playerNationId).toBe("france");

    const france = state.snapshot.nations.get("france")!;
    // Only France's own compiled fleets appear as divisions.
    const frenchFleetIds = new Set(france.fleets.map((f) => f.id));
    expect(projection.divisions).toHaveLength(france.fleets.length);
    for (const division of projection.divisions) {
      expect(frenchFleetIds.has(division.divisionId)).toBe(true);
    }
    // No UK ships can leak in through a French division.
    const ukShipNames = new Set(
      [...state.snapshot.nations.get("uk")!.fleets].flatMap((f) => f.ships.map((s) => s.name)),
    );
    for (const division of projection.divisions) {
      for (const ship of division.ships) {
        expect(ukShipNames.has(ship.name)).toBe(false);
      }
    }

    // Only France's own ports, sorted by id.
    const frenchPortIds = new Set(
      state.snapshot.world.ports.filter((p) => p.nationId === "france").map((p) => p.id),
    );
    expect(projection.ports).toHaveLength(frenchPortIds.size);
    expect(frenchPortIds.size).toBeGreaterThan(0);
    for (const port of projection.ports) {
      expect(frenchPortIds.has(port.id)).toBe(true);
      expect(port.id.startsWith("fra_")).toBe(true);
    }
  });

  describe("movement orders (ADR-0062)", () => {
    function submit(over: Record<string, unknown> = {}) {
      return dispatchCampaignCommand("submitMovementCommand", {
        sessionId: "mv",
        divisionId: "fleet_gbr_home",
        fromAreaId: "eng_home_coast",
        toAreaId: "sea_english_channel",
        expectedRevision: 0,
        transportRequestId: "tx-1",
        ...over,
      });
    }
    async function listed() {
      const result = await inspectFleetScreen("mv");
      if (result.outcome !== "success") throw new Error(result.reason);
      return result.value.movementCommands;
    }

    it("queues a legal one-hop order, lists it, and the engine moves the fleet when the month is committed", async () => {
      registerProductionSession("mv", resolve(saveRoot, "mv"), "uk");
      const result = await submit();
      expect(result).toMatchObject({
        outcome: "success",
        value: { command: { status: "submitted" } },
      });
      expect(await listed()).toEqual([
        expect.objectContaining({
          divisionId: "fleet_gbr_home",
          fromAreaId: "eng_home_coast",
          toAreaId: "sea_english_channel",
          status: "submitted",
        }),
      ]);
      // Queued only: nothing moved yet.
      const before = getCampaignSession("mv")!.state.snapshot.nations.get("uk")!;
      expect(before.fleets.find((f) => f.id === "fleet_gbr_home")!.locationAreaId).toBe(
        "eng_home_coast",
      );

      const committed = await commitMonth({
        sessionId: "mv",
        expectedRevision: 0,
        transportRequestId: "commit-mv",
      });
      expect(committed.outcome).toBe("success");
      const after = getCampaignSession("mv")!.state.snapshot.nations.get("uk")!;
      const fleet = after.fleets.find((f) => f.id === "fleet_gbr_home")!;
      expect(fleet.locationAreaId).toBe("sea_english_channel");
      expect(fleet.ships.every((s) => s.locationAreaId === "sea_english_channel")).toBe(true);
      expect(await listed()).toEqual([]);
    });

    it("rejects an illegal destination with the engine's code and queues nothing", async () => {
      registerProductionSession("mv", resolve(saveRoot, "mv"), "uk");
      const result = await submit({ toAreaId: "sea_baltic" });
      expect(result).toMatchObject({ outcome: "rejected", reason: "INVALID_ROUTE" });
      expect(await listed()).toEqual([]);
    });

    it("keeps one order per fleet: a second order replaces the first, and cancel drops it", async () => {
      registerProductionSession("mv", resolve(saveRoot, "mv"), "uk");
      await submit();
      await submit({ toAreaId: "sea_north_sea", transportRequestId: "tx-2" });
      const orders = await listed();
      expect(orders).toHaveLength(1);
      expect(orders[0]!.toAreaId).toBe("sea_north_sea");

      const replaced = await dispatchCampaignCommand("replaceMovementCommand", {
        sessionId: "mv",
        commandId: orders[0]!.commandId,
        divisionId: "fleet_gbr_home",
        fromAreaId: "eng_home_coast",
        toAreaId: "sea_english_channel",
        expectedRevision: 0,
        transportRequestId: "tx-3",
      });
      expect(replaced.outcome).toBe("success");
      expect((await listed())[0]!.toAreaId).toBe("sea_english_channel");

      const cancelled = await dispatchCampaignCommand("cancelMovementCommand", {
        sessionId: "mv",
        commandId: orders[0]!.commandId,
        expectedRevision: 0,
        transportRequestId: "tx-4",
      });
      expect(cancelled).toMatchObject({
        outcome: "success",
        value: { command: { status: "cancelled" } },
      });
      expect(await listed()).toEqual([]);
    });

    it("rejects cancelling or replacing an order that does not exist", async () => {
      registerProductionSession("mv", resolve(saveRoot, "mv"), "uk");
      const cancel = await dispatchCampaignCommand("cancelMovementCommand", {
        sessionId: "mv",
        commandId: "nope",
        expectedRevision: 0,
        transportRequestId: "tx-9",
      });
      expect(cancel).toMatchObject({ outcome: "rejected", reason: "COMMAND_NOT_FOUND" });
    });
  });
});
