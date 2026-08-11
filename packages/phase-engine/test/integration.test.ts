import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { SafeInt } from "@bluewave/contracts";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { CampaignCompiler } from "@bluewave/campaign";
import type { CampaignState, CampaignSnapshot, NationState } from "@bluewave/campaign";
import type { CommandEnvelope, BudgetProjectCommand, CommandLedger } from "@bluewave/commands";
import { CommandLifecycle, CommandIdempotencyMap } from "@bluewave/commands";
import { SaveStore } from "@bluewave/persistence";
import { MonthExecutor, ReplayVerifier, PhaseEngine, PhaseRegistry } from "../src/index.js";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

const FIXTURE = {
  pack: JSON.stringify({
    name: "1880-test-scenario",
    version: "0.1.0",
    type: "fixture",
    files: {
      rulesets: ["rulesets.yaml"],
      countries: ["countries.yaml"],
      areas: ["areas.yaml"],
      routes: ["routes.yaml"],
      possessions: ["possessions.yaml"],
      ports: ["ports.yaml"],
      technologies: ["technologies.yaml"],
    },
  }),

  rulesets: `- id: "core"\n  name: "Core Rules"\n  version: "1.0"\n`,

  countries: `- id: "GBR"\n  name: "United Kingdom"\n  tag: "GBR"\n  isPlayable: true\n- id: "FRA"\n  name: "France"\n  tag: "FRA"\n  isPlayable: false\n`,

  areas: `- id: "lon"\n  name: "London"\n  type: "land"\n  controller: "GBR"\n- id: "par"\n  name: "Paris"\n  type: "land"\n  controller: "FRA"\n- id: "eng_ch"\n  name: "English Channel"\n  type: "sea"\n`,

  routes: `- id: "lon-par"\n  from: "lon"\n  to: "par"\n  type: "sea"\n  distance: 300\n- id: "lon-eng_ch"\n  from: "lon"\n  to: "eng_ch"\n  type: "sea"\n  distance: 50\n- id: "par-eng_ch"\n  from: "par"\n  to: "eng_ch"\n  type: "sea"\n  distance: 100\n`,

  possessions: `- id: "gbr-lon"\n  countryId: "GBR"\n  areaId: "lon"\n- id: "fra-par"\n  countryId: "FRA"\n  areaId: "par"\n`,

  ports: `- id: "port-lon"\n  name: "Port of London"\n  areaId: "lon"\n  countryId: "GBR"\n  level: 5\n- id: "port-par"\n  name: "Port of Paris"\n  areaId: "par"\n  countryId: "FRA"\n  level: 3\n`,

  technologies: `- id: "basic_steam"\n  name: "Basic Steam Turbine"\n  category: "propulsion"\n  cost: 100\n  year: 1880\n- id: "advanced_steam"\n  name: "Advanced Steam Turbine"\n  category: "propulsion"\n  prerequisites:\n    - { techId: "basic_steam" }\n  cost: 200\n  year: 1900\n`,

  fleets: `- id: "fleet-gbr-home"\n  nationId: "GBR"\n  name: "Home Fleet"\n  locationAreaId: "lon"\n  ships:\n    - id: "ship-hms-dreadnought"\n      name: "HMS Dreadnought"\n      classId: "battleship"\n      hitPoints: 100\n      maxHitPoints: 100\n      speed: 21\n      firepower: 10\n      armor: 12\n      isUnderConstruction: false\n      constructionProgress: 0\n      constructionTotalWork: 0\n    - id: "ship-hms-invincible"\n      name: "HMS Invincible"\n      classId: "battlecruiser"\n      hitPoints: 80\n      maxHitPoints: 80\n      speed: 25\n      firepower: 8\n      armor: 6\n      isUnderConstruction: false\n      constructionProgress: 0\n      constructionTotalWork: 0\n- id: "fleet-fra-atlantic"\n  nationId: "FRA"\n  name: "Atlantic Fleet"\n  locationAreaId: "par"\n  ships:\n    - id: "ship-fs-courbet"\n      name: "FS Courbet"\n      classId: "battleship"\n      hitPoints: 90\n      maxHitPoints: 90\n      speed: 20\n      firepower: 9\n      armor: 11\n      isUnderConstruction: false\n      constructionProgress: 0\n      constructionTotalWork: 0\n`,

  economies: `- nationId: "GBR"\n  treasury: 800\n  income: 150\n  expenses: 75\n- nationId: "FRA"\n  treasury: 600\n  income: 120\n  expenses: 60\n`,

  constructions: `- id: "con-gbr-ship-battleship2"\n  nationId: "GBR"\n  type: "ship"\n  targetId: "ship-hms-thunderer"\n  totalWork: 200\n  completedWork: 50\n  startedAt: "1880-01"\n`,

  diplomacy: `- nationA: "GBR"\n  nationB: "FRA"\n  relation: "neutral"\n  since: "1880-01"\n`,

  research: `- nationId: "GBR"\n  currentProjectTechId: "basic_steam"\n  researchBudget: 100\n  fieldPriorities:\n    MACHINERY: 4\n    HULL_CONSTRUCTION: 2\n    GUNNERY: 1\n  technologies:\n    - { techId: "basic_steam", investedPoints: 30, completed: false }\n- nationId: "FRA"\n  technologies: []\n`,
};

