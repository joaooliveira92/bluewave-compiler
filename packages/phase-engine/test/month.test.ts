import { describe, it, expect } from "vitest";
import { SafeInt } from "@bluewave/contracts";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import type { CampaignSnapshot, NationState, ConstructionProject } from "@bluewave/campaign";
import type { CommandEnvelope, BudgetProjectCommand } from "@bluewave/commands";
import { MonthExecutor, type MonthResult } from "../src/index.js";

function createSnapshot(overrides?: Partial<CampaignSnapshot>): CampaignSnapshot {
  const nations = new Map<string, NationState>();
  nations.set("GBR", {
    id: "GBR",
    name: "United Kingdom",
    tag: "GBR",
    treasury: SafeInt(500),
    income: SafeInt(150),
    expenses: SafeInt(50),
    fleets: [],
    research: {
      nationId: "GBR",
      technologies: [{ techId: "basic_steam", investedPoints: SafeInt(30), completed: false }],
      currentProjectTechId: "basic_steam",
    },
    constructionProjects: [
      {
        id: "proj-1",
        type: "ship",
        targetId: "ship-1",
        totalWork: SafeInt(200),
        completedWork: SafeInt(50),
        startedAt: "1880-01",
      },
      {
        id: "proj-2",
        type: "building",
        targetId: "bldg-1",
        totalWork: SafeInt(100),
        completedWork: SafeInt(0),
        startedAt: "1880-01",
      },
    ],
    isPlayable: true,
    isAI: false,
  });

  const base: CampaignSnapshot = {
    version: "0.1.0",
    turnNumber: SafeInt(1),
    campaignId: "test-campaign-06",
    slots: [{ nationId: "GBR", type: "playable" }],
    world: { areas: [], routes: [], ports: [] },
    nations,
    wars: { wars: [], battles: [] },
    politics: { relations: [], shells: {} },
    intelligence: { shells: {} },
    rulesetVersion: "0.1.0",
    compatibilityVersion: "0.1.0",
  };

  return overrides ? { ...base, ...overrides } : base;
}

function makeBudgetCommand(
  nationId: string,
  projectId: string,
  budget: SafeInt,
  snapshot: CampaignSnapshot,
): CommandEnvelope<BudgetProjectCommand> {
  const hash = sha256Hex(canonicalSerialize(snapshot));
  return {
    commandId: `cmd-${projectId}-${String(budget)}`,
    version: "0.1.0",
    expectedSnapshotHash: hash,
    idempotencyKey: `ik-${projectId}-${String(budget)}`,
    timestamp: "test",
    body: { type: "budget_project", nationId, projectId, budget },
  };
}

