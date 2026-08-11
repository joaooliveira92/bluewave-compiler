import { SafeInt } from "@bluewave/contracts";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";
import { CampaignCompiler } from "@bluewave/campaign";
import type { CampaignState, CampaignSnapshot, NationState } from "@bluewave/campaign";
import type { CommandEnvelope, BudgetProjectCommand, CommandLedger } from "@bluewave/commands";
import { SaveStore } from "@bluewave/persistence";
import { MonthExecutor, ReplayVerifier } from "@bluewave/phase-engine";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
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
  countries: `- id: "GBR"\n  name: "United Kingdom"\n  tag: "GBR"\n- id: "FRA"\n  name: "France"\n  tag: "FRA"\n`,
  areas: `- id: "lon"\n  name: "London"\n  type: "land"\n  controller: "GBR"\n- id: "par"\n  name: "Paris"\n  type: "land"\n  controller: "FRA"\n- id: "eng_ch"\n  name: "English Channel"\n  type: "sea"\n`,
  routes: `- id: "lon-par"\n  from: "lon"\n  to: "par"\n  type: "sea"\n  distance: 300\n- id: "lon-eng_ch"\n  from: "lon"\n  to: "eng_ch"\n  type: "sea"\n  distance: 50\n- id: "par-eng_ch"\n  from: "par"\n  to: "eng_ch"\n  type: "sea"\n  distance: 100\n`,
  possessions: `- id: "gbr-lon"\n  countryId: "GBR"\n  areaId: "lon"\n- id: "fra-par"\n  countryId: "FRA"\n  areaId: "par"\n`,
  ports: `- id: "port-lon"\n  name: "Port of London"\n  areaId: "lon"\n  countryId: "GBR"\n  level: 5\n- id: "port-par"\n  name: "Port of Paris"\n  areaId: "par"\n  countryId: "FRA"\n  level: 3\n`,
  technologies: `- id: "basic_steam"\n  name: "Basic Steam Turbine"\n  category: "propulsion"\n  cost: 100\n  year: 1880\n- id: "advanced_steam"\n  name: "Advanced Steam Turbine"\n  category: "propulsion"\n  prerequisites:\n    - { techId: "basic_steam" }\n  cost: 200\n  year: 1900\n`,
  fleets: `- id: "fleet-gbr-home"\n  nationId: "GBR"\n  name: "Home Fleet"\n  locationAreaId: "lon"\n  ships:\n    - id: "ship-hms-dreadnought"\n      name: "HMS Dreadnought"\n      classId: "battleship"\n      hitPoints: 100\n      maxHitPoints: 100\n      speed: 21\n      firepower: 10\n      armor: 12\n      isUnderConstruction: false\n      constructionProgress: 0\n      constructionTotalWork: 0\n    - id: "ship-hms-invincible"\n      name: "HMS Invincible"\n      classId: "battlecruiser"\n      hitPoints: 80\n      maxHitPoints: 80\n      speed: 25\n      firepower: 8\n      armor: 6\n      isUnderConstruction: false\n      constructionProgress: 0\n      constructionTotalWork: 0\n- id: "fleet-fra-atlantic"\n  nationId: "FRA"\n  name: "Atlantic Fleet"\n  locationAreaId: "par"\n  ships:\n    - id: "ship-fs-courbet"\n      name: "FS Courbet"\n      classId: "battleship"\n      hitPoints: 90\n      maxHitPoints: 90\n      speed: 20\n      firepower: 9\n      armor: 11\n      isUnderConstruction: false\n      constructionProgress: 0\n      constructionTotalWork: 0\n`,
  economies: `- nationId: "GBR"\n  treasury: 800\n  income: 150\n  expenses: 75\n- nationId: "FRA"\n  treasury: 600\n  income: 120\n  expenses: 60\n`,
  constructions: `- id: "con-gbr-ship-battleship2"\n  nationId: "GBR"\n  type: "ship"\n  targetId: "ship-hms-thunderer"\n  totalWork: 200\n  completedWork: 50\n  startedAt: "1880-01"\n`,
  diplomacy: `- nationA: "GBR"\n  nationB: "FRA"\n  relation: "neutral"\n  since: "1880-01"\n`,
  research: `- nationId: "GBR"\n  currentProjectTechId: "basic_steam"\n  technologies:\n    - { techId: "basic_steam", investedPoints: 30, completed: false }\n- nationId: "FRA"\n  technologies: []\n`,
};

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

