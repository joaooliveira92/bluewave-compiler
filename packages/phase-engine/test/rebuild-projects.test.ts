import type { CampaignSnapshot, ConstructionProject, NationState, Ship } from "@bluewave/campaign";
import { SafeInt } from "@bluewave/contracts";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { describe, expect, it } from "vite-plus/test";
import { MonthExecutor } from "../src/index.js";
import { rebuildProjectProblems } from "../src/rebuildProjects.js";
import { runClosingValidationPhase } from "../src/validationPhases.js";

const ship = (id: string, over: Partial<Ship> = {}): Ship => ({
  id,
  name: id,
  classId: "c",
  nationId: "GBR",
  locationAreaId: "a-1",
  designVersionId: "d1",
  hitPoints: SafeInt(100),
  maxHitPoints: SafeInt(100),
  speed: SafeInt(10),
  firepower: SafeInt(10),
  armor: SafeInt(10),
  isUnderConstruction: false,
  constructionProgress: SafeInt(0),
  constructionTotalWork: SafeInt(0),
  ...over,
});
const project = (over: Partial<ConstructionProject> = {}): ConstructionProject => ({
  id: "proj-r",
  type: "ship",
  projectType: "REBUILD",
  targetShipId: "s1",
  targetId: "s1",
  designVersionId: "d1",
  totalWork: SafeInt(10),
  completedWork: SafeInt(0),
  paidWork: SafeInt(0),
  status: "ACTIVE",
  startedAt: "1880-01",
  ...over,
});
const nationWith = (ships: Ship[], projects: ConstructionProject[]): NationState =>
  ({
    id: "GBR",
    name: "GBR",
    tag: "GBR",
    treasury: SafeInt(1000),
    income: SafeInt(0),
    expenses: SafeInt(0),
    baseResources: SafeInt(0),
    navalAppropriationRateBp: SafeInt(0),
    maintenanceCost: SafeInt(0),
    fleets: [{ id: "f", nationId: "GBR", name: "f", ships, locationAreaId: "a-1" }],
    divisions: [],
    officers: [],
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
  }) as unknown as NationState;
const unavailable = (id = "s1", by = "proj-r"): Ship =>
  ship(id, { availability: "UNAVAILABLE", availabilityProjectId: by });

describe("rebuildProjectProblems", () => {
  it("has nothing to say about new construction, or a consistent rebuild", () => {
    expect(
      rebuildProjectProblems(
        nationWith([], [project({ projectType: "NEW_CONSTRUCTION", targetShipId: undefined })]),
      ),
    ).toEqual([]);
    expect(rebuildProjectProblems(nationWith([unavailable()], [project()]))).toEqual([]);
    expect(rebuildProjectProblems(nationWith([], []))).toEqual([]);
  });
  it("requires a target ship, and one that exists", () => {
    const text = (n: NationState) => rebuildProjectProblems(n).join("\n");
    expect(text(nationWith([], [project({ targetShipId: undefined })]))).toMatch(
      /names no target ship/,
    );
    expect(text(nationWith([ship("other")], [project()]))).toMatch(/targets unknown ship s1/);
  });
  it("requires the ship to be unavailable because of this very project", () => {
    expect(rebuildProjectProblems(nationWith([ship("s1")], [project()])).join()).toMatch(
      /must be unavailable because of rebuild project proj-r/,
    );
    expect(
      rebuildProjectProblems(nationWith([unavailable("s1", "someone-else")], [project()])).join(),
    ).toMatch(/must be unavailable/);
    expect(
      rebuildProjectProblems(
        nationWith(
          [ship("s1", { availability: "DEGRADED", availabilityProjectId: "proj-r" })],
          [project()],
        ),
      ).join(),
    ).toMatch(/must be unavailable/);
  });
  it("refuses two unfinished rebuilds of the same ship", () => {
    const n = nationWith([unavailable()], [project(), project({ id: "proj-r2" })]);
    expect(rebuildProjectProblems(n).join("\n")).toMatch(
      /target of two rebuilds \(proj-r and proj-r2\)/,
    );
  });
  it("lets a finished rebuild release its ship, and a new-construction project name no target", () => {
    expect(
      rebuildProjectProblems(nationWith([ship("s1")], [project({ status: "COMPLETED" })])),
    ).toEqual([]);
    expect(
      rebuildProjectProblems(nationWith([], [project({ projectType: "NEW_CONSTRUCTION" })])).join(),
    ).toMatch(/is new construction but names target ship s1/);
  });
});

describe("closing validation of rebuild projects", () => {
  const snapshotOf = (n: NationState) =>
    ({ nations: new Map([["GBR", n]]) }) as unknown as CampaignSnapshot;
  it("passes a consistent rebuild and reports an inconsistent one with a stable code", () => {
    const ok = new DiagnosticCollector();
    expect(
      runClosingValidationPhase(snapshotOf(nationWith([unavailable()], [project()])), ok),
    ).toBe(true);
    const bad = new DiagnosticCollector();
    expect(runClosingValidationPhase(snapshotOf(nationWith([ship("s1")], [project()])), bad)).toBe(
      false,
    );
    expect(bad.errors.map((e) => e.code)).toEqual(["REBUILD_PROJECT_INCONSISTENT"]);
  });
});

describe("a finished REBUILD does not become a new ship (ADR-0078)", () => {
  it("leaves the fleet's ships alone when the project's work is complete", () => {
    const n = nationWith(
      [unavailable()],
      [project({ completedWork: SafeInt(10), totalWork: SafeInt(10) })],
    );
    const snapshot = {
      version: "0.1.0",
      turnNumber: SafeInt(1),
      campaignId: "rebuild-guard",
      startYear: 1880,
      startMonth: 1,
      strategicWeather: [],
      slots: [{ nationId: "GBR", type: "playable" as const }],
      world: { areas: [], routes: [], ports: [] },
      nations: new Map([["GBR", n]]),
      wars: {
        wars: [],
        battles: [],
        participantMemberships: [],
        blockadeState: [],
        battleManifests: [],
      },
      politics: { relations: [], shells: {} },
      intelligence: { shells: {} },
      designs: new Map(),
      designFamilies: new Map(),
      rulesetVersion: "0.1.0",
      compatibilityVersion: "0.1.0",
    } as unknown as CampaignSnapshot;
    const result = new MonthExecutor().execute(snapshot, [], "seed", new DiagnosticCollector());
    const fleets = result.finalSnapshot.nations.get("GBR")!.fleets;
    expect(fleets.flatMap((f) => f.ships).map((s) => s.id)).toEqual(["s1"]);
    expect(result.finalSnapshot.nations.get("GBR")!.constructionProjects[0]!.status).not.toBe(
      "COMPLETED",
    );
  });
});