describe("MonthExecutor", () => {
  it("executes a full month with a budget command", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const collector = new DiagnosticCollector();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(100), snapshot);

    const result = executor.execute(snapshot, [cmd], "test-seed", collector);

    expect(result["success"]).toBe(true);

    const gbr = result["finalSnapshot"]["nations"].get("GBR")!;
    const initialTreasury = 500;
    const budget = 100;
    const expenses = 50;
    // treasury = 500 - 100 (command) - appropriation amount - 50 (obligation)
    expect(gbr["treasury"] as number).toBeLessThan(initialTreasury);

    const proj1 = gbr["constructionProjects"].find((p) => p["id"] === "proj-1")!;
    expect(proj1["completedWork"] as number).toBeGreaterThan(50);
  });

  it("decreases treasury by at least the budget amount", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const collector = new DiagnosticCollector();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(100), snapshot);

    const result = executor.execute(snapshot, [cmd], "test-seed", collector);
    const gbr = result["finalSnapshot"]["nations"].get("GBR")!;

    const treasury = gbr["treasury"] as number;
    expect(treasury).toBeLessThanOrEqual(500 - 100);
    expect(treasury).toBeGreaterThanOrEqual(0);
  });

  it("increases construction project progress", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const collector = new DiagnosticCollector();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(100), snapshot);

    const result = executor.execute(snapshot, [cmd], "test-seed", collector);
    const gbr = result["finalSnapshot"]["nations"].get("GBR")!;
    const proj1 = gbr["constructionProjects"].find((p) => p["id"] === "proj-1")!;

    expect(proj1["completedWork"] as number).toBeGreaterThan(50);
    expect(proj1["completedWork"] as number).toBeLessThanOrEqual(200);
  });

  it("produces deterministic closing snapshot hash", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(100), snapshot);

    const result1 = executor.execute(
      snapshot,
      [cmd],
      "deterministic-seed",
      new DiagnosticCollector(),
    );
    const result2 = executor.execute(
      snapshot,
      [cmd],
      "deterministic-seed",
      new DiagnosticCollector(),
    );

    const hash1 = sha256Hex(canonicalSerialize(result1["finalSnapshot"]));
    const hash2 = sha256Hex(canonicalSerialize(result2["finalSnapshot"]));
    expect(hash1).toBe(hash2);
  });

  it("populates all ledgers", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const collector = new DiagnosticCollector();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(100), snapshot);

    const result = executor.execute(snapshot, [cmd], "test-seed", collector);

    expect(result["commandLedger"]["all"].length).toBeGreaterThan(0);
    expect(result["eventLedger"]["all"].length).toBeGreaterThan(0);
    expect(result["randomLedger"]["all"].length).toBeGreaterThan(0);
    expect(result["financialLedger"]["all"].length).toBeGreaterThan(0);
  });

  it("never produces negative treasury", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const collector = new DiagnosticCollector();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(100), snapshot);

    const result = executor.execute(snapshot, [cmd], "test-seed", collector);
    const gbr = result["finalSnapshot"]["nations"].get("GBR")!;

    expect(gbr["treasury"] as number).toBeGreaterThanOrEqual(0);
  });

  it("construction progress never exceeds total work", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const collector = new DiagnosticCollector();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(200), snapshot);

    const result = executor.execute(snapshot, [cmd], "test-seed", collector);
    const gbr = result["finalSnapshot"]["nations"].get("GBR")!;

    for (const proj of gbr["constructionProjects"]) {
      expect(proj["completedWork"] as number).toBeLessThanOrEqual(proj["totalWork"] as number);
    }
  });

  it("same inputs produce identical outputs (determinism)", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(75), snapshot);

    const run = () => executor.execute(snapshot, [cmd], "fixed-seed", new DiagnosticCollector());

    const r1 = run();
    const r2 = run();

    expect(sha256Hex(canonicalSerialize(r1["finalSnapshot"]))).toBe(
      sha256Hex(canonicalSerialize(r2["finalSnapshot"])),
    );
    expect(r1["commandLedger"]["hash"]()).toBe(r2["commandLedger"]["hash"]());
    expect(r1["eventLedger"]["hash"]()).toBe(r2["eventLedger"]["hash"]());
    expect(r1["randomLedger"]["hash"]()).toBe(r2["randomLedger"]["hash"]());
    expect(r1["financialLedger"]["hash"]()).toBe(r2["financialLedger"]["hash"]());
  });

  it("opening validation rejects negative treasury", () => {
    const executor = new MonthExecutor();
    const nations = new Map<string, NationState>();
    nations.set("GBR", {
      id: "GBR",
      name: "UK",
      tag: "GBR",
      treasury: SafeInt(-10),
      income: SafeInt(0),
      expenses: SafeInt(0),
      fleets: [],
      research: { nationId: "GBR", technologies: [] },
      constructionProjects: [],
      isPlayable: true,
      isAI: false,
    });
    const snapshot = createSnapshot({ nations });
    const collector = new DiagnosticCollector();

    const result = executor.execute(snapshot, [], "seed", collector);

    expect(result["success"]).toBe(false);
    const hasNeg = collector.errors.some((d) => d["code"] === "NEGATIVE_TREASURY");
    expect(hasNeg).toBe(true);
  });

  it("outputs FinancialLedger entries with correct shape", () => {
    const executor = new MonthExecutor();
    const snapshot = createSnapshot();
    const collector = new DiagnosticCollector();
    const cmd = makeBudgetCommand("GBR", "proj-1", SafeInt(100), snapshot);

    const result = executor.execute(snapshot, [cmd], "seed", collector);
    const entries = result["financialLedger"]["all"];

    expect(entries.length).toBeGreaterThanOrEqual(3);

    for (const entry of entries) {
      expect(entry["nationId"]).toBe("GBR");
      expect(typeof entry["phaseId"]).toBe("string");
      expect(typeof (entry["previousBalance"] as number)).toBe("number");
      expect(typeof (entry["delta"] as number)).toBe("number");
      expect(typeof (entry["newBalance"] as number)).toBe("number");
      expect(typeof entry["reason"]).toBe("string");
    }
  });
});
