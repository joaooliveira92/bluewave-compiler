import type {
  CampaignSnapshot,
  CompiledDesignVersion,
  ConstructionProject,
  NationState,
} from "@bluewave/campaign";
import { buildConstructionProjectQueue } from "@bluewave/campaign-engine";
import { SafeInt } from "@bluewave/contracts";
import { LINE_IDS } from "@bluewave/ship-design";
import { describe, expect, it } from "vite-plus/test";
import { preservationCostUnits } from "../src/economyPhases.js";
import { constructionProjectQueueWithReadouts } from "../src/constructionReadout.js";
import { productionShipBuildingContent } from "./helpers/contentFiles.js";

const content = productionShipBuildingContent({ navalProfiles: true });

interface ProjectOverrides {
  readonly id?: string;
  readonly status?: ConstructionProject["status"];
  readonly totalWork?: number;
  readonly completedWork?: number;
  readonly designVersionId?: string;
}

function project(over: ProjectOverrides = {}): ConstructionProject {
  return {
    id: over.id ?? "proj-1",
    type: "ship",
    projectType: "NEW_CONSTRUCTION",
    targetId: "ship-x",
    designVersionId: over.designVersionId ?? "d1",
    totalWork: SafeInt(over.totalWork ?? 200),
    completedWork: SafeInt(over.completedWork ?? 0),
    paidWork: SafeInt(0),
    status: over.status ?? "ACTIVE",
    startedAt: "1880-01",
  };
}

const capacityUnits = (perLine: number): Record<string, SafeInt> =>
  Object.fromEntries(LINE_IDS.map((line) => [line, SafeInt(perLine)]));

/** A compiled design whose construction plan grants `perLine` capacity on every line. */
function design(perLine: number, id = "d1"): CompiledDesignVersion {
  return {
    designVersionId: id,
    designFamilyId: "fam",
    className: "Test",
    nationId: "GBR",
    hullType: "DD",
    normalizedDisplacementKg: SafeInt(1_000_000),
    normalizedSpeedUms: SafeInt(10_000_000),
    normalizedArmorUm: SafeInt(0),
    hitPoints: SafeInt(100),
    mainGunsCaliber: SafeInt(0),
    mainGunsCount: SafeInt(0),
    machineryType: "steam",
    crewComplement: SafeInt(10),
    contentVersion: "t",
    compiledHash: "h",
    constructionCostUnits: SafeInt(600),
    constructionPlan: { yardId: "yard_small", packages: [], capacityUnits: capacityUnits(perLine) },
  } as CompiledDesignVersion;
}

function nation(projects: ConstructionProject[]): NationState {
  return {
    id: "GBR",
    name: "Great Britain",
    tag: "GBR",
    treasury: SafeInt(1_000),
    income: SafeInt(0),
    expenses: SafeInt(0),
    baseResources: SafeInt(0),
    navalAppropriationRateBp: SafeInt(2_000),
    maintenanceCost: SafeInt(0),
    fleets: [],
    divisions: [],
    research: {
      nationId: "GBR",
      technologies: [],
      fieldPriorities: {},
      researchBudget: SafeInt(0),
      activeCandidates: new Map(),
      discoveredTechs: [],
    },
    constructionProjects: projects,
    isPlayable: true,
    isAI: false,
  };
}

function snapshot(
  projects: ConstructionProject[],
  designs: Map<string, CompiledDesignVersion> = new Map(),
): CampaignSnapshot {
  return {
    version: "0.1.0",
    turnNumber: SafeInt(1),
    campaignId: "construction-readout",
    startYear: 1880,
    startMonth: 1,
    strategicWeather: [],
    slots: [{ nationId: "GBR", type: "playable" }],
    world: { areas: [], routes: [], ports: [] },
    nations: new Map([["GBR", nation(projects)]]),
    wars: {
      wars: [],
      battles: [],
      participantMemberships: [],
      blockadeState: [],
      battleManifests: [],
    },
    politics: { relations: [], shells: {} },
    intelligence: { shells: {} },
    designs,
    designFamilies: new Map(),
    rulesetVersion: "0.1.0",
    compatibilityVersion: "1.2.0",
  };
}

describe("constructionProjectQueueWithReadouts (SB3-R31)", () => {
  it("attaches the compiled instalment, remaining months, total cost and launch month", () => {
    const from = snapshot([project({ designVersionId: "d1" })], new Map([["d1", design(25)]]));
    const entries = constructionProjectQueueWithReadouts(from, "GBR", content, "1880-01");
    const entry = entries.find((e) => e.projectId === "proj-1")!;
    expect(entry.readout).toEqual({
      totalCostUnits: 200,
      monthlyInstalmentUnits: 150, // six lines x 25 capacity
      remainingMonths: 2,
      launchMonth: "1880-03",
      haltedCarryingCostUnits: null,
    });
  });

  it("gives a HALTED project the half-mothball carrying cost, and a non-halted one null", () => {
    const from = snapshot(
      [project({ id: "halt-1", status: "HALTED" }), project({ id: "work-1", status: "ACTIVE" })],
      new Map([["d1", design(25)]]),
    );
    const entries = constructionProjectQueueWithReadouts(from, "GBR", content, "1880-02");
    const expected = preservationCostUnits(
      content.environmentFor("1880-02").constructionBalance,
      content.treasuryUnitMicro,
    );
    expect(expected).toBeGreaterThan(0);
    expect(entries.find((e) => e.projectId === "halt-1")!.readout!.haltedCarryingCostUnits).toBe(
      expected,
    );
    expect(
      entries.find((e) => e.projectId === "work-1")!.readout!.haltedCarryingCostUnits,
    ).toBeNull();
  });

  it("reports an unknown carrying cost (not zero) when no ship-building content is given", () => {
    const from = snapshot([project({ status: "HALTED" })], new Map([["d1", design(25)]]));
    const entries = constructionProjectQueueWithReadouts(from, "GBR", undefined, "1880-02");
    expect(entries[0]!.readout!.haltedCarryingCostUnits).toBeNull();
  });

  it("leaves readout absent on the plain snapshot queue projection", () => {
    const from = snapshot([project()], new Map([["d1", design(25)]]));
    expect(buildConstructionProjectQueue(from, "GBR")[0]!.readout).toBeUndefined();
  });
});