function compileCampaign(fixtureDir: string): { state: CampaignState; contentHash: string } {
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
      },
      rulesetVersion: "1.0",
      compatibilityVersion: "1.0.0",
    },
    signal,
    collector,
  );

  if (!output || collector.hasErrors) {
    throw new Error(`Compilation failed`);
  }
  return { state: output.state, contentHash: output.contentHash };
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

function makeBudgetCommand(
  snapshot: CampaignSnapshot,
  nationId: string,
  projectId: string,
  budget: SafeInt,
): CommandEnvelope<BudgetProjectCommand> {
  const hash = sha256Hex(canonicalSerialize(snapshot));
  return {
    commandId: `cmd-${projectId}-${String(budget)}`,
    version: "0.1.0",
    expectedSnapshotHash: hash,
    idempotencyKey: `ik-${projectId}-${String(budget)}`,
    timestamp: "cross-process-test",
    body: { type: "budget_project", nationId, projectId, budget },
  };
}

function run(): void {
  const fixtureDir = resolve(
    tmpdir(),
    `bw-cp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(fixtureDir, { recursive: true });
  const saveDir = resolve(
    tmpdir(),
    `bw-cp-save-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(saveDir, { recursive: true });

  try {
    writeAllFixtureFiles(fixtureDir);

    // Step 1: Compile campaign
    const { state: campaignState, contentHash: contentArtifactHash } = compileCampaign(fixtureDir);
    const snapshot = campaignState.snapshot;
    const initialSnapshotHash = campaignState.rawHash;

    // Step 2: Execute a month
    const executor = new MonthExecutor();
    const cmd = makeBudgetCommand(snapshot, "GBR", "con-gbr-ship-battleship2", SafeInt(100));
    const collector = new DiagnosticCollector();
    const monthResult = executor.execute(snapshot, [cmd], "deterministic-seed", collector);

    const closingSnapshotHash = hashSnapshot(monthResult.finalSnapshot);
    const commandLedgerHash = monthResult.commandLedger.hash();
    const eventLedgerHash = monthResult.eventLedger.hash();
    const financialLedgerHash = monthResult.financialLedger.hash();
    const randomDecisionLedgerHash = monthResult.randomLedger.hash();

    // Step 3: Save
    const store = new SaveStore();
    const { rawHash: _rh, ...stateForSave } = campaignState;
    const saveableState: CampaignState = {
      ...campaignState,
      rawHash: sha256Hex(canonicalSerialize(stateForSave)),
    };
    store.save(saveableState, saveDir);

    // Step 4: Load
    const loadDiag = new DiagnosticCollector();
    const loaded = store.load(saveDir, loadDiag);
    if (!loaded || loadDiag.hasErrors) {
      throw new Error("Save/load failed");
    }

    // Step 5: Replay
    const replayVerifier = new ReplayVerifier();
    const replayResult = replayVerifier.verify(
      snapshot,
      [cmd],
      monthResult.commandLedger,
      closingSnapshotHash,
      "deterministic-seed",
      collector,
    );

    const replayVerificationHash = replayResult.match
      ? sha256Hex(
          canonicalSerialize({
            match: true,
            replayedFinalHash: replayResult.replayedFinalHash,
            originalFinalHash: replayResult.originalFinalHash,
            replayedCommandLedgerHash: replayResult.replayedCommandLedgerHash,
            originalCommandLedgerHash: replayResult.originalCommandLedgerHash,
          }),
        )
      : "REPLAY_MISMATCH";

    // Output all hashes as JSON
    const output = {
      contentArtifactHash,
      initialSnapshotHash,
      closingSnapshotHash,
      commandLedgerHash,
      eventLedgerHash,
      financialLedgerHash,
      randomDecisionLedgerHash,
      replayVerificationHash,
      success: monthResult.success && replayResult.match,
    };

    process.stdout.write(JSON.stringify(output) + "\n");
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
    rmSync(saveDir, { recursive: true, force: true });
  }
}

run();
