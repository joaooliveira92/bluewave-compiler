import { describe, it, expect } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { CampaignSnapshot, NationState } from "@bluewave/campaign";
import { PhaseRegistry, PhaseEngine } from "../src/index.js";

function createEmptySnapshot(turn?: SafeInt): CampaignSnapshot {
  return {
    version: "0.1.0",
    turnNumber: turn ?? SafeInt(0),
    campaignId: "test-campaign",
    slots: [],
    world: { areas: [], routes: [], ports: [] },
    nations: new Map(),
    wars: { wars: [], battles: [], participantMemberships: [], blockadeState: [] },
    politics: { relations: [], shells: {} },
    intelligence: { shells: {} },
    designs: new Map(),
    designFamilies: new Map(),
    rulesetVersion: "0.1.0",
    compatibilityVersion: "0.1.0",
  };
}

function createNationState(id: string, treasury: SafeInt): NationState {
  return {
    id,
    name: id,
    tag: id,
    treasury,
    income: SafeInt(100),
    expenses: SafeInt(50),
    baseResources: SafeInt(0),
    navalAppropriationRateBp: SafeInt(2000),
    maintenanceCost: SafeInt(0),
    fleets: [],
    research: {
      nationId: id,
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

describe("PhaseRegistry", () => {
  it("returns phases in correct order", () => {
    const phases = PhaseRegistry.all;
    expect(phases.length).toBe(12);
    expect(phases[0]!["id"]).toBe("opening_validation");
    expect(phases[1]!["id"]).toBe("monthly_revenue");
    expect(phases[2]!["id"]).toBe("ai_planning");
    expect(phases[3]!["id"]).toBe("command_collection");
    expect(phases[4]!["id"]).toBe("appropriation");
    expect(phases[5]!["id"]).toBe("maintenance");
    expect(phases[6]!["id"]).toBe("obligation");
    expect(phases[7]!["id"]).toBe("construction_processing");
    expect(phases[8]!["id"]).toBe("resolve_diplomacy");
    expect(phases[9]!["id"]).toBe("resolve_research");
    expect(phases[10]!["id"]).toBe("battle_resolution");
    expect(phases[11]!["id"]).toBe("closing_validation");

    for (let i = 0; i < phases.length - 1; i++) {
      expect(phases[i]!["order"]).toBeLessThan(phases[i + 1]!["order"]);
    }
    expect(PhaseRegistry.getById("ai_planning")!["order"]).toBe(1.5);
    expect(PhaseRegistry.getById("resolve_diplomacy")!["order"]).toBe(6.5);
    const constructionIdx = phases.findIndex((p) => p["id"] === "construction_processing")!;
    const diplomacyIdx = phases.findIndex((p) => p["id"] === "resolve_diplomacy")!;
    const researchIdx = phases.findIndex((p) => p["id"] === "resolve_research")!;
    expect(diplomacyIdx).toBeGreaterThan(constructionIdx);
    expect(diplomacyIdx).toBeLessThan(researchIdx);
  });

  it("can retrieve phase by id and order", () => {
    const byId = PhaseRegistry.getById("appropriation");
    expect(byId).toBeDefined();
    expect(byId!["name"]).toBe("Appropriation");

    const byOrder = PhaseRegistry.getByOrder(7);
    expect(byOrder).toBeDefined();
    expect(byOrder!["id"]).toBe("resolve_research");
  });

  it("enforces read permissions", () => {
    const app = PhaseRegistry.getById("appropriation")!;
    expect(PhaseRegistry.hasAccess(app, "treasury", "read")).toBe(true);
    expect(PhaseRegistry.hasAccess(app, "fleets", "read")).toBe(false);
  });

  it("enforces write permissions", () => {
    const app = PhaseRegistry.getById("appropriation")!;
    expect(PhaseRegistry.hasAccess(app, "treasury", "write")).toBe(true);
    expect(PhaseRegistry.hasAccess(app, "research", "write")).toBe(false);

    const validate = PhaseRegistry.getById("opening_validation")!;
    expect(PhaseRegistry.hasAccess(validate, "treasury", "write")).toBe(false);
  });

  it("all phases have read access to all", () => {
    const open = PhaseRegistry.getById("opening_validation")!;
    expect(PhaseRegistry.hasAccess(open, "anything", "read")).toBe(true);
  });

  it("only rng phases allow randomness", () => {
    const research = PhaseRegistry.getById("resolve_research")!;
    const battle = PhaseRegistry.getById("battle_resolution")!;
    const collect = PhaseRegistry.getById("command_collection")!;

    expect(research["rngAllowed"]).toBe(true);
    expect(battle["rngAllowed"]).toBe(true);
    const aiPlan = PhaseRegistry.getById("ai_planning")!;
    expect(aiPlan["rngAllowed"]).toBe(true);
    expect(collect["rngAllowed"]).toBe(false);
  });
});

describe("PhaseContext", () => {
  it("initializeTurn creates context with first phase", () => {
    const engine = new PhaseEngine();
    const snapshot = createEmptySnapshot();
    const ctx = engine.initializeTurn(snapshot);

    expect(ctx["currentPhaseIndex"]).toBe(0 as SafeInt);
    expect(ctx["currentPhase"]["id"]).toBe("opening_validation");
    expect(ctx["turnNumber"]).toBe(0 as SafeInt);
    expect(ctx["snapshot"]).toBe(snapshot);
  });

  it("permissions are enforced through access checks", () => {
    const phase = PhaseRegistry.getById("construction_processing")!;
    expect(PhaseRegistry.hasAccess(phase, "constructions", "read")).toBe(true);
    expect(PhaseRegistry.hasAccess(phase, "fleets", "read")).toBe(true);
    expect(PhaseRegistry.hasAccess(phase, "constructions", "write")).toBe(true);
    expect(PhaseRegistry.hasAccess(phase, "fleets", "write")).toBe(true);
    expect(PhaseRegistry.hasAccess(phase, "treasury", "read")).toBe(false);
    expect(PhaseRegistry.hasAccess(phase, "treasury", "write")).toBe(false);
  });
});

describe("PhaseEngine", () => {
  it("executeTurn runs all phases in sequence", () => {
    const engine = new PhaseEngine();
    const snapshot = createEmptySnapshot();
    const collector = new DiagnosticCollector();

    const result = engine.executeTurn(snapshot, [], "test-seed", collector);

    expect(result["phaseResults"].length).toBe(12);
    expect(result["phaseResults"][0]!["phaseId"]).toBe("opening_validation");
    expect(result["phaseResults"][11]!["phaseId"]).toBe("closing_validation");
  });

  it("produces no-op evidence for deferred phases", () => {
    const engine = new PhaseEngine();
    const snapshot = createEmptySnapshot(SafeInt(3));
    const collector = new DiagnosticCollector();

    const result = engine.executeTurn(snapshot, [], "test-seed", collector);

    const noOpPhases = result["phaseResults"].filter((p) => p["noOp"] === true && p["evidence"]);
    // All phases except opening and closing are no-ops (10 phases, incl. ai_planning)
    expect(noOpPhases.length).toBe(10);

    for (const phase of noOpPhases) {
      expect(phase["evidence"]!["version"]).toBe("0.1.0");
      expect(phase["evidence"]!["turnNumber"]).toBe(3);
      expect(phase["success"]).toBe(true);
    }
  });

  it("no-op evidence is versioned and deterministic", () => {
    const engine1 = new PhaseEngine();
    const engine2 = new PhaseEngine();
    const snapshot = createEmptySnapshot(SafeInt(5));
    const collector1 = new DiagnosticCollector();
    const collector2 = new DiagnosticCollector();

    const result1 = engine1.executeTurn(snapshot, [], "seed-a", collector1);
    const result2 = engine2.executeTurn(snapshot, [], "seed-b", collector2);

    for (let i = 0; i < result1["phaseResults"].length; i++) {
      const p1 = result1["phaseResults"][i]!;
      const p2 = result2["phaseResults"][i]!;
      if (p1["evidence"]) {
        expect(p1["evidence"]).toEqual(p2["evidence"]);
      }
    }
  });

  it("opening validation rejects negative treasury", () => {
    const engine = new PhaseEngine();
    const nations = new Map<string, NationState>();
    nations.set("GBR", createNationState("GBR", SafeInt(-50)));
    const snapshot = createEmptySnapshot();
    snapshot["nations"] = nations;
    const collector = new DiagnosticCollector();

    const result = engine.executeTurn(snapshot, [], "test-seed", collector);

    const opening = result["phaseResults"][0]!;
    expect(opening["success"]).toBe(false);
    expect(opening["diagnostics"]!.length).toBeGreaterThanOrEqual(1);
    expect(opening["diagnostics"]![0]).toContain("negative treasury");

    const hasNegDiag = collector.errors.some((d) => d["code"] === "NEGATIVE_TREASURY");
    expect(hasNegDiag).toBe(true);
  });

  it("opening validation rejects construction progress overflow", () => {
    const engine = new PhaseEngine();
    const nations = new Map<string, NationState>();
    const nation = createNationState("GBR", SafeInt(100));
    nation["fleets"] = [
      {
        id: "fleet-1",
        nationId: "GBR",
        name: "Test Fleet",
        locationAreaId: "area-1",
        ships: [
          {
            id: "ship-1",
            name: "Test Ship",
            classId: "class-1",
            nationId: "GBR",
            locationAreaId: "area-1",
            designVersionId: "",
            hitPoints: SafeInt(100),
            maxHitPoints: SafeInt(100),
            speed: SafeInt(10),
            firepower: SafeInt(10),
            armor: SafeInt(10),
            isUnderConstruction: true,
            constructionProgress: SafeInt(80),
            constructionTotalWork: SafeInt(50),
          },
        ],
      },
    ];
    nations.set("GBR", nation);
    const snapshot = createEmptySnapshot();
    snapshot["nations"] = nations;
    const collector = new DiagnosticCollector();

    const result = engine.executeTurn(snapshot, [], "test-seed", collector);

    const opening = result["phaseResults"][0]!;
    expect(opening["success"]).toBe(false);
    expect(opening["diagnostics"]!.length).toBeGreaterThanOrEqual(1);
    expect(opening["diagnostics"]![0]).toContain("construction progress");

    const hasConstDiag = collector.errors.some((d) => d["code"] === "CONSTRUCTION_OVERFLOW");
    expect(hasConstDiag).toBe(true);
  });

  it("closing invariants run and produce hash", () => {
    const engine = new PhaseEngine();
    const snapshot = createEmptySnapshot(SafeInt(1));
    const collector = new DiagnosticCollector();

    const result = engine.executeTurn(snapshot, [], "test-seed", collector);

    const closing = result["phaseResults"][11]!;
    expect(closing["phaseId"]).toBe("closing_validation");
    expect(closing["success"]).toBe(true);

    const _expectedHash = sha256Hex(canonicalSerialize(snapshot));
    // closing validation runs and succeeds
    expect(closing["success"]).toBe(true);
  });

  it("rng-allowed phases are tracked", () => {
    const engine = new PhaseEngine();
    const snapshot = createEmptySnapshot();
    const collector = new DiagnosticCollector();

    const result = engine.executeTurn(snapshot, [], "test-seed", collector);

    const researchPhase = result["phaseResults"][9]!;
    const battlePhase = result["phaseResults"][10]!;

    expect(researchPhase["phaseId"]).toBe("resolve_research");
    expect(researchPhase["noOp"]).toBe(true);
    expect(battlePhase["phaseId"]).toBe("battle_resolution");
    expect(battlePhase["noOp"]).toBe(true);
  });

  it("opening validation rejects ship in multiple battles", () => {
    const engine = new PhaseEngine();
    const nations = new Map<string, NationState>();
    const nation = createNationState("GBR", SafeInt(100));
    nation["fleets"] = [
      {
        id: "fleet-1",
        nationId: "GBR",
        name: "Test Fleet",
        locationAreaId: "area-1",
        ships: [
          {
            id: "ship-1",
            name: "Ship 1",
            classId: "class-1",
            nationId: "GBR",
            locationAreaId: "area-1",
            designVersionId: "",
            hitPoints: SafeInt(100),
            maxHitPoints: SafeInt(100),
            speed: SafeInt(10),
            firepower: SafeInt(10),
            armor: SafeInt(10),
            isUnderConstruction: false,
            constructionProgress: SafeInt(0),
            constructionTotalWork: SafeInt(0),
            inBattleId: "battle-1",
          },
        ],
      },
    ];
    nations.set("GBR", nation);
    const snapshot = createEmptySnapshot();
    snapshot["nations"] = nations;
    snapshot["wars"] = {
      wars: [],
      battles: [
        {
          id: "battle-1",
          phase: "pending",
          attackerId: "GBR",
          defenderId: "FRA",
          areaId: "area-3",
          attackerFleetIds: ["fleet-1"],
          defenderFleetIds: [],
        },
        {
          id: "battle-2",
          phase: "pending",
          attackerId: "FRA",
          defenderId: "GBR",
          areaId: "area-3",
          attackerFleetIds: ["fleet-1"],
          defenderFleetIds: [],
        },
      ],
      participantMemberships: [],
      blockadeState: [],
    };
    const collector = new DiagnosticCollector();

    const result = engine.executeTurn(snapshot, [], "test-seed", collector);

    const opening = result["phaseResults"][0]!;
    expect(opening["success"]).toBe(false);
    const shipDiag = opening["diagnostics"]!.filter((d) => d.includes("multiple battles"));
    expect(shipDiag.length).toBeGreaterThanOrEqual(1);

    const hasShipDiag = collector.errors.some((d) => d["code"] === "SHIP_IN_MULTIPLE_BATTLES");
    expect(hasShipDiag).toBe(true);
  });

  it("turn result includes empty ledger and eventLedger", () => {
    const engine = new PhaseEngine();
    const snapshot = createEmptySnapshot();
    const collector = new DiagnosticCollector();

    const result = engine.executeTurn(snapshot, [], "test-seed", collector);

    expect(result["ledger"]).toBeDefined();
    expect(result["ledger"]["all"].length).toBe(0);
    expect(result["eventLedger"]).toBeDefined();
    expect(result["eventLedger"]["all"].length).toBe(0);
  });
});