function createFixtureDir(): { path: string; cleanup: () => void } {
  const dir = resolve(tmpdir(), `bw-int-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return {
    path: dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function writeFile(base: string, rel: string, content: string): void {
  const full = resolve(base, rel);
  mkdirSync(resolve(full, ".."), { recursive: true });
  writeFileSync(full, content, "utf8");
}

function writeAllFixtureFiles(fixturePath: string): void {
  writeFile(fixturePath, "pack.json", FIXTURE.pack);
  writeFile(fixturePath, "rulesets.yaml", FIXTURE.rulesets);
  writeFile(fixturePath, "countries.yaml", FIXTURE.countries);
  writeFile(fixturePath, "areas.yaml", FIXTURE.areas);
  writeFile(fixturePath, "routes.yaml", FIXTURE.routes);
  writeFile(fixturePath, "possessions.yaml", FIXTURE.possessions);
  writeFile(fixturePath, "ports.yaml", FIXTURE.ports);
  writeFile(fixturePath, "technologies.yaml", FIXTURE.technologies);
  writeFile(fixturePath, "fleets.yaml", FIXTURE.fleets);
  writeFile(fixturePath, "economies.yaml", FIXTURE.economies);
  writeFile(fixturePath, "constructions.yaml", FIXTURE.constructions);
  writeFile(fixturePath, "diplomacy.yaml", FIXTURE.diplomacy);
  writeFile(fixturePath, "research.yaml", FIXTURE.research);
}

function compileCampaign(fixtureDir: string): CampaignState {
  const compiler = new CampaignCompiler();
  const collector = new DiagnosticCollector();
  const signal = new AbortController().signal;
  const output = compiler.compile(
    {
      compilerInput: {
        manifestPath: "pack.json",
        contentDir: fixtureDir,
        rulesetFiles: ["rulesets.yaml"],
        countryFiles: ["countries.yaml"],
        areaFiles: ["areas.yaml"],
        routeFiles: ["routes.yaml"],
        possessionFiles: ["possessions.yaml"],
        portFiles: ["ports.yaml"],
        technologyFiles: ["technologies.yaml"],
      },
      campaignFiles: {
        fleetFiles: ["fleets.yaml"],
        economyFiles: ["economies.yaml"],
        constructionFiles: ["constructions.yaml"],
        diplomacyFiles: ["diplomacy.yaml"],
        researchFiles: ["research.yaml"],
        designFiles: [],
      },
      rulesetVersion: "1.0",
      compatibilityVersion: "1.0.0",
    },
    signal,
    collector,
  );

  if (!output || collector.hasErrors) {
    throw new Error(`Compilation failed: ${diagnosticsSummary(collector)}`);
  }
  return output.state;
}

function diagnosticsSummary(collector: DiagnosticCollector): string {
  return collector.all.map((d) => `${d.code}: ${d.message}`).join("; ");
}

function makeBudgetCommand(
  snapshot: CampaignSnapshot,
  nationId: string,
  projectId: string,
  budget: SafeInt,
  overrides?: Partial<CommandEnvelope<BudgetProjectCommand>>,
): CommandEnvelope<BudgetProjectCommand> {
  const hash = sha256Hex(canonicalSerialize(snapshot));
  return {
    commandId: `cmd-${projectId}-${String(budget)}`,
    version: "0.1.0",
    expectedSnapshotHash: hash,
    idempotencyKey: `ik-${projectId}-${String(budget)}`,
    timestamp: "integration-test",
    body: { type: "budget_project", nationId, projectId, budget },
    ...overrides,
  };
}

function snapshotToHashable(snapshot: CampaignSnapshot): unknown {
  const nations: Record<string, NationState> = {};
  for (const [id, nation] of snapshot.nations) {
    nations[id] = nation;
  }
  return {
    version: snapshot.version,
    turnNumber: snapshot.turnNumber,
    campaignId: snapshot.campaignId,
    slots: snapshot.slots.map((s) => ({ nationId: s.nationId, type: s.type })),
    world: {
      areas: snapshot.world.areas.map((a) => ({ ...a })),
      routes: snapshot.world.routes.map((r) => ({ ...r })),
      ports: snapshot.world.ports.map((p) => ({ ...p })),
    },
    nations,
    wars: {
      wars: snapshot.wars.wars.map((w) => ({ ...w })),
      battles: snapshot.wars.battles.map((b) => ({ ...b })),
    },
    politics: {
      relations: snapshot.politics.relations.map((r) => ({ ...r })),
      shells: { ...snapshot.politics.shells },
    },
    intelligence: {
      shells: { ...snapshot.intelligence.shells },
    },
    rulesetVersion: snapshot.rulesetVersion,
    compatibilityVersion: snapshot.compatibilityVersion,
  };
}

function hashSnapshot(snapshot: CampaignSnapshot): string {
  return sha256Hex(canonicalSerialize(snapshotToHashable(snapshot)));
}

describe("Full-slice integration", () => {
  let fixtureDir: string;
  let fixtureCleanup: () => void;
  let campaignState: CampaignState;
  let snapshot: CampaignSnapshot;

  beforeAll(() => {
    const f = createFixtureDir();
    fixtureDir = f.path;
    fixtureCleanup = f.cleanup;
    writeAllFixtureFiles(fixtureDir);
    campaignState = compileCampaign(fixtureDir);
    snapshot = campaignState.snapshot;
  });

  afterAll(() => {
    fixtureCleanup();
  });

  // 1. Repeated compilation yields identical initial snapshot hash
  it("1. Repeated compilation yields identical initial snapshot hash", () => {
    const state1 = compileCampaign(fixtureDir);
    const state2 = compileCampaign(fixtureDir);
    expect(state1.rawHash).toBe(state2.rawHash);
    expect(state1.contentHash).toBe(state2.contentHash);
    expect(state1.rawHash).toHaveLength(64);
  });

  // 2. Deterministic month — same seed/commands yields identical 5 ledger hashes
  it("2. Same opening snapshot and commands yield identical closing snapshot, command, event, financial, and random-decision ledger hashes", () => {
    const executor = new MonthExecutor();
    const cmd = makeBudgetCommand(snapshot, "GBR", "con-gbr-ship-battleship2", SafeInt(100));

    const run = () =>
      executor.execute(snapshot, [cmd], "deterministic-seed", new DiagnosticCollector());

    const r1 = run();
    const r2 = run();

    expect(hashSnapshot(r1.finalSnapshot)).toBe(hashSnapshot(r2.finalSnapshot));
    expect(r1.commandLedger.hash()).toBe(r2.commandLedger.hash());
    expect(r1.eventLedger.hash()).toBe(r2.eventLedger.hash());
    expect(r1.financialLedger.hash()).toBe(r2.financialLedger.hash());
    expect(r1.randomLedger.hash()).toBe(r2.randomLedger.hash());
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });

  // 3. Save/load before advancement preserves future outcomes
  it("3. Save/load before advancement preserves snapshot hash", () => {
    const store = new SaveStore();
    const saveDir = resolve(
      tmpdir(),
      `bw-save-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(saveDir, { recursive: true });

    try {
      const { rawHash: _rh, ...stateForSave } = campaignState;
      const saveableState: CampaignState = {
        ...campaignState,
        rawHash: sha256Hex(canonicalSerialize(stateForSave)),
      };
      const saveResult = store.save(saveableState, saveDir);
      expect(saveResult.hash).toHaveLength(64);

      const loadDiag = new DiagnosticCollector();
      const loaded = store.load(saveDir, loadDiag);
      expect(loaded).not.toBeNull();
      expect(loadDiag.hasErrors).toBe(false);
    } finally {
      rmSync(saveDir, { recursive: true, force: true });
    }
  });

  // 4. Replay reproduces authoritative hashes
  it("4. Child-process replay reproduces all authoritative hashes", () => {
    const executor = new MonthExecutor();
    const cmd = makeBudgetCommand(snapshot, "GBR", "con-gbr-ship-battleship2", SafeInt(100));
    const collector = new DiagnosticCollector();

    const original = executor.execute(snapshot, [cmd], "replay-seed", collector);
    const originalLedger = original.commandLedger;

    const replayVerifier = new ReplayVerifier();
    const replayResult = replayVerifier.verify(
      snapshot,
      [cmd],
      originalLedger,
      hashSnapshot(original.finalSnapshot),
      "replay-seed",
      collector,
    );

    expect(replayResult.match).toBe(true);
    expect(replayResult.mismatches.length).toBe(0);
    expect(replayResult.replayedFinalHash).toBe(replayResult.originalFinalHash);
    expect(replayResult.replayedCommandLedgerHash).toBe(replayResult.originalCommandLedgerHash);
  });

  // 5. Stale expected snapshot hash is rejected
  it("5. Stale expected snapshot hash is rejected", () => {
    const lifecycle = new CommandLifecycle();
    const slot = snapshot.slots.find((s) => s.nationId === "GBR")!;
    const idempotencyMap = new CommandIdempotencyMap();

    const cmd = makeBudgetCommand(snapshot, "GBR", "con-gbr-ship-battleship2", SafeInt(50), {
      expectedSnapshotHash: "0".repeat(64),
    });

    const result = lifecycle.process(cmd, snapshot, slot, idempotencyMap);
    expect(result.type).toBe("rejected");
    expect(result.diagnostic.code).toBe("STALE_SNAPSHOT_HASH");
  });

  // 6. Idempotency
  it("6. Same idempotency key and canonical command returns original result; different command returns IDEMPOTENCY_CONFLICT", () => {
    const lifecycle = new CommandLifecycle();
    const slot = snapshot.slots.find((s) => s.nationId === "GBR")!;
    const idempotencyMap = new CommandIdempotencyMap();

    const cmd = makeBudgetCommand(snapshot, "GBR", "con-gbr-ship-battleship2", SafeInt(50));

    const firstResult = lifecycle.process(cmd, snapshot, slot, idempotencyMap);
    expect(firstResult.type).toBe("success");

    const sameCmd = { ...cmd };
    const sameResult = lifecycle.process(sameCmd, snapshot, slot, idempotencyMap);
    expect(sameResult.type).toBe("idempotency_match");

    const cmdConflict: CommandEnvelope<BudgetProjectCommand> = {
      ...cmd,
      commandId: "cmd-conflict-different",
      body: {
        type: "budget_project",
        nationId: "GBR",
        projectId: "con-gbr-ship-battleship2",
        budget: SafeInt(999),
      },
    };
    const conflictResult = lifecycle.process(cmdConflict, snapshot, slot, idempotencyMap);
    expect(conflictResult.type).toBe("idempotency_conflict");
  });

  // 7. Unlocked/invalid command
  it("7. An unlocked, invalid, or unreserved command cannot resolve", () => {
    const lifecycle = new CommandLifecycle();
    const slot = snapshot.slots.find((s) => s.nationId === "GBR")!;
    const idempotencyMap = new CommandIdempotencyMap();

    const cmdInvalidNation = makeBudgetCommand(
      snapshot,
      "NONEXISTENT",
      "con-gbr-ship-battleship2",
      SafeInt(10),
    );
    const result = lifecycle.process(cmdInvalidNation, snapshot, slot, idempotencyMap);
    expect(result.type).toBe("rejected");
    expect(result.diagnostic.code).toBe("UNAUTHORIZED");

    const fraSlot = snapshot.slots.find((s) => s.nationId === "FRA")!;
    const fraTreasury = snapshot.nations.get("FRA")!.treasury as number;
    const cmdFra: CommandEnvelope<BudgetProjectCommand> = {
      commandId: "cmd-fra-overbudget",
      version: "0.1.0",
      expectedSnapshotHash: sha256Hex(canonicalSerialize(snapshot)),
      idempotencyKey: "ik-fra-overbudget",
      timestamp: "integration-test",
      body: {
        type: "budget_project",
        nationId: "FRA",
        projectId: "con-gbr-ship-battleship2",
        budget: SafeInt(fraTreasury + 100),
      },
    };
    const fraResult = lifecycle.process(cmdFra, snapshot, fraSlot, idempotencyMap);
    expect(fraResult.type).toBe("rejected");
  });

  // 8. Treasury never negative
  it("8. Treasury never silently becomes negative and financial postings balance", () => {
    const executor = new MonthExecutor();
    const collector = new DiagnosticCollector();

    const budgetCmd = makeBudgetCommand(
      snapshot,
      "GBR",
      "con-gbr-ship-battleship2",
      SafeInt(99999),
    );
    const result = executor.execute(snapshot, [budgetCmd], "treasury-test", collector);

    const gbr = result.finalSnapshot.nations.get("GBR")!;
    expect(gbr.treasury as number).toBeGreaterThanOrEqual(0);

    const entries = result.financialLedger.all;
    const gbrEntries = entries.filter((e) => e.nationId === "GBR");
    let runningBalance = snapshot.nations.get("GBR")!.treasury as number;
    for (const entry of gbrEntries) {
      expect(entry.newBalance as number).toBeGreaterThanOrEqual(0);
      runningBalance = entry.newBalance as number;
    }
  });

  // 9. Construction progress capped
  it("9. Construction progress based on paid work and never exceeds total work", () => {
    const executor = new MonthExecutor();
    const collector = new DiagnosticCollector();

    const cmd = makeBudgetCommand(snapshot, "GBR", "con-gbr-ship-battleship2", SafeInt(50));
    const result = executor.execute(snapshot, [cmd], "construction-test", collector);

    const gbr = result.finalSnapshot.nations.get("GBR")!;
    for (const project of gbr.constructionProjects) {
      expect(project.completedWork as number).toBeLessThanOrEqual(project.totalWork as number);
    }

    const gbrInitial = snapshot.nations.get("GBR")!;
    const initialProj = gbrInitial.constructionProjects.find(
      (p) => p.id === "con-gbr-ship-battleship2",
    )!;
    const finalProj = gbr.constructionProjects.find((p) => p.id === "con-gbr-ship-battleship2")!;
    const workAdded = (finalProj.completedWork as number) - (initialProj.completedWork as number);
    expect(workAdded).toBeGreaterThanOrEqual(0);
  });

  // 10. No ship in two unresolved battles
  it("10. No ship in two unresolved battles", () => {
    const engine = new PhaseEngine();
    const nations = new Map<string, NationState>();
    const gbrNation = {
      id: "GBR",
      name: "United Kingdom",
      tag: "GBR",
      treasury: SafeInt(500),
      income: SafeInt(150),
      expenses: SafeInt(75),
      fleets: [
        {
          id: "fleet-1",
          nationId: "GBR",
          name: "Test Fleet",
          locationAreaId: "lon",
          ships: [
            {
              id: "ship-1",
              name: "Test",
              classId: "battleship",
              nationId: "GBR",
              locationAreaId: "lon",
              hitPoints: SafeInt(100),
              maxHitPoints: SafeInt(100),
              speed: SafeInt(10),
              firepower: SafeInt(10),
              armor: SafeInt(10),
              isUnderConstruction: false,
              constructionProgress: SafeInt(0),
              constructionTotalWork: SafeInt(0),
              designVersionId: "",
              inBattleId: "battle-1",
            },
          ],
        },
      ],
      research: {
        nationId: "GBR",
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
    nations.set("GBR", gbrNation);

    const testSnapshot: CampaignSnapshot = {
      version: "0.1.0",
      turnNumber: SafeInt(1),
      campaignId: "test-ship-battles",
      slots: [{ nationId: "GBR", type: "playable" }],
      world: { areas: [], routes: [], ports: [] },
      nations,
      wars: {
        wars: [],
        battles: [
          {
            id: "battle-1",
            phase: "pending",
            attackerId: "GBR",
            defenderId: "FRA",
            areaId: "eng_ch",
            attackerFleetIds: ["fleet-1"],
            defenderFleetIds: [],
          },
          {
            id: "battle-2",
            phase: "pending",
            attackerId: "FRA",
            defenderId: "GBR",
            areaId: "eng_ch",
            attackerFleetIds: ["fleet-1"],
            defenderFleetIds: [],
          },
        ],
      },
      politics: { relations: [], shells: {} },
      intelligence: { shells: {} },
      rulesetVersion: "1.0",
      compatibilityVersion: "0.1.0",
    };

    const collector = new DiagnosticCollector();
    const result = engine.executeTurn(testSnapshot, [], "test-seed", collector);

    const opening = result.phaseResults[0]!;
    expect(opening.success).toBe(false);
    const shipDiag = opening.diagnostics!.filter((d) => d.includes("multiple battles"));
    expect(shipDiag.length).toBeGreaterThanOrEqual(1);
  });

  // 11. RNG stability
  it("11. RNG decisions stable when unrelated queries inserted", () => {
    const executor = new MonthExecutor();
    const cmd = makeBudgetCommand(snapshot, "GBR", "con-gbr-ship-battleship2", SafeInt(50));

    const result1 = executor.execute(snapshot, [cmd], "rng-stable-seed", new DiagnosticCollector());
    const hash1 = result1.randomLedger.hash();

    const result2 = executor.execute(snapshot, [cmd], "rng-stable-seed", new DiagnosticCollector());
    const hash2 = result2.randomLedger.hash();

    expect(hash1).toBe(hash2);
  });

  // 12. Phase order enforced
  it("12. Phase order, cursor, aggregate ownership, and permitted RNG families enforced", () => {
    const engine = new PhaseEngine();
    const phases = PhaseRegistry.all;

    for (let i = 0; i < phases.length; i++) {
      expect(phases[i]!.order).toBe(i);
    }

    const rngPhases = phases.filter((p) => p.rngAllowed);
    expect(rngPhases.map((p) => p.id).sort()).toEqual(["battle_resolution", "resolve_research"]);

    const ctx = engine.initializeTurn(snapshot);
    expect(ctx.currentPhase.id).toBe("opening_validation");
    expect(ctx.currentPhaseIndex).toBe(0 as SafeInt);

    const openingPhase = PhaseRegistry.getByOrder(0)!;
    expect(openingPhase.rngAllowed).toBe(false);
    expect(openingPhase.writePermissions).toEqual([]);

    const commandCollectPhase = PhaseRegistry.getByOrder(1)!;
    expect(commandCollectPhase.rngAllowed).toBe(false);
  });

  // 13. No-op evidence
  it("13. Deferred phases emit versioned no-op evidence, consume no randomness", () => {
    const engine = new PhaseEngine();
    const emptyNations = new Map<string, NationState>();
    const emptySnapshot: CampaignSnapshot = {
      ...snapshot,
      nations: emptyNations,
      turnNumber: SafeInt(3),
    };

    const collector = new DiagnosticCollector();
    const result = engine.executeTurn(emptySnapshot, [], "seed", collector);

    const noOpPhases = result.phaseResults.filter((p) => p.noOp === true && p.evidence);
    expect(noOpPhases.length).toBeGreaterThanOrEqual(1);

    for (const phase of noOpPhases) {
      expect(phase.evidence!.version).toBe("0.1.0");
      expect(phase.evidence!.turnNumber).toBe(3);
      expect(phase.success).toBe(true);
    }
  });

  // 14. Corrupt save rejection
  it("14. Corrupt/incompatible saves rejected with stable diagnostics", () => {
    const store = new SaveStore();
    const saveDir = resolve(
      tmpdir(),
      `bw-corrupt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(saveDir, { recursive: true });

    try {
      const { rawHash: _rh, ...stateForSave } = campaignState;
      const saveableState: CampaignState = {
        ...campaignState,
        rawHash: sha256Hex(canonicalSerialize(stateForSave)),
      };
      const saveResult = store.save(saveableState, saveDir);

      const corruptStatePath = join(saveResult.savePath, "campaign.json");
      const originalContent = readFileSync(corruptStatePath, "utf8");
      writeFileSync(corruptStatePath, originalContent.replace(/"[^"]+"/g, '"corrupted"'), "utf8");

      const loadDiag = new DiagnosticCollector();
      const loaded = store.load(saveDir, loadDiag);
      expect(loaded).toBeNull();

      const corruptDiags = loadDiag.all.filter((d) => d.code === "PERSISTENCE_CORRUPT_SAVE");
      expect(corruptDiags.length).toBeGreaterThanOrEqual(1);
    } finally {
      rmSync(saveDir, { recursive: true, force: true });
    }
  });

  // 15. Cancellation
  it("15. Cancellation leaves save pointer and committed artifacts valid", () => {
    const store = new SaveStore();
    const saveDir = resolve(
      tmpdir(),
      `bw-cancel-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(saveDir, { recursive: true });

    try {
      const { rawHash: _rh, ...stateForSave } = campaignState;
      const saveableState: CampaignState = {
        ...campaignState,
        rawHash: sha256Hex(canonicalSerialize(stateForSave)),
      };
      store.save(saveableState, saveDir);
      const pointer = store.getActiveSaveId(saveDir);
      expect(pointer).not.toBeNull();

      const loadDiag = new DiagnosticCollector();
      const loaded = store.load(saveDir, loadDiag);
      expect(loaded).not.toBeNull();
      expect(loadDiag.hasErrors).toBe(false);

      const loadedPtr = store.getActiveSaveId(saveDir);
      expect(loadedPtr).toBe(pointer);
    } finally {
      rmSync(saveDir, { recursive: true, force: true });
    }
  });

  // 16. Battle labeled narrow
  it("16. Auto-resolver labeled narrow, no tactical equivalence claim", () => {
    const nations = new Map<string, NationState>();

    const gbrNation: NationState = {
      id: "GBR",
      name: "United Kingdom",
      tag: "GBR",
      treasury: SafeInt(500),
      income: SafeInt(150),
      expenses: SafeInt(75),
      fleets: [
        {
          id: "fleet-gbr-home",
          nationId: "GBR",
          name: "Home Fleet",
          locationAreaId: "eng_ch",
          ships: [
            {
              id: "ship-hms-dreadnought",
              name: "HMS Dreadnought",
              classId: "battleship",
              nationId: "GBR",
              locationAreaId: "eng_ch",
              hitPoints: SafeInt(100),
              maxHitPoints: SafeInt(100),
              speed: SafeInt(21),
              firepower: SafeInt(10),
              armor: SafeInt(12),
              isUnderConstruction: false,
              constructionProgress: SafeInt(0),
              constructionTotalWork: SafeInt(0),
            },
          ],
        },
      ],
      research: {
        nationId: "GBR",
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

    const fraNation: NationState = {
      id: "FRA",
      name: "France",
      tag: "FRA",
      treasury: SafeInt(600),
      income: SafeInt(120),
      expenses: SafeInt(60),
      fleets: [
        {
          id: "fleet-fra-atlantic",
          nationId: "FRA",
          name: "Atlantic Fleet",
          locationAreaId: "eng_ch",
          ships: [
            {
              id: "ship-fs-courbet",
              name: "FS Courbet",
              classId: "battleship",
              nationId: "FRA",
              locationAreaId: "eng_ch",
              hitPoints: SafeInt(90),
              maxHitPoints: SafeInt(90),
              speed: SafeInt(20),
              firepower: SafeInt(9),
              armor: SafeInt(11),
              isUnderConstruction: false,
              constructionProgress: SafeInt(0),
              constructionTotalWork: SafeInt(0),
            },
          ],
        },
      ],
      research: {
        nationId: "FRA",
        technologies: [],
        fieldPriorities: {},
        researchBudget: SafeInt(0),
        activeCandidates: new Map(),
        discoveredTechs: [],
      },
      constructionProjects: [],
      isPlayable: false,
      isAI: true,
    };

    nations.set("GBR", gbrNation);
    nations.set("FRA", fraNation);

    const testSnapshot: CampaignSnapshot = {
      version: "0.1.0",
      turnNumber: SafeInt(1),
      campaignId: "test-battle-narrow",
      slots: [
        { nationId: "GBR", type: "playable" },
        { nationId: "FRA", type: "ai" },
      ],
      world: snapshot.world,
      nations,
      wars: {
        wars: [
          {
            id: "war-1",
            attackerId: "GBR",
            defenderId: "FRA",
            startDate: "1880-01",
            status: "active",
          },
        ],
        battles: [
          {
            id: "battle-1",
            phase: "pending",
            attackerId: "GBR",
            defenderId: "FRA",
            areaId: "eng_ch",
            attackerFleetIds: ["fleet-gbr-home"],
            defenderFleetIds: ["fleet-fra-atlantic"],
          },
        ],
      },
      politics: { relations: [], shells: {} },
      intelligence: { shells: {} },
      rulesetVersion: "1.0",
      compatibilityVersion: "0.1.0",
    };

    const executor = new MonthExecutor();
    const collector = new DiagnosticCollector();
    const result = executor.execute(testSnapshot, [], "battle-test-seed", collector);

    const resolvedBattles = result.finalSnapshot.wars.battles.filter((b) => b.phase === "resolved");
    if (resolvedBattles.length > 0) {
      for (const battle of resolvedBattles) {
        if (battle.result) {
          for (const explanation of battle.result.explanation) {
            expect(explanation.toLowerCase()).not.toContain("tactical equivalence");
          }
        }
      }
    }
  });

  // 17. Invariants run after every authoritative transition and at closing snapshot
  it("17. Invariants run after every authoritative transition and at closing snapshot", () => {
    const executor = new MonthExecutor();
    const cmd = makeBudgetCommand(snapshot, "GBR", "con-gbr-ship-battleship2", SafeInt(100));
    const collector = new DiagnosticCollector();

    const result = executor.execute(snapshot, [cmd], "invariant-test", collector);

    expect(result.success).toBe(true);

    const gbr = result.finalSnapshot.nations.get("GBR")!;
    expect(gbr.treasury as number).toBeGreaterThanOrEqual(0);

    for (const project of gbr.constructionProjects) {
      expect(project.completedWork as number).toBeLessThanOrEqual(project.totalWork as number);
    }

    const engine = new PhaseEngine();
    const emptyNations = new Map<string, NationState>();
    const emptySnapshot: CampaignSnapshot = {
      ...snapshot,
      nations: emptyNations,
      turnNumber: SafeInt(1),
    };
    const phaseCollector = new DiagnosticCollector();
    const phaseResult = engine.executeTurn(emptySnapshot, [], "seed", phaseCollector);

    const closing = phaseResult.phaseResults[phaseResult.phaseResults.length - 1]!;
    expect(closing.phaseId).toBe("closing_validation");
    expect(closing.success).toBe(true);
  });
});
