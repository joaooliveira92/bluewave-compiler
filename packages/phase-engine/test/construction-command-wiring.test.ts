// Reachability proof for the shipbuilding command surface: the `OrderConstruction` (class-order batch) and
// `AuthorizeDockExpansion` command bodies are issued as real command envelopes and reach the engine through the same
// `command_collection` dispatch a player's `commitMonth` uses. Unlike the pure-helper tests, these drive
// `MonthExecutor.execute` end-to-end, so deleting the dispatch wiring makes them fail.
import type { CampaignSnapshot, CompiledDesignVersion, NationState } from "@bluewave/campaign";
import type { CommandBody, CommandEnvelope } from "@bluewave/commands";
import { SafeInt } from "@bluewave/contracts";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { HULL_TYPE_FOR_SHIP_TYPE } from "@bluewave/ship-design";
import { describe, expect, it } from "vite-plus/test";
import { MonthExecutor } from "../src/index.js";
import { DOCK_EXPANSION_PROJECT_TYPE } from "../src/dockExpansion.js";
import { productionShipBuildingContent } from "./helpers/contentFiles.js";

const content = productionShipBuildingContent({ navalProfiles: true });

type Design = CompiledDesignVersion;

function design(id: string, over: Partial<Design> = {}): Design {
  return {
    designVersionId: id,
    designFamilyId: `${id}-family`,
    className: `Class ${id}`,
    nationId: "uk",
    hullType: HULL_TYPE_FOR_SHIP_TYPE.B,
    normalizedDisplacementKg: SafeInt(1_000_000),
    normalizedSpeedUms: SafeInt(10_000_000),
    normalizedArmorUm: SafeInt(0),
    hitPoints: SafeInt(100),
    mainGunsCaliber: SafeInt(0),
    mainGunsCount: SafeInt(0),
    machineryType: "steam",
    crewComplement: SafeInt(10),
    contentVersion: "t",
    compiledHash: `h-${id}`,
    ...over,
  } as Design;
}

function nation(): NationState {
  return {
    id: "uk",
    name: "United Kingdom",
    tag: "UK",
    treasury: SafeInt(1_000_000),
    income: SafeInt(0),
    expenses: SafeInt(0),
    baseResources: SafeInt(0),
    navalAppropriationRateBp: SafeInt(2_000),
    maintenanceCost: SafeInt(0),
    fleets: [],
    divisions: [],
    research: {
      nationId: "uk",
      technologies: [],
      fieldPriorities: {},
      researchBudget: SafeInt(0),
      activeCandidates: new Map(),
      discoveredTechs: [],
    },
    constructionProjects: [],
    isPlayable: true,
    isAI: false,
  };
}

function snapshot(designs: readonly Design[]): CampaignSnapshot {
  return {
    version: "0.1.0",
    turnNumber: SafeInt(1),
    campaignId: "sb3-wiring",
    startYear: 1880,
    startMonth: 1,
    strategicWeather: [],
    slots: [{ nationId: "uk", type: "playable" }],
    world: { areas: [], routes: [], ports: [] },
    nations: new Map([["uk", nation()]]),
    wars: {
      wars: [],
      battles: [],
      participantMemberships: [],
      blockadeState: [],
      battleManifests: [],
    },
    politics: { relations: [], shells: {} },
    intelligence: { shells: {} },
    designs: new Map(designs.map((d) => [d.designVersionId, d])),
    designFamilies: new Map(),
    rulesetVersion: "0.1.0",
    compatibilityVersion: "1.2.0",
  } as CampaignSnapshot;
}

const envelope = (body: CommandBody, from: CampaignSnapshot): CommandEnvelope<CommandBody> => ({
  commandId: `cmd-${body.type}`,
  version: "0.1.0",
  expectedSnapshotHash: sha256Hex(canonicalSerialize(from)),
  idempotencyKey: `ik-${body.type}-${JSON.stringify(body)}`,
  timestamp: "test",
  body,
});

const executeMonth = (from: CampaignSnapshot, commands: CommandEnvelope<CommandBody>[]) =>
  new MonthExecutor().execute(from, commands, "wiring-seed", new DiagnosticCollector(), undefined, {
    shipBuilding: content,
  });

describe("OrderConstruction reaches the engine through command_collection (SB3-R11)", () => {
  it("orders a batch of 3 ships as projects on the ordering nation", () => {
    const from = snapshot([design("dv-b")]);
    const result = executeMonth(from, [
      envelope(
        { type: "OrderConstruction", nationId: "uk", designVersionId: "dv-b", quantity: 3 },
        from,
      ),
    ]);
    expect(result.success).toBe(true);
    const projects = result.finalSnapshot.nations.get("uk")!.constructionProjects;
    expect(projects).toHaveLength(3);
    for (const p of projects) {
      expect(p.designVersionId).toBe("dv-b");
      expect(p.batchId).toBeDefined();
      expect(p.shipName).toBeDefined();
    }
    expect(new Set(projects.map((p) => p.id)).size).toBe(3);
  });

  it("refuses a quantity above twelve without adding a project", () => {
    const from = snapshot([design("dv-b")]);
    // The issue-time validator rejects the body before the month even runs.
    const result = executeMonth(from, [
      envelope(
        { type: "OrderConstruction", nationId: "uk", designVersionId: "dv-b", quantity: 13 },
        from,
      ),
    ]);
    // A rejected command does not fail the month; it simply does not apply.
    expect(
      result.finalSnapshot.nations
        .get("uk")!
        .constructionProjects.filter((p) => p.designVersionId === "dv-b"),
    ).toHaveLength(0);
  });
});

describe("AuthorizeDockExpansion reaches the engine through command_collection (SB3-R16)", () => {
  it("creates a normal INFRASTRUCTURE expansion project, never an immediate dock rise", () => {
    const from = snapshot([design("dv-b")]);
    const result = executeMonth(from, [
      envelope({ type: "AuthorizeDockExpansion", nationId: "uk", possessionId: "pos-1" }, from),
    ]);
    expect(result.success).toBe(true);
    const projects = result.finalSnapshot.nations.get("uk")!.constructionProjects;
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      projectType: DOCK_EXPANSION_PROJECT_TYPE,
      targetId: "pos-1",
    });
    expect(projects[0]!.dockExpansionStepKg).toBeGreaterThan(0);
    // The authorization does not raise the dock itself.
    expect(result.finalSnapshot.nations.get("uk")!.dock?.maximumNewConstructionMassKg ?? 0).toBe(0);
  });
});
